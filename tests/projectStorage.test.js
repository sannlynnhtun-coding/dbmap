import { test } from 'node:test';
import assert from 'node:assert/strict';
import { IDBFactory, IDBObjectStore } from 'fake-indexeddb';
import { createProjectStorage, validateLegacyStorage } from '../src/utils/projectStorage.js';

const snapshot = () => ({
  projects: [{ id: 'project-a', name: 'Original', dialect: 'postgres',
    tables: [{ id: 'users', name: 'users', x: 213, y: 487, headerColor: '#155dfb', columns: [{ name: 'id', type: 'integer' }] }],
    relationships: [], enums: [], tableGroups: [], customDbml: '// Preserve comments',
    projectConfig: { database_type: 'PostgreSQL', note: 'Keep this setting' } }],
  workspace: { folders: [{ id: 'folder-1', name: 'Schemas' }], projectOrder: { 'folder-1': ['project-a'] },
    deletedIds: ['deleted-a'], tableDisplayMode: 'keys', showOptionalRelationships: false, autoArrangeMode: 'hubs' }
});

test('migration keeps complete projects and settings; reopening never reruns it', async () => {
  const factory = new IDBFactory();
  const storage = createProjectStorage(factory);
  const original = snapshot();
  const loaded = await storage.initialize(() => original);
  assert.deepEqual(loaded.projects, original.projects);
  assert.equal(loaded.workspace.migrationVersion, 1);
  assert.equal(loaded.workspace.tableDisplayMode, 'keys');
  storage.close();
  const reopened = createProjectStorage(factory);
  const again = await reopened.initialize(() => { throw Error('Legacy data must not be read again'); });
  assert.deepEqual(again.projects, original.projects);
  assert.deepEqual(again.workspace.projectOrder, original.workspace.projectOrder);
  reopened.close();
});

test('queued writes capture revisions, preserve project order, and persist deletion', async () => {
  const factory = new IDBFactory();
  const storage = createProjectStorage(factory);
  await storage.initialize(snapshot);
  const next = snapshot();
  next.projects[0].name = 'First edit';
  const first = storage.save(next);
  next.projects[0].name = 'Latest edit';
  next.projects[0].tables[0].x = 900;
  const second = storage.save(next);
  await Promise.all([first, second]);
  storage.close();
  const reopened = createProjectStorage(factory);
  const saved = await reopened.initialize(snapshot);
  assert.equal(saved.projects[0].name, 'Latest edit');
  assert.equal(saved.projects[0].tables[0].x, 900);
  saved.projects = [];
  saved.workspace.deletedIds.push('project-a');
  await reopened.save(saved);
  reopened.close();
  const afterDelete = createProjectStorage(factory);
  const deleted = await afterDelete.initialize(snapshot);
  assert.deepEqual(deleted.projects, []);
  assert.ok(deleted.workspace.deletedIds.includes('project-a'));
  afterDelete.close();
});

test('a stale tab cannot overwrite another tab; failed queues remain usable', async () => {
  const factory = new IDBFactory();
  const first = createProjectStorage(factory);
  const second = createProjectStorage(factory);
  await first.initialize(snapshot);
  await second.initialize(snapshot);
  const updated = snapshot();
  updated.projects[0].name = 'Saved in first tab';
  await first.save(updated);
  await assert.rejects(second.save(snapshot()), /another tab/);
  await assert.rejects(second.save(snapshot()), /another tab/);
  first.close(); second.close();
  const reopened = createProjectStorage(factory);
  assert.equal((await reopened.initialize(snapshot)).projects[0].name, 'Saved in first tab');
  reopened.close();
});

test('aborted writes roll back the project and workspace together and permit retry', async () => {
  const factory = new IDBFactory();
  const storage = createProjectStorage(factory);
  await storage.initialize(snapshot);
  const changed = snapshot();
  changed.projects[0].name = 'Should roll back';
  changed.workspace.folders[0].name = 'Also roll back';
  const put = IDBObjectStore.prototype.put;
  IDBObjectStore.prototype.put = function (...args) {
    if (this.name === 'workspace') throw new DOMException('Quota full', 'QuotaExceededError');
    return put.apply(this, args);
  };
  try { await assert.rejects(storage.save(changed), /Quota full/); }
  finally { IDBObjectStore.prototype.put = put; }
  const observer = createProjectStorage(factory);
  const unchanged = await observer.initialize(snapshot);
  assert.deepEqual(unchanged.projects, snapshot().projects);
  assert.equal(unchanged.workspace.folders[0].name, 'Schemas');
  observer.close();
  await storage.save(changed);
  storage.close();
});

test('malformed migration aborts without marking complete; corrected data can retry', async () => {
  const factory = new IDBFactory();
  const invalid = createProjectStorage(factory);
  await assert.rejects(invalid.initialize(() => ({ projects: null })), /invalid/);
  const valid = createProjectStorage(factory);
  assert.equal((await valid.initialize(snapshot)).projects.length, 1);
  valid.close();
  assert.throws(() => validateLegacyStorage({ getItem: key => key === 'dbmaps_guest_projects' ? '{bad JSON' : null }), /Cannot migrate/);
});

test('unsupported IndexedDB fails explicitly without calling migration', async () => {
  const storage = createProjectStorage(null);
  await assert.rejects(storage.initialize(() => { throw Error('Must not read legacy'); }), /unavailable/);
});
