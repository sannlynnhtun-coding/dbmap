import { reactive, computed, watch, ref } from 'vue';
import { SAMPLE_PROJECTS, INITIAL_FOLDERS, createDefaultBlankProject } from '../utils/sampleSchemas.js';
import { generateDBML, parseDBML, exportToSQL, extractCleanNote, updateTableHeaderColorInDBML } from '../utils/dbmlParser.js';
import { parseSQLSchema } from '../utils/sqlImporter.js';
import { MARKETPLACE_TEMPLATES } from '../utils/marketplaceTemplates.js';
import {
  auth,
  googleProvider,
  db,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  handleFirestoreError
} from '../firebase.js';

// Load stored theme safely
const storedDark = typeof localStorage !== 'undefined' ? localStorage.getItem('db_schema_dark') : null;
const isDarkInitial = storedDark !== null ? storedDark === 'true' : false;

// Clean vector SVG avatar illustrating a guest developer (neutral circular backdrop with Lucide user silhouette)
export const DEFAULT_GUEST_AVATAR = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' fill='none'><rect width='32' height='32' rx='16' fill='%23f1f5f9'/><g transform='translate(4, 4)'><path d='M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><circle cx='12' cy='7' r='4' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></g></svg>`;

// --- Deletion & Folder Persistence Helpers ---
const DELETED_PROJECTS_KEY = 'dbmaps_deleted_project_ids';

export function getDeletedProjectIds() {
  try {
    const raw = localStorage.getItem(DELETED_PROJECTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function recordDeletedProjectId(id) {
  if (!id) return;
  try {
    const ids = getDeletedProjectIds();
    if (!ids.includes(id)) {
      ids.push(id);
      if (ids.length > 300) ids.shift();
      localStorage.setItem(DELETED_PROJECTS_KEY, JSON.stringify(ids));
    }
  } catch (e) {}
}

export function isProjectDeleted(id) {
  if (!id) return false;
  return getDeletedProjectIds().includes(id);
}

let isStateInitialized = false;

const FOLDERS_STORAGE_KEY_PREFIX = 'dbmaps_folders_';

export function getFoldersStorageKey() {
  const uid = (isStateInitialized && state.currentUser?.isLoggedIn && auth.currentUser) ? auth.currentUser.uid : 'guest';
  return FOLDERS_STORAGE_KEY_PREFIX + uid;
}

export function loadInitialFolders() {
  try {
    const key = FOLDERS_STORAGE_KEY_PREFIX + 'guest';
    const local = localStorage.getItem(key) || localStorage.getItem('dbmaps_folders_latest');
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {}
  return [...INITIAL_FOLDERS];
}

export function getProjectOrderStorageKey() {
  const uid = (isStateInitialized && state.currentUser?.isLoggedIn && auth.currentUser)
    ? auth.currentUser.uid
    : 'guest';
  return `dbmaps_project_order_${uid}`;
}

export function loadInitialProjectOrder() {
  try {
    const raw = typeof localStorage !== 'undefined'
      ? (localStorage.getItem('dbmaps_project_order_guest') || localStorage.getItem('dbmaps_project_order_latest'))
      : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch (e) {}
  return {};
}

export function saveProjectsOrderToStorage() {
  try {
    const key = getProjectOrderStorageKey();
    const data = JSON.stringify(state.projectOrder || {});
    localStorage.setItem(key, data);
    localStorage.setItem('dbmaps_project_order_latest', data);
  } catch (e) {}

  if (state.currentUser?.isLoggedIn && auth.currentUser) {
    try {
      const uid = auth.currentUser.uid;
      setDoc(doc(db, 'user_settings', uid), {
        projectOrder: JSON.parse(JSON.stringify(state.projectOrder || {})),
        updatedAt: new Date().toISOString()
      }, { merge: true }).catch(err => {
        console.warn('Sync projectOrder to Firestore note:', err.message);
      });
    } catch (e) {}
  }
}

export async function loadProjectsOrderFromStorage() {
  const key = getProjectOrderStorageKey();
  try {
    const local = localStorage.getItem(key) || localStorage.getItem('dbmaps_project_order_latest');
    if (local) {
      const parsed = JSON.parse(local);
      if (parsed && typeof parsed === 'object') {
        state.projectOrder = parsed;
      }
    }
  } catch (e) {}

  if (state.currentUser?.isLoggedIn && auth.currentUser) {
    try {
      const uid = auth.currentUser.uid;
      const snap = await getDoc(doc(db, 'user_settings', uid));
      if (snap.exists()) {
        const data = snap.data();
        if (data?.projectOrder && typeof data.projectOrder === 'object') {
          state.projectOrder = data.projectOrder;
          try {
            localStorage.setItem(key, JSON.stringify(data.projectOrder));
            localStorage.setItem('dbmaps_project_order_latest', JSON.stringify(data.projectOrder));
          } catch (e) {}
        }
      }
    } catch (e) {}
  }
}

export function getSortedProjectsInFolder(folderId, projectsList = null, orderMap = null) {
  const allProjects = projectsList || (isStateInitialized ? state.projects : []);
  const list = allProjects.filter(p => p.folderId === folderId);
  const activeOrderMap = orderMap || (isStateInitialized ? state.projectOrder : null) || loadInitialProjectOrder();
  const orderList = activeOrderMap && activeOrderMap[folderId];
  if (Array.isArray(orderList) && orderList.length > 0) {
    list.sort((a, b) => {
      const idxA = orderList.indexOf(a.id);
      const idxB = orderList.indexOf(b.id);
      const posA = idxA === -1 ? 9999 : idxA;
      const posB = idxB === -1 ? 9999 : idxB;
      return posA - posB;
    });
  }
  return list;
}

export function saveFoldersToStorage() {
  try {
    const key = getFoldersStorageKey();
    const data = JSON.stringify(state.folders);
    localStorage.setItem(key, data);
    localStorage.setItem('dbmaps_folders_latest', data);
  } catch (e) {}

  if (state.currentUser?.isLoggedIn && auth.currentUser) {
    try {
      const uid = auth.currentUser.uid;
      setDoc(doc(db, 'user_settings', uid), {
        folders: JSON.parse(JSON.stringify(state.folders)),
        projectOrder: JSON.parse(JSON.stringify(state.projectOrder || {})),
        updatedAt: new Date().toISOString()
      }, { merge: true }).catch(err => {
        console.warn('Sync folders to Firestore note:', err.message);
      });
    } catch (e) {}
  }
}

export async function loadFoldersFromStorage() {
  const key = getFoldersStorageKey();
  try {
    const local = localStorage.getItem(key) || localStorage.getItem('dbmaps_folders_latest');
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) {
        state.folders = parsed;
      }
    }
  } catch (e) {}

  if (state.currentUser?.isLoggedIn && auth.currentUser) {
    try {
      const uid = auth.currentUser.uid;
      const snap = await getDoc(doc(db, 'user_settings', uid));
      if (snap.exists()) {
        const data = snap.data();
        if (Array.isArray(data?.folders) && data.folders.length > 0) {
          state.folders = data.folders;
          try {
            localStorage.setItem(key, JSON.stringify(data.folders));
          } catch (e) {}
        }
        if (data?.projectOrder && typeof data.projectOrder === 'object') {
          state.projectOrder = data.projectOrder;
          try {
            const pKey = getProjectOrderStorageKey();
            localStorage.setItem(pKey, JSON.stringify(data.projectOrder));
            localStorage.setItem('dbmaps_project_order_latest', JSON.stringify(data.projectOrder));
          } catch (e) {}
        }
      }
    } catch (e) {}
  }

  // Ensure default active schema matches top-most database on direct load
  if (typeof window !== 'undefined') {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const explicitUrlSchema = urlParams.get('schema') || urlParams.get('project') || urlParams.get('room') || urlParams.get('id') || urlParams.get('share');
      if (!explicitUrlSchema && state.folders.length > 0) {
        if (!state.activeProjectId || !state.projects.some(p => p.id === state.activeProjectId)) {
          const topFolderId = state.folders[0]?.id;
          const sortedInTopFolder = getSortedProjectsInFolder(topFolderId);
          const topDatabaseProj = sortedInTopFolder[0];
          if (topDatabaseProj && state.activeProjectId !== topDatabaseProj.id) {
            state.activeProjectId = topDatabaseProj.id;
            state.roomCode = topDatabaseProj.id;
          }
        }
      }
    } catch (e) {}
  }
}

export function saveGuestProjectsToStorage() {
  try {
    const data = JSON.stringify(state.projects);
    localStorage.setItem('dbmaps_guest_projects', data);
    if (state.currentUser?.isLoggedIn && auth.currentUser) {
      localStorage.setItem(`dbmaps_user_projects_${auth.currentUser.uid}`, data);
    }
  } catch (e) {}
}

export function isUntouchedBlankStarter(projectData) {
  if (!projectData) return false;
  // If user has added tables, enums, table groups, relationships, or custom DBML code, it is NOT untouched!
  if (projectData.tables && projectData.tables.length > 0) return false;
  if (projectData.enums && projectData.enums.length > 0) return false;
  if (projectData.tableGroups && projectData.tableGroups.length > 0) return false;
  if (projectData.relationships && projectData.relationships.length > 0) return false;
  if (projectData.customDbml && projectData.customDbml.trim().length > 0) return false;

  if (projectData.isStarterProject) return true;
  if (projectData.id && String(projectData.id).startsWith('starter-blank-')) return true;
  if ((projectData.name === 'New Database' || projectData.name === 'AdonisJS & App Database') && (!projectData.tables || projectData.tables.length === 0)) return true;
  return false;
}

// Helper to identify built-in static sample templates (e.g. proj-1, proj-2, sample-ecommerce)
export function isSampleProjectId(id) {
  if (!id) return false;
  return id === 'proj-1' || id === 'proj-2' || id === 'sample-ecommerce' || id === 'sample-saas' || String(id).startsWith('sample-template-') || SAMPLE_PROJECTS.some(s => s.id === id);
}

// Initial clean blank starter project for new users
const initialBlankProject = createDefaultBlankProject();
initialBlankProject.isStarterProject = true;

export function loadInitialProjects() {
  try {
    const raw = localStorage.getItem('dbmaps_guest_projects');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const deletedIds = getDeletedProjectIds();
        const valid = parsed.filter(p => !deletedIds.includes(p.id));
        if (valid.length > 0) {
          return valid.map(p => {
            const proj = {
              ...p,
              enums: p.enums || [],
              tableGroups: p.tableGroups || [],
              projectConfig: p.projectConfig || null,
              customDbml: p.customDbml || null
            };
            normalizeProjectKeys(proj);
            return proj;
          });
        }
      }
    }
  } catch (e) {}
  return [initialBlankProject];
}

export function getInitialActiveProjectId(projectsList = [], foldersList = [], orderMap = null) {
  if (typeof window !== 'undefined') {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      let schemaId = urlParams.get('schema') || urlParams.get('project') || urlParams.get('room') || urlParams.get('id') || urlParams.get('share');
      if (!schemaId && window.location.hash) {
        const hashStr = window.location.hash.replace(/^#/, '');
        const hashParams = new URLSearchParams(hashStr.includes('=') ? hashStr : `schema=${hashStr}`);
        schemaId = hashParams.get('schema') || hashParams.get('project') || hashParams.get('room') || hashParams.get('id') || hashParams.get('share') || hashStr;
      }
      if (schemaId) {
        const cleanId = schemaId.replace(/^ERD-/, '').trim();
        if (cleanId) return cleanId;
      }
    } catch (e) {}
  }

  // When opening app directly (no explicit ?schema= query param):
  // The first schema belonging to the top-most database is open as default!
  const folders = (foldersList && foldersList.length > 0)
    ? foldersList
    : (isStateInitialized && state.folders ? state.folders : loadInitialFolders());

  const activeOrder = orderMap || (isStateInitialized ? state.projectOrder : null) || loadInitialProjectOrder();

  if (folders && folders.length > 0) {
    for (const folder of folders) {
      const sorted = getSortedProjectsInFolder(folder.id, projectsList, activeOrder);
      if (sorted.length > 0) return sorted[0].id;
    }
  }

  return projectsList[0]?.id || initialBlankProject.id;
}

export function normalizeTableKeys(tables = [], relationships = []) {
  if (!Array.isArray(tables)) return tables;

  const matchesTable = (relTbl, targetTbl) => {
    if (!relTbl || !targetTbl) return false;
    const r = relTbl.toLowerCase().replace(/["'`]/g, '').trim();
    const t = targetTbl.toLowerCase().replace(/["'`]/g, '').trim();
    return r === t || r.endsWith('.' + t) || t.endsWith('.' + r);
  };

  const matchesCol = (relCol, targetCol) => {
    if (!relCol || !targetCol) return false;
    const r = relCol.toLowerCase().replace(/["'`]/g, '').trim();
    const c = targetCol.toLowerCase().replace(/["'`]/g, '').trim();
    return r === c;
  };

  tables.forEach(table => {
    if (!table || !Array.isArray(table.columns)) return;

    table.columns.forEach(col => {
      // 1. Primary key normalization (strictly recognize stored legacy pk/fk or isPk/isFk; NEVER guess from column name or auto-mark 'id')
      const isPk = Boolean(col.isPk ?? col.pk ?? col.primaryKey);
      col.isPk = isPk;
      col.pk = isPk;

      // 2. Foreign key normalization
      let isFk = Boolean(col.isFk ?? col.fk ?? col.foreignKey);

      // Consistently set foreign-key flags from valid relationship endpoints, including when Gemini omits fk flag
      if (!isFk && Array.isArray(relationships) && relationships.length > 0) {
        const hasRel = relationships.some(r => {
          if (!r || !r.fromTable || !r.fromColumn) return false;
          return matchesTable(r.fromTable, table.name) && matchesCol(r.fromColumn, col.name);
        });
        if (hasRel) {
          isFk = true;
        }
      }
      col.isFk = isFk;
      col.fk = isFk;

      // 3. Nullability & Uniqueness & Note preservation
      if (isPk) {
        col.isNull = false;
        col.notNull = true;
        col.isUnique = true;
        col.unique = true;
      } else {
        if (col.isNull === undefined) {
          col.isNull = col.notNull !== undefined ? !col.notNull : true;
        }
        col.notNull = !col.isNull;
        const isUnique = Boolean(col.isUnique ?? col.unique);
        col.isUnique = isUnique;
        col.unique = isUnique;
      }

      if (col.note === undefined) {
        col.note = col.comment || '';
      }
    });
  });

  return tables;
}

export function normalizeProjectKeys(project) {
  if (!project || !Array.isArray(project.tables)) return project;
  normalizeTableKeys(project.tables, project.relationships || []);
  return project;
}

export function computeProjectHash(proj) {
  if (!proj) return '';
  return JSON.stringify({
    id: proj.id || '',
    folderId: proj.folderId || 'folder-1',
    name: proj.name || '',
    description: proj.description || '',
    dialect: proj.dialect || 'postgres',
    accessMode: proj.accessMode || 'public',
    sharePassword: proj.sharePassword || '',
    allowedEmails: Array.isArray(proj.allowedEmails) ? proj.allowedEmails.slice().sort() : [],
    tables: (proj.tables || []).map(t => ({
      id: t.id,
      name: t.name,
      headerColor: t.headerColor || '',
      x: Math.round(t.x || 0),
      y: Math.round(t.y || 0),
      columns: (t.columns || []).map(c => ({
        id: c.id,
        name: c.name,
        type: c.type,
        isPk: Boolean(c.isPk || c.pk),
        isFk: Boolean(c.isFk || c.fk),
        isUnique: Boolean(c.isUnique || c.unique),
        isNull: c.isNull !== undefined ? !!c.isNull : (c.notNull !== undefined ? !c.notNull : !Boolean(c.isPk || c.pk)),
        note: c.note || ''
      }))
    })),
    relationships: (proj.relationships || []).map(r => ({
      id: r.id,
      fromTable: r.fromTable,
      fromColumn: r.fromColumn,
      toTable: r.toTable,
      toColumn: r.toColumn,
      cardinality: r.cardinality || r.type || '1:n'
    })),
    enums: proj.enums || [],
    tableGroups: proj.tableGroups || [],
    projectConfig: proj.projectConfig || null,
    customDbml: proj.customDbml || null
  });
}

const initialFolders = loadInitialFolders();
const initialProjects = loadInitialProjects();
const initialProjectOrder = loadInitialProjectOrder();
const initialActiveId = getInitialActiveProjectId(initialProjects, initialFolders, initialProjectOrder);

export const state = reactive({
  isDarkMode: isDarkInitial,
  isSidebarCollapsed: typeof window === 'undefined' || window.innerWidth < 1280,
  activeTab: 'tables', // 'explorer' | 'tables' | 'relationships' | 'history' | 'settings'
  viewMode: 'split', // 'split' | 'canvas' | 'editor'
  editorWidth: 420, // width in pixels for split view editor pane
  
  folders: initialFolders,
  get databases() {
    return this.folders;
  },
  set databases(val) {
    this.folders = val;
  },
  projects: initialProjects,
  activeProjectId: initialActiveId,
  projectOrder: initialProjectOrder,
  
  // Live saving process state: 'saved' | 'saving' | 'unsaved' | 'error'
  saveStatus: 'saved',
  lastSavedAt: new Date().toISOString(),
  saveErrorMessage: null,
  
  zoomLevel: 1.0,
  panOffset: { x: 0, y: 0 },
  
  selectedTableId: null,
  selectedRelId: null,
  tableDisplayMode: (typeof localStorage !== 'undefined' && localStorage.getItem('dbmaps_table_display_mode')) || 'all', // 'all' | 'tables' | 'keys'
  showOptionalRelationships: (typeof localStorage !== 'undefined' && localStorage.getItem('dbmaps_show_optional_relationships') !== null)
    ? localStorage.getItem('dbmaps_show_optional_relationships') === 'true'
    : true,
  autoArrangeMode: (typeof localStorage !== 'undefined' && localStorage.getItem('dbmaps_auto_arrange_mode')) || 'flow', // 'flow' | 'hubs'
  
  // Realtime collaboration state
  roomCode: initialActiveId,
  isCollaborating: true,
  collaborators: [
    {
      id: 'local-user',
      name: 'You (Host)',
      email: 'developer@dbmaps.io',
      color: '#3b82f6',
      avatar: DEFAULT_GUEST_AVATAR,
      role: 'Owner',
      activeTab: 'canvas',
      cursor: null,
      lastSeen: Date.now()
    }
  ],
  
  // User Authentication State
  isLoggingIn: false,
  currentUser: {
    id: 'guest',
    name: 'Guest Developer',
    email: '',
    avatar: DEFAULT_GUEST_AVATAR,
    isLoggedIn: false,
    provider: null
  },

  // User Tier & Credit Accounting State
  userProfile: {
    tier: 'free',
    role: 'user',
    creditsRemaining: 50000,
    monthlyCreditAllowance: 50000,
    creditsUsedTotal: 0,
    maxPromptLength: 3000,
    hasCompletedTour: false,
    lastResetDate: new Date().toISOString()
  },

  // First-Time User Guided Walkthrough State
  tour: {
    active: false,
    step: 0,
    totalSteps: 8
  },

  // System Configurations
  systemConfig: {
    aiModel: 'gemini-3.8-flash',
    freeTierMonthlyCredits: 50000,
    proTierMonthlyCredits: 1000000,
    freeMaxPromptLength: 3000,
    proMaxPromptLength: 20000,
    tallySaleInvoiceUrl: 'https://api.tallysale.com',
    enableUpgradeCredits: true
  },
  
  // UI Modals
  exportTab: 'diagram', // 'diagram' | 'script'
  modals: {
    export: false,
    importSchema: false,
    share: false,
    auth: false,
    version: false,
    newTable: false,
    newRel: false,
    newProject: false,
    newFolder: false,
    docs: false,
    aiGen: false,
    billing: false,
    adminDashboard: false,
    marketplace: false,
    submitToMarketplace: false
  },

  // Auth prompt context for onboarding (e.g. 'ai_presto')
  authModalPromptReason: null,

  // Marketplace Submissions & Templates
  marketplaceSubmissions: [],
  isMarketplaceLoading: false,
  editingMarketplaceTemplate: null,

  // Real-time Collaboration Access Restrictions & Password Protection
  collaborationAccessRestricted: {
    active: false,
    schemaId: null,
    schemaName: '',
    ownerEmail: '',
    userEmail: '',
    reason: null, // 'login_required' | 'unauthorized' | 'password_required'
    expectedPassword: '',
    pendingProjectData: null
  },

  unlockedPasswordProjects: [],

  // Cloud Firestore Status / Enablement Notice Banner
  firestoreErrorNotice: null,

  // Initial App & Schema Loading State for UX Smoothness
  isInitialLoading: true,
  initialLoadingStage: 'Initializing database workspace...',
  initialLoadingProgress: 25,

  // Client Routing (/ = Landing/Home, /app = Studio, /privacy-policy, /terms-of-service, /learn-dbml)
  currentRoute: typeof window !== 'undefined'
    ? (() => {
        const path = window.location.pathname || '/';
        const urlParams = new URLSearchParams(window.location.search);
        const hasSchemaParam = urlParams.get('schema') || urlParams.get('project') || urlParams.get('room') || urlParams.get('id') || urlParams.get('share');
        const hash = window.location.hash || '';
        const hasSchemaHash = hash.includes('schema=') || hash.startsWith('#proj-') || hash.startsWith('#ERD-');
        if (
          path.startsWith('/app') ||
          path.startsWith('/studio') ||
          path.startsWith('/workspace') ||
          path.startsWith('/editor') ||
          hasSchemaParam ||
          hasSchemaHash ||
          urlParams.get('app') === '1' ||
          urlParams.get('studio') === '1' ||
          hash === '#studio' ||
          hash === '#app'
        ) {
          return '/app';
        }
        if (path === '/privacy-policy' || path === '/terms-of-service') {
          return path;
        }
        if (path === '/learn-dbml' || path === '/learn' || path === '/dbml' || urlParams.get('learn') === 'dbml') {
          return '/learn-dbml';
        }
        if (path === '/marketplace' || path === '/templates' || urlParams.get('marketplace') === '1' || urlParams.get('templates') === '1') {
          return '/marketplace';
        }
        return '/';
      })()
    : '/',

  toasts: []
});

isStateInitialized = true;

export const isAuthResolved = ref(false);
export const isFirestoreProjectsLoaded = ref(false);

export function isStudioDataReady() {
  if (!isAuthResolved.value) return false;
  if (state.currentUser.isLoggedIn && !isFirestoreProjectsLoaded.value) return false;
  const currentProj = state.projects.find(p => p.id === state.activeProjectId) || state.projects[0];
  if (!currentProj) return false;
  return true;
}

export function waitForStudioDataReady(timeoutMs = 6000) {
  if (isStudioDataReady()) {
    return Promise.resolve(true);
  }
  return new Promise((resolve) => {
    let resolved = false;
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve(false);
      }
    }, timeoutMs);

    const unwatch = watch(
      () => isStudioDataReady(),
      (ready) => {
        if (ready && !resolved) {
          resolved = true;
          clearTimeout(timer);
          unwatch();
          resolve(true);
        }
      },
      { immediate: true }
    );
  });
}

export function startStudioLoading(stage = 'Connecting to database workspace...', progress = 35) {
  state.isInitialLoading = true;
  state.initialLoadingProgress = progress;
  state.initialLoadingStage = stage;
}

export function finishStudioLoading(delay = 250) {
  state.initialLoadingProgress = 100;
  state.initialLoadingStage = 'Ready!';
  setTimeout(() => {
    state.isInitialLoading = false;
  }, delay);
}

export function finishInitialLoading(delay = 300) {
  state.initialLoadingProgress = 100;
  state.initialLoadingStage = 'Ready!';
  setTimeout(() => {
    state.isInitialLoading = false;
  }, delay);
}

export async function navigateTo(path) {
  const isTargetingStudio = 
    path.startsWith('/app') || 
    path.startsWith('/studio') || 
    path.startsWith('/workspace') || 
    path.startsWith('/editor');

  const isCurrentlyInStudio = 
    state.currentRoute.startsWith('/app') || 
    state.currentRoute.startsWith('/studio') || 
    state.currentRoute.startsWith('/workspace') || 
    state.currentRoute.startsWith('/editor');

  if (isTargetingStudio && !isCurrentlyInStudio) {
    // Show the loading screen immediately when entering Studio
    startStudioLoading('Preparing database workspace...', 35);
  }

  state.currentRoute = path;
  if (typeof window !== 'undefined') {
    window.history.pushState(null, '', path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (isTargetingStudio && !isCurrentlyInStudio) {
    state.initialLoadingProgress = 65;
    state.initialLoadingStage = 'Loading tables & schema models...';

    // Wait until all tables and Firestore data are fully loaded into memory
    await waitForStudioDataReady(5000);

    state.initialLoadingProgress = 90;
    state.initialLoadingStage = 'Rendering canvas & editor...';

    // Brief settling delay so the canvas SVG nodes and editor buffer mount cleanly before overlay fades
    await new Promise(r => setTimeout(r, 220));

    finishStudioLoading(250);
  }
}

// Helper to detect when Cloud Firestore API is pending enablement in GCP, offline, or cancelled
export function isFirestoreApiDisabledOrOffline(err) {
  if (!err) return false;
  const msg = (err.message || String(err)).toLowerCase();
  return (
    msg.includes('cloud firestore api has not been used') ||
    msg.includes('is disabled') ||
    msg.includes('client is offline') ||
    msg.includes('failed to get document because the client is offline') ||
    msg.includes('offline') ||
    msg.includes('cancelled') ||
    msg.includes('call cancelled') ||
    err.code === 'cancelled' ||
    err.code === 'unavailable'
  );
}

// Clean any leftover or bogus CONSTRAINT columns from table schemas
export function sanitizeTableColumns(tables) {
  if (!Array.isArray(tables)) return false;
  let modified = false;

  for (const table of tables) {
    if (!Array.isArray(table.columns)) continue;

    const bogusConstraints = table.columns.filter(c =>
      c.name && c.name.trim().toUpperCase() === 'CONSTRAINT'
    );

    if (bogusConstraints.length > 0) {
      modified = true;
      for (const bogus of bogusConstraints) {
        const typeStr = (bogus.type || '').toLowerCase();
        // If type contains 'pkey' or 'pk', ensure 'id' or matching column is PK
        if (typeStr.includes('pkey') || typeStr.includes('_pk')) {
          const idCol = table.columns.find(c => c.name.toLowerCase() === 'id' || (c.name.toLowerCase() !== 'constraint' && typeStr.includes(c.name.toLowerCase())));
          if (idCol) {
            idCol.isPk = true;
            idCol.isNull = false;
          }
        }
        // If type contains 'uuid' or 'unique' or 'uq', ensure matching column is unique
        if (typeStr.includes('unique') || typeStr.includes('_uq') || typeStr.includes('uuid')) {
          const uqCol = table.columns.find(c => c.name.toLowerCase() !== 'constraint' && (typeStr.includes(c.name.toLowerCase()) || c.name.toLowerCase() === 'uuid'));
          if (uqCol) {
            uqCol.isUnique = true;
          }
        }
      }

      // Filter out all bogus CONSTRAINT columns
      table.columns = table.columns.filter(c =>
        !c.name || c.name.trim().toUpperCase() !== 'CONSTRAINT'
      );
    }
  }

  return modified;
}

// Helper to identify default, starter, sample, or public open schemas
export function isDefaultOrPublicProject(projectData) {
  if (!projectData) return true;
  const mode = projectData.accessMode;
  if (mode === 'restricted' || mode === 'password') return false;
  if (mode === 'public') return true;
  // Sample schemas are always public open schemas
  if (projectData.id && (String(projectData.id).startsWith('sample-') || ['ecommerce', 'saas', 'social', 'blog'].includes(projectData.id))) return true;
  // Starter blank demo project
  if (projectData.name === 'New Database' && (!projectData.ownerUid || projectData.ownerUid === 'guest')) return true;
  if (projectData.id === 'proj-public-demo') return true;
  // Any unauthenticated guest project without explicit restricted whitelist
  if ((!projectData.ownerUid || projectData.ownerUid === 'guest') && mode !== 'restricted' && mode !== 'password') return true;
  return false;
}

// Get Active Project
export const activeProject = computed(() => {
  let proj = state.projects.find(p => p.id === state.activeProjectId);
  if (!proj && state.projects.length > 0) {
    proj = state.projects[0];
  }
  if (proj) {
    if (!proj.history) proj.history = [];
    if (!proj.dialect) proj.dialect = 'postgres';
    if (!proj.tables) proj.tables = [];
    if (!proj.relationships) proj.relationships = [];
    // Only set default access mode if completely unspecified
    if (!proj.accessMode) {
      proj.accessMode = (proj.ownerUid && proj.ownerUid !== 'guest') ? 'restricted' : 'public';
    }
    if (!proj.sharePassword) proj.sharePassword = '';
    if (!proj.allowedEmails) proj.allowedEmails = [];

    // Sanitize columns purely in memory without triggering side-effect saves
    sanitizeTableColumns(proj.tables);
  }
  return proj;
});

// Option to enable or disable "Upgrade & AI Credits" feature
export const isUpgradeCreditsEnabled = computed(() => {
  // Check client-side Vite environment variables (supports UPGRADE, UPDATE, AI_CREDITS variations)
  const rawEnv = (import.meta.env.VITE_ENABLE_UPGRADE_CREDITS ??
                  import.meta.env.ENABLE_UPGRADE_CREDITS ??
                  import.meta.env.VITE_ENABLE_UPDATE_CREDITS ??
                  import.meta.env.ENABLE_UPDATE_CREDITS ??
                  import.meta.env.VITE_ENABLE_AI_CREDITS ??
                  import.meta.env.ENABLE_AI_CREDITS);

  if (rawEnv !== undefined && rawEnv !== '') {
    const valStr = String(rawEnv).toLowerCase().trim();
    return valStr === 'true' || valStr === '1' || valStr === 'yes' || valStr === 'on';
  }

  // Check server-synced system configuration
  if (state.systemConfig && state.systemConfig.enableUpgradeCredits !== undefined) {
    return Boolean(state.systemConfig.enableUpgradeCredits);
  }

  return true;
});

// Helper to retrieve Firebase ID token authorization header for authenticated requests
export async function getAuthHeaders(extraHeaders = {}) {
  const headers = { 'Content-Type': 'application/json', ...extraHeaders };
  if (auth && auth.currentUser) {
    try {
      let token = null;
      try {
        token = await auth.currentUser.getIdToken();
      } catch (tokenErr) {
        if (tokenErr?.message?.includes('Database is closing') || tokenErr?.message?.includes('closing/hidden')) {
          await new Promise(r => setTimeout(r, 400));
          token = await auth.currentUser.getIdToken(true);
        } else {
          throw tokenErr;
        }
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn('Failed to retrieve Firebase ID token:', e.message);
    }
  }
  return headers;
}

// Fetch User Profile with Tier & Credits from Server
export async function fetchUserProfile() {
  try {
    const userId = state.currentUser.id || 'guest';
    const email = state.currentUser.email || '';
    const name = state.currentUser.name || '';

    const headers = await getAuthHeaders();
    const res = await fetch(`/api/user-profile?userId=${encodeURIComponent(userId)}&email=${encodeURIComponent(email)}&displayName=${encodeURIComponent(name)}`, {
      headers
    });
    const data = await res.json();
    if (data.success) {
      if (data.profile) {
        state.userProfile = { ...state.userProfile, ...data.profile };
        if (state.currentUser.isLoggedIn) {
          checkFirstTimeUserTour(state.currentUser);
        }
      }
      if (data.sysConfig) {
        state.systemConfig = { ...state.systemConfig, ...data.sysConfig };
      }
    }
  } catch (err) {
    console.warn('Failed to fetch user profile:', err.message);
  }
}

// Guided Product Tour Management
export function startTour(stepIndex = 0) {
  // Ensure workspace elements are visible for tour spotlights
  state.isSidebarCollapsed = false;
  state.viewMode = 'split';
  // Dismiss any overlapping modals
  Object.keys(state.modals).forEach(k => {
    state.modals[k] = false;
  });

  state.tour.step = Math.max(0, stepIndex);
  state.tour.active = true;
}

export function nextTourStep() {
  if (state.tour.step < state.tour.totalSteps - 1) {
    state.tour.step++;
  } else {
    finishTour(true);
  }
}

export function prevTourStep() {
  if (state.tour.step > 0) {
    state.tour.step--;
  }
}

export function skipTour() {
  finishTour(false);
}

export async function finishTour(isComplete = true) {
  state.tour.active = false;
  state.userProfile.hasCompletedTour = true;

  const uid = state.currentUser?.id || 'guest';
  try {
    localStorage.setItem(`dbmaps_tour_completed_${uid}`, 'true');
  } catch (e) {}

  if (uid && uid !== 'guest') {
    try {
      const headers = await getAuthHeaders();
      await fetch('/api/user-profile/complete-tour', {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: uid })
      });
    } catch (e) {
      console.warn('Failed to save tour completion status to server:', e.message);
    }
  }

  if (isComplete) {
    addToast('Tour Completed! 🎉', 'You are ready to architect databases. Launch the walkthrough anytime from your profile.', 'success');
  } else {
    addToast('Tour Dismissed', 'You can restart the interactive walkthrough anytime from your user menu.', 'info');
  }
}

// Automatically initiate guided tour for first-time logged-in user
export function checkFirstTimeUserTour(user) {
  if (!user || !user.isLoggedIn || user.id === 'guest') return;

  const storageKey = `dbmaps_tour_completed_${user.id}`;
  let isLocallyCompleted = false;
  try {
    isLocallyCompleted = localStorage.getItem(storageKey) === 'true';
  } catch (e) {}

  const isProfileCompleted = state.userProfile?.hasCompletedTour === true;

  if (!isLocallyCompleted && !isProfileCompleted && !state.tour.active) {
    setTimeout(() => {
      // Re-verify that tour has not been started yet
      if (!state.tour.active && !state.userProfile.hasCompletedTour) {
        startTour(0);
      }
    }, 800);
  }
}

// Session-based unlock cache for password-protected collaboration rooms
export function isProjectPasswordUnlocked(projectId) {
  if (!projectId) return false;
  if (state.unlockedPasswordProjects && state.unlockedPasswordProjects.includes(projectId)) {
    return true;
  }
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      return window.sessionStorage.getItem(`collab_pwd_unlocked_${projectId}`) === 'true';
    }
  } catch (e) {}
  return false;
}

