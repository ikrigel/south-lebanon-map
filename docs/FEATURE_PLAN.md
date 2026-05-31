# תוכנית פיתוח — מרחב דרום לבנון
## Feature Roadmap: Auth · Spotify · Feedback · Admin

> גרסה: 1.0 | עודכן: מאי 2026 | מחבר: ikrigel

---

## סקירה כללית

האפליקציה עוברת ממפה סטטית ל-**פלטפורמה מחוברת** עם:
- הרשמה והתחברות (Google + email/password)
- אינטגרציית Spotify מובנית בממשק (כמו Waze)
- מערכת פניות ומשוב למשתמשים רשומים
- דשבורד ניהול נפרד (Admin) עם דוחות שימוש

---

## Stack טכנולוגי

| שכבה | טכנולוגיה | סיבה |
|---|---|---|
| Frontend | React 18 + TypeScript + Vite | קיים |
| Styling | CSS Modules / styles.css | קיים |
| Maps | Leaflet 1.9 | קיים |
| Auth | **Firebase Auth** | Google + email/password מובנה, ללא backend |
| Database | **Firestore** (NoSQL) | real-time, חינמי עד 50k/חודש |
| Music | **Spotify Web Playback SDK** | OAuth PKCE, player ב-browser |
| Hosting | Vercel (main) + Vercel (admin) | קיים + חדש |
| CI | GitHub Actions | build + test בכל PR |

---

## שלב 1 — Authentication + Database
### משוער: 2–3 ימי עבודה

### 1.1 הגדרת Firebase

```
src/
  firebase.ts           ← initializeApp, auth, db exports
```

```ts
// firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = { /* env vars */ };
export const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);
```

משתני סביבה ב-`.env.local` (לא ב-git):
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_APP_ID=...
```

---

### 1.2 AuthContext

```
src/auth/
  AuthContext.tsx       ← React Context: currentUser, loading, signOut
  useAuth.ts            ← hook נוח
```

- `currentUser: FirebaseUser | null`
- `loading: boolean` — מונע flash of unauthenticated content
- `isAdmin: boolean` — נקבע לפי Firestore `users/{uid}.role === 'admin'`

---

### 1.3 LoginModal

```
src/auth/
  LoginModal.tsx        ← modal: Google button + email/password form
  LoginButton.tsx       ← כפתור בתפריט הצד
```

**UI:**
```
┌─────────────────────────────┐
│  🗺  כניסה למרחב דרום לבנון │
│                             │
│  [  Google  התחבר עם  G  ] │
│                             │
│  ──────────  או  ──────── │
│                             │
│  אימייל: [____________]    │
│  סיסמה:  [____________]    │
│                             │
│  [ כניסה ]  [ הרשמה ]      │
│                             │
│  שכחת סיסמה?               │
└─────────────────────────────┘
```

---

### 1.4 Firestore Schema

```
/users/{uid}
  email: string
  displayName: string
  photoURL: string | null
  role: 'user' | 'admin'
  createdAt: Timestamp
  lastSeen: Timestamp
  spotifyConnected: boolean
  spotifyRefreshToken: string | null   ← מוצפן

/feedback/{docId}
  userId: string
  userEmail: string
  type: 'bug' | 'feature' | 'compliment'
  text: string
  status: 'open' | 'reviewed' | 'closed'
  createdAt: Timestamp
  appVersion: string

/analytics/{docId}
  userId: string | 'anonymous'
  event: string           ← 'map_open' | 'layer_toggle' | 'popup_open' | ...
  payload: object
  timestamp: Timestamp
  platform: 'mobile' | 'desktop'
  userAgent: string
```

---

### 1.5 Firestore Security Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /users/{uid} {
      allow read, write: if request.auth.uid == uid;
      allow read: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    match /feedback/{doc} {
      allow create: if request.auth != null;
      allow read, update: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    match /analytics/{doc} {
      allow create: if true;   // אנונימי מותר
      allow read: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

---

## שלב 2 — Spotify Integration
### משוער: 3–4 ימי עבודה

### 2.1 OAuth PKCE Flow

Spotify API לא מאפשר Client Secret ב-browser → חובה PKCE.

```
src/spotify/
  SpotifyAuth.tsx       ← "חבר Spotify" כפתור + redirect handler
  spotifyApi.ts         ← fetch wrappers: currentTrack, play, pause, next
  SpotifyPlayer.tsx     ← widget רצועה נוכחית
  SpotifyOverlay.tsx    ← wrapper מוצג מעל המפה
```

**Scopes נדרשים:**
```
user-read-playback-state
user-modify-playback-state
user-read-currently-playing
streaming
```

**הגבלות Spotify:**
- דורש **Premium** לשמיעה מלאה (Free = 30 שניות preview)
- Web Playback SDK דורש HTTPS (Vercel ✓)
- Token חי 1 שעה → Refresh Token נשמר ב-Firestore

---

### 2.2 UI — Player Widget

```
┌─────────────────────────────────┐  ← overlay, פינה שמאל תחתונה
│  🎵  Pink Floyd — Comfortably Numb │
│  ━━━━━━━━━━━━━━━━━━━━━━━━  2:34 │
│  ⏮   ⏸   ⏭   🔊──────────    │
└─────────────────────────────────┘
```

- ניתן לגרור (draggable)
- מתקפל ל-mini mode בלחיצה
- לא חוסם את המפה (pointer-events מכוונן)

---

### 2.3 תנאי גישה

```tsx
// רק למשתמשים מחוברים
{currentUser && (
  <SpotifyOverlay />
)}
```

---

## שלב 3 — Feedback System
### משוער: 1 יום עבודה

```
src/feedback/
  FeedbackButton.tsx    ← FAB בפינה ימין תחתונה
  FeedbackModal.tsx     ← modal עם 3 tabs
