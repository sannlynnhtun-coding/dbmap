<template>
  <div v-if="state.modals.share" class="app-dialog-backdrop fixed inset-0 z-50 bg-slate-900/60  flex items-center justify-center p-4">
    <div v-dialog role="dialog" aria-modal="true" aria-label="Share schema" class="app-dialog bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl  w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
      <!-- Header -->
      <div class="app-dialog-heading px-5 py-4 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Users class="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 class="font-bold text-slate-800 dark:text-slate-100 text-sm">Real-time Team Collaboration</h3>
        </div>
        <button
          @click="state.modals.share = false"
          class="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded transition"
          aria-label="Close"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Main Body -->
      <div class="p-5 space-y-4 text-xs overflow-y-auto flex-1">
        <!-- Active Target Schema Preview -->
        <div class="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 rounded-xl flex items-center justify-between">
          <div class="flex items-center gap-2.5 min-w-0">
            <div class="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
              <Database class="w-4 h-4" />
            </div>
            <div class="min-w-0">
              <div class="font-bold text-slate-800 dark:text-slate-100 text-xs truncate">
                {{ activeProject.name }}
              </div>
              <div class="text-[10px] text-slate-400 font-mono">
                {{ activeProject.tables?.length || 0 }} tables &bull; {{ activeProject.dialect?.toUpperCase() || 'SQL' }}
              </div>
            </div>
          </div>
          <div class="flex items-center gap-1.5 shrink-0">
            <span
              :class="activeProject.accessMode === 'restricted'
                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'"
              class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border"
            >
              {{ activeProject.accessMode === 'restricted' ? '🔒 Restricted' : '🌐 Public Open' }}
            </span>
          </div>
        </div>

        <!-- Collaboration Access Restriction Options -->
        <div>
          <label class="block font-bold text-slate-700 dark:text-slate-200 mb-2">
            Collaboration Access Permissions
          </label>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <!-- Option 1: Public Open -->
            <button
              type="button"
              @click="handleAccessModeChange('public')"
              class="p-3 text-left rounded-xl border transition flex flex-col justify-between relative cursor-pointer"
              :class="currentAccessMode === 'public'
                ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 ring-2 ring-blue-500/20'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-600'"
            >
              <div class="flex items-center justify-between mb-1.5">
                <div class="flex items-center gap-1.5">
                  <div
                    class="w-6 h-6 rounded-lg flex items-center justify-center text-xs shrink-0"
                    :class="currentAccessMode === 'public'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'"
                  >
                    <Globe class="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div class="font-bold text-slate-800 dark:text-slate-100 text-xs leading-tight">
                      1. Public Open
                    </div>
                  </div>
                </div>
                <CheckCircle2
                  v-if="currentAccessMode === 'public'"
                  class="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0"
                />
              </div>
              <span class="text-[10px] text-blue-600 dark:text-blue-400 font-medium mb-1">Anyone with link</span>
              <p class="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
                Fast &amp; open. Anyone with the link can view &amp; collaborate instantly.
              </p>
            </button>

            <!-- Option 2: Password Protected -->
            <button
              type="button"
              @click="handleAccessModeChange('password')"
              class="p-3 text-left rounded-xl border transition flex flex-col justify-between relative cursor-pointer"
              :class="currentAccessMode === 'password'
                ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 ring-2 ring-blue-500/20'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-600'"
            >
              <div class="flex items-center justify-between mb-1.5">
                <div class="flex items-center gap-1.5">
                  <div
                    class="w-6 h-6 rounded-lg flex items-center justify-center text-xs shrink-0"
                    :class="currentAccessMode === 'password'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'"
                  >
                    <Key class="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div class="font-bold text-slate-800 dark:text-slate-100 text-xs leading-tight">
                      2. Password
                    </div>
                  </div>
                </div>
                <CheckCircle2
                  v-if="currentAccessMode === 'password'"
                  class="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0"
                />
              </div>
              <span class="text-[10px] text-blue-600 dark:text-blue-400 font-medium mb-1">Link + Password</span>
              <p class="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
                Protected by passphrase. Anyone with link and password can collaborate.
              </p>
            </button>

            <!-- Option 3: Account Restricted -->
            <button
              type="button"
              @click="handleAccessModeChange('restricted')"
              class="p-3 text-left rounded-xl border transition flex flex-col justify-between relative cursor-pointer"
              :class="currentAccessMode === 'restricted'
                ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/40 ring-2 ring-amber-500/20'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-600'"
            >
              <div class="flex items-center justify-between mb-1.5">
                <div class="flex items-center gap-1.5">
                  <div
                    class="w-6 h-6 rounded-lg flex items-center justify-center text-xs shrink-0"
                    :class="currentAccessMode === 'restricted'
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'"
                  >
                    <Lock class="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div class="font-bold text-slate-800 dark:text-slate-100 text-xs leading-tight">
                      3. Restricted
                    </div>
                  </div>
                </div>
                <CheckCircle2
                  v-if="currentAccessMode === 'restricted'"
                  class="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0"
                />
              </div>
              <span class="text-[10px] text-amber-600 dark:text-amber-400 font-medium mb-1">Emails only</span>
              <p class="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
                Authorized team member accounts only. Whitelist verification.
              </p>
            </button>
          </div>
        </div>

        <!-- Password Configuration Section (Active when mode is password) -->
        <div
          v-if="currentAccessMode === 'password'"
          class="p-3.5 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/60 rounded-xl space-y-3"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5">
              <Key class="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span class="font-bold text-slate-800 dark:text-slate-100 text-xs">
                Collaboration Room Password
              </span>
            </div>
            <span class="text-[10px] text-blue-700 dark:text-blue-400 font-medium">
              Required for Visitors
            </span>
          </div>

          <div class="flex items-center gap-2">
            <div class="relative flex-1">
              <input
                :type="showPassword ? 'text' : 'password'"
                v-model="roomPasswordInput"
                placeholder="Set room password (e.g. team2026)"
                class="w-full pl-3 pr-9 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100 text-xs font-mono outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                :title="showPassword ? 'Hide password' : 'Show password'"
              >
                <EyeOff v-if="showPassword" class="w-3.5 h-3.5" />
                <Eye v-else class="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              @click="generateRandomPassword"
              class="px-2.5 py-1.5 border border-slate-300 dark:border-slate-600 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium rounded-lg text-xs transition flex items-center gap-1 shrink-0"
              title="Generate random password"
            >
              <RefreshCw class="w-3 h-3" />
              <span>Generate</span>
            </button>

            <button
              type="button"
              @click="saveRoomPassword"
              class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-xs transition shrink-0"
            >
              Save Password
            </button>
          </div>

          <div class="text-[11px] text-blue-900/80 dark:text-blue-300/80 flex items-center gap-1.5">
            <Shield class="w-3.5 h-3.5 shrink-0 text-blue-500" />
            <span>Teammates with the link will be prompted to enter this password to unlock this schema.</span>
          </div>
        </div>

        <!-- Account Restricted Emails Management Section -->
        <div
          v-if="currentAccessMode === 'restricted'"
          class="p-3.5 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 rounded-xl space-y-3"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5">
              <Mail class="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span class="font-bold text-slate-800 dark:text-slate-100 text-xs">
                Authorized Collaborator Accounts ({{ (activeProject.allowedEmails?.length || 0) + 1 }})
              </span>
            </div>
            <span class="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
              Verified by Google / Account Sign-in
            </span>
          </div>

          <!-- Add Email Form -->
          <form @submit.prevent="handleAddEmail" class="flex items-center gap-2">
            <input
              type="email"
              v-model="newCollaboratorEmail"
              placeholder="Enter teammate email (e.g. teammate@company.com)"
              class="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100 placeholder-slate-400 text-xs outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
            <button
              type="submit"
              class="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg text-xs transition flex items-center gap-1 shrink-0"
            >
              <Plus class="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </form>

          <!-- Accounts Whitelist -->
          <div class="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            <!-- Project Owner -->
            <div class="px-2.5 py-1.5 rounded-lg bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div class="flex items-center gap-2 min-w-0">
                <div class="w-5 h-5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/80 dark:text-blue-300 flex items-center justify-center font-bold text-[10px] shrink-0">
                  {{ (ownerEmailDisplay[0] || 'O').toUpperCase() }}
                </div>
                <div class="truncate font-mono text-[11px] text-slate-800 dark:text-slate-200">
                  {{ ownerEmailDisplay }}
                </div>
              </div>
              <span class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 shrink-0">
                Owner / Host
              </span>
            </div>

            <!-- Allowed User Emails -->
            <div
              v-for="email in (activeProject.allowedEmails || [])"
              :key="email"
              class="px-2.5 py-1.5 rounded-lg bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between"
            >
              <div class="flex items-center gap-2 min-w-0">
                <div class="w-5 h-5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/80 dark:text-amber-300 flex items-center justify-center font-bold text-[10px] shrink-0">
                  {{ (email[0] || 'U').toUpperCase() }}
                </div>
                <div class="truncate font-mono text-[11px] text-slate-800 dark:text-slate-200">
                  {{ email }}
                </div>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <span class="px-1.5 py-0.5 rounded text-[9px] font-medium bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  Authorized
                </span>
                <button
                  type="button"
                  @click="handleRemoveEmail(email)"
                  class="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded transition"
                  title="Remove account permission"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <!-- Empty Whitelist State -->
            <div
              v-if="(!activeProject.allowedEmails || activeProject.allowedEmails.length === 0)"
              class="py-2 text-center text-[10px] text-amber-700/80 dark:text-amber-400/80 italic"
            >
              No additional teammate emails added yet. Enter an email above to grant access.
            </div>
          </div>
        </div>

        <!-- Shareable Link Input -->
        <div>
          <label class="block font-bold text-slate-700 dark:text-slate-200 mb-1">
            Shareable Schema Collaboration Link
          </label>
          <div class="flex items-center gap-2">
            <input
              type="text"
              readonly
              :value="shareUrl"
              class="flex-1 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-mono text-xs select-all outline-none"
            />
            <button
              type="button"
              @click="copyShareLink"
              class="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition flex items-center gap-1.5 shrink-0 text-xs"
            >
              <Copy class="w-3.5 h-3.5" />
              <span>{{ isCopied ? 'Copied!' : 'Copy Link' }}</span>
            </button>
            <button
              v-if="currentAccessMode === 'password'"
              type="button"
              @click="copyLinkWithPassword"
              class="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition flex items-center gap-1.5 shrink-0 text-xs"
              title="Copy share link with password formatted for pasting to teammates"
            >
              <Key class="w-3.5 h-3.5" />
              <span>{{ isCopiedWithPassword ? 'Copied with Password!' : 'Copy Link + Password' }}</span>
            </button>
          </div>
        </div>

        <!-- Contextual Explanatory Banner -->
        <div
          :class="currentAccessMode === 'restricted'
            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/80 text-amber-800 dark:text-amber-300'
            : currentAccessMode === 'password'
              ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/80 text-blue-800 dark:text-blue-300'
              : 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/80 text-blue-800 dark:text-blue-300'"
          class="p-3 border rounded-xl flex items-start gap-2"
        >
          <component
            :is="currentAccessMode === 'restricted' ? Lock : currentAccessMode === 'password' ? Key : Globe"
            class="w-4 h-4 shrink-0 mt-0.5"
            :class="currentAccessMode === 'restricted' ? 'text-amber-600 dark:text-amber-400' : currentAccessMode === 'password' ? 'text-blue-600 dark:text-blue-400' : 'text-blue-600 dark:text-blue-400'"
          />
          <p class="leading-relaxed text-[11px]">
            <span v-if="currentAccessMode === 'restricted'">
              <strong>Account Restricted Active:</strong> Visitors must sign in with an authorized account above. Unlisted accounts cannot access <strong>{{ activeProject.name }}</strong>.
            </span>
            <span v-else-if="currentAccessMode === 'password'">
              <strong>Password Protection Active:</strong> Anyone with this link must enter the password ({{ roomPasswordInput ? `"${roomPasswordInput}"` : 'set above' }}) to unlock and collaborate on <strong>{{ activeProject.name }}</strong>.
            </span>
            <span v-else>
              <strong>Public Open Active:</strong> Anyone with this link can immediately open and collaborate on <strong>{{ activeProject.name }}</strong> in real-time.
            </span>
          </p>
        </div>

        <!-- Collaborators Live Presence List -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="font-bold text-slate-700 dark:text-slate-200">
              Live in this schema ({{ state.collaborators.length }})
            </span>
            <span class="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Sync Active
            </span>
          </div>

          <div class="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            <div
              v-for="user in state.collaborators"
              :key="user.id"
              class="p-2 rounded-xl border border-slate-200 dark:border-slate-700/80 flex items-center justify-between bg-white dark:bg-slate-800"
            >
              <div class="flex items-center gap-2.5">
                <UserAvatar
                  :avatar="user.avatar"
                  :name="user.name"
                  :is-logged-in="state.currentUser.isLoggedIn && (user.id === state.currentUser.id || user.isSelf)"
                  size="sm"
                />
                <div>
                  <div class="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <span>{{ user.name }}</span>
                    <span
                      class="w-2 h-2 rounded-full"
                      :style="{ backgroundColor: user.color }"
                    ></span>
                  </div>
                  <span class="text-[10px] text-slate-400 font-mono">{{ user.email }}</span>
                </div>
              </div>

              <span class="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 font-mono font-bold text-[9px] text-slate-700 dark:text-slate-300">
                {{ user.role }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-5 py-3 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <div class="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
          <span>Current Mode:</span>
          <strong class="font-semibold text-slate-700 dark:text-slate-200">
            {{ currentAccessMode === 'restricted' ? 'Account Restricted' : currentAccessMode === 'password' ? 'Password Protected' : 'Public Open' }}
          </strong>
        </div>
        <button
          type="button"
          @click="state.modals.share = false"
          class="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-xs transition"
        >
          Done
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import UserAvatar from './UserAvatar.vue';
import {
  state,
  activeProject,
  addToast,
  setProjectAccessMode,
  setProjectSharePassword,
  addAllowedCollaboratorEmail,
  removeAllowedCollaboratorEmail
} from '../stores/schemaStore.js';
import {
  Users,
  X,
  Copy,
  ShieldCheck,
  Database,
  Globe,
  Lock,
  Key,
  Eye,
  EyeOff,
  RefreshCw,
  Shield,
  Mail,
  Plus,
  Trash2,
  CheckCircle2
} from 'lucide-vue-next';

const isCopied = ref(false);
const isCopiedWithPassword = ref(false);
const newCollaboratorEmail = ref('');
const showPassword = ref(false);
const roomPasswordInput = ref(activeProject.value?.sharePassword || '');

watch(() => activeProject.value?.sharePassword, (newVal) => {
  if (newVal !== undefined) {
    roomPasswordInput.value = newVal || '';
  }
});

const currentAccessMode = computed(() => {
  return activeProject.value?.accessMode || 'public';
});

const ownerEmailDisplay = computed(() => {
  return (
    activeProject.value?.ownerEmail ||
    state.currentUser.email ||
    'Owner Account'
  );
});

const shareUrl = computed(() => {
  const schemaId = activeProject.value?.id || state.activeProjectId || 'proj-1';
  return `${window.location.origin}/app?schema=${encodeURIComponent(schemaId)}`;
});

function handleAccessModeChange(mode) {
  setProjectAccessMode(mode, roomPasswordInput.value);
}

function generateRandomPassword() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let randStr = '';
  for (let i = 0; i < 6; i++) {
    randStr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  roomPasswordInput.value = `team-${randStr}`;
  saveRoomPassword();
}

function saveRoomPassword() {
  const pwd = roomPasswordInput.value.trim();
  if (!pwd && currentAccessMode.value === 'password') {
    addToast('Password Missing', 'Please enter a password or click Generate', 'warning');
    return;
  }
  setProjectSharePassword(pwd);
}

function handleAddEmail() {
  if (!newCollaboratorEmail.value) return;
  const success = addAllowedCollaboratorEmail(newCollaboratorEmail.value);
  if (success) {
    newCollaboratorEmail.value = '';
  }
}

function handleRemoveEmail(email) {
  removeAllowedCollaboratorEmail(email);
}

function copyShareLink() {
  navigator.clipboard.writeText(shareUrl.value);
  isCopied.value = true;
  addToast('Link Copied', `Collaboration link for "${activeProject.value?.name}" copied to clipboard`, 'success');
  setTimeout(() => {
    isCopied.value = false;
  }, 2500);
}

function copyLinkWithPassword() {
  const pwd = roomPasswordInput.value || activeProject.value?.sharePassword || '';
  const message = `Join database schema collaboration room "${activeProject.value?.name}":\nLink: ${shareUrl.value}\nPassword: ${pwd || '(None set)'}`;
  navigator.clipboard.writeText(message);
  isCopiedWithPassword.value = true;
  addToast('Link + Password Copied', 'Invitation with link & password copied to clipboard', 'success');
  setTimeout(() => {
    isCopiedWithPassword.value = false;
  }, 2500);
}
</script>
