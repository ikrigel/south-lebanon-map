import { useState } from 'react';
import { loadLocalSavedMultiRoutes } from '../storage/sessionLoaders';
import type { DifficultyLevel, PassabilityLevel, MultiPointRoute } from '../types';

export const useMultiRouteState = () => {
  const [multiRouteBuildMode, setMultiRouteBuildMode] = useState(false);
  const [multiRouteDraftPoints, setMultiRouteDraftPoints] = useState<{lat: number; lon: number; label: string; order: number}[]>([]);
  const [multiRouteName, setMultiRouteName] = useState('');
  const [multiRouteDescription, setMultiRouteDescription] = useState('');
  const [multiRouteDifficulty, setMultiRouteDifficulty] = useState<DifficultyLevel>('medium');
  const [multiRoutePassability, setMultiRoutePassability] = useState<PassabilityLevel>('dirt');
  const [savedMultiRoutes, setSavedMultiRoutes] = useState<MultiPointRoute[]>(() => loadLocalSavedMultiRoutes());
  const [activeMultiRoute, setActiveMultiRoute] = useState<MultiPointRoute | null>(null);

  return {
    multiRouteBuildMode, setMultiRouteBuildMode,
    multiRouteDraftPoints, setMultiRouteDraftPoints,
    multiRouteName, setMultiRouteName,
    multiRouteDescription, setMultiRouteDescription,
    multiRouteDifficulty, setMultiRouteDifficulty,
    multiRoutePassability, setMultiRoutePassability,
    savedMultiRoutes, setSavedMultiRoutes,
    activeMultiRoute, setActiveMultiRoute,
  };
};
