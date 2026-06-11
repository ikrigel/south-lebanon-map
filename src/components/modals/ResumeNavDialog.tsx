interface ResumeNavDialogProps {
  resumeNavDialog: any | null;
  onClose: () => void;
  onContinue: () => void;
  onDiscard: () => void;
}

export function ResumeNavDialog(props: ResumeNavDialogProps) {
  if (!props.resumeNavDialog) return null;

  return (
    <div className="resume-nav-overlay" role="dialog" aria-modal="true" aria-label="המשך בניווט">
      <div className="resume-nav-card">
        <div className="resume-nav-icon">🗯️</div>
        <h3 className="resume-nav-title">המשך בניווט?</h3>
        <p className="resume-nav-body">
          נמצא ניווט שמור אל{' '}
          <strong>{props.resumeNavDialog.endLabel}</strong>
          {props.resumeNavDialog.km > 0 && (
            <span className="resume-nav-km"> · {props.resumeNavDialog.km.toFixed(1)} ק״מ</span>
          )}
        </p>
        <p className="resume-nav-from">מ: {props.resumeNavDialog.startLabel}</p>
        <div className="resume-nav-buttons">
          <button className="resume-nav-btn resume-nav-btn-yes" onClick={props.onContinue}>
            ▶ המשך בניווט
          </button>
          <button className="resume-nav-btn resume-nav-btn-no" onClick={props.onDiscard}>
            ✕ בטל ניווט
          </button>
        </div>
      </div>
    </div>
  );
}
