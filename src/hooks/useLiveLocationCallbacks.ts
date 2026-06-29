import { useCallback, useEffect, useRef } from 'react';
import { haversineKm } from '../util';

interface UseLiveLocationCallbacksProps {
  liveLocation: { lat: number; lon: number } | null;
  watchId: number | null;
  liveToastShownRef: React.MutableRefObject<boolean>;
  setLiveLocation: (loc: any) => void;
  setLocationStatus: (status: string) => void;
  setWatchId: (id: number | null) => void;
  setLiveFollowDetached: (v: boolean) => void;
  setPanelsCollapsed: (v: boolean) => void;
  setNavStartId: (id: string) => void;
  setNavStartQuery: (q: string) => void;
  setNavCustomStart: (pt: any) => void;
  setNavCustomEnd: (pt: any) => void;
  setFocusTarget: (target: any) => void;
  setLiveCenterRequestId: (id: string) => void;
  initialNavSessionRef: React.MutableRefObject<any>;
  beginRecordingWatch: (v: boolean) => void;
  showToast: (msg: string) => void;
}

interface PreviousLocationSnapshot {
  lat: number;
  lon: number;
  timestamp: number;
}

export function useLiveLocationCallbacks(props: UseLiveLocationCallbacksProps) {
  const resumedLiveRef = useRef(false);
  const previousLocationRef = useRef<PreviousLocationSnapshot | null>(null);

  const beginLiveLocationWatch = useCallback(() => {
    if (!('geolocation' in navigator)) {
      props.setLocationStatus('error');
      props.showToast('הדפדפן אינו תומך במיקום חי');
      return null;
    }
    const id = navigator.geolocation.watchPosition(
      pos => {
        const newLat = pos.coords.latitude;
        const newLon = pos.coords.longitude;
        const newTimestamp = Date.now();

        // Calculate speed from position movement
        let calculatedSpeed: number | null = null;
        const prevLoc = previousLocationRef.current;

        if (prevLoc) {
          const distanceKm = haversineKm([prevLoc.lat, prevLoc.lon], [newLat, newLon]);
          const timeElapsedHours = (newTimestamp - prevLoc.timestamp) / (1000 * 60 * 60);

          // Only use calculated speed if movement is significant (> 5m) to avoid GPS jitter
          if (distanceKm > 0.005 && timeElapsedHours > 0) {
            calculatedSpeed = distanceKm / timeElapsedHours;
          } else if (distanceKm <= 0.005) {
            // Stationary
            calculatedSpeed = 0;
          }
        }

        // Update reference for next calculation
        previousLocationRef.current = {
          lat: newLat,
          lon: newLon,
          timestamp: newTimestamp,
        };

        props.setLiveLocation({
          lat: newLat,
          lon: newLon,
          accuracy: pos.coords.accuracy,
          heading: pos.coords.heading,
          speed: calculatedSpeed !== null ? calculatedSpeed : (pos.coords.speed ?? null),
        });
        props.setLocationStatus('watching');
        if (!props.liveToastShownRef.current) {
          props.liveToastShownRef.current = true;
          props.showToast('מיקום חי הופעל והמפה תתמקד בסמן');
        }
      },
      () => {
        props.setLocationStatus('error');
        props.showToast('לא ניתן לקרוא מיקום. בדוק הרשאת מיקום בדפדפן');
      },
      { enableHighAccuracy: true, maximumAge: 5_000, timeout: 15_000 }
    );
    props.setWatchId(id);
    props.setLocationStatus('watching');
    return id;
  }, [props]);

  const toggleLiveLocation = useCallback(() => {
    if (props.watchId !== null) {
      navigator.geolocation.clearWatch(props.watchId);
      props.setWatchId(null);
      props.setLocationStatus('idle');
      props.setLiveLocation(null);
      props.setLiveFollowDetached(false);
      props.liveToastShownRef.current = false;
      previousLocationRef.current = null; // Reset speed calculation reference
      props.showToast('מיקום חי כובה');
      return;
    }
    props.setLiveFollowDetached(false);
    props.liveToastShownRef.current = false;
    props.showToast('מבקש הרשאת מיקום מהמכשיר…');
    beginLiveLocationWatch();
  }, [props, beginLiveLocationWatch]);

  const navigateFromCurrentPosition = useCallback((toLat: number, toLon: number, toLabel: string) => {
    props.setNavCustomEnd({ lat: toLat, lon: toLon, label: toLabel });
    props.setNavStartId('custom-nav-end');
    props.setNavStartQuery(toLabel);
    if (props.liveLocation) {
      props.setNavStartId('live-location');
      props.setNavStartQuery('מיקום נוכחי (GPS)');
      props.showToast(`מנווט ממיקומך אל ${toLabel}`);
    } else {
      props.setNavStartId('');
      props.setNavStartQuery('');
      props.showToast(`יעד נקבע: ${toLabel}. קבע גם נקודת מוצא או הפעל GPS`);
    }
    props.setPanelsCollapsed(false);
    requestAnimationFrame(() =>
      document.getElementById('nav-section')?.scrollIntoView({ behavior: 'smooth' })
    );
  }, [props]);

  const setMapPointAsNavStart = useCallback((lat: number, lon: number, label: string) => {
    props.setNavCustomStart({ lat, lon, label });
    props.setNavStartId('custom-nav-start');
    props.setNavStartQuery(label);
    props.showToast(`נקודת מוצא נקבעה: ${label}`);
    props.setPanelsCollapsed(false);
    requestAnimationFrame(() =>
      document.getElementById('nav-section')?.scrollIntoView({ behavior: 'smooth' })
    );
  }, [props]);

  const handleLiveFollowDetachedChange = useCallback((detached: boolean) => {
    props.setLiveFollowDetached(detached);
  }, [props]);

  const centerLiveLocation = useCallback(() => {
    if (!props.liveLocation) return;
    const target = {
      lat: props.liveLocation.lat,
      lon: props.liveLocation.lon,
      zoom: 15,
      id: `live-center-${Date.now()}`,
    };
    console.log(`[centerLiveLocation] setFocusTarget(lat=${target.lat.toFixed(4)}, lon=${target.lon.toFixed(4)}, id=${target.id})`);
    props.setLiveFollowDetached(false);
    props.setLiveCenterRequestId(`center-${Date.now()}`);
    props.setFocusTarget(target);
    props.showToast('מפה מתמקדת במיקומך');
  }, [props]);

  useEffect(() => {
    if (resumedLiveRef.current) return;
    resumedLiveRef.current = true;
    if (props.initialNavSessionRef.current?.liveActive && props.watchId === null) {
      beginLiveLocationWatch();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    beginLiveLocationWatch,
    toggleLiveLocation,
    navigateFromCurrentPosition,
    setMapPointAsNavStart,
    handleLiveFollowDetachedChange,
    centerLiveLocation,
  };
}
