# Speed Tile Test Instructions

## Overview

This document provides step-by-step instructions for testing the speed tile functionality on v4.8.0 using a visual test page (no console required).

---

## Part 1: Unit Tests (Automated)

The speed calculation logic has been tested with 13 automated unit tests. These verify that the speed formula works correctly.

**To run these tests on your computer:**

```bash
npm test -- --run speed-tile-full-flow.test.tsx
```

**Expected output:**
```
Test Files  1 passed (1)
Tests  13 passed (13)
```

**What these tests verify:**
- ✅ 18 km/h displays as "18 קמ״ש"
- ✅ 20 km/h displays as "20 קמ״ש"
- ✅ 0.1 km/h displays as "0 קמ״ש" (rounds to 0)
- ✅ Speed prop priority and fallback logic
- ✅ Walking speeds (1-2 km/h) display correctly
- ✅ Vehicle speeds (50-100 km/h) display correctly

---

## Part 2: Visual Speed Test (Mobile Phone)

The visual test page lets you see speed calculations without needing browser console access.

### Setup:

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Start development server (if testing locally):**
   ```bash
   npm run dev
   ```

3. **Open the test page on your phone:**
   - **Local development:** `http://localhost:5173/speed-test.html`
   - **Production:** `https://south-lebanon-map.vercel.app/speed-test.html`

### Test Steps:

#### A. Test Individual Scenarios

1. **Open `/speed-test.html` on your phone**
   - You'll see 6 test scenarios
   - Each scenario shows distance and time values

2. **Test Scenario 1: Slow Walking (1 km/h)**
   - Scenario: 50 meters in 180 seconds
   - Click button "Calculate"
   - **Expected result:** Display shows "1 קמ״ש"
   - Calculation shown: "0.050 km ÷ 0.0500 hours = 1.00 km/h"
   - ✅ **PASS** if green display shows "1 קמ״ש"
   - ❌ **FAIL** if display is blank or shows "—"

3. **Test Scenario 2: Normal Walking (3 km/h)**
   - Scenario: 100 meters in 120 seconds
   - Click button "Calculate"
   - **Expected result:** Display shows "3 קמ״ש"
   - ✅ **PASS** if green display shows "3 קמ״ש"

4. **Test Scenario 3: Brisk Walking (5 km/h)**
   - Scenario: 200 meters in 144 seconds
   - Click button "Calculate"
   - **Expected result:** Display shows "5 קמ״ש"
   - ✅ **PASS** if green display shows "5 קמ״ש"

5. **Test Scenario 4: Cycling/Running (15 km/h)**
   - Scenario: 500 meters in 120 seconds
   - Click button "Calculate"
   - **Expected result:** Display shows "15 קמ״ש"
   - ✅ **PASS** if green display shows "15 קמ״ש"

6. **Test Scenario 5: Vehicle Speed (60 km/h)**
   - Scenario: 2000 meters in 120 seconds
   - Click button "Calculate"
   - **Expected result:** Display shows "60 קמ״ש"
   - ✅ **PASS** if green display shows "60 קמ״ש"

7. **Test Scenario 6: Standing Still (0 km/h)**
   - Scenario: 0.05 meters in 10 seconds (almost no movement)
   - Click button "Calculate"
   - **Expected result:** Display shows "0 קמ״ש"
   - ✅ **PASS** if green display shows "0 קמ״ש"

#### B. Live GPS Simulation Test

1. **Scroll to "Live GPS Simulation" section**

2. **Click "Start GPS Simulation" button**
   - Status shows: "Simulating GPS movement..."
   - Large green speed display appears
   - Details section shows: Distance, Time, Calculation

3. **Watch the speed increase (0 → 6 km/h)**
   - Every 3 seconds, speed increases
   - Simulates: 0 → 1 → 2 → 3 → 4 → 5 → 6 km/h
   - **Expected:** Speed display updates smoothly
   - **Expected:** Green numbers show 0, 1, 2, 3, 4, 5, 6 קמ״ש
   - ✅ **PASS** if all speeds display correctly

4. **Watch the speed decrease (6 → 0 km/h)**
   - After peak, speed decreases
   - Simulates: 6 → 5 → 4 → 3 → 2 → 1 → 0 km/h
   - **Expected:** Speed display updates smoothly
   - ✅ **PASS** if all speeds display correctly

