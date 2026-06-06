import React from 'react';
import { fmtKm } from '../../../util';

export const RecordingSection: React.FC<{
  recordingStatus: 'idle' | 'recording' | 'paused' | 'error';
  recordedTrack: [number, number][];
  recordedKm: number;
  recordingName: string;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onClearRecording: () => void;
  onRecordingNameChange: (name: string) => void;
  onSaveRecording: () => void;
  onExportRecording: () => void;
  showToast: (message: string) => void;
}> = ({
  recordingStatus,
  recordedTrack,
  recordedKm,
  recordingName,
  onStartRecording,
  onStopRecording,
  onClearRecording,
  onRecordingNameChange,
  onSaveRecording,
  onExportRecording,
  showToast,
}) => {
  return (
    <div className="panel-section">
      <h3>הקלטת מסלול נסיעה</h3>
      <div className="recording-box" data-testid="recording-box">
        <div className="route-actions">
          <button
            className="btn"
            onClick={recordingStatus === 'recording' ? onStopRecording : onStartRecording}
            aria-pressed={recordingStatus === 'recording'}
            data-testid="button-record-route"
          >
            {recordingStatus === 'recording' ? 'עצור הקלטה' : 'התחל הקלטה'}
          </button>
          <button
            className="btn ghost"
            disabled={recordedTrack.length === 0}
            onClick={() => {
              onClearRecording();
              showToast('ההקלטה המקומית נוקתה');
            }}
            data-testid="button-clear-recording"
          >
            נקה הקלטה
          </button>
        </div>

        <div className="route-summary compact" data-testid="text-recording-status">
          {recordingStatus === 'recording' && (
            <span>הקלטה פעילה · {recordedTrack.length} נקודות · {fmtKm(recordedKm)}</span>
          )}
          {recordingStatus === 'idle' && recordedTrack.length > 0 && (
            <span>הקלטה מוכנה לשמירה · {recordedTrack.length} נקודות · {fmtKm(recordedKm)}</span>
          )}
          {recordingStatus === 'idle' && recordedTrack.length === 0 && (
            <span>לחץ "התחל הקלטה" כדי לשמור מסלול GPS תוך כדי נסיעה.</span>
          )}
          {recordingStatus === 'error' && (
            <span>לא ניתן להקליט מיקום. בדוק הרשאת מיקום בדפדפן.</span>
          )}
        </div>

        <input
          className="search"
          value={recordingName}
          onChange={e => onRecordingNameChange(e.target.value)}
          placeholder="שם להקלטת המסלול…"
          data-testid="input-recording-name"
        />

        <div className="route-actions">
          <button
            className="btn"
            disabled={recordedTrack.length < 2}
            onClick={onSaveRecording}
            data-testid="button-save-recording"
          >
            שמור הקלטה
          </button>
          <button
            className="btn ghost"
            disabled={recordedTrack.length < 2}
            onClick={onExportRecording}
            data-testid="button-export-recording"
          >
            שתף כקובץ
          </button>
        </div>

        <p className="legend-note">
          ההקלטה נשמרת מקומית בדפדפן תוך כדי עבודה. אם הדפדפן מאפשר GPS ברקע, ההקלטה תמשיך; אם לא, המסלול שנצבר עד כה יישמר וניתן להמשיך אחרי החזרה לאפליקציה.
        </p>
      </div>
    </div>
  );
};
