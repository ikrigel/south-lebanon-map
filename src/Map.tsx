import { useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  blueLine, litaniRiver, litaniBufferZone, towns, unifilPoints, influenceZones,
  Incident, Town,
} from './data/geo';
import { TYPE_COLOR, TYPE_LABEL, escapeHtml, fmtDate, fmtKm } from './util';

export type LayerVis = {
  pop: boolean;
  unifil: boolean;
  hez: boolean;
  blueLine: boolean;
  litani: boolean;
  topo: boolean;
  cityLabels: boolean;
};

export type MapProps = {
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
  focusTarget: { lat: number; lon: number; zoom?: number; id: string } | null;
  navigationRoute: {
    start: { lat: number; lon: number; label: string };
    end: { lat: number; lon: number; label: string };
    km: number;
    durationMin?: number;
    path?: [number, number][];
  } | null;
  liveLocation: { lat: number; lon: number; accuracy?: number; heading?: number | null } | null;
  liveCenterRequestId: number;
  onLiveFollowDetachedChange: (detached: boolean) => void;
  recordedTrack: [number, number][];
  compassMode: boolean;
  mapBearing: number;
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
};

const POP_RADIUS: Record<Town['pop_band'], number> = { sm: 5, md: 8, lg: 12, xl: 16 };
const TILESETS = {
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  topo: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
};
const NAVIGATION_FOLLOW_MIN_ZOOM = 17;

const labelHtml = (he: string, en?: string) =>
  `<span class="label-he">${he}</span>${en ? `<span class="label-en">${en}</span>` : ''}`;

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

