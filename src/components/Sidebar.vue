<template>
  <aside
    id="tour-sidebar"
    aria-label="Schema navigation"
    @keydown.esc="state.isSidebarCollapsed = true"
    class="h-full bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700/80 flex flex-col select-none text-xs transition-all duration-200 shrink-0 overflow-hidden"
    :class="[state.isSidebarCollapsed ? 'w-14' : 'w-80 sm:w-88 md:w-92 xl:w-96']"
  >
    <!-- Collapsed Compact Strip -->
    <div v-if="state.isSidebarCollapsed" class="sidebar-rail flex-1 flex flex-col items-center py-2.5 gap-2">
      <!-- Direct Quick Create Database Button in Left Vertical Menu Bar -->
      <button
        id="btn-rail-new-database"
        @click="state.modals.newProject = true"
        class="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-xs transition flex flex-col items-center justify-center relative group cursor-pointer shrink-0"
        title="Create New Database (Ctrl+N)"
      >
        <Plus class="w-4.5 h-4.5 stroke-[2.5]" /><span class="rail-label">New</span>
        <!-- Hover Tooltip -->

      </button>

      <div class="rail-divider w-6 h-[1px] bg-slate-200 dark:bg-slate-700/80 my-0.5"></div>

      <!-- Vertical Icon Rail -->
      <div class="sidebar-rail-tabs flex flex-col gap-1.5">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="selectTabAndExpand(tab.id)"
          class="p-2.5 rounded-xl transition flex flex-col items-center justify-center relative group"
          :class="[
            state.activeTab === tab.id
              ? 'bg-blue-50 dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50'
          ]"
          :title="tab.label" :aria-label="tab.label" :aria-pressed="state.activeTab === tab.id"
        >
          <component :is="tab.icon" class="w-4.5 h-4.5" /><span class="rail-label">{{ tab.shortLabel }}</span>

          <!-- Hover Tooltip -->

        </button>

        <!-- Marketplace Button in Collapsed Rail -->
        <button
          @click="state.modals.marketplace = true"
          class="p-2.5 rounded-xl transition flex flex-col items-center justify-center relative group text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
          title="Marketplace & Templates"
        >
          <Store class="w-4.5 h-4.5" /><span class="rail-label">Templates</span>

        </button>
      </div>

      <!-- Expand Sidebar Action at Bottom of Collapsed Rail -->
      <div class="sidebar-rail-footer mt-auto w-full flex flex-col items-center pb-2 pt-2 border-t border-slate-200 dark:border-slate-700/80 shrink-0">
        <button
          id="btn-expand-sidebar-rail"
          @click="state.isSidebarCollapsed = false"
          class="p-2.5 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition relative group cursor-pointer"
          title="Expand sidebar (Ctrl+B)"
        >
          <PanelLeftOpen class="w-4.5 h-4.5 text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />

        </button>
      </div>
    </div>

    <!-- Expanded Sidebar -->
    <template v-else>
      <!-- Sidebar Header Tabs -->
      <div class="flex items-center border-b border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/80 p-1 gap-1">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="state.activeTab = tab.id"
          class="flex-1 py-2 px-1 rounded-lg font-medium transition flex flex-col items-center gap-1"
          :class="[
            state.activeTab === tab.id
              ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          ]"
          :title="tab.label" :aria-label="tab.label" :aria-pressed="state.activeTab === tab.id"
        >
          <component :is="tab.icon" class="w-4 h-4" />
          <span class="text-[10px] font-semibold tracking-tight">{{ tab.shortLabel }}</span>
        </button>
      </div>

    <!-- TAB 1: EXPLORER (FOLDERS & PROJECTS TREE) -->
    <div v-if="state.activeTab === 'explorer'" class="flex-1 flex flex-col overflow-y-auto p-3 gap-3">
      <!-- Search & Quick Action Header -->
      <div class="flex items-center gap-1.5">
        <div class="relative flex-1">
          <Search class="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            v-model="explorerQuery"
            type="text"
            placeholder="Filter databases & schemas..."
            class="w-full pl-8 pr-7 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-blue-500 text-xs text-slate-700 dark:text-slate-200 transition"
          />
          <button
            v-if="explorerQuery"
            @click="explorerQuery = ''"
            class="absolute right-2 top-2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
            title="Clear search filter"
          >
            <X class="w-3.5 h-3.5" />
          </button>
        </div>
        <button
          @click="state.modals.newFolder = true"
          title="Create New Database Group / Folder"
          class="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition shrink-0 cursor-pointer"
        >
          <FolderPlus class="w-4 h-4" />
        </button>
        <button
          @click="state.modals.importSchema = true"
          title="Import SQL (MySQL, PostgreSQL, MSSQL, DBML)"
          class="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-sky-600 dark:text-sky-400 rounded-lg transition shrink-0 cursor-pointer"
        >
          <UploadCloud class="w-4 h-4" />
        </button>
        <button
          id="btn-sidebar-new-database"
          @click="state.modals.newProject = true"
          title="Create New Database (Ctrl+N)"
          class="p-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg transition shrink-0 cursor-pointer"
        >
          <Plus class="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>

      <!-- Action Bar with Quick Import & Samples -->
      <div class="flex items-center justify-between px-0.5 pt-0.5">
        <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Schemas ({{ state.projects.length }})</span>
        <div class="flex items-center gap-1">
          <button
            @click="state.modals.marketplace = true"
            title="Browse Curated Database Blueprints (Marketplace)"
            class="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 transition px-1.5 py-0.5 rounded hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
          >
            <Store class="w-3 h-3 text-indigo-500" />
            <span>Templates</span>
          </button>
          <span class="text-slate-300 dark:text-slate-700 text-[10px]">&bull;</span>
          <button
            @click="state.modals.importSchema = true"
            title="Import MySQL, Postgres, MSSQL DDL"
            class="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 transition px-1.5 py-0.5 rounded hover:bg-blue-50 dark:hover:bg-blue-950/40"
          >
            <UploadCloud class="w-3 h-3" />
            <span>Import</span>
          </button>
          <span class="text-slate-300 dark:text-slate-700 text-[10px]">&bull;</span>
          <button
            @click="importSampleSchemas()"
            title="Import sample schemas on demand"
            class="text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 flex items-center gap-1 transition px-1.5 py-0.5 rounded hover:bg-amber-50 dark:hover:bg-amber-950/40"
          >
            <Sparkles class="w-3 h-3" />
            <span>Samples</span>
          </button>
        </div>
      </div>

      <!-- Compact Quick Database Filters -->
      <div class="flex items-center gap-1.5 flex-wrap py-0.5 text-[11px]">
        <!-- 'All' Filter Pill -->
        <button
          @click="selectedFolderFilter = null"
          class="px-2 py-0.5 rounded-md font-medium transition-all flex items-center gap-1 cursor-pointer select-none text-[11px]"
          :class="[
            selectedFolderFilter === null
              ? 'bg-blue-600 text-white shadow-2xs font-semibold'
              : 'bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700/70'
          ]"
          title="Show all databases"
        >
          <span>All</span>
          <span class="opacity-75 font-mono text-[10px]">({{ state.projects.length }})</span>
        </button>

        <!-- Database Filter Pills -->
        <button
          v-for="database in (state.databases || state.folders)"
          :key="database.id"
          @click="toggleFolderFilter(database.id)"
          class="px-2 py-0.5 rounded-md font-medium transition-all flex items-center gap-1 cursor-pointer select-none text-[11px]"
          :class="[
            selectedFolderFilter === database.id
              ? 'bg-amber-500 text-white shadow-2xs font-semibold'
              : 'bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700/70'
          ]"
          :title="`Filter by ${database.name}`"
        >
          <Database class="w-3 h-3" :class="selectedFolderFilter === database.id ? 'text-white' : 'text-amber-500'" />
          <span class="max-w-[110px] truncate">{{ database.name }}</span>
          <span class="opacity-75 font-mono text-[10px]">({{ getProjectsInFolder(database.id).length }})</span>
          <X v-if="selectedFolderFilter === database.id" class="w-2.5 h-2.5 ml-0.5 opacity-80 hover:opacity-100" />
        </button>

        <!-- Reset Button if Active -->
        <button
          v-if="selectedFolderFilter || explorerQuery"
          @click="clearAllFilters"
          class="text-[10.5px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer ml-auto flex items-center gap-0.5 px-1 py-0.5"
          title="Reset filter"
        >
          <RotateCcw class="w-2.5 h-2.5" />
          <span>Reset</span>
        </button>
      </div>

      <!-- Databases & Schemas Tree -->
      <div class="space-y-3 pt-1">
        <div
          v-for="database in displayedFolders"
          :key="database.id"
          class="rounded-xl border transition-all duration-150 bg-white dark:bg-slate-800/70 overflow-hidden shadow-xs relative"
          :class="[
            dragOverFolderForSchemaId === database.id ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50/40 dark:bg-blue-950/30 shadow-md' : '',
            dragOverFolderId === database.id && dragOverPosition === 'top' ? 'ring-2 ring-amber-500 border-amber-500 shadow-sm' : '',
            dragOverFolderId === database.id && dragOverPosition === 'bottom' ? 'ring-2 ring-amber-500 border-amber-500 shadow-sm' : '',
            draggedFolderId === database.id ? 'opacity-40 border-dashed border-amber-400 scale-[0.99]' : 'border-slate-200/80 dark:border-slate-700/80'
          ]"
          @dragover.prevent="onDragOverFolder($event, database.id)"
          @dragleave="onDragLeaveFolder($event, database.id)"
          @drop.prevent="onDropFolder($event, database.id)"
        >
          <!-- Visual Drop Indicator Bar for Database Reordering -->
          <div
            v-if="dragOverFolderId === database.id && dragOverPosition === 'top'"
            class="absolute top-0 left-0 right-0 h-1 bg-amber-500 rounded-full z-20 pointer-events-none shadow-sm"
          ></div>
          <div
            v-if="dragOverFolderId === database.id && dragOverPosition === 'bottom'"
            class="absolute bottom-0 left-0 right-0 h-1 bg-amber-500 rounded-full z-20 pointer-events-none shadow-sm"
          ></div>

          <!-- Schema Drop Hint Badge over Database Header -->
          <div
            v-if="dragOverFolderForSchemaId === database.id && draggedProjectId"
            class="px-2.5 py-1 bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center gap-1.5 shadow-xs"
          >
            <FolderInput class="w-3.5 h-3.5" />
            <span>Drop schema to move into "{{ database.name }}"</span>
          </div>

          <!-- Database Header / Accordion Bar -->
          <div
            @click="toggleFolder(database.id)"
            class="p-2.5 bg-slate-50/80 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-900 flex items-center justify-between cursor-pointer transition select-none group/database gap-1.5"
          >
            <div class="flex items-center gap-1.5 min-w-0 flex-1">
              <!-- Drag Handle to reorder database group -->
              <span
                draggable="true"
                @dragstart.stop="onDragStartFolder($event, database.id)"
                @dragend="onDragEndFolder"
                @click.stop
                class="drag-handle cursor-grab active:cursor-grabbing text-slate-400 dark:text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-100/60 dark:hover:bg-amber-950/60 rounded p-1 -ml-1 transition shrink-0 flex items-center justify-center select-none"
                title="Drag to reorder database group (Move up/down)"
              >
                <GripVertical class="w-3.5 h-3.5 pointer-events-none" />
              </span>

              <ChevronDown
                class="w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0"
                :class="{ '-rotate-90': !isFolderExpanded(database.id) }"
              />
              <Database
                class="w-4 h-4 text-amber-500 shrink-0"
              />

              <!-- Folder Name or Inline Rename -->
              <div v-if="editingFolderId === database.id" class="flex items-center gap-1.5 flex-1 min-w-0" @click.stop>
                <input
                  v-model="editingFolderName"
                  @keydown.enter="saveFolderRename(database.id)"
                  @keydown.esc="editingFolderId = null"
                  type="text"
                  class="w-full px-2 py-0.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-blue-500 rounded outline-none text-slate-800 dark:text-slate-100"
                  autofocus
                />
                <button
                  @click="saveFolderRename(database.id)"
                  class="px-2 py-0.5 bg-blue-600 text-white rounded text-[10px] font-bold shrink-0"
                >
                  Save
                </button>
              </div>
              <div v-else class="flex items-center gap-1.5 min-w-0 flex-1">
                <span
                  class="font-bold text-xs text-slate-700 dark:text-slate-200 truncate select-text"
                  :title="database.name"
                >
                  {{ database.name }}
                </span>

                <!-- Top Database Badge (Opens as default on startup) -->
                <span
                  v-if="isTopDatabase(database.id)"
                  class="text-[9px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/70 border border-amber-300/80 dark:border-amber-800/80 px-1.5 py-0.2 rounded font-sans tracking-tight shrink-0 flex items-center gap-0.5"
                  title="Top database: opens automatically as default when opening or reloading the app"
                >
                  Top &bull; Default
                </span>
              </div>
            </div>

            <!-- Folder Actions & Arrange Controls -->
            <div class="flex items-center gap-0.5 shrink-0" @click.stop>
              <!-- Schema count -->
              <span class="text-[10px] font-mono font-medium text-slate-400 bg-slate-200/60 dark:bg-slate-800 px-1.5 py-0.5 rounded mr-0.5">
                {{ getProjectsInFolder(database.id).length }}
              </span>

              <!-- Move Up Button -->
              <button
                v-if="canMoveFolderUp(database.id)"
                @click="handleMoveFolderUp(database.id)"
                title="Move database up"
                class="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-200/70 dark:hover:bg-slate-800 rounded transition cursor-pointer"
              >
                <ArrowUp class="w-3.5 h-3.5" />
              </button>

              <!-- Move Down Button -->
              <button
                v-if="canMoveFolderDown(database.id)"
                @click="handleMoveFolderDown(database.id)"
                title="Move database down"
                class="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-200/70 dark:hover:bg-slate-800 rounded transition cursor-pointer"
              >
                <ArrowDown class="w-3.5 h-3.5" />
              </button>

              <!-- Quick Add Schema inside this database -->
              <button
                @click="openNewProjectInFolder(database.id)"
                title="Create schema inside this database"
                class="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-200/70 dark:hover:bg-slate-800 rounded transition cursor-pointer"
              >
                <Plus class="w-3.5 h-3.5" />
              </button>

              <!-- More Actions / Arrange Menu -->
              <div class="relative group/foldermenu">
                <button
                  @click="toggleFolderMenu(database.id)"
                  title="Database arrangement & options"
                  class="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 rounded transition cursor-pointer"
                >
                  <MoreVertical class="w-3.5 h-3.5" />
                </button>

                <!-- Dropdown Menu -->
                <div
                  v-if="activeFolderMenuId === database.id"
                  class="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-1 z-40 text-xs"
                >
                  <div class="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-700 mb-1">
                    Arrange Database
                  </div>

                  <button
                    v-if="!isTopDatabase(database.id)"
                    @click="handleMoveFolderToTop(database.id)"
                    class="w-full px-2 py-1.5 text-left rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 font-medium cursor-pointer"
                  >
                    <ArrowUpToLine class="w-3.5 h-3.5 text-amber-500" />
                    <span>Move to Top (Default)</span>
                  </button>

                  <button
                    v-if="canMoveFolderUp(database.id)"
                    @click="handleMoveFolderUp(database.id)"
                    class="w-full px-2 py-1.5 text-left rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    <ArrowUp class="w-3.5 h-3.5 text-blue-500" />
                    <span>Move Up</span>
                  </button>

                  <button
                    v-if="canMoveFolderDown(database.id)"
                    @click="handleMoveFolderDown(database.id)"
                    class="w-full px-2 py-1.5 text-left rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    <ArrowDown class="w-3.5 h-3.5 text-blue-500" />
                    <span>Move Down</span>
                  </button>

                  <button
                    v-if="!isBottomDatabase(database.id)"
                    @click="handleMoveFolderToBottom(database.id)"
                    class="w-full px-2 py-1.5 text-left rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    <ArrowDownToLine class="w-3.5 h-3.5 text-slate-400" />
                    <span>Move to Bottom</span>
                  </button>

                  <div class="my-1 border-t border-slate-100 dark:border-slate-700"></div>

                  <button
                    @click="startFolderRename(database); activeFolderMenuId = null"
                    class="w-full px-2 py-1.5 text-left rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    <Edit2 class="w-3.5 h-3.5 text-slate-400" />
                    <span>Rename Database</span>
                  </button>

                  <button
                    v-if="state.databases.length > 1"
                    @click="confirmDeleteFolder(database); activeFolderMenuId = null"
                    class="w-full px-2 py-1.5 text-left rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2 text-xs text-red-600 dark:text-red-400 cursor-pointer"
                  >
                    <Trash2 class="w-3.5 h-3.5 text-red-500" />
                    <span>Delete Database</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Nested Schema Items inside this Folder -->
          <div
            v-show="isFolderExpanded(database.id)"
            class="p-2 space-y-1.5 border-t border-slate-100 dark:border-slate-700/60 bg-white dark:bg-slate-800"
            @dragover.prevent="onDragOverFolderForSchema($event, database.id)"
            @drop.prevent="onDropFolder($event, database.id)"
          >
            <!-- Drop banner when dragging a schema from another database into this database -->
            <div
              v-if="draggedProjectId && draggedProjectSourceFolderId !== database.id && dragOverFolderForSchemaId === database.id"
              class="py-1.5 px-3 rounded-lg bg-blue-500 text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 shadow-sm animate-pulse"
            >
              <FolderInput class="w-3.5 h-3.5" />
              <span>Drop to move schema into "{{ database.name }}"</span>
            </div>

            <!-- Empty state for database -->
            <div
              v-if="getProjectsInFolder(database.id).length === 0"
              class="py-3 px-2 text-center text-[11px] rounded-lg border border-dashed transition"
              :class="dragOverFolderForSchemaId === database.id ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-medium' : 'border-slate-200/80 dark:border-slate-700/80 text-slate-400'"
            >
              <div class="italic">
                {{ dragOverFolderForSchemaId === database.id ? 'Release to drop schema into this database' : 'No schemas in this database' }}
              </div>
              <div v-if="dragOverFolderForSchemaId !== database.id" class="mt-2 flex items-center justify-center gap-2">
                <button
                  @click="openNewProjectInFolder(database.id)"
                  class="text-blue-600 dark:text-blue-400 hover:underline font-medium inline-flex items-center gap-1"
                >
                  <Plus class="w-3 h-3" /> Add Schema
                </button>
                <span class="text-slate-300 dark:text-slate-600">&bull;</span>
                <button
                  @click="state.modals.importSchema = true"
                  class="text-sky-600 dark:text-sky-400 hover:underline font-medium inline-flex items-center gap-1"
                >
                  <UploadCloud class="w-3 h-3" /> Import SQL
                </button>
                <span class="text-slate-300 dark:text-slate-600">&bull;</span>
                <button
                  @click="importSampleSchemas(database.id)"
                  class="text-amber-600 dark:text-amber-400 hover:underline font-medium inline-flex items-center gap-1"
                >
                  <Sparkles class="w-3 h-3" /> Samples
                </button>
              </div>
            </div>

            <!-- Schema Cards in Folder (Reordered cleanly via Drag & Drop or Up/Down buttons & Menu) -->
            <div
              v-for="(proj, pIdx) in getProjectsInFolder(database.id)"
              :key="proj.id"
              :data-project-id="proj.id"
              @click="selectProject(proj.id)"
              @dragover.prevent="onDragOverProject($event, proj.id, database.id)"
              @dragleave="onDragLeaveProject($event, proj.id)"
              @drop.prevent="onDropProject($event, proj.id, database.id)"
              class="p-2.5 rounded-lg border transition cursor-pointer flex flex-col gap-2 group relative select-none"
              :class="[
                draggedProjectId === proj.id ? 'opacity-40 border-dashed border-blue-400 dark:border-blue-500 scale-[0.99]' : '',
                dragOverProjectId === proj.id && dragOverProjectPosition === 'top' ? 'ring-2 ring-blue-500 border-blue-500 shadow-sm' : '',
                dragOverProjectId === proj.id && dragOverProjectPosition === 'bottom' ? 'ring-2 ring-blue-500 border-blue-500 shadow-sm' : '',
                proj.id === state.activeProjectId
                  ? 'bg-blue-50/90 dark:bg-blue-950/50 border-blue-500 dark:border-blue-400 shadow-xs'
                  : 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-200/70 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-100/40 dark:hover:bg-slate-800/40'
              ]"
            >
              <!-- Visual Drop Indicator Bar for Schema Reordering -->
              <div
                v-if="dragOverProjectId === proj.id && dragOverProjectPosition === 'top'"
                class="absolute -top-1 left-1 right-1 h-1 bg-blue-500 rounded-full z-30 pointer-events-none shadow-sm"
              ></div>
              <div
                v-if="dragOverProjectId === proj.id && dragOverProjectPosition === 'bottom'"
                class="absolute -bottom-1 left-1 right-1 h-1 bg-blue-500 rounded-full z-30 pointer-events-none shadow-sm"
              ></div>

              <!-- Top Line: Schema Drag Grip + Indicator Dot + Schema Name + Badges -->
              <div class="flex items-center justify-between gap-1.5 min-w-0">
                <div class="flex items-center gap-1.5 min-w-0 flex-1">
                  <!-- Schema Drag Handle -->
                  <span
                    draggable="true"
                    @dragstart.stop="onDragStartProject($event, proj.id, database.id)"
                    @dragend="onDragEndProject"
                    @click.stop
                    class="drag-handle cursor-grab active:cursor-grabbing text-slate-300 dark:text-slate-600 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-100/60 dark:hover:bg-blue-950/60 rounded p-0.5 -ml-1 transition shrink-0 flex items-center justify-center select-none"
                    title="Drag to reorder schema inside database or move to another database"
                  >
                    <GripVertical class="w-3.5 h-3.5 pointer-events-none" />
                  </span>

                  <!-- Status Dot -->
                  <div
                    class="w-1.5 h-1.5 rounded-full shrink-0"
                    :class="proj.id === state.activeProjectId ? 'bg-blue-600 dark:bg-blue-400' : 'bg-slate-300 dark:bg-slate-600'"
                  ></div>

                  <!-- Schema Name -->
                  <span
                    class="font-semibold text-slate-800 dark:text-slate-100 text-xs truncate"
                    :title="proj.name"
                  >
                    {{ proj.name }}
                  </span>

                  <!-- Top Schema Badge (Default schema on startup if in top database) -->
                  <span
                    v-if="pIdx === 0"
                    class="text-[9px] font-sans font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/70 border border-amber-300/70 dark:border-amber-800/70 px-1 py-0.2 rounded shrink-0 flex items-center gap-0.5"
                    :title="isTopDatabase(database.id) ? 'Top schema in top database (opens as default on launch)' : 'Top schema in this database'"
                  >
                    Top
                  </span>

                  <!-- Access Mode Badges -->
                  <Lock v-if="proj.accessMode === 'restricted'" class="w-3 h-3 text-amber-500 shrink-0" title="Private (Account Only)" />
                  <Key v-else-if="proj.accessMode === 'password'" class="w-3 h-3 text-purple-500 shrink-0" title="Password Protected" />
                  <Globe v-else-if="proj.accessMode === 'public'" class="w-3 h-3 text-emerald-500 shrink-0" title="Public Open Schema" />
                  <Users v-if="proj.isSharedWithMe" class="w-3 h-3 text-blue-500 shrink-0" title="Shared with You" />
                </div>

                <span
                  v-if="proj.id === state.activeProjectId"
                  class="text-[9px] font-sans font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/60 px-1.5 py-0.2 rounded shrink-0"
                >
                  Active
                </span>
              </div>

              <!-- Bottom Line: Dialect & Tables/Refs Stats on Left + Actions Toolbar on Right -->
              <div class="flex items-center justify-between gap-1 text-[10px] text-slate-400 font-mono pt-0.5">
                <!-- Left: Dialect & Count Stats -->
                <div class="flex items-center gap-1.5 min-w-0">
                  <span class="px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-mono text-[9px] uppercase font-bold shrink-0">
                    {{ proj.dialect }}
                  </span>
                  <span class="truncate">{{ proj.tables ? proj.tables.length : 0 }} Tables</span>
                  <span class="text-slate-300 dark:text-slate-700">&bull;</span>
                  <span class="truncate">{{ proj.relationships ? proj.relationships.length : 0 }} Refs</span>
                  <span
                    v-if="proj.isSharedWithMe"
                    class="text-blue-500 font-sans font-medium text-[9px] truncate max-w-[70px]"
                    :title="'Shared by ' + (proj.ownerEmail || 'Collaborator')"
                  >
                    (Shared)
                  </span>
                </div>

                <!-- Right: Action Toolbar Buttons -->
                <div class="flex items-center gap-0.5 shrink-0" @click.stop>
                  <!-- Move schema within database up -->
                  <button
                    v-if="pIdx > 0"
                    @click.stop="handleMoveProjectUp(proj.id)"
                    title="Move schema up (towards top)"
                    class="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-200/70 dark:hover:bg-slate-700/70 rounded transition cursor-pointer"
                  >
                    <ArrowUp class="w-3.5 h-3.5" />
                  </button>

                  <!-- Move schema within database down -->
                  <button
                    v-if="pIdx < getProjectsInFolder(database.id).length - 1"
                    @click.stop="handleMoveProjectDown(proj.id)"
                    title="Move schema down"
                    class="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-200/70 dark:hover:bg-slate-700/70 rounded transition cursor-pointer"
                  >
                    <ArrowDown class="w-3.5 h-3.5" />
                  </button>

                  <!-- Schema Options & Arrange Menu -->
                  <div class="relative group/projmenu">
                    <button
                      @click.stop="toggleProjectMenu(proj.id)"
                      title="Schema options & arrange"
                      class="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-700/70 rounded transition cursor-pointer"
                    >
                      <MoreVertical class="w-3.5 h-3.5" />
                    </button>

                    <!-- Dropdown Menu -->
                    <div
                      v-if="activeProjectMenuId === proj.id"
                      class="absolute right-0 bottom-full mb-1 w-52 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-1 z-40 text-xs"
                      @click.stop
                    >
                      <div class="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-700 mb-1">
                        Arrange Schema
                      </div>

                      <button
                        v-if="!isTopProject(database.id, proj.id)"
                        @click="handleMoveProjectToTop(proj.id)"
                        class="w-full px-2 py-1.5 text-left rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/40 flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300 font-medium cursor-pointer"
                      >
                        <ArrowUpToLine class="w-3.5 h-3.5 text-amber-500" />
                        <span>Move to Top (Default in DB)</span>
                      </button>

                      <button
                        v-if="!isTopProject(database.id, proj.id)"
                        @click="handleMoveProjectUp(proj.id)"
                        class="w-full px-2 py-1.5 text-left rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200 cursor-pointer"
                      >
                        <ArrowUp class="w-3.5 h-3.5 text-blue-500" />
                        <span>Move Up</span>
                      </button>

                      <button
                        v-if="!isBottomProject(database.id, proj.id)"
                        @click="handleMoveProjectDown(proj.id)"
                        class="w-full px-2 py-1.5 text-left rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200 cursor-pointer"
                      >
                        <ArrowDown class="w-3.5 h-3.5 text-blue-500" />
                        <span>Move Down</span>
                      </button>

                      <button
                        v-if="!isBottomProject(database.id, proj.id)"
                        @click="handleMoveProjectToBottom(proj.id)"
                        class="w-full px-2 py-1.5 text-left rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200 cursor-pointer"
                      >
                        <ArrowDownToLine class="w-3.5 h-3.5 text-slate-400" />
                        <span>Move to Bottom</span>
                      </button>

                      <div class="my-1 border-t border-slate-100 dark:border-slate-700"></div>

                      <button
                        @click="toggleMovingProject(proj.id); activeProjectMenuId = null"
                        class="w-full px-2 py-1.5 text-left rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200 cursor-pointer"
                      >
                        <FolderInput class="w-3.5 h-3.5 text-amber-500" />
                        <span>Move to Database...</span>
                      </button>

                      <button
                        v-if="(proj.tables || []).length > 0"
                        @click="openSubmitToMarketplace(proj.id); activeProjectMenuId = null"
                        class="w-full px-2 py-1.5 text-left rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 cursor-pointer"
                      >
                        <UploadCloud class="w-3.5 h-3.5 text-emerald-500" />
                        <span>Publish to Marketplace</span>
                      </button>

                      <button
                        v-if="state.projects.length >= 1"
                        @click="delProject(proj.id); activeProjectMenuId = null"
                        class="w-full px-2 py-1.5 text-left rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2 text-xs text-red-600 dark:text-red-400 cursor-pointer"
                      >
                        <LogOut v-if="proj.isSharedWithMe" class="w-3.5 h-3.5 text-amber-500" />
                        <Trash2 v-else class="w-3.5 h-3.5 text-red-500" />
                        <span>{{ proj.isSharedWithMe ? 'Remove from Workspace' : 'Delete Schema' }}</span>
                      </button>
                    </div>
                  </div>

                  <!-- Move schema to another database (direct quick action) -->
                  <div class="relative group/move">
                    <button
                      @click="toggleMovingProject(proj.id)"
                      title="Move to another database"
                      class="opacity-70 sm:opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-amber-500 hover:bg-slate-200/50 dark:hover:bg-slate-700/60 rounded transition cursor-pointer"
                    >
                      <FolderInput class="w-3 h-3" />
                    </button>

                    <!-- Inline Move Dropdown (Opens upwards cleanly) -->
                    <div
                      v-if="movingProjectId === proj.id"
                      class="absolute right-0 bottom-full mb-1 w-44 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-1 z-30 text-xs"
                    >
                      <div class="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-700 mb-1">
                        Move to Database
                      </div>
                      <button
                        v-for="targetF in (state.databases || state.folders)"
                        :key="targetF.id"
                        @click="handleMoveProject(proj.id, targetF.id)"
                        class="w-full px-2 py-1.5 text-left rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-between text-xs text-slate-700 dark:text-slate-200"
                        :class="{ 'font-bold text-blue-600 dark:text-blue-400': targetF.id === proj.folderId }"
                      >
                        <span class="truncate flex-1" :title="targetF.name">{{ targetF.name }}</span>
                        <Check v-if="targetF.id === proj.folderId" class="w-3 h-3 text-blue-600" />
                      </button>
                    </div>
                  </div>

                  <!-- Publish to Marketplace -->
                  <button
                    v-if="(proj.tables || []).length > 0"
                    @click.stop="openSubmitToMarketplace(proj.id)"
                    title="Publish schema to dbmaps Marketplace"
                    class="opacity-70 sm:opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-emerald-500 hover:bg-slate-200/50 dark:hover:bg-slate-700/60 rounded transition cursor-pointer"
                  >
                    <UploadCloud class="w-3 h-3" />
                  </button>

                  <!-- Delete or Leave Schema -->
                  <button
                    v-if="state.projects.length >= 1"
                    @click.stop="delProject(proj.id)"
                    :title="proj.isSharedWithMe ? 'Remove from your workspace' : 'Delete Schema'"
                    class="opacity-70 sm:opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition cursor-pointer"
                  >
                    <LogOut v-if="proj.isSharedWithMe" class="w-3 h-3 text-amber-500" />
                    <Trash2 v-else class="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State when Filters Match Nothing -->
        <div
          v-if="displayedFolders.length === 0"
          class="p-6 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 space-y-2.5"
        >
          <div class="w-10 h-10 mx-auto rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400">
            <Filter class="w-5 h-5" />
          </div>
          <div>
            <h4 class="text-xs font-bold text-slate-700 dark:text-slate-300">No matching databases or schemas</h4>
            <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Try adjusting your search query or clearing active filters.
            </p>
          </div>
          <button
            @click="clearAllFilters"
            class="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition shadow-xs cursor-pointer inline-flex items-center gap-1.5"
          >
            <RotateCcw class="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </button>
        </div>
      </div>
    </div>

    <!-- TAB 2: TABLES & FIELDS MANAGER -->
    <div v-else-if="state.activeTab === 'tables'" class="flex-1 flex flex-col overflow-y-auto p-3 gap-3">
      <!-- Active Database Context Header -->
      <div class="px-2.5 py-1.5 rounded-lg bg-slate-100/90 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/70 flex items-center justify-between gap-2 shrink-0">
        <div class="flex items-center gap-1.5 min-w-0 flex-1">
          <Database class="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span class="font-bold text-slate-800 dark:text-slate-200 text-xs truncate" :title="activeProject.name">
            {{ activeProject.name }}
          </span>
        </div>
        <span class="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-mono text-[9px] uppercase font-bold shrink-0">
          {{ activeProject.dialect || 'postgres' }}
        </span>
      </div>

      <!-- Search and Add Table -->
      <div class="flex items-center gap-2">
        <div class="relative flex-1">
          <Search class="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            v-model="tableQuery"
            type="text"
            placeholder="Search tables or fields..."
            class="w-full pl-8 pr-7 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-blue-500 text-xs text-slate-700 dark:text-slate-200 transition"
          />
          <button
            v-if="tableQuery"
            @click="tableQuery = ''"
            class="absolute right-2 top-2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
            title="Clear table search"
          >
            <X class="w-3.5 h-3.5" />
          </button>
        </div>
        <button
          @click="state.modals.newTable = true"
          title="Add Table"
          class="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition cursor-pointer"
        >
          <Plus class="w-4 h-4" />
        </button>
      </div>

      <!-- Tables Accordion List -->
      <div class="space-y-2 overflow-y-auto flex-1 pr-1">
        <div
          v-for="tbl in filteredTables"
          :key="tbl.id"
          class="border rounded-xl bg-white dark:bg-slate-800 overflow-hidden"
          :class="[
            state.selectedTableId === tbl.id
              ? 'border-blue-500 dark:border-blue-400 shadow-sm'
              : 'border-slate-200 dark:border-slate-700/80'
          ]"
        >
          <!-- Table Header Card -->
          <div
            @click="state.selectedTableId = tbl.id"
            class="p-2.5 bg-slate-50 dark:bg-slate-700/40 flex items-center justify-between cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            <div class="flex items-center gap-2 font-mono truncate">
              <span
                class="w-3 h-3 rounded-full shrink-0"
                :style="{ backgroundColor: tbl.headerColor || '#3b82f6' }"
              ></span>
              <span class="font-bold text-slate-800 dark:text-slate-100 text-xs">{{ tbl.name }}</span>
            </div>
            <div class="flex items-center gap-1.5 text-slate-400">
              <span class="text-[10px] font-mono font-medium">{{ tbl.columns.length }} cols</span>
              <button
                @click.stop="delTbl(tbl.id)"
                class="p-1 hover:text-red-500 transition"
                title="Delete Table"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <!-- Expanded Column Editor -->
          <div v-if="state.selectedTableId === tbl.id" class="p-2.5 border-t border-slate-100 dark:border-slate-700/80 space-y-2">
            <div
              v-for="(col, cIdx) in tbl.columns"
              :key="cIdx"
              class="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1.5"
            >
              <div class="flex items-center gap-1.5">
                <input
                  v-model="col.name"
                  type="text"
                  class="flex-1 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-mono text-[11px] font-semibold text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500"
                  placeholder="column_name"
                />
                <select
                  v-model="col.type"
                  class="w-24 px-1.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-mono text-[10px] text-slate-700 dark:text-slate-200 outline-none"
                >
                  <option value="integer">integer</option>
                  <option value="bigint">bigint</option>
                  <option value="varchar(255)">varchar(255)</option>
                  <option value="text">text</option>
                  <option value="boolean">boolean</option>
                  <option value="decimal(10,2)">decimal(10,2)</option>
                  <option value="timestamptz">timestamptz</option>
                  <option value="timestamp">timestamp</option>
                  <option value="uuid">uuid</option>
                  <option value="jsonb">jsonb</option>
                </select>
                <button
                  @click="delCol(tbl.id, cIdx)"
                  class="p-1 text-slate-400 hover:text-red-500 transition"
                >
                  <X class="w-3.5 h-3.5" />
                </button>
              </div>

              <!-- Column Flag Checkboxes -->
              <div class="flex items-center gap-3 text-[10px] font-mono text-slate-500 dark:text-slate-400 pt-0.5">
                <label class="flex items-center gap-1 cursor-pointer hover:text-amber-600">
                  <input
                    type="checkbox"
                    v-model="col.isPk"
                    @change="col.pk = col.isPk; if (col.isPk) { col.isNull = false; col.notNull = true; col.isUnique = true; col.unique = true; }"
                    class="rounded text-amber-500 focus:ring-0"
                  />
                  <span :class="{ 'font-bold text-amber-600 dark:text-amber-400': col.isPk || col.pk }">PK</span>
                </label>

                <span
                  v-if="col.isFk || col.fk"
                  class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-mono shrink-0"
                  title="Foreign Key"
                >
                  FK
                </span>

                <label class="flex items-center gap-1 cursor-pointer hover:text-red-500">
                  <input
                    type="checkbox"
                    v-model="col.isNull"
                    @change="col.notNull = !col.isNull; if (col.isNull) { col.isPk = false; col.pk = false; }"
                    class="rounded text-red-500 focus:ring-0"
                  />
                  <span>Nullable</span>
                </label>

                <label class="flex items-center gap-1 cursor-pointer hover:text-purple-600">
                  <input
                    type="checkbox"
                    v-model="col.isUnique"
                    @change="col.unique = col.isUnique"
                    class="rounded text-purple-500 focus:ring-0"
                  />
                  <span>Unique</span>
                </label>
              </div>
            </div>

            <button
              @click="addCol(tbl.id)"
              class="w-full py-1.5 border border-dashed border-slate-300 dark:border-slate-600 hover:border-blue-500 hover:text-blue-500 rounded-lg transition text-slate-500 dark:text-slate-400 font-medium flex items-center justify-center gap-1"
            >
              <Plus class="w-3.5 h-3.5" /> Add Field
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 3: RELATIONSHIPS MANAGER -->
    <div v-else-if="state.activeTab === 'relationships'" class="flex-1 flex flex-col overflow-y-auto p-3 gap-3">
      <!-- Active Database Context Header -->
      <div class="px-2.5 py-1.5 rounded-lg bg-slate-100/90 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/70 flex items-center justify-between gap-2 shrink-0">
        <div class="flex items-center gap-1.5 min-w-0 flex-1">
          <Database class="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span class="font-bold text-slate-800 dark:text-slate-200 text-xs truncate" :title="activeProject.name">
            {{ activeProject.name }}
          </span>
        </div>
        <span class="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-mono text-[9px] uppercase font-bold shrink-0">
          {{ activeProject.dialect || 'postgres' }}
        </span>
      </div>

      <div class="flex items-center justify-between">
        <span class="font-bold uppercase tracking-wider text-[10px] text-slate-400">Entity Relationships</span>
        <button
          @click="state.modals.newRel = true"
          class="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium text-[11px] flex items-center gap-1"
        >
          <Plus class="w-3.5 h-3.5" /> Add Foreign Key
        </button>
      </div>

      <div class="space-y-2 overflow-y-auto flex-1 pr-1">
        <div
          v-for="rel in activeProject.relationships"
          :key="rel.id"
          class="p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 space-y-2 cursor-pointer transition-all hover:border-slate-300 dark:hover:border-slate-600"
          :class="{ 'ring-2 ring-blue-500 shadow-sm': state.selectedRelId === rel.id }"
          @click="state.selectedRelId = rel.id"
        >
          <!-- Source to Target -->
          <div class="flex items-center justify-between text-xs font-mono">
            <div class="flex items-center gap-1 text-slate-800 dark:text-slate-200 font-bold truncate">
              <span>{{ rel.fromTable }}.{{ rel.fromColumn }}</span>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <span
                v-if="rel.optional || rel.operator?.includes('?')"
                class="px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 rounded font-bold text-[9px] border border-indigo-200 dark:border-indigo-800 flex items-center gap-1"
                title="Optional Foreign Key (Nullable, 0..N)"
              >
                >? Optional
              </span>
              <span
                v-else
                class="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded font-bold text-[9px]"
                title="Mandatory Foreign Key (>)"
              >
                > Mandatory
              </span>
              <span class="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded font-bold text-[10px]">
                {{ rel.cardinality || '1:N' }}
              </span>
            </div>
          </div>

          <div class="flex items-center gap-1.5 text-slate-400 text-[11px]">
            <ArrowDown class="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span class="font-mono text-slate-600 dark:text-slate-300 truncate">
              References {{ rel.toTable }}.{{ rel.toColumn }}
            </span>
          </div>

          <!-- Options, Toggle Optional & Delete -->
          <div class="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700/60 text-[10px] font-mono text-slate-400">
            <span>ON DELETE {{ rel.onDelete || 'CASCADE' }}</span>
            <div class="flex items-center gap-2.5">
              <button
                type="button"
                @click.stop="toggleRelOptional(rel.id)"
                class="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-sans font-medium cursor-pointer text-[10.5px]"
                :title="rel.optional || rel.operator?.includes('?') ? 'Change to Mandatory FK (>)' : 'Change to Optional FK (>? / nullable)'"
              >
                {{ rel.optional || rel.operator?.includes('?') ? 'Set > (Req)' : 'Set >? (Opt)' }}
              </button>
              <button
                type="button"
                @click.stop="delRel(rel.id)"
                class="text-red-500 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Trash2 class="w-3 h-3" /> Remove
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 4: VERSION CONTROL & SNAPSHOTS -->
    <div v-else-if="state.activeTab === 'history'" class="flex-1 flex flex-col overflow-y-auto p-3 gap-3">
      <!-- Active Database Context Header -->
      <div class="px-2.5 py-1.5 rounded-lg bg-slate-100/90 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/70 flex items-center justify-between gap-2 shrink-0">
        <div class="flex items-center gap-1.5 min-w-0 flex-1">
          <Database class="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span class="font-bold text-slate-800 dark:text-slate-200 text-xs truncate" :title="activeProject.name">
            {{ activeProject.name }}
          </span>
        </div>
        <span class="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-mono text-[9px] uppercase font-bold shrink-0">
          {{ activeProject.dialect || 'postgres' }}
        </span>
      </div>

      <div class="flex items-center justify-between">
        <span class="font-bold uppercase tracking-wider text-[10px] text-slate-400">Schema Version Control</span>
        <button
          @click="state.modals.version = true"
          class="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition font-medium text-[11px] flex items-center gap-1"
        >
          <GitCommit class="w-3.5 h-3.5" /> Save Release
        </button>
      </div>

      <div class="space-y-3 overflow-y-auto flex-1 pr-1">
        <div
          v-if="!activeProject.history || activeProject.history.length === 0"
          class="p-6 text-center text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-700/80 rounded-xl space-y-2"
        >
          <GitCommit class="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
          <p class="font-medium text-xs">No saved releases yet</p>
          <p class="text-[11px]">Click "Save Release" to take a snapshot checkpoint of your tables and relationships.</p>
        </div>

        <div
          v-for="commit in activeProject.history"
          :key="commit.id"
          class="p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 space-y-1.5 group"
        >
          <div class="flex items-center justify-between">
            <span class="font-bold text-slate-800 dark:text-slate-100 text-xs">{{ commit.versionName }}</span>
            <div class="flex items-center gap-1.5">
              <span class="text-[10px] font-mono text-slate-400">{{ formatDate(commit.createdAt) }}</span>
              <button
                @click="delCommit(commit.id)"
                title="Delete Snapshot"
                class="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-red-500 transition"
              >
                <Trash2 class="w-3 h-3" />
              </button>
            </div>
          </div>
          <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{{ commit.description }}</p>
          <div class="flex items-center justify-between pt-1 text-[10px] text-slate-400 font-mono">
            <span>By {{ commit.author }}</span>
            <button
              @click="restore(commit.id)"
              class="text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1"
            >
              <RotateCcw class="w-3 h-3" /> Restore Checkpoint
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 5: DIALECT SETTINGS -->
    <div v-else-if="state.activeTab === 'settings'" class="flex-1 flex flex-col overflow-y-auto p-3 gap-4">
      <!-- Active Database Context Header -->
      <div class="px-2.5 py-1.5 rounded-lg bg-slate-100/90 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/70 flex items-center justify-between gap-2 shrink-0">
        <div class="flex items-center gap-1.5 min-w-0 flex-1">
          <Database class="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span class="font-bold text-slate-800 dark:text-slate-200 text-xs truncate" :title="activeProject.name">
            {{ activeProject.name }}
          </span>
        </div>
        <span class="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-mono text-[9px] uppercase font-bold shrink-0">
          {{ activeProject.dialect || 'postgres' }}
        </span>
      </div>

      <div>
        <label class="block font-bold text-slate-700 dark:text-slate-200 mb-1">Target SQL Dialect</label>
        <select
          v-model="activeProject.dialect"
          @change="onDialectChange"
          class="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-mono text-xs outline-none focus:border-blue-500"
        >
          <option value="postgres">PostgreSQL 15+</option>
          <option value="mysql">MySQL 8.0+</option>
          <option value="sqlite">SQLite 3</option>
          <option value="mssql">Microsoft SQL Server</option>
        </select>
      </div>

      <div class="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl space-y-2">
        <div class="font-semibold text-blue-900 dark:text-blue-300">Live Account & Cloud Sync</div>
        <p class="text-[11px] text-blue-700 dark:text-blue-400">
          Logged in as <span class="font-mono font-bold">{{ state.currentUser.email }}</span>. Changes to schemas, versions, and dialects automatically save to Firestore.
        </p>
      </div>

      <!-- Legal & Policies Info Card -->
      <div class="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
        <div class="font-semibold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
          <ShieldCheck class="w-3.5 h-3.5 text-indigo-500" />
          <span>Legal & Policies</span>
        </div>
        <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
          dbmaps safeguards your database designs and schemas. You retain 100% intellectual property ownership.
        </p>
        <div class="flex flex-col gap-1 pt-1 border-t border-slate-200/80 dark:border-slate-800 text-[11px]">
          <button
            @click="navigateTo('/privacy-policy')"
            class="text-left text-indigo-600 dark:text-indigo-400 hover:underline flex items-center justify-between cursor-pointer group py-0.5"
          >
            <span>Privacy Policy</span>
            <span class="text-[10px] font-mono text-slate-400 group-hover:text-indigo-500">/privacy-policy</span>
          </button>
          <button
            @click="navigateTo('/terms-of-service')"
            class="text-left text-indigo-600 dark:text-indigo-400 hover:underline flex items-center justify-between cursor-pointer group py-0.5"
          >
            <span>Terms of Service</span>
            <span class="text-[10px] font-mono text-slate-400 group-hover:text-indigo-500">/terms-of-service</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Sidebar Bottom Actions Area: Collapse Toggle & Legal -->
    <div class="mt-auto border-t border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-900/70 shrink-0">
      <!-- Collapse Sidebar Button -->
      <button
        id="btn-collapse-sidebar-bottom"
        @click="state.isSidebarCollapsed = true"
        class="w-full flex items-center justify-between px-3 py-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-colors text-xs font-medium cursor-pointer group"
        title="Collapse sidebar to rail (Ctrl+B)"
      >
        <div class="flex items-center gap-2">
          <PanelLeftClose class="w-4 h-4 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors shrink-0" />
          <span>Collapse sidebar</span>
        </div>
        <kbd class="px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-[10px] text-slate-500 dark:text-slate-400 font-mono border border-slate-300/60 dark:border-slate-700">
          Ctrl+B
        </kbd>
      </button>

      <!-- Sidebar Compact Legal & Home Footer -->
      <div class="px-3 py-1.5 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500">
        <button @click="navigateTo('/')" class="font-mono font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition">
          dbmaps
        </button>
        <div class="flex items-center gap-1.5 flex-wrap">
          <button @click="navigateTo('/')" class="hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline cursor-pointer">Home</button>
          <span>&bull;</span>
          <button @click="navigateTo('/changelog')" class="hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline cursor-pointer font-medium text-slate-600 dark:text-slate-300">Changelog</button>
          <span>&bull;</span>
          <button @click="navigateTo('/privacy-policy')" class="hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline cursor-pointer">Privacy</button>
          <span>&bull;</span>
          <button @click="navigateTo('/terms-of-service')" class="hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline cursor-pointer">Terms</button>
        </div>
      </div>
    </div>
  </template>

  <!-- In-App Confirmation Modal for Deletions (Bypasses iframe alert/confirm block) -->
  <Teleport to="body">
    <div
      v-if="pendingDeletion"
      class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      @click.self="pendingDeletion = null"
    >
      <div class="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
        <div class="flex items-start gap-3.5">
          <div class="p-2.5 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 shrink-0">
            <AlertTriangle class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-base font-bold text-slate-900 dark:text-white">
              {{ pendingDeletion.type === 'database' ? 'Delete Database' : (pendingDeletion.isShared ? 'Remove Shared Schema' : 'Delete Database Schema') }}
            </h3>
            <p class="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
              <template v-if="pendingDeletion.type === 'database'">
                Are you sure you want to delete database <strong>"{{ pendingDeletion.name }}"</strong>?
                <span v-if="pendingDeletion.count > 0" class="block mt-1 text-slate-500 dark:text-slate-400">
                  Its {{ pendingDeletion.count }} schema(s) will be kept and safely moved to your primary database.
                </span>
              </template>
              <template v-else>
                Are you sure you want to {{ pendingDeletion.isShared ? 'remove' : 'permanently delete' }} schema <strong>"{{ pendingDeletion.name }}"</strong>? This action cannot be undone.
              </template>
            </p>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            @click="pendingDeletion = null"
            class="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            @click="executeConfirmedDeletion"
            class="px-4 py-2 text-xs font-bold rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-sm transition flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 class="w-3.5 h-3.5" />
            {{ pendingDeletion.type === 'database' ? 'Delete Database' : (pendingDeletion.isShared ? 'Remove Schema' : 'Delete Schema') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</aside>
</template>

<script setup>
import { ref, computed, reactive, watch, nextTick, onMounted, onUnmounted } from 'vue';
import {
  state,
  activeProject,
  selectProject,
  addColumn,
  deleteColumn,
  deleteTable,
  deleteRelationship,
  toggleRelationshipOptional,
  restoreCommit,
  deleteCommit,
  deleteProject,
  deleteFolder,
  renameFolder,
  moveProjectToFolder,
  moveFolderUp,
  moveFolderDown,
  moveFolderToTop,
  moveFolderToBottom,
  reorderFolders,
  moveProjectUp,
  moveProjectDown,
  moveProjectToTop,
  moveProjectToBottom,
  reorderProjectsInFolder,
  getSortedProjectsInFolder,
  setProjectDialect,
  importSampleSchemas,
  importSampleSchemaByName,
  openSubmitToMarketplace,
  navigateTo,
  saveFoldersToStorage,
  saveGuestProjectsToStorage,
  syncActiveProjectToFirestore,
  addToast
} from '../stores/schemaStore.js';
import {
  Database,
  Folder,
  FolderOpen,
  FolderPlus,
  FolderInput,
  Layers,
  Link,
  GitCommit,
  Settings,
  Plus,
  Search,
  Filter,
  Trash2,
  X,
  ArrowUp,
  ArrowDown,
  ArrowUpToLine,
  ArrowDownToLine,
  GripVertical,
  MoreVertical,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Edit2,
  Check,
  Lock,
  Key,
  Globe,
  Users,
  LogOut,
  Sparkles,
  ShieldCheck,
  UploadCloud,
  Store,
  PanelLeftClose,
  PanelLeftOpen,
  AlertTriangle
} from 'lucide-vue-next';

function selectTabAndExpand(tabId) {
  state.activeTab = tabId;
  state.isSidebarCollapsed = false;
}

const tableQuery = ref('');
const explorerQuery = ref('');
const selectedFolderFilter = ref(null);
const selectedDialectFilter = ref('all');
const expandedFolderMap = reactive({});
const editingFolderId = ref(null);
const editingFolderName = ref('');
const movingProjectId = ref(null);
const pendingDeletion = ref(null);
const activeFolderMenuId = ref(null);
const activeProjectMenuId = ref(null);
const draggedFolderId = ref(null);
const dragOverFolderId = ref(null);
const dragOverPosition = ref(null); // 'top' | 'bottom'

const draggedProjectId = ref(null);
const draggedProjectSourceFolderId = ref(null);
const dragOverProjectId = ref(null);
const dragOverProjectPosition = ref(null); // 'top' | 'bottom'
const dragOverFolderForSchemaId = ref(null);

function isTopDatabase(folderId) {
  const folders = state.databases || state.folders || [];
  return folders.length > 0 && folders[0].id === folderId;
}

function isBottomDatabase(folderId) {
  const folders = state.databases || state.folders || [];
  return folders.length > 0 && folders[folders.length - 1].id === folderId;
}

function isTopProject(folderId, projectId) {
  const list = getProjectsInFolder(folderId);
  return list.length > 0 && list[0].id === projectId;
}

function isBottomProject(folderId, projectId) {
  const list = getProjectsInFolder(folderId);
  return list.length > 0 && list[list.length - 1].id === projectId;
}

function canMoveFolderUp(folderId) {
  const folders = state.databases || state.folders || [];
  const idx = folders.findIndex(f => f.id === folderId);
  return idx > 0;
}

function canMoveFolderDown(folderId) {
  const folders = state.databases || state.folders || [];
  const idx = folders.findIndex(f => f.id === folderId);
  return idx !== -1 && idx < folders.length - 1;
}

function toggleFolderMenu(folderId) {
  activeFolderMenuId.value = activeFolderMenuId.value === folderId ? null : folderId;
}

function toggleProjectMenu(projId) {
  activeProjectMenuId.value = activeProjectMenuId.value === projId ? null : projId;
}

function handleMoveFolderUp(folderId) {
  moveFolderUp(folderId);
  activeFolderMenuId.value = null;
}

function handleMoveFolderDown(folderId) {
  moveFolderDown(folderId);
  activeFolderMenuId.value = null;
}

function handleMoveFolderToTop(folderId) {
  moveFolderToTop(folderId, true);
  expandedFolderMap[folderId] = true;
  activeFolderMenuId.value = null;
}

function handleMoveFolderToBottom(folderId) {
  moveFolderToBottom(folderId);
  activeFolderMenuId.value = null;
}

function handleMoveProjectUp(projId) {
  moveProjectUp(projId);
  activeProjectMenuId.value = null;
}

function handleMoveProjectDown(projId) {
  moveProjectDown(projId);
  activeProjectMenuId.value = null;
}

function handleMoveProjectToTop(projId) {
  moveProjectToTop(projId, false);
  activeProjectMenuId.value = null;
}

function handleMoveProjectToBottom(projId) {
  moveProjectToBottom(projId);
  activeProjectMenuId.value = null;
}

// ==========================================
// Drag & Drop for Databases and Schemas
// ==========================================

function onDragStartFolder(e, folderId) {
  if (e.target.closest('button, input, textarea, a, .no-drag')) {
    e.preventDefault();
    return;
  }
  draggedFolderId.value = folderId;
  draggedProjectId.value = null;
  dragOverFolderId.value = null;
  dragOverPosition.value = null;
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', 'folder:' + folderId);
    e.dataTransfer.setData('application/x-dbmaps-folder', folderId);
  }
}

function onDragOverFolder(e, targetFolderId) {
  // If dragging a schema over a folder:
  if (draggedProjectId.value) {
    onDragOverFolderForSchema(e, targetFolderId);
    return;
  }

  if (!draggedFolderId.value) return;
  e.preventDefault();
  e.stopPropagation();
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'move';
  }

  if (draggedFolderId.value === targetFolderId) {
    dragOverFolderId.value = null;
    dragOverPosition.value = null;
    return;
  }

  dragOverFolderId.value = targetFolderId;
  const rect = e.currentTarget.getBoundingClientRect();
  const midY = rect.top + Math.min(rect.height / 2, 45);
  dragOverPosition.value = e.clientY < midY ? 'top' : 'bottom';
}

