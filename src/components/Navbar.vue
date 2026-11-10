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

    <!-- Center Section: View Mode Switcher (Icons-only on small screens, Icons + Text on md+ screens) -->
    <div role="radiogroup" aria-label="Workspace view" id="tour-view-modes" class="flex items-center bg-slate-100 dark:bg-slate-900 p-0.5 sm:p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs shrink-0">
      <label
        class="px-2 sm:px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1.5 cursor-pointer"
        :class="[
          state.viewMode === 'split'
            ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
        ]"
        title="Split View (Editor & ERD Canvas)"
      >
        <input type="radio" name="workspace-view" value="split" v-model="state.viewMode" aria-label="Split view" class="sr-only" />
        <Columns class="w-3.5 h-3.5 shrink-0" /><span class="view-mode-label">Split</span>
      </label>

      <label
        class="px-2 sm:px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1.5 cursor-pointer"
        :class="[
          state.viewMode === 'canvas'
            ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
        ]"
        title="Canvas View (Full ERD Diagram)"
      >
        <input type="radio" name="workspace-view" value="canvas" v-model="state.viewMode" aria-label="Diagram view" class="sr-only" />
        <LayoutGrid class="w-3.5 h-3.5 shrink-0" /><span class="view-mode-label">Diagram</span>
      </label>

      <label
        class="px-2 sm:px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1.5 cursor-pointer"
        :class="[
          state.viewMode === 'editor'
            ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
        ]"
        title="Edit your database schema as DBML code"
      >
        <input type="radio" name="workspace-view" value="editor" v-model="state.viewMode" aria-label="Code view" class="sr-only" />
        <Code2 class="w-3.5 h-3.5 shrink-0" /><span class="view-mode-label">Code</span>
      </label>
    </div>

    <!-- Right Section: Compact, responsive, organized dropdowns -->
    <div class="flex items-center gap-1 sm:gap-1.5 md:gap-2 shrink-0">
      <!-- Schema Marketplace & Blueprints Button (Direct access on lg+ screens) -->
      <button
        id="tour-marketplace"
        @click="state.modals.marketplace = true"
        title="Browse Curated Database Blueprints (Schema Marketplace)"
        class="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80 transition shrink-0 cursor-pointer shadow-xs"
      >
        <Store class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
        <span>Marketplace</span>
      </button>


      <!-- Unified Actions Dropdown: More Menu -->
      <div id="tour-actions-menu" class="relative" ref="actionsDropdownRef">
        <button
          @click="toggleActionsMenu"
          class="px-2 sm:px-2.5 py-1.5 bg-slate-100 dark:bg-slate-700/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-xl border border-slate-200 dark:border-slate-600 transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          :class="{ 'ring-2 ring-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700': isActionsMenuOpen }"
          title="More Tools, Marketplace, Export & Navigation"
        >
          <MoreHorizontal class="w-4 h-4 shrink-0" />
          <span class="hidden sm:inline">More</span>
          <span
            v-if="state.collaborators.length > 1"
            class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse md:hidden"
            title="Collaborators active"
          ></span>
          <ChevronDown
            class="w-3 h-3 text-slate-400 dark:text-slate-400 transition-transform duration-200 hidden sm:inline"
            :class="{ 'rotate-180': isActionsMenuOpen }"
          />
        </button>

        <!-- Actions Dropdown Panel -->
        <transition
          enter-active-class="transition duration-150 ease-out"
          enter-from-class="transform scale-95 opacity-0 -translate-y-1"
          enter-to-class="transform scale-100 opacity-100 translate-y-0"
          leave-active-class="transition duration-100 ease-in"
          leave-from-class="transform scale-100 opacity-100 translate-y-0"
          leave-to-class="transform scale-95 opacity-0 -translate-y-1"
        >
          <div
            v-if="isActionsMenuOpen"
            class="absolute right-0 top-full mt-2 w-72 sm:w-84 max-h-[calc(100vh-4.5rem)] overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-2 z-50 text-slate-800 dark:text-slate-100 space-y-1"
          >
            <!-- Quick Database Creation -->
            <button
              id="btn-actions-new-database"
              @click="triggerAction('newDatabase')"
              class="w-full p-2 rounded-xl bg-blue-50/70 hover:bg-blue-100/80 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 border border-blue-200/80 dark:border-blue-800/80 text-left transition flex items-start gap-2.5 group cursor-pointer mb-1"
            >
              <div class="p-2 rounded-xl bg-blue-600 text-white group-hover:scale-105 transition-transform shrink-0 shadow-xs">
                <Plus class="w-4 h-4 stroke-[2.5]" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <div class="font-bold text-xs text-blue-900 dark:text-blue-200">
                    Create New Database
                  </div>
                  <span class="text-[9px] font-bold text-blue-700 dark:text-blue-300 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-700">
                    Ctrl+N
                  </span>
                </div>
                <div class="text-[11px] text-blue-700/80 dark:text-blue-300/80 mt-0.5 leading-snug line-clamp-1">
                  Start a new schema model or starter blueprint.
                </div>
              </div>
            </button>

            <!-- Section 1: Blueprints & Intelligence -->
            <div class="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Blueprints & Docs
            </div>

            <!-- Item: Schema Marketplace -->
            <button
              @click="triggerAction('marketplace')"
              class="w-full p-2 rounded-xl hover:bg-indigo-50 dark:hover:bg-slate-700/70 text-left transition flex items-start gap-2.5 group cursor-pointer"
            >
              <div class="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform shrink-0">
                <Store class="w-4 h-4" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <div class="font-semibold text-xs text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                    Schema Marketplace
                  </div>
                </div>
                <div class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug line-clamp-1">
                  Explore curated schemas for SaaS, E-Commerce & more.
                </div>
              </div>
            </button>

            <!-- Item: Data Dictionary -->
            <button
              @click="triggerAction('docs')"
              class="w-full p-2 rounded-xl hover:bg-violet-50 dark:hover:bg-slate-700/70 text-left transition flex items-start gap-2.5 group cursor-pointer"
            >
              <div class="p-2 rounded-xl bg-violet-100 dark:bg-violet-950/80 text-violet-600 dark:text-violet-400 group-hover:scale-105 transition-transform shrink-0">
                <BookOpen class="w-4 h-4" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <div class="font-semibold text-xs text-slate-800 dark:text-slate-100 group-hover:text-violet-600 dark:group-hover:text-violet-400">
                    Data Dictionary
                  </div>
                  <span class="text-[9px] font-medium text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/50 px-1.5 py-0.5 rounded">
                    dbdictionary
                  </span>
                </div>
                <div class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug line-clamp-1">
                  Auto-generate docs, descriptions & shareable links.
                </div>
              </div>
            </button>

            <!-- Section 2: Import & Export -->
            <div class="px-2.5 pt-2 pb-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-700/60">
              Import & Export
            </div>

            <!-- Item: Export Diagram (HD) -->
            <button
              @click="triggerAction('exportDiagram')"
              class="w-full p-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-slate-700/70 text-left transition flex items-start gap-2.5 group cursor-pointer"
            >
              <div class="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform shrink-0">
                <Image class="w-4 h-4" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <div class="font-semibold text-xs text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                    Export Diagram (HD)
                  </div>
                  <span class="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/50 px-1.5 py-0.5 rounded">
                    JPG • PNG • PDF • SVG
                  </span>
                </div>
                <div class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug line-clamp-1">
                  HD visual diagrams for CS academic reports, thesis &amp; papers.
                </div>
              </div>
            </button>

            <!-- Item: Export Schema Scripts -->
            <button
              @click="triggerAction('exportScript')"
              class="w-full p-2 rounded-xl hover:bg-blue-50 dark:hover:bg-slate-700/70 text-left transition flex items-start gap-2.5 group cursor-pointer"
            >
              <div class="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform shrink-0">
                <Download class="w-4 h-4" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <div class="font-semibold text-xs text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    Export Schema Script
                  </div>
                  <span class="text-[9px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/50 px-1.5 py-0.5 rounded">
                    SQL / DBML
                  </span>
                </div>
                <div class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug line-clamp-1">
                  Production SQL DDL (Postgres, MySQL, SQLite, MSSQL) or DBML.
                </div>
              </div>
            </button>

            <!-- Item: Import Schema -->
            <button
              @click="triggerAction('import')"
              class="w-full p-2 rounded-xl hover:bg-sky-50 dark:hover:bg-slate-700/70 text-left transition flex items-start gap-2.5 group cursor-pointer"
            >
              <div class="p-2 rounded-xl bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 group-hover:scale-105 transition-transform shrink-0">
                <UploadCloud class="w-4 h-4" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <div class="font-semibold text-xs text-slate-800 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400">
                    Import Schema
                  </div>
                  <span class="text-[9px] font-medium text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/50 px-1.5 py-0.5 rounded">
                    DDL Parser
                  </span>
                </div>
                <div class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug line-clamp-1">
                  Import DDL tables from MySQL, PostgreSQL, MS SQL, or DBML.
                </div>
              </div>
            </button>

            <!-- Section 3: Collaboration & Guide -->
            <div class="px-2.5 pt-2 pb-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-700/60">
              Team & Guides
            </div>

            <!-- Item: Interactive Guided Tour -->
            <button
              @click="triggerTour"
              class="w-full p-2 rounded-xl hover:bg-indigo-50 dark:hover:bg-slate-700/70 text-left transition flex items-start gap-2.5 group cursor-pointer"
            >
              <div class="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform shrink-0">
                <Compass class="w-4 h-4" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <div class="font-semibold text-xs text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                    Interactive Tour
                  </div>
                  <span class="text-[9px] font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/50 px-1.5 py-0.5 rounded">
                    Walkthrough
                  </span>
                </div>
                <div class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug line-clamp-1">
                  Guided tour of canvas, schema editor, and vital tools.
                </div>
              </div>
            </button>

            <!-- Item: Learn DBML Guide -->
            <button
              @click="openLearnDbmlPage"
              class="w-full p-2 rounded-xl hover:bg-purple-50 dark:hover:bg-slate-700/70 text-left transition flex items-start gap-2.5 group cursor-pointer"
            >
              <div class="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform shrink-0">
                <BookOpen class="w-4 h-4" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <div class="font-semibold text-xs text-slate-800 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400">
                    Learn DBML Guide
                  </div>
                  <span class="text-[9px] font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/50 px-1.5 py-0.5 rounded">
                    Cheatsheet
                  </span>
                </div>
                <div class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug line-clamp-1">
                  Quick syntax reference & Holistics DBML creator attribution.
                </div>
              </div>
            </button>

            <!-- Section 4: Navigation & Appearance -->
            <div class="px-2.5 pt-2 pb-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-700/60">
              Overview & Activities
            </div>

            <!-- Item: Changelog & Issue Tracker -->
            <button
              @click="openChangelogPage"
              class="w-full p-2 rounded-xl hover:bg-indigo-50 dark:hover:bg-slate-700/70 text-left transition flex items-start gap-2.5 group cursor-pointer"
            >
              <div class="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform shrink-0">
                <GitCommit class="w-4 h-4" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <div class="font-semibold text-xs text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                    Changelog & Issues
                  </div>
                  <span class="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                    v1.4.3
                  </span>
                </div>
                <div class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug line-clamp-1">
                  Timeline of fixed bugs, improvements & issue submission.
                </div>
              </div>
            </button>

            <!-- Item: Home Landing Page -->
            <button
              @click="openHomePage"
              class="w-full p-2 rounded-xl hover:bg-indigo-50 dark:hover:bg-slate-700/70 text-left transition flex items-start gap-2.5 group cursor-pointer"
            >
              <div class="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform shrink-0">
                <Home class="w-4 h-4" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <div class="font-semibold text-xs text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                    Home & Features
                  </div>
                  <span class="text-[9px] font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/50 px-1.5 py-0.5 rounded">
                    Overview
                  </span>
                </div>
                <div class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug line-clamp-1">
                  Return to dbmaps landing page and feature showcase.
                </div>
              </div>
            </button>

            <!-- Item: Theme Switcher in More Menu -->
            <button
              @click="toggleDarkMode"
              class="w-full p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/60 text-left transition flex items-center justify-between text-slate-700 dark:text-slate-200 group cursor-pointer"
            >
              <div class="flex items-center gap-2.5">
                <div class="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:scale-105 transition-transform shrink-0">
                  <Sun v-if="state.isDarkMode" class="w-4 h-4 text-amber-400" />
                  <Moon v-else class="w-4 h-4 text-slate-600" />
                </div>
                <div>
                  <div class="font-semibold text-xs text-slate-800 dark:text-slate-100">
                    Theme Mode
                  </div>
                  <div class="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    Toggle dark or light canvas
                  </div>
                </div>
              </div>
              <span class="font-mono text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/80 px-2 py-0.5 rounded-md">
                {{ state.isDarkMode ? 'Dark' : 'Light' }}
              </span>
            </button>

            <!-- Legal Links Footer -->
            <div class="pt-2 border-t border-slate-200 dark:border-slate-700/80 flex items-center justify-between px-2 text-[11px]">
              <button
                @click="openHomePage"
                class="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-semibold transition flex items-center gap-1 cursor-pointer"
              >
                <Home class="w-3 h-3 text-indigo-500" />
                <span>Home</span>
              </button>
              <span class="text-slate-300 dark:text-slate-700">&bull;</span>
              <button
                @click="openLearnDbmlPage"
                class="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-semibold transition flex items-center gap-1 cursor-pointer"
              >
                <BookOpen class="w-3 h-3 text-purple-500" />
                <span>Code</span>
              </button>
              <span class="text-slate-300 dark:text-slate-700">&bull;</span>
              <button
                @click="openLegal('/privacy-policy')"
                class="text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition flex items-center gap-1 cursor-pointer"
              >
                <ShieldCheck class="w-3 h-3 text-indigo-500" />
                <span>Privacy</span>
              </button>
              <span class="text-slate-300 dark:text-slate-700">&bull;</span>
              <button
                @click="openLegal('/terms-of-service')"
                class="text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition flex items-center gap-1 cursor-pointer"
              >
                <FileText class="w-3 h-3 text-blue-500" />
                <span>Terms</span>
              </button>
            </div>
          </div>
        </transition>
      </div>

      <!-- Dark Mode Toggle Button (Direct 1-click on sm+ screens) -->
      <button
        @click="toggleDarkMode"
        title="Toggle Dark / Light Mode"
        class="hidden sm:flex p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition shrink-0 cursor-pointer"
      >
        <Sun v-if="state.isDarkMode" class="w-4 h-4 text-amber-400" />
        <Moon v-else class="w-4 h-4 text-slate-600" />
      </button>

    </div>
      <!-- Project / Database Name Input -->
      <div class="studio-project-row flex items-center gap-1.5 min-w-0 group/projname relative">
        <Database class="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 hidden xs:block" />
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
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { state, activeProject, toggleDarkMode, startTour, navigateTo, forceSaveProject } from '../stores/schemaStore.js';
import DbMapLogo from './DbMapLogo.vue';
import {
  Pencil,
  Columns,
  LayoutGrid,
  Code2,
  Users,
  User,
  Download,
  BookOpen,
  Sparkles,
  Home,
  Sun,
  Moon,
  Zap,
  Crown,
  ShieldCheck,
  Shield,
  FileText,
  ChevronDown,
  ChevronRight,
  FolderUp,
  LogOut,
  Compass,
  UploadCloud,
  Store,
  MoreHorizontal,
  Plus,
  Database,
  Loader2,
  CloudUpload,
  CloudCheck,
  AlertCircle,
  GitCommit,
  Bug,
  Image
} from 'lucide-vue-next';

