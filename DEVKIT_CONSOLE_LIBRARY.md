# DevKit Console Library

**Goal:** Standalone production-quality npm library for bidirectional debug level control between browser console and React UI. Generalizes the proven pattern from `src/utils/debugLog.ts` + `src/components/DebugMenu.tsx` in the South Lebanon Map project.

**Status:** Development plan complete; ready to create as separate GitHub repository.

---

## Repo Structure

```
devkit-console/
├── packages/
│   ├── core/           → @devkit-console/core   (zero deps, pure TS)
│   └── react/          → @devkit-console/react  (peer: react ≥17, core)
├── apps/
│   └── demo/           → Vite + React demo → Vercel
├── docs/
│   ├── README.md       Quick start + install
│   ├── API.md          Full API reference
│   ├── CHANGELOG.md
│   ├── CONTRIBUTING.md
│   └── DEMO.md         How to run demo
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── .github/workflows/
    ├── ci.yml          tests + build on PR
    └── release.yml     npm publish on git tag v*
```

---

## Core Package: @devkit-console/core

### Files

| File | Purpose |
|------|---------|
| `src/types.ts` | All TypeScript interfaces (no runtime code) |
| `src/constants.ts` | `LOG_LEVELS` rank map, storage key prefix, defaults |
| `src/emitter.ts` | `TypedEmitter<T>` — generic typed pub/sub |
| `src/storage.ts` | `defaultStorageAdapter`, `noopStorageAdapter` (SSR/test safe) |
| `src/history.ts` | `LogHistory` ring buffer (default 500 entries) |
| `src/logger.ts` | `Logger` class — namespace-scoped, reads/writes through DebugManager |
| `src/manager.ts` | `DebugManager` class — central authority, owns all state |
| `src/window-global.ts` | `installWindowGlobal(manager)` / `uninstallWindowGlobal()` |
| `src/banner.ts` | `printBanner(config)` — ASCII banner on init |
| `src/version.ts` | `VERSION` string injected at build time via tsup `define` |
| `src/index.ts` | Public barrel exports |

### Key Design Differences from Existing `debugLog.ts`

1. **`DebugManager` is a class** (not module-level state) → testable in isolation with `noopStorageAdapter`
2. **Two emitter channels** (not one):
   - `configEmitter: TypedEmitter<DebugConfigChangeEvent>` — fires on level/enable changes
   - `logEmitter: TypedEmitter<LogHistoryChangeEvent>` — fires on every new log entry
   - Prevents React's `LogViewer` from re-rendering on level changes and vice-versa
3. **Named namespaces** — `manager.ns('Auth')` returns a `Logger` with optional per-namespace level override
4. **Log history** — ring buffer with `exportJSON()` / `exportText()` methods
5. **`window.debug` is installed explicitly** — not a side effect of import; `installWindowGlobal(manager)` is called by app init or the exported `debug` singleton auto-installs it

### `window.debug` Surface (extends existing pattern)

```
debug.trace()         Enable TRACE
debug.debug()         Enable DEBUG
debug.info()          Enable INFO
debug.warn()          Enable WARN
debug.error()         Enable ERROR
debug.all()           Alias for trace
debug.disable()       Disable all logging
debug.enable()        Re-enable at INFO
debug.setLevel(L)     Set level programmatically
debug.status()        Print full ASCII banner + namespace list
debug.version()       Print version line only
debug.ns('Name')      Return NamespacedLogger
debug.history()       Return LogEntry[] array
debug.exportLogs(f)   Return JSON or plain-text string
debug.clearHistory()  Clear ring buffer
debug.getConfig()     Return config snapshot
debug._manager        Escape hatch (not in docs)
```

Works directly in Chrome/Firefox DevTools console — no browser extension needed.

### Key Types

```typescript
type LogLevel = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG' | 'TRACE';

interface DebugConfig { 
  enabled: boolean; 
  level: LogLevel; 
  prefix: string; 
  version: string; 
  maxHistorySize: number; 
}

interface LogEntry { 
  id: string; 
  timestamp: number; 
  isoTime: string; 
  level: LogLevel; 
  namespace: string; 
  message: string; 
  data?: unknown; 
}

interface DebugConfigChangeEvent { 
  config: Readonly<DebugConfig>; 
  changedBy: 'console' | 'ui' | 'api'; 
}

interface LogHistoryChangeEvent { 
  entries: ReadonlyArray<LogEntry>; 
  latest: LogEntry; 
}
```

### `packages/core/tsup.config.ts`

