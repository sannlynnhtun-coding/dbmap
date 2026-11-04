<template>
  <div class="app-page app-admin-page min-h-dvh bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
    <!-- Top Global Header -->
    <header class="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95  border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between">
      <div class="flex items-center gap-3 sm:gap-4">
        <button
          @click="goToHome"
          class="flex items-center gap-2.5 text-left cursor-pointer group"
          title="Return to dbmaps home"
        >
          <DbMapLogo class-name="w-8 h-8 transition-transform group-hover:scale-105" />
          <div class="flex flex-col">
            <span class="font-mono font-bold text-slate-900 dark:text-white text-base leading-none">
              db<span class="text-blue-600 dark:text-blue-400">maps</span>
            </span>
            <span class="text-[10px] text-slate-400 font-medium tracking-wide uppercase mt-0.5">
              Admin Portal
            </span>
          </div>
        </button>

        <span class="text-slate-300 dark:text-slate-700 hidden sm:inline">/</span>

        <!-- Breadcrumb Active Tab -->
        <div class="hidden sm:flex items-center gap-2 text-xs">
          <span class="text-slate-500 dark:text-slate-400 font-medium">Administration</span>
          <ChevronRight class="w-3.5 h-3.5 text-slate-400" />
          <span class="font-bold text-slate-800 dark:text-slate-200 capitalize">
            {{ activeTabName }}
          </span>
        </div>
      </div>

      <!-- Header Center / Right Controls -->
      <div class="flex items-center gap-2 sm:gap-3">
        <!-- Quick Add User CTA (Accessible from anywhere) -->
        <button
          v-if="isCurrentUserAdmin"
          @click="openAddUserModal"
          class="px-3 py-1.5      text-white rounded-xl text-xs font-bold  transition flex items-center gap-1.5 cursor-pointer bg-blue-700"
          title="Provision a new user account"
        >
          <UserPlus class="w-3.5 h-3.5" />
          <span class="hidden md:inline">Add User</span>
        </button>

        <!-- Refresh Data Button -->
        <button
          @click="loadAdminData"
          :disabled="isLoading"
          class="p-2 sm:px-3 sm:py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          title="Reload admin records"
        >
          <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': isLoading }" />
          <span class="hidden sm:inline">Refresh</span>
        </button>

        <!-- Dark / Light Mode Toggle -->
        <button
          @click="toggleDarkMode"
          class="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
          title="Toggle color theme"
        >
          <Sun v-if="state.isDarkMode" class="w-4 h-4 text-amber-400" />
          <Moon v-else class="w-4 h-4 text-slate-600" />
        </button>

        <!-- Back to Studio Link -->
        <button
          @click="goToStudio"
          class="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:text-blue-600 dark:hover:text-blue-400 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700"
        >
          <span>Studio</span>
          <ArrowRight class="w-3.5 h-3.5" />
        </button>
      </div>
    </header>

    <!-- Guard Banner: When Not Admin or Not Signed In -->
    <div
      v-if="!isCurrentUserAdmin"
      class="flex-1 flex items-center justify-center p-6"
    >
      <div class="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8  text-center space-y-5">
        <div class="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 border border-amber-500/30 flex items-center justify-center">
          <ShieldAlert class="w-7 h-7" />
        </div>
        <div>
          <h2 class="text-xl font-bold text-slate-900 dark:text-white">
            Restricted Administrator Area
          </h2>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            This section is exclusively reserved for system administrators. You are currently logged in as:
          </p>
          <div class="mt-2 font-mono text-xs px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 inline-block">
            {{ state.currentUser.email || 'Guest / Not Authenticated' }}
          </div>
        </div>

        <div class="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            @click="openAuthModal"
            class="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Lock class="w-4 h-4" />
            <span>Sign In with Admin Account</span>
          </button>
          <button
            @click="goToHome"
            class="py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            Return Home
          </button>
        </div>
      </div>
    </div>

    <!-- Main Admin Workspace Layout (Sidebar + Content Stream) -->
    <div v-else class="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 gap-6">
      <!-- Admin Sidebar Navigation -->
      <aside class="w-full md:w-64 shrink-0 space-y-6">
        <!-- Admin Profile Identity Card -->
        <div class="p-4     text-white rounded-2xl  border border-slate-800 space-y-3 bg-blue-700">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center justify-center font-bold text-sm">
              {{ (state.currentUser.email || 'A').slice(0, 2).toUpperCase() }}
            </div>
            <div class="overflow-hidden">
              <div class="font-bold text-sm truncate">{{ state.currentUser.displayName || 'Administrator' }}</div>
              <div class="text-[11px] text-blue-300/80 truncate font-mono">{{ state.currentUser.email }}</div>
            </div>
          </div>
          <div class="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800 text-slate-400">
            <span>Privilege Level</span>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Super Admin
            </span>
          </div>
        </div>

        <!-- Navigation Tabs -->
        <nav class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-2  space-y-1">
          <button
            @click="activeAdminTab = 'overview'"
            class="w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold transition flex items-center justify-between cursor-pointer"
            :class="activeAdminTab === 'overview'
              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'"
          >
            <div class="flex items-center gap-2.5">
              <BarChart3 class="w-4 h-4 text-blue-500" />
              <span>Overview & Metrics</span>
            </div>
          </button>

          <button
            @click="activeAdminTab = 'users'"
            class="w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold transition flex items-center justify-between cursor-pointer"
            :class="activeAdminTab === 'users'
              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'"
          >
            <div class="flex items-center gap-2.5">
              <Users class="w-4 h-4 text-blue-500" />
              <span>User Accounts</span>
            </div>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {{ usersList.length }}
            </span>
          </button>

          <button
            @click="activeAdminTab = 'payments'"
            class="w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold transition flex items-center justify-between cursor-pointer"
            :class="activeAdminTab === 'payments'
              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'"
          >
            <div class="flex items-center gap-2.5">
              <Receipt class="w-4 h-4 text-amber-500" />
              <span>Payment Invoices</span>
            </div>
            <span
              v-if="pendingRequestsCount > 0"
              class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500 text-white animate-pulse"
            >
              {{ pendingRequestsCount }}
            </span>
          </button>

          <button
            @click="activeAdminTab = 'config'"
            class="w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold transition flex items-center justify-between cursor-pointer"
            :class="activeAdminTab === 'config'
              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'"
          >
            <div class="flex items-center gap-2.5">
              <Sliders class="w-4 h-4 text-blue-500" />
              <span>AI Engine & Quotas</span>
            </div>
          </button>

          <button
            @click="activeAdminTab = 'logs'"
            class="w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold transition flex items-center justify-between cursor-pointer"
            :class="activeAdminTab === 'logs'
              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'"
          >
            <div class="flex items-center gap-2.5">
              <Activity class="w-4 h-4 text-emerald-500" />
              <span>AI Usage Logs</span>
            </div>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {{ logsList.length }}
            </span>
          </button>

          <button
            @click="activeAdminTab = 'marketplace'"
            class="w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold transition flex items-center justify-between cursor-pointer"
            :class="activeAdminTab === 'marketplace'
              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'"
          >
            <div class="flex items-center gap-2.5">
              <Layers class="w-4 h-4 text-blue-500" />
              <span>Marketplace Blueprints</span>
            </div>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {{ allMarketplaceTemplates.length }}
            </span>
          </button>
        </nav>

        <!-- System Diagnostic Card -->
        <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4  space-y-2 text-xs">
          <div class="font-bold text-slate-900 dark:text-white flex items-center justify-between">
            <span>System Status</span>
            <span class="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              Operational
            </span>
          </div>
          <div class="text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
            <div class="flex justify-between">
              <span>Active Model:</span>
              <span class="font-mono font-medium text-slate-700 dark:text-slate-300">{{ state.systemConfig.aiModel || 'gemini-3.8-flash' }}</span>
            </div>
            <div class="flex justify-between">
              <span>Firestore Sync:</span>
              <span class="font-medium text-slate-700 dark:text-slate-300">Connected</span>
            </div>
          </div>
        </div>
      </aside>

      <!-- Main Content Area -->
      <main class="flex-1 min-w-0 space-y-6">

        <!-- ============================================================ -->
        <!-- TAB 0: OVERVIEW & METRICS -->
        <!-- ============================================================ -->
        <div v-if="activeAdminTab === 'overview'" class="space-y-6 animate-in fade-in duration-150">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 class="text-xl font-bold text-slate-900 dark:text-white">Administrator Command Center</h1>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Real-time operational metrics across registered developers, credit issuance, and invoice approvals.
              </p>
            </div>
            <button
              @click="openAddUserModal"
              class="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer  self-start"
            >
              <UserPlus class="w-4 h-4" />
              <span>Add New User</span>
            </button>
          </div>

          <!-- KPI Metric Cards Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800  space-y-2">
              <div class="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
                <span>Total Users</span>
                <Users class="w-4 h-4 text-blue-500" />
              </div>
              <div class="text-2xl font-semibold text-slate-900 dark:text-white font-mono">
                {{ usersList.length.toLocaleString() }}
              </div>
              <div class="text-[11px] text-slate-400 flex items-center justify-between">
                <span>Pro: <strong>{{ proUsersCount }}</strong></span>
                <span>Free: <strong>{{ freeUsersCount }}</strong></span>
              </div>
            </div>

            <div class="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800  space-y-2">
              <div class="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
                <span>Pending Invoices</span>
                <Receipt class="w-4 h-4 text-amber-500" />
              </div>
              <div class="text-2xl font-semibold text-amber-600 dark:text-amber-400 font-mono">
                {{ pendingRequestsCount }}
              </div>
              <div class="text-[11px] text-slate-400">
                TallySale tier upgrade submissions
              </div>
            </div>

            <div class="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800  space-y-2">
              <div class="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
                <span>Circulating Credits</span>
                <Coins class="w-4 h-4 text-blue-500" />
              </div>
              <div class="text-2xl font-semibold text-blue-600 dark:text-blue-400 font-mono">
                {{ Math.round(totalCirculatingCredits / 1000).toLocaleString() }}k
              </div>
              <div class="text-[11px] text-slate-400">
                Remaining user allowance pool
              </div>
            </div>

            <div class="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800  space-y-2">
              <div class="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
                <span>AI Generations</span>
                <Activity class="w-4 h-4 text-emerald-500" />
              </div>
              <div class="text-2xl font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                {{ logsList.length.toLocaleString() }}
              </div>
              <div class="text-[11px] text-slate-400">
                Gemini prompts executed
              </div>
            </div>
          </div>

          <!-- Quick Navigation Cards -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              @click="activeAdminTab = 'users'"
              class="p-5 bg-white dark:bg-slate-900 hover:border-blue-400 dark:hover:border-blue-600 rounded-2xl border border-slate-200 dark:border-slate-800 transition cursor-pointer group"
            >
              <div class="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Users class="w-5 h-5" />
              </div>
              <h3 class="font-bold text-sm text-slate-900 dark:text-white">User Accounts & Credits</h3>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Add new developers, adjust balances, configure Pro tiers, or change administrative permissions.
              </p>
            </div>

            <div
              @click="activeAdminTab = 'payments'"
              class="p-5 bg-white dark:bg-slate-900 hover:border-amber-400 dark:hover:border-amber-600 rounded-2xl border border-slate-200 dark:border-slate-800 transition cursor-pointer group"
            >
              <div class="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Receipt class="w-5 h-5" />
              </div>
              <h3 class="font-bold text-sm text-slate-900 dark:text-white">TallySale Approvals</h3>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Review submitted invoice references and instantly grant Pro upgrades with 1,000,000 credits.
              </p>
            </div>

            <div
              @click="activeAdminTab = 'config'"
              class="p-5 bg-white dark:bg-slate-900 hover:border-blue-400 dark:hover:border-blue-600 rounded-2xl border border-slate-200 dark:border-slate-800 transition cursor-pointer group"
            >
              <div class="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Cpu class="w-5 h-5" />
              </div>
              <h3 class="font-bold text-sm text-slate-900 dark:text-white">AI Engine & Quotas</h3>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Switch Google Gemini model versions, configure token multipliers, and synchronize default quotas.
              </p>
            </div>
          </div>
        </div>

        <!-- ============================================================ -->
        <!-- TAB 1: USER ACCOUNTS & MANAGEMENT (WITH PAGINATION & ADD USER) -->
        <!-- ============================================================ -->
        <div v-if="activeAdminTab === 'users'" class="space-y-5 animate-in fade-in duration-150">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 class="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>User Accounts & Credit Quotas</span>
                <span class="text-xs font-normal font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {{ usersList.length }} total
                </span>
              </h1>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Manage user subscription tiers, manually top up AI credits, or grant administrator roles.
              </p>
            </div>

            <!-- Add User Button -->
            <button
              @click="openAddUserModal"
              class="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer  self-start sm:self-auto"
            >
              <UserPlus class="w-4 h-4" />
              <span>Add New User</span>
            </button>
          </div>

          <!-- Filter & Search Toolbar -->
          <div class="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800  flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <!-- Search Bar -->
            <div class="relative flex-1">
              <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                v-model="userSearchQuery"
                type="text"
                placeholder="Search by email, name, or UID..."
                class="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100 placeholder-slate-400"
              />
              <button aria-label="Clear search"
                v-if="userSearchQuery"
                @click="userSearchQuery = ''"
                class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X class="w-3.5 h-3.5" />
              </button>
            </div>

            <!-- Filters -->
            <div class="flex flex-wrap items-center gap-2">
              <!-- Tier Filter -->
              <select
                v-model="userTierFilter"
                class="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
              >
                <option value="all">All Tiers</option>
                <option value="free">Free Tier</option>
                <option value="pro">Pro Tier</option>
              </select>

              <!-- Role Filter -->
              <select
                v-model="userRoleFilter"
                class="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
              >
                <option value="all">All Roles</option>
                <option value="user">Standard User</option>
                <option value="admin">Admin</option>
              </select>

              <!-- Sort Filter -->
              <select
                v-model="userSortBy"
                class="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
              >
                <option value="recent">Recently Updated</option>
                <option value="email_asc">Email (A - Z)</option>
                <option value="credits_desc">Highest Credits</option>
                <option value="used_desc">Most Used</option>
              </select>

              <!-- Page Size Selector -->
              <select
                v-model.number="userPageSize"
                class="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
                title="Items per page"
              >
                <option :value="10">10 / page</option>
                <option :value="25">25 / page</option>
                <option :value="50">50 / page</option>
                <option :value="100">100 / page</option>
              </select>
            </div>
          </div>

          <!-- Users Table Container -->
          <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th class="p-3.5">Developer / Account</th>
                    <th class="p-3.5">Tier</th>
                    <th class="p-3.5">Credits Balance</th>
                    <th class="p-3.5">Total Used</th>
                    <th class="p-3.5">Role</th>
                    <th class="p-3.5 text-right">Quick Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-slate-800/80">
                  <tr v-if="paginatedUsers.length === 0">
                    <td colspan="6" class="p-8 text-center text-slate-400 text-xs">
                      No users match the search criteria.
                    </td>
                  </tr>

                  <tr
                    v-for="u in paginatedUsers"
                    :key="u.uid"
                    class="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-200 transition"
                  >
                    <!-- User Info -->
                    <td class="p-3.5 font-medium">
                      <div class="flex items-center gap-2.5">
                        <div class="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center text-xs shrink-0">
                          {{ (u.email || u.displayName || 'U').slice(0, 1).toUpperCase() }}
                        </div>
                        <div class="overflow-hidden">
                          <div class="font-bold text-slate-900 dark:text-white truncate">
                            {{ u.email || 'guest@dbmaps.io' }}
                          </div>
                          <div class="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                            <span>{{ u.displayName || 'Developer' }}</span>
                            <span>•</span>
                            <span class="truncate max-w-[120px]" :title="u.uid">{{ u.uid }}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <!-- Tier Badge -->
                    <td class="p-3.5">
                      <span
                        class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border"
                        :class="[
                          u.tier === 'pro'
                            ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                            : 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800'
                        ]"
                      >
                        {{ u.tier || 'free' }}
                      </span>
                    </td>

                    <!-- Credits Remaining -->
                    <td class="p-3.5 font-mono font-bold text-slate-900 dark:text-white">
                      {{ (u.creditsRemaining || 0).toLocaleString() }}
                    </td>

                    <!-- Total Used -->
                    <td class="p-3.5 font-mono text-slate-500">
                      {{ (u.creditsUsedTotal || 0).toLocaleString() }}
                    </td>

                    <!-- Role -->
                    <td class="p-3.5">
                      <span
                        class="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                        :class="u.role === 'admin'
                          ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'"
                      >
                        {{ u.role || 'user' }}
                      </span>
                    </td>

                    <!-- Action Controls -->
                    <td class="p-3.5 text-right">
                      <div class="inline-flex items-center gap-1.5 flex-wrap justify-end">
                        <button
                          @click="handleToggleUserTier(u)"
                          class="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/80 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                          :title="`Switch tier to ${u.tier === 'pro' ? 'Free' : 'Pro'}`"
                        >
                          Set {{ u.tier === 'pro' ? 'Free' : 'Pro' }}
                        </button>

                        <button
                          @click="handleTopUpUserCredits(u, 10000)"
                          class="px-2 py-1 bg-emerald-50 dark:bg-emerald-950/80 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                          title="Add +10,000 bonus credits"
                        >
                          +10k
                        </button>

                        <button
                          @click="handleTopUpUserCredits(u, 50000)"
                          class="px-2 py-1 bg-amber-50 dark:bg-amber-950/80 hover:bg-amber-100 text-amber-700 dark:text-amber-300 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                          title="Add +50,000 bonus credits"
                        >
                          +50k
                        </button>

                        <button
                          @click="openSetExactCreditsModal(u)"
                          class="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-lg text-[11px] font-mono transition cursor-pointer"
                          title="Set exact custom balance"
                        >
                          Exact...
                        </button>

                        <!-- Delete User -->
                        <button
                          @click="handleDeleteUser(u)"
                          class="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950 transition cursor-pointer"
                          title="Delete user account"
                        >
                          <Trash2 class="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- PAGINATION BAR FOR USERS -->
            <div class="px-4 py-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
              <div class="flex items-center gap-2">
                <span>
                  Showing
                  <strong class="text-slate-800 dark:text-slate-200">{{ paginationRange.start }}</strong>
                  to
                  <strong class="text-slate-800 dark:text-slate-200">{{ paginationRange.end }}</strong>
                  of
                  <strong class="text-slate-800 dark:text-slate-200">{{ filteredUsers.length }}</strong>
                  users
                </span>
              </div>

              <!-- Page Control Buttons -->
              <div class="flex items-center gap-1.5">
                <!-- First Page -->
                <button
                  @click="userCurrentPage = 1"
                  :disabled="userCurrentPage <= 1"
                  class="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  title="First Page"
                >
                  <ChevronsLeft class="w-3.5 h-3.5" />
                </button>

                <!-- Previous Page -->
                <button
                  @click="userCurrentPage--"
                  :disabled="userCurrentPage <= 1"
                  class="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  title="Previous Page"
                >
                  <ChevronLeft class="w-3.5 h-3.5" />
                </button>

                <!-- Numbered Page Buttons -->
                <div class="flex items-center gap-1">
                  <button
                    v-for="page in visibleUserPages"
                    :key="page"
                    @click="typeof page === 'number' ? (userCurrentPage = page) : null"
                    class="min-w-[28px] h-7 px-2 text-xs font-semibold rounded-lg border transition"
                    :class="page === userCurrentPage
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : typeof page === 'number'
                        ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer'
                        : 'border-transparent text-slate-400 cursor-default'"
                  >
                    {{ page }}
                  </button>
                </div>

                <!-- Next Page -->
                <button
                  @click="userCurrentPage++"
                  :disabled="userCurrentPage >= totalUserPages"
                  class="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  title="Next Page"
                >
                  <ChevronRight class="w-3.5 h-3.5" />
                </button>

                <!-- Last Page -->
                <button
                  @click="userCurrentPage = totalUserPages"
                  :disabled="userCurrentPage >= totalUserPages"
                  class="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  title="Last Page"
                >
                  <ChevronsRight class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- ============================================================ -->
        <!-- TAB 2: TALLYSALE PAYMENT INVOICE APPROVALS -->
        <!-- ============================================================ -->
        <div v-if="activeAdminTab === 'payments'" class="space-y-4 animate-in fade-in duration-150">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-xl font-bold text-slate-900 dark:text-white">
                TallySale Invoicing Payment Approvals
              </h1>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Review submitted TallySale invoice numbers. Approving automatically grants Pro tier & 1,000,000 credits.
              </p>
            </div>
          </div>

          <div v-if="requestsList.length === 0" class="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-slate-500 text-xs">
            No TallySale payment verification requests submitted yet.
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="req in requestsList"
              :key="req.id"
              class="p-4 bg-white dark:bg-slate-900 border rounded-2xl transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              :class="[
                req.status === 'PENDING'
                  ? 'border-amber-300 dark:border-amber-800/80 bg-amber-50/20 dark:bg-amber-950/10'
                  : 'border-slate-200 dark:border-slate-800'
              ]"
            >
              <div class="space-y-1 text-xs">
                <div class="flex items-center gap-2">
                  <span class="font-bold text-sm text-slate-900 dark:text-white font-mono">
                    {{ req.invoiceRef || req.invoiceNo || 'REF-TALLY' }}
                  </span>
                  <span
                    class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                    :class="[
                      req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' :
                      req.status === 'REJECTED' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' :
                      'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 animate-pulse'
                    ]"
                  >
                    {{ req.status }}
                  </span>
                </div>

                <div class="text-slate-500 dark:text-slate-400 space-x-3">
                  <span>User: <strong>{{ req.userEmail || req.userId }}</strong></span>
                  <span>Amount: <strong>{{ req.amountPaid ? `${req.amountPaid.toLocaleString()} MMK` : '50,000 MMK' }}</strong></span>
                  <span v-if="req.createdAt">Date: {{ new Date(req.createdAt).toLocaleDateString() }}</span>
                </div>
              </div>

              <!-- Action Controls for Pending Invoices -->
              <div v-if="req.status === 'PENDING'" class="flex items-center gap-2">
                <button
                  @click="handleApprovePayment(req.id, 'APPROVED')"
                  class="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5  cursor-pointer"
                >
                  <CheckCircle2 class="w-4 h-4" />
                  <span>Approve & Grant Pro</span>
                </button>
                <button
                  @click="handleApprovePayment(req.id, 'REJECTED')"
                  class="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-950 text-slate-700 dark:text-slate-300 hover:text-rose-600 font-semibold text-xs rounded-xl transition cursor-pointer"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- ============================================================ -->
        <!-- TAB 3: AI ENGINE & CREDIT QUOTAS -->
        <!-- ============================================================ -->
        <div v-if="activeAdminTab === 'config'" class="space-y-6 animate-in fade-in duration-150">
          <div>
            <h1 class="text-xl font-bold text-slate-900 dark:text-white">AI Engine & Credit Quota Configuration</h1>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select active Gemini models, customize monthly allowances, adjust prompt limits, and configure billing URLs.
            </p>
          </div>

          <form @submit.prevent="handleSaveSystemConfig" class="space-y-5">
            <!-- Model Selection Cards -->
            <div class="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800  space-y-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2.5">
                  <div class="p-2 rounded-xl bg-blue-600 text-white">
                    <Cpu class="w-4 h-4" />
                  </div>
                  <div>
                    <h3 class="font-bold text-sm text-slate-900 dark:text-white">Gemini AI Engine Model</h3>
                    <p class="text-xs text-slate-500 dark:text-slate-400">Select model for schema and DBML generation</p>
                  </div>
                </div>
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                  Active: {{ configForm.aiModel }}
                </span>
              </div>

              <!-- Quick Model Select Grid -->
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
                    <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1">High reasoning speed & precision.</p>
                    <div class="mt-2 text-[10px] font-mono text-blue-600 dark:text-blue-400 font-semibold">1.0x Credits</div>
                  </div>
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
                    <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1">High complexity multi-table schemas.</p>
                    <div class="mt-2 text-[10px] font-mono text-blue-600 dark:text-blue-400 font-semibold">5.0x Credits</div>
                  </div>
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
                    <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Lowest cost per token.</p>
                    <div class="mt-2 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">0.5x Credits</div>
                  </div>
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
                      <span class="text-[9px] px-1.5 py-0.5 rounded font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">Stable</span>
                    </div>
                    <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Reliable fallback generation.</p>
                    <div class="mt-2 text-[10px] font-mono text-blue-600 dark:text-blue-400 font-semibold">1.0x Credits</div>
                  </div>
                </button>
              </div>
            </div>

            <!-- Tier Allowances & Limits -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Free Tier Settings -->
              <div class="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800  space-y-4">
                <h3 class="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  Free Tier Quota & Limits
                </h3>
                <div class="space-y-3 text-xs">
                  <div>
                    <label class="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Monthly Credit Allowance</label>
                    <input
                      v-model.number="configForm.freeTierMonthlyCredits"
                      type="number"
                      step="1000"
                      class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>
                  <div>
                    <label class="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Max Prompt Characters</label>
                    <input
                      v-model.number="configForm.freeMaxPromptLength"
                      type="number"
                      class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              <!-- Pro Tier Settings -->
              <div class="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800  space-y-4">
                <h3 class="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  Pro Tier Quota & Limits
                </h3>
                <div class="space-y-3 text-xs">
                  <div>
                    <label class="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Monthly Credit Allowance</label>
                    <input
                      v-model.number="configForm.proTierMonthlyCredits"
                      type="number"
                      step="50000"
                      class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>
                  <div>
                    <label class="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Max Prompt Characters</label>
                    <input
                      v-model.number="configForm.proMaxPromptLength"
                      type="number"
                      class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- TallySale Webhook URL -->
            <div class="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800  space-y-3 text-xs">
              <h3 class="font-bold text-sm text-slate-900 dark:text-white">TallySale Billing & Webhook Gateway</h3>
              <div>
                <label class="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Invoice Gateway Base URL</label>
                <input
                  v-model="configForm.tallySaleInvoiceUrl"
                  type="url"
                  placeholder="https://api.tallysale.com"
                  class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                />
              </div>
            </div>

            <!-- Propagate to Existing Users Checkbox -->
            <div class="p-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 rounded-2xl flex items-start gap-3">
              <input
                id="propagate-quota"
                v-model="configForm.applyToExistingFreeUsers"
                type="checkbox"
                class="mt-1 rounded text-blue-600 focus:ring-blue-500"
              />
              <label for="propagate-quota" class="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <span class="font-bold">Apply and reset this base credit allowance to all active user accounts now</span>
                <p class="text-slate-500 dark:text-slate-400 mt-0.5">
                  Immediately updates registered accounts' credit balance to {{ (configForm.freeTierMonthlyCredits || 0).toLocaleString() }}.
                </p>
              </label>
            </div>

            <!-- Save Form CTA -->
            <div class="flex justify-end">
              <button
                type="submit"
                class="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition  flex items-center gap-2 cursor-pointer"
              >
                <Check class="w-4 h-4" />
                <span>Save System Configurations</span>
              </button>
            </div>
          </form>
        </div>

        <!-- ============================================================ -->
        <!-- TAB 4: AI USAGE AUDIT LOGS -->
        <!-- ============================================================ -->
        <div v-if="activeAdminTab === 'logs'" class="space-y-4 animate-in fade-in duration-150">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-xl font-bold text-slate-900 dark:text-white">AI Generation Usage Logs</h1>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Audit trail of AI queries, token consumption, and credits deducted.
              </p>
            </div>
          </div>

          <!-- Logs Search & Table -->
          <div class="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800  space-y-4">
            <input
              v-model="logsSearchQuery"
              type="text"
              placeholder="Search logs by email, model, or dialect..."
              class="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th class="p-3">User</th>
                    <th class="p-3">Model</th>
                    <th class="p-3">Prompt</th>
                    <th class="p-3">Tokens</th>
                    <th class="p-3">Credits</th>
                    <th class="p-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr v-if="filteredLogs.length === 0">
                    <td colspan="6" class="p-8 text-center text-slate-400 text-xs">
                      No usage logs recorded yet.
                    </td>
                  </tr>
                  <tr v-for="log in filteredLogs" :key="log.id" class="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td class="p-3 font-medium text-slate-900 dark:text-white">{{ log.email || log.userId }}</td>
                    <td class="p-3 font-mono text-[11px] text-blue-600 dark:text-blue-400">{{ log.model || 'gemini-3.8-flash' }}</td>
                    <td class="p-3 font-mono">{{ log.promptLength || 0 }} chars</td>
                    <td class="p-3 font-mono">{{ log.totalTokens || log.rawTokens || 0 }}</td>
                    <td class="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">{{ (log.creditsDeducted || log.totalTokens || 0).toLocaleString() }}</td>
                    <td class="p-3 text-slate-400 text-[11px]">{{ log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Recent' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- ============================================================ -->
        <!-- TAB 5: MARKETPLACE BLUEPRINTS MANAGEMENT -->
        <!-- ============================================================ -->
        <div v-if="activeAdminTab === 'marketplace'" class="space-y-4 animate-in fade-in duration-150">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-xl font-bold text-slate-900 dark:text-white">Marketplace Blueprints & Templates</h1>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Manage official dbmaps System templates and community submissions.
              </p>
            </div>
            <button
              @click="handleCreateSystemBlueprint"
              class="px-3.5 py-2      text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5  cursor-pointer bg-blue-700"
            >
              <Plus class="w-4 h-4" />
              <span>New System Blueprint</span>
            </button>
          </div>

          <!-- Empty State when no templates exist -->
          <div
            v-if="allMarketplaceTemplates.length === 0"
            class="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-slate-500 text-xs space-y-3"
          >
            <div class="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
              <Layers class="w-6 h-6" />
            </div>
            <div class="font-bold text-slate-700 dark:text-slate-300 text-sm">No Marketplace Templates Found</div>
            <p class="max-w-md mx-auto text-slate-500 dark:text-slate-400">
              The default templates have been cleared. Click "New System Blueprint" above to design and publish official templates for users.
            </p>
            <button
              @click="handleCreateSystemBlueprint"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5  cursor-pointer"
            >
              <Plus class="w-4 h-4" />
              <span>Create First System Blueprint</span>
            </button>
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              v-for="tpl in allMarketplaceTemplates"
              :key="tpl.id"
              class="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl  space-y-3 flex flex-col justify-between"
            >
              <div>
                <div class="flex items-start justify-between gap-2">
                  <div class="font-bold text-sm text-slate-900 dark:text-white">{{ tpl.name }}</div>
                  <span
                    class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                    :class="tpl.isSystem ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'"
                  >
                    {{ tpl.isSystem ? 'Official System' : 'Community' }}
                  </span>
                </div>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{{ tpl.description }}</p>
              </div>

              <div class="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <span class="font-mono text-slate-400 text-[11px]">{{ tpl.dialect || 'postgres' }}</span>
                <div class="flex items-center gap-1.5">
                  <!-- Edit Blueprint -->
                  <button
                    @click="handleEditTemplate(tpl)"
                    class="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:text-blue-600 dark:hover:text-blue-400 text-slate-700 dark:text-slate-200 rounded-lg text-[11px] font-semibold transition flex items-center gap-1 cursor-pointer"
                    title="Edit blueprint metadata, name, category, or schema"
                  >
                    <Edit3 class="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <!-- Promote / Demote System status -->
                  <button
                    @click="handleToggleSystem(tpl)"
                    class="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-slate-700 dark:text-slate-300 hover:text-blue-600 rounded-lg text-[11px] transition cursor-pointer"
                  >
                    {{ tpl.isSystem ? 'Demote' : 'Promote to System' }}
                  </button>

                  <!-- Delete -->
                  <button
                    @click="handleDeleteTemplate(tpl)"
                    class="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950 transition cursor-pointer"
                    title="Delete template"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- ============================================================ -->
    <!-- MODAL: ADD NEW USER ACCOUNT -->
    <!-- ============================================================ -->
    <div
      v-if="showAddUserModal"
      class="app-dialog-backdrop fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70  p-4 overflow-y-auto"
    >
      <div role="dialog" aria-modal="true" aria-label="Admin details" class="app-dialog bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl  w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150">
        <!-- Header -->
        <div class="app-dialog-heading px-6 py-4    text-white flex items-center justify-between bg-blue-700">
          <div class="flex items-center gap-2.5">
            <div class="p-2 rounded-xl bg-white/10 text-white">
              <UserPlus class="w-5 h-5" />
            </div>
            <div>
              <h3 class="font-bold text-sm">Provision New User Account</h3>
              <p class="text-[11px] text-white/80">Add a developer account with custom tier and credits</p>
            </div>
          </div>
          <button aria-label="Close dialog"
            @click="showAddUserModal = false"
            class="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Add User Form -->
        <form @submit.prevent="handleCreateUserSubmit" class="p-6 space-y-4 text-xs">
          <!-- Email Address -->
          <div>
            <label class="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
              Email Address <span class="text-rose-500">*</span>
            </label>
            <input
              v-model="newUserForm.email"
              type="email"
              required
              placeholder="developer@example.com"
              class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
            />
          </div>

          <!-- Display Name -->
          <div>
            <label class="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
              Display Name (Optional)
            </label>
            <input
              v-model="newUserForm.displayName"
              type="text"
              placeholder="Alex Smith"
              class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
            />
          </div>

          <!-- Subscription Tier & Role in 2 Columns -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Subscription Tier
              </label>
              <select
                v-model="newUserForm.tier"
                @change="onNewUserTierChanged"
                class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
              >
                <option value="free">Free Tier</option>
                <option value="pro">Pro Tier</option>
              </select>
            </div>

            <div>
              <label class="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Role
              </label>
              <select
                v-model="newUserForm.role"
                class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
              >
                <option value="user">Standard User</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
          </div>

          <!-- Initial Credits -->
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="font-semibold text-slate-700 dark:text-slate-300">
                Initial Credit Balance
              </label>
              <span class="text-[10px] text-slate-400 font-mono">
                {{ (newUserForm.initialCredits || 0).toLocaleString() }} credits
              </span>
            </div>
            <input
              v-model.number="newUserForm.initialCredits"
              type="number"
              step="5000"
              class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-slate-900 dark:text-white"
            />
            <!-- Quick Preset Buttons -->
            <div class="flex items-center gap-1.5 mt-2">
              <button
                type="button"
                @click="newUserForm.initialCredits = 50000"
                class="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[10px] font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
              >
                50k (Base)
              </button>
              <button
                type="button"
                @click="newUserForm.initialCredits = 100000"
                class="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[10px] font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
              >
                100k
              </button>
              <button
                type="button"
                @click="newUserForm.initialCredits = 500000"
                class="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[10px] font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
              >
                500k
              </button>
              <button
                type="button"
                @click="newUserForm.initialCredits = 1000000"
                class="px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/80 hover:bg-amber-100 text-[10px] font-semibold text-amber-700 dark:text-amber-300 cursor-pointer"
              >
                1M (Pro)
              </button>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              @click="showAddUserModal = false"
              class="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="isSubmittingUser"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition flex items-center gap-1.5  cursor-pointer disabled:opacity-50"
            >
              <UserPlus class="w-4 h-4" />
              <span>{{ isSubmittingUser ? 'Provisioning...' : 'Create Account' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- MODAL: SET EXACT USER CREDITS -->
    <!-- ============================================================ -->
    <div
      v-if="showExactCreditsModal && editingUser"
      class="app-dialog-backdrop fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70  p-4 overflow-y-auto"
    >
      <div role="dialog" aria-modal="true" aria-label="Admin details" class="app-dialog bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl  w-full max-w-sm overflow-hidden p-6 space-y-4 text-xs">
        <div>
          <h3 class="font-bold text-sm text-slate-900 dark:text-white">Adjust Exact Credit Balance</h3>
          <p class="text-slate-500 dark:text-slate-400 mt-1">
            Setting balance for <strong>{{ editingUser.email || editingUser.uid }}</strong>
          </p>
        </div>

        <div>
          <label class="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Exact Credit Amount</label>
          <input
            v-model.number="exactCreditsInput"
            type="number"
            min="0"
            class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button
            @click="showExactCreditsModal = false"
            class="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            @click="handleSaveExactCredits"
            class="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer"
          >
            Update Credits
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import {
  state,
  isCurrentUserAdmin,
  fetchAdminUsersAndPayments,
  adminUpdateUserTier,
  adminApprovePayment,
  adminUpdateSystemConfig,
  adminCreateUser,
  adminDeleteUser,
  allMarketplaceTemplates,
  openCreateSystemMarketplaceTemplate,
  openEditMarketplaceTemplate,
  toggleTemplateSystemStatus,
  deleteMarketplaceTemplate,
  navigateTo,
  toggleDarkMode
} from '../stores/schemaStore.js';
import DbMapLogo from './DbMapLogo.vue';
import {
  ShieldAlert,
  Users,
  UserPlus,
  Receipt,
  Sliders,
  Activity,
  RefreshCw,
  CheckCircle2,
  Cpu,
  Coins,
  Layers,
  Plus,
  Trash2,
  Edit3,
  RotateCcw,
  ShieldCheck,
  Search,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Sun,
  Moon,
  ArrowRight,
  BarChart3,
  Lock,
  Check,
  X
} from 'lucide-vue-next';

// Tab State
const activeAdminTab = ref('overview');
const isLoading = ref(false);
const usersList = ref([]);
const requestsList = ref([]);
const logsList = ref([]);

// User Search, Filters, Sorting & Pagination State
const userSearchQuery = ref('');
const userTierFilter = ref('all');
const userRoleFilter = ref('all');
const userSortBy = ref('recent');
const userCurrentPage = ref(1);
const userPageSize = ref(10);

// Add User Modal State
const showAddUserModal = ref(false);
const isSubmittingUser = ref(false);
const newUserForm = ref({
  email: '',
  displayName: '',
  tier: 'free',
  role: 'user',
  initialCredits: 50000
});

// Set Exact Credits Modal State
const showExactCreditsModal = ref(false);
const editingUser = ref(null);
const exactCreditsInput = ref(50000);

// Logs Search Query
const logsSearchQuery = ref('');

// Config Form
const configForm = ref({
  aiModel: 'gemini-3.8-flash',
  freeTierMonthlyCredits: 50000,
  proTierMonthlyCredits: 1000000,
  freeMaxPromptLength: 3000,
  proMaxPromptLength: 20000,
  tallySaleInvoiceUrl: 'https://api.tallysale.com',
  applyToExistingFreeUsers: false
});

// Computed Tab Title
const activeTabName = computed(() => {
  switch (activeAdminTab.value) {
    case 'overview': return 'Overview & KPIs';
    case 'users': return 'User Accounts';
    case 'payments': return 'TallySale Invoices';
    case 'config': return 'AI Engine & Quotas';
    case 'logs': return 'Usage Logs';
    case 'marketplace': return 'Marketplace Blueprints';
    default: return 'Overview';
  }
});

// Metric Calculations
const pendingRequestsCount = computed(() => {
  return (requestsList.value || []).filter(r => r.status === 'PENDING').length;
});

const proUsersCount = computed(() => {
  return (usersList.value || []).filter(u => u.tier === 'pro').length;
});

const freeUsersCount = computed(() => {
  return (usersList.value || []).filter(u => u.tier !== 'pro').length;
});

const totalCirculatingCredits = computed(() => {
  return (usersList.value || []).reduce((sum, u) => sum + (u.creditsRemaining || 0), 0);
});

// Filtered and Sorted Users
const filteredUsers = computed(() => {
  let list = [...usersList.value];
  const q = userSearchQuery.value.toLowerCase().trim();

  // Search filter
  if (q) {
    list = list.filter(u =>
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.displayName && u.displayName.toLowerCase().includes(q)) ||
      (u.uid && u.uid.toLowerCase().includes(q))
    );
  }

  // Tier filter
  if (userTierFilter.value !== 'all') {
    list = list.filter(u => (u.tier || 'free') === userTierFilter.value);
  }

  // Role filter
  if (userRoleFilter.value !== 'all') {
    list = list.filter(u => (u.role || 'user') === userRoleFilter.value);
  }

  // Sort
  if (userSortBy.value === 'recent') {
    list.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
  } else if (userSortBy.value === 'email_asc') {
    list.sort((a, b) => (a.email || '').localeCompare(b.email || ''));
  } else if (userSortBy.value === 'credits_desc') {
    list.sort((a, b) => (b.creditsRemaining || 0) - (a.creditsRemaining || 0));
  } else if (userSortBy.value === 'used_desc') {
    list.sort((a, b) => (b.creditsUsedTotal || 0) - (a.creditsUsedTotal || 0));
  }

  return list;
});

// Pagination Calculations
const totalUserPages = computed(() => {
  const total = filteredUsers.value.length;
  return Math.max(1, Math.ceil(total / userPageSize.value));
});

// Ensure current page remains within range when search / filter changes
watch([filteredUsers, userPageSize], () => {
  if (userCurrentPage.value > totalUserPages.value) {
    userCurrentPage.value = 1;
  }
});

const paginatedUsers = computed(() => {
  const start = (userCurrentPage.value - 1) * userPageSize.value;
  return filteredUsers.value.slice(start, start + userPageSize.value);
});

const paginationRange = computed(() => {
  const total = filteredUsers.value.length;
  if (total === 0) return { start: 0, end: 0 };
  const start = (userCurrentPage.value - 1) * userPageSize.value + 1;
  const end = Math.min(start + userPageSize.value - 1, total);
  return { start, end };
});

const visibleUserPages = computed(() => {
  const total = totalUserPages.value;
  const current = userCurrentPage.value;
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages = [];
  pages.push(1);
  if (current > 3) pages.push('...');
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 2) pages.push('...');
  pages.push(total);
  return pages;
});

// Filtered Logs
const filteredLogs = computed(() => {
  if (!logsSearchQuery.value.trim()) return logsList.value || [];
  const q = logsSearchQuery.value.toLowerCase().trim();
  return (logsList.value || []).filter(l =>
    (l.email && l.email.toLowerCase().includes(q)) ||
    (l.userId && l.userId.toLowerCase().includes(q)) ||
    (l.model && l.model.toLowerCase().includes(q)) ||
    (l.dialect && l.dialect.toLowerCase().includes(q))
  );
});

// Data Loading
async function loadAdminData() {
  isLoading.value = true;
  try {
    const data = await fetchAdminUsersAndPayments();
    usersList.value = data.users || [];
    requestsList.value = data.requests || [];
    logsList.value = data.logs || [];

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
    console.error('loadAdminData error:', e);
  } finally {
    isLoading.value = false;
  }
}

// User Actions
async function handleToggleUserTier(u) {
  const newTier = u.tier === 'pro' ? 'free' : 'pro';
  await adminUpdateUserTier(u.uid, newTier, 0, u.role || 'user');
  await loadAdminData();
}

async function handleTopUpUserCredits(u, amount) {
  await adminUpdateUserTier(u.uid, u.tier || 'free', amount, u.role || 'user');
  await loadAdminData();
}

function openSetExactCreditsModal(u) {
  editingUser.value = u;
  exactCreditsInput.value = u.creditsRemaining || 50000;
  showExactCreditsModal.value = true;
}

async function handleSaveExactCredits() {
  if (!editingUser.value) return;
  await adminUpdateUserTier(editingUser.value.uid, editingUser.value.tier || 'free', 0, editingUser.value.role || 'user', exactCreditsInput.value);
  showExactCreditsModal.value = false;
  editingUser.value = null;
  await loadAdminData();
}

async function handleDeleteUser(u) {
  if (window.confirm(`Are you sure you want to remove user account ${u.email || u.uid}? This cannot be undone.`)) {
    await adminDeleteUser(u.uid);
    await loadAdminData();
  }
}

// Add User Modal Handlers
function openAddUserModal() {
  newUserForm.value = {
    email: '',
    displayName: '',
    tier: 'free',
    role: 'user',
    initialCredits: 50000
  };
  showAddUserModal.value = true;
}

function onNewUserTierChanged() {
  if (newUserForm.value.tier === 'pro' && newUserForm.value.initialCredits === 50000) {
    newUserForm.value.initialCredits = 1000000;
  } else if (newUserForm.value.tier === 'free' && newUserForm.value.initialCredits === 1000000) {
    newUserForm.value.initialCredits = 50000;
  }
}

async function handleCreateUserSubmit() {
  if (!newUserForm.value.email || !newUserForm.value.email.includes('@')) {
    alert('Please enter a valid email address.');
    return;
  }
  isSubmittingUser.value = true;
  try {
    await adminCreateUser(newUserForm.value);
    showAddUserModal.value = false;
    // Switch to users tab and go to page 1
    activeAdminTab.value = 'users';
    userCurrentPage.value = 1;
    await loadAdminData();
  } catch (e) {
    console.error('handleCreateUserSubmit error:', e);
  } finally {
    isSubmittingUser.value = false;
  }
}

// Payment Approvals
async function handleApprovePayment(requestId, status) {
  await adminApprovePayment(requestId, status);
  await loadAdminData();
}

// Config Save
async function handleSaveSystemConfig() {
  await adminUpdateSystemConfig(configForm.value);
  await loadAdminData();
}

// Blueprint Actions
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
  if (window.confirm(`Are you sure you want to remove template "${tpl.name}"?`)) {
    await deleteMarketplaceTemplate(tpl.id);
  }
}

// Navigation Handlers
function goToHome() {
  navigateTo('/');
}

function goToStudio() {
  navigateTo('/app');
}

function openAuthModal() {
  state.modals.auth = true;
}

onMounted(() => {
  loadAdminData();
});
</script>
