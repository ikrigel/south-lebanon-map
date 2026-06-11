import { useCallback } from 'react';

interface UsePanelCallbacksDeps {
  panelsCollapsed: boolean;
  setPanelsCollapsed: (v: boolean) => void;
  panelDragRef: React.MutableRefObject<any>;
  panelHeightPct: number;
  setPanelHeightPct: (pct: number) => void;
}

export const usePanelCallbacks = (deps: UsePanelCallbacksDeps) => {
  const handlePanelToggle = useCallback(() => {
    deps.setPanelsCollapsed(!deps.panelsCollapsed);
  }, [deps.panelsCollapsed, deps.setPanelsCollapsed]);

  const handlePanelDragStart = useCallback((clientY: number) => {
    deps.panelDragRef.current = { startY: clientY, startPct: deps.panelHeightPct };
  }, [deps.panelHeightPct, deps.panelDragRef]);

  const handlePanelDragMove = useCallback((clientY: number) => {
    if (!deps.panelDragRef.current) return;
    const delta = deps.panelDragRef.current.startY - clientY;
    const newPct = Math.max(20, Math.min(80, deps.panelDragRef.current.startPct + delta / 6));
    deps.setPanelHeightPct(newPct);
  }, [deps.panelHeightPct, deps.panelDragRef, deps.setPanelHeightPct]);

  const handlePanelDragEnd = useCallback(() => {
    deps.panelDragRef.current = null;
  }, [deps.panelDragRef]);

  return { handlePanelToggle, handlePanelDragStart, handlePanelDragMove, handlePanelDragEnd };
};
