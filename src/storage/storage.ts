import type { VoiceLanguage, CustomPoi } from '../types';
import { POI_STORAGE_KEY, MAX_IMPORTED_POIS } from '../constants';
import { normalizePoi } from './normalize';

// Safe localStorage access that gracefully handles blocked/unavailable storage
export const safeStorageGet = (key: string) => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const safeStorageSet = (key: string, value: unknown) => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Embedded browsers may block localStorage.
  }
};

// Web Speech API voice selection
export const pickSpeechVoice = (language: VoiceLanguage) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return undefined;
  const voices = window.speechSynthesis.getVoices?.() ?? [];
  const prefix = language === 'he' ? 'he' : 'en';
  return voices.find(voice => voice.lang.toLowerCase().startsWith(prefix));
};

// POI persistence (uses safeStorageGet/Set internally)
export const loadLocalPois = (): CustomPoi[] => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    const raw = window.localStorage.getItem(POI_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const items = Array.isArray(parsed) ? parsed : [];
    return items.slice(0, MAX_IMPORTED_POIS).map(normalizePoi).filter((p): p is CustomPoi => Boolean(p));
  } catch {
    return [];
  }
};

export const saveLocalPois = (pois: CustomPoi[]) => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(POI_STORAGE_KEY, JSON.stringify(pois.slice(0, MAX_IMPORTED_POIS)));
  } catch {
    // Embedded browsers may block localStorage.
  }
};

// Mini-window HTML escaping
export const miniEscape = (value: unknown) =>
  String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] ?? ch));
