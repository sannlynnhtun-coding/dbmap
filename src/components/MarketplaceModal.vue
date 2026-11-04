<template>
  <!-- Marketplace Modal (Shown inside Studio or triggered via openMarketplace) -->
  <div
    v-if="state.modals.marketplace"
    class="app-dialog-backdrop fixed inset-0 z-50 bg-slate-900/60  flex items-center justify-center p-2 sm:p-4 md:p-6"
    @click.self="closeMarketplace"
  >
    <div
      role="dialog" aria-modal="true" aria-label="Schema marketplace" class="app-dialog bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl  w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100 transition-all"
    >
      <!-- MODAL HEADER -->
      <div class="app-dialog-heading px-5 py-4 bg-slate-50/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div class="flex items-center gap-3">
          <div class="p-2.5 rounded-xl    text-white  shrink-0 bg-blue-700">
            <Store class="w-5 h-5" />
          </div>
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <h2 class="font-bold text-slate-900 dark:text-white text-base sm:text-lg">
                Schema Marketplace & Templates
              </h2>
              <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                Live Community & System
              </span>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Production database architectures from dbmaps System & Community. 100% free & one-click cloneable.
            </p>
          </div>
        </div>

        <!-- Header Actions: Search, Submit & Close -->
        <div class="flex items-center gap-2 shrink-0">
          <div class="relative w-full sm:w-56">
            <Search class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search templates..."
              class="w-full pl-8 pr-7 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button aria-label="Clear search"
              v-if="searchQuery"
              @click="searchQuery = ''"
              class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X class="w-3 h-3" />
            </button>
          </div>

          <button
            v-if="isCurrentUserAdmin"
            @click="handleCreateSystemBlueprint"
            class="px-3 py-1.5      text-white font-bold text-xs rounded-xl  transition flex items-center gap-1.5 cursor-pointer shrink-0 bg-blue-700"
            title="Create an official dbmaps System blueprint (Admin)"
          >
            <Zap class="w-3.5 h-3.5" />
            <span class="hidden sm:inline">+ System Blueprint</span>
          </button>

          <button
            @click="openSubmitModal"
            class="px-3 py-1.5      text-white font-bold text-xs rounded-xl  transition flex items-center gap-1.5 cursor-pointer shrink-0 bg-blue-700"
            title="Publish your active database to the marketplace"
          >
            <UploadCloud class="w-3.5 h-3.5" />
            <span class="hidden sm:inline">Submit Database</span>
          </button>

          <button
            @click="closeMarketplace"
            class="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Close Marketplace"
          >
            <X class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- SOURCE FILTER & CATEGORY FILTER CONTROLS BAR -->
      <div class="px-5 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 overflow-x-auto shrink-0 scrollbar-none text-xs">
        <!-- Source Toggle (All / dbmaps System / Community) -->
        <div class="flex items-center gap-1.5 shrink-0 bg-slate-100 dark:bg-slate-800/70 p-1 rounded-xl">
          <button
            @click="selectedSource = 'all'"
            class="px-3 py-1 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5"
            :class="[
              selectedSource === 'all'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            ]"
          >
            <span>All</span>
            <span class="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-600 font-mono">
              {{ allMarketplaceTemplates.length }}
            </span>
          </button>

          <button
            @click="selectedSource = 'system'"
            class="px-3 py-1 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5"
            :class="[
              selectedSource === 'system'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400'
            ]"
          >
            <Sparkles class="w-3 h-3" />
            <span>dbmaps System</span>
            <span class="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-500/30 font-mono">
              {{ systemCount }}
            </span>
          </button>

          <button
            @click="selectedSource = 'community'"
            class="px-3 py-1 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5"
            :class="[
              selectedSource === 'community'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400'
            ]"
          >
            <Globe class="w-3 h-3" />
            <span>Community</span>
            <span class="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/30 font-mono">
              {{ communityCount }}
            </span>
          </button>
        </div>

        <!-- Category Pills & Dialect Selector -->
        <div class="flex items-center gap-2 overflow-x-auto scrollbar-none">
          <div class="flex items-center gap-1 shrink-0">
            <button
              v-for="cat in MARKETPLACE_CATEGORIES"
              :key="cat.id"
              @click="selectedCategory = cat.id"
              class="px-2.5 py-1 rounded-lg font-medium transition cursor-pointer shrink-0 text-[11px]"
              :class="[
                selectedCategory === cat.id
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              ]"
            >
              {{ cat.label }}
            </button>
          </div>

          <!-- Dialect Selector -->
          <div class="flex items-center gap-1.5 shrink-0 pl-2 border-l border-slate-200 dark:border-slate-800">
            <span class="text-slate-400 text-[11px] font-medium hidden lg:inline">Engine:</span>
            <select
              v-model="selectedDialect"
              class="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="all">All Dialects</option>
              <option value="postgres">PostgreSQL</option>
              <option value="mysql">MySQL</option>
              <option value="sqlite">SQLite</option>
              <option value="mssql">MS SQL Server</option>
              <option value="dbml">DBML</option>
            </select>
          </div>
        </div>
      </div>

      <!-- TEMPLATES GRID / SCROLLABLE BODY -->
      <div class="flex-1 overflow-y-auto p-5 sm:p-6 bg-slate-50/50 dark:bg-slate-950/40">
        <!-- If results exist -->
        <div
          v-if="filteredTemplates.length > 0"
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          <div
            v-for="tpl in filteredTemplates"
            :key="tpl.id"
            class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600  transition-all flex flex-col justify-between overflow-hidden group"
          >
            <!-- Card Header -->
            <div class="p-5 pb-3">
              <div class="flex items-start justify-between gap-2 mb-2.5">
                <!-- Badges -->
                <div class="flex items-center gap-1.5 flex-wrap">
                  <!-- System vs Community Badge -->
                  <span
                    v-if="tpl.isSystem"
                    class="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1"
                  >
                    <Sparkles class="w-2.5 h-2.5 text-blue-500" />
                    <span>dbmaps System</span>
                  </span>
                  <span
                    v-else
                    class="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1"
                  >
                    <Globe class="w-2.5 h-2.5 text-emerald-500" />
                    <span>Community</span>
                  </span>

                  <span class="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {{ tpl.complexity }}
                  </span>
                </div>

                <div class="flex items-center gap-1.5 shrink-0">
                  <!-- Edit Button for Admin or Author -->
                  <button
                    v-if="canEditTemplate(tpl)"
                    @click.stop="handleEditTemplate(tpl)"
                    class="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    title="Edit blueprint metadata or schema"
                  >
                    <Edit3 class="w-3.5 h-3.5" />
                  </button>

                  <!-- Unpublish Button if author or admin -->
                  <button
                    v-if="canDeleteTemplate(tpl)"
                    @click.stop="handleDeleteTemplate(tpl)"
                    class="p-1 text-slate-400 hover:text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                    title="Unpublish this blueprint from Community Marketplace"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>

                  <!-- Price Pill -->
                  <span class="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/80">
                    Free
                  </span>
                </div>
              </div>

              <!-- Title & Tagline -->
              <h3 class="font-bold text-slate-900 dark:text-white text-base group-hover:text-blue-600 dark:group-hover:text-blue-400 transition leading-snug">
                {{ tpl.name }}
              </h3>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                {{ tpl.description }}
              </p>

              <!-- Author Line -->
              <div class="mt-3.5 flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                <img
                  :src="tpl.author.avatar"
                  :alt="tpl.author.name"
                  class="w-6 h-6 rounded-full object-cover border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800"
                />
                <div class="text-[11px] min-w-0">
                  <div class="font-medium text-slate-800 dark:text-slate-200 truncate flex items-center gap-1">
                    <span>{{ tpl.author.name }}</span>
                    <CheckCircle2 v-if="tpl.isSystem || tpl.isVerified" class="w-3 h-3 text-blue-500 shrink-0" />
                    <span v-if="isMyTemplate(tpl)" class="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                      You
                    </span>
                  </div>
                  <div class="text-[10px] text-slate-400 truncate">{{ tpl.author.title }}</div>
                </div>
              </div>

              <!-- Highlights list -->
              <div class="mt-3 space-y-1">
                <div
                  v-for="(h, idx) in tpl.highlights.slice(0, 2)"
                  :key="idx"
                  class="flex items-start gap-1.5 text-[11px] text-slate-600 dark:text-slate-400"
                >
                  <Check class="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                  <span class="line-clamp-1">{{ h }}</span>
                </div>
              </div>
            </div>

            <!-- Card Footer: Stats & Actions -->
            <div class="p-4 bg-slate-50/70 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800/80">
              <!-- Metrics bar -->
              <div class="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-3 font-mono">
                <div class="flex items-center gap-3">
                  <span class="flex items-center gap-1">
                    <Database class="w-3 h-3 text-blue-500" />
                    <strong>{{ (tpl.tables || []).length }}</strong> tables
                  </span>
                  <span class="flex items-center gap-1">
                    <GitFork class="w-3 h-3 text-blue-500" />
                    <strong>{{ (tpl.relationships || []).length }}</strong> relations
                  </span>
                </div>
                <div class="flex items-center gap-1">
                  <Download class="w-3 h-3 text-emerald-500" />
                  <span>{{ (tpl.clonesCount || 0).toLocaleString() }}</span>
                </div>
              </div>

              <!-- Button actions -->
              <div class="grid grid-cols-2 gap-2">
                <button
                  @click="openPreview(tpl)"
                  class="w-full py-1.5 px-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Eye class="w-3.5 h-3.5 text-slate-500" />
                  <span>Preview</span>
                </button>

                <button
                  @click="cloneTemplate(tpl)"
                  class="w-full py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold  transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Copy class="w-3.5 h-3.5" />
                  <span>Clone Schema</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div
          v-else
          class="py-16 text-center max-w-md mx-auto"
        >
          <div class="w-14 h-14 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
            <Search class="w-7 h-7 opacity-70" />
          </div>
          <h3 class="font-bold text-slate-800 dark:text-slate-200 text-sm mb-1">
            {{ selectedSource === 'community' ? 'No Community Blueprints Yet' : 'No Blueprints Found' }}
          </h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            <template v-if="selectedSource === 'community'">
              Be the first to publish your database schema architecture to the dbmaps community!
            </template>
            <template v-else>
              No schemas match "{{ searchQuery }}". Try adjusting your search keywords or switching category filters.
            </template>
          </p>

          <div class="mt-4 flex items-center justify-center gap-2">
            <button
              v-if="selectedSource === 'community'"
              @click="openSubmitModal"
              class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <UploadCloud class="w-4 h-4" />
              <span>Submit Your Database</span>
            </button>
            <button
              @click="resetFilters"
              class="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition cursor-pointer"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      <!-- FOOTER INFO BAR -->
      <div class="px-5 py-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 shrink-0">
        <div class="flex items-center gap-2">
          <UploadCloud class="w-4 h-4 text-emerald-500" />
          <span>Have an engineered database schema?</span>
          <button
            @click="openSubmitModal"
            class="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
          >
            Submit to Community Marketplace
          </button>
        </div>

        <div class="flex items-center gap-4">
          <span>Showing <strong>{{ filteredTemplates.length }}</strong> of {{ allMarketplaceTemplates.length }} blueprints</span>
          <button
            @click="closeMarketplace"
            class="font-semibold text-slate-700 dark:text-slate-300 hover:underline cursor-pointer"
          >
            Back to Studio
          </button>
        </div>
      </div>
    </div>

    <!-- PREVIEW MODAL OVERLAY -->
    <div
      v-if="selectedPreviewTemplate"
      class="app-dialog-backdrop fixed inset-0 z-60 bg-slate-950/70  flex items-center justify-center p-3 sm:p-6"
      @click.self="selectedPreviewTemplate = null"
    >
      <div role="dialog" aria-modal="true" aria-label="Blueprint preview"
        class="app-dialog bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl  w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-150"
      >
        <!-- Preview Header -->
        <div class="app-dialog-heading p-5 bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 mb-1.5 flex-wrap">
              <span
                v-if="selectedPreviewTemplate.isSystem"
                class="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
              >
                dbmaps System
              </span>
              <span
                v-else
                class="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              >
                Community
              </span>
              <span class="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {{ selectedPreviewTemplate.complexity }} Tier
              </span>
              <span class="text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                {{ selectedPreviewTemplate.dialect }}
              </span>
            </div>
            <h2 class="text-xl font-bold text-slate-900 dark:text-white">
              {{ selectedPreviewTemplate.name }}
            </h2>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              {{ selectedPreviewTemplate.description }}
            </p>
          </div>

          <button aria-label="Close dialog"
            @click="selectedPreviewTemplate = null"
            class="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Preview Body -->
        <div class="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          <!-- Architecture Metrics & Author -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <!-- Tables count -->
            <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
              <div class="p-2 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400">
                <Database class="w-4 h-4" />
              </div>
              <div>
                <div class="text-xs text-slate-400">Normalized Tables</div>
                <div class="text-base font-bold text-slate-900 dark:text-white font-mono">
                  {{ (selectedPreviewTemplate.tables || []).length }} Tables
                </div>
              </div>
            </div>

            <!-- Relationships count -->
            <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
              <div class="p-2 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400">
                <GitFork class="w-4 h-4" />
              </div>
              <div>
                <div class="text-xs text-slate-400">Foreign Constraints</div>
                <div class="text-base font-bold text-slate-900 dark:text-white font-mono">
                  {{ (selectedPreviewTemplate.relationships || []).length }} Relations
                </div>
              </div>
            </div>

            <!-- Architect -->
            <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
              <img
                :src="selectedPreviewTemplate.author.avatar"
                :alt="selectedPreviewTemplate.author.name"
                class="w-10 h-10 rounded-full object-cover border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800"
              />
              <div class="min-w-0">
                <div class="text-xs text-slate-400">Architect</div>
                <div class="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {{ selectedPreviewTemplate.author.name }}
                </div>
                <div class="text-[10px] text-slate-500 truncate">
                  {{ selectedPreviewTemplate.author.title }}
                </div>
              </div>
            </div>
          </div>

          <!-- Architectural Highlights -->
          <div>
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Architectural Highlights
            </h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div
                v-for="(hl, idx) in selectedPreviewTemplate.highlights"
                :key="idx"
                class="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300"
              >
                <Check class="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>{{ hl }}</span>
              </div>
            </div>
          </div>

          <!-- Included Tables List -->
          <div>
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Included Tables ({{ (selectedPreviewTemplate.tables || []).length }})
            </h4>
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              <div
                v-for="tbl in selectedPreviewTemplate.tables"
                :key="tbl.id || tbl.name"
                class="p-2.5 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs"
              >
                <div class="font-mono font-bold text-slate-800 dark:text-slate-200 truncate flex items-center gap-1.5">
                  <div
                    class="w-2 h-2 rounded-full shrink-0"
                    :style="{ backgroundColor: tbl.headerColor || '#3b82f6' }"
                  ></div>
                  <span class="truncate">{{ tbl.name }}</span>
                </div>
                <div class="text-[10px] text-slate-400 mt-1">
                  {{ (tbl.columns || []).length }} columns
                </div>
              </div>
            </div>
          </div>

          <!-- DBML Code Snippet Preview -->
          <div v-if="selectedPreviewTemplate.dbml">
            <div class="flex items-center justify-between mb-2">
              <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Code class="w-3.5 h-3.5 text-blue-500" />
                <span>DBML Blueprint Definition</span>
              </h4>
              <button
                @click="copyDbmlSnippet(selectedPreviewTemplate.dbml)"
                class="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition flex items-center gap-1 cursor-pointer"
              >
                <Check v-if="hasCopiedDbml" class="w-3.5 h-3.5 text-emerald-500" />
                <Copy v-else class="w-3.5 h-3.5 text-slate-500" />
                <span>{{ hasCopiedDbml ? 'Copied!' : 'Copy DBML' }}</span>
              </button>
            </div>
            <pre class="p-4 bg-slate-950 text-slate-200 rounded-xl font-mono text-xs overflow-x-auto border border-slate-800 max-h-64 leading-relaxed select-text">{{ selectedPreviewTemplate.dbml }}</pre>
          </div>
        </div>

        <!-- Preview Footer Actions -->
        <div class="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            v-if="canDeleteTemplate(selectedPreviewTemplate)"
            @click="handleDeleteTemplate(selectedPreviewTemplate)"
            class="px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer flex items-center gap-1"
          >
            <Trash2 class="w-3.5 h-3.5" />
            <span>Unpublish from Marketplace</span>
          </button>
          <div v-else></div>

          <div class="flex items-center gap-2">
            <button
              v-if="canEditTemplate(selectedPreviewTemplate)"
              @click="handleEditTemplate(selectedPreviewTemplate)"
              class="px-3.5 py-2 rounded-xl text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900 transition cursor-pointer flex items-center gap-1.5"
              title="Edit blueprint metadata or schema"
            >
              <Edit3 class="w-3.5 h-3.5" />
              <span>Edit Blueprint</span>
            </button>

            <button
              @click="selectedPreviewTemplate = null"
              class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              @click="cloneTemplate(selectedPreviewTemplate)"
              class="px-5 py-2      text-white font-bold text-xs rounded-xl  transition flex items-center gap-1.5 cursor-pointer bg-blue-700"
            >
              <Copy class="w-4 h-4" />
              <span>Clone & Open in Studio</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import {
  state,
  cloneMarketplaceTemplate,
  allMarketplaceTemplates,
  openSubmitToMarketplace,
  deleteMarketplaceTemplate,
  addToast,
  isCurrentUserAdmin,
  openCreateSystemMarketplaceTemplate,
  openEditMarketplaceTemplate
} from '../stores/schemaStore.js';
import { MARKETPLACE_CATEGORIES } from '../utils/marketplaceTemplates.js';
import {
  Store,
  Search,
  X,
  Database,
  GitFork,
  Download,
  Copy,
  Eye,
  Check,
  CheckCircle2,
  Sparkles,
  Globe,
  UploadCloud,
  Trash2,
  Code,
  Zap,
  Edit3
} from 'lucide-vue-next';

