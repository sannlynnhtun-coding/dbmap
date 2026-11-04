<template>
  <div
    id="canvas-container"
    data-ui
    ref="canvasContainer"
    class="relative w-full h-full overflow-hidden bg-slate-50 dark:bg-slate-900 bg-grid-pattern select-none flex-1"
    :class="[
      isCurrentlyPanning
        ? 'cursor-grabbing'
        : isPanningModeActive || isSpacePressed
          ? 'cursor-grab'
          : 'cursor-default'
    ]"
    @wheel.prevent="onWheel"
    @mousedown="onCanvasMouseDown"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
  >
    <!-- Top Floating Canvas Toolbar (Unified High-End Glassmorphic Bar) -->
    <div
      id="tour-canvas-toolbar"
      class="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 flex items-center gap-1 sm:gap-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-1 sm:p-1.2 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-md shadow-slate-950/5 dark:shadow-slate-950/40 text-xs transition-all duration-150 max-w-[calc(100%-1.5rem)] select-none overflow-visible"
    >
      <!-- Group 1: Navigation & Zoom -->
      <div class="flex items-center gap-1 shrink-0">
        <!-- Pan Tool Toggle -->
        <button
          @click="isPanningModeActive = !isPanningModeActive"
          :title="isPanningModeActive ? 'Pan Mode Active (Click to return to select mode)' : 'Pan Canvas (H or hold Space)'"
          class="h-8 px-2 rounded-lg font-medium transition-all duration-150 flex items-center gap-1.5 cursor-pointer"
          :class="[
            isPanningModeActive || isSpacePressed
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95'
          ]"
        >
          <Hand class="w-3.5 h-3.5 shrink-0" />
          <span v-if="canvasWidth >= 780" class="text-xs">Pan</span>
        </button>

        <!-- Segmented Zoom Controller -->
        <div class="flex items-center bg-slate-100/90 dark:bg-slate-800/90 rounded-lg p-0.5 border border-slate-200/60 dark:border-slate-700/60 h-8">
          <button
            @click="zoomOut"
            title="Zoom Out (Ctrl + -)"
            class="h-7 w-7 rounded-md flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 transition cursor-pointer"
          >
            <ZoomOut class="w-3.5 h-3.5" />
          </button>
          
          <button
            @click="resetZoom"
            title="Click to reset zoom to 100%"
            class="h-7 px-1.5 font-mono text-[11px] font-semibold tabular-nums text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white/60 dark:hover:bg-slate-700/60 rounded transition cursor-pointer select-none"
          >
            {{ Math.round(state.zoomLevel * 100) }}%
          </button>
          
          <button
            @click="zoomIn"
            title="Zoom In (Ctrl + +)"
            class="h-7 w-7 rounded-md flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 transition cursor-pointer"
          >
            <ZoomIn class="w-3.5 h-3.5" />
          </button>

          <div class="h-3.5 w-px bg-slate-200 dark:bg-slate-700 mx-0.5"></div>

          <!-- Fit to Screen -->
          <button
            @click="fitDiagramToView()"
            title="Fit All Tables to Screen (Ctrl+0)"
            class="h-7 w-7 rounded-md flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 transition cursor-pointer"
          >
            <Maximize2 class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <!-- Divider -->
      <div class="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5 shrink-0"></div>

      <!-- Group 2: Diagram Tools (When canvas >= 460px) -->
      <template v-if="canvasWidth >= 460">
        <!-- Auto Arrange with 2 Suitable Modes -->
        <div class="relative shrink-0" ref="autoArrangeDropdownRef">
          <div class="h-8 inline-flex items-center rounded-lg border border-indigo-200/80 dark:border-indigo-900/60 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 overflow-hidden shadow-2xs">
            <button
              type="button"
              @click="triggerAutoArrange(state.autoArrangeMode || 'flow')"
              :title="`Auto Arrange (${currentAutoArrangeLabel}). Click to organize tables.`"
              class="h-full px-2 sm:px-2.5 hover:bg-indigo-100/80 dark:hover:bg-indigo-900/60 font-medium transition flex items-center gap-1.5 cursor-pointer text-xs"
            >
              <component :is="currentAutoArrangeIcon" class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span v-if="canvasWidth >= 780" class="font-medium">Auto Arrange</span>
              <span v-else-if="canvasWidth >= 620" class="font-medium">Arrange</span>
              <span class="text-[10px] px-1 py-0.2 bg-indigo-200/70 dark:bg-indigo-900/80 text-indigo-800 dark:text-indigo-200 rounded font-semibold">{{ currentAutoArrangeShortLabel }}</span>
            </button>
            <button
              type="button"
              @click.stop="showAutoArrangeDropdown = !showAutoArrangeDropdown"
              title="Choose auto arrange layout"
              class="h-full px-1.5 hover:bg-indigo-100/80 dark:hover:bg-indigo-900/60 border-l border-indigo-200/60 dark:border-indigo-900/60 transition flex items-center justify-center cursor-pointer"
              :class="{ 'bg-indigo-100 dark:bg-indigo-900': showAutoArrangeDropdown }"
            >
              <ChevronDown class="w-3 h-3 text-indigo-600 dark:text-indigo-400 transition-transform duration-200" :class="{ 'rotate-180': showAutoArrangeDropdown }" />
            </button>
          </div>

          <!-- Auto Arrange Dropdown Popover -->
          <div
            v-if="showAutoArrangeDropdown"
            @click.stop
            class="absolute left-0 top-full mt-1.5 z-50 w-76 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl text-slate-800 dark:text-slate-100 animate-in fade-in slide-in-from-top-1 duration-150"
          >
            <div class="px-2 py-1 mb-1.5 flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-1.5">
              <div>
                <span class="text-xs font-semibold text-slate-800 dark:text-slate-200">Auto Arrange Layout</span>
                <p class="text-[11px] text-slate-400">Select algorithm to organize tables</p>
              </div>
              <span class="px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold rounded">2 MODES</span>
            </div>

            <div class="space-y-1.5 pt-0.5">
              <!-- Mode 1: Relationship Flow -->
              <button
                type="button"
                @click="selectAndRunAutoArrange('flow')"
                class="w-full text-left p-2.5 rounded-lg border transition flex items-start gap-2.5 cursor-pointer group"
                :class="state.autoArrangeMode === 'flow'
                  ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-100'
                  : 'border-slate-200/80 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300'"
              >
                <div class="p-1.5 rounded-md bg-indigo-100/80 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
                  <Workflow class="w-3.5 h-3.5" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between gap-1">
                    <span class="font-semibold text-xs text-slate-900 dark:text-slate-100">Relationship Flow</span>
                    <div class="flex items-center gap-1">
                      <Check v-if="state.autoArrangeMode === 'flow'" class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span class="px-1.5 py-0.2 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[10px] font-mono font-bold rounded border border-slate-200 dark:border-slate-600">1</span>
                    </div>
                  </div>
                  <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                    Aligns left to right along foreign-key dependencies. Best for parent-child hierarchies.
                  </p>
                </div>
              </button>

              <!-- Mode 2: Central Hubs -->
              <button
                type="button"
                @click="selectAndRunAutoArrange('hubs')"
                class="w-full text-left p-2.5 rounded-lg border transition flex items-start gap-2.5 cursor-pointer group"
                :class="state.autoArrangeMode === 'hubs'
                  ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-100'
                  : 'border-slate-200/80 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300'"
              >
                <div class="p-1.5 rounded-md bg-indigo-100/80 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
                  <Network class="w-3.5 h-3.5" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between gap-1">
                    <span class="font-semibold text-xs text-slate-900 dark:text-slate-100">Central Hubs</span>
                    <div class="flex items-center gap-1">
                      <Check v-if="state.autoArrangeMode === 'hubs'" class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span class="px-1.5 py-0.2 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[10px] font-mono font-bold rounded border border-slate-200 dark:border-slate-600">2</span>
                    </div>
                  </div>
                  <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                    Clusters tables around central entities. Keeps dense databases compact.
                  </p>
                </div>
              </button>
            </div>

            <div class="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[10px] text-slate-400">
              <span>Press <kbd class="px-1 py-0.5 bg-slate-100 dark:bg-slate-700 rounded font-mono font-bold">1</kbd> or <kbd class="px-1 py-0.5 bg-slate-100 dark:bg-slate-700 rounded font-mono font-bold">2</kbd></span>
              <button type="button" @click="showAutoArrangeDropdown = false" class="hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">Close</button>
            </div>
          </div>
        </div>

        <!-- Line Style Toggle Button -->
        <button
          @click="lineStyle = lineStyle === 'orthogonal' ? 'curved' : 'orthogonal'"
          :title="`Line Routing: ${lineStyle === 'orthogonal' ? 'Smart Orthogonal Elbows (Click for Curved)' : 'Smooth Bezier Curves (Click for Orthogonal)'}`"
          class="h-8 px-2 sm:px-2.5 rounded-lg font-medium transition-all duration-150 flex items-center gap-1.5 cursor-pointer text-xs shrink-0 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <GitCommit class="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 shrink-0" />
          <span v-if="canvasWidth >= 780" class="capitalize">{{ lineStyle }} Lines</span>
        </button>

        <!-- Table View Options (Density & Optional Lines) -->
        <div class="relative shrink-0" ref="viewModeDropdownRef">
          <button
            type="button"
            @click.stop="showViewModeDropdown = !showViewModeDropdown"
            :title="`Table View Mode: ${currentViewModeLabel}. Click to switch density or toggle optional lines.`"
            class="h-8 px-2 sm:px-2.5 rounded-lg font-medium transition-all duration-150 flex items-center gap-1.5 cursor-pointer text-xs"
            :class="[
              showViewModeDropdown
                ? 'bg-indigo-50 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-500'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            ]"
          >
            <component :is="currentViewModeIcon" class="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 shrink-0" />
            <span v-if="canvasWidth >= 780">{{ currentViewModeLabel }}</span>
            <span
              v-if="!state.showOptionalRelationships && optionalRelsCount > 0"
              title="Optional relationships hidden"
              class="px-1 py-0.2 bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 text-[9px] font-bold rounded-full border border-amber-300 dark:border-amber-700"
            >
              -{{ optionalRelsCount }}
            </span>
            <ChevronDown class="w-3 h-3 text-slate-400 transition-transform duration-200" :class="{ 'rotate-180': showViewModeDropdown }" />
          </button>

          <!-- View Mode Dropdown Menu -->
          <div
            v-if="showViewModeDropdown"
            @click.stop
            class="absolute left-0 top-full mt-1.5 z-50 w-64 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl text-slate-800 dark:text-slate-100 animate-in fade-in slide-in-from-top-1 duration-150"
          >
            <div class="px-2 py-1 mb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Table Density</span>
              <span class="px-1.5 py-0.2 bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 text-[9px] font-bold rounded">DENSITY</span>
            </div>

            <div class="space-y-1">
              <!-- 1. All Fields -->
              <button
                type="button"
                @click="selectDisplayMode('all')"
                class="w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between transition cursor-pointer"
                :class="state.tableDisplayMode === 'all' ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold' : 'hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200'"
              >
                <div class="flex items-center gap-2.5">
                  <div class="w-6 h-6 rounded-md flex items-center justify-center bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    <Columns class="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div class="font-medium">1. All fields</div>
                    <div class="text-[10px] text-slate-400 font-normal">Full columns, data types & notes</div>
                  </div>
                </div>
                <Check v-if="state.tableDisplayMode === 'all'" class="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              </button>

              <!-- 2. Tables Only -->
              <button
                type="button"
                @click="selectDisplayMode('tables')"
                class="w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between transition cursor-pointer"
                :class="state.tableDisplayMode === 'tables' ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold' : 'hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200'"
              >
                <div class="flex items-center gap-2.5">
                  <div class="w-6 h-6 rounded-md flex items-center justify-center bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    <TableIcon class="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div class="font-medium">2. Tables only</div>
                    <div class="text-[10px] text-slate-400 font-normal">Compact headers for bird's-eye view</div>
                  </div>
                </div>
                <Check v-if="state.tableDisplayMode === 'tables'" class="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              </button>

              <!-- 3. Keys Only -->
              <button
                type="button"
                @click="selectDisplayMode('keys')"
                class="w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between transition cursor-pointer"
                :class="state.tableDisplayMode === 'keys' ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold' : 'hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200'"
              >
                <div class="flex items-center gap-2.5">
                  <div class="w-6 h-6 rounded-md flex items-center justify-center bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                    <Key class="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div class="font-medium">3. Keys only</div>
                    <div class="text-[10px] text-slate-400 font-normal">Primary (PK) & Foreign (FK) keys</div>
                  </div>
                </div>
                <Check v-if="state.tableDisplayMode === 'keys'" class="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              </button>
            </div>

            <!-- Divider -->
            <div class="my-1.5 border-t border-slate-100 dark:border-slate-700/80"></div>

            <!-- Optional Lines Toggle -->
            <button
              type="button"
              id="toggle-optional-rel-lines-btn"
              @click.stop="toggleShowOptionalRelationships"
              class="w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between transition cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200"
              :class="{ 'bg-amber-50/50 dark:bg-amber-950/20': !state.showOptionalRelationships }"
              :title="state.showOptionalRelationships ? 'Hide optional relationship lines' : 'Show all optional relationship lines'"
            >
              <div class="flex items-start gap-2.5 flex-1 min-w-0 pr-2">
                <div
                  class="w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-colors"
                  :class="state.showOptionalRelationships ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400' : 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400'"
                >
                  <Eye v-if="state.showOptionalRelationships" class="w-3.5 h-3.5" />
                  <EyeOff v-else class="w-3.5 h-3.5" />
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-1.5">
                    <span class="font-medium text-slate-800 dark:text-slate-100">Optional lines</span>
                    <span
                      v-if="optionalRelsCount > 0"
                      class="px-1.5 py-0.2 rounded-full text-[10px] font-mono"
                      :class="state.showOptionalRelationships ? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300' : 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 font-semibold'"
                    >
                      {{ optionalRelsCount }}
                    </span>
                  </div>
                  <div class="text-[10px] text-slate-400 font-normal leading-tight mt-0.5">
                    {{ state.showOptionalRelationships ? 'Visible (>?, audit refs)' : 'Hidden (audit cols skipped)' }}
                  </div>
                </div>
              </div>

              <!-- Switch -->
              <div
                class="w-7 h-4 rounded-full transition-colors relative flex items-center p-0.5 shrink-0"
                :class="state.showOptionalRelationships ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'"
              >
                <div
                  class="w-3 h-3 rounded-full bg-white transition-transform duration-200 shadow-xs"
                  :class="state.showOptionalRelationships ? 'translate-x-3' : 'translate-x-0'"
                ></div>
              </div>
            </button>
          </div>
        </div>
      </template>

      <!-- Compact Popover for Diagram Tools (When canvas < 460px in split view) -->
      <div v-else class="relative shrink-0" ref="canvasSettingsDropdownRef">
        <button
          type="button"
          @click.stop="showCanvasSettingsDropdown = !showCanvasSettingsDropdown"
          class="h-8 px-2 rounded-lg font-medium transition-all duration-150 flex items-center gap-1 cursor-pointer text-xs"
          :class="[
            showCanvasSettingsDropdown
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          ]"
          title="Diagram Layout & Display Settings"
        >
          <SlidersHorizontal class="w-3.5 h-3.5" />
          <span class="text-[11px]">Layout</span>
          <ChevronDown class="w-3 h-3 ml-0.5" />
        </button>

        <!-- Compact Combined Layout Popover -->
        <div
          v-if="showCanvasSettingsDropdown"
          @click.stop
          class="absolute left-0 top-full mt-1.5 z-50 w-72 p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl text-slate-800 dark:text-slate-100 animate-in fade-in slide-in-from-top-1 duration-150 space-y-2.5"
        >
          <!-- Quick Auto Arrange -->
          <div>
            <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Auto Arrange Tables</div>
            <div class="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                @click="selectAndRunAutoArrange('flow'); showCanvasSettingsDropdown = false"
                class="p-2 rounded-lg border text-left text-xs transition cursor-pointer flex flex-col gap-1"
                :class="state.autoArrangeMode === 'flow' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-semibold' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'"
              >
                <div class="flex items-center gap-1.5">
                  <Workflow class="w-3.5 h-3.5 text-indigo-500" />
                  <span class="font-semibold text-slate-900 dark:text-slate-100">Flow (1)</span>
                </div>
                <span class="text-[10px] text-slate-400 font-normal">Parent-child tree</span>
              </button>
              <button
                type="button"
                @click="selectAndRunAutoArrange('hubs'); showCanvasSettingsDropdown = false"
                class="p-2 rounded-lg border text-left text-xs transition cursor-pointer flex flex-col gap-1"
                :class="state.autoArrangeMode === 'hubs' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-semibold' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'"
              >
                <div class="flex items-center gap-1.5">
                  <Network class="w-3.5 h-3.5 text-indigo-500" />
                  <span class="font-semibold text-slate-900 dark:text-slate-100">Hubs (2)</span>
                </div>
                <span class="text-[10px] text-slate-400 font-normal">Core cluster</span>
              </button>
            </div>
          </div>

          <!-- Line Style -->
          <div class="border-t border-slate-100 dark:border-slate-700/80 pt-2 flex items-center justify-between">
            <span class="text-xs text-slate-600 dark:text-slate-300 font-medium">Relationship Lines:</span>
            <button
              @click="lineStyle = lineStyle === 'orthogonal' ? 'curved' : 'orthogonal'"
              class="px-2 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-md text-xs font-semibold text-slate-700 dark:text-slate-200 capitalize transition flex items-center gap-1.5 cursor-pointer"
            >
              <GitCommit class="w-3.5 h-3.5 text-indigo-500" />
              <span>{{ lineStyle }}</span>
            </button>
          </div>

          <!-- Table Density -->
          <div class="border-t border-slate-100 dark:border-slate-700/80 pt-2">
            <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Table Density</div>
            <div class="grid grid-cols-3 gap-1">
              <button
                @click="selectDisplayMode('all')"
                class="py-1 px-1.5 text-center rounded text-xs transition cursor-pointer"
                :class="state.tableDisplayMode === 'all' ? 'bg-indigo-600 text-white font-semibold' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'"
              >
                All
              </button>
              <button
                @click="selectDisplayMode('tables')"
                class="py-1 px-1.5 text-center rounded text-xs transition cursor-pointer"
                :class="state.tableDisplayMode === 'tables' ? 'bg-indigo-600 text-white font-semibold' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'"
              >
                Tables
              </button>
              <button
                @click="selectDisplayMode('keys')"
                class="py-1 px-1.5 text-center rounded text-xs transition cursor-pointer"
                :class="state.tableDisplayMode === 'keys' ? 'bg-indigo-600 text-white font-semibold' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'"
              >
                Keys
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Divider -->
      <div class="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5 shrink-0"></div>

      <!-- Group 3: Schema Actions (Add Table & Add Relationship) -->
      <div class="flex items-center gap-1 shrink-0">
        <!-- Quick Add Table Button -->
        <button
          @click="state.modals.newTable = true"
          title="Add New Database Table (T)"
          class="h-8 px-2 sm:px-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-all duration-150 flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 text-xs"
        >
          <Plus class="w-3.5 h-3.5 shrink-0" />
          <span v-if="canvasWidth >= 620">Add Table</span>
          <span v-else>Table</span>
        </button>

        <!-- Quick Add Foreign Key Button -->
        <button
          @click="state.modals.newRel = true"
          title="Add Foreign Key Relationship (R)"
          class="h-8 px-2 sm:px-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-lg transition-all duration-150 flex items-center gap-1.5 cursor-pointer active:scale-95 text-xs"
        >
          <Link class="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
          <span v-if="canvasWidth >= 780">New Ref</span>
          <span v-else-if="canvasWidth >= 520">Ref</span>
        </button>

        <!-- Divider -->
        <div class="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5 shrink-0"></div>

        <!-- Export HD Diagram Button -->
        <button
          @click="openExportModal('diagram')"
          title="Export HD Diagram (JPG, PNG, PDF, SVG) for Academic Reports"
          class="h-8 px-2 sm:px-2.5 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200/80 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 font-semibold rounded-lg transition-all duration-150 flex items-center gap-1.5 cursor-pointer active:scale-95 text-xs shadow-2xs"
        >
          <Camera class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span v-if="canvasWidth >= 880">Export Diagram</span>
          <span v-else-if="canvasWidth >= 620">Export</span>
        </button>
      </div>
    </div>

    <!-- Active Pan Indicator Toast Banner -->
    <div
      v-if="isPanningModeActive || isSpacePressed"
      class="absolute top-16 left-1/2 -translate-x-1/2 z-20 px-3 py-1 bg-blue-600 text-white font-mono text-xs rounded-full shadow-lg flex items-center gap-2 pointer-events-none animate-pulse"
    >
      <Move class="w-3.5 h-3.5" />
      <span>Pan Canvas Active — Drag anywhere to move schema view</span>
    </div>

    <!-- Scalable Canvas Viewport -->
    <div
      class="absolute inset-0 origin-top-left transition-transform duration-75"
      :style="{
        transform: `translate(${state.panOffset.x}px, ${state.panOffset.y}px) scale(${state.zoomLevel})`
      }"
    >
      <!-- SVG Layer for Foreign Key Relationship Lines & Badges -->
      <svg class="absolute inset-0 w-full h-full overflow-visible pointer-events-none z-20">
        <defs>
          <filter id="line-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="badge-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.22" />
          </filter>
        </defs>

        <!-- LAYER 1: RELATIONSHIP PATHS & HOVER HITBOXES -->
        <g id="rel-paths-layer">
          <g v-for="rel in sortedRelationshipsForLines" :key="'line-' + rel.id" class="group/rel">
            <!-- Outer Highlight Glow when Hovered / Selected -->
            <path
              :d="rel.pathD"
              fill="none"
              :stroke="rel.isSelected || hoveredRelId === rel.id ? (rel.isOptional ? '#818cf8' : '#3b82f6') : 'transparent'"
              stroke-width="8"
              stroke-opacity="0.28"
              stroke-linecap="round"
              class="transition-all duration-200"
            />

            <!-- Main ERD Relationship Path: SOLID for standard (>), DASHED for optional (>?) -->
            <path
              :d="rel.pathD"
              fill="none"
              :stroke="rel.isSelected || hoveredRelId === rel.id
                ? (rel.isOptional ? '#6366f1' : '#2563eb')
                : (rel.isOptional
                    ? (state.isDarkMode ? '#818cf8' : '#6366f1')
                    : (state.isDarkMode ? '#64748b' : '#94a3b8'))"
              :stroke-width="rel.isSelected || hoveredRelId === rel.id ? 2.5 : (rel.isOptional ? 2 : 1.8)"
              :stroke-dasharray="rel.isOptional ? '7,4' : undefined"
              stroke-linecap="round"
              class="transition-all duration-150"
            />

            <!-- Wide Invisible Path for Easy Mouse Click / Hover Detection -->
            <path
              :d="rel.pathD"
              fill="none"
              stroke="transparent"
              stroke-width="18"
              class="cursor-pointer pointer-events-auto"
              @click="selectRel(rel.id)"
              @mouseenter="hoveredRelId = rel.id"
              @mouseleave="hoveredRelId = null"
            />
          </g>
        </g>

        <!-- LAYER 2: ANCHOR DOTS & ENDPOINT BADGES -->
        <g id="rel-endpoints-layer" class="pointer-events-none">
          <g v-for="rel in relationshipsWithCoords" :key="'endpoints-' + rel.id">
            <!-- Anchor Dot 1 (From / FK side): Hollow ring for optional (>?), solid dot for standard (>) -->
            <circle
              :cx="rel.x1"
              :cy="rel.y1"
              :r="rel.isOptional ? 4.5 : 4"
              :fill="rel.isOptional ? (state.isDarkMode ? '#0f172a' : '#ffffff') : (rel.isSelected || hoveredRelId === rel.id ? '#2563eb' : state.isDarkMode ? '#38bdf8' : '#64748b')"
              :stroke="rel.isSelected || hoveredRelId === rel.id
                ? (rel.isOptional ? '#6366f1' : '#2563eb')
                : (rel.isOptional ? (state.isDarkMode ? '#818cf8' : '#6366f1') : (state.isDarkMode ? '#0f172a' : '#ffffff'))"
              :stroke-width="rel.isOptional ? 2.5 : 2"
              class="transition-colors"
            />
            <!-- Anchor Dot 2 (To / PK side): Solid dot -->
            <circle
              :cx="rel.x2"
              :cy="rel.y2"
              r="4"
              :fill="rel.isSelected || hoveredRelId === rel.id ? '#2563eb' : state.isDarkMode ? '#38bdf8' : '#64748b'"
              :stroke="state.isDarkMode ? '#0f172a' : '#ffffff'"
              stroke-width="2"
              class="transition-colors"
            />

            <!-- Endpoint Cardinality Badges near Anchor Dots -->
            <g :transform="`translate(${rel.fromBadgeX}, ${rel.fromBadgeY})`">
              <rect
                :x="-(rel.fromLabelWidth / 2)"
                y="-10"
                :width="rel.fromLabelWidth"
                height="20"
                rx="6"
                :fill="state.isDarkMode ? '#0f172a' : '#ffffff'"
                :stroke="rel.isSelected || hoveredRelId === rel.id
                  ? (rel.isOptional ? '#818cf8' : '#2563eb')
                  : (rel.isOptional ? (state.isDarkMode ? '#818cf8' : '#6366f1') : (state.isDarkMode ? '#475569' : '#3b82f6'))"
                :stroke-dasharray="rel.isOptional ? '3,2' : undefined"
                stroke-width="1.8"
                class="transition-colors shadow-xs"
              />
              <text
                x="0"
                y="0"
                text-anchor="middle"
                dominant-baseline="central"
                :fill="rel.isOptional ? (state.isDarkMode ? '#a5b4fc' : '#4f46e5') : (state.isDarkMode ? '#38bdf8' : '#1d4ed8')"
                style="font-size: 10px; font-weight: 900; font-family: ui-monospace, SFMono-Regular, monospace;"
              >
                {{ rel.fromLabel }}
              </text>
            </g>

            <g :transform="`translate(${rel.toBadgeX}, ${rel.toBadgeY})`">
              <rect
                :x="-(rel.toLabelWidth / 2)"
                y="-10"
                :width="rel.toLabelWidth"
                height="20"
                rx="6"
                :fill="state.isDarkMode ? '#0f172a' : '#ffffff'"
                :stroke="rel.isSelected || hoveredRelId === rel.id ? (state.isDarkMode ? '#38bdf8' : '#2563eb') : (state.isDarkMode ? '#475569' : '#3b82f6')"
                stroke-width="1.8"
                class="transition-colors shadow-xs"
              />
              <text
                x="0"
                y="0"
                text-anchor="middle"
                dominant-baseline="central"
                :fill="state.isDarkMode ? '#38bdf8' : '#1d4ed8'"
                style="font-size: 10px; font-weight: 900; font-family: ui-monospace, SFMono-Regular, monospace;"
              >
                {{ rel.toLabel }}
              </text>
            </g>
          </g>
        </g>

        <!-- LAYER 3: MIDPOINT CARDINALITY LABELS & TOOLTIPS (ALWAYS IN FRONT OF LINES) -->
        <g id="rel-labels-layer">
          <g
            v-for="rel in sortedRelationshipsForLabels"
            :key="'label-' + rel.id"
            :transform="`translate(${rel.midX}, ${rel.midY})`"
            class="pointer-events-auto cursor-pointer select-none"
            @click="selectRel(rel.id)"
            @mouseenter="hoveredRelId = rel.id"
            @mouseleave="hoveredRelId = null"
          >
            <!-- Badge background pill with solid fill and elevated shadow -->
            <rect
              :x="hoveredRelId === rel.id ? -(rel.hoverWidth / 2) : -(rel.pillWidth / 2)"
              y="-14"
              :width="hoveredRelId === rel.id ? rel.hoverWidth : rel.pillWidth"
              height="28"
              rx="14"
              :fill="state.isDarkMode ? '#0f172a' : '#ffffff'"
              :stroke="rel.isSelected || hoveredRelId === rel.id
                ? (rel.isOptional ? '#6366f1' : '#2563eb')
                : (rel.isOptional ? (state.isDarkMode ? '#818cf8' : '#6366f1') : (state.isDarkMode ? '#475569' : '#64748b'))"
              :stroke-width="rel.isSelected || hoveredRelId === rel.id ? 2.5 : 1.5"
              :stroke-dasharray="rel.isOptional && hoveredRelId !== rel.id ? '4,2.5' : undefined"
              filter="url(#badge-shadow)"
              class="transition-all duration-200"
            />

            <!-- Standard Cardinality view -->
            <text
              v-if="hoveredRelId !== rel.id"
              x="0"
              y="0"
              text-anchor="middle"
              dominant-baseline="central"
              :fill="rel.isOptional ? (state.isDarkMode ? '#a5b4fc' : '#4f46e5') : (state.isDarkMode ? '#f8fafc' : '#0f172a')"
              style="font-size: 11px; font-weight: 900; font-family: ui-monospace, SFMono-Regular, monospace; letter-spacing: 0.025em;"
            >
              {{ rel.displayCardinality }}
            </text>

            <!-- Expanded Info on Hover / Focus -->
            <text
              v-else
              x="0"
              y="0"
              text-anchor="middle"
              dominant-baseline="central"
              :fill="rel.isOptional ? (state.isDarkMode ? '#a5b4fc' : '#4f46e5') : (state.isDarkMode ? '#38bdf8' : '#2563eb')"
              style="font-size: 10.5px; font-weight: 800; font-family: ui-monospace, SFMono-Regular, monospace;"
            >
              {{ rel.hoverInfo }}
            </text>
          </g>
        </g>
      </svg>

      <!-- Table Cards -->
      <div class="relative z-10" :class="{ 'pointer-events-none': isPanningModeActive || isSpacePressed }">
        <TableCard
          v-for="tbl in activeProject.tables"
          :key="tbl.id"
          :table="tbl"
          :is-selected="state.selectedTableId === tbl.id"
          :zoom="state.zoomLevel"
          @update-position="updateTablePos"
          @select-table="selectTable"
          @add-column="openAddCol"
          @delete-column="delCol"
          @delete-table="delTbl"
        />
      </div>

      <!-- Live Collaborators Realtime Cursors -->
      <template v-for="collab in state.collaborators" :key="collab.id">
        <div
          v-if="collab && collab.id !== state.currentUser?.id && !collab.isSelf && collab.cursor && typeof collab.cursor.x === 'number' && typeof collab.cursor.y === 'number'"
          class="absolute z-30 pointer-events-none transition-all duration-150 flex items-center gap-1.5"
          :style="{ left: `${collab.cursor.x}px`, top: `${collab.cursor.y}px` }"
        >
          <Navigation class="w-4 h-4 -rotate-45" :style="{ fill: collab.color || '#3b82f6', stroke: collab.color || '#3b82f6' }" />
          <span
            class="px-2 py-0.5 rounded-full text-[10px] text-white font-medium shadow-md truncate max-w-[120px]"
            :style="{ backgroundColor: collab.color || '#3b82f6' }"
          >
            {{ collab.name }}
          </span>
        </div>
      </template>
    </div>

    <!-- Empty Schema Canvas State -->
    <div
      v-if="!activeProject || !activeProject.tables || activeProject.tables.length === 0"
      class="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
    >
      <div class="pointer-events-auto max-w-sm w-full mx-4 p-6 rounded-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-xl text-center space-y-3.5">
        <div class="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-xs">
          <Database class="w-6 h-6" />
        </div>
        <div>
          <h3 class="text-sm font-bold text-slate-800 dark:text-slate-100">
            {{ activeProject ? activeProject.name : 'Start Your Schema' }}
          </h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Your schema is currently empty. Add a table to begin, or import sample templates to explore.
          </p>
        </div>

        <div class="flex flex-col gap-2 pt-1">
          <button
            @click="state.modals.newTable = true"
            class="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-sm"
          >
            <Plus class="w-3.5 h-3.5" />
            <span>Create First Table</span>
          </button>

          <button
            @click="state.modals.importSchema = true"
            class="w-full py-2 px-3 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
          >
            <UploadCloud class="w-3.5 h-3.5" />
            <span>Import SQL (MySQL / PG / MSSQL)</span>
          </button>

          <button
            @click="importSampleSchemas()"
            class="w-full py-2 px-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
          >
            <Sparkles class="w-3.5 h-3.5" />
            <span>Import Sample Schemas</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Active Table View Indicator Pill (dbdiagram.io pro feature) -->
    <div
      v-if="state.tableDisplayMode !== 'all'"
      class="absolute bottom-4 left-4 z-20 flex items-center gap-2 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-900 shadow-md text-xs font-mono animate-in fade-in slide-in-from-bottom-2 duration-200"
    >
      <span class="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
      <span class="text-slate-600 dark:text-slate-300">View: <strong class="text-indigo-600 dark:text-indigo-400 font-semibold">{{ currentViewModeLabel }}</strong></span>
      <button
        @click="selectDisplayMode('all')"
        class="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-sans font-medium cursor-pointer ml-1"
        title="Show all fields"
      >
        Reset to All Fields
      </button>
    </div>

    <!-- Optional Lines Hidden Indicator Pill -->
    <div
      v-if="!state.showOptionalRelationships && optionalRelsCount > 0"
      class="absolute bottom-4 z-20 flex items-center gap-2 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-900/60 shadow-md text-xs animate-in fade-in slide-in-from-bottom-2 duration-200"
      :class="state.tableDisplayMode !== 'all' ? 'left-64' : 'left-4'"
    >
      <EyeOff class="w-3.5 h-3.5 text-amber-500 shrink-0" />
      <span class="text-slate-600 dark:text-slate-300">
        <strong class="text-amber-600 dark:text-amber-400 font-semibold">{{ optionalRelsCount }}</strong> optional & audit line{{ optionalRelsCount > 1 ? 's' : '' }} hidden
      </span>
      <button
        type="button"
        @click="toggleShowOptionalRelationships"
        class="text-[11px] text-amber-600 dark:text-amber-400 hover:underline font-medium cursor-pointer ml-1"
        title="Show all optional and audit relationship lines"
      >
        Show Lines
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import {
  state,
  activeProject,
  updateTablePosition,
  autoArrangeTables,
  setTableDisplayMode,
  setShowOptionalRelationships,
  toggleShowOptionalRelationships,
  isOptionalRelationship,
  deleteTable,
  deleteColumn,
  importSampleSchemas,
  getTableDimensions,
  AUTO_ARRANGE_MODES,
  setAutoArrangeMode,
  getTableCardHeight,
  openExportModal
} from '../stores/schemaStore.js';
import { calculateRelationshipsWithCoords } from '../utils/diagramRouting.js';
import TableCard from './TableCard.vue';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Plus,
  Link,
  Navigation,
  Hand,
  Move,
  LayoutGrid,
  GitCommit,
  Database,
  Sparkles,
  UploadCloud,
  Columns,
  Table as TableIcon,
  Key,
  ChevronDown,
  Check,
  Eye,
  EyeOff,
  GitFork,
  Workflow,
  Network,
  SlidersHorizontal,
  Camera
} from 'lucide-vue-next';

