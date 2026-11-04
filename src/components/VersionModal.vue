<template>
  <div v-if="state.modals.version" class="app-dialog-backdrop fixed inset-0 z-50 bg-slate-900/60  flex items-center justify-center p-4">
    <div role="dialog" aria-modal="true" aria-label="Version checkpoint" class="app-dialog bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl  w-full max-w-sm overflow-hidden">
      <div class="app-dialog-heading px-5 py-3.5 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <h3 class="font-bold text-slate-800 dark:text-slate-100 text-xs">Create Version Checkpoint</h3>
        <button aria-label="Close dialog" @click="state.modals.version = false" class="p-1 text-slate-400 hover:text-slate-600 rounded">
          <X class="w-4 h-4" />
        </button>
      </div>

      <div class="p-4 space-y-3 text-xs">
        <div>
          <label class="block font-bold text-slate-700 dark:text-slate-200 mb-1">Version Tag / Name</label>
          <input
            v-model="versionName"
            type="text"
            placeholder="e.g. v1.2 - Added Payment Ledger"
            class="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 font-mono"
          />
        </div>

        <div>
          <label class="block font-bold text-slate-700 dark:text-slate-200 mb-1">Commit Message / Changelog</label>
          <textarea
            v-model="description"
            rows="3"
            placeholder="Describe what changed in this release..."
            class="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 outline-none resize-none"
          ></textarea>
        </div>
      </div>

      <div class="px-5 py-3 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2 text-xs">
        <button @click="state.modals.version = false" class="px-3 py-1.5 text-slate-600 dark:text-slate-300">Cancel</button>
        <button @click="confirm" class="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg">Save Snapshot</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { state, createCommit } from '../stores/schemaStore.js';
import { X } from 'lucide-vue-next';

const versionName = ref('');
const description = ref('');

function confirm() {
  createCommit(versionName.value.trim(), description.value.trim());
  versionName.value = '';
  description.value = '';
  state.modals.version = false;
}
</script>
