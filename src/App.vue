<template>
  <!-- Fullscreen UX Loading Animation Overlay -->
  <LoadingScreen />

  <!-- Read-only Standalone Published dbdictionary View -->
  <PublishedDictionaryView v-if="publishedDictId" :dictionary-id="publishedDictId" />

  <!-- Privacy Policy & Terms of Service Dedicated View (/privacy-policy, /terms-of-service) -->
  <LegalPage v-else-if="isLegalRoute" />

  <!-- Learn DBML Dedicated Guide & Cheatsheet View (/learn-dbml, /learn, /dbml) -->
  <LearnDbmlPage v-else-if="isLearnDbmlRoute" />

  <!-- Marketplace & Community Templates Dedicated View (/marketplace, /templates) -->
  <MarketplacePage v-else-if="isMarketplaceRoute" />

  <!-- Changelog & Issue Tracker Dedicated View (/changelog, /issues, /updates, /releases) -->
  <ChangelogPage v-else-if="isChangelogRoute" />

  <!-- Admin Dedicated Page (/admin) -->
  <AdminPage v-else-if="isAdminRoute" />

  <!-- Full ERD Studio Workspace (/app, /studio, /workspace) -->
  <div v-else-if="isStudioRoute" class="studio-shell w-screen h-dvh overflow-hidden flex flex-col bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans select-none" :class="{ 'cursor-col-resize select-none': isResizing }">
    <!-- Navbar -->
    <Navbar />

    <!-- Cloud Firestore Setup / Status Notice Banner -->
    <div
      v-if="state.firestoreErrorNotice"
      class="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-medium flex items-center justify-between gap-3 shrink-0 shadow-sm border-b border-amber-600/30 z-30"
    >
      <div class="flex items-center gap-2 overflow-hidden">
        <AlertTriangle class="w-4 h-4 shrink-0 text-slate-950" />
        <span class="truncate">
          <strong>Database Action Required:</strong> Cloud Firestore API is not yet enabled in your Firebase project <code>dbmaps-13772</code>. Edits are saved locally in browser.
        </span>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <a
          :href="state.firestoreErrorNotice.url"
          target="_blank"
          rel="noopener noreferrer"
          class="px-2.5 py-1 bg-slate-950 text-white hover:bg-slate-900 rounded-lg text-[11px] font-bold flex items-center gap-1 transition shadow-xs"
        >
          <span>Enable Firestore API</span>
          <ExternalLink class="w-3 h-3" />
        </a>
        <a
          :href="state.firestoreErrorNotice.consoleUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="px-2.5 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition shadow-xs"
        >
          <span>Firebase Console</span>
          <ExternalLink class="w-3 h-3" />
        </a>
        <button
          @click="state.firestoreErrorNotice = null"
          class="p-1 hover:bg-amber-600/40 rounded text-slate-950 transition cursor-pointer"
          title="Dismiss notification"
        >
          <X class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    <!-- Main Workspace Layout -->
    <div class="studio-workspace flex-1 flex overflow-hidden relative">
      <!-- Left Sidebar (Tables, Relationships, Folders, History, Settings) -->
      <button v-if="!state.isSidebarCollapsed" class="sidebar-scrim" aria-label="Close navigation" @click="state.isSidebarCollapsed = true"></button>
      <Sidebar />

      <!-- Center Workspace (Split / Canvas / Editor Views) -->
      <main class="flex-1 flex overflow-hidden relative" ref="workspaceRef">
        <!-- Editor View (Shown in 'split' or 'editor' mode) -->
        <div
          v-if="state.viewMode === 'split' || state.viewMode === 'editor'"
          class="h-full flex-shrink-0 relative overflow-hidden"
          :style="state.viewMode === 'split' ? { width: `${state.editorWidth}px` } : { width: '100%' }"
        >
          <CodeEditor />
        </div>

        <!-- Draggable Resizer Bar (Shown in 'split' mode) -->
        <div
          v-if="state.viewMode === 'split'"
          @mousedown="startResize"
          @touchstart="startResize"
          class="w-2 hover:w-2 bg-slate-300 dark:bg-slate-800/90 hover:bg-blue-500 active:bg-blue-600 cursor-col-resize flex items-center justify-center transition-colors select-none z-20 group relative border-x border-slate-300/80 dark:border-slate-800"
          title="Drag handle to adjust split editor & canvas width"
        >
          <div class="w-1 h-8 rounded-full bg-slate-400 dark:bg-slate-600 group-hover:bg-white group-active:bg-white transition-colors"></div>
        </div>

        <!-- ERD Canvas View (Shown in 'split' or 'canvas' mode) -->
        <div
          v-if="state.viewMode === 'split' || state.viewMode === 'canvas'"
          class="flex-1 h-full relative overflow-hidden min-w-[280px]"
        >
          <Canvas />
        </div>
      </main>
    </div>

    <!-- Studio-Specific Modals & Guided Walkthrough Tour -->
    <OnboardingTour />
    <ExportModal />
    <ImportModal />
    <ShareModal />
    <NewTableModal />
    <NewRelModal />
    <NewProjectModal />
    <NewFolderModal />
    <VersionModal />
    <DocsModal />
  </div>

  <!-- Landing Page as Home Page (Default for '/', '/features', '/landing', '/about') -->
  <LandingPage v-else />

  <!-- Global Application Modals (Accessible everywhere: Home, Studio, Marketplace, Learn, Legal) -->
  <AuthModal />
  <AiGenModal />
  <BillingModal v-if="isUpgradeCreditsEnabled" />
  <AdminDashboardModal />
  <MarketplaceModal />
  <SubmitToMarketplaceModal />
  <AccessRestrictedModal />

  <!-- Global Toast Notifications Floating Stack -->
  <div class="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm">
    <div
      v-for="toast in state.toasts"
      :key="toast.id"
      class="p-3.5 rounded-xl shadow-xl border backdrop-blur-md text-xs pointer-events-auto flex items-start gap-2.5 transition-all duration-300"
      :class="[
        toast.type === 'success' ? 'bg-emerald-900/90 text-emerald-100 border-emerald-700' :
        toast.type === 'warning' ? 'bg-amber-900/90 text-amber-100 border-amber-700' :
        toast.type === 'error' ? 'bg-red-900/90 text-red-100 border-red-700' :
        'bg-slate-900/90 text-slate-100 border-slate-700'
      ]"
    >
      <div class="flex-1">
        <div class="font-bold text-sm">{{ toast.title }}</div>
        <div class="opacity-90 leading-relaxed mt-0.5">{{ toast.message }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { 
  state, 
  fetchUserProfile, 
  addToast, 
  verifyTallySalePayment, 
  loadSharedSchemaFromUrl, 
  isUpgradeCreditsEnabled, 
  finishInitialLoading,
  finishStudioLoading,
  waitForStudioDataReady,
  navigateTo
} from './stores/schemaStore.js';
import { CheckCircle2, AlertTriangle, ExternalLink, X } from 'lucide-vue-next';
import Navbar from './components/Navbar.vue';
import Sidebar from './components/Sidebar.vue';
import CodeEditor from './components/CodeEditor.vue';
import Canvas from './components/Canvas.vue';
import OnboardingTour from './components/OnboardingTour.vue';
import ExportModal from './components/ExportModal.vue';
import ImportModal from './components/ImportModal.vue';
import ShareModal from './components/ShareModal.vue';
import AccessRestrictedModal from './components/AccessRestrictedModal.vue';
import AuthModal from './components/AuthModal.vue';
import NewTableModal from './components/NewTableModal.vue';
import NewRelModal from './components/NewRelModal.vue';
import NewProjectModal from './components/NewProjectModal.vue';
import NewFolderModal from './components/NewFolderModal.vue';
import VersionModal from './components/VersionModal.vue';
import DocsModal from './components/DocsModal.vue';
import AiGenModal from './components/AiGenModal.vue';
import BillingModal from './components/BillingModal.vue';
import AdminDashboardModal from './components/AdminDashboardModal.vue';
import PublishedDictionaryView from './components/PublishedDictionaryView.vue';
import LegalPage from './components/LegalPage.vue';
import LearnDbmlPage from './components/LearnDbmlPage.vue';
import MarketplacePage from './components/MarketplacePage.vue';
import ChangelogPage from './components/ChangelogPage.vue';
import AdminPage from './components/AdminPage.vue';
import MarketplaceModal from './components/MarketplaceModal.vue';
import SubmitToMarketplaceModal from './components/SubmitToMarketplaceModal.vue';
import LandingPage from './components/LandingPage.vue';
import LoadingScreen from './components/LoadingScreen.vue';

const showPaymentSuccessModal = ref(false);

const isLegalRoute = computed(() => {
  return state.currentRoute === '/privacy-policy' || state.currentRoute === '/terms-of-service';
});

const isLearnDbmlRoute = computed(() => {
  return state.currentRoute === '/learn-dbml' || state.currentRoute === '/learn' || state.currentRoute === '/dbml';
});

const isMarketplaceRoute = computed(() => {
  const r = (state.currentRoute || '').toLowerCase();
  return r === '/marketplace' || r === '/templates';
});

const isChangelogRoute = computed(() => {
  const r = (state.currentRoute || '').toLowerCase();
  return r === '/changelog' || r === '/issues' || r === '/updates' || r === '/releases';
});

const isAdminRoute = computed(() => {
  const r = (state.currentRoute || '').toLowerCase();
  return r === '/admin' || r.startsWith('/admin/') || r.startsWith('/admin?');
});

const isStudioRoute = computed(() => {
  const r = (state.currentRoute || '').toLowerCase();
  return r === '/app' || r === '/studio' || r === '/workspace' || r === '/editor';
});

const handlePopState = () => {
  const path = window.location.pathname || '/';
  const urlParams = new URLSearchParams(window.location.search);
  const schemaParam = urlParams.get('schema') || urlParams.get('project') || urlParams.get('room') || urlParams.get('id') || urlParams.get('share');
  const isAppQuery = urlParams.get('app') === '1' || urlParams.get('studio') === '1';
  const isLearnQuery = urlParams.get('learn') === 'dbml';
  const isMarketplaceQuery = urlParams.get('marketplace') === '1' || urlParams.get('templates') === '1';

  if (
    path.startsWith('/app') ||
    path.startsWith('/studio') ||
    path.startsWith('/workspace') ||
    path.startsWith('/editor') ||
    schemaParam ||
    isAppQuery ||
    window.location.hash === '#studio' ||
    window.location.hash === '#app'
  ) {
    navigateTo('/app');
  } else if (path === '/admin' || path.startsWith('/admin') || window.location.hash === '#admin') {
    state.currentRoute = '/admin';
  } else if (path === '/privacy-policy' || path === '/terms-of-service') {
    state.currentRoute = path;
  } else if (path === '/learn-dbml' || path === '/learn' || path === '/dbml' || isLearnQuery) {
    state.currentRoute = '/learn-dbml';
  } else if (path === '/marketplace' || path === '/templates' || isMarketplaceQuery) {
    state.currentRoute = '/marketplace';
  } else if (path === '/changelog' || path === '/issues' || path === '/updates' || path === '/releases' || window.location.hash === '#changelog' || window.location.hash === '#issues') {
    state.currentRoute = '/changelog';
  } else {
    state.currentRoute = '/';
  }
};

const compactWorkspace = window.matchMedia('(max-width: 1023px)');
function adaptWorkspace() {
  if (!compactWorkspace.matches) return;
  if (state.viewMode === 'split') state.viewMode = 'canvas';
  state.isSidebarCollapsed = true;
}

onMounted(async () => {
  adaptWorkspace();
  compactWorkspace.addEventListener('change', adaptWorkspace);
  const urlParams = new URLSearchParams(window.location.search);
  const paidParam = urlParams.get('paid');
  const pgwPayload = urlParams.get('payload');
  const pgwCheckSum = urlParams.get('checkSum');
  const pgwMerchOrderId = urlParams.get('merchOrderId');
  const schemaParam = urlParams.get('schema') || urlParams.get('project') || urlParams.get('share');
  const isAppQuery = urlParams.get('app') === '1' || urlParams.get('studio') === '1';

  // Handle AYA PGW payment callback
  if (pgwPayload && pgwCheckSum && pgwMerchOrderId) {
    try {
      await verifyTallySalePayment({
        payload: pgwPayload,
        checkSum: pgwCheckSum,
        merchOrderId: pgwMerchOrderId
      });
      showPaymentSuccessModal.value = true;
      await fetchUserProfile();
      window.history.replaceState(null, '', window.location.pathname);
    } catch (e) {
      console.warn('PGW callback verification error:', e);
    }
  } else if (paidParam === '1' || window.location.hash === '#billing-success') {
    showPaymentSuccessModal.value = true;
    addToast('Payment Verified!', 'Your TallySale payment was confirmed. Pro Tier unlocked!', 'success');
    await fetchUserProfile();
    window.history.replaceState(null, '', window.location.pathname);
  } else if (window.location.hash === '#billing-pending') {
    addToast('Payment Processing', 'Your payment is pending confirmation on TallySale.', 'info');
    await fetchUserProfile();
    window.history.replaceState(null, '', window.location.pathname);
  }

  // Route initialization:
  // If explicitly requesting studio (/app, /studio, shared schema, payment callback, etc.)
  if (
    window.location.pathname.startsWith('/app') ||
    window.location.pathname.startsWith('/studio') ||
    window.location.pathname.startsWith('/workspace') ||
    window.location.pathname.startsWith('/editor') ||
    schemaParam ||
    isAppQuery ||
    paidParam ||
    pgwPayload ||
    window.location.hash.startsWith('#billing-') ||
    window.location.hash === '#studio' ||
    window.location.hash === '#app'
  ) {
    state.currentRoute = '/app';
  } else if (
    window.location.pathname === '/privacy-policy' ||
    window.location.pathname === '/terms-of-service'
  ) {
    state.currentRoute = window.location.pathname;
  } else if (
    window.location.pathname === '/learn-dbml' ||
    window.location.pathname === '/learn' ||
    window.location.pathname === '/dbml' ||
    urlParams.get('learn') === 'dbml'
  ) {
    state.currentRoute = '/learn-dbml';
  } else if (
    window.location.pathname === '/marketplace' ||
    window.location.pathname === '/templates' ||
    urlParams.get('marketplace') === '1' ||
    urlParams.get('templates') === '1'
  ) {
    state.currentRoute = '/marketplace';
  } else if (
    window.location.pathname === '/changelog' ||
    window.location.pathname === '/issues' ||
    window.location.pathname === '/updates' ||
    window.location.pathname === '/releases' ||
    urlParams.get('changelog') === '1' ||
    urlParams.get('issues') === '1' ||
    window.location.hash === '#changelog' ||
    window.location.hash === '#issues'
  ) {
    state.currentRoute = '/changelog';
  } else {
    // Default home page is the Landing Page!
    state.currentRoute = '/';
  }

  // Load shared schema if URL parameter or hash is provided
  await loadSharedSchemaFromUrl();

  if (isStudioRoute.value) {
    state.initialLoadingStage = 'Loading tables & schema models...';
    state.initialLoadingProgress = 55;
    await waitForStudioDataReady(5000);
    state.initialLoadingProgress = 90;
    state.initialLoadingStage = 'Rendering canvas & editor...';
    await new Promise(r => setTimeout(r, 220));
    finishStudioLoading(250);
  } else {
    finishInitialLoading(80);
  }

  // Listen to browser forward/back buttons for URL routing
  window.addEventListener('popstate', handlePopState);
});

const urlParams = new URLSearchParams(window.location.search);
const publishedDictId = ref(
  urlParams.get('dbdictionary') || urlParams.get('dictionary') || urlParams.get('doc')
);

const workspaceRef = ref(null);
const isResizing = ref(false);

function startResize(e) {
  isResizing.value = true;
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', stopResize);
  document.addEventListener('touchmove', handleTouchMove);
  document.addEventListener('touchend', stopResize);
}

function handleMouseMove(e) {
  if (!isResizing.value || !workspaceRef.value) return;
  const rect = workspaceRef.value.getBoundingClientRect();
  const newWidth = e.clientX - rect.left;
  const maxW = Math.max(280, rect.width - 280);
  if (newWidth >= 240 && newWidth <= maxW) {
    state.editorWidth = Math.round(newWidth);
  }
}

function handleTouchMove(e) {
  if (!isResizing.value || !workspaceRef.value || !e.touches[0]) return;
  const rect = workspaceRef.value.getBoundingClientRect();
  const newWidth = e.touches[0].clientX - rect.left;
  const maxW = Math.max(280, rect.width - 280);
  if (newWidth >= 240 && newWidth <= maxW) {
    state.editorWidth = Math.round(newWidth);
  }
}

function stopResize() {
  isResizing.value = false;
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', stopResize);
  document.removeEventListener('touchmove', handleTouchMove);
  document.removeEventListener('touchend', stopResize);
}

onUnmounted(() => {
  compactWorkspace.removeEventListener('change', adaptWorkspace);
  stopResize();
  window.removeEventListener('popstate', handlePopState);
});
</script>
