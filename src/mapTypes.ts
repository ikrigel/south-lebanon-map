import type { Incident, Town, DroneAttack } from './data/geo';

export type MapHandle = {
  snapshotCenter: () => void;
  invalidateSize: () => void;
};

export type LayerVis = {
  pop: boolean;
  unifil: boolean;
  hez: boolean;
  blueLine: boolean;
  litani: boolean;
  rivers: boolean;
  topo: boolean;
  satellite: boolean;
  cityLabels: boolean;
  settlementLabels: boolean;
  ridgeLabels: boolean;
  waterLabels: boolean;
  sectColors: boolean;
  navLabels: boolean;
  drones: boolean;
};

export type MapProps = {
  initialCenter?: { lat: number; lon: number; zoom: number };
  visible: LayerVis;
  filteredIncidents: Incident[];
  selectedIncident: Incident | null;
  onSelectIncident: (id: string | null) => void;
  droneAttacks?: DroneAttack[];
  measureMode: boolean;
  pointPickMode: boolean;
  manualMeasure: [number, number][];
  onMapClick: (latlng: { lat: number; lon: number }) => void;
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
  userRotation: number;
  onUserRotationChange: (deg: number) => void;
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
  onNavigateToPoint?: (lat: number, lon: number, label: string) => void;
  onSetNavStart?: (lat: number, lon: number, label: string) => void;
  navFollowZoom?: number;
  ghostRoutePath?: [number, number][] | null;
};
