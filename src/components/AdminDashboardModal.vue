<template>
  <div
    v-if="state.modals.adminDashboard"
    class="app-dialog-backdrop fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80  p-4 overflow-y-auto"
  >
    <div v-dialog
      role="dialog" aria-modal="true" aria-label="Administration" class="app-dialog bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl  w-full max-w-5xl overflow-hidden animate-in fade-in zoom-in duration-150 my-6"
    >
      <!-- Header -->
      <div class="app-dialog-heading px-6 py-5     text-white flex items-center justify-between border-b border-slate-800 bg-blue-700">
        <div class="flex items-center gap-3">
          <div class="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <ShieldCheck class="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h2 class="text-lg font-bold flex items-center gap-2">
              <span>Admin Tier & Payment Control Center</span>
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                ADMIN ACCESS
              </span>
            </h2>
            <p class="text-xs text-slate-400">
              Manage user tiers, approve TallySale invoice payments, top up AI credits, and edit system limits
            </p>
          </div>
        </div>

        <button aria-label="Close dialog"
          @click="state.modals.adminDashboard = false"
          class="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Admin Tabs Navigation -->
      <div class="px-6 pt-3 bg-slate-100 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex gap-2 overflow-x-auto text-xs font-semibold">
        <button
          @click="activeAdminTab = 'payments'"
          class="px-4 py-2.5 rounded-t-xl border-b-2 transition flex items-center gap-2"
          :class="[
            activeAdminTab === 'payments'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          ]"
        >
          <Receipt class="w-4 h-4 text-amber-500" />
          <span>TallySale Payment Approvals</span>
          <span
            v-if="pendingRequestsCount > 0"
            class="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-bold"
          >
            {{ pendingRequestsCount }}
          </span>
        </button>

        <button
          @click="activeAdminTab === 'users' ? null : (activeAdminTab = 'users')"
          class="px-4 py-2.5 rounded-t-xl border-b-2 transition flex items-center gap-2"
          :class="[
            activeAdminTab === 'users'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          ]"
        >
          <Users class="w-4 h-4 text-blue-500" />
          <span>User Accounts & Credits</span>
        </button>

        <button
          @click="activeAdminTab = 'config'"
          class="px-4 py-2.5 rounded-t-xl border-b-2 transition flex items-center gap-2"
          :class="[
            activeAdminTab === 'config'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          ]"
        >
          <Sliders class="w-4 h-4 text-blue-500" />
          <span>AI Engine & Credit Quotas</span>
        </button>

        <button
          @click="activeAdminTab = 'logs'"
          class="px-4 py-2.5 rounded-t-xl border-b-2 transition flex items-center gap-2"
          :class="[
            activeAdminTab === 'logs'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          ]"
        >
          <Activity class="w-4 h-4 text-emerald-500" />
          <span>AI Usage Logs</span>
          <span
            v-if="logsList.length > 0"
            class="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500 text-white font-bold"
          >
            {{ logsList.length }}
          </span>
        </button>

        <button
          @click="activeAdminTab = 'marketplace'"
          class="px-4 py-2.5 rounded-t-xl border-b-2 transition flex items-center gap-2 cursor-pointer"
          :class="[
            activeAdminTab === 'marketplace'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          ]"
        >
          <Layers class="w-4 h-4 text-blue-500" />
          <span>Marketplace Blueprints</span>
          <span
            class="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-500 text-white font-bold"
          >
            {{ allMarketplaceTemplates.length }}
          </span>
        </button>
      </div>

      <!-- Tab Content Area -->
      <div class="p-6 max-h-[75vh] overflow-y-auto space-y-6">

        <!-- TAB 1: TallySale Payment Approvals -->
        <div v-if="activeAdminTab === 'payments'" class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="font-bold text-slate-900 dark:text-white text-base">
                TallySale Invoicing Payment Approvals
              </h3>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                Review submitted TallySale invoice numbers. Approving automatically grants Pro tier & 1,000,000 credits.
              </p>
            </div>

            <button
              @click="loadAdminData"
              class="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition flex items-center gap-1.5"
            >
              <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': isLoading }" />
              <span>Refresh</span>
            </button>
          </div>

          <div v-if="requestsList.length === 0" class="p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 text-xs">
            No TallySale payment verification requests submitted yet.
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="req in requestsList"
              :key="req.id"
              class="p-4 rounded-xl border transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              :class="[
                req.status === 'PENDING'
                  ? 'border-amber-300 dark:border-amber-700/60 bg-amber-50/20 dark:bg-amber-950/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
              ]"
            >
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <span class="font-mono font-bold text-sm text-slate-900 dark:text-white">
                    {{ req.invoiceRef }}
                  </span>
                  <span
                    class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                    :class="[
                      req.status === 'APPROVED' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400' :
                      req.status === 'REJECTED' ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400' :
                      'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                    ]"
                  >
                    {{ req.status }}
                  </span>
                </div>

                <div class="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-3">
                  <span>User: <strong>{{ req.userEmail || req.userId }}</strong></span>
                  <span>•</span>
                  <span>Requested: <strong>PRO TIER ($29)</strong></span>
                  <span>•</span>
                  <span class="text-slate-400">{{ new Date(req.createdAt).toLocaleString() }}</span>
                </div>

                <p v-if="req.notes" class="text-xs text-slate-500 italic bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md inline-block">
                  Note: {{ req.notes }}
                </p>
              </div>

              <!-- Action Buttons -->
              <div v-if="req.status === 'PENDING'" class="flex items-center gap-2 shrink-0">
                <button
                  @click="handleApprovePayment(req.id, 'APPROVED')"
                  class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl  transition flex items-center gap-1.5"
                >
                  <CheckCircle2 class="w-4 h-4" />
                  <span>Approve & Grant Pro</span>
                </button>

                <button
                  @click="handleApprovePayment(req.id, 'REJECTED')"
                  class="px-3 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-950 text-slate-700 dark:text-slate-300 hover:text-rose-600 font-semibold text-xs rounded-xl transition"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 2: User Tiers & Credits Table -->
        <div v-if="activeAdminTab === 'users'" class="space-y-4">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 class="font-bold text-slate-900 dark:text-white text-base">Registered Users & Tier Controls</h3>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                Manually adjust user tiers, add bonus credits, or modify administrator roles.
              </p>
            </div>

            <input
              v-model="userSearchQuery"
              type="text"
              placeholder="Search user email or ID..."
              class="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white w-full sm:w-64"
            />
          </div>

          <div class="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider">
                <tr>
                  <th class="p-3">User Email / Name</th>
                  <th class="p-3">Current Tier</th>
                  <th class="p-3">Remaining Credits</th>
                  <th class="p-3">Total Used</th>
                  <th class="p-3">Role</th>
                  <th class="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                <tr
                  v-for="u in filteredUsers"
                  :key="u.uid"
                  class="hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-200"
                >
                  <td class="p-3 font-medium">
                    <div>{{ u.email || 'guest@dbmaps.io' }}</div>
                    <div class="text-[10px] text-slate-400 font-mono">{{ u.uid }}</div>
                  </td>

                  <td class="p-3">
                    <span
                      class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border"
                      :class="[
                        u.tier === 'pro'
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                          : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800'
                      ]"
                    >
                      {{ u.tier || 'free' }}
                    </span>
                  </td>

                  <td class="p-3 font-mono font-bold">
                    {{ (u.creditsRemaining || 0).toLocaleString() }}
                  </td>

                  <td class="p-3 font-mono text-slate-500">
                    {{ (u.creditsUsedTotal || 0).toLocaleString() }}
                  </td>

                  <td class="p-3">
                    <span
                      class="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                      :class="u.role === 'admin' ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'"
                    >
                      {{ u.role || 'user' }}
                    </span>
                  </td>

                  <td class="p-3 text-right">
                    <div class="inline-flex items-center gap-1.5 flex-wrap justify-end">
                      <button
                        @click="handleToggleUserTier(u)"
                        class="px-2.5 py-1 bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 text-blue-600 dark:text-blue-300 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                        :title="`Switch tier to ${u.tier === 'pro' ? 'Free' : 'Pro'}`"
                      >
                        Set {{ u.tier === 'pro' ? 'Free' : 'Pro' }}
                      </button>

                      <button
                        @click="handleTopUpUserCredits(u, 10000)"
                        class="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                        title="Add +10,000 bonus credits to balance"
                      >
                        +10k
                      </button>

                      <button
                        @click="handleTopUpUserCredits(u, 50000)"
                        class="px-2.5 py-1 bg-amber-50 dark:bg-amber-950 hover:bg-amber-100 text-amber-700 dark:text-amber-300 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                        title="Add +50,000 bonus credits to balance"
                      >
                        +50k
                      </button>

                      <button
                        v-if="u.tier !== 'pro'"
                        @click="handleResetUserToFreeDefault(u)"
                        class="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-[11px] font-semibold transition cursor-pointer flex items-center gap-1"
                        :title="`Reset balance to standard base credit allowance (${(state.systemConfig.freeTierMonthlyCredits || 50000).toLocaleString()})`"
                      >
                        <RotateCcw class="w-3 h-3 text-slate-500" />
                        Reset Base ({{ Math.round((state.systemConfig.freeTierMonthlyCredits || 50000) / 1000) }}k)
                      </button>

                      <button
                        @click="handleSetExactCredits(u)"
                        class="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-lg text-[11px] font-mono transition cursor-pointer"
                        title="Set exact custom credit amount"
                      >
                        Exact...
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- TAB 3: AI Engine & Credit Quotas -->
        <div v-if="activeAdminTab === 'config'" class="space-y-5">
          <div>
            <h3 class="font-bold text-slate-900 dark:text-white text-base">AI Engine & Credit Quota Configuration</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              Configure active Gemini AI models, standard user credit allowances, expanded quotas, prompt character limits, and TallySale invoicing.
            </p>
          </div>

          <form @submit.prevent="handleSaveSystemConfig" class="space-y-5">
            <!-- AI Engine Model Selector Card -->
            <div class="p-5        rounded-xl border-2 border-blue-200 dark:border-blue-800/80  space-y-4 app-soft-surface">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div class="flex items-center gap-2.5">
                  <div class="p-2 rounded-lg bg-blue-600 text-white">
                    <Cpu class="w-4 h-4" />
                  </div>
                  <div>
                    <h4 class="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      Gemini AI Engine Model
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                        Active: {{ configForm.aiModel || 'gemini-3.8-flash' }}
                      </span>
                    </h4>
                    <p class="text-xs text-slate-500 dark:text-slate-400">
                      Choose which Google Gemini model processes user prompts for ERD, DBML, and SQL generation.
                    </p>
                  </div>
                </div>
              </div>

              <!-- Quick Model Select Cards -->
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <button
                  type="button"
                  @click="configForm.aiModel = 'gemini-3.8-flash'"
                  class="p-3 text-left rounded-xl border transition cursor-pointer flex flex-col justify-between"
                  :class="configForm.aiModel === 'gemini-3.8-flash'
                    ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 ring-2 ring-blue-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'"
                >
                  <div>
                    <div class="flex items-center justify-between">
                      <span class="font-bold text-xs text-slate-900 dark:text-white">Gemini 3.8 Flash</span>
                      <span class="text-[9px] px-1.5 py-0.5 rounded font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">Default</span>
                    </div>
                    <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Next-gen multimodal flash. High reasoning speed & precision.</p>
                    <div class="mt-2.5 space-y-1">
                      <div class="flex items-center justify-between text-[10px]">
                        <span class="text-slate-500">Rate:</span>
                        <span class="font-bold text-blue-600 dark:text-blue-400 font-mono">1.0x Credits</span>
                      </div>
                      <div class="flex items-center justify-between text-[10px]">
                        <span class="text-slate-500">API Cost:</span>
                        <span class="font-mono text-slate-600 dark:text-slate-300">$0.075 / $0.30</span>
                      </div>
                    </div>
                  </div>
                  <div class="text-[10px] font-mono text-blue-600 dark:text-blue-400 mt-2 font-medium">gemini-3.8-flash</div>
                </button>

                <button
                  type="button"
                  @click="configForm.aiModel = 'gemini-3.1-pro-preview'"
                  class="p-3 text-left rounded-xl border transition cursor-pointer flex flex-col justify-between"
                  :class="configForm.aiModel === 'gemini-3.1-pro-preview'
                    ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 ring-2 ring-blue-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'"
                >
                  <div>
                    <div class="flex items-center justify-between">
                      <span class="font-bold text-xs text-slate-900 dark:text-white">Gemini 3.1 Pro</span>
                      <span class="text-[9px] px-1.5 py-0.5 rounded font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">Deep Reasoning</span>
                    </div>
                    <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Highest intelligence for massive multi-table enterprise schemas.</p>
                    <div class="mt-2.5 space-y-1">
                      <div class="flex items-center justify-between text-[10px]">
                        <span class="text-slate-500">Rate:</span>
                        <span class="font-bold text-blue-600 dark:text-blue-400 font-mono">5.0x Credits</span>
                      </div>
                      <div class="flex items-center justify-between text-[10px]">
                        <span class="text-slate-500">API Cost:</span>
                        <span class="font-mono text-slate-600 dark:text-slate-300">$1.25 / $5.00</span>
                      </div>
                    </div>
                  </div>
                  <div class="text-[10px] font-mono text-blue-600 dark:text-blue-400 mt-2 font-medium">gemini-3.1-pro-preview</div>
                </button>

                <button
                  type="button"
                  @click="configForm.aiModel = 'gemini-3.1-flash-lite'"
                  class="p-3 text-left rounded-xl border transition cursor-pointer flex flex-col justify-between"
                  :class="configForm.aiModel === 'gemini-3.1-flash-lite'
                    ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 ring-2 ring-blue-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'"
                >
                  <div>
                    <div class="flex items-center justify-between">
                      <span class="font-bold text-xs text-slate-900 dark:text-white">Gemini 3.1 Flash Lite</span>
                      <span class="text-[9px] px-1.5 py-0.5 rounded font-bold bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">Ultra Fast</span>
                    </div>
                    <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Lightweight, lowest cost per token, lowest quota burn.</p>
                    <div class="mt-2.5 space-y-1">
                      <div class="flex items-center justify-between text-[10px]">
                        <span class="text-slate-500">Rate:</span>
                        <span class="font-bold text-emerald-600 dark:text-emerald-400 font-mono">0.5x Credits</span>
                      </div>
                      <div class="flex items-center justify-between text-[10px]">
                        <span class="text-slate-500">API Cost:</span>
                        <span class="font-mono text-slate-600 dark:text-slate-300">$0.0375 / $0.15</span>
                      </div>
                    </div>
                  </div>
                  <div class="text-[10px] font-mono text-blue-600 dark:text-blue-400 mt-2 font-medium">gemini-3.1-flash-lite</div>
                </button>

                <button
                  type="button"
                  @click="configForm.aiModel = 'gemini-2.5-flash'"
                  class="p-3 text-left rounded-xl border transition cursor-pointer flex flex-col justify-between"
                  :class="configForm.aiModel === 'gemini-2.5-flash'
                    ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 ring-2 ring-blue-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'"
                >
                  <div>
                    <div class="flex items-center justify-between">
                      <span class="font-bold text-xs text-slate-900 dark:text-white">Gemini 2.5 Flash</span>
                      <span class="text-[9px] px-1.5 py-0.5 rounded font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">High Quota</span>
                    </div>
                    <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1">High stability, generous rate limits and production fallback.</p>
                    <div class="mt-2.5 space-y-1">
                      <div class="flex items-center justify-between text-[10px]">
                        <span class="text-slate-500">Rate:</span>
                        <span class="font-bold text-blue-600 dark:text-blue-400 font-mono">1.0x Credits</span>
                      </div>
                      <div class="flex items-center justify-between text-[10px]">
                        <span class="text-slate-500">API Cost:</span>
                        <span class="font-mono text-slate-600 dark:text-slate-300">$0.075 / $0.30</span>
                      </div>
                    </div>
                  </div>
                  <div class="text-[10px] font-mono text-blue-600 dark:text-blue-400 mt-2 font-medium">gemini-2.5-flash</div>
                </button>
              </div>

              <!-- Active Model Pricing & Credit Calculation Formula Banner -->
              <div class="p-3.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div class="flex items-center gap-2.5">
                  <div class="p-1.5 rounded-lg bg-blue-600 text-white">
                    <Sparkles class="w-4 h-4" />
                  </div>
                  <div>
                    <div class="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <span>Model Pricing Formula:</span>
                      <span class="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                        {{ activeModelCreditMultiplier }}x Credits per Token
                      </span>
                    </div>
                    <p class="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                      Base Token Cost: {{ activeModelCostRateText }}. Users are billed <strong class="text-blue-600 dark:text-blue-400 font-mono">{{ activeModelCreditMultiplier }} credits</strong> per token consumed.
                    </p>
                  </div>
                </div>
                <div class="text-right shrink-0">
                  <div class="text-[10px] text-slate-500">Example 2,000 Tokens:</div>
                  <div class="font-mono font-bold text-blue-600 dark:text-blue-400 text-xs">
                    {{ (2000 * activeModelCreditMultiplier).toLocaleString() }} credits (~${{ ((2000 * activeModelCreditMultiplier * 0.00000035)).toFixed(5) }})
                  </div>
                </div>
              </div>

              <!-- Manual / Custom Model Input -->
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Custom / Fine-Tuned Model Identifier
                </label>
                <div class="flex items-center gap-2">
                  <input
                    v-model="configForm.aiModel"
                    type="text"
                    required
                    placeholder="e.g. gemini-3.8-flash, gemini-3.1-pro-preview, gemini-2.5-flash"
                    class="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-blue-600 dark:text-blue-400 focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    @click="configForm.aiModel = 'gemini-3.8-flash'"
                    class="px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer whitespace-nowrap"
                  >
                    Reset Default
                  </button>
                </div>
                <span class="text-[10px] text-slate-400 mt-1 block">
                  Takes effect immediately for all subsequent schema generations. Tokens and credits will be dynamically recalculated based on this model's pricing.
                </span>
              </div>
            </div>

            <!-- FEATURED: Base User Credit Allowance Control Card (Synced with Active AI Model) -->
            <div class="p-5        rounded-xl border-2 border-blue-200 dark:border-blue-800/80  space-y-4 app-soft-surface">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div class="flex items-center gap-2.5">
                  <div class="p-2 rounded-lg bg-blue-600 text-white">
                    <Zap class="w-4 h-4" />
                  </div>
                  <div>
                    <h4 class="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                      <span>Base User Credit Allowance</span>
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                        Standard Base Quota
                      </span>
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                        <Activity class="w-2.5 h-2.5" />
                        Synced with {{ activeModelRateInfo.name }}
                      </span>
                    </h4>
                    <p class="text-xs text-slate-500 dark:text-slate-400">
                      Standard monthly credit quota granted to all registered user accounts. Usage is metered purely by credits; capacity and API costs automatically synchronize with the selected AI Model above.
                    </p>
                  </div>
                </div>

                <div class="text-right">
                  <span class="font-mono text-sm font-semibold text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 px-3 py-1 rounded-lg border border-blue-200 dark:border-blue-800">
                    {{ (configForm.freeTierMonthlyCredits || 0).toLocaleString() }} Credits
                  </span>
                </div>
              </div>

              <!-- Live Model Synchronization Banner -->
              <div class="p-3 bg-white/90 dark:bg-slate-900/90 rounded-xl border border-blue-200 dark:border-blue-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                <div class="flex items-center gap-2.5">
                  <div class="px-2 py-1 rounded-lg bg-blue-600 text-white font-mono font-bold text-xs">
                    {{ activeModelRateInfo.multiplier }}x
                  </div>
                  <div>
                    <div class="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <span>Active Model:</span>
                      <span class="font-mono text-blue-600 dark:text-blue-400 font-semibold">{{ activeModelRateInfo.name }}</span>
                    </div>
                    <p class="text-[11px] text-slate-500 dark:text-slate-400">
                      Under this model, each schema generation consumes <strong class="text-slate-700 dark:text-slate-200 font-mono">{{ baseCreditsPerSchema.toLocaleString() }} credits</strong> (~2,000 tokens &times; {{ activeModelRateInfo.multiplier }}x).
                    </p>
                  </div>
                </div>

                <div class="text-left sm:text-right shrink-0 border-t sm:border-t-0 pt-1 sm:pt-0 border-slate-100 dark:border-slate-800">
                  <span class="text-[10px] text-slate-400 block">Allowance Yield:</span>
                  <div class="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">
                    ~{{ baseCreditsSchemasCount.toLocaleString() }} Schemas / mo
                  </div>
                </div>
              </div>

              <!-- Input & Quick Presets -->
              <div class="space-y-2">
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Monthly Credit Allowance Amount
                </label>
                <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div class="relative flex-1">
                    <input
                      v-model.number="configForm.freeTierMonthlyCredits"
                      type="number"
                      min="0"
                      step="1000"
                      required
                      class="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono font-bold dark:text-white focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. 50000"
                    />
                    <span class="absolute right-3 top-2.5 text-xs font-bold text-slate-400 pointer-events-none">
                      credits / month
                    </span>
                  </div>

                  <!-- Quick Presets -->
                  <div class="flex flex-wrap items-center gap-1.5">
                    <button
                      v-for="preset in baseCreditPresets"
                      :key="preset"
                      type="button"
                      @click="configForm.freeTierMonthlyCredits = preset"
                      class="px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition border cursor-pointer"
                      :class="configForm.freeTierMonthlyCredits === preset
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'"
                    >
                      {{ preset.toLocaleString() }}
                      <span v-if="preset === 10000" class="text-[10px] opacity-80 ml-0.5 font-sans">(Starter)</span>
                      <span v-else-if="preset === 50000" class="text-[10px] opacity-80 ml-0.5 font-sans">(Default)</span>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Financial Valuation & Model-Synced Output Capacity Card -->
              <div class="p-3.5 bg-white/90 dark:bg-slate-900/80 rounded-xl border border-blue-100 dark:border-blue-900/60 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <div class="text-[11px] text-slate-400 font-medium">Market Retail Worth</div>
                  <div class="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5">
                    ${{ baseCreditsValuationUsd }} <span class="text-[10px] text-slate-400 font-normal">USD</span>
                  </div>
                  <div class="text-[10px] text-slate-400 font-mono">Retail market value</div>
                </div>

                <div>
                  <div class="text-[11px] text-slate-400 font-medium">API Cloud Cost</div>
                  <div class="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm mt-0.5">
                    ~${{ baseCreditsApiCostUsd }}
                  </div>
                  <div class="text-[10px] text-slate-400 truncate" :title="activeModelRateInfo.name">
                    Synced: {{ activeModelRateInfo.name }}
                  </div>
                </div>

                <div>
                  <div class="text-[11px] text-slate-400 font-medium">Estimated Output</div>
                  <div class="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm mt-0.5">
                    ~{{ baseCreditsSchemasCount.toLocaleString() }} Schemas
                  </div>
                  <div class="text-[10px] text-slate-400">@ ~{{ baseCreditsPerSchema.toLocaleString() }} credits ea.</div>
                </div>

                <div>
                  <div class="text-[11px] text-slate-400 font-medium">Model Rate Multiplier</div>
                  <div class="font-bold text-amber-600 dark:text-amber-400 text-xs mt-0.5 flex items-center gap-1 font-mono">
                    <Sparkles class="w-3 h-3" />
                    {{ activeModelRateInfo.multiplier }}x Credits
                  </div>
                  <div class="text-[10px] text-slate-400 font-mono truncate">
                    ${{ activeModelRateInfo.inputPerMillion }} / ${{ activeModelRateInfo.outputPerMillion }}
                  </div>
                </div>
              </div>

              <!-- Option to Propagate to Existing Users -->
              <label class="flex items-start gap-2.5 pt-1 text-xs cursor-pointer text-slate-700 dark:text-slate-300 select-none">
                <input
                  v-model="configForm.applyToExistingFreeUsers"
                  type="checkbox"
                  class="mt-0.5 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span class="font-bold">Apply & synchronize this base credit allowance to all active user accounts now</span>
                  <p class="text-[11px] text-slate-400">
                    Immediately updates registered user accounts' balance and monthly credit quota to {{ (configForm.freeTierMonthlyCredits || 0).toLocaleString() }} credits.
                  </p>
                </div>
              </label>
            </div>

            <!-- Extended Quota & System Settings -->
            <div class="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
              <h4 class="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Extended Quota & System Settings
              </h4>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Extended / Pro Monthly Credit Quota
                  </label>
                  <input
                    v-model.number="configForm.proTierMonthlyCredits"
                    type="number"
                    required
                    class="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                  <span class="text-[10px] text-slate-400 mt-1 block">Default: 1,000,000 credits</span>
                </div>

                <div>
                  <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Standard Base Max Prompt Length (Chars)
                  </label>
                  <input
                    v-model.number="configForm.freeMaxPromptLength"
                    type="number"
                    required
                    class="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                  <span class="text-[10px] text-slate-400 mt-1 block">Default: 3,000 characters</span>
                </div>

                <div>
                  <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Extended Account Max Prompt Length (Chars)
                  </label>
                  <input
                    v-model.number="configForm.proMaxPromptLength"
                    type="number"
                    required
                    class="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                  <span class="text-[10px] text-slate-400 mt-1 block">Default: 20,000 characters</span>
                </div>

                <div>
                  <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    TallySale Invoicing System URL
                  </label>
                  <input
                    v-model="configForm.tallySaleInvoiceUrl"
                    type="url"
                    required
                    class="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                  <span class="text-[10px] text-slate-400 mt-1 block">Default: https://api.tallysale.com</span>
                </div>
              </div>

              <div class="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700/60">
                <span class="text-[11px] text-slate-500">
                  Settings are written directly to Firestore (<code class="font-mono text-[10px]">system/config</code>).
                </span>
                <button
                  type="submit"
                  class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl  transition cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 class="w-4 h-4" />
                  Save System Config
                </button>
              </div>
            </div>
          </form>
        </div>

        <!-- TAB 4: AI Usage & Cost Audit Logs -->
        <div v-if="activeAdminTab === 'logs'" class="space-y-5">
          <!-- Header & Quick Refresh -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div class="flex items-center gap-2">
                <div class="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <Activity class="w-5 h-5" />
                </div>
                <div>
                  <h3 class="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                    <span>AI Usage & Cost Audit Logs</span>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      LIVE AUDIT
                    </span>
                  </h3>
                  <p class="text-xs text-slate-500 dark:text-slate-400">
                    Real-time log of schema generations, model breakdown, token counts, model credit multiplier, and estimated API expenses.
                  </p>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <input
                v-model="logsSearchQuery"
                type="text"
                placeholder="Filter by email, model, or dialect..."
                class="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs w-60 focus:ring-2 focus:ring-blue-500"
              />
              <button
                @click="loadAdminData"
                :disabled="isLoading"
                class="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 transition flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': isLoading }" />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          <!-- Summary Metric Cards -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70">
              <div class="flex items-center justify-between">
                <span class="text-[11px] font-medium text-slate-500">Total Prompts</span>
                <Cpu class="w-4 h-4 text-blue-500" />
              </div>
              <div class="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                {{ logsSummary.totalRequests.toLocaleString() }}
              </div>
              <span class="text-[10px] text-slate-400">Schemas generated</span>
            </div>

            <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70">
              <div class="flex items-center justify-between">
                <span class="text-[11px] font-medium text-slate-500">Raw Gemini Tokens</span>
                <Coins class="w-4 h-4 text-blue-500" />
              </div>
              <div class="text-xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-1">
                {{ logsSummary.totalRawTokens.toLocaleString() }}
              </div>
              <span class="text-[10px] text-slate-400">Prompt & completion</span>
            </div>

            <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70">
              <div class="flex items-center justify-between">
                <span class="text-[11px] font-medium text-slate-500">Credits Deducted</span>
                <Zap class="w-4 h-4 text-amber-500" />
              </div>
              <div class="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1">
                {{ logsSummary.totalCreditsDeducted.toLocaleString() }}
              </div>
              <span class="text-[10px] text-slate-400">Model-weighted tokens</span>
            </div>

            <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70">
              <div class="flex items-center justify-between">
                <span class="text-[11px] font-medium text-slate-500">Est. API Expense</span>
                <DollarSign class="w-4 h-4 text-emerald-500" />
              </div>
              <div class="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                ${{ logsSummary.totalEstimatedCost.toFixed(5) }}
              </div>
              <span class="text-[10px] text-slate-400">Google Gemini API cost</span>
            </div>
          </div>

          <!-- Logs Table -->
          <div class="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <div class="overflow-x-auto max-h-[48vh]">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th class="p-3">User Email</th>
                    <th class="p-3">Tier</th>
                    <th class="p-3">Model</th>
                    <th class="p-3">Tokens (Prompt/Comp)</th>
                    <th class="p-3 text-center">Rate</th>
                    <th class="p-3">Credits Deducted</th>
                    <th class="p-3">Est. Cost</th>
                    <th class="p-3">Dialect</th>
                    <th class="p-3 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr
                    v-if="filteredLogs.length === 0"
                    class="text-slate-400 text-center"
                  >
                    <td colspan="9" class="p-8">No AI usage logs found.</td>
                  </tr>
                  <tr
                    v-for="log in filteredLogs"
                    :key="log.id"
                    class="hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-200 transition"
                  >
                    <td class="p-3 font-medium">
                      <div class="truncate max-w-[180px]" :title="log.email || log.userId">
                        {{ log.email || log.userId }}
                      </div>
                    </td>
                    <td class="p-3">
                      <span
                        class="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase"
                        :class="log.tier === 'pro' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'"
                      >
                        {{ log.tier || 'free' }}
                      </span>
                    </td>
                    <td class="p-3">
                      <span class="px-2 py-0.5 rounded font-mono text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        {{ log.model || 'gemini-3.8-flash' }}
                      </span>
                    </td>
                    <td class="p-3 font-mono text-[11px]">
                      <div class="font-bold text-slate-800 dark:text-slate-200">
                        {{ (log.rawTokens || log.totalTokens || 0).toLocaleString() }}
                      </div>
                      <div class="text-[10px] text-slate-400">
                        p: {{ (log.promptTokens || 0).toLocaleString() }} / c: {{ (log.completionTokens || 0).toLocaleString() }}
                      </div>
                    </td>
                    <td class="p-3 text-center">
                      <span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {{ log.creditMultiplier ? log.creditMultiplier + 'x' : '1.0x' }}
                      </span>
                    </td>
                    <td class="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {{ (log.creditsDeducted || log.totalTokens || 0).toLocaleString() }}
                    </td>
                    <td class="p-3 font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      ${{ (log.estimatedCostUsd || 0).toFixed(5) }}
                    </td>
                    <td class="p-3">
                      <span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {{ log.dialect || 'sql' }}
                      </span>
                    </td>
                    <td class="p-3 text-right text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {{ new Date(log.timestamp).toLocaleString() }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- TAB 5: Marketplace & System Blueprints Management -->
        <div v-if="activeAdminTab === 'marketplace'" class="space-y-5">
          <!-- Top Action & Overview Card -->
          <div class="p-5        rounded-2xl border border-blue-200/80 dark:border-blue-800/60  flex flex-col md:flex-row md:items-center justify-between gap-4 bg-blue-700">
            <div>
              <div class="flex items-center gap-2">
                <h3 class="font-bold text-slate-900 dark:text-white text-base">
                  Marketplace Blueprints & dbmaps System Templates
                </h3>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  Curator Hub
                </span>
              </div>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Create new official dbmaps System blueprints from any schema project, edit existing system and community templates in-place, promote community contributions, or unpublish outdated schemas.
              </p>
            </div>

            <div class="flex items-center gap-2.5 shrink-0 flex-wrap">
              <button
                @click="handleCreateSystemBlueprint"
                class="px-4 py-2      text-white text-xs font-bold rounded-xl  transition flex items-center gap-1.5 cursor-pointer bg-blue-700"
              >
                <Plus class="w-4 h-4" />
                <span>+ Create System Blueprint</span>
              </button>

              <button
                @click="openMarketplace"
                class="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
              >
                <ExternalLink class="w-3.5 h-3.5 text-blue-500" />
                <span>Preview Marketplace</span>
              </button>
            </div>
          </div>

          <!-- Filter & Search Toolbar -->
          <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <div class="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium w-full sm:w-auto">
              <button
                @click="marketplaceFilter = 'all'"
                class="px-3 py-1.5 rounded-lg transition cursor-pointer"
                :class="marketplaceFilter === 'all' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'"
              >
                All ({{ allMarketplaceTemplates.length }})
              </button>
              <button
                @click="marketplaceFilter = 'system'"
                class="px-3 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer"
                :class="marketplaceFilter === 'system' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'"
              >
                <ShieldCheck class="w-3.5 h-3.5" />
                <span>dbmaps System ({{ systemTemplatesCount }})</span>
              </button>
              <button
                @click="marketplaceFilter = 'community'"
                class="px-3 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer"
                :class="marketplaceFilter === 'community' ? 'bg-emerald-600 text-white font-bold shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'"
              >
                <Globe class="w-3.5 h-3.5" />
                <span>Community ({{ communityTemplatesCount }})</span>
              </button>
            </div>

            <div class="flex items-center gap-2 w-full sm:w-auto">
              <div class="relative flex-1 sm:w-64">
                <Search class="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  v-model="marketplaceSearchQuery"
                  type="text"
                  placeholder="Search by title, domain, author..."
                  class="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                v-model="marketplaceDialectFilter"
                class="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Dialects</option>
                <option value="postgres">PostgreSQL</option>
                <option value="mysql">MySQL</option>
                <option value="sqlite">SQLite</option>
                <option value="mssql">MS SQL</option>
              </select>
            </div>
          </div>

          <!-- Blueprints List -->
          <div class="space-y-3">
            <div
              v-if="filteredMarketplaceTemplates.length === 0"
              class="p-12 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-400 text-xs"
            >
              No marketplace templates match the selected filter.
            </div>

            <div
              v-for="tpl in filteredMarketplaceTemplates"
              :key="tpl.id"
              class="p-4 bg-white dark:bg-slate-900 border rounded-2xl transition-all  flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              :class="tpl.isSystem ? 'border-blue-200/80 dark:border-blue-900/60     app-soft-surface' : 'border-slate-200 dark:border-slate-800'"
            >
              <!-- Left Blueprint Info -->
              <div class="space-y-2 min-w-0 flex-1">
                <div class="flex items-center gap-2 flex-wrap">
                  <span
                    v-if="tpl.isSystem"
                    class="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1"
                  >
                    <ShieldCheck class="w-3 h-3 text-blue-600 dark:text-blue-400" />
                    <span>dbmaps System</span>
                  </span>
                  <span
                    v-else
                    class="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1"
                  >
                    <Globe class="w-3 h-3 text-emerald-500" />
                    <span>Community</span>
                  </span>

                  <span class="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 uppercase">
                    {{ tpl.category || 'saas' }}
                  </span>

                  <span class="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold border border-blue-200/60 dark:border-blue-900">
                    {{ tpl.dialect || 'postgres' }}
                  </span>

                  <span
                    v-if="tpl.isBuiltIn"
                    class="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500"
                    title="Included in core application bundle"
                  >
                    Core Bundle
                  </span>
                  <span
                    v-else
                    class="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900"
                    title="Stored dynamically in Cloud Firestore"
                  >
                    Firestore Dynamic
                  </span>
                </div>

                <div>
                  <h4 class="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{{ tpl.name }}</span>
                    <span class="text-[11px] font-normal text-slate-400 font-mono">({{ tpl.id }})</span>
                  </h4>
                  <p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                    {{ tpl.description }}
                  </p>
                </div>

                <!-- Stats & Author row -->
                <div class="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 font-mono flex-wrap pt-0.5">
                  <span class="flex items-center gap-1">
                    <Database class="w-3.5 h-3.5 text-blue-500" />
                    <strong>{{ (tpl.tables || []).length }}</strong> tables
                  </span>
                  <span class="flex items-center gap-1">
                    <GitFork class="w-3.5 h-3.5 text-blue-500" />
                    <strong>{{ (tpl.relationships || []).length }}</strong> relations
                  </span>
                  <span class="text-slate-400">|</span>
                  <span class="flex items-center gap-1.5 text-[11px] font-sans">
                    <img
                      :src="tpl.author?.avatar || 'https://api.dicebear.com/7.x/identicon/svg?seed=dbmaps'"
                      class="w-4 h-4 rounded-full border border-slate-200 dark:border-slate-700"
                    />
                    <span class="font-semibold text-slate-700 dark:text-slate-300">{{ tpl.author?.name || 'dbmaps System' }}</span>
                  </span>
                </div>
              </div>

              <!-- Right Actions Toolbar -->
              <div class="flex items-center gap-2 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100 dark:border-slate-800">
                <!-- Edit Template -->
                <button
                  @click="handleEditTemplate(tpl)"
                  class="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:text-blue-600 dark:hover:text-blue-400 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition flex items-center gap-1 cursor-pointer"
                  title="Edit blueprint metadata, name, category, or entities"
                >
                  <Edit3 class="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>

                <!-- Promote / Demote System status -->
                <button
                  @click="handleToggleSystem(tpl)"
                  class="px-3 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1 cursor-pointer"
                  :class="tpl.isSystem
                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 dark:hover:bg-amber-900/60'
                    : 'bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 dark:hover:bg-blue-900/60'"
                  :title="tpl.isSystem ? 'Demote to Community Blueprint' : 'Promote to Official dbmaps System Blueprint'"
                >
                  <ShieldCheck v-if="!tpl.isSystem" class="w-3.5 h-3.5" />
                  <RotateCcw v-else class="w-3.5 h-3.5" />
                  <span>{{ tpl.isSystem ? 'Make Community' : 'Promote to System' }}</span>
                </button>

                <!-- Clone into active workspace to inspect -->
                <button
                  @click="handleCloneToStudio(tpl)"
                  class="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  title="Clone into Studio Workspace to inspect/edit tables"
                >
                  <FolderInput class="w-4 h-4" />
                </button>

                <!-- Delete from Firestore (if not hardcoded built-in or if custom override) -->
                <button
                  v-if="!tpl.isBuiltIn || state.marketplaceSubmissions.some(s => s.id === tpl.id)"
                  @click="handleDeleteTemplate(tpl)"
                  class="p-2 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/50 transition cursor-pointer"
                  title="Remove from Marketplace"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import {
  state,
  fetchAdminUsersAndPayments,
  adminUpdateUserTier,
  adminApprovePayment,
  adminUpdateSystemConfig,
  allMarketplaceTemplates,
  openCreateSystemMarketplaceTemplate,
  openEditMarketplaceTemplate,
  toggleTemplateSystemStatus,
  deleteMarketplaceTemplate,
  cloneMarketplaceTemplate,
  openMarketplace,
  navigateTo
} from '../stores/schemaStore.js';
import {
  ShieldCheck,
  X,
  Receipt,
  Users,
  Sliders,
  Activity,
  RefreshCw,
  CheckCircle2,
  Zap,
  Sparkles,
  RotateCcw,
  Cpu,
  Coins,
  DollarSign,
  Layers,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  Search,
  Database,
  GitFork,
  Globe,
  FolderInput
} from 'lucide-vue-next';

