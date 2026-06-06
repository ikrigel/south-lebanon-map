import { useEffect, useRef } from 'react';
import type {
  CustomPoi,
  ThemeMode,
  LayerVis,
  LocalLabelPreferences,
  LocalUiState,
  LocalFilterState,
  LocalNavSession,
  LocalRecordingSession,
} from '../types';
import {
  THEME_STORAGE_KEY,
  LAYER_VIS_STORAGE_KEY,
  LABEL_PREF_STORAGE_KEY,
  UI_STATE_STORAGE_KEY,
  FILTER_STATE_STORAGE_KEY,
  SAVED_ROUTES_STORAGE_KEY,
  SAVED_MULTI_ROUTES_STORAGE_KEY,
  NAV_SESSION_KEY,
  RECORDING_STORAGE_KEY,
} from '../constants';
import { saveLocalPois, safeStorageSet } from '../storage/storage';
import { isDaytime } from '../navigation/turnHelpers';

export const usePersistence = ({
  customPois,
  themeMode,
  visible,
  largeLabels,
  allLabels,
  panelsCollapsed,
  panelHeightPct,
  userMapRotation,
  yearFrom,
  yearTo,
  typeFilter,
  sevFilter,
  savedRoutes,
  savedMultiRoutes,
  navStartId,
  navEndId,
  navStartQuery,
  navEndQuery,
  routeName,
  roadRoute,
  footRoute,
  activeSavedRoute,
  locationStatus,
  voiceGuidance,
  voiceLanguage,
  navCustomStart,
  navCustomEnd,
  activeRouteId,
  routeDisplayMode,
  liveLocation,
  recordingName,
  recordedTrack,
  recordingStatus,
  setAutoDay,
}: {
  customPois: CustomPoi[];
  themeMode: ThemeMode;
  visible: LayerVis;
  largeLabels: boolean;
  allLabels: boolean;
  panelsCollapsed: boolean;
  panelHeightPct: number;
  userMapRotation: number | undefined;
  yearFrom: number;
  yearTo: number;
  typeFilter: Set<string>;
  sevFilter: Set<string>;
  savedRoutes: any[];
  savedMultiRoutes: any[];
  navStartId: string;
  navEndId: string;
  navStartQuery: string;
  navEndQuery: string;
  routeName: string;
  roadRoute: any;
  footRoute: any;
  activeSavedRoute: any;
  locationStatus: 'idle' | 'watching' | 'error';
  voiceGuidance: any;
  voiceLanguage: any;
  navCustomStart: any;
  navCustomEnd: any;
  activeRouteId: any;
  routeDisplayMode: any;
  liveLocation: any;
  recordingName: string;
  recordedTrack: [number, number][];
  recordingStatus: 'idle' | 'recording' | 'paused';
  setAutoDay: (isDaytime: boolean) => void;
}) => {
  const lastDistToDestMRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const timer = window.setInterval(() => setAutoDay(isDaytime()), 60_000);
    return () => window.clearInterval(timer);
  }, [setAutoDay]);

  useEffect(() => {
    saveLocalPois(customPois);
  }, [customPois]);

  useEffect(() => {
    safeStorageSet(THEME_STORAGE_KEY, themeMode);
  }, [themeMode]);

  useEffect(() => {
    safeStorageSet(LAYER_VIS_STORAGE_KEY, visible);
  }, [visible]);

  useEffect(() => {
    safeStorageSet(LABEL_PREF_STORAGE_KEY, { largeLabels, allLabels } satisfies LocalLabelPreferences);
  }, [largeLabels, allLabels]);

  useEffect(() => {
    safeStorageSet(UI_STATE_STORAGE_KEY, {
      panelsCollapsed,
      panelHeightPct,
      userMapRotation,
    } satisfies LocalUiState);
  }, [panelsCollapsed, panelHeightPct, userMapRotation]);

  useEffect(() => {
    safeStorageSet(FILTER_STATE_STORAGE_KEY, {
      yearFrom,
      yearTo,
      typeFilter: [...typeFilter],
      sevFilter: [...sevFilter],
    } satisfies LocalFilterState);
  }, [yearFrom, yearTo, typeFilter, sevFilter]);

  useEffect(() => {
    safeStorageSet(SAVED_ROUTES_STORAGE_KEY, savedRoutes);
  }, [savedRoutes]);

  useEffect(() => {
    safeStorageSet(SAVED_MULTI_ROUTES_STORAGE_KEY, savedMultiRoutes);
  }, [savedMultiRoutes]);

  useEffect(() => {
    const persistedCustomStart =
      navStartId === 'live-location' && liveLocation
        ? { lat: liveLocation.lat, lon: liveLocation.lon, label: 'מיקום GPS שנשמר' }
        : navCustomStart;
    safeStorageSet(NAV_SESSION_KEY, {
      navStartId,
      navEndId,
      navStartQuery,
      navEndQuery,
      routeName,
      roadRoute,
      footRoute,
      activeSavedRoute,
      liveActive: locationStatus === 'watching',
      voiceGuidance,
      voiceLanguage,
      navCustomStart: persistedCustomStart,
      navCustomEnd,
      activeRouteId,
      routeDisplayMode,
      savedAt: Date.now(),
      lastDistToDestM: lastDistToDestMRef.current,
    } satisfies LocalNavSession);
  }, [
    navStartId, navEndId, navStartQuery, navEndQuery, routeName,
    roadRoute, footRoute, activeSavedRoute, locationStatus,
    voiceGuidance, voiceLanguage,
    navCustomStart, navCustomEnd, activeRouteId, routeDisplayMode,
    liveLocation,
  ]);

  useEffect(() => {
    safeStorageSet(RECORDING_STORAGE_KEY, {
      recordingName,
      recordedTrack,
      recordingActive: recordingStatus === 'recording',
    } satisfies LocalRecordingSession);
  }, [recordingName, recordedTrack, recordingStatus]);

  return { lastDistToDestMRef };
};
