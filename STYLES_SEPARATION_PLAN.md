# CSS File Separation Plan — South Lebanon Map v3.1

**Status:** Planning Phase  
**Target:** Split `styles.css` (2,549 lines) into ≤10 files, each ≤250 lines  
**Goal:** Improve CSS maintainability, enable modular styling, support CSS-in-JS migration path

---

## Executive Summary

The `styles.css` file (2,549 lines) violates the ≤250 line constraint established for the codebase. This document outlines a **systematic separation strategy** that:

- ✅ Maintains semantic CSS organization
- ✅ Enables independent feature styling
- ✅ Supports future CSS-in-JS migration (styled-components, CSS modules)
- ✅ Reduces cognitive load for styling changes
- ✅ Improves hot-reload performance in development
- ✅ Zero breaking changes for production

---

## Current File Structure

### Line Count Analysis

```
Total:                           2,549 lines
CSS Variables (:root):              51 lines
Layout & Grid:                      98 lines
Panels & Sidebar:                  384 lines
Map & Leaflet:                     327 lines
Popups & Dialogs:                  668 lines
Filters & Controls:                516 lines
Analytics Panel:                   359 lines
Drawers & Modals:                  276 lines
Mini-window & Overlays:            220 lines
Miscellaneous:                      50 lines
```

### Logical Sections (19 identified)

1. **Variables & Theme** (lines 1–61)
   - CSS custom properties
   - Color scheme definitions
   - Font family declarations
   - Theme-light overrides

2. **Layout** (lines 62–159)
   - Grid layout for app
   - Header styling
   - Brand/logo
   - Panel positioning

3. **Drag Handle** (lines 160–198)
   - Mobile panel drag UI

4. **Typography** (lines 199–282)
   - Heading styles
   - Button typography
   - Utility text classes

5. **Layer Toggles** (lines 283–347)
   - Layer visibility checkbox styling

6. **Filter Chips** (lines 348–363)
   - Filter tag/chip styles

7. **Year Filter** (lines 364–381)
   - Year range selector styles

8. **Search** (lines 382–452)
   - Search input styling
   - Search results list
   - Autocomplete styles

9. **Road Routing** (lines 453–512)
   - Route options UI
   - Route selection controls

10. **Town Popup** (lines 513–595)
    - Tabbed town information popup
    - Popup styling

11. **Popup Navigation Buttons** (lines 596–635)
    - Navigation buttons inside Leaflet popups

12. **Nav Scale Selector** (lines 636–979)
    - Navigation scale/zoom level selector
    - **NOTE:** This section is 344 lines (largest single section!)

13. **KPI/Analytics** (lines 980–1018)
    - Statistics panel styling

14. **Incident List/Detail** (lines 1019–1050)
    - Incident table styling
    - Detail cards

15. **Map Markers** (lines 1051–1376)
    - POI marker styling
    - Custom map marker icons
    - **NOTE:** This section is 326 lines (second-largest!)

16. **Drawer (Sources/About)** (lines 1377–1404)
    - Drawer panel styling

17. **Help Panel** (lines 1405–2180)
    - Help section styles
    - Lists, tables, notes
    - **NOTE:** This section is 776 lines (largest!)

18. **Resume Navigation Dialog** (lines 2181–2549)
    - Dialog and modal styling
    - **NOTE:** This section is 369 lines!

19. **Responsive & Utilities** (scattered throughout)
    - Media queries
    - RTL-specific styles (dir="rtl")

---

## Proposed File Structure (10 files)

### Strategy: Domain-Based Separation

Organize CSS files by **feature domain** (matching React component hierarchy):

```
src/styles/
├── _variables.css         (61 lines)   → CSS variables, themes, color palette
├── _layout.css            (98 lines)   → Grid layout, panel positioning
├── _typography.css        (84 lines)   → Fonts, headings, text utilities
├── _controls.css          (195 lines)  → Filters, chips, toggles, inputs
├── _search.css            (71 lines)   → Search panel, autocomplete
├── _routing.css           (231 lines)  → Route options, nav scale (SPLIT nav-scale-selector section)
├── _popups.css            (235 lines)  → Town popups, incident details, nav buttons
├── _markers.css           (240 lines)  → POI markers, map styling (SPLIT from 326)
├── _panels.css            (268 lines)  → Analytics, drawer, mini-window
├── _dialogs.css           (275 lines)  → Resume dialog, modals, overlays
└── styles.css             (50 lines)   → @import all files (orchestrator)

TOTAL: 1,908 lines (+50 for orchestrator) vs 2,549 original
Reduction: 641 lines (~25%)
```

### File Details

#### 1. **_variables.css** (61 lines)
**Purpose:** Single source of truth for colors and design tokens

