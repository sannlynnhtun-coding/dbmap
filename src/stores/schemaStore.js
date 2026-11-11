import { tourSteps } from '../utils/tourSteps.js';
import { createWorkspaceBackup, prepareBackupImport, recentProjects } from '../utils/workspaceBackup.js';
import { createProjectStorage, validateLegacyStorage } from '../utils/projectStorage.js';
import { toast } from '@yusufceng1z/ding';
import { arrangeRelationshipFlow, arrangeCentralHubs } from '../utils/diagramLayout.js';
import { reactive, computed, watch, ref, nextTick } from 'vue';
import { SAMPLE_PROJECTS, INITIAL_FOLDERS, createDefaultBlankProject } from '../utils/sampleSchemas.js';
import { generateDBML, parseDBML, exportToSQL, extractCleanNote, updateTableHeaderColorInDBML } from '../utils/dbmlParser.js';
import { parseSQLSchema } from '../utils/sqlImporter.js';

// Load stored theme safely
const storedDark = typeof localStorage !== 'undefined' ? localStorage.getItem('db_schema_dark') : null;
const isDarkInitial = storedDark !== null ? storedDark === 'true' : false;

// Clean vector SVG avatar illustrating a guest developer (neutral circular backdrop with Lucide user silhouette)
export const DEFAULT_GUEST_AVATAR = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' fill='none'><rect width='32' height='32' rx='16' fill='%23f1f5f9'/><g transform='translate(4, 4)'><path d='M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><circle cx='12' cy='7' r='4' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></g></svg>`;

// --- Deletion & Folder Persistence Helpers ---
const DELETED_PROJECTS_KEY = 'dbmaps_deleted_project_ids';
const projectStorage = createProjectStorage();
let storageReady = false;
let deletedProjectIds = [];
let saveSequence = 0;
let mutationRevision = 0;
let applyingSavedTimestamps = false;
let savedProjectContents = new Map();
const projectContent = project => JSON.stringify({ ...project, updatedAt: undefined });

export function getDeletedProjectIds() {
  if (storageReady) return [...deletedProjectIds];
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
      deletedProjectIds = ids;
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
  const uid = 'guest';
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
  const uid = 'guest';
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
  return saveProjectsLocally();
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
  return saveProjectsLocally();
}

export function saveGuestProjectsToStorage() {
  return saveProjectsLocally();
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
        const valid = parsed.filter(p => !deletedIds.includes(p.id)
          && (p.localOnly || ((!p.ownerUid || p.ownerUid === 'guest') && !p.isSharedWithMe && !['restricted', 'password'].includes(p.accessMode))));
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
  return typeof window !== 'undefined' && window.__DBMAPS_DESKTOP__ ? [initialBlankProject] : [];
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

const initialFolders = loadInitialFolders();
const initialProjects = loadInitialProjects();
const initialProjectOrder = loadInitialProjectOrder();
const initialActiveId = getInitialActiveProjectId(initialProjects, initialFolders, initialProjectOrder);

export const state = reactive({
  isDarkMode: isDarkInitial,
  isSidebarCollapsed: typeof window === 'undefined' || window.innerWidth < 1280,
  activeTab: 'tables', // 'explorer' | 'tables' | 'relationships' | 'history' | 'settings'
  showStartPage: true,
  startPageMessage: '',
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
    totalSteps: tourSteps.length
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
    backupImport: false,
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
  },

  // Auth prompt context for onboarding (e.g. 'ai_presto')
  authModalPromptReason: null,


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
          return '/app';
        }
        return '/';
      })()
    : '/',


});

isStateInitialized = true;


export function isStudioDataReady() {
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

  state.currentRoute = path.split('?')[0];
  if (typeof window !== 'undefined') {
    window.history.pushState(null, '', path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  if (isTargetingStudio) {
    loadLocalProjectFromUrl();
    if (state.showStartPage) { finishStudioLoading(0); return; }
  }

  if (isTargetingStudio && !isCurrentlyInStudio) {
    state.initialLoadingProgress = 65;
    state.initialLoadingStage = 'Loading tables & schema models...';

    // Wait until the workspace data are fully loaded into memory
    await waitForStudioDataReady(5000);

    state.initialLoadingProgress = 90;
    state.initialLoadingStage = 'Rendering canvas & editor...';

    // Brief settling delay so the canvas SVG nodes and editor buffer mount cleanly before overlay fades
    await new Promise(r => setTimeout(r, 220));

    finishStudioLoading(250);
  }
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

export function startTour(stepIndex = 0) {
  // Ensure workspace elements are visible for tour spotlights
  state.isSidebarCollapsed = false;
  state.viewMode = window.innerWidth < 1024 ? 'canvas' : 'split';
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

  if (isComplete) {
    addToast('Tour Completed! 🎉', 'You are ready to architect databases. Launch the walkthrough anytime from the toolbar.', 'success');
  } else {
    addToast('Tour Dismissed', 'You can restart the interactive walkthrough anytime from the toolbar.', 'info');
  }
}

function workspaceSnapshot(projects = state.projects) {
  return {
    projects,
    workspace: {
      folders: state.folders,
      projectOrder: state.projectOrder,
      deletedIds: storageReady ? deletedProjectIds : getDeletedProjectIds(),
      tableDisplayMode: state.tableDisplayMode,
      showOptionalRelationships: state.showOptionalRelationships,
      autoArrangeMode: state.autoArrangeMode
    }
  };
}

export async function initializeProjectStorage() {
  const snapshot = await projectStorage.initialize(() => {
    validateLegacyStorage(localStorage);
    return workspaceSnapshot();
  });
  state.projects = snapshot.projects.map(project => normalizeProjectKeys({
    history: [], dialect: 'postgres', accessMode: 'public', sharePassword: '', allowedEmails: [], ...project
  }));
  state.folders = snapshot.workspace.folders;
  state.projectOrder = snapshot.workspace.projectOrder;
  deletedProjectIds = snapshot.workspace.deletedIds;
  for (const key of ['tableDisplayMode', 'showOptionalRelationships', 'autoArrangeMode']) {
    if (snapshot.workspace[key] !== undefined) state[key] = snapshot.workspace[key];
  }
  state.activeProjectId = getInitialActiveProjectId(state.projects, state.folders, state.projectOrder);
  currentWatchedProjectId = state.activeProjectId;
  await nextTick();
  savedProjectContents = new Map(state.projects.map(project => [project.id, projectContent(project)]));
  storageReady = true;
}

export async function saveProjectsLocally(projects = state.projects, workspace = null) {
  if (!storageReady) return false;
  const sequence = ++saveSequence;
  const revision = mutationRevision;
  const isBrowser = !window.__DBMAPS_DESKTOP__;
  if (isBrowser) state.saveStatus = 'saving';
  try {
    const snapshot = JSON.parse(JSON.stringify(workspace ? { projects, workspace } : workspaceSnapshot(projects)));
    const now = new Date().toISOString();
    for (const project of snapshot.projects) {
      if (savedProjectContents.get(project.id) !== projectContent(project)) project.updatedAt = now;
    }
    await projectStorage.save(snapshot);
    savedProjectContents = new Map(snapshot.projects.map(project => [project.id, projectContent(project)]));
    applyingSavedTimestamps = true;
    try {
      for (const saved of snapshot.projects) {
        const current = projects.find(project => project.id === saved.id);
        if (current && projectContent(current) === projectContent(saved)) current.updatedAt = saved.updatedAt;
      }
    } finally { applyingSavedTimestamps = false; }
    if (isBrowser && sequence === saveSequence && revision === mutationRevision) {
      state.saveStatus = 'saved';
      state.saveErrorMessage = null;
      state.lastSavedAt = new Date().toISOString();
    }
    return true;
  } catch (error) {
    if (isBrowser && sequence === saveSequence) {
      state.saveStatus = 'error';
      state.saveErrorMessage = error.message || 'Browser storage is unavailable or full.';
    }
    return false;
  }
}

export function flushActiveProjectSync() {
  clearTimeout(syncTimeout);
  return saveProjectsLocally();
}

export async function forceSaveProject() {
  if (window.__DBMAPS_DESKTOP__) {
    window.dispatchEvent(new Event('dbmaps-save'));
    return;
  }
  const saved = await flushActiveProjectSync();
  if (saved && state.saveStatus === 'saved') {
    addToast('Saved Locally', 'Project saved in this browser.', 'success');
  } else if (!saved) {
    addToast('Save Warning', state.saveErrorMessage, 'warning');
  }
}

export function selectProject(projectId) {
  if (!projectId || !state.projects.some(project => project.id === projectId)) return;
  state.showStartPage = false;
  state.startPageMessage = '';

  // Flush any pending auto-sync for the current active project before switching away
  if (state.activeProjectId && state.saveStatus === 'unsaved' && !isSampleProjectId(state.activeProjectId) && !isProjectDeleted(state.activeProjectId)) {
    flushActiveProjectSync(state.activeProjectId);
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

}

export function loadLocalProjectFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('schema') || params.get('project') || params.get('share') || params.get('room') || params.get('id');
  if (id && state.projects.some(project => project.id === id)) selectProject(id);
  else {
    state.showStartPage = true;
    state.startPageMessage = id ? 'This project is not available in this browser. Open a recent project or import a backup.' : '';
  }
}

export async function openStartPage() {
  if (storageReady && state.saveStatus !== 'saved') await flushActiveProjectSync();
  state.showStartPage = true;
  state.startPageMessage = state.saveStatus === 'error' ? 'Some changes could not be saved. Export a backup before closing this browser.' : '';
  state.currentRoute = '/app';
  window.history.replaceState(null, '', '/app');
}

export function exportWorkspaceBackup() {
  return createWorkspaceBackup(recentProjects(state.projects), state.folders, state.projectOrder, {
    tableDisplayMode: state.tableDisplayMode,
    showOptionalRelationships: state.showOptionalRelationships,
    autoArrangeMode: state.autoArrangeMode
  });
}

export async function restoreBackupFile(backup) {
  clearTimeout(syncTimeout);
  if (!await flushActiveProjectSync()) throw new Error(state.saveErrorMessage || 'Storage is not ready.');
  const prepared = prepareBackupImport(backup, state);
  prepared.imported.forEach(normalizeProjectKeys);
  const workspace = { ...workspaceSnapshot().workspace, folders: prepared.folders,
    projectOrder: prepared.projectOrder, ...prepared.preferences };
  if (!await saveProjectsLocally(prepared.projects, workspace)) {
    throw new Error(state.saveErrorMessage || 'The backup could not be saved.');
  }
  storageReady = false;
  state.projects = prepared.projects;
  state.folders = prepared.folders;
  state.projectOrder = prepared.projectOrder;
  Object.assign(state, prepared.preferences);
  await nextTick();
  storageReady = true;
  if (prepared.imported.length === 1) selectProject(prepared.imported[0].id);
  else await openStartPage();
  return prepared.imported;
}

// Toast helper
export function addToast(title, message, type = 'info') {
  return toast.show(type, title, { description: message, duration: type === 'error' ? 0 : 5000 });
}

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

// Deeply watch active project changes and save to browser storage
let syncTimeout = null;
let currentWatchedProjectId = state.activeProjectId;

watch(
  () => activeProject.value,
  (proj) => {
    if (!storageReady || applyingSavedTimestamps || !proj || !proj.id) return;
    if (proj.id !== currentWatchedProjectId) {
      currentWatchedProjectId = proj.id;
      return; // Switched active project reference; wait for actual user mutations
    }

    // Mark as unsaved immediately when user makes schema mutations
    mutationRevision++;
    state.saveStatus = 'unsaved';

    if (syncTimeout) clearTimeout(syncTimeout);
    syncTimeout = setTimeout(() => {
      saveProjectsLocally();
    }, 1500);
  },
  { deep: true, flush: 'sync' }
);

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', event => {
    if (!window.__DBMAPS_DESKTOP__ && storageReady && state.saveStatus !== 'saved') {
      void flushActiveProjectSync();
      event.preventDefault();
      event.returnValue = '';
    }
  });
  if (typeof document?.addEventListener === 'function') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && storageReady && state.saveStatus === 'unsaved') {
        void flushActiveProjectSync();
      }
    });
  }
}

watch(
  () => [state.tableDisplayMode, state.showOptionalRelationships, state.autoArrangeMode],
  () => {
    if (!storageReady) return;
    mutationRevision++;
    void saveProjectsLocally();
  },
  { flush: 'sync' }
);

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

// Auto Arrange / Auto Layout Tables (supports 'flow' and 'hubs')
export function autoArrangeTables(mode = null) {
  const proj = activeProject.value;
  if (!proj || !proj.tables || proj.tables.length === 0) return;

  const targetMode = mode || state.autoArrangeMode || 'flow';
  setAutoArrangeMode(targetMode);

  const tables = proj.tables;
  const rels = proj.relationships || [];

  if (targetMode === 'hubs') {
    arrangeCentralHubs(tables, rels, state.tableDisplayMode);
  } else {
    arrangeRelationshipFlow(tables, rels, state.tableDisplayMode);
  }

  saveProjectsLocally();

  const modeInfo = AUTO_ARRANGE_MODES.find(m => m.id === targetMode) || AUTO_ARRANGE_MODES[0];
  addToast(
    `Auto Arranged (${modeInfo.name})`,
    `Organized ${tables.length} tables cleanly in compact ${modeInfo.shortLabel.toLowerCase()} layout.`,
    'success'
  );
}


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

  }
}

// Update Column Note
export function updateColumnNote(tableId, colIndex, note) {
  const proj = activeProject.value;
  if (!proj) return;
  const tbl = proj.tables.find(t => t.id === tableId);
  if (tbl && tbl.columns[colIndex]) {
    tbl.columns[colIndex].note = extractCleanNote(note);

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

  state.selectedTableId = newTable.id;
  saveProjectsLocally();
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

    saveProjectsLocally();
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

    saveProjectsLocally();
  }
}

// Delete Column
export function deleteColumn(tableId, colIndex) {
  const proj = activeProject.value;
  if (!proj) return;
  const tbl = proj.tables.find(t => t.id === tableId || t.name === tableId);
  if (tbl && tbl.columns[colIndex]) {
    tbl.columns.splice(colIndex, 1);

    saveProjectsLocally();
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

  saveProjectsLocally();
  addToast('Relationship Linked', `${relData.fromTable}.${relData.fromColumn} ${operator} ${relData.toTable}.${relData.toColumn}`, 'success');
}

// Update Relationship
export function updateRelationship(relId, updates) {
  const proj = activeProject.value;
  if (!proj) return;
  const rel = proj.relationships.find(r => r.id === relId);
  if (rel) {
    Object.assign(rel, updates);

    saveProjectsLocally();
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

  saveProjectsLocally();
  addToast('Relationship Updated', nextOptional ? 'Set to Optional FK (>? 0..N)' : 'Set to Mandatory FK (> 1:N)', 'info');
}

// Delete Relationship
export function deleteRelationship(relId) {
  const proj = activeProject.value;
  if (!proj) return;
  const idx = proj.relationships.findIndex(r => r.id === relId);
  if (idx !== -1) {
    proj.relationships.splice(idx, 1);

    saveProjectsLocally();
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

  saveProjectsLocally();
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

    saveProjectsLocally();
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

    saveProjectsLocally();
    addToast('Version Restored', `Restored schema to "${commit.versionName}"`, 'info');
  }
}

// Update Active Project Target SQL Dialect
export function setProjectDialect(dialect) {
  const proj = activeProject.value;
  if (!proj) return;
  proj.dialect = dialect;

  saveProjectsLocally();
  addToast('Dialect Updated', `Target dialect set to ${dialect.toUpperCase()}`, 'info');
}

// Create New Project
export function createProject(projectName, folderId, description = '', customAccessMode = null, customPassword = '', dialect = 'postgres') {
  const currentOwnerUid = 'guest';
  const currentOwnerEmail = '';

  // Private (restricted) by default for logged-in accounts; open for guest scratchpad
  const determinedAccessMode = customAccessMode || 'public';

  const newProj = {
    id: 'proj-' + Date.now().toString(36),
    folderId: folderId || state.folders[0]?.id || 'folder-1',
    name: projectName,
    description: description || 'Database schema model',
    updatedAt: new Date().toISOString(),
    dialect: dialect || 'postgres',
    accessMode: determinedAccessMode,
    sharePassword: customPassword || '',
    allowedEmails: [],
    tables: [],
    relationships: [],
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
  saveProjectsLocally();
  addToast('Project Created', `Started "${projectName}" (${determinedAccessMode === 'restricted' ? 'Private' : 'Public'})`, 'success');
  return newProj;
}

export async function restoreLocalProject(project) {
  const restored = {
    ...project,
    id: 'proj-' + crypto.randomUUID(),
    localOnly: true,
    folderId: state.folders[0]?.id || 'folder-1',
    ownerUid: 'guest',
    accessMode: 'public',
    sharePassword: '',
    allowedEmails: [],
    updatedAt: new Date().toISOString(),
    history: []
  };
  normalizeProjectKeys(restored);
  const projects = [...state.projects, restored];
  clearTimeout(syncTimeout);
  if (!await saveProjectsLocally(projects)) {
    throw new Error(state.saveErrorMessage || 'The browser could not save this backup. Try again after storage is ready.');
  }
  state.projects = projects;
  selectProject(restored.id);
  return restored;
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

    saveProjectsLocally();
    addToast('Schema Imported', `Imported ${result.tables.length} table(s) and ${result.relationships.length} relation(s) into "${proj.name}"`, 'success');
    return proj;
  } else {
    const currentOwnerUid = 'guest';
  const currentOwnerEmail = '';

    const newProj = {
      id: 'proj-' + Date.now().toString(36),
      folderId: folderId || state.folders[0]?.id || 'folder-1',
      name: name || `${effectiveDialect.toUpperCase()} Imported Schema`,
      description: `Imported from ${effectiveDialect.toUpperCase()} SQL script with ${result.tables.length} tables and ${result.relationships.length} relationships.`,
      updatedAt: new Date().toISOString(),
      dialect: effectiveDialect,
      accessMode: 'public',
      sharePassword: '',
      allowedEmails: [],
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
    saveProjectsLocally();
    addToast('Schema Imported', `Created new schema "${newProj.name}" with ${result.tables.length} table(s)`, 'success');
    return newProj;
  }
}

// Import all sample schemas on explicit user action
// Delete Project
export async function deleteProject(projectId) {
  const idx = state.projects.findIndex(p => p.id === projectId);
  if (idx !== -1) {
    const targetProj = state.projects[idx];
    const projName = targetProj.name || 'Untitled Schema';

    // 1. Record in deleted IDs set so it can NEVER resurrect
    recordDeletedProjectId(projectId);

    // 2. Remove from local store
    if (state.projects.length === 1 && !window.__DBMAPS_DESKTOP__) state.showStartPage = true;
    state.projects.splice(idx, 1);

    // 3. Clean local storage caches
    try {
      saveGuestProjectsToStorage();
    } catch (e) {}

    // 4. Update active project
    if (state.activeProjectId === projectId) {
      if (state.projects.length > 0) {
        state.activeProjectId = state.projects[0].id;
        state.roomCode = state.projects[0].id;
      } else if (!window.__DBMAPS_DESKTOP__) {
        state.activeProjectId = null;
        await openStartPage();
      } else {
        const currentOwnerUid = 'guest';
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

    addToast('Database Schema Deleted', `Removed "${projName}" from this browser`, 'info');
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

    // Save updated folders list to browser storage so on reload it NEVER comes back!
    saveFoldersToStorage();

    if (modifiedAny) {
      saveProjectsLocally();
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
    saveProjectsLocally();
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

export function openExportModal(tab = 'diagram') {
  state.exportTab = tab;
  state.modals.export = true;
}

