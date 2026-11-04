<template>
  <div v-if="state.modals.auth" class="app-dialog-backdrop fixed inset-0 z-50 bg-slate-900/60  flex items-center justify-center p-4">
    <div v-dialog role="dialog" aria-modal="true" aria-label="Account and sign in" class="app-dialog bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl  w-full max-w-md overflow-hidden">
      <!-- Header -->
      <div class="app-dialog-heading px-5 py-4 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <ShieldCheck class="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 class="font-bold text-slate-800 dark:text-slate-100 text-sm">Account & sign-in</h3>
        </div>
        <button aria-label="Close dialog"
          @click="state.modals.auth = false"
          class="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded transition"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <div class="p-5 space-y-4 text-xs">
        <!-- Presto AI Onboarding Highlight Banner -->
        <div
          v-if="state.authModalPromptReason === 'ai_presto' && !state.currentUser.isLoggedIn"
          class="p-3.5      border border-blue-200 dark:border-blue-800/80 rounded-xl space-y-1.5 app-soft-surface"
        >
          <div class="flex items-center gap-2 font-bold text-xs text-blue-900 dark:text-blue-200">
            <Sparkles class="w-4 h-4 text-amber-500 animate-pulse shrink-0" />
            <span>Sign In to Unlock Presto AI Schema Assistant</span>
          </div>
          <p class="text-[11px] text-blue-700 dark:text-blue-300 leading-relaxed">
            AI Schema Generation is reserved for registered users. Sign in with Google to activate your account and immediately receive <strong>50,000 free monthly AI credits</strong>!
          </p>
        </div>

        <!-- Firebase Firestore Active Badge -->
        <div class="flex items-center justify-between p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 rounded-xl">
          <div class="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-medium text-[11px]">
            <span class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Firebase Firestore Live Cloud Database</span>
          </div>
          <span class="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Active</span>
        </div>

        <!-- User Profile Card -->
        <div class="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
          <UserAvatar
            :avatar="state.currentUser.avatar"
            :name="state.currentUser.name"
            :is-logged-in="state.currentUser.isLoggedIn"
            size="xl"
            class="border-2 border-blue-500  shrink-0"
          />
          <div class="flex-1 overflow-hidden">
            <div class="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">{{ state.currentUser.name }}</div>
            <div class="text-slate-400 font-mono text-[11px] truncate">{{ state.currentUser.email }}</div>
            <span
              class="inline-block mt-1 px-2 py-0.5 rounded font-mono text-[10px] font-bold"
              :class="state.currentUser.isLoggedIn ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'"
            >
              {{ state.currentUser.isLoggedIn ? 'Google SSO Authenticated' : 'Guest Mode' }}
            </span>
          </div>
        </div>

        <!-- Google SSO Login Button (if not logged in) -->
        <div v-if="!state.currentUser.isLoggedIn" class="pt-1 space-y-2">
          <button
            @click="loginWithGoogle"
            :disabled="state.isLoggingIn"
            class="w-full py-2.5 px-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed text-slate-800 dark:text-slate-100 font-semibold border border-slate-300 dark:border-slate-600 rounded-xl transition flex items-center justify-center gap-3  group cursor-pointer"
          >
            <!-- Google SVG Icon or Spinner -->
            <svg v-if="!state.isLoggingIn" class="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <div v-else class="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0"></div>
            <span>{{ state.isLoggingIn ? 'Connecting to Google SSO...' : 'Sign in with Google' }}</span>
          </button>

          <p class="text-[11px] text-slate-400 dark:text-slate-500 text-center leading-relaxed px-1">
            By continuing, you agree to dbmaps'
            <button @click="openLegal('/terms-of-service')" class="text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer">Terms of Service</button>
            and acknowledge our
            <button @click="openLegal('/privacy-policy')" class="text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer">Privacy Policy</button>.
          </p>
        </div>

        <!-- Editable profile fields -->
        <div class="space-y-3 pt-1 border-t border-slate-200 dark:border-slate-700">
          <div>
            <label class="block font-bold text-slate-700 dark:text-slate-200 mb-1">Display Name</label>
            <input
              v-model="state.currentUser.name"
              type="text"
              class="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-mono outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label class="block font-bold text-slate-700 dark:text-slate-200 mb-1">Email Address</label>
            <input
              v-model="state.currentUser.email"
              type="email"
              class="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-mono outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      <!-- Footer Buttons -->
      <div class="px-5 py-3 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
        <div>
          <button
            v-if="state.currentUser.isLoggedIn"
            @click="logoutUser"
            class="px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/60 dark:hover:bg-red-900/80 text-red-600 dark:text-red-300 font-medium rounded-lg text-xs transition flex items-center gap-1.5"
          >
            <LogOut class="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        <button
          @click="saveProfile"
          class="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-xs transition"
        >
          Save Details
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { state, loginWithGoogle, logoutUser, addToast, navigateTo } from '../stores/schemaStore.js';
import UserAvatar from './UserAvatar.vue';
import { ShieldCheck, X, LogOut, Sparkles } from 'lucide-vue-next';

function saveProfile() {
  state.modals.auth = false;
  addToast('Profile Saved', 'Updated identity details', 'success');
}

function openLegal(path) {
  state.modals.auth = false;
  navigateTo(path);
}
</script>
