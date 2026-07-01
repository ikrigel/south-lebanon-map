# 🗺️ Quick Start: Save & Navigate Routes

## ⚡ 30-Second Version

### To Save a Route:
1. Select **Start** point (in ניווט panel)
2. Select **End** point
3. **⭐ Enter a name** in the "שם למסלול לשמירה…" input field
4. Click **שמור מסלול** (Save Route)
5. ✅ Route appears in the list below

### To Navigate from Saved Route:
1. Click **🧭 Navigate** button next to your saved route
2. GPS tracking starts automatically
3. Map centers on your location
4. Navigate along the route

### If You Go Off-Route:
- **Auto-detects** when you're >80m away from planned path
- **Automatically recalculates** a new route from your current position
- Old route blinks in amber for 2.5 seconds
- New route appears on map
- Keep navigating! 📍

---

## 🚨 Why My Routes Don't Show?

| Problem | Solution |
|---------|----------|
| "Saved routes list is empty" | You need to **enter a name** before clicking save |
| "Save button is disabled" | Both start AND end points must be selected |
| "Routes disappeared after reload" | They're saved locally. Check browser → Application → Local Storage |
| "Can't see where to navigate from saved route" | Click **🧭 Navigate** button (blue compass icon) next to route name |

---

## 🎯 The Main Buttons (When Route is Saved)

```
📍 Beirut to Sidon
   48.5 km · 58 min    [Load] [🧭 Navigate] [Delete]
                        
   ↓                    ↓                    ↓
   Load route for       Start GPS            Delete route
   viewing/editing      navigation
```

---

## 📱 While Navigating (Auto-Reroute in Action)

### When You Deviate from Route:

**Reading 1:** You're 150m off → (checking...)  
**Reading 2:** Still 150m off → ✅ **TRIGGER AUTO-REROUTE**

1. Toast: "מחשב מסלול מחדש…"
2. Amber ghost route appears (old path)
3. New route calculates in 1-2 seconds
4. Ghost fades after 2.5s
5. New route ready to follow

### Smart Route Type Switching:
- Walking slowly? Switches to **foot route** automatically
- Driving fast? Switches to **road route** automatically

---

## 💾 Backup Your Routes

**Export:**
- Click: ייצוא כל המסלולים (Export all routes)
- Gets: `.json` file with all your routes
- Safe to download

**Import:**
- Click: ייבוא קובץ מסלול (Import route file)
- Select: your `.json` file
- Routes restore to the list

---

## 🔑 Key Points

✅ **Name is required** — before you can save, give it a meaningful name  
✅ **Saved routes are persistent** — survive app reload (browser localStorage)  
✅ **Auto-reroute is automatic** — no manual steps needed during navigation  
✅ **Ghost route is visual feedback** — shows old path during recalc (2.5s)  
✅ **Edit by loading** — click route name to load → change name → save again  

---

## 🎓 See Also

- Full guide: `docs/ROUTE_SAVE_WORKFLOW.md`
- Technical details: Check the same file for storage limits & thresholds
