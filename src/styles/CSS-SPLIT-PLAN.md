# Phase 7 — CSS Split Completion Guide

## Current Status
✅ variables.css — CSS custom properties, themes, base reset (50 lines)
✅ layout.css — Grid, panels, header, footer, map wrapper (140 lines)
✅ buttons.css — Button styles, theme switch (70 lines)

## Remaining Files to Create

### 1. controls.css (~200 lines)
**Source: styles.css lines 283–437**
- Layer toggle rows: `.toggle-row`, `.toggle-label`, `.toggle-switch`
- Filter chips: `.chips`, `.chip`
- Year range select: `.year-range`, `.year-summary`
- Search inputs: `.search`, `.search-results`, `.search-result-row`, `.search-result`
- Navigate button group: `.navigate-btn-group`, `.navigate-here-btn`

**Extract pattern:**
```bash
sed -n '283,437p' src/styles.css > src/styles/controls.css
```

### 2. nav-form.css (~200 lines)
**Source: styles.css lines 453–680**
- Route form: `.route-form`, `.route-picker-grid`, `.route-picker`
- Route actions: `.route-actions`
- Route summary: `.route-summary`
- Route option list: `.route-option`, `.route-option-label`
- Nav scale selector: `.nav-scale`, `.nav-scale-label`

**Extract:**
```bash
sed -n '453,680p' src/styles.css > src/styles/nav-form.css
```

### 3. popups.css (~130 lines)
**Source: styles.css lines 513–685**
- Tabbed town popup: `.town-popup-tabs`, `.tab-radio`, `.town-popup-tab`
- Town popup: `.town-popup`, `.town-popup-nav`, `.town-popup-info`
- Coordinate popup: `.coord-popup`
- Popup nav button: `.popup-nav-btn`
- Info toggle: `.popup-info-toggle`

**Extract:**
```bash
sed -n '513,640p' src/styles.css > src/styles/popups.css
```

### 4. nav-hud.css (~170 lines)
**Source: styles.css lines ~900–1050 (approx)**
- Navigation HUD: `.nav-hud`, `.nav-hud-title`
- Turn instructions: `.turn-instruction`, `.turn-action`, `.turn-distance`
- Voice guidance panel: `.voice-panel`, `.voice-mode-btn`
- Compass: `.compass`, `.compass-dial`
- Reset north button: `.reset-north-btn`
- Map menu FAB: `.map-menu-fab`

**Note:** These styles are scattered throughout. Search for these class names and consolidate.

### 5. markers.css (~170 lines)
**Source: styles.css lines 1051–1200**
- Leaflet marker fixes: `.leaflet-marker-pane`, `.leaflet-popup`
- Town label: `.lb-label`, `.sect-dot`
- Sect colors: `.sect-label-shia`, `.sect-label-sunni`, etc.
- Sect legend: `.sect-legend`, `.sect-legend-row`
- Population circles: `.pop-circle`

**Extract:**
```bash
sed -n '1051,1200p' src/styles.css > src/styles/markers.css
```

### 6. routes.css (~170 lines)
**Source: styles.css lines 1220–1370**
- Route line base: `.route-line`, `.route-line-active`
- Solid (drive): `.route-line-solid`
- Dashed (foot): `.route-line-dashed`
- Dotted (aerial): `.route-line-dotted`
- Animations: `@keyframes`

**Extract:**
```bash
sed -n '1220,1370p' src/styles.css > src/styles/routes.css
```

### 7. analytics.css (~100 lines)
**Source: styles.css lines 980–1050**
- KPI grid: `.kpi-grid`, `.kpi`, `.kpi-label`, `.kpi-value`
- Bar chart: `.bar-row`, `.bar`, `.count`, `.label`
- Incident cards: `.incident-card`, `.incident-head`, `.incident-meta`

**Extract:**
```bash
sed -n '980,1050p' src/styles.css > src/styles/analytics.css
```