const canvasContainer = ref(null);
const canvasWidth = ref(800);
let canvasResizeObserver = null;

const isPanningModeActive = ref(false);
const isSpacePressed = ref(false);
const isCurrentlyPanning = ref(false);

const lineStyle = ref('orthogonal');
const hoveredRelId = ref(null);

// Table Display Mode Dropdown (1. All fields, 2. Tables Only, 3. Keys Only)
const showViewModeDropdown = ref(false);
const viewModeDropdownRef = ref(null);

// Auto Arrange Dropdown (1. Relationship Flow, 2. Central Hubs)
const showAutoArrangeDropdown = ref(false);
const autoArrangeDropdownRef = ref(null);

// Compact Canvas Layout Settings Dropdown (< 460px in split view)
const showCanvasSettingsDropdown = ref(false);
const canvasSettingsDropdownRef = ref(null);

const currentAutoArrangeMode = computed(() => {
  return AUTO_ARRANGE_MODES.find(m => m.id === state.autoArrangeMode) || AUTO_ARRANGE_MODES[0];
});

const currentAutoArrangeLabel = computed(() => currentAutoArrangeMode.value.name);
const currentAutoArrangeShortLabel = computed(() => currentAutoArrangeMode.value.shortLabel);

const currentAutoArrangeIcon = computed(() => {
  return state.autoArrangeMode === 'hubs' ? Network : Workflow;
});

