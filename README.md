# South Lebanon Map — מפת דרום לבנון

Static Vite + React + Leaflet app, Hebrew RTL. Dark/light analytical dashboard
visualizing the area between the Blue Line and the Litani River, with layer
toggles, security-incident filters, distance measurement, road routing,
live-device location, recorded routes, user-created points of interest,
file-based sharing and QR-barcode peer-to-peer data transfer between devices.

Production URL: https://south-lebanon-map.vercel.app/

Hebrew user help: [`docs/HELP_HE.md`](docs/HELP_HE.md)

## Build & run

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # outputs to ./dist
npm run preview      # serves ./dist on port 4173
```

Deployable as a fully static bundle: `deploy_website(project_path="south-lebanon-map/dist")`.

## Key files

- `src/App.tsx` – top-level layout, filters, analytics, drawer
- `src/Map.tsx` – Leaflet map, layer groups, distance overlays
- `src/data/geo.ts` – Blue Line, Litani, towns, UNIFIL points, influence zones, incidents
- `src/data/sources.ts` – external source URLs (UNIFIL, UN OCHA, Reuters, BBC, AP, NPR, TOI, ACLED, OSM, CARTO)
- `src/util.ts` – Haversine, distance-to-polyline, formatting
- `docs/HELP_HE.md` – Hebrew end-user help and operating guide

## Main user features

- **Layered map** – population, UNIFIL reference points, Hezbollah influence
  zones, Blue Line, Litani River and filtered incident markers. Layer
  visibility is persisted in browser-local storage and restored on reopen.
- **Responsive mobile map** – collapsible panels and a floating menu button so
  the map can use most of the screen on phones.
- **Last map view restore** – the latest map center and zoom are persisted in
  browser-local storage and restored after reopening the app.
- **Topographic mode** – optional OpenTopoMap basemap for terrain and relief
  analysis, with closer zoom support.
- **Expanded Hebrew labels** – Hebrew label controls are visually separated
  into sub-layers for settlements/villages, ridges/mountains/valleys and
  wadis/streams/rivers. Normal mode shows a broader curated set of key village
  labels across western, central, eastern, Nabatieh and Zahrani/Sidon sectors.
  The dataset includes additional labels around the Silvester Ridge and Beit
  Yahoun area for denser Hebrew orientation.
  The “all labels” mode exposes the full label dataset without increasing text
  size, while large label mode enlarges labels and adds English transliteration.
- **Map search and focus** – a dedicated map search centers and zooms to
  settlements, cities, POIs, incidents, UNIFIL points and terrain features,
  placing a temporary focus marker at the selected result.
- **Filter search** – the free-text incident search still filters settlements,
  incidents, UNIFIL points, influence zones, terrain features including
  mountains and rivers, and user-created points of interest.
- **Theme modes** – dark, light and automatic day/night mode, persisted in
  browser-local storage so the app reopens in the last selected display mode.
- **Toast feedback** – key actions now show short, accessible confirmation or
  error messages, including route save/load/delete/import/export, live location
  activation and permission errors, route recording, point-of-interest
  save/delete/import/export and reset view.
- **Reset view** – restores default layer visibility, dark mode, label size,
  compass orientation, manual measurement state and broad map focus without
  deleting routes, recordings or custom points of interest. A short toast
  confirms that the reset completed.
- **Large labels** – enlarged Hebrew labels with English/transliterated names.
- **Mini navigation window** – “חלון מוקטן” opens an in-app floating mini
  navigation overlay on mobile browsers, including Chrome and Samsung Internet,
  to avoid unstable external-window behavior. On desktop it attempts Document
  Picture-in-Picture when supported, then a small popup, and finally the same
  in-app overlay.
- **Road navigation** – point-to-point routing through the public
  OSRM/OpenStreetMap route service, with distance and theoretical drive time.
- **Voice guidance in Hebrew or English** – local browser speech synthesis with
  language selection and three modes: off, basic route/distance announcements
  and detailed updates with origin, destination, time estimate, heading,
  location accuracy and route turn prompts. The voice test uses the selected
  language.
- **Route turn instructions** – OSRM routes request `steps=true` and preserve
  the returned turn steps for visual and spoken prompts. Imported or recorded
  routes can still fall back to local geometry-based estimates when no steps
  exist.
- **Navigation session persistence** – active origin/destination, route name and
  route geometry are saved in browser-local storage and restored after reload
  Live-location state is restored even when no navigation route is active, when
  the browser still allows geolocation access.
  when storage is available.
- **Compass mode** – toggle between north-up and travel-heading map rotation.
- **Live location** – when permission is granted, the device appears as an
  animated heading arrow with or without an active route. The map follows the
  device marker and raises the view to a close zoom without reducing a manually
  selected closer zoom. Manual map dragging temporarily pauses follow mode and
  reveals a “מרכז אותי” recenter button that returns to the live marker.
- **Route recording** – record a GPS track while driving, name it, save it in
  browser-local storage during use, export it to JSON and import it on another
  device. Browser background GPS support depends on the mobile OS/browser.
- **Saved routes** – save calculated or recorded routes, load them, delete
  them, export one route or export the full local route library.
- **Points of interest** – add a point by clicking the map, see a temporary
  draft marker before saving, attach a name and description, choose marker
  size/shape/color, keep points in browser-local storage, focus them, delete
  them, export all points to JSON and import them on another device.
- **Support development** – the in-app support drawer links to the developer
  portfolio, app sharing and a Bit donation link:
  https://www.bitpay.co.il/app/me/7193501F-35B9-B8F9-0E46-32EA6E76DDFAF94C
- **QR barcode data transfer** – the "העברת מרשמים" button in the header
  opens a two-tab modal: *Send* and *Receive*. The Send tab lets the user select
  which personal data to export (custom POIs, saved routes, multi-point routes,
  recorded GPS track) and generates a QR code on-screen using `qrcode.react`.
  The Receive tab activates the device camera and uses `jsqr` to scan frames in
  real time; when a valid code is detected, items are merged into the app state
  (deduplicating by id). Route paths are downsampled to ≤ 60 points to stay
  within QR capacity; full-fidelity transfer of long routes still uses JSON export.
  No internet connection, server or file-system access is required.
- **Coordinate popup with nearby-town info** – tapping empty map space opens a
  coord popup with the exact lat/lon and nav buttons (set as start or end). If
  the tapped location is within 500 m of a known Lebanese settlement, a
  collapsible "פרטים ▼" toggle reveals the town's name, sect affiliation and
  population level. The toggle uses CSS theme variables so it renders correctly
  in both dark and light themes.
- **Light-theme popup fix** – popup toggle button and nav buttons now use CSS
  variables (`--text-muted`, `--bg-3`, `--blue`, `--accent`) instead of
  hard-coded `rgba(255,255,255,…)` values, making them fully visible in light
  and auto-day theme modes.

## Privacy and data handling

- There is no shared application database and no server-side storage for user
  routes, recordings, live location or custom points of interest.
- User-created points of interest are saved in browser-local storage when the
  browser allows it. If local storage is blocked by an embedded browser, they
  still work in active app memory and should be exported to JSON before refresh.
- User-created routes and recordings are kept in browser-local storage when the
  browser allows it. Users can also export them to JSON for backup or transfer
  to another device.
- Sharing between devices is either file-based (JSON export/import) or
  QR-code based (the built-in barcode transfer modal). Both methods transfer
  data directly between devices without any server or shared database.
- Live location is read through the browser geolocation API after user
  permission. It is rendered locally in the browser and is not persisted by the
  app.
- Voice guidance is generated locally through the browser Web Speech API. The
  app does not upload voice, text-to-speech content or location data for spoken
  instructions. Hebrew voice quality depends on the installed browser/OS speech
  voices; English guidance is available as a fallback or preference.
- Simulated turn instructions are calculated locally in the browser from the
  active route points and are not stored in a shared database or uploaded to an
  application server.
- Browser GPS in the background is constrained by the mobile operating system
  and browser. The web app restores navigation state and saved track data when
  the user returns, but cannot guarantee continuous GPS capture while the screen
  is off on all devices.
- Browser mini-window behavior is constrained by browser support. The app uses
  standards-based Document Picture-in-Picture on supporting desktop browsers,
  but cannot force OS-level always-on-top z-order across every device and
  browser. Mobile browsers use an in-app overlay instead of external windows.
- Road routing sends selected origin/destination coordinates to the public
  OSRM route service. For maximum privacy, users should avoid OSRM routing and
  use manual measurement, local points of interest or imported/recorded routes.
- Donation payments happen externally through Bit. The app does not collect,
  process or store payment details.

## Data caveats

- All coordinates are **approximate**, drawn from public reporting (Wikipedia
  town pages, UNIFIL public materials, news articles).
- The Blue Line polyline is a coarse public-reference sketch — not
  survey-grade.
- The Hezbollah influence layer is **qualitative**: broad polygons indicating
  reported social/political presence. It deliberately contains no weapons
  sites, launch positions, tunnels, depots or targeting data.
- Incidents are illustrative public-report examples (2021–2025). The dataset
  is meant for educational visualization, not operational use.
- A visible disclaimer is rendered in the footer of the app and reiterated in
  the Sources drawer.
- Road routing is an educational estimate only. It does not include real-time
  traffic, roadblocks, military restrictions, safety assessment or access
  permissions. Route turn prompts are not official turn-by-turn navigation and
  do not include live lane guidance, street signs or road-rule validation.

## Test IDs (selected)

- `map-canvas`, `panel-layers`, `panel-analytics`
- `toggle-layer-pop|unifil|hez|blueLine|litani|topo|cityLabels|settlementLabels|ridgeLabels|waterLabels`
- `chip-type-{rocket|atgm|uav|idf_strike|unifil|ground|displacement}`
- `chip-sev-{low|med|high}`, `input-search`
- `select-year-from`, `select-year-to`
- `card-incident-{id}`, `detail-{id}`, `text-distance-blue`
- `button-measure`, `hud-measure`, `text-manual-distance`
- `button-sources`, `drawer-sources`, `button-close-drawer`
- `button-help`, `drawer-help`, `button-close-help`
- `button-support`, `drawer-support`, `link-donate-contact`, `button-share-app`
- `button-compass`, `button-live-location`
- `button-center-live`
- `button-reset-view`, `toast-message`
- `button-voice-off`, `button-voice-basic`, `button-voice-detailed`,
  `button-voice-lang-he`, `button-voice-lang-en`, `button-voice-test`,
  `text-voice-status`, `turn-instruction-card`, `text-turn-instruction`
- `button-mini-window`, `button-map-mini-window`, `mini-overlay`, `mini-nav-map`,
  `mini-turn-instruction`, `button-close-mini-overlay`
- `input-route-start-search`, `input-route-end-search`,
  `select-route-start`, `select-route-end`, `button-route-focus`
- `input-map-search`, `map-search-results`, `button-map-search-result-{id}`
- `toggle-all-labels`, `toggle-large-labels`
- `button-save-route`, `button-export-route`, `input-import-route`,
  `button-export-all-routes`
- `button-record-route`, `button-save-recording`, `button-export-recording`
- `button-add-poi-mode`, `input-poi-name`, `textarea-poi-description`,
  `button-save-poi`, `button-export-pois`, `input-import-pois`
- `button-transfer`, `transfer-modal-overlay`, `transfer-modal`,
  `transfer-modal-close`, `transfer-tab-send`, `transfer-tab-receive`,
  `transfer-send-panel`, `transfer-receive-panel`,
  `transfer-check-pois`, `transfer-check-routes`,
  `transfer-check-multi-routes`, `transfer-check-recording`,
  `transfer-qr-canvas`, `transfer-start-scan`, `transfer-stop-scan`,
  `transfer-scan-error`, `transfer-import-result`, `transfer-scan-again`,
  `transfer-video`