function onDragLeaveFolder(e, targetFolderId) {
  if (e && e.currentTarget && e.relatedTarget && e.currentTarget.contains(e.relatedTarget)) {
    return;
  }
  if (dragOverFolderId.value === targetFolderId) {
    dragOverFolderId.value = null;
    dragOverPosition.value = null;
  }
  if (dragOverFolderForSchemaId.value === targetFolderId) {
    dragOverFolderForSchemaId.value = null;
  }
}

function onDropFolder(e, targetFolderId) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }

  // Case 1: Dropping a schema onto a database folder
  if (draggedProjectId.value) {
    const projId = draggedProjectId.value;
    const proj = state.projects.find(p => p.id === projId);
    if (proj && proj.folderId !== targetFolderId) {
      moveProjectToFolder(projId, targetFolderId);
      expandedFolderMap[targetFolderId] = true;
      const targetFolder = (state.databases || state.folders || []).find(f => f.id === targetFolderId);
      addToast('Schema Moved', `Moved "${proj.name}" to database "${targetFolder?.name || 'database'}"`, 'success');
    }
    handleGlobalDragEnd();
    return;
  }

  // Case 2: Reordering database folders
  const sourceId = draggedFolderId.value;
  if (!sourceId || sourceId === targetFolderId) {
    handleGlobalDragEnd();
    return;
  }

  const fromIndex = state.folders.findIndex(f => f.id === sourceId);
  let toIndex = state.folders.findIndex(f => f.id === targetFolderId);
  if (fromIndex === -1 || toIndex === -1) {
    handleGlobalDragEnd();
    return;
  }

  const [movedFolder] = state.folders.splice(fromIndex, 1);
  toIndex = state.folders.findIndex(f => f.id === targetFolderId);
  if (dragOverPosition.value === 'bottom') {
    toIndex = toIndex + 1;
  }
  state.folders.splice(toIndex, 0, movedFolder);
  saveFoldersToStorage();

  if (toIndex === 0) {
    expandedFolderMap[movedFolder.id] = true;
    const topProj = state.projects.find(p => p.folderId === movedFolder.id);
    if (topProj) {
      selectProject(topProj.id);
    }
  }

  addToast('Database Reordered', `Moved "${movedFolder.name}"`, 'info');
  handleGlobalDragEnd();
}

