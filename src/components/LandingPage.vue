<template>
  <div
    class="home-page min-h-dvh bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white transition-colors duration-200"
  >
    <!-- Header and existing account controls -->
    <header
      class="sticky top-0 z-40 bg-white dark:bg-slate-900 px-4 sm:px-8 py-3 transition-colors"
    >
      <div class="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <!-- Brand Logo -->
        <div class="flex items-center gap-3">
          <button
            @click="scrollToTop"
            class="flex items-center gap-2.5 font-bold text-blue-600 dark:text-blue-400 text-lg hover:opacity-90 transition cursor-pointer"
            title="dbmaps - Home"
          >
            <DbMapLogo class-name="w-8 h-8 " />
            <span
              class="tracking-tight text-slate-900 dark:text-slate-100 text-xl font-extrabold"
            >
              db<span class="text-blue-600 dark:text-blue-400">maps</span>
            </span>
          </button>
        </div>

        <!-- Center Nav Anchor Links (Desktop) -->
        <nav
          class="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-600 dark:text-slate-400"
        >
          <a
            href="#core-features"
            class="hover:text-blue-600 dark:hover:text-blue-400 transition"
            >Core Features</a
          >
          <a
            href="#interactive-showcase"
            class="hover:text-blue-600 dark:hover:text-blue-400 transition"
            >Showcase</a
          >
          <a
            href="#dialects"
            class="hover:text-blue-600 dark:hover:text-blue-400 transition"
            >SQL Dialects</a
          >
          <a
            href="#collaboration"
            class="hover:text-blue-600 dark:hover:text-blue-400 transition"
            >Collaboration</a
          >
          <button
            @click="goToMarketplace"
            class="hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer font-medium flex items-center gap-1"
          >
            <span>Marketplace</span>
          </button>
          <button
            @click="goToChangelog"
            class="hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer font-medium flex items-center gap-1"
          >
            <span>Changelog</span>
            <span
              class="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300"
              >v1.4</span
            >
          </button>
          <button
            @click="goToLearnDbml"
            class="hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer font-medium"
          >
            Learn DBML
          </button>
          <a
            href="#faq"
            class="hover:text-blue-600 dark:hover:text-blue-400 transition"
            >FAQ</a
          >
        </nav>

        <!-- Right Side: Dark Mode Toggle & Main Studio CTA -->
        <div class="flex items-center gap-2.5 sm:gap-3">
          <button
            @click="toggleDarkMode"
            class="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            :title="
              state.isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'
            "
          >
            <Sun v-if="state.isDarkMode" class="w-4 h-4 text-amber-400" />
            <Moon v-else class="w-4 h-4 text-slate-600" />
          </button>

          <!-- Sign In CTA button (when in Guest mode) -->
          <button
            v-if="!state.currentUser.isLoggedIn"
            @click="state.modals.auth = true"
            class="px-2.5 sm:px-3 py-1.5 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 font-semibold text-xs transition cursor-pointer border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
            title="Sign in with Google"
          >
            <LogIn class="w-3.5 h-3.5 text-blue-500" />
            <span class="hidden sm:inline">Sign In</span>
          </button>

          <!-- User Profile Icon with Dropdown Menu -->
          <div class="relative" ref="profileDropdownRef" data-ui>
            <button
              @click="toggleProfileMenu"
              :aria-expanded="isProfileMenuOpen"
              aria-label="Account menu"
              class="flex items-center justify-center p-0.5 rounded-full border-2 transition shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              :class="[
                isProfileMenuOpen
                  ? 'border-blue-600 dark:border-blue-400 ring-2 ring-blue-500/30'
                  : 'border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500',
              ]"
              :title="
                state.currentUser.isLoggedIn
                  ? `${state.currentUser.name} (${state.currentUser.email})`
                  : 'User Profile & Settings (Guest Mode)'
              "
            >
              <UserAvatar
                :avatar="state.currentUser.avatar || state.currentUser.photoURL"
                :name="state.currentUser.name"
                :is-logged-in="state.currentUser.isLoggedIn"
                size="md"
                :show-status="true"
                :status-color="
                  state.currentUser.isLoggedIn ? '#10b981' : '#94a3b8'
                "
                :status-title="
                  state.currentUser.isLoggedIn
                    ? 'Google SSO Authenticated'
                    : 'Guest Mode'
                "
              />
            </button>

            <!-- Profile & Settings Dropdown Panel -->
            <transition
              enter-active-class="transition duration-150 ease-out"
              enter-from-class="transform scale-95 opacity-0 -translate-y-1"
              enter-to-class="transform scale-100 opacity-100 translate-y-0"
              leave-active-class="transition duration-100 ease-out"
              leave-from-class="transform scale-100 opacity-100 translate-y-0"
              leave-to-class="transform scale-95 opacity-0 -translate-y-1"
            >
              <div
                v-if="isProfileMenuOpen"
                class="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden z-50 text-slate-800 dark:text-slate-100"
              >
                <!-- Top Identity Card: Avatar, Name, Email, Status -->
                <div
                  class="p-4 bg-slate-50 dark:bg-slate-900/80 border-slate-200 dark:border-slate-700/80"
                >
                  <div class="flex items-center gap-3">
                    <UserAvatar
                      :avatar="
                        state.currentUser.avatar || state.currentUser.photoURL
                      "
                      :name="state.currentUser.name"
                      :is-logged-in="state.currentUser.isLoggedIn"
                      size="lg"
                      :show-status="true"
                      :status-color="
                        state.currentUser.isLoggedIn ? '#10b981' : '#94a3b8'
                      "
                      class="border-2 border-blue-500 shrink-0"
                    />

                    <div class="min-w-0 flex-1">
                      <div
                        class="font-bold text-sm text-slate-900 dark:text-slate-100 truncate"
                      >
                        {{ state.currentUser.name || "Guest Developer" }}
                      </div>
                      <div
                        class="text-xs text-slate-500 dark:text-slate-400 truncate"
                      >
                        {{ state.currentUser.email || "guest@dbmaps.io" }}
                      </div>
                      <div class="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <span
                          class="px-2 py-0.5 rounded text-[10px] font-bold"
                          :class="
                            state.currentUser.isLoggedIn
                              ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          "
                        >
                          {{
                            state.currentUser.isLoggedIn
                              ? "Google SSO"
                              : "Guest Mode"
                          }}
                        </span>
                        <span
                          class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"
                          :class="
                            state.userProfile.tier === 'pro'
                              ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300'
                              : 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300'
                          "
                        >
                          <Crown
                            v-if="state.userProfile.tier === 'pro'"
                            class="w-2.5 h-2.5 fill-amber-500 text-amber-500"
                          />
                          <Zap v-else class="w-2.5 h-2.5 text-blue-500" />
                          {{ state.userProfile.tier || "free" }} Plan
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Settings & Quick Actions List -->
                <div class="p-2 space-y-0.5 text-xs">
                  <!-- Free AI Credits Left Display -->
                  <div
                    v-if="!isUpgradeCreditsEnabled"
                    class="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-slate-700 dark:text-slate-200 mb-1"
                  >
                    <div class="flex items-center gap-2.5">
                      <div
                        class="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400"
                      >
                        <Zap class="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div class="font-semibold text-xs">
                          Free Credits Left
                        </div>
                        <div class="text-[11px] text-slate-400">
                          For AI schema generation
                        </div>
                      </div>
                    </div>
                    <span
                      class="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full"
                    >
                      {{
                        (
                          state.userProfile.creditsRemaining || 0
                        ).toLocaleString()
                      }}
                    </span>
                  </div>

                  <!-- AI Credits & Billing (When Upgrade is enabled) -->
                  <button
                    v-else
                    @click="openModal('billing')"
                    class="w-full px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/60 text-left transition flex items-center justify-between text-slate-700 dark:text-slate-200 group cursor-pointer"
                  >
                    <div class="flex items-center gap-2.5">
                      <div
                        class="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400"
                      >
                        <Zap class="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div class="font-semibold">
                          AI Credits & Subscription
                        </div>
                        <div class="text-[11px] text-slate-400">
                          Upgrade tier & view limits
                        </div>
                      </div>
                    </div>
                    <span
                      class="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full"
                    >
                      {{
                        (
                          state.userProfile.creditsRemaining || 0
                        ).toLocaleString()
                      }}
                    </span>
                  </button>

                  <!-- Account & Google SSO Settings -->
                  <button
                    @click="openModal('auth')"
                    class="w-full px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/60 text-left transition flex items-center justify-between text-slate-700 dark:text-slate-200 group cursor-pointer"
                  >
                    <div class="flex items-center gap-2.5">
                      <div
                        class="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400"
                      >
                        <ShieldCheck class="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div class="font-semibold">
                          Account & Identity Settings
                        </div>
                        <div class="text-[11px] text-slate-400">
                          Manage profile & Google SSO sync
                        </div>
                      </div>
                    </div>
                    <ChevronRight
                      class="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform"
                    />
                  </button>

                  <!-- Admin Dashboard (Conditional) -->
                  <button
                    v-if="
                      state.userProfile.role === 'admin' ||
                      state.currentUser.email === 'aungkyawminn.aya@gmail.com'
                    "
                    @click="navigateToAdmin"
                    class="w-full px-3 py-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/50 text-left transition flex items-center justify-between text-blue-700 dark:text-blue-300 group cursor-pointer"
                  >
                    <div class="flex items-center gap-2.5">
                      <div
                        class="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400"
                      >
                        <Crown class="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div class="font-semibold">Admin Dashboard</div>
                        <div class="text-[11px] text-blue-500/80">
                          Manage AI models, credits & payments
                        </div>
                      </div>
                    </div>
                    <ChevronRight
                      class="w-3.5 h-3.5 text-blue-400 group-hover:translate-x-0.5 transition-transform"
                    />
                  </button>
                </div>

                <!-- Footer: Sign In or Sign Out -->
                <div
                  class="p-3 bg-slate-50 dark:bg-slate-900/80 border-slate-200 dark:border-slate-700/80"
                >
                  <button
                    v-if="state.currentUser.isLoggedIn"
                    @click="handleLogout"
                    class="w-full py-2 px-3 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/60 dark:hover:bg-red-900/80 text-red-600 dark:text-red-300 font-medium text-xs transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <LogOut class="w-3.5 h-3.5" />
                    <span>Sign Out of Google SSO</span>
                  </button>
                  <button
                    v-else
                    @click="handleLogin"
                    :disabled="state.isLoggingIn"
                    class="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium text-xs transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <LogIn
                      v-if="!state.isLoggingIn"
                      class="w-3.5 h-3.5 shrink-0"
                    />
                    <div
                      v-else
                      class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0"
                    ></div>
                    <span>{{
                      state.isLoggingIn
                        ? "Connecting..."
                        : "Sign In with Google SSO"
                    }}</span>
                  </button>
                </div>
              </div>
            </transition>
          </div>

          <button
            @click="goToStudio"
            class="home-header-launch px-4 sm:px-5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-2 hover:shadow-blue-500/20 cursor-pointer"
          >
            <span>Open studio</span>
            <ArrowRight class="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content Stream -->
    <main class="home-main">
      <section class="home-hero">
        <h1>Map your database.<br />Make the connections.</h1>
        <div class="hero-intro">
          <p>
            Design your schema in DBML. See every relationship on a canvas.
            Export the SQL when it’s ready.
          </p>
          <button class="home-primary" @click="goToStudio">
            Open studio <ArrowRight :size="18" />
          </button>
        </div>
      </section>

      <section
        id="interactive-showcase"
        class="home-demo"
        data-ui
        aria-label="Interactive schema preview"
      >
        <div class="demo-toolbar">
          <span class="demo-name"><Database :size="16" /> Schema preview</span
          ><label class="demo-select"
            >Example
            <select v-model="previewIndex">
              <option
                v-for="(sample, index) in SAMPLE_PROJECTS"
                :key="sample.id"
                :value="index"
              >
                {{ sample.name }}
              </option>
            </select></label
          >
        </div>
        <div class="demo-workspace">
          <div class="demo-code">
            <div class="pane-heading">schema.dbml <span>DBML</span></div>
            <pre><code>{{ previewCode }}</code></pre>
          </div>
          <div class="demo-canvas">
            <div class="pane-heading">
              Relationships
              <span
                >{{ previewSchema.tables.length }} tables ·
                {{ previewSchema.relationships.length }} references</span
              >
            </div>
            <div class="preview-tables">
              <article
                v-for="table in previewSchema.tables"
                :key="table.name"
                class="preview-table"
              >
                <h3>{{ table.name }}</h3>
                <div
                  v-for="column in table.columns"
                  :key="column.name"
                  class="preview-column"
                >
                  <span
                    ><span class="key-mark">{{
                      column.isPk ? "PK" : column.isFk ? "FK" : ""
                    }}</span
                    >{{ column.name }}</span
                  ><code>{{ column.type }}</code>
                </div>
              </article>
            </div>
            <div class="preview-references">
              <div v-for="rel in previewSchema.relationships" :key="rel.id">
                {{ rel.fromTable }}.{{ rel.fromColumn }} <span>→</span>
                {{ rel.toTable }}.{{ rel.toColumn }}
              </div>
            </div>
          </div>
        </div>
        <div class="demo-footer">
          <span>Explore a sample here. Your projects stay untouched.</span
          ><button @click="goToStudio">
            Start designing <ArrowRight :size="15" />
          </button>
        </div>
      </section>

      <section id="core-features" class="home-capabilities">
        <h2>See the whole picture.</h2>
        <div class="capability-list">
          <article>
            <h3>Write it. See it.</h3>
            <p>
              Work in the DBML editor or arrange tables on the canvas. Your code
              and diagram stay in sync.
            </p>
            <button
              @click="
                state.viewMode = 'split';
                goToStudio();
              "
            >
              Open the split editor
            </button>
          </article>
          <article>
            <h3>Bring your SQL.</h3>
            <p>
              Import an existing schema, refine the relationships, then export
              SQL, DBML, SVG, PNG, or PDF.
            </p>
            <div class="feature-fragment" data-ui>
              <div class="pane-heading">PostgreSQL export</div>
              <pre><code>{{ previewSql }}</code></pre>
            </div>
            <button @click="goToLearnDbml">Read the DBML guide</button>
          </article>
          <article id="collaboration">
            <h3>Give your team the map.</h3>
            <p>
              Share your design with access controls, track versions, and
              publish a searchable data dictionary.
            </p>
            <div class="feature-fragment" data-ui>
              <div class="pane-heading">
                {{ previewSchema.tables[0].name }} <span>Data dictionary</span>
              </div>
              <dl class="dictionary-preview">
                <template
                  v-for="column in previewSchema.tables[0].columns"
                  :key="column.name"
                  ><dt>{{ column.name }}</dt>
                  <dd>{{ column.note || column.type }}</dd></template
                >
              </dl>
            </div>
            <button
              @click="
                state.modals.docs = true;
                goToStudio();
              "
            >
              Explore the dictionary
            </button>
          </article>
          <article>
            <h3>Start with an idea.</h3>
            <p>
              Describe your domain to Presto AI, or find a starting schema in
              the community marketplace.
            </p>
            <div class="feature-fragment template-preview" data-ui>
              <div class="pane-heading">
                Sample schemas
                <span>{{ SAMPLE_PROJECTS.length }} examples</span>
              </div>
              <button
                v-for="(sample, index) in SAMPLE_PROJECTS"
                :key="sample.id"
                @click="
                  previewIndex = index;
                  scrollToPreview();
                "
              >
                <span class="template-info"
                  ><strong>{{ sample.name }}</strong
                  ><small>{{ sample.description }}</small></span
                ><span>{{ sample.tables.length }} tables</span>
              </button>
            </div>
            <div class="capability-actions">
              <button @click="openAiGenAndLaunch">Open Presto AI</button
              ><button @click="goToMarketplace">Browse templates</button>
            </div>
          </article>
        </div>
      </section>

      <section id="dialects" class="home-dialects">
        <h2>Your database.<br />Your dialect.</h2>
        <div class="dialect-list">
          <button
            v-for="engine in supportedEngines"
            :key="engine.id"
            @click="launchWithDialect(engine.id, engine.sample)"
          >
            <span>{{ engine.name }}</span>
          </button>
        </div>
      </section>

      <section id="faq" class="home-faq">
        <h2>Before you begin.</h2>
        <div>
          <details v-for="faq in faqs" :key="faq.question">
            <summary>{{ faq.question }}</summary>
            <p>{{ faq.answer }}</p>
          </details>
        </div>
      </section>
    </main>
    <footer class="home-footer">
      <div>
        <span class="footer-wordmark">dbmaps</span>
        <p>A clearer picture of your data.</p>
      </div>
      <nav aria-label="Footer">
        <button @click="goToChangelog">Changelog</button
        ><button @click="goToLearnDbml">Learn DBML</button
        ><button @click="goToLegal('/privacy-policy')">Privacy</button
        ><button @click="goToLegal('/terms-of-service')">Terms</button>
      </nav>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import {
  state,
  activeProject,
  navigateTo,
  toggleDarkMode,
  openPrestoAiWithAuthCheck,
  loginWithGoogle,
  logoutUser,
  isUpgradeCreditsEnabled,
} from "../stores/schemaStore.js";
import { SAMPLE_PROJECTS } from "../utils/sampleSchemas.js";
import { generateDBML, parseDBML, exportToSQL } from "../utils/dbmlParser.js";
import DbMapLogo from "./DbMapLogo.vue";
import UserAvatar from "./UserAvatar.vue";
import {
  Database,
  ArrowRight,
  Sun,
  Moon,
  LogIn,
  LogOut,
  Crown,
  Zap,
  ChevronRight,
  ShieldCheck,
} from "lucide-vue-next";

