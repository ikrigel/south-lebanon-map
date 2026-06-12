import { useCallback, useRef } from 'react';
import type { NavPoint } from '../types';

interface UseNavigationCallbacksProps {
  setNavStartId: (id: string) => void;
  setNavEndId: (id: string) => void;
  setNavCustomStart: (start: any) => void;
  setNavCustomEnd: (end: any) => void;
  setLiveFollowDetached: (detached: boolean) => void;
  liveToastShownRef: React.MutableRefObject<boolean>;
  watchId: number | null;
  beginLiveLocationWatch: () => void;
  showToast: (msg: string) => void;
}

export function useNavigationCallbacks({
  setNavStartId,
  setNavEndId,
  setNavCustomStart,
  setNavCustomEnd,
  setLiveFollowDetached,
  liveToastShownRef,
  watchId,
  beginLiveLocationWatch,
  showToast,
}: UseNavigationCallbacksProps) {
  const setMapPointAsNavStart = useCallback((lat: number, lon: number) => {
    setNavStartId(`custom:${Date.now()}`);
    setNavCustomStart({ lat, lon });
    showToast('נקודת מוצא: נקודה מהמפה');
  }, [setNavStartId, setNavCustomStart, showToast]);

  const navigateFromCurrentPosition = useCallback((lat: number, lon: number, label: string) => {
    setNavEndId(`custom:${Date.now()}`);
    setNavCustomEnd({ lat, lon, label });
    showToast(`יעד: ${label}`);
  }, [setNavEndId, setNavCustomEnd, showToast]);

  const handleLiveFollowDetachedChange = useCallback((detached: boolean) => {
    setLiveFollowDetached(detached);
  }, [setLiveFollowDetached]);

  const centerLiveLocation = useCallback(() => {
    setLiveFollowDetached(false);
  }, [setLiveFollowDetached]);

  const toggleLiveLocation = useCallback(() => {
    if (watchId === null) {
      setLiveFollowDetached(false);
      if (!liveToastShownRef.current) {
        liveToastShownRef.current = true;
        showToast('מפעיל GPS — מיקום יופיע בקרוב');
      }
      beginLiveLocationWatch();
    }
  }, [watchId, beginLiveLocationWatch, setLiveFollowDetached, liveToastShownRef, showToast]);

  return {
    setMapPointAsNavStart,
    navigateFromCurrentPosition,
    handleLiveFollowDetachedChange,
    centerLiveLocation,
    toggleLiveLocation,
  };
}
