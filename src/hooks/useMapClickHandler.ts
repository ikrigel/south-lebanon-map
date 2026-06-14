import { useEffect } from 'react';
import L from 'leaflet';

export const useMapClickHandler = (
  containerRef: React.MutableRefObject<HTMLDivElement | null>,
  mapRef: React.MutableRefObject<any>,
  propsRef: React.MutableRefObject<any>,
) => {
  useEffect(() => {
    const el = containerRef.current;
    const map = mapRef.current;
    if (!el || !map) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      const props = propsRef.current;
      if (!props || !props.onMapClick) return;

      // Get the target element
      const target = e.originalEvent?.target as HTMLElement;

      // Skip if click is on a Leaflet UI element (popup, control, marker)
      if (target?.closest('.leaflet-popup') ||
          target?.closest('.leaflet-control') ||
          target?.closest('.leaflet-marker')) {
        return;
      }

      try {
        // Use Leaflet's event latlng which is already converted
        props.onMapClick({ lat: e.latlng.lat, lon: e.latlng.lng });
      } catch (err) {
        console.error('Map click handler error:', err);
      }
    };

    // Use Leaflet's map click event - fires after Leaflet processes drag detection
    map.on('click', handleMapClick);
    return () => map.off('click', handleMapClick);
  }, []);
};