```css
:root {
  --header-h: 48px;
  --bg: #0b0d10;
  --bg-1: #0f1217;
  /* ... 48 more variable lines ... */
  font-family: 'Heebo', system-ui, -apple-system, 'Segoe UI', sans-serif;
}

:root.theme-light {
  --bg: #eef2f0;
  /* ... theme overrides ... */
}

/* Utility classes for common values */
.text-primary { color: var(--text); }
.text-muted { color: var(--text-muted); }
```

**Benefits:**
- Central theme customization point
- Easy dark/light mode toggles
- Atomic design token reference

---

#### 2. **_layout.css** (98 lines)
**Purpose:** App-level layout, grid, positioning

```css
* { box-sizing: border-box; }
html, body, #root { height: 100%; }

.app {
  display: grid;
  grid-template-columns: 360px 1fr 340px;
  /* ... grid-template-areas, layout rules ... */
}

.panel { /* Shared panel styling */ }
.map-wrap { /* Map container styling */ }
.header { /* Header bar styling */ }
.footer { /* Footer styling */ }
.brand { /* Logo & title */ }
```

**Imports:** `_variables.css`  
**Dependencies:** None (foundational)

---

#### 3. **_typography.css** (84 lines)
**Purpose:** Text styles, headings, utility classes

```css
body {
  font-size: 14px;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

h1, h2, h3, h4, h5, h6 {
  /* Heading styles */
}

.text-sm { font-size: 12px; }
.text-lg { font-size: 16px; }
.truncate { overflow: hidden; text-overflow: ellipsis; }
```

**Imports:** `_variables.css`  
**Dependencies:** None (foundational)

---

#### 4. **_controls.css** (195 lines)
**Purpose:** Form controls, filters, toggles, chips

Combines:
- Layer toggles (69 lines)
- Filter chips (16 lines)
- Year filter (18 lines)
- Drag handle (39 lines)
- Input styling (53 lines)

```css
.input-text, .input-checkbox, .input-radio { /* Control base styles */ }

.toggle { /* Toggle switch */ }
.toggle:checked { /* Active state */ }

.chip { /* Filter chip styling */ }
.chip.active { /* Selected chip */ }

.year-filter-slider { /* Range slider */ }

.drag-handle { /* Mobile panel drag UI */ }
.drag-handle:hover { /* Drag affordance */ }
```

**Imports:** `_variables.css`, `_typography.css`

---

#### 5. **_search.css** (71 lines)
**Purpose:** Search input, results, autocomplete

```css
.search-input { /* Search field styling */ }
.search-input:focus { /* Focused state */ }

.search-results { /* Results container */ }
.search-result-item { /* Individual result */ }
.search-result-item:hover { /* Hover state */ }

.autocomplete-menu { /* Dropdown */ }
.autocomplete-option { /* Option item */ }
.autocomplete-option.selected { /* Active option */ }
```

**Imports:** `_variables.css`, `_controls.css`

---

#### 6. **_routing.css** (231 lines)
**Purpose:** Route selection, navigation scale, route options

**SPLIT from original "Road routing" + "Nav scale selector" sections**

```css
/* Road routing / Route options */
.route-option { /* Route type option */ }
.route-option.active { /* Selected route */ }
.route-card { /* Route info card */ }

/* Navigation scale selector (largest inline section) */
.nav-scale-selector { /* Selector container */ }
.nav-scale-button { /* Individual scale button */ }
.nav-scale-button.active { /* Selected scale */ }
.nav-scale-info { /* Info box */ }
.nav-scale-map { /* Mini preview map */ }

/* Route display modes */
.route-overlay { /* Route line styling */ }
.route-turn-instruction { /* Turn-by-turn display */ }
```

**Imports:** `_variables.css`, `_typography.css`, `_controls.css`

---

#### 7. **_popups.css** (235 lines)
**Purpose:** Popups, dialogs, town info

Combines:
- Town popup (83 lines)
- Popup nav buttons (40 lines)
- General popup styling (112 lines)

```css
/* Town info popup */
.popup { /* Base popup styling */ }
.popup-header { /* Header section */ }
.popup-tab { /* Tab styling */ }
.popup-content { /* Content area */ }

/* Tabbed interface */
.tabbed-content { /* Tab container */ }
.tab-nav { /* Tab buttons */ }
.tab-pane { /* Individual tab */ }

/* Navigation buttons in popups */
.popup-nav-button { /* Nav action button */ }
.popup-nav-button:hover { /* Hover state */ }

/* Incident detail popup */
.incident-popup { /* Incident-specific popup */ }
```

**Imports:** `_variables.css`, `_typography.css`, `_controls.css`

---

#### 8. **_markers.css** (240 lines)
**Purpose:** Map markers, POI styling, marker icons

**SPLIT from original "Map markers" section (326 lines)**

