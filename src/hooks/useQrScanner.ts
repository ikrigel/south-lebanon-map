import { useCallback, useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { decodePayload, type TransferPayload } from '../utils/transferPayload';

interface UseQrScannerProps {
  onDecoded: (payload: TransferPayload) => void;
  onError: (error: string) => void;
  enabled: boolean;
}

export function useQrScanner({ onDecoded, onError, enabled }: UseQrScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);

  const [scanning, setScanning] = useState(false);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setScanning(false);
  }, []);

  const processFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(processFrame);
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });
    if (code?.data) {
      stopCamera();
      const decoded = decodePayload(code.data);
      if (!decoded) {
        onError('ברקוד זה אינו ברקוד העברת מרשמים תואם.');
        return;
      }
      onDecoded(decoded);
      return;
    }
    rafRef.current = requestAnimationFrame(processFrame);
  }, [stopCamera, onDecoded, onError]);

  const startCamera = useCallback(async () => {
    onError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScanning(true);
      rafRef.current = requestAnimationFrame(processFrame);
    } catch {
      onError('לא ניתן לגשת למצלמה. ודא שנתת הרשאת מצלמה לאפליקציה.');
    }
  }, [processFrame, onError]);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  useEffect(() => {
    if (!enabled) stopCamera();
  }, [enabled, stopCamera]);

  return { videoRef, canvasRef, scanning, startCamera, stopCamera };
}
