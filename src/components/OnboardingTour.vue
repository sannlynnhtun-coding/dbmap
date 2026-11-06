<template>
  <Teleport to="body">
    <div
      v-if="state.tour.active"
      class="app-auxiliary fixed inset-0 z-[9999] select-none pointer-events-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Product Walkthrough Tour"
    >
      <!-- Darkened SVG Backdrop with Cutout Hole -->
      <svg class="absolute inset-0 w-full h-full pointer-events-none transition-all duration-300">
        <defs>
          <mask id="tour-spotlight-mask">
            <!-- White fills the entire viewport -->
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <!-- Black cuts out the spotlight hole -->
            <rect
              v-if="targetRect && isTargetVisible"
              :x="targetRect.left - padding"
              :y="targetRect.top - padding"
              :width="targetRect.width + padding * 2"
              :height="targetRect.height + padding * 2"
              rx="12"
              ry="12"
              fill="black"
              class="transition-all duration-300 ease-out"
            />
          </mask>
        </defs>
        <!-- Overlay with spotlight cut out -->
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(15, 23, 42, 0.72)"
          mask="url(#tour-spotlight-mask)"
          class="transition-all duration-300"
        />
      </svg>

      <!-- Clickable backdrop to prevent accidental clicks behind spotlight -->
      <div class="absolute inset-0" @click="handleBackdropClick"></div>

      <!-- Pulsing Highlight Ring around the Target Element -->
      <div
        v-if="targetRect && isTargetVisible"
        class="absolute pointer-events-none transition-all duration-300 ease-out z-10 border-2 border-blue-400 dark:border-blue-400 rounded-xl ring-4 ring-blue-500/20 animate-pulse"
        :style="{
          left: `${targetRect.left - padding}px`,
          top: `${targetRect.top - padding}px`,
          width: `${targetRect.width + padding * 2}px`,
          height: `${targetRect.height + padding * 2}px`
        }"
      ></div>

      <!-- Floating Tour Popover Card -->
      <div
        ref="popoverRef"
        class="app-tour-card fixed z-20 w-[92vw] sm:w-[420px] max-w-md bg-white dark:bg-slate-900 border border-blue-200 dark:border-slate-700/80 rounded-2xl  overflow-hidden transition-all duration-300 ease-out flex flex-col text-slate-800 dark:text-slate-100"
        :style="popoverStyle"
      >
        <!-- Top Colored Progress Bar -->
        <div class="w-full h-1.5 bg-slate-100 dark:bg-slate-800">
          <div
            class="h-full     transition-all duration-300 bg-blue-700"
            :style="{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }"
          ></div>
        </div>

        <!-- Card Header -->
        <div class="p-4 sm:p-5 pb-2">
          <div class="flex items-center justify-between gap-2 mb-2">
            <!-- Step Badge & Icon -->
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1.5">
                <Compass class="w-3 h-3 text-blue-600 dark:text-blue-400" />
                <span>Step {{ currentStepIndex + 1 }} of {{ totalSteps }}</span>
              </span>

              <span v-if="currentStep.badge" class="hidden sm:inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {{ currentStep.badge }}
              </span>
            </div>

            <!-- Skip / Close Button -->
            <button
              @click="skipTour"
              class="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Close and exit walkthrough (Esc)"
            >
              <X class="w-4 h-4" />
            </button>
          </div>

          <!-- Title -->
          <h3 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <component :is="currentStep.icon" class="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>{{ currentStep.title }}</span>
          </h3>

          <!-- Description -->
          <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
            {{ currentStep.description }}
          </p>

          <!-- Pro Tip Box (if available) -->
          <div
            v-if="currentStep.tips"
            class="mt-3.5 p-2.5 sm:p-3 bg-blue-50/80 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-900/60 flex items-start gap-2 text-xs text-blue-900 dark:text-blue-200 leading-normal"
          >
            <Lightbulb class="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <span class="font-bold text-[11px] uppercase tracking-wider text-blue-600 dark:text-blue-400 block sm:inline mr-1">
                Pro Tip:
              </span>
              <span>{{ currentStep.tips }}</span>
            </div>
          </div>
        </div>

        <!-- Step Dots Navigation -->
        <div class="px-4 sm:px-5 py-2 flex items-center justify-center gap-1.5">
          <button
            v-for="(_, idx) in tourSteps"
            :key="idx"
            @click="goToStep(idx)"
            :title="`Jump to step ${idx + 1}: ${tourSteps[idx].title}`"
            class="h-1.5 rounded-full transition-all duration-200"
            :class="[
              idx === currentStepIndex
                ? 'w-6 bg-blue-600 dark:bg-blue-400'
                : idx < currentStepIndex
                  ? 'w-2 bg-blue-300 dark:bg-blue-800 hover:bg-blue-400'
                  : 'w-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'
            ]"
          ></button>
        </div>

        <!-- Footer Actions Bar -->
        <div class="p-3 sm:p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
          <!-- Skip Button -->
          <button
            @click="skipTour"
            class="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-medium transition cursor-pointer"
          >
            Skip Tour
          </button>

          <!-- Prev & Next Buttons -->
          <div class="flex items-center gap-2">
            <button
              v-if="currentStepIndex > 0"
              @click="prevTourStep"
              class="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft class="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <button
              @click="nextTourStep"
              class="px-4 py-1.5 rounded-xl      text-white font-bold text-xs  hover:shadow-blue-500/20 transition flex items-center gap-1.5 cursor-pointer bg-blue-700"
            >
              <span>{{ currentStepIndex === totalSteps - 1 ? 'Finish & Start Designing' : 'Next' }}</span>
              <Check v-if="currentStepIndex === totalSteps - 1" class="w-3.5 h-3.5" />
              <ChevronRight v-else class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import {
  state,
  nextTourStep,
  prevTourStep,
  skipTour
} from '../stores/schemaStore.js';
import {
  Compass,
  FolderTree,
  FileCode2,
  LayoutGrid,
  Columns,
  Sparkles,
  Users,
  FolderUp,
  X,
  Check,
  ChevronRight,
  ChevronLeft,
  Lightbulb
} from 'lucide-vue-next';

