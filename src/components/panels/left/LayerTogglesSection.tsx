import React from 'react';
import type { LayerVis } from '../../../Map';

export const LayerTogglesSection: React.FC<{
  visible: LayerVis;
  onToggle: (key: keyof LayerVis) => () => void;
}> = ({ visible, onToggle }) => {
  return (
    <div className="panel-section">
      <h3>שכבות מידע</h3>

      <div className="layer-group-title">סגנון מפה</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={() => {
            // Deselect both satellite and topo to show base map
            if (visible.satellite) onToggle('satellite')();
            if (visible.topo) onToggle('topo')();
          }}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: !visible.satellite && !visible.topo ? '2px solid #3b82f6' : '1px solid #d1d5db',
            background: !visible.satellite && !visible.topo ? '#dbeafe' : '#f9fafb',
            color: !visible.satellite && !visible.topo ? '#1e40af' : '#6b7280',
            cursor: 'pointer',
            fontWeight: !visible.satellite && !visible.topo ? 600 : 500,
            fontSize: '13px',
            transition: 'all 0.2s',
          }}
          data-testid="button-map-style-base"
        >
          🗺️ בסיס
        </button>
        <button
          onClick={onToggle('satellite')}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: visible.satellite ? '2px solid #3b82f6' : '1px solid #d1d5db',
            background: visible.satellite ? '#dbeafe' : '#f9fafb',
            color: visible.satellite ? '#1e40af' : '#6b7280',
            cursor: 'pointer',
            fontWeight: visible.satellite ? 600 : 500,
            fontSize: '13px',
            transition: 'all 0.2s',
          }}
          data-testid="button-map-style-satellite"
        >
          🛰️ לוויין
        </button>
        <button
          onClick={onToggle('topo')}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: visible.topo ? '2px solid #3b82f6' : '1px solid #d1d5db',
            background: visible.topo ? '#dbeafe' : '#f9fafb',
            color: visible.topo ? '#1e40af' : '#6b7280',
            cursor: 'pointer',
            fontWeight: visible.topo ? 600 : 500,
            fontSize: '13px',
            transition: 'all 0.2s',
          }}
          data-testid="button-map-style-topo"
        >
          ⛰️ תבליט
        </button>
      </div>

      <div className="layer-group-title">שכבות בסיס, ביטחון</div>
      {[
        { key: 'pop' as const, label: 'תפוצת אוכלוסיה אזרחית', color: '#d0b58a' },
        { key: 'unifil' as const, label: 'יוניפי״ל — מטה ומגזרים', color: '#6da7d1' },
        { key: 'hez' as const, label: 'אזורי השפעת חזבאללה (איכותי)', color: '#b56466' },
        { key: 'blueLine' as const, label: 'הקו הכחול (מקורב)', color: '#5a8fbf' },
        { key: 'litani' as const, label: 'נהר הליטני וגבול אזור החיץ', color: '#4e7fb0' },
        { key: 'rivers' as const, label: 'נהרות — זהרני, אוואלי', color: '#4a90c4' },
      ].map(l => (
        <div
          key={l.key}
          className="toggle-row"
          data-active={visible[l.key]}
          onClick={onToggle(l.key)}
          role="switch"
          aria-checked={visible[l.key]}
          data-testid={`toggle-layer-${l.key}`}
        >
          <div className="toggle-label">
            <span className="toggle-swatch" style={{ background: l.color }} />
            {l.label}
          </div>
          <span className="toggle-switch" />
        </div>
      ))}

      <div className="layer-group-title layer-group-title-labels">שכבות שמות בעברית</div>
      {[
        { key: 'cityLabels' as const, label: 'שמות בעברית — הפעלה כללית', color: '#f6c453' },
        { key: 'settlementLabels' as const, label: 'שמות יישובים וכפרים', color: '#f6c453' },
        { key: 'ridgeLabels' as const, label: 'רכסים, הרים ועמקים', color: '#d49a3a' },
        { key: 'waterLabels' as const, label: 'נחלים, ואדיות ונהרות', color: '#4e7fb0' },
      ].map(l => (
        <div
          key={l.key}
          className="toggle-row"
          data-active={visible[l.key]}
          onClick={onToggle(l.key)}
          role="switch"
          aria-checked={visible[l.key]}
          data-testid={`toggle-layer-${l.key}`}
        >
          <div className="toggle-label">
            <span className="toggle-swatch" style={{ background: l.color }} />
            {l.label}
          </div>
          <span className="toggle-switch" />
        </div>
      ))}

      <p className="legend-note">
        שכבת חזבאללה היא איכותית בלבד — מבוססת דיווחי תקשורת ומחקר ציבוריים, אינה מציינת מתקנים מבצעיים או יעדים תקיפים.
      </p>

      <div
        className="toggle-row"
        data-active={visible.sectColors}
        onClick={onToggle('sectColors')}
        role="switch"
        aria-checked={visible.sectColors}
        data-testid="toggle-layer-sectColors"
      >
        <div className="toggle-label">
          <span className="toggle-swatch" style={{ background: 'linear-gradient(90deg,#2a8a6e,#b03030,#7b3fa0,#c97d2a)' }} />
          צביעת ישובים לפי השתייכות דתית
        </div>
        <span className="toggle-switch" />
      </div>

      {visible.sectColors && (
        <>
          <div className="sect-legend">
            {([
              { sect: 'shia', label: 'שיעים', color: '#2a8a6e' },
              { sect: 'sunni', label: 'סונים', color: '#c97d2a' },
              { sect: 'christian', label: 'נוצרים', color: '#b03030' },
              { sect: 'druze', label: 'דרוזים', color: '#7b3fa0' },
              { sect: 'mixed', label: 'מעורב', color: '#6b7280' },
            ] as const).map(s => (
              <div key={s.sect} className="sect-legend-row">
                <span className="sect-legend-dot" style={{ background: s.color }} />
                <span>{s.label}</span>
              </div>
            ))}
          </div>
          <p className="legend-note">צבע הגבול והנקודה על תווית הישוב מציינים את ההשתייכות הדתית הדומיננטית.</p>
        </>
      )}

      <div className="layer-group-title layer-group-title-labels" style={{ marginTop: 12 }}>תוויות ניווט</div>
      <div
        className="toggle-row"
        data-active={visible.navLabels}
        onClick={onToggle('navLabels')}
        role="switch"
        aria-checked={visible.navLabels}
        data-testid="toggle-layer-navLabels"
      >
        <div className="toggle-label">
          <span className="toggle-swatch" style={{ background: 'linear-gradient(90deg,#6ed1c2,#d49a3a)' }} />
          תוויות מסלול: יעד, מרחק, זמן צפוי והתקדמות
        </div>
        <span className="toggle-switch" />
      </div>

      {visible.navLabels && (
        <p className="legend-note">
          בזמן ניווט פעיל: תוצג תווית יעד (שם), מרחק כולל וזמן משוער על הנתיב,
          אחוז השלמת המסלול (כשיש GPS), ומרחק נותר ליעד על החץ המסמן מיקומך.
          כיבוי מנקה עבור מפה נקייה יותר.
        </p>
      )}

      <div className="layer-group-title layer-group-title-labels" style={{ marginTop: 12 }}>מודיעין ביטחוני</div>
      <div
        className="toggle-row"
        data-active={visible.drones}
        onClick={onToggle('drones')}
        role="switch"
        aria-checked={visible.drones}
        data-testid="toggle-layer-drones"
      >
        <div className="toggle-label">
          <span className="toggle-swatch" style={{ background: 'linear-gradient(90deg,#ef4444,#f59e0b,#fbbf24)' }} />
          התקפות כלים של חזבאללה על כוחות צה״ל (2024–2026)
        </div>
        <span className="toggle-switch" />
      </div>

      {visible.drones && (
        <p className="legend-note">
          <strong>סטטוסים:</strong> 🔴 מאומת (לפחות מקור אחד) • 🟠 טוען (דיווח מצד אחד) • 🟡 מעורער (מקורות סותרים)<br/>
          <strong>מקורות:</strong> דוחות צבאיים, OSINT, תקשורת בינלאומית<br/>
          <strong>הערה:</strong> קואורדינטות מקורבות למקום הקרוב ביותר
        </p>
      )}
    </div>
  );
};
