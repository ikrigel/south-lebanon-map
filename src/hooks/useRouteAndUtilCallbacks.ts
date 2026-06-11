import { useCallback } from 'react';
import { safeText, haversineKm } from '../util';
import { normalizeRouteInstructions } from '../navigation/routeParsers';
import type { SavedRoute, MultiPointRoute } from '../types';

interface UseRouteAndUtilCallbacksProps {
  navigationRoute: any;
  routeName: string;
  navStartId: string;
  navEndId: string;
  multiRouteDraftPoints: any[];
  multiRouteName: string;
  multiRouteDescription: string;
  multiRouteDifficulty: string;
  multiRoutePassability: string;
  savedMultiRoutes: MultiPointRoute[];
  savedRoutes: SavedRoute[];
  setRouteName: (n: string) => void;
  setSavedRoutes: (fn: (prev: SavedRoute[]) => SavedRoute[]) => void;
  setActiveSavedRoute: (r: SavedRoute) => void;
  setFocusTarget: (target: any) => void;
  setRoadRoute: (r: any) => void;
  setSavedMultiRoutes: (fn: (prev: MultiPointRoute[]) => MultiPointRoute[]) => void;
  setActiveMultiRoute: (r: MultiPointRoute) => void;
  setMultiRouteDraftPoints: (pts: any[]) => void;
  setMultiRouteName: (n: string) => void;
  setMultiRouteDescription: (d: string) => void;
  setMultiRouteBuildMode: (v: boolean) => void;
  setRouteStatus: (s: string) => void;
  downloadJson: (name: string, data: any) => void;
  showToast: (msg: string) => void;
}

export function useRouteAndUtilCallbacks(props: UseRouteAndUtilCallbacksProps) {
  const saveCurrentRoute = useCallback(() => {
    if (!props.navigationRoute) return;
    const fallbackName = `${props.navigationRoute.start.label} ← ${props.navigationRoute.end.label}`;
    const route: SavedRoute = {
      id: `route-${Date.now()}`,
      name: safeText(props.routeName, fallbackName) || fallbackName,
      createdAt: new Date().toISOString(),
      startId: props.navStartId || undefined,
      endId: props.navEndId || undefined,
      start: props.navigationRoute.start,
      end: props.navigationRoute.end,
      km: props.navigationRoute.km,
      durationMin: props.navigationRoute.durationMin,
      path: props.navigationRoute.path,
      instructions: props.navigationRoute.instructions,
    };
    props.setSavedRoutes(prev => [route, ...prev]);
    props.setActiveSavedRoute(route);
    props.setRouteName('');
    props.showToast(`המסלול "${route.name}" נשמר בזיכרון המקומי`);
  }, [props]);

  const loadSavedRoute = useCallback((route: SavedRoute) => {
    props.setActiveSavedRoute(route);
    props.setRoadRoute(route.path ? {
      km: route.km,
      durationMin: route.durationMin ?? 0,
      path: route.path,
      instructions: route.instructions,
    } : null);
    props.setFocusTarget({
      lat: (route.start.lat + route.end.lat) / 2,
      lon: (route.start.lon + route.end.lon) / 2,
      zoom: 11,
      id: `saved-${route.id}-${Date.now()}`,
    });
    props.showToast(`המסלול "${route.name}" נטען למפה`);
  }, [props]);

  const importRoutes = useCallback(async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 5_000_000) {
      props.setRouteStatus('error');
      props.showToast('קובץ המסלול גדול מדי לייבוא');
      return;
    }
    let data: unknown;
    try {
      const text = await file.text();
      data = JSON.parse(text);
    } catch {
      props.setRouteStatus('error');
      props.showToast('לא ניתן לקרוא את קובץ המסלול');
      return;
    }
    const routes = (Array.isArray(data) ? data : [data]).slice(0, 100);
    const valid = routes.filter((r: SavedRoute) =>
      r && r.start && r.end &&
      typeof r.start.lat === 'number' && typeof r.start.lon === 'number' &&
      typeof r.end.lat === 'number' && typeof r.end.lon === 'number' &&
      Math.abs(r.start.lat) <= 90 && Math.abs(r.end.lat) <= 90 &&
      Math.abs(r.start.lon) <= 180 && Math.abs(r.end.lon) <= 180
    ).map((r: SavedRoute) => ({
      id: safeText(r.id) || `route-${Date.now()}-${Math.random()}`,
      name: safeText(r.name, 'מסלול מיובא') || 'מסלול מיובא',
      createdAt: safeText(r.createdAt, new Date().toISOString()) || new Date().toISOString(),
      startId: safeText(r.startId),
      endId: safeText(r.endId),
      start: { lat: r.start.lat, lon: r.start.lon, label: safeText(r.start.label, 'נקודת מוצא') || 'נקודת מוצא' },
      end: { lat: r.end.lat, lon: r.end.lon, label: safeText(r.end.label, 'יעד') || 'יעד' },
      km: typeof r.km === 'number' && isFinite(r.km) && r.km >= 0 ? r.km : haversineKm([r.start.lat, r.start.lon], [r.end.lat, r.end.lon]),
      durationMin: typeof r.durationMin === 'number' && isFinite(r.durationMin) && r.durationMin >= 0 ? r.durationMin : undefined,
      path: Array.isArray(r.path) ? (r.path as [number, number][]).filter(p => Array.isArray(p) && p.length >= 2 && typeof p[0] === 'number' && typeof p[1] === 'number' && Math.abs(p[0]) <= 90 && Math.abs(p[1]) <= 180) : undefined,
      instructions: normalizeRouteInstructions(r.instructions),
    }));
    if (valid.length) {
      props.setSavedRoutes(prev => [...valid, ...prev]);
      props.showToast(`${valid.length} מסלולים יובאו בהצלחה`);
    } else {
      props.showToast('לא נמצאו מסלולים תקינים בקובץ');
    }
  }, [props]);

  const shareCurrentApp = useCallback(async () => {
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
  }, []);

  const openDonationLink = useCallback(() => {
    const DONATION_CONTACT_URL = 'https://contact.example.com/donate';
    const opened = window.open(DONATION_CONTACT_URL, '_blank', 'noopener,noreferrer');
    if (!opened) {
      window.location.href = DONATION_CONTACT_URL;
    }
  }, []);

  return {
    saveCurrentRoute,
    loadSavedRoute,
    importRoutes,
    shareCurrentApp,
    openDonationLink,
  };
}
