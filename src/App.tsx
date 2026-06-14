import { useMemo, useState, useCallback, useEffect, useRef, type CSSProperties } from 'react';
import MapView, { LayerVis, MapHandle } from './Map';
import TransferModal, { type CustomPoi as TransferPoi, type SavedRoute as TransferRoute, type MultiPointRoute as TransferMultiRoute, type RecordingPayload } from './TransferModal';
import { incidents, blueLine, Incident, towns, unifilPoints, influenceZones, terrainFeatures } from './data/geo';
import { sources } from './data/sources';
import {
  TYPE_LABEL, TYPE_COLOR, SEV_LABEL, fmtDate, fmtKm, haversineKm, distanceToPolyline, safeText, bearingDegrees,
} from './util';
import type {
  ThemeMode, VoiceGuidanceMode, VoiceLanguage, TurnAction, TurnInstruction, RoadRoute, RouteDisplayMode,
  RouteOption, SavedRoute, NavPoint, PoiColor, PoiShape, PoiSize, CustomPoi, LocalNavSession, LocalRecordingSession,
  LocalMapView, LocalLabelPreferences, DifficultyLevel, PassabilityLevel, MultiPointRoute, LocalUiState, LocalFilterState,
} from './types';
import {
  TYPES, SEVS, MAX_ROUTE_FILE_BYTES, MAX_IMPORTED_ROUTES, MAX_ROUTE_POINTS, MAX_POI_FILE_BYTES, MAX_IMPORTED_POIS,
  MAX_MULTI_ROUTE_POINTS, POI_STORAGE_KEY, NAV_SESSION_KEY, RECORDING_STORAGE_KEY, THEME_STORAGE_KEY,
  LAYER_VIS_STORAGE_KEY, MAP_VIEW_STORAGE_KEY, LABEL_PREF_STORAGE_KEY, UI_STATE_STORAGE_KEY, FILTER_STATE_STORAGE_KEY,
  SAVED_ROUTES_STORAGE_KEY, SAVED_MULTI_ROUTES_STORAGE_KEY, MULTI_ROUTE_STORAGE_KEY, DEFAULT_THEME_MODE,
  DEFAULT_MAP_VIEW, DONATION_CONTACT_URL, POI_COLORS, POI_SHAPES, POI_SIZES, DIFFICULTY_LABELS, PASSABILITY_LABELS,
  NAV_SCALES, DEFAULT_NAV_SCALE_LABEL, SNAP_ANGLES, SNAP_LABELS, DEFAULT_LAYER_VISIBILITY,
} from './constants';
import {
  isDaytime, clean, isPoiColor, isPoiShape, isPoiSize, normalizeTurnDelta, turnActionFromDelta,
  directionHebrew, directionEnglish, turnVerbHe, turnVerbEn, formatTurnDistance, formatTurnDistanceEn,
  composeTurnInstruction, osrmStepToAction,
} from './navigation/turnHelpers';
import {
  normalizeRouteInstructions,
} from './navigation/routeParsers';
import { isMobileLikeDevice, openExternalNav } from './navigation/externalNav';
import {
  safeStorageGet, safeStorageSet, pickSpeechVoice, loadLocalPois, saveLocalPois, miniEscape,
} from './storage/storage';
import {
  loadLocalThemeMode, loadLocalLayerVisibility, loadLocalMapView, loadLocalLabelPreferences,
  normalizeRoutePath, normalizeCustomPoint,
} from './storage/loaders';
import { loadLocalNavSession } from './storage/navSessionLoader';
import {
  loadLocalRecordingSession, loadLocalUiState, loadLocalFilterState, loadLocalSavedRoutes, loadLocalSavedMultiRoutes,
} from './storage/sessionLoaders';
import { normalizePoi } from './storage/normalize';
import { useLiveLocation } from './hooks/useLiveLocation';
import { useRouteOptions } from './hooks/useRouteOptions';
import { useRecording } from './hooks/useRecording';
import { useRouteCalculation } from './hooks/useRouteCalculation';
import { usePersistence } from './hooks/usePersistence';
import { useVoiceGuidance } from './hooks/useVoiceGuidance';
import { useFilterState } from './hooks/useFilterState';
import { usePoiState } from './hooks/usePoiState';
import { useMultiRouteState } from './hooks/useMultiRouteState';
import { useMapDisplayState } from './hooks/useMapDisplayState';
import { useUiState } from './hooks/useUiState';
import { useNavState } from './hooks/useNavState';
import { HelpDrawer } from './components/drawers/HelpDrawer';
import { SourcesDrawer } from './components/drawers/SourcesDrawer';
import { SupportDrawer } from './components/drawers/SupportDrawer';
import { AboutDrawer } from './components/drawers/AboutDrawer';
import { ResumeNavDialog } from './components/modals/ResumeNavDialog';
import { MiniOverlay } from './components/modals/MiniOverlay';
import { FilterPanel } from './components/panels/left/FilterPanel';
import { IncidentFiltersPanel } from './components/panels/left/IncidentFiltersPanel';
import { LabelPreferencesPanel } from './components/panels/left/LabelPreferencesPanel';
import { SearchPanel } from './components/panels/left/SearchPanel';
import { RecordingPanel } from './components/panels/left/RecordingPanel';
import { NavigationPanel } from './components/panels/left/NavigationPanel';
import { MultiRoutePanel } from './components/panels/left/MultiRoutePanel';
import { PoiPanel } from './components/panels/left/PoiPanel';
import { HeaderBar } from './components/layout/HeaderBar';
import { MapOverlays } from './components/layout/MapOverlays';
import { AnalyticsPanel } from './components/panels/AnalyticsPanel';
import { LeftPanel } from './components/layout/LeftPanel';
import { useMiniWindow } from './hooks/useMiniWindow';
import { useSearchResults } from './hooks/useSearchResults';
import { useCurrentTurnInstruction } from './hooks/useCurrentTurnInstruction';
import { useIncidentStats } from './hooks/useIncidentStats';
import { useIncidentDistances } from './hooks/useIncidentDistances';
import { useNavPoints } from './hooks/useNavPoints';
import { Footer } from './components/layout/Footer';
import { useMapCallbacks } from './hooks/useMapCallbacks';
import { useToastNotification } from './hooks/useToastNotification';
import { useAppUtilities } from './hooks/useAppUtilities';
import { useQrImportHandlers } from './hooks/useQrImportHandlers';
import { usePanelCallbacks } from './hooks/usePanelCallbacks';
import { useViewReset } from './hooks/useViewReset';
import { useAppOrchestration } from './hooks/useAppOrchestration';

