# GPS Navigation Mobile Debug Guide

## Issue
On mobile, when starting navigation, the marker gets positioned very far away from actual GPS location.

## Root Cause Investigation
The `lowerThirdCenter` function calculates where the map center should be so that the GPS marker (your current location) appears at the lower third of the screen during navigation.

### How it should work:
1. GPS location is received: (lat, lon)
2. Map projects this to screen coordinates: (screenX, screenY)
3. We calculate offset to move the map center so marker appears at lower third
4. New map center is calculated by unprojecting the offset coordinates

## Mobile Testing Steps

### Step 1: Check Screen Size
Open browser console on mobile and run:

```javascript
console.log('Screen size:', window.innerWidth, 'x', window.innerHeight);
console.log('Aspect ratio:', window.innerWidth / window.innerHeight);
console.log('Is portrait:', window.innerHeight > window.innerWidth);

// Get Leaflet map size
const mapContainer = document.querySelector('.map-container');
const rect = mapContainer?.getBoundingClientRect();
console.log('Map container size:', rect?.width, 'x', rect?.height);
```

**Expected:** 
- Portrait: width < height (e.g., 400x800)
- Width should be close to window.innerWidth

### Step 2: Enable Navigation
1. Click "תחת GPS" button to enable location tracking
2. Wait for GPS lock
3. Click map to set destination
4. Click "נווט" to start navigation
5. Check the console - you should see log messages like:

```
[Nav Marker] Screen: 400×800px (portrait) | Bearing: 0° | Marker at (200, 533) | Ahead in travel direction
```

This shows:
- Screen size: 400×800
- Marker should appear at: (200, 533) — that's X=center, Y=2/3 of height
- If marker appears elsewhere, there's a calculation error

### Step 3: Check Marker Position vs Expected
While navigating, your GPS marker should:
- ✅ Stay horizontally centered (X = screen.width/2)
- ✅ Stay at lower third (Y = screen.height * 2/3) on portrait
- ✅ When phone rotates, reposition to new lower third

If marker appears at center (Y = screen.height/2), the offset isn't being applied.
If marker appears at top (Y = 0), the offset is backwards.

### Step 4: Check Zoom Level
```javascript
const map = window.__leafletMapInstance;
console.log('Current zoom:', map.getZoom());
console.log('Expected min zoom:', 11); // NAVIGATION_FOLLOW_MIN_ZOOM
```

### Step 5: Log Real-Time Updates
Add this to console to see updates as you move:

```javascript
// Store original console.log
const originalLog = console.log;

// Override to show navigation updates
console.log = function(...args) {
  if (args[0]?.includes?.('[Nav Marker]')) {
    originalLog.style = 'color: blue; font-weight: bold';
  }
  originalLog.apply(console, args);
};
```

Then walk while navigating and watch the console output.

## Common Issues & Fixes

### Issue 1: Marker stays in center
- **Symptom:** Marker at (screen.width/2, screen.height/2) instead of lower third
- **Cause:** Offset calculation returns (0,0)
- **Fix:** Check bearing calculation. If bearing = 0°:
  - cos(0) = 1 (should work)
  - sin(0) = 0 (correct, no X offset at bearing 0)

### Issue 2: Marker very far away
- **Symptom:** Marker jumps to wrong location
- **Cause:** Offset calculation is too large or in wrong direction
- **Fix:** Check if offset is being subtracted instead of added (or vice versa)

### Issue 3: Marker on opposite side
- **Symptom:** Marker appears ahead when should be behind (or vice versa)
- **Cause:** Bearing offset direction is reversed
- **Fix:** Offset direction = atan2(sin(bearing), cos(bearing))

## Quick Test Coordinates

Test near these locations with known GPS coordinates:

**Beirut Center:** 33.8886, 35.4957
**Golan Heights:** 33.0667, 35.7500
**South Lebanon (Tyre):** 33.2732, 35.1897

## Related Code Files

- `src/hooks/useMapLiveLocation.ts` — `lowerThirdCenter()` function (line 9)
- `src/hooks/useMapInit.ts` — Map initialization
- `src/hooks/useMapRotation.ts` — Map rotation handling

## Expected Behavior After Fix

When you start navigation:
1. ✅ GPS marker appears at lower third of screen
2. ✅ As you move, marker stays in lower third
3. ✅ When phone rotates, lower-third updates to new orientation
4. ✅ Scroll works but marker stays at lower third
5. ✅ Marker is ahead in your direction of travel (with bearing rotation)

---

**Version:** v3.5.4  
**Mobile-tested:** No (awaiting user testing)  
**Known issue:** Offset calculation may be backwards on mobile  
**Fix status:** Offset sign flipped - awaiting verification
