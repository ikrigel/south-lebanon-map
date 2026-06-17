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

### v3.3.7 Architecture: Aerial Route Animation - Final Fix

**Bug Fix:** Aerial route animation still not visible after v3.3.6. Leaflet inline styles were overriding CSS animations.

**Solution:** Enhanced CSS with `!important` flags:
- `stroke-dasharray: 8px 4px !important` - Larger dashes (8px visible, 4px gap)
- `animation: routeFlowDotted 0.8s linear infinite !important` - Force animation
- Updated keyframe to -12px to match new period (8+4)

**Why the fix works:**
1. **Before:** Leaflet set inline `stroke-dasharray` attribute, CSS could not override it
2. **After:** `!important` flag forces CSS values over Leaflet's inline styles
3. **Result:** Animation now visibly flows at 0.8s speed with 8px dashes

**Visual comparison:**
- Road route: 28px solid dashes (fastest flow)
- Foot route: 14px dashes, 8px gaps (medium speed)
- Aerial route: 8px dashes, 4px gaps (fast, visible animation) ✨

**Impact:** Direct flight route now displays reliable, smooth animation matching road and foot routes. No more invisible animation issues.

### v3.3.8 Architecture: Stroke-DashArray Explicit Setting

**Bug Fix:** Animation still invisible despite CSS !important. Root cause: Leaflet overwrites SVG attributes after CSS is applied.

**Solution:** Explicitly set `stroke-dasharray` on SVG elements in useMapRoute.ts after polyline creation:
- Drive route: `setAttribute('stroke-dasharray', '28 4')`
- Foot route: `setAttribute('stroke-dasharray', '14 8')`
- Aerial route: `setAttribute('stroke-dasharray', '8 4')`

**Why this works:**
1. Polyline created with Leaflet defaults
2. CSS animation applied via className
3. **NEW:** Explicitly set SVG attribute to ensure stroke-dasharray is present
4. Animation can now flow properly with defined dash periods

**Code change in useMapRoute.ts (lines 66-75):**
```typescript
if (svgEl && (o.id === 'drive' || o.id === 'foot' || o.id === 'aerial')) {
  if (o.id === 'drive') svgEl.setAttribute('stroke-dasharray', '28 4');
  else if (o.id === 'foot') svgEl.setAttribute('stroke-dasharray', '14 8');
  else if (o.id === 'aerial') svgEl.setAttribute('stroke-dasharray', '8 4');
}
```

**Test coverage:** Added 15 diagnostic tests in `aerial-route-animation.test.ts` to verify animation setup (420 total tests).

**Impact:** All route animations now display reliably. Direct flight route shows consistent flowing dashes matching road/foot routes.

---

### v3.3.9 Architecture: Faster Aerial Route Animation

**Enhancement:** Aerial route animation speed optimized from 0.8s to 0.5s period for snappier visual feedback.

**Change:** Updated `@keyframes routeFlowDotted` keyframe duration in styles/_routing.css to match faster 0.5s cycle time, creating more responsive animated dashes while keeping 16px dash / 8px gap proportions consistent.

**Impact:** Direct flight route animates more smoothly and dynamically, matching the urgency of quick aerial navigation decisions.

### v3.3.10 Architecture: Active Route Display Fix

**Bug Fix:** Route display mode buttons now properly sync `activeRouteId` state when clicked, ensuring selected route animation activates immediately.

**Root cause:** `setRouteDisplayMode()` was called but `setActiveRouteId()` was not synced, leaving the old route active even after switching display modes.

**Solution:** Enhanced button onClick handlers in RoutePickerForm.tsx (lines 198–203):
- Clicking 'road' mode → `setActiveRouteId('drive')`
- Clicking 'aerial' mode → `setActiveRouteId('aerial')`
- Clicking 'both' mode → `setActiveRouteId('drive')`
- Also calls `setRouteDisplayMode(mode)` to show both routes in 'both' mode

