import type { PoiColor, PoiShape, PoiSize, DifficultyLevel, PassabilityLevel } from '../types';

export interface CustomPoi {
  id: string;
  name: string;
  description: string;
  lat: number;
  lon: number;
  createdAt: string;
  markerColor: PoiColor;
  markerShape: PoiShape;
  markerSize: PoiSize;
}

export interface SavedRoute {
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
  instructions?: unknown[];
}

export interface MultiPointRoute {
  id: string;
  name: string;
  description: string;
  difficulty: DifficultyLevel;
  passability: PassabilityLevel;
  points: { lat: number; lon: number; label: string; order: number }[];
  totalKm: number;
  createdAt: string;
}

export interface RecordingPayload {
  recordingName?: string;
  recordedTrack?: [number, number][];
}

export interface TransferPayload {
  v: 1;
  pois?: CustomPoi[];
  routes?: SavedRoute[];
  multiRoutes?: MultiPointRoute[];
  recording?: RecordingPayload;
}

export interface TransferModalProps {
  onClose: () => void;
  customPois: CustomPoi[];
  savedRoutes: SavedRoute[];
  savedMultiRoutes: MultiPointRoute[];
  recordedTrack: [number, number][];
  recordingName: string;
  onImportPois: (pois: CustomPoi[]) => void;
  onImportRoutes: (routes: SavedRoute[]) => void;
  onImportMultiRoutes: (routes: MultiPointRoute[]) => void;
  onImportRecording: (rec: RecordingPayload) => void;
}
