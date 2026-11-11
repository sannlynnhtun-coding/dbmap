<template>
  <!-- Fullscreen UX Loading Animation Overlay -->
  <LoadingScreen />

  <!-- Privacy Policy & Terms of Service Dedicated View (/privacy-policy, /terms-of-service) -->
  <LegalPage v-if="isLegalRoute" />

  <!-- Learn DBML Dedicated Guide & Cheatsheet View (/learn-dbml, /learn, /dbml) -->
  <LearnDbmlPage v-else-if="isLearnDbmlRoute" />


  <!-- Changelog & Issue Tracker Dedicated View (/changelog, /issues, /updates, /releases) -->
  <ChangelogPage v-else-if="isChangelogRoute" />

  <StudioStartPage v-else-if="isStudioRoute && state.showStartPage && !isDesktop" />

  <!-- Full ERD Studio Workspace (/app, /studio, /workspace) -->
  <div v-else-if="isStudioRoute" :inert="isDesktop && desktop.busy" class="studio-shell w-screen h-dvh overflow-hidden flex flex-col bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans select-none" :class="{ 'cursor-col-resize select-none': isResizing }">
    <!-- Navbar -->
    <Navbar />
    <DesktopFileBar />

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

  </div>

  <!-- Landing Page as Home Page (Default for '/', '/features', '/landing', '/about') -->
  <LandingPage v-else />

  <!-- Global Application Modals (Accessible everywhere: Home, Studio, Marketplace, Learn, Legal) -->
  <BackupImportModal />
  <!-- Shared dialogs are also available from the start page. -->
  <OnboardingTour v-if="isStudioRoute && !state.showStartPage" />
  <ExportModal />
  <ImportModal />
  <NewTableModal />
  <NewRelModal />
  <NewProjectModal />
  <NewFolderModal />
  <VersionModal />
  <DocsModal />


</template>

<script setup>
import StudioStartPage from './components/StudioStartPage.vue';
import BackupImportModal from './components/BackupImportModal.vue';
import DesktopFileBar from './components/DesktopFileBar.vue';
import { desktop, isDesktop } from './desktop.js';
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { mountToaster, toast } from '@yusufceng1z/ding';
import { 
  state, 
  addToast, 
  loadLocalProjectFromUrl,
  finishInitialLoading,
  finishStudioLoading,
  waitForStudioDataReady,
  navigateTo
} from './stores/schemaStore.js';
import Navbar from './components/Navbar.vue';
import Sidebar from './components/Sidebar.vue';
import CodeEditor from './components/CodeEditor.vue';
import Canvas from './components/Canvas.vue';
import OnboardingTour from './components/OnboardingTour.vue';
import ExportModal from './components/ExportModal.vue';
import ImportModal from './components/ImportModal.vue';
import NewTableModal from './components/NewTableModal.vue';
import NewRelModal from './components/NewRelModal.vue';
import NewProjectModal from './components/NewProjectModal.vue';
import NewFolderModal from './components/NewFolderModal.vue';
import VersionModal from './components/VersionModal.vue';
import DocsModal from './components/DocsModal.vue';
import LegalPage from './components/LegalPage.vue';
import LearnDbmlPage from './components/LearnDbmlPage.vue';
import ChangelogPage from './components/ChangelogPage.vue';
import LandingPage from './components/LandingPage.vue';
import LoadingScreen from './components/LoadingScreen.vue';


const isLegalRoute = computed(() => {
  return state.currentRoute === '/privacy-policy' || state.currentRoute === '/terms-of-service';
});

const isLearnDbmlRoute = computed(() => {
  return state.currentRoute === '/learn-dbml' || state.currentRoute === '/learn' || state.currentRoute === '/dbml';
});


const isChangelogRoute = computed(() => {
  const r = (state.currentRoute || '').toLowerCase();
  return r === '/changelog' || r === '/issues' || r === '/updates' || r === '/releases';
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
    state.currentRoute = '/app';
    loadLocalProjectFromUrl();
  } else if (path === '/privacy-policy' || path === '/terms-of-service') {
    state.currentRoute = path;
  } else if (path === '/learn-dbml' || path === '/learn' || path === '/dbml' || isLearnQuery) {
    state.currentRoute = '/learn-dbml';
  } else if (path === '/marketplace' || path === '/templates' || isMarketplaceQuery) {
    state.currentRoute = '/app';
    state.showStartPage = true;
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

let unmountToaster;
onMounted(() => {
  unmountToaster = mountToaster({
    position: 'bottom-right',
    theme: state.isDarkMode ? 'dark' : 'light'
  });
});
watch(() => state.isDarkMode, dark => {
  toast.configure({ theme: dark ? 'dark' : 'light' });
});
onUnmounted(() => unmountToaster?.());

onMounted(async () => {
  adaptWorkspace();
  compactWorkspace.addEventListener('change', adaptWorkspace);
  const urlParams = new URLSearchParams(window.location.search);
  const schemaParam = urlParams.get('schema') || urlParams.get('project') || urlParams.get('share');
  const isAppQuery = urlParams.get('app') === '1' || urlParams.get('studio') === '1';

  // Route initialization:
  // If explicitly requesting studio (/app, /studio, shared schema, payment callback, etc.)
  if (
    window.location.pathname.startsWith('/app') ||
    window.location.pathname.startsWith('/studio') ||
    window.location.pathname.startsWith('/workspace') ||
    window.location.pathname.startsWith('/editor') ||
    schemaParam ||
    isAppQuery ||
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
    state.currentRoute = '/app';
    state.showStartPage = true;
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

  // Reopen a project from this browser.
  loadLocalProjectFromUrl();

  if (isStudioRoute.value && !state.showStartPage) {
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
