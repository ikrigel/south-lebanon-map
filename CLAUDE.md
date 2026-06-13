# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Start

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # Run Vitest suite
npm run build        # Production bundle to ./dist
npm run typecheck    # Type check without emitting
```

**Single test:** `npm test -- --run coord-popup-nearby.test.ts`

## Project Overview

**South Lebanon Map** is a static Vite + React + Leaflet analytical dashboard for the area between the Blue Line and Litani River. It visualizes security incidents, UNIFIL points, Hezbollah influence zones, topography, towns and custom user data (routes, POIs, recordings).

- **Language:** Hebrew (RTL) with English fallbacks
- **Hosting:** Vercel (static export)
- **Production:** https://south-lebanon-map.vercel.app/
- **No backend:** All data persisted to browser localStorage + QR peer-to-peer transfer

## Architecture

### Core Files

- **`src/App.tsx`** (218 lines) — Main controller:
  - Imports useAppWiring hook for all state orchestration
  - Minimal JSX rendering (components + props spreading)
  - All logic delegated to specialized hooks
  - ✅ **REFACTORED in v3.0.0** — Reduced from 1,248 → 218 lines (82.5% reduction)
  - See `IMPROVEMENTS_v3.0.0.md` for complete refactoring documentation
  
- **`src/Map.tsx`** — Leaflet wrapper:
  - Layer group management (population, UNIFIL, influence zones, labels)
  - Distance/measure overlays
  - Map search autocomplete
  - Exports `MapHandle` ref type for external map control

- **`src/TransferModal.tsx`** — QR code peer-to-peer data transfer:
  - Send tab: encodes POIs, routes, recordings, multi-routes to QR
  - Receive tab: scans QR codes and merges into app state (deduplicates by id)
  - Uses `qrcode.react` for generation, `jsqr` for scanning

- **`src/data/geo.ts`** — Geospatial data:
  - `incidents[]` — security events (2021–2025) with lat/lon/type/severity
  - `towns[]`, `unifilPoints[]`, `terrainFeatures[]`, `influenceZones[]`
  - `blueLine` polyline, `litani` river geometry

- **`src/data/sources.ts`** — External source URLs (UNIFIL, UN OCHA, Reuters, etc.)

- **`src/util.ts`** — Shared utilities:
  - Haversine distance, polyline distance, format helpers (`fmtDate`, `fmtKm`)
  - Safe text escaping, bearing/direction labels

### v3.0.0 Architecture: Hook-Based State Management

All state is managed via **specialized React hooks** orchestrated by `useAppWiring.ts`:

**Hook Ecosystem (27 hooks total):**
1. **Core Orchestration:** `useAppOrchestration` (pulls all base state from localStorage)
2. **Navigation:** `useNavigationDerived`, `useRouteCalculation`, `useRouteOptions`
3. **Route Management:** `useRouteManagement` (save/load/import)
4. **Live Location:** `useLiveLocationActions` (GPS, compass, recording resume)
5. **UI State:** `useUiState`, `useMapDisplayState`, `useFilterState`, `usePoiState`, `useMultiRouteState`
6. **Data Processing:** `useIncidentFiltering`, `useIncidentDistances`, `useSearchResults`
7. **Map/Window:** `useMiniWindow`, `useMapCallbacks`, `useMapInit`, ... (6 map-specific hooks)
8. **Actions:** `usePoiManagement`, `useQrImportHandlers`, `useAppUtilities`, `useMapInteraction`, `useViewReset`, `usePanelCallbacks`
9. **Misc:** `useRecording`, `useCurrentTurnInstruction`, `useToastNotification`

**Key Pattern:**
- Each hook is **≤250 lines** with explicit `Props` interface
- `useAppWiring.ts` (~380 lines) calls all hooks and returns merged state to App.tsx
- App.tsx remains pure render function (~218 lines)

**Example: Adding a Feature**
```typescript
// 1. Create src/hooks/useMyFeature.ts
interface UseMyFeatureProps { requiredState: Type; ... }
export const useMyFeature = (props: UseMyFeatureProps) => { ... };

// 2. Wire in useAppWiring.ts
const myFeature = useMyFeature({ ...props });
return { ...myFeature, ... };

