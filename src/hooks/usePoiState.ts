import { useState } from 'react';
import { loadLocalPois } from '../storage/storage';
import type { CustomPoi, PoiColor, PoiShape, PoiSize } from '../types';

export const usePoiState = () => {
  const [addPoiMode, setAddPoiMode] = useState(false);
  const [poiDraft, setPoiDraft] = useState<{ lat: number; lon: number } | null>(null);
  const [poiName, setPoiName] = useState('');
  const [poiDescription, setPoiDescription] = useState('');
  const [poiMarkerColor, setPoiMarkerColor] = useState<PoiColor>('#f6c453');
  const [poiMarkerShape, setPoiMarkerShape] = useState<PoiShape>('circle');
  const [poiMarkerSize, setPoiMarkerSize] = useState<PoiSize>('md');
  const [customPois, setCustomPois] = useState<CustomPoi[]>(() => loadLocalPois());

  return {
    addPoiMode, setAddPoiMode,
    poiDraft, setPoiDraft,
    poiName, setPoiName,
    poiDescription, setPoiDescription,
    poiMarkerColor, setPoiMarkerColor,
    poiMarkerShape, setPoiMarkerShape,
    poiMarkerSize, setPoiMarkerSize,
    customPois, setCustomPois,
  };
};