```typescript
export default defineConfig({
  entry: ['src/index.ts'], 
  format: ['esm', 'cjs'], 
  dts: true,
  sourcemap: true, 
  clean: true, 
  minify: true, 
  treeshake: true,
  target: 'es2019', 
  external: [],
  define: { __DEVKIT_VERSION__: JSON.stringify(require('./package.json').version) }
});
```

### `packages/core/package.json` key fields

```json
{ 
  "name": "@devkit-console/core", 
  "sideEffects": false,
  "exports": { 
    ".": { 
      "import": "./dist/index.js", 
      "require": "./dist/index.cjs" 
    } 
  },
  "files": ["dist", "README.md", "CHANGELOG.md"] 
}
```

---

## React Package: @devkit-console/react

### Files

| File | Purpose |
|------|---------|
| `src/context.tsx` | `DebugKitProvider` + `DebugKitContext` |
| `src/hooks/useDebugConfig.ts` | `useState(() => manager.getConfig())` + subscribes to configEmitter |
| `src/hooks/useLogHistory.ts` | Subscribes to logEmitter, supports `namespace`/`levels`/`limit` filters |
| `src/hooks/useLogger.ts` | Returns stable memoized `NamespacedLogger` |
| `src/components/DebugPanel.tsx` | Floating panel — composes all sub-components, controlled/uncontrolled open state |
| `src/components/LevelSelector.tsx` | 5-pill group (ERROR/WARN/INFO/DEBUG/TRACE) |
| `src/components/LogViewer.tsx` | Scrollable log list with auto-scroll |
| `src/components/NamespaceList.tsx` | Shows active namespaces, per-ns level overrides |
| `src/components/ExportButton.tsx` | JSON/text download |
| `src/components/StatusBadge.tsx` | Small pill: `● DEBUG` / `○ OFF` |
| `src/components/styles/panel.css` | Scoped CSS, all selectors prefixed `.devkit-` |

### `DebugPanel` Props

```typescript
interface DebugPanelProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  defaultOpen?: boolean;
  open?: boolean;                     // controlled
  onOpenChange?: (open: boolean) => void;
  showLogViewer?: boolean;            // default: true
  showExport?: boolean;               // default: true
  showNamespaces?: boolean;           // default: true
  showVersion?: boolean;              // default: true
  maxVisibleLogs?: number;            // default: 100
  theme?: 'dark' | 'light' | 'auto'; // default: 'auto'
}
```

### Hook Pattern (mirrors existing DebugMenu.tsx)

```typescript
// useDebugConfig.ts
export function useDebugConfig() {
  const { manager } = useContext(DebugKitContext);
  const [config, setConfig] = useState(() => manager.getConfig());
  useEffect(() => manager.onConfigChange(({ config }) => setConfig({ ...config })), [manager]);
  return config;
}
```

---

## Demo App: `apps/demo/`

**Built with:** Vite + React, deployed to Vercel via root-level `vercel.json`.

### Sections

1. **Hero** — headline, `<StatusBadge />`, one-line quickstart snippet
2. **Console Sync Live Demo** — left: console commands list, right: `<LevelSelector />` — changing either reflects in the other immediately
3. **Namespace Demo** — Three simulated services (Auth / Network / Render) with start/stop toggles; log output filtered by namespace in `<LogViewer />`
4. **Scenario Generator** (`SimulatorPanel.tsx`) — buttons:
   - "Trigger 10 INFO logs"
   - "Trigger a WARN burst"
   - "Simulate uncaught error" (captures via `window.onerror` → logs as ERROR)
   - "Rapid TRACE flood" (stress-tests ring buffer)
5. **Export Demo** — `<ExportButton format="both" />`
6. **Feature Grid** — static cards explaining each feature with code snippets

### `apps/demo/vercel.json`

```json
{ 
  "buildCommand": "pnpm --filter demo build", 
  "outputDirectory": "apps/demo/dist", 
  "framework": "vite" 
}
```

---

## Build & Toolchain

- **Package manager:** pnpm workspaces
- **Library build:** `tsup` (wraps esbuild) — emits ESM + CJS + `.d.ts`
- **Demo build:** Vite
- **Tests:** Vitest + happy-dom (same stack as south-lebanon-map)
- **Lint:** ESLint + TypeScript strict

---

## Documentation Files

