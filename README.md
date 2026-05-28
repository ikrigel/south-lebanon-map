# South Lebanon Map — מפת דרום לבנון

Static Vite + React + Leaflet app, Hebrew RTL. Dark/light analytical dashboard
visualizing the area between the Blue Line and the Litani River, with layer
toggles, security-incident filters, distance measurement, road routing,
live-device location, recorded routes, user-created points of interest and
file-based sharing.

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
  zones, Blue Line, Litani River and filtered incident markers.
- **Responsive mobile map** – collapsible panels and a floating menu button so
  the map can use most of the screen on phones.
- **Topographic mode** – optional OpenTopoMap basemap for terrain and relief
  analysis, with closer zoom support.
- **Hebrew city-label layer** – separate Hebrew labels layer for easier search
  and orientation.
- **Search and focus** – search settlements, incidents, UNIFIL points,
  influence zones and user-created points of interest.
- **Theme modes** – dark, light and automatic day/night mode.
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
  when storage is available.
- **Compass mode** – toggle between north-up and travel-heading map rotation.
- **Live location** – when permission is granted, the device appears as an
  animated heading arrow with or without an active route. The map follows the
  device marker and raises the view to a close zoom without reducing a manually
  selected closer zoom.
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

## Privacy and data handling

- There is no shared application database and no server-side storage for user
  routes, recordings, live location or custom points of interest.
- User-created points of interest are saved in browser-local storage when the
  browser allows it. If local storage is blocked by an embedded browser, they
  still work in active app memory and should be exported to JSON before refresh.
- User-created routes and recordings are kept in browser-local storage when the
  browser allows it. Users can also export them to JSON for backup or transfer
  to another device.
- Sharing between devices is explicit and file-based: the user exports a JSON
  file and imports it on another device.
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
- `toggle-layer-pop|unifil|hez|blueLine|litani`
- `chip-type-{rocket|atgm|uav|idf_strike|unifil|ground|displacement}`
- `chip-sev-{low|med|high}`, `input-search`
- `select-year-from`, `select-year-to`
- `card-incident-{id}`, `detail-{id}`, `text-distance-blue`
- `button-measure`, `hud-measure`, `text-manual-distance`
- `button-sources`, `drawer-sources`, `button-close-drawer`
- `button-help`, `drawer-help`, `button-close-help`
- `button-support`, `drawer-support`, `link-donate-contact`, `button-share-app`
- `button-compass`, `button-live-location`
- `button-voice-off`, `button-voice-basic`, `button-voice-detailed`,
  `button-voice-lang-he`, `button-voice-lang-en`, `button-voice-test`,
  `text-voice-status`, `turn-instruction-card`, `text-turn-instruction`
- `button-mini-window`, `button-map-mini-window`, `mini-overlay`, `mini-nav-map`,
  `mini-turn-instruction`, `button-close-mini-overlay`
- `input-route-start-search`, `input-route-end-search`,
  `select-route-start`, `select-route-end`, `button-route-focus`
- `button-save-route`, `button-export-route`, `input-import-route`,
  `button-export-all-routes`
- `button-record-route`, `button-save-recording`, `button-export-recording`
- `button-add-poi-mode`, `input-poi-name`, `textarea-poi-description`,
  `button-save-poi`, `button-export-pois`, `input-import-pois`