5. **Simulation completes**
   - Status shows: "✅ Simulation complete!"
   - Total simulation time: ~36 seconds (12 speed steps × 3 seconds each)

---

## Part 3: Real-World Field Test (Your Phone)

Once the automated tests pass, test with actual GPS movement on your phone.

### Setup:

1. **Deploy to your phone:**
   - Build: `npm run build`
   - Access app on your phone at production URL

2. **Enable GPS:**
   - Open app
   - Click "Center Me" button to enable GPS
   - Wait for green checkmark showing GPS active

### Test Movements:

#### Test A: Stand Still
1. **Stand in one location for 10 seconds**
2. **Expected:** Speed tile shows "0 קמ״ש"
3. **Result:** ✅ PASS / ❌ FAIL

#### Test B: Slow Walk
1. **Walk slowly (normal walking pace, ~3-4 km/h)**
2. **Walk for 10-15 seconds**
3. **Expected:** Speed tile shows "3-4 קמ״ש"
4. **Result:** ✅ PASS / ❌ FAIL

#### Test C: Fast Walk
1. **Walk briskly (faster pace, ~5-6 km/h)**
2. **Walk for 10-15 seconds**
3. **Expected:** Speed tile shows "5-6 קמ״ש"
4. **Result:** ✅ PASS / ❌ FAIL

#### Test D: Run/Bike
1. **Run or bike (10-20 km/h)**
2. **Move for 10-15 seconds**
3. **Expected:** Speed tile shows "10-20 קמ״ש"
4. **Result:** ✅ PASS / ❌ FAIL

#### Test E: Vehicle Speed
1. **Drive vehicle (40-60 km/h)**
2. **Drive for 10-15 seconds**
3. **Expected:** Speed tile shows "40-60 קמ״ש"
4. **Result:** ✅ PASS / ❌ FAIL

---

## Troubleshooting

### If Speed Doesn't Display:

**Scenario 1: Unit tests PASS but visual test shows "—"**
- Issue: Speed tile rendering problem
- Action: Check browser console for errors
- Report: "Unit tests pass but visual test fails"

**Scenario 2: Visual tests PASS but real-world shows nothing**
- Issue: GPS speed not being calculated in app
- Action: Check GPS is actually enabled
- Report: "Visual tests pass but no speed in real app"

**Scenario 3: Certain speeds show but others don't**
- Issue: Threshold filtering is rejecting some speeds
- Action: Identify which speed ranges fail
- Report: "Speeds 1-3 km/h don't show, 15+ km/h works"

### Debug Info to Provide:

When reporting a failure, include:
1. **Which test failed:** (Scenario 1, 2, 3, etc.)
2. **What you expected:** (specific speed display)
3. **What you got:** (blank, "—", wrong number, etc.)
4. **Your device:** (iPhone, Android, browser type)
5. **Version:** (v4.8.0)

---

## Success Criteria

### ✅ All Tests Pass If:

1. ✅ Unit test suite: 13/13 tests passing
2. ✅ Visual test: All 6 scenarios show correct speeds
3. ✅ GPS simulation: All speeds 0-6 km/h display correctly
4. ✅ Real-world: Speed shows during actual movement

### ❌ Tests Fail If:

- Any test returns "—" instead of a number
- Speed tile doesn't update during movement
- Certain speed ranges missing (e.g., walking speeds work but vehicle speeds don't)

---

## Next Steps

**If all tests PASS:**
- Speed calculation is working correctly
- Issue must be in the app's speed prop flow
- Check if `liveLocation.speed` is being passed to MiniOverlay

**If tests FAIL:**
- Speed calculation logic is broken
- Need to investigate distance/time formula
- Check console logs for calculation errors

---

## Quick Reference

| Test | Distance | Time | Expected Speed |
|------|----------|------|-----------------|
| 1 | 50m | 180s | 1 קמ״ש |
| 2 | 100m | 120s | 3 קמ״ש |
| 3 | 200m | 144s | 5 קמ״ש |
| 4 | 500m | 120s | 15 קמ״ש |
| 5 | 2000m | 120s | 60 קמ״ש |
| 6 | 0.05m | 10s | 0 קמ״ש |

**Formula:** Speed (km/h) = Distance (km) ÷ Time (hours)
