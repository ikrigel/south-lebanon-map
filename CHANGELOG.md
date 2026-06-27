# Changelog

All notable changes to the South Lebanon Map project are documented here.

## [4.6.1] - 2026-06-27

### Features

- **GPS Arrow Always Visible**: Arrow now shows your location 100% of the time when GPS is enabled, not just during active navigation
- **Complete Map Style Selector**: New dedicated "Map Style" section with three mutually exclusive options:
  - 🗺️ Base — Regular dark/light theme map
  - 🛰️ Satellite — ESRI satellite imagery  
  - ⛰️ Topo — Topographic/terrain map
- Visual feedback with blue borders indicating selected map style
- Easy one-click switching between map styles

### Bug Fixes

- Map now auto-centers on GPS location in all modes (navigation, browsing, compass, etc.)
- Arrow visibility no longer conditional on navigation mode

### Technical

- Removed display condition on arrow overlay in Map.tsx
- Enhanced LayerTogglesSection with 3-column button layout
- Updated all version displays to 4.6.1

---

## [4.6.0] - 2026-06-27

### Features

- **Satellite Map Layer**: Added ESRI World Imagery tileset for satellite view
- **Location Indicator**: Blue pulsing dot shows your GPS location at all times
- **GPS Tracking Fix**: Map continuously pans to keep location under arrow in all modes

### Bug Fixes

- Fixed map drift during rotation - arrow now stays perfectly centered
- Arrow positioned using CSS overlay instead of Leaflet marker
- Continuous GPS tracking ensures map follows your location

### Technical

- New CSS overlay system for arrow positioning (.nav-arrow-overlay)
- Added location indicator dot with pulsing animation
- Continuous panTo() effect for GPS tracking
- All 519 tests passing

---

## [2.0.0] - 2025-06-06

### Major Changes - Complete Architecture Refactoring

This release represents a comprehensive refactoring to improve code maintainability, testability, and scalability. The application functionality remains unchanged, but the codebase is now organized into 54 focused modules instead of 4 monolithic files.

### Added

#### Phase 1: Data & Type Organization
- `src/data/rivers.ts` — Geographic polylines (Blue Line, Litani River, etc.)
- `src/data/towns.ts` — Town data with sectarian classifications (230+ towns)
- `src/data/features.ts` — Terrain features, UNIFIL points, influence zones
- `src/data/incidents.ts` — Security incidents (2021–2025)
- `src/types.ts` — Centralized TypeScript type definitions (25+ types)
- `src/constants.ts` — Centralized constants (40+ module-level constants)

#### Phase 2: Utility Functions
- `src/navigation/turnHelpers.ts` — Turn instruction composition (145 lines)
- `src/navigation/routeParsers.ts` — OSRM/Valhalla route parsing (160 lines)
- `src/navigation/externalNav.ts` — External navigation (Waze/Maps) deep linking
- `src/storage/storage.ts` — localStorage wrappers, Voice API helpers
- `src/storage/normalize.ts` — POI validation
- `src/storage/loaders.ts` — Data hydration helpers
- `src/storage/navSessionLoader.ts` — Navigation session reconstruction
- `src/storage/sessionLoaders.ts` — Session state loaders

#### Phase 3: Custom Hooks
- `src/hooks/usePersistence.ts` — localStorage synchronization effects (170 lines)
- `src/hooks/useRouteCalculation.ts` — OSRM/Valhalla routing with AbortController (160 lines)
- `src/hooks/useLiveLocation.ts` — GPS position throttling (15m movement threshold)
- `src/hooks/useRecording.ts` — GPS track recording with deduplication (130 lines)
- `src/hooks/useRouteOptions.ts` — Memoized drive/foot/aerial route options (90 lines)
- `src/hooks/useVoiceGuidance.ts` — Web Speech API voice guidance (195 lines)

#### Phase 4: JSX Components
- `src/components/drawers/SourcesDrawer.tsx` — Sources and attribution drawer
- `src/components/drawers/SupportDrawer.tsx` — Support/donation drawer
- `src/components/drawers/AboutDrawer.tsx` — About drawer with version display (v2.0.0)
- `src/components/ResumeNavDialog.tsx` — Resume navigation dialog
- `src/components/MiniOverlay.tsx` — Mini overlay navigation HUD
- `src/components/panels/RightPanel.tsx` — Analytics and incident list/detail view
- `src/components/panels/left/MapSearchSection.tsx` — Map search with navigation
- `src/components/panels/left/LayerTogglesSection.tsx` — Layer visibility controls
- `src/components/panels/left/FilterSection.tsx` — Year/type/severity filters and search
- `src/components/panels/left/RecordingSection.tsx` — GPS track recording UI
- `src/components/panels/left/PoiSection.tsx` — POI management and customization

