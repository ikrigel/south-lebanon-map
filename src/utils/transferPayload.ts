import type { CustomPoi, SavedRoute, MultiPointRoute, RecordingPayload } from '../TransferModal';

export interface TransferPayload {
  v: 1;
  pois?: CustomPoi[];
  routes?: SavedRoute[];
  multiRoutes?: MultiPointRoute[];
  recording?: RecordingPayload;
}

export interface Selection {
  pois: boolean;
  routes: boolean;
  multiRoutes: boolean;
  recording: boolean;
}

const MAX_PATH_POINTS = 60;
const MAX_QR_BYTES = 2900;

function downsamplePath(path: [number, number][], max: number): [number, number][] {
  if (path.length <= max) return path;
  const step = (path.length - 1) / (max - 1);
  const result: [number, number][] = [];
  for (let i = 0; i < max; i++) {
    result.push(path[Math.round(i * step)]);
  }
  return result;
}

export function encodePayload(payload: TransferPayload): string {
  const json = JSON.stringify(payload);
  return btoa(unescape(encodeURIComponent(json)));
}

export function decodePayload(encoded: string): TransferPayload | null {
  try {
    const json = decodeURIComponent(escape(atob(encoded)));
    const obj = JSON.parse(json);
    if (typeof obj !== 'object' || obj.v !== 1) return null;
    return obj as TransferPayload;
  } catch {
    return null;
  }
}

export function buildPayload(
  pois: CustomPoi[],
  routes: SavedRoute[],
  multiRoutes: MultiPointRoute[],
  recordedTrack: [number, number][],
  recordingName: string,
  sel: Selection,
): TransferPayload {
  const payload: TransferPayload = { v: 1 };
  if (sel.pois && pois.length > 0) payload.pois = pois;
  if (sel.routes && routes.length > 0) {
    payload.routes = routes.map(r => ({
      ...r,
      path: r.path ? downsamplePath(r.path, MAX_PATH_POINTS) : undefined,
      instructions: undefined,
    }));
  }
  if (sel.multiRoutes && multiRoutes.length > 0) payload.multiRoutes = multiRoutes;
  if (sel.recording && recordedTrack.length > 0) {
    payload.recording = {
      recordingName: recordingName || 'הקלטה מיובאת',
      recordedTrack: downsamplePath(recordedTrack, MAX_PATH_POINTS),
    };
  }
  return payload;
}

export const QR_CONFIG = {
  SIZE: 280 as const,
  LEVEL: 'L' as const,
  MAX_BYTES: MAX_QR_BYTES,
};
