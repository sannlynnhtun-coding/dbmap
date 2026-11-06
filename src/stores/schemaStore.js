import { reactive, computed, watch, ref } from 'vue';
import { SAMPLE_PROJECTS, INITIAL_FOLDERS, createDefaultBlankProject } from '../utils/sampleSchemas.js';
import { generateDBML, parseDBML, exportToSQL, extractCleanNote, updateTableHeaderColorInDBML } from '../utils/dbmlParser.js';
import { parseSQLSchema } from '../utils/sqlImporter.js';
import { MARKETPLACE_TEMPLATES } from '../utils/marketplaceTemplates.js';

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
  try {
    const key = getProjectOrderStorageKey();
    const data = JSON.stringify(state.projectOrder || {});
    localStorage.setItem(key, data);
    localStorage.setItem('dbmaps_project_order_latest', data);
  } catch (e) {}

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

  state.currentRoute = path;
  if (typeof window !== 'undefined') {
    window.history.pushState(null, '', path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  if (isComplete) {
    addToast('Tour Completed! 🎉', 'You are ready to architect databases. Launch the walkthrough anytime from the More menu.', 'success');
  } else {
    addToast('Tour Dismissed', 'You can restart the interactive walkthrough anytime from the More menu.', 'info');
  }
}

export function saveProjectsLocally() {
  try {
    localStorage.setItem('dbmaps_guest_projects', JSON.stringify(state.projects));
    state.saveStatus = 'saved';
    state.lastSavedAt = new Date().toISOString();
  } catch {
    state.saveStatus = 'error';
    state.saveErrorMessage = 'Browser storage is unavailable or full.';
  }
}

export function flushActiveProjectSync() {
  clearTimeout(syncTimeout);
  saveProjectsLocally();
}

export function forceSaveProject() {
  flushActiveProjectSync();
  if (state.saveStatus === 'saved') {
    addToast('Saved Locally', 'Project saved in this browser.', 'success');
  } else {
    addToast('Save Warning', state.saveErrorMessage, 'warning');
  }
}

export function selectProject(projectId) {
  if (!projectId || projectId === state.activeProjectId) return;

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
  const id = new URLSearchParams(window.location.search).get('schema');
  if (id && state.projects.some(project => project.id === id)) selectProject(id);
}

// Toast helper
export function addToast(title, message, type = 'info') {
  const id = Date.now() + Math.random();
  state.toasts.push({ id, title, message, type });
  setTimeout(() => {
    state.toasts = state.toasts.filter(t => t.id !== id);
  }, 3500);
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
    if (!proj || !proj.id) return;
    if (proj.id !== currentWatchedProjectId) {
      currentWatchedProjectId = proj.id;
      return; // Switched active project reference; wait for actual user mutations
    }

    // Mark as unsaved immediately when user makes schema mutations
    state.saveStatus = 'unsaved';

    if (syncTimeout) clearTimeout(syncTimeout);
    syncTimeout = setTimeout(() => {
      saveProjectsLocally();
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
  });
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
  saveProjectsLocally();

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
    proj.updatedAt = new Date().toISOString();
    saveGuestProjectsToStorage();
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
    proj.updatedAt = new Date().toISOString();
    saveGuestProjectsToStorage();
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
    proj.updatedAt = new Date().toISOString();
    saveGuestProjectsToStorage();
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
  proj.updatedAt = new Date().toISOString();
  saveGuestProjectsToStorage();
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
    proj.updatedAt = new Date().toISOString();
    saveGuestProjectsToStorage();
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

  proj.updatedAt = new Date().toISOString();
  saveGuestProjectsToStorage();
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
    proj.updatedAt = new Date().toISOString();
    saveGuestProjectsToStorage();
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
    proj.updatedAt = new Date().toISOString();
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
    proj.updatedAt = new Date().toISOString();
    saveProjectsLocally();
    addToast('Version Restored', `Restored schema to "${commit.versionName}"`, 'info');
  }
}

// Update Active Project Target SQL Dialect
export function setProjectDialect(dialect) {
  const proj = activeProject.value;
  if (!proj) return;
  proj.dialect = dialect;
  proj.updatedAt = new Date().toISOString();
  saveProjectsLocally();
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
  saveProjectsLocally();
  saveGuestProjectsToStorage();
  addToast('Project Created', `Started "${projectName}" (${determinedAccessMode === 'restricted' ? 'Private' : 'Public'})`, 'success');
  return newProj;
}

export function restoreLocalProject(project) {
  const restored = {
    ...project,
    id: 'proj-' + crypto.randomUUID(),
    localOnly: true,
    folderId: state.folders[0]?.id || 'folder-1',
    ownerUid: 'guest',
    accessMode: 'public',
    updatedAt: new Date().toISOString(),
    history: []
  };
  normalizeProjectKeys(restored);
  const projects = [...state.projects, restored];
  try {
    localStorage.setItem('dbmaps_guest_projects', JSON.stringify(projects));
  } catch {
    throw new Error('The browser could not save this backup. Check available storage and try again.');
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
    proj.updatedAt = new Date().toISOString();
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
    saveGuestProjectsToStorage();
    addToast('Schema Imported', `Created new schema "${newProj.name}" with ${result.tables.length} table(s)`, 'success');
    return newProj;
  }
}

// Import all sample schemas on explicit user action
export function importSampleSchemas(targetFolderId = null) {
  const currentOwnerUid = 'guest';
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
      saveProjectsLocally();
    }
    saveGuestProjectsToStorage();
  }

  addToast('Sample Schemas Imported', `Loaded ${importedProjects.length} sample templates (E-Commerce & SaaS Billing)`, 'success');
}

// Import a single sample schema by name
export function importSampleSchemaByName(name, targetFolderId = null) {
  const sample = SAMPLE_PROJECTS.find(s => s.name.toLowerCase() === name.toLowerCase()) || SAMPLE_PROJECTS[0];
  if (!sample) return;

  const currentOwnerUid = 'guest';
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
    saveProjectsLocally();
  }
  saveGuestProjectsToStorage();
  addToast('Sample Schema Imported', `Loaded "${newProj.name}"`, 'success');
}

// Current user admin check
export const allMarketplaceTemplates = computed(() =>
  MARKETPLACE_TEMPLATES.map(template => ({ ...template, isBuiltIn: true }))
);

export function cloneMarketplaceTemplate(template, targetFolderId = null) {
  if (!template) return null;

  const currentOwnerUid = 'guest';
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
    saveProjectsLocally();
  }
  saveGuestProjectsToStorage();

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
    const projName = targetProj.name || 'Untitled Schema';

    // 1. Record in deleted IDs set so it can NEVER resurrect
    recordDeletedProjectId(projectId);

    // 2. Remove from local store
    state.projects.splice(idx, 1);

    // 3. Clean local storage caches
    try {
      localStorage.removeItem('dbmaps_local_schema_' + projectId);
      saveGuestProjectsToStorage();
    } catch (e) {}

    // 4. Update active project
    if (state.activeProjectId === projectId) {
      if (state.projects.length > 0) {
        state.activeProjectId = state.projects[0].id;
        state.roomCode = state.projects[0].id;
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

