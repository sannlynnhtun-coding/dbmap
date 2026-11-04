<template>
  <div class="app-page app-dictionary-page w-screen h-dvh overflow-hidden flex flex-col bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans">
    <!-- Top Navigation Header -->
    <header class="h-14 px-4 sm:px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0  z-30">
      <div class="flex items-center gap-3">
        <DbMapLogo class-name="w-8 h-8" />
        <div>
          <div class="flex items-center gap-2">
            <span class="font-bold text-sm tracking-tight font-sans text-slate-900 dark:text-slate-100">
              {{ dictionaryData ? dictionaryData.title : isLocked ? lockedTitle : 'Loading Dictionary...' }}
            </span>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80">
              dbdictionary
            </span>
            <span
              v-if="dictionaryData?.isPasswordProtected || isLocked"
              class="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80"
            >
              <Key class="w-3 h-3" />
              Password Protected
            </span>
            <span v-if="dictionaryData?.dialect" class="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400">
              {{ dictionaryData.dialect }}
            </span>
          </div>
          <p v-if="dictionaryData?.publishedAt" class="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
            Published {{ formatDate(dictionaryData.publishedAt) }} &bull; Read-Only Documentation
          </p>
        </div>
      </div>

      <!-- Center / Right Controls -->
      <div class="flex items-center gap-2">
        <!-- Search Input -->
        <div v-if="dictionaryData" class="relative hidden md:block">
          <Search class="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search tables, fields, notes..."
            class="pl-8 pr-3 py-1.5 w-56 lg:w-64 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition text-slate-800 dark:text-slate-100"
          />
          <button aria-label="Clear search"
            v-if="searchQuery"
            @click="searchQuery = ''"
            class="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X class="w-3 h-3" />
          </button>
        </div>

        <!-- View Mode Switch (Dictionary vs Visual Canvas) -->
        <div v-if="dictionaryData" class="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold">
          <button
            @click="displayTab = 'dictionary'"
            class="px-2.5 py-1 rounded-lg transition flex items-center gap-1"
            :class="displayTab === 'dictionary' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'"
          >
            <BookOpen class="w-3.5 h-3.5" />
            <span class="hidden sm:inline">Dictionary</span>
          </button>
          <button
            @click="displayTab = 'canvas'"
            class="px-2.5 py-1 rounded-lg transition flex items-center gap-1"
            :class="displayTab === 'canvas' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'"
          >
            <LayoutGrid class="w-3.5 h-3.5" />
            <span class="hidden sm:inline">ERD Canvas</span>
          </button>
        </div>

        <!-- Copy Link Button -->
        <button
          @click="copyShareLink"
          class="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/80 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-xl transition text-xs font-semibold flex items-center gap-1.5 border border-blue-200 dark:border-blue-800"
        >
          <Check v-if="linkCopied" class="w-3.5 h-3.5 text-emerald-500 stroke-[3]" />
          <Share2 v-else class="w-3.5 h-3.5" />
          <span class="hidden sm:inline">{{ linkCopied ? 'Link Copied!' : 'Share' }}</span>
        </button>

        <!-- Dark Mode Toggle -->
        <button
          @click="toggleTheme"
          class="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <Sun v-if="state.isDarkMode" class="w-4 h-4 text-amber-400" />
          <Moon v-else class="w-4 h-4" />
        </button>

        <!-- Exit to Full Schema Editor -->
        <button
          @click="openSchemaEditor"
          class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition text-xs font-semibold flex items-center gap-1.5"
        >
          <Edit3 class="w-3.5 h-3.5" />
          <span>Edit Schema</span>
        </button>
      </div>
    </header>

    <!-- Loading State -->
    <div v-if="loading" class="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <Loader2 class="w-10 h-10 text-blue-500 animate-spin mb-3" />
      <h3 class="font-bold text-lg text-slate-800 dark:text-slate-100">Loading dbdictionary...</h3>
      <p class="text-xs text-slate-500 dark:text-slate-400 max-w-xs mt-1">
        Fetching published database documentation from cloud storage
      </p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <div class="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mb-3">
        <AlertCircle class="w-6 h-6" />
      </div>
      <h3 class="font-bold text-lg text-slate-800 dark:text-slate-100">Dictionary Not Found</h3>
      <p class="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1 mb-4">
        {{ error }}
      </p>
      <button
        @click="openSchemaEditor"
        class="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition"
      >
        Go to ERD Schema Studio
      </button>
    </div>

    <!-- Password Protection Gate -->
    <div v-else-if="isLocked" class="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl  p-8 max-w-md w-full space-y-5 text-left">
        <div class="text-center space-y-2">
          <div class="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
            <Key class="w-7 h-7" />
          </div>
          <h3 class="font-bold text-lg text-slate-900 dark:text-slate-100">
            Password Protected Documentation
          </h3>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            Database dictionary documentation for <strong class="text-slate-800 dark:text-slate-200">{{ lockedTitle }}</strong> is secured with a password.
          </p>
        </div>

        <form @submit.prevent="unlockDictionary" class="space-y-4">
          <div>
            <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 font-mono">
              Documentation Password
            </label>
            <div class="relative">
              <input
                :type="showPassword ? 'text' : 'password'"
                v-model="enteredPassword"
                placeholder="Enter dictionary password..."
                autofocus
                class="w-full pl-3 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 text-sm font-mono outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                :class="{ 'border-red-500 focus:border-red-500': passwordError }"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <EyeOff v-if="showPassword" class="w-4 h-4" />
                <Eye v-else class="w-4 h-4" />
              </button>
            </div>
          </div>

          <div v-if="passwordError" class="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400 text-xs">
            <AlertCircle class="w-4 h-4 shrink-0" />
            <span>{{ passwordError }}</span>
          </div>

          <button
            type="submit"
            class="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
          >
            <Key class="w-3.5 h-3.5" />
            <span>Unlock Database Dictionary</span>
          </button>
        </form>

        <div class="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Need access?</span>
          <button @click="openSchemaEditor" class="text-blue-600 dark:text-blue-400 hover:underline">
            Back to Schema Studio
          </button>
        </div>
      </div>
    </div>

    <!-- Main Content Workspace -->
    <div v-else-if="dictionaryData" class="flex-1 flex overflow-hidden">
      <!-- Sidebar Table Nav -->
      <aside class="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shrink-0 overflow-y-auto p-3 gap-2">
        <div class="md:hidden mb-1">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search schema..."
            class="w-full px-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-800 dark:text-slate-100"
          />
        </div>

        <button
          @click="activeTableFilter = null"
          class="w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition text-left"
          :class="[
            activeTableFilter === null
              ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          ]"
        >
          <span class="flex items-center gap-2">
            <Layers class="w-4 h-4 text-blue-500" /> All Tables Summary
          </span>
          <span class="px-1.5 py-0.5 rounded-md text-[10px] bg-slate-200/60 dark:bg-slate-800 text-slate-500 font-mono">
            {{ dictionaryData.tables.length }}
          </span>
        </button>

        <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mt-2">
          Tables Index
        </div>

        <div class="space-y-1">
          <button
            v-for="tbl in filteredTables"
            :key="tbl.id"
            @click="scrollToTable(tbl.id)"
            class="w-full px-3 py-2 rounded-xl text-xs transition flex items-center justify-between text-left group"
            :class="[
              activeTableFilter === tbl.id
                ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
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
              <FileText v-if="tbl.note || tbl.columns.some(c => c.note)" class="w-3 h-3 text-amber-500" title="Has Notes" />
              <span class="text-[10px] font-mono text-slate-400">
                {{ tbl.columns.length }}
              </span>
            </div>
          </button>
        </div>
      </aside>

      <!-- Main View Area -->
      <main class="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-50/50 dark:bg-slate-950 space-y-8 scroll-smooth">
        <!-- ERD Canvas View Tab -->
        <div v-if="displayTab === 'canvas'" class="h-[80vh] w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900  relative">
          <Canvas :read-only="true" />
        </div>

        <!-- Dictionary Text / Tables Documentation View Tab -->
        <template v-else>
          <!-- Project Banner Overview -->
          <div class="app-dictionary-overview p-6 rounded-2xl     text-white  relative overflow-hidden bg-blue-700">
            <div class="relative z-10">
              <div class="flex items-center gap-2 text-xs text-blue-300 font-mono font-semibold uppercase tracking-wider mb-1">
                <span>Published dbdictionary</span> &bull; <span>{{ dictionaryData.dialect || 'PostgreSQL' }}</span>
              </div>
              <h1 class="text-2xl font-semibold tracking-tight font-sans text-white mb-2">
                {{ dictionaryData.title }}
              </h1>
              <p v-if="dictionaryData.description" class="text-xs text-slate-300 max-w-2xl leading-relaxed">
                {{ dictionaryData.description }}
              </p>

              <!-- Metrics Row -->
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/10 text-xs">
                <div>
                  <div class="text-[10px] text-slate-400 uppercase font-mono font-semibold">Total Tables</div>
                  <div class="text-lg font-bold font-mono text-blue-300">{{ dictionaryData.tables.length }}</div>
                </div>
                <div>
                  <div class="text-[10px] text-slate-400 uppercase font-mono font-semibold">Total Fields</div>
                  <div class="text-lg font-bold font-mono text-emerald-300">{{ totalFieldsCount }}</div>
                </div>
                <div>
                  <div class="text-[10px] text-slate-400 uppercase font-mono font-semibold">Relationships</div>
                  <div class="text-lg font-bold font-mono text-blue-300">{{ (dictionaryData.relationships || []).length }}</div>
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
            :id="`pub-table-${tbl.id}`"
            class="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900  space-y-4"
          >
            <!-- Table Header Bar -->
            <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div class="flex items-center gap-3">
                <div
                  class="w-4 h-4 rounded-lg shrink-0"
                  :style="{ backgroundColor: tbl.headerColor || '#3b82f6' }"
                ></div>
                <h3 class="font-bold text-lg font-mono text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>{{ tbl.name }}</span>
                  <span class="text-xs font-sans font-normal px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {{ tbl.columns.length }} columns
                  </span>
                </h3>
              </div>
            </div>

            <!-- Table Note Box -->
            <div v-if="tbl.note" class="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-slate-700 dark:text-slate-200 text-xs leading-relaxed space-y-1">
              <div class="font-bold text-[11px] text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText class="w-3.5 h-3.5" /> Table Note
              </div>
              <div class="font-sans text-slate-700 dark:text-slate-200 leading-relaxed" v-html="formatNoteHtml(tbl.note)"></div>
            </div>

            <!-- Columns Table -->
            <div class="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase font-mono font-semibold text-[10px]">
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
                    class="hover:bg-white dark:hover:bg-slate-800/40 transition"
                  >
                    <!-- Field Name -->
                    <td class="py-2.5 px-3.5 font-mono font-bold text-slate-900 dark:text-slate-100">
                      {{ col.name }}
                    </td>

                    <!-- Type -->
                    <td class="py-2.5 px-3.5 font-mono text-slate-600 dark:text-slate-300 text-[11px]">
                      {{ col.type }}
                    </td>

                    <!-- Attributes -->
                    <td class="py-2.5 px-3.5 font-mono text-[10px]">
                      <div class="flex items-center gap-1 flex-wrap">
                        <span v-if="col.isPk || col.pk" class="px-1.5 py-0.5 rounded font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300">PK</span>
                        <span v-if="col.isFk || col.fk" class="px-1.5 py-0.5 rounded font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300">FK</span>
                        <span v-if="col.isUnique || col.unique" class="px-1.5 py-0.5 rounded font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300">UQ</span>
                        <span v-if="(col.isNull === false || col.notNull === true) && !(col.isPk || col.pk)" class="px-1.5 py-0.5 rounded font-bold bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300">NOT NULL</span>
                        <span v-if="!(col.isPk || col.pk) && !(col.isFk || col.fk) && !(col.isUnique || col.unique) && col.isNull !== false && col.notNull !== true" class="text-slate-400">-</span>
                      </div>
                    </td>

                    <!-- Note -->
                    <td class="py-2.5 px-3.5 text-slate-600 dark:text-slate-300 text-xs">
                      <div
                        class="font-sans text-slate-700 dark:text-slate-200 leading-relaxed break-words"
                        :class="{ 'italic text-slate-400 dark:text-slate-500': !col.note }"
                      >
                        <div v-if="col.note" v-html="formatNoteHtml(col.note)"></div>
                        <span v-else>No field note</span>
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
                  :key="rel.id || rel.fromTable + rel.toTable"
                  class="px-3 py-1.5 rounded-lg bg-slate-100/80 dark:bg-slate-800/60 font-mono text-xs flex items-center gap-2 text-slate-700 dark:text-slate-300"
                >
                  <span class="font-bold text-blue-600 dark:text-blue-400">{{ rel.fromTable }}.{{ rel.fromColumn }}</span>
                  <span class="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-bold text-[10px] text-slate-600 dark:text-slate-300">
                    {{ rel.cardinality }}
                  </span>
                  <span class="font-bold text-emerald-600 dark:text-emerald-400">{{ rel.toTable }}.{{ rel.toColumn }}</span>
                </div>
              </div>
            </div>
          </div>
        </template>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { state, addToast } from '../stores/schemaStore.js';
