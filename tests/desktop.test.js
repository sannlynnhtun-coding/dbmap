import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextTick } from 'vue';

const storage = new Map();
globalThis.localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) };
globalThis.window = Object.assign(new EventTarget(), {
  __DBMAPS_DESKTOP__: true, location: { pathname: '/app', search: '', hash: '' },
  innerWidth: 1400, ipc: { postMessage: () => {} }, history: { replaceState: () => {} },
});
globalThis.document = { title: '', documentElement: { classList: { add() {}, remove() {} } } };
const schema = '// Original comment\nTable users {\n  id int [pk]\n}\n';
let actionResponse;
let finishSave;
globalThis.fetch = async (_, options) => {
  const body = JSON.parse(options.body);
  if (body.action === 'launch') return { json: async () => ({ name: 'example.dbml', content: schema }) };
  if (body.action === 'adopt') return { json: async () => ({}) };
  if (finishSave) await new Promise(resolve => { finishSave = resolve; });
  return { json: async () => actionResponse };
};
const { initializeDesktop, desktopAction, desktop } = await import('../src/desktop.js');
const { activeProject, state, addColumn, saveProjectsLocally } = await import('../src/stores/schemaStore.js');

test('desktop tracks layout, visual edits, failed saves, revision races and invalid opens', async () => {
  await initializeDesktop();
  assert.equal(desktop.dirty, false);
  activeProject.value.tables[0].x += 100;
  await nextTick();
  assert.equal(desktop.dirty, true);
  assert.equal(activeProject.value.customDbml, schema);
  saveProjectsLocally();
  assert.equal(state.saveStatus, 'unsaved');

  actionResponse = { error: 'Disk full' };
  await desktopAction('save');
  assert.match(desktop.error, /Disk full/);
  assert.equal(desktop.dirty, true);

  actionResponse = { name: 'example.dbml' };
  await desktopAction('save');
  assert.equal(desktop.dirty, false);
  const setItem = localStorage.setItem;
  localStorage.setItem = () => { throw new Error('Cache full'); };
  saveProjectsLocally();
  assert.equal(state.saveStatus, 'saved', 'A browser cache error cannot mark a saved disk document as failed');
  localStorage.setItem = setItem;
  addColumn(activeProject.value.tables[0].id, { name: 'email', type: 'varchar' });
  await nextTick();
  assert.match(activeProject.value.customDbml, /email varchar/);

  finishSave = true;
  const saving = desktopAction('save');
  await nextTick();
  await new Promise(resolve => setImmediate(resolve));
  activeProject.value.tables[0].x += 15;
  await nextTick();
  finishSave();
  finishSave = null;
  await saving;
  assert.equal(desktop.dirty, true, 'Edits after the saved revision stay dirty');

  const original = activeProject.value;
  actionResponse = { name: 'broken.dbml', content: 'Table broken {\n' };
  await desktopAction('open');
  assert.equal(activeProject.value, original);
  assert.ok(desktop.error);
  assert.equal(desktop.busy, false);
});
