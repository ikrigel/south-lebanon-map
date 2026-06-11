import { useCallback } from 'react';
import { safeStorageSet } from '../storage/storage';
import { MAP_VIEW_STORAGE_KEY } from '../constants';
import type { LocalMapView } from '../types';

interface UseMapCallbacksDeps {
  // No external deps - all functions are pure event handlers
}

export const useMapCallbacks = (_deps: UseMapCallbacksDeps) => {
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

  return { handleMapViewChange };
};
