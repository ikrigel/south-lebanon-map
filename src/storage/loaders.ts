import type { ThemeMode, LayerVis, LocalMapView, LocalLabelPreferences } from '../types';
import {
  THEME_STORAGE_KEY,
  LAYER_VIS_STORAGE_KEY,
  MAP_VIEW_STORAGE_KEY,
  LABEL_PREF_STORAGE_KEY,
  DEFAULT_THEME_MODE,
  DEFAULT_LAYER_VISIBILITY,
  MAX_ROUTE_POINTS,
} from '../constants';
import { safeStorageGet } from './storage';
import { safeText } from '../util';

export const loadLocalThemeMode = (): ThemeMode => {
  try {
    const raw = safeStorageGet(THEME_STORAGE_KEY);
    if (!raw) return DEFAULT_THEME_MODE;
    const parsed = JSON.parse(raw);
    return parsed === 'light' || parsed === 'dark' || parsed === 'auto' ? parsed : DEFAULT_THEME_MODE;
  } catch {
    return DEFAULT_THEME_MODE;
  }
};

export const loadLocalLayerVisibility = (): LayerVis => {
  try {
    const raw = safeStorageGet(LAYER_VIS_STORAGE_KEY);
    if (!raw) return DEFAULT_LAYER_VISIBILITY;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return DEFAULT_LAYER_VISIBILITY;
    const candidate = parsed as Partial<Record<keyof LayerVis, unknown>>;
    return {
      pop: typeof candidate.pop === 'boolean' ? candidate.pop : DEFAULT_LAYER_VISIBILITY.pop,
      unifil: typeof candidate.unifil === 'boolean' ? candidate.unifil : DEFAULT_LAYER_VISIBILITY.unifil,
      hez: typeof candidate.hez === 'boolean' ? candidate.hez : DEFAULT_LAYER_VISIBILITY.hez,
      blueLine: typeof candidate.blueLine === 'boolean' ? candidate.blueLine : DEFAULT_LAYER_VISIBILITY.blueLine,
      litani: typeof candidate.litani === 'boolean' ? candidate.litani : DEFAULT_LAYER_VISIBILITY.litani,
      rivers: typeof candidate.rivers === 'boolean' ? candidate.rivers : DEFAULT_LAYER_VISIBILITY.rivers,
      topo: typeof candidate.topo === 'boolean' ? candidate.topo : DEFAULT_LAYER_VISIBILITY.topo,
      cityLabels: typeof candidate.cityLabels === 'boolean' ? candidate.cityLabels : DEFAULT_LAYER_VISIBILITY.cityLabels,
      settlementLabels: typeof candidate.settlementLabels === 'boolean' ? candidate.settlementLabels : DEFAULT_LAYER_VISIBILITY.settlementLabels,
      ridgeLabels: typeof candidate.ridgeLabels === 'boolean' ? candidate.ridgeLabels : DEFAULT_LAYER_VISIBILITY.ridgeLabels,
      waterLabels: typeof candidate.waterLabels === 'boolean' ? candidate.waterLabels : DEFAULT_LAYER_VISIBILITY.waterLabels,
      sectColors: typeof candidate.sectColors === 'boolean' ? candidate.sectColors : DEFAULT_LAYER_VISIBILITY.sectColors,
      navLabels: typeof candidate.navLabels === 'boolean' ? candidate.navLabels : DEFAULT_LAYER_VISIBILITY.navLabels,
    };
  } catch {
    return DEFAULT_LAYER_VISIBILITY;
  }
};

export const loadLocalMapView = (): LocalMapView | null => {
  try {
    const raw = safeStorageGet(MAP_VIEW_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LocalMapView>;
    if (
      typeof parsed.lat !== 'number' ||
      typeof parsed.lon !== 'number' ||
      typeof parsed.zoom !== 'number' ||
      !isFinite(parsed.lat) ||
      !isFinite(parsed.lon) ||
      !isFinite(parsed.zoom) ||
      Math.abs(parsed.lat) > 90 ||
      Math.abs(parsed.lon) > 180
    ) {
      return null;
    }
    return {
      lat: parsed.lat,
      lon: parsed.lon,
      zoom: Math.min(19, Math.max(9, Math.round(parsed.zoom * 100) / 100)),
    };
  } catch {
    return null;
  }
};

export const loadLocalLabelPreferences = (): Required<LocalLabelPreferences> => {
  try {
    const raw = safeStorageGet(LABEL_PREF_STORAGE_KEY);
    if (!raw) return { largeLabels: false, allLabels: false };
    const parsed = JSON.parse(raw) as LocalLabelPreferences;
    return {
      largeLabels: Boolean(parsed.largeLabels),
      allLabels: Boolean(parsed.allLabels),
    };
  } catch {
    return { largeLabels: false, allLabels: false };
  }
};

export const normalizeRoutePath = (path: unknown): [number, number][] | undefined => {
  if (!Array.isArray(path)) return undefined;
  const points = path.slice(0, MAX_ROUTE_POINTS).filter((p): p is [number, number] =>
    Array.isArray(p) &&
    p.length >= 2 &&
    typeof p[0] === 'number' &&
    typeof p[1] === 'number' &&
    isFinite(p[0]) &&
    isFinite(p[1]) &&
    Math.abs(p[0]) <= 90 &&
    Math.abs(p[1]) <= 180
  );
  return points.length >= 2 ? points : undefined;
};

export const normalizeCustomPoint = (
  p: unknown,
): { lat: number; lon: number; label: string } | null => {
  if (!p || typeof p !== 'object') return null;
  const pt = p as Record<string, unknown>;
  const lat = typeof pt.lat === 'number' && isFinite(pt.lat) ? pt.lat : null;
  const lon = typeof pt.lon === 'number' && isFinite(pt.lon) ? pt.lon : null;
  if (lat === null || lon === null) return null;
  return { lat, lon, label: safeText(pt.label as string) || `${lat.toFixed(5)}, ${lon.toFixed(5)}` };
};
