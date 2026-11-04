<template>
  <div
    v-if="state.modals.newProject"
    class="app-dialog-backdrop fixed inset-0 z-50 bg-slate-900/60  flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
    @keydown.esc="closeModal"
  >
    <div
      role="dialog" aria-modal="true" aria-label="New database" class="app-dialog bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl  w-full max-w-md overflow-hidden text-slate-800 dark:text-slate-100 flex flex-col max-h-[90vh]"
    >
      <!-- Modal Header -->
      <div class="app-dialog-heading px-5 py-3.5 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Database class="w-4 h-4" />
          </div>
          <div>
            <h3 class="font-bold text-sm text-slate-900 dark:text-slate-100">Create New Database</h3>
            <p class="text-[11px] text-slate-500 dark:text-slate-400">Initialize schema canvas or start from a blueprint</p>
          </div>
        </div>
        <button
          id="btn-close-new-project-modal"
          @click="closeModal"
          class="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700 rounded-lg transition cursor-pointer"
          title="Close dialog (Esc)"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Modal Body -->
      <div class="p-5 space-y-4 text-xs overflow-y-auto flex-1">
        <!-- Database Name -->
        <div>
          <label class="block font-bold text-slate-700 dark:text-slate-200 mb-1.5">
            Database Name <span class="text-rose-500">*</span>
          </label>
          <input
            id="input-database-name"
            ref="nameInputRef"
            v-model="projectName"
            type="text"
            placeholder="e.g. Production DB, Analytics Engine, E-Commerce"
            class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs font-medium transition"
            @keydown.enter="confirm"
          />
        </div>

        <!-- Database Dialect / Engine -->
        <div>
          <label class="block font-bold text-slate-700 dark:text-slate-200 mb-1.5">Database Engine / SQL Dialect</label>
          <div class="grid grid-cols-4 gap-2">
            <button
              v-for="d in dialects"
              :key="d.id"
              type="button"
              @click="dialect = d.id"
              class="py-1.5 px-2 rounded-xl border text-center transition font-semibold text-[11px] cursor-pointer flex flex-col items-center justify-center gap-0.5"
              :class="[
                dialect === d.id
                  ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500 shadow-xs'
                  : 'border-slate-200 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
              ]"
            >
              <span>{{ d.name }}</span>
              <span class="text-[9px] font-normal opacity-70">{{ d.badge }}</span>
            </button>
          </div>
        </div>

        <!-- Starter Template Selection -->
        <div>
          <label class="block font-bold text-slate-700 dark:text-slate-200 mb-1.5">Starter Blueprint</label>
          <select
            v-model="template"
            class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 text-xs cursor-pointer"
          >
            <option value="">Blank Database (Start clean with empty canvas)</option>
            <option value="E-Commerce Database">E-Commerce Template (Users, Orders, Products, Payments - 6 tables)</option>
            <option value="SaaS Billing & Subscriptions">SaaS Billing & Subscriptions (Plans, Workspaces, Invoices - 3 tables)</option>
          </select>
        </div>

        <!-- Database Folder / Group -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="block font-bold text-slate-700 dark:text-slate-200">Database Group</label>
            <button
              type="button"
              @click="isCreatingNewGroup = !isCreatingNewGroup"
              class="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus v-if="!isCreatingNewGroup" class="w-3 h-3" />
              <span>{{ isCreatingNewGroup ? 'Choose existing' : '+ New group' }}</span>
            </button>
          </div>

          <div v-if="isCreatingNewGroup" class="space-y-1">
            <input
              v-model="newGroupName"
              type="text"
              placeholder="Enter new group name (e.g. Microservices)"
              class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-blue-500 rounded-xl text-slate-800 dark:text-slate-200 outline-none text-xs font-medium"
            />
          </div>
          <select
            v-else
            v-model="folderId"
            class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 text-xs cursor-pointer"
          >
            <option v-for="f in (state.databases || state.folders)" :key="f.id" :value="f.id">{{ f.name }}</option>
          </select>
        </div>

        <!-- Privacy & Database Isolation Mode -->
        <div>
          <label class="block font-bold text-slate-700 dark:text-slate-200 mb-1.5">Access & Isolation</label>
          <select
            v-model="accessMode"
            class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 text-xs cursor-pointer"
          >
            <option value="restricted">🔒 Private to My Account (Strictly isolated)</option>
            <option value="public">🌐 Public (Anyone with link can collaborate)</option>
            <option value="password">🔑 Password Protected (Passkey required)</option>
          </select>
          <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            <span v-if="accessMode === 'restricted'">Only your signed-in account and invited teammates can view or edit this database.</span>
            <span v-else-if="accessMode === 'public'">Anyone with the share URL can view and collaborate in real-time.</span>
            <span v-else>Anyone with the share link will be prompted for your secure passkey.</span>
          </p>
        </div>

        <!-- Passkey for password protected mode -->
        <div v-if="accessMode === 'password'">
          <label class="block font-bold text-slate-700 dark:text-slate-200 mb-1.5">Passkey</label>
          <input
            v-model="sharePassword"
            type="password"
            placeholder="Enter secure access password"
            class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 text-xs font-medium"
          />
        </div>

        <!-- Description (Optional) -->
        <div>
          <label class="block font-bold text-slate-700 dark:text-slate-200 mb-1.5">Description <span class="font-normal text-slate-400">(Optional)</span></label>
          <textarea
            v-model="description"
            rows="2"
            placeholder="Database schema purpose, architectural notes..."
            class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 text-xs resize-none"
          ></textarea>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="px-5 py-3.5 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 text-xs shrink-0">
        <span class="text-[11px] text-slate-400 dark:text-slate-500 hidden xs:inline">
          Press <kbd class="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px] text-slate-600 dark:text-slate-300">Enter ↵</kbd> to create
        </span>
        <div class="flex items-center gap-2 ml-auto">
          <button
            @click="closeModal"
            class="px-3.5 py-1.5 text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer font-medium"
          >
            Cancel
          </button>
          <button
            id="btn-confirm-create-database"
            @click="confirm"
            :disabled="!projectName.trim()"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl  transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus class="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Create Database</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue';
