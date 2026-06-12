import { useCallback } from 'react';
import { DONATION_CONTACT_URL } from '../constants';

interface UseUICallbacksProps {
  setDonationCopied: (copied: boolean) => void;
  setHelpOpen: (open: boolean) => void;
  setSupportOpen: (open: boolean) => void;
  setAboutOpen: (open: boolean) => void;
  setDrawerOpen: (open: boolean) => void;
  setTransferOpen: (open: boolean) => void;
  setPanelsCollapsed: (collapsed: boolean) => void;
  handlePanelToggle: () => void;
  openMiniWindow: () => void;
  setMiniOverlayOpen: (open: boolean) => void;
}

export function useUICallbacks({
  setDonationCopied,
  setHelpOpen,
  setSupportOpen,
  setAboutOpen,
  setDrawerOpen,
  setTransferOpen,
  setPanelsCollapsed,
}: UseUICallbacksProps) {
  const openDonationLink = useCallback(() => {
    const opened = window.open(DONATION_CONTACT_URL, '_blank', 'noopener,noreferrer');
    if (!opened) {
      window.location.href = DONATION_CONTACT_URL;
    }
  }, []);

  const copyDonationLink = useCallback(async () => {
    await navigator.clipboard?.writeText(DONATION_CONTACT_URL);
    setDonationCopied(true);
    window.setTimeout(() => setDonationCopied(false), 2200);
  }, [setDonationCopied]);

  const shareCurrentApp = useCallback(async () => {
    const shareData = {
      title: 'מפת מרחב דרום לבנון',
      text: 'מפה אינטראקטיבית חינוכית של מרחב דרום לבנון עד נהר הליטני',
      url: window.location.href,
    };
    if (navigator.share) {
      await navigator.share(shareData);
      return;
    }
    await navigator.clipboard?.writeText(window.location.href);
  }, []);

  return {
    openDonationLink,
    copyDonationLink,
    shareCurrentApp,
  };
}
