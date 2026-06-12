import type { SavedRoute } from '../../../types';
import { fmtKm, safeText } from '../../../util';

interface RouteActionsProps {
  navigationRoute: any;
  routeName: string;
  setRouteName: (name: string) => void;
  navStartId: string;
  navEndId: string;
  savedRoutes: SavedRoute[];
  setSavedRoutes: (routes: SavedRoute[]) => void;
  saveCurrentRoute: () => void;
  downloadJson: (name: string, data: any) => void;
  importRoutes: (file: File | undefined) => Promise<void>;
  loadSavedRoute: (route: SavedRoute) => void;
  showToast: (msg: string) => void;
}

export function RouteActions(props: RouteActionsProps) {
  return (
    <>
      <div className="save-route-box">
        <input
          className="search"
          value={props.routeName}
          onChange={e => props.setRouteName(e.target.value)}
          placeholder="שם למסלול לשמירה…"
          data-testid="input-route-name"
        />
        <div className="route-actions">
          <button
            className="btn"
            disabled={!props.navigationRoute}
            onClick={props.saveCurrentRoute}
            data-testid="button-save-route"
          >
            שמור מסלול
          </button>
          <button
            className="btn ghost"
            disabled={!props.navigationRoute}
            onClick={() =>
              props.navigationRoute &&
              props.downloadJson('south-lebanon-route.json', {
                id: `route-${Date.now()}`,
                name: safeText(props.routeName, `${props.navigationRoute.start.label} ← ${props.navigationRoute.end.label}`) || `${props.navigationRoute.start.label} ← ${props.navigationRoute.end.label}`,
                createdAt: new Date().toISOString(),
                startId: props.navStartId || undefined,
                endId: props.navEndId || undefined,
                ...props.navigationRoute,
              })
            }
            data-testid="button-export-route"
          >
            ייצוא קובץ מסלול
          </button>
        </div>
      </div>
      <div className="route-actions">
        <label className="file-import">
          ייבוא קובץ מסלול
          <input
            type="file"
            accept="application/json,.json"
            onChange={e => {
              props.importRoutes(e.target.files?.[0]).catch(() => {});
              e.currentTarget.value = '';
            }}
            data-testid="input-import-route"
          />
        </label>
        <button
          className="btn ghost"
          disabled={props.savedRoutes.length === 0}
          onClick={() => props.downloadJson('south-lebanon-routes-library.json', props.savedRoutes)}
          data-testid="button-export-all-routes"
        >
          ייצוא כל המסלולים
        </button>
      </div>
      {props.savedRoutes.length > 0 && (
        <div className="saved-routes" data-testid="saved-routes">
          {props.savedRoutes.map(route => (
            <div className="saved-route" key={route.id}>
              <button onClick={() => props.loadSavedRoute(route)} data-testid={`button-load-route-${route.id}`}>
                <strong>{route.name}</strong>
                <small>{fmtKm(route.km)}{route.durationMin ? ` · ${Math.round(route.durationMin)} דק׳` : ''}</small>
              </button>
              <button
                className="mini-delete"
                onClick={() => {
                  props.setSavedRoutes(prev => prev.filter(r => r.id !== route.id));
                  props.showToast(`המסלול "${route.name}" נמחק מהרשימה המקומית`);
                }}
                data-testid={`button-delete-route-${route.id}`}
                aria-label={`מחיקת ${route.name}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