// Fit all tables smoothly into the viewport
function fitDiagramToView(padding = 50) {
  const container = canvasContainer.value;
  if (!container || !activeProject.value?.tables?.length) return;

  const tables = activeProject.value.tables;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  tables.forEach(t => {
    const { width } = getTableDimensions(t);
    const height = getTableCardHeight(t);
    if (t.x < minX) minX = t.x;
    if (t.y < minY) minY = t.y;
    if (t.x + width > maxX) maxX = t.x + width;
    if (t.y + height > maxY) maxY = t.y + height;
  });

  if (!isFinite(minX)) return;

  const diagramWidth = Math.max(100, maxX - minX);
  const diagramHeight = Math.max(100, maxY - minY);
  const viewportWidth = container.clientWidth || (window.innerWidth - 420);
  const viewportHeight = container.clientHeight || (window.innerHeight - 120);

  if (viewportWidth <= 0 || viewportHeight <= 0) return;

  const availableWidth = Math.max(100, viewportWidth - padding * 2);
  const availableHeight = Math.max(100, viewportHeight - padding * 2);

  const scaleX = availableWidth / diagramWidth;
  const scaleY = availableHeight / diagramHeight;
  const targetZoom = Math.min(1.0, Math.max(0.42, Math.min(scaleX, scaleY)));

  const scaledWidth = diagramWidth * targetZoom;
  const scaledHeight = diagramHeight * targetZoom;

  state.zoomLevel = Number(targetZoom.toFixed(2));
  state.panOffset = {
    x: Math.round((viewportWidth - scaledWidth) / 2 - minX * targetZoom),
    y: Math.round((viewportHeight - scaledHeight) / 2 - minY * targetZoom)
  };
}

