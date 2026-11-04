<template>
  <div id="learn-dbml-page" class="app-page app-reading-page min-h-dvh bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
    <!-- TOP NAVIGATION BAR -->
    <header class="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90  border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 h-16 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <!-- Logo -->
        <button
          @click="navigateTo('/')"
          class="flex items-center gap-2 hover:opacity-80 transition cursor-pointer"
          title="dbmaps Home"
        >
          <DbMapLogo class-name="w-7 h-7" />
          <span class="font-mono font-bold text-slate-900 dark:text-white text-lg">
            db<span class="text-blue-600 dark:text-blue-400">maps</span>
          </span>
        </button>

        <div class="h-4 w-[1px] bg-slate-300 dark:bg-slate-700 hidden sm:block"></div>

        <!-- Breadcrumb / Badge -->
        <div class="hidden sm:flex items-center gap-2">
          <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            Learn DBML
          </span>
          <span class="text-xs text-slate-500 dark:text-slate-400">
            Syntax Guide & Cheatsheet
          </span>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center gap-2.5">
        <!-- Dark Mode Toggle -->
        <button
          @click="toggleDarkMode"
          class="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          :title="state.isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
        >
          <Sun v-if="state.isDarkMode" class="w-4 h-4 text-amber-400" />
          <Moon v-else class="w-4 h-4 text-slate-600" />
        </button>

        <button
          @click="navigateTo('/app')"
          class="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition cursor-pointer flex items-center gap-1.5"
        >
          <ArrowLeft class="w-3.5 h-3.5" />
          <span>Studio Workspace</span>
        </button>

        <button
          @click="loadSampleAndLaunch(selectedSnippet.name, selectedSnippet.code)"
          class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition  cursor-pointer flex items-center gap-1.5"
        >
          <Play class="w-3.5 h-3.5 fill-current" />
          <span>Try in Studio</span>
        </button>
      </div>
    </header>

    <!-- MAIN CONTENT CONTAINER -->
    <main class="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-12 space-y-12">
      <!-- HERO & ATTRIBUTION HEADER -->
      <section id="hero-attribution" class="space-y-6 text-center sm:text-left">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80">
          <Sparkles class="w-3.5 h-3.5" />
          <span>Powered by DBML • Lightweight Engine</span>
        </div>

        <div class="space-y-3">
          <h1 class="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Learn DBML
          </h1>
          <p class="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
            DBML (Database Markup Language) is an open-source, readable, and developer-friendly syntax designed to define and document database schemas. Learn how to write DBML and utilize dbmaps’s zero-dependency client-side engine.
          </p>
        </div>

        <!-- FORMAL ATTRIBUTION & CREDIT CALLOUT CARD -->
        <div id="holistics-attribution-card" class="p-5 sm:p-6 rounded-2xl        border border-blue-200/80 dark:border-blue-800/60  flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 app-soft-surface">
          <div class="flex items-start gap-3.5 max-w-2xl">
            <div class="p-2.5 rounded-xl bg-blue-600 text-white shrink-0">
              <Heart class="w-5 h-5 fill-current text-rose-300" />
            </div>
            <div class="space-y-1 text-xs sm:text-sm">
              <div class="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Credit & Attribution to Holistics</span>
                <span class="px-2 py-0.2 rounded text-[10px] font-mono bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">Original DBML Creator</span>
              </div>
              <p class="text-slate-600 dark:text-slate-300 leading-relaxed text-xs">
                DBML was created and open-sourced by the team at <strong class="text-slate-800 dark:text-slate-100">Holistics</strong> (the makers of <em>dbdiagram.io</em> and <em>dbdocs.io</em>). We gratefully acknowledge and credit Holistics for their pioneering work creating this schema language standard.
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <a
              href="https://dbml.org"
              target="_blank"
              rel="noopener noreferrer"
              class="w-full sm:w-auto px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <span>dbml.org</span>
              <ExternalLink class="w-3.5 h-3.5 text-slate-400" />
            </a>
            <a
              href="https://dbdiagram.io"
              target="_blank"
              rel="noopener noreferrer"
              class="w-full sm:w-auto px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <span>dbdiagram.io</span>
              <ExternalLink class="w-3.5 h-3.5 text-blue-200" />
            </a>
          </div>
        </div>
      </section>

      <!-- WHY OUR LIGHTWEIGHT ENGINE (ARCHITECTURAL HIGHLIGHTS) -->
      <section id="engine-highlights" class="space-y-4">
        <h2 class="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Terminal class="w-5 h-5 text-blue-500" />
          <span>The dbmaps Lightweight DBML Engine</span>
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800  space-y-2">
            <div class="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-sm">
              <Zap class="w-4 h-4" />
              <span>Zero-Bundle Overhead</span>
            </div>
            <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              No heavy 20MB compiler dependencies or bulky Node AST libraries. Our custom lexer runs directly in the browser with near-zero bundle weight.
            </p>
          </div>

          <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800  space-y-2">
            <div class="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
              <ShieldCheck class="w-4 h-4" />
              <span>Fault-Tolerant Typing</span>
            </div>
            <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              External parsers crash and throw exceptions on half-typed lines. dbmaps safely tolerates incomplete keystrokes while syncing live with the ERD canvas.
            </p>
          </div>

          <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800  space-y-2">
            <div class="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-sm">
              <RefreshCw class="w-4 h-4" />
              <span>True Bidirectional Sync</span>
            </div>
            <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Edits in code immediately route SVG relationship lines, while dragging or modifying tables in the visual canvas instantly regenerates formatted DBML code.
            </p>
          </div>
        </div>
      </section>

      <!-- INTERACTIVE DBML SYNTAX CHEATSHEET -->
      <section id="syntax-guide" class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <h2 class="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              DBML Syntax Cheatsheet
            </h2>
            <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Key language rules supported by the dbmaps engine.
            </p>
          </div>

          <!-- Syntax Category Selector -->
          <div class="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-800/80 p-1 rounded-xl text-xs overflow-x-auto">
            <button
              v-for="cat in syntaxCategories"
              :key="cat.id"
              @click="activeSyntaxCategory = cat.id"
              class="px-3 py-1.5 rounded-lg font-medium transition shrink-0 cursor-pointer"
              :class="activeSyntaxCategory === cat.id ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'"
            >
              {{ cat.label }}
            </button>
          </div>
        </div>

        <!-- Active Syntax Category Explanation -->
        <div class="space-y-4">
          <div
            v-for="item in currentCategoryItems"
            :key="item.title"
            class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800  space-y-3"
          >
            <div class="flex items-center justify-between gap-3">
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                  {{ item.tag }}
                </span>
                <h3 class="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                  {{ item.title }}
                </h3>
              </div>
              <button
                @click="copyCode(item.code, item.title)"
                class="px-2.5 py-1 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition flex items-center gap-1.5 cursor-pointer"
                :title="'Copy ' + item.title"
              >
                <Check v-if="copiedSnippetTitle === item.title" class="w-3.5 h-3.5 text-emerald-500" />
                <Copy v-else class="w-3.5 h-3.5 text-slate-400" />
                <span>{{ copiedSnippetTitle === item.title ? 'Copied' : 'Copy' }}</span>
              </button>
            </div>

            <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {{ item.description }}
            </p>

            <div class="relative bg-slate-950 rounded-xl p-3.5 overflow-x-auto font-mono text-xs text-slate-100 border border-slate-800">
              <pre class="leading-relaxed"><code>{{ item.code }}</code></pre>
            </div>

            <div v-if="item.tip" class="p-2.5 rounded-lg bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-blue-800 dark:text-blue-300 text-xs flex items-start gap-2">
              <Info class="w-4 h-4 shrink-0 text-blue-500 mt-0.5" />
              <span><strong>Pro Tip:</strong> {{ item.tip }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- LIVE INTERACTIVE PLAYGROUND SNIPPETS -->
      <section id="interactive-snippets" class="space-y-6">
        <div class="border-b border-slate-200 dark:border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 class="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Ready-to-Use DBML Examples
            </h2>
            <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Test these architectures in your studio or copy them directly.
            </p>
          </div>

          <div class="flex items-center gap-2">
            <button
              v-for="(snip, idx) in sampleSnippets"
              :key="snip.name"
              @click="selectedSnippetIndex = idx"
              class="px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer"
              :class="selectedSnippetIndex === idx ? 'bg-blue-600 text-white shadow-2xs' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'"
            >
              {{ snip.name }}
            </button>
          </div>
        </div>

        <div class="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800  space-y-4">
          <div class="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 class="font-bold text-base text-slate-900 dark:text-white">
                {{ selectedSnippet.name }}
              </h3>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                {{ selectedSnippet.description }}
              </p>
            </div>

            <div class="flex items-center gap-2">
              <button
                @click="copyCode(selectedSnippet.code, selectedSnippet.name)"
                class="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Check v-if="copiedSnippetTitle === selectedSnippet.name" class="w-3.5 h-3.5 text-emerald-500" />
                <Copy v-else class="w-3.5 h-3.5 text-slate-400" />
                <span>{{ copiedSnippetTitle === selectedSnippet.name ? 'Copied' : 'Copy DBML' }}</span>
              </button>

              <button
                @click="loadSampleAndLaunch(selectedSnippet.name, selectedSnippet.code)"
                class="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5  cursor-pointer"
              >
                <Play class="w-3.5 h-3.5 fill-current" />
                <span>Open in dbmaps Studio</span>
              </button>
            </div>
          </div>

          <!-- Code Preview Box with Syntax Look -->
          <div class="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 font-mono text-xs text-slate-100 p-4">
            <pre class="overflow-x-auto max-h-96 leading-relaxed"><code>{{ selectedSnippet.code }}</code></pre>
          </div>
        </div>
      </section>

      <!-- DBML vs RAW SQL COMPARISON -->
      <section id="dbml-vs-sql" class="space-y-4">
        <h2 class="text-xl font-bold text-slate-900 dark:text-white">
          Why Engineers Prefer DBML over Raw SQL DDL
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- DBML Side -->
          <div class="p-5 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 space-y-3">
            <div class="flex items-center justify-between">
              <span class="font-bold text-emerald-700 dark:text-emerald-400 text-sm flex items-center gap-1.5">
                <CheckCircle2 class="w-4 h-4" />
                <span>Clean DBML v2 (7 lines)</span>
              </span>
              <span class="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">Readable & Expressive</span>
            </div>
            <pre class="bg-slate-950 text-slate-100 p-3.5 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800"><code>Table orders {
  id int [pk, increment]
  user_id int [ref: > users.id]
  total decimal(10,2) [not null]
  status varchar [default: 'pending']
  created_at timestamp
}</code></pre>
          </div>

          <!-- Raw SQL Side -->
          <div class="p-5 rounded-2xl bg-slate-100/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-3">
            <div class="flex items-center justify-between">
              <span class="font-bold text-slate-700 dark:text-slate-300 text-sm">
                Verbose SQL DDL (16+ lines)
              </span>
              <span class="text-[11px] font-mono text-slate-500">Dialect Cluttered</span>
            </div>
            <pre class="bg-slate-950 text-slate-300 p-3.5 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800"><code>CREATE TABLE `orders` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `total` DECIMAL(10,2) NOT NULL,
  `status` VARCHAR(255) DEFAULT 'pending',
  `created_at` TIMESTAMP NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_orders_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB;</code></pre>
          </div>
        </div>
      </section>

      <!-- CALL TO ACTION BANNER -->
      <section id="cta-studio" class="p-8 rounded-3xl     text-white  flex flex-col sm:flex-row items-center justify-between gap-6 bg-blue-700">
        <div class="space-y-2 text-center sm:text-left">
          <h2 class="text-2xl font-semibold tracking-tight">
            Ready to Design Your Architecture?
          </h2>
          <p class="text-blue-200 text-xs sm:text-sm max-w-xl">
            Switch to the Studio workspace to start typing DBML code, drag tables on the visual canvas, or prompt Presto AI to generate whole schemas.
          </p>
        </div>

        <div class="flex items-center gap-3 shrink-0">
          <button
            @click="navigateTo('/app')"
            class="px-5 py-3 rounded-xl bg-white text-blue-900 font-bold text-sm hover:bg-blue-50 transition  flex items-center gap-2 cursor-pointer"
          >
            <span>Launch dbmaps Studio</span>
            <ArrowRight class="w-4 h-4" />
          </button>
        </div>
      </section>
    </main>

    <!-- FOOTER -->
    <footer class="border-t border-slate-200 dark:border-slate-800 py-8 px-4 sm:px-8 text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900">
      <div class="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-2">
          <DbMapLogo class-name="w-5 h-5" />
          <span class="font-mono font-bold text-slate-800 dark:text-slate-200">
            db<span class="text-blue-600 dark:text-blue-400">maps</span>
          </span>
          <span class="text-slate-300 dark:text-slate-700">|</span>
          <span>Powered by DBML • Created by Holistics</span>
        </div>

        <div class="flex items-center gap-4">
          <button @click="navigateTo('/')" class="hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer">Home</button>
          <button @click="navigateTo('/app')" class="hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer">Studio Workspace</button>
          <a href="https://dbml.org" target="_blank" rel="noopener noreferrer" class="hover:text-blue-600 dark:hover:text-blue-400 transition flex items-center gap-1">
            <span>Official DBML Spec</span>
            <ExternalLink class="w-3 h-3" />
          </a>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import {
  state,
  navigateTo,
  toggleDarkMode,
  importSchema,
  addToast
} from '../stores/schemaStore.js';
import DbMapLogo from './DbMapLogo.vue';
import {
  Sparkles,
  Heart,
  ExternalLink,
  Zap,
  ShieldCheck,
  RefreshCw,
  Terminal,
  Copy,
  Check,
  Play,
  ArrowLeft,
  ArrowRight,
  Sun,
  Moon,
  Info,
  CheckCircle2
} from 'lucide-vue-next';

const copiedSnippetTitle = ref('');

function copyCode(code, title) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(code);
    copiedSnippetTitle.value = title;
    addToast('Copied to Clipboard', `Copied DBML snippet for "${title}"`, 'success');
    setTimeout(() => {
      if (copiedSnippetTitle.value === title) {
        copiedSnippetTitle.value = '';
      }
    }, 2500);
  }
}

