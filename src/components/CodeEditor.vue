<template>
  <div data-ui id="tour-code-editor" ref="editorRootRef" class="h-full flex flex-col bg-slate-900 text-slate-100 font-mono text-sm border-r border-slate-800 select-text relative">
    <!-- Editor Top Header -->
    <div class="px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs select-none gap-1.5 sm:gap-2 min-w-0">
      <!-- Left: File Badge & Title -->
      <div class="flex items-center gap-1.5 sm:gap-2 min-w-0 shrink">
        <FileCode class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400 shrink-0" />
        <span class="font-semibold text-slate-200 truncate" :title="`schema.dbml - ${activeProject?.name || 'Project'}`">schema.dbml</span>
        <span v-if="editorWidth >= 520" class="text-slate-500 text-[11px] shrink-0">(DBML Syntax)</span>
        
        <!-- Learn DBML link (shown when editor is wide enough) -->
        <button
          v-if="editorWidth >= 560"
          @click="openLearnDbml"
          class="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-950/80 text-indigo-400 border border-indigo-800/80 hover:bg-indigo-900 transition cursor-pointer shrink-0"
          title="Learn DBML syntax guide"
        >
          <BookOpen class="w-3 h-3 text-indigo-400" />
          <span>Learn DBML</span>
        </button>
        <button
          v-else-if="editorWidth >= 440"
          @click="openLearnDbml"
          class="p-1 rounded-md text-indigo-400 hover:bg-indigo-950/80 border border-transparent hover:border-indigo-800/80 transition cursor-pointer shrink-0"
          title="Learn DBML syntax guide"
        >
          <BookOpen class="w-3.5 h-3.5" />
        </button>
      </div>

      <!-- Right: Responsive Action Controls Group -->
      <div class="flex items-center gap-1 sm:gap-1.5 shrink-0 whitespace-nowrap">
        <!-- 1. Find / Search Toggle Button -->
        <button
          @click="showSearchBox ? closeSearchBox() : openSearchBox()"
          class="px-2 py-1 rounded-lg transition flex items-center gap-1.5 border text-xs cursor-pointer group"
          :class="[
            showSearchBox
              ? 'bg-blue-950/80 text-blue-300 border-blue-700/80 shadow-xs'
              : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border-slate-700'
          ]"
          :title="showSearchBox ? 'Close Find (Esc)' : 'Find in editor (Ctrl+F)'"
        >
          <Search class="w-3.5 h-3.5" :class="showSearchBox ? 'text-blue-400' : 'text-slate-400 group-hover:text-blue-400 transition'" />
          <span v-if="editorWidth >= 520">Find</span>
          <kbd v-if="editorWidth >= 620" class="px-1 py-0.2 bg-slate-900 border border-slate-700 rounded text-[9px] text-slate-400">Ctrl+F</kbd>
        </button>

        <!-- 2. Live Validation Badge / Toggle Drawer -->
        <button
          @click="showDiagnostics = !showDiagnostics"
          class="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg font-mono font-medium transition border shadow-xs cursor-pointer text-xs"
          :class="[
            validationResult.isValid && validationResult.diagnostics.length === 0
              ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/80 hover:bg-emerald-900/80'
              : errorCount > 0
                ? 'bg-rose-950/80 text-rose-400 border-rose-800/80 hover:bg-rose-900/80'
                : 'bg-amber-950/80 text-amber-400 border-amber-800/80 hover:bg-amber-900/80'
          ]"
          :title="showDiagnostics ? 'Hide Validation Drawer' : (validationResult.isValid && validationResult.diagnostics.length === 0 ? 'DBML Valid (Click for diagnostics)' : `${errorCount} errors, ${warningCount} warnings found. Click to view.`)"
        >
          <CheckCircle2 v-if="validationResult.isValid && validationResult.diagnostics.length === 0" class="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <AlertTriangle v-else class="w-3.5 h-3.5 shrink-0" />
          
          <span v-if="editorWidth >= 560" class="text-[11px]">
            {{ validationResult.isValid && validationResult.diagnostics.length === 0 ? 'DBML Valid' : `${errorCount} Err, ${warningCount} Warn` }}
          </span>
          <span v-else-if="editorWidth >= 400" class="text-[11px]">
            {{ validationResult.isValid && validationResult.diagnostics.length === 0 ? 'Valid' : `${errorCount}E ${warningCount}W` }}
          </span>
          <span v-else-if="errorCount > 0 || warningCount > 0" class="text-[10px] font-bold">
            {{ errorCount || warningCount }}
          </span>

          <ChevronUp v-if="showDiagnostics && editorWidth >= 400" class="w-3 h-3 ml-0.5 opacity-70 shrink-0" />
          <ChevronDown v-else-if="editorWidth >= 400" class="w-3 h-3 ml-0.5 opacity-70 shrink-0" />
        </button>

        <!-- 3. Save Status Badge & Manual Save Trigger in CodeEditor Header -->
        <button
          @click="forceSaveProject"
          class="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition border shadow-xs cursor-pointer"
          :class="[
            state.saveStatus === 'saving'
              ? 'bg-amber-950/80 text-amber-300 border-amber-800/80 animate-pulse'
              : state.saveStatus === 'unsaved'
                ? 'bg-blue-950/80 text-blue-300 border-blue-800/80 hover:bg-blue-900/80'
                : state.saveStatus === 'error'
                  ? 'bg-rose-950/80 text-rose-300 border-rose-800/80 hover:bg-rose-900/80'
                  : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border-slate-700'
          ]"
          :title="state.saveStatus === 'unsaved' ? 'Unsaved changes (Click or Ctrl+S to save now)' : state.saveStatus === 'saving' ? 'Saving changes to cloud...' : state.saveStatus === 'error' ? 'Save failed (Click to retry)' : 'All changes saved to cloud (Ctrl+S)'"
        >
          <Loader2 v-if="state.saveStatus === 'saving'" class="w-3.5 h-3.5 animate-spin text-amber-400 shrink-0" />
          <CloudUpload v-else-if="state.saveStatus === 'unsaved'" class="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <AlertCircle v-else-if="state.saveStatus === 'error'" class="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <CloudCheck v-else class="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          
          <span v-if="editorWidth >= 460" class="text-xs">
            {{ state.saveStatus === 'saving' ? 'Saving...' : state.saveStatus === 'unsaved' ? 'Save' : state.saveStatus === 'error' ? 'Retry' : 'Saved' }}
          </span>
        </button>

        <!-- 4. Format Code Button -->
        <button
          v-if="editorWidth >= 360"
          @click="formatCode"
          title="Auto Format DBML Code (Shift+Alt+F)"
          class="px-2 sm:px-2.5 py-1 bg-slate-800/90 hover:bg-slate-700 text-slate-200 rounded-lg transition flex items-center gap-1.5 border border-slate-700 active:scale-95 cursor-pointer text-xs"
        >
          <Wand2 class="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span v-if="editorWidth >= 480">Format</span>
        </button>

        <!-- 5. More Overflow Menu (when width is narrow < 430px) -->
        <div v-if="editorWidth < 430" class="relative" ref="moreMenuRef">
          <button
            @click.stop="showMoreMenu = !showMoreMenu"
            class="p-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 rounded-lg transition border border-slate-700 cursor-pointer"
            :class="{ 'bg-slate-700 ring-1 ring-blue-500': showMoreMenu }"
            title="More editor tools"
          >
            <MoreHorizontal class="w-3.5 h-3.5 text-slate-300" />
          </button>

          <!-- Overflow Dropdown Menu -->
          <div
            v-if="showMoreMenu"
            @click.stop
            class="absolute right-0 top-full mt-1.5 z-50 w-52 p-1.5 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl text-slate-200 text-xs animate-in fade-in slide-in-from-top-1 duration-150"
          >
            <button
              v-if="editorWidth < 360"
              @click="formatCode(); showMoreMenu = false"
              class="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 flex items-center gap-2 text-slate-200 transition cursor-pointer"
            >
              <Wand2 class="w-3.5 h-3.5 text-amber-400" />
              <span>Format DBML Code</span>
            </button>
            <button
              @click="showDiagnostics = !showDiagnostics; showMoreMenu = false"
              class="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 flex items-center gap-2 text-slate-200 transition cursor-pointer"
            >
              <SlidersHorizontal class="w-3.5 h-3.5 text-blue-400" />
              <span>{{ showDiagnostics ? 'Hide Diagnostics' : 'Show Diagnostics Drawer' }}</span>
            </button>
            <button
              @click="openLearnDbml(); showMoreMenu = false"
              class="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 flex items-center gap-2 text-slate-200 transition cursor-pointer"
            >
              <BookOpen class="w-3.5 h-3.5 text-indigo-400" />
              <span>Learn DBML Syntax Guide</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Code Mirror Editor Body -->
    <div class="relative flex-1 flex overflow-hidden bg-slate-950">
      <div
        ref="cmEditorContainer"
        class="w-full h-full overflow-hidden text-xs font-mono"
      ></div>

      <!-- Floating In-Editor Search Panel (VS Code Style, doesn't crush the header) -->
      <transition
        enter-active-class="transition-all duration-150 ease-out"
        enter-from-class="opacity-0 -translate-y-2 scale-95"
        enter-to-class="opacity-100 translate-y-0 scale-100"
        leave-active-class="transition-all duration-100 ease-in"
        leave-from-class="opacity-100 translate-y-0 scale-100"
        leave-to-class="opacity-0 -translate-y-2 scale-95"
      >
        <div
          v-if="showSearchBox"
          class="absolute top-2.5 right-3 z-30 flex items-center gap-1.5 p-1.5 rounded-xl bg-slate-900/95 border border-slate-700/90 shadow-2xl backdrop-blur-md text-xs select-none max-w-[calc(100%-1.5rem)]"
        >
          <Search class="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
          <input
            ref="searchInputEl"
            v-model="searchQuery"
            @input="onSearchInput"
            @keydown.enter.exact="findNextMatch"
            @keydown.shift.enter="findPrevMatch"
            @keydown.esc="closeSearchBox"
            type="text"
            placeholder="Find in editor..."
            class="w-28 xs:w-36 sm:w-44 bg-transparent text-slate-100 placeholder-slate-500 focus:outline-none text-xs font-mono px-1 py-0.5"
          />
          <!-- Search Results Counter Badge -->
          <span
            v-if="searchQuery"
            class="text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 tabular-nums"
            :class="searchMatches.length > 0 ? 'bg-slate-800 text-slate-300' : 'bg-rose-950/80 text-rose-400 border border-rose-800/60'"
          >
            {{ searchMatches.length > 0 ? `${currentMatchIdx + 1}/${searchMatches.length}` : '0/0' }}
          </span>
          <!-- Prev Match Button -->
          <button
            @click="findPrevMatch"
            :disabled="searchMatches.length === 0"
            class="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
            title="Previous match (Shift+Enter)"
          >
            <ChevronUp class="w-3.5 h-3.5" />
          </button>
          <!-- Next Match Button -->
          <button
            @click="findNextMatch"
            :disabled="searchMatches.length === 0"
            class="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
            title="Next match (Enter)"
          >
            <ChevronDown class="w-3.5 h-3.5" />
          </button>
          <!-- Close Search Button -->
          <button
            @click="closeSearchBox"
            class="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer ml-0.5"
            title="Close search (Esc)"
          >
            <X class="w-3.5 h-3.5" />
          </button>
        </div>
      </transition>

      <!-- Floating Ctrl+Hover Table Action Badge -->
      <transition name="fade">
        <div
          v-if="ctrlHoverTable"
          class="absolute pointer-events-none z-30 px-2.5 py-1 bg-indigo-950/95 text-indigo-200 border border-indigo-500/70 rounded-md text-[11px] font-mono shadow-2xl backdrop-blur-md flex items-center gap-1.5 transform -translate-y-full select-none"
          :style="{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }"
        >
          <MousePointerClick class="w-3.5 h-3.5 text-indigo-400 animate-pulse shrink-0" />
          <span>Ctrl + Click to focus <strong class="text-white font-semibold">{{ ctrlHoverTable.name }}</strong> on canvas</span>
        </div>
      </transition>
    </div>

    <!-- Diagnostics / Validation Error Panel (Drawer) -->
    <div
      v-if="showDiagnostics"
      class="h-36 bg-slate-950 border-t border-slate-800 flex flex-col transition-all duration-200 shrink-0"
    >
      <div class="px-3 py-1.5 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-medium">
        <div class="flex items-center gap-2">
          <SlidersHorizontal class="w-3.5 h-3.5 text-blue-400" />
          <span>DBML Sentence Validation & Diagnostics</span>
          <span v-if="validationResult.diagnostics.length > 0" class="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
            {{ validationResult.diagnostics.length }} issues found
          </span>
        </div>
        <button
          @click="showDiagnostics = false"
          class="text-slate-500 hover:text-slate-300 transition cursor-pointer"
        >
          <X class="w-3.5 h-3.5" />
        </button>
      </div>

      <!-- Diagnostics List -->
      <div class="flex-1 overflow-y-auto p-2 space-y-1">
        <div
          v-if="validationResult.diagnostics.length === 0"
          class="h-full flex items-center justify-center text-xs text-emerald-400 gap-1.5"
        >
          <CheckCircle2 class="w-4 h-4" />
          <span>All DBML sentences and syntax blocks are perfectly valid!</span>
        </div>

        <div
          v-for="(diag, idx) in validationResult.diagnostics"
          :key="idx"
          @click="jumpToLine(diag.line)"
          class="px-2.5 py-1.5 rounded bg-slate-900 hover:bg-slate-800/80 border border-slate-800 transition cursor-pointer flex items-center justify-between gap-3 text-xs group"
        >
          <div class="flex items-center gap-2 min-w-0">
            <span
              class="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold shrink-0"
              :class="diag.severity === 'error' ? 'bg-rose-950 text-rose-400 border border-rose-800/80' : 'bg-amber-950 text-amber-400 border border-amber-800/80'"
            >
              Line {{ diag.line }}
            </span>
            <span class="text-slate-300 truncate font-mono text-[11px]">{{ diag.message }}</span>
          </div>
          <span class="text-[10px] font-mono text-slate-500 group-hover:text-blue-400 shrink-0 transition">
            Jump to line &rarr;
          </span>
        </div>
      </div>
    </div>

    <!-- Bottom Status Bar -->
    <div class="px-2.5 sm:px-3.5 py-1.5 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between select-none shrink-0 min-w-0">
      <div class="flex items-center gap-2 sm:gap-3 min-w-0 truncate">
        <span v-if="validationResult.isValid" class="flex items-center gap-1 text-emerald-400 font-medium shrink-0">
          <CheckCircle2 class="w-3.5 h-3.5" /> DBML Synced
        </span>
        <span v-else class="flex items-center gap-1 text-rose-400 font-medium shrink-0">
          <AlertCircle class="w-3.5 h-3.5" /> Syntax Errors
        </span>
        <span class="text-slate-600 shrink-0">|</span>
        <span class="shrink-0">Line {{ activeLine }}</span>
        <template v-if="editorWidth >= 420">
          <span class="text-slate-600 shrink-0">|</span>
          <span class="shrink-0">{{ activeProject.tables.length }} Tables</span>
        </template>
        <template v-if="editorWidth >= 580">
          <span class="text-slate-600 shrink-0">|</span>
          <span class="text-slate-400 text-[10px] font-sans truncate">
            Tip: <kbd class="px-1 py-0.5 bg-slate-900 border border-slate-700 rounded text-[9px] font-mono text-slate-300">Ctrl + Click</kbd> table to focus
          </span>
        </template>
      </div>
      <div v-if="editorWidth >= 340" class="flex items-center gap-2 text-slate-500 font-mono text-[11px] shrink-0 ml-2">
        <button
          @click="openLearnDbml"
          class="hover:text-indigo-400 transition flex items-center gap-1 cursor-pointer"
          title="Click to learn DBML syntax"
        >
          <Sparkles class="w-3 h-3 text-amber-400" />
          <span v-if="editorWidth >= 440" class="font-semibold text-slate-400 hover:text-indigo-300">Powered by DBML</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { activeProject, state, addToast, navigateTo, focusTableOnCanvas, saveGuestProjectsToStorage, forceSaveProject, flushActiveProjectSync, normalizeTableKeys } from '../stores/schemaStore.js';
import { generateDBML, parseDBML, validateDBML, formatDBML } from '../utils/dbmlParser.js';
import {
  dbmlLanguage,
  dbmlHighlightStyleDark,
  dbmlHighlightStyleLight,
  createEditorTheme,
  dbmlFoldService,
  dbmlAutocompleteExtension,
  completionKeymap,
  setCustomSearchEffect,
  customSearchHighlightField
} from '../utils/dbmlCodeMirror.js';
import { EditorView, lineNumbers, highlightActiveLine, highlightActiveLineGutter, keymap } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { syntaxHighlighting, foldGutter, codeFolding, foldKeymap } from '@codemirror/language';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { search, SearchCursor, SearchQuery, setSearchQuery, highlightSelectionMatches, searchKeymap } from '@codemirror/search';
import {
  FileCode,
  Wand2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  SlidersHorizontal,
  X,
  BookOpen,
  Sparkles,
  Search,
  MousePointerClick,
  Loader2,
  CloudUpload,
  CloudCheck,
  MoreHorizontal
} from 'lucide-vue-next';

function openLearnDbml() {
  navigateTo('/learn-dbml');
}

const editorRootRef = ref(null);
const editorWidth = ref(500);
let resizeObserver = null;

const showMoreMenu = ref(false);
const moreMenuRef = ref(null);

function handleClickOutsideEditor(e) {
  if (moreMenuRef.value && !moreMenuRef.value.contains(e.target)) {
    showMoreMenu.value = false;
  }
}

const cmEditorContainer = ref(null);
const searchInputEl = ref(null);
let editorView = null;

const dbmlContent = ref('');
const showDiagnostics = ref(false);
const activeLine = ref(1);

// Keyword Search in Editor
const showSearchBox = ref(false);
const searchQuery = ref('');
const searchMatches = ref([]);
const currentMatchIdx = ref(-1);
let isProgrammaticUpdate = false;
const currentEditorProjectId = ref(activeProject.value?.id || null);

const validationResult = computed(() => {
  return validateDBML(dbmlContent.value);
});

const errorCount = computed(() => {
  return validationResult.value.diagnostics.filter(d => d.severity === 'error').length;
});

const warningCount = computed(() => {
  return validationResult.value.diagnostics.filter(d => d.severity === 'warning').length;
});

// Update search matches using SearchQuery and sync with CodeMirror's search extension
function updateSearch() {
  if (!editorView) return;
  const q = searchQuery.value;

  if (!q.trim()) {
    searchMatches.value = [];
    currentMatchIdx.value = -1;
    editorView.dispatch({
      effects: [
        setSearchQuery.of(new SearchQuery({ search: '', caseSensitive: false })),
        setCustomSearchEffect.of({ query: '', activeMatch: null })
      ]
    });
    return;
  }

  const matches = [];
  try {
    const sq = new SearchQuery({ search: q, caseSensitive: false });
    const cursor = sq.getCursor(editorView.state.doc);

    let item;
    while (!(item = cursor.next()).done) {
      matches.push({ from: item.value.from, to: item.value.to });
    }
  } catch (err) {
    console.warn('Search query error:', err);
  }

  searchMatches.value = matches;

  if (matches.length > 0) {
    const currentPos = editorView.state.selection.main.head;
    let nextIdx = matches.findIndex(m => m.from >= currentPos);
    if (nextIdx === -1) nextIdx = 0;
    currentMatchIdx.value = nextIdx;
    const activeMatch = matches[nextIdx];
    highlightMatch(activeMatch);
    editorView.dispatch({
      effects: [
        setSearchQuery.of(new SearchQuery({ search: q, caseSensitive: false })),
        setCustomSearchEffect.of({ query: q, activeMatch })
      ]
    });
  } else {
    currentMatchIdx.value = -1;
    editorView.dispatch({
      effects: [
        setSearchQuery.of(new SearchQuery({ search: q, caseSensitive: false })),
        setCustomSearchEffect.of({ query: q, activeMatch: null })
      ]
    });
  }
}

function onSearchInput() {
  updateSearch();
}

function highlightMatch(match) {
  if (!editorView || !match) return;
  editorView.dispatch({
    selection: { anchor: match.from, head: match.to },
    scrollIntoView: true
  });
}

function findNextMatch() {
  if (searchMatches.value.length === 0) {
    updateSearch();
    return;
  }
  let nextIdx = currentMatchIdx.value + 1;
  if (nextIdx >= searchMatches.value.length) nextIdx = 0;
  currentMatchIdx.value = nextIdx;
  const activeMatch = searchMatches.value[nextIdx];
  highlightMatch(activeMatch);
  if (editorView) {
    editorView.dispatch({
      effects: setCustomSearchEffect.of({
        query: searchQuery.value,
        activeMatch
      })
    });
  }
}

function findPrevMatch() {
  if (searchMatches.value.length === 0) {
    updateSearch();
    return;
  }
  let prevIdx = currentMatchIdx.value - 1;
  if (prevIdx < 0) prevIdx = searchMatches.value.length - 1;
  currentMatchIdx.value = prevIdx;
  const activeMatch = searchMatches.value[prevIdx];
  highlightMatch(activeMatch);
  if (editorView) {
    editorView.dispatch({
      effects: setCustomSearchEffect.of({
        query: searchQuery.value,
        activeMatch
      })
    });
  }
}

function openSearchBox(prefill = '') {
  showSearchBox.value = true;
  if (prefill) {
    searchQuery.value = prefill;
  }
  nextTick(() => {
    if (searchInputEl.value) {
      searchInputEl.value.focus();
      searchInputEl.value.select();
    }
    updateSearch();
  });
}

function closeSearchBox() {
  showSearchBox.value = false;
  searchQuery.value = '';
  searchMatches.value = [];
  currentMatchIdx.value = -1;
  if (editorView) {
    editorView.dispatch({
      effects: [
        setSearchQuery.of(new SearchQuery({ search: '', caseSensitive: false })),
        setCustomSearchEffect.of({ query: '', activeMatch: null })
      ]
    });
    editorView.focus();
  }
}

// Scan document for all DBML Table block boundaries
function getTableBlocks(doc) {
  if (!doc) return [];
  const blocks = [];
  const lineCount = doc.lines;
  let currentTable = null;
  let braceDepth = 0;

  for (let i = 1; i <= lineCount; i++) {
    const line = doc.line(i);
    const text = line.text;
    const trimmed = text.trim();

    // Strip single-line comments and strings for accurate brace counting
    let cleaned = text.replace(/\/\/.*$/, '');
    cleaned = cleaned.replace(/'(?:\\.|[^'\\])*'/g, "''");
    cleaned = cleaned.replace(/"(?:\\.|[^"\\])*"/g, '""');

    if (!currentTable) {
      // Check for Table declaration start: Table [schema.]name [as alias] [...]
      const match = trimmed.match(/^Table\s+(?:([a-zA-Z0-9_"]+)\.)?([a-zA-Z0-9_"]+)/i);
      if (match) {
        const rawName = match[2] || match[1];
        const tableName = rawName.replace(/^["']|["']$/g, '');
        currentTable = {
          tableName,
          startLine: i,
          startPos: line.from,
          endLine: i,
          endPos: line.to,
          hasOpenedBrace: false
        };
        braceDepth = 0;
        for (const ch of cleaned) {
          if (ch === '{') {
            braceDepth++;
            currentTable.hasOpenedBrace = true;
          } else if (ch === '}') {
            braceDepth--;
          }
        }
        if (currentTable.hasOpenedBrace && braceDepth <= 0) {
          // Table opened and closed on same line (e.g. Table tags { id int })
          blocks.push(currentTable);
          currentTable = null;
        }
      }
    } else {
      currentTable.endLine = i;
      currentTable.endPos = line.to;

      // Check if another top-level construct begins in case of missing closing brace
      if (/^(?:Table|TableGroup|Enum|Project)\s+/i.test(trimmed) && i > currentTable.startLine) {
        blocks.push(currentTable);
        currentTable = null;
        i--; // re-process this line as new top-level construct
        continue;
      }

      for (const ch of cleaned) {
        if (ch === '{') {
          braceDepth++;
          currentTable.hasOpenedBrace = true;
        } else if (ch === '}') {
          braceDepth--;
          if (currentTable.hasOpenedBrace && braceDepth <= 0) {
            blocks.push(currentTable);
            currentTable = null;
            break;
          }
        }
      }
    }
  }

  if (currentTable) {
    blocks.push(currentTable);
  }

  return blocks;
}

// Find table block or recognized table reference at document position
function findTableBlockAtPos(pos, doc) {
  if (pos == null || !doc) return null;
  const line = doc.lineAt(pos);
  const lineNum = line.number;

  // 1. Check if pos is inside any defined Table block
  const blocks = getTableBlocks(doc);
  const matchedBlock = blocks.find(b => lineNum >= b.startLine && lineNum <= b.endLine);
  if (matchedBlock) {
    const projTable = activeProject.value?.tables?.find(
      t => t.name.toLowerCase() === matchedBlock.tableName.toLowerCase()
    );
    return {
      tableName: projTable?.name || matchedBlock.tableName,
      tableId: projTable?.id || matchedBlock.tableName,
      startLine: matchedBlock.startLine,
      endLine: matchedBlock.endLine,
      lineNum: lineNum
    };
  }

  // 2. Check if hovering on a specific word that matches a table name (e.g. in Ref lines or TableGroup)
  if (editorView && activeProject.value?.tables) {
    const wordRange = editorView.state.wordAt(pos);
    if (wordRange) {
      const word = doc.sliceString(wordRange.from, wordRange.to);
      const matchedTable = activeProject.value.tables.find(
        t => t.name.toLowerCase() === word.toLowerCase()
      );
      if (matchedTable) {
        return {
          tableName: matchedTable.name,
          tableId: matchedTable.id,
          startLine: lineNum,
          endLine: lineNum,
          lineNum: lineNum,
          isWordMatch: true
        };
      }
    }
  }

  return null;
}

// State for Ctrl+Hover cursor & table action badge
const ctrlHoverTable = ref(null);
const tooltipPos = ref({ x: 0, y: 0 });
let currentHoveredLineEl = null;
let lastMouseCoords = null;

function clearCtrlHoverState() {
  ctrlHoverTable.value = null;
  if (editorView?.dom) {
    editorView.dom.classList.remove('cm-table-ctrl-active');
  }
  if (cmEditorContainer.value) {
    cmEditorContainer.value.classList.remove('cm-table-ctrl-active');
  }
  if (currentHoveredLineEl) {
    currentHoveredLineEl.classList.remove('cm-table-line-highlight');
    currentHoveredLineEl = null;
  }
}

function updateCtrlHoverState(isCtrl, view, clientX, clientY) {
  if (!isCtrl || !view || !cmEditorContainer.value) {
    clearCtrlHoverState();
    return;
  }

  const containerRect = cmEditorContainer.value.getBoundingClientRect();
  // Check if mouse coordinates are within editor bounds
  if (
    clientX < containerRect.left ||
    clientX > containerRect.right ||
    clientY < containerRect.top ||
    clientY > containerRect.bottom
  ) {
    clearCtrlHoverState();
    return;
  }

  const pos = view.posAtCoords({ x: clientX, y: clientY });
  if (pos == null) {
    clearCtrlHoverState();
    return;
  }

  const tableBlock = findTableBlockAtPos(pos, view.state.doc);
  if (!tableBlock) {
    clearCtrlHoverState();
    return;
  }

  // Active table block detected under cursor with Ctrl held!
  ctrlHoverTable.value = {
    name: tableBlock.tableName,
    id: tableBlock.tableId
  };

  // Position the tooltip near the mouse cursor relative to container
  tooltipPos.value = {
    x: Math.min(Math.max(12, clientX - containerRect.left + 14), containerRect.width - 260),
    y: Math.max(28, clientY - containerRect.top - 10)
  };

  // Apply clickable cursor classes to editor view and container
  view.dom.classList.add('cm-table-ctrl-active');
  cmEditorContainer.value.classList.add('cm-table-ctrl-active');

  // Highlight the hovered line in the table block
  const targetLineEl = document.elementFromPoint(clientX, clientY)?.closest('.cm-line');
  if (targetLineEl !== currentHoveredLineEl) {
    if (currentHoveredLineEl) {
      currentHoveredLineEl.classList.remove('cm-table-line-highlight');
    }
    if (targetLineEl) {
      targetLineEl.classList.add('cm-table-line-highlight');
      currentHoveredLineEl = targetLineEl;
    }
  }
}

// Handle Ctrl + Click navigation to focus table in Canvas
function handleCtrlClick(pos, view) {
  const tableBlock = findTableBlockAtPos(pos, view.state.doc);
  if (tableBlock) {
    focusTableOnCanvas(tableBlock.tableId || tableBlock.tableName);
    return true;
  }
  return false;
}

function initCodeMirror() {
  if (!cmEditorContainer.value) return;

  const isDark = state.isDarkMode;
  const proj = activeProject.value;
  const initialText = proj.customDbml || generateDBML(
    proj.tables,
    proj.relationships,
    proj.name,
    {
      enums: proj.enums || [],
      tableGroups: proj.tableGroups || [],
      projectConfig: proj.projectConfig || null
    }
  );
  dbmlContent.value = initialText;

  const startState = EditorState.create({
    doc: initialText,
    extensions: [
      lineNumbers(),
      foldGutter(),
      codeFolding(),
      highlightActiveLineGutter(),
      highlightActiveLine(),
      history(),
      search({ top: false }),
      highlightSelectionMatches(),
      keymap.of([
        {
          key: 'Mod-f',
          run: (view) => {
            const sel = view.state.selection.main;
            const selectedText = !sel.empty ? view.state.sliceDoc(sel.from, sel.to) : '';
            openSearchBox(selectedText);
            return true;
          }
        },
        ...foldKeymap,
        ...searchKeymap,
        ...completionKeymap,
        ...defaultKeymap,
        ...historyKeymap
      ]),
      dbmlFoldService,
      dbmlAutocompleteExtension,
      customSearchHighlightField,
      dbmlLanguage,
      syntaxHighlighting(isDark ? dbmlHighlightStyleDark : dbmlHighlightStyleLight),
      createEditorTheme(isDark),
      EditorView.domEventHandlers({
        mousemove(event, view) {
          lastMouseCoords = { x: event.clientX, y: event.clientY };
          updateCtrlHoverState(event.ctrlKey || event.metaKey, view, event.clientX, event.clientY);
          return false;
        },
        mouseleave(event, view) {
          clearCtrlHoverState();
          return false;
        },
        mousedown(event, view) {
          if (event.ctrlKey || event.metaKey) {
            const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
            if (pos != null && findTableBlockAtPos(pos, view.state.doc)) {
              // Prevent standard text selection drag on Ctrl+Click table
              event.preventDefault();
              return true;
            }
          }
          return false;
        },
        click(event, view) {
          if (event.ctrlKey || event.metaKey) {
            const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
            if (pos != null) {
              const handled = handleCtrlClick(pos, view);
              if (handled) {
                event.preventDefault();
                event.stopPropagation();
                return true;
              }
            }
          }
          return false;
        }
      }),
      EditorView.updateListener.of((update) => {
        if (update.selectionSet) {
          const mainSel = update.state.selection.main;
          activeLine.value = update.state.doc.lineAt(mainSel.head).number;
          if (showSearchBox.value && searchMatches.value.length > 0) {
            const foundIdx = searchMatches.value.findIndex(
              m => (mainSel.from >= m.from && mainSel.from <= m.to) || (mainSel.to >= m.from && mainSel.to <= m.to)
            );
            if (foundIdx !== -1 && foundIdx !== currentMatchIdx.value) {
              currentMatchIdx.value = foundIdx;
              editorView.dispatch({
                effects: setCustomSearchEffect.of({
                  query: searchQuery.value,
                  activeMatch: searchMatches.value[foundIdx]
                })
              });
            }
          }
        }

        if (update.docChanged) {
          if (isProgrammaticUpdate) return;
          const newDocText = update.state.doc.toString();
          dbmlContent.value = newDocText;
          onCodeMirrorChange(newDocText);
          if (showSearchBox.value && searchQuery.value) {
            updateSearch();
          }
        }
      })
    ]
  });

  editorView = new EditorView({
    state: startState,
    parent: cmEditorContainer.value
  });
}

function updateEditorText(newText) {
  if (!editorView) return;
  const currentDoc = editorView.state.doc.toString();
  if (currentDoc !== newText) {
    isProgrammaticUpdate = true;

    // Capture existing scroll position and selection to prevent unwanted scrolling
    const scrollEl = editorView.scrollDOM;
    const prevScrollTop = scrollEl ? scrollEl.scrollTop : 0;
    const prevScrollLeft = scrollEl ? scrollEl.scrollLeft : 0;
    const prevSelection = editorView.state.selection;

    // Compute minimal diff range so CodeMirror only mutates modified characters
    // This avoids resetting viewport state and completely eliminates the scroll-to-top glitch
    let start = 0;
    while (start < currentDoc.length && start < newText.length && currentDoc[start] === newText[start]) {
      start++;
    }
    let oldEnd = currentDoc.length;
    let newEnd = newText.length;
    while (oldEnd > start && newEnd > start && currentDoc[oldEnd - 1] === newText[newEnd - 1]) {
      oldEnd--;
      newEnd--;
    }

    try {
      editorView.dispatch({
        changes: {
          from: start,
          to: oldEnd,
          insert: newText.substring(start, newEnd)
        },
        selection: prevSelection ? {
          anchor: Math.min(prevSelection.main.anchor, newText.length),
          head: Math.min(prevSelection.main.head, newText.length)
        } : undefined
      });
      dbmlContent.value = newText;

      // Restore scroll position immediately and in next frame for measurement stability
      if (scrollEl) {
        scrollEl.scrollTop = prevScrollTop;
        scrollEl.scrollLeft = prevScrollLeft;
      }
      requestAnimationFrame(() => {
        if (editorView && editorView.scrollDOM) {
          editorView.scrollDOM.scrollTop = prevScrollTop;
          editorView.scrollDOM.scrollLeft = prevScrollLeft;
        }
      });
    } finally {
      isProgrammaticUpdate = false;
    }
  }
}

function onCodeMirrorChange(newText) {
  if (isProgrammaticUpdate) return;
  const proj = activeProject.value;
  if (!proj || proj.id !== currentEditorProjectId.value) {
    // Safety guard: Active project in store has changed or does not match editor's current project.
    // Never write stale text into another project!
    return;
  }

  try {
    const parsed = parseDBML(newText);
    const { tables, relationships, enums, tableGroups, projectConfig } = parsed;
    if (tables && tables.length >= 0) {
      const existingTablesMap = new Map();
      if (proj.tables) {
        proj.tables.forEach((t) => {
          existingTablesMap.set(t.name.toLowerCase(), t);
        });
      }

      const mergedTables = tables.map((newTbl) => {
        const existing = existingTablesMap.get(newTbl.name.toLowerCase());
        if (existing) {
          return {
            ...newTbl,
            id: existing.id,
            x: existing.x,
            y: existing.y,
            headerColor: newTbl.hasExplicitHeaderColor ? newTbl.headerColor : (existing.headerColor || newTbl.headerColor)
          };
        }
        return newTbl;
      });

      // Preserve stable IDs for relationships so lines update cleanly on the canvas
      const existingRelsMap = new Map();
      if (proj.relationships) {
        proj.relationships.forEach((r) => {
          const key = `${(r.fromTable || '').toLowerCase()}.${(r.fromColumn || '').toLowerCase()}->${(r.toTable || '').toLowerCase()}.${(r.toColumn || '').toLowerCase()}`;
          existingRelsMap.set(key, r);
        });
      }

      const stableRels = (relationships || []).map((newRel) => {
        const key = `${(newRel.fromTable || '').toLowerCase()}.${(newRel.fromColumn || '').toLowerCase()}->${(newRel.toTable || '').toLowerCase()}.${(newRel.toColumn || '').toLowerCase()}`;
        const existing = existingRelsMap.get(key);
        if (existing) {
          return {
            ...newRel,
            id: existing.id
          };
        }
        return newRel;
      });

      normalizeTableKeys(mergedTables, stableRels);
      proj.tables = mergedTables;
      proj.relationships = stableRels;
      proj.enums = enums || [];
      proj.tableGroups = tableGroups || [];
      if (projectConfig) proj.projectConfig = projectConfig;
      proj.customDbml = newText;
      proj.updatedAt = new Date().toISOString();
      proj.isStarterProject = false;
      state.saveStatus = 'unsaved';
      saveGuestProjectsToStorage();
    }
  } catch (err) {
    // Graceful error handling during syntax typing
  }
}

function jumpToLine(lineNum) {
  if (!editorView) return;
  const doc = editorView.state.doc;
  const targetLine = Math.min(Math.max(1, lineNum), doc.lines);
  const lineInfo = doc.line(targetLine);

  editorView.dispatch({
    selection: { anchor: lineInfo.from, head: lineInfo.from },
    scrollIntoView: true
  });
  editorView.focus();
}

async function formatCode() {
  if (!activeProject.value || !editorView) return;

  const currentDoc = editorView.state.doc.toString();
  if (!currentDoc.trim()) return;

  try {
    const formatted = formatDBML(currentDoc);
    updateEditorText(formatted);

    const parsed = parseDBML(formatted);
    if (parsed.tables && parsed.tables.length > 0) {
      const existingTablesMap = new Map();
      (activeProject.value.tables || []).forEach(t => existingTablesMap.set(t.name.toLowerCase(), t));
      activeProject.value.tables = parsed.tables.map(newTbl => {
        const existing = existingTablesMap.get(newTbl.name.toLowerCase());
        if (existing) {
          return {
            ...newTbl,
            id: existing.id,
            x: existing.x,
            y: existing.y,
            headerColor: newTbl.hasExplicitHeaderColor ? newTbl.headerColor : (existing.headerColor || newTbl.headerColor)
          };
        }
        return newTbl;
      });
      activeProject.value.relationships = parsed.relationships || [];
      normalizeTableKeys(activeProject.value.tables, activeProject.value.relationships);
    }
    if (parsed.enums) {
      activeProject.value.enums = parsed.enums;
    }
    if (parsed.tableGroups) {
      activeProject.value.tableGroups = parsed.tableGroups;
    }
    if (parsed.projectConfig) {
      activeProject.value.projectConfig = parsed.projectConfig;
    }
    activeProject.value.customDbml = formatted;
    activeProject.value.isStarterProject = false;
    activeProject.value.updatedAt = new Date().toISOString();

    saveGuestProjectsToStorage();
    await flushActiveProjectSync();
    addToast('Code Formatted & Saved', 'Cleaned up DBML syntax and saved to cloud', 'success');
  } catch (err) {
    console.error('Format error:', err);
    addToast('Format Notice', 'Formatting issue: ' + (err?.message || err), 'warning');
  }
}

// Global Key and Mouse Listeners for Ctrl+F, Ctrl+S, Ctrl+Hover clickable cursor, and table navigation
function handleWindowMouseMove(e) {
  lastMouseCoords = { x: e.clientX, y: e.clientY };
  if (editorView && (e.ctrlKey || e.metaKey)) {
    updateCtrlHoverState(true, editorView, e.clientX, e.clientY);
  } else if (!e.ctrlKey && !e.metaKey && ctrlHoverTable.value) {
    clearCtrlHoverState();
  }
}

function handleWindowKeyDown(e) {
  // Ctrl+S / Cmd+S: Save changes immediately to cloud/local
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
    e.preventDefault();
    forceSaveProject();
    return;
  }

  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
    // Check if the code editor container is active or present
    if (cmEditorContainer.value && cmEditorContainer.value.offsetParent !== null) {
      e.preventDefault();
      let prefill = '';
      if (editorView) {
        const sel = editorView.state.selection.main;
        if (!sel.empty) {
          prefill = editorView.state.sliceDoc(sel.from, sel.to);
        }
      }
      openSearchBox(prefill);
    }
  }

  if (e.key === 'Control' || e.key === 'Meta' || e.ctrlKey || e.metaKey) {
    if (editorView && lastMouseCoords) {
      updateCtrlHoverState(true, editorView, lastMouseCoords.x, lastMouseCoords.y);
    }
  }
}