import { formatNoteHtml } from '../utils/dbmlParser.js';
import { db, doc, getDoc, setDoc } from '../firebase.js';
import Canvas from './Canvas.vue';
import DbMapLogo from './DbMapLogo.vue';
import {
  BookOpen,
  Search,
  X,
  Share2,
  Check,
  Sun,
  Moon,
  Edit3,
  Loader2,
  AlertCircle,
  Layers,
  FileText,
  GitFork,
  LayoutGrid,
  Key,
  Eye,
  EyeOff
} from 'lucide-vue-next';

const props = defineProps({
  dictionaryId: { type: String, required: true }
});

const loading = ref(true);
const error = ref(null);
const dictionaryData = ref(null);
const searchQuery = ref('');
const activeTableFilter = ref(null);
const linkCopied = ref(false);
const displayTab = ref('dictionary');

const isLocked = ref(false);
const lockedTitle = ref('');
const expectedPassword = ref('');
const enteredPassword = ref('');
const showPassword = ref(false);
const passwordError = ref('');
let rawDocData = null;

onMounted(async () => {
  try {
    const docRef = doc(db, 'published_dictionaries', props.dictionaryId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      const isPwdProtected = data.isPasswordProtected || Boolean(data.sharePassword);
      const isSessionUnlocked = sessionStorage.getItem('dict_pwd_unlocked_' + props.dictionaryId) === 'true';

      if (isPwdProtected && !isSessionUnlocked) {
        isLocked.value = true;
        lockedTitle.value = data.title || 'Database Dictionary';
        expectedPassword.value = data.sharePassword || '';
        rawDocData = data;
      } else {
        dictionaryData.value = data;
        // Increment view count asynchronously
        setDoc(docRef, { views: (data.views || 0) + 1 }, { merge: true }).catch((e) => {
          console.warn('Could not increment view count:', e.message);
        });
      }
    } else {
      error.value = 'The requested dbdictionary documentation could not be found or has been removed.';
    }
  } catch (err) {
    error.value = 'Failed to load published dictionary from database: ' + err.message;
  } finally {
    loading.value = false;
  }
});

