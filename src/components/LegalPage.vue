<template>
  <div class="app-page app-reading-page min-h-dvh bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col transition-colors duration-200 selection:bg-blue-500 selection:text-white">
    <!-- Top Navigation Bar -->
    <header class="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90  border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 py-3.5 transition-colors">
      <div class="max-w-6xl mx-auto flex items-center justify-between gap-4">
        <!-- Logo & Brand -->
        <div class="flex items-center gap-3">
          <button
            @click="goToHome"
            class="flex items-center gap-2 font-bold text-blue-600 dark:text-blue-400 text-lg hover:opacity-90 transition cursor-pointer"
            title="Return to dbmaps Home"
          >
            <DbMapLogo class-name="w-8 h-8 drop-shadow-sm" />
            <span class="font-mono tracking-tight text-slate-900 dark:text-slate-100 text-lg">
              db<span class="text-blue-600 dark:text-blue-400">maps</span>
            </span>
          </button>
          <span class="hidden sm:inline-block text-slate-300 dark:text-slate-700">/</span>
          <span class="hidden sm:inline-block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Legal & Compliance
          </span>
        </div>

        <!-- Center Tabs Switcher: Home/Features, Privacy Policy vs Terms of Service -->
        <div class="flex items-center bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200 dark:border-slate-700/80 text-xs">
          <button
            @click="goToHome"
            class="px-3 sm:px-4 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 cursor-pointer text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          >
            <Sparkles class="w-4 h-4 shrink-0 text-blue-500" />
            <span>Home</span>
          </button>
          <button
            @click="switchView('/privacy-policy')"
            class="px-3 sm:px-4 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 cursor-pointer"
            :class="[
              isPrivacyPolicy
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            ]"
          >
            <ShieldCheck class="w-4 h-4 shrink-0" />
            <span>Privacy Policy</span>
          </button>
          <button
            @click="switchView('/terms-of-service')"
            class="px-3 sm:px-4 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 cursor-pointer"
            :class="[
              !isPrivacyPolicy
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            ]"
          >
            <FileText class="w-4 h-4 shrink-0" />
            <span>Terms of Service</span>
          </button>
        </div>

        <!-- Right: Theme Switcher & Back to Studio Button -->
        <div class="flex items-center gap-2.5">
          <button
            @click="toggleDarkMode"
            class="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            :title="state.isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
          >
            <Sun v-if="state.isDarkMode" class="w-4 h-4 text-amber-400" />
            <Moon v-else class="w-4 h-4 text-slate-600" />
          </button>

          <button
            @click="goToStudio"
            class="px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-semibold text-xs transition flex items-center gap-1.5   cursor-pointer"
          >
            <ArrowLeft class="w-3.5 h-3.5" />
            <span class="hidden sm:inline">Back to</span> Studio
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content Area -->
    <main class="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-12">
      <!-- ========================================== -->
      <!-- PRIVACY POLICY VIEW                        -->
      <!-- ========================================== -->
      <article v-if="isPrivacyPolicy" class="space-y-10 animate-in fade-in duration-200">
        <!-- Header Banner -->
        <div class="border-b border-slate-200 dark:border-slate-800 pb-8">

          <h1 class="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-950 dark:text-white">
            Privacy Policy for dbmaps
          </h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-3 leading-relaxed max-w-3xl">
            This Privacy Policy describes how dbmaps ("we", "our", or "the platform") collects, stores, protects, and handles information when you use our database schema designer, visual ERD studio, and SQL/DBML editor.
          </p>
          <div class="flex flex-wrap items-center gap-4 text-xs text-slate-400 dark:text-slate-500 mt-4 font-mono">
            <span>Last Updated: September 2026</span>
            <span>&bull;</span>
            <span>Applies to: dbmaps Studio</span>
            <span>&bull;</span>
            <span>Effective Immediately</span>
          </div>
        </div>

        <section class="space-y-3 text-sm text-slate-600 dark:text-slate-300">
          <h2 class="text-xl font-semibold text-slate-900 dark:text-white">Project data</h2>
          <p>Projects and preferences are stored in this browser. Editing, diagram rendering, and backup import and export run on your device.</p>
          <p>Export a full project backup before clearing browser data or moving to another device.</p>
        </section>

        <!-- Section 6: Contact & Inquiries -->
        <section class="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <h2 class="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Mail class="w-5 h-5 text-blue-500" />
            <span>Contact Information</span>
          </h2>
          <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            If you have questions, privacy requests, or feedback regarding this Privacy Policy, please contact our administrative team:
          </p>
          <div class="p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 inline-flex flex-col sm:flex-row items-start sm:items-center gap-3 text-xs">
            <div>
              <span class="font-bold text-slate-900 dark:text-slate-100">dbmaps Engineering & Legal Support</span>
              <div class="font-mono text-slate-500 dark:text-slate-400 mt-0.5">Email: aungkyawminn.aya@gmail.com</div>
            </div>
            <a
              href="mailto:aungkyawminn.aya@gmail.com?subject=dbmaps%20Privacy%20Inquiry"
              class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
            >
              Send Email
            </a>
          </div>
        </section>
      </article>

      <!-- ========================================== -->
      <!-- TERMS OF SERVICE VIEW                      -->
      <!-- ========================================== -->
      <article v-else class="space-y-10 animate-in fade-in duration-200">
        <!-- Header Banner -->
        <div class="border-b border-slate-200 dark:border-slate-800 pb-8">

          <h1 class="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-950 dark:text-white">
            Terms of Service for dbmaps
          </h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-3 leading-relaxed max-w-3xl">
            Please read these Terms of Service ("Terms") carefully before using dbmaps. By accessing or using the dbmaps application, collaborative features, DBML editor, or API services, you agree to be bound by these terms.
          </p>
          <div class="flex flex-wrap items-center gap-4 text-xs text-slate-400 dark:text-slate-500 mt-4 font-mono">
            <span>Last Updated: September 2026</span>
            <span>&bull;</span>
            <span>Version: 2.1.0</span>
            <span>&bull;</span>
            <span>Standard Developer License</span>
          </div>
        </div>

        <!-- Section 1: Acceptance of Terms -->
        <section class="space-y-4">
          <h2 class="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <span class="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs flex items-center justify-center font-mono font-bold">1</span>
            <span>Acceptance of Terms</span>
          </h2>
          <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            By creating an account, authenticating via Google SSO, sharing a database model link, or operating the visual canvas, you enter into a binding agreement with dbmaps. If you do not agree to all terms stated herein, you must immediately discontinue use of the platform.
          </p>
        </section>

        <!-- Section 2: Platform Description -->
        <section class="space-y-4">
          <h2 class="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <span class="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs flex items-center justify-center font-mono font-bold">2</span>
            <span>Service Description & Use Modes</span>
          </h2>
          <div class="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-3">
            <p>
              dbmaps is a modern, developer-centric database engineering and modeling workspace providing:
            </p>
            <ul class="list-disc list-inside space-y-1.5 pl-2 text-slate-700 dark:text-slate-300 text-xs sm:text-sm">
              <li>Two-way bidirectional synchronization between DBML code and interactive Entity Relationship Diagrams (ERD).</li>
              <li>Multi-dialect SQL DDL generation for PostgreSQL, MySQL, SQLite, and Microsoft SQL Server.</li>
              <li>Data dictionary browsing and Markdown export.</li>
            </ul>
          </div>
        </section>

        <!-- Section 3: Intellectual Property & Ownership -->
        <section class="space-y-4">
          <h2 class="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <span class="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs flex items-center justify-center font-mono font-bold">3</span>
            <span>Your Content & 100% Intellectual Property Rights</span>
          </h2>
          <div class="p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 space-y-2">
            <div class="font-bold text-emerald-900 dark:text-emerald-200 text-sm flex items-center gap-2">
              <CheckCircle2 class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Full Ownership Guarantee</span>
            </div>
            <p class="text-xs sm:text-sm text-emerald-800 dark:text-emerald-300 leading-relaxed">
              <strong>You retain 100% full ownership of all database schemas, table definitions, relationships, business logic, and code you create or import into dbmaps.</strong> dbmaps claims zero intellectual property rights over your designs. You grant dbmaps only the operational license necessary to host, render, sync, and display your schema to you and your designated collaborators.
            </p>
          </div>
        </section>

        <!-- Section 4: Acceptable Use Policy -->
        <section class="space-y-4">
          <h2 class="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <span class="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs flex items-center justify-center font-mono font-bold">4</span>
            <span>Acceptable Use Policy</span>
          </h2>
          <div class="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-3">
            <p>You agree not to misuse or abuse the platform. Prohibited activities include:</p>
            <ul class="list-disc list-inside space-y-1.5 pl-2 text-slate-700 dark:text-slate-300 text-xs sm:text-sm">
              <li>Attempting to access private, password-protected, or restricted schemas belonging to other users without authorization.</li>
              <li>Submitting malicious payloads, SQL injection tests against platform servers, or automated bot scraping.</li>
              <li>Reverse-engineering, decompiling, or exploiting rate limits of the backend API or AI service endpoints.</li>
              <li>Using AI generation features to intentionally generate or transmit illegal, abusive, or violating content.</li>
            </ul>
          </div>
        </section>

        <!-- Section 7: Limitation of Liability -->
        <section class="space-y-4">
          <h2 class="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <span class="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs flex items-center justify-center font-mono font-bold">7</span>
            <span>Warranty Disclaimer & Limitation of Liability</span>
          </h2>
          <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            dbmaps is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind, whether express or implied. To the maximum extent permitted by applicable law, dbmaps, its authors, and contributors shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or business interruption, resulting from the use of or inability to use the platform.
          </p>
        </section>

        <!-- Section 8: Termination & Changes -->
        <section class="space-y-4">
          <h2 class="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <span class="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs flex items-center justify-center font-mono font-bold">8</span>
            <span>Changes to Terms</span>
          </h2>
          <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            We reserve the right to modify these Terms at any time. When updates are published, the "Last Updated" date at the top will reflect the revision. Continued use of dbmaps after changes are posted constitutes acceptance of the modified Terms.
          </p>
        </section>

        <!-- Section 9: Governing Law & Inquiries -->
        <section class="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <h2 class="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Mail class="w-5 h-5 text-blue-500" />
            <span>Questions & Notices</span>
          </h2>
          <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            For contractual questions, corporate licensing, or notifications under these Terms, please contact:
          </p>
          <div class="p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 inline-flex flex-col sm:flex-row items-start sm:items-center gap-3 text-xs">
            <div>
              <span class="font-bold text-slate-900 dark:text-slate-100">dbmaps Legal & Operations</span>
              <div class="font-mono text-slate-500 dark:text-slate-400 mt-0.5">Email: aungkyawminn.aya@gmail.com</div>
            </div>
            <a
              href="mailto:aungkyawminn.aya@gmail.com?subject=dbmaps%20Terms%20Inquiry"
              class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
            >
              Send Notice
            </a>
          </div>
        </section>
      </article>

      <!-- Bottom Action Banner: Return to Studio -->
      <div class="mt-14 p-6 rounded-3xl    text-white flex flex-col sm:flex-row items-center justify-between gap-4  bg-blue-700">
        <div>
          <h3 class="text-lg font-bold">Ready to design your database?</h3>
          <p class="text-xs text-blue-200 mt-1">
            Build clean ERD models, write DBML, and generate production-ready SQL scripts.
          </p>
        </div>
        <button
          @click="goToStudio"
          class="px-5 py-2.5 bg-white text-blue-950 hover:bg-blue-50 rounded-xl font-bold text-xs transition flex items-center gap-2  shrink-0 cursor-pointer"
        >
          <span>Launch dbmaps Studio</span>
          <ArrowRight class="w-4 h-4" />
        </button>
      </div>
    </main>

    <!-- Footer -->
    <footer class="border-t border-slate-200 dark:border-slate-800 py-6 px-4 sm:px-8 bg-white dark:bg-slate-900 text-xs text-slate-500 dark:text-slate-400 transition-colors">
      <div class="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <DbMapLogo class-name="w-5 h-5" />
          <span class="font-semibold text-slate-800 dark:text-slate-200">dbmaps</span>
          <span>&bull; Collaborative Database Schema Designer</span>
        </div>

        <div class="flex items-center gap-4 text-xs">
          <button
            @click="goToHome"
            class="hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
          >
            Home
          </button>
          <span>&bull;</span>
          <button
            @click="switchView('/privacy-policy')"
            class="hover:text-blue-600 dark:hover:text-blue-400 transition underline cursor-pointer"
            :class="{ 'font-bold text-blue-600 dark:text-blue-400': isPrivacyPolicy }"
          >
            Privacy Policy
          </button>
          <span>&bull;</span>
          <button
            @click="switchView('/terms-of-service')"
            class="hover:text-blue-600 dark:hover:text-blue-400 transition underline cursor-pointer"
            :class="{ 'font-bold text-blue-600 dark:text-blue-400': !isPrivacyPolicy }"
          >
            Terms of Service
          </button>
          <span>&bull;</span>
          <button
            @click="goToStudio"
            class="hover:text-blue-600 dark:hover:text-blue-400 font-semibold text-blue-600 dark:text-blue-400 transition cursor-pointer"
          >
            Launch Studio
          </button>
        </div>

        <div>
          &copy; 2026 dbmaps. All rights reserved.
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { state, navigateTo, toggleDarkMode } from '../stores/schemaStore.js';
import DbMapLogo from './DbMapLogo.vue';
import {
  ShieldCheck,
  FileText,
  ArrowLeft,
  ArrowRight,
  Sun,
  Moon,
  Database,
  UserCheck,
  CreditCard,
  Sparkles,
  CheckCircle2,
  Mail
} from 'lucide-vue-next';

const isPrivacyPolicy = computed(() => {
  return state.currentRoute === '/privacy-policy';
});

function switchView(path) {
  navigateTo(path);
}

function goToHome() {
  navigateTo('/');
}

function goToStudio() {
  navigateTo('/app');
}
</script>
