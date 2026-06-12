import { fmtKm } from '../../../util';
import { DIFFICULTY_LABELS, PASSABILITY_LABELS } from '../../../constants';
import type { MultiPointRoute } from '../../../types';

interface SavedMultiRoutesListProps {
  savedMultiRoutes: MultiPointRoute[];
  activeMultiRoute: MultiPointRoute | null;
  setSavedMultiRoutes: (routes: MultiPointRoute[]) => void;
  setActiveMultiRoute: (route: MultiPointRoute | null) => void;
  loadMultiRoute: (route: MultiPointRoute) => void;
  exportMultiRoute: (route: MultiPointRoute) => void;
  showToast: (msg: string) => void;
}

export function SavedMultiRoutesList(props: SavedMultiRoutesListProps) {
  if (props.savedMultiRoutes.length === 0) return null;

  return (
    <div className="saved-routes" data-testid="saved-multi-routes">
      {props.savedMultiRoutes.map(route => (
        <div className="saved-route" key={route.id}>
          <button
            onClick={() => props.loadMultiRoute(route)}
            data-testid={`button-load-multi-route-${route.id}`}
          >
            <strong>{route.name}</strong>
            <small>
              {route.points.length} נק׳ · {fmtKm(route.totalKm)} · {DIFFICULTY_LABELS[route.difficulty]} · {PASSABILITY_LABELS[route.passability]}
            </small>
          </button>
          <button
            className="btn ghost"
            onClick={() => props.exportMultiRoute(route)}
            style={{ fontSize: 11, padding: '3px 8px', marginInlineEnd: 4 }}
            title="ייצוא לקובץ"
            data-testid={`button-export-multi-route-${route.id}`}
          >
            ייצוא
          </button>
          <button
            className="mini-delete"
            onClick={() => {
              props.setSavedMultiRoutes(props.savedMultiRoutes.filter(r => r.id !== route.id));
              if (props.activeMultiRoute?.id === route.id) props.setActiveMultiRoute(null);
              props.showToast(`המסלול "${route.name}" נמחק`);
            }}
            data-testid={`button-delete-multi-route-${route.id}`}
            aria-label={`מחיקת ${route.name}`}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
