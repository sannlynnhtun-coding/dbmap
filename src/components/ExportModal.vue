<template>
  <div v-if="state.modals.export" class="app-dialog-backdrop fixed inset-0 z-50 bg-slate-900/60  flex items-center justify-center p-3 sm:p-4 select-none">
    <div role="dialog" aria-modal="true" aria-label="Export schema" class="app-dialog bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl  w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">

      <!-- Modal Header -->
      <div class="app-dialog-heading px-5 py-3.5 bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Download class="w-4 h-4" />
          </div>
          <div>
            <h3 class="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
              Export Center
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 font-semibold border border-blue-200 dark:border-blue-800">
                Academic &amp; Reports
              </span>
            </h3>
            <p class="text-[11px] text-slate-500 dark:text-slate-400">
              Download high-definition schema diagrams (JPG, PNG, PDF, SVG), Markdown tables, or SQL scripts.
            </p>
          </div>
        </div>

        <button aria-label="Close dialog"
          @click="closeModal"
          class="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Segmented Main Tabs: Visual Diagram (HD) vs Markdown Tables vs SQL/DBML Scripts -->
      <div class="px-5 pt-3 border-b border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between gap-3 shrink-0 overflow-x-auto">
        <div class="flex items-center gap-1 shrink-0">
          <!-- Tab 1: HD Schema Diagram -->
          <button
            type="button"
            @click="activeMainTab = 'diagram'"
            class="px-3.5 py-2 rounded-t-xl font-semibold text-xs transition flex items-center gap-2 border-b-2 cursor-pointer shrink-0"
            :class="activeMainTab === 'diagram'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800 shadow-2xs'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'"
          >
            <Image class="w-3.5 h-3.5" />
            <span>Visual Diagram (HD)</span>
            <span class="text-[9px] px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 rounded font-bold">
              JPG • PNG • PDF • SVG
            </span>
          </button>

          <!-- Tab 2: Markdown Tables -->
          <button
            type="button"
            @click="activeMainTab = 'markdown'"
            class="px-3.5 py-2 rounded-t-xl font-semibold text-xs transition flex items-center gap-2 border-b-2 cursor-pointer shrink-0"
            :class="activeMainTab === 'markdown'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800 shadow-2xs'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'"
          >
            <Table2 class="w-3.5 h-3.5" />
            <span>Markdown Tables</span>
            <span class="text-[9px] px-1.5 py-0.2 bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 rounded font-bold">
              Pure MD
            </span>
          </button>

          <!-- Tab 3: SQL & DBML Scripts -->
          <button
            type="button"
            @click="activeMainTab = 'script'"
            class="px-3.5 py-2 rounded-t-xl font-semibold text-xs transition flex items-center gap-2 border-b-2 cursor-pointer shrink-0"
            :class="activeMainTab === 'script'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800 shadow-2xs'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'"
          >
            <FileCode class="w-3.5 h-3.5" />
            <span>SQL &amp; DBML Scripts</span>
            <span class="text-[9px] px-1.5 py-0.2 bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 rounded font-bold uppercase">
              DDL
            </span>
          </button>
        </div>

        <div v-if="activeMainTab === 'diagram'" class="hidden md:flex items-center gap-2 text-[11px] text-slate-400">
          <span>Targeted for CS students &amp; research papers</span>
        </div>
      </div>

      <!-- TAB 1 CONTENT: VISUAL DIAGRAM EXPORT -->
      <div v-if="activeMainTab === 'diagram'" class="flex-1 overflow-y-auto p-5 space-y-5">

        <!-- Format Selector Grid (JPG, PNG, PDF, SVG) -->
        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            1. Select Output Format
          </label>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <!-- HD PNG -->
            <button
              type="button"
              @click="diagramFormat = 'png'"
              class="p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer group"
              :class="diagramFormat === 'png'
                ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 ring-1 ring-blue-500'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800/60'"
            >
              <div class="flex items-center justify-between">
                <span class="font-bold text-xs text-slate-900 dark:text-slate-100">HD PNG</span>
                <span class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold">.png</span>
              </div>
              <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-snug">
                Lossless raster (300 DPI). Best for Word, LaTeX, Google Docs &amp; slides.
              </p>
            </button>

            <!-- HD JPG -->
            <button
              type="button"
              @click="diagramFormat = 'jpg'"
              class="p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer group"
              :class="diagramFormat === 'jpg'
                ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 ring-1 ring-blue-500'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800/60'"
            >
              <div class="flex items-center justify-between">
                <span class="font-bold text-xs text-slate-900 dark:text-slate-100">HD JPG</span>
                <span class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 font-semibold">.jpg</span>
              </div>
              <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-snug">
                Compact high-res image with solid background for portal uploads.
              </p>
            </button>

            <!-- Vector SVG -->
            <button
              type="button"
              @click="diagramFormat = 'svg'"
              class="p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer group"
              :class="diagramFormat === 'svg'
                ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 ring-1 ring-blue-500'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800/60'"
            >
              <div class="flex items-center justify-between">
                <span class="font-bold text-xs text-slate-900 dark:text-slate-100">Vector SVG</span>
                <span class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-semibold">.svg</span>
              </div>
              <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-snug">
                Infinite vector scalability. Zero pixelation at any zoom level in papers.
              </p>
            </button>

            <!-- Academic PDF -->
            <button
              type="button"
              @click="diagramFormat = 'pdf'"
              class="p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer group"
              :class="diagramFormat === 'pdf'
                ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 ring-1 ring-blue-500'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800/60'"
            >
              <div class="flex items-center justify-between">
                <span class="font-bold text-xs text-slate-900 dark:text-slate-100">Academic PDF</span>
                <span class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-semibold">.pdf</span>
              </div>
              <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-snug">
                Formatted A4 / Letter page ready for academic thesis &amp; coursework submission.
              </p>
            </button>
          </div>
        </div>

        <!-- Customization Controls Grid -->
        <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              2. Customization &amp; Academic Settings
            </span>
            <span class="text-[11px] text-slate-400 font-medium">Fine-tune for your report</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">

            <!-- Resolution / Scale (For PNG & JPG) -->
            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Resolution &amp; DPI
              </label>
              <select
                v-model="diagramScale"
                :disabled="diagramFormat === 'svg'"
                class="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 disabled:opacity-50"
              >
                <option :value="1">1x Standard (Web 1080p, ~72 DPI)</option>
                <option :value="2">2x HD (Academic Print, 300 DPI - Recommended)</option>
                <option :value="3">3x Ultra HD (4K Crisp, ~600 DPI)</option>
              </select>
              <span class="text-[10px] text-slate-400 mt-1 block">
                {{ diagramFormat === 'svg' ? 'SVG is natively vector scalable' : '2x gives razor-sharp text in Word & LaTeX' }}
              </span>
            </div>

            <!-- Background Theme -->
            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Background Theme
              </label>
              <select
                v-model="diagramTheme"
                class="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500"
              >
                <option value="light">Paper White (Ideal for Academic Printing)</option>
                <option value="dark">Dark Slate (For Modern Presentations)</option>
                <option value="transparent" :disabled="diagramFormat === 'jpg'">
                  Transparent (PNG &amp; SVG Only)
                </option>
              </select>
              <span class="text-[10px] text-slate-400 mt-1 block">
                Paper White saves printer ink and matches research papers
              </span>
            </div>

            <!-- PDF Page Options (if PDF chosen) or Table Density -->
            <div v-if="diagramFormat === 'pdf'">
              <label class="block font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                PDF Page Size &amp; Layout
              </label>
              <div class="grid grid-cols-2 gap-2">
                <select
                  v-model="pdfFormat"
                  class="px-2 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 outline-none"
                >
                  <option value="a4">A4 Paper</option>
                  <option value="letter">US Letter</option>
                </select>
                <select
                  v-model="pdfOrientation"
                  class="px-2 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 outline-none"
                >
                  <option value="landscape">Landscape</option>
                  <option value="portrait">Portrait</option>
                </select>
              </div>
              <span class="text-[10px] text-slate-400 mt-1 block">
                Landscape matches wide database diagrams cleanly
              </span>
            </div>

            <!-- Table Density (For image/svg) -->
            <div v-else>
              <label class="block font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Diagram Details Level
              </label>
              <select
                v-model="tableDensity"
                class="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500"
              >
                <option value="all">All Fields (Full columns, data types &amp; keys)</option>
                <option value="keys">Keys Only (Primary &amp; Foreign keys)</option>
                <option value="tables">Tables Only (Compact entity headers)</option>
              </select>
              <span class="text-[10px] text-slate-400 mt-1 block">
                Controls level of column detail shown in exported cards
              </span>
            </div>

          </div>

        </div>

        <!-- Live Diagram Preview Box -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Eye class="w-3.5 h-3.5 text-blue-500" />
              <span>3. Live Diagram Preview</span>
            </label>
            <div class="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
              <span>{{ activeProject?.tables?.length || 0 }} Tables</span>
              <span>•</span>
              <span>{{ activeProject?.relationships?.length || 0 }} Relationships</span>
              <span>•</span>
              <span class="font-semibold text-blue-600 dark:text-blue-400">{{ previewDimensionsText }}</span>
            </div>
          </div>

          <!-- SVG Preview Container -->
          <div
            class="w-full max-h-[300px] sm:max-h-[360px] overflow-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-950 p-3 flex items-center justify-center relative select-none"
            :class="{ 'bg-white': diagramTheme === 'light' }"
          >
            <div
              v-if="previewSvg"
              v-html="previewSvg"
              class="w-full h-auto flex items-center justify-center max-w-full [&>svg]:max-w-full [&>svg]:h-auto  rounded-lg"
            ></div>
            <div v-else class="text-slate-400 text-xs py-10">
              No tables available to preview.
            </div>
          </div>
        </div>

      </div>

      <!-- TAB 2 CONTENT: ACADEMIC MARKDOWN TABLES -->
      <div v-else-if="activeMainTab === 'markdown'" class="flex-1 flex flex-col overflow-hidden">
        <!-- Controls Bar -->
        <div class="p-4 border-b border-slate-100 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
          <div class="flex items-center gap-3">
            <span class="font-semibold text-slate-600 dark:text-slate-300">Format:</span>
            <div class="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-0.5">
              <button
                type="button"
                @click="markdownFormat = 'per_table'"
                class="px-2.5 py-1 rounded-md font-medium text-[11px] transition cursor-pointer"
                :class="markdownFormat === 'per_table' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'"
              >
                Table-by-Table
              </button>
              <button
                type="button"
                @click="markdownFormat = 'combined'"
                class="px-2.5 py-1 rounded-md font-medium text-[11px] transition cursor-pointer"
                :class="markdownFormat === 'combined' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'"
              >
                Combined Master Table
              </button>
            </div>
            <span class="text-[11px] text-slate-400 hidden sm:inline">
              Pure Markdown tables • No fluff • Perfect for reports
            </span>
          </div>

          <div class="flex items-center gap-2">
            <button
              @click="copyMarkdownToClipboard"
              class="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-medium rounded-lg transition flex items-center gap-1.5 cursor-pointer"
            >
              <Copy class="w-3.5 h-3.5" />
              <span>Copy Markdown</span>
            </button>
            <button
              @click="downloadMarkdown"
              class="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition flex items-center gap-1.5  cursor-pointer"
            >
              <FileDown class="w-3.5 h-3.5" />
              <span>Download .md</span>
            </button>
          </div>
        </div>

        <!-- Markdown Preview Box -->
        <div class="p-4 flex-1 overflow-y-auto bg-slate-950 text-slate-200 font-mono text-xs leading-relaxed select-text">
          <pre class="whitespace-pre-wrap">{{ generatedMarkdown }}</pre>
        </div>
      </div>

      <!-- TAB 3 CONTENT: SQL & DBML SCRIPT EXPORT -->
      <div v-else-if="activeMainTab === 'script'" class="flex-1 flex flex-col overflow-hidden">

        <!-- Controls & Target Dialect -->
        <div class="p-4 border-b border-slate-100 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
          <div class="flex items-center gap-2 font-medium">
            <span class="text-slate-600 dark:text-slate-300">Target Dialect:</span>
            <select
              v-model="scriptFormat"
              class="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-mono outline-none focus:border-blue-500"
            >
              <option value="postgres">PostgreSQL (.sql)</option>
              <option value="mysql">MySQL (.sql)</option>
              <option value="sqlite">SQLite (.sql)</option>
              <option value="mssql">MS SQL Server (.sql)</option>
              <option value="dbml">DBML Markup (.dbml)</option>
            </select>
          </div>

          <div class="flex items-center gap-2">
            <button
              @click="copyScriptToClipboard"
              class="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-medium rounded-lg transition flex items-center gap-1.5 cursor-pointer"
            >
              <Copy class="w-3.5 h-3.5" />
              <span>Copy Script</span>
            </button>
            <button
              @click="downloadScript"
              class="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition flex items-center gap-1.5  cursor-pointer"
            >
              <FileDown class="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>
          </div>
        </div>

        <!-- Code Preview Area -->
        <div class="p-4 flex-1 overflow-y-auto bg-slate-950 text-slate-200 font-mono text-xs leading-relaxed select-text">
          <pre class="whitespace-pre-wrap">{{ generatedScript }}</pre>
        </div>

      </div>

      <!-- Modal Footer -->
      <div class="px-5 py-3.5 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">

        <!-- Quick format buttons when on diagram tab -->
        <div v-if="activeMainTab === 'diagram'" class="flex items-center gap-1.5 flex-wrap">
          <span class="text-[11px] text-slate-500 font-medium mr-1">Quick Downloads:</span>

          <button
            type="button"
            @click="quickDownload('png')"
            :disabled="isGenerating"
            title="Download HD PNG (300 DPI)"
            class="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-200 text-[11px] transition cursor-pointer"
          >
            PNG
          </button>

          <button
            type="button"
            @click="quickDownload('jpg')"
            :disabled="isGenerating"
            title="Download HD JPG"
            class="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-200 text-[11px] transition cursor-pointer"
          >
            JPG
          </button>

          <button
            type="button"
            @click="quickDownload('svg')"
            :disabled="isGenerating"
            title="Download Vector SVG"
            class="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-200 text-[11px] transition cursor-pointer"
          >
            SVG
          </button>

          <button
            type="button"
            @click="quickDownload('pdf')"
            :disabled="isGenerating"
            title="Download Academic PDF"
            class="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-200 text-[11px] transition cursor-pointer"
          >
            PDF
          </button>
        </div>

        <div v-else-if="activeMainTab === 'markdown'" class="text-slate-500 text-[11px]">
          Pure Markdown tables extracted with database tables, columns &amp; data types.
        </div>

        <div v-else class="text-slate-500 text-[11px]">
          Target SQL dialect syntax validated for production databases.
        </div>

        <!-- Primary Action Buttons -->
        <div class="flex items-center gap-2">

          <!-- Copy to Clipboard (PNG image) -->
          <button
            v-if="activeMainTab === 'diagram'"
            type="button"
            @click="handleCopyImage"
            :disabled="isGenerating"
            title="Copy HD diagram image to clipboard for Word / Docs / Overleaf"
            class="px-3.5 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-medium rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Copy class="w-3.5 h-3.5" />
            <span>Copy Image</span>
          </button>

          <!-- Main Download Button for Selected Diagram Format -->
          <button
            v-if="activeMainTab === 'diagram'"
            type="button"
            @click="handlePrimaryDownload"
            :disabled="isGenerating"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition flex items-center gap-2  cursor-pointer disabled:opacity-50"
          >
            <Loader2 v-if="isGenerating" class="w-4 h-4 animate-spin" />
            <Download v-else class="w-4 h-4" />
            <span>Download HD {{ diagramFormat.toUpperCase() }}</span>
          </button>

          <!-- Copy Markdown Button when on Markdown tab -->
          <button
            v-if="activeMainTab === 'markdown'"
            type="button"
            @click="copyMarkdownToClipboard"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition flex items-center gap-2  cursor-pointer"
          >
            <Copy class="w-4 h-4" />
            <span>Copy Markdown Tables</span>
          </button>

          <button
            type="button"
            @click="closeModal"
            class="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-medium rounded-xl transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { state, activeProject, addToast } from '../stores/schemaStore.js';
