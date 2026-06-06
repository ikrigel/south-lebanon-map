import type { LocalRecordingSession, LocalUiState, LocalFilterState, SavedRoute, MultiPointRoute } from '../types';
import {
  RECORDING_STORAGE_KEY,
  UI_STATE_STORAGE_KEY,
  FILTER_STATE_STORAGE_KEY,
  SAVED_ROUTES_STORAGE_KEY,
  SAVED_MULTI_ROUTES_STORAGE_KEY,
} from '../constants';
import { safeStorageGet } from './storage';
import { normalizeRoutePath } from './loaders';
import { safeText } from '../util';

export const loadLocalRecordingSession = (): LocalRecordingSession => {
  try {
    const raw = safeStorageGet(RECORDING_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as LocalRecordingSession;
    return {
      recordingName: safeText(parsed.recordingName),
      recordedTrack: normalizeRoutePath(parsed.recordedTrack) ?? [],
      recordingActive: Boolean(parsed.recordingActive),
    };
  } catch {
    return {};
  }
};

export const loadLocalUiState = (): LocalUiState => {
  try {
    const raw = safeStorageGet(UI_STATE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as LocalUiState;
    return {
      panelsCollapsed: typeof parsed.panelsCollapsed === 'boolean' ? parsed.panelsCollapsed : undefined,
      panelHeightPct:
        typeof parsed.panelHeightPct === 'number' && isFinite(parsed.panelHeightPct)
          ? Math.min(90, Math.max(8, parsed.panelHeightPct))
          : undefined,
      userMapRotation:
        typeof parsed.userMapRotation === 'number' && isFinite(parsed.userMapRotation)
          ? ((parsed.userMapRotation % 360) + 360) % 360
          : undefined,
    };
  } catch {
    return {};
  }
};

export const loadLocalFilterState = (): LocalFilterState => {
  try {
    const raw = safeStorageGet(FILTER_STATE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as LocalFilterState;
    return {
      yearFrom: typeof parsed.yearFrom === 'number' && isFinite(parsed.yearFrom) ? parsed.yearFrom : undefined,
      yearTo: typeof parsed.yearTo === 'number' && isFinite(parsed.yearTo) ? parsed.yearTo : undefined,
      typeFilter: Array.isArray(parsed.typeFilter) ? parsed.typeFilter.filter(t => typeof t === 'string') : undefined,
      sevFilter: Array.isArray(parsed.sevFilter) ? parsed.sevFilter.filter(s => typeof s === 'string') : undefined,
    };
  } catch {
    return {};
  }
};

export const loadLocalSavedRoutes = (): SavedRoute[] => {
  try {
    const raw = safeStorageGet(SAVED_ROUTES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (r): r is SavedRoute =>
        r && typeof r.id === 'string' && typeof r.name === 'string' && r.start && r.end,
    );
  } catch {
    return [];
  }
};

export const loadLocalSavedMultiRoutes = (): MultiPointRoute[] => {
  try {
    const raw = safeStorageGet(SAVED_MULTI_ROUTES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (r): r is MultiPointRoute =>
        r && typeof r.id === 'string' && typeof r.name === 'string' && Array.isArray(r.points),
    );
  } catch {
    return [];
  }
};