function loadSampleAndLaunch(name, code) {
  try {
    importSchema({
      name: name,
      script: code,
      dialect: 'dbml',
      mode: 'new'
    });
  } catch (err) {
    console.warn('Direct DBML load warning:', err);
  }
  navigateTo('/app');
}

// SYNTAX CATEGORIES & CONTENT
const activeSyntaxCategory = ref('tables');

const syntaxCategories = [
  { id: 'tables', label: '1. Tables & Columns' },
  { id: 'relationships', label: '2. Relationships & Refs' },
  { id: 'attributes', label: '3. Attributes & Constraints' },
  { id: 'documentation', label: '4. Notes & Docs' },
  { id: 'blocks', label: '5. Projects & Groups' }
];

const syntaxData = {
  tables: [
    {
      tag: 'Table Definition',
      title: 'Declaring a Table',
      description: 'Tables are defined with the Table keyword followed by the table name and an opening curly brace. Inside, list column names and their data types.',
      code: `Table users {
  id integer [pk, increment]
  username varchar(50) [not null, unique]
  email varchar(255) [not null]
  created_at timestamp [default: \`now()\`]
}`,
      tip: 'You can define table aliases using the "as" keyword, e.g. Table users as u { ... }.'
    },
    {
      tag: 'Multi-Schema',
      title: 'Schemas & Namespaces',
      description: 'Prefix the table name with its schema namespace separated by a period (e.g. public, auth, billing).',
      code: `Table auth.users {
  id uuid [pk]
  encrypted_password varchar [not null]
}

Table billing.subscriptions {
  id serial [pk]
  user_id uuid [ref: > auth.users.id]
}`
    }
  ],
  relationships: [
    {
      tag: 'Standalone Ref',
      title: 'Defining Foreign Keys with "Ref:"',
      description: 'Foreign key connections can be declared standalone using the Ref keyword, mapping from a child column to a parent column with cardinality symbols.',
      code: `Ref: orders.user_id > users.id

// With referential action:
Ref: order_items.order_id > orders.id [delete: cascade, update: restrict]`,
      tip: 'The ">" symbol specifies a Many-to-One relationship (orders has many items per user).'
    },
    {
      tag: 'Inline Ref',
      title: 'Inline Column References',
      description: 'Relationships can also be written inline right on the column attribute definition.',
      code: `Table comments {
  id serial [pk]
  post_id int [ref: > posts.id, not null]
  author_id int [ref: > users.id [delete: cascade]]
  body text
}`
    },
    {
      tag: 'Cardinality',
      title: 'Cardinality Reference Table',
      description: 'DBML supports 4 standard relationship operators and optional (nullable foreign key) variants:',
      code: `// >  Many-to-One  (Child > Parent)
Ref: orders.user_id > users.id

// >? Optional Many-to-One (Nullable FK)
created_by bigint [ref: >? users.id]
updated_by bigint [ref: >? users.id]

// <  One-to-Many  (Parent < Child)
Ref: users.id < orders.user_id

// <? Optional One-to-Many
Ref: users.id <? orders.user_id

// -  One-to-One   (1 - 1 Profile)
Ref: users.id - profiles.user_id

// -? Optional One-to-One
Ref: users.id -? profiles.user_id

// <> Many-to-Many (N:M Conceptual link)
Ref: authors.id <> books.id`,
      tip: 'The ? operator (such as >?, ?>, <?, or -?) represents an optional/nullable foreign key relationship matching dbdiagram.io.'
    }
  ],
  attributes: [
    {
      tag: 'Column Attributes',
      title: 'Constraint Settings in Square Brackets [ ]',
      description: 'Settings are specified in square brackets after the data type, separated by commas.',
      code: `Table products {
  id integer [pk, increment]              // Primary key & auto-increment
  sku varchar(64) [unique, not null]      // Unique & non-nullable
  price decimal(10,2) [default: 0.00]     // Literal default value
  status varchar [default: 'draft']       // String default
  created_at timestamp [default: \`now()\`] // SQL function default (backticks)
}`,
      tip: 'SQL functions like now() or CURRENT_TIMESTAMP should be enclosed in backticks (\`now()\`).'
    }
  ],
  documentation: [
    {
      tag: 'Documentation Notes',
      title: 'Table and Column Notes',
      description: 'DBML makes documenting database schemas effortless. You can add single-line notes or multi-line triple-quote blocks.',
      code: `Table customers {
  id int [pk]
  tax_id varchar [note: 'Government issued enterprise VAT identification']

  Note: '''
  Stores customer accounting identities.
  Synced hourly with Stripe & NetSuite.
  '''
}`,
      tip: 'Notes populate the interactive Data Dictionary in dbmaps automatically!'
    }
  ],
  blocks: [
    {
      tag: 'Project Block',
      title: 'Project Metadata Block',
      description: 'Optionally define your database project name and documentation at the top of your file.',
      code: `Project eCommerce_Platform {
  database_type: 'PostgreSQL'
  Note: 'Core retail database architecture'
}`,
      tip: 'dbmaps preserves project titles and database dialects seamlessly.'
    },
    {
      tag: 'Enums & Groups',
      title: 'Enums and Table Groups',
      description: 'Group related tables visually and declare reusable enum values.',
      code: `Enum order_status {
  pending
  authorized
  fulfilled
  cancelled
}

TableGroup commerce {
  orders
  order_items
  products
}`
    }
  ]
};