import { exportToSQL, generateDBML } from '../utils/dbmlParser.js';
import {
  generateDiagramSvg,
  exportDiagramAsPng,
  exportDiagramAsJpg,
  exportDiagramAsSvg,
  exportDiagramAsPdf,
  copyDiagramToClipboard,
  generateMarkdownTables
} from '../utils/diagramExport.js';
import {
  Download,
  X,
  Copy,
  FileDown,
  Image,
  FileCode,
  Eye,
  Loader2,
  Check,
  Table2
} from 'lucide-vue-next';

// Main tab: 'diagram' | 'markdown' | 'script'
const activeMainTab = ref('diagram');

// Visual Diagram Export Controls
const diagramFormat = ref('png'); // 'png' | 'jpg' | 'svg' | 'pdf'
const diagramScale = ref(2); // 1, 2, 3
const diagramTheme = ref('light'); // 'light' | 'dark' | 'transparent'
const tableDensity = ref('all'); // 'all' | 'keys' | 'tables'

// PDF specific options
const pdfFormat = ref('a4'); // 'a4' | 'letter'
const pdfOrientation = ref('landscape'); // 'landscape' | 'portrait'

// Markdown Export Controls
const markdownFormat = ref('per_table'); // 'per_table' | 'combined'

// Script Export Controls
const scriptFormat = ref('postgres');

