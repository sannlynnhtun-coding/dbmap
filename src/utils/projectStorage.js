const clone = value => JSON.parse(JSON.stringify(value));
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const validProject = project => record(project) && typeof project.id === 'string' && typeof project.name === 'string'
  && Array.isArray(project.tables) && project.tables.every(table => record(table) && typeof table.name === 'string'
    && Array.isArray(table.columns) && table.columns.every(column => record(column) && typeof column.name === 'string' && typeof column.type === 'string'))
  && Array.isArray(project.relationships) && project.relationships.every(record);

function completed(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = resolve;
    transaction.onabort = () => reject(transaction.error || new Error('The storage transaction was aborted.'));
    transaction.onerror = () => {}; // onabort reports failures after the transaction rolls back.
  });
}

function read(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function validateSnapshot({ projects, workspace }) {
  if (!Array.isArray(projects) || !workspace || !Array.isArray(workspace.folders)
      || !record(workspace.projectOrder) || !Object.values(workspace.projectOrder).every(ids => Array.isArray(ids) && ids.every(id => typeof id === 'string'))
      || !Array.isArray(workspace.deletedIds)
      || !workspace.deletedIds.every(id => typeof id === 'string')
      || !workspace.folders.every(folder => folder && typeof folder.id === 'string' && typeof folder.name === 'string')
      || !projects.every(validProject)
      || new Set(projects.map(project => project.id)).size !== projects.length) {
    throw new Error('Stored workspace data is invalid. Your existing browser data has been kept.');
  }
}

// Validate the legacy source before using the store's normalized migration snapshot.
export function validateLegacyStorage(storage) {
  for (const [key, isValid] of [
    ['dbmaps_guest_projects', value => Array.isArray(value) && value.every(validProject) && new Set(value.map(p => p.id)).size === value.length],
    ['dbmaps_deleted_project_ids', value => Array.isArray(value) && value.every(id => typeof id === 'string')],
    ...['dbmaps_folders_guest', 'dbmaps_folders_latest'].map(key => [key, value => Array.isArray(value) && value.every(f => f && typeof f.id === 'string' && typeof f.name === 'string')]),
    ...['dbmaps_project_order_guest', 'dbmaps_project_order_latest'].map(key => [key, value => value && typeof value === 'object' && !Array.isArray(value)])
  ]) {
    const raw = storage.getItem(key);
    if (raw === null) continue;
    try {
      if (!isValid(JSON.parse(raw))) throw new Error('Invalid shape');
    } catch {
      throw new Error(`Cannot migrate ${key}: its data is invalid. The original has been kept.`);
    }
  }
}

export function createProjectStorage(factory = globalThis.indexedDB, name = 'dbmaps') {
  let database;
  let revision;
  let baseline = new Map();
  let queue = Promise.resolve();

  function open() {
    return new Promise((resolve, reject) => {
      if (!factory) return reject(new Error('IndexedDB is unavailable in this browser.'));
      const request = factory.open(name, 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore('projects', { keyPath: 'id' });
        request.result.createObjectStore('workspace');
      };
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('Close other DBMaps tabs and reload to finish updating storage.'));
      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => db.close();
        resolve(db);
      };
    });
  }

  async function initialize(legacySnapshot) {
    database = await open();
    const transaction = database.transaction(['projects', 'workspace'], 'readwrite');
    const done = completed(transaction);
    const store = transaction.objectStore('workspace');
    const metaRequest = store.get('main');
    let validationError;
    metaRequest.onsuccess = () => {
      if (metaRequest.result) return;
      try {
        const snapshot = legacySnapshot();
        validateSnapshot(snapshot);
        snapshot.projects.forEach(project => transaction.objectStore('projects').put(clone(project)));
        store.put({ ...clone(snapshot.workspace), projectIds: snapshot.projects.map(p => p.id), revision: 0, migrationVersion: 1 }, 'main');
      } catch (error) {
        validationError = error;
        transaction.abort();
      }
    };
    try { await done; } catch (error) { database.close(); throw validationError || error; }

    const loading = database.transaction(['projects', 'workspace'], 'readonly');
    const loaded = completed(loading);
    const [projects, workspace] = await Promise.all([
      read(loading.objectStore('projects').getAll()), read(loading.objectStore('workspace').get('main'))
    ]);
    await loaded;
    validateSnapshot({ projects, workspace });
    revision = workspace.revision;
    baseline = new Map(projects.map(project => [project.id, JSON.stringify(project)]));
    const order = workspace.projectIds || [];
    projects.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
    return { projects, workspace };
  }

  function save(snapshot) {
    // Capture at the call boundary: subsequent Vue mutations belong to the next save.
    const captured = clone(snapshot);
    validateSnapshot(captured);
    const operation = queue.then(async () => {
      if (!database || revision === undefined) throw new Error('Browser storage is not ready.');
      const transaction = database.transaction(['projects', 'workspace'], 'readwrite');
      const done = completed(transaction);
      const meta = transaction.objectStore('workspace');
      const request = meta.get('main');
      const next = new Map(captured.projects.map(project => [project.id, JSON.stringify(project)]));
      let failure;
      request.onsuccess = () => {
        try {
          if (request.result?.revision !== revision) {
            throw new Error('This workspace changed in another tab. Export your unsaved project, then reload before saving.');
          }
          const projects = transaction.objectStore('projects');
          for (const project of captured.projects) {
            if (baseline.get(project.id) !== next.get(project.id)) projects.put(project);
          }
          for (const id of baseline.keys()) {
            if (!next.has(id)) projects.delete(id);
          }
          meta.put({ ...captured.workspace, projectIds: captured.projects.map(p => p.id), revision: revision + 1, migrationVersion: 1 }, 'main');
        } catch (error) {
          failure = error;
          transaction.abort();
        }
      };
      try { await done; } catch (error) { throw failure || error; }
      baseline = next;
      revision++;
    });
    queue = operation.catch(() => {});
    return operation;
  }

  return { initialize, save, close: () => database?.close() };
}
