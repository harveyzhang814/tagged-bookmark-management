# Agent Guide (tagged-bookmark-management)

This repo is a Chrome Extension (Manifest V3) built with Vite + React + TypeScript.
It ships two UI entrypoints (Popup + Options) and one background service worker.

## Quick Commands

### Install

```bash
npm install
```

### Dev (watch)

```bash
npm run dev
```

- Vite dev server is configured on port `5177` (`vite.config.ts`).
- For extension development, load the built output in Chrome (see README).

### Build

```bash
npm run build
```

- Outputs to `dist/` via `@crxjs/vite-plugin` and uses:
  - `src/pages/popup/main.html`
  - `src/pages/options/main.html`

### Package (release zip)

```bash
npm run release
```

### Tests

```bash
npm test
```

Notes:
- `npm test` runs Vitest (watch mode by default).
- Test environment is `jsdom` (`vitest.config.ts`) and includes `@testing-library/jest-dom` (`vitest.setup.ts`).

### Run a Single Test

Run one file:

```bash
npm test -- src/lib/__tests__/bookmarkService.test.ts
```

Run one test by name (pattern):

```bash
npm test -- -t "filters bookmarks"
```

One-off (non-watch) runs (useful for CI-like checks):

```bash
npx vitest run
npx vitest run src/lib/__tests__/bookmarkService.test.ts
npx vitest run -t "creates tags"
```

### Typecheck

There is no dedicated script; use `tsc` directly:

```bash
npx tsc -p tsconfig.json --noEmit
```

### Lint/Format

- No ESLint/Prettier config is present in this repo.
- Keep changes consistent with existing formatting and patterns.

## Project Layout (What Matters)

- `src/manifest.ts`: MV3 manifest definition.
- `src/background/index.ts`: service worker; registers context menu and handles quick add.
- `src/pages/popup/*`: popup UI.
- `src/pages/options/*`: options UI (tabbed app).
- `src/lib/*`: core business logic and storage wrappers.
- `src/i18n/*`: i18next setup + translations.

## Code Style Guidelines

### General

- Prefer small, focused changes; avoid drive-by refactors.
- Keep TypeScript `strict`-safe (`tsconfig.node.json` enables `strict`).
- Use `async/await` consistently; avoid mixing with raw callbacks unless required by Chrome APIs.
- When firing async work from React effects/handlers without awaiting, use `void someAsyncFn()`.

### Imports

- Order imports roughly as:
  1) React/3rd-party
  2) project modules (`src/...` relative imports)
  3) CSS imports last
- Use `import type { ... }` for type-only imports.
- Prefer named exports and named imports; keep import lists alphabetized when it’s easy.

### Naming

- React components: `PascalCase` (files match component name, e.g. `BookmarksPage.tsx`).
- Hooks: `useXxx`.
- Services: `xxxService.ts` for domain operations (e.g. `bookmarkService.ts`, `workstationService.ts`).
- Storage keys: keep prefix `tbm.` and add to `STORAGE_KEYS` in `src/lib/storage.ts`.

### Types and Data Model

- Canonical domain types live in `src/lib/types.ts`.
- Keep storage shape compatible; when adding fields:
  - Make migrations/backward-compat explicit (defaults when reading).
  - Update import/export logic (`src/lib/importExportService.ts`) if data is serialized.
- Avoid duplicating “derived” counters in multiple places; reuse existing recompute helpers.

### Error Handling

- In UI, surface recoverable failures via component state (error banners/toasts) and keep UX responsive.
- In services, throw only for truly exceptional situations (e.g. missing Chrome APIs), otherwise return `null` for “not found” and let callers decide.
- Log unexpected errors with `console.error` (pattern used across pages).

### Chrome Extension Constraints

- Always guard Chrome APIs for non-extension contexts:
  - `if (typeof chrome === 'undefined' || !chrome.<api>) { ... }`
  - Or use the wrappers in `src/lib/chrome.ts`.
- Background service worker code must stay MV3-safe (no DOM).
- Data is stored locally in `chrome.storage.local` (see `src/lib/storage.ts`).

### React Patterns

- Keep state updates immutable (`setState(prev => ...)`).
- Memoize derived lists with `useMemo` when filtering/sorting large arrays.
- Prefer `useCallback` for handlers passed deep to children.

### i18n

- UI strings should come from `t('...')`.
- When adding a new string:
  - Update both `src/i18n/locales/en/translation.json` and `src/i18n/locales/zh-CN/translation.json`.
  - Keep keys grouped by feature (follow existing structure).

### CSS

- Styling is plain CSS imported per component/page.
- Reuse theme variables from `src/styles/global.css` (`--bg-*`, `--text-*`, `--accent`, etc.).
- Prefer component-scoped class names (existing files use `block__element` style).

## Repo-Specific Rules (Cursor/Copilot)

- No Cursor rules found (`.cursor/rules/` or `.cursorrules` are absent).
- No Copilot instructions found (`.github/copilot-instructions.md` is absent).

If you add such rules later, update this file to reference them.
