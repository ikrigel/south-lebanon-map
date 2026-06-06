import type { LocalNavSession } from '../types';
import { NAV_SESSION_KEY } from '../constants';
import { safeStorageGet } from './storage';
import { normalizeRoutePath, normalizeCustomPoint } from './loaders';
import { normalizeRouteInstructions } from '../navigation/routeParsers';
import { safeText } from '../util';

export const loadLocalNavSession = (): LocalNavSession => {
  try {
    const raw = safeStorageGet(NAV_SESSION_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as LocalNavSession;
    const roadPath = normalizeRoutePath(parsed.roadRoute?.path);
    const footPath = normalizeRoutePath(parsed.footRoute?.path);
    const savedPath = normalizeRoutePath(parsed.activeSavedRoute?.path);
    const roadInstr = normalizeRouteInstructions(parsed.roadRoute?.instructions);
    const footInstr = normalizeRouteInstructions(parsed.footRoute?.instructions);
    const savedInstr = normalizeRouteInstructions(parsed.activeSavedRoute?.instructions);
    return {
      navStartId: safeText(parsed.navStartId),
      navEndId: safeText(parsed.navEndId),
      navStartQuery: safeText(parsed.navStartQuery),
      navEndQuery: safeText(parsed.navEndQuery),
      routeName: safeText(parsed.routeName),
      liveActive: Boolean(parsed.liveActive),
      voiceGuidance: parsed.voiceGuidance === 'basic' || parsed.voiceGuidance === 'detailed' ? parsed.voiceGuidance : 'off',
      voiceLanguage: parsed.voiceLanguage === 'en' ? 'en' : 'he',
      navCustomStart: normalizeCustomPoint(parsed.navCustomStart),
      navCustomEnd: normalizeCustomPoint(parsed.navCustomEnd),
      activeRouteId: parsed.activeRouteId === 'drive' || parsed.activeRouteId === 'foot' || parsed.activeRouteId === 'aerial'
        ? parsed.activeRouteId : undefined,
      routeDisplayMode: parsed.routeDisplayMode === 'road' || parsed.routeDisplayMode === 'aerial' || parsed.routeDisplayMode === 'both'
        ? parsed.routeDisplayMode : undefined,
      savedAt: typeof parsed.savedAt === 'number' ? parsed.savedAt : undefined,
      lastDistToDestM: typeof parsed.lastDistToDestM === 'number' ? parsed.lastDistToDestM : undefined,
      roadRoute: parsed.roadRoute && typeof parsed.roadRoute.km === 'number'
        ? {
            km: parsed.roadRoute.km,
            durationMin: typeof parsed.roadRoute.durationMin === 'number' ? parsed.roadRoute.durationMin : 0,
            path: roadPath ?? [],
            instructions: roadInstr,
          }
        : null,
      footRoute: parsed.footRoute && typeof parsed.footRoute.km === 'number'
        ? {
            km: parsed.footRoute.km,
            durationMin: typeof parsed.footRoute.durationMin === 'number' ? parsed.footRoute.durationMin : 0,
            path: footPath ?? [],
            instructions: footInstr,
          }
        : null,
      activeSavedRoute: parsed.activeSavedRoute && parsed.activeSavedRoute.start && parsed.activeSavedRoute.end
        ? {
            ...parsed.activeSavedRoute,
            id: safeText(parsed.activeSavedRoute.id, `route-${Date.now()}`) || `route-${Date.now()}`,
            name: safeText(parsed.activeSavedRoute.name, 'מסלול משוחזר') || 'מסלול משוחזר',
            createdAt: safeText(parsed.activeSavedRoute.createdAt, new Date().toISOString()) || new Date().toISOString(),
            path: savedPath,
            instructions: savedInstr,
          }
        : null,
    };
  } catch {
    return {};
  }
};
