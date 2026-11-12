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
            >Data Dictionary</a
          >

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
          <div class="board-hero-actions">
          <button class="home-primary" @click="goToStudio">
            Open studio <ArrowRight :size="18" />
          </button>

          </div>
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
            <h3>Document your database.</h3>
            <p>
              Browse a searchable data dictionary and export it as Markdown.
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
            <img :src="engine.icon" alt="" class="brand-engine-logo" />
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
        <span class="footer-wordmark inline-flex items-center gap-2"><DbMapLogo class-name="w-7 h-7" />dbmaps</span>
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
import { ref, computed } from "vue";
import {
  state,
  activeProject,
  navigateTo,
  toggleDarkMode,
} from "../stores/schemaStore.js";
import { SAMPLE_PROJECTS } from "../utils/sampleSchemas.js";
import { generateDBML, parseDBML, exportToSQL } from "../utils/dbmlParser.js";
import DbMapLogo from "./DbMapLogo.vue";
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



function goToChangelog() {
  navigateTo("/changelog");
}

function goToLearnDbml() {
  navigateTo("/learn-dbml");
}

function goToLegal(path) {
  navigateTo(path);
}

// Supported Database Dialects & Authentic Brand Icons
const supportedEngines = [
  {
    id: "postgresql",
    name: "PostgreSQL",
    icon: "/icons/postgresql.png",
    sample: "ecommerce",
  },
  {
    id: "mysql",
    name: "MySQL",
    icon: "/icons/mysql.png",
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
      "Yes! dbmaps is free to use directly in your browser with zero installation. You can create unlimited tables, export SQL DDL, visualize diagrams.",
    open: true,
  },
  {
    question: "Which database dialects and SQL engines are supported?",
    answer:
      "dbmaps natively supports PostgreSQL, MySQL, SQLite, and Microsoft SQL Server, in addition to the DBML standard. You can import existing DDL scripts, edit visually, and export formatted SQL for any of these engines with one click.",
    open: false,
  },
  {
    question: "Where are my projects saved?",
    answer:
      "Projects are saved in this browser. Export a full project backup to restore the schema, layout, and settings in another browser.",
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
