import { useMemo, useState, useCallback, useEffect, useRef, type CSSProperties } from 'react';
import MapView, { LayerVis, MapHandle } from './Map';
import { incidents, blueLine, Incident, towns, unifilPoints, influenceZones, terrainFeatures } from './data/geo';
import { sources } from './data/sources';
import {
  TYPE_LABEL, TYPE_COLOR, SEV_LABEL, fmtDate, fmtKm, haversineKm, distanceToPolyline, safeText, bearingDegrees,
} from './util';

const TYPES: Incident['type'][] = ['rocket', 'atgm', 'uav', 'idf_strike', 'unifil', 'ground', 'displacement'];
const SEVS: Incident['severity'][] = ['low', 'med', 'high'];
const MAX_ROUTE_FILE_BYTES = 1_000_000;
const MAX_IMPORTED_ROUTES = 100;
const MAX_ROUTE_POINTS = 5000;
const MAX_POI_FILE_BYTES = 750_000;
const MAX_IMPORTED_POIS = 500;
const POI_STORAGE_KEY = 'south-lebanon-map:custom-pois:v1';
const NAV_SESSION_KEY = 'south-lebanon-map:navigation-session:v1';
const RECORDING_STORAGE_KEY = 'south-lebanon-map:recorded-track:v1';
const THEME_STORAGE_KEY = 'south-lebanon-map:theme-mode:v1';
const LAYER_VIS_STORAGE_KEY = 'south-lebanon-map:layer-visibility:v1';
const MAP_VIEW_STORAGE_KEY = 'south-lebanon-map:last-map-view:v1';
const LABEL_PREF_STORAGE_KEY = 'south-lebanon-map:label-preferences:v1';
const UI_STATE_STORAGE_KEY = 'south-lebanon-map:ui-state:v1';
const FILTER_STATE_STORAGE_KEY = 'south-lebanon-map:filter-state:v1';
const SAVED_ROUTES_STORAGE_KEY = 'south-lebanon-map:saved-routes:v1';
const SAVED_MULTI_ROUTES_STORAGE_KEY = 'south-lebanon-map:saved-multi-routes:v1';
const DEFAULT_THEME_MODE: ThemeMode = 'dark';
const DEFAULT_MAP_VIEW = { lat: 33.25, lon: 35.38, zoom: 10 };
const DONATION_CONTACT_URL = 'https://www.bitpay.co.il/app/me/7193501F-35B9-B8F9-0E46-32EA6E76DDFAF94C';
const POI_COLORS = [
  { value: '#f6c453', label: 'זהב' },
  { value: '#4fb3a6', label: 'טורקיז' },
  { value: '#6aa7d8', label: 'כחול' },
  { value: '#d96b6b', label: 'אדום' },
  { value: '#b98cff', label: 'סגול' },
  { value: '#88c37a', label: 'ירוק' },
] as const;
const POI_SHAPES = [
  { value: 'circle', label: 'עיגול' },
  { value: 'square', label: 'ריבוע' },
  { value: 'diamond', label: 'יהלום' },
  { value: 'star', label: 'כוכב' },
] as const;
const POI_SIZES = [
  { value: 'sm', label: 'קטן' },
  { value: 'md', label: 'בינוני' },
  { value: 'lg', label: 'גדול' },
] as const;
type ThemeMode = 'auto' | 'light' | 'dark';
type VoiceGuidanceMode = 'off' | 'basic' | 'detailed';
type VoiceLanguage = 'he' | 'en';
type TurnAction = 'straight' | 'right' | 'left' | 'uturn' | 'arrive' | 'none';
type PoiColor = typeof POI_COLORS[number]['value'];
type PoiShape = typeof POI_SHAPES[number]['value'];
type PoiSize = typeof POI_SIZES[number]['value'];
type NavPoint = {
  id: string;
  label: string;
  group: string;
  lat: number;
  lon: number;
};
type TurnInstruction = {
  text: string;
  textEn: string;
  action: TurnAction;
  distanceM: number;
  bearing: number;
  confidence: 'route' | 'estimated';
  lat?: number;
  lon?: number;
  roadName?: string;
};
type RoadRoute = {
  km: number;
  durationMin: number;
  path: [number, number][];
  instructions?: TurnInstruction[];
};
// How the distance HUD and line are displayed during navigation
type RouteDisplayMode = 'road' | 'aerial' | 'both';

// A computed route option shown in the route-type selector
type RouteOption = {
  id: 'drive' | 'foot' | 'aerial';
  labelHe: string;           // e.g. 'כביש סלול'
  km: number;
  durationMin?: number;
  path?: [number, number][];
  instructions?: TurnInstruction[];
  passabilityHe: string;     // human-readable clearance label
  airspaceHe: string;        // airspace/difficulty label
  color: string;             // polyline colour on map
  lineStyle: 'solid' | 'dashed' | 'dotted';
  status: 'ready' | 'loading' | 'error' | 'none';
};
type SavedRoute = {
  id: string;
  name: string;
  createdAt: string;
  startId?: string;
  endId?: string;
  start: { lat: number; lon: number; label: string };
  end: { lat: number; lon: number; label: string };
  km: number;
  durationMin?: number;
  path?: [number, number][];
  instructions?: TurnInstruction[];
};
type CustomPoi = {
  id: string;
  name: string;
  description: string;
  lat: number;
  lon: number;
  createdAt: string;
  markerColor: PoiColor;
  markerShape: PoiShape;
  markerSize: PoiSize;
};
type LocalNavSession = {
  navStartId?: string;
  navEndId?: string;
  navStartQuery?: string;
  navEndQuery?: string;
  routeName?: string;
  roadRoute?: RoadRoute | null;
  activeSavedRoute?: SavedRoute | null;
  liveActive?: boolean;
  voiceGuidance?: VoiceGuidanceMode;
  voiceLanguage?: VoiceLanguage;
};
type LocalRecordingSession = {
  recordingName?: string;
  recordedTrack?: [number, number][];
  recordingActive?: boolean;
};
type LocalMapView = {
  lat: number;
  lon: number;
  zoom: number;
};
type LocalLabelPreferences = {
  largeLabels?: boolean;
  allLabels?: boolean;
};
type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'extreme';
type PassabilityLevel = 'paved' | 'dirt' | 'offroad' | 'foot_only';
type MultiPointRoute = {
  id: string;
  name: string;
  description: string;
  difficulty: DifficultyLevel;
  passability: PassabilityLevel;
  points: { lat: number; lon: number; label: string; order: number }[];
  totalKm: number;
  createdAt: string;
};
const DEFAULT_LAYER_VISIBILITY: LayerVis = {
  pop: true,
  unifil: true,
  hez: true,
  blueLine: true,
  litani: true,
  rivers: true,
  topo: false,
  cityLabels: true,
  settlementLabels: true,
  ridgeLabels: true,
  waterLabels: true,
  sectColors: true,
};

const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  easy: 'קל',
  medium: 'בינוני',
  hard: 'קשה',
  extreme: 'קיצוני',
};
const PASSABILITY_LABELS: Record<PassabilityLevel, string> = {
  paved: 'כביש סלול',
  dirt: 'דרך עפר',
  offroad: 'שטח פתוח',
  foot_only: 'הליכה בלבד',
};
const MULTI_ROUTE_STORAGE_KEY = 'south-lebanon-map:multi-routes:v1';
const MAX_MULTI_ROUTE_POINTS = 50;

const isDaytime = () => {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 18;
};

const clean = (value: string) => value.trim().toLowerCase();
const isPoiColor = (value: unknown): value is PoiColor => POI_COLORS.some(c => c.value === value);
const isPoiShape = (value: unknown): value is PoiShape => POI_SHAPES.some(s => s.value === value);
const isPoiSize = (value: unknown): value is PoiSize => POI_SIZES.some(s => s.value === value);

const normalizeTurnDelta = (degrees: number) => ((degrees + 540) % 360) - 180;

const turnActionFromDelta = (delta: number): TurnAction => {
  if (Math.abs(delta) < 25) return 'straight';
  if (Math.abs(delta) > 135) return 'uturn';
  return delta > 0 ? 'right' : 'left';
};

const directionHebrew = (bearing: number) => {
  const directions = [
    'צפון',
    'צפון־מזרח',
    'מזרח',
    'דרום־מזרח',
    'דרום',
    'דרום־מערב',
    'מערב',
    'צפון־מערב',
  ];
  return directions[Math.round((((bearing % 360) + 360) % 360) / 45) % 8];
};

const directionEnglish = (bearing: number) => {
  const directions = [
    'north',
    'north-east',
    'east',
    'south-east',
    'south',
    'south-west',
    'west',
    'north-west',
  ];
  return directions[Math.round((((bearing % 360) + 360) % 360) / 45) % 8];
};

const turnVerbHe = (action: TurnAction) => {
  switch (action) {
    case 'right':
      return 'פנה ימינה';
    case 'left':
      return 'פנה שמאלה';
    case 'uturn':
      return 'בצע פניית פרסה';
    case 'arrive':
      return 'הגעת לקרבת היעד';
    case 'straight':
      return 'המשך ישר';
    default:
      return 'המשך במסלול';
  }
};

const turnVerbEn = (action: TurnAction) => {
  switch (action) {
    case 'right':
      return 'turn right';
    case 'left':
      return 'turn left';
    case 'uturn':
      return 'make a U-turn';
    case 'arrive':
      return 'you are near your destination';
    case 'straight':
      return 'continue straight';
    default:
      return 'continue on the route';
  }
};

const formatTurnDistance = (meters: number) => {
  if (!isFinite(meters) || meters <= 0) return 'כעת';
  if (meters >= 1000) return fmtKm(meters / 1000);
  return `${Math.max(20, Math.round(meters / 10) * 10)} מ׳`;
};

const formatTurnDistanceEn = (meters: number) => {
  if (!isFinite(meters) || meters <= 0) return 'now';
  if (meters >= 1000) {
    const km = meters / 1000;
    return `${km < 10 ? km.toFixed(2) : km.toFixed(1)} kilometers`;
  }
  return `${Math.max(20, Math.round(meters / 10) * 10)} meters`;
};

const composeTurnInstruction = (
  action: TurnAction,
  distanceM: number,
  bearing: number,
  confidence: TurnInstruction['confidence'],
  roadName = '',
  lat?: number,
  lon?: number
): TurnInstruction => {
  const cleanRoad = safeText(roadName);
  const distanceText = formatTurnDistance(distanceM);
  const distanceTextEn = formatTurnDistanceEn(distanceM);
  const directionText = directionHebrew(bearing);
  const directionTextEn = directionEnglish(bearing);
  const roadTextHe = cleanRoad ? ` אל ${cleanRoad}` : '';
  const roadTextEn = cleanRoad ? ` onto ${cleanRoad}` : '';
  const text = action === 'arrive'
    ? 'הגעת לקרבת היעד'
    : action === 'straight'
      ? `בעוד ${distanceText} המשך ישר${roadTextHe} לכיוון ${directionText}`
      : action === 'uturn'
        ? `בעוד ${distanceText} בצע פניית פרסה${roadTextHe} והמשך לכיוון ${directionText}`
        : `בעוד ${distanceText} ${turnVerbHe(action)}${roadTextHe} והמשך לכיוון ${directionText}`;
  const textEn = action === 'arrive'
    ? 'You are near your destination'
    : action === 'straight'
      ? `In ${distanceTextEn}, continue straight${roadTextEn} toward ${directionTextEn}`
      : action === 'uturn'
        ? `In ${distanceTextEn}, make a U-turn${roadTextEn} and continue toward ${directionTextEn}`
        : `In ${distanceTextEn}, ${turnVerbEn(action)}${roadTextEn} and continue toward ${directionTextEn}`;
  return {
    text,
    textEn,
    action,
    distanceM: Math.max(0, distanceM),
    bearing,
    confidence,
    roadName: cleanRoad || undefined,
    lat,
    lon,
  };
};

const osrmStepToAction = (step: any): TurnAction => {
  const type = String(step?.maneuver?.type ?? '').toLowerCase();
  const modifier = String(step?.maneuver?.modifier ?? '').toLowerCase();
  if (type === 'arrive') return 'arrive';
  if (modifier.includes('uturn') || modifier.includes('u-turn')) return 'uturn';
  if (modifier.includes('right')) return 'right';
  if (modifier.includes('left')) return 'left';
  return 'straight';
};

const parseOsrmInstructions = (route: any): TurnInstruction[] => {
  const steps = route?.legs?.flatMap((leg: any) => Array.isArray(leg?.steps) ? leg.steps : []) ?? [];
  const instructions: TurnInstruction[] = [];
  let distanceFromStartM = 0;
  steps.forEach((step: any, index: number) => {
    const maneuver = step?.maneuver;
    const location = maneuver?.location;
    const type = String(maneuver?.type ?? '').toLowerCase();
    const action = osrmStepToAction(step);
    const bearing = typeof maneuver?.bearing_after === 'number'
      ? maneuver.bearing_after
      : typeof maneuver?.bearing_before === 'number'
        ? maneuver.bearing_before
        : 0;
    const lat = Array.isArray(location) && typeof location[1] === 'number' ? location[1] : undefined;
    const lon = Array.isArray(location) && typeof location[0] === 'number' ? location[0] : undefined;
    const roadName = safeText(step?.name);
    const shouldKeep = type === 'arrive' || (type !== 'depart' && (action !== 'straight' || distanceFromStartM > 80 || index === steps.length - 1));
    if (shouldKeep) {
      instructions.push(composeTurnInstruction(action, distanceFromStartM, bearing, 'route', roadName, lat, lon));
    }
    if (typeof step?.distance === 'number' && isFinite(step.distance)) {
      distanceFromStartM += Math.max(0, step.distance);
    }
  });
  return instructions.slice(0, 200);
};

const normalizeRouteInstructions = (instructions: unknown): TurnInstruction[] | undefined => {
  if (!Array.isArray(instructions)) return undefined;
  const valid = instructions.slice(0, 200).map((instruction): TurnInstruction | null => {
    if (!instruction || typeof instruction !== 'object') return null;
    const item = instruction as Partial<TurnInstruction>;
    const action: TurnAction = item.action === 'right' || item.action === 'left' || item.action === 'uturn' || item.action === 'arrive' || item.action === 'straight'
      ? item.action
      : 'none';
    const distanceM = typeof item.distanceM === 'number' && isFinite(item.distanceM) ? Math.max(0, item.distanceM) : 0;
    const bearing = typeof item.bearing === 'number' && isFinite(item.bearing) ? item.bearing : 0;
    return composeTurnInstruction(
      action,
      distanceM,
      bearing,
      item.confidence === 'estimated' ? 'estimated' : 'route',
      safeText(item.roadName),
      typeof item.lat === 'number' && isFinite(item.lat) ? item.lat : undefined,
      typeof item.lon === 'number' && isFinite(item.lon) ? item.lon : undefined
    );
  }).filter((instruction): instruction is TurnInstruction => Boolean(instruction));
  return valid.length ? valid : undefined;
};

// Navigation scale levels: each entry is { label, zoom }
// Zoom values computed for Lebanon latitude ~33.5°, 96 DPI screen:
//   meters_per_pixel = 156543.03 * cos(33.5°) / 2^z
//   scale_denom = meters_per_pixel * (96/2.54) * 100  (1 cm on screen = ? cm in reality)
// 1:20   →2^z≈18.9  → zoom=18  (rooftop/trench detail)
// 1:50   →2^z≈17.9  → zoom=17  (street/path detail)
// 1:100  →2^z≈16.9  → zoom=16  (village detail)
// 1:200  →2^z≈15.9  → zoom=15  (settlement cluster)
// 1:500  →2^z≈13.3  → zoom=13  (sector overview)
// 1:1000 →2^z≈12.3  → zoom=12  (district overview)
// 1:2000 →2^z≈11.3  → zoom=11  (regional overview)
const NAV_SCALES: { label: string; zoom: number }[] = [
  { label: '1:20',   zoom: 18 },
  { label: '1:50',   zoom: 17 },
  { label: '1:100',  zoom: 16 },
  { label: '1:200',  zoom: 15 },
  { label: '1:500',  zoom: 13 },
  { label: '1:1000', zoom: 12 },
  { label: '1:2000', zoom: 11 },
];
const DEFAULT_NAV_SCALE_LABEL = '1:200'; // sensible default during navigation

const isMobileLikeDevice = () => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /Android|iPhone|iPad|iPod|SamsungBrowser|Mobile/i.test(ua) || window.matchMedia('(max-width: 768px)').matches;
};

// Opens external navigation app: tries Waze deep-link first (Android/iOS),
// falls back to Apple Maps on iOS, then Google Maps web.
// fromLat/Lon: start coords (null = let app use current GPS)
// toLat/Lon: destination coords
const openExternalNav = (toLat: number, toLon: number, toLabel: string,
                          fromLat?: number | null, fromLon?: number | null) => {
  const ua = typeof navigator !== 'undefined' ? (navigator.userAgent || '') : '';
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  const destLL = `${toLat.toFixed(6)},${toLon.toFixed(6)}`;
  const startLL = (fromLat != null && fromLon != null)
    ? `${fromLat.toFixed(6)},${fromLon.toFixed(6)}`
    : null;

  // Waze deep-link (Android and iOS) — navigate to destination
  const wazeUrl = `waze://?ll=${destLL}&navigate=yes&zoom=17`;
  // Google Maps intent (Android)
  const gmAndroid = startLL
    ? `https://www.google.com/maps/dir/${startLL}/${destLL}/`
    : `https://www.google.com/maps/dir/Current+Location/${destLL}/`;
  // Apple Maps (iOS)
  const appleMaps = startLL
    ? `maps://maps.apple.com/?saddr=${startLL}&daddr=${destLL}&dirflg=d`
    : `maps://maps.apple.com/?daddr=${destLL}&dirflg=d`;
  // Google Maps web fallback
  const gmWeb = startLL
    ? `https://www.google.com/maps/dir/${startLL}/${destLL}/@${destLL},13z`
    : `https://www.google.com/maps/dir/Current+Location/${destLL}/@${destLL},13z`;

  if (isIOS) {
    // Try Waze first via iframe (non-blocking), then Apple Maps
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = wazeUrl;
    document.body.appendChild(iframe);
    setTimeout(() => { document.body.removeChild(iframe); }, 1500);
    // Fallback: open Apple Maps after 500ms if Waze didn't open
    setTimeout(() => { window.location.href = appleMaps; }, 500);
    return;
  }
  if (isAndroid) {
    // Try Waze intent URI first, then Google Maps
    const intent = `intent://ul?ll=${destLL}&navigate=yes#Intent;scheme=waze;package=com.waze;end`;
    try {
      window.location.href = intent;
    } catch {
      window.open(gmAndroid, '_blank');
    }
    // Fallback to Google Maps after a delay if Waze is not installed
    setTimeout(() => { window.open(gmAndroid, '_blank'); }, 1800);
    return;
  }
  // Desktop: open Google Maps in new tab
  window.open(gmWeb, '_blank');
};

const pickSpeechVoice = (language: VoiceLanguage) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return undefined;
  const voices = window.speechSynthesis.getVoices?.() ?? [];
  const prefix = language === 'he' ? 'he' : 'en';
  return voices.find(voice => voice.lang.toLowerCase().startsWith(prefix));
};

