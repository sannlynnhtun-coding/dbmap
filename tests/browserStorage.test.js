import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextTick } from 'vue';
import { IDBFactory, IDBObjectStore } from 'fake-indexeddb';
import { createProjectStorage } from '../src/utils/projectStorage.js';
import { createProjectBackup, readProjectBackup } from '../src/utils/projectBackup.js';
import { readBackupFile } from '../src/utils/workspaceBackup.js';

const original = { id: 'local-project', localOnly: true, name: 'Migrated project', folderId: 'folder-1', dialect: 'postgres',
  tables: [{ id: 'users', name: 'users', x: 218, y: 450, columns: [{ id: 'id', name: 'id', type: 'integer', pk: true }] }],
  relationships: [], enums: [], tableGroups: [], customDbml: '// Keep my text', projectConfig: { note: 'Important setting' } };
const legacy = new Map([
  ['dbmaps_guest_projects', JSON.stringify([original])],
  ['dbmaps_folders_guest', JSON.stringify([{ id: 'folder-1', name: 'My database' }])],
  ['dbmaps_project_order_guest', JSON.stringify({ 'folder-1': [original.id] })]
]);
globalThis.indexedDB = new IDBFactory();
globalThis.localStorage = { getItem: key => legacy.get(key) ?? null, setItem: (key, value) => legacy.set(key, value) };
globalThis.window = Object.assign(new EventTarget(), {
  location: { pathname: '/app', search: '', hash: '' }, innerWidth: 1400, history: { replaceState() {} }
});

globalThis.document = { documentElement: { classList: { add() {}, remove() {} } } };
const store = await import('../src/stores/schemaStore.js');

test('Vue store migrates, awaits backup persistence, and reports failed saves without altering legacy data', async () => {
  await store.initializeProjectStorage();
  await nextTick();
  assert.equal(store.activeProject.value.name, original.name);
  const backup = readProjectBackup(JSON.stringify(createProjectBackup(store.activeProject.value)));
  const restored = await store.restoreLocalProject(backup);
  assert.notEqual(restored.id, original.id);
  restored.tables[0].x = 777;
  restored.projectConfig.note = 'Updated project setting';
  store.state.tableDisplayMode = 'keys';
  store.state.showOptionalRelationships = false;
  const saving = store.flushActiveProjectSync();
  assert.equal(store.state.saveStatus, 'saving');
  assert.equal(await saving, true);
  assert.equal(store.state.saveStatus, 'saved');
  const observer = createProjectStorage();
  const saved = await observer.initialize(() => { throw Error('Must not migrate again'); });
  observer.close();
  const roundTrip = saved.projects.find(p => p.id === restored.id);
  assert.equal(roundTrip.tables[0].x, 777);
  assert.equal(roundTrip.projectConfig.note, 'Updated project setting');
  assert.equal(roundTrip.customDbml, original.customDbml);
  assert.equal(saved.workspace.tableDisplayMode, 'keys');
  assert.equal(saved.workspace.showOptionalRelationships, false);
  assert.equal(legacy.get('dbmaps_guest_projects'), JSON.stringify([original]));

  const put = IDBObjectStore.prototype.put;
  IDBObjectStore.prototype.put = function () { throw new DOMException('Storage full', 'QuotaExceededError'); };
  const count = store.state.projects.length;
  try {
    await assert.rejects(store.restoreLocalProject(backup), /Storage full/);
    assert.equal(store.state.projects.length, count, 'A failed backup import must not appear successful');
    assert.equal(store.state.saveStatus, 'error');
  } finally { IDBObjectStore.prototype.put = put; }
  assert.equal(await store.saveProjectsLocally(), true);
  assert.equal(store.state.saveStatus, 'saved');
});

test('start navigation preserves save times; workspace import appends copies atomically', async () => {
  const current = store.activeProject.value;
  await store.flushActiveProjectSync();
  const savedTime = current.updatedAt;
  await store.openStartPage();
  assert.equal(store.state.showStartPage, true);
  store.selectProject(current.id);
  await store.flushActiveProjectSync();
  assert.equal(store.state.showStartPage, false);
  assert.equal(current.updatedAt, savedTime, 'Opening a project must not change its save time');
  window.location.search = '?schema=missing';
  store.loadLocalProjectFromUrl();
  assert.equal(store.state.showStartPage, true);
  assert.match(store.state.startPageMessage, /not available/);
  window.location.search = '';
  const backup = readBackupFile(JSON.stringify(store.exportWorkspaceBackup()));
  const before = store.state.projects.length;
  const imported = await store.restoreBackupFile(backup);
  assert.equal(store.state.projects.length, before + backup.projects.length);
  assert.equal(new Set(store.state.projects.map(p => p.id)).size, store.state.projects.length);
  assert.equal(imported[0].tables[0].x, backup.projects[0].tables[0].x);
  const put = IDBObjectStore.prototype.put;
  IDBObjectStore.prototype.put = function () { throw new DOMException('Storage full', 'QuotaExceededError'); };
  const count = store.state.projects.length;
  try {
    await assert.rejects(store.restoreBackupFile(backup), /Storage full/);
    assert.equal(store.state.projects.length, count);
  } finally { IDBObjectStore.prototype.put = put; }
});
