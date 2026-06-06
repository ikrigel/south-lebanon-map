import React from 'react';

export type ResumeNavDialogData = {
  startLabel: string;
  endLabel: string;
  km: number;
};

export const ResumeNavDialog: React.FC<{
  data: ResumeNavDialogData | null;
  onResume: () => void;
  onCancel: () => void;
}> = ({ data, onResume, onCancel }) => {
  if (!data) return null;

  return (
    <div className="resume-nav-overlay" role="dialog" aria-modal="true" aria-label="המשך בניווט">
      <div className="resume-nav-card">
        <div className="resume-nav-icon">🗯️</div>
        <h3 className="resume-nav-title">המשך בניווט?</h3>
        <p className="resume-nav-body">
          נמצא ניווט שמור אל{' '}
          <strong>{data.endLabel}</strong>
          {data.km > 0 && (
            <span className="resume-nav-km"> · {data.km.toFixed(1)} ק״מ</span>
          )}
        </p>
        <p className="resume-nav-from">מ: {data.startLabel}</p>
        <div className="resume-nav-buttons">
          <button
            className="resume-nav-btn resume-nav-btn-yes"
            onClick={onResume}
          >
            ▶ המשך בניווט
          </button>
          <button
            className="resume-nav-btn resume-nav-btn-no"
            onClick={onCancel}
          >
            ✕ בטל ניווט
          </button>
        </div>
      </div>
    </div>
  );
};