function handleWindowKeyUp(e) {
  if (!e.ctrlKey && !e.metaKey) {
    clearCtrlHoverState();
  }
}

function handleWindowBlur() {
  clearCtrlHoverState();
}

// Re-theme CodeMirror when dark mode toggles
watch(
  () => state.isDarkMode,
  () => {
    if (editorView) {
      editorView.destroy();
      initCodeMirror();
    }
  }
);

// Watch active project switches to immediately synchronize editor buffer to current project
watch(
  () => activeProject.value?.id,
  (newId) => {
    if (!newId || !activeProject.value) return;
    currentEditorProjectId.value = newId;
    const proj = activeProject.value;
    const newText = proj.customDbml || generateDBML(
      proj.tables || [],
      proj.relationships || [],
      proj.name,
      {
        enums: proj.enums || [],
        tableGroups: proj.tableGroups || [],
        projectConfig: proj.projectConfig || null
      }
    );
    updateEditorText(newText);
  },
  { immediate: true }
);

// Watch store updates (e.g. table dragged on canvas, column edited, remote realtime sync)
watch(
  () => activeProject.value?.updatedAt,
  (newUpdatedAt, oldUpdatedAt) => {
    if (!activeProject.value || !editorView) return;
    // If project changed, the project ID watcher handles it
    if (activeProject.value.id !== currentEditorProjectId.value) {
      currentEditorProjectId.value = activeProject.value.id;
    }
    if (newUpdatedAt !== oldUpdatedAt && !editorView.hasFocus) {
      const proj = activeProject.value;
      const newText = proj.customDbml || generateDBML(
        proj.tables || [],
        proj.relationships || [],
        proj.name,
        {
          enums: proj.enums || [],
          tableGroups: proj.tableGroups || [],
          projectConfig: proj.projectConfig || null
        }
      );
      updateEditorText(newText);
    }
  }
);