export function unlockProjectPassword(projectId, password) {
  const targetProject = state.projects.find(p => p.id === projectId) || state.collaborationAccessRestricted.pendingProjectData;
  const expected = state.collaborationAccessRestricted.expectedPassword || targetProject?.sharePassword;
  
  if (!expected || String(password).trim() === String(expected).trim()) {
    if (!state.unlockedPasswordProjects) {
      state.unlockedPasswordProjects = [];
    }
    if (!state.unlockedPasswordProjects.includes(projectId)) {
      state.unlockedPasswordProjects.push(projectId);
    }
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem(`collab_pwd_unlocked_${projectId}`, 'true');
      }
    } catch (e) {}
    
    // If pending project data was stored when accessed via URL, merge into projects
    if (state.collaborationAccessRestricted.pendingProjectData) {
      const p = state.collaborationAccessRestricted.pendingProjectData;
      const existingIdx = state.projects.findIndex(item => item.id === p.id);
      if (existingIdx >= 0) {
        state.projects[existingIdx] = p;
      } else {
        state.projects.push(p);
      }
    }

    state.collaborationAccessRestricted.active = false;
    state.collaborationAccessRestricted.reason = null;
    state.collaborationAccessRestricted.pendingProjectData = null;
    
    selectProject(projectId);
    addToast('Password Verified', 'Unlocked password-protected collaboration room', 'success');
    return { success: true };
  }

  return { success: false, error: 'Incorrect password. Please verify with the project owner.' };
}

// Access Control Checker for Realtime Collaboration
export function checkProjectAccess(projectData, user = state.currentUser) {
  if (!projectData) return { allowed: true, mode: 'public' };

  // Default, starter, sample, or public schemas are 100% open to everyone without sign-in
  if (isDefaultOrPublicProject(projectData)) {
    return { allowed: true, mode: 'public' };
  }

  const mode = projectData.accessMode || 'public';
  if (mode === 'public') {
    return { allowed: true, mode: 'public' };
  }

  const userEmail = (user?.email || auth.currentUser?.email || '').trim().toLowerCase();
  const userUid = (auth.currentUser?.uid || (user?.id !== 'guest' ? user?.id : '') || '').trim();
  const ownerUid = (projectData.ownerUid || '').trim();
  const ownerEmail = (projectData.ownerEmail || '').trim().toLowerCase();

  // If user is the project owner
  if (userUid && ownerUid && ownerUid !== 'guest' && userUid === ownerUid) {
    return { allowed: true, isOwner: true, mode };
  }
  if (userEmail && ownerEmail && userEmail === ownerEmail) {
    return { allowed: true, isOwner: true, mode };
  }

  // Password protected mode: anyone with the password can access
  if (mode === 'password') {
    // If no password set yet, allow access
    if (!projectData.sharePassword) {
      return { allowed: true, mode: 'password' };
    }
    // Check if session has unlocked it
    if (isProjectPasswordUnlocked(projectData.id)) {
      return { allowed: true, mode: 'password', isUnlocked: true };
    }
    return {
      allowed: false,
      reason: 'password_required',
      mode: 'password',
      schemaId: projectData.id,
      schemaName: projectData.name || 'Password Protected Schema',
      ownerEmail: projectData.ownerEmail || 'the schema owner',
      expectedPassword: projectData.sharePassword
    };
  }

  // Account-restricted mode: check authentication first
  // A guest or unauthenticated visitor can NEVER access a restricted project
  const isLoggedIn = Boolean(
    (user && user.isLoggedIn && user.id && user.id !== 'guest') ||
    (auth.currentUser && !auth.currentUser.isAnonymous)
  );

  if (!isLoggedIn) {
    return {
      allowed: false,
      reason: 'login_required',
      mode: 'restricted',
      ownerEmail: projectData.ownerEmail || 'the schema owner'
    };
  }

  // Check if current user email is in the allowed whitelist
  const allowedList = (projectData.allowedEmails || []).map(e => String(e).trim().toLowerCase());
  if (userEmail && allowedList.includes(userEmail)) {
    return { allowed: true, isCollaborator: true, mode: 'restricted' };
  }

  return {
    allowed: false,
    reason: 'unauthorized',
    mode: 'restricted',
    userEmail: userEmail || 'your account',
    ownerEmail: projectData.ownerEmail || 'the schema owner'
  };
}

// Ensure active project is switched to a safe accessible schema if current one is restricted
export function ensureSafeActiveProject(restrictedId) {
  if (state.activeProjectId !== restrictedId) return;

  // Find another project that the user has permission to access
  const safeProj = state.projects.find(p => p.id !== restrictedId && checkProjectAccess(p).allowed);
  if (safeProj) {
    state.activeProjectId = safeProj.id;
    state.roomCode = safeProj.id;
    state.selectedTableId = null;
    state.selectedRelId = null;
  } else {
    // If all existing local schemas are restricted, provide a clean public sandbox project
    const defaultPublic = {
      id: 'proj-public-demo',
      folderId: 'folder-1',
      name: 'Public Demo Schema',
      description: 'Public sandbox database schema',
      dialect: 'postgres',
      accessMode: 'public',
      sharePassword: '',
      allowedEmails: [],
      tables: [],
      relationships: [],
      history: [],
      ownerUid: 'guest',
      ownerEmail: '',
      updatedAt: new Date().toISOString()
    };
    state.projects.push(defaultPublic);
    state.activeProjectId = defaultPublic.id;
    state.roomCode = defaultPublic.id;
    state.selectedTableId = null;
    state.selectedRelId = null;
  }
}

// Toggle between 'public', 'password', and 'restricted'
export function setProjectAccessMode(mode, password = '') {
  const proj = activeProject.value;
  if (!proj) return;
  proj.accessMode = (mode === 'restricted' || mode === 'password') ? mode : 'public';
  if (password) {
    proj.sharePassword = password;
  }
  if (!proj.allowedEmails) proj.allowedEmails = [];
  proj.updatedAt = new Date().toISOString();
  syncActiveProjectToFirestore();
  addToast(
    'Collaboration Access Updated',
    proj.accessMode === 'restricted'
      ? 'Set to Account Restricted (only authorized emails can join)'
      : proj.accessMode === 'password'
        ? 'Set to Password Protected (anyone with link and password can join)'
        : 'Set to Public Open (anyone with link can collaborate)',
    'success'
  );
}

// Update the share password directly
export function setProjectSharePassword(password) {
  const proj = activeProject.value;
  if (!proj) return;
  proj.sharePassword = password;
  proj.updatedAt = new Date().toISOString();
  syncActiveProjectToFirestore();
  addToast('Password Updated', 'Collaboration room password saved', 'success');
}

// Add an allowed email to the current project
export function addAllowedCollaboratorEmail(email) {
  const proj = activeProject.value;
  if (!proj) return false;
  if (!proj.allowedEmails) proj.allowedEmails = [];
  
  const cleanEmail = (email || '').trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!cleanEmail || !emailRegex.test(cleanEmail)) {
    addToast('Invalid Email', 'Please enter a valid email address (e.g. colleague@company.com)', 'warning');
    return false;
  }

  if (cleanEmail === (proj.ownerEmail || '').toLowerCase()) {
    addToast('Owner Account', 'The schema owner account is already authorized by default', 'info');
    return false;
  }

  if (proj.allowedEmails.some(e => e.toLowerCase() === cleanEmail)) {
    addToast('Already Added', `${cleanEmail} is already in the authorized list`, 'info');
    return false;
  }

  proj.allowedEmails.push(cleanEmail);
  proj.updatedAt = new Date().toISOString();
  syncActiveProjectToFirestore();
  addToast('Collaborator Added', `Added ${cleanEmail} to authorized collaboration accounts`, 'success');
  return true;
}

// Remove an allowed email from the current project
export function removeAllowedCollaboratorEmail(email) {
  const proj = activeProject.value;
  if (!proj || !proj.allowedEmails) return;
  const cleanEmail = (email || '').trim().toLowerCase();
  proj.allowedEmails = proj.allowedEmails.filter(e => e.toLowerCase() !== cleanEmail);
  proj.updatedAt = new Date().toISOString();
  syncActiveProjectToFirestore();
  addToast('Collaborator Removed', `Removed ${cleanEmail} from authorized list`, 'info');
}

// Dismiss the access restricted prompt
export function dismissAccessRestrictedModal() {
  const restrictedId = state.collaborationAccessRestricted.schemaId;
  state.collaborationAccessRestricted.active = false;
  if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
    const cleanUrl = window.location.pathname;
    window.history.replaceState(null, '', cleanUrl);
  }
  if (restrictedId) {
    ensureSafeActiveProject(restrictedId);
  }
}

// Scoped syncing flags to prevent project cross-talk across multiple windows/tabs
const activeSyncingProjectIds = new Set();
export function isProjectSyncingFromRemote(projectId) {
  return activeSyncingProjectIds.has(projectId);
}
export function markProjectSyncingFromRemote(projectId, duration = 400) {
  if (!projectId) return;
  activeSyncingProjectIds.add(projectId);
  setTimeout(() => {
    activeSyncingProjectIds.delete(projectId);
  }, duration);
}

// Backward compatibility export
export const isSyncingFromRemote = false;
let isFirestoreQuotaExceeded = false;
const lastSyncedHashes = {};

