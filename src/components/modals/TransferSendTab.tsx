import { QRCodeCanvas } from 'qrcode.react';
import type { CustomPoi, SavedRoute, MultiPointRoute, RecordingPayload } from '../../TransferModal';
import { QR_CONFIG, type Selection } from '../../utils/transferPayload';

interface TransferSendTabProps {
  customPois: CustomPoi[];
  savedRoutes: SavedRoute[];
  savedMultiRoutes: MultiPointRoute[];
  recordedTrack: [number, number][];
  recordingName: string;
  selection: Selection;
  onToggle: (key: keyof Selection) => void;
  hasSomething: boolean;
  encoded: string;
  payloadEmpty: boolean;
  tooBig: boolean;
}

export function TransferSendTab(props: TransferSendTabProps) {
  return (
    <div className="transfer-send" data-testid="transfer-send-panel">
      {!props.hasSomething ? (
        <p className="transfer-empty">אין מרשמים שמורים במכשיר זה להעברה.</p>
      ) : (
        <>
          <p className="transfer-hint">בחר את המרשמים שברצונך להעביר:</p>
          <div className="transfer-checkboxes">
            <label className={`transfer-check${props.customPois.length === 0 ? ' disabled' : ''}`}>
              <input
                type="checkbox"
                checked={props.selection.pois && props.customPois.length > 0}
                disabled={props.customPois.length === 0}
                onChange={() => props.onToggle('pois')}
                data-testid="transfer-check-pois"
              />
              <span>נקודות עניין</span>
              <span className="transfer-count">({props.customPois.length})</span>
            </label>
            <label className={`transfer-check${props.savedRoutes.length === 0 ? ' disabled' : ''}`}>
              <input
                type="checkbox"
                checked={props.selection.routes && props.savedRoutes.length > 0}
                disabled={props.savedRoutes.length === 0}
                onChange={() => props.onToggle('routes')}
                data-testid="transfer-check-routes"
              />
              <span>מסלולים שמורים</span>
              <span className="transfer-count">({props.savedRoutes.length})</span>
            </label>
            <label className={`transfer-check${props.savedMultiRoutes.length === 0 ? ' disabled' : ''}`}>
              <input
                type="checkbox"
                checked={props.selection.multiRoutes && props.savedMultiRoutes.length > 0}
                disabled={props.savedMultiRoutes.length === 0}
                onChange={() => props.onToggle('multiRoutes')}
                data-testid="transfer-check-multi-routes"
              />
              <span>מסלולי ריבוי נקודות</span>
              <span className="transfer-count">({props.savedMultiRoutes.length})</span>
            </label>
            <label className={`transfer-check${props.recordedTrack.length === 0 ? ' disabled' : ''}`}>
              <input
                type="checkbox"
                checked={props.selection.recording && props.recordedTrack.length > 0}
                disabled={props.recordedTrack.length === 0}
                onChange={() => props.onToggle('recording')}
                data-testid="transfer-check-recording"
              />
              <span>הקלטת נסיעה</span>
              {props.recordingName && <span className="transfer-count">({props.recordingName})</span>}
            </label>
          </div>

          {!props.payloadEmpty && props.tooBig && (
            <div className="transfer-warning">
              ⚠️ הנתונים גדולים מדי לברקוד יחיד. הפחת את כמות הפריטים שבחרת, או ייצא כקובץ JSON.
            </div>
          )}

          {!props.payloadEmpty && !props.tooBig && (
            <div className="transfer-qr-wrap">
              <QRCodeCanvas
                value={props.encoded}
                size={QR_CONFIG.SIZE}
                level={QR_CONFIG.LEVEL as any}
                marginSize={2}
                bgColor="#ffffff"
                fgColor="#111111"
                data-testid="transfer-qr-canvas"
              />
              <p className="transfer-qr-hint">
                הצג ברקוד זה למכשיר המקבל ← לחץ "קבל במכשיר זה" שם ← כוון מצלמה לברקוד
              </p>
              <p className="transfer-qr-size">
                גודל מטען: {props.encoded.length} / {QR_CONFIG.MAX_BYTES} תווים
              </p>
            </div>
          )}

          {props.payloadEmpty && (
            <p className="transfer-hint" style={{ marginTop: 12 }}>בחר לפחות סוג אחד.</p>
          )}
        </>
      )}
    </div>
  );
}
