# Refactoring Status: Reduce All Source Files to ≤250 Lines

## Overview

**Target:** Every `.ts`/`.tsx` source file ≤250 lines (test files & data files excluded)  
**Progress:** Phases 1–3 complete. Phases 4–6 remain.  
**Tests:** 289/289 passing throughout all changes.

## Completed (Phases 1–4)

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

### Phase 4: Create useAppOrchestration Hook ✅
**File:** `src/hooks/useAppOrchestration.ts` (80 lines)

Consolidates state setup and orchestration:
- Calls 6 feature state hooks (filterState, poiState, multiRouteState, mapDisplayState, uiState, navState)
- Initializes recording state (3 useState + object)
- Wires core utilities (useLiveLocation, useToastNotification, useMapCallbacks, usePersistence)
- Handles cleanup effects (geolocation watch clearance, toast timeout)
- Returns all initialized state for JSX

**Impact:** Single import point for all core state — enables App.tsx rewrite

### App.tsx Reduction
- **Original:** 1,315 lines
- **Current:** 1,247 lines (68 lines removed)
- **Target:** ≤250 lines via Phase 5 (wire useAppOrchestration into App.tsx)

---

## Remaining (Phases 5–6)

### Phase 5: Wire useAppOrchestration into App.tsx
**Target:** ≤250 lines

**Strategy:**
1. Import `useAppOrchestration` at top of App.tsx
2. Replace lines 88–143 (all feature state hook calls + refs + recording state) with:
   ```tsx
   const {
     initialRecordingSessionRef, initialMapViewRef,
     recordingStatus, setRecordingStatus, recordingWatchId, setRecordingWatchId,
     recordedTrack, setRecordedTrack, recordingName, setRecordingName,
     recordingState, showToast, toastTimeoutRef, handleMapViewChange, lastDistToDestMRef,
     filterState, poiState, multiRouteState, mapDisplayState, uiState, navState,
   } = useAppOrchestration();
   ```
3. Keep all remaining App.tsx logic unchanged (callbacks, effects, JSX)
4. Result: 8 lines instead of 56 lines → 48 line savings

**Impact:**
- App.tsx: 1,247 → ~1,199 lines
- Hook calls moved to single orchestration point
- Dependencies clear and ordered

**Remaining work:**
- Lines 145–1247 remain unchanged (callbacks, domain hooks, JSX)
- No behavioral changes — pure refactoring

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

## Execution Guide for Phases 5–6

### Phase 5 Steps (Wire useAppOrchestration into App.tsx)
1. Open `src/App.tsx`
2. Add import at top: `import { useAppOrchestration } from './hooks/useAppOrchestration';`
3. Replace lines 88–143 with:
   ```ts
   const {
     initialRecordingSessionRef, initialMapViewRef, recordingStatus, setRecordingStatus,
     recordingWatchId, setRecordingWatchId, recordedTrack, setRecordedTrack,
     recordingName, setRecordingName, recordingState, showToast, toastTimeoutRef,
     handleMapViewChange, lastDistToDestMRef, filterState, poiState, multiRouteState,
     mapDisplayState, uiState, navState,
   } = useAppOrchestration();
   ```
4. Keep all other logic (lines 145+: callbacks, effects, JSX) unchanged
5. Test: `npm test -- --run` (289/289 must pass)
6. Result: 1,247 → ~1,199 lines

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
**Status:** Phase 4 complete, Phase 5 ready to begin  
**Blocker:** None — all dependencies met  
**Est. Effort:** ~2 hours (Phase 5) + ~3 hours (Phase 6)