function unlockDictionary() {
  passwordError.value = '';
  const input = enteredPassword.value.trim();
  if (!input) {
    passwordError.value = 'Please enter the documentation password.';
    return;
  }
  if (input !== expectedPassword.value) {
    passwordError.value = 'Incorrect password. Please verify with the project author.';
    return;
  }

  sessionStorage.setItem('dict_pwd_unlocked_' + props.dictionaryId, 'true');
  isLocked.value = false;
  dictionaryData.value = rawDocData;
  addToast('Access Granted', 'Database dictionary documentation unlocked!', 'success');
}

const totalFieldsCount = computed(() => {
  return dictionaryData.value?.tables.reduce((acc, t) => acc + t.columns.length, 0) || 0;
});

const totalNotesCount = computed(() => {
  if (!dictionaryData.value) return 0;
  let count = 0;
  dictionaryData.value.tables.forEach(t => {
    if (t.note) count++;
    t.columns.forEach(c => {
      if (c.note) count++;
    });
  });
  return count;
});

const filteredTables = computed(() => {
  if (!dictionaryData.value) return [];
  const query = searchQuery.value.toLowerCase().trim();
  if (!query) return dictionaryData.value.tables;

  return dictionaryData.value.tables.filter(t => {
    const matchTable = t.name.toLowerCase().includes(query) || (t.note && t.note.toLowerCase().includes(query));
    const matchCol = t.columns.some(c => c.name.toLowerCase().includes(query) || (c.note && c.note.toLowerCase().includes(query)));
    return matchTable || matchCol;
  });
});