function onDragEndFolder() {
  handleGlobalDragEnd();
}

// ------------------------------------------
// Schema (Project) Drag & Drop Handlers
// ------------------------------------------

function onDragStartProject(e, projectId, folderId) {
  if (e.target.closest('button, input, textarea, a, .no-drag')) {
    e.preventDefault();
    return;
  }
  draggedProjectId.value = projectId;
  draggedProjectSourceFolderId.value = folderId;
  draggedFolderId.value = null;
  dragOverProjectId.value = null;
  dragOverProjectPosition.value = null;
  dragOverFolderForSchemaId.value = null;

  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', 'project:' + projectId);
    e.dataTransfer.setData('application/x-dbmaps-project', projectId);
  }
}

function onDragOverFolderForSchema(e, targetFolderId) {
  if (!draggedProjectId.value) return;
  e.preventDefault();
  e.stopPropagation();
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'move';
  }
  dragOverFolderForSchemaId.value = targetFolderId;
}

function onDragOverProject(e, targetProjectId, folderId) {
  if (!draggedProjectId.value) return;
  e.preventDefault();
  e.stopPropagation();
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'move';
  }

  if (draggedProjectId.value === targetProjectId) {
    dragOverProjectId.value = null;
    dragOverProjectPosition.value = null;
    return;
  }

  dragOverProjectId.value = targetProjectId;
  const rect = e.currentTarget.getBoundingClientRect();
  const midY = rect.top + rect.height / 2;
  dragOverProjectPosition.value = e.clientY < midY ? 'top' : 'bottom';
}

