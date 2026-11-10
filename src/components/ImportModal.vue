<template>
  <div
    v-if="state.modals.importSchema"
    class="app-dialog-backdrop fixed inset-0 z-50 bg-slate-900/60  flex items-center justify-center p-4 select-none"
  >
    <div v-dialog
      role="dialog" aria-modal="true" aria-label="Import schema" class="app-dialog bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl  w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] text-slate-800 dark:text-slate-100"
    >
      <!-- Header -->
      <div class="app-dialog-heading px-5 py-3.5 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400">
            <UploadCloud class="w-4 h-4" />
          </div>
          <div>
            <h3 class="font-bold text-slate-800 dark:text-slate-100 text-sm">
              Import Database Schema
            </h3>
            <p class="text-[11px] text-slate-500 dark:text-slate-400">
              Import SQL DDL from MySQL, PostgreSQL, Microsoft SQL Server (MSSQL), or DBML
            </p>
          </div>
        </div>
        <button aria-label="Close dialog"
          @click="closeModal"
          class="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Controls & Format Selection -->
      <div class="p-4 border-b border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-800/50 space-y-3 text-xs">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label class="block space-y-1">
            <span class="font-medium text-slate-600 dark:text-slate-300">Script format</span>
            <select v-model="selectedDialect" class="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              <option v-for="dialect in dialects" :key="dialect.id" :value="dialect.id">{{ dialect.label }}</option>
            </select>
          </label>
          <label class="block space-y-1">
            <span class="font-medium text-slate-600 dark:text-slate-300">Start with an example</span>
            <select :value="''" @change="loadSample($event.target.value); $event.target.value = ''" class="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              <option value="">Choose a sample…</option>
              <option value="postgres">PostgreSQL</option>
              <option value="mysql">MySQL</option>
              <option value="mssql">SQL Server</option>
            </select>
          </label>
        </div>

        <!-- Destination & Project Settings -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label class="block font-medium text-slate-600 dark:text-slate-300 mb-1">Import into</label>
            <select
              v-model="importMode"
              class="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500"
            >
              <option value="new">New project</option>
              <option value="merge">Add to current project</option>
            </select>
          </div>

          <div v-if="importMode === 'new'">
            <label class="block font-medium text-slate-600 dark:text-slate-300 mb-1">Folder</label>
            <select
              v-model="targetFolderId"
              class="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500"
            >
              <option
                v-for="db in (state.databases || state.folders)"
                :key="db.id"
                :value="db.id"
              >
                {{ db.name }}
              </option>
            </select>
          </div>

          <div v-if="importMode === 'new'">
            <label class="block font-medium text-slate-600 dark:text-slate-300 mb-1">Schema Name</label>
            <input
              v-model="projectName"
              type="text"
              placeholder="e.g. Production DB"
              class="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      <!-- File Dropzone & Editor -->
      <div class="p-4 flex-1 flex flex-col min-h-0 space-y-3 overflow-y-auto">
        <div class="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div class="flex flex-wrap items-center gap-2">
            <span class="font-medium text-slate-700 dark:text-slate-300">Paste SQL / DBML script</span>
            <span v-if="previewStats" class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-semibold">
              <Check class="w-3 h-3" />
              {{ previewStats.tables.length }} tables, {{ previewStats.relationships.length }} relationships detected ({{ previewStats.dialect.toUpperCase() }})
            </span>
          </div>

          <!-- File Upload Trigger -->
          <label class="cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition font-medium text-[11px]">
            <FileUp class="w-3.5 h-3.5" />
            <span>Upload .sql / .dbml</span>
            <input
              type="file"
              accept=".sql,.ddl,.dbml,.txt"
              @change="handleFileUpload"
              class="hidden"
            />
          </label>
        </div>

        <div class="flex justify-end">
          <button v-if="scriptText" @click="scriptText = ''" class="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white">Clear script</button>
        </div>
        <div ref="editorHost" class="import-script-editor min-h-0 shrink-0 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700"></div>

        <!-- Parse Error Banner -->
        <div
          v-if="parseError"
          class="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/80 text-red-600 dark:text-red-300 text-xs flex items-center gap-2"
        >
          <AlertCircle class="w-4 h-4 shrink-0 text-red-500" />
          <span>{{ parseError }}</span>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="px-5 py-3.5 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
        <button @click="closeModal(); state.modals.backupImport = true" class="text-blue-700 dark:text-blue-300 font-medium hover:underline">Import JSON Backup</button>

        <div class="flex items-center gap-2.5 ml-auto">
          <button
            @click="closeModal"
            class="px-4 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-medium rounded-lg transition"
          >
            Cancel
          </button>
          <button
            @click="executeImport"
            :disabled="!scriptText.trim()"
            class="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition flex items-center gap-1.5"
          >
            <Upload class="w-3.5 h-3.5" />
            <span>Import to Canvas</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue';
import { EditorView, lineNumbers } from '@codemirror/view';
import { EditorState, Compartment } from '@codemirror/state';
import { StreamLanguage, syntaxHighlighting } from '@codemirror/language';
import { dbmlLanguage, dbmlHighlightStyleDark } from '../utils/dbmlCodeMirror.js';
import { state, activeProject, importSchema, addToast } from '../stores/schemaStore.js';
import { parseSQLSchema, SAMPLE_IMPORT_TEMPLATES } from '../utils/sqlImporter.js';
import {
  UploadCloud,
  Upload,
  X,
  FileUp,
  Check,
  AlertCircle
} from 'lucide-vue-next';