const activeAdminTab = ref('payments');
const isLoading = ref(false);
const usersList = ref([]);
const requestsList = ref([]);
const logsList = ref([]);
const userSearchQuery = ref('');
const logsSearchQuery = ref('');

// Marketplace Management State
const marketplaceFilter = ref('all');
const marketplaceSearchQuery = ref('');
const marketplaceDialectFilter = ref('all');

const systemTemplatesCount = computed(() => {
  return allMarketplaceTemplates.value.filter(t => t.isSystem).length;
});

const communityTemplatesCount = computed(() => {
  return allMarketplaceTemplates.value.filter(t => !t.isSystem).length;
});

const filteredMarketplaceTemplates = computed(() => {
  const query = marketplaceSearchQuery.value.trim().toLowerCase();
  const dialect = marketplaceDialectFilter.value;
  const filter = marketplaceFilter.value;

  return allMarketplaceTemplates.value.filter(t => {
    // Tab filter
    if (filter === 'system' && !t.isSystem) return false;
    if (filter === 'community' && t.isSystem) return false;

    // Dialect filter
    if (dialect !== 'all' && (t.dialect || 'postgres').toLowerCase() !== dialect.toLowerCase()) {
      return false;
    }

    // Search query
    if (query) {
      const matchName = (t.name || '').toLowerCase().includes(query);
      const matchDesc = (t.description || '').toLowerCase().includes(query);
      const matchCategory = (t.category || '').toLowerCase().includes(query);
      const matchAuthor = (t.author?.name || t.authorName || '').toLowerCase().includes(query);
      const matchId = (t.id || '').toLowerCase().includes(query);
      if (!matchName && !matchDesc && !matchCategory && !matchAuthor && !matchId) {
        return false;
      }
    }

    return true;
  });
});