function onDragLeaveProject(e, targetProjectId) {
  if (e && e.currentTarget && e.relatedTarget && e.currentTarget.contains(e.relatedTarget)) {
    return;
  }
  if (dragOverProjectId.value === targetProjectId) {
    dragOverProjectId.value = null;
    dragOverProjectPosition.value = null;
  }
}

function onDropProject(e, targetProjectId, targetFolderId) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }

  const sourceProjectId = draggedProjectId.value;
  const sourceFolderId = draggedProjectSourceFolderId.value;

  if (!sourceProjectId) {
    handleGlobalDragEnd();
    return;
  }

  const proj = state.projects.find(p => p.id === sourceProjectId);
  if (!proj) {
    handleGlobalDragEnd();
    return;
  }

  if (sourceProjectId === targetProjectId) {
    handleGlobalDragEnd();
    return;
  }

  // Sub-case A: Reordering within the SAME database
  if (sourceFolderId === targetFolderId || proj.folderId === targetFolderId) {
    const currentList = getSortedProjectsInFolder(targetFolderId);
    const idList = currentList.map(p => p.id);
    const fromIdx = idList.indexOf(sourceProjectId);
    let toIdx = idList.indexOf(targetProjectId);

    if (fromIdx !== -1 && toIdx !== -1) {
      idList.splice(fromIdx, 1);
      toIdx = idList.indexOf(targetProjectId);
      if (dragOverProjectPosition.value === 'bottom') {
        toIdx = toIdx + 1;
      }
      idList.splice(toIdx, 0, sourceProjectId);
      reorderProjectsInFolder(targetFolderId, idList);

      if (toIdx === 0 && isTopDatabase(targetFolderId)) {
        addToast('Top Schema Set', `"${proj.name}" is now default startup schema`, 'info');
      } else {
        addToast('Schema Reordered', `Moved "${proj.name}"`, 'info');
      }
    }
  } else {
    // Sub-case B: Moving across databases and ordering near target schema
    moveProjectToFolder(sourceProjectId, targetFolderId);

    const currentList = getSortedProjectsInFolder(targetFolderId);
    const idList = currentList.map(p => p.id);
    const fromIdx = idList.indexOf(sourceProjectId);
    let toIdx = idList.indexOf(targetProjectId);

    if (fromIdx !== -1 && toIdx !== -1) {
      idList.splice(fromIdx, 1);
      toIdx = idList.indexOf(targetProjectId);
      if (dragOverProjectPosition.value === 'bottom') {
        toIdx = toIdx + 1;
      }
      idList.splice(toIdx, 0, sourceProjectId);
      reorderProjectsInFolder(targetFolderId, idList);
    }

    expandedFolderMap[targetFolderId] = true;
    const targetFolder = (state.databases || state.folders || []).find(f => f.id === targetFolderId);
    addToast('Schema Moved', `Moved "${proj.name}" to database "${targetFolder?.name || 'database'}"`, 'success');
  }

  handleGlobalDragEnd();
}

