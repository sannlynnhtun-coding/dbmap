import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorkspaceBackup, readBackupFile, prepareBackupImport, recentProjects } from '../src/utils/workspaceBackup.js';
import { createProjectBackup } from '../src/utils/projectBackup.js';

const project = (id, folderId = 'f1') => ({ id, folderId, name: id, dialect: 'postgres',
  description: 'A schema', updatedAt: '2025-01-01T00:00:00Z', tables: [{ id: 'users', name: 'users', x: 290, y: 170,
    headerColor: '#123456', columns: [{ name: 'id', type: 'integer', pk: true }] }], relationships: [],
  enums: [], tableGroups: [], customDbml: '// Keep comments', projectConfig: { note: 'Keep settings' } });
const preferences = { tableDisplayMode: 'keys', showOptionalRelationships: false, autoArrangeMode: 'hubs' };
const workspace = () => createWorkspaceBackup([project('a'), project('b', 'f2')], [{ id: 'f1', name: 'One' }, { id: 'f2', name: 'Two' }], { f1: ['a'], f2: ['b'] }, preferences);

test('workspace JSON round-trip preserves schemas, layouts, folders, order, and settings', () => {
  const backup = readBackupFile(JSON.stringify(workspace()));
  assert.equal(backup.kind, 'workspace');
  assert.deepEqual(backup.projects, workspace().projects);
  assert.deepEqual(backup.preferences, preferences);
  const existing = { projects: [project('existing')], folders: [{ id: 'existing-folder', name: 'Existing' }], projectOrder: { 'existing-folder': ['existing'] } };
  let id = 0;
  const restored = prepareBackupImport(backup, existing, () => String(++id));
  assert.equal(restored.projects.length, 3);
  assert.equal(restored.folders.length, 3);
  assert.equal(restored.projects[0], existing.projects[0]);
  assert.notEqual(restored.imported[0].id, 'a');
  assert.equal(restored.imported[0].folderId, restored.folders[1].id);
  assert.deepEqual(restored.projectOrder[restored.folders[1].id], [restored.imported[0].id]);
  assert.equal(restored.imported[0].tables[0].x, 290);
  assert.deepEqual(restored.imported[0].projectConfig, { note: 'Keep settings' });
});

test('old single-project backups remain importable and unknown ownership fields are stripped', () => {
  const input = createProjectBackup(project('single'));
  input.project.ownerUid = 'other-user';
  const backup = readBackupFile(JSON.stringify(input));
  assert.equal(backup.kind, 'project');
  assert.equal(backup.projects[0].ownerUid, undefined);
  const result = prepareBackupImport(backup, { projects: [], folders: [], projectOrder: {} });
  assert.equal(result.imported.length, 1);
  assert.equal(result.imported[0].folderId, result.folders[0].id);
});

test('invalid versions, duplicate IDs, broken projects and preferences are rejected', () => {
  assert.throws(() => readBackupFile('{'), /JSON/);
  for (const mutate of [
    input => { input.version = 99; },
    input => { input.projects.push(input.projects[0]); },
    input => { input.folders.push(input.folders[0]); },
    input => { input.projects[0].tables[0].columns = null; },
    input => { input.preferences.autoArrangeMode = 'invalid'; }
  ]) {
    const input = workspace(); mutate(input);
    assert.throws(() => readBackupFile(JSON.stringify(input)), /unsupported|invalid/);
  }
});

test('recent projects sort newest first, place unknown dates last, and hide untouched starters', () => {
  const input = [project('old'), { ...project('unknown'), updatedAt: 'bad' },
    { ...project('new'), updatedAt: '2026-11-11T00:00:00Z' },
    { ...project('starter'), isStarterProject: true, tables: [], customDbml: null }];
  assert.deepEqual(recentProjects(input).map(p => p.id), ['new', 'old', 'unknown']);
  assert.equal(input[0].id, 'old', 'Sorting must not reorder the workspace');
  input[0].isStarterProject = true;
  assert.ok(recentProjects(input).some(p => p.id === 'old'), 'An edited starter is a real project');
});

test('empty workspaces and orphan folders import safely', () => {
  assert.equal(readBackupFile(JSON.stringify(createWorkspaceBackup([], [], {}, preferences))).projects.length, 0);
  const backup = readBackupFile(JSON.stringify(workspace()));
  backup.projects[0].folderId = 'missing';
  const result = prepareBackupImport(backup, { projects: [], folders: [], projectOrder: {} });
  assert.equal(result.folders.find(f => f.id === result.imported[0].folderId).name, 'Imported projects');
});
