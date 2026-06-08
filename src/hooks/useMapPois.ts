import { useEffect } from 'react';
import L from 'leaflet';
import { escapeHtml } from '../util';
import { poiSizePx, poiIconHtml, navBtn } from '../mapHtml';

interface CustomPoi {
  id: string;
  name: string;
  description: string;
  lat: number;
  lon: number;
  createdAt: string;
  markerColor: string;
  markerShape: string;
  markerSize: string;
}

export const useMapPois = (
  layersRef: React.MutableRefObject<any>,
  customPois: CustomPoi[],
  poiDraft: { lat: number; lon: number } | null,
  poiDraftStyle: { markerColor: string; markerShape: string; markerSize: string },
) => {
  useEffect(() => {
    const group = layersRef.current.pois;
    if (!group) return;
    group.clearLayers();
    if (poiDraft) {
      const px = poiSizePx(poiDraftStyle.markerSize) + 10;
      L.marker([poiDraft.lat, poiDraft.lon], {
        icon: L.divIcon({
          className: 'poi-marker poi-draft-marker',
          html: poiIconHtml(
            poiDraftStyle.markerColor,
            poiDraftStyle.markerShape,
            poiDraftStyle.markerSize,
            true
          ),
          iconSize: [px, px],
          iconAnchor: [px / 2, px / 2],
        }),
      })
        .bindTooltip('נקודה נבחרה — מלא שם ושמור', {
          permanent: true,
          direction: 'top',
          offset: [0, -16],
          className: 'route-tooltip poi-draft-tooltip',
        })
        .addTo(group);
    }
    customPois.forEach(poi => {
      const px = poiSizePx(poi.markerSize) + 10;
      const marker = L.marker([poi.lat, poi.lon], {
        icon: L.divIcon({
          className: 'poi-marker',
          html: poiIconHtml(poi.markerColor, poi.markerShape, poi.markerSize),
          iconSize: [px, px],
          iconAnchor: [px / 2, px / 2],
        }),
      });
      marker
        .bindPopup(
          `<div style="min-width:220px"><strong>${escapeHtml(poi.name)}</strong><br/><div style="font-size:11px;line-height:1.45;margin:6px 0;color:#8b97a8">${escapeHtml(poi.description || 'נקודת עניין שהמשתמש הוסיף')}</div><div style="font-family:'JetBrains Mono',monospace;font-size:10px;color:#8b97a8">${poi.lat.toFixed(5)}, ${poi.lon.toFixed(5)}</div>${navBtn(poi.lat, poi.lon, poi.name)}</div>`
        )
        .addTo(group);
    });
  }, [customPois, poiDraft, poiDraftStyle]);
};
