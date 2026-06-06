import type { TurnAction, TurnInstruction } from '../types';
import { safeText } from '../util';
import { osrmStepToAction, composeTurnInstruction } from './turnHelpers';



export const parseOsrmInstructions = (route: any): TurnInstruction[] => {
  const steps = route?.legs?.flatMap((leg: any) => Array.isArray(leg?.steps) ? leg.steps : []) ?? [];
  const instructions: TurnInstruction[] = [];
  let distanceFromStartM = 0;
  steps.forEach((step: any, index: number) => {
    const maneuver = step?.maneuver;
    const location = maneuver?.location;
    const type = String(maneuver?.type ?? '').toLowerCase();
    const action = osrmStepToAction(step);
    const bearing = typeof maneuver?.bearing_after === 'number'
      ? maneuver.bearing_after
      : typeof maneuver?.bearing_before === 'number'
        ? maneuver.bearing_before
        : 0;
    const lat = Array.isArray(location) && typeof location[1] === 'number' ? location[1] : undefined;
    const lon = Array.isArray(location) && typeof location[0] === 'number' ? location[0] : undefined;
    const roadName = safeText(step?.name);
    const shouldKeep = type === 'arrive' || (type !== 'depart' && (action !== 'straight' || distanceFromStartM > 80 || index === steps.length - 1));
    if (shouldKeep) {
      instructions.push(composeTurnInstruction(action, distanceFromStartM, bearing, 'route', roadName, lat, lon));
    }
    if (typeof step?.distance === 'number' && isFinite(step.distance)) {
      distanceFromStartM += Math.max(0, step.distance);
    }
  });
  return instructions.slice(0, 200);
};

export const normalizeRouteInstructions = (instructions: unknown): TurnInstruction[] | undefined => {
  if (!Array.isArray(instructions)) return undefined;
  const valid = instructions.slice(0, 200).map((instruction): TurnInstruction | null => {
    if (!instruction || typeof instruction !== 'object') return null;
    const item = instruction as Partial<TurnInstruction>;
    const action: TurnAction = item.action === 'right' || item.action === 'left' || item.action === 'uturn' || item.action === 'arrive' || item.action === 'straight'
      ? item.action
      : 'none';
    const distanceM = typeof item.distanceM === 'number' && isFinite(item.distanceM) ? Math.max(0, item.distanceM) : 0;
    const bearing = typeof item.bearing === 'number' && isFinite(item.bearing) ? item.bearing : 0;
    return composeTurnInstruction(
      action,
      distanceM,
      bearing,
      item.confidence === 'estimated' ? 'estimated' : 'route',
      safeText(item.roadName),
      typeof item.lat === 'number' && isFinite(item.lat) ? item.lat : undefined,
      typeof item.lon === 'number' && isFinite(item.lon) ? item.lon : undefined
    );
  }).filter((instruction): instruction is TurnInstruction => Boolean(instruction));
  return valid.length ? valid : undefined;
};

// Valhalla returns routes encoded as polyline with precision=6.
// Standard polyline5 (Google / OSRM) uses precision=5; this variant divides
// by 1e6 instead of 1e5, giving ~0.1 m resolution.
export const decodePolyline6 = (encoded: string): [number, number][] => {
  const result: [number, number][] = [];
  let idx = 0;
  let lat = 0;
  let lng = 0;
  while (idx < encoded.length) {
    let b: number;
    let shift = 0;
    let raw = 0;
    do {
      b = encoded.charCodeAt(idx++) - 63;
      raw |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lat += raw & 1 ? ~(raw >> 1) : raw >> 1;
    shift = 0;
    raw = 0;
    do {
      b = encoded.charCodeAt(idx++) - 63;
      raw |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lng += raw & 1 ? ~(raw >> 1) : raw >> 1;
    result.push([lat / 1e6, lng / 1e6]);
  }
  return result;
};

// Interpolates N+1 intermediate waypoints along the great-circle (shortest
// path on a sphere) between two lat/lon points. Used for the aerial/flight
// route so it follows the actual shortest path on the globe, not a screen
// straight line (which would deviate at longer distances).
export const computeGeodesicPath = (
  a: [number, number],  // [lat, lon]
  b: [number, number],
  steps = 32,
): [number, number][] => {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const lat1 = toRad(a[0]); const lon1 = toRad(a[1]);
  const lat2 = toRad(b[0]); const lon2 = toRad(b[1]);
  const dLat = lat2 - lat1; const dLon = lon2 - lon1;
  const sinHalf = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const centralAngle = 2 * Math.asin(Math.sqrt(sinHalf));
  if (centralAngle < 1e-9) return [a, b];
  const path: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const f = i / steps;
    const sinC = Math.sin(centralAngle);
    const A = Math.sin((1 - f) * centralAngle) / sinC;
    const B = Math.sin(f * centralAngle) / sinC;
    const x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
    const y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2);
    const z = A * Math.sin(lat1) + B * Math.sin(lat2);
    path.push([toDeg(Math.atan2(z, Math.sqrt(x * x + y * y))), toDeg(Math.atan2(y, x))]);
  }
  return path;
};

// Converts a Valhalla route-response into the same TurnInstruction[] shape
// used by OSRM, so the HUD + voice guidance work without changes.
export const parseValhallaInstructions = (trip: any): TurnInstruction[] => {
  const maneuvers: any[] = trip?.legs?.flatMap((leg: any) => Array.isArray(leg?.maneuvers) ? leg.maneuvers : []) ?? [];
  const instructions: TurnInstruction[] = [];
  let distanceFromStartM = 0;
  maneuvers.forEach((m: any, index: number) => {
    const typeNum: number = typeof m?.type === 'number' ? m.type : -1;
    const isArrive = typeNum === 4;
    const isDepart = typeNum <= 1;
    const modifier = String(m?.verbal_post_transition_instruction ?? '').toLowerCase();
    let action: TurnAction = 'straight';
    if (isArrive) action = 'arrive';
    else if (modifier.includes('right')) action = 'right';
    else if (modifier.includes('left')) action = 'left';
    else if (modifier.includes('u-turn') || modifier.includes('uturn')) action = 'uturn';
    const bearing = typeof m?.begin_heading === 'number' ? m.begin_heading : 0;
    const lat = typeof m?.lat === 'number' ? m.lat : undefined;
    const lon = typeof m?.lon === 'number' ? m.lon : undefined;
    const roadName = safeText(m?.street_names?.[0] ?? m?.name ?? '');
    const shouldKeep = isArrive || (!isDepart && (action !== 'straight' || distanceFromStartM > 80 || index === maneuvers.length - 1));
    if (shouldKeep) {
      instructions.push(composeTurnInstruction(action, distanceFromStartM, bearing, 'route', roadName, lat, lon));
    }
    if (typeof m?.length === 'number' && isFinite(m.length)) {
      distanceFromStartM += m.length * 1000; // Valhalla returns km
    }
  });
  return instructions.slice(0, 200);
};
