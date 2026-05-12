# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Is

Crate-O is a browser-based editor for [RO-Crate](https://www.researchobject.org/ro-crate/) (Research Object Crate) metadata. It ships both as a standalone Vue SPA and as a reusable Vue component library. It uses the browser's FileSystem API and therefore requires Chromium/Chrome/Edge.

## Team Working Principles

### 1) Keep profile selection logic simple and explicit

- Prefer explicit signals over heuristics for profile selection.
- Auto-detection should rely on explicit root `conformsTo` matches only.
- Avoid "magic" fallbacks that infer profile choice from indirect clues.
- Manual user profile choice should remain predictable and not be silently overridden.

### 2) Minimize crate-o specific validation logic

- Crate-O should delegate validation behavior to the MASP validator implementation from `ro-crate-masp`.
- Do not duplicate or fork validation rules in UI code unless there is a clear UI-only presentation concern.
- When adding validation behavior, implement it in the shared validator first, then consume it from Crate-O.

### 3) Preserve reusable integration boundaries

- Treat profile loading, profile selection UX, and validation as separate concerns.
- Keep editor/UI code focused on interaction and rendering; keep rule semantics in the validator.
- Favor integration changes that can be reused by other MASP-consuming projects.

## Commands

```bash
npm run dev           # Start Vite dev server
npm run build         # Build production SPA + copy README to dist
npm run build:library # Build as embeddable Vue component library
npm run preview       # Preview production build on port 5173
npm test              # Run Cypress component tests headless
npm run test:ui       # Run Cypress component tests in Chrome UI
npm run test:unit     # Run unit tests with recording
npx cypress open      # Open interactive Cypress test runner
```

**Linting/formatting** is handled by Biome (not ESLint/Prettier):
```bash
npx biome check .        # Check formatting and linting
npx biome check --write .  # Auto-fix formatting and linting
```

Code style: 2-space indentation, 120-char line width, single quotes, always semicolons.

## Architecture

### Dual Entry Points

- **Standalone app:** `src/app/main.js` → `src/app/App.vue` → Vue Router → `src/app/views/CrateoView.vue`
- **Library:** `src/lib/index.js` exports `CrateEditor` as an installable Vue plugin

### Core Library (`src/lib/`)

- **`CrateEditor.vue`** — top-level component; receives a Mode profile and exposes the editor
- **`Entity.vue`** — renders/edits a single RO-Crate entity and its properties
- **`Property.vue`** — renders a single property row, dispatching to the right input component
- **`Input*.vue`** — leaf input components: `InputText`, `InputSelect`, `InputDateTime`, `InputGeo`, etc.
- **`EditorState.js`** — class-based reactive state manager (Vue `reactive()`/`shallowReactive()`); no Pinia/Vuex
- **`LeafletMap.vue`** — geographic data entry with editable Leaflet map
- **`LinkEntity.vue`** — entity relationship picker
- **`lookups/`** — external data lookups (datapack, ROR registry)

### Standalone App (`src/app/`)

- **`views/CrateoView.vue`** — main view; handles directory picking via `showDirectoryPicker`, loads/saves `ro-crate-metadata.json`
- **`components/`** — About dialog, Help panel, SpreadSheet importer
- **`utils/profiles.js`** — profile (Mode File) loading and resolution
- **`utils/profileValidator.js`** — JSON Schema validation of profiles via `ajv`

### Data Flow

1. User picks a local directory → `showDirectoryPicker` (FileSystem API)
2. App reads `ro-crate-metadata.json` and instantiates an `ROCrate` object (from `ro-crate` npm library)
3. A Mode profile (JSON) is loaded and validated — it controls which properties/types appear
4. `CrateEditor` receives the `ROCrate` instance + profile and renders the editor
5. Edits mutate the `ROCrate` object in place via `EditorState`
6. User saves → serialises back to `ro-crate-metadata.json`

Validation behavior should come from the shared MASP validator API rather than crate-o local rule implementations.

### Build Configuration (`vite.config.js`)

The Vite config is non-trivial:
- Includes custom EJS and Nunjucks template renderers for `ro-crate-html`/`ro-crate-html-lite` preview generation
- Library build (`build:library`) produces a single bundle exporting from `src/lib/index.js`
- Tailwind CSS via PostCSS plugin
- Bundle visualizer available (`rollup-plugin-visualizer`)

## Key Dependencies

| Package | Role |
|---|---|
| `ro-crate` | Core RO-Crate JS model |
| `ro-crate-modes` | Profile/mode definitions (loaded from GitHub) |
| `ro-crate-excel` | Bulk metadata import from Excel |
| `ro-crate-html` / `ro-crate-html-lite` | HTML preview generation |
| `element-plus` | UI component library (peer dep) |
| `leaflet` + plugins | Interactive map for geo coordinates |
| `ajv` | JSON Schema validation for profiles |
| `marked` | Markdown rendering in help/descriptions |

## Testing

Tests live in `cypress/` (component and e2e) and `tests/`. Sample RO-Crate data for tests is in `test-data/`. To run a single Cypress spec:

```bash
npx cypress run --spec "cypress/component/SomeSpec.cy.js"
```
