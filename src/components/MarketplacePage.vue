<template>
  <div class="app-page app-marketplace-page min-h-dvh bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
    <!-- TOP NAVBAR -->
    <header class="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90  border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <button
          @click="goToHome"
          class="flex items-center gap-2 text-left cursor-pointer group"
        >
          <DbMapLogo class-name="w-8 h-8 transition-transform group-hover:scale-105" />
          <div class="flex flex-col">
            <span class="font-mono font-bold text-slate-900 dark:text-white text-base leading-none">
              db<span class="text-blue-600 dark:text-blue-400">maps</span>
            </span>
            <span class="text-[10px] text-slate-400 font-medium tracking-wide uppercase mt-0.5">
              Template Library
            </span>
          </div>
        </button>

        <span class="text-slate-300 dark:text-slate-700 hidden sm:inline">|</span>
        <span class="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline font-medium">
          Production Database Blueprints & Community Schemas
        </span>
      </div>

      <!-- Center / Right Actions -->
      <div class="flex items-center gap-2 sm:gap-3">
        <!-- Search bar -->
        <div class="relative w-40 sm:w-64 hidden md:block">
          <Search class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search blueprints..."
            class="w-full pl-8 pr-7 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button aria-label="Clear search"
            v-if="searchQuery"
            @click="searchQuery = ''"
            class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X class="w-3 h-3" />
          </button>
        </div>

        <!-- Submit Database CTA -->




        <button
          @click="toggleDarkMode"
          title="Toggle Dark / Light Mode"
          class="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <Sun v-if="state.isDarkMode" class="w-4 h-4 text-amber-400" />
          <Moon v-else class="w-4 h-4 text-slate-600" />
        </button>

        <button
          @click="goToStudio"
          class="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold  transition flex items-center gap-1.5 cursor-pointer"
        >
          <span>Studio</span>
          <ArrowRight class="w-3.5 h-3.5" />
        </button>
      </div>
    </header>

    <!-- HERO INTRO BANNER -->
    <div class="border-b border-slate-200 dark:border-slate-800 py-10 sm:py-14 px-4 sm:px-8 app-soft-surface">
      <div class="max-w-6xl mx-auto text-center space-y-3.5">


        <h1 class="text-3xl sm:text-4xl font-semibold text-slate-900 dark:text-white tracking-tight">
          Schema marketplace
        </h1>

        <p class="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Preview a built-in database design and copy it into your workspace.
        </p>

        <!-- CTA Buttons -->
        <div class="pt-2 flex flex-wrap items-center justify-center gap-3">

          <button
            @click="goToStudio"
            class="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
          >
            <span>Open ERD Studio</span>
            <ArrowRight class="w-3.5 h-3.5" />
          </button>
        </div>

        <!-- Search Bar on mobile -->
        <div class="pt-2 max-w-md mx-auto md:hidden">
          <div class="relative w-full">
            <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search across all blueprints..."
              class="w-full pl-9 pr-8 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- MAIN BODY CONTENT -->
    <main class="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-8 space-y-6">
      <!-- Source Toggle, Category Tabs & Engine Filter -->
      <div class="space-y-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <!-- Top Row: Source Toggle -->
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-1.5 bg-slate-200/70 dark:bg-slate-800/80 p-1 rounded-xl text-xs">
            <button
              @click="selectedSource = 'all'"
              class="px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5"
              :class="[
                selectedSource === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              ]"
            >
              <span>All Blueprints</span>
              <span class="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-600 font-mono">
                {{ allMarketplaceTemplates.length }}
              </span>
            </button>

            <button
              @click="selectedSource = 'system'"
              class="px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5"
              :class="[
                selectedSource === 'system'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400'
              ]"
            >
              <Sparkles class="w-3.5 h-3.5" />
              <span>dbmaps System</span>
              <span class="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-500/30 font-mono">
                {{ systemCount }}
              </span>
            </button>


          </div>

          <!-- Dialect Selector -->
          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">Dialect:</span>
            <select
              v-model="selectedDialect"
              class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All SQL Dialects</option>
              <option value="postgres">PostgreSQL</option>
              <option value="mysql">MySQL</option>
              <option value="sqlite">SQLite</option>
              <option value="mssql">MS SQL Server</option>
              <option value="dbml">DBML</option>
            </select>
          </div>
        </div>

        <!-- Bottom Row: Category Filter Pills -->
        <label class="marketplace-category"><span>Category</span><select v-model="selectedCategory" aria-label="Template category"><option v-for="cat in MARKETPLACE_CATEGORIES" :key="cat.id" :value="cat.id">{{ cat.label }}</option></select></label>
      </div>

      <!-- TEMPLATES GRID -->
      <div
        v-if="filteredTemplates.length > 0"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <div
          v-for="tpl in filteredTemplates"
          :key="tpl.id"
          class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600  transition-all flex flex-col justify-between overflow-hidden group"
        >
          <!-- Card Header & Body -->
          <div class="p-6 pb-4">
            <div class="flex items-start justify-between gap-2 mb-3">
              <div class="flex items-center gap-1.5 flex-wrap">
                <!-- System vs Community Badge -->
                <span
                  v-if="tpl.isSystem"
                  class="text-[10px] font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1"
                >
                  <Sparkles class="w-2.5 h-2.5 text-blue-500" />
                  <span>dbmaps System</span>
                </span>
                <span
                  v-else
                  class="text-[10px] font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1"
                >
                  <Globe class="w-2.5 h-2.5 text-emerald-500" />
                  <span>Community</span>
                </span>

                <span class="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {{ tpl.complexity }}
                </span>
              </div>

              <div class="flex items-center gap-1.5 shrink-0">
                <!-- Edit if author or admin -->


                <!-- Delete if author or admin -->


                <span class="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/80">
                  Free
                </span>
              </div>
            </div>

            <!-- Title & Description -->
            <h3 class="font-bold text-slate-900 dark:text-white text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition leading-snug">
              {{ tpl.name }}
            </h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
              {{ tpl.description }}
            </p>

            <!-- Author info -->
            <div class="mt-4 flex items-center gap-2.5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80">
              <img
                :src="tpl.author.avatar"
                :alt="tpl.author.name"
                class="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800"
              />
              <div class="text-xs min-w-0">
                <div class="font-semibold text-slate-800 dark:text-slate-200 truncate flex items-center gap-1">
                  <span>{{ tpl.author.name }}</span>
                  <CheckCircle2 v-if="tpl.isSystem || tpl.isVerified" class="w-3.5 h-3.5 text-blue-500 shrink-0" />

                </div>
                <div class="text-[10px] text-slate-400 truncate">{{ tpl.author.title }}</div>
              </div>
            </div>

            <!-- Highlights -->
            <div class="mt-3.5 space-y-1.5">
              <div
                v-for="(h, idx) in tpl.highlights.slice(0, 3)"
                :key="idx"
                class="flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-400"
              >
                <Check class="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span class="line-clamp-1">{{ h }}</span>
              </div>
            </div>
          </div>

          <!-- Card Footer Stats & Actions -->
          <div class="p-5 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800/80">
            <!-- Metrics -->
            <div class="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-3.5 font-mono">
              <div class="flex items-center gap-3">
                <span class="flex items-center gap-1">
                  <Database class="w-3.5 h-3.5 text-blue-500" />
                  <strong>{{ (tpl.tables || []).length }}</strong> tables
                </span>
                <span class="flex items-center gap-1">
                  <GitFork class="w-3.5 h-3.5 text-blue-500" />
                  <strong>{{ (tpl.relationships || []).length }}</strong> relations
                </span>
              </div>
              <div class="flex items-center gap-1">
                <Download class="w-3.5 h-3.5 text-emerald-500" />
                <span>{{ (tpl.clonesCount || 0).toLocaleString() }}</span>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="grid grid-cols-2 gap-2">
              <button
                @click="openPreview(tpl)"
                class="w-full py-2 px-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Eye class="w-4 h-4 text-slate-500" />
                <span>Preview</span>
              </button>

              <button
                @click="cloneTemplate(tpl)"
                class="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold  transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Copy class="w-4 h-4" />
                <span>Clone Schema</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-else
        class="py-20 text-center max-w-md mx-auto"
      >
        <div class="w-16 h-16 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
          <Search class="w-8 h-8 opacity-70" />
        </div>
        <h3 class="font-bold text-slate-800 dark:text-slate-200 text-base mb-1">
          {{ selectedSource === 'community' ? 'No Community Blueprints Found' : 'No Blueprints Found' }}
        </h3>
        <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          <template v-if="selectedSource === 'community'">
            Be the first to publish your database architecture to the dbmaps community!
          </template>
          <template v-else>
            No database schemas match your filter criteria. Try searching with different keywords or resetting filters.
          </template>
        </p>

        <div class="mt-5 flex items-center justify-center gap-2">

          <button
            @click="resetFilters"
            class="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      </div>
    </main>

    <!-- FOOTER -->
    <footer class="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-8 px-4 sm:px-8 mt-12">
      <div class="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
        <div class="flex items-center gap-3">
          <DbMapLogo class-name="w-6 h-6" />
          <span>© 2026 dbmaps. Built for modern database architects.</span>
        </div>

        <div class="flex items-center gap-4">

          <button @click="goToStudio" class="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">
            ERD Studio
          </button>
          <button @click="goToLegal('/privacy-policy')" class="hover:underline cursor-pointer">
            Privacy Policy
          </button>
          <button @click="goToLegal('/terms-of-service')" class="hover:underline cursor-pointer">
            Terms of Service
          </button>
        </div>
      </div>
    </footer>

    <!-- PREVIEW MODAL OVERLAY -->
    <div
      v-if="selectedPreviewTemplate"
      class="app-dialog-backdrop fixed inset-0 z-50 bg-slate-950/70  flex items-center justify-center p-4 sm:p-6"
      @click.self="selectedPreviewTemplate = null"
    >
      <div v-dialog role="dialog" aria-modal="true" aria-label="Blueprint preview"
        class="app-dialog bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl  w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-150"
      >
        <!-- Preview Header -->
        <div class="app-dialog-heading p-6 bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 mb-2 flex-wrap">
              <span
                v-if="selectedPreviewTemplate.isSystem"
                class="text-[10px] font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
              >
                dbmaps System
              </span>
              <span
                v-else
                class="text-[10px] font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
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
            <h2 class="text-2xl font-bold text-slate-900 dark:text-white">
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
        <div class="flex-1 overflow-y-auto p-6 space-y-6">
          <!-- Architecture Metrics & Author -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <!-- Tables -->
            <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
              <div class="p-2.5 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400">
                <Database class="w-5 h-5" />
              </div>
              <div>
                <div class="text-xs text-slate-400">Normalized Tables</div>
                <div class="text-lg font-bold text-slate-900 dark:text-white font-mono">
                  {{ (selectedPreviewTemplate.tables || []).length }} Tables
                </div>
              </div>
            </div>

            <!-- Relationships -->
            <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
              <div class="p-2.5 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400">
                <GitFork class="w-5 h-5" />
              </div>
              <div>
                <div class="text-xs text-slate-400">Foreign Constraints</div>
                <div class="text-lg font-bold text-slate-900 dark:text-white font-mono">
                  {{ (selectedPreviewTemplate.relationships || []).length }} Relations
                </div>
              </div>
            </div>

            <!-- Architect -->
            <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
              <img
                :src="selectedPreviewTemplate.author.avatar"
                :alt="selectedPreviewTemplate.author.name"
                class="w-11 h-11 rounded-full object-cover border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800"
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

          <!-- Architecture Highlights -->
          <div>
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              Architectural Highlights
            </h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div
                v-for="(hl, idx) in selectedPreviewTemplate.highlights"
                :key="idx"
                class="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300"
              >
                <Check class="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>{{ hl }}</span>
              </div>
            </div>
          </div>

          <!-- Included Tables List -->
          <div>
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              Included Tables ({{ (selectedPreviewTemplate.tables || []).length }})
            </h4>
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              <div
                v-for="tbl in selectedPreviewTemplate.tables"
                :key="tbl.id || tbl.name"
                class="p-3 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs"
              >
                <div class="font-mono font-bold text-slate-800 dark:text-slate-200 truncate flex items-center gap-2">
                  <div
                    class="w-2.5 h-2.5 rounded-full shrink-0"
                    :style="{ backgroundColor: tbl.headerColor || '#3b82f6' }"
                  ></div>
                  <span class="truncate">{{ tbl.name }}</span>
                </div>
                <div class="text-[11px] text-slate-400 mt-1">
                  {{ (tbl.columns || []).length }} columns
                </div>
              </div>
            </div>
          </div>

          <!-- DBML Code Snippet Preview -->
          <div v-if="selectedPreviewTemplate.dbml">
            <div class="flex items-center justify-between mb-2.5">
              <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Code class="w-4 h-4 text-blue-500" />
                <span>DBML Blueprint Definition</span>
              </h4>
              <button
                @click="copyDbmlSnippet(selectedPreviewTemplate.dbml)"
                class="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Check v-if="hasCopiedDbml" class="w-3.5 h-3.5 text-emerald-500" />
                <Copy v-else class="w-3.5 h-3.5 text-slate-500" />
                <span>{{ hasCopiedDbml ? 'Copied!' : 'Copy DBML' }}</span>
              </button>
            </div>
            <pre class="p-4 bg-slate-950 text-slate-200 rounded-xl font-mono text-xs overflow-x-auto border border-slate-800 max-h-72 leading-relaxed select-text">{{ selectedPreviewTemplate.dbml }}</pre>
          </div>
        </div>

        <!-- Preview Footer Actions -->
        <div class="p-5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">

          <div></div>

          <div class="flex items-center gap-2">


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

    <!-- SUBMIT TO MARKETPLACE MODAL (Accessible directly from /marketplace) -->
  </div>
</template>

<script setup>
import { useTemplateFilters } from '../utils/useTemplateFilters.js';
import { ref, computed } from 'vue';
import {
  state,
  cloneMarketplaceTemplate,
  allMarketplaceTemplates,
  toggleDarkMode,
  navigateTo,
  addToast,
} from '../stores/schemaStore.js';
import DbMapLogo from './DbMapLogo.vue';
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
  Code,
  ArrowRight,
  Sun,
  Moon,
  Sparkles,
  Globe,
  UploadCloud,
  Trash2,
  Zap,
  Edit3
} from 'lucide-vue-next';

const selectedPreviewTemplate = ref(null);
const hasCopiedDbml = ref(false);

const systemCount = computed(() => {
  return allMarketplaceTemplates.value.filter(t => t.isSystem).length;
});

const communityCount = computed(() => {
  return allMarketplaceTemplates.value.filter(t => !t.isSystem).length;
});

const {
  searchQuery, selectedSource, selectedCategory, selectedDialect, filteredTemplates, resetFilters
} = useTemplateFilters(allMarketplaceTemplates);

function goToHome() {
  navigateTo('/');
}

function goToStudio() {
  navigateTo('/app');
}

function goToLegal(path) {
  navigateTo(path);
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
