import { useEffect } from 'react';
import L from 'leaflet';

interface MultiPoint {
  lat: number;
  lon: number;
  order: number;
}

export const useMapMultiRoute = (
  layersRef: React.MutableRefObject<any>,
  multiRouteDraft: MultiPoint[],
  activeMultiRoute: { points: MultiPoint[]; name: string } | null,
) => {
  useEffect(() => {
    const group = layersRef.current.multiRoute;
    if (!group) return;
    group.clearLayers();

    // Draw draft points
    const draftPoints = multiRouteDraft;
    if (draftPoints.length > 0) {
      draftPoints.forEach((pt, idx) => {
        L.circleMarker([pt.lat, pt.lon], {
          radius: 8,
          color: '#f6c453',
          weight: 2,
          fillColor: '#f6c453',
          fillOpacity: 0.9,
        })
          .bindTooltip(`${idx + 1}`, { permanent: true, direction: 'top', offset: [0, -10], className: 'route-tooltip' })
          .addTo(group);
      });
      if (draftPoints.length >= 2) {
        const line = draftPoints.map(p => [p.lat, p.lon] as [number, number]);
        L.polyline(line, {
          color: '#f6c453',
          weight: 3,
          opacity: 0.9,
          dashArray: '8 4',
        }).addTo(group);
      }
    }

    // Draw active multi route
    const active = activeMultiRoute;
    if (active && active.points.length >= 2) {
      const line = active.points.map(p => [p.lat, p.lon] as [number, number]);
      L.polyline(line, {
        color: '#b98cff',
        weight: 4,
        opacity: 0.92,
        className: 'multi-route-line',
      }).addTo(group);
      active.points.forEach((pt, idx) => {
        const isFirst = idx === 0;
        const isLast = idx === active.points.length - 1;
        L.circleMarker([pt.lat, pt.lon], {
          radius: isFirst || isLast ? 9 : 6,
          color: isFirst ? '#88c37a' : isLast ? '#d96b6b' : '#b98cff',
          weight: 2,
          fillColor: isFirst ? '#88c37a' : isLast ? '#d96b6b' : '#b98cff',
          fillOpacity: 0.92,
        })
          .bindTooltip(`${idx + 1}${isFirst ? ' (התחלה)' : isLast ? ' (סיום)' : ''}`, {
            permanent: false,
            direction: 'top',
            offset: [0, -10],
            className: 'route-tooltip',
          })
          .addTo(group);
      });
    }
  }, [multiRouteDraft, activeMultiRoute]);
};