const padding = 6;
const popoverRef = ref(null);
const targetRect = ref(null);
const isTargetVisible = ref(false);

const tourSteps = [
  {
    id: 'header-project',
    target: '#tour-header-project',
    icon: Columns,
    title: 'Project & Live Cloud Sync',
    badge: 'Workspace',
    description: 'Name your database schema project and monitor real-time sync status. Click directly on the title to rename your project at any time.',
    tips: 'Changes are saved automatically in this browser.',
    preferredPosition: 'bottom'
  },
  {
    id: 'sidebar-structure',
    target: '#tour-sidebar',
    icon: FolderTree,
    title: 'Schema Explorer & Structure',
    badge: 'Navigation',
    description: 'Manage every layer of your database: inspect Tables & Columns, define Relationships (Foreign Keys), organize multi-schema systems into Folders, or restore commit Snapshots.',
    tips: 'Use the quick filter bar to instantly locate specific tables and fields in complex databases.',
    preferredPosition: 'right',
    onEnter: () => {
      state.isSidebarCollapsed = false;
      state.activeTab = 'tables';
    }
  },
  {
    id: 'code-editor',
    target: '#tour-code-editor',
    icon: FileCode2,
    title: 'Declarative DBML Code Editor',
    badge: 'Schema Scripting',
    description: 'Write schemas rapidly using DBML (Database Markup Language). Features instant syntax linting, error diagnostics drawer, and auto-formatting.',
    tips: 'Two-way synchronization: any code changes immediately update the visual diagram, and visual canvas edits update the code!',
    preferredPosition: 'right',
    onEnter: () => {
      state.viewMode = 'split';
    }
  },
  {
    id: 'canvas-diagram',
    target: '#tour-canvas-toolbar',
    icon: LayoutGrid,
    title: 'Interactive ERD Canvas & Tools',
    badge: 'Visual Modeling',
    description: 'Drag and reposition tables freely. Use the top toolbar to Pan canvas, Zoom in/out, switch between Orthogonal and Curved links, or click Auto Arrange to untangle lines automatically.',
    tips: 'Hold Space and click-drag anywhere on the canvas to pan smoothly around large diagrams.',
    preferredPosition: 'bottom',
    onEnter: () => {
      state.viewMode = 'split';
    }
  },
  {
    id: 'view-modes',
    target: '#tour-view-modes',
    icon: Columns,
    title: 'Customizable View Layouts',
    badge: 'Workspace Views',
    description: 'Tailor your workspace to your preferred workflow. Switch between Split View (editor + canvas), Full Canvas (maximum visual diagram space), or Code View (focused DBML scripting).',
    tips: 'In Split View, drag the center vertical divider bar to resize the editor and canvas panes.',
    preferredPosition: 'bottom'
  },
  {
    id: 'actions-export-docs',
    target: '#tour-actions-menu',
    icon: FolderUp,
    title: 'Import, Export & Data Dictionary',
    badge: 'Import & Export',
    description: 'Import existing schemas from MySQL, PostgreSQL, or Microsoft SQL Server (MSSQL) DDL files, or export production-ready SQL and diagrams. You can also generate and publish interactive public Data Dictionaries for your engineering team with one click.',
    tips: 'Easily import SQL files or paste DDL statements directly to visualize existing database architectures in seconds.',
    preferredPosition: 'bottom-left'
  }
];

