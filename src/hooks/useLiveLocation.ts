import { useCallback, useEffect, useRef } from 'react';
import { haversineKm } from '../util';

export const useLiveLocation = ({
  liveLocation,
  setNavPosition,
  navPositionRef,
}: {
  liveLocation: any;
  setNavPosition: (pos: { lat: number; lon: number }) => void;
  navPositionRef: React.MutableRefObject<any>;
}) => {
  // navPosition throttle: only update when device moves >= 15 m
  // Prevents expensive path scan from running on every sub-metre GPS wobble
  useEffect(() => {
    if (!liveLocation) return;
    const prev = navPositionRef.current;
    if (prev) {
      const movedKm = haversineKm([prev.lat, prev.lon], [liveLocation.lat, liveLocation.lon]);
      if (movedKm * 1000 < 15) return;
    }
    const next = { lat: liveLocation.lat, lon: liveLocation.lon };
    navPositionRef.current = next;
    setNavPosition(next);
  }, [liveLocation, setNavPosition, navPositionRef]);
};
