import { useMemo } from 'react';
import type { Incident, Town } from '../types';
import { TYPE_LABEL } from '../constants';
import { fmtDate } from '../util';

interface UseSearchResultsDeps {
  query: string;
  mapSearchQuery: string;
  customPois: any[];
  towns: Town[];
  incidents: Incident[];
  unifilPoints: any[];
  terrainFeatures: any[];
  influenceZones: any[];
}

export const useSearchResults = (deps: UseSearchResultsDeps) => {
  const clean = (s: string) => s.toLowerCase().replace(/[^\w֐-׿]/g, '');

  const searchResults = useMemo(() => {
    const q = clean(deps.query);
    if (!q) return [];
    const townMatches = deps.towns
      .filter(t => clean(`${t.name_he} ${t.name_en} ${t.note ?? ''} ${t.side === 'LB' ? 'לבנון' : 'ישראל'}`).includes(q))
      .map(t => ({
        id: `town-${t.id}`,
        title: t.name_he,
        subtitle: `${t.name_en} · ${t.side === 'LB' ? 'יישוב בלבנון' : 'יישוב ייחוס בישראל'}`,
        lat: t.lat,
        lon: t.lon,
        zoom: 13,
      }));
    const unifilMatches = deps.unifilPoints
      .filter((u: any) => clean(`${u.name_he} ${u.name_en} ${u.note_he} יוניפיל unifil`).includes(q))
      .map((u: any) => ({
        id: `unifil-${u.id}`,
        title: u.name_he,
        subtitle: `${u.name_en} · נקודת יוניפי״ל ציבורית/מקורבת`,
        lat: u.lat,
        lon: u.lon,
        zoom: 13,
      }));
    const terrainMatches = deps.terrainFeatures
      .filter((f: any) => clean(`${f.name_he} ${f.name_en} ${f.note_he ?? ''} רכס רכסים הר הרים נחל נחלים נהר נהרות ואדי עמק תוואי שטח`).includes(q))
      .map((f: any) => ({
        id: `terrain-${f.id}`,
        title: f.name_he,
        subtitle: `${f.name_en} · תוואי שטח / הידרוגרפיה`,
        lat: f.lat,
        lon: f.lon,
        zoom: f.type === 'river' || f.type === 'wadi' ? 12 : 13,
      }));
    const zoneMatches = deps.influenceZones
      .filter((z: any) => clean(`${z.name_he} ${z.note_he} חזבאללה השפעה אזור`).includes(q))
      .map((z: any) => {
        const center = z.polygon.reduce((acc: [number, number], p: [number, number]) => [acc[0] + p[0], acc[1] + p[1]] as [number, number], [0, 0]);
        return {
          id: `zone-${z.id}`,
          title: z.name_he,
          subtitle: 'אזור השפעה איכותי ומקורב',
          lat: center[0] / z.polygon.length,
          lon: center[1] / z.polygon.length,
          zoom: 11,
        };
      });
    const incidentMatches = deps.incidents
      .filter(i => clean(`${i.title_he} ${i.desc_he} ${i.source_label} ${TYPE_LABEL[i.type]}`).includes(q))
      .slice(0, 8)
      .map(i => ({
        id: `incident-${i.id}`,
        incidentId: i.id,
        title: i.title_he,
        subtitle: `${fmtDate(i.date)} · ${TYPE_LABEL[i.type]} · ${i.approx ? 'מיקום מקורב' : 'מיקום מדווח'}`,
        lat: i.lat,
        lon: i.lon,
        zoom: 13,
      }));
    const poiMatches = deps.customPois
      .filter((p: any) => clean(`${p.name} ${p.description} נקודת עניין`).includes(q))
      .map((p: any) => ({
        id: `poi-${p.id}`,
        title: p.name,
        subtitle: `נקודת עניין אישית · ${p.description || 'ללא תיאור'}`,
        lat: p.lat,
        lon: p.lon,
        zoom: 14,
      }));
    return [...poiMatches, ...townMatches, ...terrainMatches, ...unifilMatches, ...zoneMatches, ...incidentMatches].slice(0, 12);
  }, [deps.query, deps.customPois]);

  const mapSearchResults = useMemo(() => {
    const q = clean(deps.mapSearchQuery);
    if (!q) return [];
    const townMatches = deps.towns
      .filter(t => clean(`${t.name_he} ${t.name_en} ${t.note ?? ''} ${t.side === 'LB' ? 'לבנון כפר ישוב יישוב' : 'ישראל ישוב יישוב'}`).includes(q))
      .map(t => ({
        id: `map-town-${t.id}`,
        title: t.name_he,
        subtitle: `${t.name_en} · ${t.side === 'LB' ? 'יישוב/כפר בלבנון' : 'יישוב ייחוס בישראל'}`,
        lat: t.lat,
        lon: t.lon,
        zoom: t.pop_band === 'xl' ? 13 : 15,
      }));
    const terrainMatches = deps.terrainFeatures
      .filter((f: any) => clean(`${f.name_he} ${f.name_en} ${f.note_he ?? ''} רכס רכסים הר הרים נחל נחלים נהר נהרות ואדי עמק תוואי שטח זהרני זהראני סילבסטר`).includes(q))
      .map((f: any) => ({
        id: `map-terrain-${f.id}`,
        title: f.name_he,
        subtitle: `${f.name_en} · ${f.type === 'mountain' ? 'הר' : f.type === 'ridge' ? 'רכס' : f.type === 'river' ? 'נהר' : f.type === 'wadi' ? 'ואדי/נחל' : 'תוואי שטח'}`,
        lat: f.lat,
        lon: f.lon,
        zoom: f.type === 'river' || f.type === 'wadi' ? 13 : 15,
      }));
    const unifilMatches = deps.unifilPoints
      .filter((u: any) => clean(`${u.name_he} ${u.name_en} ${u.note_he} יוניפיל unifil`).includes(q))
      .map((u: any) => ({
        id: `map-unifil-${u.id}`,
        title: u.name_he,
        subtitle: `${u.name_en} · נקודת יוניפי״ל ציבורית/מקורבת`,
        lat: u.lat,
        lon: u.lon,
        zoom: 14,
      }));
    const poiMatches = deps.customPois
      .filter((p: any) => clean(`${p.name} ${p.description} נקודת עניין`).includes(q))
      .map((p: any) => ({
        id: `map-poi-${p.id}`,
        title: p.name,
        subtitle: `נקודת עניין אישית · ${p.description || 'ללא תיאור'}`,
        lat: p.lat,
        lon: p.lon,
        zoom: 16,
      }));
    const incidentMatches = deps.incidents
      .filter(i => clean(`${i.title_he} ${i.desc_he} ${i.source_label} ${TYPE_LABEL[i.type]} אירוע`).includes(q))
      .slice(0, 8)
      .map(i => ({
        id: `map-incident-${i.id}`,
        incidentId: i.id,
        title: i.title_he,
        subtitle: `${fmtDate(i.date)} · ${TYPE_LABEL[i.type]} · ${i.approx ? 'מיקום מקורב' : 'מיקום מדווח'}`,
        lat: i.lat,
        lon: i.lon,
        zoom: 14,
      }));
    return [...poiMatches, ...townMatches, ...terrainMatches, ...unifilMatches, ...incidentMatches].slice(0, 18);
  }, [deps.mapSearchQuery, deps.customPois]);

  return { searchResults, mapSearchResults };
};
