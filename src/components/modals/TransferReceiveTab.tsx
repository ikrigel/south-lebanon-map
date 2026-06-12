interface TransferReceiveTabProps {
  videoRef: React.MutableRefObject<HTMLVideoElement | null>;
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
  scanning: boolean;
  scanError: string;
  importResult: string | null;
  onScanAgain: () => void;
  onStartCamera: () => void;
  onStopCamera: () => void;
}

export function TransferReceiveTab(props: TransferReceiveTabProps) {
  return (
    <div className="transfer-receive" data-testid="transfer-receive-panel">
      {props.importResult ? (
        <div className="transfer-success" data-testid="transfer-import-result">
          <div className="transfer-success-icon">✓</div>
          <p>{props.importResult}</p>
          <button
            className="btn"
            onClick={props.onScanAgain}
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
              ref={props.videoRef}
              className="transfer-video"
              muted
              playsInline
              data-testid="transfer-video"
            />
            <canvas ref={props.canvasRef} className="transfer-canvas-hidden" />
            {props.scanning && (
              <div className="transfer-scan-overlay">
                <div className="transfer-scan-frame" />
              </div>
            )}
          </div>

          {props.scanError && (
            <p className="transfer-error" data-testid="transfer-scan-error">{props.scanError}</p>
          )}

          {!props.scanning ? (
            <button
              className="btn btn-primary"
              onClick={props.onStartCamera}
              data-testid="transfer-start-scan"
            >
              הפעל מצלמה וסרוק
            </button>
          ) : (
            <button
              className="btn ghost"
              onClick={props.onStopCamera}
              data-testid="transfer-stop-scan"
            >
              עצור סריקה
            </button>
          )}
        </>
      )}
    </div>
  );
}
