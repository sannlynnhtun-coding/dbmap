<template>
  <div
    v-if="state.modals.submitToMarketplace"
    class="app-dialog-backdrop fixed inset-0 z-50 bg-slate-900/60  flex items-center justify-center p-3 sm:p-5"
    @click.self="closeModal"
  >
    <div v-dialog
      role="dialog" aria-modal="true" aria-label="Marketplace submission" class="app-dialog bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl  w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100 transition-all animate-in fade-in zoom-in-95 duration-150"
    >
      <!-- MODAL HEADER -->
      <div class="app-dialog-heading px-6 py-4 bg-slate-50/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
        <div class="flex items-center gap-3">
          <div
            class="p-2.5 rounded-xl text-white  shrink-0"
            :class="isSystemBlueprint ? '   bg-blue-700' : '   bg-blue-700'"
          >
            <Zap v-if="isSystemBlueprint" class="w-5 h-5" />
            <UploadCloud v-else class="w-5 h-5" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="font-bold text-slate-900 dark:text-white text-base sm:text-lg">
                {{ isEditMode ? 'Edit Marketplace Blueprint' : (isSystemBlueprint ? 'Create dbmaps System Blueprint' : 'Submit Database to Marketplace') }}
              </h2>
              <span
                v-if="isSystemBlueprint"
                class="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-800 flex items-center gap-1"
              >
                <ShieldCheck class="w-3 h-3 text-blue-600 dark:text-blue-400" />
                <span>dbmaps System</span>
              </span>
              <span
                v-else
                class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
              >
                Community
              </span>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {{ isSystemBlueprint ? 'Curate an official system architecture template with verified author badges.' : 'Publish your schema blueprint to the public dbmaps Community Marketplace.' }}
            </p>
          </div>
        </div>

        <button aria-label="Close dialog"
          @click="closeModal"
          class="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- MODAL BODY: SCROLLABLE FORM -->
      <form @submit.prevent="handleSubmit" class="flex-1 overflow-y-auto p-6 space-y-5 bg-white dark:bg-slate-900">
        <!-- Error Banner if any -->
        <div
          v-if="errorMessage"
          class="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center gap-2"
        >
          <AlertCircle class="w-4 h-4 shrink-0 text-red-500" />
          <span>{{ errorMessage }}</span>
        </div>

        <!-- ADMIN CONTROLS: OFFICIAL SYSTEM BLUEPRINT TOGGLE -->
        <div
          v-if="isCurrentUserAdmin"
          class="p-4 rounded-xl border transition-all"
          :class="isSystemBlueprint ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/80' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800'"
        >
          <div class="flex items-center justify-between gap-4">
            <div class="flex items-center gap-2.5">
              <div class="p-1.5 rounded-lg" :class="isSystemBlueprint ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'">
                <ShieldCheck class="w-4 h-4" />
              </div>
              <div>
                <div class="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>Official dbmaps System Blueprint</span>
                  <span class="text-[9px] px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-mono">ADMIN ONLY</span>
                </div>
                <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Tag as verified first-party architecture, display with verified shield and dbmaps System badge.
                </p>
              </div>
            </div>

            <label class="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                v-model="isSystemBlueprint"
                @change="handleSystemBlueprintToggle"
                class="sr-only peer"
              />
              <div class="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        <!-- In Edit Mode: Option to retain existing tables or replace from Project -->
        <div v-if="isEditMode" class="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
          <div class="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
            <span>Schema Entity Source:</span>
            <span class="font-mono text-[11px] text-blue-500">
              {{ useExistingTables ? 'Retaining current blueprint tables' : 'Syncing from selected project' }}
            </span>
          </div>
          <div class="flex flex-col sm:flex-row sm:items-center gap-3 text-xs">
            <label class="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
              <input type="radio" :value="true" v-model="useExistingTables" class="text-blue-600 focus:ring-blue-500" />
              <span>Keep existing blueprint tables ({{ editingTemplateTablesCount }} tables)</span>
            </label>
            <label class="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
              <input type="radio" :value="false" v-model="useExistingTables" class="text-blue-600 focus:ring-blue-500" />
              <span>Replace with tables from Studio project</span>
            </label>
          </div>
        </div>

        <!-- 1. Select Source Database Project -->
        <div v-if="!isEditMode || !useExistingTables">
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            {{ isEditMode ? 'Select Project to Update Blueprint Tables From:' : '1. Select Database to Publish:' }}
          </label>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div
              v-for="proj in eligibleProjects"
              :key="proj.id"
              @click="selectProjectForSubmission(proj)"
              class="p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between"
              :class="[
                selectedProjectId === proj.id
                  ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40'
              ]"
            >
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <div class="font-bold text-xs text-slate-900 dark:text-white truncate">
                    {{ proj.name }}
                  </div>
                  <div class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                    {{ proj.description || 'No description provided' }}
                  </div>
                </div>
                <CheckCircle2
                  v-if="selectedProjectId === proj.id"
                  class="w-4 h-4 text-emerald-500 shrink-0 mt-0.5"
                />
              </div>

              <div class="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                <span class="flex items-center gap-1">
                  <Database class="w-3 h-3 text-blue-500" />
                  <strong>{{ (proj.tables || []).length }}</strong> tables
                </span>
                <span class="flex items-center gap-1">
                  <GitFork class="w-3 h-3 text-blue-500" />
                  <strong>{{ (proj.relationships || []).length }}</strong> relations
                </span>
                <span class="uppercase font-bold text-slate-600 dark:text-slate-300">
                  {{ proj.dialect || 'postgres' }}
                </span>
              </div>
            </div>
          </div>

          <p v-if="eligibleProjects.length === 0 && !isEditMode" class="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
            <AlertCircle class="w-3.5 h-3.5" />
            <span>You don't have any databases with tables yet. Create some tables in Studio before publishing.</span>
          </p>
        </div>

        <!-- 2. Marketplace Metadata -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
          <!-- Title -->
          <div class="sm:col-span-2">
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Marketplace Blueprint Title *
            </label>
            <input
              v-model="form.name"
              type="text"
              required
              placeholder="e.g. Modern Subscription Billing & Multi-Tenancy"
              class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <!-- Category -->
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Domain / Category *
            </label>
            <select
              v-model="form.category"
              class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="saas">B2B SaaS & Cloud</option>
              <option value="fintech">FinTech & Accounting</option>
              <option value="healthcare">Healthcare & Clinical</option>
              <option value="ecommerce">E-Commerce & Retail</option>
              <option value="logistics">Logistics & Supply Chain</option>
              <option value="productivity">Productivity & Workflows</option>
              <option value="education">Education & LMS</option>
              <option value="iot">IoT & Telemetry</option>
              <option value="hr">Human Resources & Payroll</option>
              <option value="hospitality">Hospitality & Booking</option>
              <option value="other">General Purpose</option>
            </select>
          </div>

          <!-- Complexity Tier -->
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Architecture Complexity *
            </label>
            <select
              v-model="form.complexity"
              class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Starter">Starter (1-4 tables, normalized baseline)</option>
              <option value="Intermediate">Intermediate (5-9 tables, production ready)</option>
              <option value="Advanced">Advanced (10-19 tables, complex relationships)</option>
              <option value="Enterprise">Enterprise (20+ tables, full audit / RBAC)</option>
            </select>
          </div>

          <!-- SQL Dialect -->
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Primary SQL Dialect *
            </label>
            <select
              v-model="form.dialect"
              class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="postgres">PostgreSQL</option>
              <option value="mysql">MySQL</option>
              <option value="sqlite">SQLite</option>
              <option value="mssql">MS SQL Server</option>
              <option value="dbml">Generic DBML</option>
            </select>
          </div>

          <!-- Author Attribution -->
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Author / Architect Name *
            </label>
            <input
              v-model="form.authorName"
              type="text"
              required
              :placeholder="isSystemBlueprint ? 'dbmaps System' : 'Your name or organization'"
              class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <!-- Author Title / Role -->
          <div class="sm:col-span-2">
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Author Professional Title
            </label>
            <input
              v-model="form.authorTitle"
              type="text"
              :placeholder="isSystemBlueprint ? 'dbmaps Core Architecture Engine' : 'e.g. Lead Database Architect, Fullstack Engineer'"
              class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <!-- Description -->
          <div class="sm:col-span-2">
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Blueprint Description & Use Case *
            </label>
            <textarea
              v-model="form.description"
              rows="3"
              required
              placeholder="Explain what practical business problem this database schema solves, key entities, and usage considerations..."
              class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none leading-relaxed"
            ></textarea>
          </div>

          <!-- Highlights -->
          <div class="sm:col-span-2">
            <div class="flex items-center justify-between mb-1.5">
              <label class="text-xs font-bold text-slate-700 dark:text-slate-300">
                Architectural Highlights & Features (3-4 points)
              </label>
              <button
                type="button"
                @click="addHighlight"
                class="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
              >
                <Plus class="w-3.5 h-3.5" />
                <span>Add Point</span>
              </button>
            </div>
            <div class="space-y-2">
              <div
                v-for="(hl, idx) in form.highlights"
                :key="idx"
                class="flex items-center gap-2"
              >
                <input
                  v-model="form.highlights[idx]"
                  type="text"
                  placeholder="Feature point (e.g. Row-level security for tenant isolation)"
                  class="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  v-if="form.highlights.length > 1"
                  @click="removeHighlight(idx)"
                  class="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. LIVE CARD PREVIEW -->
        <div class="pt-3 border-t border-slate-100 dark:border-slate-800">
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
            Marketplace Card Live Preview
          </label>
          <div class="max-w-md mx-auto bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
            <div class="flex items-start justify-between gap-2 mb-2">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span
                  v-if="isSystemBlueprint"
                  class="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1"
                >
                  <ShieldCheck class="w-3 h-3 text-blue-600 dark:text-blue-400" />
                  <span>dbmaps System</span>
                </span>
                <span
                  v-else
                  class="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                >
                  Community
                </span>
                <span class="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                  {{ form.complexity }}
                </span>
              </div>
              <span class="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/80">
                Free
              </span>
            </div>

            <h4 class="font-bold text-slate-900 dark:text-white text-sm">
              {{ form.name || 'Untitled Blueprint' }}
            </h4>
            <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
              {{ form.description || 'Database schema blueprint description...' }}
            </p>

            <div class="mt-3 pt-2.5 border-t border-slate-200/70 dark:border-slate-700 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              <span>{{ previewTablesCount }} tables</span>
              <span>{{ previewRelationsCount }} relations</span>
              <span class="uppercase font-semibold text-blue-500">{{ form.dialect }}</span>
            </div>
          </div>
        </div>
      </form>

      <!-- MODAL FOOTER -->
      <div class="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
        <button
          type="button"
          @click="closeModal"
          class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          Cancel
        </button>

        <button
          @click="handleSubmit"
          :disabled="isSubmitting || (!useExistingTables && (!activeSelectedProject || activeSelectedProject.tables.length === 0))"
          class="px-5 py-2 font-bold text-xs rounded-xl  transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 text-white"
          :class="isSystemBlueprint ? '     bg-blue-700' : '     bg-blue-700'"
        >
          <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
          <ShieldCheck v-else-if="isSystemBlueprint" class="w-4 h-4" />
          <UploadCloud v-else class="w-4 h-4" />
          <span>{{ isSubmitting ? 'Saving Blueprint...' : (isEditMode ? 'Save Blueprint Updates' : (isSystemBlueprint ? 'Publish Official System Blueprint' : 'Publish to Marketplace')) }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import {
  state,
  activeProject,
  isCurrentUserAdmin,
  submitProjectToMarketplace,
  closeSubmitToMarketplace
} from '../stores/schemaStore.js';
import {
  UploadCloud,
  X,
  Database,
  GitFork,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Loader2,
  ShieldCheck,
  Zap
} from 'lucide-vue-next';

const selectedProjectId = ref(null);
const isSubmitting = ref(false);
const errorMessage = ref('');
const isSystemBlueprint = ref(false);
const useExistingTables = ref(false);

const form = ref({
  id: '',
  name: '',
  category: 'saas',
  complexity: 'Intermediate',
  dialect: 'postgres',
  authorName: '',
  authorTitle: 'Community Architect',
  authorAvatar: '',
  description: '',
  highlights: [
    'Strict relational foreign key integrity constraints',
    'Optimized indexing on primary and foreign keys',
    'Ready for immediate production deployment'
  ]
});

const isEditMode = computed(() => {
  return !!state.editingMarketplaceTemplate && !state.editingMarketplaceTemplate.isNewSystem;
});

const editingTemplateTablesCount = computed(() => {
  if (state.editingMarketplaceTemplate && Array.isArray(state.editingMarketplaceTemplate.tables)) {
    return state.editingMarketplaceTemplate.tables.length;
  }
  return 0;
});

const eligibleProjects = computed(() => {
  return state.projects.filter(p => p.tables && p.tables.length > 0);
});

const activeSelectedProject = computed(() => {
  return state.projects.find(p => p.id === selectedProjectId.value) || null;
});

const previewTablesCount = computed(() => {
  if (useExistingTables.value && state.editingMarketplaceTemplate?.tables) {
    return state.editingMarketplaceTemplate.tables.length;
  }
  return activeSelectedProject.value ? activeSelectedProject.value.tables.length : 0;
});

const previewRelationsCount = computed(() => {
  if (useExistingTables.value && state.editingMarketplaceTemplate?.relationships) {
    return state.editingMarketplaceTemplate.relationships.length;
  }
  return activeSelectedProject.value ? (activeSelectedProject.value.relationships || []).length : 0;
});

function handleSystemBlueprintToggle() {
  if (isSystemBlueprint.value) {
    form.value.authorName = 'dbmaps System';
    form.value.authorTitle = 'dbmaps Core Architecture Engine';
    form.value.authorAvatar = 'https://api.dicebear.com/7.x/identicon/svg?seed=dbmaps-system';
  } else {
    form.value.authorName = state.currentUser.name || 'Community Architect';
    form.value.authorTitle = 'Community Architect';
    form.value.authorAvatar = '';
  }
}

// Watch when modal opens to initialize selection and pre-fill
watch(
  () => state.modals.submitToMarketplace,
  (isOpen) => {
    if (isOpen) {
      errorMessage.value = '';
      const editingTpl = state.editingMarketplaceTemplate;

      if (editingTpl) {
        // Mode: Editing an existing blueprint or creating an official system blueprint
        form.value.id = editingTpl.id || '';
        form.value.name = editingTpl.name || '';
        form.value.category = editingTpl.category || 'saas';
        form.value.complexity = editingTpl.complexity || 'Intermediate';
        form.value.dialect = editingTpl.dialect || 'postgres';
        form.value.description = editingTpl.description || '';
        form.value.authorName = editingTpl.author?.name || editingTpl.authorName || (isCurrentUserAdmin.value ? 'dbmaps System' : '');
        form.value.authorTitle = editingTpl.author?.title || editingTpl.authorTitle || 'dbmaps Core Architecture Engine';
        form.value.authorAvatar = editingTpl.author?.avatar || editingTpl.authorAvatar || '';

        if (Array.isArray(editingTpl.highlights) && editingTpl.highlights.length > 0) {
          form.value.highlights = [...editingTpl.highlights];
        }

        isSystemBlueprint.value = editingTpl.isSystem || editingTpl.isNewSystem || (isCurrentUserAdmin.value && editingTpl.badge === 'dbmaps System');
        useExistingTables.value = !!(editingTpl.tables && editingTpl.tables.length > 0);

        // Select active project as fallback
        if (activeProject.value) {
          selectedProjectId.value = activeProject.value.id;
        }
      } else {
        // Mode: Standard New Community Submission
        form.value.id = '';
        isSystemBlueprint.value = false;
        useExistingTables.value = false;
        form.value.highlights = [
          'Strict relational foreign key integrity constraints',
          'Optimized indexing on primary and foreign keys',
          'Ready for immediate production deployment'
        ];

        const current = activeProject.value;
        const targetProj = current && current.tables.length > 0
          ? current
          : eligibleProjects.value[0] || null;

        if (targetProj) {
          selectProjectForSubmission(targetProj);
        } else if (current) {
          selectedProjectId.value = current.id;
          form.value.name = current.name;
          form.value.dialect = current.dialect || 'postgres';
        }

        if (state.currentUser.name && !form.value.authorName) {
          form.value.authorName = state.currentUser.name;
        }
      }
    }
  }
);

function selectProjectForSubmission(proj) {
  selectedProjectId.value = proj.id;
  if (!isEditMode.value) {
    form.value.name = proj.name;
    form.value.description = proj.description || `Database schema for ${proj.name}`;
    form.value.dialect = proj.dialect || 'postgres';

    const count = (proj.tables || []).length;
    if (count <= 4) form.value.complexity = 'Starter';
    else if (count <= 9) form.value.complexity = 'Intermediate';
    else if (count <= 19) form.value.complexity = 'Advanced';
    else form.value.complexity = 'Enterprise';
  }

  if (!form.value.authorName) {
    form.value.authorName = isSystemBlueprint.value ? 'dbmaps System' : (state.currentUser.name || 'Community Architect');
  }
}

function addHighlight() {
  form.value.highlights.push('');
}

function removeHighlight(idx) {
  form.value.highlights.splice(idx, 1);
}

function closeModal() {
  closeSubmitToMarketplace();
  errorMessage.value = '';
}

async function handleSubmit() {
  errorMessage.value = '';

  if (!useExistingTables.value && !selectedProjectId.value) {
    errorMessage.value = 'Please select a database to publish.';
    return;
  }

  if (!useExistingTables.value) {
    const proj = state.projects.find(p => p.id === selectedProjectId.value);
    if (!proj || !proj.tables || proj.tables.length === 0) {
      errorMessage.value = 'The selected database must have at least 1 table.';
      return;
    }
  }

  if (!form.value.name.trim()) {
    errorMessage.value = 'Please enter a title for the marketplace blueprint.';
    return;
  }

  if (!form.value.authorName.trim()) {
    errorMessage.value = 'Please enter the author name.';
    return;
  }

  isSubmitting.value = true;
  try {
    await submitProjectToMarketplace({
      id: form.value.id || undefined,
      projectId: selectedProjectId.value,
      useExistingTables: useExistingTables.value,
      name: form.value.name,
      category: form.value.category,
      complexity: form.value.complexity,
      dialect: form.value.dialect,
      isSystem: isSystemBlueprint.value,
      badge: isSystemBlueprint.value ? 'dbmaps System' : 'Community',
      authorName: form.value.authorName,
      authorTitle: form.value.authorTitle,
      authorAvatar: form.value.authorAvatar,
      description: form.value.description,
      highlights: form.value.highlights
    });
    closeModal();
  } catch (err) {
    errorMessage.value = err.message || 'Failed to save blueprint.';
  } finally {
    isSubmitting.value = false;
  }
}
</script>