function onDragEndProject() {
  handleGlobalDragEnd();
}

function handleGlobalDragEnd() {
  draggedFolderId.value = null;
  dragOverFolderId.value = null;
  dragOverPosition.value = null;
  draggedProjectId.value = null;
  draggedProjectSourceFolderId.value = null;
  dragOverProjectId.value = null;
  dragOverProjectPosition.value = null;
  dragOverFolderForSchemaId.value = null;
}

function handleClickOutside(e) {
  if (activeFolderMenuId.value) {
    const isInsideMenu = e.target.closest('.group\\/foldermenu');
    if (!isInsideMenu) {
      activeFolderMenuId.value = null;
    }
  }
  if (activeProjectMenuId.value) {
    const isInsideProjMenu = e.target.closest('.group\\/projmenu');
    if (!isInsideProjMenu) {
      activeProjectMenuId.value = null;
    }
  }
  if (movingProjectId.value) {
    const isInsideMove = e.target.closest('.group\\/move');
    if (!isInsideMove) {
      movingProjectId.value = null;
    }
  }
}

const hasSampleSchemas = computed(() => {
  return state.projects.some(p => 
    p.name.includes('E-Commerce') || p.name.includes('SaaS Billing')
  );
});

// Initialize databases as expanded by default
function isFolderExpanded(folderId) {
  return expandedFolderMap[folderId] !== false;
}

