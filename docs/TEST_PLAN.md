# תוכנית בדיקות — מרחב דרום לבנון
## Test Plan: Auth · Spotify · Feedback · Admin · Map

> גרסה: 1.0 | עודכן: מאי 2026

---

## עקרונות הבדיקות

- **Unit tests** — לוגיקה עסקית, utils, transformations (Vitest)
- **Integration tests** — React components עם Firebase mock (Testing Library)
- **E2E tests** — זרימות משתמש מלאות (Playwright — עתידי)
- **Manual QA** — mobile/topo scenario checklist
- **CI** — כל PR מפעיל את כל הבדיקות (GitHub Actions)

---

## מצב נוכחי

| קובץ בדיקות | מס׳ בדיקות | סטטוס |
|---|---|---|
| `geo-data-integrity.test.ts` | 35 | ✅ עובר |
| `map-center-drift.test.tsx` | 22 | ✅ עובר |
| `app-state-persistence.test.ts` | 42 | ✅ עובר |
| `localStorage-persistence.test.tsx` | 33 | ✅ עובר |
| `compass-rotation.test.tsx` | 15 | ✅ עובר |
| **סה"כ** | **147** | ✅ **147/147** |

---

## שלב 1 — בדיקות Authentication

### 1.1 AuthContext (`src/test/auth-context.test.tsx`)

```
describe('AuthContext')
  ✦ מספק currentUser=null לפני כניסה
  ✦ מספק currentUser אחרי כניסה עם Google mock
  ✦ מספק currentUser אחרי כניסה עם email/password mock
  ✦ loading=true בזמן בדיקת auth state, false אחרי
  ✦ signOut מנקה את currentUser
  ✦ isAdmin=false למשתמש רגיל
  ✦ isAdmin=true למשתמש עם role='admin' ב-Firestore

describe('useAuth hook')
  ✦ זורק שגיאה אם משתמש מחוץ ל-AuthProvider
  ✦ מחזיר את ה-context הנכון בתוך Provider
```

### 1.2 LoginModal (`src/test/login-modal.test.tsx`)

```
describe('LoginModal — render')
  ✦ מציג כפתור Google
  ✦ מציג שדות email + password
  ✦ מציג לינק "שכחת סיסמה?"
  ✦ מציג tabs: כניסה / הרשמה

describe('LoginModal — validation')
  ✦ כפתור submit מושבת אם email ריק
  ✦ כפתור submit מושבת אם password קצר מ-6 תווים
  ✦ מציג שגיאה על email לא תקין
  ✦ מציג שגיאה "סיסמה שגויה" על auth/wrong-password
  ✦ מציג שגיאה "משתמש לא קיים" על auth/user-not-found
  ✦ מציג שגיאה "אימייל כבר בשימוש" על auth/email-already-in-use

describe('LoginModal — actions')
  ✦ קורא ל-signInWithPopup על לחיצת Google
  ✦ קורא ל-signInWithEmailAndPassword על submit כניסה
  ✦ קורא ל-createUserWithEmailAndPassword על submit הרשמה
  ✦ סוגר modal לאחר כניסה מוצלחת
  ✦ קורא ל-sendPasswordResetEmail על "שכחת סיסמה"
```

### 1.3 Firestore User Document (`src/test/firestore-users.test.ts`)

```
describe('createUserDocument')
  ✦ יוצר document ב-/users/{uid} עם שדות נכונים
  ✦ role ברירת מחדל = 'user'
  ✦ createdAt = serverTimestamp
  ✦ לא דורס document קיים (idempotent)

describe('updateLastSeen')
  ✦ מעדכן lastSeen בלבד, לא מחיקת שדות אחרים
```

---

## שלב 2 — בדיקות Spotify

### 2.1 OAuth PKCE (`src/test/spotify-auth.test.ts`)

```
describe('generateCodeVerifier')
  ✦ מחזיר string באורך 43–128 תווים
  ✦ מכיל רק תווים מותרים (A-Z a-z 0-9 - _ . ~)
  ✦ כל קריאה מחזירה ערך שונה (random)

describe('generateCodeChallenge')
  ✦ מחזיר base64url של SHA-256(verifier)
  ✦ תוצאה דטרמיניסטית לאותו input

describe('buildSpotifyAuthUrl')
  ✦ מכיל client_id נכון
  ✦ מכיל redirect_uri נכון
  ✦ מכיל response_type=code
  ✦ מכיל code_challenge_method=S256
  ✦ מכיל כל ה-scopes הנדרשים

describe('handleSpotifyCallback')
  ✦ מחלץ code מ-URL params
  ✦ שולח POST ל-/api/token עם PKCE params
  ✦ שומר access_token + refresh_token ב-Firestore
  ✦ מטפל בשגיאת access_denied
  ✦ מטפל בשגיאת invalid_grant
```