export async function syncActiveProjectToFirestore(targetProjectId = null) {
  const projectIdToSync = targetProjectId || state.activeProjectId;
  if (!projectIdToSync || isFirestoreQuotaExceeded) return;

  const proj = state.projects.find(p => p.id === projectIdToSync);
  if (!proj || isProjectSyncingFromRemote(proj.id)) return;
  
  // Never sync a deleted project or an untouched blank starter
  if (isProjectDeleted(proj.id) || isUntouchedBlankStarter(proj)) {
    return;
  }

  // Guard static sample templates: proj-1 and proj-2 must never overwrite Firestore under static IDs
  if (isSampleProjectId(proj.id)) {
    if (state.currentUser.isLoggedIn && auth.currentUser) {
      const matchingSample = SAMPLE_PROJECTS.find(s => s.id === proj.id);
      const isUntouchedSample = matchingSample && computeProjectHash(matchingSample) === computeProjectHash(proj);
      if (isUntouchedSample) {
        state.saveStatus = 'saved';
        return;
      }
      // User modified a sample project while logged in: fork to a unique user project ID so they own it cleanly in cloud!
      const oldId = proj.id;
      const newId = `proj-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
      proj.id = newId;
      proj.ownerUid = auth.currentUser.uid;
      proj.ownerEmail = state.currentUser.email || auth.currentUser.email || '';
      if (state.activeProjectId === oldId) {
        state.activeProjectId = newId;
        state.roomCode = newId;
      }
    } else {
      // Guest developer: save locally to localStorage only, do not attempt Firestore write
      saveGuestProjectsToStorage();
      state.saveStatus = 'saved';
      return;
    }
  }
  
  state.saveStatus = 'saving';
  state.saveErrorMessage = null;

  // Only claim ownership if this project has no owner yet or was a guest project
  const hasExistingOwner = proj.ownerUid && proj.ownerUid !== 'guest';
  if (state.currentUser.isLoggedIn && auth.currentUser && !hasExistingOwner) {
    proj.ownerUid = auth.currentUser.uid;
    proj.ownerEmail = state.currentUser.email || auth.currentUser.email || '';
  }

  const effectiveOwnerUid = proj.ownerUid || (auth.currentUser ? auth.currentUser.uid : 'guest');
  const effectiveOwnerEmail = proj.ownerEmail || (state.currentUser.email || '');

  const payload = {
    id: proj.id,
    folderId: proj.folderId || 'folder-1',
    name: proj.name,
    description: proj.description || '',
    dialect: proj.dialect || 'postgres',
    accessMode: proj.accessMode || (effectiveOwnerUid !== 'guest' ? 'restricted' : 'public'),
    sharePassword: proj.sharePassword || '',
    allowedEmails: Array.isArray(proj.allowedEmails) ? JSON.parse(JSON.stringify(proj.allowedEmails)) : [],
    tables: JSON.parse(JSON.stringify(proj.tables || [])),
    relationships: JSON.parse(JSON.stringify(proj.relationships || [])),
    enums: JSON.parse(JSON.stringify(proj.enums || [])),
    tableGroups: JSON.parse(JSON.stringify(proj.tableGroups || [])),
    projectConfig: proj.projectConfig ? JSON.parse(JSON.stringify(proj.projectConfig)) : null,
    customDbml: proj.customDbml || null,
    history: JSON.parse(JSON.stringify(proj.history || [])),
    ownerUid: effectiveOwnerUid,
    ownerEmail: effectiveOwnerEmail
  };

  const currentHash = computeProjectHash(payload);
  if (lastSyncedHashes[proj.id] === currentHash) {
    state.saveStatus = 'saved';
    return; // Skip identical sync write
  }

  // Preserve to local browser storage immediately
  saveGuestProjectsToStorage();

  // If user is guest/not logged in, preserve to local browser storage rather than failing Firestore rules
  if (!state.currentUser.isLoggedIn || !auth.currentUser) {
    try {
      localStorage.setItem('dbmaps_local_schema_' + proj.id, currentHash);
    } catch (e) {}
    state.saveStatus = 'saved';
    state.lastSavedAt = new Date().toISOString();
    return;
  }

  // If user is authenticated but not the owner and not an invited collaborator, preserve locally
  const currentEmail = (auth.currentUser.email || state.currentUser.email || '').toLowerCase().trim();
  const isOwner = !proj.ownerUid || proj.ownerUid === 'guest' || proj.ownerUid === auth.currentUser.uid;
  const isCollaborator = Array.isArray(proj.allowedEmails) && proj.allowedEmails.some(e => (e || '').toLowerCase().trim() === currentEmail);
  const isAdmin = currentEmail === 'aungkyawminn.aya@gmail.com';

  if (!isOwner && !isCollaborator && !isAdmin) {
    try {
      localStorage.setItem('dbmaps_local_schema_' + proj.id, currentHash);
    } catch (e) {}
    state.saveStatus = 'saved';
    state.lastSavedAt = new Date().toISOString();
    return;
  }

  try {
    const docRef = doc(db, 'projects', proj.id);
    await setDoc(docRef, {
      ...payload,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    lastSyncedHashes[proj.id] = currentHash;
    state.saveStatus = 'saved';
    state.lastSavedAt = new Date().toISOString();
  } catch (e) {
    console.warn('Firestore sync note:', e.message);
    state.saveStatus = 'error';
    state.saveErrorMessage = e.message || 'Error saving to Firestore';
    if (isFirestoreApiDisabledOrOffline(e)) {
      state.firestoreErrorNotice = {
        message: 'Cloud Firestore API is not yet enabled in project dbmaps-13772. Changes are saved locally in browser.',
        url: 'https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=dbmaps-13772',
        consoleUrl: 'https://console.firebase.google.com/project/dbmaps-13772/firestore'
      };
      state.saveStatus = 'saved';
      return;
    }
    if (e.code === 'permission-denied') {
      try {
        handleFirestoreError(e, 'write', `projects/${proj.id}`);
      } catch (errSuppressed) {
        // Logged via handleFirestoreError; prevent crashing UI runtime
      }
    } else if (e.code === 'resource-exhausted' || (e.message && e.message.toLowerCase().includes('quota'))) {
      isFirestoreQuotaExceeded = true;
      console.warn('Firestore write quota exceeded. Auto-sync disabled; edits will be kept in browser session.');
    }
  }
}

export async function flushActiveProjectSync(targetProjectId = null) {
  if (syncTimeout) {
    clearTimeout(syncTimeout);
    syncTimeout = null;
  }
  if (!state.currentUser.isLoggedIn || !auth.currentUser) {
    saveGuestProjectsToStorage();
    state.saveStatus = 'saved';
    return;
  }
  const idToSync = targetProjectId || state.activeProjectId;
  if (!idToSync || isSampleProjectId(idToSync) || isProjectDeleted(idToSync)) {
    return;
  }
  const proj = state.projects.find(p => p.id === idToSync);
  if (!proj || isUntouchedBlankStarter(proj)) {
    return;
  }
  return await syncActiveProjectToFirestore(idToSync);
}

export async function forceSaveProject() {
  state.saveStatus = 'saving';
  await flushActiveProjectSync();
  if (state.saveStatus === 'saved') {
    if (state.currentUser.isLoggedIn) {
      addToast('All Changes Saved', 'Schema, tables, enums & relationships saved to cloud', 'success');
    } else {
      addToast('Saved Locally', 'Schema saved in browser storage (sign in to sync to cloud)', 'success');
    }
  } else if (state.saveStatus === 'error') {
    addToast('Save Warning', state.saveErrorMessage || 'Could not sync to cloud; saved locally', 'warning');
  }
}

// Unique session ID for presence
const sessionId = 'session_' + Math.random().toString(36).substring(2, 9);
const userColors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];
const myColor = userColors[Math.floor(Math.random() * userColors.length)];

let unsubscribePresence = null;
let presenceHeartbeatTimer = null;
let unsubscribeActiveProject = null;

// Subscribe in real-time to active shared schema document in Firestore
export function subscribeToActiveSharedProject(projectId) {
  if (unsubscribeActiveProject) {
    unsubscribeActiveProject();
    unsubscribeActiveProject = null;
  }

  if (!projectId) return;

  // Skip remote subscription for untouched blank starter schemas to stay lightweight and local
  const currentLocal = state.projects.find(p => p.id === projectId);
  if (currentLocal && isDefaultOrPublicProject(currentLocal) && (!currentLocal.tables || currentLocal.tables.length === 0) && currentLocal.name === 'New Database') {
    return;
  }

  try {
    const docRef = doc(db, 'projects', projectId);
    unsubscribeActiveProject = onSnapshot(docRef, (docSnap) => {
      if (!docSnap.exists()) return;
      const data = docSnap.data();
      if (!data || !data.id || data.id !== state.activeProjectId) return;

      // Access restriction validation - default or public schemas are never restricted
      if (!isDefaultOrPublicProject(data)) {
        const accessCheck = checkProjectAccess(data);
        if (!accessCheck.allowed) {
          state.collaborationAccessRestricted = {
            active: true,
            schemaId: data.id,
            schemaName: data.name || 'Restricted Schema',
            ownerEmail: data.ownerEmail || '',
            userEmail: state.currentUser.email || '',
            reason: accessCheck.reason
          };
          // Revert to safe accessible schema so restricted data is not shown
          const safeProj = state.projects.find(p => p.id !== data.id && isDefaultOrPublicProject(p)) || state.projects[0];
          if (safeProj) {
            state.activeProjectId = safeProj.id;
            state.roomCode = safeProj.id;
          }
          return;
        }
      }

      // If restriction modal was previously active for this project, clear it since access is confirmed
      if (state.collaborationAccessRestricted.active && state.collaborationAccessRestricted.schemaId === data.id) {
        state.collaborationAccessRestricted.active = false;
      }

      const remoteHash = computeProjectHash(data);

      // Look up target project specifically by ID; NEVER fall back to projects[0]
      let currentProj = state.projects.find(p => p.id === data.id);
      if (!currentProj) {
        const fresh = {
          id: data.id,
          folderId: data.folderId || 'folder-1',
          name: data.name || 'Shared Database Schema',
          description: data.description || '',
          dialect: data.dialect || 'postgres',
          accessMode: data.accessMode || 'public',
          sharePassword: data.sharePassword || '',
          allowedEmails: Array.isArray(data.allowedEmails) ? data.allowedEmails : [],
          tables: data.tables || [],
          relationships: data.relationships || [],
          enums: data.enums || [],
          tableGroups: data.tableGroups || [],
          projectConfig: data.projectConfig || null,
          customDbml: data.customDbml || null,
          history: data.history || [],
          ownerUid: data.ownerUid || '',
          ownerEmail: data.ownerEmail || '',
          updatedAt: data.updatedAt || new Date().toISOString()
        };
        normalizeProjectKeys(fresh);
        state.projects.push(fresh);
        lastSyncedHashes[data.id] = remoteHash;
        return;
      }

      const localHash = computeProjectHash(currentProj);

      if (remoteHash !== localHash && remoteHash !== lastSyncedHashes[data.id]) {
        markProjectSyncingFromRemote(data.id, 500);
        currentProj.name = data.name || currentProj.name;
        currentProj.description = data.description || '';
        currentProj.dialect = data.dialect || 'postgres';
        currentProj.accessMode = data.accessMode || 'public';
        currentProj.sharePassword = data.sharePassword || '';
        currentProj.allowedEmails = Array.isArray(data.allowedEmails) ? data.allowedEmails : [];
        if (data.tables) currentProj.tables = data.tables;
        if (data.relationships) currentProj.relationships = data.relationships;
        normalizeProjectKeys(currentProj);
        if (data.enums) currentProj.enums = data.enums;
        if (data.tableGroups) currentProj.tableGroups = data.tableGroups;
        if (data.projectConfig) currentProj.projectConfig = data.projectConfig;
        if (data.customDbml) currentProj.customDbml = data.customDbml;
        if (data.history) currentProj.history = data.history;
        currentProj.updatedAt = data.updatedAt || new Date().toISOString();
        lastSyncedHashes[currentProj.id] = remoteHash;
      }
    }, (err) => {
      if (isFirestoreApiDisabledOrOffline(err)) {
        return;
      }
      console.warn('Active project snapshot note:', err.message);
      if (err.code === 'permission-denied') {
        const localP = state.projects.find(p => p.id === projectId);
        // CRITICAL FIX: Default and public open schemas must NEVER be restricted or show the collaboration alert!
        if (!localP || isDefaultOrPublicProject(localP)) {
          console.info('Default public schema operating locally without remote restriction.');
          return;
        }

        // Only restrict if the project is actually an explicitly restricted remote schema
        if (localP.accessMode === 'restricted' || localP.accessMode === 'password') {
          state.collaborationAccessRestricted = {
            active: true,
            schemaId: projectId,
            schemaName: localP?.name || 'Restricted Team Schema',
            ownerEmail: localP?.ownerEmail || '',
            userEmail: (state.currentUser.isLoggedIn && auth.currentUser) ? (state.currentUser.email || auth.currentUser?.email || '') : '',
            reason: (state.currentUser.isLoggedIn && auth.currentUser) ? 'unauthorized' : 'login_required'
          };
          ensureSafeActiveProject(projectId);
        }
      }
    });
  } catch (err) {
    console.warn('Error subscribing to active project:', err);
  }
}

// Realtime Presence Sync for Live Collaborators per active schema
export function startPresenceTracking() {
  if (presenceHeartbeatTimer) clearInterval(presenceHeartbeatTimer);
  if (unsubscribePresence) {
    unsubscribePresence();
    unsubscribePresence = null;
  }

  const activeSchemaId = state.activeProjectId || state.roomCode || 'proj-1';
  state.roomCode = activeSchemaId;
  const roomDocId = `presence_${activeSchemaId}`;

  const broadcastPresence = async () => {
    try {
      const u = state.currentUser;
      const myPresence = {
        sessionId,
        uid: u.id || 'guest',
        name: u.isLoggedIn ? u.name : `Guest (${sessionId.slice(-4)})`,
        email: u.email || 'guest@dbmaps.io',
        avatar: u.avatar,
        color: myColor,
        role: u.isLoggedIn ? 'Editor' : 'Collaborator',
        activeProjectId: state.activeProjectId,
        selectedTableId: state.selectedTableId,
        lastSeen: Date.now()
      };

      const presenceDocRef = doc(db, 'rooms', roomDocId, 'presence', sessionId);
      await setDoc(presenceDocRef, myPresence, { merge: true }).catch(() => {});
    } catch (e) {
      // Offline fallback
    }
  };

  // Heartbeat every 6s
  broadcastPresence();
  presenceHeartbeatTimer = setInterval(broadcastPresence, 6000);

  // Listen to other collaborators in this specific schema room
  try {
    const presenceCol = collection(db, 'rooms', roomDocId, 'presence');
    unsubscribePresence = onSnapshot(presenceCol, (snapshot) => {
      const now = Date.now();
      const activePeers = [];

      snapshot.forEach(docSnap => {
        const peer = docSnap.data();
        // Consider active if seen within the last 20 seconds
        if (peer && peer.lastSeen && (now - peer.lastSeen) < 20000) {
          activePeers.push({
            id: peer.sessionId || peer.uid,
            name: peer.sessionId === sessionId ? `${peer.name} (You)` : peer.name,
            email: peer.email || '',
            avatar: peer.avatar || DEFAULT_GUEST_AVATAR,
            color: peer.color || '#3b82f6',
            role: peer.role || 'Collaborator',
            isSelf: peer.sessionId === sessionId,
            selectedTableId: peer.selectedTableId || null
          });
        }
      });

      if (activePeers.length > 0) {
        state.collaborators = activePeers;
      }
    }, (err) => {
      console.warn('Presence listener note:', err.message);
    });
  } catch (err) {
    console.warn('Presence tracking setup note:', err.message);
  }
}

// Stop realtime presence tracking and remove presence record cleanly
export function stopPresenceTracking() {
  if (presenceHeartbeatTimer) {
    clearInterval(presenceHeartbeatTimer);
    presenceHeartbeatTimer = null;
  }
  if (unsubscribePresence) {
    try {
      unsubscribePresence();
    } catch (e) {
      // Ignore unsubscribe error
    }
    unsubscribePresence = null;
  }

  // Remove presence record cleanly from active schema room in Firestore
  try {
    const activeSchemaId = state.activeProjectId || state.roomCode || 'proj-1';
    const roomDocId = `presence_${activeSchemaId}`;
    const presenceDocRef = doc(db, 'rooms', roomDocId, 'presence', sessionId);
    deleteDoc(presenceDocRef).catch(() => {});
  } catch (e) {
    // Offline or cleanup error ignored
  }
}

// Select active project and switch live room context
export function selectProject(projectId) {
  if (!projectId || projectId === state.activeProjectId) return;

  // Flush any pending auto-sync for the current active project before switching away
  if (state.activeProjectId && state.saveStatus === 'unsaved' && !isSampleProjectId(state.activeProjectId) && !isProjectDeleted(state.activeProjectId)) {
    flushActiveProjectSync(state.activeProjectId);
  }

  const targetProj = state.projects.find(p => p.id === projectId);
  if (targetProj && !isDefaultOrPublicProject(targetProj) && (targetProj.accessMode === 'restricted' || targetProj.accessMode === 'password')) {
    const accessCheck = checkProjectAccess(targetProj);
    if (!accessCheck.allowed) {
      state.collaborationAccessRestricted = {
        active: true,
        schemaId: targetProj.id,
        schemaName: targetProj.name || 'Protected Schema',
        ownerEmail: targetProj.ownerEmail || '',
        userEmail: (state.currentUser.isLoggedIn && auth.currentUser) ? (state.currentUser.email || auth.currentUser?.email || '') : '',
        reason: accessCheck.reason,
        expectedPassword: targetProj.sharePassword || '',
        pendingProjectData: null
      };
      ensureSafeActiveProject(targetProj.id);
      return;
    }
  }

  // Clear any existing restriction modal when selecting an accessible project
  if (state.collaborationAccessRestricted.active) {
    state.collaborationAccessRestricted.active = false;
  }

  state.activeProjectId = projectId;
  state.roomCode = projectId;
  state.selectedTableId = null;
  state.selectedRelId = null;
  
  // Ensure Studio route is active when selecting a collaborative project
  if (state.currentRoute !== '/app') {
    state.currentRoute = '/app';
  }

  // Update browser address bar so URL can be copied directly with /app
  if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
    const newUrl = `/app?schema=${encodeURIComponent(projectId)}`;
    window.history.replaceState(null, '', newUrl);
  }

  // Realtime subscription and presence for newly active schema
  subscribeToActiveSharedProject(projectId);
  startPresenceTracking();
}

// Load shared schema from URL parameters or hash
export async function loadSharedSchemaFromUrl() {
  if (typeof window === 'undefined') return;

  try {
    const urlParams = new URLSearchParams(window.location.search);
    let targetSchemaId = urlParams.get('schema') || urlParams.get('project') || urlParams.get('room') || urlParams.get('id') || urlParams.get('share');

    if (!targetSchemaId && window.location.hash) {
      const hashStr = window.location.hash.replace(/^#/, '');
      const hashParams = new URLSearchParams(hashStr.includes('=') ? hashStr : `schema=${hashStr}`);
      targetSchemaId = hashParams.get('schema') || hashParams.get('project') || hashParams.get('room') || hashParams.get('id') || hashParams.get('share') || hashStr;
    }

    if (!targetSchemaId) return;

    targetSchemaId = targetSchemaId.replace(/^ERD-/, '').trim();
    if (!targetSchemaId) return;

    // Direct access to collaborative schema must route directly to studio workspace (/app)
    state.currentRoute = '/app';

    // If targetSchemaId is already present locally as a default or public open schema, select it directly
    const localExisting = state.projects.find(p => p.id === targetSchemaId);
    if (localExisting && isDefaultOrPublicProject(localExisting)) {
      state.collaborationAccessRestricted.active = false;
      selectProject(localExisting.id);
      return;
    }

    // Check Firestore first as authoritative source for collaborative schema permissions
    try {
      const docSnap = await getDoc(doc(db, 'projects', targetSchemaId));
      if (docSnap.exists()) {
        const data = docSnap.data();

        // Check collaboration access restrictions only if not a public/default schema
        if (!isDefaultOrPublicProject(data)) {
          const accessCheck = checkProjectAccess(data);
          if (!accessCheck.allowed) {
            const localP = state.projects.find(p => p.id === targetSchemaId);
            if (localP) {
              localP.accessMode = data.accessMode || 'restricted';
              localP.sharePassword = data.sharePassword || '';
              localP.allowedEmails = data.allowedEmails || [];
              localP.ownerEmail = data.ownerEmail || '';
              localP.ownerUid = data.ownerUid || '';
            }

            state.collaborationAccessRestricted = {
              active: true,
              schemaId: targetSchemaId,
              schemaName: data.name || 'Shared Database Schema',
              ownerEmail: data.ownerEmail || '',
              userEmail: (state.currentUser.isLoggedIn && auth.currentUser) ? (state.currentUser.email || auth.currentUser?.email || '') : '',
              reason: accessCheck.reason,
              expectedPassword: data.sharePassword || '',
              pendingProjectData: {
                id: data.id || targetSchemaId,
                folderId: data.folderId || 'folder-1',
                name: data.name || 'Shared Database Schema',
                description: data.description || 'Collaborative schema',
                dialect: data.dialect || 'postgres',
                accessMode: data.accessMode || 'public',
                sharePassword: data.sharePassword || '',
                allowedEmails: Array.isArray(data.allowedEmails) ? data.allowedEmails : [],
                tables: data.tables || [],
                relationships: data.relationships || [],
                enums: data.enums || [],
                tableGroups: data.tableGroups || [],
                projectConfig: data.projectConfig || null,
                customDbml: data.customDbml || null,
                history: data.history || [],
                ownerUid: data.ownerUid || 'guest',
                ownerEmail: data.ownerEmail || '',
                updatedAt: data.updatedAt || new Date().toISOString()
              }
            };
            ensureSafeActiveProject(targetSchemaId);
            addToast(
              accessCheck.reason === 'password_required' ? 'Password Protected' : 'Access Restricted',
              accessCheck.reason === 'password_required'
                ? 'Password required to enter this collaboration room'
                : accessCheck.reason === 'login_required'
                  ? 'Sign in required to access this restricted collaboration room'
                  : `Your account is not authorized for "${data.name || 'this schema'}"`,
              accessCheck.reason === 'password_required' ? 'info' : 'warning'
            );
            return;
          }
        }

        state.collaborationAccessRestricted.active = false;

        const loadedProj = {
          id: data.id || targetSchemaId,
          folderId: data.folderId || 'folder-1',
          name: data.name || 'Shared Database Schema',
          description: data.description || 'Collaborative schema',
          dialect: data.dialect || 'postgres',
          accessMode: data.accessMode || 'public',
          sharePassword: data.sharePassword || '',
          allowedEmails: Array.isArray(data.allowedEmails) ? data.allowedEmails : [],
          tables: data.tables || [],
          relationships: data.relationships || [],
          enums: data.enums || [],
          tableGroups: data.tableGroups || [],
          projectConfig: data.projectConfig || null,
          customDbml: data.customDbml || null,
          history: data.history || [],
          ownerUid: data.ownerUid || 'guest',
          ownerEmail: data.ownerEmail || '',
          updatedAt: data.updatedAt || new Date().toISOString()
        };
        normalizeProjectKeys(loadedProj);

        const existingIdx = state.projects.findIndex(p => p.id === loadedProj.id);
        if (existingIdx >= 0) {
          state.projects[existingIdx] = loadedProj;
        } else {
          state.projects.push(loadedProj);
        }
        selectProject(loadedProj.id);
        addToast('Collaborative Schema Loaded', `Loaded "${loadedProj.name}" from live team room`, 'success');
        return;
      }
    } catch (err) {
      console.warn('Error fetching shared project schema from Firestore:', err);
      // If local schema is default or public, do not show restriction
      if (localExisting && isDefaultOrPublicProject(localExisting)) {
        state.collaborationAccessRestricted.active = false;
        selectProject(localExisting.id);
        return;
      }

      if (err.code === 'permission-denied') {
        if (localExisting && (localExisting.accessMode === 'restricted' || localExisting.accessMode === 'password')) {
          state.collaborationAccessRestricted = {
            active: true,
            schemaId: targetSchemaId,
            schemaName: localExisting?.name || 'Restricted Team Schema',
            ownerEmail: localExisting?.ownerEmail || '',
            userEmail: (state.currentUser.isLoggedIn && auth.currentUser) ? (state.currentUser.email || auth.currentUser?.email || '') : '',
            reason: (state.currentUser.isLoggedIn && auth.currentUser) ? 'unauthorized' : 'login_required'
          };
          ensureSafeActiveProject(targetSchemaId);
          addToast(
            'Access Restricted',
            state.currentUser.isLoggedIn
              ? 'Your account is not on the authorized collaborator whitelist'
              : 'Sign in required to access this restricted schema',
            'warning'
          );
        }
        return;
      }
    }

    // Fallback if not found in Firestore (e.g. offline local schema)
    const existing = state.projects.find(p => p.id === targetSchemaId);
    if (existing) {
      if (!isDefaultOrPublicProject(existing)) {
        const accessCheck = checkProjectAccess(existing);
        if (!accessCheck.allowed) {
          state.collaborationAccessRestricted = {
            active: true,
            schemaId: existing.id,
            schemaName: existing.name || 'Protected Schema',
            ownerEmail: existing.ownerEmail || '',
            userEmail: (state.currentUser.isLoggedIn && auth.currentUser) ? (state.currentUser.email || auth.currentUser?.email || '') : '',
            reason: accessCheck.reason,
            expectedPassword: existing.sharePassword || '',
            pendingProjectData: null
          };
          ensureSafeActiveProject(existing.id);
          return;
        }
      }
      state.collaborationAccessRestricted.active = false;
      selectProject(existing.id);
      addToast('Collaborative Room', `Joined live collaboration for "${existing.name}"`, 'success');
      return;
    }
  } catch (err) {
    console.warn('URL schema parser note:', err);
  }
}

// Clean up presence on unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    try {
      const roomDocId = `presence_${state.roomCode || state.activeProjectId || 'proj-1'}`;
      deleteDoc(doc(db, 'rooms', roomDocId, 'presence', sessionId)).catch(() => {});
    } catch (e) {}
  });

  // Start presence tracking immediately
  setTimeout(() => {
    loadSharedSchemaFromUrl();
    subscribeToActiveSharedProject(state.activeProjectId);
    startPresenceTracking();
  }, 500);
}

// Toast helper
export function addToast(title, message, type = 'info') {
  const id = Date.now() + Math.random();
  state.toasts.push({ id, title, message, type });
  setTimeout(() => {
    state.toasts = state.toasts.filter(t => t.id !== id);
  }, 3500);
}

// Subscribe to Firestore projects to sync account schemas
let unsubscribeProjects = null;
let unsubscribeSharedProjects = null;

function subscribeToFirestoreProjects() {
  if (unsubscribeProjects) {
    unsubscribeProjects();
    unsubscribeProjects = null;
  }
  if (unsubscribeSharedProjects) {
    unsubscribeSharedProjects();
    unsubscribeSharedProjects = null;
  }

  if (!state.currentUser.isLoggedIn || !auth.currentUser) return;

  try {
    const ownerId = auth.currentUser.uid;
    const userEmail = (auth.currentUser.email || state.currentUser.email || '').toLowerCase().trim();
    
    // 1. Listen to projects strictly owned by current user
    const q = query(collection(db, 'projects'), where('ownerUid', '==', ownerId));
    
    unsubscribeProjects = onSnapshot(q, (snapshot) => {
      const remoteProjects = [];
      const deletedIds = getDeletedProjectIds();

      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data && data.id) {
          if (deletedIds.includes(data.id)) {
            // Document was deleted by user: purge from Firestore permanently if lingering
            deleteDoc(doc(db, 'projects', data.id)).catch(() => {});
          } else {
            const rp = {
              id: data.id,
              folderId: data.folderId || 'folder-1',
              name: data.name || 'Untitled Schema',
              description: data.description || '',
              dialect: data.dialect || 'postgres',
              accessMode: data.accessMode || 'restricted',
              sharePassword: data.sharePassword || '',
              allowedEmails: Array.isArray(data.allowedEmails) ? data.allowedEmails : [],
              tables: data.tables || [],
              relationships: data.relationships || [],
              enums: data.enums || [],
              tableGroups: data.tableGroups || [],
              projectConfig: data.projectConfig || null,
              customDbml: data.customDbml || null,
              history: data.history || [],
              ownerUid: data.ownerUid || ownerId,
              ownerEmail: data.ownerEmail || '',
              updatedAt: data.updatedAt || new Date().toISOString(),
              isSharedWithMe: false
            };
            normalizeProjectKeys(rp);
            remoteProjects.push(rp);
          }
        }
      });

      if (remoteProjects.length > 0) {
        // 1. PRUNE: Remove any owned projects from local state that are no longer in Firestore or were deleted
        const remoteIds = new Set(remoteProjects.map(p => p.id));
        for (let i = state.projects.length - 1; i >= 0; i--) {
          const p = state.projects[i];
          if (deletedIds.includes(p.id)) {
            state.projects.splice(i, 1);
          } else if (!p.isSharedWithMe && (p.ownerUid === ownerId || p.ownerUid === 'guest' || isUntouchedBlankStarter(p) || isSampleProjectId(p.id))) {
            if (!remoteIds.has(p.id)) {
              // Project was deleted on another tab, session, or previously
              state.projects.splice(i, 1);
            }
          }
        }

        // 2. UPSERT: Add or update surviving remote projects in-place
        remoteProjects.forEach(rp => {
          const idx = state.projects.findIndex(p => p.id === rp.id);
          const rHash = computeProjectHash(rp);

          // If this window just wrote this hash to Firestore, skip overwriting
          if (lastSyncedHashes[rp.id] === rHash) {
            return;
          }

          if (idx !== -1) {
            const localProj = state.projects[idx];
            const lHash = computeProjectHash(localProj);

            if (rHash !== lHash) {
              markProjectSyncingFromRemote(rp.id, 500);
              localProj.name = rp.name;
              localProj.description = rp.description;
              localProj.dialect = rp.dialect;
              localProj.accessMode = rp.accessMode;
              localProj.sharePassword = rp.sharePassword || '';
              localProj.allowedEmails = rp.allowedEmails || [];
              localProj.tables = rp.tables;
              localProj.relationships = rp.relationships;
              localProj.enums = rp.enums || [];
              localProj.tableGroups = rp.tableGroups || [];
              localProj.projectConfig = rp.projectConfig || null;
              localProj.customDbml = rp.customDbml || null;
              localProj.history = rp.history;
              localProj.updatedAt = rp.updatedAt;
              localProj.folderId = rp.folderId;
              lastSyncedHashes[rp.id] = rHash;
            }
          } else {
            state.projects.push(rp);
            lastSyncedHashes[rp.id] = rHash;
          }
        });

        if (state.projects.length > 0) {
          const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
          const explicitUrlSchema = urlParams?.get('schema') || urlParams?.get('project') || urlParams?.get('room') || urlParams?.get('id') || urlParams?.get('share');

          // If the currently active project is already valid and present in state.projects, KEEP IT!
          // Prevent snapshots from switching the active project back to an older/default project after creation or manual selection.
          if (state.activeProjectId && state.projects.some(p => p.id === state.activeProjectId)) {
            // Preserve user's current active selection
          } else if (explicitUrlSchema && state.projects.some(p => p.id === explicitUrlSchema)) {
            state.activeProjectId = explicitUrlSchema;
            state.roomCode = explicitUrlSchema;
          } else {
            const initialId = getInitialActiveProjectId(state.projects, state.folders);
            const matched = state.projects.find(p => p.id === initialId);
            if (matched) {
              state.activeProjectId = matched.id;
              state.roomCode = matched.id;
            } else {
              state.activeProjectId = state.projects[0].id;
              state.roomCode = state.projects[0].id;
            }
          }
        }
      } else {
        // User has 0 projects in Firestore (e.g. deleted their schemas or first time)
        // Clean out any deleted, sample, or starter projects from local state
        for (let i = state.projects.length - 1; i >= 0; i--) {
          const p = state.projects[i];
          if (deletedIds.includes(p.id) || isSampleProjectId(p.id) || isUntouchedBlankStarter(p)) {
            state.projects.splice(i, 1);
          }
        }

        if (state.projects.length === 0) {
          const fresh = {
            id: 'proj-' + Date.now().toString(36),
            folderId: state.folders[0]?.id || 'folder-1',
            name: 'New Database',
            description: 'New database schema model',
            updatedAt: new Date().toISOString(),
            dialect: 'postgres',
            accessMode: 'restricted',
            sharePassword: '',
            allowedEmails: [],
            tables: [],
            relationships: [],
            history: [],
            ownerUid: ownerId,
            ownerEmail: auth.currentUser.email || '',
            isStarterProject: true
          };
          state.projects.push(fresh);
          state.activeProjectId = fresh.id;
          state.roomCode = fresh.id;
        }
      }

      isFirestoreProjectsLoaded.value = true;
      finishInitialLoading(450);
    }, (err) => {
      console.warn('Firestore snapshot note:', err.message);
      isFirestoreProjectsLoaded.value = true;
      finishInitialLoading(200);
      if (isFirestoreApiDisabledOrOffline(err)) {
        state.firestoreErrorNotice = {
          message: 'Cloud Firestore API is not yet enabled in project dbmaps-13772. Changes are saved locally in browser.',
          url: 'https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=dbmaps-13772',
          consoleUrl: 'https://console.firebase.google.com/project/dbmaps-13772/firestore'
        };
        return;
      }
      if (err.code === 'permission-denied') {
        handleFirestoreError(err, 'list', 'projects');
      } else if (err.code === 'resource-exhausted' || (err.message && err.message.toLowerCase().includes('quota'))) {
        isFirestoreQuotaExceeded = true;
      }
    });

    // 2. Listen to projects shared with this user via allowedEmails whitelist
    if (userEmail) {
      const qShared = query(
        collection(db, 'projects'),
        where('allowedEmails', 'array-contains', userEmail)
      );

      unsubscribeSharedProjects = onSnapshot(qShared, (snapshot) => {
        snapshot.forEach(docSnap => {
          const data = docSnap.data();
          if (data && data.id && data.ownerUid !== ownerId) {
            const sharedProj = {
              id: data.id,
              folderId: data.folderId || 'folder-1',
              name: data.name || 'Shared Database Schema',
              description: data.description || '',
              dialect: data.dialect || 'postgres',
              accessMode: data.accessMode || 'restricted',
              sharePassword: data.sharePassword || '',
              allowedEmails: Array.isArray(data.allowedEmails) ? data.allowedEmails : [],
              tables: data.tables || [],
              relationships: data.relationships || [],
              enums: data.enums || [],
              tableGroups: data.tableGroups || [],
              projectConfig: data.projectConfig || null,
              customDbml: data.customDbml || null,
              history: data.history || [],
              ownerUid: data.ownerUid,
              ownerEmail: data.ownerEmail || '',
              updatedAt: data.updatedAt || new Date().toISOString(),
              isSharedWithMe: true
            };
            normalizeProjectKeys(sharedProj);

            const sHash = computeProjectHash(sharedProj);
            if (lastSyncedHashes[sharedProj.id] === sHash) {
              return;
            }

            const idx = state.projects.findIndex(p => p.id === sharedProj.id);
            if (idx !== -1) {
              const localProj = state.projects[idx];
              const lHash = computeProjectHash(localProj);
              if (sHash !== lHash) {
                markProjectSyncingFromRemote(sharedProj.id, 500);
                localProj.name = sharedProj.name;
                localProj.description = sharedProj.description;
                localProj.dialect = sharedProj.dialect;
                localProj.accessMode = sharedProj.accessMode;
                localProj.sharePassword = sharedProj.sharePassword;
                localProj.allowedEmails = sharedProj.allowedEmails;
                localProj.tables = sharedProj.tables;
                localProj.relationships = sharedProj.relationships;
                localProj.enums = sharedProj.enums || [];
                localProj.tableGroups = sharedProj.tableGroups || [];
                localProj.projectConfig = sharedProj.projectConfig || null;
                localProj.customDbml = sharedProj.customDbml || null;
                localProj.history = sharedProj.history;
                localProj.updatedAt = sharedProj.updatedAt;
                localProj.folderId = sharedProj.folderId;
                lastSyncedHashes[sharedProj.id] = sHash;
              }
            } else {
              state.projects.push(sharedProj);
              lastSyncedHashes[sharedProj.id] = sHash;
            }
          }
        });
      }, (err) => {
        if (!isFirestoreApiDisabledOrOffline(err)) {
          console.log('Shared projects listener status:', err.message);
        }
      });
    }
  } catch (err) {
    console.warn('Firestore listener setup error:', err.message);
  }
}

// Firebase Auth Observer
onAuthStateChanged(auth, (user) => {
  isAuthResolved.value = true;
  if (user) {
    state.initialLoadingProgress = Math.max(state.initialLoadingProgress, 60);
    state.initialLoadingStage = 'Connecting to account & cloud schemas...';
    state.currentUser = {
      id: user.uid,
      name: user.displayName || 'Developer',
      email: user.email || '',
      avatar: user.photoURL || DEFAULT_GUEST_AVATAR,
      photoURL: user.photoURL || '',
      isLoggedIn: true,
      provider: 'google'
    };
    state.collaborators = [
      {
        id: user.uid,
        name: user.displayName ? `${user.displayName} (You)` : 'You (Host)',
        email: user.email || '',
        color: '#3b82f6',
        avatar: state.currentUser.avatar,
        role: 'Owner'
      }
    ];

    fetchUserProfile();
    loadFoldersFromStorage();
    subscribeToFirestoreProjects();
    startPresenceTracking();

    // If an access restricted modal was active, re-check permissions with logged-in user
    if (state.collaborationAccessRestricted.active) {
      setTimeout(() => {
        loadSharedSchemaFromUrl();
      }, 400);
    }
  } else {
    isFirestoreProjectsLoaded.value = true;
    state.initialLoadingProgress = Math.max(state.initialLoadingProgress, 65);
    state.initialLoadingStage = 'Preparing database canvas...';
    if (syncTimeout) {
      clearTimeout(syncTimeout);
      syncTimeout = null;
    }
    if (unsubscribeActiveProject) {
      try { unsubscribeActiveProject(); } catch (e) {}
      unsubscribeActiveProject = null;
    }
    if (unsubscribeProjects) {
      try { unsubscribeProjects(); } catch (e) {}
      unsubscribeProjects = null;
    }
    if (unsubscribeSharedProjects) {
      try { unsubscribeSharedProjects(); } catch (e) {}
      unsubscribeSharedProjects = null;
    }
    stopPresenceTracking();
    state.currentUser = {
      id: 'guest',
      name: 'Guest Developer',
      email: '',
      avatar: DEFAULT_GUEST_AVATAR,
      isLoggedIn: false,
      provider: null
    };
    state.collaborators = [
      {
        id: 'guest',
        name: 'You (Guest)',
        email: '',
        color: '#3b82f6',
        avatar: state.currentUser.avatar,
        role: 'Guest'
      }
    ];
    // Reset projects to clean sample starter projects to ensure user data isolation upon logout
    state.projects = JSON.parse(JSON.stringify(SAMPLE_PROJECTS));
    state.activeProjectId = SAMPLE_PROJECTS[0]?.id || 'sample-ecommerce';
    fetchUserProfile().finally(() => {
      finishInitialLoading(350);
    });
  }
});

// Maximum safety timeout for initial landing page display
setTimeout(() => {
  const isStudio = typeof window !== 'undefined' && (
    window.location.pathname.startsWith('/app') ||
    window.location.pathname.startsWith('/studio') ||
    window.location.pathname.startsWith('/workspace') ||
    window.location.pathname.startsWith('/editor') ||
    state.currentRoute.startsWith('/app') ||
    state.currentRoute.startsWith('/studio') ||
    state.currentRoute.startsWith('/workspace') ||
    state.currentRoute.startsWith('/editor')
  );
  if (!isStudio) {
    finishInitialLoading(100);
  }
}, 2200);

// Deeply watch active project changes and auto-sync to Firestore
let syncTimeout = null;
let currentWatchedProjectId = state.activeProjectId;

watch(
  () => state.activeProjectId,
  (newId, oldId) => {
    if (oldId && oldId !== newId && state.currentUser.isLoggedIn && auth.currentUser) {
      if (state.saveStatus === 'unsaved' && !isSampleProjectId(oldId) && !isProjectDeleted(oldId)) {
        flushActiveProjectSync(oldId);
      }
    }
    currentWatchedProjectId = newId;
  }
);

watch(
  () => activeProject.value,
  (proj) => {
    if (!proj || !proj.id) return;
    if (proj.id !== currentWatchedProjectId) {
      currentWatchedProjectId = proj.id;
      return; // Switched active project reference; wait for actual user mutations
    }
    if (isProjectSyncingFromRemote(proj.id) || isFirestoreQuotaExceeded) return;
    
    // Mark as unsaved immediately when user makes schema mutations
    state.saveStatus = 'unsaved';

    if (syncTimeout) clearTimeout(syncTimeout);
    syncTimeout = setTimeout(() => {
      syncActiveProjectToFirestore(proj.id);
    }, 1500);
  },
  { deep: true }
);

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    saveGuestProjectsToStorage();
    if (state.saveStatus === 'unsaved') {
      flushActiveProjectSync();
    }
    stopPresenceTracking();
  });
}

// Concurrency lock for Google SSO popup operations
let isAuthOperationInProgress = false;

// Login with Google SSO with resilience against transient popup/visibility IndexedDB closes & concurrency locks
export async function loginWithGoogle() {
  if (isAuthOperationInProgress) {
    console.info('Google sign-in popup is already opening or in progress.');
    return;
  }
  isAuthOperationInProgress = true;
  state.isLoggingIn = true;

  try {
    let result;
    try {
      result = await signInWithPopup(auth, googleProvider);
    } catch (popupErr) {
      if (popupErr?.message?.includes('Database is closing') || popupErr?.message?.includes('closing/hidden')) {
        console.warn('Recovering from popup visibility closing state, retrying sign-in...');
        await new Promise(r => setTimeout(r, 500));
        result = await signInWithPopup(auth, googleProvider);
      } else {
        throw popupErr;
      }
    }
    addToast('Google SSO Success', `Welcome back, ${result.user.displayName || 'User'}!`, 'success');
    state.modals.auth = false;
    await fetchUserProfile();
    checkFirstTimeUserTour(state.currentUser);

    // If user was prompted to sign in to access Presto AI, automatically launch generator
    if (state.authModalPromptReason === 'ai_presto') {
      state.modals.aiGen = true;
      state.authModalPromptReason = null;
    }
  } catch (err) {
    const isCancelledOrClosed =
      err?.code === 'auth/cancelled-popup-request' ||
      err?.code === 'auth/popup-closed-by-user' ||
      err?.code === 'auth/user-cancelled' ||
      err?.message?.includes('cancelled-popup-request') ||
      err?.message?.includes('popup-closed-by-user');

    if (isCancelledOrClosed) {
      // Normal user action or superseded popup; do not log error or show error toast
      console.info('Google sign-in popup closed or superseded by user.');
      return;
    }

    console.error('Google Auth Error:', err);
    let friendlyMessage = err.message || 'Google sign-in popup error';
    if (err.code === 'auth/unauthorized-domain') {
      friendlyMessage = `Authorized Domain Required: Please add "${typeof window !== 'undefined' ? window.location.hostname : 'this domain'}" to Firebase Console -> Authentication -> Settings -> Authorized domains.`;
    } else if (err.code === 'auth/operation-not-allowed') {
      friendlyMessage = 'Google Sign-In is disabled in project dbmaps-13772. Enable it in Firebase Console -> Authentication -> Sign-in method.';
    } else if (err.code === 'auth/popup-blocked') {
      friendlyMessage = 'Popup was blocked by your browser. Please allow popups for this site.';
    }
    addToast('Authentication Note', friendlyMessage, 'error');
  } finally {
    isAuthOperationInProgress = false;
    state.isLoggingIn = false;
  }
}

// Sign out
export async function logoutUser() {
  try {
    if (syncTimeout) {
      clearTimeout(syncTimeout);
      syncTimeout = null;
    }
    if (unsubscribeActiveProject) {
      try { unsubscribeActiveProject(); } catch (e) {}
      unsubscribeActiveProject = null;
    }
    if (unsubscribeProjects) {
      try { unsubscribeProjects(); } catch (e) {}
      unsubscribeProjects = null;
    }
    if (unsubscribeSharedProjects) {
      try { unsubscribeSharedProjects(); } catch (e) {}
      unsubscribeSharedProjects = null;
    }
    stopPresenceTracking();
    await signOut(auth);
    state.currentUser = {
      id: 'guest',
      name: 'Guest Developer',
      email: '',
      avatar: DEFAULT_GUEST_AVATAR,
      isLoggedIn: false,
      provider: null
    };
    state.collaborators = [
      {
        id: 'guest',
        name: 'You (Guest)',
        email: '',
        color: '#3b82f6',
        avatar: DEFAULT_GUEST_AVATAR,
        role: 'Guest'
      }
    ];
    state.projects = JSON.parse(JSON.stringify(SAMPLE_PROJECTS));
    state.activeProjectId = SAMPLE_PROJECTS[0]?.id || 'sample-ecommerce';
    addToast('Logged Out', 'Signed out from session and cleared local cloud workspace', 'info');
    state.modals.auth = false;
    await fetchUserProfile();
  } catch (err) {
    console.error('Logout error:', err);
    addToast('Sign Out Error', err.message, 'error');
  }
}

// Toggle Dark Mode
export function toggleDarkMode() {
  state.isDarkMode = !state.isDarkMode;
  localStorage.setItem('db_schema_dark', String(state.isDarkMode));
  if (state.isDarkMode) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

if (typeof document !== 'undefined') {
  if (state.isDarkMode) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

// Update table position during canvas drag
export function updateTablePosition(tableId, newX, newY) {
  const proj = activeProject.value;
  if (!proj) return;
  const tbl = proj.tables.find(t => t.id === tableId);
  if (tbl) {
    tbl.x = Math.round(newX);
    tbl.y = Math.round(newY);
  }
}

// Calculate responsive table dimensions based on table name and column contents
export function getTableDimensions(table) {
  if (!table) return { width: 300, headerHeight: 44, estimatedLines: 1 };
  const name = table.name || '';
  const nameLen = name.length;

  // Standardize uniform, consistent card width (300px) across all tables
  // to avoid uneven horizontal expansion while preserving crisp typography
  let width = 300;
  if (nameLen > 34) {
    width = 340;
  }

  // Available width in header: width minus container padding (28px), table icon + gap (24px),
  // and action buttons or note icon margin (~60px)
  const availableHeaderWidth = width - 110;
  const charsPerLine = Math.max(16, Math.floor(availableHeaderWidth / 8.2));
  const estimatedLines = Math.max(1, Math.ceil(nameLen / charsPerLine));

  // Base 1-line header is 44px
  // Each additional wrapped line adds 22px
  const headerHeight = estimatedLines === 1 ? 44 : 44 + (estimatedLines - 1) * 22;

  return { width, headerHeight, estimatedLines };
}

// Auto Arrange Layout Modes configuration
export const AUTO_ARRANGE_MODES = [
  {
    id: 'flow',
    name: 'Relationship Flow',
    shortLabel: 'Flow',
    badge: '1',
    iconName: 'Workflow',
    tagline: 'Left-to-right dependency hierarchy',
    description: 'Arranges tables left to right following foreign-key lineage. Best for schemas with clear parent-to-child hierarchies or linear workflows.'
  },
  {
    id: 'hubs',
    name: 'Central Hubs',
    shortLabel: 'Hubs',
    badge: '2',
    iconName: 'Network',
    tagline: 'Clustered around core tables',
    description: 'Places core high-degree tables at focal centers with related tables grouped tightly around them. Ideal for dense schemas to keep the canvas compact.'
  }
];

export function setAutoArrangeMode(mode) {
  if (mode === 'flow' || mode === 'hubs') {
    state.autoArrangeMode = mode;
    try {
      localStorage.setItem('dbmaps_auto_arrange_mode', mode);
    } catch (e) {}
  }
}

// Helper to compute actual table card height based on current display mode
export function getTableCardHeight(t) {
  if (!t) return 120;
  const { headerHeight } = getTableDimensions(t);
  let colCount = t.columns ? t.columns.length : 1;
  if (state.tableDisplayMode === 'tables') {
    colCount = 0;
  } else if (state.tableDisplayMode === 'keys') {
    const keys = (t.columns || []).filter(c => c.isPk || c.pk || c.isFk || c.fk || c.isUnique || c.unique);
    colCount = keys.length === 0 ? 1 : keys.length;
  }
  return headerHeight + colCount * 33 + 28;
}

// Mode 1: Relationship Flow (Clean Left-to-Right Hierarchy with Compact Dynamic Columns)
function arrangeRelationshipFlow(tables, rels) {
  const tableMap = new Map();
  tables.forEach(t => tableMap.set(t.name.toLowerCase(), t));

  const parentsOf = new Map(); // tables this table references (parents / root entities)
  const childrenOf = new Map(); // tables that reference this table (children / dependents)
  tables.forEach(t => {
    const k = t.name.toLowerCase();
    parentsOf.set(k, new Set());
    childrenOf.set(k, new Set());
  });

  rels.forEach(rel => {
    const childKey = rel.fromTable?.toLowerCase();
    const parentKey = rel.toTable?.toLowerCase();
    if (childKey && parentKey && parentsOf.has(childKey) && parentsOf.has(parentKey) && childKey !== parentKey) {
      parentsOf.get(childKey).add(parentKey);
      childrenOf.get(parentKey).add(childKey);
    }
  });

  // Separate connected tables from isolated tables
  const connected = [];
  const isolated = [];
  tables.forEach(t => {
    const k = t.name.toLowerCase();
    if (parentsOf.get(k).size === 0 && childrenOf.get(k).size === 0) {
      isolated.push(t);
    } else {
      connected.push(t);
    }
  });

  // Determine DAG topological levels: tables with 0 parents start at level 0
  const levels = new Map();
  connected.forEach(t => {
    const k = t.name.toLowerCase();
    levels.set(k, 0);
  });

  let changed = true;
  let passes = 0;
  while (changed && passes < connected.length + 2) {
    changed = false;
    passes++;
    connected.forEach(t => {
      const childKey = t.name.toLowerCase();
      const currentLvl = levels.get(childKey) || 0;
      const parentKeys = parentsOf.get(childKey);
      parentKeys.forEach(pKey => {
        const parentLvl = levels.get(pKey) || 0;
        if (currentLvl <= parentLvl) {
          levels.set(childKey, parentLvl + 1);
          changed = true;
        }
      });
    });
  }

  // Compress level numbers to eliminate any gaps
  const uniqueLevels = Array.from(new Set(connected.map(t => levels.get(t.name.toLowerCase()) || 0))).sort((a, b) => a - b);
  const levelRankMap = new Map();
  uniqueLevels.forEach((lvl, idx) => levelRankMap.set(lvl, idx));
  connected.forEach(t => {
    const k = t.name.toLowerCase();
    levels.set(k, levelRankMap.get(levels.get(k)) || 0);
  });

  // Group connected tables by level
  const levelGroups = new Map();
  connected.forEach(t => {
    const lvl = levels.get(t.name.toLowerCase()) || 0;
    if (!levelGroups.has(lvl)) levelGroups.set(lvl, []);
    levelGroups.get(lvl).push(t);
  });

  // Multi-column folding: if a level has more than 4 tables, fold it into adjacent sub-columns
  // to avoid gigantic 3000px vertical poles
  const sortedLevels = Array.from(levelGroups.keys()).sort((a, b) => a - b);
  const visualColumns = [];
  const MAX_PER_SUBCOL = 4;

  sortedLevels.forEach(lvl => {
    const group = levelGroups.get(lvl) || [];
    if (group.length <= MAX_PER_SUBCOL) {
      visualColumns.push(group);
    } else {
      for (let i = 0; i < group.length; i += MAX_PER_SUBCOL) {
        visualColumns.push(group.slice(i, i + MAX_PER_SUBCOL));
      }
    }
  });

  const posMap = new Map();
  let curX = 50;
  const COL_GAP = 120; // Generous horizontal table gap for multi-track relation highways
  const ROW_GAP = 60;  // Generous vertical table gap for cross-table relation bridges

  visualColumns.forEach((colTables) => {
    // Sort tables by barycenter (average Y position of connected tables)
    colTables.sort((a, b) => {
      const aN = [...parentsOf.get(a.name.toLowerCase()), ...childrenOf.get(a.name.toLowerCase())];
      const bN = [...parentsOf.get(b.name.toLowerCase()), ...childrenOf.get(b.name.toLowerCase())];
      const aAvgY = aN.length ? aN.reduce((sum, k) => sum + (posMap.get(k)?.y || 0), 0) / aN.length : 300;
      const bAvgY = bN.length ? bN.reduce((sum, k) => sum + (posMap.get(k)?.y || 0), 0) / bN.length : 300;
      return aAvgY - bAvgY || a.name.localeCompare(b.name);
    });

    const colWidth = Math.max(...colTables.map(t => getTableDimensions(t).width));
    let curY = 40;
    colTables.forEach(t => {
      posMap.set(t.name.toLowerCase(), { x: curX, y: curY });
      curY += getTableCardHeight(t) + ROW_GAP;
    });
    curX += colWidth + COL_GAP;
  });

  // Place isolated tables in a neat compact 2-column or 3-column grid
  if (isolated.length > 0) {
    let isoX = curX;
    let isoY = 40;
    isolated.forEach(t => {
      const w = getTableDimensions(t).width;
      const h = getTableCardHeight(t);
      posMap.set(t.name.toLowerCase(), { x: isoX, y: isoY });
      isoY += h + ROW_GAP;
      if (isoY > 700) {
        isoX += w + COL_GAP;
        isoY = 40;
      }
    });
  }

  // Apply positions
  tables.forEach(t => {
    const pos = posMap.get(t.name.toLowerCase());
    if (pos) {
      t.x = Math.round(pos.x);
      t.y = Math.round(pos.y);
    }
  });

  // Final AABB separation guarantee for Flow layout
  resolveAABBOverlaps(tables, 100, 50);
}

// AABB Collision & Overlap Resolver: iteratively separates any overlapping table bounding boxes
// guaranteeing generous clearance margins (100px horizontal, 50px vertical) and zero overlap.
export function resolveAABBOverlaps(tables, minClearanceX = 100, minClearanceY = 50, maxIterations = 40) {
  if (!tables || tables.length <= 1) return;
  let hasOverlap = true;
  let iter = 0;

  while (hasOverlap && iter < maxIterations) {
    hasOverlap = false;
    iter++;

    for (let i = 0; i < tables.length; i++) {
      for (let j = i + 1; j < tables.length; j++) {
        const t1 = tables[i];
        const t2 = tables[j];
        const w1 = getTableDimensions(t1).width;
        const h1 = getTableCardHeight(t1);
        const w2 = getTableDimensions(t2).width;
        const h2 = getTableCardHeight(t2);

        const overlapX = Math.min(t1.x + w1, t2.x + w2) - Math.max(t1.x, t2.x) + minClearanceX;
        const overlapY = Math.min(t1.y + h1, t2.y + h2) - Math.max(t1.y, t2.y) + minClearanceY;

        if (overlapX > 0 && overlapY > 0) {
          hasOverlap = true;
          // Separating Axis Theorem: separate along the axis of minimal penetration
          // to preserve the clean 2D layout and avoid cascading shifts
          if (overlapX <= overlapY) {
            // Horizontal separation
            const shift = Math.ceil(overlapX / 2);
            if (t1.x <= t2.x) {
              t1.x -= shift;
              t2.x += shift;
            } else {
              t1.x += shift;
              t2.x -= shift;
            }
          } else {
            // Vertical separation
            const shift = Math.ceil(overlapY / 2);
            if (t1.y <= t2.y) {
              t1.y -= shift;
              t2.y += shift;
            } else {
              t1.y += shift;
              t2.y -= shift;
            }
          }
        }
      }
    }
  }

  // Diagram Boundary Normalization: ensure diagram starts cleanly at suitable boundary margins (x: 50, y: 40)
  let minX = Infinity, minY = Infinity;
  tables.forEach(t => {
    minX = Math.min(minX, t.x);
    minY = Math.min(minY, t.y);
  });
  if (isFinite(minX) && isFinite(minY)) {
    const shiftX = 50 - minX;
    const shiftY = 40 - minY;
    tables.forEach(t => {
      t.x = Math.round(t.x + shiftX);
      t.y = Math.round(t.y + shiftY);
    });
  }
}

// Mode 2: Central Hubs (Clustered around core tables with compact 2D orbital layout and guaranteed 0 overlap)
function arrangeCentralHubs(tables, rels) {
  if (!tables || tables.length === 0) return;

  const tableMap = new Map();
  tables.forEach(t => tableMap.set(t.name.toLowerCase(), t));

  const degreeMap = new Map();
  const adjMap = new Map();
  const parentsOf = new Map();
  const childrenOf = new Map();

  tables.forEach(t => {
    const k = t.name.toLowerCase();
    degreeMap.set(k, 0);
    adjMap.set(k, new Set());
    parentsOf.set(k, new Set());
    childrenOf.set(k, new Set());
  });

  rels.forEach(r => {
    const f = r.fromTable?.toLowerCase();
    const t = r.toTable?.toLowerCase();
    if (f && t && f !== t && tableMap.has(f) && tableMap.has(t)) {
      degreeMap.set(f, degreeMap.get(f) + 1);
      degreeMap.set(t, degreeMap.get(t) + 1);
      adjMap.get(f).add(t);
      adjMap.get(t).add(f);
      parentsOf.get(f).add(t);
      childrenOf.get(t).add(f);
    }
  });

  const isolated = tables.filter(t => degreeMap.get(t.name.toLowerCase()) === 0);
  const connected = tables.filter(t => degreeMap.get(t.name.toLowerCase()) > 0);

  if (connected.length === 0) {
    // All tables isolated, arrange in a clean compact grid with suitable boundary & gaps
    let gridX = 50, gridY = 40;
    tables.forEach((t, i) => {
      t.x = gridX;
      t.y = gridY;
      gridX += getTableDimensions(t).width + 42;
      if ((i + 1) % 3 === 0) {
        gridX = 50;
        gridY += getTableCardHeight(t) + 24;
      }
    });
    return;
  }

  // Sort connected tables by degree descending
  connected.sort((a, b) => degreeMap.get(b.name.toLowerCase()) - degreeMap.get(a.name.toLowerCase()));
  const maxDegree = degreeMap.get(connected[0].name.toLowerCase());

  // Determine Hub count: maintain compact clusters rather than wide horizontal expansions
  let maxHubs = 1;
  if (connected.length >= 14 && maxDegree >= 3) maxHubs = 3;
  else if (connected.length >= 8 && maxDegree >= 3) maxHubs = 2;

  const hubThreshold = Math.max(2, Math.floor(maxDegree * 0.65));
  let hubs = connected.filter(t => degreeMap.get(t.name.toLowerCase()) >= hubThreshold).slice(0, maxHubs);
  if (hubs.length === 0) hubs = [connected[0]];
  const hubKeys = new Set(hubs.map(h => h.name.toLowerCase()));

  const posMap = new Map();
  const GAP_X = 110;
  const ROW_GAP = 54;

  // Partition non-hub tables into bridge tables or hub satellites
  const satellitesByHub = new Map();
  hubs.forEach(h => satellitesByHub.set(h.name.toLowerCase(), []));
  const bridgeTables = [];

  connected.forEach(t => {
    const k = t.name.toLowerCase();
    if (hubKeys.has(k)) return;

    const connectedHubs = Array.from(adjMap.get(k) || []).filter(hKey => hubKeys.has(hKey));
    if (connectedHubs.length >= 2) {
      bridgeTables.push({ table: t, hubs: connectedHubs.slice(0, 2) });
    } else if (connectedHubs.length === 1) {
      satellitesByHub.get(connectedHubs[0]).push(t);
    } else {
      // Indirect satellite: associate with closest hub
      let bestHub = hubs[0].name.toLowerCase();
      hubs.forEach(h => {
        const hKey = h.name.toLowerCase();
        if (adjMap.get(k)?.has(hKey)) bestHub = hKey;
      });
      satellitesByHub.get(bestHub).push(t);
    }
  });

  // Calculate balanced cluster layout for each hub with compact 24px vertical gaps
  let currentClusterX = 50;
  hubs.forEach((hub) => {
    const hubKey = hub.name.toLowerCase();
    const sats = satellitesByHub.get(hubKey) || [];
    const hubDim = getTableDimensions(hub);
    const hubH = getTableCardHeight(hub);

    // Split satellites into Left Wing (parents/lookups), Right Wing (children/dependents),
    // and Top/Bottom overflow if any wing has > 2 tables
    const leftSats = [];
    const rightSats = [];
    const topSats = [];
    const bottomSats = [];

    sats.forEach(sat => {
      const sKey = sat.name.toLowerCase();
      if (parentsOf.get(hubKey)?.has(sKey)) {
        leftSats.push(sat);
      } else if (childrenOf.get(hubKey)?.has(sKey)) {
        rightSats.push(sat);
      } else {
        if (leftSats.length <= rightSats.length) leftSats.push(sat);
        else rightSats.push(sat);
      }
    });

    // Balance wings
    while (leftSats.length > 2 && rightSats.length < 2) {
      rightSats.push(leftSats.pop());
    }
    while (rightSats.length > 2 && leftSats.length < 2) {
      leftSats.push(rightSats.pop());
    }

    // Overflow to top/bottom if either wing has more than 2 tables
    if (leftSats.length > 2) topSats.push(leftSats.pop());
    if (rightSats.length > 2) bottomSats.push(rightSats.pop());
    if (leftSats.length > 2) bottomSats.push(leftSats.pop());
    if (rightSats.length > 2) topSats.push(rightSats.pop());

    const maxLeftW = leftSats.length ? Math.max(...leftSats.map(t => getTableDimensions(t).width)) : 0;
    const maxRightW = rightSats.length ? Math.max(...rightSats.map(t => getTableDimensions(t).width)) : 0;
    const maxTopH = topSats.length ? Math.max(...topSats.map(t => getTableCardHeight(t))) : 0;

    const totalLeftH = leftSats.reduce((sum, t) => sum + getTableCardHeight(t) + ROW_GAP, 0) - (leftSats.length ? ROW_GAP : 0);
    const totalRightH = rightSats.reduce((sum, t) => sum + getTableCardHeight(t) + ROW_GAP, 0) - (rightSats.length ? ROW_GAP : 0);
    const maxWingH = Math.max(hubH, totalLeftH, totalRightH);

    const hubX = currentClusterX + (leftSats.length ? maxLeftW + GAP_X : 0);
    const hubY = 40 + (topSats.length ? maxTopH + ROW_GAP : 0) + Math.max(0, (maxWingH - hubH) / 2);

    posMap.set(hubKey, { x: hubX, y: hubY });

    // Position Left Wing (vertically centered relative to maxWingH with exact ROW_GAP = 24px)
    let leftY = hubY + (hubH - totalLeftH) / 2;
    leftSats.forEach(sat => {
      const sw = getTableDimensions(sat).width;
      const sh = getTableCardHeight(sat);
      posMap.set(sat.name.toLowerCase(), { x: hubX - sw - GAP_X, y: Math.round(leftY) });
      leftY += sh + ROW_GAP;
    });

    // Position Right Wing (vertically centered relative to maxWingH with exact ROW_GAP = 24px)
    let rightY = hubY + (hubH - totalRightH) / 2;
    rightSats.forEach(sat => {
      const sh = getTableCardHeight(sat);
      posMap.set(sat.name.toLowerCase(), { x: hubX + hubDim.width + GAP_X, y: Math.round(rightY) });
      rightY += sh + ROW_GAP;
    });

    // Position Top Satellite (neatly centered above hub with exact ROW_GAP = 24px)
    topSats.forEach(sat => {
      const sw = getTableDimensions(sat).width;
      const sh = getTableCardHeight(sat);
      posMap.set(sat.name.toLowerCase(), {
        x: Math.round(hubX + (hubDim.width - sw) / 2),
        y: Math.round(hubY - sh - ROW_GAP)
      });
    });

    // Position Bottom Satellite (neatly centered below hub with exact ROW_GAP = 24px)
    bottomSats.forEach(sat => {
      const sw = getTableDimensions(sat).width;
      posMap.set(sat.name.toLowerCase(), {
        x: Math.round(hubX + (hubDim.width - sw) / 2),
        y: Math.round(hubY + hubH + ROW_GAP)
      });
    });

    currentClusterX = hubX + hubDim.width + (rightSats.length ? GAP_X + maxRightW : 0) + 72;
  });

  // Position bridge tables in center corridor between their hubs with exact ROW_GAP = 44px
  if (bridgeTables.length > 0 && hubs.length >= 2) {
    const p1 = posMap.get(hubs[0].name.toLowerCase());
    const p2 = posMap.get(hubs[1].name.toLowerCase());
    if (p1 && p2) {
      const midX = Math.round((p1.x + getTableDimensions(hubs[0]).width + p2.x) / 2);
      const totalBridgeH = bridgeTables.reduce((sum, b) => sum + getTableCardHeight(b.table) + ROW_GAP, 0) - ROW_GAP;
      let bridgeY = Math.round((p1.y + p2.y) / 2 - totalBridgeH / 2);
      bridgeTables.forEach(({ table }) => {
        const bw = getTableDimensions(table).width;
        posMap.set(table.name.toLowerCase(), {
          x: Math.round(midX - bw / 2),
          y: Math.round(bridgeY)
        });
        bridgeY += getTableCardHeight(table) + ROW_GAP;
      });
    }
  }

  // Apply positions to connected tables
  connected.forEach(t => {
    const p = posMap.get(t.name.toLowerCase());
    if (p) {
      t.x = Math.round(p.x);
      t.y = Math.round(p.y);
    }
  });

  // Position isolated tables in a clean compact grid below connected tables
  if (isolated.length > 0) {
    const maxConnectedY = Math.max(...connected.map(t => t.y + getTableCardHeight(t)));
    let isoX = 50;
    let isoY = maxConnectedY + 36;
    isolated.forEach((t, i) => {
      t.x = isoX;
      t.y = isoY;
      isoX += getTableDimensions(t).width + 50;
      if ((i + 1) % 3 === 0) {
        isoX = 50;
        isoY += getTableCardHeight(t) + 36;
      }
    });
  }

  // Final AABB Collision & Overlap Resolver with zero overlap guarantee
  resolveAABBOverlaps(tables, 100, 50);
}

// Auto Arrange / Auto Layout Tables (supports 'flow' and 'hubs')
export function autoArrangeTables(mode = null) {
  const proj = activeProject.value;
  if (!proj || !proj.tables || proj.tables.length === 0) return;

  const targetMode = mode || state.autoArrangeMode || 'flow';
  setAutoArrangeMode(targetMode);

  const tables = proj.tables;
  const rels = proj.relationships || [];

  if (targetMode === 'hubs') {
    arrangeCentralHubs(tables, rels);
  } else {
    arrangeRelationshipFlow(tables, rels);
  }

  proj.updatedAt = new Date().toISOString();
  saveGuestProjectsToStorage();
  syncActiveProjectToFirestore();

  const modeInfo = AUTO_ARRANGE_MODES.find(m => m.id === targetMode) || AUTO_ARRANGE_MODES[0];
  addToast(
    `Auto Arranged (${modeInfo.name})`,
    `Organized ${tables.length} tables cleanly in compact ${modeInfo.shortLabel.toLowerCase()} layout.`,
    'success'
  );
}


// Update Table Header Color
export function updateTableHeaderColor(tableId, color) {
  const proj = activeProject.value;
  if (!proj) return;
  const tbl = proj.tables.find(t => t.id === tableId);
  if (tbl) {
    tbl.headerColor = color;
    tbl.hasExplicitHeaderColor = Boolean(color);

    if (!proj.customDbml) {
      proj.customDbml = generateDBML(
        proj.tables || [],
        proj.relationships || [],
        proj.name,
        {
          enums: proj.enums || [],
          tableGroups: proj.tableGroups || [],
          projectConfig: proj.projectConfig || null
        }
      );
    }
    if (proj.customDbml) {
      proj.customDbml = updateTableHeaderColorInDBML(proj.customDbml, tbl.name, color);
    }

    proj.updatedAt = new Date().toISOString();
    saveGuestProjectsToStorage();
  }
}

// Update Table Note
export function updateTableNote(tableId, note) {
  const proj = activeProject.value;
  if (!proj) return;
  const tbl = proj.tables.find(t => t.id === tableId);
  if (tbl) {
    tbl.note = extractCleanNote(note);
    proj.updatedAt = new Date().toISOString();
  }
}

// Update Column Note
export function updateColumnNote(tableId, colIndex, note) {
  const proj = activeProject.value;
  if (!proj) return;
  const tbl = proj.tables.find(t => t.id === tableId);
  if (tbl && tbl.columns[colIndex]) {
    tbl.columns[colIndex].note = extractCleanNote(note);
    proj.updatedAt = new Date().toISOString();
  }
}

// Add Table
export function addTable(tableData) {
  const proj = activeProject.value;
  if (!proj) return;

  const newTable = {
    id: 'tbl-' + Math.random().toString(36).substring(2, 9),
    name: tableData.name || 'new_table',
    headerColor: tableData.headerColor || '#3b82f6',
    x: tableData.x || 100 + Math.random() * 200,
    y: tableData.y || 100 + Math.random() * 200,
    note: tableData.note || '',
    columns: tableData.columns || [
      { name: 'id', type: 'integer', isPk: true, isFk: false, isNull: false, isUnique: true, note: 'Auto primary key' }
    ]
  };

  proj.tables.push(newTable);
  proj.updatedAt = new Date().toISOString();
  state.selectedTableId = newTable.id;
  saveGuestProjectsToStorage();
  syncActiveProjectToFirestore();
  addToast('Table Added', `Created table "${newTable.name}"`, 'success');
}

// Delete Table
export function deleteTable(tableId) {
  const proj = activeProject.value;
  if (!proj) return;
  const tblIndex = proj.tables.findIndex(t => t.id === tableId || t.name === tableId);
  if (tblIndex !== -1) {
    const tblName = proj.tables[tblIndex].name;
    proj.tables.splice(tblIndex, 1);
    proj.relationships = proj.relationships.filter(
      r => r.fromTable !== tblName && r.toTable !== tblName
    );
    if (state.selectedTableId === tableId || state.selectedTableId === tblName) {
      state.selectedTableId = null;
    }
    proj.updatedAt = new Date().toISOString();
    saveGuestProjectsToStorage();
    syncActiveProjectToFirestore();
    addToast('Table Removed', `Deleted table "${tblName}"`, 'warning');
  }
}

// Focus / Center Table on Canvas (used by Ctrl+Click in Editor and navigation)
export function focusTableOnCanvas(tableNameOrId) {
  const proj = activeProject.value;
  if (!proj || !proj.tables) return;
  const targetClean = String(tableNameOrId || '').toLowerCase().replace(/^["']|["']$/g, '');
  const tbl = proj.tables.find(t => 
    t.id === tableNameOrId || 
    t.name.toLowerCase() === targetClean
  );
  if (!tbl) return;

  state.selectedTableId = tbl.id;
  state.selectedRelId = null;

  // Center table in canvas viewport
  const canvasEl = document.getElementById('canvas-container');
  const viewportWidth = canvasEl ? canvasEl.clientWidth : (window.innerWidth / 2);
  const viewportHeight = canvasEl ? canvasEl.clientHeight : window.innerHeight;

  const zoom = state.zoomLevel || 1.0;
  state.panOffset = {
    x: Math.round(viewportWidth / 2 - (tbl.x + 120) * zoom),
    y: Math.round(viewportHeight / 2 - (tbl.y + 100) * zoom)
  };

  addToast('Table Focused', `Jumped to "${tbl.name}" on canvas`, 'info');
}

// Add Column
export function addColumn(tableId, colData) {
  const proj = activeProject.value;
  if (!proj) return;
  const tbl = proj.tables.find(t => t.id === tableId || t.name === tableId);
  if (tbl) {
    tbl.columns.push({
      name: colData.name || 'new_column',
      type: colData.type || 'varchar(255)',
      isPk: colData.isPk || false,
      isFk: colData.isFk || false,
      isNull: colData.isNull ?? true,
      isUnique: colData.isUnique || false,
      note: colData.note || ''
    });
    proj.updatedAt = new Date().toISOString();
    saveGuestProjectsToStorage();
    syncActiveProjectToFirestore();
  }
}

// Delete Column
export function deleteColumn(tableId, colIndex) {
  const proj = activeProject.value;
  if (!proj) return;
  const tbl = proj.tables.find(t => t.id === tableId || t.name === tableId);
  if (tbl && tbl.columns[colIndex]) {
    tbl.columns.splice(colIndex, 1);
    proj.updatedAt = new Date().toISOString();
    saveGuestProjectsToStorage();
    syncActiveProjectToFirestore();
  }
}

// Add Relationship
export function addRelationship(relData) {
  const proj = activeProject.value;
  if (!proj) return;

  const isOptional = relData.optional === true || (relData.operator && relData.operator.includes('?'));
  let operator = relData.operator;
  if (!operator) {
    if (relData.cardinality === '1:1') operator = isOptional ? '-?' : '-';
    else if (relData.cardinality === 'N:M') operator = isOptional ? '<>?' : '<>';
    else operator = isOptional ? '>?' : '>';
  }

  const newRel = {
    id: 'rel-' + Math.random().toString(36).substring(2, 9),
    fromTable: relData.fromTable,
    fromColumn: relData.fromColumn,
    toTable: relData.toTable,
    toColumn: relData.toColumn,
    cardinality: relData.cardinality || '1:N',
    operator,
    optional: isOptional,
    onDelete: relData.onDelete || 'CASCADE'
  };

  const tbl = proj.tables.find(t => t.name === relData.fromTable);
  if (tbl) {
    const col = tbl.columns.find(c => c.name === relData.fromColumn);
    if (col) {
      col.isFk = true;
      if (isOptional && !col.isNull) {
        col.isNull = true;
      }
    }
  }

  proj.relationships.push(newRel);
  proj.updatedAt = new Date().toISOString();
  saveGuestProjectsToStorage();
  syncActiveProjectToFirestore();
  addToast('Relationship Linked', `${relData.fromTable}.${relData.fromColumn} ${operator} ${relData.toTable}.${relData.toColumn}`, 'success');
}

// Update Relationship
export function updateRelationship(relId, updates) {
  const proj = activeProject.value;
  if (!proj) return;
  const rel = proj.relationships.find(r => r.id === relId);
  if (rel) {
    Object.assign(rel, updates);
    proj.updatedAt = new Date().toISOString();
    saveGuestProjectsToStorage();
    syncActiveProjectToFirestore();
  }
}

// Toggle Relationship Optional (>? vs >)
export function toggleRelationshipOptional(relId) {
  const proj = activeProject.value;
  if (!proj) return;
  const rel = proj.relationships.find(r => r.id === relId);
  if (!rel) return;

  const currentOptional = rel.optional === true || (rel.operator && rel.operator.includes('?'));
  const nextOptional = !currentOptional;
  rel.optional = nextOptional;

  if (nextOptional) {
    if (!rel.operator || !rel.operator.includes('?')) {
      rel.operator = rel.cardinality === '1:1' ? '-?' : rel.cardinality === 'N:M' ? '<>?' : '>?';
    }
  } else {
    if (rel.operator) {
      rel.operator = rel.operator.replace(/\?/g, '');
    }
    if (!rel.operator) {
      rel.operator = rel.cardinality === '1:1' ? '-' : rel.cardinality === 'N:M' ? '<>' : '>';
    }
  }

  // Also update column isNull if appropriate
  const tbl = proj.tables.find(t => t.name.toLowerCase() === rel.fromTable.toLowerCase());
  if (tbl) {
    const col = tbl.columns.find(c => c.name.toLowerCase() === rel.fromColumn.toLowerCase());
    if (col && nextOptional) {
      col.isNull = true;
    }
  }

  proj.updatedAt = new Date().toISOString();
  saveGuestProjectsToStorage();
  syncActiveProjectToFirestore();
  addToast('Relationship Updated', nextOptional ? 'Set to Optional FK (>? 0..N)' : 'Set to Mandatory FK (> 1:N)', 'info');
}

// Delete Relationship
export function deleteRelationship(relId) {
  const proj = activeProject.value;
  if (!proj) return;
  const idx = proj.relationships.findIndex(r => r.id === relId);
  if (idx !== -1) {
    proj.relationships.splice(idx, 1);
    proj.updatedAt = new Date().toISOString();
    saveGuestProjectsToStorage();
    syncActiveProjectToFirestore();
    addToast('Relationship Removed', 'Foreign key deleted', 'info');
  }
}

// Table Display Mode on Canvas ('all' | 'tables' | 'keys' - dbdiagram.io pro feature)
export function setTableDisplayMode(mode) {
  if (['all', 'tables', 'keys'].includes(mode)) {
    state.tableDisplayMode = mode;
    try {
      localStorage.setItem('dbmaps_table_display_mode', mode);
    } catch (e) {}
    const labels = {
      all: 'All fields',
      tables: 'Tables only',
      keys: 'Keys only'
    };
    addToast('Table View Changed', `Displaying: ${labels[mode]}`, 'info');
  }
}

// Show or Hide Optional Relationship Lines on Canvas (e.g. audit columns, >?, nullable foreign keys)
export function setShowOptionalRelationships(show) {
  state.showOptionalRelationships = Boolean(show);
  try {
    localStorage.setItem('dbmaps_show_optional_relationships', String(state.showOptionalRelationships));
  } catch (e) {}
  addToast(
    state.showOptionalRelationships ? 'Optional Lines Shown' : 'Optional Lines Hidden',
    state.showOptionalRelationships ? 'Displaying all relationship and audit lines' : 'Hiding optional and audit relationship lines',
    'info'
  );
}

export function toggleShowOptionalRelationships() {
  setShowOptionalRelationships(!state.showOptionalRelationships);
}

// Check if a relationship is optional (nullable/optional >?, ?>, -?, <? , <>?)
export function isOptionalRelationship(rel, tables = null) {
  if (!rel) return false;

  // 1. Explicit optional flag or operator containing '?'
  if (rel.optional === true || rel.isOptional === true) return true;
  if (typeof rel.operator === 'string' && rel.operator.includes('?')) return true;
  if (typeof rel.cardinality === 'string' && (rel.cardinality.includes('?') || rel.cardinality.includes('0..'))) return true;

  // 2. Check inline ref definition on fromTable column
  if (tables && rel.fromTable && rel.fromColumn) {
    const fromTbl = Array.isArray(tables)
      ? tables.find(t =>
          t.name?.toLowerCase() === rel.fromTable?.toLowerCase() ||
          (t.schema && `${t.schema}.${t.name}`.toLowerCase() === rel.fromTable?.toLowerCase()) ||
          (rel.fromTable && rel.fromTable.toLowerCase().endsWith('.' + t.name?.toLowerCase()))
        )
      : tables;
    if (fromTbl && fromTbl.columns) {
      const col = fromTbl.columns.find(c =>
        c.name?.toLowerCase().replace(/["'`]/g, '') === rel.fromColumn?.toLowerCase().replace(/["'`]/g, '')
      );
      if (col && col.inlineRef) {
        if (col.inlineRef.optional === true || (typeof col.inlineRef.operator === 'string' && col.inlineRef.operator.includes('?'))) {
          return true;
        }
      }
    }
  }

  return false;
}

