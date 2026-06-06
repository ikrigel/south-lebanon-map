// Theme and display configuration types
export type ThemeMode = 'auto' | 'light' | 'dark';
export type VoiceGuidanceMode = 'off' | 'basic' | 'detailed';
export type VoiceLanguage = 'he' | 'en';

// Layer visibility toggles
export type LayerVis = {
  pop?: boolean;
  unifil?: boolean;
  hez?: boolean;
  blueLine?: boolean;
  litani?: boolean;
  rivers?: boolean;
  topo?: boolean;
  cityLabels?: boolean;
  settlementLabels?: boolean;
  ridgeLabels?: boolean;
  waterLabels?: boolean;
  sectColors?: boolean;
  navLabels?: boolean;
};

// Navigation and routing types
export type TurnAction = 'straight' | 'right' | 'left' | 'uturn' | 'arrive' | 'none';
export type RouteDisplayMode = 'road' | 'aerial' | 'both';

// POI customization types
export type PoiColor = '#f6c453' | '#4fb3a6' | '#6aa7d8' | '#d96b6b' | '#b98cff' | '#88c37a';
export type PoiShape = 'circle' | 'square' | 'diamond' | 'star';
export type PoiSize = 'sm' | 'md' | 'lg';

// Difficulty and passability types for multi-point routes
export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'extreme';
export type PassabilityLevel = 'paved' | 'dirt' | 'offroad' | 'foot_only';

// Core data structure types
export type NavPoint = {
  id: string;
  label: string;
  group: string;
  lat: number;
  lon: number;
};

export type TurnInstruction = {
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

export type RoadRoute = {
  km: number;
  durationMin: number;
  path: [number, number][];
  instructions?: TurnInstruction[];
};

// A computed route option shown in the route-type selector
export type RouteOption = {
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

export type SavedRoute = {
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

export type CustomPoi = {
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

export type MultiPointRoute = {
  id: string;
  name: string;
  description: string;
  difficulty: DifficultyLevel;
  passability: PassabilityLevel;
  points: { lat: number; lon: number; label: string; order: number }[];
  totalKm: number;
  createdAt: string;
};

// Session persistence types
export type LocalNavSession = {
  navStartId?: string;
  navEndId?: string;
  navStartQuery?: string;
  navEndQuery?: string;
  routeName?: string;
  roadRoute?: RoadRoute | null;
  footRoute?: RoadRoute | null;
  activeSavedRoute?: SavedRoute | null;
  liveActive?: boolean;
  voiceGuidance?: VoiceGuidanceMode;
  voiceLanguage?: VoiceLanguage;
  // New: persist map-tapped custom points
  navCustomStart?: { lat: number; lon: number; label: string } | null;
  navCustomEnd?:   { lat: number; lon: number; label: string } | null;
  // New: active route selection + display mode
  activeRouteId?: 'drive' | 'foot' | 'aerial';
  routeDisplayMode?: RouteDisplayMode;
  // Timestamp of last save — used to detect "arrived" state on resume
  savedAt?: number;
  // Last known distance-to-destination (metres) so we can skip asking if already arrived
  lastDistToDestM?: number;
};

export type LocalRecordingSession = {
  recordingName?: string;
  recordedTrack?: [number, number][];
  recordingActive?: boolean;
};

export type LocalMapView = {
  lat: number;
  lon: number;
  zoom: number;
};

export type LocalLabelPreferences = {
  largeLabels?: boolean;
  allLabels?: boolean;
};

export type LocalUiState = {
  panelsCollapsed?: boolean;
  panelHeightPct?: number;
  userMapRotation?: number;
};

export type LocalFilterState = {
  yearFrom?: number;
  yearTo?: number;
  typeFilter?: string[];
  sevFilter?: string[];
};
