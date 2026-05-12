# Project Context: Crate-O

**What it is:** A browser-based editor for [RO-Crate](https://www.researchobject.org/ro-crate/) metadata. Ships as both a standalone Vue SPA and a reusable Vue component library. Requires Chromium/Chrome/Edge (uses FileSystem API).

**Active branch:** `MASP` — integration of MASP profile support into the editor.

**Related repo:** `../ro-crate-masp/` — the MASP tooling this branch integrates with.

## Key commands

```bash
npm run dev           # Vite dev server
npm run build         # Build production SPA
npm run build:library # Build as embeddable Vue component library
npm test              # Cypress component tests headless
npm run test:unit     # Unit tests
npx biome check --write .  # Auto-fix formatting/linting (uses Biome, NOT ESLint/Prettier)
```

Code style: 2-space indent, 120-char line width, single quotes, always semicolons.

## Architecture

- **Standalone app:** `src/app/main.js` → `src/app/App.vue` → Vue Router → `src/app/views/CrateoView.vue`
- **Library:** `src/lib/index.js` exports `CrateEditor` as an installable Vue plugin

**Core lib components (`src/lib/`):**
- `CrateEditor.vue` — top-level component; receives a Mode profile
- `Entity.vue` — renders/edits a single RO-Crate entity
- `Property.vue` — renders a single property row, dispatches to input components
- `Input*.vue` — leaf inputs: `InputText`, `InputSelect`, `InputDateTime`, `InputGeo`, etc.
- `EditorState.js` — class-based reactive state (Vue `reactive()`); no Pinia/Vuex
- `lookups/` — external data lookups (datapack, ROR registry)

**Standalone app (`src/app/`):**
- `views/CrateoView.vue` — main view; handles `showDirectoryPicker`, loads/saves `ro-crate-metadata.json`
- `utils/profiles.js` — profile (Mode File) loading and resolution
- `utils/profileValidator.js` — JSON Schema validation of profiles via `ajv`

## Data flow

1. User picks a local directory → `showDirectoryPicker`
2. App reads `ro-crate-metadata.json`, instantiates `ROCrate` (from `ro-crate` npm)
3. A Mode profile (JSON) is loaded and validated — controls which properties/types appear
4. `CrateEditor` receives `ROCrate` instance + profile, renders the editor
5. Edits mutate the `ROCrate` object in place via `EditorState`
6. User saves → serialises back to `ro-crate-metadata.json`

**Key dependencies:** `ro-crate`, `ro-crate-modes`, `element-plus`, `leaflet`, `ajv`, `marked`

## MASP integration goal (current branch)

The MASP branch adds support for loading **MASP profile crates** as the editor's Mode/profile format — replacing or augmenting the current `ro-crate-modes`-based JSON profiles with machine-actionable profiles from `ro-crate-masp`.

Key work:
- [X] Add existing Mode files to MASP crates, getting rid of all the class and property stuff but keeping specs for lookups and other top-level metadata stuff 
- Load a MASP profile crate (`ro-crate-metadata.json`) using a MASP-Validator object (from `../ro-crate-masp/`)
- Change Crate-O logic to use the validator object instead of referencing a mode file's Class and property layout
- Validate crates in-editor using MASP validator logic



## Notes

- Spec background: [The Notes](https://docs.google.com/document/d/17WRkGPIGtoQoSPlTbStBKUyHTzjrOZb620S1gdk0ei8/edit)
- `SOSS` / `SoSS+` were earlier names for MASP (renamed throughout)
