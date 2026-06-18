import type { DifficultyLevel, PassabilityLevel, ThemeMode, LocalMapView } from './types';
import type { LayerVis } from './Map';

// Incident type and severity filters
export const TYPES = ['rocket', 'atgm', 'uav', 'idf_strike', 'unifil', 'ground', 'displacement'];
export const SEVS = ['low', 'med', 'high'];

// Route and POI file size/count limits
export const MAX_ROUTE_FILE_BYTES = 1_000_000;
export const MAX_IMPORTED_ROUTES = 100;
export const MAX_ROUTE_POINTS = 5000;
export const MAX_POI_FILE_BYTES = 750_000;
export const MAX_IMPORTED_POIS = 500;
export const MAX_MULTI_ROUTE_POINTS = 50;

// Browser storage keys
export const POI_STORAGE_KEY = 'south-lebanon-map:custom-pois:v1';
export const NAV_SESSION_KEY = 'south-lebanon-map:navigation-session:v1';
export const RECORDING_STORAGE_KEY = 'south-lebanon-map:recorded-track:v1';
export const THEME_STORAGE_KEY = 'south-lebanon-map:theme-mode:v1';
export const LAYER_VIS_STORAGE_KEY = 'south-lebanon-map:layer-visibility:v1';
export const MAP_VIEW_STORAGE_KEY = 'south-lebanon-map:last-map-view:v1';
export const LABEL_PREF_STORAGE_KEY = 'south-lebanon-map:label-preferences:v1';
export const UI_STATE_STORAGE_KEY = 'south-lebanon-map:ui-state:v1';
export const FILTER_STATE_STORAGE_KEY = 'south-lebanon-map:filter-state:v1';
export const SAVED_ROUTES_STORAGE_KEY = 'south-lebanon-map:saved-routes:v1';
export const SAVED_MULTI_ROUTES_STORAGE_KEY = 'south-lebanon-map:saved-multi-routes:v1';
export const MULTI_ROUTE_STORAGE_KEY = 'south-lebanon-map:multi-routes:v1';

// Default configuration
export const DEFAULT_THEME_MODE: ThemeMode = 'dark';
export const DEFAULT_MAP_VIEW: LocalMapView = { lat: 33.25, lon: 35.38, zoom: 10 };
export const DONATION_CONTACT_URL = 'https://www.bitpay.co.il/app/me/7193501F-35B9-B8F9-0E46-32EA6E76DDFAF94C';

// Layer visibility defaults
export const DEFAULT_LAYER_VISIBILITY: LayerVis = {
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
  navLabels: true,
  drones: false,
};

// POI customization options
export const POI_COLORS = [
  { value: '#f6c453', label: 'זהב' },
  { value: '#4fb3a6', label: 'טורקיז' },
  { value: '#6aa7d8', label: 'כחול' },
  { value: '#d96b6b', label: 'אדום' },
  { value: '#b98cff', label: 'סגול' },
  { value: '#88c37a', label: 'ירוק' },
] as const;

export const POI_SHAPES = [
  { value: 'circle', label: 'עיגול' },
  { value: 'square', label: 'ריבוע' },
  { value: 'diamond', label: 'יהלום' },
  { value: 'star', label: 'כוכב' },
] as const;

export const POI_SIZES = [
  { value: 'sm', label: 'קטן' },
  { value: 'md', label: 'בינוני' },
  { value: 'lg', label: 'גדול' },
] as const;

// Difficulty and passability labels
export const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  easy: 'קל',
  medium: 'בינוני',
  hard: 'קשה',
  extreme: 'קיצוני',
};

export const PASSABILITY_LABELS: Record<PassabilityLevel, string> = {
  paved: 'כביש סלול',
  dirt: 'דרך עפר',
  offroad: 'שטח פתוח',
  foot_only: 'הליכה בלבד',
};

// Navigation scale levels with zoom values
export const NAV_SCALES: { label: string; zoom: number }[] = [
  { label: '1:20',   zoom: 18 },
  { label: '1:50',   zoom: 17 },
  { label: '1:100',  zoom: 16 },
  { label: '1:200',  zoom: 15 },
  { label: '1:500',  zoom: 13 },
  { label: '1:1000', zoom: 12 },
  { label: '1:2000', zoom: 11 },
];

export const DEFAULT_NAV_SCALE_LABEL = '1:200';

// Map rotation snap angles
export const SNAP_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315] as const;

export const SNAP_LABELS: Record<number, string> = {
  0: '↑ צפון', 45: '↗ ס״מ', 90: '→ מזרח', 135: '↘ ד״מ',
  180: '↓ דרום', 225: '↙ ד״מ', 270: '← מערב', 315: '↖ ס״מ',
};

// Marker positioning parameters (v3.3.18)
export const HEADER_VISIBILITY_STORAGE_KEY = 'south-lebanon-map:header-visibility:v1';
export const MARKER_POSITION_TOLERANCE_PX = 5;
export const MARKER_ADJUSTMENT_MAX_ITERATIONS = 3;
export const MARKER_ADJUSTMENT_DELAY_MS = 150;
export const MARKER_BASE_OFFSET_RATIO = 1 / 6; // 1/6 of screen height for lower-third positioning
