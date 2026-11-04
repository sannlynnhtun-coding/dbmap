<template>
  <transition name="loading-fade">
    <div
      v-if="state.isInitialLoading"
      class="app-loading fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 px-6"
      role="status"
      aria-live="polite"
    >
      <DbMapLogo class-name="w-12 h-12" />
      <div class="text-center">
        <h1 class="text-3xl font-medium tracking-tight">dbmaps</h1>
        <p class="mt-2 text-sm">
          {{ state.initialLoadingStage || "Opening your workspace…" }}
        </p>
      </div>
      <progress
        class="app-loading-progress"
        :value="state.initialLoadingProgress || 0"
        max="100"
        aria-label="Loading workspace"
      ></progress>
    </div>
  </transition>
</template>

<script setup>
import { state } from '../stores/schemaStore.js';
import DbMapLogo from './DbMapLogo.vue';
</script>

<style scoped>
/* Smooth Fade Transition for the Loading Screen Overlay */
.loading-fade-enter-active,
.loading-fade-leave-active {
  transition:
    opacity 0.45s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.45s cubic-bezier(0.16, 1, 0.3, 1);
}

.loading-fade-enter-from,
.loading-fade-leave-to {
  opacity: 0;
  transform: scale(1.02);
}

@media (prefers-reduced-motion: reduce) {
  .loading-fade-enter-active,
  .loading-fade-leave-active {
    transition: none;
  }
}
</style>
