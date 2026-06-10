import { useState, useCallback, useRef } from 'react';
import { loadLocalNavSession } from '../storage/navSessionLoader';
import { loadLocalSavedRoutes } from '../storage/sessionLoaders';
import { loadLocalUiState } from '../storage/sessionLoaders';
import type { RoadRoute, SavedRoute, RouteDisplayMode } from '../types';
import { DEFAULT_NAV_SCALE_LABEL } from '../constants';

export const useNavState = () => {
  const initialNavSessionRef = useRef<any | null>(null);
  if (initialNavSessionRef.current === null) initialNavSessionRef.current = loadLocalNavSession();
  const initialUiStateRef = useRef<any | null>(null);
  if (initialUiStateRef.current === null) initialUiStateRef.current = loadLocalUiState();

  const [navStartId, setNavStartId] = useState(() => {
    const saved = initialNavSessionRef.current?.navStartId ?? '';
    if (saved === 'live-location') {
      return initialNavSessionRef.current?.navCustomStart ? 'custom-nav-start' : '';
    }
    return saved;
  });
  const [navEndId, setNavEndId] = useState(() => initialNavSessionRef.current?.navEndId ?? '');
  const [navStartQuery, setNavStartQuery] = useState(() => initialNavSessionRef.current?.navStartQuery ?? '');
  const [navEndQuery, setNavEndQuery] = useState(() => initialNavSessionRef.current?.navEndQuery ?? '');
  const [roadRoute, setRoadRoute] = useState<RoadRoute | null>(() => initialNavSessionRef.current?.roadRoute ?? null);
  const [footRoute, setFootRoute] = useState<RoadRoute | null>(() => initialNavSessionRef.current?.footRoute ?? null);
  const [alternativeRoute, setAlternativeRoute] = useState<any | null>(null);
  const [activeRouteIndex, setActiveRouteIndex] = useState<number>(0);
  const [routeStatus, setRouteStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>(() => (initialNavSessionRef.current?.roadRoute ? 'ready' : 'idle'));
  const [footRouteStatus, setFootRouteStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>(() => (initialNavSessionRef.current?.footRoute ? 'ready' : 'idle'));
  const [routeName, setRouteName] = useState(() => initialNavSessionRef.current?.routeName ?? '');
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>(() => loadLocalSavedRoutes());
  const [activeSavedRoute, setActiveSavedRoute] = useState<SavedRoute | null>(() => initialNavSessionRef.current?.activeSavedRoute ?? null);
  const [liveLocation, setLiveLocation] = useState<any | null>(null);
  const [navPosition, setNavPosition] = useState<{ lat: number; lon: number } | null>(null);
  const navPositionRef = useRef<{ lat: number; lon: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'watching' | 'error'>('idle');
  const [watchId, setWatchId] = useState<number | null>(null);
  const [compassMode, setCompassMode] = useState(false);
  const [userMapRotation, setUserMapRotation] = useState(() => initialUiStateRef.current?.userMapRotation ?? 0);
  const handleUserRotationChange = useCallback((deg: number) => {
    setUserMapRotation(((deg % 360) + 360) % 360);
  }, []);
  const resetMapRotation = useCallback(() => setUserMapRotation(0), []);
  const [rotationLocked, setRotationLocked] = useState(false);
  const [snapPickerOpen, setSnapPickerOpen] = useState(false);
  const handleSnapRotation = useCallback((deg: number) => {
    setUserMapRotation(deg);
    setSnapPickerOpen(false);
  }, []);
  const toggleRotationLock = useCallback(() => {
    setRotationLocked(v => {
      const next = !v;
      if (next) setSnapPickerOpen(true);
      return next;
    });
  }, []);
  const [routeDisplayMode, setRouteDisplayMode] = useState<RouteDisplayMode>(() => initialNavSessionRef.current?.routeDisplayMode ?? 'road');
  const [activeRouteId, setActiveRouteId] = useState<'drive' | 'foot' | 'aerial'>(() => initialNavSessionRef.current?.activeRouteId ?? 'drive');
  const [navCustomEnd, setNavCustomEnd] = useState(() => initialNavSessionRef.current?.navCustomEnd ?? null);
  const [navCustomStart, setNavCustomStart] = useState(() => initialNavSessionRef.current?.navCustomStart ?? null);
  const [navScaleLabel, setNavScaleLabel] = useState<string>(DEFAULT_NAV_SCALE_LABEL);

  return {
    navStartId, setNavStartId, navEndId, setNavEndId,
    navStartQuery, setNavStartQuery, navEndQuery, setNavEndQuery,
    roadRoute, setRoadRoute, footRoute, setFootRoute,
    alternativeRoute, setAlternativeRoute,
    activeRouteIndex, setActiveRouteIndex,
    routeStatus, setRouteStatus,
    footRouteStatus, setFootRouteStatus,
    routeName, setRouteName,
    savedRoutes, setSavedRoutes,
    activeSavedRoute, setActiveSavedRoute,
    liveLocation, setLiveLocation,
    navPosition, setNavPosition,
    navPositionRef,
    locationStatus, setLocationStatus,
    watchId, setWatchId,
    compassMode, setCompassMode,
    userMapRotation, setUserMapRotation,
    handleUserRotationChange, resetMapRotation,
    rotationLocked, setRotationLocked,
    snapPickerOpen, setSnapPickerOpen,
    handleSnapRotation, toggleRotationLock,
    routeDisplayMode, setRouteDisplayMode,
    activeRouteId, setActiveRouteId,
    navCustomEnd, setNavCustomEnd,
    navCustomStart, setNavCustomStart,
    navScaleLabel, setNavScaleLabel,
  };
};