// Create Commit Snapshot (Version Control)
export function createCommit(versionName, description) {
  const proj = activeProject.value;
  if (!proj) return;
  if (!proj.history) proj.history = [];

  const commit = {
    id: 'v-' + Date.now(),
    versionName: versionName || `v1.${proj.history.length}`,
    description: description || 'Schema state checkpoint',
    createdAt: new Date().toISOString(),
    author: state.currentUser.name || 'Developer',
    tablesCount: proj.tables.length,
    relationshipsCount: proj.relationships.length,
    snapshotTables: JSON.parse(JSON.stringify(proj.tables)),
    snapshotRelationships: JSON.parse(JSON.stringify(proj.relationships))
  };

  proj.history.unshift(commit);
  proj.updatedAt = new Date().toISOString();
  syncActiveProjectToFirestore();
  addToast('Snapshot Saved', `Created release checkpoint "${commit.versionName}"`, 'success');
}

// Delete Commit Snapshot
export function deleteCommit(commitId) {
  const proj = activeProject.value;
  if (!proj || !proj.history) return;
  const idx = proj.history.findIndex(h => h.id === commitId);
  if (idx !== -1) {
    const vName = proj.history[idx].versionName;
    proj.history.splice(idx, 1);
    proj.updatedAt = new Date().toISOString();
    syncActiveProjectToFirestore();
    addToast('Version Removed', `Deleted checkpoint "${vName}"`, 'info');
  }
}

