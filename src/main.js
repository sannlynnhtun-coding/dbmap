import { createApp } from 'vue';
import App from './App.vue';
import './index.css';
import dialog from './directives/dialog.js';

createApp(App).directive('dialog', dialog).mount('#app');