export default function App() {
  const {
    initialRecordingSessionRef, initialMapViewRef, recordingStatus, setRecordingStatus,
    recordingWatchId, setRecordingWatchId, recordedTrack, setRecordedTrack,
    recordingName, setRecordingName, recordingState, showToast, toastTimeoutRef,
    handleMapViewChange, lastDistToDestMRef, filterState, poiState, multiRouteState,
    mapDisplayState, uiState, navState,
  } = useAppOrchestration();

  const { yearFrom, setYearFrom, yearTo, setYearTo, typeFilter, setTypeFilter, sevFilter, setSevFilter, query, setQuery, selectedId, setSelectedId } = filterState;

  // Compute years array for FilterPanel
  const minYear = Math.min(...incidents.map(i => i.year));
  const maxYear = Math.max(...incidents.map(i => i.year));
  const years = Array.from({ length: maxYear - minYear + 1 }, (_, idx) => minYear + idx);
  const { addPoiMode, setAddPoiMode, poiDraft, setPoiDraft, poiName, setPoiName, poiDescription, setPoiDescription, poiMarkerColor, setPoiMarkerColor, poiMarkerShape, setPoiMarkerShape, poiMarkerSize, setPoiMarkerSize, customPois, setCustomPois } = poiState;
  const { multiRouteBuildMode, setMultiRouteBuildMode, multiRouteDraftPoints, setMultiRouteDraftPoints, multiRouteName, setMultiRouteName, multiRouteDescription, setMultiRouteDescription, multiRouteDifficulty, setMultiRouteDifficulty, multiRoutePassability, setMultiRoutePassability, savedMultiRoutes, setSavedMultiRoutes, activeMultiRoute, setActiveMultiRoute } = multiRouteState;
  const { visible, setVisible, largeLabels, setLargeLabels, allLabels, setAllLabels, focusTarget, setFocusTarget, liveFollowDetached, setLiveFollowDetached, liveCenterRequestId, setLiveCenterRequestId, mapSearchQuery, setMapSearchQuery } = mapDisplayState;
  const { themeMode, setThemeMode, autoDay, setAutoDay, panelsCollapsed, setPanelsCollapsed, panelHeightPct, setPanelHeightPct, panelDragRef, panelRef, miniOverlayOpen, setMiniOverlayOpen, miniStatus, setMiniStatus, drawerOpen, setDrawerOpen, helpOpen, setHelpOpen, aboutOpen, setAboutOpen, transferOpen, setTransferOpen, supportOpen, setSupportOpen, donationCopied, setDonationCopied, toastMessage, setToastMessage, resumeNavDialog, setResumeNavDialog, measureMode, setMeasureMode, manualMeasure, setManualMeasure, miniExternalWindowRef } = uiState;
  const { initialNavSessionRef, navStartId, setNavStartId, navEndId, setNavEndId, navStartQuery, setNavStartQuery, navEndQuery, setNavEndQuery, roadRoute, setRoadRoute, footRoute, setFootRoute, alternativeRoute, setAlternativeRoute, activeRouteIndex, setActiveRouteIndex, routeStatus, setRouteStatus, footRouteStatus, setFootRouteStatus, routeName, setRouteName, savedRoutes, setSavedRoutes, activeSavedRoute, setActiveSavedRoute, liveLocation, setLiveLocation, navPosition, setNavPosition, navPositionRef, locationStatus, setLocationStatus, watchId, setWatchId, compassMode, setCompassMode, userMapRotation, setUserMapRotation, handleUserRotationChange, resetMapRotation, rotationLocked, setRotationLocked, snapPickerOpen, setSnapPickerOpen, handleSnapRotation, toggleRotationLock, routeDisplayMode, setRouteDisplayMode, activeRouteId, setActiveRouteId, navCustomEnd, setNavCustomEnd, navCustomStart, setNavCustomStart, navScaleLabel, setNavScaleLabel } = navState;

  const mapViewRef = useRef<MapHandle>(null);
  const panelsCollapseIsFirstMount = useRef(true);
  const recordedTrackRef = useRef<[number, number][]>([]);
  const lastVoiceRouteRef = useRef('');
  const lastVoiceProgressRef = useRef<{ at: number; bucket: number | null }>({ at: 0, bucket: null });
  const lastTurnVoiceRef = useRef<{ key: string; at: number }>({ key: '', at: 0 });
  const resumedLiveRef = useRef(false);
  const resumedRecordingRef = useRef(false);
  const liveToastShownRef = useRef(false);

  const [voiceGuidance, setVoiceGuidance] = useState<VoiceGuidanceMode>(() => loadLocalNavSession()?.voiceGuidance ?? 'off');
  const [voiceLanguage, setVoiceLanguage] = useState<VoiceLanguage>(() => loadLocalNavSession()?.voiceLanguage ?? 'he');
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'speaking' | 'unsupported'>('idle');

  useEffect(() => {
    return () => {
      if (watchId !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchId);
      }
      if (recordingWatchId !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(recordingWatchId);
      }
    };
  }, [watchId, recordingWatchId]);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current !== null) {
        window.clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    recordedTrackRef.current = recordedTrack;
  }, [recordedTrack]);

  const effectiveTheme: 'light' | 'dark' = themeMode === 'auto' ? (autoDay ? 'light' : 'dark') : themeMode;

  useEffect(() => {
    document.documentElement.classList.toggle('theme-light', effectiveTheme === 'light');
    document.documentElement.classList.toggle('theme-dark', effectiveTheme === 'dark');
  }, [effectiveTheme]);

  const filtered = useMemo(() => {
    const q = clean(query);
    return incidents.filter(i => {
      if (i.year < yearFrom || i.year > yearTo) return false;
      if (!typeFilter.has(i.type)) return false;
      if (!sevFilter.has(i.severity)) return false;
      if (q && !clean(`${i.title_he} ${i.desc_he} ${i.source_label} ${TYPE_LABEL[i.type]} ${SEV_LABEL[i.severity]}`).includes(q)) return false;
      return true;
    });
  }, [yearFrom, yearTo, typeFilter, sevFilter, query]);

  const { searchResults, mapSearchResults } = useSearchResults({
    query, mapSearchQuery, customPois, towns, incidents,
    unifilPoints, terrainFeatures, influenceZones,
  });

  const selected = useMemo(
    () => filtered.find(i => i.id === selectedId) || incidents.find(i => i.id === selectedId) || null,
    [selectedId, filtered]
  );

  // distance from each filtered incident to the Blue Line
  const { distances, distanceById } = useIncidentDistances({ filtered, blueLine });

  // selected incident → distance line on map
  const distanceLine = useMemo<[[number, number], [number, number]] | null>(() => {
    if (!selected) return null;
    const d = distanceById.get(selected.id);
    if (!d) {
      const d2 = distanceToPolyline([selected.lat, selected.lon], blueLine);
      return [[selected.lat, selected.lon], d2.nearest];
    }
    return [[selected.lat, selected.lon], d.nearest];
  }, [selected, distanceById]);

  // analytics
  const stats = useMemo(() => {
    const ds = distances.map(d => d.km);
    const sum = ds.reduce((s, x) => s + x, 0);
    return {
      total: filtered.length,
      min: ds.length ? Math.min(...ds) : NaN,
      max: ds.length ? Math.max(...ds) : NaN,
      avg: ds.length ? sum / ds.length : NaN,
      byType: TYPES.map(t => ({ type: t, n: filtered.filter(f => f.type === t).length })),
      bySev: SEVS.map(s => ({ sev: s, n: filtered.filter(f => f.severity === s).length })),
    };
  }, [filtered, distances]);

  const toggleSet = (set: Set<string>, item: string): Set<string> => {
    const next = new Set(set);
    if (next.has(item)) next.delete(item); else next.add(item);
    return next;
  };

  const onMapClick = useCallback((latlng: { lat: number; lon: number }) => {
    if (multiRouteBuildMode) {
      const newPoint = { lat: latlng.lat, lon: latlng.lon, label: `נקודה ${multiRouteDraftPoints.length + 1}`, order: multiRouteDraftPoints.length };
      setMultiRouteDraftPoints(prev => prev.length >= MAX_MULTI_ROUTE_POINTS ? prev : [...prev, newPoint]);
      return;
    }
    if (addPoiMode) {
      setPoiDraft({ lat: latlng.lat, lon: latlng.lon });
    } else if (measureMode) {
      setManualMeasure(prev => {
        if (prev.length === 2) return [[latlng.lat, latlng.lon]];
        return [...prev, [latlng.lat, latlng.lon]];
      });
    } else {
      // Show navigation popup for regular map click
      setFocusTarget({
        lat: latlng.lat,
        lon: latlng.lon,
        zoom: 12,
        id: `map-click-${Date.now()}`,
      });
      setSelectedId(null);
    }
  }, [addPoiMode, measureMode, multiRouteBuildMode, multiRouteDraftPoints.length, setFocusTarget, setSelectedId]);

  const manualKm = manualMeasure.length === 2 ? haversineKm(manualMeasure[0], manualMeasure[1]) : null;
  const recordedKm = useMemo(() => {
    return recordedTrack.slice(1).reduce((sum, point, idx) => sum + haversineKm(recordedTrack[idx], point), 0);
  }, [recordedTrack]);

  const { beginRecordingWatch: hookBeginRecordingWatch, startRecording: hookStartRecording, stopRecording: hookStopRecording, recordingToRoute: hookRecordingToRoute, saveRecording: hookSaveRecording } = useRecording({
    recordedTrack,
    recordingName,
    recordedKm,
    setRecordedTrack,
    setRecordingStatus,
    setRecordingWatchId,
    setLiveLocation,
    setSavedRoutes,
    setActiveSavedRoute,
    setRecordingName,
    showToast,
  });

  const navPoints = useMemo<NavPoint[]>(() => {
    const townPoints = towns.map(t => ({
      id: `town:${t.id}`,
      label: `${t.name_he} (${t.name_en})`,
      group: t.side === 'LB' ? 'יישובים בלבנון' : 'יישובי ייחוס בישראל',
      lat: t.lat,
      lon: t.lon,
    }));
    const unifilNavPoints = unifilPoints.map(u => ({
      id: `unifil:${u.id}`,
      label: u.name_he,
      group: 'נקודות יוניפי״ל ציבוריות',
      lat: u.lat,
      lon: u.lon,
    }));
    const terrainNavPoints = terrainFeatures.map(f => ({
      id: `terrain:${f.id}`,
      label: `${f.name_he} (${f.name_en})`,
      group: 'רכסים, הרים, נחלים ונהרות',
      lat: f.lat,
      lon: f.lon,
    }));
    const incidentPoints = incidents.map(i => ({
      id: `incident:${i.id}`,
      label: `${fmtDate(i.date)} · ${i.title_he}`,
      group: 'אירועים מדווחים',
      lat: i.lat,
      lon: i.lon,
    }));
    const customPoiPoints = customPois.map(p => ({
      id: `poi:${p.id}`,
      label: p.name,
      group: 'נקודות עניין אישיות',
      lat: p.lat,
      lon: p.lon,
    }));
    const customEnd: NavPoint[] = navCustomEnd ? [{
      id: 'custom-nav-end',
      label: navCustomEnd.label,
      group: 'ניווט מהיר',
      lat: navCustomEnd.lat,
      lon: navCustomEnd.lon,
    }] : [];
    const customStart: NavPoint[] = navCustomStart ? [{
      id: 'custom-nav-start',
      label: navCustomStart.label,
      group: 'ניווט מהיר',
      lat: navCustomStart.lat,
      lon: navCustomStart.lon,
    }] : [];
    const liveNavPoint: NavPoint[] = liveLocation ? [{
      id: 'live-location',
      label: 'מיקום נוכחי (GPS)',
      group: 'ניווט מהיר',
      lat: liveLocation.lat,
      lon: liveLocation.lon,
    }] : [];
    return [...liveNavPoint, ...customStart, ...customEnd, ...customPoiPoints, ...townPoints, ...terrainNavPoints, ...unifilNavPoints, ...incidentPoints];
  }, [customPois, navCustomEnd, navCustomStart, liveLocation]);

  const navStart = navPoints.find(p => p.id === navStartId) ?? null;
  const navEnd = navPoints.find(p => p.id === navEndId) ?? null;
  useRouteCalculation({
    navStartId,
    navEndId,
    navPoints,
    initialNavSessionRef,
    setRoadRoute,
    setAlternativeRoute,
    setActiveRouteIndex,
    setActiveSavedRoute,
    setFootRoute,
    setRouteStatus,
    setFootRouteStatus,
  });
  const { routeOptions, activeRouteOption, routeOverlaysMemo } = useRouteOptions({
    navStart,
    navEnd,
    roadRoute,
    footRoute,
    routeStatus,
    footRouteStatus: footRouteStatus,
    activeRouteId,
  });
  const navFollowZoom = NAV_SCALES.find(s => s.label === navScaleLabel)?.zoom ?? 15;
  const routePointMatches = (q: string) => {
    const term = clean(q);
    if (!term) return navPoints.slice(0, 8);
    return navPoints
      .filter(p => clean(`${p.label} ${p.group}`).includes(term))
      .slice(0, 8);
  };
  const startMatches = routePointMatches(navStartQuery);
  const endMatches = routePointMatches(navEndQuery);
  // Route calculation wired via useRouteCalculation hook above

  // calculatedRoute — stable ref, rebuilt only when endpoint IDs or active route change.
  // IMPORTANT: deps are navStartId/navEndId (strings), NOT navStart/navEnd objects.
  // navStart/navEnd are derived from navPoints which includes liveLocation, so their
  // object references change on every GPS tick → would rebuild and re-trigger Effect A
  // in Map.tsx on every GPS update → clearLayers every second = flickering route.
  const calculatedRoute = useMemo(() => {
    // Snapshot coords at compute time — avoids stale closure
    const start = navPoints.find(p => p.id === navStartId) ?? null;
    const end   = navPoints.find(p => p.id === navEndId)   ?? null;
    if (!start || !end || start.id === end.id) return null;
    const fallbackKm = haversineKm([start.lat, start.lon], [end.lat, end.lon]);
    return {
      start: { lat: start.lat, lon: start.lon, label: start.label },
      end:   { lat: end.lat,   lon: end.lon,   label: end.label },
      km: activeRouteOption?.km ?? fallbackKm,
      durationMin: activeRouteOption?.durationMin,
      path: activeRouteOption?.path,
      instructions: activeRouteOption?.instructions,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navStartId, navEndId, navPoints, activeRouteOption]);

  // navigationRoute — stable ref
  const navigationRoute = useMemo(() => {
    if (activeSavedRoute) {
      return {
        start: activeSavedRoute.start,
        end: activeSavedRoute.end,
        km: activeSavedRoute.km,
        durationMin: activeSavedRoute.durationMin,
        path: activeSavedRoute.path,
        instructions: activeSavedRoute.instructions,
      };
    }
    return calculatedRoute;
  }, [activeSavedRoute, calculatedRoute]);

  // Route overlays memoized via useRouteOptions hook above

  // Keep lastDistToDestMRef in sync so the nav-session save effect can read it
  // without creating a forward-reference TypeScript error.
  useEffect(() => {
    if (navPosition && navigationRoute) {
      lastDistToDestMRef.current = haversineKm(
        [navPosition.lat, navPosition.lon],
        [navigationRoute.end.lat, navigationRoute.end.lon],
      ) * 1000;
    } else {
      lastDistToDestMRef.current = undefined;
    }
  }, [navPosition, navigationRoute]);

  const mapBearing = useMemo(() => {
    if (typeof liveLocation?.heading === 'number' && isFinite(liveLocation.heading)) {
      return liveLocation.heading;
    }
    if (recordedTrack.length >= 2) {
      return bearingDegrees(recordedTrack[recordedTrack.length - 2], recordedTrack[recordedTrack.length - 1]);
    }
    const line = navigationRoute?.path;
    if (line && line.length >= 2) return bearingDegrees(line[0], line[1]);
    if (navigationRoute) {
      return bearingDegrees(
        [navigationRoute.start.lat, navigationRoute.start.lon],
        [navigationRoute.end.lat, navigationRoute.end.lon]
      );
    }
    return 0;
  }, [liveLocation, recordedTrack, navigationRoute]);

  const currentTurnInstruction = useCurrentTurnInstruction({
    navigationRoute, navPosition, mapBearing,
  });

  const { setVoiceMode, testVoiceGuidance } = useVoiceGuidance({
    voiceGuidance,
    voiceLanguage,
    navigationRoute,
    routeStatus,
    currentTurnInstruction,
    navPosition,
    mapBearing,
    liveLocation,
    setVoiceGuidance,
    setVoiceStatus,
  });

  // Voice guidance wired via useVoiceGuidance hook above

  const { downloadJson } = useAppUtilities({ showToast });

  const multiRouteTotalKm = useMemo(() => {
    if (multiRouteDraftPoints.length < 2) return 0;
    return multiRouteDraftPoints.slice(1).reduce((sum, pt, idx) =>
      sum + haversineKm([multiRouteDraftPoints[idx].lat, multiRouteDraftPoints[idx].lon], [pt.lat, pt.lon]), 0);
  }, [multiRouteDraftPoints]);

  const saveMultiRoute = () => {
    if (multiRouteDraftPoints.length < 2) return;
    const name = safeText(multiRouteName, `מסלול ${savedMultiRoutes.length + 1}`) || `מסלול ${savedMultiRoutes.length + 1}`;
    const route: MultiPointRoute = {
      id: `multi-${Date.now()}`,
      name,
      description: safeText(multiRouteDescription, ''),
      difficulty: multiRouteDifficulty,
      passability: multiRoutePassability,
      points: multiRouteDraftPoints,
      totalKm: multiRouteTotalKm,
      createdAt: new Date().toISOString(),
    };
    setSavedMultiRoutes(prev => [route, ...prev]);
    setActiveMultiRoute(route);
    setMultiRouteDraftPoints([]);
    setMultiRouteName('');
    setMultiRouteDescription('');
    setMultiRouteBuildMode(false);
    showToast(`המסלול "${route.name}" נשמר`);
  };

  const exportMultiRoute = (route: MultiPointRoute) => {
    downloadJson(`multi-route-${route.name.replace(/\s+/g, '-')}.json`, route);
  };

  const loadMultiRoute = (route: MultiPointRoute) => {
    setActiveMultiRoute(route);
    if (route.points.length >= 2) {
      const lats = route.points.map(p => p.lat);
      const lons = route.points.map(p => p.lon);
      setFocusTarget({
        lat: (Math.min(...lats) + Math.max(...lats)) / 2,
        lon: (Math.min(...lons) + Math.max(...lons)) / 2,
        zoom: 11,
        id: `multi-route-${route.id}-${Date.now()}`,
      });
    }
    showToast(`המסלול "${route.name}" נטען למפה`);
  };

  const saveCurrentRoute = () => {
    if (!navigationRoute) return;
    const fallbackName = `${navigationRoute.start.label} ← ${navigationRoute.end.label}`;
    const route: SavedRoute = {
      id: `route-${Date.now()}`,
      name: safeText(routeName, fallbackName) || fallbackName,
      createdAt: new Date().toISOString(),
      startId: navStartId || undefined,
      endId: navEndId || undefined,
      start: navigationRoute.start,
      end: navigationRoute.end,
      km: navigationRoute.km,
      durationMin: navigationRoute.durationMin,
      path: navigationRoute.path,
      instructions: navigationRoute.instructions,
    };
    setSavedRoutes(prev => [route, ...prev]);
    setActiveSavedRoute(route);
    setRouteName('');
    showToast(`המסלול “${route.name}” נשמר בזיכרון המקומי`);
  };

  const loadSavedRoute = (route: SavedRoute) => {
    setActiveSavedRoute(route);
    setRoadRoute(route.path ? {
      km: route.km,
      durationMin: route.durationMin ?? 0,
      path: route.path,
      instructions: route.instructions,
    } : null);
    setFocusTarget({
      lat: (route.start.lat + route.end.lat) / 2,
      lon: (route.start.lon + route.end.lon) / 2,
      zoom: 11,
      id: `saved-${route.id}-${Date.now()}`,
    });
    showToast(`המסלול “${route.name}” נטען למפה`);
  };

  const beginLiveLocationWatch = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setLocationStatus('error');
      showToast('הדפדפן אינו תומך במיקום חי');
      return null;
    }
    const id = navigator.geolocation.watchPosition(
      pos => {
        setLiveLocation({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          heading: pos.coords.heading,
        });
        setLocationStatus('watching');
        if (!liveToastShownRef.current) {
          liveToastShownRef.current = true;
          showToast('מיקום חי הופעל והמפה תתמקד בסמן');
        }
      },
      () => {
        setLocationStatus('error');
        showToast('לא ניתן לקרוא מיקום. בדוק הרשאת מיקום בדפדפן');
      },
      { enableHighAccuracy: true, maximumAge: 5_000, timeout: 15_000 }
    );
    setWatchId(id);
    setLocationStatus('watching');
    return id;
  }, [liveToastShownRef, showToast]);

  const toggleLiveLocation = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setLocationStatus('idle');
      setLiveLocation(null);
      setLiveFollowDetached(false);
      liveToastShownRef.current = false;
      showToast('מיקום חי כובה');
      return;
    }
    setLiveFollowDetached(false);
    liveToastShownRef.current = false;
    showToast('מבקש הרשאת מיקום מהמכשיר…');
    beginLiveLocationWatch();
  };

  // ---- Navigate from current position ----
  // If GPS is already active, sets live-location as start and the given point as end.
  // If GPS is not active, starts GPS watch first, then sets up the route.
  const navigateFromCurrentPosition = useCallback((toLat: number, toLon: number, toLabel: string) => {
    setNavCustomEnd({ lat: toLat, lon: toLon, label: toLabel });
    setNavEndId('custom-nav-end');
    setNavEndQuery(toLabel);
    if (liveLocation) {
      // GPS already active — set live position as start immediately
      setNavStartId('live-location');
      setNavStartQuery('מיקום נוכחי (GPS)');
      showToast(`מנווט ממיקומך אל ${toLabel}`);
    } else {
      // No GPS yet — prompt the user to also set a start point.
      // Clear any previous start so the route doesn’t silently use stale data.
      setNavStartId('');
      setNavStartQuery('');
      showToast(`יעד נקבע: ${toLabel}. קבע גם נקודת מוצא או הפעל GPS`);
    }
    // Open side panel if collapsed, then scroll to nav section.
    setPanelsCollapsed(false);
    requestAnimationFrame(() =>
      document.getElementById('nav-section')?.scrollIntoView({ behavior: 'smooth' })
    );
  }, [liveLocation, showToast]);

  // Sets a map-tapped point as navigation start (from popup "הגדר כנקודת מוצא" button)
  const setMapPointAsNavStart = useCallback((lat: number, lon: number, label: string) => {
    setNavCustomStart({ lat, lon, label });
    setNavStartId('custom-nav-start');
    setNavStartQuery(label);
    showToast(`נקודת מוצא נקבעה: ${label}`);
    setPanelsCollapsed(false);
    requestAnimationFrame(() =>
      document.getElementById('nav-section')?.scrollIntoView({ behavior: 'smooth' })
    );
  }, [showToast]);

  // ---- Invalidate Leaflet map size whenever panels collapse/expand ----
  //
  // WHY snapshotCenter is NOT called here:
  // useEffect runs AFTER React commits the DOM — the CSS class panels-collapsed
  // has already been applied, the CSS grid has already changed, and
  // container.clientHeight already reflects the new size. If we called
  // snapshotCenter() here, map.getCenter() would compute from _pixelOrigin
  // (built for the OLD size) and viewHalf (now the NEW size) → wrong geo-center.
  //
  // Instead, snapshotCenter() is called from handlePanelToggle() SYNCHRONOUSLY
  // before setPanelsCollapsed(), while the DOM still has the old layout.
  useEffect(() => {
    if (panelsCollapseIsFirstMount.current) {
      panelsCollapseIsFirstMount.current = false;
      // On first mount: invalidate so Leaflet measures the real container size.
      // No snapshot needed — the map is still restoring from localStorage.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          mapViewRef.current?.invalidateSize();
        });
      });
      return;
    }
    // snapshotCenter() was already called synchronously in handlePanelToggle.
    // Double rAF: frame 1 → CSS grid layout settles; frame 2 → Leaflet
    // measures the new clientHeight and setView anchors the correct geo-center.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        mapViewRef.current?.invalidateSize();
      });
    });
  }, [panelsCollapsed]);

  // ---- Panel toggle — snapshot center BEFORE DOM change ----
  //
  // Calling snapshotCenter() here is the ONLY safe place: we are still in the
  // synchronous click-event handler, the CSS class has NOT been applied yet,
  // the CSS grid still has its OLD dimensions, and Leaflet's internal
  // _pixelOrigin was computed for the OLD size. map.getCenter() therefore
  // returns the correct geo-center. The double-rAF in the useEffect above
  // will call invalidateSize() once the new layout has settled, which calls
  // setView(snapshotted-center) to lock the viewport on that geo-center.
  const { handlePanelToggle, handlePanelDragStart, handlePanelDragMove, handlePanelDragEnd: dragEnd } = usePanelCallbacks({
    panelsCollapsed, setPanelsCollapsed: v => { mapViewRef.current?.snapshotCenter(); setPanelsCollapsed(v); },
    panelDragRef, panelHeightPct, setPanelHeightPct,
  });

  const handlePanelDragEnd = useCallback(() => {
    dragEnd();
    // Snap to nearest anchor: 8%, 20%, 35%, 50%, 65%, 78%, 90%
    setPanelHeightPct(prev => {
      const anchors = [8, 20, 35, 50, 65, 78, 90];
      return anchors.reduce((best, a) => Math.abs(a - prev) < Math.abs(best - prev) ? a : best, anchors[2]);
    });
  }, []);

  const handleLiveFollowDetachedChange = useCallback((detached: boolean) => {
    setLiveFollowDetached(detached);
  }, []);

  const centerLiveLocation = useCallback(() => {
    if (!liveLocation) return;
    setLiveFollowDetached(false);
    setLiveCenterRequestId(value => value + 1);
    setFocusTarget({
      lat: liveLocation.lat,
      lon: liveLocation.lon,
      zoom: 17,
      id: `live-center-${Date.now()}`,
    });
    showToast('המפה חזרה להתמקד במיקום החי');
  }, [liveLocation, showToast]);

  // Recording functions wired via useRecording hook above
  const beginRecordingWatch = hookBeginRecordingWatch;
  const startRecording = hookStartRecording;
  const stopRecording = hookStopRecording;
  const recordingToRoute = hookRecordingToRoute;
  const saveRecording = hookSaveRecording;

  const importRoutes = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_ROUTE_FILE_BYTES) {
      setRouteStatus('error');
      showToast('קובץ המסלול גדול מדי לייבוא');
      return;
    }
    let data: unknown;
    try {
      const text = await file.text();
      data = JSON.parse(text);
    } catch {
      setRouteStatus('error');
      showToast('לא ניתן לקרוא את קובץ המסלול');
      return;
    }
    const routes = (Array.isArray(data) ? data : [data]).slice(0, MAX_IMPORTED_ROUTES);
    const valid = routes.filter((r: SavedRoute) =>
      r &&
      r.start &&
      r.end &&
      typeof r.start.lat === 'number' &&
      typeof r.start.lon === 'number' &&
      typeof r.end.lat === 'number' &&
      typeof r.end.lon === 'number' &&
      Math.abs(r.start.lat) <= 90 &&
      Math.abs(r.end.lat) <= 90 &&
      Math.abs(r.start.lon) <= 180 &&
      Math.abs(r.end.lon) <= 180
    ).map((r: SavedRoute) => ({
      id: safeText(r.id) || `route-${Date.now()}-${Math.random()}`,
      name: safeText(r.name, 'מסלול מיובא') || 'מסלול מיובא',
      createdAt: safeText(r.createdAt, new Date().toISOString()) || new Date().toISOString(),
      startId: safeText(r.startId),
      endId: safeText(r.endId),
      start: {
        lat: r.start.lat,
        lon: r.start.lon,
        label: safeText(r.start.label, 'נקודת מוצא') || 'נקודת מוצא',
      },
      end: {
        lat: r.end.lat,
        lon: r.end.lon,
        label: safeText(r.end.label, 'יעד') || 'יעד',
      },
      km: typeof r.km === 'number' && isFinite(r.km) && r.km >= 0 ? r.km : haversineKm([r.start.lat, r.start.lon], [r.end.lat, r.end.lon]),
      durationMin: typeof r.durationMin === 'number' && isFinite(r.durationMin) && r.durationMin >= 0 ? r.durationMin : undefined,
      path: Array.isArray(r.path)
        ? r.path
            .slice(0, MAX_ROUTE_POINTS)
            .filter((p): p is [number, number] =>
              Array.isArray(p) &&
              p.length >= 2 &&
              typeof p[0] === 'number' &&
              typeof p[1] === 'number' &&
              Math.abs(p[0]) <= 90 &&
              Math.abs(p[1]) <= 180
            )
        : undefined,
      instructions: normalizeRouteInstructions(r.instructions),
    }));
    if (valid.length) {
      setSavedRoutes(prev => [...valid, ...prev]);
      showToast(`${valid.length} מסלולים יובאו בהצלחה`);
    } else {
      showToast('לא נמצאו מסלולים תקינים בקובץ');
    }
  };

  const savePoi = () => {
    if (!poiDraft) return;
    const name = safeText(poiName, `נקודת עניין ${customPois.length + 1}`) || `נקודת עניין ${customPois.length + 1}`;
    const description = safeText(poiDescription, 'נקודה שהמשתמש הוסיף למפה');
    const poi: CustomPoi = {
      id: `poi-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      description,
      lat: poiDraft.lat,
      lon: poiDraft.lon,
      createdAt: new Date().toISOString(),
      markerColor: poiMarkerColor,
      markerShape: poiMarkerShape,
      markerSize: poiMarkerSize,
    };
    setCustomPois(prev => [poi, ...prev]);
    setPoiDraft(null);
    setPoiName('');
    setPoiDescription('');
    setAddPoiMode(false);
    showToast(`נקודת העניין “${poi.name}” נשמרה`);
  };

  const importPois = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_POI_FILE_BYTES) {
      showToast('קובץ נקודות העניין גדול מדי לייבוא');
      return;
    }
    let data: unknown;
    try {
      const text = await file.text();
      data = JSON.parse(text);
    } catch {
      showToast('לא ניתן לקרוא את קובץ נקודות העניין');
      return;
    }
    const items = (Array.isArray(data) ? data : [data]).slice(0, MAX_IMPORTED_POIS);
    const valid = items.map(normalizePoi).filter((p): p is CustomPoi => Boolean(p));
    if (valid.length) {
      setCustomPois(prev => [...valid, ...prev]);
      showToast(`${valid.length} נקודות עניין יובאו בהצלחה`);
    } else {
      showToast('לא נמצאו נקודות עניין תקינות בקובץ');
    }
  };

  // ── QR Transfer import handlers ──────────────────────────────────────────
  const handleQrImportPois = useCallback((pois: TransferPoi[]) => {
    const valid = (pois as unknown as Partial<CustomPoi>[]).map(normalizePoi).filter((p): p is CustomPoi => Boolean(p));
    if (!valid.length) return;
    // deduplicate: skip pois whose id already exists
    setCustomPois(prev => {
      const existingIds = new Set(prev.map(p => p.id));
      const fresh = valid.filter(p => !existingIds.has(p.id));
      if (!fresh.length) return prev;
      showToast(`${fresh.length} נקודות עניין יובאו מברקוד`);
      return [...fresh, ...prev];
    });
  }, []);

  const { handleQrImportRoutes, handleQrImportMultiRoutes, handleQrImportRecording } = useQrImportHandlers({
    setSavedRoutes, setSavedMultiRoutes, setRecordedTrack, setRecordingName,
    setCustomPois, showToast,
  });
  // ────────────────────────────────────────────────────────────────────────────

  const shareCurrentApp = async () => {
    const shareData = {
      title: 'מפת מרחב דרום לבנון',
      text: 'מפה אינטראקטיבית חינוכית של מרחב דרום לבנון עד נהר הליטני',
      url: window.location.href,
    };
    if (navigator.share) {
      await navigator.share(shareData);
      return;
    }
    await navigator.clipboard?.writeText(window.location.href);
  };

  const openDonationLink = () => {
    const opened = window.open(DONATION_CONTACT_URL, '_blank', 'noopener,noreferrer');
    if (!opened) {
      window.location.href = DONATION_CONTACT_URL;
    }
  };

  const copyDonationLink = async () => {
    await navigator.clipboard?.writeText(DONATION_CONTACT_URL);
    setDonationCopied(true);
    window.setTimeout(() => setDonationCopied(false), 2200);
  };

  const visibleKey = (k: keyof LayerVis) => () =>
    setVisible(v => ({ ...v, [k]: !v[k] }));

  const { resetView } = useViewReset({
    setVisible, setThemeMode, setLargeLabels, setAllLabels, setCompassMode,
    setMeasureMode, setManualMeasure, setSelectedId, setLiveFollowDetached,
    setRotationLocked, setUserMapRotation,
  });

  const handleResetView = useCallback(() => {
    resetView();
    setFocusTarget({
      ...DEFAULT_MAP_VIEW,
      id: `reset-view-${Date.now()}`,
    });
    showToast('התצוגה אופסה לברירת המחדל');
  }, [resetView, showToast]);

  const miniNavSvgMarkup = () => {
    const routePoints = navigationRoute?.path && navigationRoute.path.length >= 2
      ? navigationRoute.path
      : navigationRoute
        ? [
            [navigationRoute.start.lat, navigationRoute.start.lon],
            [navigationRoute.end.lat, navigationRoute.end.lon],
          ] as [number, number][]
        : recordedTrack.length >= 2
          ? recordedTrack
          : [];
    const livePoint: [number, number] | null = liveLocation ? [liveLocation.lat, liveLocation.lon] : null;
    const allPoints = livePoint ? [...routePoints, livePoint] : routePoints;

    if (allPoints.length < 2) {
      return `<svg class="mini-nav-svg" viewBox="0 0 320 132" role="img" aria-label="אין מסלול להצגה">
        <rect x="1" y="1" width="318" height="130" rx="18" class="mini-nav-bg" />
        <path d="M34 92 C82 50 126 78 172 44 S252 42 286 76" class="mini-nav-placeholder" />
        <circle cx="34" cy="92" r="5" class="mini-nav-muted-dot" />
        <circle cx="286" cy="76" r="5" class="mini-nav-muted-dot" />
        <text x="160" y="69" text-anchor="middle" class="mini-nav-empty">בחר מסלול או התחל הקלטה</text>
      </svg>`;
    }

    const width = 320;
    const height = 132;
    const pad = 18;
    const lats = allPoints.map(p => p[0]);
    const lons = allPoints.map(p => p[1]);
    let minLat = Math.min(...lats);
    let maxLat = Math.max(...lats);
    let minLon = Math.min(...lons);
    let maxLon = Math.max(...lons);
    if (Math.abs(maxLat - minLat) < 0.01) {
      minLat -= 0.005;
      maxLat += 0.005;
    }
    if (Math.abs(maxLon - minLon) < 0.01) {
      minLon -= 0.005;
      maxLon += 0.005;
    }
    const project = ([lat, lon]: [number, number]) => {
      const x = pad + ((lon - minLon) / (maxLon - minLon)) * (width - pad * 2);
      const y = pad + ((maxLat - lat) / (maxLat - minLat)) * (height - pad * 2);
      return [Number(x.toFixed(1)), Number(y.toFixed(1))] as [number, number];
    };
    const routePath = routePoints.map(project).map(([x, y], idx) => `${idx === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ');
    const recordingPath = recordedTrack.length >= 2
      ? recordedTrack.map(project).map(([x, y], idx) => `${idx === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ')
      : '';
    const start = project(routePoints[0]);
    const end = project(routePoints[routePoints.length - 1]);
    const current = livePoint ? project(livePoint) : recordedTrack.length >= 1 ? project(recordedTrack[recordedTrack.length - 1]) : end;
    const bearing = Math.round(mapBearing);
    const modeLabel = navigationRoute ? 'מסלול פעיל' : recordedTrack.length >= 2 ? 'הקלטה פעילה' : 'מיני ניווט';

    return `<svg class="mini-nav-svg" viewBox="0 0 320 132" role="img" aria-label="${miniEscape(modeLabel)}">
      <rect x="1" y="1" width="318" height="130" rx="18" class="mini-nav-bg" />
      <path d="M24 36 H296 M24 66 H296 M24 96 H296 M76 18 V114 M160 18 V114 M244 18 V114" class="mini-nav-gridline" />
      ${recordingPath ? `<path d="${recordingPath}" class="mini-nav-recording" />` : ''}
      ${routePath ? `<path d="${routePath}" class="mini-nav-route" />` : ''}
      <circle cx="${start[0]}" cy="${start[1]}" r="5.5" class="mini-nav-start" />
      <circle cx="${end[0]}" cy="${end[1]}" r="5.5" class="mini-nav-end" />
      <g transform="translate(${current[0]} ${current[1]}) rotate(${bearing})">
        <path d="M0 -12 L7 8 L0 4 L-7 8 Z" class="mini-nav-live" />
      </g>
      <circle cx="${current[0]}" cy="${current[1]}" r="13" class="mini-nav-pulse" />
      <text x="18" y="23" class="mini-nav-label">${miniEscape(modeLabel)}</text>
      <text x="302" y="116" text-anchor="end" class="mini-nav-bearing">${bearing}°</text>
    </svg>`;
  };

  const miniWindowHtml = () => {
    const title = navigationRoute
      ? `${navigationRoute.start.label} ← ${navigationRoute.end.label}`
      : 'אין מסלול פעיל';
    const distance = navigationRoute ? fmtKm(navigationRoute.km) : '—';
    const duration = navigationRoute?.durationMin ? `${Math.round(navigationRoute.durationMin)} דק׳` : '—';
    const location = liveLocation ? `${liveLocation.lat.toFixed(5)}, ${liveLocation.lon.toFixed(5)}` : 'לא פעיל';
    const recording = recordedTrack.length ? `${recordedTrack.length} נק׳ · ${fmtKm(recordedKm)}` : 'לא פעילה';
    const turn = currentTurnInstruction?.text ?? 'אין הוראת פנייה זמינה';
    const miniMap = miniNavSvgMarkup();
    return `<!doctype html>
<html lang="he" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>מפת מצב — חלון מוקטן</title>
  <style>
    :root { color-scheme: dark; font-family: system-ui, "Segoe UI", sans-serif; background:#0f1217; color:#d8dee8; }
    body { margin:0; padding:14px; background:linear-gradient(145deg,#0f1217,#17202a); }
    .card { border:1px solid #2c3645; border-radius:16px; padding:14px; box-shadow:0 10px 30px rgba(0,0,0,.35); }
    h1 { margin:0 0 8px; font-size:15px; color:#6ed1c2; }
    .route { font-weight:800; line-height:1.4; margin-bottom:10px; }
    .mini-nav { margin:10px 0; border:1px solid #232b38; border-radius:16px; overflow:hidden; background:#0b0d10; }
    .mini-nav-svg { display:block; width:100%; height:auto; }
    .mini-nav-bg { fill:#111821; stroke:#2c3645; }
    .mini-nav-gridline { stroke:rgba(255,255,255,.08); stroke-width:1; }
    .mini-nav-route { fill:none; stroke:#6ed1c2; stroke-width:5; stroke-linecap:round; stroke-linejoin:round; }
    .mini-nav-recording { fill:none; stroke:#f6c453; stroke-width:3; stroke-linecap:round; stroke-linejoin:round; stroke-dasharray:7 6; opacity:.9; }
    .mini-nav-start { fill:#88c37a; stroke:#0b0d10; stroke-width:2; }
    .mini-nav-end { fill:#d96b6b; stroke:#0b0d10; stroke-width:2; }
    .mini-nav-live { fill:#5a8fbf; stroke:#eaf7ff; stroke-width:1.6; filter:drop-shadow(0 4px 8px rgba(0,0,0,.45)); }
    .mini-nav-pulse { fill:none; stroke:#5a8fbf; stroke-width:2; opacity:.35; }
    .mini-nav-placeholder { fill:none; stroke:#6ed1c2; stroke-width:4; stroke-linecap:round; stroke-dasharray:8 8; opacity:.55; }
    .mini-nav-muted-dot { fill:#8b97a8; opacity:.75; }
    .mini-nav-empty, .mini-nav-label, .mini-nav-bearing { fill:#8b97a8; font-size:11px; font-weight:700; }
    .grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
    .item { background:#131820; border:1px solid #232b38; border-radius:10px; padding:8px; }
    .turn { border:1px solid rgba(110,209,194,.32); background:rgba(110,209,194,.08); border-radius:12px; padding:9px 10px; margin:0 0 10px; line-height:1.45; }
    .turn small { color:#6ed1c2; }
    .turn strong { display:block; font-size:13px; }
    small { display:block; color:#8b97a8; font-size:10px; margin-bottom:3px; }
    strong { font-size:14px; }
    .note { margin-top:10px; color:#8b97a8; font-size:11px; line-height:1.4; }
  </style>
</head>
<body>
  <main class="card">
    <h1>חלון מוקטן — מיני ניווט</h1>
    <div class="route">${miniEscape(title)}</div>
    <div class="mini-nav">${miniMap}</div>
    <div class="turn"><small>הוראת פנייה במסלול</small><strong>${miniEscape(turn)}</strong></div>
    <div class="grid">
      <div class="item"><small>מרחק</small><strong>${miniEscape(distance)}</strong></div>
      <div class="item"><small>זמן תיאורטי</small><strong>${miniEscape(duration)}</strong></div>
      <div class="item"><small>מיקום חי</small><strong>${miniEscape(location)}</strong></div>
      <div class="item"><small>הקלטה</small><strong>${miniEscape(recording)}</strong></div>
    </div>
    <div class="note">במחשב שולחני החלון משתמש ב־Document Picture-in-Picture כאשר הדפדפן תומך בכך. בנייד האפליקציה משתמשת במיני־ניווט פנימי יציב.</div>
  </main>
</body>
</html>`;
  };

  const openMiniWindow = async () => {
    if (isMobileLikeDevice()) {
      if (miniExternalWindowRef.current && !miniExternalWindowRef.current.closed) {
        miniExternalWindowRef.current.close();
        miniExternalWindowRef.current = null;
      }
      setMiniOverlayOpen(true);
      setMiniStatus('mobile');
      return;
    }
    const pipApi = (window as Window & {
      documentPictureInPicture?: {
        requestWindow: (options: { width: number; height: number }) => Promise<Window>;
      };
    }).documentPictureInPicture;
    if (pipApi?.requestWindow) {
      try {
        const pipWindow = await pipApi.requestWindow({ width: 360, height: 300 });
        pipWindow.document.open();
        pipWindow.document.write(miniWindowHtml());
        pipWindow.document.close();
        miniExternalWindowRef.current = pipWindow;
        setMiniOverlayOpen(false);
        setMiniStatus('pip');
        return;
      } catch {
        // Continue to popup / in-app fallback.
      }
    }
    const popup = window.open('', 'south-lebanon-mini-map', 'popup,width=360,height=300');
    if (popup) {
      popup.document.open();
      popup.document.write(miniWindowHtml());
      popup.document.close();
      try {
        popup.opener = null;
      } catch {
        // Some browsers block changing opener. The popup contains only local status HTML.
      }
      miniExternalWindowRef.current = popup;
      setMiniOverlayOpen(false);
      setMiniStatus('popup');
      return;
    }
    setMiniOverlayOpen(true);
    setMiniStatus('fallback');
  };

  useEffect(() => {
    const miniWindow = miniExternalWindowRef.current;
    if (!miniWindow || miniWindow.closed) return;
    try {
      miniWindow.document.open();
      miniWindow.document.write(miniWindowHtml());
      miniWindow.document.close();
    } catch {
      miniExternalWindowRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigationRoute, liveLocation, recordedTrack, recordedKm, currentTurnInstruction]);

  useEffect(() => {
    if (resumedLiveRef.current) return;
    resumedLiveRef.current = true;
    if (initialNavSessionRef.current?.liveActive && watchId === null) {
      beginLiveLocationWatch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (resumedRecordingRef.current) return;
    resumedRecordingRef.current = true;
    if (initialRecordingSessionRef.current?.recordingActive && recordingWatchId === null) {
      beginRecordingWatch(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const appProps = {
    panelRef, panelDragRef, handlePanelDragStart, handlePanelDragMove, handlePanelDragEnd,
    mapSearchQuery: mapDisplayState.mapSearchQuery, setMapSearchQuery: mapDisplayState.setMapSearchQuery,
    mapSearchResults: searchResults, setFocusTarget: mapDisplayState.setFocusTarget,
    setVisible: mapDisplayState.setVisible, setSelectedId: filterState.setSelectedId,
    navigateFromCurrentPosition, openExternalNav, visible: mapDisplayState.visible,
    visibleKey: (k: keyof LayerVis) => () => mapDisplayState.setVisible(v => ({ ...v, [k]: !v[k] })),
    ...filterState,
    searchResults,
    onResultClick: (result: any) => {
      mapDisplayState.setFocusTarget({ lat: result.lat, lon: result.lon, zoom: 12, id: result.id, label: result.label });
      filterState.setSelectedId(result.type === 'incident' ? result.id : null);
    },
    largeLabels: mapDisplayState.largeLabels, setLargeLabels: mapDisplayState.setLargeLabels,
    allLabels: mapDisplayState.allLabels, setAllLabels: mapDisplayState.setAllLabels,
    years,
    recordingStatus, recordedTrack, recordedKm, recordingName,
    recordingActive: recordingStatus === 'recording', isPaused: recordingStatus === 'paused',
    startRecording: hookStartRecording, pauseRecording: () => setRecordingStatus('paused'),
    resumeRecording: () => setRecordingStatus('recording'),
    stopRecording: hookStopRecording, recordingToRoute: hookRecordingToRoute, saveRecording: hookSaveRecording,
    ...navState,
    navigationRoute, routeOptions, currentTurnInstruction, navPoints, startMatches, endMatches, showToast, beginLiveLocationWatch,
    toggleLiveLocation, downloadJson, testVoiceGuidance, liveToastShownRef, setLiveFollowDetached: mapDisplayState.setLiveFollowDetached,
    voiceGuidance, setVoiceGuidance, setVoiceMode, voiceLanguage, setVoiceLanguage, voiceStatus,
    loadSavedRoute, saveCurrentRoute, importRoutes,
    ...multiRouteState,
    ...poiState,
    savePoi, importPois,
  };

  return (
    <div
      className={`app ${panelsCollapsed ? 'panels-collapsed' : ''}`}
      style={{ '--panel-height-pct': `${panelHeightPct}vh` } as React.CSSProperties}
    >
      {/* ============ Header ============ */}
      <HeaderBar
        panelsCollapsed={panelsCollapsed}
        handlePanelToggle={handlePanelToggle}
        openMiniWindow={openMiniWindow}
        setMiniOverlayOpen={setMiniOverlayOpen}
        themeMode={themeMode}
        setThemeMode={setThemeMode}
        resetView={handleResetView}
        setHelpOpen={setHelpOpen}
        setSupportOpen={setSupportOpen}
        setAboutOpen={setAboutOpen}
        measureMode={measureMode}
        setMeasureMode={setMeasureMode}
        setManualMeasure={setManualMeasure}
        setDrawerOpen={setDrawerOpen}
        setTransferOpen={setTransferOpen}
      />

      {/* ============ Left panel: layers + filters ============ */}
      <LeftPanel {...appProps} />

      {/* ============ Map ============ */}
      <div className="map-wrap">
        <MapView
          initialCenter={initialMapViewRef.current ?? undefined}
          visible={visible}
          filteredIncidents={filtered}
          selectedIncident={selected}
          onSelectIncident={(id) => setSelectedId(id)}
          measureMode={measureMode}
          pointPickMode={addPoiMode || measureMode || multiRouteBuildMode}
          manualMeasure={manualMeasure}
          onMapClick={onMapClick}
          distanceLine={selected ? distanceLine : null}
          theme={effectiveTheme}
          largeLabels={largeLabels}
          allLabels={allLabels}
          focusTarget={focusTarget}
          ref={mapViewRef}
          navigationRoute={navigationRoute}
          routeOverlays={routeOverlaysMemo}
          routeDisplayMode={routeDisplayMode}
          liveLocation={liveLocation}
          liveCenterRequestId={liveCenterRequestId}
          onLiveFollowDetachedChange={handleLiveFollowDetachedChange}
          onMapViewChange={handleMapViewChange}
          recordedTrack={recordedTrack}
          compassMode={compassMode}
          mapBearing={mapBearing}
          userRotation={userMapRotation}
          onUserRotationChange={handleUserRotationChange}
          rotationLocked={rotationLocked}
          poiDraft={poiDraft}
          poiDraftStyle={{
            markerColor: poiMarkerColor,
            markerShape: poiMarkerShape,
            markerSize: poiMarkerSize,
          }}
          customPois={customPois}
          multiRouteDraft={multiRouteDraftPoints}
          activeMultiRoute={activeMultiRoute ? { points: activeMultiRoute.points, name: activeMultiRoute.name } : null}
          navFollowZoom={navFollowZoom}
          onNavigateToPoint={navigateFromCurrentPosition}
          onSetNavStart={setMapPointAsNavStart}
        />
      </div>

      {/* ============ Map overlay buttons (outside map-wrap to avoid stacking-context conflict with header) ============ */}
      <MapOverlays
        compassMode={compassMode}
        setCompassMode={setCompassMode}
        mapBearing={mapBearing}
        userMapRotation={userMapRotation}
        rotationLocked={rotationLocked}
        toggleRotationLock={toggleRotationLock}
        snapPickerOpen={snapPickerOpen}
        setSnapPickerOpen={setSnapPickerOpen}
        handleSnapRotation={handleSnapRotation}
        resetMapRotation={resetMapRotation}
        panelsCollapsed={panelsCollapsed}
        handlePanelToggle={handlePanelToggle}
        liveLocation={liveLocation}
        liveFollowDetached={liveFollowDetached}
        centerLiveLocation={centerLiveLocation}
        openMiniWindow={openMiniWindow}
        setMiniOverlayOpen={setMiniOverlayOpen}
        measureMode={measureMode}
        manualMeasure={manualMeasure}
        manualKm={manualKm}
      />

      {toastMessage && (
        <div className="app-toast" role="status" aria-live="polite" data-testid="toast-message">
          {toastMessage}
        </div>
      )}

      {/* ===== Resume-navigation dialog ===== */}
      <ResumeNavDialog resumeNavDialog={resumeNavDialog} onClose={() => setResumeNavDialog(null)} onContinue={() => { setResumeNavDialog(null); document.getElementById("nav-section")?.scrollIntoView({ behavior: "smooth" }); }} onDiscard={() => { setResumeNavDialog(null); setNavStartId(""); setNavEndId(""); setNavStartQuery(""); setNavEndQuery(""); setNavCustomStart(null); setNavCustomEnd(null); setRoadRoute(null); setFootRoute(null); setActiveRouteId("drive"); setRouteDisplayMode("road"); }} />

      <MiniOverlay miniOverlayOpen={miniOverlayOpen} onClose={() => setMiniOverlayOpen(false)} navigationRoute={navigationRoute} currentTurnInstruction={currentTurnInstruction} liveLocation={liveLocation} recordedTrack={recordedTrack} recordedKm={recordedKm} miniStatus={miniStatus} miniNavSvgMarkup={miniNavSvgMarkup} />

      {/* ============ Right panel: analytics + selected ============ */}
      <AnalyticsPanel
        stats={stats}
        incidents={incidents}
        filtered={filtered}
        selected={selected}
        setSelectedId={setSelectedId}
        distanceById={distanceById}
        blueLine={blueLine}
      />

      {/* ============ Footer ============ */}
      <Footer />

      {/* ============ Drawer: sources & about ============ */}
      <SourcesDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} sources={sources} />

      {transferOpen && (
        <TransferModal
          onClose={() => setTransferOpen(false)}
          customPois={customPois}
          savedRoutes={savedRoutes}
          savedMultiRoutes={savedMultiRoutes}
          recordedTrack={recordedTrack}
          recordingName={recordingName}
          onImportPois={handleQrImportPois}
          onImportRoutes={handleQrImportRoutes}
          onImportMultiRoutes={handleQrImportMultiRoutes}
          onImportRecording={handleQrImportRecording}
        />
      )}

      <SupportDrawer open={supportOpen} onClose={() => setSupportOpen(false)} donationCopied={donationCopied} onOpenDonation={openDonationLink} onCopyDonation={copyDonationLink} onShareApp={shareCurrentApp} donationContactUrl={DONATION_CONTACT_URL} />

      <AboutDrawer open={aboutOpen} onClose={() => setAboutOpen(false)} donationCopied={donationCopied} onOpenDonation={openDonationLink} onCopyDonation={copyDonationLink} onShareApp={shareCurrentApp} />

      <HelpDrawer open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
