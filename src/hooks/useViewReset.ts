import { useCallback } from 'react';
import { DEFAULT_LAYER_VISIBILITY, DEFAULT_THEME_MODE } from '../constants';

interface UseViewResetDeps {
  setVisible: (v: any) => void;
  setThemeMode: (m: any) => void;
  setLargeLabels: (v: boolean) => void;
  setAllLabels: (v: boolean) => void;
  setCompassMode: (v: boolean) => void;
  setMeasureMode: (v: boolean) => void;
  setManualMeasure: (m: any) => void;
  setSelectedId: (id: any) => void;
  setLiveFollowDetached: (v: boolean) => void;
  setRotationLocked: (v: boolean) => void;
  setUserMapRotation: (r: number) => void;
}

export const useViewReset = (deps: UseViewResetDeps) => {
  const resetView = useCallback(() => {
    deps.setVisible({ ...DEFAULT_LAYER_VISIBILITY });
    deps.setThemeMode(DEFAULT_THEME_MODE);
    deps.setLargeLabels(false);
    deps.setAllLabels(false);
    deps.setCompassMode(false);
    deps.setMeasureMode(false);
    deps.setManualMeasure([]);
    deps.setSelectedId(null);
    deps.setLiveFollowDetached(false);
    deps.setRotationLocked(false);
    deps.setUserMapRotation(0);
  }, [deps]);

  const resetMapRotation = useCallback(() => {
    deps.setCompassMode(false);
    deps.setRotationLocked(false);
    deps.setUserMapRotation(0);
  }, [deps]);

  return { resetView, resetMapRotation };
};
