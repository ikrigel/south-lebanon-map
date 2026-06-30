import { useCallback, useRef } from 'react';
import type { SavedRoute } from '../types';
import { haversineKm } from '../util';
import { safeText } from '../util';

export const useRecording = ({
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
}: {
  recordedTrack: [number, number][];
  recordingName: string;
  recordedKm: number;
  setRecordedTrack: (track: [number, number][] | ((prev: [number, number][]) => [number, number][])) => void;
  setRecordingStatus: (status: 'idle' | 'recording' | 'paused' | 'error') => void;
  setRecordingWatchId: (id: number | null) => void;
  setLiveLocation: (location: any) => void;
  setSavedRoutes: (routes: any) => void;
  setActiveSavedRoute: (route: any) => void;
  setRecordingName: (name: string) => void;
  showToast: (message: string) => void;
}) => {
  const recordedTrackRef = useRef<[number, number][]>([]);
  const recordingToastShownRef = useRef(false);
  const recordingWatchId = useRef<number | null>(null);

  const beginRecordingWatch = useCallback(
    (resetTrack: boolean) => {
      if (!('geolocation' in navigator)) {
        setRecordingStatus('error');
        showToast('הדפדפן אינו תומך בהקלטת מיקום');
        return null;
      }
      if (recordingWatchId.current !== null) return;
      if (resetTrack) {
        setRecordedTrack([]);
        recordedTrackRef.current = [];
      }
      // Store previous location for speed calculation
      let lastRecordingPos: { lat: number; lon: number; time: number } | null = null;

      const id = navigator.geolocation.watchPosition(
        pos => {
          const point: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          const newLat = pos.coords.latitude;
          const newLon = pos.coords.longitude;
          const newTime = Date.now();

          // Calculate speed from consecutive GPS updates
          let recordingSpeed: number | null = null;
          if (lastRecordingPos) {
            const distKm = haversineKm([lastRecordingPos.lat, lastRecordingPos.lon], [newLat, newLon]);
            const timeMs = newTime - lastRecordingPos.time;
            const timeHours = timeMs / (1000 * 60 * 60);
            if (timeHours > 0) {
              recordingSpeed = distKm / timeHours;
              if (recordingSpeed > 300) recordingSpeed = null; // Filter GPS noise
            }
          }
          lastRecordingPos = { lat: newLat, lon: newLon, time: newTime };

          setLiveLocation({
            lat: newLat,
            lon: newLon,
            accuracy: pos.coords.accuracy,
            heading: pos.coords.heading,
            speed: recordingSpeed,
          });
          setRecordedTrack(prev => {
            const last = prev[prev.length - 1];
            if (last && haversineKm(last, point) < 0.01) return prev;
            return [...prev, point].slice(-10000);
          });
          setRecordingStatus('recording');
          if (!recordingToastShownRef.current) {
            recordingToastShownRef.current = true;
            showToast('הקלטת המסלול החלה');
          }
        },
        () => {
          setRecordingStatus('error');
          showToast('לא ניתן להקליט מיקום. בדוק הרשאת GPS בדפדפן');
        },
        { enableHighAccuracy: true, maximumAge: 1_000, timeout: 5_000 }
      );
      recordingWatchId.current = id;
      setRecordingWatchId(id);
      setRecordingStatus('recording');
      return id;
    },
    [setRecordedTrack, setRecordingStatus, setRecordingWatchId, setLiveLocation, showToast]
  );

  const startRecording = useCallback(() => {
    recordingToastShownRef.current = false;
    showToast('מבקש הרשאת מיקום ומתחיל הקלטה…');
    beginRecordingWatch(true);
  }, [beginRecordingWatch, showToast]);

  const stopRecording = useCallback(() => {
    if (recordingWatchId.current !== null && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(recordingWatchId.current);
    }
    recordingWatchId.current = null;
    setRecordingWatchId(null);
    setRecordingStatus('idle');
    showToast('הקלטת המסלול נעצרה');
  }, [setRecordingWatchId, setRecordingStatus, showToast]);

  const recordingToRoute = useCallback((): SavedRoute | null => {
    if (recordedTrack.length < 2) return null;
    const start = recordedTrack[0];
    const end = recordedTrack[recordedTrack.length - 1];
    const name = safeText(recordingName, `הקלטת מסלול ${new Date().toLocaleString('he-IL')}`) || 'הקלטת מסלול';
    return {
      id: `recorded-${Date.now()}`,
      name,
      createdAt: new Date().toISOString(),
      start: { lat: start[0], lon: start[1], label: `${name} — התחלה` },
      end: { lat: end[0], lon: end[1], label: `${name} — סיום` },
      km: recordedKm,
      path: recordedTrack,
    };
  }, [recordedTrack, recordingName, recordedKm]);

  const saveRecording = useCallback(() => {
    const route = recordingToRoute();
    if (!route) return;
    setSavedRoutes((prev: any[]) => [route, ...prev]);
    setActiveSavedRoute(route);
    setRecordingName('');
    showToast(`ההקלטה "${route.name}" נשמרה כמסלול`);
  }, [recordingToRoute, setSavedRoutes, setActiveSavedRoute, setRecordingName, showToast]);

  return {
    beginRecordingWatch,
    startRecording,
    stopRecording,
    recordingToRoute,
    saveRecording,
    recordedTrackRef,
    recordingToastShownRef,
  };
};
