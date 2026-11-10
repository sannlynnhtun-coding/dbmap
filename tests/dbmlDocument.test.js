import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readDbmlDocument, writeDbmlDocument, matchPreviousTable } from '../src/utils/dbmlDocument.js';
import { createProjectBackup, readProjectBackup } from '../src/utils/projectBackup.js';

const schema = '// Keep this comment\nTable public.users {\n  id int [pk]\n}\n\nTable audit.users {\n  id int [pk]\n}\n';
const display = { tableDisplayMode: 'keys', showOptionalRelationships: false };

test('example resolves qualified relationship endpoints', () => {
  const { project } = readDbmlDocument(readFileSync(new URL('../docs/example.dbml', import.meta.url), 'utf8'));
  assert.equal(project.relationships[0].fromTable, 'public.posts');
  assert.equal(project.relationships[0].toTable, 'public.users');
  assert.equal(project.tables[1].columns.find(column => column.name === 'user_id').isFk, true);
});

test('schema-qualified identities, positions and display survive round-trip without rewriting schema', () => {
  const { project } = readDbmlDocument(schema);
  assert.deepEqual(project.tables.map(table => table.name), ['public.users', 'audit.users']);
  project.tables[0].x = -125.5;
  project.tables[1].y = 987;
  const text = writeDbmlDocument(project, display);
  const decoded = readDbmlDocument(text);
  assert.equal(decoded.project.customDbml, schema);
  assert.equal(decoded.project.tables[0].x, -125.5);
  assert.equal(decoded.project.tables[1].y, 987);
  assert.deepEqual(decoded.display, display);
  assert.equal(writeDbmlDocument(decoded.project, display), text);
});

test('malformed, duplicate and future metadata keep schema and warn', () => {
  for (const prefix of ['// dbmaps-layout: nope\n', '// dbmaps-layout: {"version":2}\n', '// dbmaps-layout: {}\n// dbmaps-layout: {}\n']) {
    const decoded = readDbmlDocument(prefix + schema);
    assert.ok(decoded.warning);
    assert.equal(decoded.project.tables.length, 2);
    assert.equal(decoded.project.customDbml, schema);
  }
});

test('metadata cannot replace schema fields and invalid coordinates warn', () => {
  const layout = { version: 1, display: { ...display, projects: [] }, tables: { 'public.users': { x: 0, y: 0, name: 'injected', columns: [] } } };
  const decoded = readDbmlDocument(`// dbmaps-layout: ${JSON.stringify(layout)}\n${schema}`);
  assert.equal(decoded.project.tables[0].name, 'public.users');
  assert.equal(decoded.project.tables[0].columns.length, 1);
  assert.deepEqual(decoded.display, display);
  layout.tables['public.users'].x = null;
  assert.ok(readDbmlDocument(`// dbmaps-layout: ${JSON.stringify(layout)}\n${schema}`).warning);
});

test('layout-looking text inside a note is retained', () => {
  const text = "Table users {\n  id int\n  Note: '''\n// dbmaps-layout: example text\n  '''\n}\n";
  const { project } = readDbmlDocument(text);
  assert.equal(readDbmlDocument(writeDbmlDocument(project, display)).project.customDbml, text);
});

test('reject malformed schema; allow a blank new document', () => {
  assert.throws(() => readDbmlDocument('Table users {\n id int\n'));
  assert.throws(() => readDbmlDocument('not DBML'));
  assert.equal(readDbmlDocument('').project.tables.length, 0);
});

test('rename retains the unique matching table position, ambiguous matches are ignored', () => {
  const previous = { name: 'users', columns: [{ name: 'id', type: 'int' }], x: 20, y: 30 };
  const renamed = { ...previous, name: 'accounts' };
  assert.equal(matchPreviousTable(renamed, [previous], [renamed]), previous);
  assert.equal(matchPreviousTable(renamed, [previous, { ...previous, name: 'other' }], [renamed]), undefined);
});

test('existing full-project backup remains readable', () => {
  const { project } = readDbmlDocument(schema);
  project.name = 'Example';
  const backup = createProjectBackup(project);
  assert.deepEqual(readProjectBackup(JSON.stringify(backup)), backup.project);
});