// Automatically fit diagram to visible viewport when active schema changes or canvasFitTrigger fires
watch(
  [() => activeProject.value?.id, () => state.canvasFitTrigger],
  ([newId]) => {
    if (!newId || !activeProject.value?.tables?.length) return;
    nextTick(() => {
      setTimeout(() => {
        fitDiagramToView();
      }, 60);
    });
  },
  { immediate: true }
);

function triggerAutoArrange(mode = null) {
  const targetMode = mode || state.autoArrangeMode || 'flow';
  autoArrangeTables(targetMode);
  setTimeout(() => {
    fitDiagramToView();
  }, 40);
}

function selectAndRunAutoArrange(mode) {
  setAutoArrangeMode(mode);
  showAutoArrangeDropdown.value = false;
  triggerAutoArrange(mode);
}

const currentViewModeLabel = computed(() => {
  if (state.tableDisplayMode === 'tables') return 'Tables Only';
  if (state.tableDisplayMode === 'keys') return 'Keys Only';
  return 'All Fields';
});

const currentViewModeIcon = computed(() => {
  if (state.tableDisplayMode === 'tables') return TableIcon;
  if (state.tableDisplayMode === 'keys') return Key;
  return Columns;
});

const optionalRelsCount = computed(() => {
  const proj = activeProject.value;
  if (!proj || !proj.relationships) return 0;
  return proj.relationships.filter(r => isOptionalRelationship(r, proj.tables)).length;
});

