<template>
  <div v-if="isDesktop" class="flex items-center gap-3 px-4 py-1 bg-slate-100 dark:bg-slate-900 text-xs border-b dark:border-slate-700" aria-label="Document files">
    <button :disabled="desktop.busy" @click="desktopAction('new')">New</button>
    <button :disabled="desktop.busy" @click="desktopAction('open')">Open…</button>
    <button :disabled="desktop.busy" @click="desktopAction('save')">Save</button>
    <button :disabled="desktop.busy" @click="desktopAction('saveAs')">Save As…</button>
    <span class="truncate">{{ desktop.dirty ? '● ' : '' }}{{ desktop.name }}</span>
    <span v-if="desktop.error" role="alert" class="text-red-600 truncate">{{ desktop.error }}</span>
  </div>
</template>
<script setup>
import { desktop, desktopAction, isDesktop } from '../desktop.js';
</script>