// Loading state
const isGenerating = ref(false);

// Watch modal open
watch(
  () => state.modals.export,
  (isOpen) => {
    if (isOpen) {
      if (state.exportTab) {
        activeMainTab.value = state.exportTab;
      }
      if (activeProject.value?.dialect) {
        scriptFormat.value = activeProject.value.dialect;
      }
      // Set tableDensity to match current canvas tableDisplayMode
      if (state.tableDisplayMode) {
        tableDensity.value = state.tableDisplayMode;
      }
    }
  },
  { immediate: true }
);

function closeModal() {
  state.modals.export = false;
}

// Generate options bundle for exporter (clean tables & relationships only, no header/footer sentences)
const exportOptions = computed(() => {
  return {
    theme: diagramTheme.value,
    scale: diagramScale.value,
    tableDisplayMode: tableDensity.value,
    showOptionalRelationships: state.showOptionalRelationships,
    lineStyle: 'orthogonal',
    pdfFormat: pdfFormat.value,
    pdfOrientation: pdfOrientation.value,
    padding: 40
  };
});

// Live Preview SVG
const previewSvg = computed(() => {
  if (!activeProject.value || !activeProject.value.tables?.length) return '';
  try {
    return generateDiagramSvg(activeProject.value, exportOptions.value);
  } catch (err) {
    console.error('Failed to generate preview SVG:', err);
    return '';
  }
});

