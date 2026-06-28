import { useState, useEffect } from 'react';
import type { MiniWindowPreferences, MiniWindowTile, MiniWindowTileId } from '../types';

const PREFS_STORAGE_KEY = 'south-lebanon-map:mini-window-prefs:v1';

const DEFAULT_TILES: MiniWindowTile[] = [
  { id: 'distance', label: 'Distance', labelHe: 'מרחק', icon: '📏', enabled: true, order: 1, category: 'basic' },
  { id: 'time', label: 'Time Remaining', labelHe: 'זמן', icon: '⏱', enabled: true, order: 2, category: 'basic' },
  { id: 'location', label: 'Live Location', labelHe: 'מיקום חי', icon: '📍', enabled: true, order: 3, category: 'basic' },
  { id: 'recording', label: 'Recording', labelHe: 'הקלטה', icon: '⏺', enabled: true, order: 4, category: 'basic' },
  { id: 'bearing-target', label: 'Target Bearing', labelHe: 'כיוון יעד', icon: '🧭', enabled: true, order: 5, category: 'navigation' },
  { id: 'bearing-current', label: 'Current Bearing', labelHe: 'כיוון נוכחי', icon: '📍', enabled: false, order: 6, category: 'navigation' },
  { id: 'sunrise', label: 'Sunrise', labelHe: 'זריחה', icon: '🌅', enabled: false, order: 7, category: 'advanced' },
  { id: 'sunset', label: 'Sunset', labelHe: 'שקיעה', icon: '🌆', enabled: false, order: 8, category: 'advanced' },
  { id: 'waypoint-distance', label: 'Waypoint Distance', labelHe: 'מרחק לתחנה', icon: '🚩', enabled: false, order: 9, category: 'military' },
  { id: 'elapsed-time', label: 'Elapsed Time', labelHe: 'זמן שחלף', icon: '⏳', enabled: false, order: 10, category: 'military' },
  { id: 'speed', label: 'Speed', labelHe: 'מהירות', icon: '⚡', enabled: false, order: 11, category: 'military' },
  { id: 'eta', label: 'ETA', labelHe: 'שעת הגעה משוער', icon: '🎯', enabled: false, order: 12, category: 'advanced' },
  { id: 'grid-coords', label: 'Grid Coords', labelHe: 'קואורדינטות רשת', icon: '📊', enabled: false, order: 13, category: 'military' },
];

const DEFAULT_PREFS: MiniWindowPreferences = {
  tiles: DEFAULT_TILES,
  rotateToHeading: true,
  compactMode: false,
  showCompass: true,
  updateInterval: 500, // milliseconds
  fontSize: 'medium', // small=2+ tiles/line, medium=1-2, large=1, xlarge=1
};

export const useMiniWindowPreferences = () => {
  const [prefs, setPrefs] = useState<MiniWindowPreferences>(DEFAULT_PREFS);
  const [loaded, setLoaded] = useState(false);

  // Load from storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PREFS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPrefs({
          ...DEFAULT_PREFS,
          ...parsed,
          tiles: (parsed.tiles || DEFAULT_TILES).map((t: any) => ({
            ...DEFAULT_TILES.find(dt => dt.id === t.id) || t,
            enabled: t.enabled,
            order: t.order,
          })),
        });
      }
    } catch (e) {
      console.error('Failed to load mini window preferences:', e);
    }
    setLoaded(true);
  }, []);

  // Save to storage
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
    } catch (e) {
      console.error('Failed to save mini window preferences:', e);
    }
  }, [prefs, loaded]);

  const toggleTile = (id: MiniWindowTileId) => {
    setPrefs(p => ({
      ...p,
      tiles: p.tiles.map(t => (t.id === id ? { ...t, enabled: !t.enabled } : t)),
    }));
  };

  const setTileOrder = (tiles: MiniWindowTile[]) => {
    setPrefs(p => ({ ...p, tiles }));
  };

  const setFontSize = (size: 'small' | 'medium' | 'large' | 'xlarge') => {
    setPrefs(p => ({ ...p, fontSize: size }));
  };

  const getEnabledTiles = () => {
    return prefs.tiles.filter(t => t.enabled).sort((a, b) => a.order - b.order);
  };

  return {
    prefs,
    setPrefs,
    toggleTile,
    setTileOrder,
    setFontSize,
    getEnabledTiles,
    loaded,
  };
};
