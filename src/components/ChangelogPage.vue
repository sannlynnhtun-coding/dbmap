<template>
  <div class="app-page app-changelog-page min-h-dvh bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white transition-colors duration-200">
    <!-- Top Sticky Navigation Bar -->
    <header class="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90  border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 py-3.5 transition-colors">
      <div class="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <!-- Left: Logo & Breadcrumbs -->
        <div class="flex items-center gap-3">
          <button
            @click="navigateTo('/')"
            class="flex items-center gap-2.5 font-bold text-blue-600 dark:text-blue-400 text-lg hover:opacity-90 transition cursor-pointer"
            title="dbmaps - Home"
          >
            <DbMapLogo class-name="w-8 h-8 drop-shadow-sm" />
            <span class="font-mono tracking-tight text-slate-900 dark:text-slate-100 text-xl font-semibold">
              db<span class="text-blue-600 dark:text-blue-400">maps</span>
            </span>
          </button>

          <span class="text-slate-300 dark:text-slate-700 hidden sm:inline text-sm font-light">/</span>

          <div class="hidden sm:flex items-center gap-2">
            <span class="text-xs font-bold text-slate-700 dark:text-slate-200">Changelog & Issue Tracker</span>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              v1.4.6
            </span>
          </div>
        </div>

        <!-- Center: Tab Switcher (Desktop) -->
        <div class="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold">
          <button
            @click="activeTab = 'changelog'"
            class="px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-2 cursor-pointer"
            :class="[
              activeTab === 'changelog'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            ]"
          >
            <GitCommit class="w-3.5 h-3.5" />
            <span>Release Timeline</span>
            <span class="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300">
              {{ filteredChangelog.length }}
            </span>
          </button>

          <button
            @click="activeTab = 'issues'"
            class="px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-2 cursor-pointer"
            :class="[
              activeTab === 'issues'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            ]"
          >
            <Bug class="w-3.5 h-3.5" />
            <span>Issue Tracker</span>
            <span class="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300">
              {{ allIssuesList.length }}
            </span>
          </button>
        </div>

        <!-- Right Side: Account, Dark Mode Toggle & Return to Studio CTA -->
        <div class="flex items-center gap-2 sm:gap-2.5">
          <!-- User Session / Login Button -->
          <div v-if="isAuthenticated" class="flex items-center gap-1.5">
            <button
              @click="openAuthModal"
              class="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer border border-slate-200/80 dark:border-slate-700/80 text-xs"
              title="Account Settings"
            >
              <UserAvatar
                :avatar="state.currentUser.avatar || auth?.currentUser?.photoURL"
                :name="state.currentUser.name || auth?.currentUser?.displayName"
                :is-logged-in="true"
                size="xs"
                :show-status="true"
                status-color="#10b981"
              />
              <span class="font-semibold text-slate-700 dark:text-slate-200 max-w-[100px] truncate hidden md:inline">
                {{ (state.currentUser.name || auth?.currentUser?.displayName || 'User').split(' ')[0] }}
              </span>
              <ShieldCheck class="w-3 h-3 text-emerald-500 hidden sm:inline" />
            </button>
          </div>
          <button
            v-else
            @click="openAuthModal"
            class="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-xl text-blue-600 dark:text-blue-400 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 border border-blue-200/80 dark:border-blue-800/80 transition cursor-pointer"
            title="Sign in with Google or account"
          >
            <LogIn class="w-3.5 h-3.5" />
            <span class="hidden sm:inline">Sign In</span>
          </button>

          <button
            @click="toggleDarkMode"
            class="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            :title="state.isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
          >
            <Sun v-if="state.isDarkMode" class="w-4 h-4 text-amber-400" />
            <Moon v-else class="w-4 h-4 text-slate-600" />
          </button>

          <button
            @click="navigateTo('/')"
            class="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <Home class="w-3.5 h-3.5" />
            <span>Home</span>
          </button>

          <button
            @click="navigateTo('/app')"
            class="px-3.5 sm:px-4 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs rounded-xl transition  flex items-center gap-1.5 cursor-pointer"
          >
            <span>Launch Studio</span>
            <ArrowRight class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>

    <!-- Hero Header Banner -->
    <section class="border-b border-slate-200 dark:border-slate-800 py-10 px-4 sm:px-8 app-soft-surface">
      <div class="max-w-5xl mx-auto space-y-4 text-center sm:text-left sm:flex sm:items-center sm:justify-between sm:space-y-0">
        <div class="space-y-2 max-w-2xl">

          <h1 class="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Changelog & issues
          </h1>
          <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Live technical audit trail of release milestones, defect resolutions, and performance optimizations. Have you encountered an anomaly or have an architectural suggestion? Submit it directly to our engineering log.
          </p>
        </div>

        <!-- Metric Badges Stack -->
        <div class="flex items-center gap-3 justify-center sm:justify-end shrink-0 pt-2 sm:pt-0">
          <div class="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center  min-w-[90px]">
            <div class="text-xs font-bold text-slate-400 uppercase tracking-wider">Engine</div>
            <div class="text-lg font-mono font-semibold text-blue-600 dark:text-blue-400 mt-0.5">v1.4.3</div>
          </div>
          <div class="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center  min-w-[90px]">
            <div class="text-xs font-bold text-slate-400 uppercase tracking-wider">Fixes</div>
            <div class="text-lg font-mono font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">24+ Done</div>
          </div>
          <div class="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center  min-w-[90px]">
            <div class="text-xs font-bold text-slate-400 uppercase tracking-wider">Status</div>
            <div class="text-lg font-mono font-semibold text-blue-600 dark:text-blue-400 mt-0.5 flex items-center justify-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Active</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Main Container Area -->
    <main class="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-8 space-y-8">
      <!-- ======================================================== -->
      <!-- TAB 1: SYSTEM CHANGELOG & RELEASE ACTIVITIES TIMELINE   -->
      <!-- ======================================================== -->
      <div v-if="activeTab === 'changelog'" class="space-y-6 animate-fade-in">
        <!-- Search & Category Filters Bar -->
        <div class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800  space-y-3">
          <div class="flex flex-col sm:flex-row items-center gap-3 justify-between">
            <!-- Search Input -->
            <div class="relative w-full sm:w-80">
              <Search class="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                v-model="changelogSearchQuery"
                type="text"
                placeholder="Search fixes, features, or keywords..."
                class="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 transition"
              />
              <button
                v-if="changelogSearchQuery"
                @click="changelogSearchQuery = ''"
                class="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                title="Clear search"
              >
                <X class="w-3.5 h-3.5" />
              </button>
            </div>

            <!-- Activity Type Filter Chips -->
            <div class="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
              <button
                v-for="type in changeTypes"
                :key="type.id"
                @click="selectedChangeType = type.id"
                class="px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                :class="[
                  selectedChangeType === type.id
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                ]"
              >
                <span>{{ type.label }}</span>
                <span class="opacity-75 font-mono text-[10px]">({{ getChangeTypeCount(type.id) }})</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Timeline Stream -->
        <div class="relative pl-6 sm:pl-8 border-l-2 border-slate-200 dark:border-slate-800 space-y-10 my-4">
          <div
            v-for="(release, rIdx) in filteredChangelog"
            :key="release.version"
            class="relative group"
          >
            <!-- Timeline Pin Indicator Icon -->
            <div
              class="absolute -left-[31px] sm:-left-[39px] top-1.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-transform group-hover:scale-110"
              :class="[
                rIdx === 0
                  ? 'bg-blue-600 border-blue-400 text-white ring-4 ring-blue-500/20'
                  : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-500'
              ]"
            >
              <CheckCircle2 v-if="rIdx === 0" class="w-3.5 h-3.5" />
              <GitCommit v-else class="w-3 h-3" />
            </div>

            <!-- Release Card -->
            <div class="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800   transition-all space-y-4">
              <!-- Top Row: Version, Date, Badge -->
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div class="flex items-center gap-2.5 flex-wrap">
                  <span class="text-base sm:text-lg font-mono font-semibold text-slate-900 dark:text-white">
                    {{ release.version }}
                  </span>
                  <span
                    v-if="release.isCurrent"
                    class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                  >
                    CURRENT STABLE
                  </span>
                  <span class="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    &bull; {{ release.title }}
                  </span>
                </div>

                <div class="flex items-center gap-2 text-xs font-mono text-slate-400 dark:text-slate-500">
                  <Calendar class="w-3.5 h-3.5" />
                  <span>{{ release.date }}</span>
                </div>
              </div>

              <!-- Release Summary Paragraph -->
              <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {{ release.summary }}
              </p>

              <!-- Detailed Changes List -->
              <div class="space-y-2.5 pt-1">
                <div
                  v-for="(item, iIdx) in release.items"
                  :key="iIdx"
                  class="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 space-y-1.5"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div class="flex items-center gap-2 flex-wrap">
                      <!-- Change Classification Badge -->
                      <span
                        class="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-tight uppercase"
                        :class="[
                          item.type === 'bugfix' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-900' :
                          item.type === 'feature' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-900' :
                          item.type === 'ux' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-900' :
                          item.type === 'performance' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-900' :
                          'bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-900'
                        ]"
                      >
                        {{ item.typeLabel || item.type }}
                      </span>

                      <!-- Component Subsystem Tag -->
                      <span class="px-2 py-0.5 rounded text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-200/70 dark:bg-slate-700/60">
                        {{ item.component }}
                      </span>

                      <span class="text-xs font-bold text-slate-800 dark:text-slate-100">
                        {{ item.headline }}
                      </span>
                    </div>

                    <!-- Direct Quick Link / Verification Check -->
                    <Check class="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" title="Verified in Production" />
                  </div>

                  <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-1">
                    {{ item.details }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty Search State -->
          <div
            v-if="filteredChangelog.length === 0"
            class="p-8 text-center rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 space-y-3"
          >
            <Search class="w-8 h-8 text-slate-400 mx-auto" />
            <div class="font-bold text-sm text-slate-700 dark:text-slate-200">No matching activities found</div>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              Try adjusting your query or resetting the category filter.
            </p>
            <button
              @click="resetChangelogFilters"
              class="px-3.5 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      <!-- ======================================================== -->
      <!-- TAB 2: ISSUE SUBMISSION PORTAL & COMMUNITY BUG TRACKER   -->
      <!-- ======================================================== -->
      <div v-else-if="activeTab === 'issues'" class="space-y-8 animate-fade-in">
        <!-- Top Information Banner -->
        <div class="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 flex items-start gap-3">
          <div class="p-2 rounded-xl bg-blue-600 text-white shrink-0 mt-0.5">
            <Bug class="w-4 h-4" />
          </div>
          <div class="space-y-1 text-xs">
            <h3 class="font-bold text-blue-950 dark:text-blue-200">
              Technical Bug Reporting & Feature Request Portal
            </h3>
            <p class="text-blue-800/90 dark:text-blue-300/90 leading-relaxed">
              Facing an unexpected error, drag-and-drop anomaly, SQL parsing edge case, or have an architectural suggestion? Submit your detailed report here. Our engineering queue is reviewed continuously and reflected in subsequent release updates.
            </p>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <!-- Left: Issue Submission Form (7 Cols) -->
          <div class="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6  space-y-5">
            <div class="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-start justify-between gap-3">
              <div>
                <h2 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileCode class="w-4 h-4 text-blue-500" />
                  <span>Submit New Issue Ticket</span>
                </h2>
                <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Structured defect reporting & enhancement submissions for engineering triage.
                </p>
              </div>

              <!-- Authenticated Status Indicator Pill -->
              <span
                v-if="isAuthenticated"
                class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0 flex items-center gap-1.5"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Authenticated</span>
              </span>
              <span
                v-else
                class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shrink-0 flex items-center gap-1.5"
              >
                <Lock class="w-3 h-3 text-amber-600 dark:text-amber-400" />
                <span>Login Required</span>
              </span>
            </div>

            <!-- STATE A: User is NOT logged in - Prominent Authentication Gate -->
            <div v-if="!isAuthenticated" class="space-y-5">
              <div class="p-5 rounded-2xl        border border-blue-200/80 dark:border-blue-800/80  space-y-4 app-soft-surface">
                <div class="flex items-start gap-3.5">
                  <div class="p-3 rounded-2xl bg-blue-600 text-white  shrink-0">
                    <ShieldAlert class="w-5 h-5" />
                  </div>
                  <div class="space-y-1.5">
                    <div class="flex items-center gap-2 flex-wrap">
                      <h3 class="font-semibold text-slate-900 dark:text-white text-sm">
                        Authentication Required to Submit Issues
                      </h3>
                      <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                        Protected Form
                      </span>
                    </div>
                    <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      To prevent automated spam, verify reproduction environments, and keep you notified as fixes roll out, only authenticated developers can log new issue tickets.
                    </p>
                  </div>
                </div>

                <div class="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
                  <button
                    @click="handleGoogleLogin"
                    :disabled="state.isLoggingIn"
                    class="w-full sm:w-auto px-4 py-2.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed text-slate-800 dark:text-slate-100 font-bold text-xs border border-slate-300 dark:border-slate-700 rounded-xl transition flex items-center justify-center gap-2.5  cursor-pointer"
                  >
                    <svg v-if="!state.isLoggingIn" class="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    <div v-else class="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0"></div>
                    <span>{{ state.isLoggingIn ? 'Connecting to Google...' : 'Sign In with Google SSO' }}</span>
                  </button>

                  <button
                    @click="openAuthModal"
                    class="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5  cursor-pointer"
                  >
                    <LogIn class="w-3.5 h-3.5" />
                    <span>All Account Options</span>
                  </button>
                </div>
              </div>

              <!-- Disabled Form Preview with Unlock Callout -->
              <div class="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-900/50 space-y-4 select-none opacity-60">
                <div class="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 pb-2">
                  <span class="flex items-center gap-1.5">
                    <Lock class="w-3.5 h-3.5 text-amber-500" />
                    <span>Ticket Form Fields Preview (Locked)</span>
                  </span>
                  <span>Sign in above to enable</span>
                </div>

                <div class="space-y-3 pointer-events-none">
                  <div>
                    <label class="block text-xs font-semibold text-slate-400 mb-1">Issue Summary / Title</label>
                    <div class="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-400">
                      e.g., Schema card dimmed on click or SQL parser fails on ENUM type
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="block text-xs font-semibold text-slate-400 mb-1">Classification Category</label>
                      <div class="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-400">
                        Functional Defect (Bug)
                      </div>
                    </div>
                    <div>
                      <label class="block text-xs font-semibold text-slate-400 mb-1">Severity Priority</label>
                      <div class="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-400">
                        P1 - High Priority
                      </div>
                    </div>
                  </div>

                  <div>
                    <label class="block text-xs font-semibold text-slate-400 mb-1">Technical Description & Context</label>
                    <div class="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-400 h-16">
                      Detail what happened, what inputs were supplied, or which dialect was being tested...
                    </div>
                  </div>
                </div>

                <div class="pt-1">
                  <button
                    @click="openAuthModal"
                    type="button"
                    class="w-full py-2.5 px-4 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer hover:bg-blue-600 hover:text-white transition"
                  >
                    <Lock class="w-3.5 h-3.5" />
                    <span>Sign In to Unlock and Submit Issue</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- STATE B: User IS Logged In - Full Active Interactive Form -->
            <div v-else class="space-y-4">
              <!-- Authenticated Reporter Session Banner -->
              <div class="p-3 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 rounded-xl flex items-center justify-between gap-3 text-xs">
                <div class="flex items-center gap-2.5 min-w-0">
                  <UserAvatar
                    :avatar="state.currentUser.avatar || auth?.currentUser?.photoURL"
                    :name="state.currentUser.name || auth?.currentUser?.displayName"
                    :is-logged-in="true"
                    size="sm"
                    :show-status="true"
                    status-color="#10b981"
                  />
                  <div class="min-w-0">
                    <div class="font-bold text-slate-800 dark:text-slate-100 text-xs flex items-center gap-1.5 truncate">
                      <span>{{ state.currentUser.name || auth?.currentUser?.displayName || 'Developer' }}</span>
                      <span class="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                        Verified Contributor
                      </span>
                    </div>
                    <div class="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">
                      {{ state.currentUser.email || auth?.currentUser?.email }}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  @click="openAuthModal"
                  class="text-[11px] text-blue-600 dark:text-blue-400 hover:underline shrink-0 font-medium cursor-pointer"
                >
                  Switch Account
                </button>
              </div>

              <form @submit.prevent="handleSubmitIssue" class="space-y-4">
                <!-- Issue Title -->
                <div>
                  <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Issue Summary / Title <span class="text-rose-500">*</span>
                  </label>
                  <input
                    v-model="issueForm.title"
                    type="text"
                    required
                    placeholder="e.g., Schema card dimmed on click or SQL parser fails on ENUM type"
                    class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 transition"
                  />
                </div>

                <!-- Two Column Selects: Category & Severity -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <!-- Category -->
                  <div>
                    <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Classification Category <span class="text-rose-500">*</span>
                    </label>
                    <select
                      v-model="issueForm.category"
                      class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="bug">Functional Defect (Bug)</option>
                      <option value="ui_ux">UI / UX & Drag-and-Drop</option>
                      <option value="sql_importer">SQL Dialect / DDL Parser</option>
                      <option value="performance">Performance & Canvas Lag</option>
                      <option value="feature">Enhancement Proposal</option>
                    </select>
                  </div>

                  <!-- Severity / Priority -->
                  <div>
                    <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Severity Priority <span class="text-rose-500">*</span>
                    </label>
                    <select
                      v-model="issueForm.severity"
                      class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="P0_blocker">P0 - Blocker (Data loss / Crash)</option>
                      <option value="P1_high">P1 - High (Core feature non-operational)</option>
                      <option value="P2_medium">P2 - Medium (Minor defect / Workaround exists)</option>
                      <option value="P3_low">P3 - Low / Cosmetic</option>
                    </select>
                  </div>
                </div>

                <!-- Affected Subsystem Component -->
                <div>
                  <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Subsystem Component Affected
                  </label>
                  <select
                    v-model="issueForm.component"
                    class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="Sidebar & Filter Navigation">Sidebar & Filter Navigation</option>
                    <option value="ERD Canvas & Connectors">ERD Canvas & Relationship Connectors</option>
                    <option value="DBML CodeMirror Editor">DBML CodeMirror Editor</option>
                    <option value="SQL Importer / DDL Parser">SQL Importer / DDL Parser</option>
                    <option value="Cloud Firestore Real-Time Sync">Cloud Firestore Real-Time Sync</option>
                    <option value="Export & Diagrams (PNG/PDF)">Export & Diagrams (PNG/PDF/SQL)</option>
                    <option value="Marketplace & Templates">Marketplace & Templates</option>
                  </select>
                </div>

                <!-- Technical Description -->
                <div>
                  <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Technical Description & Context <span class="text-rose-500">*</span>
                  </label>
                  <textarea
                    v-model="issueForm.description"
                    required
                    rows="3"
                    placeholder="Detail what happened, what inputs were supplied, or which dialect was being tested..."
                    class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 transition leading-relaxed"
                  ></textarea>
                </div>

                <!-- Steps to Reproduce -->
                <div>
                  <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Steps to Reproduce
                  </label>
                  <textarea
                    v-model="issueForm.reproductionSteps"
                    rows="2"
                    placeholder="1. Open Sidebar &#10;2. Click on Database Group &#10;3. Observe cursor does not switch to grab"
                    class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 transition font-mono leading-relaxed"
                  ></textarea>
                </div>

                <!-- Expected vs Actual Behavior -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Expected Behavior
                    </label>
                    <input
                      v-model="issueForm.expectedBehavior"
                      type="text"
                      placeholder="e.g. Card should drag smoothly"
                      class="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 transition"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Actual Behavior
                    </label>
                    <input
                      v-model="issueForm.actualBehavior"
                      type="text"
                      placeholder="e.g. Card dims and freezes"
                      class="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 transition"
                    />
                  </div>
                </div>

                <!-- Auto-Captured Environment Diagnostics -->
                <div class="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5 text-[11px]">
                  <div class="flex items-center justify-between">
                    <span class="font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                      <Cpu class="w-3.5 h-3.5 text-blue-500" />
                      System Diagnostics (Attached Automatically)
                    </span>
                    <span class="text-[10px] text-slate-400 font-mono">v1.4.3</span>
                  </div>
                  <div class="text-slate-500 dark:text-slate-400 font-mono text-[10px] truncate">
                    User Agent: {{ systemDiagnostics.browser }} | OS: {{ systemDiagnostics.os }} | Viewport: {{ systemDiagnostics.viewport }}
                  </div>
                </div>

                <!-- Submit Button -->
                <div class="pt-2">
                  <button
                    type="submit"
                    :disabled="isSubmitting"
                    class="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition  flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send class="w-3.5 h-3.5" />
                    <span>{{ isSubmitting ? 'Submitting to Engineering Log...' : `Submit Issue Ticket as ${(state.currentUser.name || auth?.currentUser?.displayName || 'Developer').split(' ')[0]}` }}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          <!-- Right: Reported Issues & Resolution Queue (5 Cols) -->
          <div class="lg:col-span-5 space-y-4">
            <div class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800  space-y-3">
              <div class="flex items-center justify-between">
                <h3 class="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <History class="w-3.5 h-3.5 text-blue-500" />
                  <span>Live Issue Resolution Queue</span>
                </h3>
                <span class="text-[11px] font-mono text-slate-400">{{ allIssuesList.length }} tracked</span>
              </div>
              <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                Track real-time status of reported community items, active investigations, and confirmed fixes.
              </p>
            </div>

            <!-- Issues List -->
            <div class="space-y-3">
              <div
                v-for="issue in allIssuesList"
                :key="issue.id"
                class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800  space-y-2 hover:border-slate-300 dark:hover:border-slate-700 transition"
              >
                <!-- Top Row: Status Badge, Reporter & Date -->
                <div class="flex items-center justify-between gap-2 flex-wrap">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span
                      class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight"
                      :class="[
                        issue.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800' :
                        issue.status === 'Investigating' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800' :
                        issue.status === 'Scheduled' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-300 dark:border-blue-800' :
                        'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                      ]"
                    >
                      {{ issue.status }}
                    </span>

                    <span
                      v-if="isMyIssue(issue)"
                      class="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1"
                    >
                      <UserCheck class="w-3 h-3" />
                      <span>Your Ticket</span>
                    </span>
                  </div>

                  <span class="text-[10px] font-mono text-slate-400">
                    {{ issue.createdAt }}
                  </span>
                </div>

                <!-- Title -->
                <h4 class="text-xs font-bold text-slate-800 dark:text-slate-100">
                  {{ issue.title }}
                </h4>

                <!-- Description Snippet -->
                <p class="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {{ issue.description }}
                </p>

                <!-- Footer Meta: Reporter & Component & Fixed Version / Upvote -->
                <div class="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] font-mono text-slate-400 gap-2">
                  <div class="flex items-center gap-1.5 min-w-0">
                    <UserAvatar
                      :avatar="issue.authorAvatar"
                      :name="issue.authorName || 'Contributor'"
                      :is-logged-in="true"
                      size="xs"
                    />
                    <span class="truncate max-w-[130px] font-sans text-slate-600 dark:text-slate-400">
                      {{ issue.authorName || 'Contributor' }}
                    </span>
                  </div>

                  <div class="flex items-center gap-1.5 shrink-0">
                    <span v-if="issue.resolvedVersion" class="px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold">
                      Fixed in {{ issue.resolvedVersion }}
                    </span>
                    <button
                      @click="upvoteIssue(issue.id)"
                      class="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center gap-1 transition cursor-pointer"
                      title="Upvote / Me too"
                    >
                      <span>▲</span>
                      <span>{{ issue.votes || 1 }}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-8 px-4 sm:px-8 text-xs text-slate-500 dark:text-slate-400 mt-auto">
      <div class="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-2.5">
          <DbMapLogo class-name="w-5 h-5" />
          <span class="font-mono font-bold text-slate-800 dark:text-slate-100">
            db<span class="text-blue-600 dark:text-blue-400">maps</span>
          </span>
          <span>&bull;</span>
          <span>Engineering Audit Log & Issue Tracker</span>
        </div>

        <div class="flex items-center gap-4">
          <button @click="navigateTo('/')" class="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">Home</button>
          <span>&bull;</span>
          <button @click="navigateTo('/app')" class="hover:text-blue-600 dark:hover:text-blue-400 font-semibold cursor-pointer">Studio</button>
          <span>&bull;</span>
          <button @click="navigateTo('/marketplace')" class="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">Marketplace</button>
          <span>&bull;</span>
          <button @click="navigateTo('/privacy-policy')" class="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">Privacy</button>
          <span>&bull;</span>
          <button @click="navigateTo('/terms-of-service')" class="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">Terms</button>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue';
import { state, navigateTo, toggleDarkMode, addToast, loginWithGoogle, logoutUser } from '../stores/schemaStore.js';
import { db, auth } from '../firebase.js';
import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import DbMapLogo from './DbMapLogo.vue';
import UserAvatar from './UserAvatar.vue';
import {
  GitCommit,
  Bug,
  Search,
  CheckCircle2,
  Check,
  Calendar,
  X,
  FileCode,
  Send,
  Cpu,
  History,
  Home,
  ArrowRight,
  Sun,
  Moon,
  Sparkles,
  Lock,
  Unlock,
  LogIn,
  LogOut,
  ShieldAlert,
  ShieldCheck,
  UserCheck
} from 'lucide-vue-next';

const activeTab = ref('changelog'); // 'changelog' | 'issues'
const changelogSearchQuery = ref('');
const selectedChangeType = ref('all');
const isSubmitting = ref(false);

// Authentication state & helpers
const isAuthenticated = computed(() => {
  return Boolean(
    (state.currentUser?.isLoggedIn && state.currentUser?.id !== 'guest') ||
    auth?.currentUser
  );
});

function openAuthModal() {
  state.modals.auth = true;
}

async function handleGoogleLogin() {
  if (state.isLoggingIn) return;
  await loginWithGoogle();
}

function isMyIssue(issue) {
  if (!isAuthenticated.value) return false;
  const currentUid = auth?.currentUser?.uid || state.currentUser?.id;
  const currentEmail = (auth?.currentUser?.email || state.currentUser?.email || '').toLowerCase().trim();
  if (issue.authorUid && currentUid && issue.authorUid === currentUid) return true;
  if (issue.authorEmail && currentEmail && issue.authorEmail.toLowerCase().trim() === currentEmail) return true;
  return false;
}

const changeTypes = [
  { id: 'all', label: 'All Activities' },
  { id: 'bugfix', label: 'Bug Fixes' },
  { id: 'ux', label: 'UI / UX Ergonomics' },
  { id: 'feature', label: 'Core Features' },
  { id: 'architecture', label: 'Architecture' }
];

// Technical System Release Activities Log
const changelogReleases = ref([
  {
    version: 'v1.5.0',
    title: 'Academic & HD Diagram Exporter (JPG, PNG, PDF & SVG)',
    date: 'October 14, 2026',
    isCurrent: true,
    summary: 'Export schema diagrams as HD versions of JPG, PNG, PDF, and SVG with customizable 300 DPI print scaling, academic report headers, live previews, and instant clipboard copying for Computer Science reports.',
    items: [
      {
        type: 'feature',
        typeLabel: 'Academic Export',
        component: 'High-Definition Visual Diagram Exporter',
        headline: 'Multi-Format HD Diagram Downloads (iss-110)',
        details: 'Added visual schema export supporting HD PNG (lossless, 1x/2x/3x scale, up to 600 DPI), HD JPG (optimized for student portal size limits), Vector SVG (infinite scalability with pure XML bezier paths), and Academic PDF (A4/Letter page with print-ready margins).'
      },
      {
        type: 'feature',
        typeLabel: 'Academic Formatter',
        component: 'Thesis & Coursework Metadata Header',
        headline: 'Configurable Academic Report Header Banner',
        details: 'Added customizable academic title banner displaying project name, database dialect, generation timestamp, table/relationship count, and custom course/author note (e.g. CS401 Database Systems - Final Project ERD).'
      },
      {
        type: 'feature',
        typeLabel: 'Productivity',
        component: 'Clipboard & Quick Actions',
        headline: 'One-Click Image Copy to Clipboard & Canvas Toolbar Access',
        details: 'Added Copy Image to Clipboard for instant pasting into Microsoft Word, Google Docs, and Overleaf LaTeX without downloading files, plus quick-download buttons and a dedicated Export Diagram shortcut on the canvas toolbar.'
      }
    ]
  },
  {
    version: 'v1.4.6',
    title: 'Google SSO Popup Concurrency Guard & Error Suppression',
    date: 'October 14, 2026',
    isCurrent: false,
    summary: 'Resolved auth/cancelled-popup-request and premature cloud sync by adding concurrency locking, reactive loading indicators, and graceful suppression of intentional popup cancellations.',
    items: [
      {
        type: 'bugfix',
        typeLabel: 'Auth Concurrency',
        component: 'Google SSO Authentication Flow',
        headline: 'Button Debounce & Concurrency Guard (iss-109)',
        details: 'Added isAuthOperationInProgress lock and state.isLoggingIn across all sign-in triggers (AuthModal, Navbar, LandingPage, AiGenModal, ChangelogPage). Buttons now disable with an animated spinner while the popup is opening, preventing accidental double-clicks from cancelling the auth flow.'
      },
      {
        type: 'bugfix',
        typeLabel: 'Error Resilience',
        component: 'Firebase Auth Error Handler',
        headline: 'Silent Handling of Benign Cancellation Events',
        details: 'Suppressed auth/cancelled-popup-request and auth/popup-closed-by-user from triggering error toast notifications and console errors. Closing or superseding the popup is recognized as standard user navigation rather than an application defect.'
      },
      {
        type: 'bugfix',
        typeLabel: 'Session Handshake',
        component: 'Cloud Firestore Synchronization',
        headline: 'Decoupled Remote Sync from Initial SSO Callback',
        details: 'Removed premature syncActiveProjectToFirestore from loginWithGoogle, delegating cloud project synchronization exclusively to the onAuthStateChanged observer once user credentials and projects are fully resolved.'
      }
    ]
  },
  {
    version: 'v1.4.5',
    title: 'Post-Login Sample Auto-Sync Guard & Cloud Database Isolation',
    date: 'October 14, 2026',
    isCurrent: false,
    summary: 'Prevented Firestore permission-denied error on projects/proj-1 after Google sign in by guarding static sample blueprints from remote sync and auto-forking user mutations into unique cloud projects.',
    items: [
      {
        type: 'bugfix',
        typeLabel: 'Cloud Sync Security',
        component: 'Cloud Firestore Real-Time Sync',
        headline: 'Guarded Static Sample Schemas (proj-1, proj-2) Against Firestore Overwrite',
        details: 'Added isSampleProjectId verification across syncActiveProjectToFirestore, flushActiveProjectSync, and selectProject. Pristine sample templates are preserved locally in browser memory and never written to Firestore under hardcoded sample document IDs.'
      },
      {
        type: 'feature',
        typeLabel: 'Cloud Isolation',
        component: 'Project Ownership & Forking',
        headline: 'Copy-on-Write Auto-Forking for Modified Sample Blueprints',
        details: 'When an authenticated developer edits a sample database schema, the engine automatically forks it into a fresh, unique user-owned project ID (proj-xxx) with valid ownerUid, guaranteeing seamless cloud auto-save without permission rejections.'
      },
      {
        type: 'bugfix',
        typeLabel: 'Session Transition',
        component: 'Workspace State Manager',
        headline: 'Fixed Post-Login Active Project Switching Flush Trigger',
        details: 'Resolved activeProjectId watcher edge case where transitioning from guest sample schema to the user authenticated cloud database inadvertently attempted to flush the prior sample project ID to Firestore.'
      }
    ]
  },
  {
    version: 'v1.4.4',
    title: 'Sign Out Session Integrity, Firestore Guest Guard & Sandbox WebSocket Fixes',
    date: 'October 11, 2026',
    isCurrent: false,
    summary: 'Resolved sign out exception caused by undefined presence tracking cleanup, guarded Firestore writes against guest permission errors, and silenced sandbox iframe Vite HMR WebSocket transport warnings.',
    items: [
      {
        type: 'bugfix',
        typeLabel: 'Core Defect Resolution',
        component: 'Auth & Session Subsystem',
        headline: 'Fixed "stopPresenceTracking is not defined" Exception on Sign Out',
        details: 'Fixed unhandled ReferenceError during user sign out by properly declaring and exporting stopPresenceTracking in schemaStore.js, allowing clean session termination, active room presence unbinding, and instant transition to guest mode without runtime errors.'
      },
      {
        type: 'bugfix',
        typeLabel: 'Cloud Sync Security',
        component: 'Cloud Firestore Real-Time Sync',
        headline: 'Guarded Firestore Auto-Sync Against Guest Permission Rejections',
        details: 'Added guest authentication check in syncActiveProjectToFirestore to safely cache schemas (such as proj-1) to browser localStorage instead of initiating unauthenticated Firestore writes that trigger Missing or insufficient permissions errors.'
      },
      {
        type: 'bugfix',
        typeLabel: 'Development Runtime',
        component: 'Vite / Dev Server',
        headline: 'Disabled Vite HMR WebSocket in Reverse Proxy Sandbox',
        details: 'Configured hmr: false in both server.js and vite.config.ts and added window-level error suppression in index.html to eliminate benign @vite/client WebSocket transport failures in cloud container iframe environments.'
      }
    ]
  },
  {
    version: 'v1.4.3',
    title: 'Sidebar Quick-Filter Ergonomics & Space Optimization',
    date: 'September 25, 2026',
    isCurrent: false,
    summary: 'Refactored the sidebar database quick-filter subsystem to a streamlined, space-efficient micro-pill presentation, recovering over 80% vertical real estate for schema tables.',
    items: [
      {
        type: 'ux',
        typeLabel: 'UI / UX Ergonomics',
        component: 'Sidebar / Filters',
        headline: 'Compact Filter Micro-Pills (<24px Height)',
        details: 'Replaced multi-level filter cards with high-density wrapped micro-pills, retaining high-contrast active states and instant inline reset controls.'
      },
      {
        type: 'bugfix',
        typeLabel: 'Defect Resolution',
        component: 'Sidebar / Search',
        headline: 'Integrated Quick-Clear [X] Action Triggers',
        details: 'Added one-click clear buttons to both Explorer database search and Tables field search inputs, avoiding manual backspacing.'
      },
      {
        type: 'ux',
        typeLabel: 'Usability',
        component: 'Explorer Tree',
        headline: 'Automated Folder Expansion on Filter Click',
        details: 'Selecting a database filter pill automatically expands that target cluster, immediately revealing its constituent schemas and tables.'
      }
    ]
  },
  {
    version: 'v1.4.2',
    title: 'Database Group Drag-and-Drop & Cross-Cluster Schema Migration',
    date: 'September 24, 2026',
    isCurrent: false,
    summary: 'Resolved mouse click lockups on database group headers and delivered complete drag-and-drop support for reordering schemas within and across database groups.',
    items: [
      {
        type: 'bugfix',
        typeLabel: 'Core Bug Fix',
        component: 'Drag & Drop Subsystem',
        headline: 'Resolution of Accidental Drag Initiation on Click',
        details: 'Decoupled draggable attributes from group accordion parent containers into dedicated GripVertical handles with explicit cursor: grab and grabbing styling, resolving accidental dimming lockups.'
      },
      {
        type: 'feature',
        typeLabel: 'Core Feature',
        component: 'Schema Reordering',
        headline: 'In-Folder Schema Reordering with Drop Indicators',
        details: 'Users can drag schema cards above or below peer schemas within the same database group with animated insertion indicator bars.'
      },
      {
        type: 'feature',
        typeLabel: 'Core Feature',
        component: 'Database Hierarchy',
        headline: 'Cross-Database Schema Migration Dragging',
        details: 'Dragging a schema card onto a different database group auto-highlights the target, expands it, and reassigns the schema folderId.'
      },
      {
        type: 'architecture',
        typeLabel: 'Fault Tolerance',
        component: 'Window Event Bus',
        headline: 'Global Escape Key & Mouseup Cleanup Listeners',
        details: 'Ensured unexpected drag interrupts (window blur, ESC key, or out-of-bounds release) reset reactive drag states completely.'
      }
    ]
  },
  {
    version: 'v1.4.1',
    title: 'Sidebar Filter Visibility & Responsive Multi-Row Wrapping',
    date: 'September 24, 2026',
    isCurrent: false,
    summary: 'Eliminated hidden horizontal scrollbars on desktop sidebar filters, allowing instantaneous visibility and clickability across all database clusters.',
    items: [
      {
        type: 'bugfix',
        typeLabel: 'UI Defect Fix',
        component: 'Sidebar',
        headline: 'Replacement of Overflow Scroll with Responsive Wrap',
        details: 'Eliminated hidden horizontal scrollbars (no-scrollbar) that caused 3rd+ database clusters to become inaccessible on non-trackpad mouse setups.'
      },
      {
        type: 'ux',
        typeLabel: 'Visibility',
        component: 'Filters',
        headline: 'Active State Contrast & Schema Counter Badges',
        details: 'Added distinct amber and blue badge states with embedded item counts and clear deselection triggers.'
      }
    ]
  },
  {
    version: 'v1.4.0',
    title: 'Hierarchical Multi-Database Groups & Cluster Management',
    date: 'September 20, 2026',
    isCurrent: false,
    summary: 'Architectural expansion from single-schema lists to multi-database hierarchical groupings with inline renaming and safe deletion safeguards.',
    items: [
      {
        type: 'feature',
        typeLabel: 'Major Feature',
        component: 'Database Hierarchy',
        headline: 'Multi-Database Cluster Organization',
        details: 'Group interconnected schemas under specific databases (e.g. Primary DB, Analytics DB, Identity Cluster).'
      },
      {
        type: 'architecture',
        typeLabel: 'Data Protection',
        component: 'State Engine',
        headline: 'Safe Deletion Schema Fallback Mechanism',
        details: 'Deleting a database cluster reassigns its contained schemas to the default primary cluster rather than destroying project schemas.'
      },
      {
        type: 'ux',
        typeLabel: 'Ergonomics',
        component: 'Sidebar',
        headline: 'Inline Database Renaming with Keyboard Shortcuts',
        details: 'Double-click or menu-trigger inline renaming with Enter (save) and Esc (cancel) support.'
      }
    ]
  },
  {
    version: 'v1.3.0',
    title: 'Bidirectional DBML / Canvas Sync & Relationship Cardinality Engine',
    date: 'September 15, 2026',
    isCurrent: false,
    summary: 'Zero-latency bidirectional synchronization between visual ERD canvas nodes and the CodeMirror DBML syntax editor.',
    items: [
      {
        type: 'feature',
        typeLabel: 'Core Engine',
        component: 'ERD Canvas',
        headline: 'Interactive Foreign Key Cardinality Connectors',
        details: 'Support for 1:1, 1:N, and N:M cardinality connector curves, with mandatory (>) and optional (>? nullable) constraint semantics.'
      },
      {
        type: 'architecture',
        typeLabel: 'Editor Sync',
        component: 'DBML Engine',
        headline: 'Real-Time Bidirectional CodeMirror Sync',
        details: 'Visual canvas changes write clean DBML code, and DBML code changes update table coordinates and schema models without flickering.'
      }
    ]
  },
  {
    version: 'v1.2.0',
    title: 'Cloud Firestore Real-Time Collaboration & Guest State Fallback',
    date: 'September 5, 2026',
    isCurrent: false,
    summary: 'Enterprise cloud sync with multi-user presence indicators alongside offline-first local storage fallback.',
    items: [
      {
        type: 'feature',
        typeLabel: 'Collaboration',
        component: 'Firestore Engine',
        headline: 'Real-Time Multi-User Cursor & Schema Sync',
        details: 'Live collaborator indicators, team permissions (Public, Password, Invite-only), and version snapshots.'
      },
      {
        type: 'architecture',
        typeLabel: 'Persistence',
        component: 'Storage Engine',
        headline: 'Zero-Loss Guest Session Cloud Migration',
        details: 'Guest models persist locally and automatically migrate to Cloud Firestore upon Google SSO authentication.'
      }
    ]
  },
  {
    version: 'v1.1.0',
    title: 'Multi-Dialect SQL DDL Importer & Multi-Format Exporter',
    date: 'August 25, 2026',
    isCurrent: false,
    summary: 'Zero-dependency client-side AST parser for importing SQL DDL from PostgreSQL, MySQL, SQLite, and MS SQL.',
    items: [
      {
        type: 'feature',
        typeLabel: 'Core Feature',
        component: 'SQL Importer',
        headline: 'Multi-Dialect DDL Parsing Engine',
        details: 'Parses complex CREATE TABLE DDL, composite primary keys, check constraints, and foreign key relations.'
      },
      {
        type: 'feature',
        typeLabel: 'Export Suite',
        component: 'Export Subsystem',
        headline: 'Vector SVG, PNG, PDF & Living Data Dictionary',
        details: 'Export full SQL scripts, DBML files, high-res diagrams, and living searchable data dictionary sites.'
      }
    ]
  },
  {
    version: 'v1.0.0',
    title: 'dbmaps General Availability (GA) Platform Launch',
    date: 'August 10, 2026',
    isCurrent: false,
    summary: 'Initial general availability release of the collaborative visual database schema modeler.',
    items: [
      {
        type: 'feature',
        typeLabel: 'Platform Launch',
        component: 'Core Platform',
        headline: 'Visual Canvas & Presto AI Assistant Launch',
        details: 'Infinite pan-zoom canvas, minimap, Presto AI Gemini schema generation, and Community Blueprint Marketplace.'
      }
    ]
  }
]);

// Community Reported Issues & Resolution Queue
const defaultReportedIssues = [
  {
    id: 'iss-109',
    title: 'Google Auth Error: auth/cancelled-popup-request and premature sync on sign-in',
    category: 'bug',
    severity: 'P1_high',
    status: 'Resolved',
    resolvedVersion: 'v1.4.6',
    component: 'Google SSO Authentication Flow',
    description: 'Rapid clicks on Sign In with Google launched concurrent popups causing Firebase auth/cancelled-popup-request. Premature project sync before remote data load caused permission rejections.',
    createdAt: 'Oct 14, 2026',
    votes: 11
  },
  {
    id: 'iss-108',
    title: 'Firestore write error: Missing or insufficient permissions on projects/proj-1 after user login',
    category: 'bug',
    severity: 'P0_blocker',
    status: 'Resolved',
    resolvedVersion: 'v1.4.5',
    component: 'Cloud Firestore Real-Time Sync',
    description: 'When logging in via Google SSO, the active project watcher attempted to sync the prior sample schema proj-1 to Firestore, triggering an unhandled permission error popup.',
    createdAt: 'Oct 14, 2026',
    votes: 14
  },
  {
    id: 'iss-107',
    title: 'Sign Out Error: stopPresenceTracking is not defined during logout',
    category: 'bug',
    severity: 'P0_blocker',
    status: 'Resolved',
    resolvedVersion: 'v1.4.4',
    component: 'Auth & Session Subsystem',
    description: 'Invoking sign out threw a fatal ReferenceError stating stopPresenceTracking was not defined, blocking clean logout and leaving state inconsistently held.',
    createdAt: 'Oct 11, 2026',
    votes: 8
  },
  {
    id: 'iss-106',
    title: 'Firestore write error: Missing or insufficient permissions on projects/proj-1',
    category: 'bug',
    severity: 'P1_high',
    status: 'Resolved',
    resolvedVersion: 'v1.4.4',
    component: 'Cloud Firestore Real-Time Sync',
    description: 'Unauthenticated or guest users attempting schema sync triggered unhandled Firestore security permission rejections instead of caching changes locally in localStorage.',
    createdAt: 'Oct 11, 2026',
    votes: 12
  },
  {
    id: 'iss-105',
    title: 'Uncaught WebSocket connection failure to @vite/client in preview container iframe',
    category: 'bug',
    severity: 'P2_medium',
    status: 'Resolved',
    resolvedVersion: 'v1.4.4',
    component: 'Vite / Dev Server',
    description: 'Vite HMR WebSocket transport repeatedly failed and surfaced errors in the browser console when running behind Google Cloud reverse proxies with disabled HMR.',
    createdAt: 'Oct 11, 2026',
    votes: 5
  },
  {
    id: 'iss-104',
    title: 'Sidebar quick-filter buttons consume excessive vertical real estate',
    category: 'ui_ux',
    severity: 'P2_medium',
    status: 'Resolved',
    resolvedVersion: 'v1.4.3',
    component: 'Sidebar & Filter Navigation',
    description: 'Filter buttons were large and occupied significant space above schema items on small viewports.',
    createdAt: 'Sep 25, 2026',
    votes: 9
  },
  {
    id: 'iss-103',
    title: 'Database group cards lock in dimmed state on single click without dragging',
    category: 'bug',
    severity: 'P1_high',
    status: 'Resolved',
    resolvedVersion: 'v1.4.2',
    component: 'Sidebar & Filter Navigation',
    description: 'Clicking database header to expand/collapse triggered accidental dragstart and left element dimmed.',
    createdAt: 'Sep 24, 2026',
    votes: 14
  },
  {
    id: 'iss-102',
    title: 'Drag and drop schemas between separate database folders',
    category: 'feature',
    severity: 'P2_medium',
    status: 'Resolved',
    resolvedVersion: 'v1.4.2',
    component: 'Sidebar & Filter Navigation',
    description: 'Requested ability to move a schema card into another database cluster via visual drag.',
    createdAt: 'Sep 24, 2026',
    votes: 11
  },
  {
    id: 'iss-101',
    title: 'Quick filter pills in sidebar cut off on desktop displays without horizontal scroll',
    category: 'ui_ux',
    severity: 'P2_medium',
    status: 'Resolved',
    resolvedVersion: 'v1.4.1',
    component: 'Sidebar & Filter Navigation',
    description: 'No-scrollbar container prevented viewing 3rd and 4th database group filters with standard mouse.',
    createdAt: 'Sep 24, 2026',
    votes: 8
  },
  {
    id: 'iss-100',
    title: 'Support for nullable foreign key cardinality operators in DBML export',
    category: 'sql_importer',
    severity: 'P2_medium',
    status: 'Resolved',
    resolvedVersion: 'v1.3.0',
    component: 'DBML CodeMirror Editor',
    description: 'Exported DBML format now correctly parses optional relationships as >? with nullable properties.',
    createdAt: 'Sep 15, 2026',
    votes: 6
  }
];

const communityIssues = ref([]);

const allIssuesList = computed(() => {
  return [...communityIssues.value, ...defaultReportedIssues];
});

// Form state
const issueForm = reactive({
  title: '',
  category: 'bug',
  severity: 'P2_medium',
  component: 'Sidebar & Filter Navigation',
  description: '',
  reproductionSteps: '',
  expectedBehavior: '',
  actualBehavior: ''
});

// Diagnostics
const systemDiagnostics = computed(() => {
  if (typeof window === 'undefined') return { browser: 'Unknown', os: 'Unknown', viewport: '1280x800' };
  const ua = navigator.userAgent;
  let browser = 'Chrome/Chromium';
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Edg')) browser = 'Edge';

  let os = 'Desktop';
  if (ua.includes('Win')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';

  return {
    browser,
    os,
    viewport: `${window.innerWidth}x${window.innerHeight}`
  };
});

// Filter helper
const filteredChangelog = computed(() => {
  let list = changelogReleases.value;
  if (selectedChangeType.value !== 'all') {
    list = list.filter(rel => {
      return rel.items.some(item => item.type === selectedChangeType.value);
    });
  }

  if (!changelogSearchQuery.value.trim()) return list;

  const q = changelogSearchQuery.value.toLowerCase().trim();
  return list.filter(rel => {
    const matchVer = rel.version.toLowerCase().includes(q);
    const matchTitle = rel.title.toLowerCase().includes(q);
    const matchSum = rel.summary.toLowerCase().includes(q);
    const matchItems = rel.items.some(it => {
      return (
        it.headline.toLowerCase().includes(q) ||
        it.details.toLowerCase().includes(q) ||
        it.component.toLowerCase().includes(q)
      );
    });
    return matchVer || matchTitle || matchSum || matchItems;
  });
});

function getChangeTypeCount(typeId) {
  if (typeId === 'all') return changelogReleases.value.length;
  return changelogReleases.value.filter(rel => rel.items.some(i => i.type === typeId)).length;
}

function resetChangelogFilters() {
  changelogSearchQuery.value = '';
  selectedChangeType.value = 'all';
}

// Issue Submission Handler
async function handleSubmitIssue() {
  if (!isAuthenticated.value) {
    addToast({
      title: 'Authentication Required',
      message: 'Only logged-in users can submit issues. Please sign in to continue.',
      type: 'warning'
    });
    state.modals.auth = true;
    return;
  }

  if (!issueForm.title.trim() || !issueForm.description.trim()) {
    addToast({ title: 'Input Required', message: 'Please provide both title and technical description.', type: 'warning' });
    return;
  }

  isSubmitting.value = true;
  const currentUid = auth?.currentUser?.uid || state.currentUser?.id || 'auth-user';
  const currentEmail = (auth?.currentUser?.email || state.currentUser?.email || '').trim();
  const currentName = (auth?.currentUser?.displayName || state.currentUser?.name || 'Developer').trim();
  const currentAvatar = auth?.currentUser?.photoURL || state.currentUser?.avatar || '';

  const newIssue = {
    id: 'iss-' + Date.now().toString().slice(-6),
    title: issueForm.title.trim(),
    category: issueForm.category,
    severity: issueForm.severity,
    status: 'Under Review',
    component: issueForm.component,
    description: issueForm.description.trim(),
    reproductionSteps: issueForm.reproductionSteps.trim(),
    expectedBehavior: issueForm.expectedBehavior.trim(),
    actualBehavior: issueForm.actualBehavior.trim(),
    environment: {
      browser: systemDiagnostics.value.browser,
      os: systemDiagnostics.value.os,
      viewport: systemDiagnostics.value.viewport,
      authStatus: 'Authenticated'
    },
    authorUid: currentUid,
    authorEmail: currentEmail,
    authorName: currentName,
    authorAvatar: currentAvatar,
    isVerifiedAuthor: true,
    votes: 1,
    createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  };

  try {
    // Attempt Firestore persistence
    if (db) {
      const docRef = await addDoc(collection(db, 'issues'), {
        ...newIssue,
        createdTimestamp: new Date().toISOString()
      });
      newIssue.firestoreId = docRef.id;
    }
  } catch (err) {
    console.warn('Firestore issue log fallback:', err);
  }

  // Prepend to local memory and localStorage
  communityIssues.value.unshift(newIssue);
  try {
    const stored = JSON.parse(localStorage.getItem('dbmaps_reported_issues') || '[]');
    stored.unshift(newIssue);
    localStorage.setItem('dbmaps_reported_issues', JSON.stringify(stored));
  } catch (e) {
    // Ignore storage quota
  }

  // Reset Form
  issueForm.title = '';
  issueForm.description = '';
  issueForm.reproductionSteps = '';
  issueForm.expectedBehavior = '';
  issueForm.actualBehavior = '';

  isSubmitting.value = false;
  addToast({
    title: 'Issue Ticket Submitted',
    message: `Thank you, ${currentName.split(' ')[0]}! Your report has been logged to the engineering triage queue.`,
    type: 'success'
  });
}

function upvoteIssue(issueId) {
  const issue = allIssuesList.value.find(i => i.id === issueId);
  if (issue) {
    issue.votes = (issue.votes || 0) + 1;
    addToast({ title: 'Upvoted', message: 'Thank you for prioritizing this issue.', type: 'success' });
  }
}

// Load community issues on mount
onMounted(async () => {
  // Load from localStorage cache first
  try {
    const cached = JSON.parse(localStorage.getItem('dbmaps_reported_issues') || '[]');
    if (Array.isArray(cached) && cached.length > 0) {
      communityIssues.value = cached;
    }
  } catch (e) {}

  // Attempt Firestore fetch
  try {
    if (db) {
      const q = query(collection(db, 'issues'), orderBy('createdTimestamp', 'desc'), limit(15));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const fetched = [];
        snap.forEach(docSnap => {
          fetched.push({ id: docSnap.id, ...docSnap.data() });
        });
        communityIssues.value = fetched;
      }
    }
  } catch (e) {
    // Fallback silent
  }
});
</script>
