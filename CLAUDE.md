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

### v3.2 Architecture: Mobile Responsiveness & UX Improvements

**Key improvements in v3.2.0:**
- ✅ **Header scroll on mobile:** `.header-actions` now has `overflow-x: auto` for horizontal scrolling
- ✅ **Search dropdown visibility:** z-index: 1000 ensures dropdown appears above other elements on mobile
- ✅ **Drawer accessibility:** Close buttons always accessible on small screens (flex-shrink: 0, responsive padding)
- ✅ **Responsive breakpoints:** Added ≤600px and ≤420px media queries for optimal mobile UX
- ✅ **Search performance:** Added console logging for debugging onChange events

CSS files affected:
- `src/styles/_layout.css` — Header scroll support (overflow-x, flex properties)
- `src/styles/_dialogs.css` — Drawer responsiveness on mobile (padding, font sizes, z-index)
- `src/styles/_search.css` — Search dropdown styling for mobile (z-index, max-height, responsive buttons)

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

### v3.3.1 Architecture: Map Click Popup Universal Fix

**Bug Fix:** Map-click navigation popup now works everywhere on the map, not just near tagged settlements.

**Root cause:** The `focusTarget` effect in `Map.tsx` was calling `flyTo()` for map-click targets, which could interfere with popup display and prevented popups from appearing in empty areas away from towns.

**Solution:** Refactored focusTarget effect (Map.tsx lines 134–191):
- **Map-click targets** (ID starts with `map-click-`): Create popup and open immediately WITHOUT `flyTo` or `setView`
  - Popup displays at exact click coordinates: `${lat.toFixed(5)}, ${lon.toFixed(5)}`
  - Uses current map zoom level (no animation)
  - Includes navigation buttons (Navigate to, Set as start/end)
  - Works anywhere on map: near towns, in empty areas, on borders, on water
- **Search/incident targets**: Continue using `flyTo` animation with label display

**Key changes:**
- Moved `focusGroup.clearLayers()` before conditional logic (early setup)
- Map-click popup created via `L.popup().setLatLng().setContent().openOn(map)`
- Non-map-click targets still use conditional `setView` (restore) or `flyTo` (search/incidents)
- Added 15 comprehensive tests in `map-click-popup-everywhere.test.ts`

**Test coverage:** 405 total tests (including 15 new map-click tests)

**Impact:** Users can now click anywhere on the map and get a navigation popup with coordinates, without needing nearby settlements. The popup appears immediately at the click location without map movement.

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

### v3.3.2 Architecture: Leaflet Click Event Fix

**Bug Fix:** Map-click popup now fires immediately on single click without requiring drag interaction.

**Root cause:** Using DOM's capturing phase click event fired before Leaflet finished drag detection. Popup would only appear after dragging the map because dragging triggered a re-render.

**Solution:** Switched to Leaflet's native `map.on('click')` event (useMapClickHandler.ts):
- Only fires after Leaflet determines the interaction is NOT a drag
- Leaflet automatically converts screen coordinates to lat/lng
- Integrates properly with Leaflet's internal event system
- Single-click pops up immediately; drag-pan works without unwanted popups

**Key change:**
- Old: `el.addEventListener('click', handleClick, true)` (DOM capturing phase)
- New: `map.on('click', handleMapClick)` (Leaflet native event)

**Impact:** Map-click popups now appear instantly on single clicks anywhere on the map, without requiring drag interaction. Drag-panning works smoothly without triggering unwanted popups.

---

### v3.3.3 Architecture: Town Details on Map Click

**Feature:** Map-click popups now show full town details when clicking within 500 meters of a tagged settlement.

**Implementation:** Enhanced focusTarget effect in Map.tsx (lines 143–195):
- Calculates distance from click point to all Lebanese towns using Haversine formula
- If within 500m radius, displays town popup with:
  - Town name (Hebrew + English)
  - Population estimate
  - Sectarian affiliation (if available)
  - Toggle for additional details (note, coordinates)
  - Navigation buttons (Set as destination, Set as start)
- If beyond 500m, displays simple coordinate popup with navigation buttons
- Marker is placed at actual town location (if nearby) or click location (if standalone)

**Key logic:**
```typescript
const nearbyTown = towns
  .filter(t => t.side === 'LB')
  .map(t => ({ ...t, distance: haversineKm(clickPoint, [t.lat, t.lon]) }))
  .filter(t => t.distance <= 0.5) // 500 meters
  .sort((a, b) => a.distance - b.distance)[0];
```

**Popup content:**
- **Nearby town:** Full `townPopup()` with details toggle
- **Standalone click:** Simple `navBtn()` with coordinates

**Impact:** Users can now discover town information by clicking anywhere on the map. Details automatically appear for nearby settlements without requiring a precise click on the town marker.

### v3.3.4 Architecture: Location Selection Fix

**Bug Fix:** Map-click within 500m of town now shows town details but marks and navigates to the actual clicked location, not the town.

**Root cause:** Navigation buttons in town popup were using town coordinates instead of click coordinates, confusing users about their selected location.

**Solution:** Hybrid popup in Map.tsx (lines 146–158):
- Town info displayed for reference (name, population, sect)
- But marker placed at clicked location
- Navigation buttons use clicked coordinates
- User can learn about nearby town while selecting their exact click point

**Key change:**
```typescript
// Always use click coordinates for navigation
const navBtnHtml = navBtn(props.focusTarget.lat, props.focusTarget.lon, coords);
// Marker placed at clicked location, not town
markerLatLng = [props.focusTarget.lat, props.focusTarget.lon];
```

**Behavior:**
- Click 200m from Sidon → Shows "Sidon" details, marks your click spot, navigates to your location
- Provides both contextual awareness (nearby town info) and precise location selection

### v3.3.5 Architecture: Toggle Button Restoration

**Bug Fix:** Town details toggle button was missing from hybrid map-click popup.

**Root cause:** Hybrid popup code didn't include the toggle button and details wrapper from original `townPopup` function.

**Solution:** Restored toggle UI in Map.tsx (lines 146–157):
- Toggle button ("פרטים ▼") now visible in popup
- Town details hidden by default, shown on toggle click
- Navigation buttons maintain clicked location coordinates
- Matches original town popup UX with location selection improvement

**Popup structure:**
```
[Navigation buttons] (using clicked coordinates)
[Toggle button]
[Town details] (hidden by default)
```

**Impact:** Users can now toggle town details on/off while maintaining their precise click location for navigation.

### v3.3.6 Architecture: Aerial Route Animation Fix

**Bug Fix:** Direct flight route (קוו טיסה ישיר) now shows visible animation like road and foot routes.

**Root cause:** Aerial route used `stroke-dasharray: 0.1px 13px` which created dots too small (0.1px) to see. Animation existed but was invisible.

**Solution:** Increased dot size in routes.css:
- **Before:** `stroke-dasharray: 0.1px 13px` (0.1px dots - nearly invisible)
- **After:** `stroke-dasharray: 4px 6px` (4px visible dots with 6px gaps)
- Updated keyframe period from -13px to -10px to match new period (4+6)
- Animation speed increased to 1.0s for snappier visual feedback

**Visual result:**
- Road route: solid line flowing (28px dash)
- Foot route: dashed line flowing (14px dash, 8px gap)
- Aerial route: NOW VISIBLE dotted line flowing (4px dot, 6px gap) ✨

**Impact:** All three route types now display clear, consistent animations. Users can easily distinguish active routes by the flowing dots/dashes pattern.

---

**Current Version:** v3.3.6 (2026-06-14)  
**Updated:** June 2026  
**Maintainer:** ikrigel