function selectDisplayMode(mode) {
  setTableDisplayMode(mode);
  showViewModeDropdown.value = false;
}

function handleClickOutside(e) {
  if (viewModeDropdownRef.value && !viewModeDropdownRef.value.contains(e.target)) {
    showViewModeDropdown.value = false;
  }
  if (autoArrangeDropdownRef.value && !autoArrangeDropdownRef.value.contains(e.target)) {
    showAutoArrangeDropdown.value = false;
  }
  if (canvasSettingsDropdownRef.value && !canvasSettingsDropdownRef.value.contains(e.target)) {
    showCanvasSettingsDropdown.value = false;
  }
}

let startPanX = 0;
let startPanY = 0;

// Helper to construct SVG paths with smooth rounded elbow corners
function createRoundedPath(points, radius = 10) {
  if (!points || points.length < 2) return '';
  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;

  for (let i = 1; i < points.length - 1; i++) {
    const pPrev = points[i - 1];
    const pCurr = points[i];
    const pNext = points[i + 1];

    const dx1 = pCurr.x - pPrev.x;
    const dy1 = pCurr.y - pPrev.y;
    const len1 = Math.hypot(dx1, dy1);

    const dx2 = pNext.x - pCurr.x;
    const dy2 = pNext.y - pCurr.y;
    const len2 = Math.hypot(dx2, dy2);

    if (len1 < 0.1 || len2 < 0.1) {
      d += ` L ${pCurr.x.toFixed(1)} ${pCurr.y.toFixed(1)}`;
      continue;
    }

    const actualR = Math.min(radius, len1 / 2, len2 / 2);

    const startX = pCurr.x - (dx1 / len1) * actualR;
    const startY = pCurr.y - (dy1 / len1) * actualR;
    const endX = pCurr.x + (dx2 / len2) * actualR;
    const endY = pCurr.y + (dy2 / len2) * actualR;

    d += ` L ${startX.toFixed(1)} ${startY.toFixed(1)} Q ${pCurr.x.toFixed(1)} ${pCurr.y.toFixed(1)}, ${endX.toFixed(1)} ${endY.toFixed(1)}`;
  }

  const last = points[points.length - 1];
  d += ` L ${last.x.toFixed(1)} ${last.y.toFixed(1)}`;
  return d;
}

// Computes the exact midpoint along an orthogonal multi-segment path
function getPathMidpoint(points) {
  if (!points || points.length === 0) return { x: 0, y: 0 };
  if (points.length === 1) return { x: points[0].x, y: points[0].y };
  let totalLength = 0;
  const segLengths = [];
  for (let i = 0; i < points.length - 1; i++) {
    const len = Math.hypot(points[i + 1].x - points[i].x, points[i + 1].y - points[i].y);
    segLengths.push(len);
    totalLength += len;
  }
  if (totalLength === 0) return { x: points[0].x, y: points[0].y };
  let target = totalLength / 2;
  for (let i = 0; i < points.length - 1; i++) {
    const len = segLengths[i];
    if (target <= len || i === points.length - 2) {
      const ratio = len > 0 ? target / len : 0.5;
      return {
        x: points[i].x + (points[i + 1].x - points[i].x) * ratio,
        y: points[i].y + (points[i + 1].y - points[i].y) * ratio
      };
    }
    target -= len;
  }
  return { x: points[0].x, y: points[0].y };
}

// Multi-bend A* channel graph router: navigates through table gaps and corridors without crossing any table
function findChannelGraphRoute(start, startStub, endStub, end, candXs, candYs, isBlocked) {
  const xs = Array.from(new Set([startStub.x, endStub.x, ...candXs])).sort((a, b) => a - b);
  const ys = Array.from(new Set([startStub.y, endStub.y, ...candYs])).sort((a, b) => a - b);

  const startKey = `${Math.round(startStub.x)},${Math.round(startStub.y)}`;
  const endKey = `${Math.round(endStub.x)},${Math.round(endStub.y)}`;

  const dist = new Map();
  const prev = new Map();
  const queue = [{ x: startStub.x, y: startStub.y, d: 0, dir: null }];
  dist.set(startKey, 0);

  let reached = false;
  let iterations = 0;
  const maxIterations = 500;

  while (queue.length > 0 && iterations < maxIterations) {
    iterations++;
    queue.sort((a, b) => a.d - b.d);
    const curr = queue.shift();
    const currKey = `${Math.round(curr.x)},${Math.round(curr.y)}`;

    if (Math.abs(curr.x - endStub.x) < 1 && Math.abs(curr.y - endStub.y) < 1) {
      reached = true;
      break;
    }

    if (curr.d > (dist.get(currKey) ?? Infinity)) continue;

    const xIdx = xs.findIndex(val => Math.abs(val - curr.x) < 1);
    const neighbors = [];
    if (xIdx > 0) neighbors.push({ x: xs[xIdx - 1], y: curr.y, dir: 'H' });
    if (xIdx >= 0 && xIdx < xs.length - 1) neighbors.push({ x: xs[xIdx + 1], y: curr.y, dir: 'H' });

    const yIdx = ys.findIndex(val => Math.abs(val - curr.y) < 1);
    if (yIdx > 0) neighbors.push({ x: curr.x, y: ys[yIdx - 1], dir: 'V' });
    if (yIdx >= 0 && yIdx < ys.length - 1) neighbors.push({ x: curr.x, y: ys[yIdx + 1], dir: 'V' });

    for (const nb of neighbors) {
      const p1 = { x: curr.x, y: curr.y };
      const p2 = { x: nb.x, y: nb.y };
      const isExit = Math.abs(curr.x - startStub.x) < 1 && Math.abs(curr.y - startStub.y) < 1;
      const isEntry = Math.abs(nb.x - endStub.x) < 1 && Math.abs(nb.y - endStub.y) < 1;

      if (isBlocked(p1, p2, isExit, isEntry)) continue;

      const segLen = Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
      const bendCost = (curr.dir && curr.dir !== nb.dir) ? 35 : 0;
      const newDist = curr.d + segLen + bendCost;
      const nbKey = `${Math.round(nb.x)},${Math.round(nb.y)}`;

      if (newDist < (dist.get(nbKey) ?? Infinity)) {
        dist.set(nbKey, newDist);
        prev.set(nbKey, { x: curr.x, y: curr.y });
        queue.push({ x: nb.x, y: nb.y, d: newDist, dir: nb.dir });
      }
    }
  }

  if (!reached) return null;

  const pts = [{ x: endStub.x, y: endStub.y }];
  let k = endKey;
  while (prev.has(k)) {
    const p = prev.get(k);
    pts.unshift(p);
    k = `${Math.round(p.x)},${Math.round(p.y)}`;
  }

  const simplified = [start];
  for (let i = 0; i < pts.length; i++) {
    const last = simplified[simplified.length - 1];
    const curr = pts[i];
    const next = (i < pts.length - 1) ? pts[i + 1] : end;
    if ((Math.abs(last.x - curr.x) < 0.5 && Math.abs(curr.x - next.x) < 0.5) ||
        (Math.abs(last.y - curr.y) < 0.5 && Math.abs(curr.y - next.y) < 0.5)) {
      continue;
    }
    simplified.push(curr);
  }
  simplified.push(end);
  return simplified;
}