function toggleFolder(folderId) {
  expandedFolderMap[folderId] = !isFolderExpanded(folderId);
}

function toggleFolderFilter(folderId) {
  if (selectedFolderFilter.value === folderId) {
    selectedFolderFilter.value = null;
  } else {
    selectedFolderFilter.value = folderId;
    expandedFolderMap[folderId] = true;
  }
}

function clearAllFilters() {
  selectedFolderFilter.value = null;
  selectedDialectFilter.value = 'all';
  explorerQuery.value = '';
}

// Automatically expand containing database folder and scroll active schema into view
watch(
  () => state.activeProjectId,
  (newId) => {
    if (!newId) return;
    const proj = state.projects.find(p => p.id === newId);
    if (proj && proj.folderId) {
      expandedFolderMap[proj.folderId] = true;
      if (selectedFolderFilter.value && selectedFolderFilter.value !== proj.folderId) {
        selectedFolderFilter.value = null;
      }
    }
    nextTick(() => {
      const el = document.querySelector(`[data-project-id="${newId}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  },
  { immediate: true }
);

const availableDialects = computed(() => {
  const dialects = new Set();
  (state.projects || []).forEach(p => {
    if (p.dialect) dialects.add(p.dialect.toLowerCase());
  });
  return Array.from(dialects);
});

const totalMatchingSchemas = computed(() => {
  let count = 0;
  for (const db of displayedFolders.value) {
    count += getProjectsInFolder(db.id).length;
  }
  return count;
});

const activeFilterDescription = computed(() => {
  const parts = [];
  if (selectedFolderFilter.value) {
    const db = (state.databases || state.folders || []).find(d => d.id === selectedFolderFilter.value);
    if (db) parts.push(`Database "${db.name}"`);
  }
  if (selectedDialectFilter.value && selectedDialectFilter.value !== 'all') {
    parts.push(`Dialect "${selectedDialectFilter.value.toUpperCase()}"`);
  }
  if (explorerQuery.value.trim()) {
    parts.push(`Search "${explorerQuery.value.trim()}"`);
  }
  return parts.join(' • ');
});

function getProjectsInFolder(folderId) {
  let sorted = getSortedProjectsInFolder(folderId);
  if (selectedDialectFilter.value && selectedDialectFilter.value !== 'all') {
    sorted = sorted.filter(p => (p.dialect || 'postgres').toLowerCase() === selectedDialectFilter.value.toLowerCase());
  }
  if (!explorerQuery.value) return sorted;
  const q = explorerQuery.value.toLowerCase().trim();
  return sorted.filter(p => {
    return (
      p.name.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q)) ||
      (p.dialect && p.dialect.toLowerCase().includes(q))
    );
  });
}

const displayedFolders = computed(() => {
  let databases = state.databases || state.folders || [];
  if (selectedFolderFilter.value) {
    databases = databases.filter(f => f.id === selectedFolderFilter.value);
  }
  if (selectedDialectFilter.value && selectedDialectFilter.value !== 'all') {
    databases = databases.filter(f => getProjectsInFolder(f.id).length > 0);
  }
  if (!explorerQuery.value) return databases;
  const q = explorerQuery.value.toLowerCase().trim();
  return databases.filter(f => {
    const matchName = f.name.toLowerCase().includes(q);
    const hasMatchingProjects = getProjectsInFolder(f.id).length > 0;
    return matchName || hasMatchingProjects;
  });
});

function openNewProjectInFolder(folderId) {
  state.modals.newProject = true;
}

function startFolderRename(database) {
  editingFolderId.value = database.id;
  editingFolderName.value = database.name;
}

function saveFolderRename(folderId) {
  if (editingFolderName.value.trim()) {
    renameFolder(folderId, editingFolderName.value.trim());
  }
  editingFolderId.value = null;
}

function confirmDeleteFolder(database) {
  const count = getProjectsInFolder(database.id).length;
  pendingDeletion.value = {
    type: 'database',
    id: database.id,
    name: database.name,
    count
  };
}

function toggleMovingProject(projId) {
  movingProjectId.value = movingProjectId.value === projId ? null : projId;
}

function handleMoveProject(projId, targetFolderId) {
  moveProjectToFolder(projId, targetFolderId);
  movingProjectId.value = null;
}

const tabs = [
  { id: 'explorer', label: 'Databases & Schemas', shortLabel: 'Databases', icon: Database },
  { id: 'tables', label: 'Tables & Fields', shortLabel: 'Tables', icon: Layers },
  { id: 'relationships', label: 'Entity Relationships', shortLabel: 'Relations', icon: Link },
  { id: 'history', label: 'Version Control', shortLabel: 'History', icon: GitCommit },
  { id: 'settings', label: 'Dialect Settings', shortLabel: 'Dialect', icon: Settings }
];

const filteredTables = computed(() => {
  const proj = activeProject.value;
  if (!proj || !proj.tables) return [];
  if (!tableQuery.value) return proj.tables;
  const q = tableQuery.value.toLowerCase();
  return proj.tables.filter(
    t => t.name.toLowerCase().includes(q) || t.columns.some(c => c.name.toLowerCase().includes(q))
  );
});

function addCol(tblId) {
  addColumn(tblId, { name: 'new_column', type: 'varchar(255)' });
}

function delCol(tblId, cIdx) {
  deleteColumn(tblId, cIdx);
}

function delTbl(tblId) {
  deleteTable(tblId);
}

function delRel(relId) {
  deleteRelationship(relId);
}

function toggleRelOptional(relId) {
  toggleRelationshipOptional(relId);
}

function restore(commitId) {
  restoreCommit(commitId);
}

function delCommit(commitId) {
  deleteCommit(commitId);
}

function delProject(projectId) {
  const proj = state.projects.find(p => p.id === projectId);
  if (!proj) return;
  pendingDeletion.value = {
    type: 'project',
    id: projectId,
    name: proj.name || 'Untitled Schema',
    isShared: Boolean(proj.isSharedWithMe)
  };
}

function executeConfirmedDeletion() {
  if (!pendingDeletion.value) return;
  const target = pendingDeletion.value;
  pendingDeletion.value = null;

  if (target.type === 'database') {
    delFolder(target.id);
  } else if (target.type === 'project') {
    deleteProject(target.id);
  }
}

function delFolder(folderId) {
  deleteFolder(folderId);
}

function onDialectChange() {
  if (activeProject.value) {
    setProjectDialect(activeProject.value.dialect);
  }
}

function formatDate(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function handleKeyDown(e) {
  if (e.key === 'Escape') {
    handleGlobalDragEnd();
  }

  if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
    const tag = document.activeElement?.tagName?.toLowerCase();
    if (tag !== 'input' && tag !== 'textarea') {
      e.preventDefault();
      state.isSidebarCollapsed = !state.isSidebarCollapsed;
    }
  }

  if (
    ((e.ctrlKey || e.metaKey) && (e.key === 'n' || e.key === 'N') && !e.shiftKey && !e.altKey) ||
    (e.altKey && (e.key === 'n' || e.key === 'N'))
  ) {
    const tag = document.activeElement?.tagName?.toLowerCase();
    if (tag !== 'input' && tag !== 'textarea') {
      e.preventDefault();
      state.modals.newProject = true;
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('click', handleClickOutside);
  window.addEventListener('dragend', handleGlobalDragEnd);
  window.addEventListener('mouseup', handleGlobalDragEnd);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('click', handleClickOutside);
  window.removeEventListener('dragend', handleGlobalDragEnd);
  window.removeEventListener('mouseup', handleGlobalDragEnd);
});
</script>
