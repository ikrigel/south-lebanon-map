import { useEffect } from 'react';
import L from 'leaflet';

export const useMapRecording = (
  layersRef: React.MutableRefObject<any>,
  recordedTrack: [number, number][],
) => {
  useEffect(() => {
    const group = layersRef.current.recording;
    if (!group) return;
    group.clearLayers();
    if (recordedTrack.length === 0) return;
    if (recordedTrack.length > 1) {
      L.polyline(recordedTrack, {
        color: '#f2c14e',
        weight: 3,
        opacity: 0.95,
        className: 'recorded-track-line',
      }).addTo(group);
    }
    const first = recordedTrack[0];
    const last = recordedTrack[recordedTrack.length - 1];
    [
      { point: first, label: 'תחילת הקלטה', color: '#4fb3a6' },
      { point: last, label: 'נקודה אחרונה', color: '#f2c14e' },
    ].forEach(({ point, label, color }) => {
      L.circleMarker(point, {
        radius: 6,
        color,
        weight: 2,
        fillColor: '#0b0d10',
        fillOpacity: 1,
      })
        .bindTooltip(label, {
          permanent: false,
          direction: 'top',
          className: 'route-tooltip',
        })
        .addTo(group);
    });
  }, [recordedTrack]);
};