// Restore Commit Snapshot
export function restoreCommit(commitId) {
  const proj = activeProject.value;
  if (!proj || !proj.history) return;
  const commit = proj.history.find(h => h.id === commitId);
  if (commit && commit.snapshotTables) {
    proj.tables = JSON.parse(JSON.stringify(commit.snapshotTables));
    proj.relationships = JSON.parse(JSON.stringify(commit.snapshotRelationships));
    proj.updatedAt = new Date().toISOString();
    syncActiveProjectToFirestore();
    addToast('Version Restored', `Restored schema to "${commit.versionName}"`, 'info');
  }
}

// Update Active Project Target SQL Dialect
export function setProjectDialect(dialect) {
  const proj = activeProject.value;
  if (!proj) return;
  proj.dialect = dialect;
  proj.updatedAt = new Date().toISOString();
  syncActiveProjectToFirestore();
  addToast('Dialect Updated', `Target dialect set to ${dialect.toUpperCase()}`, 'info');
}

// Create New Project
export function createProject(projectName, folderId, description = '', template = null, customAccessMode = null, customPassword = '', dialect = 'postgres') {
  let initialTables = [];
  let initialRelationships = [];

  if (template) {
    const sample = SAMPLE_PROJECTS.find(s => s.name === template || s.id === template);
    if (sample) {
      initialTables = JSON.parse(JSON.stringify(sample.tables || []));
      initialRelationships = JSON.parse(JSON.stringify(sample.relationships || []));
    }
  }

  const isAuth = Boolean(state.currentUser.isLoggedIn && auth.currentUser);
  const currentOwnerUid = isAuth ? auth.currentUser.uid : (state.currentUser.id || 'guest');
  const currentOwnerEmail = state.currentUser.email || (auth.currentUser ? auth.currentUser.email : '') || '';

  // Private (restricted) by default for logged-in accounts; open for guest scratchpad
  const determinedAccessMode = customAccessMode || (isAuth ? 'restricted' : 'public');

  const newProj = {
    id: 'proj-' + Date.now().toString(36),
    folderId: folderId || state.folders[0]?.id || 'folder-1',
    name: projectName,
    description: description || 'Database schema model',
    updatedAt: new Date().toISOString(),
    dialect: dialect || 'postgres',
    accessMode: determinedAccessMode,
    sharePassword: customPassword || '',
    allowedEmails: isAuth && currentOwnerEmail ? [currentOwnerEmail.toLowerCase()] : [],
    tables: initialTables,
    relationships: initialRelationships,
    history: [],
    ownerUid: currentOwnerUid,
    ownerEmail: currentOwnerEmail
  };

  // If user only had the default untouched blank project, replace it
  if (state.projects.length === 1 && isUntouchedBlankStarter(state.projects[0])) {
    state.projects = [newProj];
  } else {
    state.projects.push(newProj);
  }

  selectProject(newProj.id);
  syncActiveProjectToFirestore();
  saveGuestProjectsToStorage();
  addToast('Project Created', `Started "${projectName}" (${determinedAccessMode === 'restricted' ? 'Private' : 'Public'})`, 'success');
  return newProj;
}

