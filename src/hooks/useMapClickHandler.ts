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

    const handleClick = (e: MouseEvent) => {
      const props = propsRef.current;
      if (!props || !props.onMapClick) return;

      // Check if click is on a Leaflet element (popup, control, etc.) - skip if so
      const target = e.target as HTMLElement;
      if (target?.closest('.leaflet-popup') ||
          target?.closest('.leaflet-control') ||
          target?.closest('.leaflet-marker')) {
        return;
      }

      try {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        // Use Leaflet's containerPointToLatLng which handles rotation internally
        const latlng = map.containerPointToLatLng(L.point(x, y));
        props.onMapClick({ lat: latlng.lat, lon: latlng.lng });
      } catch (err) {
        console.error('Map click handler error:', err);
      }
    };

    // Use capturing phase to intercept clicks before Leaflet
    el.addEventListener('click', handleClick, true);
    return () => el.removeEventListener('click', handleClick, true);
  }, []);
};