function handleCreateSystemBlueprint() {
  openCreateSystemMarketplaceTemplate();
}

function handleEditTemplate(tpl) {
  openEditMarketplaceTemplate(tpl);
}

async function handleToggleSystem(tpl) {
  await toggleTemplateSystemStatus(tpl.id);
}

async function handleDeleteTemplate(tpl) {
  if (window.confirm(`Are you sure you want to remove "${tpl.name}" from the Marketplace?`)) {
    await deleteMarketplaceTemplate(tpl.id);
  }
}

function handleCloneToStudio(tpl) {
  cloneMarketplaceTemplate(tpl);
  state.modals.adminDashboard = false;
}

const activeModelCreditMultiplier = computed(() => {
  const m = (configForm.value.aiModel || '').toLowerCase();
  if (m.includes('pro')) return 5.0;
  if (m.includes('lite')) return 0.5;
  return 1.0;
});

const activeModelRateInfo = computed(() => {
  const m = (configForm.value.aiModel || '').toLowerCase().trim();
  if (m.includes('pro')) {
    return {
      name: configForm.value.aiModel || 'Gemini 3.1 Pro Preview',
      multiplier: 5.0,
      inputPerMillion: 1.25,
      outputPerMillion: 5.00
    };
  }
  if (m.includes('lite')) {
    return {
      name: configForm.value.aiModel || 'Gemini 3.1 Flash Lite',
      multiplier: 0.5,
      inputPerMillion: 0.0375,
      outputPerMillion: 0.15
    };
  }
  return {
    name: configForm.value.aiModel || 'Gemini 3.8 Flash',
    multiplier: 1.0,
    inputPerMillion: 0.075,
    outputPerMillion: 0.30
  };
});

