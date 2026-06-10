import { useState } from 'react';
import { loadLocalLayerVisibility } from '../storage/loaders';
import { loadLocalLabelPreferences } from '../storage/loaders';
import type { LayerVis } from '../Map';

export const useMapDisplayState = () => {
  const [visible, setVisible] = useState<LayerVis>(() => loadLocalLayerVisibility());
  const [largeLabels, setLargeLabels] = useState(() => {
    const prefs = loadLocalLabelPreferences();
    return prefs?.largeLabels ?? false;
  });
  const [allLabels, setAllLabels] = useState(() => {
    const prefs = loadLocalLabelPreferences();
    return prefs?.allLabels ?? false;
  });
  const [focusTarget, setFocusTarget] = useState<{ lat: number; lon: number; zoom?: number; id: string; label?: string } | null>(null);
  const [liveFollowDetached, setLiveFollowDetached] = useState(false);
  const [liveCenterRequestId, setLiveCenterRequestId] = useState(0);
  const [mapSearchQuery, setMapSearchQuery] = useState('');

  return {
    visible, setVisible,
    largeLabels, setLargeLabels,
    allLabels, setAllLabels,
    focusTarget, setFocusTarget,
    liveFollowDetached, setLiveFollowDetached,
    liveCenterRequestId, setLiveCenterRequestId,
    mapSearchQuery, setMapSearchQuery,
  };
};
