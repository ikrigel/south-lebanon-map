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
  accuracy: number;
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
        const newAccuracy = pos.coords.accuracy ?? 0;

        // Ultra-low speed detection for slow pedestrian movement (0.1 km/h+)
        // Replaces accuracy-based threshold with fixed low-distance threshold
        let calculatedSpeed: number | null = null;
        const prevLoc = previousLocationRef.current;

        if (prevLoc) {
          const distanceKm = haversineKm([prevLoc.lat, prevLoc.lon], [newLat, newLon]);
          const distanceMeters = distanceKm * 1000;
          const timeElapsedMs = newTimestamp - prevLoc.timestamp;
          const timeElapsedSeconds = timeElapsedMs / 1000;
          const timeElapsedHours = timeElapsedMs / (1000 * 60 * 60);

          console.log(`[GPS Speed] New update - distance: ${distanceMeters.toFixed(1)}m, time: ${timeElapsedSeconds.toFixed(1)}s, timeHours: ${timeElapsedHours.toFixed(6)}`);

          // Only consider position "new" if time elapsed > 1 second (avoid duplicate timestamps)
          if (timeElapsedSeconds > 1) {
            // Fixed threshold: 1.5 meters minimum distance
            // This captures slow walking (0.1-0.5 km/h) while filtering GPS jitter
            // GPS jitter is typically 5-10m, so 1.5m threshold accepts real foot movement
            const MINIMUM_DISTANCE_METERS = 1.5;
            const MINIMUM_DISTANCE_KM = MINIMUM_DISTANCE_METERS / 1000;

            console.log(`[GPS Speed] Time > 1s, checking distance: ${distanceKm.toFixed(6)} km vs threshold ${MINIMUM_DISTANCE_KM.toFixed(6)} km`);

            if (distanceKm > MINIMUM_DISTANCE_KM && timeElapsedHours > 0) {
              // Real movement detected: calculate speed (captures ultra-low speeds)
              calculatedSpeed = distanceKm / timeElapsedHours;
              console.log(`[GPS Speed] ✓ MOVEMENT: ${calculatedSpeed.toFixed(3)} km/h (${(calculatedSpeed * 1000 / 3.6).toFixed(1)} m/s)`);
            } else if (distanceKm <= MINIMUM_DISTANCE_KM) {
              // Movement within 1.5m: stationary or minimal movement
              calculatedSpeed = 0;
              console.log(`[GPS Speed] ✓ STATIONARY: distance within threshold`);
            } else {
              console.log(`[GPS Speed] ✗ REJECTED: distance > threshold but timeHours <= 0`);
            }
          } else {
            // Too soon to calculate speed (likely duplicate timestamp)
            console.log(`[GPS Speed] ⊘ Skipped - time elapsed ${timeElapsedSeconds.toFixed(2)}s < 1s minimum`);
          }
        } else {
          console.log(`[GPS Speed] First GPS update - no previous location yet`);
        }

        // Update reference for next calculation (now includes accuracy)
        previousLocationRef.current = {
          lat: newLat,
          lon: newLon,
          timestamp: newTimestamp,
          accuracy: newAccuracy,
        };

        const deviceSpeed = pos.coords.speed ?? null;
        const finalSpeed = calculatedSpeed !== null ? calculatedSpeed : deviceSpeed;
        const newLocState = {
          lat: newLat,
          lon: newLon,
          accuracy: newAccuracy,
          heading: pos.coords.heading,
          speed: finalSpeed,
        };
        console.log(`[useLiveLocationCallbacks] Speed sources - calculated: ${calculatedSpeed}, device: ${deviceSpeed}, final: ${finalSpeed}`);
        console.log(`[useLiveLocationCallbacks] Setting location:`, newLocState);
        props.setLiveLocation(newLocState);
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