import { state, createProject, createFolder } from '../stores/schemaStore.js';
import { X, Database, Plus } from 'lucide-vue-next';

const nameInputRef = ref(null);
const projectName = ref('');
const folderId = ref(state.folders[0]?.id || 'folder-1');
const isCreatingNewGroup = ref(false);
const newGroupName = ref('');
const dialect = ref('postgres');
const description = ref('');
const template = ref('');
const accessMode = ref(state.currentUser.isLoggedIn ? 'restricted' : 'public');
const sharePassword = ref('');

const dialects = [
  { id: 'postgres', name: 'PostgreSQL', badge: 'PG' },
  { id: 'mysql', name: 'MySQL', badge: 'v8' },
  { id: 'sqlite', name: 'SQLite', badge: 'Embedded' },
  { id: 'mssql', name: 'SQL Server', badge: 'T-SQL' }
];

watch(
  () => state.modals.newProject,
  (isOpen) => {
    if (isOpen) {
      projectName.value = '';
      description.value = '';
      template.value = '';
      dialect.value = 'postgres';
      isCreatingNewGroup.value = false;
      newGroupName.value = '';
      folderId.value = state.folders[0]?.id || 'folder-1';
      accessMode.value = state.currentUser.isLoggedIn ? 'restricted' : 'public';
      sharePassword.value = '';
      nextTick(() => {
        nameInputRef.value?.focus();
      });
    }
  }
);

function closeModal() {
  state.modals.newProject = false;
}

function confirm() {
  const trimmedName = projectName.value.trim();
  if (!trimmedName) return;

  let targetFolderId = folderId.value;
  if (isCreatingNewGroup.value && newGroupName.value.trim()) {
    const newGroup = createFolder(newGroupName.value.trim());
    targetFolderId = newGroup.id;
  }

  createProject(
    trimmedName,
    targetFolderId,
    description.value,
    template.value || null,
    accessMode.value,
    sharePassword.value,
    dialect.value
  );

  closeModal();
}
</script>
