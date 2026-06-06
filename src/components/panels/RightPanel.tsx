import React from 'react';
import type { Incident } from '../../data/incidents';
import { fmtDate, fmtKm, distanceToPolyline } from '../../util';
import { blueLine } from '../../data/rivers';

const TYPE_COLOR: Record<string, string> = {
  rocket: '#ff6b6b',
  atgm: '#ffa94d',
  uav: '#74c0fc',
  idf_strike: '#b197fc',
  unifil: '#94d82d',
  ground: '#ff922b',
  displacement: '#748ffc',
};

const TYPE_LABEL: Record<string, string> = {
  rocket: 'רקטה',
  atgm: 'נ״ט',
  uav: 'כטב״ם',
  idf_strike: 'תקיפה',
  unifil: 'יוניפי״ל',
  ground: 'קרקע',
  displacement: 'עקור',
};

const SEV_LABEL: Record<string, string> = {
  low: 'נמוכה',
  med: 'בינונית',
  high: 'גבוהה',
};

export const RightPanel: React.FC<{
  stats: any;
  filtered: Incident[];
  selected: Incident | null;
  incidents: Incident[];
  distanceById: Map<string, any>;
  onSelectIncident: (id: string) => void;
  onClearSelection: () => void;
}> = ({ stats, filtered, selected, incidents, distanceById, onSelectIncident, onClearSelection }) => {
  return (
    <aside className="panel right" data-testid="panel-analytics">
      <div className="panel-scroll">
        <div className="panel-section">
          <h3>סיכום אנליטי</h3>
          <div className="kpi-grid">
            <div className="kpi">
              <div className="kpi-label">אירועים מסוננים</div>
              <div className="kpi-value" data-testid="kpi-total">{stats.total}</div>
              <div className="kpi-sub">מתוך {incidents.length} בסה״כ</div>
            </div>
            <div className="kpi">
              <div className="kpi-label">מרחק ממוצע לקו הכחול</div>
              <div className="kpi-value" data-testid="kpi-avg">{isFinite(stats.avg) ? stats.avg.toFixed(1) : '—'}</div>
              <div className="kpi-sub">ק״מ · ממוצע</div>
            </div>
            <div className="kpi">
              <div className="kpi-label">מינ׳ מרחק</div>
              <div className="kpi-value">{isFinite(stats.min) ? stats.min.toFixed(2) : '—'}</div>
              <div className="kpi-sub">ק״מ</div>
            </div>
            <div className="kpi">
              <div className="kpi-label">מקס׳ מרחק</div>
              <div className="kpi-value">{isFinite(stats.max) ? stats.max.toFixed(1) : '—'}</div>
              <div className="kpi-sub">ק״מ</div>
            </div>
          </div>
        </div>

        <div className="panel-section">
          <h3>פילוח לפי סוג אירוע</h3>
          {stats.byType.map(({ type, n }: any) => {
            const max = Math.max(1, ...stats.byType.map((x: any) => x.n));
            return (
              <div className="bar-row" key={type}>
                <span className="count">{n}</span>
                <span className="bar" aria-hidden="true"><div style={{ width: `${(n / max) * 100}%`, background: TYPE_COLOR[type] }} /></span>
                <span className="label">{TYPE_LABEL[type]}</span>
              </div>
            );
          })}
        </div>

        <div className="panel-section">
          <h3>
            <span>{selected ? 'אירוע נבחר' : 'רשימת אירועים'}</span>
            <span style={{ color: 'var(--text-faint)', fontSize: 10, textTransform: 'none', letterSpacing: 0 }}>
              {filtered.length} אירועים מתאימים
            </span>
          </h3>
          {selected ? (
            <div className="incident-card" data-selected="true" data-testid={`detail-${selected.id}`}>
              <div className="incident-head">
                <span className={`sev ${selected.severity}`} />
                <span className="incident-date">{fmtDate(selected.date)}</span>
              </div>
              <p className="incident-title">{selected.title_he}</p>
              <p style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--text-muted)', margin: '8px 0' }}>
                {selected.desc_he}
              </p>
              <div className="incident-meta">
                <span className="tag type" style={{ color: TYPE_COLOR[selected.type], borderColor: TYPE_COLOR[selected.type] }}>{TYPE_LABEL[selected.type]}</span>
                <span className="tag">חומרה: {SEV_LABEL[selected.severity]}</span>
                {selected.approx && <span className="tag approx">מיקום מקורב</span>}
              </div>
              <div style={{ marginTop: 10, fontSize: 12 }}>
                <div style={{ color: 'var(--text-muted)' }}>מרחק מקו הכחול</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--accent-hi)', fontSize: 16, marginTop: 2 }} data-testid="text-distance-blue">
                  {fmtKm(distanceById.get(selected.id)?.km ?? distanceToPolyline([selected.lat, selected.lon], blueLine).km)}
                </div>
              </div>
              <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <a className="btn" href={selected.source_url} target="_blank" rel="noopener" data-testid="link-source">
                  מקור: {selected.source_label} ↗
                </a>
                <button className="btn ghost" onClick={onClearSelection} data-testid="button-clear-selection">
                  ניקוי בחירה
                </button>
              </div>
            </div>
          ) : (
            filtered.slice(0, 60).map(i => (
              <div
                key={i.id}
                className="incident-card"
                onClick={() => onSelectIncident(i.id)}
                data-testid={`card-incident-${i.id}`}
              >
                <div className="incident-head">
                  <span className={`sev ${i.severity}`} />
                  <span className="incident-date">{fmtDate(i.date)}</span>
                </div>
                <p className="incident-title">{i.title_he}</p>
                <div className="incident-meta">
                  <span className="tag type" style={{ color: TYPE_COLOR[i.type] }}>{TYPE_LABEL[i.type]}</span>
                  {i.approx && <span className="tag approx">מקורב</span>}
                </div>
              </div>
            ))
          )}
          {!selected && filtered.length === 0 && (
            <p style={{ color: 'var(--text-faint)', fontSize: 12 }}>אין אירועים תואמים את הסינון.</p>
          )}
        </div>
      </div>
    </aside>
  );
};
