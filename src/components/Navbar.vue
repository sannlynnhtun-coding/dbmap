<template>
  <header class="studio-header h-14 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700/80 px-2 sm:px-4 flex items-center justify-between select-none z-30 shrink-0 relative">
    <!-- Left Section: Logo & Project Name -->
    <div id="tour-header-project" class="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
      <button
        @click="state.isSidebarCollapsed = !state.isSidebarCollapsed"
        aria-label="Toggle sidebar"
        :aria-expanded="!state.isSidebarCollapsed"
        class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
        title="Show or hide sidebar (Ctrl+B)"
      ><Columns class="w-4 h-4" /></button>
      <!-- Logo: Go to Home / Landing Page -->
      <button
        @click="openHomePage"
        class="flex items-center gap-1.5 font-bold text-indigo-600 dark:text-indigo-400 text-lg shrink-0 hover:opacity-85 transition cursor-pointer"
        title="dbmaps - Go to Home Page"
      >
        <DbMapLogo class-name="w-7 h-7 sm:w-8 sm:h-8 drop-shadow-sm" />
        <span class="hidden md:inline font-mono tracking-tight text-slate-800 dark:text-slate-100 text-base sm:text-lg">
          db<span class="text-indigo-600 dark:text-indigo-400">maps</span>
        </span>
      </button>



        <!-- Live Saving Process Indicator & Immediate Save Trigger -->
        <button
          @click="forceSaveProject"
          id="btn-navbar-save-status"
          class="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono font-medium transition border shrink-0 cursor-pointer shadow-2xs"
          :class="[
            state.saveStatus === 'saving'
              ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-700/80 animate-pulse'
              : state.saveStatus === 'unsaved'
                ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-700/80 dark:hover:bg-blue-900/80'
                : state.saveStatus === 'error'
                  ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-700/80 dark:hover:bg-rose-900/80'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800/80 dark:hover:bg-emerald-900/80'
          ]"
          :title="state.saveStatus === 'unsaved' ? 'Unsaved changes (Click or Ctrl+S to save now)' : state.saveStatus === 'saving' ? 'Saving changes...' : state.saveStatus === 'error' ? 'Save failed: ' + (state.saveErrorMessage || 'Click to retry') : `All changes saved${formattedLastSaved ? ' at ' + formattedLastSaved : ''} (Click to save now)`"
        >
          <Loader2 v-if="state.saveStatus === 'saving'" class="w-3.5 h-3.5 animate-spin text-amber-600 dark:text-amber-400" />
          <CloudUpload v-else-if="state.saveStatus === 'unsaved'" class="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <AlertCircle v-else-if="state.saveStatus === 'error'" class="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
          <CloudCheck v-else class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />

          <span class="save-badge-label font-semibold">
            {{ state.saveStatus === 'saving' ? 'Saving...' : state.saveStatus === 'unsaved' ? 'Unsaved' : state.saveStatus === 'error' ? 'Retry Save' : 'Saved in this browser' }}
          </span>
        </button>

      <!-- Direct 1-Click "New Database" Button in Navbar -->
      <button
        id="btn-navbar-new-database"
        @click="state.modals.newProject = true"
        class="px-2 sm:px-2.5 py-1 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl transition font-semibold text-xs flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer ml-0.5"
        title="Create New Database (Ctrl+N or Alt+N)"
      >
        <Plus class="w-3.5 h-3.5 stroke-[2.5]" />
        <span class="hidden sm:inline">New Database</span>
        <span class="sm:hidden">New</span>
      </button>
    </div>

    <!-- Workspace views share one connected control. -->
    <div role="radiogroup" aria-label="Workspace view" id="tour-view-modes" class="workspace-view-group">
      <label
        class="workspace-view-item"
        title="Split View (Editor & ERD Canvas)"
      >
        <input type="radio" name="workspace-view" value="split" v-model="state.viewMode" aria-label="Split view" class="sr-only" />
        <Columns class="w-3.5 h-3.5 shrink-0" /><span class="view-mode-label">Split</span>
      </label>

      <label
        class="workspace-view-item"
        title="Canvas View (Full ERD Diagram)"
      >
        <input type="radio" name="workspace-view" value="canvas" v-model="state.viewMode" aria-label="Diagram view" class="sr-only" />
        <LayoutGrid class="w-3.5 h-3.5 shrink-0" /><span class="view-mode-label">Diagram</span>
      </label>

      <label
        class="workspace-view-item"
        title="Edit your database schema as DBML code"
      >
        <input type="radio" name="workspace-view" value="editor" v-model="state.viewMode" aria-label="Code view" class="sr-only" />
        <Code2 class="w-3.5 h-3.5 shrink-0" /><span class="view-mode-label">Code</span>
      </label>
    </div>

    <!-- Right-aligned workspace actions -->
    <div class="workspace-tools-container">
      <nav id="tour-workspace-tools" class="workspace-tools" aria-label="Workspace tools">
        <button id="tour-import" @click="state.modals.importSchema = true" title="Import SQL or DBML" aria-label="Import SQL or DBML"><UploadCloud /><span>Import</span></button>
        <button id="tour-export" @click="state.exportTab = 'diagram'; state.modals.export = true" :disabled="!activeProject" title="Export diagram, Markdown or schema code" aria-label="Export schema"><Download /><span>Export</span></button>
        <button id="tour-download-dbml" @click="downloadDbml" :disabled="!activeProject" title="Download DBML file" aria-label="Download DBML file"><FileText /><span>.dbml</span></button>
        <button id="tour-dictionary" @click="state.modals.docs = true" title="Data dictionary" aria-label="Data dictionary"><BookOpen /><span>Dictionary</span></button>
        <span class="workspace-tools-divider" aria-hidden="true"></span>
        <button @click="startTour()" title="Interactive tour" aria-label="Start interactive tour"><Compass /></button>
        <button @click="navigateTo('/learn-dbml')" title="Learn DBML" aria-label="Learn DBML"><Code2 /></button>
        <button @click="toggleDarkMode" title="Toggle color theme" aria-label="Toggle color theme"><Sun v-if="state.isDarkMode" /><Moon v-else /></button>
      </nav>
    </div>
      <!-- Project / Database Name Input -->
      <div class="studio-project-row flex items-center gap-1.5 min-w-0 group/projname relative">
        <Database class="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 hidden xs:block" />
        <button v-if="!isDesktop" @click="openStartPage" title="Close project and return to start" aria-label="Back to projects" class="px-3 py-2 text-xs rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0">Projects</button>
        <label for="studio-project-name" class="sr-only">Project name</label>
        <div class="project-name-field">
          <input
            id="studio-project-name"
            v-model="activeProject.name"
            type="text"
            aria-label="Project name"
            title="Rename project"
            placeholder="Enter a project name"
            @keydown.enter="$event.target.blur()"
          />
          <Pencil class="project-rename-hint w-4 h-4" aria-hidden="true" />
        </div>


      </div>

  </header>
</template>

<script setup>
import { computed } from 'vue';
import { isDesktop } from '../desktop.js';
import { state, activeProject, toggleDarkMode, startTour, navigateTo, forceSaveProject, openStartPage } from '../stores/schemaStore.js';
import { downloadDbmlFile } from '../utils/schemaExport.js';
import DbMapLogo from './DbMapLogo.vue';
import { Pencil, Columns, LayoutGrid, Code2, Download, BookOpen, Sun, Moon, FileText, Compass, UploadCloud, Plus, Database, Loader2, CloudUpload, CloudCheck, AlertCircle } from 'lucide-vue-next';

const formattedLastSaved = computed(() => {
  if (!state.lastSavedAt) return '';
  try {
    const d = new Date(state.lastSavedAt);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch (e) {
    return '';
  }
});

function downloadDbml() {
  if (activeProject.value) downloadDbmlFile(activeProject.value);
}
function openHomePage() { navigateTo('/'); }
</script>