const activeModelCostRateText = computed(() => {
  const m = (configForm.value.aiModel || '').toLowerCase();
  if (m.includes('pro')) return '$1.25 in / $5.00 out per 1M tokens';
  if (m.includes('lite')) return '$0.0375 in / $0.15 out per 1M tokens';
  return '$0.075 in / $0.30 out per 1M tokens';
});

const logsSummary = computed(() => {
  const list = logsList.value || [];
  const totalRequests = list.length;
  const totalRawTokens = list.reduce((sum, l) => sum + (l.rawTokens || l.totalTokens || 0), 0);
  const totalCreditsDeducted = list.reduce((sum, l) => sum + (l.creditsDeducted || l.totalTokens || 0), 0);
  const totalEstimatedCost = list.reduce((sum, l) => sum + (l.estimatedCostUsd || 0), 0);

  return {
    totalRequests,
    totalRawTokens,
    totalCreditsDeducted,
    totalEstimatedCost
  };
});

const filteredLogs = computed(() => {
  if (!logsSearchQuery.value.trim()) return logsList.value;
  const q = logsSearchQuery.value.toLowerCase().trim();
  return (logsList.value || []).filter(l =>
    (l.email && l.email.toLowerCase().includes(q)) ||
    (l.userId && l.userId.toLowerCase().includes(q)) ||
    (l.model && l.model.toLowerCase().includes(q)) ||
    (l.dialect && l.dialect.toLowerCase().includes(q))
  );
});

