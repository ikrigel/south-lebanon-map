import { useEffect } from 'react';
import L from 'leaflet';

export const useMapPopupButtons = (
  mapRef: React.MutableRefObject<any>,
  onNavigateRef: React.MutableRefObject<any>,
  onSetNavStartRef: React.MutableRefObject<any>,
) => {
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const onPopupOpen = (e: L.PopupEvent) => {
      const content = e.popup.getElement()?.querySelector<HTMLElement>('.leaflet-popup-content');
      if (!content) return;

      content.querySelectorAll<HTMLButtonElement>('[data-nav-lat]').forEach(btn => {
        let touchFired = false;
        const fire = (ev: Event) => {
          ev.stopPropagation();
          ev.preventDefault();
          if (ev.type === 'touchend') {
            touchFired = true;
          } else if (ev.type === 'click' && touchFired) {
            touchFired = false;
            return;
          }
          const lat = parseFloat(btn.dataset.navLat ?? '');
          const lon = parseFloat(btn.dataset.navLon ?? '');
          const label = btn.dataset.navLabel ?? `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
          const role = btn.dataset.navRole ?? 'end';
          if (!isNaN(lat) && !isNaN(lon)) {
            if (role === 'start') onSetNavStartRef.current?.(lat, lon, label);
            else onNavigateRef.current?.(lat, lon, label);
            map.closePopup();
          }
        };
        btn.addEventListener('touchend', fire, { passive: false });
        btn.addEventListener('click', fire);
      });

      content.querySelectorAll<HTMLButtonElement>('[data-info-toggle]').forEach(toggleBtn => {
        const infoDiv = toggleBtn.nextElementSibling as HTMLElement | null;
        if (!infoDiv) return;
        let touchFired = false;
        const fire = (ev: Event) => {
          ev.stopPropagation();
          if (ev.type === 'touchend') {
            touchFired = true;
          } else if (ev.type === 'click' && touchFired) {
            touchFired = false;
            return;
          }
          const isOpen = infoDiv.style.display !== 'none';
          infoDiv.style.display = isOpen ? 'none' : 'block';
          toggleBtn.textContent = isOpen ? 'פרטים ▼' : 'פרטים ▲';
        };
        toggleBtn.addEventListener('touchend', fire, { passive: false });
        toggleBtn.addEventListener('click', fire);
      });
    };

    map.on('popupopen', onPopupOpen);
    return () => { map.off('popupopen', onPopupOpen); };
  }, []);
};