// 3. Use in App.tsx
const { myFeature } = useAppWiring();
```

### v3.1 Architecture: Modular CSS Organization

CSS has been split into **10 semantic files** organized by feature domain:

**Design System:**
- `src/styles/_variables.css` (50 lines) — CSS custom properties, color palette, fonts

**Foundational:**
- `src/styles/_layout.css` (153 lines) — Grid layout, panels, header, footer, map positioning
- `src/styles/_typography.css` (49 lines) — Text styles, buttons, theme controls

**Features:**
- `src/styles/_controls.css` (130 lines) — Form controls, toggles, filters, chips, drag handles
- `src/styles/_search.css` (77 lines) — Search input, results, navigation buttons
- `src/styles/_routing.css` (385 lines) — Route forms, nav scale selector, voice guidance
- `src/styles/_popups.css` (182 lines) — Leaflet popups, town info, navigation buttons
- `src/styles/_markers.css` (263 lines) — Map markers, labels, routes, live location, POI
- `src/styles/_panels.css` (523 lines) — Analytics, drawers, mini-window, incident cards
- `src/styles/_dialogs.css` (637 lines) — Resume dialog, modals, transfer modal, buttons

**Orchestrator:**
- `src/styles.css` — Master file importing all modular CSS + responsive media queries

**Key Metrics:**
- Original: 2,549 lines → Modularized: 2,449 lines (~100 lines of cleanup)
- 10 semantic files organized by feature domain
- All imports resolve via Vite CSS loader
- Responsive breakpoints preserved (1350px, 1100px, 760px, 420px)
- Zero breaking changes; identical runtime behavior

**Maintenance Notes:**
- CSS variables are single source of truth for theming (dark/light modes)
- Feature-specific CSS grouped together for easier editing
- Responsive queries at bottom of main `styles.css` file
- Import order matters: variables first, then layout/typography, then features

### State Management Pattern (Legacy Documentation)

All component state lives in React hooks using `useState` + `useCallback`. Key patterns:

1. **localStorage persistence:** Each feature has a storage key constant (e.g., `POI_STORAGE_KEY`) and a `useEffect` that syncs state to disk on change
2. **Type safety:** Types defined at top of App.tsx (e.g., `CustomPoi`, `SavedRoute`, `RoadRoute`, `ThemeMode`)
3. **Computed state:** `useMemo` for expensive queries (filters, search results)
4. **Refs for unstable values:** `useRef` stores objects passed to event handlers to prevent stale closure bugs

### Data Flow

1. Map interactions (click, layer toggle) → state change in App
2. State change → localStorage update via `safeStorageSet()`
3. Re-render propagates new props to Map, TransferModal, UI panels
4. Voice guidance, live location watch: async callbacks write to state

### Important Constants

Located at App.tsx lines 10–199:

- `TYPES`, `SEVS` — incident filter options
- `POI_COLORS`, `POI_SHAPES`, `POI_SIZES` — customization options
- `MAX_ROUTE_POINTS`, `MAX_IMPORTED_POIS`, `MAX_ROUTE_FILE_BYTES` — validation bounds
- `DEFAULT_LAYER_VISIBILITY` — initial layer state
- `NAV_SCALES`, `DEFAULT_NAV_SCALE_LABEL` — zoom levels during navigation
- Storage key constants: `POI_STORAGE_KEY`, `NAV_SESSION_KEY`, `THEME_STORAGE_KEY`, etc.

### localStorage Schema

**Key persistence patterns (13 localStorage keys):**

| Key | Type | Notes |
|---|---|---|
| `map:custom-pois:v1` | `CustomPoi[]` | User-created points of interest |
| `map:saved-routes:v1` | `SavedRoute[]` | Calculated/recorded routes |
| `map:multi-routes:v1` | `MultiPointRoute[]` | Multi-waypoint routes |
| `map:navigation-session:v1` | `LocalNavSession` | Active nav (origin, dest, live state) |
| `map:recorded-track:v1` | `LocalRecordingSession` | GPS track recording |
| `map:theme-mode:v1` | `ThemeMode` | dark \| light \| auto |
| `map:layer-visibility:v1` | `LayerVis` | Boolean per layer |
| `map:last-map-view:v1` | `LocalMapView` | Center (lat/lon) + zoom |
| `map:label-preferences:v1` | `LocalLabelPreferences` | largeLabels, allLabels flags |
| `map:ui-state:v1` | `LocalUiState` | panelsCollapsed, panelHeight, rotation |
| `map:filter-state:v1` | `LocalFilterState` | Year range, type/severity filters |

All keys prefixed `south-lebanon-map:` in actual code. Version suffix (`:v1`) allows safe migration.

### Testing

**Test runner:** Vitest (configured in `vite.config.ts`)

**Existing test files (147 tests, all passing):**
- `geo-data-integrity.test.ts` — coordinate bounds, names, sect labels
- `map-center-drift.test.tsx` — map pan/zoom stability, rotation
- `app-state-persistence.test.ts` — localStorage round-trip
- `localStorage-persistence.test.tsx` — r/w semantics, defaults
- `coord-popup-nearby.test.ts` — town detection within 500m

**Setup:** `src/test/setup.ts` configures jsdom, localStorage mock, Leaflet stubs

## Key Features & Implementation Notes

### Navigation (Lines ~1000–1350)
- Origin/destination: named nav points or custom map-tapped coordinates
- Three route types: drive (OSRM), foot (OSRM), aerial (great-circle)
- Active route persisted in localStorage with full geometry + turn instructions
- Resume dialog on load if session < 48 hours old

### Live Location & Compass (Lines ~1024–1053)
- Geolocation watchPosition() callback throttled to 15 m movement
- Compass mode toggles between north-up and heading-up rotation
- Rotation locked to snap angles (0, 45, 90, etc.) via picker
- User can manually rotate or reset to north

### Voice Guidance (Lines ~1058–1070)
- Web Speech API: Hebrew or English (language selectable)
- Three modes: off, basic (route/distance), detailed (origin/dest/heading/accuracy)
- Turn instructions recalculated from active route on position update
- Turn audio rate-limited (no repeat within bucket)

### Route Recording (Lines ~1055–1070, 1249–1256)
- watchPosition() callback appends points to recordedTrack state
- Persisted in localStorage with recordingActive flag
- Can export to JSON or transfer via QR code

### POI Management (Lines ~1097–1104)
- Add mode: tap map to place temporary draft marker
- Customization: name, description, color (6 options), shape (4 options), size (3 sizes)
- Deduplication by id on import
- Export/import via JSON or QR

### QR Transfer (TransferModal.tsx)
- Send: selects which data to export, encodes to QR (max ~2950 chars)
- Routes downsampled to ≤60 points to fit QR capacity; full routes use JSON
- Receive: scans QR in real-time using jsqr; merges by id
- No server, no internet required

## Future Development

**Planned phases** (see `docs/FEATURE_PLAN.md`):
1. **Firebase Auth** — Google + email/password login
2. **Firestore** — cloud persistence for routes, POIs, analytics
3. **Spotify integration** — in-app player widget (PKCE OAuth)
4. **Feedback system** — bug/feature/compliment submission
5. **Admin dashboard** — separate Vercel project for usage analytics

**Firestore schema ready in FEATURE_PLAN.md.** When implementing Auth, add:
- `src/auth/AuthContext.tsx` — Redux-like auth state provider
- `src/auth/useAuth.ts` — custom hook
- Update App.tsx to wrap with AuthProvider

## Code Style & Patterns

- **Types:** TypeScript interfaces/types at file top (not inline `as X`)
- **Constants:** UPPER_SNAKE_CASE for module-level constants
- **Utility functions:** Pure functions grouped by domain (e.g., all turn-instruction logic in lines 214–399)
- **No external state library:** All state via React hooks (useState/useCallback/useMemo)
- **Safe storage:** Always use `safeStorageGet/Set` to handle embedded browser blocks
- **Safe text:** Use `safeText()` helper to escape/sanitize user input and external data

## Testing Strategy

1. **Unit:** Utility functions (distance, formatting, OSRM parsing)
2. **Integration:** Component render + state updates with mocked localStorage
3. **E2E:** Playwright tests planned (see TESTING section below)
4. **Manual QA:** Checklist in `docs/TEST_PLAN.md`

**Run all tests:** `npm test -- --run`  
**Watch mode:** `npm test`  
**Coverage:** `npm test -- --run --coverage`

## Refactoring Priorities

**Completed (v3.0.0):**
- ✅ App.tsx: 1,248 → 218 lines (82.5% reduction via 27-hook ecosystem)
- ✅ All 111 source files now ≤250 lines (100% compliance)
- ✅ CSS modularization (v3.1): 2,549 → 10 semantic files

**Future Enhancements:**

```
src/
  features/
    navigation/      ← Navigation state, OSRM routing
    navigation/
      useNavigation.ts       ← Route calculation, turn instructions
      navState.ts            ← State init/persist
      RoutingPanel.tsx       ← UI for origin/dest/route display
    
    liveTracking/    ← Live location + compass + recordings
      useLiveLocation.ts
      useRecording.ts
      CompassPanel.tsx
      RecordingPanel.tsx
    
    poi/             ← POI CRUD + customization
      usePoi.ts
      PoiPanel.tsx
      PoiForm.tsx
    
    filters/         ← Incident filter state
      useIncidentFilter.ts
      FilterPanel.tsx
    
    voice/           ← Voice guidance
      useVoiceGuidance.ts
      VoicePanel.tsx
    
    transfer/        ← QR/JSON import/export (stays as TransferModal)
```

**Criteria for split:**
- Each module ≤250 lines
- Clear responsibility (one feature per module)
- Shared state hooks (e.g., `useNavigation`, `useLiveLocation`) 
- Co-located components

## Deployment

**Static export:** `npm run build` outputs to `./dist`  
**Vercel:** Connected to `main` branch; auto-deploys on push  
**Environment:** No env vars needed (all data is client-side)

---

**Updated:** June 2026  
**Maintainer:** ikrigel
