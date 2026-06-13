import { useCallback, useMemo } from 'react';
import type { SavedRoute, MultiPointRoute } from '../types';
import { MAX_ROUTE_FILE_BYTES, MAX_IMPORTED_ROUTES, MAX_ROUTE_POINTS } from '../constants';
import { fmtKm } from '../util';
import { normalizeRoutePath } from '../storage/loaders';

interface UseRouteManagementProps {
  navigationRoute: any | null;
  routeName: string;
  navStartId: string | null;
  navEndId: string | null;
  multiRouteDraftPoints: any[];
  multiRouteName: string;
  multiRouteDescription: string;
  multiRouteDifficulty: string;
  multiRoutePassability: string;
  savedMultiRoutes: MultiPointRoute[];
  setSavedMultiRoutes: (fn: (prev: MultiPointRoute[]) => MultiPointRoute[]) => void;
  savedRoutes: SavedRoute[];
  setSavedRoutes: (fn: (prev: SavedRoute[]) => SavedRoute[]) => void;
  setActiveSavedRoute: (route: SavedRoute | null) => void;
  setActiveMultiRoute: (route: MultiPointRoute | null) => void;
  setFocusTarget: (target: any) => void;
  showToast: (msg: string) => void;
  downloadJson: (filename: string, data: any) => void;
}

export const useRouteManagement = (props: UseRouteManagementProps) => {
  const {
    navigationRoute, routeName, navStartId, navEndId, multiRouteDraftPoints,
    multiRouteName, multiRouteDescription, multiRouteDifficulty, multiRoutePassability,
    savedMultiRoutes, setSavedMultiRoutes, savedRoutes, setSavedRoutes,
    setActiveSavedRoute, setActiveMultiRoute, setFocusTarget, showToast, downloadJson,
  } = props;

  const multiRouteTotalKm = useMemo(() => {
    if (!multiRouteDraftPoints.length) return 0;
    let total = 0;
    for (let i = 1; i < multiRouteDraftPoints.length; i++) {
      const dx = multiRouteDraftPoints[i].lat - multiRouteDraftPoints[i - 1].lat;
      const dy = multiRouteDraftPoints[i].lon - multiRouteDraftPoints[i - 1].lon;
      total += Math.sqrt(dx * dx + dy * dy) * 111; // rough km per degree
    }
    return total;
  }, [multiRouteDraftPoints]);

  const saveMultiRoute = useCallback(() => {
    if (multiRouteDraftPoints.length < 2) {
      showToast('אנא בחר לפחות שתי נקודות');
      return;
    }
    const newRoute: MultiPointRoute = {
      id: `multi-route-${Date.now()}`,
      name: multiRouteName || 'מסלול חדש',
      description: multiRouteDescription || '',
      difficulty: multiRouteDifficulty as any,
      passability: multiRoutePassability as any,
      points: multiRouteDraftPoints,
      totalKm: multiRouteTotalKm,
      createdAt: new Date().toISOString(),
    };
    setSavedMultiRoutes(prev => [newRoute, ...prev]);
    setActiveMultiRoute(newRoute);
    showToast(`מסלול "${newRoute.name}" נשמר`);
  }, [multiRouteDraftPoints, multiRouteName, multiRouteDescription, multiRouteDifficulty, multiRoutePassability, multiRouteTotalKm, setSavedMultiRoutes, setActiveMultiRoute, showToast]);

  const exportMultiRoute = useCallback(() => {
    if (!navigationRoute) {
      showToast('אין מסלול פעיל להייצוא');
      return;
    }
    const data = {
      name: routeName || 'מסלול',
      ...navigationRoute,
    };
    downloadJson('multi-route.json', data);
  }, [navigationRoute, routeName, showToast, downloadJson]);

  const loadMultiRoute = useCallback((file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const route = JSON.parse(e.target?.result as string);
        if (route.start && route.end && route.path) {
          setActiveSavedRoute(route);
          setFocusTarget({ lat: route.start.lat, lon: route.start.lon, zoom: 12 });
          showToast('מסלול נטען בהצלחה');
        } else {
          showToast('פורמט קובץ לא תקין');
        }
      } catch {
        showToast('שגיאה בקריאת הקובץ');
      }
    };
    reader.readAsText(file);
  }, [setActiveSavedRoute, setFocusTarget, showToast]);

  const saveCurrentRoute = useCallback(() => {
    if (!navigationRoute) {
      showToast('אין מסלול פעיל לשמירה');
      return;
    }
    const newRoute: SavedRoute = {
      id: `route-${Date.now()}`,
      name: routeName || 'מסלול',
      ...navigationRoute,
      createdAt: new Date().toISOString(),
    };
    setSavedRoutes(prev => [newRoute, ...prev]);
    showToast(`מסלול "${newRoute.name}" נשמר`);
  }, [navigationRoute, routeName, setSavedRoutes, showToast]);

  const loadSavedRoute = useCallback((route: SavedRoute) => {
    setActiveSavedRoute(route);
    setFocusTarget({ lat: route.start.lat, lon: route.start.lon, zoom: 12, label: route.name });
    showToast(`מסלול "${route.name}" נטען`);
  }, [setActiveSavedRoute, setFocusTarget, showToast]);

  const importRoutes = useCallback(async (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_ROUTE_FILE_BYTES) {
      showToast(`קובץ גדול מדי. מקסימום: ${MAX_ROUTE_FILE_BYTES / 1024}KB`);
      return;
    }
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const routes = Array.isArray(data) ? data : data.routes || [];
      const valid = routes
        .slice(0, MAX_IMPORTED_ROUTES)
        .map(r => normalizeRoutePath(r))
        .filter(r => r !== null && r.path && r.path.length >= 2) as SavedRoute[];
      if (!valid.length) {
        showToast('לא נמצאו מסלולים תקפים בקובץ');
        return;
      }
      setSavedRoutes(prev => [...valid, ...prev]);
      showToast(`${valid.length} מסלולים יובאו מקובץ`);
    } catch {
      showToast('שגיאה בקריאת קובץ המסלולים');
    }
  }, [setSavedRoutes, showToast]);

  return {
    saveMultiRoute,
    exportMultiRoute,
    loadMultiRoute,
    saveCurrentRoute,
    loadSavedRoute,
    importRoutes,
    multiRouteTotalKm,
  };
};