export default function MapView(props: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const lastLiveFollowRef = useRef<{ lat: number; lon: number; at: number } | null>(null);
  const liveFollowDetachedRef = useRef(false);

  const layersRef = useRef<{
    base?: L.TileLayer;
    pop?: L.LayerGroup;
    unifil?: L.LayerGroup;
    hez?: L.LayerGroup;
    blueLine?: L.LayerGroup;
    litani?: L.LayerGroup;
    incidents?: L.LayerGroup;
    selectedHL?: L.LayerGroup;
    measure?: L.LayerGroup;
    distance?: L.LayerGroup;
    labels?: L.LayerGroup;
    route?: L.LayerGroup;
    live?: L.LayerGroup;
    recording?: L.LayerGroup;
    pois?: L.LayerGroup;
  }>({});

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

    const base = L.tileLayer(TILESETS[props.theme], {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
      maxNativeZoom: 19,
    }).addTo(map);
    layersRef.current.base = base;

    // initial bounds: focus on south Lebanon
    map.fitBounds([
      [33.05, 35.05],
      [33.45, 35.70],
    ]);

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
          `<strong>${t.name_he}</strong> (ישראל)<br/>נקודת ייחוס לגבול.`
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

    // ---- Population ----
    const popGroup = L.layerGroup();
    towns.filter(t => t.side === 'LB').forEach(t => {
      L.circleMarker([t.lat, t.lon], {
        radius: POP_RADIUS[t.pop_band],
        color: '#d0b58a',
        weight: 1.2,
        fillColor: '#d0b58a',
        fillOpacity: 0.18,
      })
        .bindPopup(
          `<strong>${t.name_he}</strong><br/><span style="color:#8b97a8">שם באנגלית/ערבית מתועתקת: ${t.name_en}</span><br/>אומדן אוכלוסיה: ~${t.pop_estimate.toLocaleString('he-IL')}<br/>${t.note ? `<em>${t.note}</em><br/>` : ''}<span style="color:#8b97a8">מקור: ויקיפדיה / אומדן ציבורי</span>`
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
          `<strong>${u.name_he}</strong><br/>${u.note_he}<br/><a href="https://unifil.unmissions.org/" target="_blank">מקור: יוניפי״ל (אתר רשמי)</a>`
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
      })
        .bindPopup(
          `<strong>${z.name_he}</strong><br/>${z.note_he}<br/><em style="color:#d49a3a">המחשה איכותית בלבד — לא נתוני מטרות.</em>`
        )
        .addTo(hezGroup);
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
    layersRef.current.incidents.addTo(map);
    layersRef.current.selectedHL.addTo(map);
    layersRef.current.measure.addTo(map);
    layersRef.current.distance.addTo(map);
    layersRef.current.labels.addTo(map);
    layersRef.current.route.addTo(map);
    layersRef.current.live.addTo(map);
    layersRef.current.recording.addTo(map);
    layersRef.current.pois.addTo(map);

    return () => {
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

  // ---- visual compass rotation ----
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.style.setProperty('--map-rotation', `${props.compassMode ? -props.mapBearing : 0}deg`);
    el.classList.toggle('compass-follow', props.compassMode);
  }, [props.compassMode, props.mapBearing]);

  // ---- focus map from search results ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !props.focusTarget) return;
    map.flyTo([props.focusTarget.lat, props.focusTarget.lon], props.focusTarget.zoom ?? 12, {
      animate: true,
      duration: 0.7,
    });
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
      props.onMapClick(latLng.lat, latLng.lng);
    };
    container.addEventListener('click', handleClick);
    return () => container.removeEventListener('click', handleClick);
  }, [props.onMapClick, props.pointPickMode]);

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
    setVis(L_.pop, props.visible.pop);
    setVis(L_.unifil, props.visible.unifil);
    setVis(L_.hez, props.visible.hez);
    setVis(L_.blueLine, props.visible.blueLine);
    setVis(L_.litani, props.visible.litani);
  }, [props.visible]);

  // ---- Hebrew map labels with controlled density ----
  useEffect(() => {
    const group = layersRef.current.labels;
    if (!group) return;
    group.clearLayers();
    if (!props.visible.cityLabels) return;

    const majorTownIds = new Set(['tyre', 'nabat', 'naqoura', 'metula', 'kiryat', 'shlomi']);
    const townsToLabel = props.largeLabels ? towns : towns.filter(t => t.side === 'LB' || majorTownIds.has(t.id));
    townsToLabel.forEach(t => {
      const icon = L.divIcon({
        className: `map-label-icon ${props.largeLabels ? 'label-expanded' : 'label-compact'} ${t.side === 'IL' ? 'il-label' : 'lb-label'}`,
        html: labelHtml(t.name_he, props.largeLabels ? t.name_en : undefined),
        iconSize: undefined,
        iconAnchor: [28, 10],
      });
      L.marker([t.lat, t.lon], { icon, interactive: false }).addTo(group);
    });

    const unifilToLabel = props.largeLabels
      ? unifilPoints.filter(u => u.kind !== 'reference')
      : unifilPoints.filter(u => u.kind === 'hq');
    unifilToLabel.forEach(u => {
      const icon = L.divIcon({
        className: `map-label-icon ${props.largeLabels ? 'label-expanded' : 'label-compact'} unifil-label`,
        html: labelHtml(u.name_he, props.largeLabels ? u.name_en : undefined),
        iconSize: undefined,
        iconAnchor: [38, 12],
      });
      L.marker([u.lat, u.lon], { icon, interactive: false }).addTo(group);
    });
  }, [props.largeLabels, props.visible.cityLabels]);

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

  // ---- point-to-point navigation route (straight-line educational estimate) ----
  useEffect(() => {
    const group = layersRef.current.route;
    const map = mapRef.current;
    if (!group || !map) return;
    group.clearLayers();
    if (!props.navigationRoute) return;
    const { start, end, km, durationMin, path } = props.navigationRoute;
    const a: [number, number] = [start.lat, start.lon];
    const b: [number, number] = [end.lat, end.lon];
    const line = path && path.length > 1 ? path : [a, b];
    L.polyline(line, {
      color: '#6ed1c2',
      weight: 3,
      opacity: 0.95,
      dashArray: path && path.length > 1 ? undefined : '10 6',
      className: 'route-line',
    }).addTo(group);
    [
      { point: a, label: `מוצא: ${start.label}` },
      { point: b, label: `יעד: ${end.label}` },
    ].forEach(({ point, label }, index) => {
      L.circleMarker(point, {
        radius: 7,
        color: index === 0 ? '#6ed1c2' : '#d49a3a',
        weight: 2,
        fillColor: '#0b0d10',
        fillOpacity: 1,
      })
        .bindTooltip(`${index === 0 ? 'א' : 'ב'} · ${escapeHtml(label)}`, {
          permanent: true,
          direction: 'top',
          offset: [0, -10],
          className: 'route-tooltip',
        })
        .addTo(group);
    });
    const mid = line[Math.floor(line.length / 2)] ?? [(start.lat + end.lat) / 2, (start.lon + end.lon) / 2] as [number, number];
    L.marker(mid, {
      icon: L.divIcon({
        className: 'route-distance-label',
        html: `${path && path.length > 1 ? 'מסלול כבישים' : 'מרחק אווירי'}: ${km < 10 ? km.toFixed(2) : km.toFixed(1)} ק״מ${durationMin ? ` · ${Math.round(durationMin)} דק׳` : ''}`,
        iconSize: undefined,
      }),
      interactive: false,
    }).addTo(group);
    if (!props.liveLocation) {
      map.fitBounds(line, { padding: [60, 60], maxZoom: 13, animate: true });
    }
  }, [props.navigationRoute, Boolean(props.liveLocation)]);

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
    const targetZoom = Math.max(map.getZoom(), NAVIGATION_FOLLOW_MIN_ZOOM);
    if (!liveFollowDetachedRef.current && (movedEnough || timeEnough || map.getZoom() < NAVIGATION_FOLLOW_MIN_ZOOM)) {
      map.flyTo(p, targetZoom, {
        animate: true,
        duration: 0.45,
      });
      lastLiveFollowRef.current = { lat: p[0], lon: p[1], at: now };
    }
  }, [props.liveLocation, props.navigationRoute, props.mapBearing]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !props.liveLocation || props.liveCenterRequestId === 0) return;
    const p: [number, number] = [props.liveLocation.lat, props.liveLocation.lon];
    liveFollowDetachedRef.current = false;
    props.onLiveFollowDetachedChange(false);
    const targetZoom = Math.max(map.getZoom(), NAVIGATION_FOLLOW_MIN_ZOOM);
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
          `<div style="min-width:220px"><strong>${escapeHtml(poi.name)}</strong><br/><div style="font-size:11px;line-height:1.45;margin:6px 0;color:#8b97a8">${escapeHtml(poi.description || 'נקודת עניין שהמשתמש הוסיף')}</div><div style="font-family:'JetBrains Mono',monospace;font-size:10px;color:#8b97a8">${poi.lat.toFixed(5)}, ${poi.lon.toFixed(5)}</div></div>`
        )
        .addTo(group);
    });
  }, [props.customPois, props.poiDraft]);

  return (
    <div
      id="map"
      ref={containerRef}
      className={props.largeLabels ? 'labels-large' : ''}
      data-testid="map-canvas"
    />
  );
}
