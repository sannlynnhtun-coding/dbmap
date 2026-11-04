<template>
  <div
    v-if="state.modals.docs"
    class="app-dialog-backdrop fixed inset-0 z-50 bg-slate-950/70  flex items-center justify-center p-3 sm:p-6 select-none animate-fadeIn"
    @click.self="state.modals.docs = false"
  >
    <div v-dialog
      role="dialog" aria-modal="true" aria-label="Data dictionary" class="app-dialog bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl  w-full max-w-6xl h-[88vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100 relative"
    >
      <!-- Header Toolbar -->
      <div class="app-dialog-heading px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/80 dark:bg-slate-900/80">
        <div class="flex items-center gap-3">
          <DbMapLogo class-name="w-9 h-9" />
          <div>
            <div class="flex items-center gap-2">
              <h2 class="font-bold text-base tracking-tight font-sans">Data dictionary</h2>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80">
                dbdictionary
              </span>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              Interactive database dictionary generated from schema tables, field types, and DBML notes
            </p>
          </div>
        </div>

        <!-- Right Header Actions -->
        <div class="flex items-center gap-2">
          <!-- Search Bar -->
          <div class="relative hidden lg:block">
            <Search class="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search tables, fields, notes..."
              class="pl-8 pr-3 py-1.5 w-48 xl:w-60 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition text-slate-800 dark:text-slate-100"
            />
            <button aria-label="Clear search"
              v-if="searchQuery"
              @click="searchQuery = ''"
              class="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X class="w-3 h-3" />
            </button>
          </div>

          <!-- Publish & Share Button (PRIMARY) -->
          <button
            @click="openPublishConfigModal"
            :disabled="isPublishing"
            class="px-3.5 py-1.5      text-white rounded-xl transition text-xs font-bold flex items-center gap-1.5  shadow-blue-500/20 disabled:opacity-50 bg-blue-700"
            title="Publish unique sharable link for read-only documentation"
          >
            <Loader2 v-if="isPublishing" class="w-3.5 h-3.5 animate-spin" />
            <Globe v-else class="w-3.5 h-3.5" />
            <span>{{ isPublishing ? 'Publishing...' : 'Publish & Share' }}</span>
          </button>

          <!-- Export Markdown -->
          <button
            @click="copyMarkdown"
            class="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition text-xs font-semibold flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
            title="Copy Markdown Documentation"
          >
            <Copy v-if="!copied" class="w-3.5 h-3.5 text-blue-500" />
            <Check v-else class="w-3.5 h-3.5 text-emerald-500 stroke-[3]" />
            <span class="hidden sm:inline">{{ copied ? 'Copied!' : 'Copy Markdown' }}</span>
          </button>

          <button
            @click="downloadMarkdown"
            class="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition text-xs font-semibold flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
            title="Export .md File"
          >
            <Download class="w-3.5 h-3.5" />
            <span class="hidden sm:inline">Export .md</span>
          </button>

          <div class="h-5 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1"></div>

          <button aria-label="Close dialog"
            @click="state.modals.docs = false"
            class="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Publish Configuration Modal -->
      <div
        v-if="showPublishConfigModal"
        class="app-dialog-backdrop absolute inset-0 z-50 bg-slate-950/80  flex items-center justify-center p-4 animate-fadeIn"
        @click.self="showPublishConfigModal = false"
      >
        <div v-dialog role="dialog" aria-modal="true" aria-label="Dictionary publication" class="app-dialog bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl  p-6 max-w-md w-full space-y-4 text-slate-800 dark:text-slate-100">
          <div class="app-dialog-heading flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div class="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <Globe class="w-5 h-5" />
              </div>
              <div>
                <h3 class="font-bold text-base font-sans">Publish dbdictionary</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400">Deploy read-only docs with optional password</p>
              </div>
            </div>
            <button aria-label="Close dialog" @click="showPublishConfigModal = false" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- Permissions selection -->
          <div class="space-y-2">
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-200">
              Access &amp; Security Level
            </label>
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                @click="publishAccessMode = 'public'"
                class="p-2.5 text-left rounded-xl border transition flex flex-col justify-between"
                :class="publishAccessMode === 'public'
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 ring-1 ring-blue-500'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'"
              >
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs font-bold text-slate-800 dark:text-slate-100">Public Open</span>
                  <Globe class="w-3.5 h-3.5 text-blue-500" />
                </div>
                <span class="text-[10px] text-slate-500 dark:text-slate-400">Anyone with link can view</span>
              </button>

              <button
                type="button"
                @click="publishAccessMode = 'password'"
                class="p-2.5 text-left rounded-xl border transition flex flex-col justify-between"
                :class="publishAccessMode === 'password'
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 ring-1 ring-blue-500'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'"
              >
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs font-bold text-slate-800 dark:text-slate-100">Password</span>
                  <Key class="w-3.5 h-3.5 text-blue-500" />
                </div>
                <span class="text-[10px] text-slate-500 dark:text-slate-400">Require passphrase</span>
              </button>
            </div>
          </div>

          <!-- Password Field if password mode selected -->
          <div
            v-if="publishAccessMode === 'password'"
            class="p-3 bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 rounded-xl space-y-2"
          >
            <div class="flex items-center justify-between">
              <label class="text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <Key class="w-3 h-3 text-blue-600 dark:text-blue-400" />
                <span>Dictionary Access Password</span>
              </label>
              <button
                type="button"
                @click="generatePublishPassword"
                class="text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
              >
                <RefreshCw class="w-2.5 h-2.5" />
                <span>Generate</span>
              </button>
            </div>

            <div class="relative">
              <input
                :type="showPublishPassword ? 'text' : 'password'"
                v-model="publishPassword"
                placeholder="Set password for viewers..."
                class="w-full pl-3 pr-9 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 text-xs font-mono outline-none focus:border-blue-500"
              />
              <button
                type="button"
                @click="showPublishPassword = !showPublishPassword"
                class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <EyeOff v-if="showPublishPassword" class="w-3.5 h-3.5" />
                <Eye v-else class="w-3.5 h-3.5" />
              </button>
            </div>
            <p class="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
              Anyone navigating to the published URL must input this password to view tables, fields, and diagrams.
            </p>
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              @click="showPublishConfigModal = false"
              class="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="button"
              @click="executePublishDictionary"
              :disabled="isPublishing"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5  disabled:opacity-50"
            >
              <Loader2 v-if="isPublishing" class="w-3.5 h-3.5 animate-spin" />
              <Globe v-else class="w-3.5 h-3.5" />
              <span>{{ isPublishing ? 'Publishing...' : 'Publish Documentation' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Published Success Link Popover Modal -->
      <div
        v-if="showPublishedSuccessModal"
        class="app-dialog-backdrop absolute inset-0 z-50 bg-slate-950/80  flex items-center justify-center p-4 animate-fadeIn"
        @click.self="showPublishedSuccessModal = false"
      >
        <div v-dialog role="dialog" aria-modal="true" aria-label="Dictionary publication" class="app-dialog bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl  p-6 max-w-lg w-full space-y-4 text-slate-800 dark:text-slate-100">
          <div class="app-dialog-heading flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div class="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Globe class="w-5 h-5" />
              </div>
              <div>
                <div class="flex items-center gap-1.5">
                  <h3 class="font-bold text-base font-sans">dbdictionary Published!</h3>
                  <span
                    v-if="lastPublishedIsPassword"
                    class="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                  >
                    Password Protected
                  </span>
                </div>
                <p class="text-xs text-slate-500 dark:text-slate-400">Unique shareable URL created successfully</p>
              </div>
            </div>
            <button aria-label="Close dialog" @click="showPublishedSuccessModal = false" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- URL box -->
          <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
            <label class="block text-[11px] font-bold text-slate-500 uppercase font-mono tracking-wider">
              Shareable Read-Only URL
            </label>
            <div class="flex items-center gap-2">
              <input
                type="text"
                readonly
                :value="publishedUrl"
                class="flex-1 px-3 py-2 rounded-lg text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-blue-600 dark:text-blue-400 outline-none select-all"
              />
              <button
                @click="copyPublishedUrl"
                class="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0"
              >
                <Check v-if="publishedCopied" class="w-3.5 h-3.5" />
                <Copy v-else class="w-3.5 h-3.5" />
                <span>{{ publishedCopied ? 'Copied!' : 'Copy Link' }}</span>
              </button>
            </div>
          </div>

          <!-- Password Display Card if protected -->
          <div
            v-if="lastPublishedIsPassword"
            class="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/70 flex items-center justify-between"
          >
            <div class="flex items-center gap-2">
              <Key class="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <div>
                <div class="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-wider">
                  Access Password
                </div>
                <div class="text-xs font-mono font-bold text-slate-800 dark:text-slate-100">
                  {{ lastPublishedPassword }}
                </div>
              </div>
            </div>

            <button
              type="button"
              @click="copyLinkWithPassword"
              class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition flex items-center gap-1"
              title="Copy both URL and password formatted for teammates"
            >
              <Check v-if="publishedWithPasswordCopied" class="w-3 h-3" />
              <Copy v-else class="w-3 h-3" />
              <span>{{ publishedWithPasswordCopied ? 'Copied with Password!' : 'Copy Link + Password' }}</span>
            </button>
          </div>

          <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Anyone with this link <span v-if="lastPublishedIsPassword">and the password above</span> can view the rendered, interactive read-only database dictionary with search, field note descriptions, and ERD visual diagram options.
          </p>

          <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <a
              :href="publishedUrl"
              target="_blank"
              class="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
            >
              <ExternalLink class="w-3.5 h-3.5 text-blue-500" />
              <span>Test Link in New Tab</span>
            </a>
            <button
              @click="showPublishedSuccessModal = false"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition"
            >
              Done
            </button>
          </div>
        </div>
      </div>

      <!-- Main Modal Workspace Body -->
      <div class="docs-workspace flex-1 flex overflow-hidden">
        <!-- Sidebar Navigation -->
        <div class="docs-sidebar w-64 border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col shrink-0 overflow-y-auto p-3 gap-2">
          <!-- Mobile Search Input -->
          <div class="lg:hidden mb-1">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search schema..."
              class="w-full px-3 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-800 dark:text-slate-100"
            />
          </div>

          <!-- All Tables Header Item -->
          <button
            @click="activeTableFilter = null"
            class="w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition text-left"
            :class="[
              activeTableFilter === null
                ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            ]"
          >
            <span class="flex items-center gap-2">
              <Layers class="w-4 h-4 text-blue-500" /> All Tables Summary
            </span>
            <span class="px-1.5 py-0.5 rounded-md text-[10px] bg-slate-200/60 dark:bg-slate-800 text-slate-500 font-mono">
              {{ activeProject.tables.length }}
            </span>
          </button>

          <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mt-2">
            Tables List
          </div>

          <!-- Table Items List -->
          <div class="space-y-1">
            <button
              v-for="tbl in filteredTablesList"
              :key="tbl.id"
              @click="scrollToTable(tbl.id)"
              class="w-full px-3 py-2 rounded-xl text-xs transition flex items-center justify-between text-left group"
              :class="[
                activeTableFilter === tbl.id
                  ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              ]"
            >
              <div class="flex items-center gap-2 truncate">
                <span
                  class="w-2.5 h-2.5 rounded-full shrink-0"
                  :style="{ backgroundColor: tbl.headerColor || '#3b82f6' }"
                ></span>
                <span class="font-mono font-medium truncate">{{ tbl.name }}</span>
              </div>
              <div class="flex items-center gap-1.5 shrink-0">
                <FileText v-if="tbl.note || tbl.columns.some(c => c.note)" class="w-3 h-3 text-amber-500" title="Has notes" />
                <span class="text-[10px] font-mono text-slate-400">
                  {{ tbl.columns.length }}
                </span>
              </div>
            </button>

            <div v-if="filteredTablesList.length === 0" class="px-3 py-4 text-center text-xs text-slate-400">
              No matching tables found
            </div>
          </div>
        </div>

        <!-- Documentation Content Body -->
        <div ref="docsContentRef" class="flex-1 overflow-y-auto p-6 space-y-8 bg-white dark:bg-slate-900 scroll-smooth">
          <!-- Project Schema Title Overview Banner -->
          <div class="app-dictionary-overview p-6 rounded-2xl     text-white  relative overflow-hidden bg-blue-700">
            <div class="relative z-10">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2 text-xs text-blue-300 font-mono font-semibold uppercase tracking-wider mb-1">
                  <span>dbdictionary</span> &bull; <span>{{ activeProject.dialect || 'PostgreSQL' }}</span>
                </div>
                <button
                  @click="publishDictionary"
                  class="px-3 py-1 bg-blue-500/30 hover:bg-blue-500/40 text-blue-200 border border-blue-400/30 rounded-lg text-xs font-semibold flex items-center gap-1"
                >
                  <Globe class="w-3.5 h-3.5" />
                  <span>Publish Link</span>
                </button>
              </div>

              <h1 class="text-2xl font-semibold tracking-tight font-sans text-white mb-2">
                {{ activeProject.name }}
              </h1>
              <p v-if="activeProject.description" class="text-xs text-slate-300 max-w-2xl leading-relaxed">
                {{ activeProject.description }}
              </p>

              <!-- Quick Metrics Grid -->
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/10 text-xs">
                <div>
                  <div class="text-[10px] text-slate-400 uppercase font-mono font-semibold">Total Tables</div>
                  <div class="text-lg font-bold font-mono text-blue-300">{{ activeProject.tables.length }}</div>
                </div>
                <div>
                  <div class="text-[10px] text-slate-400 uppercase font-mono font-semibold">Total Fields</div>
                  <div class="text-lg font-bold font-mono text-emerald-300">{{ totalFieldsCount }}</div>
                </div>
                <div>
                  <div class="text-[10px] text-slate-400 uppercase font-mono font-semibold">Relationships</div>
                  <div class="text-lg font-bold font-mono text-blue-300">{{ activeProject.relationships.length }}</div>
                </div>
                <div>
                  <div class="text-[10px] text-slate-400 uppercase font-mono font-semibold">Documented Notes</div>
                  <div class="text-lg font-bold font-mono text-amber-300">{{ totalNotesCount }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Documentation Sections per Table -->
          <div
            v-for="tbl in displayedTables"
            :key="tbl.id"
            :id="`doc-table-${tbl.id}`"
            class="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30 space-y-4"
          >
            <!-- Table Header Bar -->
            <div class="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div class="flex items-center gap-3">
                <div
                  class="w-4 h-4 rounded-lg shrink-0"
                  :style="{ backgroundColor: tbl.headerColor || '#3b82f6' }"
                ></div>
                <h3 class="font-bold text-lg font-mono text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <span>{{ tbl.name }}</span>
                  <span class="text-xs font-sans font-normal px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    {{ tbl.columns.length }} columns
                  </span>
                </h3>
              </div>

              <button
                @click="jumpToCanvasTable(tbl.id)"
                class="px-2.5 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-lg transition flex items-center gap-1"
                title="View on Canvas"
              >
                <span>View Canvas</span>
                <ExternalLink class="w-3.5 h-3.5" />
              </button>
            </div>

            <!-- Table Note Box -->
            <div class="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-slate-700 dark:text-slate-200 text-xs leading-relaxed space-y-1.5">
              <div class="font-bold text-[11px] text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center justify-between">
                <span class="flex items-center gap-1.5"><FileText class="w-3.5 h-3.5" /> Table Note</span>
                <button
                  @click="editingTableNoteId = editingTableNoteId === tbl.id ? null : tbl.id"
                  class="text-[10px] hover:underline font-semibold text-amber-700 dark:text-amber-300"
                >
                  {{ editingTableNoteId === tbl.id ? 'Close Edit' : 'Edit Note' }}
                </button>
              </div>

              <div v-if="editingTableNoteId === tbl.id" class="pt-1 space-y-1.5">
                <textarea
                  :value="tbl.note || ''"
                  @input="onTableNoteChange(tbl.id, $event.target.value)"
                  placeholder="Enter table note / description... (Supports multiline notes & Markdown)"
                  rows="3"
                  class="w-full p-2.5 text-xs font-mono rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 resize-y outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
                <div class="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500">
                  <span>Formatted as DBML Note: '''...'''</span>
                  <button
                    @click="editingTableNoteId = null"
                    class="px-2.5 py-1 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                  >
                    Done
                  </button>
                </div>
              </div>
              <div v-else class="font-sans text-slate-700 dark:text-slate-200 leading-relaxed text-xs">
                <div v-if="tbl.note" v-html="formatNoteHtml(tbl.note)"></div>
                <div v-else class="italic text-slate-400 dark:text-slate-500">
                  No description provided for this table. Click "Edit Note" to add documentation.
                </div>
              </div>
            </div>

            <!-- Columns Documentation Table -->
            <div class="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase font-mono font-semibold text-[10px]">
                  <tr>
                    <th class="py-2.5 px-3.5 w-1/4">Field</th>
                    <th class="py-2.5 px-3.5 w-1/5">Type</th>
                    <th class="py-2.5 px-3.5 w-1/5">Attributes</th>
                    <th class="py-2.5 px-3.5">Description / Note</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
                  <tr
                    v-for="(col, cIdx) in tbl.columns"
                    :key="cIdx"
                    class="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                  >
                    <!-- Field Name -->
                    <td class="py-2.5 px-3.5 font-mono font-bold text-slate-800 dark:text-slate-100">
                      {{ col.name }}
                    </td>

                    <!-- Type -->
                    <td class="py-2.5 px-3.5 font-mono text-slate-600 dark:text-slate-300 text-[11px]">
                      {{ col.type }}
                    </td>

                    <!-- Attributes -->
                    <td class="py-2.5 px-3.5 font-mono text-[10px]">
                      <div class="flex items-center gap-1 flex-wrap">
                        <span v-if="col.isPk || col.pk" class="px-1.5 py-0.5 rounded font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">PK</span>
                        <span v-if="col.isFk || col.fk" class="px-1.5 py-0.5 rounded font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">FK</span>
                        <span v-if="col.isUnique || col.unique" class="px-1.5 py-0.5 rounded font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">UQ</span>
                        <span v-if="(col.isNull === false || col.notNull === true) && !(col.isPk || col.pk)" class="px-1.5 py-0.5 rounded font-bold bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300">NOT NULL</span>
                        <span v-if="!(col.isPk || col.pk) && !(col.isFk || col.fk) && !(col.isUnique || col.unique) && col.isNull !== false && col.notNull !== true" class="text-slate-400">-</span>
                      </div>
                    </td>

                    <!-- Note / Description -->
                    <td class="py-2.5 px-3.5 text-slate-600 dark:text-slate-300 text-xs">
                      <div class="flex items-start justify-between gap-2 group/field">
                        <div
                          class="font-sans text-slate-700 dark:text-slate-200 leading-relaxed break-words"
                          :class="{ 'italic text-slate-400 dark:text-slate-500': !col.note }"
                        >
                          <div v-if="col.note" v-html="formatNoteHtml(col.note)"></div>
                          <span v-else>No field note</span>
                        </div>
                        <button
                          @click="editingColKey = editingColKey === `${tbl.id}-${cIdx}` ? null : `${tbl.id}-${cIdx}`"
                          class="opacity-0 group-hover/field:opacity-100 p-1 hover:text-blue-600 dark:hover:text-blue-400 text-slate-400 shrink-0 transition"
                          title="Edit Field Note"
                        >
                          <Edit3 class="w-3 h-3" />
                        </button>
                      </div>

                      <!-- Inline Column Note Editor (Multiline Supported) -->
                      <div v-if="editingColKey === `${tbl.id}-${cIdx}`" class="mt-2 space-y-1.5 p-2 rounded-lg bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                        <textarea
                          :value="col.note || ''"
                          @input="onColumnNoteChange(tbl.id, cIdx, $event.target.value)"
                          placeholder="Enter field note... (Supports multiline DBML note: ''')"
                          rows="3"
                          class="w-full p-2 text-xs font-mono rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 outline-none focus:ring-1 focus:ring-blue-500 resize-y"
                        ></textarea>
                        <div class="flex items-center justify-end">
                          <button
                            @click="editingColKey = null"
                            class="px-2 py-0.5 text-[10px] font-medium bg-blue-600 hover:bg-blue-700 text-white rounded transition"
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Relationships Section -->
            <div v-if="getTableRelationships(tbl.name).length > 0" class="pt-1">
              <div class="text-[10px] font-mono uppercase font-bold text-slate-400 mb-2 flex items-center gap-1">
                <GitFork class="w-3 h-3 text-blue-500" /> Foreign Keys & Relationships
              </div>
              <div class="space-y-1">
                <div
                  v-for="rel in getTableRelationships(tbl.name)"
                  :key="rel.id"
                  class="px-3 py-1.5 rounded-lg bg-slate-100/70 dark:bg-slate-800/60 font-mono text-xs flex items-center gap-2 text-slate-700 dark:text-slate-300"
                >
                  <span class="font-bold text-blue-600 dark:text-blue-400">{{ rel.fromTable }}.{{ rel.fromColumn }}</span>
                  <span class="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-bold text-[10px] text-slate-600 dark:text-slate-300">
                    {{ rel.cardinality }}
                  </span>
                  <span class="font-bold text-emerald-600 dark:text-emerald-400">{{ rel.toTable }}.{{ rel.toColumn }}</span>
                  <span v-if="rel.onDelete" class="text-[10px] text-slate-400 ml-auto font-sans">
                    On Delete: {{ rel.onDelete }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import DbMapLogo from './DbMapLogo.vue';
import {
  state,
  activeProject,
  addToast,
  updateTableNote,
  updateColumnNote
} from '../stores/schemaStore.js';
import { db, doc, setDoc } from '../firebase.js';
import { exportToMarkdownDocs, formatNoteHtml } from '../utils/dbmlParser.js';
import {
  BookOpen,
  Search,
  Copy,
  Check,
  Download,
  X,
  Globe,
  Loader2,
  Layers,
  FileText,
  ExternalLink,
  Edit3,
  GitFork,
  Key,
  Shield,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-vue-next';

const searchQuery = ref('');
const activeTableFilter = ref(null);
const copied = ref(false);
const docsContentRef = ref(null);

const editingTableNoteId = ref(null);
const editingColKey = ref(null);

const isPublishing = ref(false);
const showPublishConfigModal = ref(false);
const showPublishedSuccessModal = ref(false);
const publishAccessMode = ref('public');
const publishPassword = ref('');
const showPublishPassword = ref(false);
const lastPublishedPassword = ref('');
const lastPublishedIsPassword = ref(false);
const publishedUrl = ref('');
const publishedCopied = ref(false);
const publishedWithPasswordCopied = ref(false);

const totalFieldsCount = computed(() => {
  return activeProject.value?.tables.reduce((acc, t) => acc + t.columns.length, 0) || 0;
});

const totalNotesCount = computed(() => {
  if (!activeProject.value) return 0;
  let count = 0;
  activeProject.value.tables.forEach(t => {
    if (t.note) count++;
    t.columns.forEach(c => {
      if (c.note) count++;
    });
  });
  return count;
});

const filteredTablesList = computed(() => {
  if (!activeProject.value) return [];
  const query = searchQuery.value.toLowerCase().trim();
  if (!query) return activeProject.value.tables;

  return activeProject.value.tables.filter(t => {
    const matchTable = t.name.toLowerCase().includes(query) || (t.note && t.note.toLowerCase().includes(query));
    const matchCol = t.columns.some(c => c.name.toLowerCase().includes(query) || (c.note && c.note.toLowerCase().includes(query)));
    return matchTable || matchCol;
  });
});

const displayedTables = computed(() => {
  if (activeTableFilter.value) {
    return activeProject.value?.tables.filter(t => t.id === activeTableFilter.value) || [];
  }
  return filteredTablesList.value;
});

function scrollToTable(tblId) {
  activeTableFilter.value = null;
  const el = document.getElementById(`doc-table-${tblId}`);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function jumpToCanvasTable(tblId) {
  state.selectedTableId = tblId;
  state.viewMode = 'canvas';
  state.modals.docs = false;
}

function onTableNoteChange(tblId, val) {
  updateTableNote(tblId, val);
}

function onColumnNoteChange(tblId, colIdx, val) {
  updateColumnNote(tblId, colIdx, val);
}

function getTableRelationships(tableName) {
  if (!activeProject.value) return [];
  return activeProject.value.relationships.filter(
    r => r.fromTable === tableName || r.toTable === tableName
  );
}

function openPublishConfigModal() {
  const proj = activeProject.value;
  if (!proj) return;
  if (proj.sharePassword) {
    publishPassword.value = proj.sharePassword;
    publishAccessMode.value = 'password';
  } else {
    publishAccessMode.value = 'public';
    publishPassword.value = '';
  }
  showPublishConfigModal.value = true;
}

function generatePublishPassword() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let randStr = '';
  for (let i = 0; i < 6; i++) {
    randStr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  publishPassword.value = `doc-${randStr}`;
}

async function executePublishDictionary() {
  const proj = activeProject.value;
  if (!proj) return;

  const isPassword = publishAccessMode.value === 'password';
  const pwd = publishPassword.value.trim();

  if (isPassword && !pwd) {
    addToast('Password Missing', 'Please enter a password or click Generate to secure this dictionary.', 'warning');
    return;
  }
  
  isPublishing.value = true;
  try {
    const dictId = 'dict_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
    const docRef = doc(db, 'published_dictionaries', dictId);
    
    await setDoc(docRef, {
      id: dictId,
      title: proj.name,
      description: proj.description || '',
      dialect: proj.dialect || 'postgres',
      tables: JSON.parse(JSON.stringify(proj.tables)),
      relationships: JSON.parse(JSON.stringify(proj.relationships)),
      publishedBy: state.currentUser.name || 'Anonymous',
      publishedAt: new Date().toISOString(),
      views: 1,
      isPasswordProtected: isPassword,
      sharePassword: isPassword ? pwd : null,
      accessMode: isPassword ? 'password' : 'public'
    });

    const url = new URL(window.location.href);
    url.searchParams.set('dbdictionary', dictId);
    publishedUrl.value = url.toString();
    lastPublishedPassword.value = isPassword ? pwd : '';
    lastPublishedIsPassword.value = isPassword;

    showPublishConfigModal.value = false;
    showPublishedSuccessModal.value = true;
    
    addToast(
      'dbdictionary Published!',
      isPassword
        ? 'Your password-protected documentation link is live.'
        : 'Your unique shareable URL is live.',
      'success'
    );
  } catch (err) {
    console.error('Failed to publish dbdictionary:', err);
    addToast('Publish Error', err.message || 'Could not publish dbdictionary', 'error');
  } finally {
    isPublishing.value = false;
  }
}

function copyPublishedUrl() {
  navigator.clipboard.writeText(publishedUrl.value);
  publishedCopied.value = true;
  addToast('Copied Link', 'Sharable dbdictionary URL copied to clipboard!', 'success');
  setTimeout(() => {
    publishedCopied.value = false;
  }, 2000);
}

function copyLinkWithPassword() {
  const message = `Database dictionary documentation for "${activeProject.value?.name}":\nLink: ${publishedUrl.value}\nPassword: ${lastPublishedPassword.value}`;
  navigator.clipboard.writeText(message);
  publishedWithPasswordCopied.value = true;
  addToast('Link + Password Copied', 'Documentation link and password copied to clipboard!', 'success');
  setTimeout(() => {
    publishedWithPasswordCopied.value = false;
  }, 2000);
}

function generateMarkdown() {
  const proj = activeProject.value;
  if (!proj) return '';
  return exportToMarkdownDocs(proj.name, proj.tables, proj.relationships);
}

function copyMarkdown() {
  const md = generateMarkdown();
  navigator.clipboard.writeText(md);
  copied.value = true;
  addToast('Copied Docs', 'Database dictionary Markdown copied to clipboard', 'success');
  setTimeout(() => {
    copied.value = false;
  }, 2000);
}

function downloadMarkdown() {
  const md = generateMarkdown();
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${activeProject.value.name.toLowerCase().replace(/\s+/g, '_')}_dbdictionary.md`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  addToast('Exported Documentation', 'Downloaded Markdown dbdictionary file', 'success');
}
</script>