// Calculate Relationship line coordinates with high mathematical precision, parallel channel offsets & obstacle clearance
const relationshipsWithCoords = computed(() => {
  const proj = activeProject.value;
  if (!proj || !proj.relationships) return [];

  const rowHeight = 33;

  // Calculate table bounding boxes for obstacle collision detection
  const tableBounds = (proj.tables || []).map(t => {
    const { width: tWidth, headerHeight: tHeaderHeight } = getTableDimensions(t);
    let colCount = t.columns ? t.columns.length : 1;
    if (state.tableDisplayMode === 'tables') {
      colCount = 0;
    } else if (state.tableDisplayMode === 'keys') {
      const keys = (t.columns || []).filter(c => c.isPk || c.pk || c.isFk || c.fk || c.isUnique || c.unique);
      colCount = keys.length === 0 ? 1 : keys.length;
    }
    const h = tHeaderHeight + colCount * rowHeight + 28;
    return {
      id: t.id,
      name: t.name.toLowerCase(),
      left: t.x,
      right: t.x + tWidth,
      top: t.y,
      bottom: t.y + h,
      width: tWidth,
      headerHeight: tHeaderHeight
    };
  });

  const minSchemaY = tableBounds.length > 0 ? Math.min(...tableBounds.map(b => b.top)) : 60;
  const maxSchemaY = tableBounds.length > 0 ? Math.max(...tableBounds.map(b => b.bottom)) : 500;

  // Filter visible relationships (hide optional & audit lines when toggled off)
  const visibleRels = (proj.relationships || []).filter(r => {
    if (!state.showOptionalRelationships) {
      return !isOptionalRelationship(r, proj.tables);
    }
    return true;
  });

  // Pre-calculate count of relationships between table pairs to route parallel tracks cleanly
  const pairCounts = {};
  visibleRels.forEach(r => {
    const t1 = (r.fromTable || '').toLowerCase();
    const t2 = (r.toTable || '').toLowerCase();
    const pairKey = t1 < t2 ? `${t1}<->${t2}` : `${t2}<->${t1}`;
    pairCounts[pairKey] = (pairCounts[pairKey] || 0) + 1;
  });
  const pairSeen = {};

  return visibleRels.map(rel => {
    const fromTbl = proj.tables.find(t => t.name.toLowerCase() === rel.fromTable?.toLowerCase());
    const toTbl = proj.tables.find(t => t.name.toLowerCase() === rel.toTable?.toLowerCase());

    if (!fromTbl || !toTbl) return null;

    const fromDims = getTableDimensions(fromTbl);
    const toDims = getTableDimensions(toTbl);

    let y1 = fromTbl.y + (fromDims.headerHeight / 2);
    let y2 = toTbl.y + (toDims.headerHeight / 2);

    if (state.tableDisplayMode === 'tables') {
      // Tables only mode: anchor to vertical center of table header
      y1 = fromTbl.y + (fromDims.headerHeight / 2);
      y2 = toTbl.y + (toDims.headerHeight / 2);
    } else if (state.tableDisplayMode === 'keys') {
      // Keys only mode: anchor to visible key row
      const fromKeys = (fromTbl.columns || []).filter(c => c.isPk || c.pk || c.isFk || c.fk || c.isUnique || c.unique);
      const toKeys = (toTbl.columns || []).filter(c => c.isPk || c.pk || c.isFk || c.fk || c.isUnique || c.unique);

      const fromKeyIdx = rel.fromColumn
        ? fromKeys.findIndex(c => c.name.toLowerCase() === rel.fromColumn.toLowerCase())
        : -1;
      const toKeyIdx = rel.toColumn
        ? toKeys.findIndex(c => c.name.toLowerCase() === rel.toColumn.toLowerCase())
        : -1;

      y1 = fromKeyIdx >= 0
        ? fromTbl.y + fromDims.headerHeight + (fromKeyIdx * rowHeight) + (rowHeight / 2)
        : fromTbl.y + (fromDims.headerHeight / 2);

      y2 = toKeyIdx >= 0
        ? toTbl.y + toDims.headerHeight + (toKeyIdx * rowHeight) + (rowHeight / 2)
        : toTbl.y + (toDims.headerHeight / 2);
    } else {
      // All fields mode: anchor to exact column row
      let fromColIdx = -1;
      if (rel.fromColumn && fromTbl.columns) {
        fromColIdx = fromTbl.columns.findIndex(c => c.name.toLowerCase() === rel.fromColumn.toLowerCase());
      }

      let toColIdx = -1;
      if (rel.toColumn && toTbl.columns) {
        toColIdx = toTbl.columns.findIndex(c => c.name.toLowerCase() === rel.toColumn.toLowerCase());
      }

      y1 = fromColIdx >= 0
        ? fromTbl.y + fromDims.headerHeight + (fromColIdx * rowHeight) + (rowHeight / 2)
        : fromTbl.y + fromDims.headerHeight + 16;

      y2 = toColIdx >= 0
        ? toTbl.y + toDims.headerHeight + (toColIdx * rowHeight) + (rowHeight / 2)
        : toTbl.y + toDims.headerHeight + 16;
    }

    // Optional (>?) Relationship Detection
    const isOptional = isOptionalRelationship(rel, proj.tables);

    // Parallel relationship track shift (prevents parallel foreign key lines & labels from colliding)
    const t1 = (rel.fromTable || '').toLowerCase();
    const t2 = (rel.toTable || '').toLowerCase();
    const pairKey = t1 < t2 ? `${t1}<->${t2}` : `${t2}<->${t1}`;
    const totalInPair = pairCounts[pairKey] || 1;
    const pairIdx = pairSeen[pairKey] || 0;
    pairSeen[pairKey] = pairIdx + 1;
    const lineShift = totalInPair > 1 ? (pairIdx - (totalInPair - 1) / 2) * 20 : 0;

    // Self-referencing relationship
    if (fromTbl.id === toTbl.id) {
      const x1 = fromTbl.x + fromDims.width;
      const x2 = fromTbl.x + fromDims.width;
      const y2Offset = Math.abs(y1 - y2) < 10 ? y1 + 36 : y2;

      let pathD = '';
      if (lineStyle.value === 'orthogonal') {
        const waypoints = [
          { x: x1, y: y1 },
          { x: x1 + 55 + Math.abs(lineShift), y: y1 },
          { x: x1 + 55 + Math.abs(lineShift), y: y2Offset },
          { x: x2, y: y2Offset }
        ];
        pathD = createRoundedPath(waypoints, 10);
      } else {
        const stub = 65 + Math.abs(lineShift);
        pathD = `M ${x1} ${y1} C ${x1 + stub} ${y1}, ${x2 + stub} ${y2Offset}, ${x2} ${y2Offset}`;
      }

      const midX = x1 + 55 + Math.abs(lineShift);
      const midY = (y1 + y2Offset) / 2;

      const cardStr = rel.cardinality || '1:N';
      const parts = cardStr.split(':');
      let fromLabel = parts[0]?.trim() || '1';
      let toLabel = parts[1]?.trim() || 'N';
      if (isOptional) {
        if (fromLabel === 'N' || fromLabel === 'M' || fromLabel === '*') fromLabel = '0..N';
        else if (toLabel === 'N' || toLabel === 'M' || toLabel === '*') toLabel = '0..N';
      }

      const displayCardinality = isOptional ? (cardStr === '1:1' ? '1 : 0..1' : '1 : 0..N') : cardStr;
      const pillWidth = isOptional ? 76 : 54;
      const hoverInfo = isOptional
        ? `${rel.fromTable}.${rel.fromColumn} >? ${rel.toTable}.${rel.toColumn} (optional)`
        : `${rel.fromTable}.${rel.fromColumn} → ${rel.toTable}.${rel.toColumn}`;
      const hoverWidth = Math.max(140, hoverInfo.length * 7 + 28);

      return {
        ...rel,
        isOptional,
        pathD,
        x1, y1,
        x2, y2: y2Offset,
        midX, midY,
        fromBadgeX: x1 + 16,
        fromBadgeY: y1 - 10,
        toBadgeX: x2 + 16,
        toBadgeY: y2Offset + 10,
        fromLabel,
        toLabel,
        fromLabelWidth: fromLabel.length > 2 ? 34 : 22,
        toLabelWidth: toLabel.length > 2 ? 34 : 22,
        displayCardinality,
        pillWidth,
        hoverInfo,
        hoverWidth,
        isSelected: state.selectedRelId === rel.id
      };
    }

    // Determine Port candidates and obstacle-free route through table gaps
    const fromRight = fromTbl.x + fromDims.width;
    const fromLeft = fromTbl.x;
    const toRight = toTbl.x + toDims.width;
    const toLeft = toTbl.x;

    // Obstacle bounds with safety padding (10px clearance keeps lines well away from table borders)
    const PAD = 10;
    const paddedObstacles = tableBounds.map(t => ({
      id: t.id,
      left: t.left - PAD,
      right: t.right + PAD,
      top: t.top - PAD,
      bottom: t.bottom + PAD
    }));

    function segmentCollides(p1, p2, isExitStub = false, isEntryStub = false) {
      if (Math.abs(p1.x - p2.x) < 0.5) { // vertical segment
        const x = p1.x;
        const minY = Math.min(p1.y, p2.y);
        const maxY = Math.max(p1.y, p2.y);
        for (let i = 0; i < paddedObstacles.length; i++) {
          const obs = paddedObstacles[i];
          if (isExitStub && obs.id === fromTbl.id) continue;
          if (isEntryStub && obs.id === toTbl.id) continue;
          if (x >= obs.left && x <= obs.right && maxY >= obs.top && minY <= obs.bottom) {
            return true;
          }
        }
      } else if (Math.abs(p1.y - p2.y) < 0.5) { // horizontal segment
        const y = p1.y;
        const minX = Math.min(p1.x, p2.x);
        const maxX = Math.max(p1.x, p2.x);
        for (let i = 0; i < paddedObstacles.length; i++) {
          const obs = paddedObstacles[i];
          if (isExitStub && obs.id === fromTbl.id) continue;
          if (isEntryStub && obs.id === toTbl.id) continue;
          if (y >= obs.top && y <= obs.bottom && maxX >= obs.left && minX <= obs.right) {
            return true;
          }
        }
      }
      return false;
    }

    function simplifyWaypoints(pts) {
      if (pts.length <= 2) return pts;
      const res = [pts[0]];
      for (let i = 1; i < pts.length - 1; i++) {
        const prev = res[res.length - 1];
        const curr = pts[i];
        const next = pts[i + 1];
        if ((Math.abs(prev.x - curr.x) < 0.5 && Math.abs(curr.x - next.x) < 0.5) ||
            (Math.abs(prev.y - curr.y) < 0.5 && Math.abs(curr.y - next.y) < 0.5)) {
          continue;
        }
        res.push(curr);
      }
      res.push(pts[pts.length - 1]);
      return res;
    }

    // Candidate anchor ports (prioritized by natural relative direction)
    const portOptions = [];
    if (fromRight + 15 <= toLeft) {
      portOptions.push({ fromSide: 'right', toSide: 'left', x1: fromRight, x2: toLeft });
      portOptions.push({ fromSide: 'right', toSide: 'right', x1: fromRight, x2: toRight });
      portOptions.push({ fromSide: 'left', toSide: 'left', x1: fromLeft, x2: toLeft });
      portOptions.push({ fromSide: 'left', toSide: 'right', x1: fromLeft, x2: toRight });
    } else if (toRight + 15 <= fromLeft) {
      portOptions.push({ fromSide: 'left', toSide: 'right', x1: fromLeft, x2: toRight });
      portOptions.push({ fromSide: 'left', toSide: 'left', x1: fromLeft, x2: toLeft });
      portOptions.push({ fromSide: 'right', toSide: 'right', x1: fromRight, x2: toRight });
      portOptions.push({ fromSide: 'right', toSide: 'left', x1: fromRight, x2: toLeft });
    } else {
      if (fromTbl.x <= toTbl.x) {
        portOptions.push({ fromSide: 'right', toSide: 'right', x1: fromRight, x2: toRight });
        portOptions.push({ fromSide: 'left', toSide: 'left', x1: fromLeft, x2: toLeft });
        portOptions.push({ fromSide: 'right', toSide: 'left', x1: fromRight, x2: toLeft });
        portOptions.push({ fromSide: 'left', toSide: 'right', x1: fromLeft, x2: toRight });
      } else {
        portOptions.push({ fromSide: 'left', toSide: 'left', x1: fromLeft, x2: toLeft });
        portOptions.push({ fromSide: 'right', toSide: 'right', x1: fromRight, x2: toRight });
        portOptions.push({ fromSide: 'left', toSide: 'right', x1: fromLeft, x2: toRight });
        portOptions.push({ fromSide: 'right', toSide: 'left', x1: fromRight, x2: toLeft });
      }
    }

    // Collect all table gap corridors (channels) across the diagram
    const gapXs = new Set();
    const gapYs = new Set();

    for (let i = 0; i < tableBounds.length; i++) {
      const t1 = tableBounds[i];
      gapXs.add(t1.left - 24);
      gapXs.add(t1.right + 24);
      gapYs.add(t1.top - 24);
      gapYs.add(t1.bottom + 24);

      for (let j = i + 1; j < tableBounds.length; j++) {
        const t2 = tableBounds[j];
        const leftT = t1.left < t2.left ? t1 : t2;
        const rightT = t1.left < t2.left ? t2 : t1;
        if (leftT.right < rightT.left) {
          gapXs.add(Math.round((leftT.right + rightT.left) / 2));
        }

        const topT = t1.top < t2.top ? t1 : t2;
        const botT = t1.top < t2.top ? t2 : t1;
        if (topT.bottom < botT.top) {
          gapYs.add(Math.round((topT.bottom + botT.top) / 2));
        }
      }
    }

    const minObsX = Math.min(...tableBounds.map(t => t.left));
    const maxObsX = Math.max(...tableBounds.map(t => t.right));
    const minObsY = Math.min(...tableBounds.map(t => t.top));
    const maxObsY = Math.max(...tableBounds.map(t => t.bottom));

    // Outer perimeter lanes guaranteed to be outside all tables
    gapXs.add(minObsX - 45);
    gapXs.add(maxObsX + 45);
    gapYs.add(minObsY - 40);
    gapYs.add(maxObsY + 40);

    const STUB = 22;
    let chosenRoute = null;

    for (const port of portOptions) {
      const { fromSide: fSide, toSide: tSide, x1: px1, x2: px2 } = port;
      const start = { x: px1, y: y1 };
      const end = { x: px2, y: y2 };
      const startStub = { x: fSide === 'right' ? px1 + STUB : px1 - STUB, y: y1 };
      const endStub = { x: tSide === 'right' ? px2 + STUB : px2 - STUB, y: y2 };

      // Strategy 1: Direct 2-bend Z/S/U path through vertical channel gap
      const candXs = [];
      if (fSide !== tSide) {
        candXs.push(Math.round((startStub.x + endStub.x) / 2) + lineShift);
      } else if (fSide === 'right') {
        candXs.push(Math.max(startStub.x, endStub.x) + 16 + lineShift);
      } else {
        candXs.push(Math.min(startStub.x, endStub.x) - 16 + lineShift);
      }

      const sortedGapXs = Array.from(gapXs).sort((a, b) => {
        const mid = (startStub.x + endStub.x) / 2;
        return Math.abs(a - mid) - Math.abs(b - mid);
      });
      for (const gx of sortedGapXs) {
        candXs.push(gx + lineShift);
      }

      for (const cx of candXs) {
        // Ensure cx is on the correct side of the stubs so it never shoots backwards through tables
        if (fSide === 'right' && cx < startStub.x - 0.5) continue;
        if (fSide === 'left' && cx > startStub.x + 0.5) continue;
        if (tSide === 'right' && cx < endStub.x - 0.5) continue;
        if (tSide === 'left' && cx > endStub.x + 0.5) continue;

        const pts = [
          start,
          startStub,
          { x: cx, y: startStub.y },
          { x: cx, y: endStub.y },
          endStub,
          end
        ];
        let clear = true;
        for (let i = 0; i < pts.length - 1; i++) {
          if (segmentCollides(pts[i], pts[i + 1], i === 0, i === pts.length - 2)) {
            clear = false;
            break;
          }
        }
        if (clear) {
          chosenRoute = { waypoints: simplifyWaypoints(pts), fromSide: fSide, toSide: tSide, x1: px1, x2: px2 };
          break;
        }
      }
      if (chosenRoute) break;

      // Strategy 2: 4-bend bridge path through horizontal table gaps
      const sortedGapYs = Array.from(gapYs).sort((a, b) => {
        const mid = (y1 + y2) / 2;
        return Math.abs(a - mid) - Math.abs(b - mid);
      });

      for (const by of sortedGapYs) {
        const pts = [
          start,
          startStub,
          { x: startStub.x, y: by },
          { x: endStub.x, y: by },
          endStub,
          end
        ];
        let clear = true;
        for (let i = 0; i < pts.length - 1; i++) {
          if (segmentCollides(pts[i], pts[i + 1], i === 0, i === pts.length - 2)) {
            clear = false;
            break;
          }
        }
        if (clear) {
          chosenRoute = { waypoints: simplifyWaypoints(pts), fromSide: fSide, toSide: tSide, x1: px1, x2: px2 };
          break;
        }
      }
      if (chosenRoute) break;
    }

    // Strategy 3: Multi-bend channel graph pathfinding (guaranteed collision-free detour through table gaps)
    if (!chosenRoute) {
      for (const port of portOptions) {
        const { fromSide: fSide, toSide: tSide, x1: px1, x2: px2 } = port;
        const start = { x: px1, y: y1 };
        const end = { x: px2, y: y2 };
        const startStub = { x: fSide === 'right' ? px1 + STUB : px1 - STUB, y: y1 };
        const endStub = { x: tSide === 'right' ? px2 + STUB : px2 - STUB, y: y2 };

        const candXs = Array.from(gapXs);
        const candYs = Array.from(gapYs);

        const routePts = findChannelGraphRoute(
          start, startStub, endStub, end, candXs, candYs,
          (p1, p2, isExit, isEntry) => segmentCollides(p1, p2, isExit, isEntry)
        );

        if (routePts) {
          chosenRoute = { waypoints: routePts, fromSide: fSide, toSide: tSide, x1: px1, x2: px2 };
          break;
        }
      }
    }

    // Strategy 4: Outer Perimeter Bypass (100% physically impossible to collide with any table)
    if (!chosenRoute) {
      const p0 = portOptions[0];
      const start = { x: p0.x1, y: y1 };
      const end = { x: p0.x2, y: y2 };
      const startStub = { x: p0.fromSide === 'right' ? p0.x1 + STUB : p0.x1 - STUB, y: y1 };
      const endStub = { x: p0.toSide === 'right' ? p0.x2 + STUB : p0.x2 - STUB, y: y2 };

      // Route around the closest outer boundary (top or bottom)
      const outerY = (y1 + y2) / 2 < (minObsY + maxObsY) / 2
        ? minObsY - 45 - Math.abs(lineShift)
        : maxObsY + 45 + Math.abs(lineShift);

      chosenRoute = {
        waypoints: simplifyWaypoints([
          start,
          startStub,
          { x: startStub.x, y: outerY },
          { x: endStub.x, y: outerY },
          endStub,
          end
        ]),
        fromSide: p0.fromSide,
        toSide: p0.toSide,
        x1: p0.x1,
        x2: p0.x2
      };
    }

    const { waypoints, fromSide, toSide, x1, x2 } = chosenRoute;

    // Calculate midpoint for cardinality badges along the clear gap path
    const pathMid = getPathMidpoint(waypoints);
    let midX = pathMid.x;
    let midY = pathMid.y;

    // Render path according to lineStyle
    let pathD = '';
    if (lineStyle.value === 'orthogonal') {
      pathD = createRoundedPath(waypoints, 10);
    } else {
      if (waypoints.length === 4 && Math.abs(waypoints[1].x - waypoints[2].x) < 1) {
        const p0 = waypoints[0];
        const p1 = waypoints[1];
        const p2 = waypoints[2];
        const p3 = waypoints[3];
        pathD = `M ${p0.x.toFixed(1)} ${p0.y.toFixed(1)} C ${p1.x.toFixed(1)} ${p0.y.toFixed(1)}, ${p2.x.toFixed(1)} ${p3.y.toFixed(1)}, ${p3.x.toFixed(1)} ${p3.y.toFixed(1)}`;
      } else {
        pathD = createRoundedPath(waypoints, 16);
      }
    }

    const fromBadgeX = fromSide === 'right' ? x1 + 16 : x1 - 16;
    const fromBadgeY = y1 - 8;
    const toBadgeX = toSide === 'right' ? x2 + 16 : x2 - 16;
    const toBadgeY = y2 - 8;

    const cardStr = rel.cardinality || '1:N';
    const parts = cardStr.split(':');
    let fromLabel = parts[0]?.trim() || '1';
    let toLabel = parts[1]?.trim() || 'N';

    // In DBML `roles.created_by >? users.id`:
    // The child foreign key side is optional (can be NULL: 0..1 or 0..N).
    if (isOptional) {
      if (fromLabel === 'N' || fromLabel === 'M' || fromLabel === '*') {
        fromLabel = '0..N';
      } else if (toLabel === 'N' || toLabel === 'M' || toLabel === '*') {
        fromLabel = '0..N';
      } else if (cardStr === '1:1') {
        fromLabel = '0..1';
      } else {
        fromLabel = '0..N';
      }
    }

    const fromLabelWidth = fromLabel.length > 2 ? 34 : 22;
    const toLabelWidth = toLabel.length > 2 ? 34 : 22;

    const displayCardinality = isOptional
      ? (cardStr === '1:1' ? '1 : 0..1' : '1 : 0..N')
      : cardStr;
    const pillWidth = isOptional ? 76 : 54;

    const hoverInfo = isOptional
      ? `${rel.fromTable}.${rel.fromColumn} >? ${rel.toTable}.${rel.toColumn} (optional)`
      : `${rel.fromTable}.${rel.fromColumn} → ${rel.toTable}.${rel.toColumn}`;
    const hoverWidth = Math.max(140, hoverInfo.length * 7 + 28);

    return {
      ...rel,
      isOptional,
      pathD,
      x1, y1,
      x2, y2,
      midX, midY,
      fromBadgeX, fromBadgeY,
      toBadgeX, toBadgeY,
      fromLabel, toLabel,
      fromLabelWidth, toLabelWidth,
      displayCardinality,
      pillWidth,
      hoverInfo,
      hoverWidth,
      isSelected: state.selectedRelId === rel.id
    };
  }).filter(Boolean);
});

