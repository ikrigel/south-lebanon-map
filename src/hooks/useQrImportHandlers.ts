import { useCallback } from 'react';
import { safeText, haversineKm } from '../util';
import { normalizeRoutePath } from '../storage/loaders';
import type { SavedRoute, MultiPointRoute, RecordingPayload, CustomPoi } from '../types';

interface UseQrImportHandlersDeps {
  setSavedRoutes: (fn: (prev: SavedRoute[]) => SavedRoute[]) => void;
  setSavedMultiRoutes: (fn: (prev: MultiPointRoute[]) => MultiPointRoute[]) => void;
  setRecordedTrack: (track: any[]) => void;
  setRecordingName: (name: string) => void;
  setCustomPois: (fn: (prev: CustomPoi[]) => CustomPoi[]) => void;
  showToast: (msg: string) => void;
}

export const useQrImportHandlers = (deps: UseQrImportHandlersDeps) => {
  const handleQrImportRoutes = useCallback((routes: any[]) => {
    const valid = (routes as SavedRoute[]).filter(r =>
      r?.start && r?.end &&
      typeof r.start.lat === 'number' && typeof r.start.lon === 'number' &&
      typeof r.end.lat === 'number' && typeof r.end.lon === 'number'
    ).map((r: SavedRoute) => ({
      id: safeText(r.id) || `route-${Date.now()}-${Math.random()}`,
      name: safeText(r.name, 'מסלול מיובא') || 'מסלול מיובא',
      createdAt: safeText(r.createdAt, new Date().toISOString()) || new Date().toISOString(),
      startId: safeText(r.startId),
      endId: safeText(r.endId),
      start: { lat: r.start.lat, lon: r.start.lon, label: safeText(r.start.label, 'נקודת מוצא') || 'נקודת מוצא' },
      end: { lat: r.end.lat, lon: r.end.lon, label: safeText(r.end.label, 'יעד') || 'יעד' },
      km: typeof r.km === 'number' && isFinite(r.km) && r.km >= 0 ? r.km : haversineKm([r.start.lat, r.start.lon], [r.end.lat, r.end.lon]),
      durationMin: typeof r.durationMin === 'number' && isFinite(r.durationMin) ? r.durationMin : undefined,
      path: Array.isArray(r.path)
        ? (r.path as [number, number][]).filter(p => Array.isArray(p) && p.length >= 2 && typeof p[0] === 'number' && typeof p[1] === 'number')
        : undefined,
      instructions: undefined,
    }));
    if (!valid.length) return;
    deps.setSavedRoutes(prev => {
      const existingIds = new Set(prev.map(r => r.id));
      const fresh = valid.filter(r => !existingIds.has(r.id));
      return fresh.length ? [...fresh, ...prev] : prev;
    });
  }, [deps]);

  const handleQrImportMultiRoutes = useCallback((routes: any[]) => {
    const valid = (routes as MultiPointRoute[]).filter(r =>
      r && Array.isArray(r.points) && r.points.length > 0
    );
    if (!valid.length) return;
    deps.setSavedMultiRoutes(prev => {
      const existingIds = new Set(prev.map(r => r.id));
      const fresh = valid.filter(r => !existingIds.has(r.id));
      return fresh.length ? [...fresh, ...prev] : prev;
    });
  }, [deps]);

  const handleQrImportRecording = useCallback((rec: RecordingPayload) => {
    if (!rec.recordedTrack?.length) return;
    const track = normalizeRoutePath(rec.recordedTrack) ?? [];
    if (!track.length) return;
    deps.setRecordedTrack(track);
    if (rec.recordingName) deps.setRecordingName(rec.recordingName);
    deps.showToast('הקלטת נסיעה יובאה מברקוד');
  }, [deps]);

  const handleQrImportPois = useCallback((pois: CustomPoi[]) => {
    deps.setCustomPois(prev => {
      const existingIds = new Set(prev.map(p => p.id));
      const fresh = pois.filter(p => !existingIds.has(p.id));
      if (!fresh.length) return prev;
      deps.showToast(`${fresh.length} נקודות עניין יובאו מברקוד`);
      return [...fresh, ...prev];
    });
  }, [deps]);

  return { handleQrImportRoutes, handleQrImportMultiRoutes, handleQrImportRecording, handleQrImportPois };
};