const previewIndex = ref(0);
const previewCode = computed(() => {
  const sample = SAMPLE_PROJECTS[previewIndex.value];
  return generateDBML(sample.tables, sample.relationships, sample.name);
});
const previewSql = computed(() =>
  exportToSQL(
    previewSchema.value.tables,
    previewSchema.value.relationships,
    "postgres",
  ),
);
const previewSchema = computed(() => parseDBML(previewCode.value));

const isProfileMenuOpen = ref(false);
const profileDropdownRef = ref(null);

function toggleProfileMenu() {
  isProfileMenuOpen.value = !isProfileMenuOpen.value;
}

function openModal(modalKey) {
  isProfileMenuOpen.value = false;
  if (modalKey === "adminDashboard") {
    navigateTo("/admin");
    return;
  }
  state.modals[modalKey] = true;
}

function navigateToAdmin() {
  isProfileMenuOpen.value = false;
  navigateTo("/admin");
}

function handleLogin() {
  if (state.isLoggingIn) return;
  isProfileMenuOpen.value = false;
  loginWithGoogle();
}

function handleLogout() {
  isProfileMenuOpen.value = false;
  logoutUser();
}

function handleGlobalClick(e) {
  if (
    profileDropdownRef.value &&
    !profileDropdownRef.value.contains(e.target)
  ) {
    isProfileMenuOpen.value = false;
  }
}

