import { useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  blueLine, litaniRiver, litaniBufferZone, zahraniRiver, awaliRiver,
  towns, unifilPoints, influenceZones,
} from '../data/geo';
import { TILESETS, SECT_COLORS, POP_RADIUS, buildTownInfoHtml, townPopup, navBtn } from '../mapHtml';

interface MapInitReturn {
  mapRef: React.MutableRefObject<L.Map | null>;
  layersRef: React.MutableRefObject<any>;
  savedViewRef: React.MutableRefObject<{ center: L.LatLng; zoom: number } | null>;
  routePolylineRefs: React.MutableRefObject<Map<string, L.Polyline>>;
  liveFollowDetachedRef: React.MutableRefObject<boolean>;
  lastLiveFollowRef: React.MutableRefObject<{ lat: number; lon: number; at: number } | null>;
}

export const useMapInit = (
  containerRef: React.MutableRefObject<HTMLDivElement | null>,
  userRotationRef: React.MutableRefObject<number>,
  theme: 'light' | 'dark',
  sectColors: boolean,
  initialCenter: { lat: number; lon: number; zoom: number } | undefined,
  onMapViewChange: (view: { lat: number; lon: number; zoom: number }) => void,
): MapInitReturn => {
  const mapRef = useRef<L.Map | null>(null);
  const savedViewRef = useRef<{ center: L.LatLng; zoom: number } | null>(null);
  const layersRef = useRef<any>({});
  const routePolylineRefs = useRef<Map<string, L.Polyline>>(new Map());
  const liveFollowDetachedRef = useRef(false);
  const lastLiveFollowRef = useRef<{ lat: number; lon: number; at: number } | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [33.2, 35.4],
      zoom: 11,
      minZoom: 9,
      maxZoom: 19,
      zoomControl: true,
      attributionControl: true,
    });
    mapRef.current = map;

    map.createPane('popPane');
    map.getPane('popPane')!.style.zIndex = '650';

    map.whenReady(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const draggable = (map.dragging as any)?._draggable;
      if (!draggable) return;
      draggable.on('predrag', () => {
        const deg = userRotationRef.current;
        if (!deg) return;
        const rad = (deg * Math.PI) / 180;
        const cos = Math.cos(-rad);
        const sin = Math.sin(-rad);
        const dx = draggable._newPos.x - draggable._startPos.x;
        const dy = draggable._newPos.y - draggable._startPos.y;
        draggable._newPos.x = draggable._startPos.x + (dx * cos - dy * sin);
        draggable._newPos.y = draggable._startPos.y + (dx * sin + dy * cos);
      });
    });

    const base = L.tileLayer(TILESETS[theme], {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
      maxNativeZoom: 19,
    }).addTo(map);
    layersRef.current.base = base;

    if (initialCenter) {
      map.setView(
        [initialCenter.lat, initialCenter.lon],
        initialCenter.zoom,
        { animate: false, noMoveStart: true },
      );
    } else {
      map.fitBounds([
        [33.05, 35.05],
        [33.45, 35.70],
      ]);
    }

    const blueLineGroup = L.layerGroup();
    L.polyline(blueLine, {
      color: '#5a8fbf',
      weight: 3,
      opacity: 0.9,
      dashArray: '6 4',
    })
      .bindPopup(
        '<strong>הקו הכחול (Blue Line)</strong><br/>קו נסיגת האו״ם משנת 2000. כאן בייצוג מקורב לצורכי המחשה בלבד.<br/><a href="https://en.wikipedia.org/wiki/Blue_Line_(withdrawal_line)" target="_blank">מקור: ויקיפדיה</a>'
      )
      .addTo(blueLineGroup);
    towns.filter(t => t.side === 'IL').forEach(t => {
      L.circleMarker([t.lat, t.lon], {
        radius: 4,
        color: '#88a3b8',
        weight: 1,
        fillColor: '#88a3b8',
        fillOpacity: 0.85,
      })
        .bindPopup(
          `<strong>${t.name_he}</strong> (ישראל)<br/>נקודת ייחוס לגבול.<br/>${navBtn(t.lat, t.lon, t.name_he)}`
        )
        .addTo(blueLineGroup);
    });
    layersRef.current.blueLine = blueLineGroup;

    const litaniGroup = L.layerGroup();
    L.polygon(litaniBufferZone, {
      color: '#4e7fb0',
      weight: 0,
      fillColor: '#4e7fb0',
      fillOpacity: 0.07,
    }).addTo(litaniGroup);
    L.polyline(litaniRiver, {
      color: '#4e7fb0',
      weight: 3,
      opacity: 0.9,
    })
      .bindPopup(
        '<strong>נהר הליטני</strong><br/>גבול צפוני של אזור החיץ על־פי החלטת מועצת הביטחון 1701.<br/><a href="https://en.wikipedia.org/wiki/United_Nations_Security_Council_Resolution_1701" target="_blank">החלטה 1701 — ויקיפדיה</a>'
      )
      .addTo(litaniGroup);
    layersRef.current.litani = litaniGroup;

    const RIVER_COLOR = '#4a90c4';
    const riversGroup = L.layerGroup();

    L.polyline(zahraniRiver, {
      color: RIVER_COLOR,
      weight: 2.5,
      opacity: 0.85,
      dashArray: undefined,
    })
      .bindPopup(
        '<strong>נהר הזהרני</strong><br/>' +
        'נהר בדרום לבנון, שפכו בים התיכון צפונית לשפך הליטני.<br/>' +
        'עובר דרך אזור נבטייה ומקורו ברמות לבנון.<br/>' +
        '<a href="https://en.wikipedia.org/wiki/Zahrani_River" target="_blank">ויקיפדיה — נהר הזהרני</a>'
      )
      .addTo(riversGroup);

    L.polyline(awaliRiver, {
      color: RIVER_COLOR,
      weight: 2.5,
      opacity: 0.85,
    })
      .bindPopup(
        '<strong>נהר האוואלי</strong><br/>' +
        'מקורו בהרי הברוק/ניחא בלבנון, זורם מערבה דרך עמק Bisri ואגם ג\'ון.<br/>' +
        'שפכו בים התיכון דרומית לצידון.<br/>' +
        '<a href="https://en.wikipedia.org/wiki/Awali_River" target="_blank">ויקיפדיה — נהר האוואלי</a>'
      )
      .addTo(riversGroup);

    layersRef.current.rivers = riversGroup;

    const popGroup = L.layerGroup();
    const useSectColors = sectColors;
    const SECT_LABELS: Record<string, string> = { shia: 'שיעים', sunni: 'סונים', druze: 'דרוזים', christian: 'נוצרים', mixed: 'מעורב', jewish: 'יהודי' };
    towns.filter(t => t.side === 'LB').forEach(t => {
      const sectColor = (useSectColors && t.sect) ? (SECT_COLORS[t.sect] ?? '#d0b58a') : '#d0b58a';
      const sectLabel = t.sect ? (SECT_LABELS[t.sect] ?? '') : '';
      L.circleMarker([t.lat, t.lon], {
        radius: POP_RADIUS[t.pop_band],
        color: sectColor,
        weight: 1.5,
        fillColor: sectColor,
        fillOpacity: 0.22,
        pane: 'popPane',
      })
        .bindPopup(
          townPopup(t.lat, t.lon, t.name_he, buildTownInfoHtml(t, useSectColors)),
          { minWidth: 200 }
        )
        .addTo(popGroup);
    });
    layersRef.current.pop = popGroup;

    const unifilGroup = L.layerGroup();
    unifilPoints.forEach(u => {
      const icon = L.divIcon({
        className: '',
        html: `<div class="marker-unifil" style="width:${u.kind === 'hq' ? 22 : 16}px;height:${u.kind === 'hq' ? 22 : 16}px;border-radius:${u.kind === 'reference' ? '50%' : '4px'};font-size:${u.kind === 'hq' ? 11 : 9}px">UN</div>`,
        iconSize: [u.kind === 'hq' ? 22 : 16, u.kind === 'hq' ? 22 : 16],
        iconAnchor: [u.kind === 'hq' ? 11 : 8, u.kind === 'hq' ? 11 : 8],
      });
      L.marker([u.lat, u.lon], { icon })
        .bindPopup(
          `<strong>${u.name_he}</strong><br/>${u.note_he}<br/><a href="https://unifil.unmissions.org/" target="_blank">מקור: יוניפי״ל (אתר רשמי)</a><br/>${navBtn(u.lat, u.lon, u.name_he)}`
        )
        .addTo(unifilGroup);
    });
    layersRef.current.unifil = unifilGroup;

    const hezGroup = L.layerGroup();
    influenceZones.forEach(z => {
      L.polygon(z.polygon, {
        color: '#b56466',
        weight: 1.2,
        fillColor: '#b56466',
        fillOpacity: z.intensity === 'reported' ? 0.16 : 0.09,
        dashArray: '4 4',
        interactive: false,
      }).addTo(hezGroup);
    });
    layersRef.current.hez = hezGroup;

    layersRef.current.incidents = L.layerGroup();
    layersRef.current.selectedHL = L.layerGroup();
    layersRef.current.measure = L.layerGroup();
    layersRef.current.distance = L.layerGroup();
    layersRef.current.labels = L.layerGroup();
    layersRef.current.route = L.layerGroup();
    layersRef.current.live = L.layerGroup();
    layersRef.current.recording = L.layerGroup();
    layersRef.current.pois = L.layerGroup();
    layersRef.current.multiRoute = L.layerGroup();
    layersRef.current.incidents.addTo(map);
    layersRef.current.selectedHL.addTo(map);
    layersRef.current.measure.addTo(map);
    layersRef.current.distance.addTo(map);
    layersRef.current.labels.addTo(map);
    layersRef.current.route.addTo(map);
    layersRef.current.live.addTo(map);
    layersRef.current.recording.addTo(map);
    layersRef.current.pois.addTo(map);
    layersRef.current.multiRoute.addTo(map);

    const reportView = () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      savedViewRef.current = { center, zoom };
      onMapViewChange({
        lat: center.lat,
        lon: center.lng,
        zoom,
      });
    };
    map.once('moveend', reportView);
    map.on('moveend zoomend', reportView);

    return () => {
      map.off('moveend zoomend', reportView);
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { mapRef, layersRef, savedViewRef, routePolylineRefs, liveFollowDetachedRef, lastLiveFollowRef };
};
