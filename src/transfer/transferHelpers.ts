import type { TransferPayload, SavedRoute } from './transferTypes';

export const MAX_PATH_POINTS = 60;
export const QR_SIZE = 280;
export const QR_LEVEL = 'L';
export const MAX_QR_BYTES = 2900;

export function downsamplePath(path: [number, number][], max: number): [number, number][] {
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
    return JSON.parse(json) as TransferPayload;
  } catch {
    return null;
  }
}

export function buildPayload(
  selectedPois: boolean,
  selectedRoutes: boolean,
  selectedMultiRoutes: boolean,
  selectedRecording: boolean,
  customPois: any[],
  savedRoutes: SavedRoute[],
  savedMultiRoutes: any[],
  recordingName: string,
  recordedTrack: [number, number][],
): TransferPayload {
  const payload: TransferPayload = { v: 1 };

  if (selectedPois && customPois.length > 0) {
    payload.pois = customPois;
  }

  if (selectedRoutes && savedRoutes.length > 0) {
    payload.routes = savedRoutes.map(r => ({
      ...r,
      path: r.path ? downsamplePath(r.path, MAX_PATH_POINTS) : undefined,
    }));
  }

  if (selectedMultiRoutes && savedMultiRoutes.length > 0) {
    payload.multiRoutes = savedMultiRoutes;
  }

  if (selectedRecording && recordedTrack.length > 0) {
    payload.recording = {
      recordingName,
      recordedTrack,
    };
  }

  return payload;
}