### 8. poi.css (~155 lines)
**Source: styles.css lines ~1300–1450 (approx)**
- POI pin: `.poi-pin`, `.poi-shape-*`
- POI colors: `.poi-color-*`
- POI form: `.poi-box`, `.poi-style-grid`, `.poi-choice-*`
- POI preview: `.poi-preview`
- Live location marker: `.live-location-marker`
- Recorded track: `.recorded-track`

### 9. drawer.css (~200 lines)
**Source: styles.css lines 1377–1500**
- Drawer overlay: `.drawer`, `.drawer-panel`
- Drawer head: `.drawer-head`
- Drawer body: `.drawer-body`
- Support card: `.support-card`, `.support-actions`
- About card: `.about-card`, `.about-meta`
- Copyable link: `.copyable-link`

**Extract:**
```bash
sed -n '1377,1480p' src/styles.css > src/styles/drawer.css
```

### 10. help.css (~400 lines)
**Source: styles.css lines 1405–1810**
- Help panel lists and tables
- Help section headings
- Code blocks and examples

**Note:** Can be split further if needed into help-layout.css, help-content.css, help-sections.css

### 11. measure.css (~120 lines)
**Source: styles.css lines 1482–1600**
- Measure HUD: `.measure-hud`, `.measure-label`
- Distance display: `.distance-display`
- Reset north button: `.reset-north-btn`
- Rotation lock: `.rotation-lock-btn`

### 12. dialogs.css (~100 lines)
**Source: styles.css lines ~1600–1700 (approx)**
- Resume nav dialog: `.resume-nav-overlay`, `.resume-nav-card`
- Snap rotation picker: `.snap-picker`, `.snap-angle-btn`
- Mini overlay: `.mini-overlay`

### 13. mobile.css (~180 lines)
**Source: styles.css lines ~2300–2549 (end of file)**
- Mobile breakpoints: `@media (max-width: ...)`
- Panel drag handle display
- Responsive grid adjustments
- Touch-friendly button sizes

---

## Completion Workflow

### Option A: Automated (Bash + sed)
```bash
cd src/styles
sed -n '283,437p' ../styles.css > controls.css
sed -n '453,680p' ../styles.css > nav-form.css
sed -n '513,640p' ../styles.css > popups.css
sed -n '1051,1200p' ../styles.css > markers.css
sed -n '1220,1370p' ../styles.css > routes.css
sed -n '980,1050p' ../styles.css > analytics.css
sed -n '1377,1480p' ../styles.css > drawer.css
# ... continue for remaining files
```

### Option B: Manual (Copy/paste + verify)
1. Open styles.css in editor
2. Use line numbers from this guide
3. Copy each section
4. Paste into corresponding new file
5. Add comment header to each file
6. Run `npm run build` to verify no CSS breaks

### Option C: Using VS Code Find & Replace
1. Open styles.css
2. Cmd+G (Go to Line)
3. Navigate to start line
4. Select to end line
5. Copy
6. Create new file
7. Paste

---

## Verification Steps

After creating each file:
1. Run `npm run build` — verify no CSS errors
2. Check browser dev tools — no 404s in console
3. Verify theme toggle works (light/dark)
4. Spot-check one feature per file (e.g., click layer toggle, check nav buttons work)

---

## Final Step: Update Main Import

Once all files are created, update `src/index.tsx`:
```tsx
// OLD:
import './styles.css';

// NEW:
import './styles/variables.css';
import './styles/layout.css';
import './styles/buttons.css';
// ... (all other imports)
```

OR use the barrel import:
```tsx
import './styles-barrel.css';
```

Then rename `styles-barrel.css` → `styles.css` and remove old `styles.css`.

---

## Expected Outcome

- ✅ 16 focused CSS files (each ≤250 lines)
- ✅ Vite bundles them into one CSS at build time
- ✅ Zero runtime impact (same final CSS)
- ✅ Improved maintainability (find styles faster)

---

## Time Estimate

- Automated (sed): ~5 minutes
- Manual (copy/paste): ~30 minutes
- Verification: ~10 minutes
- **Total: ~1 hour**

**Status: Ready to complete. Use sed commands above for fastest path.**
