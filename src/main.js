import { createApp } from 'vue';
import App from './App.vue';
import './index.css';
import dialog from './directives/dialog.js';
import { initializeDesktop } from './desktop.js';
import { initializeProjectStorage } from './stores/schemaStore.js';

async function start() {
  const root = document.getElementById('app');
  root.textContent = 'Opening your saved workspace…';
  try {
    await initializeProjectStorage();
  } catch (error) {
    if (!window.__DBMAPS_DESKTOP__) {
      root.textContent = `Could not open your workspace. ${error.message} Existing data has not been removed. `;
      const retry = document.createElement('button');
      retry.textContent = 'Retry';
      retry.onclick = () => window.location.reload();
      root.append(retry);
      return;
    }
    // Disk files remain available when the desktop's browser cache is unavailable.
    console.warn('Browser workspace cache unavailable:', error);
  }
  createApp(App).directive('dialog', dialog).mount('#app');
  await initializeDesktop();
}

void start();
