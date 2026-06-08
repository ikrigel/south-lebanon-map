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
import { HelpDrawer } from './components/drawers/HelpDrawer';
import { FilterPanel } from './components/panels/left/FilterPanel';
import { IncidentFiltersPanel } from './components/panels/left/IncidentFiltersPanel';
import { LabelPreferencesPanel } from './components/panels/left/LabelPreferencesPanel';
import { SearchPanel } from './components/panels/left/SearchPanel';
import { RecordingPanel } from './components/panels/left/RecordingPanel';
import { MultiRoutePanel } from './components/panels/left/MultiRoutePanel';
import { PoiPanel } from './components/panels/left/PoiPanel';

export default function App() {
  const initialNavSessionRef = useRef<LocalNavSession | null>(null);
  if (initialNavSessionRef.current === null) initialNavSessionRef.current = loadLocalNavSession();
  const initialRecordingSessionRef = useRef<LocalRecordingSession | null>(null);
  if (initialRecordingSessionRef.current === null) initialRecordingSessionRef.current = loadLocalRecordingSession();
  const initialMapViewRef = useRef<LocalMapView | null>(null);
  if (initialMapViewRef.current === null) initialMapViewRef.current = loadLocalMapView();
  const initialLabelPrefsRef = useRef<Required<LocalLabelPreferences> | null>(null);
  if (initialLabelPrefsRef.current === null) initialLabelPrefsRef.current = loadLocalLabelPreferences();
  const initialUiStateRef = useRef<LocalUiState | null>(null);
  if (initialUiStateRef.current === null) initialUiStateRef.current = loadLocalUiState();
  const initialFilterStateRef = useRef<LocalFilterState | null>(null);
  if (initialFilterStateRef.current === null) initialFilterStateRef.current = loadLocalFilterState();

  // -------- layer toggles --------
  const [visible, setVisible] = useState<LayerVis>(() => loadLocalLayerVisibility());

  // -------- filters --------
  const minYear = Math.min(...incidents.map(i => i.year));
  const maxYear = Math.max(...incidents.map(i => i.year));
  const years = Array.from({ length: maxYear - minYear + 1 }, (_, idx) => minYear + idx);
  const [yearFrom, setYearFrom] = useState(() => {
    const saved = initialFilterStateRef.current?.yearFrom;
    return saved !== undefined && saved >= minYear && saved <= maxYear ? saved : minYear;
  });
  const [yearTo, setYearTo] = useState(() => {
    const saved = initialFilterStateRef.current?.yearTo;
    return saved !== undefined && saved >= minYear && saved <= maxYear ? saved : maxYear;
  });
  const [typeFilter, setTypeFilter] = useState<Set<string>>(() => {
    const saved = initialFilterStateRef.current?.typeFilter;
    if (saved && saved.length > 0) return new Set(saved.filter(t => (TYPES as string[]).includes(t)));
    return new Set(TYPES);
  });
  const [sevFilter, setSevFilter] = useState<Set<string>>(() => {
    const saved = initialFilterStateRef.current?.sevFilter;
    if (saved && saved.length > 0) return new Set(saved.filter(s => (SEVS as string[]).includes(s)));
    return new Set(SEVS);
  });
  const [query, setQuery] = useState('');
  const [mapSearchQuery, setMapSearchQuery] = useState('');

  // -------- selection / measure --------
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [measureMode, setMeasureMode] = useState(false);
  const [manualMeasure, setManualMeasure] = useState<[number, number][]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => loadLocalThemeMode());
  const [autoDay, setAutoDay] = useState(isDaytime());
  const [largeLabels, setLargeLabels] = useState(() => initialLabelPrefsRef.current?.largeLabels ?? false);
  const [allLabels, setAllLabels] = useState(() => initialLabelPrefsRef.current?.allLabels ?? false);
  const [panelsCollapsed, setPanelsCollapsed] = useState(
    () => initialUiStateRef.current?.panelsCollapsed ?? false,
  );
  const mapViewRef = useRef<MapHandle>(null);
  // Skip snapshotCenter on the initial mount — map is still setting up.
  const panelsCollapseIsFirstMount = useRef(true);
  // Draggable panel height (mobile only) — percentage of viewport height
  const [panelHeightPct, setPanelHeightPct] = useState(
    () => initialUiStateRef.current?.panelHeightPct ?? 35,
  );
  const panelDragRef = useRef<{ startY: number; startPct: number } | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const [miniOverlayOpen, setMiniOverlayOpen] = useState(false);
  const [miniStatus, setMiniStatus] = useState<'idle' | 'pip' | 'fallback' | 'popup' | 'mobile'>('idle');
  // focusTarget: used only for user-triggered focus (search results, incidents).
  // Initial map view is handled by the initialCenter prop passed to MapView directly.
  const [focusTarget, setFocusTarget] = useState<{ lat: number; lon: number; zoom?: number; id: string; label?: string } | null>(null);
  const [liveFollowDetached, setLiveFollowDetached] = useState(false);
  const [liveCenterRequestId, setLiveCenterRequestId] = useState(0);
  const [navStartId, setNavStartId] = useState(() => {
    const saved = initialNavSessionRef.current?.navStartId ?? '';
    // 'live-location' cannot be resolved on load (GPS not yet acquired).
    // If coordinates were saved as navCustomStart, switch to that point so
    // the route is immediately visible.  GPS will resume via liveActive.
    if (saved === 'live-location') {
      return initialNavSessionRef.current?.navCustomStart ? 'custom-nav-start' : '';
    }
    return saved;
  });
  const [navEndId, setNavEndId] = useState(() => initialNavSessionRef.current?.navEndId ?? '');
  const [navStartQuery, setNavStartQuery] = useState(() => initialNavSessionRef.current?.navStartQuery ?? '');
  const [navEndQuery, setNavEndQuery] = useState(() => initialNavSessionRef.current?.navEndQuery ?? '');
  const [roadRoute, setRoadRoute] = useState<RoadRoute | null>(() => initialNavSessionRef.current?.roadRoute ?? null);
  const [alternativeRoute, setAlternativeRoute] = useState<{ km: number; durationMin: number; path: [number, number][] } | null>(null);
  const [activeRouteIndex, setActiveRouteIndex] = useState<number>(0);
  const [routeStatus, setRouteStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>(
    // If a road route was restored from localStorage, mark it ready immediately
    // so the polyline renders on first paint without waiting for a re-fetch.
    () => (initialNavSessionRef.current?.roadRoute ? 'ready' : 'idle'),
  );
  const [routeName, setRouteName] = useState(() => initialNavSessionRef.current?.routeName ?? '');
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>(() => loadLocalSavedRoutes());
  const [activeSavedRoute, setActiveSavedRoute] = useState<SavedRoute | null>(() => initialNavSessionRef.current?.activeSavedRoute ?? null);
  const [liveLocation, setLiveLocation] = useState<{ lat: number; lon: number; accuracy?: number; heading?: number | null } | null>(null);
  // navPosition is a throttled version of liveLocation — updated only when the
  // device moves ≥ 15 m. Used for turn-instruction recalc and voice guidance,
  // so those expensive O(n) path scans don't run on every GPS wobble.
  const [navPosition, setNavPosition] = useState<{ lat: number; lon: number } | null>(null);
  const navPositionRef = useRef<{ lat: number; lon: number } | null>(null);
  useLiveLocation({ liveLocation, setNavPosition, navPositionRef });
  const [locationStatus, setLocationStatus] = useState<'idle' | 'watching' | 'error'>('idle');
  const [watchId, setWatchId] = useState<number | null>(null);
  const [compassMode, setCompassMode] = useState(false);
  const [userMapRotation, setUserMapRotation] = useState(
    () => initialUiStateRef.current?.userMapRotation ?? 0,
  );
  const handleUserRotationChange = useCallback((deg: number) => {
    setUserMapRotation(((deg % 360) + 360) % 360);
  }, []);
  const resetMapRotation = useCallback(() => setUserMapRotation(0), []);
  // Rotation lock: when true, pinch/drag cannot rotate the map;
  // user picks snap angles (0/45/90/135/180/225/270/315) via a picker.
  const [rotationLocked, setRotationLocked] = useState(false);
  const [snapPickerOpen, setSnapPickerOpen] = useState(false);
  const handleSnapRotation = useCallback((deg: number) => {
    setUserMapRotation(deg);
    setSnapPickerOpen(false);
  }, []);
  const toggleRotationLock = useCallback(() => {
    setRotationLocked(v => {
      const next = !v;
      if (next) setSnapPickerOpen(true); // open picker when locking
      return next;
    });
  }, []);
  const [recordingStatus, setRecordingStatus] = useState<'idle' | 'recording' | 'paused' | 'error'>('idle');
  const [recordingWatchId, setRecordingWatchId] = useState<number | null>(null);
  const [recordedTrack, setRecordedTrack] = useState<[number, number][]>(() => initialRecordingSessionRef.current?.recordedTrack ?? []);
  const [recordingName, setRecordingName] = useState(() => initialRecordingSessionRef.current?.recordingName ?? '');
  const [voiceGuidance, setVoiceGuidance] = useState<VoiceGuidanceMode>(() => initialNavSessionRef.current?.voiceGuidance ?? 'off');
  const [voiceLanguage, setVoiceLanguage] = useState<VoiceLanguage>(() => initialNavSessionRef.current?.voiceLanguage ?? 'he');
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'speaking' | 'unsupported'>('idle');
  const recordedTrackRef = useRef<[number, number][]>([]);
  const miniExternalWindowRef = useRef<Window | null>(null);
  const lastVoiceRouteRef = useRef('');
  const lastVoiceProgressRef = useRef<{ at: number; bucket: number | null }>({ at: 0, bucket: null });
  const lastTurnVoiceRef = useRef<{ key: string; at: number }>({ key: '', at: 0 });
  const resumedLiveRef = useRef(false);
  const resumedRecordingRef = useRef(false);
  const liveToastShownRef = useRef(false);
  const toastTimeoutRef = useRef<number | null>(null);
  const [supportOpen, setSupportOpen] = useState(false);
  const [donationCopied, setDonationCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  // Resume-navigation dialog: shown once on load when a saved nav session exists
  // and the user hasn’t arrived at the destination yet.
  const [resumeNavDialog, setResumeNavDialog] = useState<{
    endLabel: string;
    startLabel: string;
    km: number;
  } | null>(() => {
    const s = initialNavSessionRef.current;
    if (!s) return null;
    // Need both endpoints defined to show resume dialog
    const hasRoute = !!(s.navEndId && s.navStartId &&
      (s.roadRoute || s.activeSavedRoute || s.footRoute));
    if (!hasRoute) return null;
    // Skip if already arrived (last known distance ≤ 150m)
    if (s.lastDistToDestM !== undefined && s.lastDistToDestM <= 150) return null;
    // Skip if session is older than 48 h
    if (s.savedAt !== undefined && Date.now() - s.savedAt > 48 * 3600 * 1000) return null;
    // Determine labels from available data
    const endLabel   = s.navEndQuery   || s.activeSavedRoute?.end?.label   || s.navCustomEnd?.label   || 'יעד שנשמר';
    const startLabel = s.navStartQuery || s.activeSavedRoute?.start?.label || s.navCustomStart?.label || 'נקודת מוצא שנשמרה';
    const km = s.roadRoute?.km ?? s.activeSavedRoute?.km ?? s.footRoute?.km ?? 0;
    return { endLabel, startLabel, km };
  });
  const [addPoiMode, setAddPoiMode] = useState(false);
  const [poiDraft, setPoiDraft] = useState<{ lat: number; lon: number } | null>(null);
  const [poiName, setPoiName] = useState('');
  const [poiDescription, setPoiDescription] = useState('');
  const [poiMarkerColor, setPoiMarkerColor] = useState<PoiColor>('#f6c453');
  const [poiMarkerShape, setPoiMarkerShape] = useState<PoiShape>('circle');
  const [poiMarkerSize, setPoiMarkerSize] = useState<PoiSize>('md');
  const [customPois, setCustomPois] = useState<CustomPoi[]>(() => loadLocalPois());
  const [multiRouteBuildMode, setMultiRouteBuildMode] = useState(false);
  const [multiRouteDraftPoints, setMultiRouteDraftPoints] = useState<{lat: number; lon: number; label: string; order: number}[]>([]);
  const [multiRouteName, setMultiRouteName] = useState('');
  const [multiRouteDescription, setMultiRouteDescription] = useState('');
  const [multiRouteDifficulty, setMultiRouteDifficulty] = useState<DifficultyLevel>('medium');
  const [multiRoutePassability, setMultiRoutePassability] = useState<PassabilityLevel>('dirt');
  const [savedMultiRoutes, setSavedMultiRoutes] = useState<MultiPointRoute[]>(() => loadLocalSavedMultiRoutes());
  const [activeMultiRoute, setActiveMultiRoute] = useState<MultiPointRoute | null>(null);
  const [navCustomEnd, setNavCustomEnd] = useState<{lat: number; lon: number; label: string} | null>(
    () => initialNavSessionRef.current?.navCustomEnd ?? null,
  );
  const [navCustomStart, setNavCustomStart] = useState<{lat: number; lon: number; label: string} | null>(
    () => initialNavSessionRef.current?.navCustomStart ?? null,
  );
  const [navScaleLabel, setNavScaleLabel] = useState<string>(DEFAULT_NAV_SCALE_LABEL);
  // ── Multi-route display mode ──
  const [routeDisplayMode, setRouteDisplayMode] = useState<RouteDisplayMode>(
    () => initialNavSessionRef.current?.routeDisplayMode ?? 'road',
  );
  const [footRoute, setFootRoute] = useState<RoadRoute | null>(
    () => initialNavSessionRef.current?.footRoute ?? null,
  );
  const [footRouteStatus, setFootRouteStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>(
    () => (initialNavSessionRef.current?.footRoute ? 'ready' : 'idle'),
  );
  // aerialRoute is derived (no state needed — computed from navStart/navEnd)
  const [activeRouteId, setActiveRouteId] = useState<'drive' | 'foot' | 'aerial'>(
    () => initialNavSessionRef.current?.activeRouteId ?? 'drive',
  );

  const showToast = useCallback((message: string, timeoutMs = 2600) => {
    setToastMessage(message);
    if (toastTimeoutRef.current !== null) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastMessage('');
      toastTimeoutRef.current = null;
    }, timeoutMs);
  }, []);

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

  // Persistence wired via usePersistence hook
  const { lastDistToDestMRef } = usePersistence({
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
  });

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

  const searchResults = useMemo(() => {
    const q = clean(query);
    if (!q) return [];
    const townMatches = towns
      .filter(t => clean(`${t.name_he} ${t.name_en} ${t.note ?? ''} ${t.side === 'LB' ? 'לבנון' : 'ישראל'}`).includes(q))
      .map(t => ({
        id: `town-${t.id}`,
        title: t.name_he,
        subtitle: `${t.name_en} · ${t.side === 'LB' ? 'יישוב בלבנון' : 'יישוב ייחוס בישראל'}`,
        lat: t.lat,
        lon: t.lon,
        zoom: 13,
      }));
    const unifilMatches = unifilPoints
      .filter(u => clean(`${u.name_he} ${u.name_en} ${u.note_he} יוניפיל unifil`).includes(q))
      .map(u => ({
        id: `unifil-${u.id}`,
        title: u.name_he,
        subtitle: `${u.name_en} · נקודת יוניפי״ל ציבורית/מקורבת`,
        lat: u.lat,
        lon: u.lon,
        zoom: 13,
      }));
    const terrainMatches = terrainFeatures
      .filter(f => clean(`${f.name_he} ${f.name_en} ${f.note_he ?? ''} רכס רכסים הר הרים נחל נחלים נהר נהרות ואדי עמק תוואי שטח`).includes(q))
      .map(f => ({
        id: `terrain-${f.id}`,
        title: f.name_he,
        subtitle: `${f.name_en} · תוואי שטח / הידרוגרפיה`,
        lat: f.lat,
        lon: f.lon,
        zoom: f.type === 'river' || f.type === 'wadi' ? 12 : 13,
      }));
    const zoneMatches = influenceZones
      .filter(z => clean(`${z.name_he} ${z.note_he} חזבאללה השפעה אזור`).includes(q))
      .map(z => {
        const center = z.polygon.reduce((acc, p) => [acc[0] + p[0], acc[1] + p[1]] as [number, number], [0, 0]);
        return {
          id: `zone-${z.id}`,
          title: z.name_he,
          subtitle: 'אזור השפעה איכותי ומקורב',
          lat: center[0] / z.polygon.length,
          lon: center[1] / z.polygon.length,
          zoom: 11,
        };
      });
    const incidentMatches = incidents
      .filter(i => clean(`${i.title_he} ${i.desc_he} ${i.source_label} ${TYPE_LABEL[i.type]}`).includes(q))
      .slice(0, 8)
      .map(i => ({
        id: `incident-${i.id}`,
        incidentId: i.id,
        title: i.title_he,
        subtitle: `${fmtDate(i.date)} · ${TYPE_LABEL[i.type]} · ${i.approx ? 'מיקום מקורב' : 'מיקום מדווח'}`,
        lat: i.lat,
        lon: i.lon,
        zoom: 13,
      }));
    const poiMatches = customPois
      .filter(p => clean(`${p.name} ${p.description} נקודת עניין`).includes(q))
      .map(p => ({
        id: `poi-${p.id}`,
        title: p.name,
        subtitle: `נקודת עניין אישית · ${p.description || 'ללא תיאור'}`,
        lat: p.lat,
        lon: p.lon,
        zoom: 14,
      }));
    return [...poiMatches, ...townMatches, ...terrainMatches, ...unifilMatches, ...zoneMatches, ...incidentMatches].slice(0, 12);
  }, [query, customPois]);

  const mapSearchResults = useMemo(() => {
    const q = clean(mapSearchQuery);
    if (!q) return [];
    const townMatches = towns
      .filter(t => clean(`${t.name_he} ${t.name_en} ${t.note ?? ''} ${t.side === 'LB' ? 'לבנון כפר ישוב יישוב' : 'ישראל ישוב יישוב'}`).includes(q))
      .map(t => ({
        id: `map-town-${t.id}`,
        title: t.name_he,
        subtitle: `${t.name_en} · ${t.side === 'LB' ? 'יישוב/כפר בלבנון' : 'יישוב ייחוס בישראל'}`,
        lat: t.lat,
        lon: t.lon,
        zoom: t.pop_band === 'xl' ? 13 : 15,
      }));
    const terrainMatches = terrainFeatures
      .filter(f => clean(`${f.name_he} ${f.name_en} ${f.note_he ?? ''} רכס רכסים הר הרים נחל נחלים נהר נהרות ואדי עמק תוואי שטח זהרני זהראני סילבסטר`).includes(q))
      .map(f => ({
        id: `map-terrain-${f.id}`,
        title: f.name_he,
        subtitle: `${f.name_en} · ${f.type === 'mountain' ? 'הר' : f.type === 'ridge' ? 'רכס' : f.type === 'river' ? 'נהר' : f.type === 'wadi' ? 'ואדי/נחל' : 'תוואי שטח'}`,
        lat: f.lat,
        lon: f.lon,
        zoom: f.type === 'river' || f.type === 'wadi' ? 13 : 15,
      }));
    const unifilMatches = unifilPoints
      .filter(u => clean(`${u.name_he} ${u.name_en} ${u.note_he} יוניפיל unifil`).includes(q))
      .map(u => ({
        id: `map-unifil-${u.id}`,
        title: u.name_he,
        subtitle: `${u.name_en} · נקודת יוניפי״ל ציבורית/מקורבת`,
        lat: u.lat,
        lon: u.lon,
        zoom: 14,
      }));
    const poiMatches = customPois
      .filter(p => clean(`${p.name} ${p.description} נקודת עניין`).includes(q))
      .map(p => ({
        id: `map-poi-${p.id}`,
        title: p.name,
        subtitle: `נקודת עניין אישית · ${p.description || 'ללא תיאור'}`,
        lat: p.lat,
        lon: p.lon,
        zoom: 16,
      }));
    const incidentMatches = incidents
      .filter(i => clean(`${i.title_he} ${i.desc_he} ${i.source_label} ${TYPE_LABEL[i.type]} אירוע`).includes(q))
      .slice(0, 8)
      .map(i => ({
        id: `map-incident-${i.id}`,
        incidentId: i.id,
        title: i.title_he,
        subtitle: `${fmtDate(i.date)} · ${TYPE_LABEL[i.type]} · ${i.approx ? 'מיקום מקורב' : 'מיקום מדווח'}`,
        lat: i.lat,
        lon: i.lon,
        zoom: 14,
      }));
    return [...poiMatches, ...townMatches, ...terrainMatches, ...unifilMatches, ...incidentMatches].slice(0, 18);
  }, [mapSearchQuery, customPois]);

  const selected = useMemo(
    () => filtered.find(i => i.id === selectedId) || incidents.find(i => i.id === selectedId) || null,
    [selectedId, filtered]
  );

  // distance from each filtered incident to the Blue Line
  const distances = useMemo(() => {
    return filtered.map(i => ({
      id: i.id,
      ...distanceToPolyline([i.lat, i.lon], blueLine),
    }));
  }, [filtered]);

  const distanceById = useMemo(() => {
    const m = new Map<string, { km: number; nearest: [number, number] }>();
    distances.forEach(d => m.set(d.id, { km: d.km, nearest: d.nearest }));
    return m;
  }, [distances]);

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

  const onMapClick = useCallback((lat: number, lon: number) => {
    if (multiRouteBuildMode) {
      const newPoint = { lat, lon, label: `נקודה ${multiRouteDraftPoints.length + 1}`, order: multiRouteDraftPoints.length };
      setMultiRouteDraftPoints(prev => prev.length >= MAX_MULTI_ROUTE_POINTS ? prev : [...prev, newPoint]);
      return;
    }
    if (addPoiMode) {
      setPoiDraft({ lat, lon });
    } else if (measureMode) {
      setManualMeasure(prev => {
        if (prev.length === 2) return [[lat, lon]];
        return [...prev, [lat, lon]];
      });
    } else {
      setSelectedId(null);
    }
  }, [addPoiMode, measureMode, multiRouteBuildMode, multiRouteDraftPoints.length]);

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

  const currentTurnInstruction = useMemo<TurnInstruction | null>(() => {
    if (!navigationRoute) return null;
    const path: [number, number][] = navigationRoute.path && navigationRoute.path.length >= 2
      ? navigationRoute.path
      : [
          [navigationRoute.start.lat, navigationRoute.start.lon],
          [navigationRoute.end.lat, navigationRoute.end.lon],
        ];
    if (path.length < 2) return null;

    // Use throttled navPosition (updates every 15 m) not raw liveLocation
    const current: [number, number] = navPosition
      ? [navPosition.lat, navPosition.lon]
      : path[0];
    const remainingToEndKm = haversineKm(current, [navigationRoute.end.lat, navigationRoute.end.lon]);
    const confidence: TurnInstruction['confidence'] = navigationRoute.path && navigationRoute.path.length >= 3 ? 'route' : 'estimated';
    if (remainingToEndKm < 0.15) {
      return composeTurnInstruction('arrive', Math.max(0, remainingToEndKm * 1000), mapBearing, confidence);
    }

    const routeInstructions = navigationRoute.instructions?.filter(instruction => instruction.action !== 'none') ?? [];
    if (routeInstructions.length && navigationRoute.path && navigationRoute.path.length >= 2) {
      const cumulativeMeters = navigationRoute.path.reduce<number[]>((acc, point, index) => {
        if (index === 0) return [0];
        const previous = navigationRoute.path![index - 1];
        acc.push(acc[index - 1] + haversineKm(previous, point) * 1000);
        return acc;
      }, []);
      let nearestIndex = 0;
      let nearestKm = Infinity;
      navigationRoute.path.forEach((point, index) => {
        const km = haversineKm(current, point);
        if (km < nearestKm) {
          nearestKm = km;
          nearestIndex = index;
        }
      });
      const currentDistanceM = navPosition ? cumulativeMeters[nearestIndex] ?? 0 : 0;
      const aheadInstructions = routeInstructions
        .filter(instruction => instruction.distanceM >= currentDistanceM + 15)
        .sort((a, b) => a.distanceM - b.distanceM);
      const nextMeaningful = aheadInstructions.find(instruction => instruction.action !== 'straight') ?? aheadInstructions[0];
      if (nextMeaningful) {
        return composeTurnInstruction(
          nextMeaningful.action,
          Math.max(0, nextMeaningful.distanceM - currentDistanceM),
          nextMeaningful.bearing,
          'route',
          nextMeaningful.roadName,
          nextMeaningful.lat,
          nextMeaningful.lon
        );
      }
    }

    let nearestIndex = 0;
    let nearestKm = Infinity;
    path.forEach((point, index) => {
      const km = haversineKm(current, point);
      if (km < nearestKm) {
        nearestKm = km;
        nearestIndex = index;
      }
    });

    const baseIndex = Math.max(0, Math.min(path.length - 2, nearestIndex));
    let targetIndex = Math.min(path.length - 1, baseIndex + 1);
    let accumulatedKm = 0;
    for (let i = baseIndex; i < path.length - 1; i += 1) {
      accumulatedKm += haversineKm(path[i], path[i + 1]);
      targetIndex = i + 1;
      if (accumulatedKm >= 0.28) break;
    }

    const previousPoint = path[Math.max(0, baseIndex - 1)];
    const basePoint = path[baseIndex];
    const nextPoint = path[targetIndex] ?? path[Math.min(path.length - 1, baseIndex + 1)];
    const previousBearing = baseIndex > 0 ? bearingDegrees(previousPoint, basePoint) : bearingDegrees(current, nextPoint);
    const nextBearing = bearingDegrees(basePoint, nextPoint);
    const delta = normalizeTurnDelta(nextBearing - previousBearing);
    const action = turnActionFromDelta(delta);
    const distanceM = Math.max(0, haversineKm(current, nextPoint) * 1000);
    return composeTurnInstruction(action, distanceM, nextBearing, confidence);
  }, [navigationRoute, navPosition, mapBearing]);

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

  const downloadJson = (filename: string, data: unknown) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast('קובץ JSON מוכן לשיתוף או הורדה');
  };

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
  const handlePanelToggle = useCallback(() => {
    mapViewRef.current?.snapshotCenter();
    setPanelsCollapsed(v => !v);
  }, []);

  // ---- Panel drag handlers (mobile bottom-sheet) ----
  const handlePanelDragStart = useCallback((clientY: number) => {
    panelDragRef.current = { startY: clientY, startPct: panelHeightPct };
  }, [panelHeightPct]);

  const handlePanelDragMove = useCallback((clientY: number) => {
    if (!panelDragRef.current) return;
    const { startY, startPct } = panelDragRef.current;
    const deltaY = startY - clientY; // drag up = positive
    const deltaPct = (deltaY / window.innerHeight) * 100;
    const newPct = Math.min(90, Math.max(8, startPct + deltaPct));
    setPanelHeightPct(newPct);
  }, []);

  const handlePanelDragEnd = useCallback(() => {
    panelDragRef.current = null;
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

  const handleQrImportRoutes = useCallback((routes: TransferRoute[]) => {
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
    setSavedRoutes(prev => {
      const existingIds = new Set(prev.map(r => r.id));
      const fresh = valid.filter(r => !existingIds.has(r.id));
      return fresh.length ? [...fresh, ...prev] : prev;
    });
  }, []);

  const handleQrImportMultiRoutes = useCallback((routes: TransferMultiRoute[]) => {
    const valid = (routes as MultiPointRoute[]).filter(r =>
      r && Array.isArray(r.points) && r.points.length > 0
    );
    if (!valid.length) return;
    setSavedMultiRoutes(prev => {
      const existingIds = new Set(prev.map(r => r.id));
      const fresh = valid.filter(r => !existingIds.has(r.id));
      return fresh.length ? [...fresh, ...prev] : prev;
    });
  }, []);

  const handleQrImportRecording = useCallback((rec: RecordingPayload) => {
    if (!rec.recordedTrack?.length) return;
    const track = normalizeRoutePath(rec.recordedTrack) ?? [];
    if (!track.length) return;
    setRecordedTrack(track);
    if (rec.recordingName) setRecordingName(rec.recordingName);
    showToast('הקלטת נסיעה יובאה מברקוד');
  }, []);
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

  const resetView = useCallback(() => {
    setVisible({ ...DEFAULT_LAYER_VISIBILITY });
    setThemeMode(DEFAULT_THEME_MODE);
    setLargeLabels(false);
    setAllLabels(false);
    setCompassMode(false);
    setMeasureMode(false);
    setManualMeasure([]);
    setSelectedId(null);
    setLiveFollowDetached(false);
    setFocusTarget({
      ...DEFAULT_MAP_VIEW,
      id: `reset-view-${Date.now()}`,
    });
    showToast('התצוגה אופסה לברירת המחדל');
  }, [showToast]);

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

  return (
    <div
      className={`app ${panelsCollapsed ? 'panels-collapsed' : ''}`}
      style={{ '--panel-height-pct': `${panelHeightPct}vh` } as React.CSSProperties}
    >
      {/* ============ Header ============ */}
      <header className="header">
        <div className="brand">
          <svg className="brand-logo" viewBox="0 0 32 32" fill="none" aria-label="לוגו">
            <path d="M4 24 L12 8 L16 16 L20 12 L28 24" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
            <circle cx="16" cy="20" r="2" fill="currentColor" />
          </svg>
          <div>
            <div className="brand-title">מרחב דרום לבנון — מפת מצב</div>
            <div className="brand-sub">פותח ע״י יגאל קריגל - קה״ד גדס״מ 5679 - גדוד סיור מיוחד</div>
          </div>
        </div>
        <div className="header-actions">
          <button
            className="btn menu-toggle"
            onClick={handlePanelToggle}
            aria-pressed={panelsCollapsed}
            data-testid="button-toggle-menu"
          >
            {panelsCollapsed ? 'פתח תפריט' : 'סגור תפריט'}
          </button>
          <button className="btn" onClick={() => openMiniWindow().catch(() => setMiniOverlayOpen(true))} data-testid="button-mini-window">
            חלון מוקטן
          </button>
          <div className="theme-switch" role="group" aria-label="מצב בהירות" data-testid="theme-switch">
            {([
              ['dark', 'כהה'],
              ['light', 'בהיר'],
              ['auto', 'אוטומטי'],
            ] as const).map(([mode, label]) => (
              <button
                key={mode}
                className="theme-btn"
                aria-pressed={themeMode === mode}
                onClick={() => setThemeMode(mode)}
                data-testid={`button-theme-${mode}`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            className="btn ghost"
            onClick={resetView}
            data-testid="button-reset-view"
            title="איפוס שכבות, בהירות, מצפן ומיקוד המפה"
          >
            איפוס תצוגה
          </button>
          <a
            className="btn portfolio-link"
            href="https://portfolio-dusky-eight-77.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            data-testid="link-portfolio"
          >
            הפורטפוליו שלי
          </a>
          <button className="btn" onClick={() => setHelpOpen(true)} data-testid="button-help">
            עזרה והדרכה
          </button>
          <button className="btn" onClick={() => setSupportOpen(true)} data-testid="button-support">
            תמיכה בפיתוח
          </button>
          <button className="btn" onClick={() => setAboutOpen(true)} data-testid="button-about">
            About
          </button>
          <button
            className="btn"
            onClick={() => {
              setMeasureMode(m => !m);
              setManualMeasure([]);
            }}
            aria-pressed={measureMode}
            data-testid="button-measure"
          >
            {measureMode ? 'יציאה ממצב מדידה' : 'מדידה ידנית'}
          </button>
          <button className="btn ghost" onClick={() => setDrawerOpen(true)} data-testid="button-sources">
            מקורות ועל אודות
          </button>
          <button className="btn" onClick={() => setTransferOpen(true)} data-testid="button-transfer">
            העברת מרשמים
          </button>
        </div>
      </header>

      {/* ============ Left panel: layers + filters ============ */}
      <aside
        className="panel left"
        data-testid="panel-layers"
        ref={panelRef}
      >
        {/* Drag handle — visible only on mobile */}
        <div
          className="panel-drag-handle"
          data-testid="panel-drag-handle"
          aria-label="גרור לשינוי גובה התפריט"
          onMouseDown={e => { e.preventDefault(); handlePanelDragStart(e.clientY); }}
          onTouchStart={e => handlePanelDragStart(e.touches[0].clientY)}
          onMouseMove={e => { if (panelDragRef.current) { e.preventDefault(); handlePanelDragMove(e.clientY); } }}
          onTouchMove={e => { e.preventDefault(); handlePanelDragMove(e.touches[0].clientY); }}
          onMouseUp={handlePanelDragEnd}
          onMouseLeave={handlePanelDragEnd}
          onTouchEnd={handlePanelDragEnd}
        >
          <span className="panel-drag-pill" />
        </div>
        <div className="panel-scroll">
          <div className="panel-section map-search-section">
            <h3>חיפוש במפה</h3>
            <input
              className="search"
              placeholder="חפש כפר, עיר, רכס, הר, נחל או נקודת עניין…"
              value={mapSearchQuery}
              onChange={e => setMapSearchQuery(e.target.value)}
              data-testid="input-map-search"
            />
            <p className="legend-note">
              בחירה בתוצאה ממקמת את הנקודה במרכז המפה, פותחת זום קרוב ומציגה סמן מיקוד.
            </p>
            {mapSearchResults.length > 0 && (
              <div className="search-results map-search-results" data-testid="map-search-results">
                {mapSearchResults.map(result => (
                  <div key={result.id} className="search-result-row" data-testid={`result-row-${result.id}`}>
                    <button
                      className="search-result"
                      onClick={() => {
                        setFocusTarget({
                          lat: result.lat,
                          lon: result.lon,
                          zoom: result.zoom,
                          label: result.title,
                          id: `${result.id}-${Date.now()}`,
                        });
                        setVisible(v => ({ ...v, cityLabels: true, settlementLabels: true, ridgeLabels: true, waterLabels: true }));
                        if ('incidentId' in result && typeof result.incidentId === 'string') setSelectedId(result.incidentId);
                      }}
                      data-testid={`button-map-search-result-${result.id}`}
                    >
                      <span>{result.title}</span>
                      <small>{result.subtitle}</small>
                    </button>
                    <div className="navigate-btn-group">
                      <button
                        className="btn navigate-here-btn navigate-here-primary"
                        onClick={() => navigateFromCurrentPosition(result.lat, result.lon, result.title)}
                        title="הגע מיישור ממיקום הנוכחי"
                        data-testid={`button-navigate-from-here-${result.id}`}
                      >
                        ▶ נווט מיכאן
                      </button>
                      <button
                        className="btn navigate-here-btn navigate-here-external"
                        onClick={() => openExternalNav(result.lat, result.lon, result.title,
                          liveLocation?.lat, liveLocation?.lon)}
                        title="פתח Waze / Google Maps"
                        data-testid={`button-open-external-nav-${result.id}`}
                      >
                        פתח Waze/Maps
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {mapSearchQuery.trim().length > 1 && mapSearchResults.length === 0 && (
              <p className="legend-note" data-testid="map-search-empty">לא נמצאו תוצאות. נסה כתיב עברי/אנגלי אחר או שם סמוך.</p>
            )}
          </div>

          <div className="panel-section">
            <h3>שכבות מידע</h3>
            <div className="layer-group-title">שכבות בסיס, ביטחון ותבליט</div>
            {[
              { key: 'pop' as const, label: 'תפוצת אוכלוסיה אזרחית', color: '#d0b58a' },
              { key: 'unifil' as const, label: 'יוניפי״ל — מטה ומגזרים', color: '#6da7d1' },
              { key: 'hez' as const, label: 'אזורי השפעת חזבאללה (איכותי)', color: '#b56466' },
              { key: 'blueLine' as const, label: 'הקו הכחול (מקורב)', color: '#5a8fbf' },
              { key: 'litani' as const, label: 'נהר הליטני וגבול אזור החיץ', color: '#4e7fb0' },
              { key: 'rivers' as const, label: 'נהרות — זהרני, אוואלי', color: '#4a90c4' },
              { key: 'topo' as const, label: 'טופוגרפיה — ניתוח תבליט וקרקע', color: '#88c37a' },
            ].map(l => (
              <div
                key={l.key}
                className="toggle-row"
                data-active={visible[l.key]}
                onClick={visibleKey(l.key)}
                role="switch"
                aria-checked={visible[l.key]}
                data-testid={`toggle-layer-${l.key}`}
              >
                <div className="toggle-label">
                  <span className="toggle-swatch" style={{ background: l.color }} />
                  {l.label}
                </div>
                <span className="toggle-switch" />
              </div>
            ))}
            <div className="layer-group-title layer-group-title-labels">שכבות שמות בעברית</div>
            {[
              { key: 'cityLabels' as const, label: 'שמות בעברית — הפעלה כללית', color: '#f6c453' },
              { key: 'settlementLabels' as const, label: 'שמות יישובים וכפרים', color: '#f6c453' },
              { key: 'ridgeLabels' as const, label: 'רכסים, הרים ועמקים', color: '#d49a3a' },
              { key: 'waterLabels' as const, label: 'נחלים, ואדיות ונהרות', color: '#4e7fb0' },
            ].map(l => (
              <div
                key={l.key}
                className="toggle-row"
                data-active={visible[l.key]}
                onClick={visibleKey(l.key)}
                role="switch"
                aria-checked={visible[l.key]}
                data-testid={`toggle-layer-${l.key}`}
              >
                <div className="toggle-label">
                  <span className="toggle-swatch" style={{ background: l.color }} />
                  {l.label}
                </div>
                <span className="toggle-switch" />
              </div>
            ))}
            <p className="legend-note">
              שכבת חזבאללה היא איכותית בלבד — מבוססת דיווחי תקשורת ומחקר ציבוריים, אינה מציינת מתקנים מבצעיים או יעדים תקיפים.
            </p>
            <div
              className="toggle-row"
              data-active={visible.sectColors}
              onClick={visibleKey('sectColors')}
              role="switch"
              aria-checked={visible.sectColors}
              data-testid="toggle-layer-sectColors"
            >
              <div className="toggle-label">
                <span className="toggle-swatch" style={{ background: 'linear-gradient(90deg,#2a8a6e,#b03030,#7b3fa0,#c97d2a)' }} />
                צביעת ישובים לפי השתייכות דתית
              </div>
              <span className="toggle-switch" />
            </div>
            {visible.sectColors && (
              <>
                <div className="sect-legend">
                  {([
                    { sect: 'shia',      label: 'שיעים',    color: '#2a8a6e' },
                    { sect: 'sunni',     label: 'סונים',    color: '#c97d2a' },
                    { sect: 'christian', label: 'נוצרים',   color: '#b03030' },
                    { sect: 'druze',     label: 'דרוזים',   color: '#7b3fa0' },
                    { sect: 'mixed',     label: 'מעורב',    color: '#6b7280' },
                  ] as const).map(s => (
                    <div key={s.sect} className="sect-legend-row">
                      <span className="sect-legend-dot" style={{ background: s.color }} />
                      <span>{s.label}</span>
                    </div>
                  ))}
                </div>
                <p className="legend-note">צבע הגבול והנקודה על תווית הישוב מציינים את ההשתייכות הדתית הדומיננטית.</p>
              </>
            )}

            {/* ---- navigation overlay labels toggle ---- */}
            <div className="layer-group-title layer-group-title-labels" style={{ marginTop: 12 }}>תוויות ניווט</div>
            <div
              className="toggle-row"
              data-active={visible.navLabels}
              onClick={visibleKey('navLabels')}
              role="switch"
              aria-checked={visible.navLabels}
              data-testid="toggle-layer-navLabels"
            >
              <div className="toggle-label">
                <span className="toggle-swatch" style={{ background: 'linear-gradient(90deg,#6ed1c2,#d49a3a)' }} />
                תוויות מסלול: יעד, מרחק, זמן צפוי והתקדמות
              </div>
              <span className="toggle-switch" />
            </div>
            {visible.navLabels && (
              <p className="legend-note">
                בזמן ניווט פעיל: תוצג תווית יעד (שם), מרחק כולל וזמן משוער על הנתיב,
                אחוז השלמת המסלול (כשיש GPS), ומרחק נותר ליעד על החץ המסמן מיקומך.
                כיבוי מנקה עבור מפה נקייה יותר.
              </p>
            )}
          </div>

          <div className="panel-section" id="nav-section">
            <h3>ניווט כבישים נקודה לנקודה</h3>
            <div className="route-form" data-testid="route-form">
              <div className="route-picker-grid">
                <div className="route-picker">
                  <label>
                    <span>חפש נקודת מוצא</span>
                    <div className="route-start-row">
                      <input
                        className="search"
                        value={navStartQuery}
                        onChange={e => setNavStartQuery(e.target.value)}
                        placeholder={navStart ? navStart.label : 'לדוגמה: נאקורה, מטולה, צור…'}
                        data-testid="input-route-start-search"
                      />
                      <button
                        className={`btn use-my-location-btn${locationStatus === 'watching' && liveLocation ? ' active' : ''}`}
                        onClick={() => {
                          setNavStartId('live-location');
                          setNavStartQuery('מיקום נוכחי (GPS)');
                          if (liveLocation) {
                            showToast('נקודת מוצא: מיקום נוכחי');
                          } else {
                            showToast('מפעיל GPS — מיקום יוגדר כנקודת מוצא');
                            if (watchId === null) {
                              setLiveFollowDetached(false);
                              liveToastShownRef.current = true;
                              beginLiveLocationWatch();
                            }
                          }
                        }}
                        title="השתמש במיקום הנוכחי כנקודת מוצא"
                        data-testid="button-use-my-location"
                      >
                        📍 ממיקומי
                      </button>
                    </div>
                  </label>
                  <div className="route-pick-results" data-testid="route-start-results">
                    {startMatches.map(p => (
                      <button
                        key={`start-${p.id}`}
                        className="route-pick"
                        data-active={navStartId === p.id}
                        onClick={() => {
                          setNavStartId(p.id);
                          setNavStartQuery(p.label);
                        }}
                        data-testid={`button-route-start-${p.id}`}
                      >
                        <span>{p.label}</span>
                        <small>{p.group}</small>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="route-picker">
                  <label>
                    <span>חפש יעד</span>
                    <input
                      className="search"
                      value={navEndQuery}
                      onChange={e => setNavEndQuery(e.target.value)}
                      placeholder={navEnd ? navEnd.label : 'לדוגמה: צור, קריית שמונה, יוניפי״ל…'}
                      data-testid="input-route-end-search"
                    />
                  </label>
                  <div className="route-pick-results" data-testid="route-end-results">
                    {endMatches.map(p => (
                      <button
                        key={`end-${p.id}`}
                        className="route-pick"
                        data-active={navEndId === p.id}
                        onClick={() => {
                          setNavEndId(p.id);
                          setNavEndQuery(p.label);
                        }}
                        data-testid={`button-route-end-${p.id}`}
                      >
                        <span>{p.label}</span>
                        <small>{p.group}</small>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <details className="route-advanced">
                <summary>בחירה מרשימה מלאה</summary>
              <label>
                <span>נקודת מוצא</span>
                <select
                  value={navStartId}
                  onChange={e => setNavStartId(e.target.value)}
                  data-testid="select-route-start"
                >
                  <option value="">בחר נקודת מוצא…</option>
                  {['נקודות עניין אישיות', 'יישובים בלבנון', 'יישובי ייחוס בישראל', 'רכסים, הרים, נחלים ונהרות', 'נקודות יוניפי״ל ציבוריות', 'אירועים מדווחים'].map(group => (
                    <optgroup key={group} label={group}>
                      {navPoints.filter(p => p.group === group).map(p => (
                        <option key={p.id} value={p.id}>{p.label}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </label>
              <label>
                <span>יעד</span>
                <select
                  value={navEndId}
                  onChange={e => setNavEndId(e.target.value)}
                  data-testid="select-route-end"
                >
                  <option value="">בחר יעד…</option>
                  {['נקודות עניין אישיות', 'יישובים בלבנון', 'יישובי ייחוס בישראל', 'רכסים, הרים, נחלים ונהרות', 'נקודות יוניפי״ל ציבוריות', 'אירועים מדווחים'].map(group => (
                    <optgroup key={group} label={group}>
                      {navPoints.filter(p => p.group === group).map(p => (
                        <option key={p.id} value={p.id}>{p.label}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </label>
              </details>
              <div className="route-actions">
                <button
                  className="btn"
                  disabled={!navStart || !navEnd || navStart.id === navEnd.id}
                  onClick={() => {
                    if (!navigationRoute) return;
                    setFocusTarget({
                      lat: (navigationRoute.start.lat + navigationRoute.end.lat) / 2,
                      lon: (navigationRoute.start.lon + navigationRoute.end.lon) / 2,
                      zoom: 11,
                      id: `route-${Date.now()}`,
                    });
                    showToast('המפה מוקדה למסלול הכבישים');
                  }}
                  data-testid="button-route-focus"
                >
                  הצג מסלול כבישים
                </button>
                <button
                  className="btn"
                  onClick={toggleLiveLocation}
                  aria-pressed={locationStatus === 'watching'}
                  data-testid="button-live-location"
                >
                  {locationStatus === 'watching' ? 'כבה מיקום חי' : 'הצג מיקום מכשיר'}
                </button>
                {/* ---- Nav scale selector ---- */}
                <div className="nav-scale-row" data-testid="nav-scale-selector">
                  <span className="nav-scale-label">זום ניווט:</span>
                  {NAV_SCALES.map(s => (
                    <button
                      key={s.label}
                      className={`btn nav-scale-btn${navScaleLabel === s.label ? ' active' : ''}`}
                      onClick={() => {
                        setNavScaleLabel(s.label);
                        showToast(`זום ניווט: ${s.label}`);
                      }}
                      title={`סולם ${s.label} — תקריב zoom ${s.zoom}`}
                      data-testid={`button-nav-scale-${s.label.replace(':', '-')}`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                <button
                  className="btn ghost"
                  onClick={() => {
                    setNavStartId('');
                    setNavEndId('');
                    setNavStartQuery('');
                    setNavEndQuery('');
                    setNavCustomStart(null);
                    setNavCustomEnd(null);
                    setRoadRoute(null);
                    setAlternativeRoute(null);
                    setActiveRouteIndex(0);
                    setActiveSavedRoute(null);
                    setRouteStatus('idle');
                    setFootRoute(null);
                    setFootRouteStatus('idle');
                    setActiveRouteId('drive');
                    showToast('בחירת המסלול אופסה');
                  }}
                  data-testid="button-route-clear"
                >
                  איפוס
                </button>
              </div>
              {/* ── Route display mode toggle ── */}
              {(navStart && navEnd && navStart.id !== navEnd.id) && (
                <div className="route-display-mode-row" data-testid="route-display-mode-row">
                  <span className="nav-scale-label">תצוגה:</span>
                  {(['road', 'aerial', 'both'] as RouteDisplayMode[]).map(mode => {
                    const labels: Record<RouteDisplayMode, string> = {
                      road: '🛣 כביש',
                      aerial: '✈ אווירי',
                      both: '⊕ שניהם',
                    };
                    return (
                      <button
                        key={mode}
                        className={`btn nav-scale-btn${routeDisplayMode === mode ? ' active' : ''}`}
                        onClick={() => setRouteDisplayMode(mode)}
                        data-testid={`button-display-mode-${mode}`}
                      >
                        {labels[mode]}
                      </button>
                    );
                  })}
                </div>
              )}
              {/* ── Route option cards ── */}
              {routeOptions.length > 0 ? (
                <div className="route-options-list" data-testid="route-options-list">
                  {routeOptions.map(opt => (
                    <div
                      key={opt.id}
                      className={`route-option-card${activeRouteId === opt.id ? ' active' : ''}`}
                      style={{ '--route-color': opt.color } as React.CSSProperties}
                      onClick={() => setActiveRouteId(opt.id)}
                      data-testid={`route-option-card-${opt.id}`}
                      role="button"
                      aria-pressed={activeRouteId === opt.id}
                    >
                      <div className="route-option-header">
                        <span className="route-option-name">{opt.labelHe}</span>
                        {opt.status === 'loading' && (
                          <span className="route-option-badge loading">מחשב…</span>
                        )}
                        {opt.status === 'error' && (
                          <span className="route-option-badge error">שגיאה</span>
                        )}
                      </div>
                      <div className="route-option-km">
                        <strong>{fmtKm(opt.km)}</strong>
                        {opt.durationMin != null && (
                          <span> · {Math.round(opt.durationMin)} דק׳</span>
                        )}
                      </div>
                      <div className="route-option-tags">
                        <span className="route-option-tag passability">{opt.passabilityHe}</span>
                        <span className="route-option-tag airspace">{opt.airspaceHe}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="route-summary" data-testid="text-route-summary">
                  <span>בחר שתי נקודות שונות כדי להציג מסלולים אפשריים.</span>
                </div>
              )}
              {/* ---- נווט עכשיו — כפתור השקת אפליקציית ניווט חיצונית ---- */}
              {navEnd && (
                <div className="launch-nav-box" data-testid="launch-nav-box">
                  <button
                    className="btn launch-nav-btn"
                    onClick={() => openExternalNav(
                      navEnd.lat, navEnd.lon, navEnd.label,
                      navStart?.lat ?? liveLocation?.lat,
                      navStart?.lon ?? liveLocation?.lon,
                    )}
                    data-testid="button-launch-external-nav"
                  >
                    ▶ נווט עכשיו — פתח Waze / Google Maps
                  </button>
                  <p className="legend-note launch-nav-note">
                    {liveLocation
                      ? `מנווט ממיקומך (${liveLocation.lat.toFixed(4)}, ${liveLocation.lon.toFixed(4)}) אל ${navEnd.label}`
                      : navStart
                        ? `מנווט מ${navStart.label} אל ${navEnd.label}`
                        : `ינווט מהמיקום הנוכחי לפי אפליקציית הניווט אל ${navEnd.label}`
                    }
                  </p>
                </div>
              )}
              {locationStatus !== 'idle' && (
                <div className="route-summary compact" data-testid="text-location-status">
                  {locationStatus === 'watching' && liveLocation && (
                    <span>מיקום חי פעיל · המפה עוקבת אחרי הסמן בזום קרוב · אחרי גרירה יופיע כפתור “מרכז אותי” · דיוק משוער: {Math.round(liveLocation.accuracy ?? 0)} מ׳</span>
                  )}
                  {locationStatus === 'watching' && !liveLocation && <span>ממתין להרשאת מיקום מהמכשיר…</span>}
                  {locationStatus === 'error' && <span>לא ניתן לקרוא את מיקום המכשיר. בדוק הרשאות דפדפן או שהדפדפן אינו תומך במיקום חי.</span>}
                </div>
              )}
              <div className="voice-guidance-box" data-testid="voice-guidance-box">
                <div className="voice-guidance-head">
                  <strong>הנחיות קוליות</strong>
                  <span data-testid="text-voice-status">
                    {voiceStatus === 'speaking' ? 'משמיע כעת' : voiceStatus === 'unsupported' ? 'לא נתמך בדפדפן' : 'מוכן'}
                  </span>
                </div>
                <div className="voice-language-grid" role="group" aria-label="בחירת שפת הנחיות קוליות">
                  {([
                    ['he', 'עברית', 'בדיקה והנחיות בעברית.'],
                    ['en', 'English', 'Test and guidance in English.'],
                  ] as const).map(([lang, label, desc]) => (
                    <button
                      key={lang}
                      className="voice-language-btn"
                      onClick={() => {
                        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                        setVoiceLanguage(lang);
                        setVoiceStatus('idle');
                      }}
                      aria-pressed={voiceLanguage === lang}
                      data-testid={`button-voice-lang-${lang}`}
                    >
                      <span>{label}</span>
                      <small>{desc}</small>
                    </button>
                  ))}
                </div>
                <div className="voice-mode-grid" role="group" aria-label="בחירת מצב הנחיות קוליות">
                  {([
                    ['off', 'ללא קול', 'לא יושמעו הנחיות.'],
                    ['basic', 'בסיסיות', 'הכרזת מסלול ועדכוני מרחק מעטים.'],
                    ['detailed', 'מפורטות', 'מסלול, זמן, מרחק, כיוון ודיוק מיקום.'],
                  ] as const).map(([mode, label, desc]) => (
                    <button
                      key={mode}
                      className="voice-mode-btn"
                      onClick={() => setVoiceMode(mode)}
                      aria-pressed={voiceGuidance === mode}
                      data-testid={`button-voice-${mode}`}
                    >
                      <span>{label}</span>
                      <small>{desc}</small>
                    </button>
                  ))}
                </div>
                <div className="route-actions">
                  <button
                    className="btn ghost"
                    disabled={voiceGuidance === 'off'}
                    onClick={testVoiceGuidance}
                    data-testid="button-voice-test"
                  >
                    בדיקת קול
                  </button>
                </div>
                <div className="turn-instruction-card" data-testid="turn-instruction-card">
                  <span>הוראת פנייה במסלול</span>
                  <strong data-testid="text-turn-instruction">
                    {currentTurnInstruction?.text ?? 'בחר מסלול כדי לקבל הוראת פנייה.'}
                  </strong>
                  <small>
                    {currentTurnInstruction
                      ? currentTurnInstruction.confidence === 'route'
                        ? 'מבוסס על הוראות OSRM כאשר זמינות, או על מסלול מיובא/שמור.'
                        : 'אומדן לפי קו מוצא ויעד בלבד, ללא פירוט פניות כביש.'
                      : 'ההוראה תתעדכן כאשר ייבחר מסלול פעיל.'}
                  </small>
                </div>
                <p className="legend-note">
                  ההנחיות מושמעות מקומית דרך הדפדפן. ניתן לבחור עברית או אנגלית; אם למכשיר אין קול עברי מותקן, הדפדפן עדיין יקבל טקסט עברי אך איכות ההשמעה תלויה במנוע הדיבור של המכשיר. במסלול OSRM ההוראות מבוססות על צעדי המסלול שהשירות מחזיר; במסלול מיובא או מוקלט ייתכן אומדן לפי נקודות המסלול בלבד. אין שליחת קול או מיקום לשרת.
                </p>
              </div>
              <div className="save-route-box">
                <input
                  className="search"
                  value={routeName}
                  onChange={e => setRouteName(e.target.value)}
                  placeholder="שם למסלול לשמירה…"
                  data-testid="input-route-name"
                />
                <div className="route-actions">
                  <button className="btn" disabled={!navigationRoute} onClick={saveCurrentRoute} data-testid="button-save-route">
                    שמור מסלול
                  </button>
                  <button
                    className="btn ghost"
                    disabled={!navigationRoute}
                    onClick={() => navigationRoute && downloadJson('south-lebanon-route.json', {
                      id: `route-${Date.now()}`,
                      name: safeText(routeName, `${navigationRoute.start.label} ← ${navigationRoute.end.label}`) || `${navigationRoute.start.label} ← ${navigationRoute.end.label}`,
                      createdAt: new Date().toISOString(),
                      startId: navStartId || undefined,
                      endId: navEndId || undefined,
                      ...navigationRoute,
                    })}
                    data-testid="button-export-route"
                  >
                    ייצוא קובץ מסלול
                  </button>
                </div>
              </div>
              <div className="route-actions">
                <label className="file-import">
                  ייבוא קובץ מסלול
                  <input
                    type="file"
                    accept="application/json,.json"
                    onChange={e => {
                      importRoutes(e.target.files?.[0]).catch(() => setRouteStatus('error'));
                      e.currentTarget.value = '';
                    }}
                    data-testid="input-import-route"
                  />
                </label>
                <button
                  className="btn ghost"
                  disabled={savedRoutes.length === 0}
                  onClick={() => downloadJson('south-lebanon-routes-library.json', savedRoutes)}
                  data-testid="button-export-all-routes"
                >
                  ייצוא כל המסלולים
                </button>
              </div>
              {savedRoutes.length > 0 && (
                <div className="saved-routes" data-testid="saved-routes">
                  {savedRoutes.map(route => (
                    <div className="saved-route" key={route.id}>
                      <button onClick={() => loadSavedRoute(route)} data-testid={`button-load-route-${route.id}`}>
                        <strong>{route.name}</strong>
                        <small>{fmtKm(route.km)}{route.durationMin ? ` · ${Math.round(route.durationMin)} דק׳` : ''}</small>
                      </button>
                      <button
                        className="mini-delete"
                        onClick={() => {
                          setSavedRoutes(prev => prev.filter(r => r.id !== route.id));
                          showToast(`המסלול “${route.name}” נמחק מהרשימה המקומית`);
                        }}
                        data-testid={`button-delete-route-${route.id}`}
                        aria-label={`מחיקת ${route.name}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="legend-note">
                הניתוב מבוסס OpenStreetMap/OSRM ציבורי ואינו כולל תנועה בזמן אמת, חסימות, מחסומים או הערכת בטיחות. ניתן להפעיל מיקום חי גם ללא מסלול; כאשר מיקום חי פעיל, המפה מתמקדת אוטומטית בסמן המכשיר בזום קרוב. אם גוררים את המפה למקום אחר, העקיבה נעצרת זמנית ומופיע כפתור “מרכז אותי” לחזרה לסמן. מצב הניווט נשמר מקומית, ולכן לאחר רענון או חזרה לאפליקציה המסלול חוזר. GPS ברקע תלוי במדיניות הדפדפן והמכשיר.
              </p>
            </div>
          </div>

          <RecordingPanel
            recordingStatus={recordingStatus}
            recordedTrack={recordedTrack}
            recordedKm={recordedKm}
            recordingName={recordingName}
            setRecordingName={setRecordingName}
            onStartStop={recordingStatus === 'recording' ? stopRecording : startRecording}
            onClear={() => setRecordedTrack([])}
            onSave={saveRecording}
            onExport={() => {
              const route = recordingToRoute();
              if (route) downloadJson('recorded-route.json', route);
            }}
            showToast={showToast}
          />

          <MultiRoutePanel
            multiRouteBuildMode={multiRouteBuildMode}
            setMultiRouteBuildMode={setMultiRouteBuildMode}
            multiRouteDraftPoints={multiRouteDraftPoints}
            setMultiRouteDraftPoints={setMultiRouteDraftPoints}
            multiRouteTotalKm={multiRouteTotalKm}
            multiRouteName={multiRouteName}
            setMultiRouteName={setMultiRouteName}
            multiRouteDescription={multiRouteDescription}
            setMultiRouteDescription={setMultiRouteDescription}
            multiRouteDifficulty={multiRouteDifficulty}
            setMultiRouteDifficulty={setMultiRouteDifficulty}
            multiRoutePassability={multiRoutePassability}
            setMultiRoutePassability={setMultiRoutePassability}
            savedMultiRoutes={savedMultiRoutes}
            setSavedMultiRoutes={setSavedMultiRoutes}
            activeMultiRoute={activeMultiRoute}
            setActiveMultiRoute={setActiveMultiRoute}
            measureMode={measureMode}
            setMeasureMode={setMeasureMode}
            addPoiMode={addPoiMode}
            setAddPoiMode={setAddPoiMode}
            saveMultiRoute={saveMultiRoute}
            loadMultiRoute={loadMultiRoute}
            exportMultiRoute={exportMultiRoute}
            showToast={showToast}
          />

          <PoiPanel
            addPoiMode={addPoiMode}
            setAddPoiMode={setAddPoiMode}
            poiDraft={poiDraft}
            setPoiDraft={setPoiDraft}
            poiName={poiName}
            setPoiName={setPoiName}
            poiDescription={poiDescription}
            setPoiDescription={setPoiDescription}
            poiMarkerSize={poiMarkerSize}
            setPoiMarkerSize={setPoiMarkerSize}
            poiMarkerShape={poiMarkerShape}
            setPoiMarkerShape={setPoiMarkerShape}
            poiMarkerColor={poiMarkerColor}
            setPoiMarkerColor={setPoiMarkerColor}
            customPois={customPois}
            setCustomPois={setCustomPois}
            savePoi={savePoi}
            importPois={importPois}
            downloadJson={downloadJson}
            setFocusTarget={setFocusTarget}
            measureMode={measureMode}
            setMeasureMode={setMeasureMode}
            setManualMeasure={setManualMeasure}
            showToast={showToast}
          />

          <FilterPanel
            yearFrom={yearFrom}
            yearTo={yearTo}
            years={years}
            setYearFrom={setYearFrom}
            setYearTo={setYearTo}
          />

          <IncidentFiltersPanel
            typeFilter={typeFilter}
            sevFilter={sevFilter}
            setTypeFilter={setTypeFilter}
            setSevFilter={setSevFilter}
          />

          <SearchPanel
            query={query}
            searchResults={searchResults}
            setQuery={setQuery}
            onResultClick={result => {
              setFocusTarget({ lat: result.lat, lon: result.lon, zoom: result.zoom, id: `${result.id}-${Date.now()}` });
              if ('incidentId' in result && typeof result.incidentId === 'string') setSelectedId(result.incidentId);
            }}
          />

          <LabelPreferencesPanel
            allLabels={allLabels}
            largeLabels={largeLabels}
            setAllLabels={setAllLabels}
            setLargeLabels={setLargeLabels}
            setVisible={setVisible}
          />
        </div>
      </aside>

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
      <div className="map-overlays">
        <button
          className="compass-button"
          onClick={() => setCompassMode(v => !v)}
          aria-pressed={compassMode}
          data-testid="button-compass"
          title={compassMode ? 'חזרה לצפון למעלה' : 'סובב לפי כיוון הנסיעה'}
        >
          <span
            className="compass-needle"
            style={{ transform: `rotate(${mapBearing + userMapRotation}deg)` }}
          >▲</span>
          <span>{compassMode ? 'כיוון נסיעה' : 'צפון'}</span>
          <small>אזימוט {Math.round(mapBearing)}°</small>
        </button>
        {userMapRotation !== 0 && (
          <button
            className="compass-button reset-north-btn"
            onClick={resetMapRotation}
            data-testid="button-reset-north"
            title={`הצפן מחדש (סבב ${Math.round(userMapRotation)}°)`}
          >
            <span
              className="compass-needle"
              style={{ transform: `rotate(${userMapRotation}deg)`, color: 'var(--accent-warm, #f6c453)' }}
            >▲</span>
            <span>הצפן</span>
            <small>{Math.round(userMapRotation)}° מסובב</small>
          </button>
        )}
        {/* Rotation lock button + snap picker */}
        <button
          className={`rotation-lock-btn${rotationLocked ? ' active' : ''}`}
          onClick={toggleRotationLock}
          aria-pressed={rotationLocked}
          data-testid="button-rotation-lock"
          title={rotationLocked ? 'בטל נעילת סיבוב' : 'נעל סיבוב — סיבוב חופשי באצבעות מבוטל'}
        >
          <span className="lock-icon">{rotationLocked ? '🔒' : '🔓'}</span>
          <span>{rotationLocked ? 'נעול' : 'חופשי'}</span>
          <small>סיבוב</small>
        </button>
        {snapPickerOpen && (
          <div className="snap-rotation-picker" data-testid="snap-rotation-picker">
            <div className="snap-picker-title">בחר זוית סיבוב</div>
            <div className="snap-picker-grid">
              {SNAP_ANGLES.map(deg => (
                <button
                  key={deg}
                  className={`snap-angle-btn${userMapRotation === deg ? ' selected' : ''}`}
                  onClick={() => handleSnapRotation(deg)}
                  title={`סבב ${deg}°`}
                >
                  <span style={{ display: 'inline-block', transform: `rotate(${deg}deg)` }}>↑</span>
                  <span>{SNAP_LABELS[deg]}</span>
                </button>
              ))}
            </div>
            <button className="snap-picker-close" onClick={() => setSnapPickerOpen(false)}>סגור</button>
          </div>
        )}
        <button
          className="map-menu-fab"
          onClick={handlePanelToggle}
          aria-pressed={panelsCollapsed}
          data-testid="button-map-toggle-menu"
        >
          {panelsCollapsed ? 'פתח תפריט' : 'סגור תפריט'}
        </button>
        {panelsCollapsed && (
          <button
            className="mini-map-fab"
            onClick={() => openMiniWindow().catch(() => setMiniOverlayOpen(true))}
            data-testid="button-map-mini-window"
          >
            חלון מוקטן
          </button>
        )}
        {liveLocation && liveFollowDetached && (
          <button
            className={`center-live-fab ${panelsCollapsed ? 'below-mini' : ''}`}
            onClick={centerLiveLocation}
            data-testid="button-center-live"
            title="מרכז את המפה חזרה למיקום המכשיר"
          >
            מרכז אותי
            <small>חזרה לסמן</small>
          </button>
        )}
        {measureMode && (
          <div className="measure-hud" data-testid="hud-measure">
            <div className="row"><span>מצב מדידה ידנית</span></div>
            <div className="row">
              <span>נקודות שנבחרו</span>
              <span className="km">{manualMeasure.length} / 2</span>
            </div>
            {manualKm !== null && (
              <div className="row">
                <span>מרחק (Haversine)</span>
                <span className="km" data-testid="text-manual-distance">{fmtKm(manualKm)}</span>
              </div>
            )}
            <div className="hint">לחיצה ראשונה — נקודה א׳, שנייה — נקודה ב׳. לחיצה שלישית מאפסת.</div>
          </div>
        )}
      </div>

      {toastMessage && (
        <div className="app-toast" role="status" aria-live="polite" data-testid="toast-message">
          {toastMessage}
        </div>
      )}

      {/* ===== Resume-navigation dialog ===== */}
      {resumeNavDialog && (
        <div className="resume-nav-overlay" role="dialog" aria-modal="true" aria-label="המשך בניווט">
          <div className="resume-nav-card">
            <div className="resume-nav-icon">🗯️</div>
            <h3 className="resume-nav-title">המשך בניווט?</h3>
            <p className="resume-nav-body">
              נמצא ניווט שמור אל{' '}
              <strong>{resumeNavDialog.endLabel}</strong>
              {resumeNavDialog.km > 0 && (
                <span className="resume-nav-km"> · {resumeNavDialog.km.toFixed(1)} ק״מ</span>
              )}
            </p>
            <p className="resume-nav-from">מ: {resumeNavDialog.startLabel}</p>
            <div className="resume-nav-buttons">
              <button
                className="resume-nav-btn resume-nav-btn-yes"
                onClick={() => {
                  setResumeNavDialog(null);
                  document.getElementById('nav-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                ▶ המשך בניווט
              </button>
              <button
                className="resume-nav-btn resume-nav-btn-no"
                onClick={() => {
                  setResumeNavDialog(null);
                  // Clear nav state so the user starts fresh
                  setNavStartId('');
                  setNavEndId('');
                  setNavStartQuery('');
                  setNavEndQuery('');
                  setNavCustomStart(null);
                  setNavCustomEnd(null);
                  setRoadRoute(null);
                  setFootRoute(null);
                  setActiveRouteId('drive');
                  setRouteDisplayMode('road');
                }}
              >
                ✕ בטל ניווט
              </button>
            </div>
          </div>
        </div>
      )}

      {miniOverlayOpen && (
        <div className="mini-overlay" data-testid="mini-overlay" role="dialog" aria-live="polite" aria-label="חלון מוקטן למצב ניווט">
          <div className="mini-overlay-head">
            <strong>חלון מוקטן — מצב ניווט</strong>
            <button
              className="mini-close"
              onClick={() => setMiniOverlayOpen(false)}
              data-testid="button-close-mini-overlay"
              aria-label="סגירת חלון מוקטן"
            >
              ×
            </button>
          </div>
          <div className="mini-route" data-testid="text-mini-route">
            {navigationRoute ? `${navigationRoute.start.label} ← ${navigationRoute.end.label}` : 'אין מסלול פעיל'}
          </div>
          <div
            className="mini-nav-panel"
            data-testid="mini-nav-map"
            aria-label="מפת מיני ניווט"
            dangerouslySetInnerHTML={{ __html: miniNavSvgMarkup() }}
          />
          <div className="mini-turn" data-testid="mini-turn-instruction">
            <small>הוראת פנייה במסלול</small>
            <b>{currentTurnInstruction?.text ?? 'אין הוראת פנייה זמינה'}</b>
          </div>
          <div className="mini-grid">
            <span>
              <small>מרחק</small>
              <b>{navigationRoute ? fmtKm(navigationRoute.km) : '—'}</b>
            </span>
            <span>
              <small>זמן</small>
              <b>{navigationRoute?.durationMin ? `${Math.round(navigationRoute.durationMin)} דק׳` : '—'}</b>
            </span>
            <span>
              <small>מיקום חי</small>
              <b>{liveLocation ? `${liveLocation.lat.toFixed(5)}, ${liveLocation.lon.toFixed(5)}` : 'לא פעיל'}</b>
            </span>
            <span>
              <small>הקלטה</small>
              <b>{recordedTrack.length ? `${recordedTrack.length} נק׳ · ${fmtKm(recordedKm)}` : 'לא פעילה'}</b>
            </span>
          </div>
          <p>
            {miniStatus === 'mobile'
              ? 'בנייד מוצג מיני־ניווט פנימי כדי למנוע פתיחת חלון חיצוני שעלולה להעביר את הדפדפן לרקע או לסגור את התצוגה.'
              : miniStatus === 'fallback'
              ? 'Picture-in-Picture או Popup נחסמו, לכן מוצג חלון צף בתוך האפליקציה.'
              : 'החלון המוקטן מציג תמונת מצב של הניווט וההקלטה.'}
            {' '}דפדפן ווב אינו יכול להבטיח z-order מעל כל האפליקציות בכל מכשיר.
          </p>
        </div>
      )}

      {/* ============ Right panel: analytics + selected ============ */}
      <aside className="panel right" data-testid="panel-analytics">
        <div className="panel-scroll">
          <div className="panel-section">
            <h3>סיכום אנליטי</h3>
            <div className="kpi-grid">
              <div className="kpi">
                <div className="kpi-label">אירועים מסוננים</div>
                <div className="kpi-value" data-testid="kpi-total">{stats.total}</div>
                <div className="kpi-sub">מתוך {incidents.length} בסה״כ</div>
              </div>
              <div className="kpi">
                <div className="kpi-label">מרחק ממוצע לקו הכחול</div>
                <div className="kpi-value" data-testid="kpi-avg">{isFinite(stats.avg) ? stats.avg.toFixed(1) : '—'}</div>
                <div className="kpi-sub">ק״מ · ממוצע</div>
              </div>
              <div className="kpi">
                <div className="kpi-label">מינ׳ מרחק</div>
                <div className="kpi-value">{isFinite(stats.min) ? stats.min.toFixed(2) : '—'}</div>
                <div className="kpi-sub">ק״מ</div>
              </div>
              <div className="kpi">
                <div className="kpi-label">מקס׳ מרחק</div>
                <div className="kpi-value">{isFinite(stats.max) ? stats.max.toFixed(1) : '—'}</div>
                <div className="kpi-sub">ק״מ</div>
              </div>
            </div>
          </div>

          <div className="panel-section">
            <h3>פילוח לפי סוג אירוע</h3>
            {stats.byType.map(({ type, n }) => {
              const max = Math.max(1, ...stats.byType.map(x => x.n));
              return (
                <div className="bar-row" key={type}>
                  <span className="count">{n}</span>
                  <span className="bar" aria-hidden="true"><div style={{ width: `${(n / max) * 100}%`, background: TYPE_COLOR[type] }} /></span>
                  <span className="label">{TYPE_LABEL[type]}</span>
                </div>
              );
            })}
          </div>

          <div className="panel-section">
            <h3>
              <span>{selected ? 'אירוע נבחר' : 'רשימת אירועים'}</span>
              <span style={{ color: 'var(--text-faint)', fontSize: 10, textTransform: 'none', letterSpacing: 0 }}>
                {filtered.length} אירועים מתאימים
              </span>
            </h3>
            {selected ? (
              <div className="incident-card" data-selected="true" data-testid={`detail-${selected.id}`}>
                <div className="incident-head">
                  <span className={`sev ${selected.severity}`} />
                  <span className="incident-date">{fmtDate(selected.date)}</span>
                </div>
                <p className="incident-title">{selected.title_he}</p>
                <p style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--text-muted)', margin: '8px 0' }}>
                  {selected.desc_he}
                </p>
                <div className="incident-meta">
                  <span className="tag type" style={{ color: TYPE_COLOR[selected.type], borderColor: TYPE_COLOR[selected.type] }}>{TYPE_LABEL[selected.type]}</span>
                  <span className="tag">חומרה: {SEV_LABEL[selected.severity]}</span>
                  {selected.approx && <span className="tag approx">מיקום מקורב</span>}
                </div>
                <div style={{ marginTop: 10, fontSize: 12 }}>
                  <div style={{ color: 'var(--text-muted)' }}>מרחק מקו הכחול</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--accent-hi)', fontSize: 16, marginTop: 2 }} data-testid="text-distance-blue">
                    {fmtKm(distanceById.get(selected.id)?.km ?? distanceToPolyline([selected.lat, selected.lon], blueLine).km)}
                  </div>
                </div>
                <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <a className="btn" href={selected.source_url} target="_blank" rel="noopener" data-testid="link-source">
                    מקור: {selected.source_label} ↗
                  </a>
                  <button className="btn ghost" onClick={() => setSelectedId(null)} data-testid="button-clear-selection">
                    ניקוי בחירה
                  </button>
                </div>
              </div>
            ) : (
              filtered.slice(0, 60).map(i => (
                <div
                  key={i.id}
                  className="incident-card"
                  onClick={() => setSelectedId(i.id)}
                  data-testid={`card-incident-${i.id}`}
                >
                  <div className="incident-head">
                    <span className={`sev ${i.severity}`} />
                    <span className="incident-date">{fmtDate(i.date)}</span>
                  </div>
                  <p className="incident-title">{i.title_he}</p>
                  <div className="incident-meta">
                    <span className="tag type" style={{ color: TYPE_COLOR[i.type] }}>{TYPE_LABEL[i.type]}</span>
                    {i.approx && <span className="tag approx">מקורב</span>}
                  </div>
                </div>
              ))
            )}
            {!selected && filtered.length === 0 && (
              <p style={{ color: 'var(--text-faint)', fontSize: 12 }}>אין אירועים תואמים את הסינון.</p>
            )}
          </div>
        </div>
      </aside>

      {/* ============ Footer ============ */}
      <div className="footer">
        <span className="disclaimer-pill">הצהרה</span>
        <span>
          הדמיה חינוכית בלבד ממקורות פתוחים. המיקומים מקורבים. אין במידע המוצג נתוני מודיעין מבצעי, מטרות, מצבורים או נקודות שיגור.
        </span>
      </div>

      {/* ============ Drawer: sources & about ============ */}
      {drawerOpen && (
        <div className="drawer" onClick={() => setDrawerOpen(false)} role="dialog" aria-modal="true">
          <div className="drawer-panel" onClick={e => e.stopPropagation()} data-testid="drawer-sources">
            <div className="drawer-head">
              <h2>על אודות ומקורות</h2>
              <button className="btn ghost" onClick={() => setDrawerOpen(false)} data-testid="button-close-drawer">סגירה</button>
            </div>
            <div className="drawer-body">
              <h4>על אודות</h4>
              <p>
                מפה אינטראקטיבית לחקר המרחב הדרום־לבנוני, מהקו הכחול בדרום ועד נהר הליטני בצפון —
                האזור המוגדר בהחלטת מועצת הביטחון 1701 כאזור פעולת יוניפי״ל וצבא לבנון בלבד.
                האפליקציה נועדה להמחיש את האתגרים הלוגיסטיים והביטחוניים של רעיון אזור החיץ:
                צפיפות יישובים אזרחיים, פריסת כוחות בינלאומיים, אזורי השפעה היסטוריים של חזבאללה,
                פיזור אירועים ביטחוניים בשנים האחרונות, וכלי עזר מקומיים לניווט, מדידה, הקלטה,
                חלון מיני, הנחיות קוליות והוראות פנייה לפי המסלול. כל הנתונים נשאבים מדיווח פומבי בלבד
                (תקשורת, מסמכי או״ם, מאגרים אקדמיים), המיקומים מקורבים, וההדמיה אינה מהווה
                מודיעין מבצעי או נתוני מטרות.
              </p>
              <p>
                נבנה כחלק מפורטפוליו הפרויקטים של יוצר האפליקציה:
                {' '}
                <a
                  href="https://portfolio-dusky-eight-77.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="link-portfolio-about"
                >
                  portfolio-dusky-eight-77.vercel.app
                </a>
              </p>

              <h4>או״ם וגופים בינלאומיים</h4>
              {sources.filter(s => s.category === 'un').map(s => (
                <a key={s.url} href={s.url} target="_blank" rel="noopener" data-testid={`source-${s.url}`}>{s.title_he} ↗</a>
              ))}

              <h4>תקשורת</h4>
              {sources.filter(s => s.category === 'media').map(s => (
                <a key={s.url} href={s.url} target="_blank" rel="noopener">{s.title_he} ↗</a>
              ))}

              <h4>בסיסי נתונים אקדמיים / מחקריים</h4>
              {sources.filter(s => s.category === 'data').map(s => (
                <a key={s.url} href={s.url} target="_blank" rel="noopener">{s.title_he} ↗</a>
              ))}

              <h4>מפות בסיס</h4>
              {sources.filter(s => s.category === 'osm').map(s => (
                <a key={s.url} href={s.url} target="_blank" rel="noopener">{s.title_he} ↗</a>
              ))}

              <h4>הצהרת שימוש</h4>
              <p>
                ההדמיה היא חינוכית בלבד. המיקומים מוצגים מקורבים. שכבת חזבאללה היא איכותית
                ומבוססת דיווחים פתוחים בלבד — אין במידע נתוני מטרות, מבני נשק, מנהרות, מצבורים
                או נקודות שיגור. המידע אינו מהווה מודיעין, אינו תחליף לגורם רשמי, ואין לעשות בו
                שימוש מבצעי. הדמיית הקו הכחול וקו הליטני מקורבת לצורכי ויזואליזציה ואינה גבול
                סקור גיאודטית.
              </p>
            </div>
          </div>
        </div>
      )}

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

      {supportOpen && (
        <div className="drawer" onClick={() => setSupportOpen(false)} role="dialog" aria-modal="true">
          <div className="drawer-panel support-panel" onClick={e => e.stopPropagation()} data-testid="drawer-support">
            <div className="drawer-head">
              <h2>תמיכה בהמשך הפיתוח</h2>
              <button className="btn ghost" onClick={() => setSupportOpen(false)} data-testid="button-close-support">סגירה</button>
            </div>
            <div className="drawer-body">
              <div className="support-card">
                <h4>למה לתמוך?</h4>
                <p>
                  התמיכה מסייעת להמשיך לפתח את האפליקציה: שיפור שכבות המפה, הוספת יכולות ניווט, בדיקות אבטחה, תיעוד בעברית, ותחזוקת הפריסה.
                </p>
                <div className="support-actions">
                  <button className="btn primary" onClick={openDonationLink} data-testid="button-open-donation">
                    תרומה ב־Bit
                  </button>
                  <button className="btn ghost" onClick={() => copyDonationLink().catch(() => undefined)} data-testid="button-copy-donation">
                    {donationCopied ? 'הקישור הועתק' : 'העתק קישור Bit'}
                  </button>
                  <button
                    className="btn"
                    onClick={() => shareCurrentApp().catch(() => undefined)}
                    data-testid="button-share-app"
                  >
                    שתף את האפליקציה
                  </button>
                  <a
                    className="btn ghost"
                    href="https://portfolio-dusky-eight-77.vercel.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="link-support-portfolio"
                  >
                    מעבר לפורטפוליו
                  </a>
                </div>
                <a
                  className="copyable-link"
                  href={DONATION_CONTACT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="link-donate-contact"
                >
                  {DONATION_CONTACT_URL}
                </a>
                <p className="legend-note">
                  התרומה מתבצעת דרך Bit בקישור חיצוני מאובטח. האפליקציה אינה שומרת פרטי תשלום ואינה מעבדת תשלומים בעצמה.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {aboutOpen && (
        <div className="drawer" onClick={() => setAboutOpen(false)} role="dialog" aria-modal="true">
          <div className="drawer-panel about-panel" onClick={e => e.stopPropagation()} data-testid="drawer-about">
            <div className="drawer-head">
              <h2>About</h2>
              <button className="btn ghost" onClick={() => setAboutOpen(false)} data-testid="button-close-about">סגירה</button>
            </div>
            <div className="drawer-body">
              <section className="about-card" data-testid="card-about">
                <p className="about-kicker">קרדיט פיתוח</p>
                <h3>פותח ע״י יגאל קריגל - קה״ד גדס״מ 5679 - גדוד סיור מיוחד</h3>
                <p>
                  האפליקציה נבנתה כמפת מצב אינטראקטיבית וחינוכית למרחב דרום לבנון עד נהר הליטני,
                  עם שכבות מידע, חיפוש, ניווט כבישים, מצפן, מיני־ניווט, הנחיות קוליות בעברית ובאנגלית,
                  הוראות פנייה לפי המסלול, הקלטת מסלולים, נקודות עניין ושיתוף קבצים מקומי.
                </p>
                <div className="about-meta">
                  <span>React + Leaflet</span>
                  <span>RTL Hebrew UI</span>
                  <span>Local-first privacy</span>
                  <span style={{ fontWeight: 600, color: 'var(--accent)' }}>v2.0.0</span>
                </div>
                <div className="support-actions">
                  <a
                    className="btn primary"
                    href="https://portfolio-dusky-eight-77.vercel.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="link-about-portfolio"
                  >
                    פורטפוליו
                  </a>
                  <button
                    className="btn"
                    onClick={() => shareCurrentApp().catch(() => undefined)}
                    data-testid="button-about-share"
                  >
                    שתף את האפליקציה
                  </button>
                  <button
                    className="btn ghost"
                    onClick={openDonationLink}
                    data-testid="button-about-donate"
                  >
                    תרומה ב־Bit
                  </button>
                  <button
                    className="btn ghost"
                    onClick={() => copyDonationLink().catch(() => undefined)}
                    data-testid="button-about-copy-donation"
                  >
                    {donationCopied ? 'הקישור הועתק' : 'העתק קישור'}
                  </button>
                </div>
              </section>
              <h4>הצהרת שימוש</h4>
              <p>
                המפה מיועדת להמחשה וללמידה בלבד. המיקומים מקורבים, הנתונים מבוססי מקורות פתוחים,
                ואין באפליקציה נתוני מודיעין מבצעי, מטרות, מצבורים או נקודות שיגור.
              </p>
            </div>
          </div>
        </div>
      )}

      <HelpDrawer open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
