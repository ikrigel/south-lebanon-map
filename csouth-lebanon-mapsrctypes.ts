// Theme and UI types
export type ThemeMode = 'auto' | 'light' | 'dark';
export type VoiceGuidanceMode = 'off' | 'basic' | 'detailed';
export type VoiceLanguage = 'he' | 'en';

// Turn instruction and routing types
export type TurnAction = 'straight' | 'right' | 'left' | 'uturn' | 'arrive' | 'none';
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

// Route types
export type RoadRoute = {
  km: number;
  durationMin: number;
  path: [number, number][];
  instructions?: TurnInstruction[];
};

export type RouteDisplayMode = 'road' | 'aerial' | 'both';

export type RouteOption = {
  id: 'drive' | 'foot' | 'aerial';
  labelHe: string;
  km: number;
  durationMin?: number;
  path?: [number, number][];
  instructions?: TurnInstruction[];
  passabilityHe: string;
  airspaceHe: string;
  color: string;
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

// Navigation point type
export type NavPoint = {
  id: string;
  label: string;
  group: string;
  lat: number;
  lon: number;
};

// POI types
export type PoiColor = '#f6c453' | '#4fb3a6' | '#6aa7d8' | '#d96b6b' | '#b98cff' | '#88c37a';
export type PoiShape = 'circle' | 'square' | 'diamond' | 'star';
export type PoiSize = 'sm' | 'md' | 'lg';

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

// Navigation session state
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
  navCustomStart?: { lat: number; lon: number; label: string } | null;
  navCustomEnd?: { lat: number; lon: number; label: string } | null;
  activeRouteId?: 'drive' | 'foot' | 'aerial';
  routeDisplayMode?: RouteDisplayMode;
  savedAt?: number;
  lastDistToDestM?: number;
};

// Recording session state
export type LocalRecordingSession = {
  recordingName?: string;
  recordedTrack?: [number, number][];
  recordingActive?: boolean;
};

// Map view state
export type LocalMapView = {
  lat: number;
  lon: number;
  zoom: number;
};

// Label preferences
export type LocalLabelPreferences = {
  largeLabels?: boolean;
  allLabels?: boolean;
};

// Multi-route types
export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'extreme';
export type PassabilityLevel = 'paved' | 'dirt' | 'offroad' | 'foot_only';

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

// UI state persistence
export type LocalUiState = {
  panelsCollapsed?: boolean;
  panelHeightPct?: number;
  userMapRotation?: number;
};

// Filter state persistence
export type LocalFilterState = {
  yearFrom?: number;
  yearTo?: number;
  typeFilter?: string[];
  sevFilter?: string[];
};