const displayedTables = computed(() => {
  if (activeTableFilter.value) {
    return dictionaryData.value?.tables.filter(t => t.id === activeTableFilter.value) || [];
  }
  return filteredTables.value;
});

function scrollToTable(tblId) {
  activeTableFilter.value = null;
  const el = document.getElementById(`pub-table-${tblId}`);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function getTableRelationships(tableName) {
  if (!dictionaryData.value || !dictionaryData.value.relationships) return [];
  return dictionaryData.value.relationships.filter(
    r => r.fromTable === tableName || r.toTable === tableName
  );
}

function copyShareLink() {
  navigator.clipboard.writeText(window.location.href);
  linkCopied.value = true;
  addToast('Copied Share Link', 'dbdictionary unique URL copied to clipboard!', 'success');
  setTimeout(() => {
    linkCopied.value = false;
  }, 2000);
}

function toggleTheme() {
  state.isDarkMode = !state.isDarkMode;
  localStorage.setItem('db_schema_dark', state.isDarkMode);
  if (state.isDarkMode) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

function openSchemaEditor() {
  // Clear dictionary URL param and return to ERD studio editor
  const url = new URL(window.location.href);
  url.searchParams.delete('dbdictionary');
  url.searchParams.delete('dictionary');
  url.searchParams.delete('doc');
  window.history.pushState({}, '', url.pathname);
  window.location.reload();
}

function formatDate(isoStr) {
  if (!isoStr) return '';
  try {
    return new Date(isoStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (e) {
    return isoStr;
  }
}
</script>
