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
            This Privacy Policy describes how dbmaps ("we", "our", or "the platform") collects, stores, protects, and handles information when you use our collaborative database schema designer, visual ERD diagramming studio, SQL/DBML editor, and AI modeling services.
          </p>
          <div class="flex flex-wrap items-center gap-4 text-xs text-slate-400 dark:text-slate-500 mt-4 font-mono">
            <span>Last Updated: September 2026</span>
            <span>&bull;</span>
            <span>Applies to: dbmaps Studio & API</span>
            <span>&bull;</span>
            <span>Effective Immediately</span>
          </div>
        </div>

        <!-- Quick Summary Box -->
        <div class="p-5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 space-y-3">
          <div class="flex items-center gap-2 font-bold text-sm text-blue-950 dark:text-blue-200">
            <CheckCircle2 class="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Summary: What You Need to Know</span>
          </div>
          <ul class="text-xs text-slate-700 dark:text-slate-300 space-y-2 leading-relaxed">
            <li class="flex items-start gap-2">
              <span class="text-blue-600 dark:text-blue-400 font-bold">&bull;</span>
              <span><strong>You Own Your Schemas:</strong> You retain 100% intellectual property ownership of all database structures, tables, relationships, and queries designed inside dbmaps.</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-blue-600 dark:text-blue-400 font-bold">&bull;</span>
              <span><strong>Google SSO Minimal Data:</strong> When logging in via Google SSO, we only store your email address, display name, avatar photo, and Firebase user ID. We never see or store your Google password.</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-blue-600 dark:text-blue-400 font-bold">&bull;</span>
              <span><strong>No Selling of Data:</strong> We never sell, rent, or monetize your schema architectures, personal information, or AI prompts to third parties or advertising networks.</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-blue-600 dark:text-blue-400 font-bold">&bull;</span>
              <span><strong>Full Export Freedom:</strong> You can export your schemas to SQL DDL (Postgres, MySQL, SQLite, MSSQL), DBML, PDF, PNG, SVG, or JSON anytime without lock-in.</span>
            </li>
          </ul>
        </div>

        <!-- Section 1: Information We Collect -->
        <section class="space-y-4">
          <h2 class="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <span class="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs flex items-center justify-center font-mono font-bold">1</span>
            <span>Information We Collect</span>
          </h2>
          <div class="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-3">
            <p>
              We collect information to provide and enhance dbmaps' database modeling features:
            </p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <h3 class="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm flex items-center gap-2">
                  <UserCheck class="w-4 h-4 text-blue-500" />
                  <span>Account & Authentication Data</span>
                </h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  When you sign in using Google Single Sign-On (SSO) via Firebase Authentication, we store your email address, display name, profile avatar photo URL, and internal Firebase UID to associate your saved schemas and credit balance with your identity.
                </p>
              </div>

              <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <h3 class="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm flex items-center gap-2">
                  <Database class="w-4 h-4 text-blue-500" />
                  <span>Schema Designs & Workspace Content</span>
                </h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  The projects, database tables, column names, data types, primary and foreign key references, indexes, notes, folder classifications, and checkpoint commit history you construct inside dbmaps.
                </p>
              </div>

              <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <h3 class="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm flex items-center gap-2">
                  <Sparkles class="w-4 h-4 text-amber-500" />
                  <span>AI Prompt Submissions</span>
                </h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Natural language database descriptions and prompt modifications entered into the Presto AI assistant (powered by Google Gemini API) to generate and optimize database architectures.
                </p>
              </div>

              <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <h3 class="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm flex items-center gap-2">
                  <CreditCard class="w-4 h-4 text-emerald-500" />
                  <span>Billing & Transaction Tokens</span>
                </h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  If you purchase additional AI credits or Pro subscriptions, payment transactions are fulfilled via our merchant partner TallySale. dbmaps only stores invoice IDs, order numbers, and fulfillment status; we never process or store raw payment card credentials.
                </p>
              </div>
            </div>
          </div>
        </section>

        <!-- Section 2: How We Use Your Information -->
        <section class="space-y-4">
          <h2 class="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <span class="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs flex items-center justify-center font-mono font-bold">2</span>
            <span>How We Use Your Information</span>
          </h2>
          <div class="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-3">
            <p>Your information is processed strictly for the following functional purposes:</p>
            <ul class="list-disc list-inside space-y-1.5 pl-2 text-slate-700 dark:text-slate-300 text-xs sm:text-sm">
              <li><strong>Real-Time Cloud Synchronization:</strong> Persisting your database models across browser sessions and rendering live multi-user collaboration cursors and edits.</li>
              <li><strong>Code & DDL Export Generation:</strong> Translating your visual ERD schema into executable SQL DDL for PostgreSQL, MySQL, SQLite, MSSQL, or DBML formats.</li>
              <li><strong>AI Schema Generation:</strong> Processing your schema prompts via the server-side Google Gemini API to return structured DBML tables and relationship definitions.</li>
              <li><strong>Quota & Tier Management:</strong> Tracking your monthly AI credit usage, prompt character limits, and subscription tier allowances (Free vs. Pro).</li>
              <li><strong>Security & Access Control:</strong> Enforcing project sharing permissions (public open, password-protected, or restricted to team members).</li>
            </ul>
          </div>
        </section>

        <!-- Section 3: Third-Party Subprocessors -->
        <section class="space-y-4">
          <h2 class="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <span class="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs flex items-center justify-center font-mono font-bold">3</span>
            <span>Third-Party Subprocessors & Services</span>
          </h2>
          <div class="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-3">
            <p>dbmaps integrates trusted enterprise cloud infrastructure to provide secure hosting, database services, and AI:</p>
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <thead class="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold">
                  <tr>
                    <th class="p-3">Partner / Provider</th>
                    <th class="p-3">Purpose in dbmaps</th>
                    <th class="p-3">Data Handled</th>
                    <th class="p-3">Location / Standard</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  <tr>
                    <td class="p-3 font-semibold text-slate-900 dark:text-slate-100">Google Cloud / Firebase</td>
                    <td class="p-3">Cloud Firestore database, Authentication (Google SSO), container hosting</td>
                    <td class="p-3 text-slate-500 dark:text-slate-400">User account profile, saved schemas, version history</td>
                    <td class="p-3">SOC 1/2/3, ISO 27001, GDPR compliant</td>
                  </tr>
                  <tr>
                    <td class="p-3 font-semibold text-slate-900 dark:text-slate-100">Google Gemini AI</td>
                    <td class="p-3">Natural language AI schema generation (Presto assistant)</td>
                    <td class="p-3 text-slate-500 dark:text-slate-400">Natural language schema prompts and DBML schema outputs</td>
                    <td class="p-3">Enterprise AI terms (Data not used to train foundation models)</td>
                  </tr>
                  <tr>
                    <td class="p-3 font-semibold text-slate-900 dark:text-slate-100">TallySale</td>
                    <td class="p-3">Payment processing for Pro tier upgrades and credit packs</td>
                    <td class="p-3 text-slate-500 dark:text-slate-400">Order invoice reference, payment confirmation status</td>
                    <td class="p-3">PCI-DSS compliant payment gateway</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <!-- Section 4: Data Security & Storage -->
        <section class="space-y-4">
          <h2 class="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <span class="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs flex items-center justify-center font-mono font-bold">4</span>
            <span>Data Security & Local Storage</span>
          </h2>
          <div class="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-3">
            <p>
              We implement comprehensive technical and organizational safeguards:
            </p>
            <ul class="list-disc list-inside space-y-1.5 pl-2 text-slate-700 dark:text-slate-300 text-xs sm:text-sm">
              <li><strong>Encryption in Transit:</strong> All communications between your browser and our servers/Firestore are encrypted using TLS 1.3/HTTPS.</li>
              <li><strong>Granular Security Rules:</strong> Firestore security rules protect projects from unauthorized access. Only the designated schema owner or authorized collaborators can modify or delete projects.</li>
              <li><strong>Local Storage Continuity:</strong> If you work as a guest or temporarily lose network connectivity, dbmaps caches your active schema in your browser's local storage (<code class="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">localStorage</code>) so your work is never lost.</li>
            </ul>
          </div>
        </section>

        <!-- Section 5: Your Rights -->
        <section class="space-y-4">
          <h2 class="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <span class="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs flex items-center justify-center font-mono font-bold">5</span>
            <span>Your Rights & Data Portability</span>
          </h2>
          <div class="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-3">
            <p>
              Under applicable global privacy regulations (including GDPR and CCPA), you have full rights regarding your data:
            </p>
            <ul class="list-disc list-inside space-y-1.5 pl-2 text-slate-700 dark:text-slate-300 text-xs sm:text-sm">
              <li><strong>Right to Export (Portability):</strong> You can export all your database schemas at any time in open SQL DDL, DBML text, PDF documentation, or PNG/SVG images.</li>
              <li><strong>Right to Deletion:</strong> You can delete any schema, commit history checkpoint, or folder directly from the sidebar. You can also request complete account deletion by contacting us.</li>
              <li><strong>Right to Revoke Access:</strong> You can revoke dbmaps' Google SSO permissions anytime via your <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 underline font-semibold">Google Account Security Settings</a>.</li>
            </ul>
          </div>
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
              <li>Presto AI assistant powered by Google Gemini for architectural schema synthesis from natural language.</li>
              <li>Real-time multi-user live collaboration, team sharing, and password-protected schema access.</li>
              <li>Data dictionary documentation generation (dbdictionary) with shareable web views.</li>
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

        <!-- Section 5: AI Features & Engineering Responsibility -->
        <section class="space-y-4">
          <h2 class="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <span class="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs flex items-center justify-center font-mono font-bold">5</span>
            <span>AI Features & Production Engineering Disclaimer</span>
          </h2>
          <div class="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-3">
            <p>
              The Presto AI assistant is an engineering accelerator powered by Google Gemini. While it produces production-quality schemas, you acknowledge and agree that:
            </p>
            <ul class="list-disc list-inside space-y-1.5 pl-2 text-slate-700 dark:text-slate-300 text-xs sm:text-sm">
              <li>All AI-generated schemas, indexes, and SQL migration scripts should be verified, reviewed, and load-tested by your engineering team before deploying to production databases.</li>
              <li>dbmaps is not responsible for data anomalies, indexing performance issues, or application bugs arising from unvalidated AI outputs.</li>
            </ul>
          </div>
        </section>

        <!-- Section 6: Subscription, Credits & Payments -->
        <section class="space-y-4">
          <h2 class="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <span class="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs flex items-center justify-center font-mono font-bold">6</span>
            <span>Subscriptions, Credits & Billing</span>
          </h2>
          <div class="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-3">
            <p>
              dbmaps offers both Free and Pro service tiers:
            </p>
            <ul class="list-disc list-inside space-y-1.5 pl-2 text-slate-700 dark:text-slate-300 text-xs sm:text-sm">
              <li><strong>Free Tier:</strong> Includes generous monthly AI generation credit allowances (50,000 credits/month) and full access to diagramming, exports, and local saving.</li>
              <li><strong>Pro Tier:</strong> Expanded AI token quotas (1,000,000 credits/month), 20,000 character prompt capacity, priority generation, and enhanced team collaboration.</li>
              <li><strong>Payments:</strong> All upgrade transactions and invoices are handled securely via TallySale. All fees are clearly stated prior to confirmation.</li>
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
