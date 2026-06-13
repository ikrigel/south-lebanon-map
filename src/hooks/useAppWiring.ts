import { useRef, useState, useEffect, useMemo } from 'react';
import type { MapHandle } from '../Map';
import { incidents, blueLine, towns, unifilPoints, terrainFeatures, influenceZones } from '../data/geo';
import { sources } from '../data/sources';
import { DEFAULT_MAP_VIEW } from '../constants';
import { loadLocalNavSession } from '../storage/navSessionLoader';
import { useAppOrchestration } from './useAppOrchestration';
import { useNavigationDerived } from './useNavigationDerived';
import { useRouteManagement } from './useRouteManagement';
import { useLiveLocationActions } from './useLiveLocationActions';
import { useMiniWindow } from './useMiniWindow';
import { useCurrentTurnInstruction } from './useCurrentTurnInstruction';
import { usePoiManagement } from './usePoiManagement';
import { useQrImportHandlers } from './useQrImportHandlers';
import { useAppUtilities } from './useAppUtilities';
import { useMapInteraction } from './useMapInteraction';
import { useViewReset } from './useViewReset';
import { useRecording } from './useRecording';
import { useIncidentDistances } from './useIncidentDistances';
import { useIncidentFiltering } from './useIncidentFiltering';
import { usePanelCallbacks } from './usePanelCallbacks';
import { useSearchResults } from './useSearchResults';
import { openExternalNav } from '../navigation/externalNav';

