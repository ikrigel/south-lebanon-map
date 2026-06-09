import { useEffect } from 'react';
import L from 'leaflet';
import { escapeHtml } from '../util';

export const useMapRoute = (
  mapRef: React.MutableRefObject<any>,
  layersRef: React.MutableRefObject<any>,
  routePolylineRefs: React.MutableRefObject<Map<string, L.Polyline>>,
  routeOverlays: any[] | undefined,
  navigationRoute: any | null,
  routeDisplayMode: string | undefined,
  liveLocation: any | null,
  navLabels: boolean,
) => {
  useEffect(() => {
    const group = layersRef.current.route;
    const map = mapRef.current;
    if (!group || !map) return;
    group.clearLayers();
    routePolylineRefs.current.clear();

    if (!navigationRoute) return;

    const { start, end } = navigationRoute;
    const a: [number, number] = [start.lat, start.lon];
    const b: [number, number] = [end.lat, end.lon];
    const overlays = routeOverlays ?? [];
    const mode = routeDisplayMode ?? 'road';

    const drivePathLen = overlays.find((o: any) => o.id === 'drive')?.path.length ?? 0;
    const footPathLen  = overlays.find((o: any) => o.id === 'foot')?.path.length  ?? 0;
    const aerialFallback = mode === 'road' && drivePathLen < 2 && footPathLen < 2;
    const visibleIds: Set<string> = new Set(
      mode === 'aerial'                    ? ['aerial'] :
      mode === 'road' && !aerialFallback   ? ['drive', 'foot'] :
                                             ['drive', 'foot', 'aerial']
    );

    let allRenderedPoints: [number, number][] = [];

    const sortedOverlays = [
      ...overlays.filter((o: any) => visibleIds.has(o.id) && !o.isActive),
      ...overlays.filter((o: any) => visibleIds.has(o.id) &&  o.isActive),
    ];

    sortedOverlays.forEach((o: any) => {
      if (o.path.length < 2) return;
      const isActive = aerialFallback && o.id === 'aerial' ? true : o.isActive;
      const lineClass = isActive
        ? `route-line route-line-${o.lineStyle}`
        : `route-line-inactive route-line-inactive-${o.lineStyle}`;
      const pl = L.polyline(o.path, {
        color: o.color,
        weight: isActive ? 6 : 2.5,
        opacity: isActive ? 0.95 : 0.40,
        className: lineClass,
      }).addTo(group);
      const svgEl = (pl as any)._path as SVGPathElement | undefined;
      if (svgEl) {
        svgEl.removeAttribute('stroke-dasharray');
        svgEl.removeAttribute('stroke-width');
      }
      routePolylineRefs.current.set(o.id, pl);
      allRenderedPoints = [...allRenderedPoints, ...o.path];

      if (isActive && o.path.length >= 2) {
        const midIdx = Math.floor(o.path.length / 2);
        const mid = o.path[midIdx] ?? [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] as [number, number];
        let progressPct = 0;
        if (liveLocation && o.path.length >= 2) {
          let minDist = Infinity;
          let closestIdx = 0;
          o.path.forEach((pt: any, i: number) => {
            const d = Math.abs(pt[0] - liveLocation.lat) + Math.abs(pt[1] - liveLocation.lon);
            if (d < minDist) { minDist = d; closestIdx = i; }
          });
          progressPct = Math.round((closestIdx / (o.path.length - 1)) * 100);
        }
        const distStr = o.km < 10 ? o.km.toFixed(2) : o.km.toFixed(1);
        const etaStr  = o.durationMin ? ` · ~${Math.round(o.durationMin)} דק\'` : '';
        const progStr = liveLocation && progressPct > 0 ? ` · ${progressPct}% הושלם` : '';
        if (navLabels) {
          L.marker(mid, {
            icon: L.divIcon({
              className: 'route-distance-label',
              html: `${distStr} ק״מ${etaStr}${progStr}`,
              iconSize: undefined,
            }),
            interactive: false,
          }).addTo(group);
        }
      }
    });

    const isNavigatingLive = !!liveLocation;
    [
      {
        point: a,
        color: '#6ed1c2',
        show: !isNavigatingLive,
        tooltip: escapeHtml(start.label),
        permanent: true,
        offset: [0, -10] as [number, number],
      },
      {
        point: b,
        color: '#d49a3a',
        show: true,
        tooltip: `🎯 ${escapeHtml(end.label)}`,
        permanent: true,
        offset: [0, -10] as [number, number],
      },
    ].forEach((spec: any) => {
      const cm = L.circleMarker(spec.point, {
        radius: 7,
        color: spec.color,
        weight: 2,
        fillColor: '#0b0d10',
        fillOpacity: 1,
      });
      if (spec.show && navLabels) {
        cm.bindTooltip(spec.tooltip, {
          permanent: spec.permanent,
          direction: 'top',
          offset: spec.offset,
          className: 'route-tooltip',
        });
      }
      cm.addTo(group);
    });

    if (!liveLocation && allRenderedPoints.length >= 2) {
      const boundsPoints: [number, number][] = [
        ...allRenderedPoints,
        [start.lat, start.lon],
        [end.lat,   end.lon],
      ];
      map.fitBounds(boundsPoints, { padding: [60, 60], maxZoom: 16, animate: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    (routeOverlays ?? []).map((o: any) => `${o.id}:${o.path.length}`).join(','),
    navigationRoute?.start.lat,
    navigationRoute?.start.lon,
    navigationRoute?.end.lat,
    navigationRoute?.end.lon,
    routeDisplayMode,
    Boolean(liveLocation),
    navLabels,
  ]);

  useEffect(() => {
    const overlays = routeOverlays ?? [];
    const mode = routeDisplayMode ?? 'road';
    const visibleIds: Set<string> = new Set(
      mode === 'road'   ? ['drive', 'foot'] :
      mode === 'aerial' ? ['aerial'] :
      ['drive', 'foot', 'aerial']
    );
    overlays.forEach((o: any) => {
      const pl = routePolylineRefs.current.get(o.id);
      if (!pl) return;
      const visible = visibleIds.has(o.id);
      const isActive = o.isActive && visible;
      pl.setStyle({
        weight:  isActive ? 6 : 2.5,
        opacity: visible ? (isActive ? 0.95 : 0.40) : 0,
      });
      const lineClass = isActive
        ? `route-line route-line-${o.lineStyle}`
        : `route-line-inactive route-line-inactive-${o.lineStyle}`;
      const el = (pl as any)._path as SVGPathElement | undefined;
      if (el) {
        el.className.baseVal = lineClass;
        el.removeAttribute('stroke-dasharray');
        el.removeAttribute('stroke-width');
      }
      if (isActive) pl.bringToFront();
    });
  }, [routeOverlays]);
};
