<template>
  <div v-if="state.modals.newFolder" class="app-dialog-backdrop fixed inset-0 z-50 bg-slate-900/60  flex items-center justify-center p-4">
    <div v-dialog role="dialog" aria-modal="true" aria-label="New database folder" class="app-dialog bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl  w-full max-w-xs overflow-hidden">
      <div class="app-dialog-heading px-5 py-3.5 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <h3 class="font-bold text-slate-800 dark:text-slate-100 text-xs">New database group</h3>
        <button aria-label="Close dialog" @click="state.modals.newFolder = false" class="p-1 text-slate-400 hover:text-slate-600 rounded">
          <X class="w-4 h-4" />
        </button>
      </div>

      <div class="p-4 space-y-3 text-xs">
        <div>
          <label class="block font-bold text-slate-700 dark:text-slate-200 mb-1">Group name</label>
          <input
            v-model="folderName"
            type="text"
            placeholder="e.g. Production DB, Microservices"
            class="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div class="px-5 py-3 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2 text-xs">
        <button @click="state.modals.newFolder = false" class="px-3 py-1.5 text-slate-600 dark:text-slate-300">Cancel</button>
        <button @click="confirm" class="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg">Create group</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { state, createFolder } from '../stores/schemaStore.js';
import { X } from 'lucide-vue-next';

const folderName = ref('');

function confirm() {
  if (!folderName.value.trim()) return;
  createFolder(folderName.value.trim());
  folderName.value = '';
  state.modals.newFolder = false;
}
</script>
