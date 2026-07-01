# Route Save & Navigation Workflow Guide

## Step-by-Step: Build → Name → Save → Navigate

### 1️⃣ **Build Your Route**

**Where:** Navigation panel (left sidebar, "ניווט" tab)

1. Select **Start Point** (search or use current GPS location)
2. Select **End Point** (search town/POI or tap map)
3. Choose route type: 🛣️ Road | ✈️ Aerial | ⊕ Both
4. Route calculates automatically (shows distance + duration)

**Map shows:** Current route overlay with distance/ETA labels

---

### 2️⃣ **Name Your Route** ✍️

**Before saving, you MUST give it a name:**

In the "שמור מסלול" (Save Route) section:
- Input field: `שם למסלול לשמירה…` (Route name for saving)
- **Example:** "Beirut to Sidon via Coastal Road"
- **If empty:** It will use default name like "Location A → Location B"

---

### 3️⃣ **Save the Route** 💾

**Click:** `שמור מסלול` (Save Route) button

**What happens:**
- ✅ Route saved to browser localStorage
- ✅ Route appears in the **Saved Routes List** below the input
- ✅ Clear the name input (ready for next route)
- ✅ Route persists—survives app reload

**Note:** The map keeps showing the route (you can view it, edit the name, or start navigation)

---

### 4️⃣ **View Saved Routes**

**Saved Routes List appears below the input field when you have saved routes:**

```
📍 Beirut to Sidon via Coastal Road
   48.5 km · 58 דק׳   [Edit] [Navigate]

📍 Sidon to Tyre
   55 km · 65 דק׳   [Edit] [Navigate]
```

For each saved route:
- **Left button** (route name) → Load route (for editing)
- **Edit (✎)** → Modify the route name or geometry
- **Navigate (🧭)** → Start GPS-based navigation immediately

---

### 5️⃣ **Load & Edit a Saved Route**

**Click the route name button** → Route loads into the build panel

- Start/end points restore
- Route overlay reappears on map
- You can now:
  - Change the route name
  - Adjust start/end points
  - Modify route type (drive/aerial)
  - Save changes (re-saves with same ID)

---

### 6️⃣ **Navigate from a Saved Route** 🧭

**Click the 🧭 Navigate button:**

1. Route loads as active navigation
2. GPS tracking begins (if enabled)
3. Map centers on your location
4. Navigation scale (1:20 - 1:2000) becomes active
5. **Auto-reroute kicks in** if you deviate >80m from route

---

## 🔄 **Auto-Reroute During Navigation**

After you start navigating from a saved route:

### When Does It Trigger?
- 2 consecutive GPS readings > **80m off route**
- **30-second cooldown** between recalculations (no thrashing)

### Visual Feedback
1. **Toast appears:** "מחשב מסלול מחדש…" (Calculating new route)
2. **Old route shows** in amber/orange with pulsing animation (2.5s)
3. **New route animates in** from your current position
4. **Ghost route disappears** → new route becomes active

### Route Type Auto-Switch
- **Speed > 8 km/h** on foot route → switches to drive route
- **Speed < 3 km/h** for 3 readings on drive route → switches to foot route

---

## 📊 **Full Workflow Example**

```
START
  ↓
1. Select Start: "Beirut"
2. Select End: "Sidon"
3. Route calculates (48.5 km, 58 min)
  ↓
4. Enter name: "Beirut to Sidon Coastal"
5. Click "שמור מסלול" (Save)
  ↓
6. Route appears in list below
  ↓
7. Click 🧭 Navigate
   └─ GPS tracking starts
   └─ Map centers on you
  ↓
8. Driving along route... ✅
  ↓
9. You turn off route (accidentally on different road)
   └─ GPS shows you're 150m from planned route
   └─ Second reading confirms: still 150m away
   ↓
10. Auto-reroute triggers!
    └─ Old route shows (amber pulse)
    └─ New route from current position to Sidon
    └─ Ghost route disappears
    └─ Navigate on new route ✅
```

---

## 💡 **Tips**

✅ **Save meaningful names:** "Damascus Highway" is better than "Route 1"

✅ **Check route type:** Road vs aerial affects calculation + animation style

✅ **Export for backup:** "ייצוא כל המסלולים" (Export all routes) to JSON file

✅ **Import routes:** Upload saved JSON files to restore routes

✅ **Long press tiles in mini-window:** Reorder display elements while navigating

✅ **Use current GPS location:** Click "GPS" location button to start from where you are

---

## ⚠️ **Common Issues**

### "I don't see my saved routes"
→ You need to **enter a route name first** and click save

### "Route doesn't appear on map"
→ Select both start AND end points → click save

### "My saved route is gone after reload"
→ Saved routes are in browser localStorage. Clearing browser data deletes them.
→ **Solution:** Export routes to JSON file for backup

### "Auto-reroute keeps triggering"
→ You're > 80m from the route. Check if you're on the correct road.
→ If riding/walking parallel, wait 30s for cooldown, then the next route will calculate.

---

## 🔧 **Technical Details**

### Saved Route Structure
```typescript
{
  id: 'route-1234567890',
  name: 'Beirut to Sidon',
  createdAt: '2026-07-01T14:30:00Z',
  km: 48.5,
  durationMin: 58,
  path: [[33.0, 35.0], [33.05, 35.05], ...],  // [lat, lon] pairs
  instructions: [
    { text: 'Turn right on Corniche', bearing: 90, distanceM: 500, ... },
    ...
  ]
}
```

### Storage
- **Key:** `south-lebanon-map:saved-routes:v1`
- **Limit:** ~50KB per 100 routes (localStorage typically 5-10MB available)
- **Persistence:** Until browser data cleared

### Auto-Reroute Thresholds
- **Deviation threshold:** 80 meters
- **Debounce:** 2 consecutive readings required
- **Cooldown:** 30 seconds between recalculations
- **Speed thresholds:** 8 km/h (drive) / 3 km/h (foot)
- **Ghost route duration:** 2.5 seconds

---

## 🎯 **Next Steps**

1. **Build a route** using start/end points
2. **Name it** ("מסלול חדש" section)
3. **Save it** (button lights up with name entered)
4. **Navigate** using the 🧭 button
5. **Watch auto-reroute** adapt if you deviate
6. **Export to backup** when you've built several useful routes
