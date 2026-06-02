import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import L from 'leaflet';
import {
  blueLine, litaniRiver, litaniBufferZone, zahraniRiver, awaliRiver,
  towns, unifilPoints, influenceZones, terrainFeatures,
  Incident, Town,
} from './data/geo';
import { TYPE_COLOR, TYPE_LABEL, escapeHtml, fmtDate, fmtKm } from './util';

/** Imperative handle exposed to parent via ref */
export type MapHandle = {
  /** Snapshot the current geo-center. Call BEFORE any layout change so the
   *  snapshot is taken before Leaflet’s own ResizeObserver fires. */
  snapshotCenter: () => void;
  /** Call after any layout change so Leaflet recalculates tile bounds */
  invalidateSize: () => void;
};

export type LayerVis = {
  pop: boolean;
  unifil: boolean;
  hez: boolean;
  blueLine: boolean;
  litani: boolean;
  rivers: boolean;  // Zahrani + Awali detailed river lines
  topo: boolean;
  cityLabels: boolean;
  settlementLabels: boolean;
  ridgeLabels: boolean;
  waterLabels: boolean;
  sectColors: boolean;
};

export type MapProps = {
  /** Initial center to use when the map first mounts. When provided, fitBounds is skipped. */
  initialCenter?: { lat: number; lon: number; zoom: number };
  visible: LayerVis;
  filteredIncidents: Incident[];
  selectedIncident: Incident | null;
  onSelectIncident: (id: string | null) => void;
  measureMode: boolean;
  pointPickMode: boolean;
  manualMeasure: [number, number][];
  onMapClick: (lat: number, lon: number) => void;
  distanceLine: [[number, number], [number, number]] | null;
  theme: 'light' | 'dark';
  largeLabels: boolean;
  allLabels: boolean;
  focusTarget: { lat: number; lon: number; zoom?: number; id: string; label?: string } | null;
  navigationRoute: {
    start: { lat: number; lon: number; label: string };
    end: { lat: number; lon: number; label: string };
    km: number;
    durationMin?: number;
    path?: [number, number][];
  } | null;
  routeOverlays: {
    id: string;
    path: [number, number][];
    color: string;
    lineStyle: 'solid' | 'dashed' | 'dotted';
    labelHe: string;
    km: number;
    durationMin?: number;
    isActive: boolean;
  }[];
  routeDisplayMode: 'road' | 'aerial' | 'both';
  liveLocation: { lat: number; lon: number; accuracy?: number; heading?: number | null } | null;
  liveCenterRequestId: number;
  onLiveFollowDetachedChange: (detached: boolean) => void;
  onMapViewChange: (view: { lat: number; lon: number; zoom: number }) => void;
  recordedTrack: [number, number][];
  compassMode: boolean;
  mapBearing: number;
  /** User-controlled map rotation in degrees (0 = north up) */
  userRotation: number;
  onUserRotationChange: (deg: number) => void;
  /** When true, pinch gestures only zoom — rotation is locked. */
  rotationLocked?: boolean;
  poiDraft: { lat: number; lon: number } | null;
  poiDraftStyle: { markerColor: string; markerShape: string; markerSize: string };
  customPois: {
    id: string;
    name: string;
    description: string;
    lat: number;
    lon: number;
    createdAt: string;
    markerColor: string;
    markerShape: string;
    markerSize: string;
  }[];
  multiRouteDraft: { lat: number; lon: number; order: number }[];
  activeMultiRoute: { points: { lat: number; lon: number; order: number }[]; name: string } | null;
  /** Called when the user taps a "navigate here" button inside a map popup. */
  onNavigateToPoint?: (lat: number, lon: number, label: string) => void;
  /** Zoom level to use when following live location during navigation.
   *  Corresponds to map-scale levels: 18≈1:20, 17≈1:50, 16≈1:100, 15≈1:200,
   *  13≈1:500, 12≈1:1000, 11≈1:2000 (all at Lebanon latitude ~33.5°). */
  navFollowZoom?: number;
};

const POP_RADIUS: Record<Town['pop_band'], number> = { sm: 5, md: 8, lg: 12, xl: 16 };
const TILESETS = {
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  topo: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
};
const NAVIGATION_FOLLOW_MIN_ZOOM = 17;

const SECT_COLORS: Record<string, string> = {
  shia:     '#2a8a6e',  // ירוק כהה
  sunni:    '#c97d2a',  // כתום
  druze:    '#7b3fa0',  // סגול
  christian:'#b03030',  // אדום
  mixed:    '#6b7280',  // אפור
  jewish:   '#1a5fa8',  // כחול
};

const labelHtml = (he: string, en?: string, sect?: string) => {
  const dot = sect && SECT_COLORS[sect]
    ? `<span class="sect-dot" style="background:${SECT_COLORS[sect]}"></span>`
    : '';
  return `${dot}<span class="label-he">${he}</span>${en ? `<span class="label-en">${en}</span>` : ''}`;
};

const poiSizePx = (size: string) => size === 'lg' ? 42 : size === 'sm' ? 24 : 32;
const poiShapeClass = (shape: string) =>
  shape === 'square' || shape === 'diamond' || shape === 'star' ? `poi-shape-${shape}` : 'poi-shape-circle';
const poiSymbol = (shape: string, draft = false) => draft ? '＋' : shape === 'star' ? '★' : '';
const poiIconHtml = (color: string, shape: string, size: string, draft = false) => {
  const px = poiSizePx(size);
  const rotation = shape === 'diamond' ? 'rotate(45deg)' : 'none';
  const symbolRotation = shape === 'diamond' ? 'transform: rotate(-45deg);' : '';
  const safeColor = /^#[0-9a-fA-F]{6}$/.test(color) ? color : '#f6c453';
  return `<span class="poi-pin ${poiShapeClass(shape)}${draft ? ' poi-pin-draft' : ''}" style="width:${px}px;height:${px}px;background:${safeColor};transform:${rotation};"><span style="${symbolRotation}">${poiSymbol(shape, draft)}</span></span>`;
};

/** Builds an HTML nav-button that the delegated listener picks up via data-nav-* attrs. */
const navBtn = (lat: number, lon: number, label: string) =>
  `<button class="popup-nav-btn" data-nav-lat="${lat}" data-nav-lon="${lon}" data-nav-label="${label.replace(/"/g, '&quot;')}">▶ נווט לכאן</button>`;

