<template>
  <div class="start-page">
    <header class="start-header">
      <button class="start-brand" @click="navigateTo('/')" aria-label="DBMaps home"><DbMapLogo class-name="w-8 h-8" /><strong>dbmaps</strong></button>
      <button class="start-subtle" @click="toggleDarkMode" aria-label="Toggle color theme"><Sun v-if="state.isDarkMode" :size="18" /><Moon v-else :size="18" /></button>
    </header>
    <main class="start-main">
      <p class="start-eyebrow">YOUR LOCAL WORKSPACE</p>
      <h1>Welcome to DBMaps</h1>
      <p class="start-intro">Pick up where you left off, or map something new.</p>
      <p v-if="state.startPageMessage" class="start-notice" role="status">{{ state.startPageMessage }}</p>
      <div class="start-columns">
        <section aria-labelledby="start-actions-title">
          <h2 id="start-actions-title">Start</h2>
          <button class="start-action" @click="state.modals.newProject = true"><Plus :size="20" /><span><strong>New project</strong><small>Start with an empty database schema</small></span><ArrowUpRight :size="16" /></button>
          <button class="start-action" @click="state.modals.importSchema = true"><FileCode :size="20" /><span><strong>Import SQL / DBML</strong><small>Turn an existing schema into a diagram</small></span><ArrowUpRight :size="16" /></button>
          <button class="start-action" @click="state.modals.backupImport = true"><Upload :size="20" /><span><strong>Import JSON backup</strong><small>Restore one project or an entire workspace</small></span><ArrowUpRight :size="16" /></button>

          <div class="start-backup">
            <Download :size="20" />
            <strong>Keep a copy you can take anywhere.</strong>
            <p>Download all projects, folders, layouts, and settings in one JSON file.</p>
            <button class="start-download" @click="downloadAll">Export all projects</button>
          </div>
        </section>
        <section aria-labelledby="start-recent-title">
          <div class="start-section-heading"><h2 id="start-recent-title">Recent projects</h2><span>{{ projects.length }}</span></div>
          <p class="start-sort">Most recently saved first</p>
          <div v-if="!projects.length" class="start-empty"><Database :size="28" /><h3>Your workspace starts here</h3><p>Create a project, import a backup, or choose a template. Your projects will appear here.</p></div>
          <ul v-else class="start-recents">
            <li v-for="project in projects" :key="project.id">
              <button class="start-project" @click="selectProject(project.id)">
                <Database class="start-project-icon" :size="20" />
                <span class="start-project-details"><strong>{{ project.name }}</strong><small>{{ folderName(project.folderId) }} · {{ project.dialect || 'postgres' }}</small></span>
                <time v-if="validDate(project.updatedAt)" :datetime="project.updatedAt" :title="new Date(project.updatedAt).toLocaleString()">{{ dateLabel(project.updatedAt) }}</time>
                <span v-else class="start-date-unknown">Unknown save time</span>
                <ChevronRight :size="16" />
              </button>
            </li>
          </ul>
        </section>
      </div>
      <footer class="start-footer"><HardDrive :size="15" /> Saved on this browser. Use JSON backups to move between browsers or devices.</footer>
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { ArrowUpRight, ChevronRight, Database, Download, FileCode, HardDrive, Moon, Plus, Sun, Upload } from 'lucide-vue-next';
import DbMapLogo from './DbMapLogo.vue';
import { state, selectProject, navigateTo, toggleDarkMode, exportWorkspaceBackup, addToast } from '../stores/schemaStore.js';
import { recentProjects, downloadJsonBackup } from '../utils/workspaceBackup.js';

const projects = computed(() => recentProjects(state.projects));
const folderName = id => state.folders.find(folder => folder.id === id)?.name || 'Ungrouped';
const validDate = value => typeof value === 'string' && Number.isFinite(Date.parse(value));
const dateLabel = value => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
function downloadAll() {
  try { downloadJsonBackup(exportWorkspaceBackup(), `dbmaps-workspace-${new Date().toISOString().slice(0, 10)}.json`); }
  catch (error) { addToast('Backup failed', error.message, 'error'); }
}
</script>

