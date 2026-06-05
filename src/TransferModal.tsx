/**
 * TransferModal — העברת מרשמים ממכשיר למכשיר ע"י ברקוד (QR)
 *
 * Payload format (base64-encoded JSON):
 *   { v: 1, pois?: CustomPoi[], routes?: SavedRoute[], multiRoutes?: MultiPointRoute[], recording?: RecordingPayload }
 *
 * Route paths are stripped to ≤ 60 points when encoding (payload size limit).
 * The receiving device merges imported items (deduplicates by id).
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import jsQR from 'jsqr';

// ─── shared types (duplicated here to avoid circular import) ────────────────

export type PoiColor = string;
export type PoiShape = 'circle' | 'square' | 'diamond' | 'star';
export type PoiSize = 'sm' | 'md' | 'lg';

export interface CustomPoi {
  id: string;
  name: string;
  description: string;
  lat: number;
  lon: number;
  createdAt: string;
  markerColor: PoiColor;
  markerShape: PoiShape;
  markerSize: PoiSize;
}

export interface SavedRoute {
  id: string;
  name: string;
  createdAt: string;
  startId?: string;
  endId?: string;
  start: { lat: number; lon: number; label: string };
  end: { lat: number; lon: number; label: string };
  km: number;
  durationMin?: number;
  path?: [number, number][];
  instructions?: unknown[];
}

export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'extreme';
export type PassabilityLevel = 'paved' | 'dirt' | 'offroad' | 'foot_only';

export interface MultiPointRoute {
  id: string;
  name: string;
  description: string;
  difficulty: DifficultyLevel;
  passability: PassabilityLevel;
  points: { lat: number; lon: number; label: string; order: number }[];
  totalKm: number;
  createdAt: string;
}

export interface RecordingPayload {
  recordingName?: string;
  recordedTrack?: [number, number][];
}

// ─── payload ────────────────────────────────────────────────────────────────

export interface TransferPayload {
  v: 1;
  pois?: CustomPoi[];
  routes?: SavedRoute[];
  multiRoutes?: MultiPointRoute[];
  recording?: RecordingPayload;
}

// ─── props ───────────────────────────────────────────────────────────────────

export interface TransferModalProps {
  onClose: () => void;
  // Source data (for generating QR)
  customPois: CustomPoi[];
  savedRoutes: SavedRoute[];
  savedMultiRoutes: MultiPointRoute[];
  recordedTrack: [number, number][];
  recordingName: string;
  // Import callbacks (for scanning QR)
  onImportPois: (pois: CustomPoi[]) => void;
  onImportRoutes: (routes: SavedRoute[]) => void;
  onImportMultiRoutes: (routes: MultiPointRoute[]) => void;
  onImportRecording: (rec: RecordingPayload) => void;
}

// ─── constants ───────────────────────────────────────────────────────────────

const MAX_PATH_POINTS = 60;   // strip path to this many points for QR
const QR_SIZE = 280;
const QR_LEVEL = 'L';         // error correction — L gives max data capacity
const MAX_QR_BYTES = 2900;    // safe limit for QR v40-L with base64 ASCII

// ─── helpers ─────────────────────────────────────────────────────────────────

function downsamplePath(path: [number, number][], max: number): [number, number][] {
  if (path.length <= max) return path;
  const step = (path.length - 1) / (max - 1);
  const result: [number, number][] = [];
  for (let i = 0; i < max; i++) {
    result.push(path[Math.round(i * step)]);
  }
  return result;
}

function encodePayload(payload: TransferPayload): string {
  const json = JSON.stringify(payload);
  // btoa works on ASCII; encode UTF-8 via encodeURIComponent trick
  return btoa(unescape(encodeURIComponent(json)));
}

function decodePayload(encoded: string): TransferPayload | null {
  try {
    const json = decodeURIComponent(escape(atob(encoded)));
    const obj = JSON.parse(json);
    if (typeof obj !== 'object' || obj.v !== 1) return null;
    return obj as TransferPayload;
  } catch {
    return null;
  }
}

function buildPayload(
  pois: CustomPoi[],
  routes: SavedRoute[],
  multiRoutes: MultiPointRoute[],
  recordedTrack: [number, number][],
  recordingName: string,
  sel: Selection,
): TransferPayload {
  const payload: TransferPayload = { v: 1 };
  if (sel.pois && pois.length > 0) payload.pois = pois;
  if (sel.routes && routes.length > 0) {
    payload.routes = routes.map(r => ({
      ...r,
      path: r.path ? downsamplePath(r.path, MAX_PATH_POINTS) : undefined,
      instructions: undefined,
    }));
  }
  if (sel.multiRoutes && multiRoutes.length > 0) payload.multiRoutes = multiRoutes;
  if (sel.recording && recordedTrack.length > 0) {
    payload.recording = {
      recordingName: recordingName || 'הקלטה מיובאת',
      recordedTrack: downsamplePath(recordedTrack, MAX_PATH_POINTS),
    };
  }
  return payload;
}

interface Selection {
  pois: boolean;
  routes: boolean;
  multiRoutes: boolean;
  recording: boolean;
}

// ─── component ───────────────────────────────────────────────────────────────

export default function TransferModal({
  onClose,
  customPois,
  savedRoutes,
  savedMultiRoutes,
  recordedTrack,
  recordingName,
  onImportPois,
  onImportRoutes,
  onImportMultiRoutes,
  onImportRecording,
}: TransferModalProps) {
  const [tab, setTab] = useState<'send' | 'receive'>('send');

  // ── SEND state ─────────────────────────────────────────────────────────────
  const [selection, setSelection] = useState<Selection>({
    pois: customPois.length > 0,
    routes: savedRoutes.length > 0,
    multiRoutes: savedMultiRoutes.length > 0,
    recording: recordedTrack.length > 0,
  });

  const hasSomething = customPois.length > 0 || savedRoutes.length > 0 ||
    savedMultiRoutes.length > 0 || recordedTrack.length > 0;

  const payload = buildPayload(
    customPois, savedRoutes, savedMultiRoutes, recordedTrack, recordingName, selection,
  );
  const encoded = encodePayload(payload);
  const payloadEmpty =
    !selection.pois && !selection.routes && !selection.multiRoutes && !selection.recording;
  const tooBig = encoded.length > MAX_QR_BYTES;

  const toggle = (key: keyof Selection) =>
    setSelection(s => ({ ...s, [key]: !s[key] }));

  // ── RECEIVE state ──────────────────────────────────────────────────────────
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);

  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const [importResult, setImportResult] = useState<string | null>(null);

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
        setScanError('ברקוד זה אינו ברקוד העברת מרשמים תואם.');
        return;
      }
      // merge
      let msg = 'יובא בהצלחה:';
      const parts: string[] = [];
      if (decoded.pois?.length) {
        onImportPois(decoded.pois);
        parts.push(`${decoded.pois.length} נקודות עניין`);
      }
      if (decoded.routes?.length) {
        onImportRoutes(decoded.routes);
        parts.push(`${decoded.routes.length} מסלולים שמורים`);
      }
      if (decoded.multiRoutes?.length) {
        onImportMultiRoutes(decoded.multiRoutes);
        parts.push(`${decoded.multiRoutes.length} מסלולי ריבוי נקודות`);
      }
      if (decoded.recording) {
        onImportRecording(decoded.recording);
        parts.push('הקלטת נסיעה');
      }
      if (parts.length === 0) {
        setScanError('הברקוד תקני אך לא מכיל מרשמים.');
      } else {
        setImportResult(`${msg} ${parts.join(', ')}.`);
      }
      return;
    }
    rafRef.current = requestAnimationFrame(processFrame);
  }, [stopCamera, onImportPois, onImportRoutes, onImportMultiRoutes, onImportRecording]);

  const startCamera = useCallback(async () => {
    setScanError('');
    setImportResult(null);
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
      setScanError('לא ניתן לגשת למצלמה. ודא שנתת הרשאת מצלמה לאפליקציה.');
    }
  }, [processFrame]);

  // stop camera when tab changes or modal closes
  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  useEffect(() => {
    if (tab !== 'receive') stopCamera();
  }, [tab, stopCamera]);

  // ─── render ────────────────────────────────────────────────────────────────

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()} data-testid="transfer-modal-overlay">
      <div className="modal-box transfer-modal" dir="rtl" data-testid="transfer-modal">
        {/* header */}
        <div className="modal-header">
          <h2 className="modal-title">העברת מרשמים</h2>
          <button className="modal-close" onClick={onClose} aria-label="סגור" data-testid="transfer-modal-close">✕</button>
        </div>

        {/* tabs */}
        <div className="transfer-tabs">
          <button
            className={`transfer-tab${tab === 'send' ? ' active' : ''}`}
            onClick={() => setTab('send')}
            data-testid="transfer-tab-send"
          >
            📤 שלח מהמכשיר הזה
          </button>
          <button
            className={`transfer-tab${tab === 'receive' ? ' active' : ''}`}
            onClick={() => setTab('receive')}
            data-testid="transfer-tab-receive"
          >
            📥 קבל במכשיר זה
          </button>
        </div>

        {/* ── SEND ── */}
        {tab === 'send' && (
          <div className="transfer-send" data-testid="transfer-send-panel">
            {!hasSomething ? (
              <p className="transfer-empty">אין מרשמים שמורים במכשיר זה להעברה.</p>
            ) : (
              <>
                <p className="transfer-hint">בחר את המרשמים שברצונך להעביר:</p>
                <div className="transfer-checkboxes">
                  <label className={`transfer-check${customPois.length === 0 ? ' disabled' : ''}`}>
                    <input
                      type="checkbox"
                      checked={selection.pois && customPois.length > 0}
                      disabled={customPois.length === 0}
                      onChange={() => toggle('pois')}
                      data-testid="transfer-check-pois"
                    />
                    <span>נקודות עניין</span>
                    <span className="transfer-count">({customPois.length})</span>
                  </label>
                  <label className={`transfer-check${savedRoutes.length === 0 ? ' disabled' : ''}`}>
                    <input
                      type="checkbox"
                      checked={selection.routes && savedRoutes.length > 0}
                      disabled={savedRoutes.length === 0}
                      onChange={() => toggle('routes')}
                      data-testid="transfer-check-routes"
                    />
                    <span>מסלולים שמורים</span>
                    <span className="transfer-count">({savedRoutes.length})</span>
                  </label>
                  <label className={`transfer-check${savedMultiRoutes.length === 0 ? ' disabled' : ''}`}>
                    <input
                      type="checkbox"
                      checked={selection.multiRoutes && savedMultiRoutes.length > 0}
                      disabled={savedMultiRoutes.length === 0}
                      onChange={() => toggle('multiRoutes')}
                      data-testid="transfer-check-multi-routes"
                    />
                    <span>מסלולי ריבוי נקודות</span>
                    <span className="transfer-count">({savedMultiRoutes.length})</span>
                  </label>
                  <label className={`transfer-check${recordedTrack.length === 0 ? ' disabled' : ''}`}>
                    <input
                      type="checkbox"
                      checked={selection.recording && recordedTrack.length > 0}
                      disabled={recordedTrack.length === 0}
                      onChange={() => toggle('recording')}
                      data-testid="transfer-check-recording"
                    />
                    <span>הקלטת נסיעה</span>
                    {recordingName && <span className="transfer-count">({recordingName})</span>}
                  </label>
                </div>

                {!payloadEmpty && tooBig && (
                  <div className="transfer-warning">
                    ⚠️ הנתונים גדולים מדי לברקוד יחיד. הפחת את כמות הפריטים שבחרת, או ייצא כקובץ JSON.
                  </div>
                )}

                {!payloadEmpty && !tooBig && (
                  <div className="transfer-qr-wrap">
                    <QRCodeCanvas
                      value={encoded}
                      size={QR_SIZE}
                      level={QR_LEVEL}
                      marginSize={2}
                      bgColor="#ffffff"
                      fgColor="#111111"
                      data-testid="transfer-qr-canvas"
                    />
                    <p className="transfer-qr-hint">
                      הצג ברקוד זה למכשיר המקבל ← לחץ "קבל במכשיר זה" שם ← כוון מצלמה לברקוד
                    </p>
                    <p className="transfer-qr-size">
                      גודל מטען: {encoded.length} / {MAX_QR_BYTES} תווים
                    </p>
                  </div>
                )}

                {payloadEmpty && (
                  <p className="transfer-hint" style={{ marginTop: 12 }}>בחר לפחות סוג אחד.</p>
                )}
              </>
            )}
          </div>
        )}

        {/* ── RECEIVE ── */}
        {tab === 'receive' && (
          <div className="transfer-receive" data-testid="transfer-receive-panel">
            {importResult ? (
              <div className="transfer-success" data-testid="transfer-import-result">
                <div className="transfer-success-icon">✓</div>
                <p>{importResult}</p>
                <button
                  className="btn"
                  onClick={() => { setImportResult(null); setScanError(''); }}
                  data-testid="transfer-scan-again"
                >
                  סרוק שוב
                </button>
              </div>
            ) : (
              <>
                <p className="transfer-hint">
                  הצב את הברקוד שנוצר במכשיר השולח מול המצלמה.
                </p>

                {/* camera preview */}
                <div className="transfer-camera-wrap">
                  <video
                    ref={videoRef}
                    className="transfer-video"
                    muted
                    playsInline
                    data-testid="transfer-video"
                  />
                  <canvas ref={canvasRef} className="transfer-canvas-hidden" />
                  {scanning && (
                    <div className="transfer-scan-overlay">
                      <div className="transfer-scan-frame" />
                    </div>
                  )}
                </div>

                {scanError && (
                  <p className="transfer-error" data-testid="transfer-scan-error">{scanError}</p>
                )}

                {!scanning ? (
                  <button
                    className="btn btn-primary"
                    onClick={startCamera}
                    data-testid="transfer-start-scan"
                  >
                    הפעל מצלמה וסרוק
                  </button>
                ) : (
                  <button
                    className="btn ghost"
                    onClick={stopCamera}
                    data-testid="transfer-stop-scan"
                  >
                    עצור סריקה
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