onMounted(() => {
  initCodeMirror();
  if (editorRootRef.value) {
    editorWidth.value = Math.round(editorRootRef.value.clientWidth);
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        editorWidth.value = Math.round(entry.contentRect.width);
      }
    });
    resizeObserver.observe(editorRootRef.value);
  }
  window.addEventListener('click', handleClickOutsideEditor);
  window.addEventListener('mousemove', handleWindowMouseMove, { passive: true });
  window.addEventListener('keydown', handleWindowKeyDown);
  window.addEventListener('keyup', handleWindowKeyUp);
  window.addEventListener('blur', handleWindowBlur);
});

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  window.removeEventListener('click', handleClickOutsideEditor);
  window.removeEventListener('mousemove', handleWindowMouseMove);
  window.removeEventListener('keydown', handleWindowKeyDown);
  window.removeEventListener('keyup', handleWindowKeyUp);
  window.removeEventListener('blur', handleWindowBlur);
  if (editorView) {
    editorView.destroy();
  }
});
</script>

<style scoped>
.tab-4 {
  tab-size: 4;
}

/* Clickable cursor when Ctrl key is pressed on table block */
:deep(.cm-table-ctrl-active),
:deep(.cm-table-ctrl-active .cm-scroller),
:deep(.cm-table-ctrl-active .cm-content),
:deep(.cm-table-ctrl-active .cm-line),
:deep(.cm-table-ctrl-active .cm-line *),
:deep(.cm-table-ctrl-active .cm-gutter),
:deep(.cm-table-ctrl-active .cm-gutterElement) {
  cursor: pointer !important;
}

:deep(.cm-table-line-highlight) {
  background-color: rgba(99, 102, 241, 0.16) !important;
  border-radius: 4px;
  outline: 1px dashed rgba(129, 140, 248, 0.45);
  transition: background-color 0.12s ease;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-80%) scale(0.95);
}
</style>