<style scoped>
.start-page { min-height: 100dvh; background: var(--page-ground); color: var(--page-ink); font-family: var(--font-sans); }
.start-header { max-width: 1200px; margin: auto; padding: 24px 32px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--board-border); }
.start-brand { display: flex; align-items: center; gap: 10px; font-size: 20px; letter-spacing: -.6px; cursor: pointer; }
.start-subtle { padding: 10px; border-radius: 10px; cursor: pointer; }
.start-subtle:hover { background: var(--page-well); }
.start-main { max-width: 1060px; margin: auto; padding: 56px 32px 24px; }
.start-eyebrow { color: var(--page-muted); font-size: 11px; letter-spacing: 1.6px; font-weight: 600; margin-bottom: 12px; }
h1 { font-size: clamp(28px, 4vw, 40px); font-weight: 600; letter-spacing: -1.5px; line-height: 1.2; }
.start-intro { color: var(--page-muted); margin-top: 12px; font-size: 15px; }
.start-columns { display: grid; grid-template-columns: minmax(240px, .85fr) minmax(0, 1.3fr); gap: 64px; margin-top: 44px; }
h2 { font-size: 15px; font-weight: 600; margin-bottom: 16px; }
.start-action { display: flex; align-items: center; gap: 14px; width: 100%; padding: 14px 8px; text-align: left; border-radius: 10px; cursor: pointer; }
.start-action > svg:first-child { color: var(--page-accent); flex-shrink: 0; }
.start-action > svg:last-child { color: var(--page-muted); margin-left: auto; }
.start-action strong, .start-project strong { display: block; font-size: 14px; font-weight: 500; }
.start-action small, .start-project small { display: block; color: var(--page-muted); font-size: 12px; margin-top: 4px; }
.start-action:hover, .start-project:hover { background: var(--page-well); }
.start-section-heading { display: flex; align-items: center; gap: 10px; }
.start-section-heading h2 { margin-bottom: 0; }
.start-section-heading > span { font-size: 11px; padding: 1px 6px; border-radius: 5px; background: var(--page-well); color: var(--page-muted); }
.start-sort { margin: 6px 0 18px; font-size: 12px; color: var(--page-muted); }
.start-recents { list-style: none; padding: 0; }
.start-project { width: 100%; display: flex; gap: 12px; align-items: center; padding: 15px 10px; text-align: left; border-radius: 10px; cursor: pointer; }
.start-project-icon { color: var(--page-muted); flex-shrink: 0; }
.start-project-details { flex: 1; min-width: 0; }
.start-project strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.start-project time, .start-date-unknown { color: var(--page-muted); font-size: 11px; max-width: 130px; text-align: right; }
.start-backup { margin-top: 28px; padding: 18px; background: var(--page-well); border: 1px solid var(--board-border); border-radius: 12px; }
.start-backup > svg { margin-bottom: 10px; color: var(--page-muted); }
.start-backup strong { display: block; font-size: 13px; font-weight: 500; }
.start-backup p { font-size: 12px; color: var(--page-muted); margin-top: 8px; line-height: 1.6; }
.start-download { margin-top: 14px; padding: 8px 12px; font-size: 12px; background: var(--page-surface); border: 1px solid var(--board-border); border-radius: 8px; cursor: pointer; box-shadow: 0 1px 2px rgb(0 0 0 / .05); }
.start-empty { padding: 40px 24px; border: 1px dashed var(--board-border); border-radius: 12px; color: var(--page-muted); text-align: center; }
.start-empty > svg { margin: auto auto 16px; }
.start-empty h3 { color: var(--page-ink); font-size: 14px; font-weight: 500; }
.start-empty p { font-size: 13px; line-height: 1.7; margin-top: 8px; }
.start-notice { padding: 12px 16px; margin-top: 20px; border: 1px solid var(--board-border); border-radius: 8px; font-size: 13px; }
.start-footer { margin-top: 56px; padding-top: 20px; border-top: 1px solid var(--board-border); display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--page-muted); }
@media (max-width: 760px) { .start-columns { grid-template-columns: 1fr; gap: 32px; } .start-header { padding: 18px 20px; } .start-main { padding: 32px 20px; } .start-footer { align-items: flex-start; } }
</style>