const searchQuery = ref('');
const selectedSource = ref('all'); // 'all' | 'system' | 'community'
const selectedCategory = ref('all');
const selectedDialect = ref('all');
const selectedPreviewTemplate = ref(null);
const hasCopiedDbml = ref(false);

const systemCount = computed(() => {
  return allMarketplaceTemplates.value.filter(t => t.isSystem).length;
});

const communityCount = computed(() => {
  return allMarketplaceTemplates.value.filter(t => !t.isSystem).length;
});

const filteredTemplates = computed(() => {
  let list = allMarketplaceTemplates.value;

  // Source filter
  if (selectedSource.value === 'system') {
    list = list.filter(t => t.isSystem);
  } else if (selectedSource.value === 'community') {
    list = list.filter(t => !t.isSystem);
  }

  // Category filter
  if (selectedCategory.value !== 'all') {
    list = list.filter((t) => t.category === selectedCategory.value);
  }

  // Dialect filter
  if (selectedDialect.value !== 'all') {
    list = list.filter((t) => t.dialect === selectedDialect.value);
  }

  // Search query filter
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    list = list.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        (t.author?.name && t.author.name.toLowerCase().includes(q)) ||
        (t.tables || []).some((tbl) => tbl.name.toLowerCase().includes(q))
    );
  }

  return list;
});

