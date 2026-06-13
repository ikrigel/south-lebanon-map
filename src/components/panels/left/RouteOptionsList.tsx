import { fmtKm } from '../../../util';
import type { RouteOption } from '../../../types';

interface RouteOptionsListProps {
  routeOptions: RouteOption[];
  activeRouteId: 'drive' | 'foot' | 'aerial';
  setActiveRouteId: (id: 'drive' | 'foot' | 'aerial') => void;
}

export function RouteOptionsList(props: RouteOptionsListProps) {
  return props.routeOptions.length > 0 ? (
    <div className="route-options-list" data-testid="route-options-list">
      {props.routeOptions.map(opt => (
        <div
          key={opt.id}
          className={`route-option-card${props.activeRouteId === opt.id ? ' active' : ''}`}
          style={{ '--route-color': opt.color } as React.CSSProperties}
          onClick={() => props.setActiveRouteId(opt.id)}
          data-testid={`route-option-card-${opt.id}`}
          role="button"
          aria-pressed={props.activeRouteId === opt.id}
        >
          <div className="route-option-header">
            <span className="route-option-name">{opt.labelHe}</span>
            {opt.status === 'loading' && <span className="route-option-badge loading">מחשב…</span>}
            {opt.status === 'error' && <span className="route-option-badge error">שגיאה</span>}
          </div>
          <div className="route-option-km">
            <strong>{fmtKm(opt.km)}</strong>
            {opt.durationMin != null && <span> · {Math.round(opt.durationMin)} דק׳</span>}
          </div>
          <div className="route-option-tags">
            <span className="route-option-tag passability">{opt.passabilityHe}</span>
            <span className="route-option-tag airspace">{opt.airspaceHe}</span>
          </div>
        </div>
      ))}
    </div>
  ) : (
    <div className="route-summary" data-testid="text-route-summary">
      <span>בחר שתי נקודות שונות כדי להציג מסלולים אפשריים.</span>
    </div>
  );
}
