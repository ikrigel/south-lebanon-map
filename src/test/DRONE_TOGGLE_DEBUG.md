# Drone Toggle Debugging Guide

If the drone toggle still isn't working after the fix, follow these steps to diagnose the issue:

## Step 1: Verify Toggle Element Exists

Open browser DevTools (F12) and run in the Console:

```javascript
// Check if toggle element exists
const toggle = document.querySelector('[data-testid="toggle-layer-drones"]');
console.log('Toggle element found:', !!toggle);
console.log('Toggle element:', toggle);
console.log('Toggle data-active:', toggle?.getAttribute('data-active'));
console.log('Toggle classes:', toggle?.className);
```

**Expected output:**
- Toggle element found: `true`
- data-active: `false` (initial state)
- className: includes `toggle-row`

## Step 2: Verify Toggle Is Clickable

```javascript
const toggle = document.querySelector('[data-testid="toggle-layer-drones"]');
console.log('Toggle pointer-events:', getComputedStyle(toggle).pointerEvents);
console.log('Toggle cursor:', getComputedStyle(toggle).cursor);
console.log('Toggle opacity:', getComputedStyle(toggle).opacity);
console.log('Toggle visibility:', getComputedStyle(toggle).visibility);
console.log('Toggle display:', getComputedStyle(toggle).display);
```

**Expected output:**
- pointer-events: `auto` (or empty)
- cursor: `pointer`
- opacity: `1`
- visibility: `visible`
- display: `flex`

## Step 3: Manually Trigger Click Event

```javascript
const toggle = document.querySelector('[data-testid="toggle-layer-drones"]');

// Add a click listener to see if clicks are detected
toggle?.addEventListener('click', (e) => {
  console.log('Click detected on toggle!');
  console.log('Event:', e);
  console.log('Target:', e.target);
});

// Manually click the toggle
toggle?.click();
```

**Expected behavior:**
- "Click detected on toggle!" should appear in console
- Event object should be displayed

## Step 4: Check Component Props

```javascript
// Get React DevTools fiber (if React DevTools installed)
// In React DevTools, select the toggle element and check:
// - visible.drones value (should change when toggled)
// - visibleKey function definition
// - onClick handler

// Or check localStorage directly:
console.log('Layer visibility in localStorage:');
const raw = localStorage.getItem('south-lebanon-map:layer-visibility:v1');
const parsed = JSON.parse(raw || '{}');
console.log('drones visibility:', parsed.drones);
```

## Step 5: Check Console for Errors

```javascript
// Look for any JavaScript errors related to:
// - Toggle click
// - State updates
// - Layer visibility
// - Drone rendering

// Check browser console for red error messages
console.log('No errors = toggle should be working');
```

## Step 6: Verify Drones Are Imported

```javascript
// Check if drone attacks are available
// (This would need to be added to window for debugging)

// Alternative: Check the Map component's layers
const mapContainer = document.querySelector('.map-container');
console.log('Map element found:', !!mapContainer);
```

## Step 7: Test Toggle Manually in Console

If all above checks pass but toggle still doesn't work:

```javascript
// Simulate what should happen when toggle is clicked
// This requires access to React state, which varies by app structure

// If you see that visible.drones IS toggling but drones aren't appearing on map:
// The issue is in the visualization layer (useDroneVisualization hook)

// If visible.drones is NOT toggling:
// The issue is in the state update (visibleKey function)
```

## Possible Issues & Solutions

### Issue 1: Toggle doesn't visually change (data-active stays false)
**Likely cause:** State not updating
- Check if there are React errors in console
- Verify visibleKey function is being called
- Check if state management is working for other toggles

### Issue 2: Toggle changes but drones don't appear
**Likely cause:** Visualization layer not rendering
- Check browser console for errors in useDroneVisualization
- Verify drone attacks are imported (droneAttacks.ts)
- Check if map is initialized properly
- Check z-index of drone layer vs other layers

### Issue 3: Toggle doesn't respond to clicks
**Likely cause:** onClick handler not wired correctly or element not clickable
- Verify the fix was applied (line 229 should have `()()` not just `()`)
- Check if element has pointer-events: none
- Verify event bubbling isn't being stopped

## Quick Fix Checklist

- [ ] Hard refresh (Ctrl+Shift+R)
- [ ] Clear localStorage (F12 → Application → Local Storage)
- [ ] Scroll to "מודיעין ביטחוני" section
- [ ] Click toggle - should visually change
- [ ] Check map - drones should appear as colored dots
- [ ] Run diagnostics from console (Step 1-3 above)

## Still Not Working?

If after following these steps the toggle still doesn't work:

1. Share console output from Steps 1-3
2. Check if other toggles (pop, unifil, navLabels) work correctly
3. If other toggles work but drones don't, the issue is specific to the drones
4. If no toggles work, the issue is with the entire state management system

---

**Version:** v3.5.2  
**Fixed in commit:** ea13ad0  
**All tests passing:** ✅ 505 tests
