import React from 'react';
import type { LayerVis } from '../../../Map';

interface LabelPreferencesPanelProps {
  allLabels: boolean;
  largeLabels: boolean;
  setAllLabels: (value: boolean) => void;
  setLargeLabels: (value: boolean) => void;
  setVisible: (update: (v: LayerVis) => LayerVis) => void;
}

export const LabelPreferencesPanel: React.FC<LabelPreferencesPanelProps> = ({
  allLabels,
  largeLabels,
  setAllLabels,
  setLargeLabels,
  setVisible,
}) => {
  return (
    <div className="panel-section">
      <h3>נראות שמות במפה</h3>
      <div
        className="toggle-row"
        data-active={allLabels}
        onClick={() => {
          setAllLabels(!allLabels);
          setVisible(v => ({ ...v, cityLabels: true, settlementLabels: true, ridgeLabels: true, waterLabels: true }));
        }}
        role="switch"
        aria-checked={allLabels}
        data-testid="toggle-all-labels"
      >
        <div className="toggle-label">
          <span className="toggle-swatch label-swatch">כ</span>
          הצג את כל השמות תמיד
        </div>
        <span className="toggle-switch" />
      </div>
      <div
        className="toggle-row"
        data-active={largeLabels}
        onClick={() => setLargeLabels(!largeLabels)}
        role="switch"
        aria-checked={largeLabels}
        data-testid="toggle-large-labels"
      >
        <div className="toggle-label">
          <span className="toggle-swatch label-swatch">א</span>
          טקסט גדול לשמות יישובים ונקודות
        </div>
        <span className="toggle-switch" />
      </div>
      <p className="legend-note">
        "כל השמות" מציג את כל שמות המקומות והכפרים בלי להגדיל טקסט. "טקסט גדול" מגדיל את התוויות ומוסיף תעתיק באנגלית.
      </p>
    </div>
  );
};