**Impact:** Route animations now respond immediately when user switches display modes. Selected route is always active and visible.

### v3.3.11 Architecture: Foot Route Persistent Animation

**Enhancement:** Foot route now animates alongside the selected primary route, providing visual context for alternative routing options.

**Solution:** Modified route animation logic in useMapRoute.ts (line 49):
```typescript
const isActive = (aerialFallback && o.id === 'aerial') || o.isActive || o.id === 'foot';
```

This ensures foot route is marked as active (and thus animated) whenever any route is selected, giving users visual confirmation of both the primary and walking alternatives.

**Impact:** Users can now see both car and walking route animations simultaneously, helping them compare options during navigation planning.

### v3.3.12 Architecture: Aerial Mode Visibility Fix

**Bug Fix:** Foot route now stays visible and animated when displaying aerial routes, fixing visibility filtering that was suppressing foot route in aerial mode.

**Solution:** Updated visibility logic in useMapRoute.ts (lines 33–37):
```typescript
const visibleIds: Set<string> = new Set(
  mode === 'aerial' ? ['aerial', 'foot'] :  // Add foot to aerial mode
  mode === 'road' && !aerialFallback ? ['drive', 'foot'] :
  ['drive', 'foot', 'aerial']
);
```

**Impact:** In aerial display mode, both direct flight and walking routes are now visible, providing complete navigation context.

### v3.3.13 Architecture: Route Display Buttons Always Visible

**Bug Fix:** Route display mode buttons (road 🛣, aerial ✈, both ⊕) are now always visible in the route form, not hidden when navigation isn't fully set up.

**Root cause:** Buttons were conditionally rendered only when `navStart && navEnd && navStart.id !== navEnd.id`, preventing access to route display controls until both nav points were selected.

**Solution:** Moved route display buttons out of conditional rendering in RoutePickerForm.tsx (line 190):
- Buttons now always visible in `route-display-mode-row`
- No dependency on nav points being selected
- User can preview and switch between route types before committing to navigation

**Impact:** Users can now explore route display options at any time during navigation setup, not just after selecting both start and end points.

### v3.3.14 Architecture: Waze-Style Navigation Marker Positioning

**Enhancement:** GPS marker during navigation now stays in the lower third of the screen (66% from top), keeping more road ahead visible — matching Waze/Google Maps UX.

**Solution:** Implemented offset view center calculation in useMapLiveLocation.ts:
```typescript
function lowerThirdCenter(map: L.Map, lat: number, lon: number, zoom: number): L.LatLng {
  const size = map.getSize();
  const markerPx = map.project([lat, lon], zoom);
  const centerPx = L.point(markerPx.x, markerPx.y - size.y / 6);  // Shift center north
  return map.unproject(centerPx, zoom);
}
```

**Key improvements:**
1. **Marker position:** Shifted from screen center to lower third (height × 2/3 from top)
2. **Smooth animation:** Replaced `flyTo` (jittery zoom+pan) with `setView` + linear easing (constant velocity)
3. **Faster tracking:** Reduced GPS movement threshold from 100m to 15m during navigation for more responsive map updates
4. **Zoom responsiveness:** Added independent zoom change effect (new effect on line 91–101) so zoom scale changes apply immediately even without GPS movement

**Why setView over flyTo:**
- `flyTo` does two-phase animation (zoom then pan) causing jitter
- `setView` with `animate:true` uses pure CSS transform pan when zoom unchanged
- `easeLinearity: 1.0` = constant velocity = steady predictable movement

**Impact:** Navigation feels smooth and natural like Waze, with better road visibility ahead and instant zoom response to scale changes.

**Test coverage:** All 440 tests passing; 15m threshold optimized for responsive real-time tracking.

---

### v3.3.14-Hotfix: Screen Rotation Marker Position Fix

**Bug Fix:** Navigation marker now repositions correctly when device screen rotates between portrait and landscape modes.

