import { useEffect } from 'react';
import L from 'leaflet';

interface UseMapMeasureAndDistanceProps {
  layersRef: React.MutableRefObject<any>;
  measureMode: boolean;
  manualMeasure: [number, number][];
  distanceLine: [[number, number], [number, number]] | null;
}

export function useMapMeasureAndDistance({
  layersRef,
  measureMode,
  manualMeasure,
  distanceLine,
}: UseMapMeasureAndDistanceProps) {
  // ---- manual measure points ----
  useEffect(() => {
    const group = layersRef.current.measure;
    if (!group) return;
    group.clearLayers();
    if (!measureMode && manualMeasure.length === 0) return;
    manualMeasure.forEach((p, i) => {
      L.circleMarker(p, {
        radius: 5,
        color: '#6ed1c2',
        weight: 2,
        fillColor: '#0b0d10',
        fillOpacity: 1,
      })
        .bindTooltip(`${i + 1}`, { permanent: true, direction: 'top', offset: [0, -6] })
        .addTo(group);
    });
    if (manualMeasure.length === 2) {
      const [a, b] = manualMeasure;
      L.polyline([a, b], {
        color: '#6ed1c2',
        weight: 2,
        dashArray: '4 4',
      }).addTo(group);
    }
  }, [manualMeasure, measureMode, layersRef]);

  // ---- distance from incident to border line ----
  useEffect(() => {
    const group = layersRef.current.distance;
    if (!group) return;
    group.clearLayers();
    if (!distanceLine) return;
    const [a, b] = distanceLine;
    L.polyline([a, b], {
      color: '#6ed1c2',
      weight: 2.5,
      dashArray: '6 3',
    }).addTo(group);
    L.circleMarker(b, {
      radius: 4,
      color: '#6ed1c2',
      weight: 2,
      fillColor: '#0b0d10',
      fillOpacity: 1,
    }).addTo(group);
  }, [distanceLine, layersRef]);
}