const normalizePoi = (p: Partial<CustomPoi>): CustomPoi | null => {
  if (
    !p ||
    typeof p.lat !== 'number' ||
    typeof p.lon !== 'number' ||
    !isFinite(p.lat) ||
    !isFinite(p.lon) ||
    Math.abs(p.lat) > 90 ||
    Math.abs(p.lon) > 180
  ) return null;
  return {
    id: safeText(p.id, `poi-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`) || `poi-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: safeText(p.name, 'נקודת עניין') || 'נקודת עניין',
    description: safeText(p.description, ''),
    lat: p.lat,
    lon: p.lon,
    createdAt: safeText(p.createdAt, new Date().toISOString()) || new Date().toISOString(),
    markerColor: isPoiColor(p.markerColor) ? p.markerColor : '#f6c453',
    markerShape: isPoiShape(p.markerShape) ? p.markerShape : 'circle',
    markerSize: isPoiSize(p.markerSize) ? p.markerSize : 'md',
  };
};

const loadLocalPois = (): CustomPoi[] => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    const raw = window.localStorage.getItem(POI_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const items = Array.isArray(parsed) ? parsed : [];
    return items.slice(0, MAX_IMPORTED_POIS).map(normalizePoi).filter((p): p is CustomPoi => Boolean(p));
  } catch {
    return [];
  }
};

const saveLocalPois = (pois: CustomPoi[]) => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(POI_STORAGE_KEY, JSON.stringify(pois.slice(0, MAX_IMPORTED_POIS)));
  } catch {
    // Some embedded browsers block localStorage. In that case the app keeps using active memory.
  }
};

const safeStorageGet = (key: string) => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeStorageSet = (key: string, value: unknown) => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Embedded browsers may block localStorage.
  }
};

const loadLocalThemeMode = (): ThemeMode => {
  try {
    const raw = safeStorageGet(THEME_STORAGE_KEY);
    if (!raw) return DEFAULT_THEME_MODE;
    const parsed = JSON.parse(raw);
    return parsed === 'light' || parsed === 'dark' || parsed === 'auto' ? parsed : DEFAULT_THEME_MODE;
  } catch {
    return DEFAULT_THEME_MODE;
  }
};

const loadLocalLayerVisibility = (): LayerVis => {
  try {
    const raw = safeStorageGet(LAYER_VIS_STORAGE_KEY);
    if (!raw) return DEFAULT_LAYER_VISIBILITY;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return DEFAULT_LAYER_VISIBILITY;
    const candidate = parsed as Partial<Record<keyof LayerVis, unknown>>;
    return {
      pop: typeof candidate.pop === 'boolean' ? candidate.pop : DEFAULT_LAYER_VISIBILITY.pop,
      unifil: typeof candidate.unifil === 'boolean' ? candidate.unifil : DEFAULT_LAYER_VISIBILITY.unifil,
      hez: typeof candidate.hez === 'boolean' ? candidate.hez : DEFAULT_LAYER_VISIBILITY.hez,
      blueLine: typeof candidate.blueLine === 'boolean' ? candidate.blueLine : DEFAULT_LAYER_VISIBILITY.blueLine,
      litani: typeof candidate.litani === 'boolean' ? candidate.litani : DEFAULT_LAYER_VISIBILITY.litani,
      rivers: typeof candidate.rivers === 'boolean' ? candidate.rivers : DEFAULT_LAYER_VISIBILITY.rivers,
      topo: typeof candidate.topo === 'boolean' ? candidate.topo : DEFAULT_LAYER_VISIBILITY.topo,
      cityLabels: typeof candidate.cityLabels === 'boolean' ? candidate.cityLabels : DEFAULT_LAYER_VISIBILITY.cityLabels,
      settlementLabels: typeof candidate.settlementLabels === 'boolean' ? candidate.settlementLabels : DEFAULT_LAYER_VISIBILITY.settlementLabels,
      ridgeLabels: typeof candidate.ridgeLabels === 'boolean' ? candidate.ridgeLabels : DEFAULT_LAYER_VISIBILITY.ridgeLabels,
      waterLabels: typeof candidate.waterLabels === 'boolean' ? candidate.waterLabels : DEFAULT_LAYER_VISIBILITY.waterLabels,
      sectColors: typeof candidate.sectColors === 'boolean' ? candidate.sectColors : DEFAULT_LAYER_VISIBILITY.sectColors,
    };
  } catch {
    return DEFAULT_LAYER_VISIBILITY;
  }
};

const loadLocalMapView = (): LocalMapView | null => {
  try {
    const raw = safeStorageGet(MAP_VIEW_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LocalMapView>;
    if (
      typeof parsed.lat !== 'number' ||
      typeof parsed.lon !== 'number' ||
      typeof parsed.zoom !== 'number' ||
      !isFinite(parsed.lat) ||
      !isFinite(parsed.lon) ||
      !isFinite(parsed.zoom) ||
      Math.abs(parsed.lat) > 90 ||
      Math.abs(parsed.lon) > 180
    ) {
      return null;
    }
    return {
      lat: parsed.lat,
      lon: parsed.lon,
      zoom: Math.min(19, Math.max(9, Math.round(parsed.zoom * 100) / 100)),
    };
  } catch {
    return null;
  }
};

const loadLocalLabelPreferences = (): Required<LocalLabelPreferences> => {
  try {
    const raw = safeStorageGet(LABEL_PREF_STORAGE_KEY);
    if (!raw) return { largeLabels: false, allLabels: false };
    const parsed = JSON.parse(raw) as LocalLabelPreferences;
    return {
      largeLabels: Boolean(parsed.largeLabels),
      allLabels: Boolean(parsed.allLabels),
    };
  } catch {
    return { largeLabels: false, allLabels: false };
  }
};

const normalizeRoutePath = (path: unknown): [number, number][] | undefined => {
  if (!Array.isArray(path)) return undefined;
  const points = path.slice(0, MAX_ROUTE_POINTS).filter((p): p is [number, number] =>
    Array.isArray(p) &&
    p.length >= 2 &&
    typeof p[0] === 'number' &&
    typeof p[1] === 'number' &&
    isFinite(p[0]) &&
    isFinite(p[1]) &&
    Math.abs(p[0]) <= 90 &&
    Math.abs(p[1]) <= 180
  );
  return points.length >= 2 ? points : undefined;
};

const loadLocalNavSession = (): LocalNavSession => {
  try {
    const raw = safeStorageGet(NAV_SESSION_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as LocalNavSession;
    const roadPath = normalizeRoutePath(parsed.roadRoute?.path);
    const savedPath = normalizeRoutePath(parsed.activeSavedRoute?.path);
    const roadInstructions = normalizeRouteInstructions(parsed.roadRoute?.instructions);
    const savedInstructions = normalizeRouteInstructions(parsed.activeSavedRoute?.instructions);
    return {
      navStartId: safeText(parsed.navStartId),
      navEndId: safeText(parsed.navEndId),
      navStartQuery: safeText(parsed.navStartQuery),
      navEndQuery: safeText(parsed.navEndQuery),
      routeName: safeText(parsed.routeName),
      liveActive: Boolean(parsed.liveActive),
      voiceGuidance: parsed.voiceGuidance === 'basic' || parsed.voiceGuidance === 'detailed' ? parsed.voiceGuidance : 'off',
      voiceLanguage: parsed.voiceLanguage === 'en' ? 'en' : 'he',
      roadRoute: parsed.roadRoute && typeof parsed.roadRoute.km === 'number'
        ? {
            km: parsed.roadRoute.km,
            durationMin: typeof parsed.roadRoute.durationMin === 'number' ? parsed.roadRoute.durationMin : 0,
            path: roadPath ?? [],
            instructions: roadInstructions,
          }
        : null,
      activeSavedRoute: parsed.activeSavedRoute && parsed.activeSavedRoute.start && parsed.activeSavedRoute.end
        ? {
            ...parsed.activeSavedRoute,
            id: safeText(parsed.activeSavedRoute.id, `route-${Date.now()}`) || `route-${Date.now()}`,
            name: safeText(parsed.activeSavedRoute.name, 'מסלול משוחזר') || 'מסלול משוחזר',
            createdAt: safeText(parsed.activeSavedRoute.createdAt, new Date().toISOString()) || new Date().toISOString(),
            path: savedPath,
            instructions: savedInstructions,
          }
        : null,
    };
  } catch {
    return {};
  }
};

const loadLocalRecordingSession = (): LocalRecordingSession => {
  try {
    const raw = safeStorageGet(RECORDING_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as LocalRecordingSession;
    return {
      recordingName: safeText(parsed.recordingName),
      recordedTrack: normalizeRoutePath(parsed.recordedTrack) ?? [],
      recordingActive: Boolean(parsed.recordingActive),
    };
  } catch {
    return {};
  }
};

// ---- UI state (panelsCollapsed, panelHeightPct, userMapRotation) ----
type LocalUiState = {
  panelsCollapsed?: boolean;
  panelHeightPct?: number;
  userMapRotation?: number;
};

const loadLocalUiState = (): LocalUiState => {
  try {
    const raw = safeStorageGet(UI_STATE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as LocalUiState;
    return {
      panelsCollapsed: typeof parsed.panelsCollapsed === 'boolean' ? parsed.panelsCollapsed : undefined,
      panelHeightPct:
        typeof parsed.panelHeightPct === 'number' && isFinite(parsed.panelHeightPct)
          ? Math.min(90, Math.max(8, parsed.panelHeightPct))
          : undefined,
      userMapRotation:
        typeof parsed.userMapRotation === 'number' && isFinite(parsed.userMapRotation)
          ? ((parsed.userMapRotation % 360) + 360) % 360
          : undefined,
    };
  } catch {
    return {};
  }
};

// ---- Incident filter state ----
type LocalFilterState = {
  yearFrom?: number;
  yearTo?: number;
  typeFilter?: string[];
  sevFilter?: string[];
};

const loadLocalFilterState = (): LocalFilterState => {
  try {
    const raw = safeStorageGet(FILTER_STATE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as LocalFilterState;
    return {
      yearFrom: typeof parsed.yearFrom === 'number' && isFinite(parsed.yearFrom) ? parsed.yearFrom : undefined,
      yearTo:   typeof parsed.yearTo   === 'number' && isFinite(parsed.yearTo)   ? parsed.yearTo   : undefined,
      typeFilter: Array.isArray(parsed.typeFilter) ? parsed.typeFilter.filter(t => typeof t === 'string') : undefined,
      sevFilter:  Array.isArray(parsed.sevFilter)  ? parsed.sevFilter.filter(s => typeof s === 'string')  : undefined,
    };
  } catch {
    return {};
  }
};

// ---- Saved routes ----
const loadLocalSavedRoutes = (): SavedRoute[] => {
  try {
    const raw = safeStorageGet(SAVED_ROUTES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (r): r is SavedRoute =>
        r && typeof r.id === 'string' && typeof r.name === 'string' && r.start && r.end,
    );
  } catch {
    return [];
  }
};

// ---- Saved multi-point routes ----
const loadLocalSavedMultiRoutes = (): MultiPointRoute[] => {
  try {
    const raw = safeStorageGet(SAVED_MULTI_ROUTES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (r): r is MultiPointRoute =>
        r && typeof r.id === 'string' && typeof r.name === 'string' && Array.isArray(r.points),
    );
  } catch {
    return [];
  }
};

const miniEscape = (value: unknown) =>
  String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] ?? ch));

export default function App() {
  const initialNavSessionRef = useRef<LocalNavSession | null>(null);
  if (initialNavSessionRef.current === null) initialNavSessionRef.current = loadLocalNavSession();
  const initialRecordingSessionRef = useRef<LocalRecordingSession | null>(null);
  if (initialRecordingSessionRef.current === null) initialRecordingSessionRef.current = loadLocalRecordingSession();
  const initialMapViewRef = useRef<LocalMapView | null>(null);
  if (initialMapViewRef.current === null) initialMapViewRef.current = loadLocalMapView();
  const initialLabelPrefsRef = useRef<Required<LocalLabelPreferences> | null>(null);
  if (initialLabelPrefsRef.current === null) initialLabelPrefsRef.current = loadLocalLabelPreferences();
  const initialUiStateRef = useRef<LocalUiState | null>(null);
  if (initialUiStateRef.current === null) initialUiStateRef.current = loadLocalUiState();
  const initialFilterStateRef = useRef<LocalFilterState | null>(null);
  if (initialFilterStateRef.current === null) initialFilterStateRef.current = loadLocalFilterState();

  // -------- layer toggles --------
  const [visible, setVisible] = useState<LayerVis>(() => loadLocalLayerVisibility());

  // -------- filters --------
  const minYear = Math.min(...incidents.map(i => i.year));
  const maxYear = Math.max(...incidents.map(i => i.year));
  const years = Array.from({ length: maxYear - minYear + 1 }, (_, idx) => minYear + idx);
  const [yearFrom, setYearFrom] = useState(() => {
    const saved = initialFilterStateRef.current?.yearFrom;
    return saved !== undefined && saved >= minYear && saved <= maxYear ? saved : minYear;
  });
  const [yearTo, setYearTo] = useState(() => {
    const saved = initialFilterStateRef.current?.yearTo;
    return saved !== undefined && saved >= minYear && saved <= maxYear ? saved : maxYear;
  });
  const [typeFilter, setTypeFilter] = useState<Set<string>>(() => {
    const saved = initialFilterStateRef.current?.typeFilter;
    if (saved && saved.length > 0) return new Set(saved.filter(t => (TYPES as string[]).includes(t)));
    return new Set(TYPES);
  });
  const [sevFilter, setSevFilter] = useState<Set<string>>(() => {
    const saved = initialFilterStateRef.current?.sevFilter;
    if (saved && saved.length > 0) return new Set(saved.filter(s => (SEVS as string[]).includes(s)));
    return new Set(SEVS);
  });
  const [query, setQuery] = useState('');
  const [mapSearchQuery, setMapSearchQuery] = useState('');

  // -------- selection / measure --------
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [measureMode, setMeasureMode] = useState(false);
  const [manualMeasure, setManualMeasure] = useState<[number, number][]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => loadLocalThemeMode());
  const [autoDay, setAutoDay] = useState(isDaytime());
  const [largeLabels, setLargeLabels] = useState(() => initialLabelPrefsRef.current?.largeLabels ?? false);
  const [allLabels, setAllLabels] = useState(() => initialLabelPrefsRef.current?.allLabels ?? false);
  const [panelsCollapsed, setPanelsCollapsed] = useState(
    () => initialUiStateRef.current?.panelsCollapsed ?? false,
  );
  const mapViewRef = useRef<MapHandle>(null);
  // Skip snapshotCenter on the initial mount — map is still setting up.
  const panelsCollapseIsFirstMount = useRef(true);
  // Draggable panel height (mobile only) — percentage of viewport height
  const [panelHeightPct, setPanelHeightPct] = useState(
    () => initialUiStateRef.current?.panelHeightPct ?? 35,
  );
  const panelDragRef = useRef<{ startY: number; startPct: number } | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const [miniOverlayOpen, setMiniOverlayOpen] = useState(false);
  const [miniStatus, setMiniStatus] = useState<'idle' | 'pip' | 'fallback' | 'popup' | 'mobile'>('idle');
  // focusTarget: used only for user-triggered focus (search results, incidents).
  // Initial map view is handled by the initialCenter prop passed to MapView directly.
  const [focusTarget, setFocusTarget] = useState<{ lat: number; lon: number; zoom?: number; id: string; label?: string } | null>(null);
  const [liveFollowDetached, setLiveFollowDetached] = useState(false);
  const [liveCenterRequestId, setLiveCenterRequestId] = useState(0);
  const [navStartId, setNavStartId] = useState(() => initialNavSessionRef.current?.navStartId ?? '');
  const [navEndId, setNavEndId] = useState(() => initialNavSessionRef.current?.navEndId ?? '');
  const [navStartQuery, setNavStartQuery] = useState(() => initialNavSessionRef.current?.navStartQuery ?? '');
  const [navEndQuery, setNavEndQuery] = useState(() => initialNavSessionRef.current?.navEndQuery ?? '');
  const [roadRoute, setRoadRoute] = useState<RoadRoute | null>(() => initialNavSessionRef.current?.roadRoute ?? null);
  const [alternativeRoute, setAlternativeRoute] = useState<{ km: number; durationMin: number; path: [number, number][] } | null>(null);
  const [activeRouteIndex, setActiveRouteIndex] = useState<0 | 1>(0);
  const [routeStatus, setRouteStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [routeName, setRouteName] = useState(() => initialNavSessionRef.current?.routeName ?? '');
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>(() => loadLocalSavedRoutes());
  const [activeSavedRoute, setActiveSavedRoute] = useState<SavedRoute | null>(() => initialNavSessionRef.current?.activeSavedRoute ?? null);
  const [liveLocation, setLiveLocation] = useState<{ lat: number; lon: number; accuracy?: number; heading?: number | null } | null>(null);
  // navPosition is a throttled version of liveLocation — updated only when the
  // device moves ≥ 15 m. Used for turn-instruction recalc and voice guidance,
  // so those expensive O(n) path scans don't run on every GPS wobble.
  const [navPosition, setNavPosition] = useState<{ lat: number; lon: number } | null>(null);
  const navPositionRef = useRef<{ lat: number; lon: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'watching' | 'error' | 'unsupported'>('idle');
  const [watchId, setWatchId] = useState<number | null>(null);
  const [compassMode, setCompassMode] = useState(false);
  const [userMapRotation, setUserMapRotation] = useState(
    () => initialUiStateRef.current?.userMapRotation ?? 0,
  );
  const handleUserRotationChange = useCallback((deg: number) => {
    setUserMapRotation(((deg % 360) + 360) % 360);
  }, []);
  const resetMapRotation = useCallback(() => setUserMapRotation(0), []);
  // Rotation lock: when true, pinch/drag cannot rotate the map;
  // user picks snap angles (0/45/90/135/180/225/270/315) via a picker.
  const [rotationLocked, setRotationLocked] = useState(false);
  const [snapPickerOpen, setSnapPickerOpen] = useState(false);
  const SNAP_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315] as const;
  const SNAP_LABELS: Record<number, string> = {
    0: '↑ צפון', 45: '↗ ס״מ', 90: '→ מזרח', 135: '↘ ד״מ',
    180: '↓ דרום', 225: '↙ ד״מ', 270: '← מערב', 315: '↖ ס״מ',
  };
  const handleSnapRotation = useCallback((deg: number) => {
    setUserMapRotation(deg);
    setSnapPickerOpen(false);
  }, []);
  const toggleRotationLock = useCallback(() => {
    setRotationLocked(v => {
      const next = !v;
      if (next) setSnapPickerOpen(true); // open picker when locking
      return next;
    });
  }, []);
  const [recordingStatus, setRecordingStatus] = useState<'idle' | 'recording' | 'error' | 'unsupported'>('idle');
  const [recordingWatchId, setRecordingWatchId] = useState<number | null>(null);
  const [recordedTrack, setRecordedTrack] = useState<[number, number][]>(() => initialRecordingSessionRef.current?.recordedTrack ?? []);
  const [recordingName, setRecordingName] = useState(() => initialRecordingSessionRef.current?.recordingName ?? '');
  const [voiceGuidance, setVoiceGuidance] = useState<VoiceGuidanceMode>(() => initialNavSessionRef.current?.voiceGuidance ?? 'off');
  const [voiceLanguage, setVoiceLanguage] = useState<VoiceLanguage>(() => initialNavSessionRef.current?.voiceLanguage ?? 'he');
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'speaking' | 'unsupported'>('idle');
  const recordedTrackRef = useRef<[number, number][]>([]);
  const miniExternalWindowRef = useRef<Window | null>(null);
  const lastVoiceRouteRef = useRef('');
  const lastVoiceProgressRef = useRef<{ at: number; bucket: number | null }>({ at: 0, bucket: null });
  const lastTurnVoiceRef = useRef<{ key: string; at: number }>({ key: '', at: 0 });
  const resumedLiveRef = useRef(false);
  const resumedRecordingRef = useRef(false);
  const liveToastShownRef = useRef(false);
  const recordingToastShownRef = useRef(false);
  const toastTimeoutRef = useRef<number | null>(null);
  const [supportOpen, setSupportOpen] = useState(false);
  const [donationCopied, setDonationCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [addPoiMode, setAddPoiMode] = useState(false);
  const [poiDraft, setPoiDraft] = useState<{ lat: number; lon: number } | null>(null);
  const [poiName, setPoiName] = useState('');
  const [poiDescription, setPoiDescription] = useState('');
  const [poiMarkerColor, setPoiMarkerColor] = useState<PoiColor>('#f6c453');
  const [poiMarkerShape, setPoiMarkerShape] = useState<PoiShape>('circle');
  const [poiMarkerSize, setPoiMarkerSize] = useState<PoiSize>('md');
  const [customPois, setCustomPois] = useState<CustomPoi[]>(() => loadLocalPois());
  const [multiRouteBuildMode, setMultiRouteBuildMode] = useState(false);
  const [multiRouteDraftPoints, setMultiRouteDraftPoints] = useState<{lat: number; lon: number; label: string; order: number}[]>([]);
  const [multiRouteName, setMultiRouteName] = useState('');
  const [multiRouteDescription, setMultiRouteDescription] = useState('');
  const [multiRouteDifficulty, setMultiRouteDifficulty] = useState<DifficultyLevel>('medium');
  const [multiRoutePassability, setMultiRoutePassability] = useState<PassabilityLevel>('dirt');
  const [savedMultiRoutes, setSavedMultiRoutes] = useState<MultiPointRoute[]>(() => loadLocalSavedMultiRoutes());
  const [activeMultiRoute, setActiveMultiRoute] = useState<MultiPointRoute | null>(null);
  const [navCustomEnd, setNavCustomEnd] = useState<{lat: number; lon: number; label: string} | null>(null);
  const [navCustomStart, setNavCustomStart] = useState<{lat: number; lon: number; label: string} | null>(null);
  const [navScaleLabel, setNavScaleLabel] = useState<string>(DEFAULT_NAV_SCALE_LABEL);
  // ── Multi-route display mode ──
  const [routeDisplayMode, setRouteDisplayMode] = useState<RouteDisplayMode>('road');
  const [footRoute, setFootRoute] = useState<RoadRoute | null>(null);
  const [footRouteStatus, setFootRouteStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  // aerialRoute is derived (no state needed — computed from navStart/navEnd)
  const [activeRouteId, setActiveRouteId] = useState<'drive' | 'foot' | 'aerial'>('drive');

  const showToast = useCallback((message: string, timeoutMs = 2600) => {
    setToastMessage(message);
    if (toastTimeoutRef.current !== null) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastMessage('');
      toastTimeoutRef.current = null;
    }, timeoutMs);
  }, []);

  const handleMapViewChange = useCallback((view: LocalMapView) => {
    if (
      !isFinite(view.lat) ||
      !isFinite(view.lon) ||
      !isFinite(view.zoom) ||
      Math.abs(view.lat) > 90 ||
      Math.abs(view.lon) > 180
    ) {
      return;
    }
    safeStorageSet(MAP_VIEW_STORAGE_KEY, {
      lat: Math.round(view.lat * 1000000) / 1000000,
      lon: Math.round(view.lon * 1000000) / 1000000,
      zoom: Math.min(19, Math.max(9, Math.round(view.zoom * 100) / 100)),
    } satisfies LocalMapView);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setAutoDay(isDaytime()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    saveLocalPois(customPois);
  }, [customPois]);

  useEffect(() => {
    safeStorageSet(THEME_STORAGE_KEY, themeMode);
  }, [themeMode]);

  useEffect(() => {
    safeStorageSet(LAYER_VIS_STORAGE_KEY, visible);
  }, [visible]);

  useEffect(() => {
    safeStorageSet(LABEL_PREF_STORAGE_KEY, { largeLabels, allLabels } satisfies LocalLabelPreferences);
  }, [largeLabels, allLabels]);

  useEffect(() => {
    safeStorageSet(UI_STATE_STORAGE_KEY, {
      panelsCollapsed,
      panelHeightPct,
      userMapRotation,
    } satisfies LocalUiState);
  }, [panelsCollapsed, panelHeightPct, userMapRotation]);

  useEffect(() => {
    safeStorageSet(FILTER_STATE_STORAGE_KEY, {
      yearFrom,
      yearTo,
      typeFilter: [...typeFilter],
      sevFilter: [...sevFilter],
    } satisfies LocalFilterState);
  }, [yearFrom, yearTo, typeFilter, sevFilter]);

  useEffect(() => {
    safeStorageSet(SAVED_ROUTES_STORAGE_KEY, savedRoutes);
  }, [savedRoutes]);

  useEffect(() => {
    safeStorageSet(SAVED_MULTI_ROUTES_STORAGE_KEY, savedMultiRoutes);
  }, [savedMultiRoutes]);

  useEffect(() => {
    safeStorageSet(NAV_SESSION_KEY, {
      navStartId,
      navEndId,
      navStartQuery,
      navEndQuery,
      routeName,
      roadRoute,
      activeSavedRoute,
      liveActive: locationStatus === 'watching',
      voiceGuidance,
      voiceLanguage,
    } satisfies LocalNavSession);
  }, [navStartId, navEndId, navStartQuery, navEndQuery, routeName, roadRoute, activeSavedRoute, locationStatus, voiceGuidance, voiceLanguage]);

  useEffect(() => {
    recordedTrackRef.current = recordedTrack;
    safeStorageSet(RECORDING_STORAGE_KEY, {
      recordingName,
      recordedTrack,
      recordingActive: recordingStatus === 'recording',
    } satisfies LocalRecordingSession);
  }, [recordingName, recordedTrack, recordingStatus]);

  useEffect(() => {
    return () => {
      if (watchId !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchId);
      }
      if (recordingWatchId !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(recordingWatchId);
      }
    };
  }, [watchId, recordingWatchId]);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current !== null) {
        window.clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    recordedTrackRef.current = recordedTrack;
  }, [recordedTrack]);

  const effectiveTheme: 'light' | 'dark' = themeMode === 'auto' ? (autoDay ? 'light' : 'dark') : themeMode;

  useEffect(() => {
    document.documentElement.classList.toggle('theme-light', effectiveTheme === 'light');
    document.documentElement.classList.toggle('theme-dark', effectiveTheme === 'dark');
  }, [effectiveTheme]);

  const filtered = useMemo(() => {
    const q = clean(query);
    return incidents.filter(i => {
      if (i.year < yearFrom || i.year > yearTo) return false;
      if (!typeFilter.has(i.type)) return false;
      if (!sevFilter.has(i.severity)) return false;
      if (q && !clean(`${i.title_he} ${i.desc_he} ${i.source_label} ${TYPE_LABEL[i.type]} ${SEV_LABEL[i.severity]}`).includes(q)) return false;
      return true;
    });
  }, [yearFrom, yearTo, typeFilter, sevFilter, query]);

  const searchResults = useMemo(() => {
    const q = clean(query);
    if (!q) return [];
    const townMatches = towns
      .filter(t => clean(`${t.name_he} ${t.name_en} ${t.note ?? ''} ${t.side === 'LB' ? 'לבנון' : 'ישראל'}`).includes(q))
      .map(t => ({
        id: `town-${t.id}`,
        title: t.name_he,
        subtitle: `${t.name_en} · ${t.side === 'LB' ? 'יישוב בלבנון' : 'יישוב ייחוס בישראל'}`,
        lat: t.lat,
        lon: t.lon,
        zoom: 13,
      }));
    const unifilMatches = unifilPoints
      .filter(u => clean(`${u.name_he} ${u.name_en} ${u.note_he} יוניפיל unifil`).includes(q))
      .map(u => ({
        id: `unifil-${u.id}`,
        title: u.name_he,
        subtitle: `${u.name_en} · נקודת יוניפי״ל ציבורית/מקורבת`,
        lat: u.lat,
        lon: u.lon,
        zoom: 13,
      }));
    const terrainMatches = terrainFeatures
      .filter(f => clean(`${f.name_he} ${f.name_en} ${f.note_he ?? ''} רכס רכסים הר הרים נחל נחלים נהר נהרות ואדי עמק תוואי שטח`).includes(q))
      .map(f => ({
        id: `terrain-${f.id}`,
        title: f.name_he,
        subtitle: `${f.name_en} · תוואי שטח / הידרוגרפיה`,
        lat: f.lat,
        lon: f.lon,
        zoom: f.type === 'river' || f.type === 'wadi' ? 12 : 13,
      }));
    const zoneMatches = influenceZones
      .filter(z => clean(`${z.name_he} ${z.note_he} חזבאללה השפעה אזור`).includes(q))
      .map(z => {
        const center = z.polygon.reduce((acc, p) => [acc[0] + p[0], acc[1] + p[1]] as [number, number], [0, 0]);
        return {
          id: `zone-${z.id}`,
          title: z.name_he,
          subtitle: 'אזור השפעה איכותי ומקורב',
          lat: center[0] / z.polygon.length,
          lon: center[1] / z.polygon.length,
          zoom: 11,
        };
      });
    const incidentMatches = incidents
      .filter(i => clean(`${i.title_he} ${i.desc_he} ${i.source_label} ${TYPE_LABEL[i.type]}`).includes(q))
      .slice(0, 8)
      .map(i => ({
        id: `incident-${i.id}`,
        incidentId: i.id,
        title: i.title_he,
        subtitle: `${fmtDate(i.date)} · ${TYPE_LABEL[i.type]} · ${i.approx ? 'מיקום מקורב' : 'מיקום מדווח'}`,
        lat: i.lat,
        lon: i.lon,
        zoom: 13,
      }));
    const poiMatches = customPois
      .filter(p => clean(`${p.name} ${p.description} נקודת עניין`).includes(q))
      .map(p => ({
        id: `poi-${p.id}`,
        title: p.name,
        subtitle: `נקודת עניין אישית · ${p.description || 'ללא תיאור'}`,
        lat: p.lat,
        lon: p.lon,
        zoom: 14,
      }));
    return [...poiMatches, ...townMatches, ...terrainMatches, ...unifilMatches, ...zoneMatches, ...incidentMatches].slice(0, 12);
  }, [query, customPois]);

  const mapSearchResults = useMemo(() => {
    const q = clean(mapSearchQuery);
    if (!q) return [];
    const townMatches = towns
      .filter(t => clean(`${t.name_he} ${t.name_en} ${t.note ?? ''} ${t.side === 'LB' ? 'לבנון כפר ישוב יישוב' : 'ישראל ישוב יישוב'}`).includes(q))
      .map(t => ({
        id: `map-town-${t.id}`,
        title: t.name_he,
        subtitle: `${t.name_en} · ${t.side === 'LB' ? 'יישוב/כפר בלבנון' : 'יישוב ייחוס בישראל'}`,
        lat: t.lat,
        lon: t.lon,
        zoom: t.pop_band === 'xl' ? 13 : 15,
      }));
    const terrainMatches = terrainFeatures
      .filter(f => clean(`${f.name_he} ${f.name_en} ${f.note_he ?? ''} רכס רכסים הר הרים נחל נחלים נהר נהרות ואדי עמק תוואי שטח זהרני זהראני סילבסטר`).includes(q))
      .map(f => ({
        id: `map-terrain-${f.id}`,
        title: f.name_he,
        subtitle: `${f.name_en} · ${f.type === 'mountain' ? 'הר' : f.type === 'ridge' ? 'רכס' : f.type === 'river' ? 'נהר' : f.type === 'wadi' ? 'ואדי/נחל' : 'תוואי שטח'}`,
        lat: f.lat,
        lon: f.lon,
        zoom: f.type === 'river' || f.type === 'wadi' ? 13 : 15,
      }));
    const unifilMatches = unifilPoints
      .filter(u => clean(`${u.name_he} ${u.name_en} ${u.note_he} יוניפיל unifil`).includes(q))
      .map(u => ({
        id: `map-unifil-${u.id}`,
        title: u.name_he,
        subtitle: `${u.name_en} · נקודת יוניפי״ל ציבורית/מקורבת`,
        lat: u.lat,
        lon: u.lon,
        zoom: 14,
      }));
    const poiMatches = customPois
      .filter(p => clean(`${p.name} ${p.description} נקודת עניין`).includes(q))
      .map(p => ({
        id: `map-poi-${p.id}`,
        title: p.name,
        subtitle: `נקודת עניין אישית · ${p.description || 'ללא תיאור'}`,
        lat: p.lat,
        lon: p.lon,
        zoom: 16,
      }));
    const incidentMatches = incidents
      .filter(i => clean(`${i.title_he} ${i.desc_he} ${i.source_label} ${TYPE_LABEL[i.type]} אירוע`).includes(q))
      .slice(0, 8)
      .map(i => ({
        id: `map-incident-${i.id}`,
        incidentId: i.id,
        title: i.title_he,
        subtitle: `${fmtDate(i.date)} · ${TYPE_LABEL[i.type]} · ${i.approx ? 'מיקום מקורב' : 'מיקום מדווח'}`,
        lat: i.lat,
        lon: i.lon,
        zoom: 14,
      }));
    return [...poiMatches, ...townMatches, ...terrainMatches, ...unifilMatches, ...incidentMatches].slice(0, 18);
  }, [mapSearchQuery, customPois]);

  const selected = useMemo(
    () => filtered.find(i => i.id === selectedId) || incidents.find(i => i.id === selectedId) || null,
    [selectedId, filtered]
  );

  // distance from each filtered incident to the Blue Line
  const distances = useMemo(() => {
    return filtered.map(i => ({
      id: i.id,
      ...distanceToPolyline([i.lat, i.lon], blueLine),
    }));
  }, [filtered]);

  const distanceById = useMemo(() => {
    const m = new Map<string, { km: number; nearest: [number, number] }>();
    distances.forEach(d => m.set(d.id, { km: d.km, nearest: d.nearest }));
    return m;
  }, [distances]);

  // selected incident → distance line on map
  const distanceLine = useMemo<[[number, number], [number, number]] | null>(() => {
    if (!selected) return null;
    const d = distanceById.get(selected.id);
    if (!d) {
      const d2 = distanceToPolyline([selected.lat, selected.lon], blueLine);
      return [[selected.lat, selected.lon], d2.nearest];
    }
    return [[selected.lat, selected.lon], d.nearest];
  }, [selected, distanceById]);

  // analytics
  const stats = useMemo(() => {
    const ds = distances.map(d => d.km);
    const sum = ds.reduce((s, x) => s + x, 0);
    return {
      total: filtered.length,
      min: ds.length ? Math.min(...ds) : NaN,
      max: ds.length ? Math.max(...ds) : NaN,
      avg: ds.length ? sum / ds.length : NaN,
      byType: TYPES.map(t => ({ type: t, n: filtered.filter(f => f.type === t).length })),
      bySev: SEVS.map(s => ({ sev: s, n: filtered.filter(f => f.severity === s).length })),
    };
  }, [filtered, distances]);

  const toggleSet = (set: Set<string>, item: string): Set<string> => {
    const next = new Set(set);
    if (next.has(item)) next.delete(item); else next.add(item);
    return next;
  };

  const onMapClick = useCallback((lat: number, lon: number) => {
    if (multiRouteBuildMode) {
      const newPoint = { lat, lon, label: `נקודה ${multiRouteDraftPoints.length + 1}`, order: multiRouteDraftPoints.length };
      setMultiRouteDraftPoints(prev => prev.length >= MAX_MULTI_ROUTE_POINTS ? prev : [...prev, newPoint]);
      return;
    }
    if (addPoiMode) {
      setPoiDraft({ lat, lon });
    } else if (measureMode) {
      setManualMeasure(prev => {
        if (prev.length === 2) return [[lat, lon]];
        return [...prev, [lat, lon]];
      });
    } else {
      setSelectedId(null);
    }
  }, [addPoiMode, measureMode, multiRouteBuildMode, multiRouteDraftPoints.length]);

  const manualKm = manualMeasure.length === 2 ? haversineKm(manualMeasure[0], manualMeasure[1]) : null;
  const recordedKm = useMemo(() => {
    return recordedTrack.slice(1).reduce((sum, point, idx) => sum + haversineKm(recordedTrack[idx], point), 0);
  }, [recordedTrack]);

  const navPoints = useMemo<NavPoint[]>(() => {
    const townPoints = towns.map(t => ({
      id: `town:${t.id}`,
      label: `${t.name_he} (${t.name_en})`,
      group: t.side === 'LB' ? 'יישובים בלבנון' : 'יישובי ייחוס בישראל',
      lat: t.lat,
      lon: t.lon,
    }));
    const unifilNavPoints = unifilPoints.map(u => ({
      id: `unifil:${u.id}`,
      label: u.name_he,
      group: 'נקודות יוניפי״ל ציבוריות',
      lat: u.lat,
      lon: u.lon,
    }));
    const terrainNavPoints = terrainFeatures.map(f => ({
      id: `terrain:${f.id}`,
      label: `${f.name_he} (${f.name_en})`,
      group: 'רכסים, הרים, נחלים ונהרות',
      lat: f.lat,
      lon: f.lon,
    }));
    const incidentPoints = incidents.map(i => ({
      id: `incident:${i.id}`,
      label: `${fmtDate(i.date)} · ${i.title_he}`,
      group: 'אירועים מדווחים',
      lat: i.lat,
      lon: i.lon,
    }));
    const customPoiPoints = customPois.map(p => ({
      id: `poi:${p.id}`,
      label: p.name,
      group: 'נקודות עניין אישיות',
      lat: p.lat,
      lon: p.lon,
    }));
    const customEnd: NavPoint[] = navCustomEnd ? [{
      id: 'custom-nav-end',
      label: navCustomEnd.label,
      group: 'ניווט מהיר',
      lat: navCustomEnd.lat,
      lon: navCustomEnd.lon,
    }] : [];
    const customStart: NavPoint[] = navCustomStart ? [{
      id: 'custom-nav-start',
      label: navCustomStart.label,
      group: 'ניווט מהיר',
      lat: navCustomStart.lat,
      lon: navCustomStart.lon,
    }] : [];
    const liveNavPoint: NavPoint[] = liveLocation ? [{
      id: 'live-location',
      label: 'מיקום נוכחי (GPS)',
      group: 'ניווט מהיר',
      lat: liveLocation.lat,
      lon: liveLocation.lon,
    }] : [];
    return [...liveNavPoint, ...customStart, ...customEnd, ...customPoiPoints, ...townPoints, ...terrainNavPoints, ...unifilNavPoints, ...incidentPoints];
  }, [customPois, navCustomEnd, navCustomStart, liveLocation]);

  const navStart = navPoints.find(p => p.id === navStartId) ?? null;
  const navEnd = navPoints.find(p => p.id === navEndId) ?? null;
  const navFollowZoom = NAV_SCALES.find(s => s.label === navScaleLabel)?.zoom ?? 15;
  const routePointMatches = (q: string) => {
    const term = clean(q);
    if (!term) return navPoints.slice(0, 8);
    return navPoints
      .filter(p => clean(`${p.label} ${p.group}`).includes(term))
      .slice(0, 8);
  };
  const startMatches = routePointMatches(navStartQuery);
  const endMatches = routePointMatches(navEndQuery);
  useEffect(() => {
    setRoadRoute(null);
    setAlternativeRoute(null);
    setActiveRouteIndex(0);
    setActiveSavedRoute(null);
    setFootRoute(null);
    setFootRouteStatus('idle');
    if (!navStart || !navEnd || navStart.id === navEnd.id) {
      setRouteStatus('idle');
      return;
    }
    const driveCtrl = new AbortController();
    const footCtrl  = new AbortController();

    // ── Driving route (OSRM) ──
    const driveUrl = `https://router.project-osrm.org/route/v1/driving/${navStart.lon},${navStart.lat};${navEnd.lon},${navEnd.lat}?overview=full&geometries=geojson&alternatives=true&steps=true`;
    setRouteStatus('loading');
    fetch(driveUrl, { signal: driveCtrl.signal })
      .then(res => {
        if (!res.ok) throw new Error(`OSRM drive ${res.status}`);
        return res.json();
      })
      .then(data => {
        const route = data?.routes?.[0];
        const coords = route?.geometry?.coordinates;
        if (!route || !Array.isArray(coords) || coords.length < 2) throw new Error('No drive route');
        setRoadRoute({
          km: route.distance / 1000,
          durationMin: route.duration / 60,
          path: coords.map(([lon, lat]: [number, number]) => [lat, lon]),
          instructions: parseOsrmInstructions(route),
        });
        const altRoute = data?.routes?.[1];
        const altCoords = altRoute?.geometry?.coordinates;
        if (altRoute && Array.isArray(altCoords) && altCoords.length >= 2) {
          setAlternativeRoute({
            km: altRoute.distance / 1000,
            durationMin: altRoute.duration / 60,
            path: altCoords.map(([lon, lat]: [number, number]) => [lat, lon] as [number, number]),
          });
        }
        setRouteStatus('ready');
      })
      .catch(err => {
        if (err.name === 'AbortError') return;
        setRouteStatus('error');
      });

    // ── Foot / terrain route (OSRM walking profile) ──
    const footUrl = `https://router.project-osrm.org/route/v1/foot/${navStart.lon},${navStart.lat};${navEnd.lon},${navEnd.lat}?overview=full&geometries=geojson&steps=true`;
    setFootRouteStatus('loading');
    fetch(footUrl, { signal: footCtrl.signal })
      .then(res => {
        if (!res.ok) throw new Error(`OSRM foot ${res.status}`);
        return res.json();
      })
      .then(data => {
        const route = data?.routes?.[0];
        const coords = route?.geometry?.coordinates;
        if (!route || !Array.isArray(coords) || coords.length < 2) throw new Error('No foot route');
        setFootRoute({
          km: route.distance / 1000,
          durationMin: route.duration / 60,
          path: coords.map(([lon, lat]: [number, number]) => [lat, lon]),
          instructions: parseOsrmInstructions(route),
        });
        setFootRouteStatus('ready');
      })
      .catch(err => {
        if (err.name === 'AbortError') return;
        setFootRouteStatus('error');
      });

    return () => {
      driveCtrl.abort();
      footCtrl.abort();
    };
  }, [navStart, navEnd]);

  // ── Build routeOptions for multi-route selector (memoised — stable ref) ──
  // NOTE: deps intentionally exclude liveLocation so GPS updates do NOT
  //       rebuild the route objects → eliminates the 1-second render flicker.
  const routeOptions: RouteOption[] = useMemo(() => {
    if (!navStart || !navEnd || navStart.id === navEnd.id) return [];
    const aerialKm = haversineKm([navStart.lat, navStart.lon], [navEnd.lat, navEnd.lon]);
    const aerialPath: [number, number][] = [[navStart.lat, navStart.lon], [navEnd.lat, navEnd.lon]];
    return [
      {
        id: 'drive',
        labelHe: 'כביש סלול',
        km: roadRoute?.km ?? aerialKm,
        durationMin: roadRoute?.durationMin,
        path: roadRoute?.path,
        instructions: roadRoute?.instructions,
        passabilityHe: 'כלי רכב בלבד',
        airspaceHe: 'ללא אישור מיוחד',
        color: '#4a90c4',
        lineStyle: 'solid' as const,
        status: routeStatus as RouteOption['status'],
      },
      {
        id: 'foot',
        labelHe: 'שביל הליכה / שטח',
        km: footRoute?.km ?? aerialKm,
        durationMin: footRoute?.durationMin,
        path: footRoute?.path,
        instructions: footRoute?.instructions,
        passabilityHe: 'כוחות קרקעיים בלבד',
        airspaceHe: 'גישה ברגל בלבד',
        color: '#6dc463',
        lineStyle: 'dashed' as const,
        status: footRouteStatus as RouteOption['status'],
      },
      {
        id: 'aerial',
        labelHe: 'מסלול אווירי',
        km: aerialKm,
        durationMin: undefined,
        path: aerialPath,
        instructions: undefined,
        passabilityHe: 'כלי טיס בלבד',
        airspaceHe: 'אזור אווירי מוגבל — נדרש אישור',
        color: '#e8c44a',
        lineStyle: 'dotted' as const,
        status: 'ready' as const,
      },
    ];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    navStart?.id, navEnd?.id,
    roadRoute, footRoute,
    routeStatus, footRouteStatus,
  ]);

  // The active route option — stable ref, not rebuilt on GPS tick
  const activeRouteOption = useMemo(
    () => routeOptions.find(r => r.id === activeRouteId) ?? routeOptions[0] ?? null,
    [routeOptions, activeRouteId],
  );

  // calculatedRoute — stable ref, rebuilt only when endpoints or active route change
  const calculatedRoute = useMemo(() => {
    if (!navStart || !navEnd || navStart.id === navEnd.id) return null;
    const fallbackKm = haversineKm([navStart.lat, navStart.lon], [navEnd.lat, navEnd.lon]);
    return {
      start: { lat: navStart.lat, lon: navStart.lon, label: navStart.label },
      end: { lat: navEnd.lat, lon: navEnd.lon, label: navEnd.label },
      km: activeRouteOption?.km ?? fallbackKm,
      durationMin: activeRouteOption?.durationMin,
      path: activeRouteOption?.path,
      instructions: activeRouteOption?.instructions,
    };
  }, [navStart, navEnd, activeRouteOption]);

  // navigationRoute — stable ref
  const navigationRoute = useMemo(() => {
    if (activeSavedRoute) {
      return {
        start: activeSavedRoute.start,
        end: activeSavedRoute.end,
        km: activeSavedRoute.km,
        durationMin: activeSavedRoute.durationMin,
        path: activeSavedRoute.path,
        instructions: activeSavedRoute.instructions,
      };
    }
    return calculatedRoute;
  }, [activeSavedRoute, calculatedRoute]);

  // Memoised overlay list — only changes when a route data or active selection changes,
  // NOT on every GPS update. Passed as a stable prop to MapView.
  const routeOverlaysMemo = useMemo(() => routeOptions.map(opt => ({
    id: opt.id,
    path: opt.path ?? [],
    color: opt.color,
    lineStyle: opt.lineStyle,
    labelHe: opt.labelHe,
    km: opt.km,
    durationMin: opt.durationMin,
    isActive: opt.id === activeRouteId,
  })), [routeOptions, activeRouteId]);

  const mapBearing = useMemo(() => {
    if (typeof liveLocation?.heading === 'number' && isFinite(liveLocation.heading)) {
      return liveLocation.heading;
    }
    if (recordedTrack.length >= 2) {
      return bearingDegrees(recordedTrack[recordedTrack.length - 2], recordedTrack[recordedTrack.length - 1]);
    }
    const line = navigationRoute?.path;
    if (line && line.length >= 2) return bearingDegrees(line[0], line[1]);
    if (navigationRoute) {
      return bearingDegrees(
        [navigationRoute.start.lat, navigationRoute.start.lon],
        [navigationRoute.end.lat, navigationRoute.end.lon]
      );
    }
    return 0;
  }, [liveLocation, recordedTrack, navigationRoute]);

  const currentTurnInstruction = useMemo<TurnInstruction | null>(() => {
    if (!navigationRoute) return null;
    const path: [number, number][] = navigationRoute.path && navigationRoute.path.length >= 2
      ? navigationRoute.path
      : [
          [navigationRoute.start.lat, navigationRoute.start.lon],
          [navigationRoute.end.lat, navigationRoute.end.lon],
        ];
    if (path.length < 2) return null;

    // Use throttled navPosition (updates every 15 m) not raw liveLocation
    const current: [number, number] = navPosition
      ? [navPosition.lat, navPosition.lon]
      : path[0];
    const remainingToEndKm = haversineKm(current, [navigationRoute.end.lat, navigationRoute.end.lon]);
    const confidence: TurnInstruction['confidence'] = navigationRoute.path && navigationRoute.path.length >= 3 ? 'route' : 'estimated';
    if (remainingToEndKm < 0.15) {
      return composeTurnInstruction('arrive', Math.max(0, remainingToEndKm * 1000), mapBearing, confidence);
    }

    const routeInstructions = navigationRoute.instructions?.filter(instruction => instruction.action !== 'none') ?? [];
    if (routeInstructions.length && navigationRoute.path && navigationRoute.path.length >= 2) {
      const cumulativeMeters = navigationRoute.path.reduce<number[]>((acc, point, index) => {
        if (index === 0) return [0];
        const previous = navigationRoute.path![index - 1];
        acc.push(acc[index - 1] + haversineKm(previous, point) * 1000);
        return acc;
      }, []);
      let nearestIndex = 0;
      let nearestKm = Infinity;
      navigationRoute.path.forEach((point, index) => {
        const km = haversineKm(current, point);
        if (km < nearestKm) {
          nearestKm = km;
          nearestIndex = index;
        }
      });
      const currentDistanceM = navPosition ? cumulativeMeters[nearestIndex] ?? 0 : 0;
      const aheadInstructions = routeInstructions
        .filter(instruction => instruction.distanceM >= currentDistanceM + 15)
        .sort((a, b) => a.distanceM - b.distanceM);
      const nextMeaningful = aheadInstructions.find(instruction => instruction.action !== 'straight') ?? aheadInstructions[0];
      if (nextMeaningful) {
        return composeTurnInstruction(
          nextMeaningful.action,
          Math.max(0, nextMeaningful.distanceM - currentDistanceM),
          nextMeaningful.bearing,
          'route',
          nextMeaningful.roadName,
          nextMeaningful.lat,
          nextMeaningful.lon
        );
      }
    }

    let nearestIndex = 0;
    let nearestKm = Infinity;
    path.forEach((point, index) => {
      const km = haversineKm(current, point);
      if (km < nearestKm) {
        nearestKm = km;
        nearestIndex = index;
      }
    });

    const baseIndex = Math.max(0, Math.min(path.length - 2, nearestIndex));
    let targetIndex = Math.min(path.length - 1, baseIndex + 1);
    let accumulatedKm = 0;
    for (let i = baseIndex; i < path.length - 1; i += 1) {
      accumulatedKm += haversineKm(path[i], path[i + 1]);
      targetIndex = i + 1;
      if (accumulatedKm >= 0.28) break;
    }

    const previousPoint = path[Math.max(0, baseIndex - 1)];
    const basePoint = path[baseIndex];
    const nextPoint = path[targetIndex] ?? path[Math.min(path.length - 1, baseIndex + 1)];
    const previousBearing = baseIndex > 0 ? bearingDegrees(previousPoint, basePoint) : bearingDegrees(current, nextPoint);
    const nextBearing = bearingDegrees(basePoint, nextPoint);
    const delta = normalizeTurnDelta(nextBearing - previousBearing);
    const action = turnActionFromDelta(delta);
    const distanceM = Math.max(0, haversineKm(current, nextPoint) * 1000);
    return composeTurnInstruction(action, distanceM, nextBearing, confidence);
  }, [navigationRoute, navPosition, mapBearing]);

  const speakGuidance = useCallback((message: string, interrupt = true) => {
    if (voiceGuidance === 'off') return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
      setVoiceStatus('unsupported');
      return;
    }
    if (interrupt) window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = voiceLanguage === 'he' ? 'he-IL' : 'en-US';
    const voice = pickSpeechVoice(voiceLanguage);
    if (voice) utterance.voice = voice;
    utterance.rate = voiceGuidance === 'detailed' ? 0.92 : 0.98;
    utterance.pitch = 1;
    utterance.onstart = () => setVoiceStatus('speaking');
    utterance.onend = () => setVoiceStatus('idle');
    utterance.onerror = () => setVoiceStatus('idle');
    window.speechSynthesis.speak(utterance);
  }, [voiceGuidance, voiceLanguage]);

  const setVoiceMode = (mode: VoiceGuidanceMode) => {
    if (mode === 'off' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setVoiceGuidance(mode);
    setVoiceStatus('idle');
    if (mode === 'basic') {
      window.setTimeout(() => {
        if ('speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined') {
          const utterance = new SpeechSynthesisUtterance(
            voiceLanguage === 'he' ? 'הנחיות קוליות בסיסיות הופעלו' : 'Basic voice guidance is enabled'
          );
          utterance.lang = voiceLanguage === 'he' ? 'he-IL' : 'en-US';
          const voice = pickSpeechVoice(voiceLanguage);
          if (voice) utterance.voice = voice;
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(utterance);
        }
      }, 0);
    }
    if (mode === 'detailed') {
      window.setTimeout(() => {
        if ('speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined') {
          const utterance = new SpeechSynthesisUtterance(
            voiceLanguage === 'he'
              ? 'הנחיות קוליות מפורטות הופעלו. אכריז על מסלול, מרחק, זמן משוער, הוראות פנייה ועדכוני התקדמות'
              : 'Detailed voice guidance is enabled. I will announce the route, distance, estimated time, turn prompts and progress updates'
          );
          utterance.lang = voiceLanguage === 'he' ? 'he-IL' : 'en-US';
          const voice = pickSpeechVoice(voiceLanguage);
          if (voice) utterance.voice = voice;
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(utterance);
        }
      }, 0);
    }
  };

  const testVoiceGuidance = () => {
    if (voiceGuidance === 'off') return;
    speakGuidance(
      voiceLanguage === 'he'
        ? voiceGuidance === 'basic'
          ? 'בדיקת קול. הנחיות בסיסיות בעברית פעילות.'
          : 'בדיקת קול. הנחיות מפורטות בעברית פעילות. בזמן ניווט יושמעו עדכוני מסלול, מרחק, זמן, כיוון התקדמות והוראות פנייה מהמסלול.'
        : voiceGuidance === 'basic'
          ? 'Voice test. Basic guidance in English is active.'
          : 'Voice test. Detailed guidance in English is active. During navigation, route updates, distance, time, heading and route turn prompts will be spoken.'
    );
  };

  useEffect(() => {
    if (voiceGuidance === 'off') {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setVoiceStatus('idle');
      return;
    }
    if (!navigationRoute || routeStatus === 'loading') return;
    const routeKey = `${navigationRoute.start.label}|${navigationRoute.end.label}|${navigationRoute.km.toFixed(2)}|${routeStatus}`;
    if (lastVoiceRouteRef.current === routeKey) return;
    lastVoiceRouteRef.current = routeKey;
    const timeText = voiceLanguage === 'he'
      ? navigationRoute.durationMin ? ` זמן נסיעה משוער ${Math.round(navigationRoute.durationMin)} דקות.` : ''
      : navigationRoute.durationMin ? ` Estimated drive time is ${Math.round(navigationRoute.durationMin)} minutes.` : '';
    const fallbackText = voiceLanguage === 'he'
      ? routeStatus === 'error' ? ' לא נמצא מסלול כבישים, מוצג מרחק אווירי משוער.' : ''
      : routeStatus === 'error' ? ' No road route was found. An estimated straight-line distance is shown.' : '';
    const turnText = currentTurnInstruction
      ? voiceLanguage === 'he'
        ? ` הוראת הפנייה הקרובה: ${currentTurnInstruction.text}.`
        : ` Next route turn prompt: ${currentTurnInstruction.textEn}.`
      : '';
    const message = voiceLanguage === 'he'
      ? voiceGuidance === 'basic'
        ? `המסלול מוכן. המרחק ${fmtKm(navigationRoute.km)}.${fallbackText}`
        : `המסלול מוכן מ${navigationRoute.start.label} אל ${navigationRoute.end.label}. המרחק ${fmtKm(navigationRoute.km)}.${timeText}${fallbackText}${turnText} לחץ על מיקום חי כדי לקבל עדכונים תוך כדי תנועה.`
      : voiceGuidance === 'basic'
        ? `The route is ready. The distance is ${fmtKm(navigationRoute.km)}.${fallbackText}`
        : `The route from ${navigationRoute.start.label} to ${navigationRoute.end.label} is ready. The distance is ${fmtKm(navigationRoute.km)}.${timeText}${fallbackText}${turnText} Turn on live location for updates while moving.`;
    speakGuidance(message);
  }, [voiceGuidance, voiceLanguage, navigationRoute, routeStatus, currentTurnInstruction, speakGuidance]);

  useEffect(() => {
    if (voiceGuidance === 'off' || !navigationRoute || !navPosition) return;
    const remainingKm = haversineKm([navPosition.lat, navPosition.lon], [navigationRoute.end.lat, navigationRoute.end.lon]);
    const bucket = voiceGuidance === 'basic'
      ? Math.max(0, Math.floor(remainingKm))
      : Math.max(0, Math.floor(remainingKm * 2) / 2);
    const now = Date.now();
    const minGap = voiceGuidance === 'basic' ? 60_000 : 30_000;
    if (lastVoiceProgressRef.current.bucket === bucket && now - lastVoiceProgressRef.current.at < minGap) return;
    if (now - lastVoiceProgressRef.current.at < minGap) return;
    lastVoiceProgressRef.current = { at: now, bucket };
    if (remainingKm < 0.15) {
      speakGuidance(voiceLanguage === 'he' ? 'הגעת לקרבת היעד.' : 'You are near your destination.');
      return;
    }
    const headingText = Number.isFinite(mapBearing)
      ? voiceLanguage === 'he'
        ? ` כיוון התקדמות משוער ${Math.round(mapBearing)} מעלות.`
        : ` Estimated heading is ${Math.round(mapBearing)} degrees.`
      : '';
    const turnText = voiceGuidance === 'detailed' && currentTurnInstruction
      ? voiceLanguage === 'he' ? ` ${currentTurnInstruction.text}.` : ` ${currentTurnInstruction.textEn}.`
      : '';
    const message = voiceLanguage === 'he'
      ? voiceGuidance === 'basic'
        ? `נותרו כ${fmtKm(remainingKm)} עד היעד.`
        : `עדכון ניווט. נותרו כ${fmtKm(remainingKm)} עד ${navigationRoute.end.label}.${headingText}${turnText} דיוק מיקום משוער ${Math.round(liveLocation?.accuracy ?? 0)} מטר.`
      : voiceGuidance === 'basic'
        ? `About ${fmtKm(remainingKm)} remaining to the destination.`
        : `Navigation update. About ${fmtKm(remainingKm)} remaining to ${navigationRoute.end.label}.${headingText}${turnText} Estimated location accuracy is ${Math.round(liveLocation?.accuracy ?? 0)} meters.`;
    speakGuidance(message, false);
  }, [voiceGuidance, voiceLanguage, navigationRoute, navPosition, mapBearing, currentTurnInstruction, speakGuidance]);

  useEffect(() => {
    if (voiceGuidance === 'off' || !navigationRoute || !currentTurnInstruction) return;
    if (voiceGuidance === 'basic' && currentTurnInstruction.action === 'straight') return;
    const key = `${currentTurnInstruction.action}-${Math.round(currentTurnInstruction.distanceM / 50)}-${Math.round(currentTurnInstruction.bearing / 10)}`;
    const now = Date.now();
    if (lastTurnVoiceRef.current.key === key) return;
    if (now - lastTurnVoiceRef.current.at < 20_000) return;
    lastTurnVoiceRef.current = { key, at: now };
    speakGuidance(voiceLanguage === 'he' ? currentTurnInstruction.text : currentTurnInstruction.textEn, false);
  }, [voiceGuidance, voiceLanguage, navigationRoute, currentTurnInstruction, speakGuidance]);

  const downloadJson = (filename: string, data: unknown) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast('קובץ JSON מוכן לשיתוף או הורדה');
  };

  const multiRouteTotalKm = useMemo(() => {
    if (multiRouteDraftPoints.length < 2) return 0;
    return multiRouteDraftPoints.slice(1).reduce((sum, pt, idx) =>
      sum + haversineKm([multiRouteDraftPoints[idx].lat, multiRouteDraftPoints[idx].lon], [pt.lat, pt.lon]), 0);
  }, [multiRouteDraftPoints]);

  const saveMultiRoute = () => {
    if (multiRouteDraftPoints.length < 2) return;
    const name = safeText(multiRouteName, `מסלול ${savedMultiRoutes.length + 1}`) || `מסלול ${savedMultiRoutes.length + 1}`;
    const route: MultiPointRoute = {
      id: `multi-${Date.now()}`,
      name,
      description: safeText(multiRouteDescription, ''),
      difficulty: multiRouteDifficulty,
      passability: multiRoutePassability,
      points: multiRouteDraftPoints,
      totalKm: multiRouteTotalKm,
      createdAt: new Date().toISOString(),
    };
    setSavedMultiRoutes(prev => [route, ...prev]);
    setActiveMultiRoute(route);
    setMultiRouteDraftPoints([]);
    setMultiRouteName('');
    setMultiRouteDescription('');
    setMultiRouteBuildMode(false);
    showToast(`המסלול "${route.name}" נשמר`);
  };

  const exportMultiRoute = (route: MultiPointRoute) => {
    downloadJson(`multi-route-${route.name.replace(/\s+/g, '-')}.json`, route);
  };

  const loadMultiRoute = (route: MultiPointRoute) => {
    setActiveMultiRoute(route);
    if (route.points.length >= 2) {
      const lats = route.points.map(p => p.lat);
      const lons = route.points.map(p => p.lon);
      setFocusTarget({
        lat: (Math.min(...lats) + Math.max(...lats)) / 2,
        lon: (Math.min(...lons) + Math.max(...lons)) / 2,
        zoom: 11,
        id: `multi-route-${route.id}-${Date.now()}`,
      });
    }
    showToast(`המסלול "${route.name}" נטען למפה`);
  };

  const saveCurrentRoute = () => {
    if (!navigationRoute) return;
    const fallbackName = `${navigationRoute.start.label} ← ${navigationRoute.end.label}`;
    const route: SavedRoute = {
      id: `route-${Date.now()}`,
      name: safeText(routeName, fallbackName) || fallbackName,
      createdAt: new Date().toISOString(),
      startId: navStartId || undefined,
      endId: navEndId || undefined,
      start: navigationRoute.start,
      end: navigationRoute.end,
      km: navigationRoute.km,
      durationMin: navigationRoute.durationMin,
      path: navigationRoute.path,
      instructions: navigationRoute.instructions,
    };
    setSavedRoutes(prev => [route, ...prev]);
    setActiveSavedRoute(route);
    setRouteName('');
    showToast(`המסלול “${route.name}” נשמר בזיכרון המקומי`);
  };

  const loadSavedRoute = (route: SavedRoute) => {
    setActiveSavedRoute(route);
    setRoadRoute(route.path ? {
      km: route.km,
      durationMin: route.durationMin ?? 0,
      path: route.path,
      instructions: route.instructions,
    } : null);
    setFocusTarget({
      lat: (route.start.lat + route.end.lat) / 2,
      lon: (route.start.lon + route.end.lon) / 2,
      zoom: 11,
      id: `saved-${route.id}-${Date.now()}`,
    });
    showToast(`המסלול “${route.name}” נטען למפה`);
  };

  const beginLiveLocationWatch = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setLocationStatus('unsupported');
      showToast('הדפדפן אינו תומך במיקום חי');
      return null;
    }
    const id = navigator.geolocation.watchPosition(
      pos => {
        setLiveLocation({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          heading: pos.coords.heading,
        });
        setLocationStatus('watching');
        if (!liveToastShownRef.current) {
          liveToastShownRef.current = true;
          showToast('מיקום חי הופעל והמפה תתמקד בסמן');
        }
      },
      () => {
        setLocationStatus('error');
        showToast('לא ניתן לקרוא מיקום. בדוק הרשאת מיקום בדפדפן');
      },
      { enableHighAccuracy: true, maximumAge: 5_000, timeout: 15_000 }
    );
    setWatchId(id);
    setLocationStatus('watching');
    return id;
  }, [liveToastShownRef, showToast]);

  const toggleLiveLocation = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setLocationStatus('idle');
      setLiveLocation(null);
      setLiveFollowDetached(false);
      liveToastShownRef.current = false;
      showToast('מיקום חי כובה');
      return;
    }
    setLiveFollowDetached(false);
    liveToastShownRef.current = false;
    showToast('מבקש הרשאת מיקום מהמכשיר…');
    beginLiveLocationWatch();
  };

  // ── navPosition throttle: only update when device moves >= 15 m ──────────────
  // Prevents O(n) path scan (currentTurnInstruction useMemo) from running on
  // every sub-metre GPS wobble, which was the root cause of the animation flicker.
  useEffect(() => {
    if (!liveLocation) return;
    const prev = navPositionRef.current;
    if (prev) {
      const movedKm = haversineKm([prev.lat, prev.lon], [liveLocation.lat, liveLocation.lon]);
      if (movedKm * 1000 < 15) return; // haven't moved 15 m yet — skip expensive recalc
    }
    const next = { lat: liveLocation.lat, lon: liveLocation.lon };
    navPositionRef.current = next;
    setNavPosition(next);
  }, [liveLocation]);

  // ---- Navigate from current position ----
  // If GPS is already active, sets live-location as start and the given point as end.
  // If GPS is not active, starts GPS watch first, then sets up the route.
  const navigateFromCurrentPosition = useCallback((toLat: number, toLon: number, toLabel: string) => {
    setNavCustomEnd({ lat: toLat, lon: toLon, label: toLabel });
    setNavEndId('custom-nav-end');
    setNavEndQuery(toLabel);
    if (liveLocation) {
      // GPS already active — set live position as start immediately
      setNavStartId('live-location');
      setNavStartQuery('מיקום נוכחי (GPS)');
      showToast(`מנווט ממיקומך אל ${toLabel}`);
    } else {
      // Start GPS watch; once we get a fix the live-location nav point will appear
      setNavStartId('live-location'); // will resolve once GPS fires
      setNavStartQuery('מיקום נוכחי (GPS)');
      showToast(`מפעיל GPS — ינווט אל ${toLabel}`);
      if (watchId === null) {
        setLiveFollowDetached(false);
        liveToastShownRef.current = true; // suppress duplicate toast
        beginLiveLocationWatch();
      }
    }
    document.getElementById('nav-section')?.scrollIntoView({ behavior: 'smooth' });
  }, [liveLocation, watchId, showToast, beginLiveLocationWatch]);

  // ---- Invalidate Leaflet map size whenever panels collapse/expand ----
  //
  // WHY snapshotCenter is NOT called here:
  // useEffect runs AFTER React commits the DOM — the CSS class panels-collapsed
  // has already been applied, the CSS grid has already changed, and
  // container.clientHeight already reflects the new size. If we called
  // snapshotCenter() here, map.getCenter() would compute from _pixelOrigin
  // (built for the OLD size) and viewHalf (now the NEW size) → wrong geo-center.
  //
  // Instead, snapshotCenter() is called from handlePanelToggle() SYNCHRONOUSLY
  // before setPanelsCollapsed(), while the DOM still has the old layout.
  useEffect(() => {
    if (panelsCollapseIsFirstMount.current) {
      panelsCollapseIsFirstMount.current = false;
      // On first mount: invalidate so Leaflet measures the real container size.
      // No snapshot needed — the map is still restoring from localStorage.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          mapViewRef.current?.invalidateSize();
        });
      });
      return;
    }
    // snapshotCenter() was already called synchronously in handlePanelToggle.
    // Double rAF: frame 1 → CSS grid layout settles; frame 2 → Leaflet
    // measures the new clientHeight and setView anchors the correct geo-center.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        mapViewRef.current?.invalidateSize();
      });
    });
  }, [panelsCollapsed]);

  // ---- Panel toggle — snapshot center BEFORE DOM change ----
  //
  // Calling snapshotCenter() here is the ONLY safe place: we are still in the
  // synchronous click-event handler, the CSS class has NOT been applied yet,
  // the CSS grid still has its OLD dimensions, and Leaflet's internal
  // _pixelOrigin was computed for the OLD size. map.getCenter() therefore
  // returns the correct geo-center. The double-rAF in the useEffect above
  // will call invalidateSize() once the new layout has settled, which calls
  // setView(snapshotted-center) to lock the viewport on that geo-center.
  const handlePanelToggle = useCallback(() => {
    mapViewRef.current?.snapshotCenter();
    setPanelsCollapsed(v => !v);
  }, []);

  // ---- Panel drag handlers (mobile bottom-sheet) ----
  const handlePanelDragStart = useCallback((clientY: number) => {
    panelDragRef.current = { startY: clientY, startPct: panelHeightPct };
  }, [panelHeightPct]);

  const handlePanelDragMove = useCallback((clientY: number) => {
    if (!panelDragRef.current) return;
    const { startY, startPct } = panelDragRef.current;
    const deltaY = startY - clientY; // drag up = positive
    const deltaPct = (deltaY / window.innerHeight) * 100;
    const newPct = Math.min(90, Math.max(8, startPct + deltaPct));
    setPanelHeightPct(newPct);
  }, []);

  const handlePanelDragEnd = useCallback(() => {
    panelDragRef.current = null;
    // Snap to nearest anchor: 8%, 20%, 35%, 50%, 65%, 78%, 90%
    setPanelHeightPct(prev => {
      const anchors = [8, 20, 35, 50, 65, 78, 90];
      return anchors.reduce((best, a) => Math.abs(a - prev) < Math.abs(best - prev) ? a : best, anchors[2]);
    });
  }, []);

  const handleLiveFollowDetachedChange = useCallback((detached: boolean) => {
    setLiveFollowDetached(detached);
  }, []);

  const centerLiveLocation = useCallback(() => {
    if (!liveLocation) return;
    setLiveFollowDetached(false);
    setLiveCenterRequestId(value => value + 1);
    setFocusTarget({
      lat: liveLocation.lat,
      lon: liveLocation.lon,
      zoom: 17,
      id: `live-center-${Date.now()}`,
    });
    showToast('המפה חזרה להתמקד במיקום החי');
  }, [liveLocation, showToast]);

  const beginRecordingWatch = (resetTrack: boolean) => {
    if (!('geolocation' in navigator)) {
      setRecordingStatus('unsupported');
      showToast('הדפדפן אינו תומך בהקלטת מיקום');
      return null;
    }
    if (recordingWatchId !== null) return;
    if (resetTrack) {
      setRecordedTrack([]);
      recordedTrackRef.current = [];
    }
    const id = navigator.geolocation.watchPosition(
      pos => {
        const point: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setLiveLocation({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          heading: pos.coords.heading,
        });
        setRecordedTrack(prev => {
          const last = prev[prev.length - 1];
          if (last && haversineKm(last, point) < 0.01) return prev;
          return [...prev, point].slice(-10000);
        });
        setRecordingStatus('recording');
        if (!recordingToastShownRef.current) {
          recordingToastShownRef.current = true;
          showToast('הקלטת המסלול החלה');
        }
      },
      () => {
        setRecordingStatus('error');
        showToast('לא ניתן להקליט מיקום. בדוק הרשאת GPS בדפדפן');
      },
      { enableHighAccuracy: true, maximumAge: 2_000, timeout: 15_000 }
    );
    setRecordingWatchId(id);
    setRecordingStatus('recording');
    return id;
  };

  const startRecording = () => {
    recordingToastShownRef.current = false;
    showToast('מבקש הרשאת מיקום ומתחיל הקלטה…');
    beginRecordingWatch(true);
  };

  const stopRecording = () => {
    if (recordingWatchId !== null && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(recordingWatchId);
    }
    setRecordingWatchId(null);
    setRecordingStatus('idle');
    showToast('הקלטת המסלול נעצרה');
  };

  const recordingToRoute = (): SavedRoute | null => {
    if (recordedTrack.length < 2) return null;
    const start = recordedTrack[0];
    const end = recordedTrack[recordedTrack.length - 1];
    const name = safeText(recordingName, `הקלטת מסלול ${new Date().toLocaleString('he-IL')}`) || 'הקלטת מסלול';
    return {
      id: `recorded-${Date.now()}`,
      name,
      createdAt: new Date().toISOString(),
      start: { lat: start[0], lon: start[1], label: `${name} — התחלה` },
      end: { lat: end[0], lon: end[1], label: `${name} — סיום` },
      km: recordedKm,
      path: recordedTrack,
    };
  };

  const saveRecording = () => {
    const route = recordingToRoute();
    if (!route) return;
    setSavedRoutes(prev => [route, ...prev]);
    setActiveSavedRoute(route);
    setRecordingName('');
    showToast(`ההקלטה “${route.name}” נשמרה כמסלול`);
  };

  const importRoutes = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_ROUTE_FILE_BYTES) {
      setRouteStatus('error');
      showToast('קובץ המסלול גדול מדי לייבוא');
      return;
    }
    let data: unknown;
    try {
      const text = await file.text();
      data = JSON.parse(text);
    } catch {
      setRouteStatus('error');
      showToast('לא ניתן לקרוא את קובץ המסלול');
      return;
    }
    const routes = (Array.isArray(data) ? data : [data]).slice(0, MAX_IMPORTED_ROUTES);
    const valid = routes.filter((r: SavedRoute) =>
      r &&
      r.start &&
      r.end &&
      typeof r.start.lat === 'number' &&
      typeof r.start.lon === 'number' &&
      typeof r.end.lat === 'number' &&
      typeof r.end.lon === 'number' &&
      Math.abs(r.start.lat) <= 90 &&
      Math.abs(r.end.lat) <= 90 &&
      Math.abs(r.start.lon) <= 180 &&
      Math.abs(r.end.lon) <= 180
    ).map((r: SavedRoute) => ({
      id: safeText(r.id) || `route-${Date.now()}-${Math.random()}`,
      name: safeText(r.name, 'מסלול מיובא') || 'מסלול מיובא',
      createdAt: safeText(r.createdAt, new Date().toISOString()) || new Date().toISOString(),
      startId: safeText(r.startId),
      endId: safeText(r.endId),
      start: {
        lat: r.start.lat,
        lon: r.start.lon,
        label: safeText(r.start.label, 'נקודת מוצא') || 'נקודת מוצא',
      },
      end: {
        lat: r.end.lat,
        lon: r.end.lon,
        label: safeText(r.end.label, 'יעד') || 'יעד',
      },
      km: typeof r.km === 'number' && isFinite(r.km) && r.km >= 0 ? r.km : haversineKm([r.start.lat, r.start.lon], [r.end.lat, r.end.lon]),
      durationMin: typeof r.durationMin === 'number' && isFinite(r.durationMin) && r.durationMin >= 0 ? r.durationMin : undefined,
      path: Array.isArray(r.path)
        ? r.path
            .slice(0, MAX_ROUTE_POINTS)
            .filter((p): p is [number, number] =>
              Array.isArray(p) &&
              p.length >= 2 &&
              typeof p[0] === 'number' &&
              typeof p[1] === 'number' &&
              Math.abs(p[0]) <= 90 &&
              Math.abs(p[1]) <= 180
            )
        : undefined,
      instructions: normalizeRouteInstructions(r.instructions),
    }));
    if (valid.length) {
      setSavedRoutes(prev => [...valid, ...prev]);
      showToast(`${valid.length} מסלולים יובאו בהצלחה`);
    } else {
      showToast('לא נמצאו מסלולים תקינים בקובץ');
    }
  };

  const savePoi = () => {
    if (!poiDraft) return;
    const name = safeText(poiName, `נקודת עניין ${customPois.length + 1}`) || `נקודת עניין ${customPois.length + 1}`;
    const description = safeText(poiDescription, 'נקודה שהמשתמש הוסיף למפה');
    const poi: CustomPoi = {
      id: `poi-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      description,
      lat: poiDraft.lat,
      lon: poiDraft.lon,
      createdAt: new Date().toISOString(),
      markerColor: poiMarkerColor,
      markerShape: poiMarkerShape,
      markerSize: poiMarkerSize,
    };
    setCustomPois(prev => [poi, ...prev]);
    setPoiDraft(null);
    setPoiName('');
    setPoiDescription('');
    setAddPoiMode(false);
    showToast(`נקודת העניין “${poi.name}” נשמרה`);
  };

  const importPois = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_POI_FILE_BYTES) {
      showToast('קובץ נקודות העניין גדול מדי לייבוא');
      return;
    }
    let data: unknown;
    try {
      const text = await file.text();
      data = JSON.parse(text);
    } catch {
      showToast('לא ניתן לקרוא את קובץ נקודות העניין');
      return;
    }
    const items = (Array.isArray(data) ? data : [data]).slice(0, MAX_IMPORTED_POIS);
    const valid = items.map(normalizePoi).filter((p): p is CustomPoi => Boolean(p));
    if (valid.length) {
      setCustomPois(prev => [...valid, ...prev]);
      showToast(`${valid.length} נקודות עניין יובאו בהצלחה`);
    } else {
      showToast('לא נמצאו נקודות עניין תקינות בקובץ');
    }
  };

  const shareCurrentApp = async () => {
    const shareData = {
      title: 'מפת מרחב דרום לבנון',
      text: 'מפה אינטראקטיבית חינוכית של מרחב דרום לבנון עד נהר הליטני',
      url: window.location.href,
    };
    if (navigator.share) {
      await navigator.share(shareData);
      return;
    }
    await navigator.clipboard?.writeText(window.location.href);
  };

  const openDonationLink = () => {
    const opened = window.open(DONATION_CONTACT_URL, '_blank', 'noopener,noreferrer');
    if (!opened) {
      window.location.href = DONATION_CONTACT_URL;
    }
  };

  const copyDonationLink = async () => {
    await navigator.clipboard?.writeText(DONATION_CONTACT_URL);
    setDonationCopied(true);
    window.setTimeout(() => setDonationCopied(false), 2200);
  };

  const visibleKey = (k: keyof LayerVis) => () =>
    setVisible(v => ({ ...v, [k]: !v[k] }));

  const resetView = useCallback(() => {
    setVisible({ ...DEFAULT_LAYER_VISIBILITY });
    setThemeMode(DEFAULT_THEME_MODE);
    setLargeLabels(false);
    setAllLabels(false);
    setCompassMode(false);
    setMeasureMode(false);
    setManualMeasure([]);
    setSelectedId(null);
    setLiveFollowDetached(false);
    setFocusTarget({
      ...DEFAULT_MAP_VIEW,
      id: `reset-view-${Date.now()}`,
    });
    showToast('התצוגה אופסה לברירת המחדל');
  }, [showToast]);

  const miniNavSvgMarkup = () => {
    const routePoints = navigationRoute?.path && navigationRoute.path.length >= 2
      ? navigationRoute.path
      : navigationRoute
        ? [
            [navigationRoute.start.lat, navigationRoute.start.lon],
            [navigationRoute.end.lat, navigationRoute.end.lon],
          ] as [number, number][]
        : recordedTrack.length >= 2
          ? recordedTrack
          : [];
    const livePoint: [number, number] | null = liveLocation ? [liveLocation.lat, liveLocation.lon] : null;
    const allPoints = livePoint ? [...routePoints, livePoint] : routePoints;

    if (allPoints.length < 2) {
      return `<svg class="mini-nav-svg" viewBox="0 0 320 132" role="img" aria-label="אין מסלול להצגה">
        <rect x="1" y="1" width="318" height="130" rx="18" class="mini-nav-bg" />
        <path d="M34 92 C82 50 126 78 172 44 S252 42 286 76" class="mini-nav-placeholder" />
        <circle cx="34" cy="92" r="5" class="mini-nav-muted-dot" />
        <circle cx="286" cy="76" r="5" class="mini-nav-muted-dot" />
        <text x="160" y="69" text-anchor="middle" class="mini-nav-empty">בחר מסלול או התחל הקלטה</text>
      </svg>`;
    }

    const width = 320;
    const height = 132;
    const pad = 18;
    const lats = allPoints.map(p => p[0]);
    const lons = allPoints.map(p => p[1]);
    let minLat = Math.min(...lats);
    let maxLat = Math.max(...lats);
    let minLon = Math.min(...lons);
    let maxLon = Math.max(...lons);
    if (Math.abs(maxLat - minLat) < 0.01) {
      minLat -= 0.005;
      maxLat += 0.005;
    }
    if (Math.abs(maxLon - minLon) < 0.01) {
      minLon -= 0.005;
      maxLon += 0.005;
    }
    const project = ([lat, lon]: [number, number]) => {
      const x = pad + ((lon - minLon) / (maxLon - minLon)) * (width - pad * 2);
      const y = pad + ((maxLat - lat) / (maxLat - minLat)) * (height - pad * 2);
      return [Number(x.toFixed(1)), Number(y.toFixed(1))] as [number, number];
    };
    const routePath = routePoints.map(project).map(([x, y], idx) => `${idx === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ');
    const recordingPath = recordedTrack.length >= 2
      ? recordedTrack.map(project).map(([x, y], idx) => `${idx === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ')
      : '';
    const start = project(routePoints[0]);
    const end = project(routePoints[routePoints.length - 1]);
    const current = livePoint ? project(livePoint) : recordedTrack.length >= 1 ? project(recordedTrack[recordedTrack.length - 1]) : end;
    const bearing = Math.round(mapBearing);
    const modeLabel = navigationRoute ? 'מסלול פעיל' : recordedTrack.length >= 2 ? 'הקלטה פעילה' : 'מיני ניווט';

    return `<svg class="mini-nav-svg" viewBox="0 0 320 132" role="img" aria-label="${miniEscape(modeLabel)}">
      <rect x="1" y="1" width="318" height="130" rx="18" class="mini-nav-bg" />
      <path d="M24 36 H296 M24 66 H296 M24 96 H296 M76 18 V114 M160 18 V114 M244 18 V114" class="mini-nav-gridline" />
      ${recordingPath ? `<path d="${recordingPath}" class="mini-nav-recording" />` : ''}
      ${routePath ? `<path d="${routePath}" class="mini-nav-route" />` : ''}
      <circle cx="${start[0]}" cy="${start[1]}" r="5.5" class="mini-nav-start" />
      <circle cx="${end[0]}" cy="${end[1]}" r="5.5" class="mini-nav-end" />
      <g transform="translate(${current[0]} ${current[1]}) rotate(${bearing})">
        <path d="M0 -12 L7 8 L0 4 L-7 8 Z" class="mini-nav-live" />
      </g>
      <circle cx="${current[0]}" cy="${current[1]}" r="13" class="mini-nav-pulse" />
      <text x="18" y="23" class="mini-nav-label">${miniEscape(modeLabel)}</text>
      <text x="302" y="116" text-anchor="end" class="mini-nav-bearing">${bearing}°</text>
    </svg>`;
  };

  const miniWindowHtml = () => {
    const title = navigationRoute
      ? `${navigationRoute.start.label} ← ${navigationRoute.end.label}`
      : 'אין מסלול פעיל';
    const distance = navigationRoute ? fmtKm(navigationRoute.km) : '—';
    const duration = navigationRoute?.durationMin ? `${Math.round(navigationRoute.durationMin)} דק׳` : '—';
    const location = liveLocation ? `${liveLocation.lat.toFixed(5)}, ${liveLocation.lon.toFixed(5)}` : 'לא פעיל';
    const recording = recordedTrack.length ? `${recordedTrack.length} נק׳ · ${fmtKm(recordedKm)}` : 'לא פעילה';
    const turn = currentTurnInstruction?.text ?? 'אין הוראת פנייה זמינה';
    const miniMap = miniNavSvgMarkup();
    return `<!doctype html>
<html lang="he" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>מפת מצב — חלון מוקטן</title>
  <style>
    :root { color-scheme: dark; font-family: system-ui, "Segoe UI", sans-serif; background:#0f1217; color:#d8dee8; }
    body { margin:0; padding:14px; background:linear-gradient(145deg,#0f1217,#17202a); }
    .card { border:1px solid #2c3645; border-radius:16px; padding:14px; box-shadow:0 10px 30px rgba(0,0,0,.35); }
    h1 { margin:0 0 8px; font-size:15px; color:#6ed1c2; }
    .route { font-weight:800; line-height:1.4; margin-bottom:10px; }
    .mini-nav { margin:10px 0; border:1px solid #232b38; border-radius:16px; overflow:hidden; background:#0b0d10; }
    .mini-nav-svg { display:block; width:100%; height:auto; }
    .mini-nav-bg { fill:#111821; stroke:#2c3645; }
    .mini-nav-gridline { stroke:rgba(255,255,255,.08); stroke-width:1; }
    .mini-nav-route { fill:none; stroke:#6ed1c2; stroke-width:5; stroke-linecap:round; stroke-linejoin:round; }
    .mini-nav-recording { fill:none; stroke:#f6c453; stroke-width:3; stroke-linecap:round; stroke-linejoin:round; stroke-dasharray:7 6; opacity:.9; }
    .mini-nav-start { fill:#88c37a; stroke:#0b0d10; stroke-width:2; }
    .mini-nav-end { fill:#d96b6b; stroke:#0b0d10; stroke-width:2; }
    .mini-nav-live { fill:#5a8fbf; stroke:#eaf7ff; stroke-width:1.6; filter:drop-shadow(0 4px 8px rgba(0,0,0,.45)); }
    .mini-nav-pulse { fill:none; stroke:#5a8fbf; stroke-width:2; opacity:.35; }
    .mini-nav-placeholder { fill:none; stroke:#6ed1c2; stroke-width:4; stroke-linecap:round; stroke-dasharray:8 8; opacity:.55; }
    .mini-nav-muted-dot { fill:#8b97a8; opacity:.75; }
    .mini-nav-empty, .mini-nav-label, .mini-nav-bearing { fill:#8b97a8; font-size:11px; font-weight:700; }
    .grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
    .item { background:#131820; border:1px solid #232b38; border-radius:10px; padding:8px; }
    .turn { border:1px solid rgba(110,209,194,.32); background:rgba(110,209,194,.08); border-radius:12px; padding:9px 10px; margin:0 0 10px; line-height:1.45; }
    .turn small { color:#6ed1c2; }
    .turn strong { display:block; font-size:13px; }
    small { display:block; color:#8b97a8; font-size:10px; margin-bottom:3px; }
    strong { font-size:14px; }
    .note { margin-top:10px; color:#8b97a8; font-size:11px; line-height:1.4; }
  </style>
</head>
<body>
  <main class="card">
    <h1>חלון מוקטן — מיני ניווט</h1>
    <div class="route">${miniEscape(title)}</div>
    <div class="mini-nav">${miniMap}</div>
    <div class="turn"><small>הוראת פנייה במסלול</small><strong>${miniEscape(turn)}</strong></div>
    <div class="grid">
      <div class="item"><small>מרחק</small><strong>${miniEscape(distance)}</strong></div>
      <div class="item"><small>זמן תיאורטי</small><strong>${miniEscape(duration)}</strong></div>
      <div class="item"><small>מיקום חי</small><strong>${miniEscape(location)}</strong></div>
      <div class="item"><small>הקלטה</small><strong>${miniEscape(recording)}</strong></div>
    </div>
    <div class="note">במחשב שולחני החלון משתמש ב־Document Picture-in-Picture כאשר הדפדפן תומך בכך. בנייד האפליקציה משתמשת במיני־ניווט פנימי יציב.</div>
  </main>
</body>
</html>`;
  };

  const openMiniWindow = async () => {
    if (isMobileLikeDevice()) {
      if (miniExternalWindowRef.current && !miniExternalWindowRef.current.closed) {
        miniExternalWindowRef.current.close();
        miniExternalWindowRef.current = null;
      }
      setMiniOverlayOpen(true);
      setMiniStatus('mobile');
      return;
    }
    const pipApi = (window as Window & {
      documentPictureInPicture?: {
        requestWindow: (options: { width: number; height: number }) => Promise<Window>;
      };
    }).documentPictureInPicture;
    if (pipApi?.requestWindow) {
      try {
        const pipWindow = await pipApi.requestWindow({ width: 360, height: 300 });
        pipWindow.document.open();
        pipWindow.document.write(miniWindowHtml());
        pipWindow.document.close();
        miniExternalWindowRef.current = pipWindow;
        setMiniOverlayOpen(false);
        setMiniStatus('pip');
        return;
      } catch {
        // Continue to popup / in-app fallback.
      }
    }
    const popup = window.open('', 'south-lebanon-mini-map', 'popup,width=360,height=300');
    if (popup) {
      popup.document.open();
      popup.document.write(miniWindowHtml());
      popup.document.close();
      try {
        popup.opener = null;
      } catch {
        // Some browsers block changing opener. The popup contains only local status HTML.
      }
      miniExternalWindowRef.current = popup;
      setMiniOverlayOpen(false);
      setMiniStatus('popup');
      return;
    }
    setMiniOverlayOpen(true);
    setMiniStatus('fallback');
  };

  useEffect(() => {
    const miniWindow = miniExternalWindowRef.current;
    if (!miniWindow || miniWindow.closed) return;
    try {
      miniWindow.document.open();
      miniWindow.document.write(miniWindowHtml());
      miniWindow.document.close();
    } catch {
      miniExternalWindowRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigationRoute, liveLocation, recordedTrack, recordedKm, currentTurnInstruction]);

  useEffect(() => {
    if (resumedLiveRef.current) return;
    resumedLiveRef.current = true;
    if (initialNavSessionRef.current?.liveActive && watchId === null) {
      beginLiveLocationWatch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (resumedRecordingRef.current) return;
    resumedRecordingRef.current = true;
    if (initialRecordingSessionRef.current?.recordingActive && recordingWatchId === null) {
      beginRecordingWatch(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`app ${panelsCollapsed ? 'panels-collapsed' : ''}`}
      style={{ '--panel-height-pct': `${panelHeightPct}vh` } as React.CSSProperties}
    >
      {/* ============ Header ============ */}
      <header className="header">
        <div className="brand">
          <svg className="brand-logo" viewBox="0 0 32 32" fill="none" aria-label="לוגו">
            <path d="M4 24 L12 8 L16 16 L20 12 L28 24" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
            <circle cx="16" cy="20" r="2" fill="currentColor" />
          </svg>
          <div>
            <div className="brand-title">מרחב דרום לבנון — מפת מצב</div>
            <div className="brand-sub">פותח ע״י יגאל קריגל - קה״ד גדס״מ 5679 - גדוד סיור מיוחד</div>
          </div>
        </div>
        <div className="header-actions">
          <button
            className="btn menu-toggle"
            onClick={handlePanelToggle}
            aria-pressed={panelsCollapsed}
            data-testid="button-toggle-menu"
          >
            {panelsCollapsed ? 'פתח תפריט' : 'סגור תפריט'}
          </button>
          <button className="btn" onClick={() => openMiniWindow().catch(() => setMiniOverlayOpen(true))} data-testid="button-mini-window">
            חלון מוקטן
          </button>
          <div className="theme-switch" role="group" aria-label="מצב בהירות" data-testid="theme-switch">
            {([
              ['dark', 'כהה'],
              ['light', 'בהיר'],
              ['auto', 'אוטומטי'],
            ] as const).map(([mode, label]) => (
              <button
                key={mode}
                className="theme-btn"
                aria-pressed={themeMode === mode}
                onClick={() => setThemeMode(mode)}
                data-testid={`button-theme-${mode}`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            className="btn ghost"
            onClick={resetView}
            data-testid="button-reset-view"
            title="איפוס שכבות, בהירות, מצפן ומיקוד המפה"
          >
            איפוס תצוגה
          </button>
          <a
            className="btn portfolio-link"
            href="https://portfolio-dusky-eight-77.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            data-testid="link-portfolio"
          >
            הפורטפוליו שלי
          </a>
          <button className="btn" onClick={() => setHelpOpen(true)} data-testid="button-help">
            עזרה והדרכה
          </button>
          <button className="btn" onClick={() => setSupportOpen(true)} data-testid="button-support">
            תמיכה בפיתוח
          </button>
          <button className="btn" onClick={() => setAboutOpen(true)} data-testid="button-about">
            About
          </button>
          <button
            className="btn"
            onClick={() => {
              setMeasureMode(m => !m);
              setManualMeasure([]);
            }}
            aria-pressed={measureMode}
            data-testid="button-measure"
          >
            {measureMode ? 'יציאה ממצב מדידה' : 'מדידה ידנית'}
          </button>
          <button className="btn ghost" onClick={() => setDrawerOpen(true)} data-testid="button-sources">
            מקורות ועל אודות
          </button>
        </div>
      </header>

      {/* ============ Left panel: layers + filters ============ */}
      <aside
        className="panel left"
        data-testid="panel-layers"
        ref={panelRef}
      >
        {/* Drag handle — visible only on mobile */}
        <div
          className="panel-drag-handle"
          data-testid="panel-drag-handle"
          aria-label="גרור לשינוי גובה התפריט"
          onMouseDown={e => { e.preventDefault(); handlePanelDragStart(e.clientY); }}
          onTouchStart={e => handlePanelDragStart(e.touches[0].clientY)}
          onMouseMove={e => { if (panelDragRef.current) { e.preventDefault(); handlePanelDragMove(e.clientY); } }}
          onTouchMove={e => { e.preventDefault(); handlePanelDragMove(e.touches[0].clientY); }}
          onMouseUp={handlePanelDragEnd}
          onMouseLeave={handlePanelDragEnd}
          onTouchEnd={handlePanelDragEnd}
        >
          <span className="panel-drag-pill" />
        </div>
        <div className="panel-scroll">
          <div className="panel-section map-search-section">
            <h3>חיפוש במפה</h3>
            <input
              className="search"
              placeholder="חפש כפר, עיר, רכס, הר, נחל או נקודת עניין…"
              value={mapSearchQuery}
              onChange={e => setMapSearchQuery(e.target.value)}
              data-testid="input-map-search"
            />
            <p className="legend-note">
              בחירה בתוצאה ממקמת את הנקודה במרכז המפה, פותחת זום קרוב ומציגה סמן מיקוד.
            </p>
            {mapSearchResults.length > 0 && (
              <div className="search-results map-search-results" data-testid="map-search-results">
                {mapSearchResults.map(result => (
                  <div key={result.id} className="search-result-row" data-testid={`result-row-${result.id}`}>
                    <button
                      className="search-result"
                      onClick={() => {
                        setFocusTarget({
                          lat: result.lat,
                          lon: result.lon,
                          zoom: result.zoom,
                          label: result.title,
                          id: `${result.id}-${Date.now()}`,
                        });
                        setVisible(v => ({ ...v, cityLabels: true, settlementLabels: true, ridgeLabels: true, waterLabels: true }));
                        if ('incidentId' in result && typeof result.incidentId === 'string') setSelectedId(result.incidentId);
                      }}
                      data-testid={`button-map-search-result-${result.id}`}
                    >
                      <span>{result.title}</span>
                      <small>{result.subtitle}</small>
                    </button>
                    <div className="navigate-btn-group">
                      <button
                        className="btn navigate-here-btn navigate-here-primary"
                        onClick={() => navigateFromCurrentPosition(result.lat, result.lon, result.title)}
                        title="הגע מיישור ממיקום הנוכחי"
                        data-testid={`button-navigate-from-here-${result.id}`}
                      >
                        ▶ נווט מיכאן
                      </button>
                      <button
                        className="btn navigate-here-btn navigate-here-external"
                        onClick={() => openExternalNav(result.lat, result.lon, result.title,
                          liveLocation?.lat, liveLocation?.lon)}
                        title="פתח Waze / Google Maps"
                        data-testid={`button-open-external-nav-${result.id}`}
                      >
                        פתח Waze/Maps
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {mapSearchQuery.trim().length > 1 && mapSearchResults.length === 0 && (
              <p className="legend-note" data-testid="map-search-empty">לא נמצאו תוצאות. נסה כתיב עברי/אנגלי אחר או שם סמוך.</p>
            )}
          </div>

          <div className="panel-section">
            <h3>שכבות מידע</h3>
            <div className="layer-group-title">שכבות בסיס, ביטחון ותבליט</div>
            {[
              { key: 'pop' as const, label: 'תפוצת אוכלוסיה אזרחית', color: '#d0b58a' },
              { key: 'unifil' as const, label: 'יוניפי״ל — מטה ומגזרים', color: '#6da7d1' },
              { key: 'hez' as const, label: 'אזורי השפעת חזבאללה (איכותי)', color: '#b56466' },
              { key: 'blueLine' as const, label: 'הקו הכחול (מקורב)', color: '#5a8fbf' },
              { key: 'litani' as const, label: 'נהר הליטני וגבול אזור החיץ', color: '#4e7fb0' },
              { key: 'rivers' as const, label: 'נהרות — זהרני, אוואלי', color: '#4a90c4' },
              { key: 'topo' as const, label: 'טופוגרפיה — ניתוח תבליט וקרקע', color: '#88c37a' },
            ].map(l => (
              <div
                key={l.key}
                className="toggle-row"
                data-active={visible[l.key]}
                onClick={visibleKey(l.key)}
                role="switch"
                aria-checked={visible[l.key]}
                data-testid={`toggle-layer-${l.key}`}
              >
                <div className="toggle-label">
                  <span className="toggle-swatch" style={{ background: l.color }} />
                  {l.label}
                </div>
                <span className="toggle-switch" />
              </div>
            ))}
            <div className="layer-group-title layer-group-title-labels">שכבות שמות בעברית</div>
            {[
              { key: 'cityLabels' as const, label: 'שמות בעברית — הפעלה כללית', color: '#f6c453' },
              { key: 'settlementLabels' as const, label: 'שמות יישובים וכפרים', color: '#f6c453' },
              { key: 'ridgeLabels' as const, label: 'רכסים, הרים ועמקים', color: '#d49a3a' },
              { key: 'waterLabels' as const, label: 'נחלים, ואדיות ונהרות', color: '#4e7fb0' },
            ].map(l => (
              <div
                key={l.key}
                className="toggle-row"
                data-active={visible[l.key]}
                onClick={visibleKey(l.key)}
                role="switch"
                aria-checked={visible[l.key]}
                data-testid={`toggle-layer-${l.key}`}
              >
                <div className="toggle-label">
                  <span className="toggle-swatch" style={{ background: l.color }} />
                  {l.label}
                </div>
                <span className="toggle-switch" />
              </div>
            ))}
            <p className="legend-note">
              שכבת חזבאללה היא איכותית בלבד — מבוססת דיווחי תקשורת ומחקר ציבוריים, אינה מציינת מתקנים מבצעיים או יעדים תקיפים.
            </p>
            <div
              className="toggle-row"
              data-active={visible.sectColors}
              onClick={visibleKey('sectColors')}
              role="switch"
              aria-checked={visible.sectColors}
              data-testid="toggle-layer-sectColors"
            >
              <div className="toggle-label">
                <span className="toggle-swatch" style={{ background: 'linear-gradient(90deg,#2a8a6e,#b03030,#7b3fa0,#c97d2a)' }} />
                צביעת ישובים לפי השתייכות דתית
              </div>
              <span className="toggle-switch" />
            </div>
            {visible.sectColors && (
              <>
                <div className="sect-legend">
                  {([
                    { sect: 'shia',      label: 'שיעים',    color: '#2a8a6e' },
                    { sect: 'sunni',     label: 'סונים',    color: '#c97d2a' },
                    { sect: 'christian', label: 'נוצרים',   color: '#b03030' },
                    { sect: 'druze',     label: 'דרוזים',   color: '#7b3fa0' },
                    { sect: 'mixed',     label: 'מעורב',    color: '#6b7280' },
                  ] as const).map(s => (
                    <div key={s.sect} className="sect-legend-row">
                      <span className="sect-legend-dot" style={{ background: s.color }} />
                      <span>{s.label}</span>
                    </div>
                  ))}
                </div>
                <p className="legend-note">צבע הגבול והנקודה על תווית הישוב מציינים את ההשתייכות הדתית הדומיננטית.</p>
              </>
            )}
          </div>

          <div className="panel-section" id="nav-section">
            <h3>ניווט כבישים נקודה לנקודה</h3>
            <div className="route-form" data-testid="route-form">
              <div className="route-picker-grid">
                <div className="route-picker">
                  <label>
                    <span>חפש נקודת מוצא</span>
                    <div className="route-start-row">
                      <input
                        className="search"
                        value={navStartQuery}
                        onChange={e => setNavStartQuery(e.target.value)}
                        placeholder={navStart ? navStart.label : 'לדוגמה: נאקורה, מטולה, צור…'}
                        data-testid="input-route-start-search"
                      />
                      <button
                        className={`btn use-my-location-btn${locationStatus === 'watching' && liveLocation ? ' active' : ''}`}
                        onClick={() => {
                          setNavStartId('live-location');
                          setNavStartQuery('מיקום נוכחי (GPS)');
                          if (liveLocation) {
                            showToast('נקודת מוצא: מיקום נוכחי');
                          } else {
                            showToast('מפעיל GPS — מיקום יוגדר כנקודת מוצא');
                            if (watchId === null) {
                              setLiveFollowDetached(false);
                              liveToastShownRef.current = true;
                              beginLiveLocationWatch();
                            }
                          }
                        }}
                        title="השתמש במיקום הנוכחי כנקודת מוצא"
                        data-testid="button-use-my-location"
                      >
                        📍 ממיקומי
                      </button>
                    </div>
                  </label>
                  <div className="route-pick-results" data-testid="route-start-results">
                    {startMatches.map(p => (
                      <button
                        key={`start-${p.id}`}
                        className="route-pick"
                        data-active={navStartId === p.id}
                        onClick={() => {
                          setNavStartId(p.id);
                          setNavStartQuery(p.label);
                        }}
                        data-testid={`button-route-start-${p.id}`}
                      >
                        <span>{p.label}</span>
                        <small>{p.group}</small>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="route-picker">
                  <label>
                    <span>חפש יעד</span>
                    <input
                      className="search"
                      value={navEndQuery}
                      onChange={e => setNavEndQuery(e.target.value)}
                      placeholder={navEnd ? navEnd.label : 'לדוגמה: צור, קריית שמונה, יוניפי״ל…'}
                      data-testid="input-route-end-search"
                    />
                  </label>
                  <div className="route-pick-results" data-testid="route-end-results">
                    {endMatches.map(p => (
                      <button
                        key={`end-${p.id}`}
                        className="route-pick"
                        data-active={navEndId === p.id}
                        onClick={() => {
                          setNavEndId(p.id);
                          setNavEndQuery(p.label);
                        }}
                        data-testid={`button-route-end-${p.id}`}
                      >
                        <span>{p.label}</span>
                        <small>{p.group}</small>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <details className="route-advanced">
                <summary>בחירה מרשימה מלאה</summary>
              <label>
                <span>נקודת מוצא</span>
                <select
                  value={navStartId}
                  onChange={e => setNavStartId(e.target.value)}
                  data-testid="select-route-start"
                >
                  <option value="">בחר נקודת מוצא…</option>
                  {['נקודות עניין אישיות', 'יישובים בלבנון', 'יישובי ייחוס בישראל', 'רכסים, הרים, נחלים ונהרות', 'נקודות יוניפי״ל ציבוריות', 'אירועים מדווחים'].map(group => (
                    <optgroup key={group} label={group}>
                      {navPoints.filter(p => p.group === group).map(p => (
                        <option key={p.id} value={p.id}>{p.label}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </label>
              <label>
                <span>יעד</span>
                <select
                  value={navEndId}
                  onChange={e => setNavEndId(e.target.value)}
                  data-testid="select-route-end"
                >
                  <option value="">בחר יעד…</option>
                  {['נקודות עניין אישיות', 'יישובים בלבנון', 'יישובי ייחוס בישראל', 'רכסים, הרים, נחלים ונהרות', 'נקודות יוניפי״ל ציבוריות', 'אירועים מדווחים'].map(group => (
                    <optgroup key={group} label={group}>
                      {navPoints.filter(p => p.group === group).map(p => (
                        <option key={p.id} value={p.id}>{p.label}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </label>
              </details>
              <div className="route-actions">
                <button
                  className="btn"
                  disabled={!navStart || !navEnd || navStart.id === navEnd.id}
                  onClick={() => {
                    if (!navigationRoute) return;
                    setFocusTarget({
                      lat: (navigationRoute.start.lat + navigationRoute.end.lat) / 2,
                      lon: (navigationRoute.start.lon + navigationRoute.end.lon) / 2,
                      zoom: 11,
                      id: `route-${Date.now()}`,
                    });
                    showToast('המפה מוקדה למסלול הכבישים');
                  }}
                  data-testid="button-route-focus"
                >
                  הצג מסלול כבישים
                </button>
                <button
                  className="btn"
                  onClick={toggleLiveLocation}
                  aria-pressed={locationStatus === 'watching'}
                  data-testid="button-live-location"
                >
                  {locationStatus === 'watching' ? 'כבה מיקום חי' : 'הצג מיקום מכשיר'}
                </button>
                {/* ---- Nav scale selector ---- */}
                <div className="nav-scale-row" data-testid="nav-scale-selector">
                  <span className="nav-scale-label">זום ניווט:</span>
                  {NAV_SCALES.map(s => (
                    <button
                      key={s.label}
                      className={`btn nav-scale-btn${navScaleLabel === s.label ? ' active' : ''}`}
                      onClick={() => {
                        setNavScaleLabel(s.label);
                        showToast(`זום ניווט: ${s.label}`);
                      }}
                      title={`סולם ${s.label} — תקריב zoom ${s.zoom}`}
                      data-testid={`button-nav-scale-${s.label.replace(':', '-')}`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                <button
                  className="btn ghost"
                  onClick={() => {
                    setNavStartId('');
                    setNavEndId('');
                    setNavStartQuery('');
                    setNavEndQuery('');
                    setNavCustomStart(null);
                    setNavCustomEnd(null);
                    setRoadRoute(null);
                    setAlternativeRoute(null);
                    setActiveRouteIndex(0);
                    setActiveSavedRoute(null);
                    setRouteStatus('idle');
                    setFootRoute(null);
                    setFootRouteStatus('idle');
                    setActiveRouteId('drive');
                    showToast('בחירת המסלול אופסה');
                  }}
                  data-testid="button-route-clear"
                >
                  איפוס
                </button>
              </div>
              {/* ── Route display mode toggle ── */}
              {(navStart && navEnd && navStart.id !== navEnd.id) && (
                <div className="route-display-mode-row" data-testid="route-display-mode-row">
                  <span className="nav-scale-label">תצוגה:</span>
                  {(['road', 'aerial', 'both'] as RouteDisplayMode[]).map(mode => {
                    const labels: Record<RouteDisplayMode, string> = {
                      road: '🛣 כביש',
                      aerial: '✈ אווירי',
                      both: '⊕ שניהם',
                    };
                    return (
                      <button
                        key={mode}
                        className={`btn nav-scale-btn${routeDisplayMode === mode ? ' active' : ''}`}
                        onClick={() => setRouteDisplayMode(mode)}
                        data-testid={`button-display-mode-${mode}`}
                      >
                        {labels[mode]}
                      </button>
                    );
                  })}
                </div>
              )}
              {/* ── Route option cards ── */}
              {routeOptions.length > 0 ? (
                <div className="route-options-list" data-testid="route-options-list">
                  {routeOptions.map(opt => (
                    <div
                      key={opt.id}
                      className={`route-option-card${activeRouteId === opt.id ? ' active' : ''}`}
                      style={{ '--route-color': opt.color } as React.CSSProperties}
                      onClick={() => setActiveRouteId(opt.id)}
                      data-testid={`route-option-card-${opt.id}`}
                      role="button"
                      aria-pressed={activeRouteId === opt.id}
                    >
                      <div className="route-option-header">
                        <span className="route-option-name">{opt.labelHe}</span>
                        {opt.status === 'loading' && (
                          <span className="route-option-badge loading">מחשב…</span>
                        )}
                        {opt.status === 'error' && (
                          <span className="route-option-badge error">שגיאה</span>
                        )}
                      </div>
                      <div className="route-option-km">
                        <strong>{fmtKm(opt.km)}</strong>
                        {opt.durationMin != null && (
                          <span> · {Math.round(opt.durationMin)} דק׳</span>
                        )}
                      </div>
                      <div className="route-option-tags">
                        <span className="route-option-tag passability">{opt.passabilityHe}</span>
                        <span className="route-option-tag airspace">{opt.airspaceHe}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="route-summary" data-testid="text-route-summary">
                  <span>בחר שתי נקודות שונות כדי להציג מסלולים אפשריים.</span>
                </div>
              )}
              {/* ---- נווט עכשיו — כפתור השקת אפליקציית ניווט חיצונית ---- */}
              {navEnd && (
                <div className="launch-nav-box" data-testid="launch-nav-box">
                  <button
                    className="btn launch-nav-btn"
                    onClick={() => openExternalNav(
                      navEnd.lat, navEnd.lon, navEnd.label,
                      navStart?.lat ?? liveLocation?.lat,
                      navStart?.lon ?? liveLocation?.lon,
                    )}
                    data-testid="button-launch-external-nav"
                  >
                    ▶ נווט עכשיו — פתח Waze / Google Maps
                  </button>
                  <p className="legend-note launch-nav-note">
                    {liveLocation
                      ? `מנווט ממיקומך (${liveLocation.lat.toFixed(4)}, ${liveLocation.lon.toFixed(4)}) אל ${navEnd.label}`
                      : navStart
                        ? `מנווט מ${navStart.label} אל ${navEnd.label}`
                        : `ינווט מהמיקום הנוכחי לפי אפליקציית הניווט אל ${navEnd.label}`
                    }
                  </p>
                </div>
              )}
              {locationStatus !== 'idle' && (
                <div className="route-summary compact" data-testid="text-location-status">
                  {locationStatus === 'watching' && liveLocation && (
                    <span>מיקום חי פעיל · המפה עוקבת אחרי הסמן בזום קרוב · אחרי גרירה יופיע כפתור “מרכז אותי” · דיוק משוער: {Math.round(liveLocation.accuracy ?? 0)} מ׳</span>
                  )}
                  {locationStatus === 'watching' && !liveLocation && <span>ממתין להרשאת מיקום מהמכשיר…</span>}
                  {locationStatus === 'error' && <span>לא ניתן לקרוא את מיקום המכשיר. בדוק הרשאות דפדפן.</span>}
                  {locationStatus === 'unsupported' && <span>הדפדפן אינו תומך במיקום חי.</span>}
                </div>
              )}
              <div className="voice-guidance-box" data-testid="voice-guidance-box">
                <div className="voice-guidance-head">
                  <strong>הנחיות קוליות</strong>
                  <span data-testid="text-voice-status">
                    {voiceStatus === 'speaking' ? 'משמיע כעת' : voiceStatus === 'unsupported' ? 'לא נתמך בדפדפן' : 'מוכן'}
                  </span>
                </div>
                <div className="voice-language-grid" role="group" aria-label="בחירת שפת הנחיות קוליות">
                  {([
                    ['he', 'עברית', 'בדיקה והנחיות בעברית.'],
                    ['en', 'English', 'Test and guidance in English.'],
                  ] as const).map(([lang, label, desc]) => (
                    <button
                      key={lang}
                      className="voice-language-btn"
                      onClick={() => {
                        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                        setVoiceLanguage(lang);
                        setVoiceStatus('idle');
                      }}
                      aria-pressed={voiceLanguage === lang}
                      data-testid={`button-voice-lang-${lang}`}
                    >
                      <span>{label}</span>
                      <small>{desc}</small>
                    </button>
                  ))}
                </div>
                <div className="voice-mode-grid" role="group" aria-label="בחירת מצב הנחיות קוליות">
                  {([
                    ['off', 'ללא קול', 'לא יושמעו הנחיות.'],
                    ['basic', 'בסיסיות', 'הכרזת מסלול ועדכוני מרחק מעטים.'],
                    ['detailed', 'מפורטות', 'מסלול, זמן, מרחק, כיוון ודיוק מיקום.'],
                  ] as const).map(([mode, label, desc]) => (
                    <button
                      key={mode}
                      className="voice-mode-btn"
                      onClick={() => setVoiceMode(mode)}
                      aria-pressed={voiceGuidance === mode}
                      data-testid={`button-voice-${mode}`}
                    >
                      <span>{label}</span>
                      <small>{desc}</small>
                    </button>
                  ))}
                </div>
                <div className="route-actions">
                  <button
                    className="btn ghost"
                    disabled={voiceGuidance === 'off'}
                    onClick={testVoiceGuidance}
                    data-testid="button-voice-test"
                  >
                    בדיקת קול
                  </button>
                </div>
                <div className="turn-instruction-card" data-testid="turn-instruction-card">
                  <span>הוראת פנייה במסלול</span>
                  <strong data-testid="text-turn-instruction">
                    {currentTurnInstruction?.text ?? 'בחר מסלול כדי לקבל הוראת פנייה.'}
                  </strong>
                  <small>
                    {currentTurnInstruction
                      ? currentTurnInstruction.confidence === 'route'
                        ? 'מבוסס על הוראות OSRM כאשר זמינות, או על מסלול מיובא/שמור.'
                        : 'אומדן לפי קו מוצא ויעד בלבד, ללא פירוט פניות כביש.'
                      : 'ההוראה תתעדכן כאשר ייבחר מסלול פעיל.'}
                  </small>
                </div>
                <p className="legend-note">
                  ההנחיות מושמעות מקומית דרך הדפדפן. ניתן לבחור עברית או אנגלית; אם למכשיר אין קול עברי מותקן, הדפדפן עדיין יקבל טקסט עברי אך איכות ההשמעה תלויה במנוע הדיבור של המכשיר. במסלול OSRM ההוראות מבוססות על צעדי המסלול שהשירות מחזיר; במסלול מיובא או מוקלט ייתכן אומדן לפי נקודות המסלול בלבד. אין שליחת קול או מיקום לשרת.
                </p>
              </div>
              <div className="save-route-box">
                <input
                  className="search"
                  value={routeName}
                  onChange={e => setRouteName(e.target.value)}
                  placeholder="שם למסלול לשמירה…"
                  data-testid="input-route-name"
                />
                <div className="route-actions">
                  <button className="btn" disabled={!navigationRoute} onClick={saveCurrentRoute} data-testid="button-save-route">
                    שמור מסלול
                  </button>
                  <button
                    className="btn ghost"
                    disabled={!navigationRoute}
                    onClick={() => navigationRoute && downloadJson('south-lebanon-route.json', {
                      id: `route-${Date.now()}`,
                      name: safeText(routeName, `${navigationRoute.start.label} ← ${navigationRoute.end.label}`) || `${navigationRoute.start.label} ← ${navigationRoute.end.label}`,
                      createdAt: new Date().toISOString(),
                      startId: navStartId || undefined,
                      endId: navEndId || undefined,
                      ...navigationRoute,
                    })}
                    data-testid="button-export-route"
                  >
                    ייצוא קובץ מסלול
                  </button>
                </div>
              </div>
              <div className="route-actions">
                <label className="file-import">
                  ייבוא קובץ מסלול
                  <input
                    type="file"
                    accept="application/json,.json"
                    onChange={e => {
                      importRoutes(e.target.files?.[0]).catch(() => setRouteStatus('error'));
                      e.currentTarget.value = '';
                    }}
                    data-testid="input-import-route"
                  />
                </label>
                <button
                  className="btn ghost"
                  disabled={savedRoutes.length === 0}
                  onClick={() => downloadJson('south-lebanon-routes-library.json', savedRoutes)}
                  data-testid="button-export-all-routes"
                >
                  ייצוא כל המסלולים
                </button>
              </div>
              {savedRoutes.length > 0 && (
                <div className="saved-routes" data-testid="saved-routes">
                  {savedRoutes.map(route => (
                    <div className="saved-route" key={route.id}>
                      <button onClick={() => loadSavedRoute(route)} data-testid={`button-load-route-${route.id}`}>
                        <strong>{route.name}</strong>
                        <small>{fmtKm(route.km)}{route.durationMin ? ` · ${Math.round(route.durationMin)} דק׳` : ''}</small>
                      </button>
                      <button
                        className="mini-delete"
                        onClick={() => {
                          setSavedRoutes(prev => prev.filter(r => r.id !== route.id));
                          showToast(`המסלול “${route.name}” נמחק מהרשימה המקומית`);
                        }}
                        data-testid={`button-delete-route-${route.id}`}
                        aria-label={`מחיקת ${route.name}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="legend-note">
                הניתוב מבוסס OpenStreetMap/OSRM ציבורי ואינו כולל תנועה בזמן אמת, חסימות, מחסומים או הערכת בטיחות. ניתן להפעיל מיקום חי גם ללא מסלול; כאשר מיקום חי פעיל, המפה מתמקדת אוטומטית בסמן המכשיר בזום קרוב. אם גוררים את המפה למקום אחר, העקיבה נעצרת זמנית ומופיע כפתור “מרכז אותי” לחזרה לסמן. מצב הניווט נשמר מקומית, ולכן לאחר רענון או חזרה לאפליקציה המסלול חוזר. GPS ברקע תלוי במדיניות הדפדפן והמכשיר.
              </p>
            </div>
          </div>

          <div className="panel-section">
            <h3>הקלטת מסלול נסיעה</h3>
            <div className="recording-box" data-testid="recording-box">
              <div className="route-actions">
                <button
                  className="btn"
                  onClick={recordingStatus === 'recording' ? stopRecording : startRecording}
                  aria-pressed={recordingStatus === 'recording'}
                  data-testid="button-record-route"
                >
                  {recordingStatus === 'recording' ? 'עצור הקלטה' : 'התחל הקלטה'}
                </button>
                <button
                  className="btn ghost"
                  disabled={recordedTrack.length === 0}
                  onClick={() => {
                    setRecordedTrack([]);
                    showToast('ההקלטה המקומית נוקתה');
                  }}
                  data-testid="button-clear-recording"
                >
                  נקה הקלטה
                </button>
              </div>
              <div className="route-summary compact" data-testid="text-recording-status">
                {recordingStatus === 'recording' && <span>הקלטה פעילה · {recordedTrack.length} נקודות · {fmtKm(recordedKm)}</span>}
                {recordingStatus === 'idle' && recordedTrack.length > 0 && <span>הקלטה מוכנה לשמירה · {recordedTrack.length} נקודות · {fmtKm(recordedKm)}</span>}
                {recordingStatus === 'idle' && recordedTrack.length === 0 && <span>לחץ “התחל הקלטה” כדי לשמור מסלול GPS תוך כדי נסיעה.</span>}
                {recordingStatus === 'error' && <span>לא ניתן להקליט מיקום. בדוק הרשאת מיקום בדפדפן.</span>}
                {recordingStatus === 'unsupported' && <span>הדפדפן אינו תומך בהקלטת מיקום.</span>}
              </div>
              <input
                className="search"
                value={recordingName}
                onChange={e => setRecordingName(e.target.value)}
                placeholder="שם להקלטת המסלול…"
                data-testid="input-recording-name"
              />
              <div className="route-actions">
                <button className="btn" disabled={recordedTrack.length < 2} onClick={saveRecording} data-testid="button-save-recording">
                  שמור הקלטה
                </button>
                <button
                  className="btn ghost"
                  disabled={recordedTrack.length < 2}
                  onClick={() => {
                    const route = recordingToRoute();
                    if (route) downloadJson('recorded-route.json', route);
                  }}
                  data-testid="button-export-recording"
                >
                  שתף כקובץ
                </button>
              </div>
              <p className="legend-note">
                ההקלטה נשמרת מקומית בדפדפן תוך כדי עבודה. אם הדפדפן מאפשר GPS ברקע, ההקלטה תמשיך; אם לא, המסלול שנצבר עד כה יישמר וניתן להמשיך אחרי החזרה לאפליקציה.
              </p>
            </div>
          </div>

          <div className="panel-section">
            <h3>בנייה ידנית של מסלול נקודות</h3>
            <div className="recording-box">
              <p className="legend-note">
                לחץ “הפעל מצב בנייה” ואז לחץ על המפה כדי להוסיף נקודות למסלול. לאחר מכן מלא פרטים ושמור.
              </p>
              <div className="route-actions">
                <button
                  className="btn"
                  onClick={() => {
                    setMultiRouteBuildMode(v => !v);
                    if (multiRouteBuildMode) {
                      showToast('מצב בניית מסלול כבה');
                    } else {
                      if (measureMode) { setMeasureMode(false); setManualMeasure([]); }
                      if (addPoiMode) { setAddPoiMode(false); setPoiDraft(null); }
                      showToast('לחץ על המפה כדי להוסיף נקודות למסלול');
                    }
                  }}
                  aria-pressed={multiRouteBuildMode}
                  data-testid="button-multi-route-build-mode"
                >
                  {multiRouteBuildMode ? 'עצור בנייה' : 'הפעל מצב בנייה'}
                </button>
                <button
                  className="btn ghost"
                  disabled={multiRouteDraftPoints.length === 0}
                  onClick={() => {
                    setMultiRouteDraftPoints(prev => prev.slice(0, -1).map((p, i) => ({ ...p, order: i })));
                    showToast('הנקודה האחרונה הוסרה');
                  }}
                  data-testid="button-multi-route-undo"
                >
                  בטל נקודה אחרונה
                </button>
                <button
                  className="btn ghost"
                  disabled={multiRouteDraftPoints.length === 0}
                  onClick={() => {
                    setMultiRouteDraftPoints([]);
                    showToast('טיוטת המסלול נוקתה');
                  }}
                  data-testid="button-multi-route-clear-draft"
                >
                  נקה טיוטה
                </button>
              </div>
              <div className="route-summary compact">
                {multiRouteBuildMode && <span>מצב בנייה פעיל · {multiRouteDraftPoints.length} נקודות · {multiRouteDraftPoints.length >= 2 ? fmtKm(multiRouteTotalKm) : '—'}</span>}
                {!multiRouteBuildMode && multiRouteDraftPoints.length > 0 && <span>טיוטה: {multiRouteDraftPoints.length} נקודות · {multiRouteDraftPoints.length >= 2 ? fmtKm(multiRouteTotalKm) : '—'}</span>}
                {!multiRouteBuildMode && multiRouteDraftPoints.length === 0 && <span>לחץ “הפעל מצב בנייה” ואז הוסף נקודות למפה.</span>}
              </div>
              <input
                className="search"
                value={multiRouteName}
                onChange={e => setMultiRouteName(e.target.value)}
                placeholder="שם המסלול…"
                data-testid="input-multi-route-name"
              />
              <textarea
                className="search poi-textarea"
                value={multiRouteDescription}
                onChange={e => setMultiRouteDescription(e.target.value)}
                placeholder="תיאור המסלול, הערות, נקודות ציון…"
                data-testid="textarea-multi-route-description"
              />
              <div className="poi-style-grid">
                <div className="poi-choice-group">
                  <span>רמת קושי</span>
                  <div className="poi-choice-buttons" role="group" aria-label="רמת קושי">
                    {(Object.entries(DIFFICULTY_LABELS) as [DifficultyLevel, string][]).map(([val, label]) => (
                      <button
                        key={val}
                        type="button"
                        className="poi-choice-btn"
                        aria-pressed={multiRouteDifficulty === val}
                        onClick={() => setMultiRouteDifficulty(val)}
                        data-testid={`button-difficulty-${val}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="poi-choice-group">
                  <span>רמת עבירות</span>
                  <div className="poi-choice-buttons" role="group" aria-label="רמת עבירות">
                    {(Object.entries(PASSABILITY_LABELS) as [PassabilityLevel, string][]).map(([val, label]) => (
                      <button
                        key={val}
                        type="button"
                        className="poi-choice-btn"
                        aria-pressed={multiRoutePassability === val}
                        onClick={() => setMultiRoutePassability(val)}
                        data-testid={`button-passability-${val}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="route-actions">
                <button
                  className="btn"
                  disabled={multiRouteDraftPoints.length < 2}
                  onClick={saveMultiRoute}
                  data-testid="button-save-multi-route"
                >
                  שמור מסלול
                </button>
              </div>
              {savedMultiRoutes.length > 0 && (
                <div className="saved-routes" data-testid="saved-multi-routes">
                  {savedMultiRoutes.map(route => (
                    <div className="saved-route" key={route.id}>
                      <button
                        onClick={() => loadMultiRoute(route)}
                        data-testid={`button-load-multi-route-${route.id}`}
                      >
                        <strong>{route.name}</strong>
                        <small>
                          {route.points.length} נק׳ · {fmtKm(route.totalKm)} · {DIFFICULTY_LABELS[route.difficulty]} · {PASSABILITY_LABELS[route.passability]}
                        </small>
                      </button>
                      <button
                        className="btn ghost"
                        onClick={() => exportMultiRoute(route)}
                        style={{ fontSize: 11, padding: '3px 8px', marginInlineEnd: 4 }}
                        title="ייצוא לקובץ"
                        data-testid={`button-export-multi-route-${route.id}`}
                      >
                        ייצוא
                      </button>
                      <button
                        className="mini-delete"
                        onClick={() => {
                          setSavedMultiRoutes(prev => prev.filter(r => r.id !== route.id));
                          if (activeMultiRoute?.id === route.id) setActiveMultiRoute(null);
                          showToast(`המסלול "${route.name}" נמחק`);
                        }}
                        data-testid={`button-delete-multi-route-${route.id}`}
                        aria-label={`מחיקת ${route.name}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="route-actions" style={{ marginTop: 8 }}>
                <label className="file-import">
                  ייבוא מסלול קובץ
                  <input
                    type="file"
                    accept="application/json,.json"
                    onChange={async e => {
                      const file = e.target.files?.[0];
                      e.currentTarget.value = '';
                      if (!file) return;
                      try {
                        const text = await file.text();
                        const data = JSON.parse(text);
                        const routes = (Array.isArray(data) ? data : [data]).slice(0, 50);
                        const valid = routes.filter((r: any) =>
                          r && Array.isArray(r.points) && r.points.length >= 2 &&
                          r.points.every((p: any) => typeof p.lat === 'number' && typeof p.lon === 'number')
                        ).map((r: any): MultiPointRoute => ({
                          id: safeText(r.id) || `multi-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
                          name: safeText(r.name, 'מסלול מיובא') || 'מסלול מיובא',
                          description: safeText(r.description, ''),
                          difficulty: ['easy','medium','hard','extreme'].includes(r.difficulty) ? r.difficulty : 'medium',
                          passability: ['paved','dirt','offroad','foot_only'].includes(r.passability) ? r.passability : 'dirt',
                          points: r.points.slice(0, MAX_MULTI_ROUTE_POINTS).map((p: any, i: number) => ({
                            lat: p.lat,
                            lon: p.lon,
                            label: safeText(p.label, `נקודה ${i+1}`) || `נקודה ${i+1}`,
                            order: i,
                          })),
                          totalKm: typeof r.totalKm === 'number' ? r.totalKm : 0,
                          createdAt: safeText(r.createdAt, new Date().toISOString()) || new Date().toISOString(),
                        }));
                        if (valid.length) {
                          setSavedMultiRoutes(prev => [...valid, ...prev]);
                          showToast(`${valid.length} מסלולים יובאו`);
                        } else {
                          showToast('לא נמצאו מסלולים תקינים בקובץ');
                        }
                      } catch {
                        showToast('שגיאה בקריאת הקובץ');
                      }
                    }}
                    data-testid="input-import-multi-route"
                  />
                </label>
              </div>
              <p className="legend-note">
                הקובץ המיוצא הוא JSON — ניתן לשתף אותו עם אחרים שישתמשו בייבוא. הקובץ כולל שם, תיאור, רמת קושי, רמת עבירות ורשימת נקודות הגיאוגרפיות.
              </p>
            </div>
          </div>

          <div className="panel-section">
            <h3>נקודות עניין אישיות</h3>
            <div className="poi-box" data-testid="poi-box">
              <div className="route-actions">
                <button
                  className="btn"
                  onClick={() => {
                    setAddPoiMode(v => !v);
                    setPoiDraft(null);
                    if (measureMode) {
                      setMeasureMode(false);
                      setManualMeasure([]);
                    }
                    showToast(addPoiMode ? 'מצב הוספת נקודה כובה' : 'לחץ על המפה כדי לבחור נקודת עניין');
                  }}
                  aria-pressed={addPoiMode}
                  data-testid="button-add-poi-mode"
                >
                  {addPoiMode ? 'בטל בחירת נקודה' : 'הוסף נקודה מהמפה'}
                </button>
                <button
                  className="btn ghost"
                  disabled={!poiDraft}
                  onClick={() => {
                    setPoiDraft(null);
                    showToast('בחירת נקודת העניין נוקתה');
                  }}
                  data-testid="button-clear-poi-draft"
                >
                  נקה בחירה
                </button>
              </div>
              <div className="route-summary compact" data-testid="text-poi-draft">
                {poiDraft ? (
                  <span>נבחרה נקודה: {poiDraft.lat.toFixed(5)}, {poiDraft.lon.toFixed(5)}</span>
                ) : addPoiMode ? (
                  <span>לחץ על המפה כדי לבחור מיקום לנקודת עניין חדשה.</span>
                ) : (
                  <span>אפשר להוסיף נקודת עניין עם שם ותיאור, ואז לשתף אותה כקובץ JSON.</span>
                )}
              </div>
              <input
                className="search"
                value={poiName}
                onChange={e => setPoiName(e.target.value)}
                placeholder="שם נקודת העניין…"
                data-testid="input-poi-name"
              />
              <textarea
                className="search poi-textarea"
                value={poiDescription}
                onChange={e => setPoiDescription(e.target.value)}
                placeholder="מידע קצר על הנקודה…"
                data-testid="textarea-poi-description"
              />
              <div className="poi-style-grid" data-testid="poi-style-controls">
                <div className="poi-choice-group">
                  <span>גודל סמן</span>
                  <div className="poi-choice-buttons" role="group" aria-label="בחירת גודל סמן">
                    {POI_SIZES.map(size => (
                      <button
                        key={size.value}
                        type="button"
                        className="poi-choice-btn"
                        aria-pressed={poiMarkerSize === size.value}
                        onClick={() => setPoiMarkerSize(size.value)}
                        data-testid={`button-poi-size-${size.value}`}
                      >
                        {size.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="poi-choice-group">
                  <span>צורת סמן</span>
                  <div className="poi-choice-buttons" role="group" aria-label="בחירת צורת סמן">
                    {POI_SHAPES.map(shape => (
                      <button
                        key={shape.value}
                        type="button"
                        className="poi-choice-btn"
                        aria-pressed={poiMarkerShape === shape.value}
                        onClick={() => setPoiMarkerShape(shape.value)}
                        data-testid={`button-poi-shape-${shape.value}`}
                      >
                        {shape.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="poi-choice-group">
                  <span>צבע סמן</span>
                  <div className="poi-color-buttons" role="group" aria-label="בחירת צבע סמן">
                    {POI_COLORS.map(color => (
                      <button
                        key={color.value}
                        type="button"
                        className="poi-color-btn"
                        aria-pressed={poiMarkerColor === color.value}
                        onClick={() => setPoiMarkerColor(color.value)}
                        style={{ '--poi-color': color.value } as CSSProperties}
                        data-testid={`button-poi-color-${color.label}`}
                        title={color.label}
                      >
                        <span>{color.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="poi-preview" data-testid="poi-marker-preview" aria-label="תצוגה מקדימה של סמן">
                  <span
                    className={`poi-preview-pin poi-shape-${poiMarkerShape}`}
                    style={{ '--poi-color': poiMarkerColor } as CSSProperties}
                    data-size={poiMarkerSize}
                  >
                    {poiMarkerShape === 'star' ? '★' : ''}
                  </span>
                  <small>תצוגה מקדימה</small>
                </div>
              </div>
              <div className="route-actions">
                <button className="btn" disabled={!poiDraft} onClick={savePoi} data-testid="button-save-poi">
                  שמור נקודה
                </button>
                <button
                  className="btn ghost"
                  disabled={customPois.length === 0}
                  onClick={() => downloadJson('south-lebanon-pois.json', customPois)}
                  data-testid="button-export-pois"
                >
                  שתף נקודות כקובץ
                </button>
                <label className="file-import">
                  ייבוא נקודות
                  <input
                    type="file"
                    accept="application/json,.json"
                    onChange={e => {
                      importPois(e.target.files?.[0]).catch(() => undefined);
                      e.currentTarget.value = '';
                    }}
                    data-testid="input-import-pois"
                  />
                </label>
              </div>
              {customPois.length > 0 && (
                <div className="saved-routes poi-list" data-testid="poi-list">
                  {customPois.map(poi => (
                    <div className="saved-route" key={poi.id}>
                      <button
                        onClick={() => {
                          setFocusTarget({ lat: poi.lat, lon: poi.lon, zoom: 14, id: `focus-${poi.id}-${Date.now()}` });
                          showToast(`המפה מוקדה על “${poi.name}”`);
                        }}
                        data-testid={`button-focus-poi-${poi.id}`}
                      >
                        <strong>{poi.name}</strong>
                        <small>{poi.description || `${poi.lat.toFixed(4)}, ${poi.lon.toFixed(4)}`}</small>
                      </button>
                      <button
                        className="mini-delete"
                        onClick={() => {
                          setCustomPois(prev => prev.filter(p => p.id !== poi.id));
                          showToast(`נקודת העניין “${poi.name}” נמחקה`);
                        }}
                        data-testid={`button-delete-poi-${poi.id}`}
                        aria-label={`מחיקת ${poi.name}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="legend-note">
                נקודות עניין נשמרות בזיכרון הפעיל של המכשיר בלבד. אין מסד נתונים משותף, ולכן אין דלף מידע בין משתמשים; שיתוף מתבצע רק דרך קובץ שהמשתמש בוחר לייצא.
              </p>
            </div>
          </div>

          <div className="panel-section">
            <h3>טווח שנים</h3>
            <div className="year-range" data-testid="filter-year-range">
              <label>
                <span>משנה</span>
                <select
                  value={yearFrom}
                  onChange={e => setYearFrom(Math.min(+e.target.value, yearTo))}
                  data-testid="select-year-from"
                >
                  {years.map(year => <option key={`from-${year}`} value={year}>{year}</option>)}
                </select>
              </label>
              <label>
                <span>עד שנה</span>
                <select
                  value={yearTo}
                  onChange={e => setYearTo(Math.max(+e.target.value, yearFrom))}
                  data-testid="select-year-to"
                >
                  {years.map(year => <option key={`to-${year}`} value={year}>{year}</option>)}
                </select>
              </label>
            </div>
            <p className="year-summary" data-testid="text-year-summary">
              מוצגים אירועים מהשנים <bdi>{yearFrom}</bdi>–<bdi>{yearTo}</bdi>
            </p>
          </div>

          <div className="panel-section">
            <h3>סוגי אירועים</h3>
            <div className="chips" data-testid="chips-type">
              {TYPES.map(t => (
                <button
                  key={t}
                  className="chip"
                  aria-pressed={typeFilter.has(t)}
                  onClick={() => setTypeFilter(s => toggleSet(s, t))}
                  data-testid={`chip-type-${t}`}
                  style={typeFilter.has(t) ? { background: TYPE_COLOR[t], borderColor: TYPE_COLOR[t], color: '#0b0d10' } : {}}
                >
                  {TYPE_LABEL[t]}
                </button>
              ))}
            </div>
          </div>

          <div className="panel-section">
            <h3>חומרה</h3>
            <div className="chips" data-testid="chips-severity">
              {SEVS.map(s => (
                <button
                  key={s}
                  className="chip"
                  aria-pressed={sevFilter.has(s)}
                  onClick={() => setSevFilter(set => toggleSet(set, s))}
                  data-testid={`chip-sev-${s}`}
                >
                  {SEV_LABEL[s]}
                </button>
              ))}
            </div>
          </div>

          <div className="panel-section">
            <h3>חיפוש חופשי</h3>
            <input
              className="search"
              placeholder="חיפוש יישוב, אירוע, יוניפי״ל, מקור או אזור…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              data-testid="input-search"
            />
            {searchResults.length > 0 && (
              <div className="search-results" data-testid="search-results">
                {searchResults.map(result => (
                  <button
                    key={result.id}
                    className="search-result"
                    onClick={() => {
                      setFocusTarget({ lat: result.lat, lon: result.lon, zoom: result.zoom, id: `${result.id}-${Date.now()}` });
                      if ('incidentId' in result && typeof result.incidentId === 'string') setSelectedId(result.incidentId);
                    }}
                    data-testid={`button-search-result-${result.id}`}
                  >
                    <span>{result.title}</span>
                    <small>{result.subtitle}</small>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="panel-section">
            <h3>נראות שמות במפה</h3>
            <div
              className="toggle-row"
              data-active={allLabels}
              onClick={() => {
                setAllLabels(v => !v);
                setVisible(v => ({ ...v, cityLabels: true, settlementLabels: true, ridgeLabels: true, waterLabels: true }));
              }}
              role="switch"
              aria-checked={allLabels}
              data-testid="toggle-all-labels"
            >
              <div className="toggle-label">
                <span className="toggle-swatch label-swatch">כ</span>
                הצג את כל השמות תמיד
              </div>
              <span className="toggle-switch" />
            </div>
            <div
              className="toggle-row"
              data-active={largeLabels}
              onClick={() => setLargeLabels(v => !v)}
              role="switch"
              aria-checked={largeLabels}
              data-testid="toggle-large-labels"
            >
              <div className="toggle-label">
                <span className="toggle-swatch label-swatch">א</span>
                טקסט גדול לשמות יישובים ונקודות
              </div>
              <span className="toggle-switch" />
            </div>
              <p className="legend-note">
                “כל השמות” מציג את כל שמות המקומות והכפרים בלי להגדיל טקסט. “טקסט גדול” מגדיל את התוויות ומוסיף תעתיק באנגלית.
              </p>
          </div>
        </div>
      </aside>

      {/* ============ Map ============ */}
      <div className="map-wrap">
        <MapView
          initialCenter={initialMapViewRef.current ?? undefined}
          visible={visible}
          filteredIncidents={filtered}
          selectedIncident={selected}
          onSelectIncident={(id) => setSelectedId(id)}
          measureMode={measureMode}
          pointPickMode={addPoiMode || measureMode || multiRouteBuildMode}
          manualMeasure={manualMeasure}
          onMapClick={onMapClick}
          distanceLine={selected ? distanceLine : null}
          theme={effectiveTheme}
          largeLabels={largeLabels}
          allLabels={allLabels}
          focusTarget={focusTarget}
          ref={mapViewRef}
          navigationRoute={navigationRoute}
          routeOverlays={routeOverlaysMemo}
          routeDisplayMode={routeDisplayMode}
          liveLocation={liveLocation}
          liveCenterRequestId={liveCenterRequestId}
          onLiveFollowDetachedChange={handleLiveFollowDetachedChange}
          onMapViewChange={handleMapViewChange}
          recordedTrack={recordedTrack}
          compassMode={compassMode}
          mapBearing={mapBearing}
          userRotation={userMapRotation}
          onUserRotationChange={handleUserRotationChange}
          rotationLocked={rotationLocked}
          poiDraft={poiDraft}
          poiDraftStyle={{
            markerColor: poiMarkerColor,
            markerShape: poiMarkerShape,
            markerSize: poiMarkerSize,
          }}
          customPois={customPois}
          multiRouteDraft={multiRouteDraftPoints}
          activeMultiRoute={activeMultiRoute ? { points: activeMultiRoute.points, name: activeMultiRoute.name } : null}
          navFollowZoom={navFollowZoom}
          onNavigateToPoint={navigateFromCurrentPosition}
        />
      </div>

      {/* ============ Map overlay buttons (outside map-wrap to avoid stacking-context conflict with header) ============ */}
      <div className="map-overlays">
        <button
          className="compass-button"
          onClick={() => setCompassMode(v => !v)}
          aria-pressed={compassMode}
          data-testid="button-compass"
          title={compassMode ? 'חזרה לצפון למעלה' : 'סובב לפי כיוון הנסיעה'}
        >
          <span
            className="compass-needle"
            style={{ transform: `rotate(${mapBearing + userMapRotation}deg)` }}
          >▲</span>
          <span>{compassMode ? 'כיוון נסיעה' : 'צפון'}</span>
          <small>אזימוט {Math.round(mapBearing)}°</small>
        </button>
        {userMapRotation !== 0 && (
          <button
            className="compass-button reset-north-btn"
            onClick={resetMapRotation}
            data-testid="button-reset-north"
            title={`הצפן מחדש (סבב ${Math.round(userMapRotation)}°)`}
          >
            <span
              className="compass-needle"
              style={{ transform: `rotate(${userMapRotation}deg)`, color: 'var(--accent-warm, #f6c453)' }}
            >▲</span>
            <span>הצפן</span>
            <small>{Math.round(userMapRotation)}° מסובב</small>
          </button>
        )}
        {/* Rotation lock button + snap picker */}
        <button
          className={`rotation-lock-btn${rotationLocked ? ' active' : ''}`}
          onClick={toggleRotationLock}
          aria-pressed={rotationLocked}
          data-testid="button-rotation-lock"
          title={rotationLocked ? 'בטל נעילת סיבוב' : 'נעל סיבוב — סיבוב חופשי באצבעות מבוטל'}
        >
          <span className="lock-icon">{rotationLocked ? '🔒' : '🔓'}</span>
          <span>{rotationLocked ? 'נעול' : 'חופשי'}</span>
          <small>סיבוב</small>
        </button>
        {snapPickerOpen && (
          <div className="snap-rotation-picker" data-testid="snap-rotation-picker">
            <div className="snap-picker-title">בחר זוית סיבוב</div>
            <div className="snap-picker-grid">
              {SNAP_ANGLES.map(deg => (
                <button
                  key={deg}
                  className={`snap-angle-btn${userMapRotation === deg ? ' selected' : ''}`}
                  onClick={() => handleSnapRotation(deg)}
                  title={`סבב ${deg}°`}
                >
                  <span style={{ display: 'inline-block', transform: `rotate(${deg}deg)` }}>↑</span>
                  <span>{SNAP_LABELS[deg]}</span>
                </button>
              ))}
            </div>
            <button className="snap-picker-close" onClick={() => setSnapPickerOpen(false)}>סגור</button>
          </div>
        )}
        <button
          className="map-menu-fab"
          onClick={handlePanelToggle}
          aria-pressed={panelsCollapsed}
          data-testid="button-map-toggle-menu"
        >
          {panelsCollapsed ? 'פתח תפריט' : 'סגור תפריט'}
        </button>
        {panelsCollapsed && (
          <button
            className="mini-map-fab"
            onClick={() => openMiniWindow().catch(() => setMiniOverlayOpen(true))}
            data-testid="button-map-mini-window"
          >
            חלון מוקטן
          </button>
        )}
        {liveLocation && liveFollowDetached && (
          <button
            className={`center-live-fab ${panelsCollapsed ? 'below-mini' : ''}`}
            onClick={centerLiveLocation}
            data-testid="button-center-live"
            title="מרכז את המפה חזרה למיקום המכשיר"
          >
            מרכז אותי
            <small>חזרה לסמן</small>
          </button>
        )}
        {measureMode && (
          <div className="measure-hud" data-testid="hud-measure">
            <div className="row"><span>מצב מדידה ידנית</span></div>
            <div className="row">
              <span>נקודות שנבחרו</span>
              <span className="km">{manualMeasure.length} / 2</span>
            </div>
            {manualKm !== null && (
              <div className="row">
                <span>מרחק (Haversine)</span>
                <span className="km" data-testid="text-manual-distance">{fmtKm(manualKm)}</span>
              </div>
            )}
            <div className="hint">לחיצה ראשונה — נקודה א׳, שנייה — נקודה ב׳. לחיצה שלישית מאפסת.</div>
          </div>
        )}
      </div>

      {toastMessage && (
        <div className="app-toast" role="status" aria-live="polite" data-testid="toast-message">
          {toastMessage}
        </div>
      )}

      {miniOverlayOpen && (
        <div className="mini-overlay" data-testid="mini-overlay" role="dialog" aria-live="polite" aria-label="חלון מוקטן למצב ניווט">
          <div className="mini-overlay-head">
            <strong>חלון מוקטן — מצב ניווט</strong>
            <button
              className="mini-close"
              onClick={() => setMiniOverlayOpen(false)}
              data-testid="button-close-mini-overlay"
              aria-label="סגירת חלון מוקטן"
            >
              ×
            </button>
          </div>
          <div className="mini-route" data-testid="text-mini-route">
            {navigationRoute ? `${navigationRoute.start.label} ← ${navigationRoute.end.label}` : 'אין מסלול פעיל'}
          </div>
          <div
            className="mini-nav-panel"
            data-testid="mini-nav-map"
            aria-label="מפת מיני ניווט"
            dangerouslySetInnerHTML={{ __html: miniNavSvgMarkup() }}
          />
          <div className="mini-turn" data-testid="mini-turn-instruction">
            <small>הוראת פנייה במסלול</small>
            <b>{currentTurnInstruction?.text ?? 'אין הוראת פנייה זמינה'}</b>
          </div>
          <div className="mini-grid">
            <span>
              <small>מרחק</small>
              <b>{navigationRoute ? fmtKm(navigationRoute.km) : '—'}</b>
            </span>
            <span>
              <small>זמן</small>
              <b>{navigationRoute?.durationMin ? `${Math.round(navigationRoute.durationMin)} דק׳` : '—'}</b>
            </span>
            <span>
              <small>מיקום חי</small>
              <b>{liveLocation ? `${liveLocation.lat.toFixed(5)}, ${liveLocation.lon.toFixed(5)}` : 'לא פעיל'}</b>
            </span>
            <span>
              <small>הקלטה</small>
              <b>{recordedTrack.length ? `${recordedTrack.length} נק׳ · ${fmtKm(recordedKm)}` : 'לא פעילה'}</b>
            </span>
          </div>
          <p>
            {miniStatus === 'mobile'
              ? 'בנייד מוצג מיני־ניווט פנימי כדי למנוע פתיחת חלון חיצוני שעלולה להעביר את הדפדפן לרקע או לסגור את התצוגה.'
              : miniStatus === 'fallback'
              ? 'Picture-in-Picture או Popup נחסמו, לכן מוצג חלון צף בתוך האפליקציה.'
              : 'החלון המוקטן מציג תמונת מצב של הניווט וההקלטה.'}
            {' '}דפדפן ווב אינו יכול להבטיח z-order מעל כל האפליקציות בכל מכשיר.
          </p>
        </div>
      )}

      {/* ============ Right panel: analytics + selected ============ */}
      <aside className="panel right" data-testid="panel-analytics">
        <div className="panel-scroll">
          <div className="panel-section">
            <h3>סיכום אנליטי</h3>
            <div className="kpi-grid">
              <div className="kpi">
                <div className="kpi-label">אירועים מסוננים</div>
                <div className="kpi-value" data-testid="kpi-total">{stats.total}</div>
                <div className="kpi-sub">מתוך {incidents.length} בסה״כ</div>
              </div>
              <div className="kpi">
                <div className="kpi-label">מרחק ממוצע לקו הכחול</div>
                <div className="kpi-value" data-testid="kpi-avg">{isFinite(stats.avg) ? stats.avg.toFixed(1) : '—'}</div>
                <div className="kpi-sub">ק״מ · ממוצע</div>
              </div>
              <div className="kpi">
                <div className="kpi-label">מינ׳ מרחק</div>
                <div className="kpi-value">{isFinite(stats.min) ? stats.min.toFixed(2) : '—'}</div>
                <div className="kpi-sub">ק״מ</div>
              </div>
              <div className="kpi">
                <div className="kpi-label">מקס׳ מרחק</div>
                <div className="kpi-value">{isFinite(stats.max) ? stats.max.toFixed(1) : '—'}</div>
                <div className="kpi-sub">ק״מ</div>
              </div>
            </div>
          </div>

          <div className="panel-section">
            <h3>פילוח לפי סוג אירוע</h3>
            {stats.byType.map(({ type, n }) => {
              const max = Math.max(1, ...stats.byType.map(x => x.n));
              return (
                <div className="bar-row" key={type}>
                  <span className="count">{n}</span>
                  <span className="bar" aria-hidden="true"><div style={{ width: `${(n / max) * 100}%`, background: TYPE_COLOR[type] }} /></span>
                  <span className="label">{TYPE_LABEL[type]}</span>
                </div>
              );
            })}
          </div>

          <div className="panel-section">
            <h3>
              <span>{selected ? 'אירוע נבחר' : 'רשימת אירועים'}</span>
              <span style={{ color: 'var(--text-faint)', fontSize: 10, textTransform: 'none', letterSpacing: 0 }}>
                {filtered.length} אירועים מתאימים
              </span>
            </h3>
            {selected ? (
              <div className="incident-card" data-selected="true" data-testid={`detail-${selected.id}`}>
                <div className="incident-head">
                  <span className={`sev ${selected.severity}`} />
                  <span className="incident-date">{fmtDate(selected.date)}</span>
                </div>
                <p className="incident-title">{selected.title_he}</p>
                <p style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--text-muted)', margin: '8px 0' }}>
                  {selected.desc_he}
                </p>
                <div className="incident-meta">
                  <span className="tag type" style={{ color: TYPE_COLOR[selected.type], borderColor: TYPE_COLOR[selected.type] }}>{TYPE_LABEL[selected.type]}</span>
                  <span className="tag">חומרה: {SEV_LABEL[selected.severity]}</span>
                  {selected.approx && <span className="tag approx">מיקום מקורב</span>}
                </div>
                <div style={{ marginTop: 10, fontSize: 12 }}>
                  <div style={{ color: 'var(--text-muted)' }}>מרחק מקו הכחול</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--accent-hi)', fontSize: 16, marginTop: 2 }} data-testid="text-distance-blue">
                    {fmtKm(distanceById.get(selected.id)?.km ?? distanceToPolyline([selected.lat, selected.lon], blueLine).km)}
                  </div>
                </div>
                <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <a className="btn" href={selected.source_url} target="_blank" rel="noopener" data-testid="link-source">
                    מקור: {selected.source_label} ↗
                  </a>
                  <button className="btn ghost" onClick={() => setSelectedId(null)} data-testid="button-clear-selection">
                    ניקוי בחירה
                  </button>
                </div>
              </div>
            ) : (
              filtered.slice(0, 60).map(i => (
                <div
                  key={i.id}
                  className="incident-card"
                  onClick={() => setSelectedId(i.id)}
                  data-testid={`card-incident-${i.id}`}
                >
                  <div className="incident-head">
                    <span className={`sev ${i.severity}`} />
                    <span className="incident-date">{fmtDate(i.date)}</span>
                  </div>
                  <p className="incident-title">{i.title_he}</p>
                  <div className="incident-meta">
                    <span className="tag type" style={{ color: TYPE_COLOR[i.type] }}>{TYPE_LABEL[i.type]}</span>
                    {i.approx && <span className="tag approx">מקורב</span>}
                  </div>
                </div>
              ))
            )}
            {!selected && filtered.length === 0 && (
              <p style={{ color: 'var(--text-faint)', fontSize: 12 }}>אין אירועים תואמים את הסינון.</p>
            )}
          </div>
        </div>
      </aside>

      {/* ============ Footer ============ */}
      <div className="footer">
        <span className="disclaimer-pill">הצהרה</span>
        <span>
          הדמיה חינוכית בלבד ממקורות פתוחים. המיקומים מקורבים. אין במידע המוצג נתוני מודיעין מבצעי, מטרות, מצבורים או נקודות שיגור.
        </span>
      </div>

      {/* ============ Drawer: sources & about ============ */}
      {drawerOpen && (
        <div className="drawer" onClick={() => setDrawerOpen(false)} role="dialog" aria-modal="true">
          <div className="drawer-panel" onClick={e => e.stopPropagation()} data-testid="drawer-sources">
            <div className="drawer-head">
              <h2>על אודות ומקורות</h2>
              <button className="btn ghost" onClick={() => setDrawerOpen(false)} data-testid="button-close-drawer">סגירה</button>
            </div>
            <div className="drawer-body">
              <h4>על אודות</h4>
              <p>
                מפה אינטראקטיבית לחקר המרחב הדרום־לבנוני, מהקו הכחול בדרום ועד נהר הליטני בצפון —
                האזור המוגדר בהחלטת מועצת הביטחון 1701 כאזור פעולת יוניפי״ל וצבא לבנון בלבד.
                האפליקציה נועדה להמחיש את האתגרים הלוגיסטיים והביטחוניים של רעיון אזור החיץ:
                צפיפות יישובים אזרחיים, פריסת כוחות בינלאומיים, אזורי השפעה היסטוריים של חזבאללה,
                פיזור אירועים ביטחוניים בשנים האחרונות, וכלי עזר מקומיים לניווט, מדידה, הקלטה,
                חלון מיני, הנחיות קוליות והוראות פנייה לפי המסלול. כל הנתונים נשאבים מדיווח פומבי בלבד
                (תקשורת, מסמכי או״ם, מאגרים אקדמיים), המיקומים מקורבים, וההדמיה אינה מהווה
                מודיעין מבצעי או נתוני מטרות.
              </p>
              <p>
                נבנה כחלק מפורטפוליו הפרויקטים של יוצר האפליקציה:
                {' '}
                <a
                  href="https://portfolio-dusky-eight-77.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="link-portfolio-about"
                >
                  portfolio-dusky-eight-77.vercel.app
                </a>
              </p>

              <h4>או״ם וגופים בינלאומיים</h4>
              {sources.filter(s => s.category === 'un').map(s => (
                <a key={s.url} href={s.url} target="_blank" rel="noopener" data-testid={`source-${s.url}`}>{s.title_he} ↗</a>
              ))}

              <h4>תקשורת</h4>
              {sources.filter(s => s.category === 'media').map(s => (
                <a key={s.url} href={s.url} target="_blank" rel="noopener">{s.title_he} ↗</a>
              ))}

              <h4>בסיסי נתונים אקדמיים / מחקריים</h4>
              {sources.filter(s => s.category === 'data').map(s => (
                <a key={s.url} href={s.url} target="_blank" rel="noopener">{s.title_he} ↗</a>
              ))}

              <h4>מפות בסיס</h4>
              {sources.filter(s => s.category === 'osm').map(s => (
                <a key={s.url} href={s.url} target="_blank" rel="noopener">{s.title_he} ↗</a>
              ))}

              <h4>הצהרת שימוש</h4>
              <p>
                ההדמיה היא חינוכית בלבד. המיקומים מוצגים מקורבים. שכבת חזבאללה היא איכותית
                ומבוססת דיווחים פתוחים בלבד — אין במידע נתוני מטרות, מבני נשק, מנהרות, מצבורים
                או נקודות שיגור. המידע אינו מהווה מודיעין, אינו תחליף לגורם רשמי, ואין לעשות בו
                שימוש מבצעי. הדמיית הקו הכחול וקו הליטני מקורבת לצורכי ויזואליזציה ואינה גבול
                סקור גיאודטית.
              </p>
            </div>
          </div>
        </div>
      )}

      {supportOpen && (
        <div className="drawer" onClick={() => setSupportOpen(false)} role="dialog" aria-modal="true">
          <div className="drawer-panel support-panel" onClick={e => e.stopPropagation()} data-testid="drawer-support">
            <div className="drawer-head">
              <h2>תמיכה בהמשך הפיתוח</h2>
              <button className="btn ghost" onClick={() => setSupportOpen(false)} data-testid="button-close-support">סגירה</button>
            </div>
            <div className="drawer-body">
              <div className="support-card">
                <h4>למה לתמוך?</h4>
                <p>
                  התמיכה מסייעת להמשיך לפתח את האפליקציה: שיפור שכבות המפה, הוספת יכולות ניווט, בדיקות אבטחה, תיעוד בעברית, ותחזוקת הפריסה.
                </p>
                <div className="support-actions">
                  <button className="btn primary" onClick={openDonationLink} data-testid="button-open-donation">
                    תרומה ב־Bit
                  </button>
                  <button className="btn ghost" onClick={() => copyDonationLink().catch(() => undefined)} data-testid="button-copy-donation">
                    {donationCopied ? 'הקישור הועתק' : 'העתק קישור Bit'}
                  </button>
                  <button
                    className="btn"
                    onClick={() => shareCurrentApp().catch(() => undefined)}
                    data-testid="button-share-app"
                  >
                    שתף את האפליקציה
                  </button>
                  <a
                    className="btn ghost"
                    href="https://portfolio-dusky-eight-77.vercel.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="link-support-portfolio"
                  >
                    מעבר לפורטפוליו
                  </a>
                </div>
                <a
                  className="copyable-link"
                  href={DONATION_CONTACT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="link-donate-contact"
                >
                  {DONATION_CONTACT_URL}
                </a>
                <p className="legend-note">
                  התרומה מתבצעת דרך Bit בקישור חיצוני מאובטח. האפליקציה אינה שומרת פרטי תשלום ואינה מעבדת תשלומים בעצמה.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {aboutOpen && (
        <div className="drawer" onClick={() => setAboutOpen(false)} role="dialog" aria-modal="true">
          <div className="drawer-panel about-panel" onClick={e => e.stopPropagation()} data-testid="drawer-about">
            <div className="drawer-head">
              <h2>About</h2>
              <button className="btn ghost" onClick={() => setAboutOpen(false)} data-testid="button-close-about">סגירה</button>
            </div>
            <div className="drawer-body">
              <section className="about-card" data-testid="card-about">
                <p className="about-kicker">קרדיט פיתוח</p>
                <h3>פותח ע״י יגאל קריגל - קה״ד גדס״מ 5679 - גדוד סיור מיוחד</h3>
                <p>
                  האפליקציה נבנתה כמפת מצב אינטראקטיבית וחינוכית למרחב דרום לבנון עד נהר הליטני,
                  עם שכבות מידע, חיפוש, ניווט כבישים, מצפן, מיני־ניווט, הנחיות קוליות בעברית ובאנגלית,
                  הוראות פנייה לפי המסלול, הקלטת מסלולים, נקודות עניין ושיתוף קבצים מקומי.
                </p>
                <div className="about-meta">
                  <span>React + Leaflet</span>
                  <span>RTL Hebrew UI</span>
                  <span>Local-first privacy</span>
                </div>
                <div className="support-actions">
                  <a
                    className="btn primary"
                    href="https://portfolio-dusky-eight-77.vercel.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="link-about-portfolio"
                  >
                    פורטפוליו
                  </a>
                  <button
                    className="btn"
                    onClick={() => shareCurrentApp().catch(() => undefined)}
                    data-testid="button-about-share"
                  >
                    שתף את האפליקציה
                  </button>
                  <button
                    className="btn ghost"
                    onClick={openDonationLink}
                    data-testid="button-about-donate"
                  >
                    תרומה ב־Bit
                  </button>
                  <button
                    className="btn ghost"
                    onClick={() => copyDonationLink().catch(() => undefined)}
                    data-testid="button-about-copy-donation"
                  >
                    {donationCopied ? 'הקישור הועתק' : 'העתק קישור'}
                  </button>
                </div>
              </section>
              <h4>הצהרת שימוש</h4>
              <p>
                המפה מיועדת להמחשה וללמידה בלבד. המיקומים מקורבים, הנתונים מבוססי מקורות פתוחים,
                ואין באפליקציה נתוני מודיעין מבצעי, מטרות, מצבורים או נקודות שיגור.
              </p>
            </div>
          </div>
        </div>
      )}

      {helpOpen && (
        <div className="drawer" onClick={() => setHelpOpen(false)} role="dialog" aria-modal="true">
          <div className="drawer-panel help-panel" onClick={e => e.stopPropagation()} data-testid="drawer-help">
            <div className="drawer-head">
              <h2>עזרה והדרכה</h2>
              <button className="btn ghost" onClick={() => setHelpOpen(false)} data-testid="button-close-help">סגירה</button>
            </div>
            <div className="drawer-body">
              <h4>מה האפליקציה עושה?</h4>
              <p>
                האפליקציה מציגה מפה חינוכית של מרחב דרום לבנון עד נהר הליטני, עם שכבות מידע, אירועים מדווחים, מדידה, ניווט כבישים, מיקום חי, מצפן, מיני־ניווט, הנחיות קוליות בעברית או באנגלית, הוראות פנייה לפי המסלול, הקלטת מסלולים ונקודות עניין אישיות.
              </p>

              <h4>ניווט כבישים</h4>
              <p>
                באזור “ניווט כבישים נקודה לנקודה” הקלד שם מוצא ויעד, לדוגמה נאקורה וצור, ואז לחץ על תוצאה. האפליקציה תחשב מסלול כבישים משוער באמצעות OSRM/OpenStreetMap ותציג מרחק וזמן נסיעה תיאורטי.
              </p>

              <h4>הוראות פנייה לפי המסלול</h4>
              <p>
                לאחר בחירת מסלול, האפליקציה מציגה כרטיס “הוראת פנייה במסלול”. במסלול OSRM ההוראה מבוססת על צעדי הפנייה שהנתב מחזיר. אם אין צעדי ניווט זמינים, למשל במסלול מוקלט או מיובא, האפליקציה עוברת לאומדן לפי נקודות המסלול בלבד.
              </p>

              <h4>מיקום חי</h4>
              <p>
                אפשר ללחוץ “הצג מיקום מכשיר” גם ללא מסלול פעיל. הדפדפן יבקש הרשאת מיקום, ולאחר אישור תופיע נקודה זזה על המפה והמפה תתמקד עליה בזום קרוב. אם גוררים את המפה ידנית, העקיבה נעצרת זמנית כדי לאפשר בדיקת אזור אחר; לחיצה על “מרכז אותי” תחזיר את המפה לסמן המכשיר ותחדש את העקיבה. המיקום מוצג מקומית ואינו נשמר בשרת האפליקציה.
              </p>

              <h4>מצפן וכיוון נסיעה</h4>
              <p>
                כפתור המצפן שעל המפה מחליף בין “צפון למעלה” לבין “כיוון נסיעה”. במצב כיוון נסיעה המפה מסתובבת לפי כיוון המיקום החי, ההקלטה האחרונה, או כיוון המסלול הפעיל אם אין נתוני GPS. בזמן ניווט, סמן המכשיר מוצג כחץ מונפש שמצביע לכיוון ההתקדמות.
              </p>

              <h4>הקלטת מסלול</h4>
              <p>
                לחץ “התחל הקלטה” בזמן נסיעה כדי לאסוף נקודות GPS. בסיום לחץ “עצור הקלטה”, תן שם למסלול, ואז בחר “שמור הקלטה” או “שתף כקובץ”. הקובץ הוא JSON וניתן להעברה למכשיר אחר.
              </p>

              <h4>חלון מוקטן</h4>
              <p>
                כפתור “חלון מוקטן” מציג מיני־ניווט עם מצב הניווט, המיקום החי, ההקלטה, מיני־מפה והוראת הפנייה הקרובה. במחשב שולחני האפליקציה תנסה להשתמש ב־Document Picture-in-Picture אם הדפדפן תומך בכך, ואז Popup קטן, ואז חלון צף פנימי. בנייד, כולל Chrome ו־Samsung Internet, האפליקציה עוברת ישירות לחלון צף פנימי כי דפדפן ווב רגיל אינו יכול לכפות חלון מעל מסך הבית או מעל אפליקציות אחרות.
              </p>

              <h4>שמירה ושיתוף</h4>
              <p>
                מסלולים שמורים נשמרים בזיכרון הפעיל של האפליקציה בלבד. כדי לשתף או לשמור לטווח ארוך, השתמש ב“ייצוא קובץ מסלול” או “ייצוא כל המסלולים”, ובמכשיר אחר השתמש ב“ייבוא קובץ מסלול”.
              </p>

              <h4>נקודות עניין</h4>
              <p>
                באזור “נקודות עניין אישיות” לחץ “הוסף נקודה מהמפה”, בחר מיקום בלחיצה על המפה, מלא שם ותיאור ושמור. ניתן למחוק נקודות שאין בהן צורך, לייצא אותן לקובץ JSON, ולייבא את הקובץ במכשיר אחר.
              </p>

              <h4>תמיכה בפיתוח</h4>
              <p>
                כפתור “תמיכה בפיתוח” פותח חלון עם אפשרות לתרום דרך Bit, לשתף את האפליקציה ולעבור לפורטפוליו. התשלום מתבצע מחוץ לאפליקציה דרך שירות Bit.
              </p>

              <h4>פרטיות ואבטחה</h4>
              <p>
                אין מסד נתונים משותף ואין ערבוב מידע בין משתמשים. מיקום חי, הקלטות, הוראות פנייה ונקודות עניין נשארים בצד המכשיר, מלבד נקודות מוצא/יעד שנשלחות ל־OSRM לצורך חישוב מסלול כבישים. אם נדרשת פרטיות מלאה, השתמש במדידה, בנקודות עניין או במסלול מוקלט בלי חישוב OSRM.
              </p>

              <h4>מגבלות</h4>
              <p>
                הנתונים במפה מקורבים וחינוכיים. הניווט והוראות הפנייה אינם כוללים חסימות, מחסומים, תנועה בזמן אמת, שלטי דרך, נתיבי פנייה רשמיים או הערכת בטיחות, ואינם מיועדים לשימוש מבצעי.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