const formattedLastSaved = computed(() => {
  if (!state.lastSavedAt) return '';
  try {
    const d = new Date(state.lastSavedAt);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch (e) {
    return '';
  }
});

const isActionsMenuOpen = ref(false);
const actionsDropdownRef = ref(null);

function toggleActionsMenu() {
  isActionsMenuOpen.value = !isActionsMenuOpen.value;
}

function triggerAction(actionType) {
  isActionsMenuOpen.value = false;
  if (actionType === 'newDatabase') state.modals.newProject = true;
  if (actionType === 'share') state.modals.share = true;
  if (actionType === 'docs') state.modals.docs = true;
  if (actionType === 'import') state.modals.importSchema = true;
  if (actionType === 'export' || actionType === 'exportScript') {
    state.exportTab = 'script';
    state.modals.export = true;
  }
  if (actionType === 'exportDiagram') {
    state.exportTab = 'diagram';
    state.modals.export = true;
  }
  if (actionType === 'marketplace') state.modals.marketplace = true;
}

function triggerTour() {
  isActionsMenuOpen.value = false;
  startTour(0);
}

function openLegal(path) {
  isActionsMenuOpen.value = false;
  navigateTo(path);
}

function openChangelogPage() {
  isActionsMenuOpen.value = false;
  navigateTo('/changelog');
}

function openLearnDbmlPage() {
  isActionsMenuOpen.value = false;
  navigateTo('/learn-dbml');
}

function openHomePage() {
  isActionsMenuOpen.value = false;
  navigateTo('/');
}

function openFeaturesPage() {
  isActionsMenuOpen.value = false;
  navigateTo('/');
}

function handleGlobalClick(e) {
  if (actionsDropdownRef.value && !actionsDropdownRef.value.contains(e.target)) {
    isActionsMenuOpen.value = false;
  }
}

onMounted(() => {
  window.addEventListener('click', handleGlobalClick);
});

onUnmounted(() => {
  window.removeEventListener('click', handleGlobalClick);
});
</script>
