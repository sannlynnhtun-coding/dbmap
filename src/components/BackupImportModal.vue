<template>
  <div v-if="state.modals.backupImport" class="app-dialog-backdrop fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
    <section v-dialog role="dialog" aria-modal="true" aria-labelledby="backup-import-title" class="app-dialog w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 space-y-5">
      <div class="flex justify-between items-center gap-3"><h2 id="backup-import-title" class="font-semibold text-lg">Import JSON backup</h2><button @click="close" :disabled="busy" aria-label="Close backup import" class="p-2 rounded-lg"><X :size="18" /></button></div>
      <p class="text-sm text-slate-500">Choose a project or workspace backup. Imported projects become new copies; your existing projects stay in place.</p>
      <input type="file" accept=".json,application/json" aria-label="Choose JSON backup" :disabled="busy" @change="readFile" class="block w-full text-sm border rounded-lg p-3 border-slate-200 dark:border-slate-700" />
      <div v-if="backup" class="rounded-xl bg-slate-50 dark:bg-slate-900 p-4 space-y-2 text-sm" aria-live="polite">
        <strong>{{ backup.kind === 'workspace' ? 'Workspace backup' : 'Project backup' }}</strong>
        <p>{{ backup.projects.length }} project(s)<template v-if="backup.kind === 'workspace'"> · {{ backup.folders.length }} folder(s)</template></p>
        <ul class="max-h-40 overflow-auto list-disc pl-5"><li v-for="(project, index) in backup.projects" :key="index">{{ project.name }}</li></ul>
        <p v-if="backup.kind === 'workspace'" class="text-xs text-slate-500">The backup's field visibility, relationship visibility, and layout preferences will be applied.</p>
      </div>
      <p v-if="error" class="text-sm text-red-600 dark:text-red-400" role="alert">{{ error }}</p>
      <div class="flex justify-end gap-2"><button @click="close" :disabled="busy" class="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm">Cancel</button><button @click="confirmImport" :disabled="!backup || busy" class="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm disabled:opacity-50">{{ busy ? 'Importing…' : 'Import as new copies' }}</button></div>
    </section>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { X } from 'lucide-vue-next';
import { state, restoreBackupFile, addToast } from '../stores/schemaStore.js';
import { readBackupFile } from '../utils/workspaceBackup.js';
const backup = ref(null);
const error = ref('');
const busy = ref(false);
let readSequence = 0;
watch(() => state.modals.backupImport, () => { backup.value = null; error.value = ''; readSequence++; });
async function readFile(event) {
  const sequence = ++readSequence;
  backup.value = null; error.value = '';
  const file = event.target.files[0];
  if (!file) return;
  try {
    const parsed = readBackupFile(await file.text());
    if (sequence === readSequence) backup.value = parsed;
  } catch (failure) { if (sequence === readSequence) error.value = failure.message; }
}
function close() { if (!busy.value) state.modals.backupImport = false; }
async function confirmImport() {
  if (!backup.value || busy.value) return;
  busy.value = true; error.value = '';
  try {
    const imported = await restoreBackupFile(backup.value);
    state.modals.backupImport = false;
    addToast('Backup imported', `${imported.length} project(s) restored as new copies.`, 'success');
  } catch (failure) { error.value = failure.message; }
  finally { busy.value = false; }
}
</script>