### 2.2 Spotify API Wrappers (`src/test/spotify-api.test.ts`)

```
describe('getCurrentTrack')
  ✦ מחזיר { trackName, artistName, albumArt, progress, duration }
  ✦ מחזיר null אם אין שמיעה פעילה (204 response)
  ✦ מרענן token אם פג (401 response)

describe('playPause / next / previous')
  ✦ שולח PUT /me/player/play עם device_id
  ✦ שולח PUT /me/player/pause
  ✦ שולח POST /me/player/next
  ✦ שולח POST /me/player/previous
  ✦ מטפל ב-403 (Premium required) — מציג הודעה

describe('setVolume')
  ✦ שולח volume_percent תקין (0–100)
  ✦ דוחה ערכים מחוץ לטווח
```

### 2.3 SpotifyPlayer Component (`src/test/spotify-player.test.tsx`)

```
describe('SpotifyPlayer — render')
  ✦ לא מוצג למשתמש לא מחובר
  ✦ מציג כפתור "חבר Spotify" למשתמש מחובר ללא Spotify
  ✦ מציג player widget כשיש track פעיל
  ✦ מציג "לא מתנגן כלום" כשאין track

describe('SpotifyPlayer — controls')
  ✦ לחיצה ▶/⏸ קוראת ל-playPause
  ✦ לחיצה ⏭ קוראת ל-next
  ✦ לחיצה ⏮ קוראת ל-previous
  ✦ גרירת volume slider קוראת ל-setVolume

describe('SpotifyPlayer — polling')
  ✦ מרענן track state כל 3 שניות
  ✦ מפסיק polling ב-unmount (no memory leak)
```

---

## שלב 3 — בדיקות Feedback

### 3.1 FeedbackModal (`src/test/feedback-modal.test.tsx`)

```
describe('FeedbackModal — render')
  ✦ לא מוצג למשתמש לא מחובר
  ✦ מציג 3 tabs: בעיה / שיפור / המלצה
  ✦ tab פעיל מסומן ויזואלית

describe('FeedbackModal — validation')
  ✦ submit מושבת אם textarea ריק
  ✦ submit מושבת אם טקסט קצר מ-10 תווים
  ✦ priority field מוצג רק ב-tab "שיפור"

describe('FeedbackModal — submission')
  ✦ כותב document ל-Firestore /feedback עם type נכון
  ✦ שומר userId + userEmail של המשתמש
  ✦ שומר appVersion מ-package.json
  ✦ מציג "נשלח בהצלחה" אחרי שמירה
  ✦ מנקה textarea אחרי שמירה
  ✦ מטפל בשגיאת network — מציג הודעת שגיאה
```

---

## שלב 4 — בדיקות Admin Dashboard

### 4.1 אוטנטיקציה ב-Admin (`src/test/admin-auth.test.ts`)

```
describe('Admin route guard')
  ✦ מפנה ל-/login אם לא מחובר
  ✦ מפנה ל-/unauthorized אם role != 'admin'
  ✦ מאפשר גישה אם role == 'admin'
```

### 4.2 UsersPage (`src/test/admin-users-page.test.tsx`)

```
describe('UsersPage')
  ✦ מציג טבלה עם עמודות: displayName, email, role, createdAt, lastSeen
  ✦ מציג מספר כולל של משתמשים
  ✦ פילטר לפי role עובד
  ✦ מיון לפי createdAt עובד (עולה / יורד)
  ✦ export CSV כולל את כל השורות הנראות
```

### 4.3 FeedbackPage (`src/test/admin-feedback-page.test.tsx`)

```
describe('FeedbackPage')
  ✦ מציג פניות ממויינות לפי createdAt desc
  ✦ פילטר לפי type: bug / feature / compliment
  ✦ פילטר לפי status: open / reviewed / closed
  ✦ לחיצת "סמן כנסקר" מעדכנת status ב-Firestore
  ✦ לחיצת "סגור" מעדכנת status ב-Firestore
```

### 4.4 AnalyticsPage (`src/test/admin-analytics-page.test.tsx`)

```
describe('AnalyticsPage — KPIs')
  ✦ מציג סה"כ משתמשים
  ✦ מציג משתמשים פעילים 7 ימים
  ✦ מציג משתמשים פעילים 30 ימים
  ✦ מציג מספר פניות פתוחות

describe('AnalyticsPage — charts')
  ✦ גרף map_open מציג נתונים לפי יום
  ✦ גרף layer_toggle מציג top-5 שכבות
  ✦ גרף popup_open מציג top-10 ישובים
  ✦ date range picker משנה את הנתונים
```

---

## שלב 5 — בדיקות Analytics Tracking

### 5.1 trackEvent (`src/test/track-event.test.ts`)