// Relationships sorted so the currently hovered or selected relationship's line is rendered last (on top of other lines)
const sortedRelationshipsForLines = computed(() => {
  const list = [...relationshipsWithCoords.value];
  return list.sort((a, b) => {
    const aActive = a.id === hoveredRelId.value || a.isSelected;
    const bActive = b.id === hoveredRelId.value || b.isSelected;
    if (aActive === bActive) return 0;
    return aActive ? 1 : -1;
  });
});

// Relationships sorted so the currently hovered or selected relationship's badge/label is rendered last (in front of all other labels)
const sortedRelationshipsForLabels = computed(() => {
  const list = [...relationshipsWithCoords.value];
  return list.sort((a, b) => {
    const aActive = a.id === hoveredRelId.value || a.isSelected;
    const bActive = b.id === hoveredRelId.value || b.isSelected;
    if (aActive === bActive) return 0;
    return aActive ? 1 : -1;
  });
});

function updateTablePos(id, x, y) {
  updateTablePosition(id, x, y);
}

function selectTable(id) {
  state.selectedTableId = id;
  state.selectedRelId = null;
}

function selectRel(id) {
  state.selectedRelId = id;
  state.selectedTableId = null;
}

function openAddCol(tableId) {
  state.selectedTableId = tableId;
  state.activeTab = 'tables';
}

