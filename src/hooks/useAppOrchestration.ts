import { useRef, useState, useEffect } from 'react';
import { useFilterState } from './useFilterState';
import { usePoiState } from './usePoiState';
import { useMultiRouteState } from './useMultiRouteState';
import { useMapDisplayState } from './useMapDisplayState';
import { useUiState } from './useUiState';
import { useNavState } from './useNavState';
import { useLiveLocation } from './useLiveLocation';
import { useToastNotification } from './useToastNotification';
import { useMapCallbacks } from './useMapCallbacks';
import { usePersistence } from './usePersistence';
import type { LocalRecordingSession, LocalMapView } from '../types';
import { loadLocalRecordingSession, loadLocalMapView } from '../storage/loaders';

export function useAppOrchestration() {
  // Initial state refs
  const initialRecordingSessionRef = useRef<LocalRecordingSession | null>(null);
  if (initialRecordingSessionRef.current === null) initialRecordingSessionRef.current = loadLocalRecordingSession();
  const initialMapViewRef = useRef<LocalMapView | null>(null);
  if (initialMapViewRef.current === null) initialMapViewRef.current = loadLocalMapView();

  // Feature state hooks (6 calls, ~50 properties each)
  const filterState = useFilterState();
  const poiState = usePoiState();
  const multiRouteState = useMultiRouteState();
  const mapDisplayState = useMapDisplayState();
  const uiState = useUiState();
  const navState = useNavState();

  // Recording state (3 useState + object)
  const [recordingStatus, setRecordingStatus] = useState<'idle' | 'recording' | 'paused' | 'error'>('idle');
  const [recordingWatchId, setRecordingWatchId] = useState<number | null>(null);
  const [recordedTrack, setRecordedTrack] = useState<[number, number][]>(() => initialRecordingSessionRef.current?.recordedTrack ?? []);
  const [recordingName, setRecordingName] = useState(() => initialRecordingSessionRef.current?.recordingName ?? '');
  const recordingState = { recordingStatus, recordingName, recordedTrack };

  // Core utility hooks
  useLiveLocation({ liveLocation: navState.liveLocation, setNavPosition: navState.setNavPosition, navPositionRef: navState.navPositionRef });
  const { showToast, toastTimeoutRef } = useToastNotification({ setToastMessage: uiState.setToastMessage });
  const { handleMapViewChange } = useMapCallbacks({});
  const { lastDistToDestMRef } = usePersistence({
    filterState, poiState, multiRouteState, mapDisplayState, uiState, navState, recordingState, setAutoDay: uiState.setAutoDay,
  });

  // Cleanup effects
  useEffect(() => {
    return () => {
      if (navState.watchId !== null && 'geolocation' in navigator) navigator.geolocation.clearWatch(navState.watchId);
      if (recordingWatchId !== null && 'geolocation' in navigator) navigator.geolocation.clearWatch(recordingWatchId);
    };
  }, [navState.watchId, recordingWatchId]);

  useEffect(() => {
    return () => { if (toastTimeoutRef.current !== null) window.clearTimeout(toastTimeoutRef.current); };
  }, [toastTimeoutRef]);

  return {
    initialRecordingSessionRef,
    initialMapViewRef,
    recordingStatus,
    setRecordingStatus,
    recordingWatchId,
    setRecordingWatchId,
    recordedTrack,
    setRecordedTrack,
    recordingName,
    setRecordingName,
    recordingState,
    showToast,
    toastTimeoutRef,
    handleMapViewChange,
    lastDistToDestMRef,
    filterState,
    poiState,
    multiRouteState,
    mapDisplayState,
    uiState,
    navState,
  };
}
