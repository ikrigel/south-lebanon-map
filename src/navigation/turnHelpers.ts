import type { TurnAction, TurnInstruction, PoiColor, PoiShape, PoiSize } from '../types';
import { POI_COLORS, POI_SHAPES, POI_SIZES } from '../constants';
import { fmtKm, safeText } from '../util';

export const isDaytime = () => {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 18;
};

export const clean = (value: string) => value.trim().toLowerCase();

export const isPoiColor = (value: unknown): value is PoiColor => POI_COLORS.some(c => c.value === value);
export const isPoiShape = (value: unknown): value is PoiShape => POI_SHAPES.some(s => s.value === value);
export const isPoiSize = (value: unknown): value is PoiSize => POI_SIZES.some(s => s.value === value);

export const normalizeTurnDelta = (degrees: number) => ((degrees + 540) % 360) - 180;

export const turnActionFromDelta = (delta: number): TurnAction => {
  if (Math.abs(delta) < 25) return 'straight';
  if (Math.abs(delta) > 135) return 'uturn';
  return delta > 0 ? 'right' : 'left';
};

export const directionHebrew = (bearing: number) => {
  const directions = [
    'צפון',
    'צפון־מזרח',
    'מזרח',
    'דרום־מזרח',
    'דרום',
    'דרום־מערב',
    'מערב',
    'צפון־מערב',
  ];
  return directions[Math.round((((bearing % 360) + 360) % 360) / 45) % 8];
};

export const directionEnglish = (bearing: number) => {
  const directions = [
    'north',
    'north-east',
    'east',
    'south-east',
    'south',
    'south-west',
    'west',
    'north-west',
  ];
  return directions[Math.round((((bearing % 360) + 360) % 360) / 45) % 8];
};

export const turnVerbHe = (action: TurnAction) => {
  switch (action) {
    case 'right':
      return 'פנה ימינה';
    case 'left':
      return 'פנה שמאלה';
    case 'uturn':
      return 'בצע פניית פרסה';
    case 'arrive':
      return 'הגעת לקרבת היעד';
    case 'straight':
      return 'המשך ישר';
    default:
      return 'המשך במסלול';
  }
};

export const turnVerbEn = (action: TurnAction) => {
  switch (action) {
    case 'right':
      return 'turn right';
    case 'left':
      return 'turn left';
    case 'uturn':
      return 'make a U-turn';
    case 'arrive':
      return 'you are near your destination';
    case 'straight':
      return 'continue straight';
    default:
      return 'continue on the route';
  }
};

export const formatTurnDistance = (meters: number) => {
  if (!isFinite(meters) || meters <= 0) return 'כעת';
  if (meters >= 1000) return fmtKm(meters / 1000);
  return `${Math.max(20, Math.round(meters / 10) * 10)} מ׳`;
};

export const formatTurnDistanceEn = (meters: number) => {
  if (!isFinite(meters) || meters <= 0) return 'now';
  if (meters >= 1000) {
    const km = meters / 1000;
    return `${km < 10 ? km.toFixed(2) : km.toFixed(1)} kilometers`;
  }
  return `${Math.max(20, Math.round(meters / 10) * 10)} meters`;
};

export const osrmStepToAction = (step: any): TurnAction => {
  const type = String(step?.maneuver?.type ?? '').toLowerCase();
  const modifier = String(step?.maneuver?.modifier ?? '').toLowerCase();
  if (type === 'arrive') return 'arrive';
  if (modifier.includes('uturn') || modifier.includes('u-turn')) return 'uturn';
  if (modifier.includes('right')) return 'right';
  if (modifier.includes('left')) return 'left';
  return 'straight';
};

export const composeTurnInstruction = (
  action: TurnAction,
  distanceM: number,
  bearing: number,
  confidence: TurnInstruction['confidence'],
  roadName = '',
  lat?: number,
  lon?: number
): TurnInstruction => {
  const cleanRoad = safeText(roadName);
  const distanceText = formatTurnDistance(distanceM);
  const distanceTextEn = formatTurnDistanceEn(distanceM);
  const directionText = directionHebrew(bearing);
  const directionTextEn = directionEnglish(bearing);
  const roadTextHe = cleanRoad ? ` אל ${cleanRoad}` : '';
  const roadTextEn = cleanRoad ? ` onto ${cleanRoad}` : '';
  const text = action === 'arrive'
    ? 'הגעת לקרבת היעד'
    : action === 'straight'
      ? `בעוד ${distanceText} המשך ישר${roadTextHe} לכיוון ${directionText}`
      : action === 'uturn'
        ? `בעוד ${distanceText} בצע פניית פרסה${roadTextHe} והמשך לכיוון ${directionText}`
        : `בעוד ${distanceText} ${turnVerbHe(action)}${roadTextHe} והמשך לכיוון ${directionText}`;
  const textEn = action === 'arrive'
    ? 'You are near your destination'
    : action === 'straight'
      ? `In ${distanceTextEn}, continue straight${roadTextEn} toward ${directionTextEn}`
      : action === 'uturn'
        ? `In ${distanceTextEn}, make a U-turn${roadTextEn} and continue toward ${directionTextEn}`
        : `In ${distanceTextEn}, ${turnVerbEn(action)}${roadTextEn} and continue toward ${directionTextEn}`;
  return {
    text,
    textEn,
    action,
    distanceM: Math.max(0, distanceM),
    bearing,
    confidence,
    roadName: cleanRoad || undefined,
    lat,
    lon,
  };
};
