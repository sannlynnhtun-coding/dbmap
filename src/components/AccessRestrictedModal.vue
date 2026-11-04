<template>
  <div
    v-if="state.collaborationAccessRestricted.active && !isProtectedSchemaPublic"
    class="app-dialog-backdrop fixed inset-0 z-50 bg-slate-900/75  flex items-center justify-center p-4"
  >
    <div role="dialog" aria-modal="true" aria-label="Collaboration access" class="app-dialog bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl  w-full max-w-md overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
      <!-- Top banner -->
      <div
        class="app-dialog-heading p-6 text-center border-b border-slate-100 dark:border-slate-700/60"
        :class="isPasswordRequired
          ? 'bg-blue-50/60 dark:bg-blue-950/30'
          : 'bg-amber-50/50 dark:bg-amber-950/20'"
      >
        <div
          class="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
          :class="isPasswordRequired
            ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400'
            : 'bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400'"
        >
          <Key v-if="isPasswordRequired" class="w-7 h-7" />
          <Lock v-else class="w-7 h-7" />
        </div>

        <h3 class="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">
          {{ isPasswordRequired
            ? 'Password Protected Collaboration'
            : isLoginRequired
              ? 'Sign-In Required for Collaboration'
              : 'Collaboration Access Restricted' }}
        </h3>

        <p class="text-xs text-slate-500 dark:text-slate-400">
          Target Schema: <span class="font-semibold text-slate-700 dark:text-slate-200">{{ state.collaborationAccessRestricted.schemaName }}</span>
        </p>
      </div>

      <!-- Description content -->
      <div class="p-6 space-y-4 text-xs">
        <!-- PASSWORD REQUIRED CHALLENGE -->
        <div v-if="isPasswordRequired" class="space-y-3.5">
          <p class="text-slate-600 dark:text-slate-300 leading-relaxed text-center">
            This collaborative room is protected with a password. Please enter the room password to join and edit this database schema.
          </p>

          <form @submit.prevent="handleUnlockPassword" class="space-y-3">
            <div>
              <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 font-mono">
                Room Password
              </label>
              <div class="relative">
                <input
                  :type="showPassword ? 'text' : 'password'"
                  v-model="enteredPassword"
                  placeholder="Enter schema room password..."
                  autofocus
                  class="w-full pl-3 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-100 text-sm font-mono outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                  :class="{ 'border-red-500 focus:border-red-500 focus:ring-red-500/20': passwordError }"
                />
                <button
                  type="button"
                  @click="showPassword = !showPassword"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                >
                  <EyeOff v-if="showPassword" class="w-4 h-4" />
                  <Eye v-else class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Error message if wrong password -->
            <div v-if="passwordError" class="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400 text-xs">
              <AlertCircle class="w-4 h-4 shrink-0" />
              <span>{{ passwordError }}</span>
            </div>

            <div v-if="state.collaborationAccessRestricted.ownerEmail" class="text-[11px] text-slate-400 font-mono text-center">
              Host: {{ state.collaborationAccessRestricted.ownerEmail }}
            </div>
          </form>
        </div>

        <!-- LOGIN REQUIRED -->
        <div v-else-if="isLoginRequired" class="p-3.5 bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2 text-slate-600 dark:text-slate-300">
          <div class="flex items-start gap-2">
            <ShieldAlert class="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div class="leading-relaxed">
              This schema is set to <strong>Account Restricted</strong>. Visitors must verify their identity to check if their email is on the authorized team list.
            </div>
          </div>
          <div v-if="state.collaborationAccessRestricted.ownerEmail" class="text-[11px] text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-800 font-mono">
            Owner: {{ state.collaborationAccessRestricted.ownerEmail }}
          </div>
        </div>

        <!-- UNAUTHORIZED EMAIL -->
        <div v-else class="p-3.5 bg-red-50/60 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 rounded-xl space-y-2 text-slate-600 dark:text-slate-300">
          <div class="flex items-start gap-2">
            <AlertCircle class="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div class="leading-relaxed">
              You are signed in as <strong class="font-mono text-slate-800 dark:text-slate-100">{{ state.currentUser.email }}</strong>, which has not been granted access by the schema owner.
            </div>
          </div>
          <div class="text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-red-200/40 dark:border-red-900/40">
            Please ask the host <strong class="text-slate-700 dark:text-slate-200">({{ state.collaborationAccessRestricted.ownerEmail || 'Owner' }})</strong> to add your email to the collaboration whitelist in the Share menu.
          </div>
        </div>

        <div v-if="!isPasswordRequired" class="text-[11px] text-slate-400 dark:text-slate-500 text-center">
          In Account Restricted mode, only specified team member emails can open, view, and collaborate on this project.
        </div>
      </div>

      <!-- Action buttons -->
      <div class="px-6 py-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-2.5">
        <button
          type="button"
          @click="dismissAccessRestrictedModal"
          class="px-4 py-2 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-lg text-xs transition"
        >
          Cancel
        </button>

        <button
          v-if="isPasswordRequired"
          type="button"
          @click="handleUnlockPassword"
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-xs transition flex items-center gap-1.5"
        >
          <Key class="w-3.5 h-3.5" />
          <span>Unlock &amp; Join Room</span>
        </button>

        <button
          v-else-if="isLoginRequired"
          type="button"
          @click="handleOpenAuth"
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-xs transition flex items-center gap-1.5"
        >
          <LogIn class="w-3.5 h-3.5" />
          <span>Sign In to Verify</span>
        </button>

        <button
          v-else
          type="button"
          @click="handleSwitchAccount"
          class="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg text-xs transition flex items-center gap-1.5"
        >
          <LogOut class="w-3.5 h-3.5" />
          <span>Switch Account</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { state, dismissAccessRestrictedModal, unlockProjectPassword, isDefaultOrPublicProject } from '../stores/schemaStore.js';
import { Lock, Key, Eye, EyeOff, ShieldAlert, AlertCircle, LogIn, LogOut } from 'lucide-vue-next';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase.js';

const enteredPassword = ref('');
const showPassword = ref(false);
const passwordError = ref('');

const isProtectedSchemaPublic = computed(() => {
  if (!state.collaborationAccessRestricted.active) return false;
  const targetId = state.collaborationAccessRestricted.schemaId;
  const local = state.projects.find(p => p.id === targetId);
  const pending = state.collaborationAccessRestricted.pendingProjectData;
  return isDefaultOrPublicProject(local || pending);
});

// Immediately auto-dismiss if schema is actually a default or public open project
watch(isProtectedSchemaPublic, (isPub) => {
  if (isPub && state.collaborationAccessRestricted.active) {
    state.collaborationAccessRestricted.active = false;
  }
}, { immediate: true });

const isPasswordRequired = computed(() => {
  return state.collaborationAccessRestricted.reason === 'password_required';
});

const isLoginRequired = computed(() => {
  return state.collaborationAccessRestricted.reason === 'login_required';
});

function handleUnlockPassword() {
  passwordError.value = '';
  if (!enteredPassword.value.trim()) {
    passwordError.value = 'Please enter the room password to unlock.';
    return;
  }

  const result = unlockProjectPassword(
    state.collaborationAccessRestricted.schemaId,
    enteredPassword.value.trim()
  );

  if (!result.success) {
    passwordError.value = result.error || 'Incorrect password. Please verify with the project owner.';
  } else {
    enteredPassword.value = '';
  }
}

function handleOpenAuth() {
  state.modals.auth = true;
}

async function handleSwitchAccount() {
  try {
    await signOut(auth);
  } catch (err) {
    console.warn('Sign out note:', err);
  }
  state.modals.auth = true;
}
</script>
