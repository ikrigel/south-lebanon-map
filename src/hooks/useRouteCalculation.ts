import { useEffect } from 'react';
import type { NavPoint } from '../types';
import { parseOsrmInstructions, decodePolyline6, parseValhallaInstructions } from '../navigation/routeParsers';
import { haversineKm } from '../util';

export const useRouteCalculation = ({
  navStartId,
  navEndId,
  navPoints,
  initialNavSessionRef,
  setRoadRoute,
  setAlternativeRoute,
  setActiveRouteIndex,
  setActiveSavedRoute,
  setFootRoute,
  setRouteStatus,
  setFootRouteStatus,
}: {
  navStartId: string;
  navEndId: string;
  navPoints: NavPoint[];
  initialNavSessionRef: React.MutableRefObject<any>;
  setRoadRoute: (route: any) => void;
  setAlternativeRoute: (route: any) => void;
  setActiveRouteIndex: (index: number) => void;
  setActiveSavedRoute: (route: any) => void;
  setFootRoute: (route: any) => void;
  setRouteStatus: (status: 'idle' | 'loading' | 'ready' | 'error') => void;
  setFootRouteStatus: (status: 'idle' | 'loading' | 'ready' | 'error') => void;
}) => {
  useEffect(() => {
    const start = navPoints.find(p => p.id === navStartId) ?? null;
    const end = navPoints.find(p => p.id === navEndId) ?? null;

    const rawRestoredStart = initialNavSessionRef.current?.navStartId;
    const restoredStart =
      rawRestoredStart === 'live-location' && initialNavSessionRef.current?.navCustomStart
        ? 'custom-nav-start'
        : rawRestoredStart;
    const restoredEnd = initialNavSessionRef.current?.navEndId;
    const isRestoredSession =
      navStartId === restoredStart &&
      navEndId === restoredEnd &&
      !!initialNavSessionRef.current?.roadRoute;
    if (isRestoredSession) {
      initialNavSessionRef.current = { ...initialNavSessionRef.current, roadRoute: undefined };
      return;
    }

    setRoadRoute(null);
    setAlternativeRoute(null);
    setActiveRouteIndex(0);
    setActiveSavedRoute(null);
    setFootRoute(null);
    setFootRouteStatus('idle');
    if (!start || !end || start.id === end.id) {
      setRouteStatus('idle');
      return;
    }

    const driveCtrl = new AbortController();
    const footCtrl = new AbortController();

    const driveUrl = `https://router.project-osrm.org/route/v1/driving/${start.lon},${start.lat};${end.lon},${end.lat}?overview=full&geometries=geojson&alternatives=true&steps=true`;
    setRouteStatus('loading');
    fetch(driveUrl, { signal: driveCtrl.signal })
      .then(res => {
        if (!res.ok) throw new Error(`OSRM drive ${res.status}`);
        return res.json();
      })
      .then(data => {
        const route = data?.routes?.[0];
        const coords = route?.geometry?.coordinates;
        if (!route || !Array.isArray(coords) || coords.length < 2) throw new Error('No drive route');
        setRoadRoute({
          km: route.distance / 1000,
          durationMin: route.duration / 60,
          path: coords.map(([lon, lat]: [number, number]) => [lat, lon]),
          instructions: parseOsrmInstructions(route),
        });
        const altRoute = data?.routes?.[1];
        const altCoords = altRoute?.geometry?.coordinates;
        if (altRoute && Array.isArray(altCoords) && altCoords.length >= 2) {
          setAlternativeRoute({
            km: altRoute.distance / 1000,
            durationMin: altRoute.duration / 60,
            path: altCoords.map(([lon, lat]: [number, number]) => [lat, lon] as [number, number]),
          });
        }
        setRouteStatus('ready');
      })
      .catch(err => {
        if (err.name === 'AbortError') return;
        setRouteStatus('error');
      });

    const fetchFootOsrmFallback = (s: AbortSignal) => {
      const url = `https://router.project-osrm.org/route/v1/foot/${start.lon},${start.lat};${end.lon},${end.lat}?overview=full&geometries=geojson&steps=true`;
      return fetch(url, { signal: s })
        .then(res => { if (!res.ok) throw new Error(`OSRM foot ${res.status}`); return res.json(); })
        .then(data => {
          const route = data?.routes?.[0];
          const coords = route?.geometry?.coordinates;
          if (!route || !Array.isArray(coords) || coords.length < 2) throw new Error('No OSRM foot route');
          setFootRoute({
            km: route.distance / 1000,
            durationMin: route.duration / 60,
            path: coords.map(([lon, lat]: [number, number]) => [lat, lon] as [number, number]),
            instructions: parseOsrmInstructions(route),
          });
          setFootRouteStatus('ready');
        });
    };

    const footBody = JSON.stringify({
      locations: [
        { lon: start.lon, lat: start.lat },
        { lon: end.lon, lat: end.lat },
      ],
      costing: 'pedestrian',
      costing_options: {
        pedestrian: {
          use_trails: 0.8,
          walking_speed: 4.0,
          use_roads: 0.3,
        },
      },
      directions_options: { units: 'km' },
    });
    setFootRouteStatus('loading');
    fetch('https://valhalla1.openstreetmap.de/route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: footBody,
      signal: footCtrl.signal,
    })
      .then(res => { if (!res.ok) throw new Error(`Valhalla ${res.status}`); return res.json(); })
      .then(data => {
        const trip = data?.trip;
        const shapeStr: string = trip?.legs?.[0]?.shape ?? '';
        if (!shapeStr) throw new Error('No Valhalla shape');
        const path = decodePolyline6(shapeStr);
        if (path.length < 2) throw new Error('Valhalla path too short');
        const summary = trip?.summary ?? {};
        setFootRoute({
          km: typeof summary.length === 'number' ? summary.length : haversineKm([start.lat, start.lon], [end.lat, end.lon]),
          durationMin: typeof summary.time === 'number' ? summary.time / 60 : undefined,
          path,
          instructions: parseValhallaInstructions(trip),
        });
        setFootRouteStatus('ready');
      })
      .catch(err => {
        if (err.name === 'AbortError') return;
        fetchFootOsrmFallback(footCtrl.signal).catch(err2 => {
          if (err2.name === 'AbortError') return;
          setFootRouteStatus('error');
        });
      });

    return () => {
      driveCtrl.abort();
      footCtrl.abort();
    };
  }, [navStartId, navEndId]);
};
