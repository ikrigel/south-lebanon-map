import { useCallback } from 'react';
import { DONATION_CONTACT_URL } from '../constants';

interface UseAppUtilitiesDeps {
  showToast: (msg: string) => void;
}

export const useAppUtilities = (deps: UseAppUtilitiesDeps) => {
  const downloadJson = useCallback((filename: string, data: any) => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const shareCurrentApp = useCallback(async () => {
    const url = window.location.href;
    if ('clipboard' in navigator) {
      try {
        await navigator.clipboard.writeText(url);
        deps.showToast('לינק הועתק ללוח');
      } catch {
        deps.showToast('שגיאה בהעתקת לינק');
      }
    } else {
      deps.showToast('הדפדפן שלך אינו תומך בהעתקה');
    }
  }, [deps]);

  const openDonationLink = useCallback(() => {
    window.open(DONATION_CONTACT_URL, '_blank');
  }, []);

  const copyDonationLink = useCallback(async () => {
    if ('clipboard' in navigator) {
      try {
        await navigator.clipboard.writeText(DONATION_CONTACT_URL);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }, []);

  return { downloadJson, shareCurrentApp, openDonationLink, copyDonationLink };
};
