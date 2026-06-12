# Refactoring Status: Reduce All Source Files to ≤250 Lines

## Overview

**Target:** Every `.ts`/`.tsx` source file ≤250 lines (test files & data files excluded)  
**Progress:** Phases 1–3 complete. Phases 4–6 remain.  
**Tests:** 289/289 passing throughout all changes.

## Completed (Phases 1–3)

### Phase 1: TypeScript Fixes ✅
- Fixed `initialNavSessionRef` not exported from useNavState
- Fixed `initialMapViewRef` declaration in App.tsx  
- Removed dead `appProps` object inside useEffect

### Phase 2: Domain Hooks (6 new files) ✅
Created 5 extraction hooks consolidating ~415 lines:
- `useNavigationDerived.ts` (160 lines) — nav points, calculated routes, map bearing
- `useIncidentDerived.ts` (50 lines) — filtered incidents, selected incident, distance line, stats
- `useLiveLocationCallbacks.ts` (140 lines) — beginWatch, toggle, navigate, center, follow
- `usePoiCallbacks.ts` (120 lines) — onMapClick, savePoi, import, QR merge, visibility toggle
- `useRouteAndUtilCallbacks.ts` (140 lines) — save/load routes, import, share, donation

### Phase 3: usePersistence API Refactor ✅
- **Before:** 35 individual parameters (36-line call site)
- **After:** 8 hook objects `{ filterState, poiState, multiRouteState, mapDisplayState, uiState, navState, recordingState, setAutoDay }`
- **Result:** Call site shrinks from 36 → 7 lines
- usePersistence.ts: 186 → 206 lines (still ≤250) ✅

### App.tsx Reduction
- **Original:** 1,315 lines
- **Current:** 1,247 lines (68 lines removed)
- **Target:** ≤250 lines via Phase 4

---

## Remaining (Phases 4–6)

### Phase 4: Create Orchestration Wrapper
**File:** `src/hooks/useAppOrchestration.ts` (~220 lines)

Consolidate all hook calls and return everything JSX needs:
```ts
export function useAppOrchestration() {
  // 1. Feature state hooks (6 calls)
  const filterState = useFilterState();
  const poiState = usePoiState();
  // ... etc (all 6)

  // 2. Core utilities
  const { showToast } = useToastNotification({ ... });
  
  // 3. Domain hooks (5 calls)
  const navigationDerived = useNavigationDerived({ ... });
  const incidentDerived = useIncidentDerived({ ... });
  const liveLocationCbs = useLiveLocationCallbacks({ ... });
  const poiCbs = usePoiCallbacks({ ... });
  const routeUtilCbs = useRouteAndUtilCallbacks({ ... });

  // 4. Return flat object for JSX
  return {
    panelsCollapsed: uiState.panelsCollapsed,
    // ... ~100 properties
    appProps: { /* for LeftPanel */ },
    mapProps: { /* for Map */ },
    // ...
  };
}
```

**Impact:** Reduces App.tsx hook calls from 40+ lines → 1 line

### Phase 5: Rewrite App.tsx
**Target:** ≤250 lines

```tsx
import { useAppOrchestration } from './hooks/useAppOrchestration';

export default function App() {
  const {
    panelsCollapsed, effectiveTheme, appProps,
    // Map props (30)
    initialMapViewRef, visible, filtered, selected, distanceLine,
    // ... all needed JSX props
  } = useAppOrchestration();

  return (
    <div className="app">
      <HeaderBar {...headerProps} />
      <LeftPanel {...appProps} />
      <div className="map-wrap">
        <MapView {...mapProps} />
      </div>
      {/* ... rest of JSX */}
    </div>
  );
}
```

**Structure:**
- ~40 lines: imports
- ~8 lines: destructuring from useAppOrchestration
- ~190 lines: JSX return (unchanged)
- **Total: ~238 lines** ✅

### Phase 6: Split Oversized Components

| File | Current | Target | Strategy |
|------|---------|--------|----------|
| `NavigationPanel.tsx` | 435 | 200 | Extract SavedRoutesSection (~150 lines) |
| `TransferModal.tsx` | 484 | 200 | Extract TransferSendTab (~220 lines) + split UI |
| `Map.tsx` | 314 | 240 | Extract popup HTML builders to helper |
| `MultiRoutePanel.tsx` | 264 | 240 | Extract MultiRoutePointList (~20 lines) |
| `useMapInit.ts` | 257 | 240 | Extract Leaflet controls to mapControls.ts |