// Import MySQL, PostgreSQL, or Microsoft SQL Server (MSSQL) / DBML schema
export function importSchema({ name, script, dialect = 'auto', folderId = null, mode = 'new' }) {
  const result = parseSQLSchema(script, dialect);
  if (!result.tables || result.tables.length === 0) {
    throw new Error('No valid CREATE TABLE definitions found in the script. Please verify your SQL syntax.');
  }

  const effectiveDialect = (result.dialect === 'dbml' || result.dialect === 'auto') ? 'postgres' : result.dialect;
  sanitizeTableColumns(result.tables);

  if (mode === 'merge' && activeProject.value) {
    const proj = activeProject.value;
    proj.tables = result.tables;
    proj.relationships = result.relationships;
    proj.dialect = effectiveDialect;
    proj.updatedAt = new Date().toISOString();
    syncActiveProjectToFirestore();
    addToast('Schema Imported', `Imported ${result.tables.length} table(s) and ${result.relationships.length} relation(s) into "${proj.name}"`, 'success');
    return proj;
  } else {
    const isAuth = Boolean(state.currentUser.isLoggedIn && auth.currentUser);
    const currentOwnerUid = isAuth ? auth.currentUser.uid : (state.currentUser.id || 'guest');
    const currentOwnerEmail = state.currentUser.email || (auth.currentUser ? auth.currentUser.email : '') || '';

    const newProj = {
      id: 'proj-' + Date.now().toString(36),
      folderId: folderId || state.folders[0]?.id || 'folder-1',
      name: name || `${effectiveDialect.toUpperCase()} Imported Schema`,
      description: `Imported from ${effectiveDialect.toUpperCase()} SQL script with ${result.tables.length} tables and ${result.relationships.length} relationships.`,
      updatedAt: new Date().toISOString(),
      dialect: effectiveDialect,
      accessMode: isAuth ? 'restricted' : 'public',
      sharePassword: '',
      allowedEmails: isAuth && currentOwnerEmail ? [currentOwnerEmail.toLowerCase()] : [],
      tables: result.tables,
      relationships: result.relationships,
      history: [],
      ownerUid: currentOwnerUid,
      ownerEmail: currentOwnerEmail
    };

    if (state.projects.length === 1 && isUntouchedBlankStarter(state.projects[0])) {
      state.projects = [newProj];
    } else {
      state.projects.push(newProj);
    }

    selectProject(newProj.id);
    syncActiveProjectToFirestore();
    saveGuestProjectsToStorage();
    addToast('Schema Imported', `Created new schema "${newProj.name}" with ${result.tables.length} table(s)`, 'success');
    return newProj;
  }
}

// Import all sample schemas on explicit user action
export function importSampleSchemas(targetFolderId = null) {
  const currentOwnerUid = (state.currentUser.isLoggedIn && auth.currentUser)
    ? auth.currentUser.uid
    : (state.currentUser.id || 'guest');
  const currentOwnerEmail = state.currentUser.email || '';
  const folder = targetFolderId || state.folders[0]?.id || 'folder-1';

  const importedProjects = SAMPLE_PROJECTS.map((sample, idx) => {
    return {
      id: `sample-${Date.now().toString(36)}-${idx}`,
      folderId: folder,
      name: sample.name,
      description: sample.description,
      updatedAt: new Date().toISOString(),
      dialect: sample.dialect || 'postgres',
      accessMode: 'public',
      allowedEmails: [],
      tables: JSON.parse(JSON.stringify(sample.tables || [])),
      relationships: JSON.parse(JSON.stringify(sample.relationships || [])),
      history: JSON.parse(JSON.stringify(sample.history || [])),
      ownerUid: currentOwnerUid,
      ownerEmail: currentOwnerEmail
    };
  });

  // If user only had the default untouched blank project, replace it
  if (state.projects.length === 1 && isUntouchedBlankStarter(state.projects[0])) {
    state.projects = [...importedProjects];
  } else {
    state.projects.push(...importedProjects);
  }

  if (importedProjects.length > 0) {
    selectProject(importedProjects[0].id);
    if (state.currentUser.isLoggedIn) {
      syncActiveProjectToFirestore();
    }
    saveGuestProjectsToStorage();
  }

  addToast('Sample Schemas Imported', `Loaded ${importedProjects.length} sample templates (E-Commerce & SaaS Billing)`, 'success');
}

// Import a single sample schema by name
export function importSampleSchemaByName(name, targetFolderId = null) {
  const sample = SAMPLE_PROJECTS.find(s => s.name.toLowerCase() === name.toLowerCase()) || SAMPLE_PROJECTS[0];
  if (!sample) return;

  const currentOwnerUid = (state.currentUser.isLoggedIn && auth.currentUser)
    ? auth.currentUser.uid
    : (state.currentUser.id || 'guest');
  const currentOwnerEmail = state.currentUser.email || '';
  const folder = targetFolderId || state.folders[0]?.id || 'folder-1';

  const newProj = {
    id: `sample-${Date.now().toString(36)}`,
    folderId: folder,
    name: sample.name,
    description: sample.description,
    updatedAt: new Date().toISOString(),
    dialect: sample.dialect || 'postgres',
    accessMode: 'public',
    allowedEmails: [],
    tables: JSON.parse(JSON.stringify(sample.tables || [])),
    relationships: JSON.parse(JSON.stringify(sample.relationships || [])),
    history: JSON.parse(JSON.stringify(sample.history || [])),
    ownerUid: currentOwnerUid,
    ownerEmail: currentOwnerEmail
  };

  if (state.projects.length === 1 && isUntouchedBlankStarter(state.projects[0])) {
    state.projects = [newProj];
  } else {
    state.projects.push(newProj);
  }

  selectProject(newProj.id);
  if (state.currentUser.isLoggedIn) {
    syncActiveProjectToFirestore();
  }
  saveGuestProjectsToStorage();
  addToast('Sample Schema Imported', `Loaded "${newProj.name}"`, 'success');
}

// Current user admin check
export const isCurrentUserAdmin = computed(() => {
  const email = (auth.currentUser?.email || state.currentUser.email || '').toLowerCase();
  return email === 'aungkyawminn.aya@gmail.com' || state.userProfile.role === 'admin';
});

// Open Marketplace
export function openMarketplace() {
  state.modals.marketplace = true;
}

// Open Submit to Marketplace Modal
export function openSubmitToMarketplace(projectId = null) {
  state.editingMarketplaceTemplate = null;
  if (projectId) {
    selectProject(projectId);
  }
  state.modals.submitToMarketplace = true;
}

// Open Editor for an existing Marketplace Template (Admin / Author)
export function openEditMarketplaceTemplate(template) {
  if (!template) return;
  state.editingMarketplaceTemplate = JSON.parse(JSON.stringify(template));
  state.modals.submitToMarketplace = true;
}

// Open Creator for an official dbmaps System Blueprint (Admin)
export function openCreateSystemMarketplaceTemplate(projectId = null) {
  if (projectId) {
    selectProject(projectId);
  }
  state.editingMarketplaceTemplate = {
    isSystem: true,
    isNewSystem: true,
    badge: 'dbmaps System',
    isVerified: true,
    authorName: 'dbmaps System',
    authorTitle: 'dbmaps Core Architecture Engine',
    authorAvatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=dbmaps-system'
  };
  state.modals.submitToMarketplace = true;
}

// Close Submit to Marketplace Modal
export function closeSubmitToMarketplace() {
  state.modals.submitToMarketplace = false;
  state.editingMarketplaceTemplate = null;
}

// All Marketplace Templates (dbmaps System Generated + Community Submissions + Overrides)
export const allMarketplaceTemplates = computed(() => {
  const firestoreMap = new Map(state.marketplaceSubmissions.map(s => [s.id, s]));
  
  // Built-in templates from code, dynamically overridden if customized in Firestore
  const mergedBuiltIns = MARKETPLACE_TEMPLATES.map(builtIn => {
    if (firestoreMap.has(builtIn.id)) {
      const override = firestoreMap.get(builtIn.id);
      firestoreMap.delete(builtIn.id);
      return { ...builtIn, ...override, isBuiltIn: true };
    }
    return { ...builtIn, isBuiltIn: true };
  });

  // Dynamic templates created in Firestore (both community and custom dbmaps System blueprints)
  const dynamicSubmissions = Array.from(firestoreMap.values()).map(s => ({
    ...s,
    isBuiltIn: false
  }));

  return [...mergedBuiltIns, ...dynamicSubmissions];
});

// Real-time Firestore Listener for Marketplace Community Submissions & Dynamic System Blueprints
let unsubscribeMarketplace = null;
export function initMarketplaceListener() {
  if (unsubscribeMarketplace) return;

  try {
    state.isMarketplaceLoading = true;
    const q = collection(db, 'marketplace_templates');
    unsubscribeMarketplace = onSnapshot(
      q,
      (snapshot) => {
        state.isMarketplaceLoading = false;
        const submissions = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data && data.name && Array.isArray(data.tables)) {
            let dbml = data.dbml;
            if (!dbml) {
              try {
                dbml = generateDBML(data.tables, data.relationships || []);
              } catch (e) {
                dbml = '';
              }
            }
            const isSystem = !!data.isSystem;
            submissions.push({
              id: data.id || docSnap.id,
              name: data.name,
              slug: data.slug || (data.name || 'custom-schema').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              category: data.category || 'saas',
              complexity: data.complexity || 'Intermediate',
              dialect: data.dialect || 'postgres',
              tier: data.tier || 'free',
              badge: data.badge || (isSystem ? 'dbmaps System' : 'Community'),
              isSystem: isSystem,
              isVerified: isSystem ? true : !!data.isVerified,
              rating: data.rating || 5.0,
              reviewsCount: data.reviewsCount || 1,
              clonesCount: data.clonesCount || 0,
              authorUid: data.authorUid || '',
              authorEmail: data.authorEmail || '',
              author: {
                name: data.authorName || data.author?.name || (isSystem ? 'dbmaps System' : 'Community Architect'),
                title: data.authorTitle || data.author?.title || (isSystem ? 'dbmaps Core Architecture Engine' : 'Community Architect'),
                avatar: data.authorAvatar || data.author?.avatar || (isSystem ? 'https://api.dicebear.com/7.x/identicon/svg?seed=dbmaps-system' : `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(data.authorName || docSnap.id)}`),
                isSystem: isSystem
              },
              description: data.description || (isSystem ? 'Official dbmaps system architecture blueprint' : 'Community submitted database schema'),
              highlights: Array.isArray(data.highlights) && data.highlights.length > 0
                ? data.highlights
                : [
                    `${data.tables.length} structured tables`,
                    `${(data.relationships || []).length} foreign key relationships`,
                    `Engineered for ${data.dialect || 'PostgreSQL'}`
                  ],
              tables: data.tables,
              relationships: data.relationships || [],
              dbml,
              createdAt: data.createdAt || new Date().toISOString(),
              updatedAt: data.updatedAt || new Date().toISOString()
            });
          }
        });

        // Sort newest first
        submissions.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        state.marketplaceSubmissions = submissions;
      },
      (error) => {
        state.isMarketplaceLoading = false;
        if (isFirestoreApiDisabledOrOffline(error)) {
          return;
        }
        console.warn('Marketplace listener note:', error.message || error);
        if (error.code === 'permission-denied') {
          handleFirestoreError(error, 'list', 'marketplace_templates');
        }
      }
    );
  } catch (err) {
    state.isMarketplaceLoading = false;
    console.warn('Failed to initialize marketplace listener:', err);
  }
}

// Auto-initialize real-time public marketplace blueprints and submissions
initMarketplaceListener();