const MapView = forwardRef<MapHandle, MapProps>(function MapView(props, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  // Tracks the last known geo-center/zoom, updated on every moveend/zoomend.
  // Used by invalidateSize to restore view after layout changes, because
  // map.getCenter() is unreliable once Leaflet has already recalculated its
  // pixel origin for the new container size.
  const savedViewRef = useRef<{ center: L.LatLng; zoom: number } | null>(null);
  // Always reflects the current userRotation without causing effect re-runs.
  // Used by the predrag compensation handler.
  const userRotationRef = useRef(0);
  // Tracks props.userRotation (without compass offset) for the touch-rotation handler.
  const userOnlyRotationRef = useRef(0);

  useImperativeHandle(ref, () => ({
    snapshotCenter: () => {
      // Called SYNCHRONOUSLY before any layout change (before rAF).
      // Leaflet's ResizeObserver may fire during the rAF gap and corrupt
      // getCenter(), so we snapshot here while the layout is still stable.
      const map = mapRef.current;
      if (!map) return;
      savedViewRef.current = { center: map.getCenter(), zoom: map.getZoom() };
    },
    invalidateSize: () => {
      // App.tsx already waited double-rAF so the CSS grid is applied.
      //
      // Root cause: when the container resizes, Leaflet recalculates
      // _pixelOrigin = project(center) - viewHalf + panePos.
      // viewHalf changes with the container, so _pixelOrigin drifts and
      // the visible area shifts east/west. _rawPanBy only moves the pane
      // but does not fix _pixelOrigin, so it cannot cure the drift.
      //
      // Fix: capture the geo-center from snapshotCenter() (taken before any
      // layout change), let Leaflet invalidate tile bounds, then call setView
      // with the saved center and the CURRENT zoom (which invalidateSize
      // never changes). This forces _pixelOrigin to be recalculated correctly
      // for the new container size, keeping the viewport locked on the same
      // geographic point.
      const map = mapRef.current;
      if (!map) return;
      const saved = savedViewRef.current;
      const center = saved ? saved.center : map.getCenter();
      const zoom = map.getZoom(); // invalidateSize never changes zoom
      map.invalidateSize({ animate: false, pan: false });
      // setView recalculates _pixelOrigin for the new container size,
      // anchoring it on the saved geo-center without changing zoom.
      map.setView(center, zoom, { animate: false, noMoveStart: true } as L.ZoomPanOptions);
    },
  }), []);
  const lastLiveFollowRef = useRef<{ lat: number; lon: number; at: number } | null>(null);
  const liveFollowDetachedRef = useRef(false);

  const layersRef = useRef<{
    base?: L.TileLayer;
    pop?: L.LayerGroup;
    unifil?: L.LayerGroup;
    hez?: L.LayerGroup;
    blueLine?: L.LayerGroup;
    litani?: L.LayerGroup;
    rivers?: L.LayerGroup;
    incidents?: L.LayerGroup;
    selectedHL?: L.LayerGroup;
    measure?: L.LayerGroup;
    distance?: L.LayerGroup;
    labels?: L.LayerGroup;
    route?: L.LayerGroup;
    live?: L.LayerGroup;
    recording?: L.LayerGroup;
    pois?: L.LayerGroup;
    focus?: L.LayerGroup;
    multiRoute?: L.LayerGroup;
  }>({});
  // Holds refs to route polylines keyed by overlay id — updated by Effect B
  // to change active/inactive styling without clearLayers (no animation reset).
  const routePolylineRefs = useRef<Map<string, L.Polyline>>(new Map());

  // ---- initialize map once ----
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [33.2, 35.4],
      zoom: 11,
      minZoom: 9,
      maxZoom: 19,
      zoomControl: true,
      attributionControl: true,
    });
    mapRef.current = map;

    // ---- Custom pane: popPane sits above marker-pane (600) so circleMarkers
    //      receive touch events BEFORE Hebrew label divIcons (which are pointer-events:none
    //      but on mobile Leaflet's pane-level touch handling still intercepts below-pane
    //      SVG elements). z-index 650 = between marker-pane(600) and tooltip-pane(650).
    map.createPane('popPane');
    map.getPane('popPane')!.style.zIndex = '650';
    // Do NOT set pointerEvents:none on the pane — SVG circles need to receive
    // touch events. Leaflet handles pointer-events on individual SVG elements.

    // ---- Pan compensation for map rotation ----
    // Leaflet computes drag offsets in raw screen-pixel space and does not know
    // that the #map container is CSS-rotated. We listen on 'predrag' (fires
    // before Leaflet moves the map pane) and counter-rotate the offset vector
    // by -θ so dragging always follows the user's finger direction on screen.
    map.whenReady(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const draggable = (map.dragging as any)?._draggable;
      if (!draggable) return;
      draggable.on('predrag', () => {
        const deg = userRotationRef.current;
        if (!deg) return;
        const rad = (deg * Math.PI) / 180;
        const cos = Math.cos(-rad);
        const sin = Math.sin(-rad);
        const dx = draggable._newPos.x - draggable._startPos.x;
        const dy = draggable._newPos.y - draggable._startPos.y;
        draggable._newPos.x = draggable._startPos.x + (dx * cos - dy * sin);
        draggable._newPos.y = draggable._startPos.y + (dx * sin + dy * cos);
      });
    });

    const base = L.tileLayer(TILESETS[props.theme], {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
      maxNativeZoom: 19,
    }).addTo(map);
    layersRef.current.base = base;

    // initial bounds: use saved view if available, otherwise fit default south Lebanon bounds
    if (props.initialCenter) {
      map.setView(
        [props.initialCenter.lat, props.initialCenter.lon],
        props.initialCenter.zoom,
        { animate: false, noMoveStart: true },
      );
    } else {
      map.fitBounds([
        [33.05, 35.05],
        [33.45, 35.70],
      ]);
    }

    // ---- Blue Line layer ----
    const blueLineGroup = L.layerGroup();
    L.polyline(blueLine, {
      color: '#5a8fbf',
      weight: 3,
      opacity: 0.9,
      dashArray: '6 4',
    })
      .bindPopup(
        '<strong>הקו הכחול (Blue Line)</strong><br/>קו נסיגת האו״ם משנת 2000. כאן בייצוג מקורב לצורכי המחשה בלבד.<br/><a href="https://en.wikipedia.org/wiki/Blue_Line_(withdrawal_line)" target="_blank">מקור: ויקיפדיה</a>'
      )
      .addTo(blueLineGroup);
    // Israeli reference communities
    towns.filter(t => t.side === 'IL').forEach(t => {
      L.circleMarker([t.lat, t.lon], {
        radius: 4,
        color: '#88a3b8',
        weight: 1,
        fillColor: '#88a3b8',
        fillOpacity: 0.85,
      })
        .bindPopup(
          `<strong>${t.name_he}</strong> (ישראל)<br/>נקודת ייחוס לגבול.<br/>${navBtn(t.lat, t.lon, t.name_he)}`
        )
        .addTo(blueLineGroup);
    });
    layersRef.current.blueLine = blueLineGroup;

    // ---- Litani ----
    const litaniGroup = L.layerGroup();
    L.polygon(litaniBufferZone, {
      color: '#4e7fb0',
      weight: 0,
      fillColor: '#4e7fb0',
      fillOpacity: 0.07,
    }).addTo(litaniGroup);
    L.polyline(litaniRiver, {
      color: '#4e7fb0',
      weight: 3,
      opacity: 0.9,
    })
      .bindPopup(
        '<strong>נהר הליטני</strong><br/>גבול צפוני של אזור החיץ על־פי החלטת מועצת הביטחון 1701.<br/><a href="https://en.wikipedia.org/wiki/United_Nations_Security_Council_Resolution_1701" target="_blank">החלטה 1701 — ויקיפדיה</a>'
      )
      .addTo(litaniGroup);
    layersRef.current.litani = litaniGroup;

    // ---- Rivers (Zahrani + Awali detailed polylines) ----
    const RIVER_COLOR = '#4a90c4'; // blue, slightly lighter than litani
    const riversGroup = L.layerGroup();

    L.polyline(zahraniRiver, {
      color: RIVER_COLOR,
      weight: 2.5,
      opacity: 0.85,
      dashArray: undefined,
    })
      .bindPopup(
        '<strong>נהר הזהרני</strong><br/>' +
        'נהר בדרום לבנון, שפכו בים התיכון צפונית לשפך הליטני.<br/>' +
        'עובר דרך אזור נבטייה ומקורו ברמות לבנון.<br/>' +
        '<a href="https://en.wikipedia.org/wiki/Zahrani_River" target="_blank">ויקיפדיה — נהר הזהרני</a>'
      )
      .addTo(riversGroup);

    L.polyline(awaliRiver, {
      color: RIVER_COLOR,
      weight: 2.5,
      opacity: 0.85,
    })
      .bindPopup(
        '<strong>נהר האוואלי</strong><br/>' +
        'מקורו בהרי הברוק/ניחא בלבנון, זורם מערבה דרך עמק Bisri ואגם ג\'ון.<br/>' +
        'שפכו בים התיכון דרומית לצידון.<br/>' +
        '<a href="https://en.wikipedia.org/wiki/Awali_River" target="_blank">ויקיפדיה — נהר האוואלי</a>'
      )
      .addTo(riversGroup);

    layersRef.current.rivers = riversGroup;

    // ---- Population ----
    const popGroup = L.layerGroup();
    const useSectColors = props.visible.sectColors;
    const SECT_LABELS: Record<string, string> = { shia: 'שיעים', sunni: 'סונים', druze: 'דרוזים', christian: 'נוצרים', mixed: 'מעורב', jewish: 'יהודי' };
    towns.filter(t => t.side === 'LB').forEach(t => {
      const sectColor = (useSectColors && t.sect) ? (SECT_COLORS[t.sect] ?? '#d0b58a') : '#d0b58a';
      const sectLabel = t.sect ? (SECT_LABELS[t.sect] ?? '') : '';
      L.circleMarker([t.lat, t.lon], {
        radius: POP_RADIUS[t.pop_band],
        color: sectColor,
        weight: 1.5,
        fillColor: sectColor,
        fillOpacity: 0.22,
        pane: 'popPane',  // above label pane (600) → mobile touch hits circles first
      })
        .bindPopup(
          `<strong>${t.name_he}</strong>${(useSectColors && sectLabel) ? ` <span style="color:${sectColor};font-size:11px">● ${sectLabel}</span>` : ''}<br/><span style="color:#8b97a8">שם באנגלית/ערבית מתועתקת: ${t.name_en}</span><br/>אומדן אוכלוסיה: ~${t.pop_estimate.toLocaleString('he-IL')}<br/>${t.note ? `<em>${t.note}</em><br/>` : ''}<span style="color:#8b97a8">מקור: ויקיפדיה / אומדן ציבורי</span><br/>${navBtn(t.lat, t.lon, t.name_he)}`
        )
        .addTo(popGroup);
    });
    layersRef.current.pop = popGroup;

    // ---- UNIFIL ----
    const unifilGroup = L.layerGroup();
    unifilPoints.forEach(u => {
      const icon = L.divIcon({
        className: '',
        html: `<div class="marker-unifil" style="width:${u.kind === 'hq' ? 22 : 16}px;height:${u.kind === 'hq' ? 22 : 16}px;border-radius:${u.kind === 'reference' ? '50%' : '4px'};font-size:${u.kind === 'hq' ? 11 : 9}px">UN</div>`,
        iconSize: [u.kind === 'hq' ? 22 : 16, u.kind === 'hq' ? 22 : 16],
        iconAnchor: [u.kind === 'hq' ? 11 : 8, u.kind === 'hq' ? 11 : 8],
      });
      L.marker([u.lat, u.lon], { icon })
        .bindPopup(
          `<strong>${u.name_he}</strong><br/>${u.note_he}<br/><a href="https://unifil.unmissions.org/" target="_blank">מקור: יוניפי״ל (אתר רשמי)</a><br/>${navBtn(u.lat, u.lon, u.name_he)}`
        )
        .addTo(unifilGroup);
    });
    layersRef.current.unifil = unifilGroup;

    // ---- Hezbollah influence zones ----
    const hezGroup = L.layerGroup();
    influenceZones.forEach(z => {
      L.polygon(z.polygon, {
        color: '#b56466',
        weight: 1.2,
        fillColor: '#b56466',
        fillOpacity: z.intensity === 'reported' ? 0.16 : 0.09,
        dashArray: '4 4',
        interactive: false,   // לא חוסם קליקים על ישובים מתחת
      }).addTo(hezGroup);
    });
    layersRef.current.hez = hezGroup;

    // ---- prepare empty groups for incidents / interactions ----
    layersRef.current.incidents = L.layerGroup();
    layersRef.current.selectedHL = L.layerGroup();
    layersRef.current.measure = L.layerGroup();
    layersRef.current.distance = L.layerGroup();
    layersRef.current.labels = L.layerGroup();
    layersRef.current.route = L.layerGroup();
    layersRef.current.live = L.layerGroup();
    layersRef.current.recording = L.layerGroup();
    layersRef.current.pois = L.layerGroup();
    layersRef.current.multiRoute = L.layerGroup();
    layersRef.current.incidents.addTo(map);
    layersRef.current.selectedHL.addTo(map);
    layersRef.current.measure.addTo(map);
    layersRef.current.distance.addTo(map);
    layersRef.current.labels.addTo(map);
    layersRef.current.route.addTo(map);
    layersRef.current.live.addTo(map);
    layersRef.current.recording.addTo(map);
    layersRef.current.pois.addTo(map);
    layersRef.current.multiRoute.addTo(map);

    const reportView = () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      // Keep savedViewRef in sync — used by invalidateSize to restore view
      savedViewRef.current = { center, zoom };
      props.onMapViewChange({
        lat: center.lat,
        lon: center.lng,
        zoom,
      });
    };
    // Also capture initial view immediately after fitBounds settles
    map.once('moveend', reportView);
    map.on('moveend zoomend', reportView);

    return () => {
      map.off('moveend zoomend', reportView);
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- switch base-map brightness/theme ----
  useEffect(() => {
    const base = layersRef.current.base;
    if (!base) return;
    if (props.visible.topo) {
      base.setUrl(TILESETS.topo);
      base.options.subdomains = ['a', 'b', 'c'] as unknown as string;
      base.options.maxNativeZoom = 17;
      base.options.maxZoom = 19;
      base.getAttribution = () => '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://opentopomap.org/">OpenTopoMap</a>';
    } else {
      base.setUrl(TILESETS[props.theme]);
      base.options.subdomains = 'abcd';
      base.options.maxNativeZoom = 19;
      base.options.maxZoom = 19;
      base.getAttribution = () => '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';
    }
  }, [props.theme, props.visible.topo]);

  // ---- visual compass rotation (compass mode) + user rotation (manual) ----
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const compassDeg = props.compassMode ? -props.mapBearing : 0;
    // User rotation is additive on top of compass mode
    const totalDeg = compassDeg + props.userRotation;
    el.style.setProperty('--map-rotation', `${totalDeg}deg`);
    el.classList.toggle('compass-follow', props.compassMode);
    el.classList.toggle('map-rotated', props.userRotation !== 0 || props.compassMode);
    // Keep refs in sync
    userRotationRef.current = totalDeg;        // total (compass+user) — for predrag
    userOnlyRotationRef.current = props.userRotation; // user only — for touch rotate
  }, [props.compassMode, props.mapBearing, props.userRotation]);

  // ---- Two-finger rotate (touch) + Right-click drag (desktop) ----
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // --- touch two-finger rotation ---
    // Strategy: let Leaflet handle pinch-zoom freely.
    // We detect TWIST (angle change without significant distance change) and
    // apply rotation on top. Both can happen simultaneously.
    let prevAngle = 0;
    let prevDist = 0;
    let tracking = false;
    // Accumulated rotation delta — updated incrementally each touchmove
    // so large cumulative rotation works even if each step is small.
    let accumulatedDelta = 0;
    // Whether we have "committed" to a rotate gesture (past the dead-zone).
    // Once committed, we keep tracking until touchend.
    let committed = false;

    const getTouchAngle = (t1: Touch, t2: Touch) =>
      Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX) * (180 / Math.PI);

    const getTouchDist = (t1: Touch, t2: Touch) => {
      const dx = t2.clientX - t1.clientX;
      const dy = t2.clientY - t1.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    // Normalise angle difference to [-180, 180]
    const angleDiff = (a: number, b: number) => {
      let d = a - b;
      while (d > 180) d -= 360;
      while (d < -180) d += 360;
      return d;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 2) { tracking = false; committed = false; accumulatedDelta = 0; return; }
      // Do NOT preventDefault — let Leaflet handle pinch-zoom normally
      prevAngle = getTouchAngle(e.touches[0], e.touches[1]);
      prevDist  = getTouchDist(e.touches[0], e.touches[1]);
      accumulatedDelta = 0;
      committed = false;
      tracking = true;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!tracking || e.touches.length !== 2) return;
      const currentAngle = getTouchAngle(e.touches[0], e.touches[1]);
      const currentDist  = getTouchDist(e.touches[0], e.touches[1]);

      // Incremental step for this frame
      const stepAngle = angleDiff(currentAngle, prevAngle);
      const distChange = Math.abs(currentDist - prevDist) / Math.max(prevDist, 1);

      // Accept rotation step when angle dominates over zoom change.
      // distChange < 0.4 allows realistic two-finger twists that also
      // change spread slightly. stepAngle threshold 1° prevents drift noise.
      if (Math.abs(stepAngle) > 1 && distChange < 0.4) {
        accumulatedDelta += stepAngle;
      }

      // Commit to rotate gesture once accumulated delta exceeds 3° dead-zone
      if (!committed && Math.abs(accumulatedDelta) > 3) {
        committed = true;
      }

      if (committed && !props.rotationLocked) {
        // Use ref (not props.userRotation) so this handler doesn't need
        // props.userRotation in the deps array — which would cause the
        // effect (and its local state) to reset on every rotation update.
        props.onUserRotationChange(userOnlyRotationRef.current + stepAngle);
      }

      // Update baseline for next frame (incremental tracking)
      prevAngle = currentAngle;
      prevDist  = currentDist;
      // Let Leaflet handle pinch-zoom — no preventDefault
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        tracking = false;
        committed = false;
        accumulatedDelta = 0;
      }
    };

    // --- right-click drag rotation (desktop) ---
    let dragStartX = 0;
    let dragStartRotation = 0;
    let dragging = false;

    const onContextMenuDown = (e: MouseEvent) => {
      if (e.button !== 2) return;
      // Stop Leaflet from getting this right-click
      e.preventDefault();
      e.stopPropagation();
      dragStartX = e.clientX;
      dragStartRotation = userOnlyRotationRef.current;
      dragging = true;
    };

    const onContextMenuMove = (e: MouseEvent) => {
      if (!dragging || props.rotationLocked) return;
      const delta = (e.clientX - dragStartX) * 0.5; // 0.5 deg per pixel
      props.onUserRotationChange(dragStartRotation + delta);
    };

    const onContextMenuUp = () => { dragging = false; };

    const suppressContextMenu = (e: Event) => {
      if (dragging || Math.abs((userOnlyRotationRef.current - dragStartRotation)) > 2) e.preventDefault();
    };

    // Touch: passive listeners — we never call preventDefault, so Leaflet
    // pinch-zoom works normally. We just read coordinates on top of it.
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    // Right-click drag: capture phase so we beat Leaflet's context-menu handler
    el.addEventListener('mousedown', onContextMenuDown, { capture: true });
    window.addEventListener('mousemove', onContextMenuMove);
    window.addEventListener('mouseup', onContextMenuUp);
    el.addEventListener('contextmenu', suppressContextMenu, { capture: true });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('mousedown', onContextMenuDown, { capture: true } as EventListenerOptions);
      window.removeEventListener('mousemove', onContextMenuMove);
      window.removeEventListener('mouseup', onContextMenuUp);
      el.removeEventListener('contextmenu', suppressContextMenu, { capture: true } as EventListenerOptions);
    };
  // props.userRotation intentionally omitted — we read it via userOnlyRotationRef
  // so the effect (and its local gesture state) is NOT reset on every rotation update.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.onUserRotationChange]);

  // ---- focus map from search results ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !props.focusTarget) return;
    // 'restore-last-map-view': use instant setView so savedViewRef is correct
    // immediately and not subject to async flyTo moveend timing issues.
    // All other focus targets (search results, incidents) use animated flyTo.
    if (props.focusTarget.id === 'restore-last-map-view') {
      map.setView(
        [props.focusTarget.lat, props.focusTarget.lon],
        props.focusTarget.zoom ?? 12,
        { animate: false, noMoveStart: true },
      );
    } else {
      map.flyTo([props.focusTarget.lat, props.focusTarget.lon], props.focusTarget.zoom ?? 12, {
        animate: true,
        duration: 0.7,
      });
    }
    if (props.focusTarget.label) {
      if (!layersRef.current.focus) layersRef.current.focus = L.layerGroup().addTo(map);
      const focusGroup = layersRef.current.focus;
      focusGroup.clearLayers();
      L.circleMarker([props.focusTarget.lat, props.focusTarget.lon], {
        radius: 11,
        color: '#f6c453',
        weight: 3,
        fillColor: '#0f766e',
        fillOpacity: 0.92,
      })
        .bindTooltip(props.focusTarget.label, {
          direction: 'top',
          offset: [0, -10],
          permanent: true,
          className: 'focus-tooltip',
        })
        .addTo(focusGroup);
    }
  }, [props.focusTarget]);

  // ---- detach automatic live-location follow after manual map movement ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const detachLiveFollow = () => {
      if (!props.liveLocation || liveFollowDetachedRef.current) return;
      liveFollowDetachedRef.current = true;
      props.onLiveFollowDetachedChange(true);
    };
    map.on('dragstart', detachLiveFollow);
    return () => {
      map.off('dragstart', detachLiveFollow);
    };
  }, [props.liveLocation, props.onLiveFollowDetachedChange]);

  useEffect(() => {
    if (props.liveLocation) return;
    liveFollowDetachedRef.current = false;
    lastLiveFollowRef.current = null;
    props.onLiveFollowDetachedChange(false);
  }, [props.liveLocation, props.onLiveFollowDetachedChange]);

  // keep the click handler fresh, including custom app modes above Leaflet layers
  useEffect(() => {
    const map = mapRef.current;
    const container = containerRef.current;
    if (!map || !container) return;
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('.leaflet-control, .leaflet-popup')) return;
      if (!props.pointPickMode && target?.closest('.leaflet-marker-icon, .leaflet-tooltip')) return;
      const latLng = map.mouseEventToLatLng(event);
      // In normal (non-mode) navigation: open a coord popup with a nav button.
      if (!props.pointPickMode && props.onNavigateToPoint) {
        const coordLabel = `${latLng.lat.toFixed(5)}°N, ${latLng.lng.toFixed(5)}°E`;
        const popHtml =
          `<div style="min-width:180px">
            <div style="font-family:'JetBrains Mono',monospace;font-size:11px;color:#8b97a8;margin-bottom:6px">
              ${coordLabel}
            </div>
            ${navBtn(latLng.lat, latLng.lng, coordLabel)}
          </div>`;
        L.popup({ offset: [0, -4], closeButton: true, className: 'coord-popup' })
          .setLatLng([latLng.lat, latLng.lng])
          .setContent(popHtml)
          .openOn(map);
      }
      props.onMapClick(latLng.lat, latLng.lng);
    };
    container.addEventListener('click', handleClick);
    return () => container.removeEventListener('click', handleClick);
  }, [props.onMapClick, props.pointPickMode, props.onNavigateToPoint]);

  // ---- delegated "navigate here" click from popup buttons ----
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !props.onNavigateToPoint) return;
    const handleNavClick = (event: MouseEvent) => {
      const btn = (event.target as HTMLElement)?.closest<HTMLElement>('[data-nav-lat]');
      if (!btn) return;
      event.stopPropagation();
      const lat = parseFloat(btn.dataset.navLat ?? '');
      const lon = parseFloat(btn.dataset.navLon ?? '');
      const label = btn.dataset.navLabel ?? `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
      if (!isNaN(lat) && !isNaN(lon)) {
        props.onNavigateToPoint!(lat, lon, label);
        // close the popup
        mapRef.current?.closePopup();
      }
    };
    container.addEventListener('click', handleNavClick, { capture: true });
    return () => container.removeEventListener('click', handleNavClick, { capture: true } as EventListenerOptions);
  }, [props.onNavigateToPoint]);

  // ---- toggle layer visibility ----
  useEffect(() => {
    const map = mapRef.current;
    const L_ = layersRef.current;
    if (!map) return;
    const setVis = (group: L.LayerGroup | undefined, vis: boolean) => {
      if (!group) return;
      if (vis && !map.hasLayer(group)) group.addTo(map);
      if (!vis && map.hasLayer(group)) map.removeLayer(group);
    };
    // סדר שכבות: hez קודם (interactive:false), אחרכך pop מעליו כדי שהקליקים יעבדו
    setVis(L_.hez, props.visible.hez);
    setVis(L_.pop, props.visible.pop);
    setVis(L_.unifil, props.visible.unifil);
    setVis(L_.blueLine, props.visible.blueLine);
    setVis(L_.litani, props.visible.litani);
    setVis(L_.rivers, props.visible.rivers);
  }, [props.visible]);

  // ---- Rebuild pop layer when sectColors toggle changes ----
  useEffect(() => {
    const map = mapRef.current;
    const L_ = layersRef.current;
    if (!map || !L_.pop) return;
    const wasVisible = map.hasLayer(L_.pop);
    if (wasVisible) map.removeLayer(L_.pop);
    const popGroup = L.layerGroup();
    const useSectColors = props.visible.sectColors;
    const SECT_LABELS_: Record<string, string> = { shia: 'שיעים', sunni: 'סונים', druze: 'דרוזים', christian: 'נוצרים', mixed: 'מעורב', jewish: 'יהודי' };
    towns.filter(t => t.side === 'LB').forEach(t => {
      const sectColor = (useSectColors && t.sect) ? (SECT_COLORS[t.sect] ?? '#d0b58a') : '#d0b58a';
      const sectLabel = t.sect ? (SECT_LABELS_[t.sect] ?? '') : '';
      L.circleMarker([t.lat, t.lon], {
        radius: POP_RADIUS[t.pop_band],
        color: sectColor,
        weight: 1.5,
        fillColor: sectColor,
        fillOpacity: 0.22,
        pane: 'popPane',  // keep circles above label pane after rebuild
      })
        .bindPopup(
          `<strong>${t.name_he}</strong>${(useSectColors && sectLabel) ? ` <span style="color:${sectColor};font-size:11px">● ${sectLabel}</span>` : ''}<br/><span style="color:#8b97a8">שם באנגלית/ערבית מתועתקת: ${t.name_en}</span><br/>אומדן אוכלוסיה: ~${t.pop_estimate.toLocaleString('he-IL')}<br/>${t.note ? `<em>${t.note}</em><br/>` : ''}<span style="color:#8b97a8">מקור: ויקיפדיה / אומדן ציבורי</span>`
        )
        .addTo(popGroup);
    });
    L_.pop = popGroup;
    if (wasVisible && props.visible.pop) popGroup.addTo(map);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.visible.sectColors]);

  // ---- Hebrew map labels with controlled density ----
  useEffect(() => {
    const group = layersRef.current.labels;
    if (!group) return;
    group.clearLayers();
    if (!props.visible.cityLabels) return;

    const compactTownIds = new Set([
      'tyre',
      'sidon',
      'nabat',
      'naqoura',
      'alma',
      'dhayra',
      'aitaa',
      'rmeish',
      'yater',
      'bintj',
      'tibnin',
      'braachit',
      'haris',
      'hadatha',
      'beit-yahoun',
      'rachaf',
      'kafra',
      'khirbet-selm',
      'deir-ntar',
      'majdal-selm',
      'tulin',
      'souaneh',
      'froun',
      'ghandouriyeh',
      'burj-el-shemali',
      'rashidiyeh',
      'sarafand',
      'zahrani-area',
      'ghaziyeh',
      'marjay',
      'khiam',
      'kfark',
      'mais',
      'kawkaba',
      'mari',
      'hasbaya',
      'shebaa',
      'metula',
      'kiryat',
      'shlomi',
    ]);
    if (props.visible.settlementLabels) {
      // When sect-coloring is active, show ALL LB settlements so every settlement
      // gets a colored border + dot. IL settlements stay compact-only (no sect data).
      const townsToLabel = props.largeLabels || props.allLabels
        ? towns
        : towns.filter(t => compactTownIds.has(t.id) || (props.visible.sectColors && t.side === 'LB'));
      townsToLabel.forEach(t => {
        const icon = L.divIcon({
          className: `map-label-icon ${props.largeLabels ? 'label-expanded' : 'label-compact'} settlement-label ${t.side === 'IL' ? 'il-label' : 'lb-label'}${(props.visible.sectColors && t.sect) ? ` sect-${t.sect}` : ''}`,
          html: labelHtml(t.name_he, props.largeLabels ? t.name_en : undefined, props.visible.sectColors ? t.sect : undefined),
          iconSize: undefined,
          iconAnchor: [0, 10],
        });
        L.marker([t.lat, t.lon], { icon, interactive: false }).addTo(group);
      });
    }

    if (props.visible.unifil) {
      const unifilToLabel = props.largeLabels
        ? unifilPoints.filter(u => u.kind !== 'reference')
        : unifilPoints.filter(u => u.kind === 'hq');
      unifilToLabel.forEach(u => {
        const icon = L.divIcon({
          className: `map-label-icon ${props.largeLabels ? 'label-expanded' : 'label-compact'} unifil-label`,
          html: labelHtml(u.name_he, props.largeLabels ? u.name_en : undefined),
          iconSize: undefined,
          iconAnchor: [0, 12],
        });
        L.marker([u.lat, u.lon], { icon, interactive: false }).addTo(group);
      });
    }

    const isRidgeLike = (type: string) => type === 'ridge' || type === 'mountain' || type === 'valley';
    const isWaterLike = (type: string) => type === 'river' || type === 'wadi' || type === 'water';
    const compactRidgeIds = new Set(['jabal-amel', 'bint-jbeil-ridge', 'nabatieh-plateau', 'silvester-ridge']);
    const compactWaterIds = new Set(['litani', 'awali', 'zahrani', 'hasbani']);
    const terrainToLabel = terrainFeatures.filter(f => {
      if (isRidgeLike(f.type) && !props.visible.ridgeLabels) return false;
      if (isWaterLike(f.type) && !props.visible.waterLabels) return false;
      if (props.largeLabels || props.allLabels) return true;
      return compactRidgeIds.has(f.id) || compactWaterIds.has(f.id);
    });
    terrainToLabel.forEach(f => {
      const icon = L.divIcon({
        className: `map-label-icon ${props.largeLabels ? 'label-expanded' : 'label-compact'} terrain-label terrain-${f.type}`,
        html: labelHtml(f.name_he, props.largeLabels ? f.name_en : undefined),
        iconSize: undefined,
        iconAnchor: [0, 12],
      });
      L.marker([f.lat, f.lon], { icon, interactive: false }).addTo(group);
    });
  }, [
    props.largeLabels,
    props.allLabels,
    props.visible.cityLabels,
    props.visible.settlementLabels,
    props.visible.ridgeLabels,
    props.visible.waterLabels,
    props.visible.unifil,
    props.visible.sectColors,  // צביעת עדה משפיעה על תגיות בעברית
  ]);

  // ---- render incidents ----
  useEffect(() => {
    const group = layersRef.current.incidents;
    if (!group) return;
    group.clearLayers();
    props.filteredIncidents.forEach(inc => {
      const color = TYPE_COLOR[inc.type] || '#999';
      const size = inc.severity === 'high' ? 12 : inc.severity === 'med' ? 10 : 8;
      const m = L.circleMarker([inc.lat, inc.lon], {
        radius: size / 2 + 2,
        color: color,
        weight: 2,
        fillColor: color,
        fillOpacity: 0.7,
        className: 'marker-incident',
      });
      m.bindPopup(
        `<div style="min-width:220px"><div style="font-size:10px;color:#8b97a8;font-family:'JetBrains Mono',monospace">${fmtDate(inc.date)} · ${TYPE_LABEL[inc.type]}</div><strong style="display:block;margin:4px 0">${inc.title_he}</strong><div style="font-size:11px;line-height:1.45;margin-bottom:6px">${inc.desc_he}</div>${inc.approx ? '<span style="font-size:10px;color:#d49a3a">מיקום מקורב</span> · ' : ''}<a href="${inc.source_url}" target="_blank" rel="noopener">${inc.source_label}</a></div>`
      );
      m.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        props.onSelectIncident(inc.id);
      });
      m.addTo(group);
    });
  }, [props.filteredIncidents, props.onSelectIncident]);

  // ---- selected incident highlight ----
  useEffect(() => {
    const group = layersRef.current.selectedHL;
    if (!group) return;
    group.clearLayers();
    const inc = props.selectedIncident;
    if (!inc) return;
    L.circleMarker([inc.lat, inc.lon], {
      radius: 18,
      color: '#6ed1c2',
      weight: 2,
      fillOpacity: 0,
      className: 'marker-selected',
    }).addTo(group);
    mapRef.current?.panTo([inc.lat, inc.lon], { animate: true });
  }, [props.selectedIncident]);

  // ---- manual measure points ----
  useEffect(() => {
    const group = layersRef.current.measure;
    if (!group) return;
    group.clearLayers();
    if (!props.measureMode && props.manualMeasure.length === 0) return;
    props.manualMeasure.forEach((p, i) => {
      L.circleMarker(p, {
        radius: 5,
        color: '#6ed1c2',
        weight: 2,
        fillColor: '#0b0d10',
        fillOpacity: 1,
      })
        .bindTooltip(`${i + 1}`, { permanent: true, direction: 'top', offset: [0, -6] })
        .addTo(group);
    });
    if (props.manualMeasure.length === 2) {
      const [a, b] = props.manualMeasure;
      L.polyline([a, b], {
        color: '#6ed1c2',
        weight: 2,
        dashArray: '4 4',
      }).addTo(group);
    }
  }, [props.manualMeasure, props.measureMode]);

  // ---- distance from incident to border line ----
  useEffect(() => {
    const group = layersRef.current.distance;
    if (!group) return;
    group.clearLayers();
    if (!props.distanceLine) return;
    const [a, b] = props.distanceLine;
    L.polyline([a, b], {
      color: '#6ed1c2',
      weight: 2.5,
      dashArray: '6 3',
    }).addTo(group);
    L.circleMarker(b, {
      radius: 4,
      color: '#6ed1c2',
      weight: 2,
      fillColor: '#0b0d10',
      fillOpacity: 1,
    }).addTo(group);
  }, [props.distanceLine]);

  // ---- multi-route overlays -----------------------------------------------
  // Single effect: redraws all polylines when overlays change.
  // Animation-restart avoidance: when ONLY isActive changes (user tapped a
  // card), we update style via setStyle + _path.className without clearLayers.
  // We detect "only isActive changed" by comparing a path-fingerprint ref.
  const routePathFingerprintRef = useRef('');
  useEffect(() => {
    const group = layersRef.current.route;
    const map = mapRef.current;
    if (!group || !map) return;

    if (!props.navigationRoute) {
      group.clearLayers();
      routePolylineRefs.current.clear();
      routePathFingerprintRef.current = '';
      return;
    }

    const { start, end } = props.navigationRoute;
    const a: [number, number] = [start.lat, start.lon];
    const b: [number, number] = [end.lat, end.lon];
    const overlays = props.routeOverlays ?? [];
    const mode = props.routeDisplayMode ?? 'road';

    const visibleIds: Set<string> = new Set(
      mode === 'road'   ? ['drive', 'foot'] :
      mode === 'aerial' ? ['aerial'] :
      ['drive', 'foot', 'aerial']
    );

    // Fingerprint: id + path length for each visible overlay with a real path
    const newFingerprint = overlays
      .map(o => `${o.id}:${o.path.length}`)
      .join(',') + `|${mode}|${start.lat},${start.lon}|${end.lat},${end.lon}`;

    const pathsUnchanged = newFingerprint === routePathFingerprintRef.current;

    if (pathsUnchanged && routePolylineRefs.current.size > 0) {
      // Only isActive or opacity changed — update in-place, no clearLayers
      overlays.forEach(o => {
        const pl = routePolylineRefs.current.get(o.id);
        if (!pl) return;
        const visible = visibleIds.has(o.id);
        const isActive = o.isActive && visible;
        pl.setStyle({
          weight:  isActive ? 6 : 2.5,
          opacity: visible ? (isActive ? 0.95 : 0.40) : 0,
        });
        const lineClass = isActive
          ? `route-line route-line-${o.lineStyle}`
          : `route-line-inactive route-line-inactive-${o.lineStyle}`;
        const el = (pl as any)._path as SVGPathElement | undefined;
        if (el) el.className.baseVal = lineClass;
        if (isActive) pl.bringToFront();
      });
      return; // ← animation is NOT reset
    }

    // Paths changed (new route data) — full redraw
    routePathFingerprintRef.current = newFingerprint;
    group.clearLayers();
    routePolylineRefs.current.clear();

    let allRenderedPoints: [number, number][] = [];

    // Draw inactive first (z-order), active on top
    const sortedOverlays = [
      ...overlays.filter(o => visibleIds.has(o.id) && !o.isActive),
      ...overlays.filter(o => visibleIds.has(o.id) &&  o.isActive),
    ];

    sortedOverlays.forEach(o => {
      if (o.path.length < 2) return;
      const isActive = o.isActive;
      // stroke-dasharray lives in CSS class only (not as Leaflet dashArray attr)
      // so CSS animation of stroke-dashoffset actually works.
      const lineClass = isActive
        ? `route-line route-line-${o.lineStyle}`
        : `route-line-inactive route-line-inactive-${o.lineStyle}`;
      const pl = L.polyline(o.path, {
        color:   o.color,
        weight:  isActive ? 6 : 2.5,
        opacity: isActive ? 0.95 : 0.40,
        className: lineClass,
      }).addTo(group);
      routePolylineRefs.current.set(o.id, pl);
      allRenderedPoints = [...allRenderedPoints, ...o.path];

      if (isActive) {
        const midIdx = Math.floor(o.path.length / 2);
        const mid = o.path[midIdx] ?? [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] as [number, number];
        L.marker(mid, {
          icon: L.divIcon({
            className: 'route-distance-label',
            html: `${o.labelHe}: ${o.km < 10 ? o.km.toFixed(2) : o.km.toFixed(1)} ק״מ${o.durationMin ? ` · ${Math.round(o.durationMin)} דק׳` : ''}`,
            iconSize: undefined,
          }),
          interactive: false,
        }).addTo(group);
      }
    });

    [
      { point: a, label: `מוצא: ${escapeHtml(start.label)}` },
      { point: b, label: `יעד: ${escapeHtml(end.label)}` },
    ].forEach(({ point, label }, index) => {
      L.circleMarker(point, {
        radius: 7,
        color: index === 0 ? '#6ed1c2' : '#d49a3a',
        weight: 2,
        fillColor: '#0b0d10',
        fillOpacity: 1,
      })
        .bindTooltip(`${index === 0 ? 'א' : 'ב'} · ${label}`, {
          permanent: true,
          direction: 'top',
          offset: [0, -10],
          className: 'route-tooltip',
        })
        .addTo(group);
    });

    if (!props.liveLocation && allRenderedPoints.length >= 2) {
      map.fitBounds(allRenderedPoints, { padding: [60, 60], maxZoom: 13, animate: true });
    }
  }, [props.navigationRoute, props.routeOverlays, props.routeDisplayMode, props.liveLocation]);

  // ---- live device location and automatic follow zoom ----
  useEffect(() => {
    const group = layersRef.current.live;
    const map = mapRef.current;
    if (!group || !map) return;
    group.clearLayers();
    if (!props.liveLocation) return;
    const p: [number, number] = [props.liveLocation.lat, props.liveLocation.lon];
    const heading = typeof props.liveLocation.heading === 'number' && isFinite(props.liveLocation.heading)
      ? props.liveLocation.heading
      : props.mapBearing;
    L.marker(p, {
      icon: L.divIcon({
        className: 'live-location-arrow',
        html: `<span class="live-location-ring"></span><span class="live-location-heading" style="transform: rotate(${heading}deg)">▲</span>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      }),
    })
      .bindTooltip('מיקום המכשיר', {
        permanent: true,
        direction: 'top',
        offset: [0, -12],
        className: 'route-tooltip',
      })
      .addTo(group);
    if (props.liveLocation.accuracy && props.liveLocation.accuracy > 0) {
      L.circle(p, {
        radius: props.liveLocation.accuracy,
        color: '#4fb3a6',
        weight: 1,
        fillColor: '#4fb3a6',
        fillOpacity: 0.08,
      }).addTo(group);
    }
    const previousFollow = lastLiveFollowRef.current;
    const now = Date.now();
    const movedEnough = !previousFollow || Math.abs(previousFollow.lat - p[0]) > 0.00002 || Math.abs(previousFollow.lon - p[1]) > 0.00002;
    const timeEnough = !previousFollow || now - previousFollow.at > 1500;
    // Use the user-selected nav scale zoom if provided; otherwise maintain current zoom
    // but never fall below the minimum follow zoom.
    const targetZoom = props.navFollowZoom != null
      ? props.navFollowZoom
      : Math.max(map.getZoom(), NAVIGATION_FOLLOW_MIN_ZOOM);
    const needsZoomChange = props.navFollowZoom != null && Math.abs(map.getZoom() - targetZoom) > 0.3;
    if (!liveFollowDetachedRef.current && (movedEnough || timeEnough || needsZoomChange || map.getZoom() < NAVIGATION_FOLLOW_MIN_ZOOM)) {
      map.flyTo(p, targetZoom, {
        animate: true,
        duration: 0.45,
      });
      lastLiveFollowRef.current = { lat: p[0], lon: p[1], at: now };
    }
  }, [props.liveLocation, props.navigationRoute, props.mapBearing, props.navFollowZoom]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !props.liveLocation || props.liveCenterRequestId === 0) return;
    const p: [number, number] = [props.liveLocation.lat, props.liveLocation.lon];
    liveFollowDetachedRef.current = false;
    props.onLiveFollowDetachedChange(false);
    const targetZoom = props.navFollowZoom != null
      ? props.navFollowZoom
      : Math.max(map.getZoom(), NAVIGATION_FOLLOW_MIN_ZOOM);
    map.flyTo(p, targetZoom, {
      animate: true,
      duration: 0.45,
    });
    lastLiveFollowRef.current = { lat: p[0], lon: p[1], at: Date.now() };
  }, [props.liveCenterRequestId]);

  // ---- recorded GPS track ----
  useEffect(() => {
    const group = layersRef.current.recording;
    if (!group) return;
    group.clearLayers();
    if (props.recordedTrack.length === 0) return;
    if (props.recordedTrack.length > 1) {
      L.polyline(props.recordedTrack, {
        color: '#f2c14e',
        weight: 3,
        opacity: 0.95,
        className: 'recorded-track-line',
      }).addTo(group);
    }
    const first = props.recordedTrack[0];
    const last = props.recordedTrack[props.recordedTrack.length - 1];
    [
      { point: first, label: 'תחילת הקלטה', color: '#4fb3a6' },
      { point: last, label: 'נקודה אחרונה', color: '#f2c14e' },
    ].forEach(({ point, label, color }) => {
      L.circleMarker(point, {
        radius: 6,
        color,
        weight: 2,
        fillColor: '#0b0d10',
        fillOpacity: 1,
      })
        .bindTooltip(label, {
          permanent: false,
          direction: 'top',
          className: 'route-tooltip',
        })
        .addTo(group);
    });
  }, [props.recordedTrack]);

  // ---- user-created points of interest ----
  useEffect(() => {
    const group = layersRef.current.pois;
    if (!group) return;
    group.clearLayers();
    if (props.poiDraft) {
      const px = poiSizePx(props.poiDraftStyle.markerSize) + 10;
      L.marker([props.poiDraft.lat, props.poiDraft.lon], {
        icon: L.divIcon({
          className: 'poi-marker poi-draft-marker',
          html: poiIconHtml(
            props.poiDraftStyle.markerColor,
            props.poiDraftStyle.markerShape,
            props.poiDraftStyle.markerSize,
            true
          ),
          iconSize: [px, px],
          iconAnchor: [px / 2, px / 2],
        }),
      })
        .bindTooltip('נקודה נבחרה — מלא שם ושמור', {
          permanent: true,
          direction: 'top',
          offset: [0, -16],
          className: 'route-tooltip poi-draft-tooltip',
        })
        .addTo(group);
    }
    props.customPois.forEach(poi => {
      const px = poiSizePx(poi.markerSize) + 10;
      const marker = L.marker([poi.lat, poi.lon], {
        icon: L.divIcon({
          className: 'poi-marker',
          html: poiIconHtml(poi.markerColor, poi.markerShape, poi.markerSize),
          iconSize: [px, px],
          iconAnchor: [px / 2, px / 2],
        }),
      });
      marker
        .bindPopup(
          `<div style="min-width:220px"><strong>${escapeHtml(poi.name)}</strong><br/><div style="font-size:11px;line-height:1.45;margin:6px 0;color:#8b97a8">${escapeHtml(poi.description || 'נקודת עניין שהמשתמש הוסיף')}</div><div style="font-family:'JetBrains Mono',monospace;font-size:10px;color:#8b97a8">${poi.lat.toFixed(5)}, ${poi.lon.toFixed(5)}</div>${navBtn(poi.lat, poi.lon, poi.name)}</div>`
        )
        .addTo(group);
    });
  }, [props.customPois, props.poiDraft]);

  useEffect(() => {
    const group = layersRef.current.multiRoute;
    if (!group) return;
    group.clearLayers();

    // Draw draft points
    const draftPoints = props.multiRouteDraft;
    if (draftPoints.length > 0) {
      draftPoints.forEach((pt, idx) => {
        L.circleMarker([pt.lat, pt.lon], {
          radius: 8,
          color: '#f6c453',
          weight: 2,
          fillColor: '#f6c453',
          fillOpacity: 0.9,
        })
          .bindTooltip(`${idx + 1}`, { permanent: true, direction: 'top', offset: [0, -10], className: 'route-tooltip' })
          .addTo(group);
      });
      if (draftPoints.length >= 2) {
        const line = draftPoints.map(p => [p.lat, p.lon] as [number, number]);
        L.polyline(line, {
          color: '#f6c453',
          weight: 3,
          opacity: 0.9,
          dashArray: '8 4',
        }).addTo(group);
      }
    }

    // Draw active multi route
    const active = props.activeMultiRoute;
    if (active && active.points.length >= 2) {
      const line = active.points.map(p => [p.lat, p.lon] as [number, number]);
      L.polyline(line, {
        color: '#b98cff',
        weight: 4,
        opacity: 0.92,
        className: 'multi-route-line',
      }).addTo(group);
      active.points.forEach((pt, idx) => {
        const isFirst = idx === 0;
        const isLast = idx === active.points.length - 1;
        L.circleMarker([pt.lat, pt.lon], {
          radius: isFirst || isLast ? 9 : 6,
          color: isFirst ? '#88c37a' : isLast ? '#d96b6b' : '#b98cff',
          weight: 2,
          fillColor: isFirst ? '#88c37a' : isLast ? '#d96b6b' : '#b98cff',
          fillOpacity: 0.92,
        })
          .bindTooltip(`${idx + 1}${isFirst ? ' (התחלה)' : isLast ? ' (סיום)' : ''}`, {
            permanent: false,
            direction: 'top',
            offset: [0, -10],
            className: 'route-tooltip',
          })
          .addTo(group);
      });
    }
  }, [props.multiRouteDraft, props.activeMultiRoute]);

  return (
    <div
      id="map"
      ref={containerRef}
      className={props.largeLabels ? 'labels-large' : ''}
      data-testid="map-canvas"
    />
  );
});

export default MapView;