// Dimensions text for preview
const previewDimensionsText = computed(() => {
  const svg = previewSvg.value;
  if (!svg) return '';
  const match = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
  if (!match) return '';
  const w = parseInt(match[1], 10);
  const h = parseInt(match[2], 10);
  const mult = diagramFormat.value === 'svg' ? 1 : diagramScale.value;
  return `${w * mult} × ${h * mult} px`;
});

// Download primary selected diagram format
async function handlePrimaryDownload() {
  if (!activeProject.value) return;
  isGenerating.value = true;

  try {
    const proj = activeProject.value;
    const opts = exportOptions.value;

    if (diagramFormat.value === 'png') {
      await exportDiagramAsPng(proj, opts);
      addToast('Export Complete', 'HD PNG diagram downloaded at 300 DPI.', 'success');
    } else if (diagramFormat.value === 'jpg') {
      await exportDiagramAsJpg(proj, opts);
      addToast('Export Complete', 'HD JPG diagram downloaded.', 'success');
    } else if (diagramFormat.value === 'svg') {
      exportDiagramAsSvg(proj, opts);
      addToast('Export Complete', 'Vector SVG diagram downloaded.', 'success');
    } else if (diagramFormat.value === 'pdf') {
      await exportDiagramAsPdf(proj, opts);
      addToast('Export Complete', `Academic PDF (${pdfFormat.value.toUpperCase()}) report downloaded.`, 'success');
    }
  } catch (err) {
    console.error('Diagram download failed:', err);
    addToast('Download Error', err.message || 'Failed to generate diagram file.', 'error');
  } finally {
    isGenerating.value = false;
  }
}