// Submit or Update a User's Project / Database to Marketplace (with Admin System Blueprint support)
export async function submitProjectToMarketplace(formData) {
  const isEditing = !!formData.id || !!formData.templateId;
  const targetTemplateId = formData.id || formData.templateId;

  let existingTpl = null;
  if (isEditing) {
    existingTpl = allMarketplaceTemplates.value.find(t => t.id === targetTemplateId);
  }

  let targetProject = null;
  if (formData.projectId) {
    targetProject = state.projects.find(p => p.id === formData.projectId);
  }
  if (!targetProject && activeProject.value && (!formData.useExistingTables || !existingTpl)) {
    targetProject = activeProject.value;
  }

  let cleanTables = [];
  let cleanRels = [];

  if (formData.useExistingTables && existingTpl && Array.isArray(existingTpl.tables) && existingTpl.tables.length > 0) {
    cleanTables = JSON.parse(JSON.stringify(existingTpl.tables));
    cleanRels = JSON.parse(JSON.stringify(existingTpl.relationships || []));
  } else if (targetProject && Array.isArray(targetProject.tables) && targetProject.tables.length > 0) {
    cleanTables = JSON.parse(JSON.stringify(targetProject.tables));
    cleanRels = JSON.parse(JSON.stringify(targetProject.relationships || []));
  } else if (existingTpl && Array.isArray(existingTpl.tables) && existingTpl.tables.length > 0) {
    cleanTables = JSON.parse(JSON.stringify(existingTpl.tables));
    cleanRels = JSON.parse(JSON.stringify(existingTpl.relationships || []));
  } else {
    throw new Error('Your database blueprint must contain at least 1 table before publishing to Marketplace');
  }

  sanitizeTableColumns(cleanTables);

  let dbmlCode = '';
  try {
    dbmlCode = generateDBML(cleanTables, cleanRels);
  } catch (e) {
    console.warn('Could not generate DBML for marketplace submission:', e);
  }

  const user = auth.currentUser;
  const currentEmail = (user?.email || state.currentUser.email || '').toLowerCase();
  const isAdmin = currentEmail === 'aungkyawminn.aya@gmail.com' || state.userProfile.role === 'admin';
  const isSystem = isAdmin && (formData.isSystem === true || formData.badge === 'dbmaps System');

  const currentUid = (state.currentUser.isLoggedIn && user)
    ? user.uid
    : (state.currentUser.id || 'community-user');

  let authorDisplayName = (formData.authorName || state.currentUser.name || user?.displayName || 'Community Architect').trim();
  let authorTitle = (formData.authorTitle || 'Community Architect').trim();
  let authorAvatar = user?.photoURL || state.currentUser.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(authorDisplayName)}`;

  if (isSystem) {
    authorDisplayName = (formData.authorName || 'dbmaps System').trim();
    authorTitle = (formData.authorTitle || 'dbmaps Core Architecture Engine').trim();
    authorAvatar = (formData.authorAvatar || 'https://api.dicebear.com/7.x/identicon/svg?seed=dbmaps-system').trim();
  }

  const newId = targetTemplateId || (isSystem ? `tpl-${(formData.name || 'system').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Math.random().toString(36).substring(2, 5)}` : `mkt-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`);
  const timestamp = new Date().toISOString();

  // Parse highlights
  let highlights = [];
  if (Array.isArray(formData.highlights)) {
    highlights = formData.highlights.filter(h => h && h.trim().length > 0);
  } else if (typeof formData.highlights === 'string') {
    highlights = formData.highlights.split('\n').map(s => s.trim()).filter(Boolean);
  }
  if (highlights.length === 0) {
    highlights = [
      `${cleanTables.length} relational tables with primary keys and indexes`,
      `${cleanRels.length} relational foreign-key integrity constraints`,
      `Engineered for ${formData.dialect || targetProject?.dialect || existingTpl?.dialect || 'PostgreSQL'}`
    ];
  }

  const templatePayload = {
    id: newId,
    name: (formData.name || targetProject?.name || existingTpl?.name || 'Database Blueprint').trim(),
    slug: (formData.slug || formData.name || targetProject?.name || existingTpl?.name || 'blueprint').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    category: formData.category || existingTpl?.category || 'saas',
    complexity: formData.complexity || existingTpl?.complexity || 'Intermediate',
    dialect: formData.dialect || targetProject?.dialect || existingTpl?.dialect || 'postgres',
    tier: formData.tier || existingTpl?.tier || 'free',
    badge: isSystem ? 'dbmaps System' : (formData.badge || 'Community'),
    isSystem: isSystem,
    isVerified: isSystem ? true : (formData.isVerified !== undefined ? !!formData.isVerified : false),
    rating: existingTpl?.rating || 5.0,
    reviewsCount: existingTpl?.reviewsCount || 1,
    clonesCount: existingTpl?.clonesCount || 0,
    authorUid: isSystem ? 'system' : (existingTpl?.authorUid || currentUid),
    authorEmail: isSystem ? 'system@dbmaps.io' : (existingTpl?.authorEmail || currentEmail),
    authorName: authorDisplayName,
    authorTitle: authorTitle,
    authorAvatar: authorAvatar,
    author: {
      name: authorDisplayName,
      title: authorTitle,
      avatar: authorAvatar,
      isSystem: isSystem
    },
    description: (formData.description || targetProject?.description || existingTpl?.description || 'Database architecture created in dbmaps').trim(),
    highlights,
    tables: cleanTables,
    relationships: cleanRels,
    dbml: dbmlCode,
    createdAt: existingTpl?.createdAt || timestamp,
    updatedAt: timestamp
  };

  try {
    await setDoc(doc(db, 'marketplace_templates', newId), templatePayload, { merge: true });
  } catch (err) {
    console.warn('Marketplace setDoc error:', err);
    if (!isFirestoreApiDisabledOrOffline(err)) {
      handleFirestoreError(err, isEditing ? 'update' : 'create', `marketplace_templates/${newId}`);
    }
  }

  // Ensure local reactive list updates immediately
  const existsIdx = state.marketplaceSubmissions.findIndex(s => s.id === newId);
  if (existsIdx !== -1) {
    state.marketplaceSubmissions[existsIdx] = templatePayload;
  } else {
    state.marketplaceSubmissions.unshift(templatePayload);
  }

  addToast(
    isEditing ? 'Blueprint Updated!' : 'Published to Marketplace!',
    isSystem
      ? `"${templatePayload.name}" is now live as an official dbmaps System Blueprint.`
      : `"${templatePayload.name}" is now live in the dbmaps Community Marketplace.`,
    'success'
  );

  state.modals.submitToMarketplace = false;
  state.editingMarketplaceTemplate = null;
  return templatePayload;
}

// Update an existing Marketplace Blueprint directly (Admin)
export async function updateMarketplaceTemplate(templateId, updates) {
  if (!templateId) throw new Error('Missing template ID');

  const existingTpl = allMarketplaceTemplates.value.find(t => t.id === templateId);
  if (!existingTpl) throw new Error('Template not found');

  const timestamp = new Date().toISOString();
  const payload = {
    id: existingTpl.id,
    name: updates.name !== undefined ? updates.name : existingTpl.name,
    slug: updates.slug !== undefined ? updates.slug : existingTpl.slug,
    category: updates.category !== undefined ? updates.category : existingTpl.category,
    complexity: updates.complexity !== undefined ? updates.complexity : existingTpl.complexity,
    dialect: updates.dialect !== undefined ? updates.dialect : existingTpl.dialect,
    description: updates.description !== undefined ? updates.description : existingTpl.description,
    highlights: updates.highlights !== undefined ? updates.highlights : existingTpl.highlights,
    badge: updates.badge !== undefined ? updates.badge : existingTpl.badge,
    isSystem: updates.isSystem !== undefined ? updates.isSystem : existingTpl.isSystem,
    isVerified: updates.isVerified !== undefined ? updates.isVerified : existingTpl.isVerified,
    authorName: updates.authorName || updates.author?.name || existingTpl.author?.name,
    authorTitle: updates.authorTitle || updates.author?.title || existingTpl.author?.title,
    authorAvatar: updates.authorAvatar || updates.author?.avatar || existingTpl.author?.avatar,
    tables: updates.tables || existingTpl.tables,
    relationships: updates.relationships || existingTpl.relationships || [],
    dbml: updates.dbml || existingTpl.dbml || '',
    author: {
      name: updates.authorName || updates.author?.name || existingTpl.author?.name,
      title: updates.authorTitle || updates.author?.title || existingTpl.author?.title,
      avatar: updates.authorAvatar || updates.author?.avatar || existingTpl.author?.avatar,
      isSystem: updates.isSystem !== undefined ? updates.isSystem : existingTpl.isSystem
    },
    updatedAt: timestamp
  };

  try {
    await setDoc(doc(db, 'marketplace_templates', templateId), payload, { merge: true });
  } catch (err) {
    console.warn('Marketplace update error:', err);
    if (!isFirestoreApiDisabledOrOffline(err)) {
      handleFirestoreError(err, 'update', `marketplace_templates/${templateId}`);
    }
  }

  const idx = state.marketplaceSubmissions.findIndex(s => s.id === templateId);
  if (idx !== -1) {
    state.marketplaceSubmissions[idx] = { ...state.marketplaceSubmissions[idx], ...payload };
  } else {
    state.marketplaceSubmissions.unshift(payload);
  }

  addToast('Template Saved', `"${payload.name}" updated successfully.`, 'success');
  return payload;
}

// Toggle whether a template is an official dbmaps System blueprint (Admin)
export async function toggleTemplateSystemStatus(templateId) {
  const tpl = allMarketplaceTemplates.value.find(t => t.id === templateId);
  if (!tpl) return;

  const nextIsSystem = !tpl.isSystem;
  const nextBadge = nextIsSystem ? 'dbmaps System' : 'Community';

  await updateMarketplaceTemplate(templateId, {
    isSystem: nextIsSystem,
    badge: nextBadge,
    isVerified: nextIsSystem ? true : !!tpl.isVerified,
    authorName: nextIsSystem ? 'dbmaps System' : (tpl.author?.name || 'Community Architect'),
    authorTitle: nextIsSystem ? 'dbmaps Core Architecture Engine' : (tpl.author?.title || 'Community Architect'),
    authorAvatar: nextIsSystem ? 'https://api.dicebear.com/7.x/identicon/svg?seed=dbmaps-system' : (tpl.author?.avatar || '')
  });

  addToast(
    nextIsSystem ? 'Promoted to System' : 'Demoted to Community',
    `"${tpl.name}" is now marked as ${nextBadge}.`,
    'info'
  );
}

// Delete or Unpublish a Marketplace Submission (Author or Admin)
export async function deleteMarketplaceTemplate(templateId) {
  const item = allMarketplaceTemplates.value.find(s => s.id === templateId);
  if (!item) return;

  const currentEmail = (auth.currentUser?.email || state.currentUser.email || '').toLowerCase();
  const isAdminUser = currentEmail === 'aungkyawminn.aya@gmail.com' || state.userProfile.role === 'admin';

  if (item.authorUid !== (auth.currentUser?.uid || state.currentUser.id) && item.authorEmail !== currentEmail && !isAdminUser) {
    addToast('Permission Denied', 'You can only unpublish templates that you submitted.', 'error');
    return;
  }

  try {
    await deleteDoc(doc(db, 'marketplace_templates', templateId));
  } catch (err) {
    console.warn('Marketplace delete error:', err);
    if (!isFirestoreApiDisabledOrOffline(err)) {
      handleFirestoreError(err, 'delete', `marketplace_templates/${templateId}`);
    }
  }

  state.marketplaceSubmissions = state.marketplaceSubmissions.filter(s => s.id !== templateId);
  addToast('Template Removed', `"${item.name}" removed from Marketplace`, 'info');
}

// Clone a template from the Marketplace into user's active workspace
export function cloneMarketplaceTemplate(template, targetFolderId = null) {
  if (!template) return null;

  const currentOwnerUid = (state.currentUser.isLoggedIn && auth.currentUser)
    ? auth.currentUser.uid
    : (state.currentUser.id || 'guest');
  const currentOwnerEmail = state.currentUser.email || '';
  const folder = targetFolderId || state.folders[0]?.id || 'folder-1';

  const clonedTables = JSON.parse(JSON.stringify(template.tables || []));
  sanitizeTableColumns(clonedTables);

  const newProj = {
    id: `tpl-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    folderId: folder,
    name: template.name,
    description: template.description || `Cloned from ${template.name}`,
    updatedAt: new Date().toISOString(),
    dialect: template.dialect || 'postgres',
    accessMode: 'public',
    allowedEmails: [],
    tables: clonedTables,
    relationships: JSON.parse(JSON.stringify(template.relationships || [])),
    history: [
      {
        id: 'v-cloned',
        versionName: 'v1.0 - Template Baseline',
        description: `Cloned from dbmaps Marketplace: ${template.name}`,
        createdAt: new Date().toISOString(),
        author: template.author?.name || 'dbmaps Community',
        tablesCount: clonedTables.length,
        relationshipsCount: (template.relationships || []).length
      }
    ],
    ownerUid: currentOwnerUid,
    ownerEmail: currentOwnerEmail
  };

  if (state.projects.length === 1 && isUntouchedBlankStarter(state.projects[0])) {
    state.projects = [newProj];
  } else {
    state.projects.push(newProj);
  }

  selectProject(newProj.id);
  if (state.currentUser.isLoggedIn) {
    syncActiveProjectToFirestore();
  }
  saveGuestProjectsToStorage();

  // If this was a community-submitted template, record clone count in Firestore
  if (!template.isSystem && template.id && template.id.startsWith('mkt-')) {
    try {
      const docRef = doc(db, 'marketplace_templates', template.id);
      const newClonesCount = (template.clonesCount || 0) + 1;
      template.clonesCount = newClonesCount;
      updateDoc(docRef, { clonesCount: newClonesCount }).catch(() => {});
    } catch (e) {
      console.warn('Could not increment clone count:', e);
    }
  }

  addToast('Template Cloned', `Cloned "${template.name}" with ${clonedTables.length} tables & ${(template.relationships || []).length} relations.`, 'success');

  state.modals.marketplace = false;
  if (state.currentRoute !== '/app') {
    navigateTo('/app');
  }

  return newProj;
}

// Delete Project
export async function deleteProject(projectId) {
  const idx = state.projects.findIndex(p => p.id === projectId);
  if (idx !== -1) {
    const targetProj = state.projects[idx];
    const isOwner = Boolean(
      !targetProj.ownerUid ||
      targetProj.ownerUid === 'guest' ||
      (auth.currentUser && targetProj.ownerUid === auth.currentUser.uid) ||
      checkIsCurrentUserAdmin()
    );

    const projName = targetProj.name || 'Untitled Schema';
    const isSharedWithMe = Boolean(targetProj.isSharedWithMe);

    // 1. Record in deleted IDs set so it can NEVER resurrect
    recordDeletedProjectId(projectId);

    // 2. Remove from local store
    state.projects.splice(idx, 1);

    // 3. Clean local storage caches
    try {
      delete lastSyncedHashes[projectId];
      localStorage.removeItem('dbmaps_local_schema_' + projectId);
      saveGuestProjectsToStorage();
    } catch (e) {}

    // 4. Update active project
    if (state.activeProjectId === projectId) {
      if (state.projects.length > 0) {
        state.activeProjectId = state.projects[0].id;
        state.roomCode = state.projects[0].id;
      } else {
        const currentOwnerUid = (state.currentUser.isLoggedIn && auth.currentUser)
          ? auth.currentUser.uid
          : 'guest';
        const currentOwnerEmail = state.currentUser.email || '';
        const fallbackFolderId = state.folders[0]?.id || 'folder-1';
        const fresh = {
          id: 'proj-' + Date.now().toString(36),
          folderId: fallbackFolderId,
          name: 'New Database',
          description: 'New database schema model',
          updatedAt: new Date().toISOString(),
          dialect: 'postgres',
          accessMode: currentOwnerUid === 'guest' ? 'public' : 'restricted',
          sharePassword: '',
          allowedEmails: [],
          tables: [],
          relationships: [],
          history: [],
          ownerUid: currentOwnerUid,
          ownerEmail: currentOwnerEmail,
          isStarterProject: true
        };
        state.projects.push(fresh);
        state.activeProjectId = fresh.id;
        state.roomCode = fresh.id;
        saveGuestProjectsToStorage();
      }
    }

    // 5. Collaborators can remove the project from their workspace without deleting the owner's source
    if (isSharedWithMe || !isOwner) {
      addToast('Removed from Workspace', `Removed shared schema "${projName}" from your workspace`, 'info');
      return;
    }

    // 6. Delete from Firestore permanently
    try {
      await deleteDoc(doc(db, 'projects', projectId));
      addToast('Database Schema Deleted', `Permanently removed "${projName}"`, 'info');
    } catch (e) {
      console.warn('Delete project error:', e.message);
      if (isFirestoreApiDisabledOrOffline(e)) {
        return;
      }
      if (e.code === 'permission-denied') {
        handleFirestoreError(e, 'delete', `projects/${projectId}`);
      }
    }
  }
}

// Create New Database
export function createFolder(folderName) {
  const newFolder = {
    id: 'folder-' + Date.now(),
    name: folderName.trim() || 'New Database',
    icon: 'Database'
  };
  state.folders.push(newFolder);
  saveFoldersToStorage();
  addToast('Database Created', `Created database "${newFolder.name}"`, 'success');
  return newFolder;
}

// Rename Database
export function renameFolder(folderId, newName) {
  const folder = state.folders.find(f => f.id === folderId);
  if (folder && newName.trim()) {
    const old = folder.name;
    folder.name = newName.trim();
    saveFoldersToStorage();
    addToast('Database Renamed', `Renamed "${old}" to "${folder.name}"`, 'success');
  }
}

// Delete Database
export function deleteFolder(folderId) {
  const idx = state.folders.findIndex(f => f.id === folderId);
  if (idx !== -1) {
    const fName = state.folders[idx].name;
    state.folders.splice(idx, 1);
    
    // Ensure at least one database exists
    if (state.folders.length === 0) {
      state.folders.push({
        id: 'folder-' + Date.now(),
        name: 'Main Database',
        icon: 'Database'
      });
    }

    // Reassign orphan projects to the first available database
    const fallbackFolderId = state.folders[0].id;
    let modifiedAny = false;
    state.projects.forEach(p => {
      if (p.folderId === folderId) {
        p.folderId = fallbackFolderId;
        modifiedAny = true;
      }
    });

    // Save updated folders list to storage and Firestore so on reload it NEVER comes back!
    saveFoldersToStorage();

    if (modifiedAny) {
      syncActiveProjectToFirestore();
      saveGuestProjectsToStorage();
    }
    
    addToast('Database Removed', `Deleted database "${fName}"`, 'info');
  }
}

// Move Project to Database
export function moveProjectToFolder(projectId, targetFolderId) {
  const proj = state.projects.find(p => p.id === projectId);
  const targetFolder = state.folders.find(f => f.id === targetFolderId);
  if (proj && targetFolder) {
    const oldFolderId = proj.folderId;
    proj.folderId = targetFolderId;

    if (state.projectOrder && state.projectOrder[oldFolderId]) {
      state.projectOrder[oldFolderId] = state.projectOrder[oldFolderId].filter(id => id !== projectId);
    }
    if (!state.projectOrder) state.projectOrder = {};
    if (!Array.isArray(state.projectOrder[targetFolderId])) {
      state.projectOrder[targetFolderId] = [];
    }
    if (!state.projectOrder[targetFolderId].includes(projectId)) {
      state.projectOrder[targetFolderId].push(projectId);
    }

    saveProjectsOrderToStorage();
    syncActiveProjectToFirestore();
    addToast('Schema Moved', `Moved "${proj.name}" to database "${targetFolder.name}"`, 'success');
  }
}

// Move Database Up (towards top)
export function moveFolderUp(folderId) {
  const idx = state.folders.findIndex(f => f.id === folderId);
  if (idx > 0) {
    const folder = state.folders.splice(idx, 1)[0];
    state.folders.splice(idx - 1, 0, folder);
    saveFoldersToStorage();
    if (idx - 1 === 0) {
      addToast('Top Database Updated', `"${folder.name}" is now the top database and will open as default on launch.`, 'success');
    } else {
      addToast('Database Moved Up', `Moved "${folder.name}" up`, 'info');
    }
  }
}

// Move Database Down
export function moveFolderDown(folderId) {
  const idx = state.folders.findIndex(f => f.id === folderId);
  if (idx !== -1 && idx < state.folders.length - 1) {
    const folder = state.folders.splice(idx, 1)[0];
    state.folders.splice(idx + 1, 0, folder);
    saveFoldersToStorage();
    addToast('Database Moved Down', `Moved "${folder.name}" down`, 'info');
  }
}

// Move Database directly to Top (Default on startup)
export function moveFolderToTop(folderId, autoActivate = true) {
  const idx = state.folders.findIndex(f => f.id === folderId);
  if (idx > 0) {
    const folder = state.folders.splice(idx, 1)[0];
    state.folders.unshift(folder);
    saveFoldersToStorage();
    if (autoActivate) {
      const topProj = state.projects.find(p => p.folderId === folder.id);
      if (topProj) {
        selectProject(topProj.id);
      }
    }
    addToast('Top Database Updated', `"${folder.name}" is now the top database and will open as default on launch.`, 'success');
  }
}

// Move Database directly to Bottom
export function moveFolderToBottom(folderId) {
  const idx = state.folders.findIndex(f => f.id === folderId);
  if (idx !== -1 && idx < state.folders.length - 1) {
    const folder = state.folders.splice(idx, 1)[0];
    state.folders.push(folder);
    saveFoldersToStorage();
    addToast('Database Moved to Bottom', `Moved "${folder.name}" to bottom`, 'info');
  }
}

// Reorder Databases via drag-and-drop or explicit list
export function reorderFolders(orderedIds) {
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) return;
  const newFolders = [];
  orderedIds.forEach(id => {
    const item = state.folders.find(f => f.id === id);
    if (item) newFolders.push(item);
  });
  state.folders.forEach(f => {
    if (!newFolders.some(nf => nf.id === f.id)) {
      newFolders.push(f);
    }
  });
  state.folders = newFolders;
  saveFoldersToStorage();
  addToast('Databases Reordered', 'Database arrangement updated', 'info');
}

// Reorder Schemas inside a Database
export function reorderProjectsInFolder(folderId, orderedIds) {
  if (!state.projectOrder) state.projectOrder = {};
  state.projectOrder[folderId] = [...orderedIds];

  // Re-sort state.projects while preserving overall database/folder organization
  const newProjects = [];
  const folderIds = (state.folders || []).map(f => f.id);
  folderIds.forEach(fId => {
    const inThisFolder = state.projects.filter(p => p.folderId === fId);
    if (fId === folderId) {
      inThisFolder.sort((a, b) => {
        const idxA = orderedIds.indexOf(a.id);
        const idxB = orderedIds.indexOf(b.id);
        const posA = idxA === -1 ? 9999 : idxA;
        const posB = idxB === -1 ? 9999 : idxB;
        return posA - posB;
      });
    } else {
      const fOrder = state.projectOrder[fId] || [];
      if (fOrder.length > 0) {
        inThisFolder.sort((a, b) => {
          const idxA = fOrder.indexOf(a.id);
          const idxB = fOrder.indexOf(b.id);
          const posA = idxA === -1 ? 9999 : idxA;
          const posB = idxB === -1 ? 9999 : idxB;
          return posA - posB;
        });
      }
    }
    newProjects.push(...inThisFolder);
  });

  // Include any projects in orphan or unmapped folders
  state.projects.forEach(p => {
    if (!newProjects.some(np => np.id === p.id)) {
      newProjects.push(p);
    }
  });

  state.projects = newProjects;
  saveProjectsOrderToStorage();
  saveGuestProjectsToStorage();
}

// Move schema inside database up
export function moveProjectUp(projectId) {
  const proj = state.projects.find(p => p.id === projectId);
  if (!proj) return;
  const folderId = proj.folderId;
  const folderProjects = getSortedProjectsInFolder(folderId);
  const idx = folderProjects.findIndex(p => p.id === projectId);
  if (idx > 0) {
    const ids = folderProjects.map(p => p.id);
    const temp = ids[idx];
    ids[idx] = ids[idx - 1];
    ids[idx - 1] = temp;
    reorderProjectsInFolder(folderId, ids);
    addToast('Schema Reordered', `Moved "${proj.name}" up`, 'info');
  }
}

// Move schema inside database down
export function moveProjectDown(projectId) {
  const proj = state.projects.find(p => p.id === projectId);
  if (!proj) return;
  const folderId = proj.folderId;
  const folderProjects = getSortedProjectsInFolder(folderId);
  const idx = folderProjects.findIndex(p => p.id === projectId);
  if (idx !== -1 && idx < folderProjects.length - 1) {
    const ids = folderProjects.map(p => p.id);
    const temp = ids[idx];
    ids[idx] = ids[idx + 1];
    ids[idx + 1] = temp;
    reorderProjectsInFolder(folderId, ids);
    addToast('Schema Reordered', `Moved "${proj.name}" down`, 'info');
  }
}

// Move schema directly to top of database (Default on startup if in top database)
export function moveProjectToTop(projectId, autoActivate = false) {
  const proj = state.projects.find(p => p.id === projectId);
  if (!proj) return;
  const folderId = proj.folderId;
  const folderProjects = getSortedProjectsInFolder(folderId);
  const idx = folderProjects.findIndex(p => p.id === projectId);
  if (idx > 0) {
    const ids = folderProjects.map(p => p.id).filter(id => id !== projectId);
    ids.unshift(projectId);
    reorderProjectsInFolder(folderId, ids);
    if (autoActivate) {
      selectProject(projectId);
    }
    const folder = state.folders.find(f => f.id === folderId);
    const isTopFolder = state.folders[0]?.id === folderId;
    if (isTopFolder) {
      addToast('Top Schema Updated', `"${proj.name}" is now the top schema in the primary database and will open as default on launch.`, 'success');
    } else {
      addToast('Top Schema Updated', `"${proj.name}" is now the top schema in "${folder?.name || 'database'}".`, 'success');
    }
  }
}

// Move schema directly to bottom of database
export function moveProjectToBottom(projectId) {
  const proj = state.projects.find(p => p.id === projectId);
  if (!proj) return;
  const folderId = proj.folderId;
  const folderProjects = getSortedProjectsInFolder(folderId);
  const idx = folderProjects.findIndex(p => p.id === projectId);
  if (idx !== -1 && idx < folderProjects.length - 1) {
    const ids = folderProjects.map(p => p.id).filter(id => id !== projectId);
    ids.push(projectId);
    reorderProjectsInFolder(folderId, ids);
    addToast('Schema Reordered', `Moved "${proj.name}" to bottom`, 'info');
  }
}

// Aliases with Database naming convention
export const createDatabase = createFolder;
export const renameDatabase = renameFolder;
export const deleteDatabase = deleteFolder;
export const moveProjectToDatabase = moveProjectToFolder;
export const moveDatabaseUp = moveFolderUp;
export const moveDatabaseDown = moveFolderDown;
export const moveDatabaseToTop = moveFolderToTop;
export const moveDatabaseToBottom = moveFolderToBottom;
export const reorderDatabases = reorderFolders;
export const moveSchemaUp = moveProjectUp;
export const moveSchemaDown = moveProjectDown;
export const moveSchemaToTop = moveProjectToTop;
export const moveSchemaToBottom = moveProjectToBottom;
export const reorderSchemas = reorderProjectsInFolder;