const totalSteps = computed(() => tourSteps.length);
const currentStepIndex = computed(() => Math.min(Math.max(0, state.tour.step), totalSteps.value - 1));
const currentStep = computed(() => tourSteps[currentStepIndex.value]);

function goToStep(idx) {
  if (idx >= 0 && idx < totalSteps.value) {
    state.tour.step = idx;
  }
}

// Update target element positioning
function updatePosition() {
  if (!state.tour.active) return;
  const step = currentStep.value;
  if (!step) return;

  // Run onEnter hook if provided
  if (typeof step.onEnter === 'function') {
    step.onEnter();
  }

  nextTick(() => {
    const el = document.querySelector(step.target);
    if (el) {
      const rect = el.getBoundingClientRect();
      targetRect.value = {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        bottom: rect.bottom,
        right: rect.right
      };
      isTargetVisible.value = rect.width > 0 && rect.height > 0;
      
      // Scroll into view if offscreen
      if (rect.top < 0 || rect.bottom > window.innerHeight) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      // Fallback: centered modal presentation
      targetRect.value = null;
      isTargetVisible.value = false;
    }
  });
}

// Calculate popover coordinates based on target rect and preferred positioning
const popoverStyle = computed(() => {
  const margin = 16;
  const cardWidth = Math.min(420, window.innerWidth - 32);

  // If target element is not found or not visible, center on screen
  if (!targetRect.value || !isTargetVisible.value) {
    return {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: `${cardWidth}px`
    };
  }

  const rect = targetRect.value;
  const pref = currentStep.value.preferredPosition || 'bottom';

  let top = 0;
  let left = 0;

  if (pref === 'right') {
    left = rect.right + margin;
    top = Math.max(margin, Math.min(rect.top, window.innerHeight - 380));
    // If overflowing right edge, fall below target
    if (left + cardWidth > window.innerWidth - margin) {
      left = Math.max(margin, rect.left);
      top = rect.bottom + margin;
    }
  } else if (pref === 'bottom-left') {
    top = rect.bottom + margin;
    left = Math.max(margin, rect.right - cardWidth);
  } else {
    // Default 'bottom'
    top = rect.bottom + margin;
    left = Math.max(margin, Math.min(rect.left + (rect.width / 2) - (cardWidth / 2), window.innerWidth - cardWidth - margin));
    
    // If overflowing bottom edge, place above target
    if (top + 340 > window.innerHeight - margin) {
      top = Math.max(margin, rect.top - 360);
    }
  }

  // Safety clamp inside viewport
  top = Math.max(margin, Math.min(top, window.innerHeight - 360));
  left = Math.max(margin, Math.min(left, window.innerWidth - cardWidth - margin));

  return {
    top: `${top}px`,
    left: `${left}px`,
    width: `${cardWidth}px`
  };
});

function handleBackdropClick() {
  // Prevent closing accidentally, or advance step if desired. Keeping dialog open for clarity.
}

// Keyboard shortcuts (Esc to close, ArrowRight/Enter to advance, ArrowLeft to back)
function handleKeydown(e) {
  if (!state.tour.active) return;
  if (e.key === 'Escape') {
    skipTour();
  } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
    nextTourStep();
  } else if (e.key === 'ArrowLeft') {
    prevTourStep();
  }
}

watch(
  () => [state.tour.active, state.tour.step],
  ([active]) => {
    if (active) {
      updatePosition();
    }
  }
);

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
  window.addEventListener('resize', updatePosition);
  window.addEventListener('scroll', updatePosition, true);
  if (state.tour.active) {
    updatePosition();
  }
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
  window.removeEventListener('resize', updatePosition);
  window.removeEventListener('scroll', updatePosition, true);
});
</script>
