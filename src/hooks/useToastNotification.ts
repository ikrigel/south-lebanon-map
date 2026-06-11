import { useCallback, useRef } from 'react';

interface UseToastNotificationDeps {
  setToastMessage: (msg: string) => void;
}

export const useToastNotification = (deps: UseToastNotificationDeps) => {
  const toastTimeoutRef = useRef<number | null>(null);

  const showToast = useCallback((message: string, timeoutMs = 2600) => {
    deps.setToastMessage(message);
    if (toastTimeoutRef.current !== null) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = window.setTimeout(() => {
      deps.setToastMessage('');
      toastTimeoutRef.current = null;
    }, timeoutMs);
  }, [deps]);

  return { showToast, toastTimeoutRef };
};
