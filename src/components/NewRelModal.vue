<template>
  <div v-if="state.modals.newRel" class="app-dialog-backdrop fixed inset-0 z-50 bg-slate-900/60  flex items-center justify-center p-4">
    <div v-dialog role="dialog" aria-modal="true" aria-label="New relationship" class="app-dialog bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl  w-full max-w-md overflow-hidden">
      <div class="app-dialog-heading px-5 py-3.5 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <h3 class="font-bold text-slate-800 dark:text-slate-100 text-xs">New relationship</h3>
        <button aria-label="Close dialog" @click="state.modals.newRel = false" class="p-1 text-slate-400 hover:text-slate-600 rounded">
          <X class="w-4 h-4" />
        </button>
      </div>

      <div class="p-4 space-y-3 text-xs">
        <!-- Source Table & Column -->
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block font-bold text-slate-700 dark:text-slate-200 mb-1">Source Table (FK)</label>
            <select
              v-model="fromTable"
              class="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-mono"
            >
              <option v-for="t in activeProject.tables" :key="t.id" :value="t.name">{{ t.name }}</option>
            </select>
          </div>
          <div>
            <label class="block font-bold text-slate-700 dark:text-slate-200 mb-1">Source Column</label>
            <select
              v-model="fromColumn"
              class="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-mono"
            >
              <option v-for="c in sourceColumns" :key="c.name" :value="c.name">{{ c.name }}</option>
            </select>
          </div>
        </div>

        <!-- Target Table & Column -->
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block font-bold text-slate-700 dark:text-slate-200 mb-1">Target Table (PK)</label>
            <select
              v-model="toTable"
              class="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-mono"
            >
              <option v-for="t in activeProject.tables" :key="t.id" :value="t.name">{{ t.name }}</option>
            </select>
          </div>
          <div>
            <label class="block font-bold text-slate-700 dark:text-slate-200 mb-1">Target Column</label>
            <select
              v-model="toColumn"
              class="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-mono"
            >
              <option v-for="c in targetColumns" :key="c.name" :value="c.name">{{ c.name }}</option>
            </select>
          </div>
        </div>

        <!-- Cardinality & OnDelete -->
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block font-bold text-slate-700 dark:text-slate-200 mb-1">Cardinality</label>
            <select
              v-model="cardinality"
              class="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-mono"
            >
              <option value="1:N">1 to Many (1:N)</option>
              <option value="1:1">1 to 1 (1:1)</option>
              <option value="N:M">Many to Many (N:M)</option>
            </select>
          </div>

          <div>
            <label class="block font-bold text-slate-700 dark:text-slate-200 mb-1">ON DELETE Rule</label>
            <select
              v-model="onDelete"
              class="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-mono"
            >
              <option value="CASCADE">CASCADE</option>
              <option value="RESTRICT">RESTRICT</option>
              <option value="SET NULL">SET NULL</option>
            </select>
          </div>
        </div>

        <!-- Optional Relationship Option (>? in DBML) -->
        <div class="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50">
          <label class="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              v-model="isOptional"
              class="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <div>
              <div class="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <span>Optional Foreign Key</span>
                <span class="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-mono font-bold rounded border border-blue-200 dark:border-blue-800">
                  >? in DBML
                </span>
              </div>
              <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Foreign key can be NULL (0..N). Renders as a dashed line with hollow origin dot.
              </p>
            </div>
          </label>
        </div>
      </div>

      <div class="px-5 py-3 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2 text-xs">
        <button @click="state.modals.newRel = false" class="px-3 py-1.5 text-slate-600 dark:text-slate-300">Cancel</button>
        <button @click="confirm" class="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg">Link Foreign Key</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { state, activeProject, addRelationship } from '../stores/schemaStore.js';
import { X } from 'lucide-vue-next';

const fromTable = ref('');
const fromColumn = ref('');
const toTable = ref('');
const toColumn = ref('');
const cardinality = ref('1:N');
const isOptional = ref(false);
const onDelete = ref('CASCADE');

watch(
  () => activeProject.value?.tables,
  (tbls) => {
    if (tbls && tbls.length > 0) {
      if (!fromTable.value) fromTable.value = tbls[0].name;
      if (!toTable.value) toTable.value = tbls[1]?.name || tbls[0].name;
    }
  },
  { immediate: true }
);

const sourceColumns = computed(() => {
  const tbl = activeProject.value?.tables.find(t => t.name === fromTable.value);
  return tbl ? tbl.columns : [];
});

const targetColumns = computed(() => {
  const tbl = activeProject.value?.tables.find(t => t.name === toTable.value);
  return tbl ? tbl.columns : [];
});

watch(sourceColumns, cols => {
  if (cols.length > 0) fromColumn.value = cols[0].name;
}, { immediate: true });

watch(targetColumns, cols => {
  if (cols.length > 0) toColumn.value = cols[0].name;
}, { immediate: true });

function confirm() {
  if (!fromTable.value || !fromColumn.value || !toTable.value || !toColumn.value) return;
  addRelationship({
    fromTable: fromTable.value,
    fromColumn: fromColumn.value,
    toTable: toTable.value,
    toColumn: toColumn.value,
    cardinality: cardinality.value,
    optional: isOptional.value,
    operator: isOptional.value
      ? (cardinality.value === '1:1' ? '-?' : cardinality.value === 'N:M' ? '<>?' : '>?')
      : (cardinality.value === '1:1' ? '-' : cardinality.value === 'N:M' ? '<>' : '>'),
    onDelete: onDelete.value
  });
  state.modals.newRel = false;
}
</script>