```

**Tab 1 — דיווח בעיה:**
- תיאור הבעיה (textarea)
- שלח + קבלת מייל אישור אוטומטי

**Tab 2 — בקשת שיפור:**
- כותרת + תיאור
- priority: נמוך / בינוני / גבוה

**Tab 3 — המלצה:**
- טקסט חופשי
- אפשרות פרסום ב-"קיר ההמלצות" (עתידי)

כל submission → Firestore `/feedback` + email notification ל-admin (Firebase Cloud Function / Resend API).

---

## שלב 4 — Admin Dashboard
### משוער: 3–4 ימי עבודה

### 4.1 ארכיטקטורה

**repo נפרד:** `ikrigel/south-lebanon-map-admin`  
**Vercel project נפרד:** `south-lebanon-map-admin.vercel.app`  
**הגנה:** Vercel Password Protection (חינמי) + Firebase role check

```
south-lebanon-map-admin/
  src/
    pages/
      Dashboard.tsx      ← KPIs ראשיים
      UsersPage.tsx      ← טבלת משתמשים, פילטרים, export CSV
      AnalyticsPage.tsx  ← גרפי שימוש לפי זמן/שכבה/אירוע
      FeedbackPage.tsx   ← inbox: בעיות + בקשות + המלצות
    components/
      Chart.tsx          ← recharts
      DataTable.tsx      ← sort + filter + pagination
```

### 4.2 KPIs בדשבורד

| מדד | מקור |
|---|---|
| סה"כ משתמשים רשומים | `users` collection count |
| משתמשים פעילים (7/30 יום) | `analytics` query |
| פתיחות מפה לפי יום | `analytics` event=`map_open` |
| שכבות פופולריות | `analytics` event=`layer_toggle` |
| ישובים עם הכי הרבה clicks | `analytics` event=`popup_open` |
| Spotify חיבורים | `users.spotifyConnected == true` |
| פניות פתוחות | `feedback.status == 'open'` |

---

## שלב 5 — Analytics Tracking
### משוער: 0.5 יום (מקביל לשלב 1)

```
src/analytics/
  trackEvent.ts         ← wrapper פשוט
```

```ts
export async function trackEvent(
  event: string,
  payload: Record<string, unknown> = {}
) {
  await addDoc(collection(db, 'analytics'), {
    userId: auth.currentUser?.uid ?? 'anonymous',
    event,
    payload,
    timestamp: serverTimestamp(),
    platform: /Mobi/.test(navigator.userAgent) ? 'mobile' : 'desktop',
    userAgent: navigator.userAgent,
  });
}
```

**אירועים למעקב:**
- `map_open` — פתיחת האפליקציה
- `layer_toggle` — שינוי שכבה (איזו שכבה, מצב on/off)
- `popup_open` — לחיצה על ישוב (id הישוב)
- `sect_toggle` — הדלקת/כיבוי צביעת עדות
- `spotify_connect` — חיבור Spotify
- `feedback_submit` — שליחת פנייה

---

## סדר פיתוח מומלץ

```
Week 1:
  [1] Firebase setup + AuthContext + LoginModal
  [2] Firestore schema + security rules
  [3] Analytics tracking (אנונימי)

Week 2:
  [4] Spotify OAuth + player widget
  [5] Feedback modal + Firestore write

Week 3:
  [6] Admin dashboard — Users + Feedback pages
  [7] Admin analytics charts

Week 4:
  [8] Testing + hardening
  [9] Production launch
```

---

## Environment Variables

```bash
# Firebase (main app)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Spotify
VITE_SPOTIFY_CLIENT_ID=
VITE_SPOTIFY_REDIRECT_URI=https://south-lebanon-map.vercel.app/spotify-callback
```

> כל המשתנים מוגדרים גם ב-Vercel Dashboard → Project Settings → Environment Variables

---

## עלויות צפויות

| שירות | Plan | מחיר |
|---|---|---|
| Firebase | Spark (Free) | $0 עד 50k auth/חודש |
| Firestore | Spark | $0 עד 1GB + 50k reads/day |
| Vercel (main) | Hobby | $0 |
| Vercel (admin) | Hobby | $0 |
| Spotify API | Free | $0 (Premium נדרש למשתמש) |
| **סה"כ** | | **$0** לשלב הראשון |

> אם יגדל מספר המשתמשים מעל 50k/חודש — Firebase Blaze (pay-as-you-go) ~$5–20/חודש

---

## קישורים רלוונטיים

- [Firebase Auth Docs](https://firebase.google.com/docs/auth)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Spotify Web Playback SDK](https://developer.spotify.com/documentation/web-playback-sdk)
- [Spotify OAuth PKCE Guide](https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow)