| File | Contents |
|---|---|
| `docs/README.md` | Install, quick start (3 lines), console commands, `<DebugPanel />` usage |
| `docs/API.md` | Full `DebugManager`, `Logger`, `window.debug`, all React component props |
| `docs/CHANGELOG.md` | Semantic version history |
| `docs/CONTRIBUTING.md` | `pnpm install`, `pnpm -r build`, `pnpm test`, PR guidelines |
| `docs/DEMO.md` | How to run the demo locally + Vercel URL |
| `packages/core/README.md` | npm page content for `@devkit-console/core` |
| `packages/react/README.md` | npm page content for `@devkit-console/react` |

---

## Test Coverage

### `packages/core/src/__tests__/`

| File | What it verifies |
|---|---|
| `manager.test.ts` | enable/disable/setLevel mutate config, persist to storage, emit configEmitter |
| `emitter.test.ts` | subscribe, emit, unsubscribe cleanup, once(), no memory leaks |
| `logger.test.ts` | level inheritance from root, per-namespace override, shouldLog logic |
| `history.test.ts` | ring buffer rollover, exportJSON/exportText format |
| `storage.test.ts` | graceful degradation when localStorage throws, noopAdapter |
| `window-global.test.ts` | install sets window.debug, all surface methods callable, uninstall removes it |
| `integration.test.ts` | Full round-trip: manager.enable() → window.debug.setLevel() → history entry → export |

### `packages/react/src/__tests__/`

| File | What it verifies |
|---|---|
| `useDebugConfig.test.tsx` | Re-renders on configEmitter.emit, returns live config |
| `useLogHistory.test.tsx` | Filters by namespace/level/limit, re-renders on logEmitter.emit |
| `DebugPanel.test.tsx` | Opens on trigger click, controlled open prop, onOpenChange fires |
| `LevelSelector.test.tsx` | All 5 levels render, active state, onChange with correct LogLevel |
| `LogViewer.test.tsx` | Renders entries, empty state, filter prop |

---

## Verification / Acceptance Criteria

1. `pnpm -r build` completes with no errors; `packages/core/dist/index.js` gzip ≤ 15KB
2. All tests pass: `pnpm -r test`
3. In demo app: open browser console, type `debug.debug()` → `<LevelSelector />` shows DEBUG highlighted immediately
4. In demo app: click TRACE in `<LevelSelector />` → console shows `✅ Debug enabled at level: TRACE`
5. Open demo app on mobile → `<DebugPanel />` visible and usable
6. `debug.history()` in console returns array of `LogEntry` objects with correct shape
7. `debug.exportLogs('json')` returns valid JSON string
8. `debug.ns('Auth').warn('test')` → LogViewer shows entry with namespace="Auth"
9. Vercel demo URL loads; all simulator buttons produce console output + LogViewer entries
10. `npm publish --dry-run` from both packages succeeds; no private fields in tarball

---

## Reused Patterns

From south-lebanon-map project (`src/utils/debugLog.ts` + `src/components/DebugMenu.tsx`):

- `window.debug` global API surface design
- localStorage persistence with graceful fallbacks
- Level rank ordering (ERROR > WARN > INFO > DEBUG > TRACE)
- ASCII banner formatting
- Two-emitter pattern (config + log history)
- React hook patterns (`useState` + `useEffect` + `useContext`)
- CSS scoped modules approach

---

## Timeline & Effort Estimate

| Phase | Tasks | Effort | Duration |
|---|---|---|---|
| **1: Setup** | Monorepo setup, tsconfig, package.json | 2 days | Week 1 |
| **2: Core** | DebugManager, Logger, TypedEmitter, storage | 4 days | Week 1-2 |
| **3: React** | Hooks, components, context provider | 4 days | Week 2 |
| **4: Demo** | Demo app, scenarios, styling | 3 days | Week 2 |
| **5: Tests** | 30+ tests across core + react | 3 days | Week 3 |
| **6: Docs** | API docs, README, guides, CHANGELOG | 2 days | Week 3 |
| **7: Polish** | Build optimization, Vercel deploy, npm dry-run | 1 day | Week 3 |
| **TOTAL** | | 19 days | ~3 weeks |

---

## Next Steps

1. Create new GitHub repository `devkit-console`
2. Initialize monorepo with pnpm workspaces
3. Set up base TypeScript, ESLint, Vitest config
4. Implement core package (DebugManager, Logger, storage)
5. Implement React package (hooks, components, context)
6. Build demo app with 5 scenarios
7. Write comprehensive test suite (30+ tests)
8. Deploy demo to Vercel
9. Create full API documentation
10. Publish to npm under `@devkit-console` scope

---

**Created:** 2026-06-27  
**Status:** Plan complete, ready for implementation  
**Target Release:** Q3 2026  
**Maintainer:** ikrigel
