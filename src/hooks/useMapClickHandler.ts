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

      try {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const rad = ((props.userRotation ?? 0) * Math.PI) / 180;
        const cos = Math.cos(-rad);
        const sin = Math.sin(-rad);
        const rotX = x * cos - y * sin + rect.width / 2 * (1 - cos) + rect.height / 2 * sin;
        const rotY = x * sin + y * cos - rect.width / 2 * sin + rect.height / 2 * (1 - cos);
        const latlng = map.unproject([rotX, rotY], map.getZoom());
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
