<template>
  <div v-if="state.modals.export" class="app-dialog-backdrop fixed inset-0 z-50 bg-slate-900/60  flex items-center justify-center p-3 sm:p-4 select-none">
    <div v-dialog role="dialog" aria-modal="true" aria-label="Export schema" class="app-dialog bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl  w-full max-w-4xl overflow-hidden flex flex-col max-h-[88vh] animate-in fade-in zoom-in-95 duration-150">

      <!-- Modal Header -->
      <div class="app-dialog-heading px-5 py-3.5 bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Download class="w-4 h-4" />
          </div>
          <div>
            <h3 class="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
              Export schema

            </h3>
            <p class="text-[11px] text-slate-500 dark:text-slate-400">
              Download your diagram, documentation, or schema code.
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

      <!-- Segmented Main Tabs: Diagram vs Markdown vs SQL/DBML Scripts -->
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
            <span>Diagram</span>
            <span class="text-[9px] px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 rounded font-bold">
              JPG â€¢ PNG â€¢ PDF â€¢ SVG
            </span>
          </button>

          <!-- Tab 2: Markdown -->
          <button
            type="button"
            @click="activeMainTab = 'markdown'"
            class="px-3.5 py-2 rounded-t-xl font-semibold text-xs transition flex items-center gap-2 border-b-2 cursor-pointer shrink-0"
            :class="activeMainTab === 'markdown'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800 shadow-2xs'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'"
          >
            <Table2 class="w-3.5 h-3.5" />
            <span>Markdown</span>
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
            <span>SQL / DBML</span>
            <span class="text-[9px] px-1.5 py-0.2 bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 rounded font-bold uppercase">
              DDL
            </span>
          </button>
        </div>


      </div>

      <!-- Diagram controls and a fitted preview share the available space. -->
      <div v-if="activeMainTab === 'diagram'" class="diagram-export flex-1 min-h-0 overflow-y-auto">
        <div class="export-settings border-slate-200 dark:border-slate-700 text-xs">
          <fieldset>
            <legend class="font-semibold text-slate-800 dark:text-slate-100 mb-2">File format</legend>
            <div class="grid grid-cols-4 gap-1 rounded-lg bg-slate-100 dark:bg-slate-900 p-1">
              <label v-for="format in ['png', 'jpg', 'svg', 'pdf']" :key="format" class="relative cursor-pointer">
                <input v-model="diagramFormat" type="radio" name="diagram-export-format" :value="format" class="peer sr-only" />
                <span class="block text-center py-2 rounded-md font-semibold uppercase text-slate-500 peer-checked:bg-white dark:peer-checked:bg-slate-700 peer-checked:text-blue-600 dark:peer-checked:text-blue-300 peer-focus-visible:outline-2 peer-focus-visible:outline-blue-500">{{ format }}</span>
              </label>
            </div>
            <p class="mt-2 text-slate-500 dark:text-slate-400">{{ { png: 'Lossless image with crisp text.', jpg: 'Smaller file with a solid background.', svg: 'Scalable vector for any screen size.', pdf: 'Print-ready A4 or Letter document.' }[diagramFormat] }}</p>
          </fieldset>

          <label class="export-field" for="export-scale">
            <span>Image resolution</span>
            <select id="export-scale" aria-describedby="export-resolution-help" v-model="diagramScale" :disabled="diagramFormat === 'svg'">
              <option :value="1">1x - Standard size</option>
              <option :value="2">2x - Sharper text (recommended)</option>
              <option :value="3">3x - Largest image</option>
            </select>
            <small id="export-resolution-help" class="text-slate-500 dark:text-slate-400 font-normal">{{ diagramFormat === 'svg' ? 'SVG stays sharp at any size; resolution does not apply.' : '2x doubles image width and height for sharper text. Higher resolution creates a larger file.' }}</small>
          </label>

          <label class="export-field" for="export-background">
            <span>Background</span>
            <select id="export-background" v-model="diagramTheme">
              <option value="light">White</option>
              <option value="dark">Dark</option>
              <option value="transparent" :disabled="diagramFormat === 'jpg' || diagramFormat === 'pdf'">Transparent</option>
            </select>
          </label>

          <label class="export-field" for="export-detail">
            <span>Table details</span>
            <select id="export-detail" v-model="tableDensity">
              <option value="all">All fields</option>
              <option value="keys">Primary &amp; foreign keys</option>
              <option value="tables">Table names only</option>
            </select>
          </label>

          <div v-if="diagramFormat === 'pdf'" class="grid grid-cols-2 gap-2">
            <label class="export-field" for="export-paper"><span>Paper</span>
              <select id="export-paper" v-model="pdfFormat"><option value="a4">A4</option><option value="letter">Letter</option></select>
            </label>
            <label class="export-field" for="export-orientation"><span>Orientation</span>
              <select id="export-orientation" v-model="pdfOrientation"><option value="landscape">Landscape</option><option value="portrait">Portrait</option></select>
            </label>
          </div>
        </div>

        <section class="export-preview min-w-0 bg-slate-50 dark:bg-slate-900/40" aria-label="Diagram export preview">
          <div class="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span class="font-semibold text-slate-700 dark:text-slate-200">Preview</span>
            <span class="text-slate-500">{{ activeProject?.tables?.length || 0 }} tables · {{ activeProject?.relationships?.length || 0 }} relationships</span>
          </div>
          <div class="export-preview-stage border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden" :class="diagramTheme === 'dark' ? 'bg-slate-950' : 'bg-white'">
            <div v-if="previewSvg" v-html="previewSvg" class="export-preview-svg" />
            <p v-else class="text-xs text-slate-500">Add a table to preview your diagram.</p>
          </div>
          <div class="flex flex-wrap justify-between gap-2 text-[11px] text-slate-500">
            <span>{{ diagramFormat === 'svg' ? 'Vector · scales to any size' : previewDimensionsText }}</span>
            <span class="uppercase">.{{ diagramFormat }}</span>
          </div>
        </section>
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
                Combined table
              </button>
            </div>

          </div>

          <div role="group" aria-label="Markdown view" class="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5">
            <button v-for="view in ['preview', 'code']" :key="view" type="button" :aria-pressed="markdownView === view" @click="markdownView = view" class="px-3 py-1.5 rounded-md capitalize" :class="markdownView === view ? 'bg-blue-600 text-white' : 'text-slate-500'">{{ view }}</button>
          </div>
          <div class="flex flex-wrap items-center gap-2">
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
        <div :class="markdownView === 'preview' ? 'bg-white dark:bg-slate-900' : 'bg-slate-950 text-slate-200'" class="p-4 flex-1 overflow-auto min-h-[240px] font-mono text-xs leading-relaxed select-text">
          <div v-if="markdownView === 'preview'" class="space-y-3 font-sans text-slate-800 dark:text-slate-200">
            <section v-for="(section, index) in markdownSections" :key="index" class="overflow-x-auto">
              <h4 v-if="section.title" class="font-semibold text-sm mb-2">{{ section.title }}</h4>
              <table class="w-full text-left text-xs border-collapse">
                <thead><tr><th v-for="(cell, i) in section.headers" :key="i" class="p-2 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">{{ cell }}</th></tr></thead>
                <tbody><tr v-for="(row, r) in section.rows" :key="r"><td v-for="(cell, c) in row" :key="c" class="p-2 border border-slate-200 dark:border-slate-700 whitespace-pre-wrap">{{ cell }}</td></tr></tbody>
              </table>
            </section>
          </div>
          <pre v-else class="whitespace-pre-wrap">{{ generatedMarkdown }}</pre>
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

        <ExportCodePreview :code="generatedScript" :language="scriptFormat" />

      </div>

      <!-- Modal Footer -->
      <div class="px-5 py-3.5 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">

        <details class="text-slate-600 dark:text-slate-300">
          <summary class="cursor-pointer font-medium">JSON backups</summary>
          <div class="flex flex-wrap gap-3 mt-2">
            <button v-if="activeProject" @click="downloadProjectBackup" class="text-left hover:underline">Current project (.dbmap.json)<small class="block text-slate-500">Schema, layout and project settings</small></button>
            <button @click="downloadWorkspaceBackup" class="text-left hover:underline">All projects (.json)<small class="block text-slate-500">Entire workspace, including folders</small></button>
          </div>
        </details>

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
            <span>Download {{ diagramFormat.toUpperCase() }}</span>
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
import { projectDbml, markdownTableSections } from '../utils/schemaExport.js';
import ExportCodePreview from './ExportCodePreview.vue';
import { state, activeProject, addToast, exportWorkspaceBackup } from '../stores/schemaStore.js';
import { downloadJsonBackup } from '../utils/workspaceBackup.js';
import { createProjectBackup } from '../utils/projectBackup.js';
import { exportToSQL } from '../utils/dbmlParser.js';
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
const markdownView = ref('preview');
const markdownSections = computed(() => markdownTableSections(generatedMarkdown.value));
const markdownFormat = ref('per_table'); // 'per_table' | 'combined'

