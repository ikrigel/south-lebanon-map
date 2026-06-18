import { useState, useEffect, useCallback } from 'react';
import { safeStorageGet, safeStorageSet } from '../storage/storage';
import { HEADER_VISIBILITY_STORAGE_KEY } from '../constants';
import type { HeaderVisibilityMode } from '../types';

interface UseHeaderVisibilityProps {
  defaultMode?: HeaderVisibilityMode;
}

export const useHeaderVisibility = (props: UseHeaderVisibilityProps = {}) => {
  const defaultMode: HeaderVisibilityMode = props.defaultMode || 'fix';
  const [visibilityMode, setVisibilityMode] = useState<HeaderVisibilityMode>(defaultMode);
  const [headerVisible, setHeaderVisible] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = safeStorageGet(HEADER_VISIBILITY_STORAGE_KEY);
      if (stored) {
        const { mode, visible } = JSON.parse(stored);
        if (mode && ['fix', 'manual', 'auto'].includes(mode)) {
          setVisibilityMode(mode);
          if (typeof visible === 'boolean') {
            setHeaderVisible(visible);
          }
        }
      }
    } catch {
      // Fall back to defaults
    }
  }, []);

  // Persist changes to localStorage
  useEffect(() => {
    safeStorageSet(HEADER_VISIBILITY_STORAGE_KEY, JSON.stringify({
      mode: visibilityMode,
      visible: headerVisible,
    }));
  }, [visibilityMode, headerVisible]);

  const changeMode = useCallback((mode: HeaderVisibilityMode) => {
    setVisibilityMode(mode);
  }, []);

  const toggleHeaderVisibility = useCallback(() => {
    setHeaderVisible(prev => !prev);
  }, []);

  const setVisible = useCallback((visible: boolean) => {
    setHeaderVisible(visible);
  }, []);

  return {
    visibilityMode,
    headerVisible,
    changeMode,
    toggleHeaderVisibility,
    setVisible,
  };
};