const currentCategoryItems = computed(() => {
  return syntaxData[activeSyntaxCategory.value] || [];
});

// SAMPLE SNIPPETS
const selectedSnippetIndex = ref(0);

const sampleSnippets = [
  {
    name: 'SaaS Workspace & Roles',
    description: 'Modern multi-tenant SaaS workspace schema with organizations, users, and team memberships.',
    code: `Project SaaS_Workspace {
  database_type: 'PostgreSQL'
}

Table users {
  id serial [pk]
  email varchar(255) [unique, not null]
  full_name varchar(100)
  avatar_url varchar
  created_at timestamp [default: \`now()\`]
  
  Note: 'Global user identity record'
}

Table organizations {
  id uuid [pk]
  name varchar(100) [not null]
  slug varchar(100) [unique, not null]
  plan varchar(20) [default: 'free']
  created_at timestamp [default: \`now()\`]
}

Table memberships {
  id serial [pk]
  user_id int [ref: > users.id, not null]
  org_id uuid [ref: > organizations.id [delete: cascade], not null]
  role varchar(30) [default: 'member']
  created_at timestamp [default: \`now()\`]
}

Table api_keys {
  id serial [pk]
  org_id uuid [ref: > organizations.id [delete: cascade]]
  key_hash varchar [not null]
  name varchar(50) [default: 'Default API Key']
  last_used_at timestamp
}`
  },
  {
    name: 'E-Commerce Orders & Inventory',
    description: 'Complete online store schema with customers, products, order items, and payment transactions.',
    code: `Project Retail_Store {
  database_type: 'PostgreSQL'
}

Table customers {
  id serial [pk]
  email varchar(255) [unique, not null]
  first_name varchar(50)
  last_name varchar(50)
  created_at timestamp [default: \`now()\`]
}

Table products {
  id serial [pk]
  title varchar(200) [not null]
  sku varchar(64) [unique, not null]
  price_cents integer [not null]
  inventory_count integer [default: 0]
}

Table orders {
  id serial [pk]
  customer_id int [ref: > customers.id, not null]
  status varchar(30) [default: 'pending']
  total_cents integer [not null]
  created_at timestamp [default: \`now()\`]
}

Table order_items {
  id serial [pk]
  order_id int [ref: > orders.id [delete: cascade], not null]
  product_id int [ref: > products.id, not null]
  quantity int [default: 1]
  unit_price_cents int [not null]
}`
  },
  {
    name: 'Blog & Content Publishing',
    description: 'Blogging platform schema featuring authors, articles, categories, and moderation comments.',
    code: `Project Publishing_CMS {
  database_type: 'PostgreSQL'
}

Table authors {
  id serial [pk]
  name varchar(100) [not null]
  bio text
  website varchar(255)
}

Table articles {
  id serial [pk]
  author_id int [ref: > authors.id, not null]
  slug varchar(200) [unique, not null]
  title varchar(255) [not null]
  content text [not null]
  published boolean [default: false]
  published_at timestamp
  
  Note: 'Main editorial article content'
}

Table comments {
  id serial [pk]
  article_id int [ref: > articles.id [delete: cascade], not null]
  author_name varchar(100) [not null]
  content text [not null]
  is_approved boolean [default: false]
  created_at timestamp [default: \`now()\`]
}`
  }
];

const selectedSnippet = computed(() => {
  return sampleSnippets[selectedSnippetIndex.value] || sampleSnippets[0];
});
</script>