// Script Export Controls
const scriptFormat = ref('postgres');

watch(diagramFormat, format => {
  if ((format === 'jpg' || format === 'pdf') && diagramTheme.value === 'transparent') diagramTheme.value = 'light';
});

// Loading state
const isGenerating = ref(false);

// Watch modal open
watch(
  () => state.modals.export,
  (isOpen) => {
    if (isOpen) {
      markdownView.value = 'preview';
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
  return `${w * mult} Ã— ${h * mult} px`;
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
    return projectDbml(proj);
  }
  return exportToSQL(proj.tables || [], proj.relationships || [], scriptFormat.value);
});

function copyScriptToClipboard() {
  navigator.clipboard.writeText(generatedScript.value);
  addToast('Copied to Clipboard', 'Schema export script copied', 'success');
}

function downloadWorkspaceBackup() {
  try { downloadJsonBackup(exportWorkspaceBackup(), `dbmaps-workspace-${new Date().toISOString().slice(0, 10)}.json`); }
  catch (error) { addToast('Backup failed', error.message, 'error'); }
}

function downloadProjectBackup() {
  const project = activeProject.value;
  const blob = new Blob([JSON.stringify(createProjectBackup(project), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${project.name.trim().replace(/[^\p{L}\p{N}_-]+/gu, '_') || 'project'}.dbmap.json`;
  link.click();
  URL.revokeObjectURL(url);
  addToast('Download Started', link.download, 'success');
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

<style scoped>
.diagram-export { display: grid; grid-template-columns: 240px minmax(0, 1fr); }
.export-settings { padding: 20px; border-right-width: 1px; display: flex; flex-direction: column; gap: 20px; }
.export-field { display: flex; flex-direction: column; gap: 7px; font-weight: 500; color: var(--page-ink); min-width: 0; }
.export-field select { width: 100%; min-height: 36px; padding: 7px 9px; border: 1px solid var(--board-border, #cbd5e1); border-radius: 7px; background: var(--page-well, transparent); color: inherit; font-size: 12px; }
.export-field select:focus-visible { outline: 2px solid #2563eb; outline-offset: 2px; }
.export-field select:disabled { opacity: .5; }
.export-preview { display: flex; flex-direction: column; gap: 12px; padding: 20px; }
.export-preview-stage { height: clamp(260px, 46vh, 460px); display: flex; align-items: center; justify-content: center; padding: 16px; }
.export-preview-svg { width: 100%; height: 100%; }
.export-preview-svg :deep(svg) { width: 100%; height: 100%; }
@media (max-width: 640px) {
  .diagram-export { grid-template-columns: minmax(0, 1fr); }
  .export-settings { border-right-width: 0; border-bottom-width: 1px; padding: 16px; gap: 14px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .export-settings fieldset { grid-column: 1 / -1; }
  .export-preview { padding: 16px; }
  .export-preview-stage { height: 240px; }
}
</style>