function isMyTemplate(tpl) {
  if (tpl.isSystem) return false;
  const currentUid = state.currentUser?.id;
  const currentEmail = state.currentUser?.email;
  return (tpl.authorUid && tpl.authorUid === currentUid) ||
         (tpl.authorEmail && tpl.authorEmail === currentEmail);
}

function canEditTemplate(tpl) {
  if (!tpl) return false;
  return isMyTemplate(tpl) || isCurrentUserAdmin.value;
}

function handleCreateSystemBlueprint() {
  openCreateSystemMarketplaceTemplate();
}

function handleEditTemplate(tpl) {
  openEditMarketplaceTemplate(tpl);
  selectedPreviewTemplate.value = null;
}

function canDeleteTemplate(tpl) {
  if (!tpl) return false;
  if (isCurrentUserAdmin.value && (!tpl.isBuiltIn || state.marketplaceSubmissions.some(s => s.id === tpl.id))) {
    return true;
  }
  if (tpl.isSystem) return false;
  return isMyTemplate(tpl) || isCurrentUserAdmin.value;
}

function handleDeleteTemplate(tpl) {
  if (confirm(`Are you sure you want to unpublish "${tpl.name}" from the Community Marketplace?`)) {
    deleteMarketplaceTemplate(tpl.id);
    if (selectedPreviewTemplate.value && selectedPreviewTemplate.value.id === tpl.id) {
      selectedPreviewTemplate.value = null;
    }
  }
}

function openSubmitModal() {
  openSubmitToMarketplace();
}

function resetFilters() {
  searchQuery.value = '';
  selectedSource.value = 'all';
  selectedCategory.value = 'all';
  selectedDialect.value = 'all';
}

function closeMarketplace() {
  state.modals.marketplace = false;
  selectedPreviewTemplate.value = null;
}

function openPreview(template) {
  selectedPreviewTemplate.value = template;
  hasCopiedDbml.value = false;
}

function cloneTemplate(template) {
  cloneMarketplaceTemplate(template);
  selectedPreviewTemplate.value = null;
}

async function copyDbmlSnippet(dbmlCode) {
  try {
    await navigator.clipboard.writeText(dbmlCode);
    hasCopiedDbml.value = true;
    addToast('DBML Copied', 'Template DBML copied to clipboard', 'info');
    setTimeout(() => {
      hasCopiedDbml.value = false;
    }, 2000);
  } catch (err) {
    addToast('Copy Failed', 'Please select and copy the text manually', 'warning');
  }
}
</script>
