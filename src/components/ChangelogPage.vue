<template>
  <div class="app-page app-changelog-page min-h-dvh bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white transition-colors duration-200">
    <!-- Top Sticky Navigation Bar -->
    <header class="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90  border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 py-3.5 transition-colors">
      <div class="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <!-- Left: Logo & Breadcrumbs -->
        <div class="flex items-center gap-3">
          <button
            @click="navigateTo('/')"
            class="flex items-center gap-2.5 font-bold text-blue-600 dark:text-blue-400 text-lg hover:opacity-90 transition cursor-pointer"
            title="dbmaps - Home"
          >
            <DbMapLogo class-name="w-8 h-8 drop-shadow-sm" />
            <span class="font-mono tracking-tight text-slate-900 dark:text-slate-100 text-xl font-semibold">
              db<span class="text-blue-600 dark:text-blue-400">maps</span>
            </span>
          </button>

          <span class="text-slate-300 dark:text-slate-700 hidden sm:inline text-sm font-light">/</span>

          <div class="hidden sm:flex items-center gap-2">
            <span class="text-xs font-bold text-slate-700 dark:text-slate-200">Changelog & Issue Tracker</span>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              v1.4.6
            </span>
          </div>
        </div>

        <!-- Right Side: Account, Dark Mode Toggle & Return to Studio CTA -->
        <div class="flex items-center gap-2 sm:gap-2.5">
          <button
            @click="toggleDarkMode"
            class="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            :title="state.isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
          >
            <Sun v-if="state.isDarkMode" class="w-4 h-4 text-amber-400" />
            <Moon v-else class="w-4 h-4 text-slate-600" />
          </button>

          <button
            @click="navigateTo('/')"
            class="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <Home class="w-3.5 h-3.5" />
            <span>Home</span>
          </button>

          <button
            @click="navigateTo('/app')"
            class="px-3.5 sm:px-4 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs rounded-xl transition  flex items-center gap-1.5 cursor-pointer"
          >
            <span>Launch Studio</span>
            <ArrowRight class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>

    <!-- Hero Header Banner -->
    <section class="border-b border-slate-200 dark:border-slate-800 py-10 px-4 sm:px-8 app-soft-surface">
      <div class="max-w-5xl mx-auto space-y-4 text-center sm:text-left sm:flex sm:items-center sm:justify-between sm:space-y-0">
        <div class="space-y-2 max-w-2xl">

          <h1 class="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Changelog & issues
          </h1>
          <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Live technical audit trail of release milestones, defect resolutions, and performance optimizations. Have you encountered an anomaly or have an architectural suggestion? Submit it directly to our engineering log.
          </p>
        </div>

        <!-- Metric Badges Stack -->
        <div class="flex items-center gap-3 justify-center sm:justify-end shrink-0 pt-2 sm:pt-0">
          <div class="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center  min-w-[90px]">
            <div class="text-xs font-bold text-slate-400 uppercase tracking-wider">Engine</div>
            <div class="text-lg font-mono font-semibold text-blue-600 dark:text-blue-400 mt-0.5">v1.4.3</div>
          </div>
          <div class="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center  min-w-[90px]">
            <div class="text-xs font-bold text-slate-400 uppercase tracking-wider">Fixes</div>
            <div class="text-lg font-mono font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">24+ Done</div>
          </div>
          <div class="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center  min-w-[90px]">
            <div class="text-xs font-bold text-slate-400 uppercase tracking-wider">Status</div>
            <div class="text-lg font-mono font-semibold text-blue-600 dark:text-blue-400 mt-0.5 flex items-center justify-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Active</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Main Container Area -->
    <main class="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-8 space-y-8">
      <!-- ======================================================== -->
      <!-- TAB 1: SYSTEM CHANGELOG & RELEASE ACTIVITIES TIMELINE   -->
      <!-- ======================================================== -->
      <div class="space-y-6 animate-fade-in">
        <!-- Search & Category Filters Bar -->
        <div class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800  space-y-3">
          <div class="flex flex-col sm:flex-row items-center gap-3 justify-between">
            <!-- Search Input -->
            <div class="relative w-full sm:w-80">
              <Search class="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                v-model="changelogSearchQuery"
                type="text"
                placeholder="Search fixes, features, or keywords..."
                class="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 transition"
              />
              <button
                v-if="changelogSearchQuery"
                @click="changelogSearchQuery = ''"
                class="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                title="Clear search"
              >
                <X class="w-3.5 h-3.5" />
              </button>
            </div>

            <!-- Activity Type Filter Chips -->
            <div class="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
              <button
                v-for="type in changeTypes"
                :key="type.id"
                @click="selectedChangeType = type.id"
                class="px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                :class="[
                  selectedChangeType === type.id
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                ]"
              >
                <span>{{ type.label }}</span>
                <span class="opacity-75 font-mono text-[10px]">({{ getChangeTypeCount(type.id) }})</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Timeline Stream -->
        <div class="relative pl-6 sm:pl-8 border-l-2 border-slate-200 dark:border-slate-800 space-y-10 my-4">
          <div
            v-for="(release, rIdx) in filteredChangelog"
            :key="release.version"
            class="relative group"
          >
            <!-- Timeline Pin Indicator Icon -->
            <div
              class="absolute -left-[31px] sm:-left-[39px] top-1.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-transform group-hover:scale-110"
              :class="[
                rIdx === 0
                  ? 'bg-blue-600 border-blue-400 text-white ring-4 ring-blue-500/20'
                  : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-500'
              ]"
            >
              <CheckCircle2 v-if="rIdx === 0" class="w-3.5 h-3.5" />
              <GitCommit v-else class="w-3 h-3" />
            </div>

            <!-- Release Card -->
            <div class="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800   transition-all space-y-4">
              <!-- Top Row: Version, Date, Badge -->
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div class="flex items-center gap-2.5 flex-wrap">
                  <span class="text-base sm:text-lg font-mono font-semibold text-slate-900 dark:text-white">
                    {{ release.version }}
                  </span>
                  <span
                    v-if="release.isCurrent"
                    class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                  >
                    CURRENT STABLE
                  </span>
                  <span class="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    &bull; {{ release.title }}
                  </span>
                </div>

                <div class="flex items-center gap-2 text-xs font-mono text-slate-400 dark:text-slate-500">
                  <Calendar class="w-3.5 h-3.5" />
                  <span>{{ release.date }}</span>
                </div>
              </div>

              <!-- Release Summary Paragraph -->
              <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {{ release.summary }}
              </p>

              <!-- Detailed Changes List -->
              <div class="space-y-2.5 pt-1">
                <div
                  v-for="(item, iIdx) in release.items"
                  :key="iIdx"
                  class="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 space-y-1.5"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div class="flex items-center gap-2 flex-wrap">
                      <!-- Change Classification Badge -->
                      <span
                        class="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-tight uppercase"
                        :class="[
                          item.type === 'bugfix' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-900' :
                          item.type === 'feature' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-900' :
                          item.type === 'ux' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-900' :
                          item.type === 'performance' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-900' :
                          'bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-900'
                        ]"
                      >
                        {{ item.typeLabel || item.type }}
                      </span>

                      <!-- Component Subsystem Tag -->
                      <span class="px-2 py-0.5 rounded text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-200/70 dark:bg-slate-700/60">
                        {{ item.component }}
                      </span>

                      <span class="text-xs font-bold text-slate-800 dark:text-slate-100">
                        {{ item.headline }}
                      </span>
                    </div>

                    <!-- Direct Quick Link / Verification Check -->
                    <Check class="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" title="Verified in Production" />
                  </div>

                  <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-1">
                    {{ item.details }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty Search State -->
          <div
            v-if="filteredChangelog.length === 0"
            class="p-8 text-center rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 space-y-3"
          >
            <Search class="w-8 h-8 text-slate-400 mx-auto" />
            <div class="font-bold text-sm text-slate-700 dark:text-slate-200">No matching activities found</div>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              Try adjusting your query or resetting the category filter.
            </p>
            <button
              @click="resetChangelogFilters"
              class="px-3.5 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

    </main>

    <!-- Footer -->
    <footer class="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-8 px-4 sm:px-8 text-xs text-slate-500 dark:text-slate-400 mt-auto">
      <div class="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-2.5">
          <DbMapLogo class-name="w-5 h-5" />
          <span class="font-mono font-bold text-slate-800 dark:text-slate-100">
            db<span class="text-blue-600 dark:text-blue-400">maps</span>
          </span>
          <span>&bull;</span>
          <span>Release notes</span>
        </div>

        <div class="flex items-center gap-4">
          <button @click="navigateTo('/')" class="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">Home</button>
          <span>&bull;</span>
          <button @click="navigateTo('/app')" class="hover:text-blue-600 dark:hover:text-blue-400 font-semibold cursor-pointer">Studio</button>
          <span>&bull;</span>
          <button @click="navigateTo('/marketplace')" class="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">Marketplace</button>
          <span>&bull;</span>
          <button @click="navigateTo('/privacy-policy')" class="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">Privacy</button>
          <span>&bull;</span>
          <button @click="navigateTo('/terms-of-service')" class="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">Terms</button>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { state, navigateTo, toggleDarkMode } from '../stores/schemaStore.js';
import DbMapLogo from './DbMapLogo.vue';
import {
  GitCommit,
  Bug,
  Search,
  CheckCircle2,
  Check,
  Calendar,
  X,
  FileCode,
  Send,
  Cpu,
  History,
  Home,
  ArrowRight,
  Sun,
  Moon,
  Sparkles,
  Lock,
  Unlock,
  LogIn,
  LogOut,
  ShieldAlert,
  ShieldCheck,
  UserCheck
} from 'lucide-vue-next';

const changelogSearchQuery = ref('');
const selectedChangeType = ref('all');
const changeTypes = [
  { id: 'all', label: 'All Activities' },
  { id: 'bugfix', label: 'Bug Fixes' },
  { id: 'ux', label: 'UI / UX Ergonomics' },
  { id: 'feature', label: 'Core Features' },
  { id: 'architecture', label: 'Architecture' }
];

// Technical System Release Activities Log
const changelogReleases = ref([
  {
    version: 'v1.5.0',
    title: 'Academic & HD Diagram Exporter (JPG, PNG, PDF & SVG)',
    date: 'October 14, 2026',
    isCurrent: true,
    summary: 'Export schema diagrams as HD versions of JPG, PNG, PDF, and SVG with customizable 300 DPI print scaling, academic report headers, live previews, and instant clipboard copying for Computer Science reports.',
    items: [
      {
        type: 'feature',
        typeLabel: 'Academic Export',
        component: 'High-Definition Visual Diagram Exporter',
        headline: 'Multi-Format HD Diagram Downloads (iss-110)',
        details: 'Added visual schema export supporting HD PNG (lossless, 1x/2x/3x scale, up to 600 DPI), HD JPG (optimized for student portal size limits), Vector SVG (infinite scalability with pure XML bezier paths), and Academic PDF (A4/Letter page with print-ready margins).'
      },
      {
        type: 'feature',
        typeLabel: 'Academic Formatter',
        component: 'Thesis & Coursework Metadata Header',
        headline: 'Configurable Academic Report Header Banner',
        details: 'Added customizable academic title banner displaying project name, database dialect, generation timestamp, table/relationship count, and custom course/author note (e.g. CS401 Database Systems - Final Project ERD).'
      },
      {
        type: 'feature',
        typeLabel: 'Productivity',
        component: 'Clipboard & Quick Actions',
        headline: 'One-Click Image Copy to Clipboard & Canvas Toolbar Access',
        details: 'Added Copy Image to Clipboard for instant pasting into Microsoft Word, Google Docs, and Overleaf LaTeX without downloading files, plus quick-download buttons and a dedicated Export Diagram shortcut on the canvas toolbar.'
      }
    ]
  },
  {
    version: 'v1.4.6',
    title: 'Google SSO Popup Concurrency Guard & Error Suppression',
    date: 'October 14, 2026',
    isCurrent: false,
    summary: 'Resolved auth/cancelled-popup-request and premature cloud sync by adding concurrency locking, reactive loading indicators, and graceful suppression of intentional popup cancellations.',
    items: [
      {
        type: 'bugfix',
        typeLabel: 'Auth Concurrency',
        component: 'Google SSO Authentication Flow',
        headline: 'Button Debounce & Concurrency Guard (iss-109)',
        details: 'Added isAuthOperationInProgress lock and state.isLoggingIn across all sign-in triggers (AuthModal, Navbar, LandingPage, AiGenModal, ChangelogPage). Buttons now disable with an animated spinner while the popup is opening, preventing accidental double-clicks from cancelling the auth flow.'
      },
      {
        type: 'bugfix',
        typeLabel: 'Error Resilience',
        component: 'Firebase Auth Error Handler',
        headline: 'Silent Handling of Benign Cancellation Events',
        details: 'Suppressed auth/cancelled-popup-request and auth/popup-closed-by-user from triggering error toast notifications and console errors. Closing or superseding the popup is recognized as standard user navigation rather than an application defect.'
      },
      {
        type: 'bugfix',
        typeLabel: 'Session Handshake',
        component: 'Cloud Firestore Synchronization',
        headline: 'Decoupled Remote Sync from Initial SSO Callback',
        details: 'Removed premature syncActiveProjectToFirestore from loginWithGoogle, delegating cloud project synchronization exclusively to the onAuthStateChanged observer once user credentials and projects are fully resolved.'
      }
    ]
  },
  {
    version: 'v1.4.5',
    title: 'Post-Login Sample Auto-Sync Guard & Cloud Database Isolation',
    date: 'October 14, 2026',
    isCurrent: false,
    summary: 'Prevented Firestore permission-denied error on projects/proj-1 after Google sign in by guarding static sample blueprints from remote sync and auto-forking user mutations into unique cloud projects.',
    items: [
      {
        type: 'bugfix',
        typeLabel: 'Cloud Sync Security',
        component: 'Cloud Firestore Real-Time Sync',
        headline: 'Guarded Static Sample Schemas (proj-1, proj-2) Against Firestore Overwrite',
        details: 'Added isSampleProjectId verification across syncActiveProjectToFirestore, flushActiveProjectSync, and selectProject. Pristine sample templates are preserved locally in browser memory and never written to Firestore under hardcoded sample document IDs.'
      },
      {
        type: 'feature',
        typeLabel: 'Cloud Isolation',
        component: 'Project Ownership & Forking',
        headline: 'Copy-on-Write Auto-Forking for Modified Sample Blueprints',
        details: 'When an authenticated developer edits a sample database schema, the engine automatically forks it into a fresh, unique user-owned project ID (proj-xxx) with valid ownerUid, guaranteeing seamless cloud auto-save without permission rejections.'
      },
      {
        type: 'bugfix',
        typeLabel: 'Session Transition',
        component: 'Workspace State Manager',
        headline: 'Fixed Post-Login Active Project Switching Flush Trigger',
        details: 'Resolved activeProjectId watcher edge case where transitioning from guest sample schema to the user authenticated cloud database inadvertently attempted to flush the prior sample project ID to Firestore.'
      }
    ]
  },
  {
    version: 'v1.4.4',
    title: 'Sign Out Session Integrity, Firestore Guest Guard & Sandbox WebSocket Fixes',
    date: 'October 11, 2026',
    isCurrent: false,
    summary: 'Resolved sign out exception caused by undefined presence tracking cleanup, guarded Firestore writes against guest permission errors, and silenced sandbox iframe Vite HMR WebSocket transport warnings.',
    items: [
      {
        type: 'bugfix',
        typeLabel: 'Core Defect Resolution',
        component: 'Auth & Session Subsystem',
        headline: 'Fixed "stopPresenceTracking is not defined" Exception on Sign Out',
        details: 'Fixed unhandled ReferenceError during user sign out by properly declaring and exporting stopPresenceTracking in schemaStore.js, allowing clean session termination, active room presence unbinding, and instant transition to guest mode without runtime errors.'
      },
      {
        type: 'bugfix',
        typeLabel: 'Cloud Sync Security',
        component: 'Cloud Firestore Real-Time Sync',
        headline: 'Guarded Firestore Auto-Sync Against Guest Permission Rejections',
        details: 'Added guest authentication check in syncActiveProjectToFirestore to safely cache schemas (such as proj-1) to browser localStorage instead of initiating unauthenticated Firestore writes that trigger Missing or insufficient permissions errors.'
      },
      {
        type: 'bugfix',
        typeLabel: 'Development Runtime',
        component: 'Vite / Dev Server',
        headline: 'Disabled Vite HMR WebSocket in Reverse Proxy Sandbox',
        details: 'Configured hmr: false in both server.js and vite.config.ts and added window-level error suppression in index.html to eliminate benign @vite/client WebSocket transport failures in cloud container iframe environments.'
      }
    ]
  },
  {
    version: 'v1.4.3',
    title: 'Sidebar Quick-Filter Ergonomics & Space Optimization',
    date: 'September 25, 2026',
    isCurrent: false,
    summary: 'Refactored the sidebar database quick-filter subsystem to a streamlined, space-efficient micro-pill presentation, recovering over 80% vertical real estate for schema tables.',
    items: [
      {
        type: 'ux',
        typeLabel: 'UI / UX Ergonomics',
        component: 'Sidebar / Filters',
        headline: 'Compact Filter Micro-Pills (<24px Height)',
        details: 'Replaced multi-level filter cards with high-density wrapped micro-pills, retaining high-contrast active states and instant inline reset controls.'
      },
      {
        type: 'bugfix',
        typeLabel: 'Defect Resolution',
        component: 'Sidebar / Search',
        headline: 'Integrated Quick-Clear [X] Action Triggers',
        details: 'Added one-click clear buttons to both Explorer database search and Tables field search inputs, avoiding manual backspacing.'
      },
      {
        type: 'ux',
        typeLabel: 'Usability',
        component: 'Explorer Tree',
        headline: 'Automated Folder Expansion on Filter Click',
        details: 'Selecting a database filter pill automatically expands that target cluster, immediately revealing its constituent schemas and tables.'
      }
    ]
  },
  {
    version: 'v1.4.2',
    title: 'Database Group Drag-and-Drop & Cross-Cluster Schema Migration',
    date: 'September 24, 2026',
    isCurrent: false,
    summary: 'Resolved mouse click lockups on database group headers and delivered complete drag-and-drop support for reordering schemas within and across database groups.',
    items: [
      {
        type: 'bugfix',
        typeLabel: 'Core Bug Fix',
        component: 'Drag & Drop Subsystem',
        headline: 'Resolution of Accidental Drag Initiation on Click',
        details: 'Decoupled draggable attributes from group accordion parent containers into dedicated GripVertical handles with explicit cursor: grab and grabbing styling, resolving accidental dimming lockups.'
      },
      {
        type: 'feature',
        typeLabel: 'Core Feature',
        component: 'Schema Reordering',
        headline: 'In-Folder Schema Reordering with Drop Indicators',
        details: 'Users can drag schema cards above or below peer schemas within the same database group with animated insertion indicator bars.'
      },
      {
        type: 'feature',
        typeLabel: 'Core Feature',
        component: 'Database Hierarchy',
        headline: 'Cross-Database Schema Migration Dragging',
        details: 'Dragging a schema card onto a different database group auto-highlights the target, expands it, and reassigns the schema folderId.'
      },
      {
        type: 'architecture',
        typeLabel: 'Fault Tolerance',
        component: 'Window Event Bus',
        headline: 'Global Escape Key & Mouseup Cleanup Listeners',
        details: 'Ensured unexpected drag interrupts (window blur, ESC key, or out-of-bounds release) reset reactive drag states completely.'
      }
    ]
  },
  {
    version: 'v1.4.1',
    title: 'Sidebar Filter Visibility & Responsive Multi-Row Wrapping',
    date: 'September 24, 2026',
    isCurrent: false,
    summary: 'Eliminated hidden horizontal scrollbars on desktop sidebar filters, allowing instantaneous visibility and clickability across all database clusters.',
    items: [
      {
        type: 'bugfix',
        typeLabel: 'UI Defect Fix',
        component: 'Sidebar',
        headline: 'Replacement of Overflow Scroll with Responsive Wrap',
        details: 'Eliminated hidden horizontal scrollbars (no-scrollbar) that caused 3rd+ database clusters to become inaccessible on non-trackpad mouse setups.'
      },
      {
        type: 'ux',
        typeLabel: 'Visibility',
        component: 'Filters',
        headline: 'Active State Contrast & Schema Counter Badges',
        details: 'Added distinct amber and blue badge states with embedded item counts and clear deselection triggers.'
      }
    ]
  },
  {
    version: 'v1.4.0',
    title: 'Hierarchical Multi-Database Groups & Cluster Management',
    date: 'September 20, 2026',
    isCurrent: false,
    summary: 'Architectural expansion from single-schema lists to multi-database hierarchical groupings with inline renaming and safe deletion safeguards.',
    items: [
      {
        type: 'feature',
        typeLabel: 'Major Feature',
        component: 'Database Hierarchy',
        headline: 'Multi-Database Cluster Organization',
        details: 'Group interconnected schemas under specific databases (e.g. Primary DB, Analytics DB, Identity Cluster).'
      },
      {
        type: 'architecture',
        typeLabel: 'Data Protection',
        component: 'State Engine',
        headline: 'Safe Deletion Schema Fallback Mechanism',
        details: 'Deleting a database cluster reassigns its contained schemas to the default primary cluster rather than destroying project schemas.'
      },
      {
        type: 'ux',
        typeLabel: 'Ergonomics',
        component: 'Sidebar',
        headline: 'Inline Database Renaming with Keyboard Shortcuts',
        details: 'Double-click or menu-trigger inline renaming with Enter (save) and Esc (cancel) support.'
      }
    ]
  },
  {
    version: 'v1.3.0',
    title: 'Bidirectional DBML / Canvas Sync & Relationship Cardinality Engine',
    date: 'September 15, 2026',
    isCurrent: false,
    summary: 'Zero-latency bidirectional synchronization between visual ERD canvas nodes and the CodeMirror DBML syntax editor.',
    items: [
      {
        type: 'feature',
        typeLabel: 'Core Engine',
        component: 'ERD Canvas',
        headline: 'Interactive Foreign Key Cardinality Connectors',
        details: 'Support for 1:1, 1:N, and N:M cardinality connector curves, with mandatory (>) and optional (>? nullable) constraint semantics.'
      },
      {
        type: 'architecture',
        typeLabel: 'Editor Sync',
        component: 'DBML Engine',
        headline: 'Real-Time Bidirectional CodeMirror Sync',
        details: 'Visual canvas changes write clean DBML code, and DBML code changes update table coordinates and schema models without flickering.'
      }
    ]
  },
  {
    version: 'v1.2.0',
    title: 'Cloud Firestore Real-Time Collaboration & Guest State Fallback',
    date: 'September 5, 2026',
    isCurrent: false,
    summary: 'Enterprise cloud sync with multi-user presence indicators alongside offline-first local storage fallback.',
    items: [
      {
        type: 'feature',
        typeLabel: 'Collaboration',
        component: 'Firestore Engine',
        headline: 'Real-Time Multi-User Cursor & Schema Sync',
        details: 'Live collaborator indicators, team permissions (Public, Password, Invite-only), and version snapshots.'
      },
      {
        type: 'architecture',
        typeLabel: 'Persistence',
        component: 'Storage Engine',
        headline: 'Zero-Loss Guest Session Cloud Migration',
        details: 'Guest models persist locally and automatically migrate to Cloud Firestore upon Google SSO authentication.'
      }
    ]
  },
  {
    version: 'v1.1.0',
    title: 'Multi-Dialect SQL DDL Importer & Multi-Format Exporter',
    date: 'August 25, 2026',
    isCurrent: false,
    summary: 'Zero-dependency client-side AST parser for importing SQL DDL from PostgreSQL, MySQL, SQLite, and MS SQL.',
    items: [
      {
        type: 'feature',
        typeLabel: 'Core Feature',
        component: 'SQL Importer',
        headline: 'Multi-Dialect DDL Parsing Engine',
        details: 'Parses complex CREATE TABLE DDL, composite primary keys, check constraints, and foreign key relations.'
      },
      {
        type: 'feature',
        typeLabel: 'Export Suite',
        component: 'Export Subsystem',
        headline: 'Vector SVG, PNG, PDF & Living Data Dictionary',
        details: 'Export full SQL scripts, DBML files, high-res diagrams, and living searchable data dictionary sites.'
      }
    ]
  },
  {
    version: 'v1.0.0',
    title: 'dbmaps General Availability (GA) Platform Launch',
    date: 'August 10, 2026',
    isCurrent: false,
    summary: 'Initial general availability release of the collaborative visual database schema modeler.',
    items: [
      {
        type: 'feature',
        typeLabel: 'Platform Launch',
        component: 'Core Platform',
        headline: 'Visual Canvas & Presto AI Assistant Launch',
        details: 'Infinite pan-zoom canvas, minimap, Presto AI Gemini schema generation, and Community Blueprint Marketplace.'
      }
    ]
  }
]);

// Community Reported Issues & Resolution Queue
const filteredChangelog = computed(() => {
  let list = changelogReleases.value;
  if (selectedChangeType.value !== 'all') {
    list = list.filter(rel => {
      return rel.items.some(item => item.type === selectedChangeType.value);
    });
  }

  if (!changelogSearchQuery.value.trim()) return list;

  const q = changelogSearchQuery.value.toLowerCase().trim();
  return list.filter(rel => {
    const matchVer = rel.version.toLowerCase().includes(q);
    const matchTitle = rel.title.toLowerCase().includes(q);
    const matchSum = rel.summary.toLowerCase().includes(q);
    const matchItems = rel.items.some(it => {
      return (
        it.headline.toLowerCase().includes(q) ||
        it.details.toLowerCase().includes(q) ||
        it.component.toLowerCase().includes(q)
      );
    });
    return matchVer || matchTitle || matchSum || matchItems;
  });
});

function getChangeTypeCount(typeId) {
  if (typeId === 'all') return changelogReleases.value.length;
  return changelogReleases.value.filter(rel => rel.items.some(i => i.type === typeId)).length;
}

function resetChangelogFilters() {
  changelogSearchQuery.value = '';
  selectedChangeType.value = 'all';
}

// Issue Submission Handler
</script>