export const useAppWiring = () => {
  const orch = useAppOrchestration();
  const {
    filterState, poiState, multiRouteState, mapDisplayState, uiState, navState,
    showToast, recordingStatus, setRecordingStatus, recordedTrack, setRecordedTrack,
    recordingWatchId, setRecordingWatchId, recordingName, setRecordingName,
    handleMapViewChange, lastDistToDestMRef, initialNavSessionRef, initialRecordingSessionRef, initialMapViewRef,
  } = orch;

  const mapViewRef = useRef<MapHandle>(null);
  const liveToastShownRef = useRef(false);

  const [voiceGuidance, setVoiceGuidance] = useState(() => loadLocalNavSession()?.voiceGuidance ?? 'off');
  const [voiceLanguage, setVoiceLanguage] = useState(() => loadLocalNavSession()?.voiceLanguage ?? 'he');
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'speaking' | 'unsupported'>('idle');

  const { distances, distanceById } = useIncidentDistances({ filtered: incidents, blueLine });
  const incidentFiltering = useIncidentFiltering({
    incidents,
    yearFrom: filterState.yearFrom,
    yearTo: filterState.yearTo,
    typeFilter: filterState.typeFilter,
    sevFilter: filterState.sevFilter,
    query: filterState.query,
    selectedId: filterState.selectedId,
    distances,
    distanceById,
    blueLine,
  });
  const { filtered, selected, distanceLine, stats } = incidentFiltering;

  const navigationDerived = useNavigationDerived({
    navStartId: navState.navStartId,
    navEndId: navState.navEndId,
    navStartQuery: navState.navStartQuery,
    navEndQuery: navState.navEndQuery,
    navCustomStart: navState.navCustomStart,
    navCustomEnd: navState.navCustomEnd,
    liveLocation: navState.liveLocation,
    customPois: poiState.customPois,
    activeSavedRoute: navState.activeSavedRoute,
    activeRouteOption: navState.activeRouteOption,
    navPosition: navState.navPosition,
    lastDistToDestMRef,
    recordedTrack,
    towns,
    unifilPoints,
    roadRoute: navState.roadRoute,
    footRoute: navState.footRoute,
    savedMultiRoutes: multiRouteState.savedMultiRoutes,
    activeMultiRoute: multiRouteState.activeMultiRoute,
  });

  const { navigationRoute, mapBearing, navPoints, navStart, navEnd, startMatches, endMatches } = navigationDerived;

  const searchResultsData = useSearchResults({
    query: filterState.query,
    mapSearchQuery: mapDisplayState.mapSearchQuery,
    customPois: poiState.customPois,
    towns,
    incidents,
    unifilPoints,
    terrainFeatures,
    influenceZones,
  });
  const { searchResults, mapSearchResults } = searchResultsData;

  const routeOverlays = navState.routeOptions;

  const currentTurnInstruction = useCurrentTurnInstruction({
    navigationRoute,
    navPosition: navState.navPosition,
    mapBearing,
  });

  const { miniNavSvgMarkup, openMiniWindow } = useMiniWindow({
    navigationRoute,
    liveLocation: navState.liveLocation,
    recordedTrack,
    recordedKm: recordedTrack.length >= 2 ? recordedTrack.reduce((s, p, i) => s + (i > 0 ? Math.sqrt(Math.pow(p[0] - recordedTrack[i - 1][0], 2) + Math.pow(p[1] - recordedTrack[i - 1][1], 2)) * 111 : 0), 0) : 0,
    currentTurnInstruction,
    mapBearing,
    miniExternalWindowRef: uiState.miniExternalWindowRef,
    setMiniOverlayOpen: uiState.setMiniOverlayOpen,
    setMiniStatus: uiState.setMiniStatus,
  });

  const routeManagement = useRouteManagement({
    navigationRoute,
    routeName: navState.routeName,
    navStartId: navState.navStartId,
    navEndId: navState.navEndId,
    multiRouteDraftPoints: multiRouteState.multiRouteDraftPoints,
    multiRouteName: multiRouteState.multiRouteName,
    multiRouteDescription: multiRouteState.multiRouteDescription,
    multiRouteDifficulty: multiRouteState.multiRouteDifficulty,
    multiRoutePassability: multiRouteState.multiRoutePassability,
    savedMultiRoutes: multiRouteState.savedMultiRoutes,
    setSavedMultiRoutes: multiRouteState.setSavedMultiRoutes,
    savedRoutes: navState.savedRoutes,
    setSavedRoutes: navState.setSavedRoutes,
    setActiveSavedRoute: navState.setActiveSavedRoute,
    setActiveMultiRoute: multiRouteState.setActiveMultiRoute,
    setFocusTarget: mapDisplayState.setFocusTarget,
    showToast,
    downloadJson: useAppUtilities({ showToast }).downloadJson,
  });

  const liveLocationActions = useLiveLocationActions({
    watchId: navState.watchId,
    setWatchId: navState.setWatchId,
    liveLocation: navState.liveLocation,
    setLiveLocation: navState.setLiveLocation,
    setNavPosition: navState.setNavPosition,
    setLocationStatus: navState.setLocationStatus,
    setLiveFollowDetached: mapDisplayState.setLiveFollowDetached,
    liveCenterRequestId: mapDisplayState.liveCenterRequestId,
    setLiveCenterRequestId: mapDisplayState.setLiveCenterRequestId,
    setPanelsCollapsed: uiState.setPanelsCollapsed,
    setNavStartId: navState.setNavStartId,
    setNavCustomStart: navState.setNavCustomStart,
    setNavEndId: navState.setNavEndId,
    setNavCustomEnd: navState.setNavCustomEnd,
    setNavStartQuery: navState.setNavStartQuery,
    navStartQuery: navState.navStartQuery,
    navEndQuery: navState.navEndQuery,
    setNavEndQuery: navState.setNavEndQuery,
    liveToastShownRef,
    beginRecordingWatch: useRecording({ recordedTrack, recordingName, recordedKm: 0, setRecordedTrack, setRecordingStatus, setRecordingWatchId, setLiveLocation: navState.setLiveLocation, setSavedRoutes: navState.setSavedRoutes, setActiveSavedRoute: navState.setActiveSavedRoute, setRecordingName, showToast }).beginRecordingWatch,
    recordingWatchId,
    initialNavSessionRef,
    initialRecordingSessionRef,
    showToast,
  });

  const poiManagement = usePoiManagement({
    poiDraft: poiState.poiDraft,
    poiName: poiState.poiName,
    poiDescription: poiState.poiDescription,
    poiMarkerColor: poiState.poiMarkerColor,
    poiMarkerShape: poiState.poiMarkerShape,
    poiMarkerSize: poiState.poiMarkerSize,
    customPois: poiState.customPois,
    setPoiDraft: poiState.setPoiDraft,
    setPoiName: poiState.setPoiName,
    setPoiDescription: poiState.setPoiDescription,
    setCustomPois: poiState.setCustomPois,
    setAddPoiMode: poiState.setAddPoiMode,
    showToast,
    downloadJson: useAppUtilities({ showToast }).downloadJson,
  });

  const qrImportHandlers = useQrImportHandlers({
    setSavedRoutes: navState.setSavedRoutes,
    setSavedMultiRoutes: multiRouteState.setSavedMultiRoutes,
    setRecordedTrack,
    setRecordingName,
    setCustomPois: poiState.setCustomPois,
    showToast,
  });

  const appUtilities = useAppUtilities({ showToast });

  const mapInteraction = useMapInteraction({
    addPoiMode: poiState.addPoiMode,
    measureMode: uiState.measureMode,
    multiRouteBuildMode: multiRouteState.multiRouteBuildMode,
    multiRouteDraftPoints: multiRouteState.multiRouteDraftPoints,
    setMultiRouteDraftPoints: multiRouteState.setMultiRouteDraftPoints,
    setPoiDraft: poiState.setPoiDraft,
    setManualMeasure: uiState.setManualMeasure,
    setSelectedId: filterState.setSelectedId,
    showToast,
  });

  const viewReset = useViewReset({
    setVisible: mapDisplayState.setVisible,
    setThemeMode: uiState.setThemeMode,
    setLargeLabels: mapDisplayState.setLargeLabels,
    setAllLabels: mapDisplayState.setAllLabels,
    setCompassMode: navState.setCompassMode,
    setMeasureMode: uiState.setMeasureMode,
    setManualMeasure: uiState.setManualMeasure,
    setSelectedId: filterState.setSelectedId,
    setLiveFollowDetached: mapDisplayState.setLiveFollowDetached,
    setRotationLocked: navState.setRotationLocked,
    setUserMapRotation: navState.setUserMapRotation,
  });

  const panelCallbacks = usePanelCallbacks({
    panelsCollapsed: uiState.panelsCollapsed,
    setPanelsCollapsed: uiState.setPanelsCollapsed,
    panelDragRef: uiState.panelDragRef,
    panelHeightPct: uiState.panelHeightPct,
    setPanelHeightPct: uiState.setPanelHeightPct,
  });

  useEffect(() => {
    const effectiveTheme = uiState.themeMode === 'auto' ? (uiState.autoDay ? 'light' : 'dark') : uiState.themeMode;
    document.documentElement.classList.toggle('theme-light', effectiveTheme === 'light');
    document.documentElement.classList.toggle('theme-dark', effectiveTheme === 'dark');
  }, [uiState.themeMode, uiState.autoDay]);

  useEffect(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => mapViewRef.current?.invalidateSize()));
  }, [uiState.panelsCollapsed]);

  const effectiveTheme = uiState.themeMode === 'auto' ? (uiState.autoDay ? 'light' : 'dark') : uiState.themeMode;

  return {
    effectiveTheme,
    panelsCollapsed: uiState.panelsCollapsed,
    panelHeightPct: uiState.panelHeightPct,
    appProps: {
      ...filterState,
      ...navState,
      ...poiState,
      ...multiRouteState,
      ...mapDisplayState,
      ...panelCallbacks,
      panelRef: uiState.panelRef,
      panelDragRef: uiState.panelDragRef,
      navigationRoute,
      navPoints,
      navStart,
      navEnd,
      startMatches,
      endMatches,
      mapBearing,
      currentTurnInstruction,
      miniNavSvgMarkup,
      ...routeManagement,
      ...liveLocationActions,
      ...poiManagement,
      ...qrImportHandlers,
      ...appUtilities,
      ...mapInteraction,
      ...viewReset,
      handleResetView: () => {
        viewReset.resetView();
        mapDisplayState.setFocusTarget({ ...DEFAULT_MAP_VIEW, id: `reset-view-${Date.now()}` });
        showToast('התצוגה אופסה לברירת המחדל');
      },
      visibleKey: (k: string) => () => mapDisplayState.setVisible(v => ({ ...v, [k]: !v[k] })),
      distanceById,
      mapSearchResults,
      openExternalNav,
      searchResults,
    },
    mapViewRef,
    openMiniWindow,
    miniNavSvgMarkup,
    miniOverlayOpen: uiState.miniOverlayOpen,
    setMiniOverlayOpen: uiState.setMiniOverlayOpen,
    miniStatus: uiState.miniStatus,
    voiceGuidance,
    setVoiceGuidance,
    voiceLanguage,
    setVoiceLanguage,
    voiceStatus,
    setVoiceStatus,
    themeMode: uiState.themeMode,
    setThemeMode: uiState.setThemeMode,
    handleResetView: () => {
      viewReset.resetView();
      mapDisplayState.setFocusTarget({ ...DEFAULT_MAP_VIEW, id: `reset-view-${Date.now()}` });
      showToast('התצוגה אופסה לברירת המחדל');
    },
    setHelpOpen: uiState.setHelpOpen,
    setSupportOpen: uiState.setSupportOpen,
    setAboutOpen: uiState.setAboutOpen,
    measureMode: uiState.measureMode,
    setMeasureMode: uiState.setMeasureMode,
    setManualMeasure: uiState.setManualMeasure,
    setDrawerOpen: uiState.setDrawerOpen,
    setTransferOpen: uiState.setTransferOpen,
    initialMapViewRef,
    visible: mapDisplayState.visible,
    filtered,
    selected,
    distanceLine,
    largeLabels: mapDisplayState.largeLabels,
    allLabels: mapDisplayState.allLabels,
    focusTarget: mapDisplayState.focusTarget,
    navigationRoute,
    routeOverlays,
    routeDisplayMode: navState.routeDisplayMode,
    liveLocation: navState.liveLocation,
    liveCenterRequestId: mapDisplayState.liveCenterRequestId,
    handleLiveFollowDetachedChange: mapDisplayState.setLiveFollowDetached,
    handleMapViewChange,
    recordedTrack,
    compassMode: navState.compassMode,
    mapBearing,
    userMapRotation: navState.userMapRotation,
    handleUserRotationChange: navState.handleUserRotationChange,
    rotationLocked: navState.rotationLocked,
    poiDraft: poiState.poiDraft,
    poiMarkerColor: poiState.poiMarkerColor,
    poiMarkerShape: poiState.poiMarkerShape,
    poiMarkerSize: poiState.poiMarkerSize,
    customPois: poiState.customPois,
    multiRouteDraftPoints: multiRouteState.multiRouteDraftPoints,
    activeMultiRoute: multiRouteState.activeMultiRoute,
    navFollowZoom: navState.navFollowZoom,
    navigateFromCurrentPosition: liveLocationActions.navigateFromCurrentPosition,
    setMapPointAsNavStart: liveLocationActions.setMapPointAsNavStart,
    onMapClick: mapInteraction.onMapClick,
    manualMeasure: uiState.manualMeasure,
    addPoiMode: poiState.addPoiMode,
    multiRouteBuildMode: multiRouteState.multiRouteBuildMode,
    setCompassMode: navState.setCompassMode,
    toggleRotationLock: navState.toggleRotationLock,
    snapPickerOpen: navState.snapPickerOpen,
    setSnapPickerOpen: navState.setSnapPickerOpen,
    handleSnapRotation: navState.handleSnapRotation,
    resetMapRotation: viewReset.resetMapRotation,
    liveFollowDetached: mapDisplayState.liveFollowDetached,
    centerLiveLocation: liveLocationActions.centerLiveLocation,
    manualKm,
    toastMessage: uiState.toastMessage,
    resumeNavDialog: uiState.resumeNavDialog,
    setResumeNavDialog: uiState.setResumeNavDialog,
    setNavStartId: navState.setNavStartId,
    setNavEndId: navState.setNavEndId,
    setNavStartQuery: navState.setNavStartQuery,
    setNavEndQuery: navState.setNavEndQuery,
    setNavCustomStart: navState.setNavCustomStart,
    setNavCustomEnd: navState.setNavCustomEnd,
    setRoadRoute: navState.setRoadRoute,
    setFootRoute: navState.setFootRoute,
    setActiveRouteId: navState.setActiveRouteId,
    setRouteDisplayMode: navState.setRouteDisplayMode,
    currentTurnInstruction,
    recordedKm: recordedTrack.length >= 2 ? recordedTrack.reduce((s, p, i) => s + (i > 0 ? Math.sqrt(Math.pow(p[0] - recordedTrack[i - 1][0], 2) + Math.pow(p[1] - recordedTrack[i - 1][1], 2)) * 111 : 0), 0) : 0,
    stats,
    incidents,
    distanceById,
    blueLine,
    setSelectedId: filterState.setSelectedId,
    drawerOpen: uiState.drawerOpen,
    sources,
    transferOpen: uiState.transferOpen,
    savedRoutes: navState.savedRoutes,
    savedMultiRoutes: multiRouteState.savedMultiRoutes,
    recordingName,
    handleQrImportPois: qrImportHandlers.handleQrImportPois,
    handleQrImportRoutes: qrImportHandlers.handleQrImportRoutes,
    handleQrImportMultiRoutes: qrImportHandlers.handleQrImportMultiRoutes,
    handleQrImportRecording: qrImportHandlers.handleQrImportRecording,
    supportOpen: uiState.supportOpen,
    donationCopied: uiState.donationCopied,
    openDonationLink: appUtilities.openDonationLink,
    copyDonationLink: appUtilities.copyDonationLink,
    shareCurrentApp: appUtilities.shareCurrentApp,
    aboutOpen: uiState.aboutOpen,
    helpOpen: uiState.helpOpen,
  };
};
