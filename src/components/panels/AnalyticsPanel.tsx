import { fmtDate, fmtKm, distanceToPolyline } from '../../util';
import type { Incident } from '../../types';
import { TYPE_COLOR, TYPE_LABEL, SEV_LABEL } from '../../constants';

interface AnalyticsPanelProps {
  stats: any;
  incidents: Incident[];
  filtered: Incident[];
  selected: Incident | null;
  setSelectedId: (id: string | null) => void;
  distanceById: Map<string, any>;
  blueLine: any;
}

export function AnalyticsPanel(props: AnalyticsPanelProps) {
  return (
    <aside className="panel right" data-testid="panel-analytics">
      <div className="panel-scroll">
        <div className="panel-section">
          <h3>סיכום אנליטי</h3>
          <div className="kpi-grid">
            <div className="kpi">
              <div className="kpi-label">אירועים מסוננים</div>
              <div className="kpi-value" data-testid="kpi-total">
                {props.stats.total}
              </div>
              <div className="kpi-sub">מתוך {props.incidents.length} בסה״כ</div>
            </div>
            <div className="kpi">
              <div className="kpi-label">מרחק ממוצע לקו הכחול</div>
              <div className="kpi-value" data-testid="kpi-avg">
                {isFinite(props.stats.avg) ? props.stats.avg.toFixed(1) : '—'}
              </div>
              <div className="kpi-sub">ק״מ · ממוצע</div>
            </div>
            <div className="kpi">
              <div className="kpi-label">מינ׳ מרחק</div>
              <div className="kpi-value">{isFinite(props.stats.min) ? props.stats.min.toFixed(2) : '—'}</div>
              <div className="kpi-sub">ק״מ</div>
            </div>
            <div className="kpi">
              <div className="kpi-label">מקס׳ מרחק</div>
              <div className="kpi-value">{isFinite(props.stats.max) ? props.stats.max.toFixed(1) : '—'}</div>
              <div className="kpi-sub">ק״מ</div>
            </div>
          </div>
        </div>

        <div className="panel-section">
          <h3>פילוח לפי סוג אירוע</h3>
          {props.stats.byType.map(({ type, n }: { type: string; n: number }) => {
            const max = Math.max(1, ...props.stats.byType.map((x: any) => x.n));
            return (
              <div className="bar-row" key={type}>
                <span className="count">{n}</span>
                <span className="bar" aria-hidden="true">
                  <div style={{ width: `${(n / max) * 100}%`, background: TYPE_COLOR[type] }} />
                </span>
                <span className="label">{TYPE_LABEL[type]}</span>
              </div>
            );
          })}
        </div>

        <div className="panel-section">
          <h3>
            <span>{props.selected ? 'אירוע נבחר' : 'רשימת אירועים'}</span>
            <span style={{ color: 'var(--text-faint)', fontSize: 10, textTransform: 'none', letterSpacing: 0 }}>
              {props.filtered.length} אירועים מתאימים
            </span>
          </h3>
          {props.selected ? (
            <div className="incident-card" data-selected="true" data-testid={`detail-${props.selected.id}`}>
              <div className="incident-head">
                <span className={`sev ${props.selected.severity}`} />
                <span className="incident-date">{fmtDate(props.selected.date)}</span>
              </div>
              <p className="incident-title">{props.selected.title_he}</p>
              <p style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--text-muted)', margin: '8px 0' }}>
                {props.selected.desc_he}
              </p>
              <div className="incident-meta">
                <span className="tag type" style={{ color: TYPE_COLOR[props.selected.type], borderColor: TYPE_COLOR[props.selected.type] }}>
                  {TYPE_LABEL[props.selected.type]}
                </span>
                <span className="tag">חומרה: {SEV_LABEL[props.selected.severity]}</span>
                {props.selected.approx && <span className="tag approx">מיקום מקורב</span>}
              </div>
              <div style={{ marginTop: 10, fontSize: 12 }}>
                <div style={{ color: 'var(--text-muted)' }}>מרחק מקו הכחול</div>
                <div
                  style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--accent-hi)', fontSize: 16, marginTop: 2 }}
                  data-testid="text-distance-blue"
                >
                  {fmtKm(
                    props.distanceById.get(props.selected.id)?.km ??
                      distanceToPolyline([props.selected.lat, props.selected.lon], props.blueLine).km
                  )}
                </div>
              </div>
              <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <a className="btn" href={props.selected.source_url} target="_blank" rel="noopener" data-testid="link-source">
                  מקור: {props.selected.source_label} ↗
                </a>
                <button className="btn ghost" onClick={() => props.setSelectedId(null)} data-testid="button-clear-selection">
                  ניקוי בחירה
                </button>
              </div>
            </div>
          ) : (
            props.filtered.slice(0, 60).map(i => (
              <div
                key={i.id}
                className="incident-card"
                onClick={() => props.setSelectedId(i.id)}
                data-testid={`card-incident-${i.id}`}
              >
                <div className="incident-head">
                  <span className={`sev ${i.severity}`} />
                  <span className="incident-date">{fmtDate(i.date)}</span>
                </div>
                <p className="incident-title">{i.title_he}</p>
                <div className="incident-meta">
                  <span className="tag type" style={{ color: TYPE_COLOR[i.type] }}>
                    {TYPE_LABEL[i.type]}
                  </span>
                  {i.approx && <span className="tag approx">מקורב</span>}
                </div>
              </div>
            ))
          )}
          {!props.selected && props.filtered.length === 0 && (
            <p style={{ color: 'var(--text-faint)', fontSize: 12 }}>אין אירועים תואמים את הסינון.</p>
          )}
        </div>
      </div>
    </aside>
  );
}