// Helper to open Presto AI with authentication verification
export function openPrestoAiWithAuthCheck() {
  if (!state.currentUser || !state.currentUser.isLoggedIn) {
    state.authModalPromptReason = 'ai_presto';
    state.modals.auth = true;
    addToast(
      'Sign In Required',
      'Presto AI Schema Assistant is available for registered accounts. Sign in with Google to claim your 50,000 free monthly AI credits!',
      'info'
    );
    return false;
  }
  state.modals.aiGen = true;
  return true;
}

// Generate schema with server-side Gemini API + Token Metering
export async function generateSchemaWithAI(prompt, dialect = 'postgres', mode = 'new') {
  if (!state.currentUser || !state.currentUser.isLoggedIn) {
    state.authModalPromptReason = 'ai_presto';
    state.modals.auth = true;
    throw new Error('Please sign in to use Presto AI Schema Generator. Registered users receive 50,000 free monthly AI credits.');
  }

  const proj = activeProject.value;
  const existingTables = (proj && mode === 'extend') ? proj.tables : [];

  const headers = await getAuthHeaders();
  const response = await fetch('/api/generate-schema', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      prompt,
      dialect,
      mode,
      existingTables,
      userId: state.currentUser.id || 'guest',
      userEmail: state.currentUser.email || '',
      userName: state.currentUser.name || ''
    })
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    if (response.status === 402 && isUpgradeCreditsEnabled.value) {
      state.modals.billing = true; // Automatically open billing modal on insufficient credits
    }
    throw new Error(data.error || 'Failed to generate schema with AI');
  }

  // Update credit meter in local state
  if (data.usage && typeof data.usage.creditsRemaining === 'number') {
    state.userProfile.creditsRemaining = data.usage.creditsRemaining;
    const modelUsed = data.model || 'Gemini';
    const creditsUsed = data.usage.creditsDeducted || data.usage.totalTokensDeducted || 0;
    const rawTokens = data.usage.rawTokens || creditsUsed;
    const costText = typeof data.usage.estimatedCostUsd === 'number'
      ? ` (~$${data.usage.estimatedCostUsd.toFixed(5)})`
      : '';
    addToast(
      'AI Schema Generated',
      `Deducted ${creditsUsed.toLocaleString()} credits (${modelUsed}) for ${rawTokens.toLocaleString()} tokens${costText}. ${data.usage.creditsRemaining.toLocaleString()} remaining.`,
      'info'
    );
  }

  return data.schema;
}

export async function applyAiGeneratedSchema(aiResult, mode = 'new') {
  if (!aiResult || !aiResult.tables) return;

  if (mode === 'new') {
    const isAuth = Boolean(state.currentUser?.isLoggedIn && auth.currentUser);
    const currentOwnerUid = isAuth ? auth.currentUser.uid : (state.currentUser?.id || 'guest');
    const currentOwnerEmail = state.currentUser?.email || (auth.currentUser ? auth.currentUser.email : '') || '';
    const determinedAccessMode = isAuth ? 'restricted' : 'public';
    const targetFolderId = activeProject.value?.folderId || state.folders[0]?.id || 'folder-1';

    const newProjId = 'proj-' + Date.now();
    const newProjectObj = {
      id: newProjId,
      folderId: targetFolderId,
      name: aiResult.schemaName || 'AI Generated Schema',
      description: aiResult.description || 'Generated with Gemini AI',
      dialect: activeProject.value?.dialect || 'postgres',
      accessMode: determinedAccessMode,
      sharePassword: '',
      allowedEmails: isAuth && currentOwnerEmail ? [currentOwnerEmail.toLowerCase()] : [],
      ownerUid: currentOwnerUid,
      ownerEmail: currentOwnerEmail,
      tables: aiResult.tables.map((t, idx) => ({
        id: 'tbl-ai-' + Date.now() + '-' + idx,
        name: t.name,
        headerColor: t.headerColor || '#3b82f6',
        comment: t.comment || '',
        note: t.note || t.comment || '',
        x: 60 + (idx % 3) * 380,
        y: 60 + Math.floor(idx / 3) * 320,
        columns: (t.columns || []).map((c, cIdx) => {
          const isPk = Boolean(c.isPk ?? c.pk ?? c.primaryKey);
          const isFk = Boolean(c.isFk ?? c.fk ?? c.foreignKey);
          return {
            id: 'col-' + Date.now() + '-' + idx + '-' + cIdx,
            name: c.name,
            type: c.type,
            isPk,
            pk: isPk,
            isFk,
            fk: isFk,
            isNull: c.isNull !== undefined ? Boolean(c.isNull) : (c.notNull !== undefined ? !c.notNull : (isPk ? false : true)),
            notNull: c.notNull !== undefined ? Boolean(c.notNull) : (c.isNull !== undefined ? !c.isNull : isPk),
            isUnique: Boolean(c.isUnique ?? c.unique ?? isPk),
            unique: Boolean(c.isUnique ?? c.unique ?? isPk),
            note: c.note || c.comment || ''
          };
        })
      })),
      relationships: (aiResult.relationships || []).map((r, rIdx) => {
        const rawType = (r.cardinality || r.type || '').toUpperCase().trim();
        let card = 'N:1';
        if (rawType === '1:1') card = '1:1';
        else if (rawType === 'N:M' || rawType === 'M:N') card = 'N:M';
        else card = 'N:1';

        const isOptional = r.optional === true || (r.operator && r.operator.includes('?'));
        let op = r.operator;
        if (!op) {
          if (card === '1:1') op = isOptional ? '-?' : '-';
          else if (card === 'N:M') op = isOptional ? '<>?' : '<>';
          else op = isOptional ? '>?' : '>';
        }
        return {
          id: 'rel-ai-' + Date.now() + '-' + rIdx,
          fromTable: r.fromTable,
          fromColumn: r.fromColumn,
          toTable: r.toTable,
          toColumn: r.toColumn,
          cardinality: card,
          operator: op,
          type: card
        };
      }),
      enums: [],
      tableGroups: [],
      projectConfig: null,
      customDbml: null,
      history: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Normalize keys: set foreign-key flags consistently from valid relationship endpoints (even if Gemini omits fk flag)
    normalizeTableKeys(newProjectObj.tables, newProjectObj.relationships);

    // 1. Generate immediate DBML with pk and ref declarations so it displays instantly in the code editor
    newProjectObj.customDbml = generateDBML(
      newProjectObj.tables,
      newProjectObj.relationships,
      newProjectObj.name,
      {
        enums: newProjectObj.enums || [],
        tableGroups: newProjectObj.tableGroups || [],
        projectConfig: newProjectObj.projectConfig || null
      }
    );

    // 2. Bring containing database/folder to the top of state.folders
    const folderIdx = state.folders.findIndex(f => f.id === targetFolderId);
    if (folderIdx > 0) {
      const [folderObj] = state.folders.splice(folderIdx, 1);
      state.folders.unshift(folderObj);
      saveFoldersToStorage();
    }

    // 3. Insert new schema FIRST inside targetFolderId's ordering
    if (!state.projectOrder) state.projectOrder = {};
    const existingOrder = (state.projectOrder[targetFolderId] || []).filter(id => id !== newProjId);
    const existingFolderProjects = state.projects
      .filter(p => p.folderId === targetFolderId && p.id !== newProjId)
      .map(p => p.id);
    const combinedOtherIds = [...existingOrder];
    existingFolderProjects.forEach(id => {
      if (!combinedOtherIds.includes(id)) combinedOtherIds.push(id);
    });
    const newFolderOrder = [newProjId, ...combinedOtherIds];
    state.projectOrder[targetFolderId] = newFolderOrder;

    // 4. Insert new project into state.projects at the very beginning
    if (state.projects.length === 1 && isUntouchedBlankStarter(state.projects[0])) {
      state.projects = [newProjectObj];
    } else {
      state.projects.unshift(newProjectObj);
    }

    // 5. Reorder projects in folder and re-sort state.projects while preserving all other groups and schemas
    reorderProjectsInFolder(targetFolderId, newFolderOrder);

    // 6. Persist locally to storage immediately
    saveGuestProjectsToStorage();

    // 7. Coordinate initial Firestore creation before subscription to prevent premature access permission denial
    let saveSucceeded = true;
    if (isAuth && auth.currentUser && db) {
      state.saveStatus = 'saving';
      state.saveErrorMessage = null;
      try {
        const docRef = doc(db, 'projects', newProjId);
        const payload = {
          id: newProjectObj.id,
          folderId: newProjectObj.folderId || 'folder-1',
          name: newProjectObj.name,
          description: newProjectObj.description || '',
          dialect: newProjectObj.dialect || 'postgres',
          accessMode: newProjectObj.accessMode,
          sharePassword: newProjectObj.sharePassword || '',
          allowedEmails: Array.isArray(newProjectObj.allowedEmails) ? JSON.parse(JSON.stringify(newProjectObj.allowedEmails)) : [],
          tables: JSON.parse(JSON.stringify(newProjectObj.tables || [])),
          relationships: JSON.parse(JSON.stringify(newProjectObj.relationships || [])),
          enums: JSON.parse(JSON.stringify(newProjectObj.enums || [])),
          tableGroups: JSON.parse(JSON.stringify(newProjectObj.tableGroups || [])),
          projectConfig: newProjectObj.projectConfig ? JSON.parse(JSON.stringify(newProjectObj.projectConfig)) : null,
          customDbml: newProjectObj.customDbml || null,
          history: JSON.parse(JSON.stringify(newProjectObj.history || [])),
          ownerUid: newProjectObj.ownerUid,
          ownerEmail: newProjectObj.ownerEmail,
          createdAt: newProjectObj.createdAt,
          updatedAt: new Date().toISOString()
        };
        await setDoc(docRef, payload, { merge: true });
        lastSyncedHashes[newProjId] = computeProjectHash(payload);
        state.saveStatus = 'saved';
        state.lastSavedAt = new Date().toISOString();
      } catch (err) {
        saveSucceeded = false;
        console.error('Initial Firestore creation failed for new project:', err);
        state.saveStatus = 'error';
        state.saveErrorMessage = err.message || 'Error saving schema to cloud';
        if (err.code === 'permission-denied') {
          try {
            handleFirestoreError(err, 'write', `projects/${newProjId}`);
          } catch (_) {}
        }
        addToast('Save Failed', err.message || 'Permission denied saving new schema to Firestore', 'error');
      }
    }

    if (saveSucceeded) {
      // 8. Clear a stale restriction state only when it belongs to this newly created project and the authenticated owner’s access is confirmed
      if (
        state.collaborationAccessRestricted?.active &&
        state.collaborationAccessRestricted.schemaId === newProjId &&
        isAuth &&
        auth.currentUser?.uid === newProjectObj.ownerUid
      ) {
        state.collaborationAccessRestricted.active = false;
        state.collaborationAccessRestricted.reason = null;
        state.collaborationAccessRestricted.pendingProjectData = null;
      }

      // 9. Automatically select and open the new schema in Studio immediately
      selectProject(newProjId);

      // 10. Auto-arrange tables and trigger smooth canvas fit
      autoArrangeTables('flow');
      state.canvasFitTrigger = Date.now();

      // 11. Ensure Explorer tab is active so the newly created schema is visible in the sidebar
      state.activeTab = 'explorer';

      addToast('AI Schema Created', `Generated '${newProjectObj.name}' with ${newProjectObj.tables.length} tables.`, 'success');
    }
  } else {
    const proj = activeProject.value;
    if (!proj) return;

    let addedTables = 0;
    aiResult.tables.forEach((t, idx) => {
      const existingIdx = proj.tables.findIndex(existing => existing.name.toLowerCase() === t.name.toLowerCase());
      if (existingIdx >= 0) {
        const targetTable = proj.tables[existingIdx];
        (t.columns || []).forEach((c) => {
          const colExists = targetTable.columns.some(col => col.name.toLowerCase() === c.name.toLowerCase());
          if (!colExists) {
            const isPk = Boolean(c.isPk ?? c.pk ?? c.primaryKey);
            const isFk = Boolean(c.isFk ?? c.fk ?? c.foreignKey);
            targetTable.columns.push({
              id: 'col-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
              name: c.name,
              type: c.type,
              isPk,
              pk: isPk,
              isFk,
              fk: isFk,
              isNull: c.isNull !== undefined ? Boolean(c.isNull) : (c.notNull !== undefined ? !c.notNull : (isPk ? false : true)),
              notNull: c.notNull !== undefined ? Boolean(c.notNull) : (c.isNull !== undefined ? !c.isNull : isPk),
              isUnique: Boolean(c.isUnique ?? c.unique ?? isPk),
              unique: Boolean(c.isUnique ?? c.unique ?? isPk),
              note: c.note || c.comment || ''
            });
          }
        });
      } else {
        proj.tables.push({
          id: 'tbl-ai-' + Date.now() + '-' + idx,
          name: t.name,
          headerColor: t.headerColor || '#3b82f6',
          comment: t.comment || '',
          note: t.note || t.comment || '',
          x: 60 + (proj.tables.length % 3) * 380,
          y: 60 + Math.floor(proj.tables.length / 3) * 320,
          columns: (t.columns || []).map((c, cIdx) => {
            const isPk = Boolean(c.isPk ?? c.pk ?? c.primaryKey);
            const isFk = Boolean(c.isFk ?? c.fk ?? c.foreignKey);
            return {
              id: 'col-' + Date.now() + '-' + idx + '-' + cIdx,
              name: c.name,
              type: c.type,
              isPk,
              pk: isPk,
              isFk,
              fk: isFk,
              isNull: c.isNull !== undefined ? Boolean(c.isNull) : (c.notNull !== undefined ? !c.notNull : (isPk ? false : true)),
              notNull: c.notNull !== undefined ? Boolean(c.notNull) : (c.isNull !== undefined ? !c.isNull : isPk),
              isUnique: Boolean(c.isUnique ?? c.unique ?? isPk),
              unique: Boolean(c.isUnique ?? c.unique ?? isPk),
              note: c.note || c.comment || ''
            };
          })
        });
        addedTables++;
      }
    });

    (aiResult.relationships || []).forEach((r, rIdx) => {
      const relExists = proj.relationships.some(existing => 
        existing.fromTable.toLowerCase() === r.fromTable.toLowerCase() &&
        existing.fromColumn.toLowerCase() === r.fromColumn.toLowerCase() &&
        existing.toTable.toLowerCase() === r.toTable.toLowerCase()
      );
      if (!relExists) {
        const card = r.cardinality || r.type || '1:N';
        const isOptional = r.optional === true;
        let op = r.operator;
        if (!op) {
          if (card === '1:1') op = isOptional ? '-?' : '-';
          else if (card === 'N:M') op = isOptional ? '<>?' : '<>';
          else op = isOptional ? '>?' : '>';
        }
        proj.relationships.push({
          id: 'rel-ai-' + Date.now() + '-' + rIdx,
          fromTable: r.fromTable,
          fromColumn: r.fromColumn,
          toTable: r.toTable,
          toColumn: r.toColumn,
          cardinality: card,
          operator: op,
          type: card
        });
      }
    });

    // Consistently normalize keys across extended schema
    normalizeTableKeys(proj.tables, proj.relationships);

    // Synchronize DBML while preserving existing custom DBML content
    if (!proj.customDbml) {
      proj.customDbml = generateDBML(
        proj.tables,
        proj.relationships,
        proj.name,
        {
          enums: proj.enums || [],
          tableGroups: proj.tableGroups || [],
          projectConfig: proj.projectConfig || null
        }
      );
    } else {
      const existingDbml = proj.customDbml.trim();
      const newTablesDbml = generateDBML(
        proj.tables.filter(t => !existingDbml.includes(`Table ${t.name}`) && !existingDbml.includes(`Table "${t.name}"`) && !existingDbml.includes(`Table \`${t.name}\``)),
        proj.relationships.filter(r => !existingDbml.includes(`${r.fromTable}.${r.fromColumn}`)),
        proj.name
      ).replace(/^\/\/ DBML Database Schema:.*\n\/\/ Generated on .*\n\n/i, '');
      if (newTablesDbml.trim()) {
        proj.customDbml = existingDbml + '\n\n' + newTablesDbml.trim() + '\n';
      }
    }

    proj.updatedAt = new Date().toISOString();
    autoArrangeTables();
    syncActiveProjectToFirestore();
    addToast('AI Schema Extended', `Updated active project '${proj.name}'.`, 'success');
  }
}

// Create TallySale Seller Invoice via backend HMAC SHA256 integration
export async function createTallySaleInvoice(options = {}) {
  try {
    const payload = typeof options === 'string'
      ? {
          plan: options,
          userId: state.currentUser.id || 'guest',
          userEmail: state.currentUser.email || '',
          userName: state.currentUser.name || 'Developer',
          currency: 'MMK'
        }
      : {
          userId: state.currentUser.id || 'guest',
          userEmail: state.currentUser.email || '',
          userName: state.currentUser.name || 'Developer',
          plan: 'pro',
          currency: 'MMK',
          ...options
        };

    const res = await fetch('/api/tallysale/create-invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok && !data.invoice && !data.data) {
      throw new Error(data.error || 'Failed to create invoice with TallySale API');
    }
    const inv = data.invoice || data.data;
    if (inv) {
      addToast('TallySale Invoice Created', `Invoice #${inv.invoice_number || inv.id} generated. Ready for checkout.`, 'success');
    }
    return data;
  } catch (err) {
    addToast('TallySale API Error', err.message, 'error');
    throw err;
  }
}

// Generate Merchant SSO URL for Customer Portal
export async function fetchMerchantSsoUrl(email = '', config = {}) {
  try {
    const targetEmail = email || state.currentUser.email || 'developer@dbmaps.io';
    const res = await fetch('/api/tallysale/merchant-sso-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: targetEmail, _config: config })
    });
    const data = await res.json();
    if (!res.ok || !data.url) {
      throw new Error(data.error || 'Failed to generate Customer Portal SSO URL');
    }
    return data.url;
  } catch (err) {
    addToast('SSO Portal Error', err.message, 'error');
    throw err;
  }
}

// Verify TallySale Payment Status (or forward AYA PGW callback)
export async function verifyTallySalePayment(params = {}) {
  try {
    const body = typeof params === 'object' && params !== null
      ? { userId: state.currentUser.id || 'guest', ...params }
      : { requestId: params, userId: state.currentUser.id || 'guest' };

    const res = await fetch('/api/tallysale/verify-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to verify payment with TallySale');
    }

    if (data.paid) {
      await fetchUserProfile();
      addToast('Payment Verified!', 'Your account has been upgraded to PRO Tier with 1,000,000 AI credits.', 'success');
    } else {
      addToast('Payment Status: Pending', data.message || 'Invoice payment is pending on TallySale portal.', 'info');
    }
    return data;
  } catch (err) {
    addToast('Verification Error', err.message, 'error');
    throw err;
  }
}

// Fetch received webhook logs (Admin only)
export async function fetchWebhookLogs() {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/tallysale/webhook-logs', { headers });
    const data = await res.json();
    return data.logs || [];
  } catch (err) {
    return [];
  }
}

// Submit TallySale Payment Reference for Tier Upgrade
export async function submitTallySalePayment(invoiceRef, notes = '') {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/payment-request', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        userId: state.currentUser.id || 'guest',
        userEmail: state.currentUser.email || '',
        invoiceRef,
        requestedTier: 'pro',
        notes
      })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to submit payment proof');
    }
    addToast('TallySale Payment Submitted', 'Your invoice ref has been sent to Admin for approval.', 'success');
    return data.payment;
  } catch (err) {
    addToast('Payment Error', err.message, 'error');
    throw err;
  }
}

// Get User's TallySale Payments
export async function fetchUserPayments() {
  try {
    const userId = state.currentUser.id || 'guest';
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/payment-requests?userId=${encodeURIComponent(userId)}`, { headers });
    const data = await res.json();
    return data.requests || [];
  } catch (err) {
    return [];
  }
}

// Admin: Fetch all users and payment requests
export async function fetchAdminUsersAndPayments() {
  try {
    const headers = await getAuthHeaders();
    const [uRes, pRes] = await Promise.all([
      fetch('/api/admin/users', { headers }),
      fetch('/api/admin/payment-requests', { headers })
    ]);
    const uData = await uRes.json();
    const pData = await pRes.json();
    return {
      users: uData.users || [],
      requests: pData.requests || [],
      logs: pData.logs || [],
      metricsSummary: pData.metricsSummary || null
    };
  } catch (err) {
    console.error('fetchAdminUsersAndPayments error:', err);
    return { users: [], requests: [], logs: [], metricsSummary: null };
  }
}

// Admin: Update User Tier & Credits
export async function adminUpdateUserTier(targetUserId, newTier, addBonusCredits = 0, role = 'user', exactCredits = null) {
  try {
    const payload = {
      targetUserId,
      newTier,
      addBonusCredits,
      role
    };
    if (typeof exactCredits === 'number') {
      payload.exactCredits = exactCredits;
    }
    const headers = await getAuthHeaders();
    const res = await fetch('/api/admin/update-user', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to update user tier');
    }
    const toastMsg = typeof exactCredits === 'number'
      ? `Credits set to ${exactCredits.toLocaleString()}`
      : addBonusCredits > 0
        ? `Tier: ${newTier.toUpperCase()} (+${addBonusCredits.toLocaleString()} bonus credits)`
        : `Tier updated to ${newTier.toUpperCase()}`;
    addToast('User Updated', toastMsg, 'success');
    return data.updatedUser;
  } catch (err) {
    addToast('Admin Error', err.message, 'error');
    throw err;
  }
}

// Admin: Approve TallySale Payment
export async function adminApprovePayment(requestId, status = 'APPROVED') {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/admin/approve-payment', {
      method: 'POST',
      headers,
      body: JSON.stringify({ requestId, status })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to review payment');
    }
    addToast('Payment Request Reviewed', `Status marked as ${status}`, 'success');
    return data;
  } catch (err) {
    addToast('Admin Error', err.message, 'error');
    throw err;
  }
}

// Admin: Update System Config Limits
export async function adminUpdateSystemConfig(config) {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/admin/system-config', {
      method: 'POST',
      headers,
      body: JSON.stringify(config)
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to update system config');
    }
    if (data.config) {
      state.systemConfig = { ...state.systemConfig, ...data.config };
      if (state.userProfile && state.userProfile.tier === 'free') {
        state.userProfile.monthlyCreditAllowance = data.config.freeTierMonthlyCredits;
        if (config.applyToExistingFreeUsers) {
          state.userProfile.creditsRemaining = data.config.freeTierMonthlyCredits;
        }
      }
    }
    const msg = data.updatedUsersCount > 0 
      ? `Saved! Applied ${Number(config.freeTierMonthlyCredits).toLocaleString()} credits to ${data.updatedUsersCount} free users.`
      : 'Updated global credit and prompt length tier settings.';
    addToast('System Config Saved', msg, 'success');
    return data.config;
  } catch (err) {
    addToast('Config Error', err.message, 'error');
    throw err;
  }
}

// Admin: Create User Account
export async function adminCreateUser(userData) {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/admin/create-user', {
      method: 'POST',
      headers,
      body: JSON.stringify(userData)
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to create user account');
    }
    addToast('User Created', `Successfully provisioned ${data.user.email} (${data.user.tier.toUpperCase()})`, 'success');
    return data.user;
  } catch (err) {
    addToast('Admin Error', err.message, 'error');
    throw err;
  }
}

// Admin: Delete User Account
export async function adminDeleteUser(targetUserId) {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/admin/delete-user', {
      method: 'POST',
      headers,
      body: JSON.stringify({ targetUserId })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to delete user account');
    }
    addToast('User Deleted', 'User account removed from database', 'info');
    return true;
  } catch (err) {
    addToast('Admin Error', err.message, 'error');
    throw err;
  }
}

// Open Export Center directly to specified tab ('diagram' or 'script')
export function openExportModal(tab = 'diagram') {
  state.exportTab = tab;
  state.modals.export = true;
}