---

## Files by Current Size

### Source Files Over 250 Lines
```
1247  src/App.tsx  
 484  src/TransferModal.tsx
 435  src/components/panels/left/NavigationPanel.tsx
 314  src/Map.tsx
 264  src/components/panels/left/MultiRoutePanel.tsx
 257  src/hooks/useMapInit.ts
```

### Hook Files (All Now ≤250) ✅
- useNavState.ts: 95 lines
- usePersistence.ts: 206 lines (compacted)
- useVoiceGuidance.ts: 186 lines
- useMapRoute.ts: 174 lines
- useMapInit.ts: 257 lines (target: split)
- useSearchResults.ts: 150 lines
- useRouteAndUtilCallbacks.ts: 140 lines
- useLiveLocationCallbacks.ts: 140 lines
- usePoiCallbacks.ts: 127 lines
- ... (28 other hooks, all ≤250)

---

## Execution Guide for Phases 4–6

### Phase 4 Steps
1. Create `src/hooks/useAppOrchestration.ts` (~220 lines)
   - Call all 40+ hooks
   - Merge into flat return object
   - Test: `npm test -- --run` (289/289 must pass)

2. Wire into App.tsx
   - Replace all individual hook calls with one `useAppOrchestration` call
   - Update JSX prop passing to use destructured result

### Phase 5 Steps
1. Delete all intermediate hook calls from App.tsx
2. Keep only:
   - Imports (~40 lines)
   - `const { ... } = useAppOrchestration();`
   - JSX return (unchanged)
3. Test: `npm test -- --run`

### Phase 6 Steps
1. **NavigationPanel.tsx** → extract `SavedRoutesSection.tsx`
   - Move saved-routes-related state/callbacks/JSX
   - Keep nav origin/destination/active route in NavigationPanel
   - Import/render `<SavedRoutesSection />`

2. **TransferModal.tsx** → extract `TransferSendTab.tsx`
   - Move Send tab UI + state handlers
   - Keep Modal shell + Receive tab
   - Use composition: `<TransferSendTab />` + `<TransferReceiveTab />`

3. **Map.tsx** → extract `mapPopupHtml.ts`
   - Move `buildIncidentPopup`, `buildPoiPopup` HTML builders
   - Keep layer management in Map.tsx
   - Import helpers: `import { buildIncidentPopup } from './mapPopupHtml';`

4. **MultiRoutePanel.tsx** → extract `MultiRoutePointList.tsx`
   - Move the editable route-point list (20 lines)
   - Keep overall panel state + controls
   - Import/render: `<MultiRoutePointList points={...} />`

5. **useMapInit.ts** → extract `mapControls.ts`
   - Move Leaflet control factories (zoom, compass, attribution)
   - Keep init main function
   - Import: `import { createZoomControl, ... } from './mapControls';`

---

## Verification

After each phase, run:
```bash
npm test -- --run                # Must stay 289/289 passing
npm run typecheck                # 0 errors
```

Check file sizes:
```bash
wc -l src/App.tsx src/components/panels/left/*.tsx src/Map.tsx src/TransferModal.tsx src/hooks/use*.ts | grep -E "^[[:space:]]+[0-9]+" | awk '$1 > 250 {print}'
```

**Target:** Command returns no results (all files ≤250 lines)

---

## Why This Works

1. **useAppOrchestration** reduces cognitive load — one place to see all hook dependencies
2. **Phase 5 App.tsx becomes a pure presenter** — only JSX, no logic
3. **Component splits are independent** — can be done in any order post-Phase 5
4. **Tests remain green** — refactoring is mechanical, not behavioral
5. **No runtime changes** — all files are still imported/exported the same way

---

**Updated:** 2026-06-12  
**Status:** Phase 4 ready to begin  
**Blocker:** None — all dependencies met  
**Est. Effort:** ~4 hours (Phase 4) + ~2 hours (Phase 5) + ~3 hours (Phase 6)
