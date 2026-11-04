<template>
  <div v-if="state.modals.newTable" class="app-dialog-backdrop fixed inset-0 z-50 bg-slate-900/60  flex items-center justify-center p-4">
    <div v-dialog role="dialog" aria-modal="true" aria-label="New table" class="app-dialog bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl  w-full max-w-sm overflow-hidden">
      <div class="app-dialog-heading px-5 py-3.5 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <h3 class="font-bold text-slate-800 dark:text-slate-100 text-xs">New table</h3>
        <button aria-label="Close dialog" @click="state.modals.newTable = false" class="p-1 text-slate-400 hover:text-slate-600 rounded">
          <X class="w-4 h-4" />
        </button>
      </div>

      <div class="p-4 space-y-3 text-xs">
        <div>
          <label class="block font-bold text-slate-700 dark:text-slate-200 mb-1">Table Name</label>
          <input
            v-model="tableName"
            type="text"
            placeholder="e.g. payments"
            class="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-mono outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label class="block font-bold text-slate-700 dark:text-slate-200 mb-1">Table color</label>
          <div class="flex items-center gap-2">
            <button
              v-for="color in colors"
              :key="color"
              @click="headerColor = color"
              class="w-6 h-6 rounded-full border-2 transition cursor-pointer"
              :class="headerColor === color ? 'border-black dark:border-white scale-110' : 'border-transparent'"
              :style="{ backgroundColor: color }"
            ></button>
          </div>
        </div>

        <div>
          <label class="block font-bold text-slate-700 dark:text-slate-200 mb-1">Table Note / Description (Optional)</label>
          <textarea
            v-model="tableNote"
            placeholder="e.g. Stores user authentication and profile data"
            class="w-full h-16 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-sans outline-none focus:border-blue-500 text-xs resize-none"
          ></textarea>
        </div>
      </div>

      <div class="px-5 py-3 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2 text-xs">
        <button @click="state.modals.newTable = false" class="px-3 py-1.5 text-slate-600 dark:text-slate-300">Cancel</button>
        <button @click="confirm" class="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg">Create</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { state, addTable } from '../stores/schemaStore.js';
import { X } from 'lucide-vue-next';

const tableName = ref('');
const tableNote = ref('');
const headerColor = ref('#3b82f6');
const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'];

function confirm() {
  if (!tableName.value.trim()) return;
  addTable({
    name: tableName.value.trim().toLowerCase().replace(/\s+/g, '_'),
    headerColor: headerColor.value,
    note: tableNote.value.trim()
  });
  tableName.value = '';
  tableNote.value = '';
  state.modals.newTable = false;
}
</script>