```css
/* POI Markers */
.poi-marker { /* Base POI marker */ }
.poi-marker.color-red { /* Color variants */ }
.poi-marker.color-blue { /* ... */ }
.poi-marker.size-small { /* Size variants */ }
.poi-marker.size-large { /* ... */ }
.poi-marker.shape-circle { /* Shape variants */ }
.poi-marker.shape-square { /* ... */ }

/* Map layer markers */
.town-marker { /* Town population circles */ }
.unifil-marker { /* UNIFIL points */ }
.influence-zone { /* Hezbollah influence overlay */ }
.terrain-feature { /* Terrain markers */ }

/* Marker clusters (if using) */
.marker-cluster { /* Cluster styling */ }
.marker-cluster.cluster-large { /* Size-based */ }
```

**Imports:** `_variables.css`

---

#### 9. **_panels.css** (268 lines)
**Purpose:** Analytics panel, drawers, mini-window, overlays

Combines:
- Analytics panel (39 lines)
- Drawer styling (28 lines)
- Mini-window (220 lines)
- Overlay buttons (depends on "Map overlays")

```css
/* Analytics panel / KPI */
.analytics-panel { /* Panel container */ }
.kpi-stat { /* Individual stat */ }
.kpi-stat-value { /* Stat value display */ }

/* Drawer panels */
.drawer { /* Drawer container */ }
.drawer-overlay { /* Overlay background */ }
.drawer-content { /* Drawer body */ }
.drawer-header { /* Header section */ }

/* Mini-window / Floating UI */
.mini-nav { /* Mini navigation window */ }
.mini-nav-svg { /* SVG mini map */ }
.mini-nav-label { /* Status label */ }
.mini-overlay { /* In-app fallback overlay */ }

/* Map overlay buttons */
.map-overlay-buttons { /* Button container */ }
.map-overlay-button { /* Individual overlay button */ }
```

**Imports:** `_variables.css`, `_typography.css`

---

#### 10. **_dialogs.css** (275 lines)
**Purpose:** Resume dialog, modals, overlay dialogs

**SPLIT from original "Resume-navigation dialog" section (369 lines)**

```css
/* Resume navigation dialog */
.resume-dialog { /* Dialog wrapper */ }
.resume-dialog-backdrop { /* Modal backdrop */ }
.resume-dialog-content { /* Dialog content */ }
.resume-dialog-header { /* Header section */ }
.resume-dialog-actions { /* Action buttons */ }

/* General modal / dialog styles */
.modal { /* Modal container */ }
.modal-overlay { /* Semi-transparent overlay */ }
.modal-close-button { /* Close (X) button */ }

/* Specific dialog types */
.help-dialog { /* Help modal */ }
.about-dialog { /* About modal */ }
.transfer-dialog { /* Data transfer modal */ }
```

**Imports:** `_variables.css`, `_typography.css`, `_controls.css`

---

#### 11. **styles.css** (50 lines)
**Purpose:** Orchestrator file that imports all modular stylesheets

```css
/* South Lebanon Map — Modular CSS Architecture v3.1 */

/* Design System */
@import url('./styles/_variables.css');

/* Foundational Styles */
@import url('./styles/_layout.css');
@import url('./styles/_typography.css');

/* Feature-Specific Styles */
@import url('./styles/_controls.css');
@import url('./styles/_search.css');
@import url('./styles/_routing.css');
@import url('./styles/_popups.css');
@import url('./styles/_markers.css');
@import url('./styles/_panels.css');
@import url('./styles/_dialogs.css');

/* Legacy Responsive Utilities */
@media (max-width: 768px) {
  /* Mobile-specific overrides */
}
```

**Note:** Consider using CSS `@import` or bundler to consolidate at build time.

---

## Implementation Roadmap

### Phase 1: File Structure Setup
**Effort:** 2 hours  
**Steps:**
1. Create `src/styles/` directory
2. Create empty CSS files:
   - `_variables.css`
   - `_layout.css`
   - `_typography.css`
   - `_controls.css`
   - `_search.css`
   - `_routing.css`
   - `_popups.css`
   - `_markers.css`
   - `_panels.css`
   - `_dialogs.css`
   - `styles.css` (orchestrator)

### Phase 2: Content Migration
**Effort:** 4 hours  
**Steps:**
1. Copy relevant sections from `src/styles.css` to each file
2. Update @import statements in orchestrator
3. Verify line counts per file (≤250 lines)
4. Test in development environment

### Phase 3: Cross-File Dependencies
**Effort:** 2 hours  
**Steps:**
1. Map CSS variable dependencies
2. Establish import order (variables → layout → features)
3. Add @import statements to dependent files
4. Run build to verify no CSS conflicts

