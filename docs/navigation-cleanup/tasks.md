# Tasks: Compact workspace navigation and current-workflow tour

## Inputs and scope

Source: user browser comments dated 2026-11-12 and inspection of the current Vue application. This is a standalone task plan: `.specify/`, its setup script, template, constitution, plan.md, and spec.md are absent. No extension hooks are configured because `.specify/extensions.yml` is absent.

Use Vue, existing Tailwind/CSS and lucide icons; add no dependencies. Replace the large More popup with compact actions aligned to the right of the header navigation. Keep New database, Import, Data dictionary, Interactive tour, Learn DBML and theme access. Preserve the existing Export dialog and direct DBML download. Use accessible names and tooltips for compact icons; at narrow widths wrap into a compact second toolbar row rather than recreating a tall popup.

Remove template-library and marketplace functionality throughout the app, including creation pickers and navigation. Remove What's new and Home & Features from workspace navigation; retain the landing page/logo home action and unrelated legal links. This does not request deletion of release history documents or existing user schemas. Existing projects cloned from templates must remain readable and exportable. Do not erase persisted template-related fields merely to remove the feature.

## Phase 1: Setup

- [x] T001 Inventory feature references and callers with repository-wide searches for marketplace, templates, cloneMarketplaceTemplate, createProject, startTour and tour selectors; record affected paths and route behavior in docs/navigation-cleanup/tasks.md.

## Phase 2: Foundational

- [x] T002 Confirm retained header actions and legacy template URL fallback to the normal start screen without losing schema query parameters; record final decisions in docs/navigation-cleanup/tasks.md after inspecting src/App.vue and src/stores/schemaStore.js.

## Phase 3: US1 - Compact right-side toolbar (P1)

Goal: access workspace tools without the oversized More popup.

Independent acceptance: at 657x835 and desktop widths, every retained action is reachable by keyboard and pointer, labels/tooltips identify icons, Export opens the current dialog, and DBML downloads directly. No horizontal viewport overflow or tall tools popup.

- [x] T003 [US1] Replace the More dropdown with compact right-aligned header actions in src/components/Navbar.vue; remove descriptions, category headings, duplicate export entries, Marketplace, What's new and Home & Features entries, and unused dropdown listeners/imports while retaining legal navigation.
- [x] T004 [US1] Update only affected toolbar layout rules in src/index.css for compact desktop placement, narrow-width wrapping, visible keyboard focus and adequate touch targets; preserve existing uncommitted CSS changes.

## Phase 4: US2 - Remove template features (P1)

Goal: remove library browsing and template creation without damaging saved schemas.

Independent acceptance: Templates/Marketplace entry points and creation choices are absent; legacy template URLs return to the start screen; new blank schemas work; previously cloned schemas still open, edit and export.

- [x] T005 [P] [US2] Remove Templates rail and expanded navigation actions plus unused template-only imports in src/components/Sidebar.vue.
- [x] T006 [P] [US2] Remove starting-template selection and template-only state from src/components/NewProjectModal.vue; keep project-name, dialect and access validation and pass a compatible blank-project value to the existing createProject signature until callers are migrated.
- [x] T007 [P] [US2] Remove template-library promotional links and launch actions from src/components/LandingPage.vue; retain unrelated landing content and home navigation.
- [x] T008 [US2] Remove MarketplacePage and MarketplaceModal mounting/imports and route detection in src/App.vue; implement the legacy template path/query fallback agreed in T002.
- [x] T009 [US2] Remove unused marketplace state, template cloning exports and imports in src/stores/schemaStore.js after searching every caller; migrate remaining createProject callers if removing its template argument, preserve sample-project identity checks used by storage migration, and align store route initialization with src/App.vue.
- [x] T010 [US2] Delete src/components/MarketplacePage.vue, src/components/MarketplaceModal.vue, src/utils/marketplaceTemplates.js and src/utils/useTemplateFilters.js only after confirming no remaining callers; remove remaining live Template Library navigation/promotional references found in T001, without deleting user data or unrelated SQL import examples.

## Phase 5: US3 - Tour follows the latest workflow (P2)

Goal: explain the tools that users actually see after the navigation changes.

Independent acceptance: restart, Next, Back, Skip and Finish work; every spotlight targets a visible element at desktop and 657x835; copy accurately describes local/browser saving, editing and export; no step mentions removed features or nonexistent publishing/cloud sync.

- [x] T011 [US3] Add stable tour targets to retained actions in src/components/Navbar.vue and reuse existing editor/canvas/sidebar targets; make the tour entry accessible from the new toolbar.
- [x] T012 [US3] Rewrite steps in src/components/OnboardingTour.vue in workflow order: create/open project, schema explorer, DBML editing, diagram tools, available view modes, import/data dictionary, Export dialog and direct DBML download; handle controls hidden by responsive view modes so spotlights never point at missing elements.
- [x] T013 [US3] Align start/completion messaging and step bounds in src/stores/schemaStore.js with src/components/OnboardingTour.vue; remove More-menu instructions and cloud/public-publishing claims while preserving completion persistence and current project contents.

## Phase 6: Polish and cross-cutting verification

- [x] T014 Run npm run build, npm run lint and npm test using package.json scripts; search src/ for dangling removed imports/actions/routes and resolve integration errors in the affected files.
- [ ] T015 Verify the toolbar, legacy routes, blank creation, existing-project preservation and complete tour in the local browser at 657x835 and desktop widths; record results and any remaining limits in docs/navigation-cleanup/tasks.md.

## Dependencies

T001 -> T002 -> US1 -> US2 -> US3 -> T014 -> T015.
Within US1: T003 -> T004. Within US2: T005/T006/T007 can run independently after US1; then T008 -> T009 -> T010. Within US3: T011 -> T012 -> T013. US3 waits for removed features and final toolbar selectors. All phases are required for the full request.

## Parallel examples

- US1: no parallel tasks; toolbar markup and its responsive styles are coupled.
- US2: T005 (Sidebar.vue), T006 (NewProjectModal.vue) and T007 (LandingPage.vue) touch separate files and can run together after prerequisites.
- US3: no parallel tasks; steps depend on final selectors and store messaging depends on the final step list.

## Implementation strategy

Deliver US1 first as the suggested MVP: compact tools with retained export behavior. Then finish feature removal in US2 and align onboarding in US3. Keep each increment runnable. No new test files are prescribed because tests/TDD were not requested; run existing checks and manual acceptance. Any nontrivial new route/tour logic must still receive a focused regression check under project working rules.

## Format validation

15 sequential checklist tasks with exact paths: setup 1, foundation 1, US1 2, US2 6, US3 3, final verification 2. Three parallel opportunities, all in US2. Each user-story task includes its story label; only independently executable tasks carry [P].

## Implementation results

Implemented T001-T014. Existing Vue/Tailwind/lucide patterns were reused. Legacy marketplace/template paths and query aliases enter the normal app start screen; schema URLs take precedence. Removed feature code and UI, leaving sample identity checks used for historical storage migration. No persistence migration or schema deletion was introduced. The tour uses one shared eight-step list for rendering and completion bounds.

Validation: production build, TypeScript check and all 25 tests passed, including the new workflow-target regression check. In the in-app browser at approximately 657x835, verified the compact toolbar, absence of More/Templates, retained existing eight-table project, Export opening, all eight tour steps and successful Finish. Screenshot: tmp/navigation-toolbar.png. T015 remains partially unchecked: desktop viewport, legacy-route navigation, fresh creation and Back/Skip interaction were not manually exercised. Existing storage/backup tests passed.
