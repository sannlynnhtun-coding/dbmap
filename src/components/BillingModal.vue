<template>
  <div
    v-if="state.modals.billing && isUpgradeCreditsEnabled"
    class="app-dialog-backdrop fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75  p-4 overflow-y-auto"
  >
    <div
      role="dialog" aria-modal="true" aria-label="Plan and AI credits" class="app-dialog bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl  w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in duration-150 my-6"
    >
      <!-- Header -->
      <div class="app-dialog-heading px-6 py-5     text-white flex items-center justify-between border-b border-slate-800 bg-blue-700">
        <div class="flex items-center gap-3">
          <div class="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <CreditCard class="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h2 class="text-lg font-bold flex items-center gap-2">
              <span>Upgrade & AI Credits</span>
              <span
                class="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold tracking-wide uppercase border"
                :class="[
                  state.userProfile?.tier === 'pro'
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                    : 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                ]"
              >
                {{ state.userProfile?.tier || 'free' }} TIER
              </span>
            </h2>
            <p class="text-xs text-slate-400">
              Manage your plan, credits, and invoices.
            </p>
          </div>
        </div>

        <button aria-label="Close dialog"
          @click="closeModal"
          class="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Modal Body -->
      <div class="p-6 space-y-6 max-h-[82vh] overflow-y-auto">
        <!-- Current Credit Balance Widget -->
        <div class="p-5 rounded-2xl      border border-slate-200 dark:border-slate-700/80 app-soft-surface">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div>
              <span class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Monthly AI Token Meter
              </span>
              <div class="flex items-baseline gap-2 mt-1">
                <span class="text-3xl font-semibold text-slate-900 dark:text-white font-mono">
                  {{ (state.userProfile?.creditsRemaining || 0).toLocaleString() }}
                </span>
                <span class="text-sm font-medium text-slate-500 dark:text-slate-400">
                  / {{ (state.userProfile?.monthlyCreditAllowance || 0).toLocaleString() }} Credits
                </span>
              </div>
            </div>

            <div class="text-left sm:text-right">
              <span class="text-xs text-slate-500 dark:text-slate-400 block">Max Prompt Capacity</span>
              <span class="text-sm font-bold font-mono text-blue-600 dark:text-blue-400">
                {{ (state.userProfile?.maxPromptLength || 0).toLocaleString() }} Chars / Prompt
              </span>
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="w-full bg-slate-200 dark:bg-slate-700 h-3 rounded-full overflow-hidden p-0.5">
            <div
              class="h-full rounded-full transition-all duration-500     bg-blue-700"
              :style="{ width: `${Math.min(100, Math.max(2, ((state.userProfile?.creditsRemaining || 0) / (state.userProfile?.monthlyCreditAllowance || 1)) * 100))}%` }"
            ></div>
          </div>

          <div class="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span class="flex items-center gap-1">
              <Zap class="w-3.5 h-3.5 text-amber-500" />
              1 Token = 1 Credit (Prompt + ERD Generation)
            </span>
            <span>Resets Monthly</span>
          </div>
        </div>

        <!-- Live TallySale Invoice Created & Redirect Box -->
        <div
          v-if="generatedInvoice"
          class="p-5 rounded-2xl     border border-blue-500/40 text-white space-y-4  animate-in fade-in bg-blue-700"
        >
          <!-- Redirect Countdown Banner -->
          <div
            v-if="redirectCountdown > 0 && generatedInvoice.checkout_url"
            class="flex items-center justify-between p-3.5 bg-blue-600/30 border border-blue-400/40 rounded-xl text-xs text-blue-100 font-medium"
          >
            <div class="flex items-center gap-2">
              <Rocket class="w-4 h-4 text-amber-400 animate-bounce" />
              <span>
                Redirecting to TallySale hosted checkout in
                <strong class="font-mono text-amber-300 text-sm font-bold">{{ redirectCountdown }}</strong>s...
              </span>
            </div>
            <button
              @click="skipToCheckout"
              class="text-xs font-bold text-amber-300 hover:text-white underline cursor-pointer"
            >
              Go now →
            </button>
          </div>

          <div class="flex items-center justify-between pb-3 border-b border-blue-900/60">
            <div class="flex items-center gap-2.5">
              <div class="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Receipt class="w-5 h-5" />
              </div>
              <div>
                <h3 class="font-bold text-sm text-white">TallySale Invoice Generated</h3>
                <p class="text-[11px] text-slate-300">
                  Ref: <span class="font-mono text-amber-300 font-bold">{{ generatedInvoice.invoice_number || generatedInvoice.id }}</span>
                </p>
              </div>
            </div>
            <span class="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {{ generatedInvoice.status || 'PENDING' }}
            </span>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-950/60 p-3.5 rounded-xl text-xs">
            <div>
              <span class="text-slate-400 block text-[10px] uppercase font-semibold">Customer</span>
              <span class="text-white font-medium truncate block">{{ customerName }}</span>
            </div>
            <div>
              <span class="text-slate-400 block text-[10px] uppercase font-semibold">Total Amount</span>
              <span class="text-amber-400 font-semibold text-sm font-mono">{{ formatCurrency(selectedProduct.price, selectedCurrency) }}</span>
            </div>
            <div>
              <span class="text-slate-400 block text-[10px] uppercase font-semibold">Webhook / Callback</span>
              <span class="text-slate-300 text-[11px] font-mono truncate block">/api/tallysale/webhook</span>
            </div>
          </div>

          <!-- Checkout URL Link bar -->
          <div v-if="generatedInvoice.checkout_url" class="p-3 bg-emerald-950/50 border border-emerald-500/30 rounded-xl text-xs flex items-center justify-between gap-3">
            <div class="min-w-0 flex-1">
              <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-0.5">✅ CHECKOUT URL</span>
              <a
                :href="generatedInvoice.checkout_url"
                target="_blank"
                rel="noopener noreferrer"
                class="text-blue-300 hover:text-white font-mono text-[11px] truncate block hover:underline"
              >
                {{ generatedInvoice.checkout_url }}
              </a>
            </div>
            <a
              :href="generatedInvoice.checkout_url"
              target="_blank"
              rel="noopener noreferrer"
              class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition shrink-0 flex items-center gap-1"
            >
              <span>Open</span>
              <ExternalLink class="w-3.5 h-3.5" />
            </a>
          </div>

          <div class="flex flex-wrap gap-2.5 pt-1">
            <a
              v-if="generatedInvoice.checkout_url"
              :href="generatedInvoice.checkout_url"
              target="_blank"
              rel="noopener noreferrer"
              class="flex-1 py-3 px-4       text-white font-bold text-xs rounded-xl  transition flex items-center justify-center gap-2 cursor-pointer min-w-[180px] bg-blue-700"
            >
              <span>Pay on TallySale Hosted Checkout</span>
              <ExternalLink class="w-4 h-4" />
            </a>

            <button
              @click="handleOpenCustomerPortal"
              :disabled="isGeneratingSso"
              class="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <Loader2 v-if="isGeneratingSso" class="w-4 h-4 animate-spin" />
              <UserCheck v-else class="w-4 h-4 text-blue-400" />
              <span>Customer Portal (Merchant SSO)</span>
            </button>

            <button
              @click="handleVerifyPaymentStatus"
              :disabled="isVerifying"
              class="py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <Loader2 v-if="isVerifying" class="w-4 h-4 animate-spin" />
              <RefreshCw v-else class="w-4 h-4" />
              <span>{{ isVerifying ? 'Verifying...' : 'Verify Status' }}</span>
            </button>

            <button
              @click="clearGeneratedInvoice"
              class="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition cursor-pointer shrink-0"
            >
              Done
            </button>
          </div>
        </div>

        <!-- Customer Order Configuration & Currency Selection -->
        <div class="p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700  space-y-4">
          <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/80 pb-3">
            <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <ShoppingBag class="w-4 h-4 text-blue-500" />
              <span>Order Configuration</span>
            </h3>

            <!-- Currency Toggle -->
            <div class="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                @click="selectedCurrency = 'MMK'"
                class="px-2.5 py-1 text-xs font-bold rounded-lg transition"
                :class="selectedCurrency === 'MMK' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'"
              >
                MMK (Kyat)
              </button>
              <button
                type="button"
                @click="selectedCurrency = 'USD'"
                class="px-2.5 py-1 text-xs font-bold rounded-lg transition"
                :class="selectedCurrency === 'USD' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'"
              >
                USD ($)
              </button>
            </div>
          </div>

          <!-- Customer Name & Email Inputs -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Customer Name
              </label>
              <input
                v-model="customerName"
                type="text"
                required
                placeholder="Developer name"
                class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Customer Email
              </label>
              <input
                v-model="customerEmail"
                type="email"
                required
                placeholder="developer@dbmaps.io"
                class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <!-- Products / Plans Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div
              v-for="prod in productsList"
              :key="prod.id"
              @click="selectedProductId = prod.id"
              class="p-4 rounded-xl border-2 cursor-pointer transition text-left relative flex flex-col justify-between"
              :class="[
                selectedProductId === prod.id
                  ? 'border-blue-600 dark:border-blue-500 bg-blue-50/40 dark:bg-blue-950/30 shadow-xs'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-600'
              ]"
            >
              <div
                v-if="prod.isPopular"
                class="absolute -top-2.5 right-3    text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full  bg-blue-700"
              >
                Recommended
              </div>

              <div>

                <h4 class="font-bold text-xs text-slate-900 dark:text-white">{{ prod.name }}</h4>
                <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{{ prod.desc }}</p>
              </div>

              <div class="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-baseline justify-between">
                <span class="font-semibold text-sm font-mono text-blue-600 dark:text-blue-400">
                  {{ formatCurrency(prod.price, selectedCurrency) }}
                </span>
                <span class="text-[10px] text-slate-400 font-medium">{{ prod.period }}</span>
              </div>
            </div>
          </div>

          <!-- Checkout Action Button -->
          <div class="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              @click="handleCreateInvoice"
              :disabled="isGeneratingInvoice"
              class="flex-1 py-3.5 px-6       text-white font-bold text-xs sm:text-sm rounded-xl  transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 bg-blue-700"
            >
              <Loader2 v-if="isGeneratingInvoice" class="w-4 h-4 animate-spin" />
              <Lock v-else class="w-4 h-4" />
              <span>{{ isGeneratingInvoice ? 'Creating TallySale Invoice (HMAC Signed)...' : `Create Invoice & Get Checkout URL (${formatCurrency(selectedProduct.price, selectedCurrency)})` }}</span>
              <ArrowRight v-if="!isGeneratingInvoice" class="w-4 h-4" />
            </button>

            <button
              type="button"
              @click="handleOpenCustomerPortal"
              :disabled="isGeneratingSso"
              class="py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <Loader2 v-if="isGeneratingSso" class="w-3.5 h-3.5 animate-spin" />
              <ExternalLink v-else class="w-3.5 h-3.5 text-blue-500" />
              <span>Customer Portal (SSO)</span>
            </button>
          </div>
        </div>

        <!-- Collapsible Developer / Advanced API & Offline Verification Drawer -->
        <div class="border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 overflow-hidden">
          <button
            @click="showManualVerify = !showManualVerify"
            type="button"
            class="w-full p-4 flex items-center justify-between text-left hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition cursor-pointer"
          >
            <div class="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <ShieldCheck class="w-4 h-4 text-blue-500" />
              <span>Have an existing TallySale Invoice # or need manual verification?</span>
            </div>
            <ChevronDown v-if="!showManualVerify" class="w-4 h-4 text-slate-400" />
            <ChevronUp v-else class="w-4 h-4 text-slate-400" />
          </button>

          <div v-if="showManualVerify" class="p-4 pt-1 border-t border-slate-200/60 dark:border-slate-800 space-y-4">
            <form @submit.prevent="handlePaymentSubmit" class="space-y-3">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    TallySale Invoice / Reference # *
                  </label>
                  <input
                    v-model="manualInvoiceRef"
                    type="text"
                    required
                    placeholder="e.g. TS-INV-98214"
                    class="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Notes / Reference ID (Optional)
                  </label>
                  <input
                    v-model="manualNotes"
                    type="text"
                    placeholder="Bank / AYA PGW reference"
                    class="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  />
                </div>
              </div>

              <div class="flex items-center justify-between pt-1">
                <button
                  type="button"
                  @click="handleOpenCustomerPortal"
                  class="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Open TallySale Portal SSO</span>
                  <ExternalLink class="w-3 h-3" />
                </button>

                <button
                  type="submit"
                  :disabled="isSubmittingManual || !manualInvoiceRef.trim()"
                  class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 cursor-pointer"
                >
                  <Loader2 v-if="isSubmittingManual" class="w-3.5 h-3.5 animate-spin" />
                  <Send v-else class="w-3.5 h-3.5" />
                  <span>Verify Payment Ref</span>
                </button>
              </div>
            </form>

            <!-- Payment Requests History -->
            <div v-if="userPayments.length > 0" class="pt-3 border-t border-slate-200/60 dark:border-slate-800">
              <h4 class="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Your Payment Records
              </h4>
              <div class="space-y-1.5 max-h-44 overflow-y-auto">
                <div
                  v-for="pay in userPayments"
                  :key="pay.id"
                  class="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                >
                  <div class="flex items-center gap-3">
                    <div class="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {{ pay.invoiceRef }}
                    </div>
                    <span class="text-slate-500 text-[11px]">
                      {{ new Date(pay.createdAt).toLocaleDateString() }}
                    </span>
                  </div>

                  <span
                    class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                    :class="[
                      pay.status === 'APPROVED' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400' :
                      pay.status === 'REJECTED' ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400' :
                      'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                    ]"
                  >
                    {{ pay.status }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import {
  state,
  createTallySaleInvoice,
  fetchMerchantSsoUrl,
  verifyTallySalePayment,
  submitTallySalePayment,
  fetchUserPayments,
  isUpgradeCreditsEnabled
} from '../stores/schemaStore.js';
import {
  CreditCard,
  X,
  Zap,
  Check,
  ExternalLink,
  Send,
  Loader2,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  ArrowRight,
  Receipt,
  ShoppingBag,
  Rocket,
  Lock,
  UserCheck,
  RefreshCw
} from 'lucide-vue-next';

const selectedCurrency = ref('MMK');
const selectedProductId = ref('pro-monthly');
const customerName = ref(state.currentUser.name || 'dbmaps Developer');
const customerEmail = ref(state.currentUser.email || 'developer@dbmaps.io');

const isGeneratingInvoice = ref(false);
const isGeneratingSso = ref(false);
const isVerifying = ref(false);
const isSubmittingManual = ref(false);
const showManualVerify = ref(false);

const generatedInvoice = ref(null);
const redirectCountdown = ref(0);
let redirectTimer = null;

const manualInvoiceRef = ref('');
const manualNotes = ref('');
const userPayments = ref([]);

const productsList = computed(() => {
  if (selectedCurrency.value === 'USD') {
    return [
      { id: 'pro-monthly', name: 'Pro Monthly', price: 29, period: '/ month', desc: '1,000,000 AI credits & 20k char prompts', icon: '⚡', isPopular: true },
      { id: 'pro-annual', name: 'Pro Annual', price: 290, period: '/ year', desc: '12,000,000 AI credits (Save $58/yr)', icon: '👑', isPopular: false },
      { id: 'credits-topup', name: 'AI Credit Boost', price: 10, period: 'one-time', desc: '+500,000 AI credits', icon: '🔋', isPopular: false }
    ];
  }
  return [
    { id: 'pro-monthly', name: 'Pro Monthly', price: 15000, period: '/ month', desc: '1,000,000 AI credits & 20k char prompts', icon: '⚡', isPopular: true },
    { id: 'pro-annual', name: 'Pro Annual', price: 150000, period: '/ year', desc: '12,000,000 AI credits (Save 30,000 MMK)', icon: '👑', isPopular: false },
    { id: 'credits-topup', name: 'AI Credit Boost', price: 5000, period: 'one-time', desc: '+500,000 AI credits', icon: '🔋', isPopular: false }
  ];
});

const selectedProduct = computed(() => {
  return productsList.value.find(p => p.id === selectedProductId.value) || productsList.value[0];
});

function formatCurrency(amount, currency) {
  if (currency === 'USD') {
    return '$' + amount.toLocaleString();
  }
  return amount.toLocaleString() + ' MMK';
}

function startCountdown(url) {
  if (!url) return;
  if (redirectTimer) clearInterval(redirectTimer);
  redirectCountdown.value = 5;

  redirectTimer = setInterval(() => {
    redirectCountdown.value -= 1;
    if (redirectCountdown.value <= 0) {
      clearInterval(redirectTimer);
      window.location.href = url;
    }
  }, 1000);
}

function skipToCheckout() {
  if (redirectTimer) clearInterval(redirectTimer);
  if (generatedInvoice.value?.checkout_url) {
    window.location.href = generatedInvoice.value.checkout_url;
  }
}

function clearGeneratedInvoice() {
  if (redirectTimer) clearInterval(redirectTimer);
  redirectCountdown.value = 0;
  generatedInvoice.value = null;
}

function closeModal() {
  if (redirectTimer) clearInterval(redirectTimer);
  state.modals.billing = false;
}

async function loadHistory() {
  userPayments.value = await fetchUserPayments();
}

async function handleCreateInvoice() {
  isGeneratingInvoice.value = true;
  try {
    const prod = selectedProduct.value;
    const plan = prod.id.startsWith('pro') ? 'pro' : 'credits';

    const res = await createTallySaleInvoice({
      customer_name: customerName.value,
      customer_email: customerEmail.value,
      currency: selectedCurrency.value,
      plan,
      items: [
        {
          description: `${prod.name} (${prod.desc})`,
          quantity: 1,
          unit_price: prod.price
        }
      ]
    });

    const inv = res.data || res.invoice;
    if (inv) {
      generatedInvoice.value = inv;
      if (inv.checkout_url) {
        startCountdown(inv.checkout_url);
      }
    }
    await loadHistory();
  } catch (err) {
    console.error('Invoice Creation failed:', err);
  } finally {
    isGeneratingInvoice.value = false;
  }
}

async function handleOpenCustomerPortal() {
  isGeneratingSso.value = true;
  try {
    const ssoUrl = await fetchMerchantSsoUrl(customerEmail.value);
    if (ssoUrl) {
      window.open(ssoUrl, '_blank');
    }
  } catch (err) {
    console.error('SSO error:', err);
  } finally {
    isGeneratingSso.value = false;
  }
}

async function handleVerifyPaymentStatus() {
  if (!generatedInvoice.value) return;
  isVerifying.value = true;
  try {
    const reqId = generatedInvoice.value.id;
    const invRef = generatedInvoice.value.invoice_number || String(generatedInvoice.value.id);
    const res = await verifyTallySalePayment({ requestId: reqId, invoiceRef: invRef });
    if (res?.paid) {
      clearGeneratedInvoice();
    }
    await loadHistory();
  } catch (e) {
    console.error('Verify error:', e);
  } finally {
    isVerifying.value = false;
  }
}

async function handlePaymentSubmit() {
  if (!manualInvoiceRef.value.trim()) return;
  isSubmittingManual.value = true;
  try {
    const res = await verifyTallySalePayment({ invoiceRef: manualInvoiceRef.value.trim() });
    if (!res?.paid) {
      await submitTallySalePayment(manualInvoiceRef.value.trim(), manualNotes.value.trim());
    }
    manualInvoiceRef.value = '';
    manualNotes.value = '';
    await loadHistory();
  } catch (e) {
    console.error('Manual submit error:', e);
  } finally {
    isSubmittingManual.value = false;
  }
}

watch(() => state.modals.billing, (newVal) => {
  if (newVal) {
    customerName.value = state.currentUser.name || 'dbmaps Developer';
    customerEmail.value = state.currentUser.email || 'developer@dbmaps.io';
    loadHistory();
  } else {
    if (redirectTimer) clearInterval(redirectTimer);
  }
});

onMounted(() => {
  loadHistory();
});
</script>