const baseCreditPresets = [10000, 25000, 50000, 75000, 100000, 200000];
const freeCreditPresets = baseCreditPresets;

const configForm = ref({
  aiModel: 'gemini-3.8-flash',
  freeTierMonthlyCredits: 50000,
  proTierMonthlyCredits: 1000000,
  freeMaxPromptLength: 3000,
  proMaxPromptLength: 20000,
  tallySaleInvoiceUrl: 'https://api.tallysale.com',
  applyToExistingFreeUsers: false
});

const baseCreditsPerSchema = computed(() => {
  return Math.max(100, Math.round(2000 * activeModelCreditMultiplier.value));
});

const baseCreditsSchemasCount = computed(() => {
  const credits = Number(configForm.value.freeTierMonthlyCredits) || 0;
  const perSchema = baseCreditsPerSchema.value;
  return Math.max(0, Math.floor(credits / (perSchema || 2000)));
});

const baseCreditsValuationUsd = computed(() => {
  const credits = Number(configForm.value.freeTierMonthlyCredits) || 0;
  return (credits * 0.00002).toFixed(2);
});

const baseCreditsApiCostUsd = computed(() => {
  // Real cloud API cost for the schemas generated under the selected AI model
  // An average schema uses ~1,400 input/prompt tokens (70%) and ~600 output/completion tokens (30%) = 2,000 raw tokens
  const schemas = baseCreditsSchemasCount.value;
  const inputCost = (1400 * activeModelRateInfo.value.inputPerMillion) / 1000000;
  const outputCost = (600 * activeModelRateInfo.value.outputPerMillion) / 1000000;
  const costPerSchema = inputCost + outputCost;
  const total = schemas * costPerSchema;
  return total < 0.01 ? total.toFixed(5) : total.toFixed(4);
});

