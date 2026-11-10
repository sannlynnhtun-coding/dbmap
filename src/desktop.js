import { nextTick, reactive, watch } from 'vue';
import { activeProject, state, addToast, normalizeProjectKeys } from './stores/schemaStore.js';
import { createDefaultBlankProject } from './utils/sampleSchemas.js';
import { generatedSchema, readDbmlDocument, writeDbmlDocument } from './utils/dbmlDocument.js';

export const isDesktop = Boolean(window.__DBMAPS_DESKTOP__);
export const desktop = reactive({ busy: false, name: 'Untitled.dbml', dirty: false, error: '' });
const sessions = new Map();
let loading = false;
const display = () => ({ tableDisplayMode: state.tableDisplayMode, showOptionalRelationships: state.showOptionalRelationships });
const snapshot = () => {
  const project = activeProject.value;
  const content = writeDbmlDocument(project, display());
  const session = sessions.get(project.id);
  return { id: project.id, name: session?.name || `${project.name || 'Untitled'}.dbml`, content,
    dirty: content !== session?.saved, forceSaveAs: Boolean(session?.warning) };
};

async function request(action, extra = {}) {
  const response = await fetch('/__native', { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...extra }) });
  const result = await response.json();
  if (result.error) throw new Error(result.error);
  return result;
}

function publish() {
  if (loading || !activeProject.value) return;
  try {
    const current = snapshot();
    desktop.name = current.name;
    desktop.dirty = current.dirty;
    state.saveStatus = current.dirty ? 'unsaved' : 'saved';
    document.title = `${current.dirty ? '* ' : ''}${current.name} — DBMaps`;
    window.ipc.postMessage(JSON.stringify(current));
  } catch (error) {
    desktop.error = error.message;
    state.saveStatus = 'error';
  }
}

async function adopt(result) {
  const decoded = readDbmlDocument(result.content);
  const previousId = activeProject.value?.id;
  loading = true;
  const project = { ...createDefaultBlankProject(), ...decoded.project, id: crypto.randomUUID(),
    name: result.name.replace(/\.dbml$/i, ''), isStarterProject: false };
  normalizeProjectKeys(project);
  await request('adopt', { id: project.id, replaceId: previousId });
  state.projects = [...state.projects.filter(item => item.id !== previousId), project];
  state.activeProjectId = project.id;
  Object.assign(state, decoded.display);
  state.currentRoute = '/app';
  sessions.set(project.id, { name: result.name, saved: writeDbmlDocument(project, display()), warning: decoded.warning });
  sessions.delete(previousId);
  await nextTick();
  loading = false;
  publish();
  if (decoded.warning) addToast('Layout warning', decoded.warning, 'warning');
}

export async function desktopAction(action) {
  if (desktop.busy) return;
  desktop.busy = true;
  desktop.error = '';
  try {
    await nextTick();
    const current = snapshot();
    const result = await request(action, { snapshot: current });
    if (result.cancelled) return;
    if (action === 'save' || action === 'saveAs') {
      sessions.set(current.id, { name: result.name, saved: current.content, warning: '' });
      state.lastSavedAt = new Date().toISOString();
      publish();
    } else {
      await adopt(result);
    }
  } catch (error) {
    desktop.error = error.message;
    addToast('File operation failed', error.message, 'error');
  } finally {
    loading = false;
    desktop.busy = false;
  }
}

export async function initializeDesktop() {
  if (!isDesktop) return;
  try {
    const result = await request('launch');
    await adopt(result);
  } catch (error) {
    loading = false;
    desktop.error = error.message;
    addToast('Cannot open file', error.message, 'error');
  }
  // A post-flush watcher sees a whole editor transaction, rather than partial table mutations.
  let lastId;
  let lastText;
  let lastModel;
  watch(() => [activeProject.value, display()], () => {
    if (loading) return;
    const project = activeProject.value;
    const model = generatedSchema(project);
    if (project.id === lastId && project.customDbml === lastText && model !== lastModel) {
      // Visual schema edits use the existing generator; layout-only edits retain raw text.
      project.customDbml = model;
    }
    lastId = project.id;
    lastText = project.customDbml;
    lastModel = model;
    publish();
  }, { deep: true, immediate: true, flush: 'post' });
  window.addEventListener('dbmaps-save', () => void desktopAction('save'));
  window.addEventListener('keydown', event => {
    if (!(event.ctrlKey || event.metaKey)) return;
    const key = event.key.toLowerCase();
    const action = key === 's' ? (event.shiftKey ? 'saveAs' : 'save') : key === 'o' ? 'open' : key === 'n' ? 'new' : null;
    if (!action) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    void desktopAction(action);
  }, true);
}