onMounted(() => {
  if (typeof document !== "undefined") {
    document.addEventListener("click", handleGlobalClick);
  }
});

onUnmounted(() => {
  if (typeof document !== "undefined") {
    document.removeEventListener("click", handleGlobalClick);
  }
});

function scrollToPreview() {
  document.getElementById("interactive-showcase")?.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "instant"
      : "smooth",
  });
}

function scrollToTop() {
  if (typeof window !== "undefined") {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

function goToStudio() {
  navigateTo("/app");
}

function goToMarketplace() {
  navigateTo("/marketplace");
}

function goToChangelog() {
  navigateTo("/changelog");
}

function goToLearnDbml() {
  navigateTo("/learn-dbml");
}

function goToLegal(path) {
  navigateTo(path);
}

function openAiGenAndLaunch() {
  const launched = openPrestoAiWithAuthCheck();
  if (launched) {
    navigateTo("/app");
  }
}

// Supported Database Dialects & Authentic Brand Icons
const supportedEngines = [
  {
    id: "postgresql",
    name: "PostgreSQL",
    icon: "/icons/postgresql.svg",
    sample: "ecommerce",
  },
  {
    id: "mysql",
    name: "MySQL",
    icon: "/icons/mysql.svg",
    sample: "social",
  },
  {
    id: "sqlite",
    name: "SQLite",
    icon: "/icons/sqlite.svg",
    sample: "blog",
  },
  {
    id: "mssql",
    name: "SQL Server",
    icon: "/icons/mssql.svg",
    sample: "ecommerce",
  },
  {
    id: "mariadb",
    name: "MariaDB",
    icon: "/icons/mariadb.svg",
    sample: "social",
  },
  {
    id: "dbml",
    name: "DBML v2",
    icon: "/icons/dbml.svg",
    sample: "blog",
  },
];

function launchWithDialect(dialectId, sampleKey) {
  try {
    if (activeProject.value) {
      if (dialectId === "mssql") {
        activeProject.value.dialect = "mssql";
      } else if (dialectId === "mariadb") {
        activeProject.value.dialect = "mysql";
      } else if (dialectId === "dbml") {
        activeProject.value.dialect = "postgres";
      } else {
        activeProject.value.dialect = dialectId;
      }
    }
  } catch (e) {
    console.warn("Dialect switch error:", e);
  }
  goToStudio();
}

// FAQ Items with Accordion State
const faqs = ref([
  {
    question: "Is dbmaps free to use?",
    answer:
      "Yes! dbmaps is free to use directly in your browser with zero installation. You can create unlimited tables, export SQL DDL, visualize diagrams, and use generous free monthly AI credits for Presto schema generation.",
    open: true,
  },
  {
    question: "Which database dialects and SQL engines are supported?",
    answer:
      "dbmaps natively supports PostgreSQL, MySQL, SQLite, and Microsoft SQL Server, in addition to the DBML standard. You can import existing DDL scripts, edit visually, and export formatted SQL for any of these engines with one click.",
    open: false,
  },
  {
    question: "How does real-time collaboration work?",
    answer:
      "dbmaps connects to Google Cloud Firestore to provide real-time multi-user editing. When multiple teammates open a shared schema, changes to tables, columns, and relationships update instantly across all active screens with collaborator presence indicators.",
    open: false,
  },
  {
    question: "Does dbmaps connect to or store my production database data?",
    answer:
      "No. dbmaps is strictly a schema modeling and design tool. It never connects to your private database servers or accesses actual production data rows. All models represent schema definitions (tables, columns, types, constraints), ensuring 100% data privacy.",
    open: false,
  },
  {
    question: "Can I export my schemas as diagrams or images?",
    answer:
      "Yes! You can export your ERD diagrams as high-resolution PNG images, vector SVG files for documentation, or printable PDF architecture reports, as well as raw SQL migration scripts and DBML code.",
    open: false,
  },
  {
    question: "What is DBML and why does dbmaps use it?",
    answer:
      "DBML (Database Markup Language) is an open-source schema standard originally invented and open-sourced by Holistics (the creators of dbdiagram.io and dbdocs.io). dbmaps implements an in-house, zero-dependency lightweight client-side DBML engine that enables real-time bidirectional visual diagram synchronization without heavy compiler bloat.",
    open: false,
  },
]);
</script>
