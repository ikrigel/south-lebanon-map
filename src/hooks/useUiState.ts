import { useState, useCallback, useRef } from 'react';
import { loadLocalThemeMode } from '../storage/loaders';
import { loadLocalUiState } from '../storage/sessionLoaders';
import { isDaytime } from '../navigation/turnHelpers';
import type { ThemeMode } from '../types';

export const useUiState = () => {
  const initialUiStateRef = useRef<any | null>(null);
  if (initialUiStateRef.current === null) initialUiStateRef.current = loadLocalUiState();

  const [themeMode, setThemeMode] = useState<ThemeMode>(() => loadLocalThemeMode());
  const [autoDay, setAutoDay] = useState(isDaytime());
  const [panelsCollapsed, setPanelsCollapsed] = useState(() => initialUiStateRef.current?.panelsCollapsed ?? false);
  const [panelHeightPct, setPanelHeightPct] = useState(() => initialUiStateRef.current?.panelHeightPct ?? 35);
  const panelDragRef = useRef<{ startY: number; startPct: number } | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const [miniOverlayOpen, setMiniOverlayOpen] = useState(false);
  const [miniStatus, setMiniStatus] = useState<'idle' | 'pip' | 'fallback' | 'popup' | 'mobile'>('idle');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [donationCopied, setDonationCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const toastTimeoutRef = useRef<number | null>(null);
  const [resumeNavDialog, setResumeNavDialog] = useState<any | null>(null);
  const [measureMode, setMeasureMode] = useState(false);
  const [manualMeasure, setManualMeasure] = useState<[number, number][]>([]);
  const miniExternalWindowRef = useRef<Window | null>(null);

  const showToast = useCallback((message: string, timeoutMs = 2600) => {
    setToastMessage(message);
    if (toastTimeoutRef.current !== null) window.clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastMessage('');
      toastTimeoutRef.current = null;
    }, timeoutMs);
  }, []);

  return {
    themeMode, setThemeMode,
    autoDay, setAutoDay,
    panelsCollapsed, setPanelsCollapsed,
    panelHeightPct, setPanelHeightPct,
    panelDragRef, panelRef,
    miniOverlayOpen, setMiniOverlayOpen,
    miniStatus, setMiniStatus,
    drawerOpen, setDrawerOpen,
    helpOpen, setHelpOpen,
    aboutOpen, setAboutOpen,
    transferOpen, setTransferOpen,
    supportOpen, setSupportOpen,
    donationCopied, setDonationCopied,
    toastMessage, setToastMessage,
    toastTimeoutRef,
    resumeNavDialog, setResumeNavDialog,
    measureMode, setMeasureMode,
    manualMeasure, setManualMeasure,
    miniExternalWindowRef,
    showToast,
  };
};
