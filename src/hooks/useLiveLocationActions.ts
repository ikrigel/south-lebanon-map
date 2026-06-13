import { useCallback, useEffect, useRef } from 'react';

interface UseLiveLocationActionsProps {
  watchId: number | null;
  setWatchId: (id: number | null) => void;
  liveLocation: { lat: number; lon: number; heading?: number } | null;
  setLiveLocation: (loc: any) => void;
  setNavPosition: (pos: any) => void;
  setLocationStatus: (status: string) => void;
  setLiveFollowDetached: (v: boolean) => void;
  liveCenterRequestId: string | null;
  setLiveCenterRequestId: (id: string | null) => void;
  setPanelsCollapsed: (v: boolean) => void;
  setNavStartId: (id: string | null) => void;
  setNavCustomStart: (loc: any) => void;
  setNavEndId: (id: string | null) => void;
  setNavCustomEnd: (loc: any) => void;
  setNavStartQuery: (q: string) => void;
  navStartQuery: string;
  navEndQuery: string;
  setNavEndQuery: (q: string) => void;
  liveToastShownRef: React.MutableRefObject<boolean>;
  beginRecordingWatch: (start: boolean) => void;
  recordingWatchId: number | null;
  initialNavSessionRef: React.MutableRefObject<any>;
  initialRecordingSessionRef: React.MutableRefObject<any>;
  showToast: (msg: string) => void;
}

export const useLiveLocationActions = (props: UseLiveLocationActionsProps) => {
  const {
    watchId, setWatchId, liveLocation, setLiveLocation, setNavPosition, setLocationStatus,
    setLiveFollowDetached, liveCenterRequestId, setLiveCenterRequestId, setPanelsCollapsed,
    setNavStartId, setNavCustomStart, setNavEndId, setNavCustomEnd, setNavStartQuery,
    navStartQuery, navEndQuery, setNavEndQuery, liveToastShownRef, beginRecordingWatch,
    recordingWatchId, initialNavSessionRef, initialRecordingSessionRef, showToast,
  } = props;

  const lastDistRef = useRef(0);

  const beginLiveLocationWatch = useCallback(() => {
    if (!navigator.geolocation) {
      showToast('Geolocation not supported');
      return;
    }
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
    }
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lon, heading } = pos.coords;
        const newLoc = { lat, lon, heading };
        setLiveLocation(newLoc);
        setNavPosition(newLoc);
        const dist = Math.sqrt(
          Math.pow(lat - (liveLocation?.lat || 0), 2) +
          Math.pow(lon - (liveLocation?.lon || 0), 2)
        ) * 111000;
        if (dist > 15) {
          lastDistRef.current = 0;
          setLiveFollowDetached(false);
          setLiveCenterRequestId(`live-${Date.now()}`);
        }
        lastDistRef.current = dist;
        setLocationStatus('active');
      },
      () => setLocationStatus('error'),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 30000 }
    );
    setWatchId(id);
  }, [watchId, liveLocation, setWatchId, setLiveLocation, setNavPosition, setLocationStatus, setLiveFollowDetached, setLiveCenterRequestId, showToast]);

  const toggleLiveLocation = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setLocationStatus('off');
    } else {
      beginLiveLocationWatch();
    }
  }, [watchId, setWatchId, setLocationStatus, beginLiveLocationWatch]);

  const navigateFromCurrentPosition = useCallback(() => {
    if (!liveLocation) {
      showToast('Current location not available');
      return;
    }
    setNavStartId('live-location');
    setNavCustomStart(liveLocation);
    setNavStartQuery('מיקום נוכחי (GPS)');
    setPanelsCollapsed(false);
    showToast('Starting from current location');
  }, [liveLocation, setNavStartId, setNavCustomStart, setNavStartQuery, setPanelsCollapsed, showToast]);

  const setMapPointAsNavStart = useCallback((lat: number, lon: number, label: string) => {
    setNavStartId(null);
    setNavCustomStart({ lat, lon });
    setNavStartQuery(label);
  }, [setNavStartId, setNavCustomStart, setNavStartQuery]);

  const centerLiveLocation = useCallback(() => {
    if (!liveLocation) return;
    setLiveFollowDetached(false);
    setLiveCenterRequestId(`live-${Date.now()}`);
    setLocationStatus('active');
  }, [liveLocation, setLiveFollowDetached, setLiveCenterRequestId, setLocationStatus]);

  useEffect(() => {
    if (initialNavSessionRef.current?.liveActive && watchId === null) {
      beginLiveLocationWatch();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (initialRecordingSessionRef.current?.recordingActive && recordingWatchId === null) {
      beginRecordingWatch(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    beginLiveLocationWatch,
    toggleLiveLocation,
    navigateFromCurrentPosition,
    setMapPointAsNavStart,
    centerLiveLocation,
  };
};
