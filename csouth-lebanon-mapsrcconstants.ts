// Incident type and severity constants
export const TYPES = ['rocket', 'atgm', 'uav', 'idf_strike', 'unifil', 'ground', 'displacement'] as const;
export const SEVS = ['low', 'med', 'high'] as const;

// File size and item limits
export const MAX_ROUTE_FILE_BYTES = 1_000_000;
export const MAX_IMPORTED_ROUTES = 100;
export const MAX_ROUTE_POINTS = 5000;
export const MAX_POI_FILE_BYTES = 750_000;
export const MAX_IMPORTED_POIS = 500;
export const MAX_MULTI_ROUTE_POINTS = 50;

// LocalStorage keys
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

// Default values
export const DEFAULT_THEME_MODE = 'dark' as const;
export const DEFAULT_MAP_VIEW = { lat: 33.25, lon: 35.38, zoom: 10 } as const;
export const DONATION_CONTACT_URL = 'https://www.bitpay.co.il/app/me/7193501F-35B9-B8F9-0E46-32EA6E76DDFAF94C';

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
export const DIFFICULTY_LABELS = {
  easy: 'קל',
  medium: 'בינוני',
  hard: 'קשה',
  extreme: 'קיצוני',
} as const;

export const PASSABILITY_LABELS = {
  paved: 'כביש סלול',
  dirt: 'דרך עפר',
  offroad: 'שטח פתוח',
  foot_only: 'הליכה בלבד',
} as const;

// Navigation scale options
export const NAV_SCALES = [
  { zoom: 13, label: 'ביתא' },
  { zoom: 14, label: 'רחוב' },
  { zoom: 15, label: 'רחוב' },
  { zoom: 16, label: 'בניין' },
] as const;

export const DEFAULT_NAV_SCALE_LABEL = 'ביתא';

// Rotation snap angles and labels
export const SNAP_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315] as const;
export const SNAP_LABELS = {
  0: '↑ צפון',
  45: '↗ ס״מ',
  90: '→ מזרח',
  135: '↘ ד״מ',
  180: '↓ דרום',
  225: '↙ ד״מ',
  270: '← מערב',
  315: '↖ ס״מ',
} as const;

// Default layer visibility state
export const DEFAULT_LAYER_VISIBILITY = {
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
} as const;