const dialects = [
  { id: 'auto', label: 'Auto-Detect' },
  { id: 'postgres', label: 'PostgreSQL' },
  { id: 'mysql', label: 'MySQL' },
  { id: 'mssql', label: 'MS SQL Server' },
  { id: 'dbml', label: 'DBML' }
];

const selectedDialect = ref('auto');
const importMode = ref('new');
const projectName = ref('');
const targetFolderId = ref('folder-1');
const scriptText = ref('');
const parseError = ref(null);
const editorHost = ref(null);
const language = new Compartment();
let editor;
const sqlLanguage = StreamLanguage.define({
  ...dbmlLanguage.streamParser,
  token(stream, context) {
    if (!context.inBlockComment && !context.inString) {
      if (stream.match('--')) {
        stream.skipToEnd();
        return 'lineComment';
      }
      if (stream.match(/^(CREATE|ALTER|DROP|TABLE|ADD|COLUMN|CONSTRAINT|REFERENCES|FOREIGN|KEY|PRIMARY|DEFAULT|CHECK|INDEX|UNIQUE|NOT|NULL|GO|USE|IF|EXISTS|ON|DELETE|CASCADE)\b/i)) return 'keyword';
    }
    return dbmlLanguage.streamParser.token(stream, context);
  }
});

watch(() => state.modals.importSchema, async isOpen => {
  editor?.destroy();
  editor = null;
  if (!isOpen) return;
  await nextTick();
  if (!editorHost.value) return;
  editor = new EditorView({
    parent: editorHost.value,
    state: EditorState.create({
      doc: scriptText.value,
      extensions: [
        lineNumbers(),
        language.of(selectedDialect.value === 'dbml' ? dbmlLanguage : sqlLanguage),
        syntaxHighlighting(dbmlHighlightStyleDark),
        EditorView.contentAttributes.of({ 'aria-label': 'SQL or DBML script' }),
        EditorView.theme({
          '&': { height: '260px', backgroundColor: '#0f172a', color: '#e2e8f0' },
          '.cm-scroller': { overflow: 'auto', fontFamily: 'monospace', fontSize: '13px' },
          '.cm-content': { minHeight: '100%', padding: '12px 0' },
          '.cm-gutters': { backgroundColor: '#0f172a', color: '#64748b', border: 'none' },
          '.cm-cursor': { borderLeftColor: '#e2e8f0' },
          '&.cm-focused': { outline: '2px solid #2563eb', outlineOffset: '-2px' }
        }, { dark: true }),
        EditorView.updateListener.of(update => {
          if (update.docChanged) scriptText.value = update.state.doc.toString();
        })
      ]
    })
  });
});

watch(scriptText, text => {
  if (editor && editor.state.doc.toString() !== text) {
    editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: text } });
  }
});
watch(selectedDialect, dialect => {
  editor?.dispatch({ effects: language.reconfigure(dialect === 'dbml' ? dbmlLanguage : sqlLanguage) });
});
onBeforeUnmount(() => editor?.destroy());


watch(
  () => state.modals.importSchema,
  (isOpen) => {
    if (isOpen) {
      parseError.value = null;
      if (!projectName.value) {
        projectName.value = 'Imported Schema ' + new Date().toLocaleDateString();
      }
      const availableDbs = state.databases || state.folders || [];
      if (availableDbs.length > 0) {
        targetFolderId.value = availableDbs[0].id;
      }
    }
  }
);

// Compute live preview of tables and relationships
const previewStats = computed(() => {
  if (!scriptText.value.trim()) return null;
  try {
    const res = parseSQLSchema(scriptText.value, selectedDialect.value);
    if (res.tables && res.tables.length > 0) {
      return res;
    }
    return null;
  } catch (e) {
    return null;
  }
});

function loadSample(dialectKey) {
  selectedDialect.value = dialectKey;
  if (SAMPLE_IMPORT_TEMPLATES[dialectKey]) {
    scriptText.value = SAMPLE_IMPORT_TEMPLATES[dialectKey];
    projectName.value = `${dialectKey.toUpperCase()} Sample Schema`;
    parseError.value = null;
  }
}

function handleFileUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    scriptText.value = e.target.result || '';
    if (!projectName.value || projectName.value.startsWith('Imported Schema')) {
      const cleanFileName = file.name.replace(/\.[^/.]+$/, '');
      projectName.value = cleanFileName;
    }
    parseError.value = null;
  };
  reader.onerror = () => {
    parseError.value = 'Failed to read file from disk';
  };
  reader.readAsText(file);
  // Reset input
  event.target.value = '';
}

function closeModal() {
  state.modals.importSchema = false;
  parseError.value = null;
}

function executeImport() {
  parseError.value = null;
  if (!scriptText.value.trim()) {
    parseError.value = 'Please paste or upload an SQL/DBML script to import.';
    return;
  }

  try {
    importSchema({
      name: projectName.value.trim() || 'Imported Schema',
      script: scriptText.value,
      dialect: selectedDialect.value,
      folderId: targetFolderId.value,
      mode: importMode.value
    });

    closeModal();
  } catch (err) {
    parseError.value = err.message || 'Error importing schema script. Please check your SQL syntax.';
  }
}
</script>
