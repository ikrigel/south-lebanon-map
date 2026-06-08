import { useEffect } from 'react';
import L from 'leaflet';
import { TYPE_COLOR, TYPE_LABEL, fmtDate } from '../util';
import type { Incident } from '../data/geo';

export const useMapIncidents = (
  layersRef: React.MutableRefObject<any>,
  mapRef: React.MutableRefObject<L.Map | null>,
  filteredIncidents: Incident[],
  selectedIncident: Incident | null,
  onSelectIncident: (id: string) => void,
) => {
  useEffect(() => {
    const group = layersRef.current.incidents;
    if (!group) return;
    group.clearLayers();
    filteredIncidents.forEach(inc => {
      const color = TYPE_COLOR[inc.type] || '#999';
      const size = inc.severity === 'high' ? 12 : inc.severity === 'med' ? 10 : 8;
      const m = L.circleMarker([inc.lat, inc.lon], {
        radius: size / 2 + 2,
        color: color,
        weight: 2,
        fillColor: color,
        fillOpacity: 0.7,
        className: 'marker-incident',
      });
      m.bindPopup(
        `<div style="min-width:220px"><div style="font-size:10px;color:#8b97a8;font-family:'JetBrains Mono',monospace">${fmtDate(inc.date)} · ${TYPE_LABEL[inc.type]}</div><strong style="display:block;margin:4px 0">${inc.title_he}</strong><div style="font-size:11px;line-height:1.45;margin-bottom:6px">${inc.desc_he}</div>${inc.approx ? '<span style="font-size:10px;color:#d49a3a">מיקום מקורב</span> · ' : ''}<a href="${inc.source_url}" target="_blank" rel="noopener">${inc.source_label}</a></div>`
      );
      m.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        onSelectIncident(inc.id);
      });
      m.addTo(group);
    });
  }, [filteredIncidents, onSelectIncident]);

  useEffect(() => {
    const group = layersRef.current.selectedHL;
    if (!group) return;
    group.clearLayers();
    const inc = selectedIncident;
    if (!inc) return;
    L.circleMarker([inc.lat, inc.lon], {
      radius: 18,
      color: '#6ed1c2',
      weight: 2,
      fillOpacity: 0,
      className: 'marker-selected',
    }).addTo(group);
    mapRef.current?.panTo([inc.lat, inc.lon], { animate: true });
  }, [selectedIncident]);
};
