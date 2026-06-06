import type { CustomPoi, PoiColor, PoiShape, PoiSize } from '../types';
import { isPoiColor, isPoiShape, isPoiSize } from '../navigation/turnHelpers';
import { safeText } from '../util';

export const normalizePoi = (p: Partial<CustomPoi>): CustomPoi | null => {
  if (
    !p ||
    typeof p.lat !== 'number' ||
    typeof p.lon !== 'number' ||
    !isFinite(p.lat) ||
    !isFinite(p.lon) ||
    Math.abs(p.lat) > 90 ||
    Math.abs(p.lon) > 180
  ) return null;
  return {
    id: safeText(p.id, `poi-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`) || `poi-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: safeText(p.name, 'נקודת עניין') || 'נקודת עניין',
    description: safeText(p.description, ''),
    lat: p.lat,
    lon: p.lon,
    createdAt: safeText(p.createdAt, new Date().toISOString()) || new Date().toISOString(),
    markerColor: isPoiColor(p.markerColor) ? p.markerColor : '#f6c453',
    markerShape: isPoiShape(p.markerShape) ? p.markerShape : 'circle',
    markerSize: isPoiSize(p.markerSize) ? p.markerSize : 'md',
  };
};
