<template>
  <div v-if="state.modals.aiGen" class="app-dialog-backdrop fixed inset-0 z-50 bg-slate-900/70  flex items-center justify-center p-4">
    <div role="dialog" aria-modal="true" aria-label="AI schema generator" class="app-dialog bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl  w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
      <!-- Header -->
      <div class="app-dialog-heading px-5 py-4     text-white flex items-center justify-between bg-blue-700">
        <div class="flex items-center gap-2.5">
          <div class="p-2 bg-white/10 rounded-xl">
            <Sparkles class="w-5 h-5 text-amber-300 animate-pulse" />
          </div>
          <div>
            <h3 class="font-bold text-sm flex items-center gap-2">
              <span>AI Schema Generator</span>
              <span
                v-if="state.currentUser?.isLoggedIn"
                class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase"
                :class="state.userProfile.tier === 'pro' ? 'bg-amber-400 text-slate-900' : 'bg-white/20 text-white'"
              >
                {{ state.userProfile.tier }}
              </span>
              <span
                v-else
                class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-amber-400 text-slate-900"
              >
                Account Required
              </span>
            </h3>
            <p class="text-[11px] text-blue-100 opacity-90">Instant ERD database design powered by Gemini AI</p>
          </div>
        </div>
        <button aria-label="Close dialog" @click="state.modals.aiGen = false" class="p-1 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition">
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Credit Meter Status Banner (Shown when authenticated) -->
      <div v-if="state.currentUser?.isLoggedIn" class="px-5 py-2.5 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
        <div class="flex items-center gap-2 text-slate-700 dark:text-slate-300">
          <Zap class="w-3.5 h-3.5 text-amber-500" />
          <span>
            <span v-if="state.userProfile?.tier === 'free'">Free Credits Left: </span>
            <span v-else>Credits Left: </span>
            <strong class="font-mono text-blue-600 dark:text-blue-400">{{ (state.userProfile?.creditsRemaining || 0).toLocaleString() }}</strong>
            <span class="text-slate-400"> / {{ (state.userProfile?.monthlyCreditAllowance || 0).toLocaleString() }}</span>
          </span>
        </div>

        <button
          v-if="isUpgradeCreditsEnabled"
          @click="openBilling"
          class="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
        >
          <span>Upgrade Tier</span>
          <ExternalLink class="w-3 h-3" />
        </button>
      </div>

      <!-- Modal Body Content -->
      <div class="p-5 overflow-y-auto space-y-4 text-xs flex-1">
        <!-- Guest Mode Sign-In Required Gate -->
        <div v-if="!state.currentUser?.isLoggedIn" class="py-3 px-2 text-center space-y-5">
          <div class="w-16 h-16 rounded-2xl     flex items-center justify-center mx-auto  shadow-blue-500/20 text-white bg-blue-700">
            <Sparkles class="w-8 h-8 text-amber-300 animate-pulse" />
          </div>

          <div class="space-y-1.5 max-w-md mx-auto">
            <h4 class="text-lg font-bold text-slate-900 dark:text-white">
              Sign In to Unlock Presto AI
            </h4>
            <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Presto AI generates complete, production-ready relational schemas from natural language prompts in seconds. Sign in with Google to activate your account and claim your free monthly AI credits.
            </p>
          </div>

          <!-- Feature perks grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-md mx-auto text-left text-xs">
            <div class="p-3 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-800/60 rounded-xl flex items-start gap-2.5">
              <Zap class="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <strong class="text-slate-800 dark:text-slate-200">50,000 Free Credits</strong>
                <p class="text-[11px] text-slate-500 dark:text-slate-400">Monthly allowance renewed automatically</p>
              </div>
            </div>

            <div class="p-3 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-800/60 rounded-xl flex items-start gap-2.5">
              <CheckCircle2 class="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <strong class="text-slate-800 dark:text-slate-200">Multi-Engine Dialects</strong>
                <p class="text-[11px] text-slate-500 dark:text-slate-400">PostgreSQL, MySQL, SQLite & MSSQL</p>
              </div>
            </div>

            <div class="p-3 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-800/60 rounded-xl flex items-start gap-2.5">
              <Sparkles class="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <strong class="text-slate-800 dark:text-slate-200">Smart Relationships</strong>
                <p class="text-[11px] text-slate-500 dark:text-slate-400">Automatic foreign keys & cardinality</p>
              </div>
            </div>

            <div class="p-3 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/60 rounded-xl flex items-start gap-2.5">
              <Check class="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <strong class="text-slate-800 dark:text-slate-200">Cloud Sync & Export</strong>
                <p class="text-[11px] text-slate-500 dark:text-slate-400">Persistent storage & SQL DDL output</p>
              </div>
            </div>
          </div>

          <!-- Google SSO CTA -->
          <div class="pt-2 max-w-sm mx-auto space-y-2">
            <button
              @click="handleSignIn"
              :disabled="state.isLoggingIn"
              class="w-full py-3 px-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed text-slate-800 dark:text-slate-100 font-bold border border-slate-300 dark:border-slate-600 rounded-xl transition flex items-center justify-center gap-3  group cursor-pointer"
            >
              <svg v-if="!state.isLoggingIn" class="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <div v-else class="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0"></div>
              <span>{{ state.isLoggingIn ? 'Connecting to Google...' : 'Sign in with Google to Continue' }}</span>
            </button>
            <p class="text-[11px] text-slate-400 dark:text-slate-500">
              Free forever • No credit card required • Instant activation
            </p>
          </div>
        </div>

        <!-- Authenticated Generator Flow -->
        <div v-else class="space-y-4">
          <!-- Error Banner -->
          <div v-if="errorMsg" class="p-3.5 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/80 rounded-xl flex items-start justify-between gap-3 text-red-700 dark:text-red-300 text-xs">
            <div class="flex items-start gap-2.5">
              <AlertTriangle class="w-4 h-4 shrink-0 mt-0.5" />
              <div class="space-y-1">
                <p class="font-semibold">{{ errorMsg }}</p>
              </div>
            </div>

            <button
              v-if="isUpgradeCreditsEnabled"
              @click="openBilling"
              class="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] rounded-lg transition shrink-0"
            >
              Upgrade via TallySale
            </button>
            <span
              v-else
              class="text-[11px] text-red-600 dark:text-red-400 font-semibold shrink-0"
            >
              0 Credits Left
            </span>
          </div>

          <!-- Mode & Dialect selection -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-slate-700 dark:text-slate-200 mb-1">Target Mode</label>
              <select
                v-model="mode"
                class="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 font-medium"
              >
                <option value="new">✨ Create New Project</option>
                <option value="extend">🧩 Extend Active Project ({{ activeProject ? activeProject.name : 'Current' }})</option>
              </select>
            </div>

            <div>
              <label class="block font-bold text-slate-700 dark:text-slate-200 mb-1">SQL Dialect</label>
              <select
                v-model="dialect"
                class="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 font-mono"
              >
                <option value="postgres">PostgreSQL 15+</option>
                <option value="mysql">MySQL 8.0+</option>
                <option value="sqlite">SQLite 3</option>
                <option value="mssql">SQL Server (T-SQL)</option>
                <option value="snowflake">Snowflake Data Warehouse</option>
              </select>
            </div>
          </div>

          <!-- Prompt Input with Character Counter -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="font-bold text-slate-700 dark:text-slate-200">
                Describe your application domain or data requirements
              </label>
              <span
                class="text-[10px] font-mono font-semibold"
                :class="userPrompt.length > state.userProfile.maxPromptLength ? 'text-rose-500 font-bold' : 'text-slate-400'"
              >
                {{ userPrompt.length }} / {{ state.userProfile.maxPromptLength }} chars
              </span>
            </div>

            <textarea
              v-model="userPrompt"
              rows="4"
              placeholder="e.g. An online food delivery app with customers, restaurants, menu items, orders, order items, delivery riders, driver locations, and customer reviews."
              class="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs leading-relaxed resize-none font-sans"
              :class="{ 'border-rose-500 focus:ring-rose-500': userPrompt.length > state.userProfile.maxPromptLength }"
            ></textarea>

            <p v-if="userPrompt.length > state.userProfile.maxPromptLength" class="text-[11px] text-rose-500 font-medium mt-1">
              Prompt exceeds your {{ state.userProfile.tier.toUpperCase() }} tier limit of {{ state.userProfile.maxPromptLength }} chars. Please shorten prompt<span v-if="isUpgradeCreditsEnabled"> or <a @click.prevent="openBilling" href="#" class="underline font-bold">Upgrade to Pro</a></span>.
            </p>
          </div>

          <!-- Quick Inspiration Chips -->
          <div>
            <p class="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-2">Try a sample prompt:</p>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="(chip, idx) in samplePrompts"
                :key="idx"
                @click="userPrompt = chip.prompt"
                class="px-2.5 py-1 bg-slate-100 dark:bg-slate-700/60 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:text-blue-600 dark:hover:text-blue-300 text-slate-600 dark:text-slate-300 rounded-lg text-[11px] transition text-left border border-slate-200/60 dark:border-slate-700 flex items-center gap-1.5"
              >
                <Wand2 class="w-3 h-3 text-blue-500 shrink-0" />
                <span>{{ chip.label }}</span>
              </button>
            </div>
          </div>

          <!-- Generated Result Preview -->
          <div v-if="previewResult" class="p-4 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 rounded-xl space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <CheckCircle2 class="w-4 h-4 text-emerald-500" />
                <span class="font-bold text-slate-800 dark:text-slate-100 text-xs">{{ previewResult.schemaName || 'Generated Schema' }}</span>
              </div>
              <span class="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-mono text-[10px]">
                {{ previewResult.tables ? previewResult.tables.length : 0 }} Tables • {{ previewResult.relationships ? previewResult.relationships.length : 0 }} Refs
              </span>
            </div>
            <p class="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">{{ previewResult.description }}</p>

            <div class="grid grid-cols-2 gap-2 pt-1 border-t border-blue-200/60 dark:border-blue-800/40 text-[11px]">
              <div v-for="tbl in previewResult.tables" :key="tbl.name" class="p-2 bg-white dark:bg-slate-800 rounded-lg border border-blue-100 dark:border-slate-700 flex items-center justify-between">
                <span class="font-mono font-semibold text-slate-700 dark:text-slate-200">{{ tbl.name }}</span>
                <span class="text-[10px] text-slate-400 font-mono">{{ tbl.columns ? tbl.columns.length : 0 }} cols</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="px-5 py-3.5 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
        <button
          @click="state.modals.aiGen = false"
          class="px-3 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-800 transition"
        >
          {{ state.currentUser?.isLoggedIn ? 'Cancel' : 'Close' }}
        </button>

        <div v-if="!state.currentUser?.isLoggedIn" class="flex items-center gap-2">
          <button
            @click="handleSignIn"
            class="px-4 py-2      text-white font-semibold rounded-xl transition flex items-center gap-2  cursor-pointer bg-blue-700"
          >
            <span>Sign in with Google</span>
          </button>
        </div>

        <div v-else class="flex items-center gap-2">
          <button
            v-if="previewResult"
            @click="applySchema"
            class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition flex items-center gap-1.5"
          >
            <Check class="w-3.5 h-3.5" />
            <span>Apply to Diagram</span>
          </button>

          <button
            @click="generateSchema"
            :disabled="isLoading || !userPrompt.trim() || userPrompt.length > state.userProfile.maxPromptLength"
            class="px-5 py-2      text-white font-medium rounded-xl transition flex items-center gap-1.5  disabled:opacity-50 disabled:cursor-not-allowed bg-blue-700"
          >
            <Loader2 v-if="isLoading" class="w-3.5 h-3.5 animate-spin" />
            <Sparkles v-else class="w-3.5 h-3.5 text-amber-300" />
            <span>{{ isLoading ? 'Designing Schema...' : (previewResult ? 'Regenerate' : 'Generate with AI') }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { state, activeProject, generateSchemaWithAI, applyAiGeneratedSchema, isUpgradeCreditsEnabled, loginWithGoogle } from '../stores/schemaStore.js';
import { Sparkles, X, Wand2, Loader2, AlertTriangle, CheckCircle2, Check, Zap, ExternalLink } from 'lucide-vue-next';

const mode = ref('new');
const dialect = ref('postgres');
const userPrompt = ref('');
const isLoading = ref(false);
const errorMsg = ref('');
const previewResult = ref(null);

const samplePrompts = [
  {
    label: '🛒 E-commerce Store',
    prompt: 'E-commerce platform with users, product categories, products, customer carts, orders, order items, payments, and product reviews.'
  },
  {
    label: '🏥 Hospital & Patients',
    prompt: 'Hospital management system tracking patients, doctors, medical departments, appointments, prescriptions, and billing invoices.'
  },
  {
    label: '🎓 LMS Learning Platform',
    prompt: 'Learning platform with instructors, students, courses, video lessons, course enrollments, quizzes, and student certificates.'
  },
  {
    label: '💼 B2B SaaS Subscriptions',
    prompt: 'Multi-tenant SaaS with organizations, team members, subscription plans, usage metrics, invoices, and API access keys.'
  }
];

function openBilling() {
  state.modals.billing = true;
}

async function handleSignIn() {
  if (state.isLoggingIn) return;
  await loginWithGoogle();
}

watch(
  () => state.modals.aiGen,
  (isOpen) => {
    if (isOpen) {
      errorMsg.value = '';
      previewResult.value = null;
      if (activeProject.value && activeProject.value.dialect) {
        dialect.value = activeProject.value.dialect;
      }
    }
  }
);

async function generateSchema() {
  if (!userPrompt.value.trim()) return;

  isLoading.value = true;
  errorMsg.value = '';
  previewResult.value = null;

  try {
    const result = await generateSchemaWithAI(userPrompt.value, dialect.value, mode.value);
    previewResult.value = result;
  } catch (err) {
    errorMsg.value = err.message || 'Failed to generate schema with Gemini AI';
  } finally {
    isLoading.value = false;
  }
}

async function applySchema() {
  if (!previewResult.value) return;
  const result = previewResult.value;
  const selectedMode = mode.value;
  state.modals.aiGen = false;
  await applyAiGeneratedSchema(result, selectedMode);
}
</script>