// Quick download buttons on footer
async function quickDownload(format) {
  diagramFormat.value = format;
  await handlePrimaryDownload();
}

// Copy PNG Image to Clipboard
async function handleCopyImage() {
  if (!activeProject.value) return;
  isGenerating.value = true;
  try {
    await copyDiagramToClipboard(activeProject.value, exportOptions.value);
    addToast('Copied Image to Clipboard', 'Ready to paste into Word, Google Docs, or Overleaf!', 'success');
  } catch (err) {
    console.error('Clipboard copy error:', err);
    addToast('Clipboard Error', 'Could not copy image. Try downloading PNG instead.', 'warning');
  } finally {
    isGenerating.value = false;
  }
}

// Markdown Tables Generator
const generatedMarkdown = computed(() => {
  if (!activeProject.value) return '';
  return generateMarkdownTables(activeProject.value, markdownFormat.value);
});

function copyMarkdownToClipboard() {
  navigator.clipboard.writeText(generatedMarkdown.value);
  addToast('Copied to Clipboard', 'Pure Markdown tables copied ready for report embedding.', 'success');
}

function downloadMarkdown() {
  const blob = new Blob([generatedMarkdown.value], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(activeProject.value?.name || 'database').toLowerCase().replace(/\s+/g, '_')}_tables.md`;
  a.click();
  URL.revokeObjectURL(url);
  addToast('Download Started', `Saved ${a.download}`, 'success');
}

// SQL Script Generation
const generatedScript = computed(() => {
  const proj = activeProject.value;
  if (!proj) return '';
  if (scriptFormat.value === 'dbml') {
    return proj.customDbml || generateDBML(
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
  return exportToSQL(proj.tables || [], proj.relationships || [], scriptFormat.value);
});

function copyScriptToClipboard() {
  navigator.clipboard.writeText(generatedScript.value);
  addToast('Copied to Clipboard', 'Schema export script copied', 'success');
}

function downloadScript() {
  const ext = scriptFormat.value === 'dbml' ? 'dbml' : 'sql';
  const blob = new Blob([generatedScript.value], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(activeProject.value?.name || 'db_schema').toLowerCase().replace(/\s+/g, '_')}_schema.${ext}`;
  a.click();
  URL.revokeObjectURL(url);
  addToast('Download Started', `Saved ${a.download}`, 'success');
}
</script>