#### Phase 5: Map Utilities
- `src/mapTypes.ts` — MapHandle, LayerVis, MapProps type exports
- `src/mapHtml.ts` — HTML generation helpers, constants for map rendering

#### Phase 6: Transfer Utilities
- `src/transfer/transferTypes.ts` — QR transfer type definitions
- `src/transfer/transferHelpers.ts` — Payload encoding/decoding, path downsampling

#### Phase 7: CSS Modularization
- `src/styles/variables.css` — CSS custom properties, dark/light themes (56 lines)
- `src/styles/layout.css` — Grid layout, panels, header, footer (157 lines)
- `src/styles/buttons.css` — Button styles, theme switcher (76 lines)
- `src/styles/controls.css` — Layer toggles, filters, search (161 lines)
- `src/styles/nav-form.css` — Route form, navigation scale selector (282 lines)
- `src/styles/popups.css` — Town popups, nav buttons (123 lines)
- `src/styles/nav-hud.css` — Navigation HUD, compass, rotation controls (194 lines)
- `src/styles/markers.css` — Leaflet overrides, labels, sect colors (165 lines)
- `src/styles/routes.css` — Route line animations (153 lines)
- `src/styles/analytics.css` — KPI grid, incident cards (68 lines)
- `src/styles/poi.css` — POI pins, live location marker (144 lines)
- `src/styles/drawer.css` — Drawer panel styling (130 lines)
- `src/styles/help.css` — Help panel styling (400 lines)
- `src/styles/measure.css` — Measure HUD, rotation controls (133 lines)
- `src/styles/dialogs.css` — Dialog styling (120 lines)
- `src/styles/mobile.css` — Responsive mobile styles (225 lines)

#### Documentation & Configuration
- `COMPLETE-PHASE-7-8.md` — Comprehensive completion guide
- `CSS-SPLIT-PLAN.md` — CSS modularization plan

### Changed

- **Architectural refactoring**: 4 monolithic files (9,700 lines) → 54 focused modules
- **styles.css**: Now a barrel import (17 lines) importing 16 focused CSS modules
- **App.tsx**: Now a composition root orchestrating extracted hooks and components
- Improved code organization: data layer → utilities → hooks → components
- Enhanced testability: All utilities are pure functions (React-free)
- Better maintainability: Each module has single responsibility (≤300 lines)

### Improved

- **Code Quality**:
  - Zero circular dependencies
  - All utilities React-free and reusable
  - All components props-only (stateless)
  - Clean separation of concerns

- **Maintainability**:
  - 54 focused files instead of monolithic structure
  - Clear data flow (top-down via props)
  - Easy to locate and modify features
  - Consistent naming and organization

- **Testability**:
  - Custom hooks enable isolated logic testing
  - Pure utilities are unit-testable
  - Components testable via props
  - All 289 tests passing

### Fixed

- None (all functionality preserved)

### Removed

- Duplicate type definitions (consolidated into `types.ts`)
- Embedded constants (moved to `constants.ts`)
- Monolithic CSS structure (split into 16 focused files)

### Security

- No security changes
- All localStorage access patterns verified
- No new external dependencies

### Performance

- No performance regressions
- CSS bundled identically (52.97 kB, gzipped 10.58 kB)
- JavaScript bundle unchanged (666.29 kB)
- No runtime impact from refactoring

### Testing

- ✅ All 289 tests passing
- ✅ Zero TypeScript errors
- ✅ Production build successful
- ✅ CSS compilation verified

### Deployment

- Deployed to Vercel via GitHub Actions
- Automated tests before deployment
- Safe zero-downtime update

---

## [1.0.0] - Initial Release

### Features
- Interactive map of South Lebanon region (Blue Line to Litani River)
- Security incident visualization (2021–2025)
- UNIFIL points and Hezbollah influence zones
- Town/settlement data with sectarian information
- Turn-by-turn navigation (OSRM routing)
- Live location tracking with compass
- GPS track recording
- Voice guidance (Hebrew/English)
- POI management and sharing
- QR code peer-to-peer data transfer
- Dark/light theme support
- RTL Hebrew UI

---

## Development

For the complete refactoring details, see:
- `COMPLETE-PHASE-7-8.md` — Full implementation guide
- `CSS-SPLIT-PLAN.md` — CSS organization details
- Git log — Individual phase commits

---

**Version:** 2.0.0  
**Release Date:** June 6, 2025  
**Build Status:** ✅ Passing (289/289 tests)  
**Deployment:** ✅ Safe (CI/CD verified)