```
describe('trackEvent')
  ✦ כותב document ל-Firestore /analytics
  ✦ userId = currentUser.uid אם מחובר
  ✦ userId = 'anonymous' אם לא מחובר
  ✦ platform = 'mobile' על mobile userAgent
  ✦ platform = 'desktop' על desktop userAgent
  ✦ timestamp = serverTimestamp (לא client time)
  ✦ לא זורק שגיאה אם Firestore לא זמין (silent fail)

describe('event tracking integration')
  ✦ map_open נורה עם טעינת App
  ✦ layer_toggle נורה עם שינוי שכבה
  ✦ popup_open נורה עם לחיצה על ישוב (כולל t.id)
  ✦ sect_toggle נורה עם toggle צביעת עדות
```

---

## שלב 6 — בדיקות קיימות (רגרסיה)

> כל השינויים החדשים חייבים לעבור את 147 הבדיקות הקיימות

```
✦ geo-data-integrity (35) — coordinates, sects, names
✦ map-center-drift (22) — drift, rotation, compass
✦ app-state-persistence (42) — localStorage, LayerVis
✦ localStorage-persistence (33) — r/w, version, defaults
✦ compass-rotation (15) — azimuth display, button visibility
```

---

## Manual QA Checklist

### קבלת גישה

| בדיקה | Mobile | Desktop |
|---|---|---|
| כניסה עם Google | ⬜ | ⬜ |
| כניסה עם email/password | ⬜ | ⬜ |
| הרשמה + כניסה | ⬜ | ⬜ |
| שחזור סיסמה | ⬜ | ⬜ |
| logout | ⬜ | ⬜ |
| session נשמר לאחר reload | ⬜ | ⬜ |

### Spotify

| בדיקה | Mobile | Desktop |
|---|---|---|
| כפתור "חבר Spotify" מופיע | ⬜ | ⬜ |
| OAuth redirect עובד | ⬜ | ⬜ |
| widget מוצג עם track | ⬜ | ⬜ |
| play/pause עובד | ⬜ | ⬜ |
| next/previous עובד | ⬜ | ⬜ |
| widget לא חוסם את המפה | ⬜ | ⬜ |
| widget לא חוסם label clicks | ⬜ | ⬜ |
| הודעת Premium אם Free | ⬜ | ⬜ |

### Feedback

| בדיקה | Mobile | Desktop |
|---|---|---|
| כפתור פנייה מוצג למחובר | ⬜ | ⬜ |
| כפתור פנייה מוסתר ללא כניסה | ⬜ | ⬜ |
| שליחת bug report | ⬜ | ⬜ |
| שליחת feature request | ⬜ | ⬜ |
| שליחת המלצה | ⬜ | ⬜ |
| validation עובד | ⬜ | ⬜ |

### Map — רגרסיה

| בדיקה | Mobile Topo | Desktop |
|---|---|---|
| לחיצה על בינת ג׳בייל פותחת popup | ⬜ | ⬜ |
| לחיצה על כאוכבא פותחת popup | ⬜ | ⬜ |
| toggle צביעת עדות — כל LB ישובים מקבלים צבע | ⬜ | ⬜ |
| toggle מרנדר בזמן אמת | ⬜ | ⬜ |
| מיקום מפה נשמר בפתיחת/סגירת תפריט | ⬜ | ⬜ |
| כפתור מצפן מופיע בסיבוב | ⬜ | ⬜ |

---

## CI — GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, dev]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm test -- --run
      - run: npm run build
      - run: npm run typecheck
```

---

## יעדי כיסוי (Coverage Targets)

| מודול | שורות | branches | functions |
|---|---|---|---|
| `auth/` | ≥ 90% | ≥ 85% | ≥ 90% |
| `spotify/` | ≥ 85% | ≥ 80% | ≥ 85% |
| `feedback/` | ≥ 90% | ≥ 85% | ≥ 90% |
| `analytics/` | ≥ 95% | ≥ 90% | ≥ 95% |
| `data/geo.ts` | 100% | 100% | 100% |

הפקת דוח כיסוי:
```bash
npm run test -- --run --coverage
```

---

## כלים ומוקים

```ts
// Firebase mock (vitest)
vi.mock('../firebase', () => ({
  auth: mockAuth,
  db: mockDb,
}));

// Spotify API mock
vi.mock('../spotify/spotifyApi', () => ({
  getCurrentTrack: vi.fn().mockResolvedValue(mockTrack),
  playPause: vi.fn(),
  next: vi.fn(),
}));
```

ספריות:
- `vitest` — test runner
- `@testing-library/react` — component testing
- `@firebase/rules-unit-testing` — Firestore rules testing
- `msw` (עתידי) — HTTP mocking לSpotify API