const freeCreditsValuationUsd = baseCreditsValuationUsd;
const freeCreditsApiCostUsd = baseCreditsApiCostUsd;
const freeCreditsSchemasCount = baseCreditsSchemasCount;

const pendingRequestsCount = computed(() => {
  return requestsList.value.filter(r => r.status === 'PENDING').length;
});

const filteredUsers = computed(() => {
  if (!userSearchQuery.value.trim()) return usersList.value;
  const q = userSearchQuery.value.toLowerCase();
  return usersList.value.filter(u =>
    (u.email && u.email.toLowerCase().includes(q)) ||
    (u.uid && u.uid.toLowerCase().includes(q))
  );
});

async function loadAdminData() {
  isLoading.value = true;
  try {
    const data = await fetchAdminUsersAndPayments();
    usersList.value = data.users;
    requestsList.value = data.requests;
    logsList.value = data.logs;

    configForm.value = {
      aiModel: 'gemini-3.8-flash',
      freeTierMonthlyCredits: 50000,
      proTierMonthlyCredits: 1000000,
      freeMaxPromptLength: 3000,
      proMaxPromptLength: 20000,
      tallySaleInvoiceUrl: 'https://api.tallysale.com',
      ...state.systemConfig,
      applyToExistingFreeUsers: false
    };
  } catch (e) {
    console.error(e);
  } finally {
    isLoading.value = false;
  }
}