function delCol(tableId, colIdx) {
  deleteColumn(tableId, colIdx);
}

function delTbl(tableId) {
  deleteTable(tableId);
}

// Zoom handlers
function zoomIn() {
  state.zoomLevel = Math.min(2.0, state.zoomLevel + 0.15);
}

function zoomOut() {
  state.zoomLevel = Math.max(0.4, state.zoomLevel - 0.15);
}

function resetZoom() {
  state.zoomLevel = 1.0;
  state.panOffset = { x: 0, y: 0 };
}

function onWheel(e) {
  if (e.ctrlKey || e.metaKey) {
    if (e.deltaY < 0) zoomIn();
    else zoomOut();
  } else {
    state.panOffset.x -= e.deltaX * 0.8;
    state.panOffset.y -= e.deltaY * 0.8;
  }
}

// Key listeners for Spacebar Panning & Auto Arrange shortcuts
function onKeyDown(e) {
  const isInputActive = document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA' || document.activeElement.isContentEditable);

  if (showAutoArrangeDropdown.value && !isInputActive) {
    if (e.key === '1') {
      e.preventDefault();
      selectAndRunAutoArrange('flow');
      return;
    }
    if (e.key === '2') {
      e.preventDefault();
      selectAndRunAutoArrange('hubs');
      return;
    }
    if (e.key === 'Escape') {
      showAutoArrangeDropdown.value = false;
      return;
    }
  }

  if (e.code === 'Space' && !isInputActive) {
    isSpacePressed.value = true;
  }
}

function onKeyUp(e) {
  if (e.code === 'Space') {
    isSpacePressed.value = false;
  }
}

// Canvas Drag Panning
function onCanvasMouseDown(e) {
  const isButton = e.target.closest('button');
  if (isButton) return;

  // Canvas drag is activated ONLY when Pan Canvas mode is active, Space Bar is pressed, or Middle Click
  if (isPanningModeActive.value || isSpacePressed.value || e.button === 1) {
    isCurrentlyPanning.value = true;
    startPanX = e.clientX - state.panOffset.x;
    startPanY = e.clientY - state.panOffset.y;
    window.addEventListener('mousemove', onCanvasMouseMove);
    window.addEventListener('mouseup', onCanvasMouseUp);
  }
}

function onCanvasMouseMove(e) {
  if (!isCurrentlyPanning.value) return;
  state.panOffset.x = e.clientX - startPanX;
  state.panOffset.y = e.clientY - startPanY;
}

function onCanvasMouseUp() {
  isCurrentlyPanning.value = false;
  window.removeEventListener('mousemove', onCanvasMouseMove);
  window.removeEventListener('mouseup', onCanvasMouseUp);
}

// Touch Devices Drag Panning
let touchStartX = 0;
let touchStartY = 0;

function onTouchStart(e) {
  if (e.touches.length === 1 && (isPanningModeActive.value || isSpacePressed.value) && !e.target.closest('.table-card')) {
    isCurrentlyPanning.value = true;
    touchStartX = e.touches[0].clientX - state.panOffset.x;
    touchStartY = e.touches[0].clientY - state.panOffset.y;
  }
}

function onTouchMove(e) {
  if (isCurrentlyPanning.value && e.touches.length === 1) {
    state.panOffset.x = e.touches[0].clientX - touchStartX;
    state.panOffset.y = e.touches[0].clientY - touchStartY;
  }
}

function onTouchEnd() {
  isCurrentlyPanning.value = false;
}

// Subtle collaborator cursor drift only when valid cursor coordinate exists
let cursorInterval;
onMounted(() => {
  if (canvasContainer.value) {
    canvasWidth.value = Math.round(canvasContainer.value.clientWidth);
    canvasResizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        canvasWidth.value = Math.round(entry.contentRect.width);
      }
    });
    canvasResizeObserver.observe(canvasContainer.value);
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('click', handleClickOutside);

  cursorInterval = setInterval(() => {
    state.collaborators.forEach(c => {
      if (c && c.id !== state.currentUser?.id && !c.isSelf && c.cursor && typeof c.cursor.x === 'number' && typeof c.cursor.y === 'number') {
        c.cursor.x += (Math.random() - 0.5) * 6;
        c.cursor.y += (Math.random() - 0.5) * 6;
      }
    });
  }, 3000);
});

onUnmounted(() => {
  if (canvasResizeObserver) {
    canvasResizeObserver.disconnect();
    canvasResizeObserver = null;
  }
  window.removeEventListener('keydown', onKeyDown);
  window.removeEventListener('keyup', onKeyUp);
  window.removeEventListener('click', handleClickOutside);
  if (cursorInterval) clearInterval(cursorInterval);
});
</script>

