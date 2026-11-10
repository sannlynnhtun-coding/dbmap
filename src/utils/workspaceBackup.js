import { createProjectBackup, readProjectBackup } from './projectBackup.js';

const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const validDate = value => typeof value === 'string' && Number.isFinite(Date.parse(value));

export function createWorkspaceBackup(projects, folders, projectOrder, preferences) {
  return JSON.parse(JSON.stringify({
    format: 'dbmap-workspace', version: 1, exportedAt: new Date().toISOString(),
    folders: folders.map(({ id, name }) => ({ id, name })),
    projectOrder,
    preferences,
    projects: projects.map(project => ({ ...createProjectBackup(project).project,
      id: project.id, folderId: project.folderId,
      ...(validDate(project.updatedAt) ? { updatedAt: project.updatedAt } : {}) }))
  }));
}

export function readBackupFile(content) {
  let backup;
  try { backup = JSON.parse(content); }
  catch { throw new Error('This file does not contain valid JSON.'); }
  if (backup?.format === 'dbmap-project') {
    return { kind: 'project', projects: [readProjectBackup(content)], folders: [], projectOrder: {}, preferences: {} };
  }
  if (backup?.format !== 'dbmap-workspace' || backup.version !== 1) {
    throw new Error('This backup format or version is unsupported.');
  }
  const { folders, projects, projectOrder, preferences } = backup;
  if (!Array.isArray(folders) || !folders.every(f => record(f) && typeof f.id === 'string' && f.id && typeof f.name === 'string')
      || new Set(folders.map(f => f.id)).size !== folders.length
      || !Array.isArray(projects) || !projects.every(p => record(p) && typeof p.id === 'string' && p.id && typeof p.folderId === 'string')
      || new Set(projects.map(p => p.id)).size !== projects.length
      || !record(projectOrder) || !Object.values(projectOrder).every(ids => Array.isArray(ids) && ids.every(id => typeof id === 'string'))
      || !record(preferences)
      || !['all', 'keys', 'tables'].includes(preferences.tableDisplayMode)
      || typeof preferences.showOptionalRelationships !== 'boolean'
      || !['flow', 'hubs'].includes(preferences.autoArrangeMode)) {
    throw new Error('This workspace backup contains invalid data.');
  }
  const cleaned = projects.map(project => ({
    ...readProjectBackup(JSON.stringify({ format: 'dbmap-project', version: 1, project })),
    id: project.id, folderId: project.folderId,
    ...(validDate(project.updatedAt) ? { updatedAt: project.updatedAt } : {})
  }));
  return { kind: 'workspace', projects: cleaned, folders: folders.map(({ id, name }) => ({ id, name })), projectOrder, preferences };
}

export function prepareBackupImport(backup, existing, makeId = () => crypto.randomUUID()) {
  const folders = [...existing.folders];
  const folderMap = new Map();
  for (const folder of backup.folders) {
    const id = 'folder-' + makeId();
    folderMap.set(folder.id, id);
    folders.push({ id, name: folder.name });
  }
  let fallback;
  const fallbackFolder = () => {
    if (fallback) return fallback;
    if (backup.kind === 'project' && folders.length) return (fallback = folders[0].id);
    fallback = 'folder-' + makeId();
    folders.push({ id: fallback, name: 'Imported projects' });
    return fallback;
  };
  const projectMap = new Map();
  const imported = backup.projects.map(project => {
    const id = 'proj-' + makeId();
    projectMap.set(project.id, id);
    return { ...project, id, folderId: folderMap.get(project.folderId) || fallbackFolder(),
      localOnly: true, ownerUid: 'guest', accessMode: 'public', sharePassword: '', allowedEmails: [], history: [],
      updatedAt: project.updatedAt || new Date().toISOString() };
  });
  const projectOrder = { ...existing.projectOrder };
  for (const [oldFolder, newFolder] of folderMap) {
    const ids = Object.hasOwn(backup.projectOrder, oldFolder) ? backup.projectOrder[oldFolder] : [];
    projectOrder[newFolder] = ids.map(id => projectMap.get(id)).filter(id => imported.some(p => p.id === id && p.folderId === newFolder));
  }
  return { projects: [...existing.projects, ...imported], folders, projectOrder, imported,
    preferences: backup.kind === 'workspace' ? backup.preferences : {} };
}

export function recentProjects(projects) {
  return projects.filter(p => !p.isStarterProject || p.tables?.length || p.relationships?.length || p.enums?.length || p.tableGroups?.length || p.customDbml?.trim()).slice().sort((a, b) => {
    const time = project => validDate(project.updatedAt) ? Date.parse(project.updatedAt) : -Infinity;
    const left = time(a), right = time(b);
    return left === right ? a.name.localeCompare(b.name) : right - left;
  });
}

export function downloadJsonBackup(backup, filename) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