async function handleApprovePayment(requestId, status) {
  await adminApprovePayment(requestId, status);
  await loadAdminData();
}

async function handleToggleUserTier(user) {
  const nextTier = user.tier === 'pro' ? 'free' : 'pro';
  await adminUpdateUserTier(user.uid, nextTier, 0, user.role);
  await loadAdminData();
}

async function handleTopUpUserCredits(user, amount) {
  await adminUpdateUserTier(user.uid, user.tier, amount, user.role);
  await loadAdminData();
}

async function handleResetUserToFreeDefault(user) {
  const allowance = state.systemConfig.freeTierMonthlyCredits || 50000;
  await adminUpdateUserTier(user.uid, user.tier || 'free', 0, user.role, allowance);
  await loadAdminData();
}

async function handleSetExactCredits(user) {
  const defaultVal = user.creditsRemaining ?? (state.systemConfig.freeTierMonthlyCredits || 50000);
  const input = window.prompt(`Enter exact credit balance for ${user.email || user.uid}:`, defaultVal);
  if (input !== null) {
    const amount = parseInt(input.replace(/,/g, ''), 10);
    if (!isNaN(amount) && amount >= 0) {
      await adminUpdateUserTier(user.uid, user.tier, 0, user.role, amount);
      await loadAdminData();
    }
  }
}

async function handleSaveSystemConfig() {
  await adminUpdateSystemConfig(configForm.value);
  await loadAdminData();
}

watch(() => state.modals.adminDashboard, (val) => {
  if (val) {
    state.modals.adminDashboard = false;
    navigateTo('/admin');
  }
});

onMounted(() => {
  loadAdminData();
});
</script>