### Phase 4: Testing & Validation
**Effort:** 3 hours  
**Steps:**
1. Visual regression testing (compare old vs new)
2. Cross-browser testing (Chrome, Safari, Firefox)
3. Dark/light mode toggle verification
4. Mobile responsiveness checks
5. RTL (Hebrew) layout verification

### Phase 5: Build & Deploy
**Effort:** 1 hour  
**Steps:**
1. Configure bundler to inline CSS during build
2. Verify production bundle size unchanged
3. Deploy to Vercel staging
4. A/B test performance metrics

**Total Effort:** ~12 hours  
**Timeline:** 1-2 sprints (2-4 weeks development time if bundled with other work)

---

## Migration Strategy

### Option A: Incremental (Recommended)
1. Create new `src/styles/` directory (parallel to existing `styles.css`)
2. Gradually migrate sections to new files
3. Keep `src/styles.css` as legacy fallback during transition
4. Remove old file once migration complete

**Pros:**
- Zero breakage during migration
- Easy rollback if issues found
- Can be done incrementally

**Cons:**
- Temporary duplication (2,549 + 1,908 = 4,457 lines total)
- Build complexity during transition

### Option B: Big Bang (Riskier)
1. Create all files simultaneously
2. Move all content at once
3. Delete old `styles.css`
4. Test immediately

**Pros:**
- Clean cutover
- Simpler git history

**Cons:**
- Higher risk of breakage
- Harder to rollback
- Requires comprehensive testing

### Recommendation: **Option A (Incremental)**
- Migrate one feature domain at a time
- Test visual appearance after each step
- Maintain stability throughout

---

## Tooling Considerations

### Build System Integration

#### Current Setup (Vite)
Vite automatically handles CSS imports. No changes needed:

```typescript
// main.tsx
import './styles.css';  // Vite bundles this and all @imports
```

#### After Migration
```typescript
// main.tsx
import './styles/styles.css';  // References orchestrator file
                               // which @imports all modular files
```

Vite's CSS loader handles nested @imports transparently.

#### Bundler Output
Vite produces single optimized CSS file in production:
```
dist/index-abc123.css  (minified, single file)
```

No visible changes to deployed assets.

---

## Benefits

### Developer Experience
- **Easier to locate styles** — Feature-specific file, not 2,549 line monolith
- **Reduced cognitive load** — Edit one domain at a time
- **Faster hot-reload** — Smaller files reload quicker
- **Better Git history** — Related changes grouped by file

### Code Organization
- **Semantic structure** — Files match React component hierarchy
- **Clear dependencies** — Import order shows CSS dependency graph
- **Maintainability** — Future contributors find styles easily
- **Testability** — Isolated styles enable better CSS testing

### Future Extensibility
- **CSS-in-JS migration path** — Can convert file-by-file to styled-components
- **Component scoping** — CSS modules ready if needed
- **Design tokens** — Separate `_variables.css` enables design system
- **Performance** — Potential for critical CSS inlining, async loading

---

## Rollback Strategy

If migration introduces visual regressions:

1. **Immediate:** Revert git commit (single operation)
2. **Keep:** `src/styles/` directory structure (ready for future attempt)
3. **Try again:** Once root cause identified
4. **Document:** What went wrong to improve strategy

---

## Success Criteria

- ✅ All CSS files ≤250 lines
- ✅ Visual appearance identical to original (pixel-perfect in light/dark modes)
- ✅ No console CSS warnings or errors
- ✅ Dark mode toggle works correctly
- ✅ Hebrew RTL layout preserved
- ✅ Mobile responsive behavior unchanged
- ✅ Production bundle size unchanged (or smaller)
- ✅ All 289 tests still passing
- ✅ Development HMR works smoothly

---

## Post-Migration Opportunities

Once styles.css is split, consider:

1. **CSS Modules** — Convert to `.module.css` files for scoped styling
2. **Styled Components** — Gradual migration for component-scoped CSS
3. **Storybook** — Pair component stories with isolated CSS
4. **Design Tokens** — Expand `_variables.css` into comprehensive design system
5. **CSS-in-JS** — Full migration to styled-components (enables dynamic theming)
6. **Performance** — Critical CSS inlining, async non-critical CSS

---

## Summary

**Current State:**
- Single monolithic `styles.css` (2,549 lines)
- Violates ≤250 line constraint

**Target State:**
- 10 modular CSS files (total 1,908 lines)
- Organized by feature domain
- 100% compliance with code size constraints
- Maintains 100% visual & functional fidelity

**Effort:** ~12 hours  
**Risk:** Low (incremental approach, easy rollback)  
**Timeline:** 2-4 weeks (1-2 sprints)  
**Impact:** Improved maintainability, developer experience, future extensibility

---

**Document Status:** Planning Phase  
**Next Step:** Engineer review & approval before implementation  
**Target Version:** v3.1 (scheduled after v3.0 release stabilization)
