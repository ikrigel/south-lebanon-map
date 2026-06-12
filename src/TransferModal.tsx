/**
 * TransferModal — העברת מרשמים ממכשיר למכשיר ע"י ברקוד (QR)
 *
 * Payload format (base64-encoded JSON):
 *   { v: 1, pois?: CustomPoi[], routes?: SavedRoute[], multiRoutes?: MultiPointRoute[], recording?: RecordingPayload }
 *
 * Route paths are stripped to ≤ 60 points when encoding (payload size limit).
 * The receiving device merges imported items (deduplicates by id).
 */

import { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { TransferSendTab } from './components/modals/TransferSendTab';
import { TransferReceiveTab } from './components/modals/TransferReceiveTab';
import { buildPayload, encodePayload, QR_CONFIG, type TransferPayload, type Selection } from './utils/transferPayload';
import { useQrScanner } from './hooks/useQrScanner';

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
  const tooBig = encoded.length > QR_CONFIG.MAX_BYTES;

  const toggle = (key: keyof Selection) =>
    setSelection(s => ({ ...s, [key]: !s[key] }));

  // ── RECEIVE state ──────────────────────────────────────────────────────────
  const [scanError, setScanError] = useState('');
  const [importResult, setImportResult] = useState<string | null>(null);

  const handleQrDecoded = (decoded: TransferPayload) => {
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
  };

  const { videoRef, canvasRef, scanning, startCamera, stopCamera } = useQrScanner({
    onDecoded: handleQrDecoded,
    onError: setScanError,
    enabled: tab === 'receive',
  });

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
          <TransferSendTab
            customPois={customPois}
            savedRoutes={savedRoutes}
            savedMultiRoutes={savedMultiRoutes}
            recordedTrack={recordedTrack}
            recordingName={recordingName}
            selection={selection}
            onToggle={toggle}
            hasSomething={hasSomething}
            encoded={encoded}
            payloadEmpty={payloadEmpty}
            tooBig={tooBig}
          />
        )}

        {/* ── RECEIVE ── */}
        {tab === 'receive' && (
          <TransferReceiveTab
            videoRef={videoRef}
            canvasRef={canvasRef}
            scanning={scanning}
            scanError={scanError}
            importResult={importResult}
            onScanAgain={() => { setImportResult(null); setScanError(''); }}
            onStartCamera={startCamera}
            onStopCamera={stopCamera}
          />
        )}
      </div>
    </div>
  );
}