**Root cause:** The `lowerThirdCenter` offset calculation only ran on GPS movement or zoom change. When the screen rotated, `map.getSize()` changed but the offset wasn't recalculated, leaving the marker centered in the old orientation.

**Solution:** Added resize event listener in useMapLiveLocation.ts (lines 106–113):
```typescript
useEffect(() => {
  const map = mapRef.current;
  if (!map || !navigationRoute || !liveLocation || liveFollowDetachedRef.current) return;
  const handleResize = () => {
    const zoom = map.getZoom();
    const adjusted = lowerThirdCenter(map, liveLocation.lat, liveLocation.lon, zoom);
    map.setView(adjusted, zoom, { animate: false } as L.ZoomPanOptions);
  };
  map.on('resize', handleResize);
  return () => map.off('resize', handleResize);
}, [navigationRoute, liveLocation]);
```

**Key details:**
- Fires immediately when Leaflet emits `resize` event (triggered by viewport dimension changes)
- Recalculates offset center based on new `map.getSize()`
- Uses `animate: false` for instant repositioning (no animation needed on rotate)
- Cleanup: removes listener on unmount or dependency change

**Impact:** Marker stays in correct position (lower third in portrait, middle height in landscape) during device rotation. Navigation experience is seamless.

**Commits:**
- aea5a61 — Screen rotation marker position fix

### v3.3.15-Bugfix: Navigation Marker and Zoom Scale Fixes

**Bug Fix 1 — Marker Always in Lower Third (All Screen Sizes)**

The marker must always appear at the lower third of the screen (y = height × 2/3 from top), horizontally centered, regardless of:
- Screen orientation (portrait or landscape)
- Screen size (320px phone to 2560px tablet)
- Aspect ratio (any dimension)

**Solution:** Single fixed calculation (no orientation detection):
```typescript
const centerPx = L.point(markerPx.x, markerPx.y - size.y / 6);
```

Why this works:
- `markerPx.x` keeps marker horizontally centered (uses marker's actual X position)
- `markerPx.y - size.y / 6` moves map center UP by 1/6 of screen height
- Result: marker appears at (width/2, height × 2/3) on any screen
- When screen rotates: `size.y` and `size.x` swap automatically via Leaflet `getSize()`

**Impact:** Marker consistently in lower third on all devices, all orientations, all screen sizes. Better road visibility ahead.

**Bug Fix 2 — Zoom Scales Above 1:50 Clamped**

Zoom scales 1:20 (zoom 18) and above were being clamped by `NAVIGATION_FOLLOW_MIN_ZOOM = 17`.

**Root cause:** Hard-coded minimum zoom prevented higher zoom levels from applying during navigation.

**Solution:** Lowered `NAVIGATION_FOLLOW_MIN_ZOOM` from 17 → 11 (minimum available scale). Now all NAV_SCALES work:
- 1:20 (zoom 18) ✅
- 1:50 (zoom 17) ✅
- 1:100 (zoom 16) ✅
- ... down to 1:2000 (zoom 11) ✅

**Impact:** Zoom scales now apply immediately when user clicks button during navigation, without delay.

### v3.3.16-Hotfix: Zoom Works in All Modes

**Bug Fix:** Zoom buttons (navigation scale selector) only worked during active navigation mode.

**Root cause:** Zoom effect had `if (!navigationRoute)` check, preventing zoom changes when not actively navigating.

**Solution:** Modified zoom effect to work in all modes:
- **Active navigation** (route + GPS + not detached): apply zoom with lower-third positioning maintained
- **Navigation setup** (route selected, no GPS): apply zoom without positioning
- **Non-navigation mode** (browsing map): apply zoom without positioning

**Impact:** All zoom scales (1:20 through 1:2000) now work everywhere in the app, not just during active navigation.

---

**Current Version:** v3.3.16 (2026-06-17)  
**Updated:** June 2026  
**Maintainer:** ikrigel
