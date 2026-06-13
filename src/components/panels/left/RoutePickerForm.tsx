import type { RouteDisplayMode, RouteOption } from '../../../types';
import { NAV_SCALES } from '../../../constants';
import { fmtKm } from '../../../util';
import { RoutePickerAdvanced } from './RoutePickerAdvanced';
import { RouteOptionsList } from './RouteOptionsList';

interface RoutePickerFormProps {
  navStartQuery: string;
  setNavStartQuery: (q: string) => void;
  navStart: any;
  navStartId: string;
  setNavStartId: (id: string) => void;
  startMatches: any[];
  locationStatus: 'idle' | 'watching' | 'error';
  liveLocation: any;
  watchId: number | null;
  beginLiveLocationWatch: () => void;
  setLiveFollowDetached: (detached: boolean) => void;
  liveToastShownRef: React.MutableRefObject<boolean>;
  showToast: (msg: string) => void;
  navEndQuery: string;
  setNavEndQuery: (q: string) => void;
  navEnd: any;
  navEndId: string;
  setNavEndId: (id: string) => void;
  endMatches: any[];
  navPoints: any[];
  navigationRoute: any;
  setFocusTarget: (target: any) => void;
  toggleLiveLocation: () => void;
  navScaleLabel: string;
  setNavScaleLabel: (label: string) => void;
  setNavCustomStart: (start: any) => void;
  setNavCustomEnd: (end: any) => void;
  routeDisplayMode: RouteDisplayMode;
  setRouteDisplayMode: (mode: RouteDisplayMode) => void;
  routeOptions: RouteOption[];
  activeRouteId: 'drive' | 'foot' | 'aerial';
  setActiveRouteId: (id: 'drive' | 'foot' | 'aerial') => void;
  openExternalNav: (lat: number, lon: number, label: string, startLat?: number, startLon?: number) => void;
}

export function RoutePickerForm(props: RoutePickerFormProps) {
  return (
    <div className="route-form" data-testid="route-form">
      <div className="route-picker-grid">
        <div className="route-picker">
          <label>
            <span>חפש נקודת מוצא</span>
            <div className="route-start-row">
              <input
                className="search"
                value={props.navStartQuery}
                onChange={e => props.setNavStartQuery(e.target.value)}
                placeholder={props.navStart ? props.navStart.label : 'לדוגמה: נאקורה, מטולה, צור…'}
                data-testid="input-route-start-search"
              />
              <button
                className={`btn use-my-location-btn${props.locationStatus === 'watching' && props.liveLocation ? ' active' : ''}`}
                onClick={() => {
                  props.setNavStartId('live-location');
                  props.setNavStartQuery('מיקום נוכחי (GPS)');
                  if (props.liveLocation) {
                    props.showToast('נקודת מוצא: מיקום נוכחי');
                  } else {
                    props.showToast('מפעיל GPS — מיקום יוגדר כנקודת מוצא');
                    if (props.watchId === null) {
                      props.setLiveFollowDetached(false);
                      props.liveToastShownRef.current = true;
                      props.beginLiveLocationWatch();
                    }
                  }
                }}
                title="השתמש במיקום הנוכחי כנקודת מוצא"
                data-testid="button-use-my-location"
              >
                📍 ממיקומי
              </button>
            </div>
          </label>
          <div className="route-pick-results" data-testid="route-start-results">
            {props.startMatches.map(p => (
              <button
                key={`start-${p.id}`}
                className="route-pick"
                data-active={props.navStartId === p.id}
                onClick={() => {
                  props.setNavStartId(p.id);
                  props.setNavStartQuery(p.label);
                }}
                data-testid={`button-route-start-${p.id}`}
              >
                <span>{p.label}</span>
                <small>{p.group}</small>
              </button>
            ))}
          </div>
        </div>
        <div className="route-picker">
          <label>
            <span>חפש יעד</span>
            <input
              className="search"
              value={props.navEndQuery}
              onChange={e => props.setNavEndQuery(e.target.value)}
              placeholder={props.navEnd ? props.navEnd.label : 'לדוגמה: צור, קריית שמונה, יוניפי״ל…'}
              data-testid="input-route-end-search"
            />
          </label>
          <div className="route-pick-results" data-testid="route-end-results">
            {props.endMatches.map(p => (
              <button
                key={`end-${p.id}`}
                className="route-pick"
                data-active={props.navEndId === p.id}
                onClick={() => {
                  props.setNavEndId(p.id);
                  props.setNavEndQuery(p.label);
                }}
                data-testid={`button-route-end-${p.id}`}
              >
                <span>{p.label}</span>
                <small>{p.group}</small>
              </button>
            ))}
          </div>
        </div>
      </div>
      <RoutePickerAdvanced
        navStartId={props.navStartId}
        setNavStartId={props.setNavStartId}
        navEndId={props.navEndId}
        setNavEndId={props.setNavEndId}
        navPoints={props.navPoints}
      />
      <div className="route-actions">
        <button
          className="btn"
          disabled={!props.navStart || !props.navEnd || props.navStart.id === props.navEnd.id}
          onClick={() => {
            if (!props.navigationRoute) return;
            props.setFocusTarget({
              lat: (props.navigationRoute.start.lat + props.navigationRoute.end.lat) / 2,
              lon: (props.navigationRoute.start.lon + props.navigationRoute.end.lon) / 2,
              zoom: 11,
              id: `route-${Date.now()}`,
            });
            props.showToast('המפה מוקדה למסלול הכבישים');
          }}
          data-testid="button-route-focus"
        >
          הצג מסלול כבישים
        </button>
        <button className="btn" onClick={props.toggleLiveLocation} aria-pressed={props.locationStatus === 'watching'} data-testid="button-live-location">
          {props.locationStatus === 'watching' ? 'כבה מיקום חי' : 'הצג מיקום מכשיר'}
        </button>
        <div className="nav-scale-row" data-testid="nav-scale-selector">
          <span className="nav-scale-label">זום ניווט:</span>
          {NAV_SCALES.map(s => (
            <button
              key={s.label}
              className={`btn nav-scale-btn${props.navScaleLabel === s.label ? ' active' : ''}`}
              onClick={() => {
                props.setNavScaleLabel(s.label);
                props.showToast(`זום ניווט: ${s.label}`);
              }}
              title={`סולם ${s.label} — תקריב zoom ${s.zoom}`}
              data-testid={`button-nav-scale-${s.label.replace(':', '-')}`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <button
          className="btn ghost"
          onClick={() => {
            props.setNavStartId('');
            props.setNavEndId('');
            props.setNavStartQuery('');
            props.setNavEndQuery('');
            props.setNavCustomStart(null);
            props.setNavCustomEnd(null);
            props.showToast('בחירת המסלול אופסה');
          }}
          data-testid="button-route-clear"
        >
          איפוס
        </button>
      </div>
      {props.navStart && props.navEnd && props.navStart.id !== props.navEnd.id && (
        <div className="route-display-mode-row" data-testid="route-display-mode-row">
          <span className="nav-scale-label">תצוגה:</span>
          {(['road', 'aerial', 'both'] as RouteDisplayMode[]).map(mode => {
            const labels: Record<RouteDisplayMode, string> = { road: '🛣 כביש', aerial: '✈ אווירי', both: '⊕ שניהם' };
            return (
              <button
                key={mode}
                className={`btn nav-scale-btn${props.routeDisplayMode === mode ? ' active' : ''}`}
                onClick={() => props.setRouteDisplayMode(mode)}
                data-testid={`button-display-mode-${mode}`}
              >
                {labels[mode]}
              </button>
            );
          })}
        </div>
      )}
      <RouteOptionsList
        routeOptions={props.routeOptions}
        activeRouteId={props.activeRouteId}
        setActiveRouteId={props.setActiveRouteId}
      />
      {props.navEnd && (
        <div className="launch-nav-box" data-testid="launch-nav-box">
          <button
            className="btn launch-nav-btn"
            onClick={() => props.openExternalNav(props.navEnd.lat, props.navEnd.lon, props.navEnd.label, props.navStart?.lat ?? props.liveLocation?.lat, props.navStart?.lon ?? props.liveLocation?.lon)}
            data-testid="button-launch-external-nav"
          >
            ▶ נווט עכשיו — פתח Waze / Google Maps
          </button>
          <p className="legend-note launch-nav-note">
            {props.liveLocation
              ? `מנווט ממיקומך (${props.liveLocation.lat.toFixed(4)}, ${props.liveLocation.lon.toFixed(4)}) אל ${props.navEnd.label}`
              : props.navStart
                ? `מנווט מ${props.navStart.label} אל ${props.navEnd.label}`
                : `ינווט מהמיקום הנוכחי לפי אפליקציית הניווט אל ${props.navEnd.label}`}
          </p>
        </div>
      )}
      {props.locationStatus !== 'idle' && (
        <div className="route-summary compact" data-testid="text-location-status">
          {props.locationStatus === 'watching' && props.liveLocation && (
            <span>מיקום חי פעיל · המפה עוקבת אחרי הסמן בזום קרוב · אחרי גרירה יופיע כפתור "מרכז אותי" · דיוק משוער: {Math.round(props.liveLocation.accuracy ?? 0)} מ׳</span>
          )}
          {props.locationStatus === 'watching' && !props.liveLocation && <span>ממתין להרשאת מיקום מהמכשיר…</span>}
          {props.locationStatus === 'error' && <span>לא ניתן לקרוא את מיקום המכשיר. בדוק הרשאות דפדפן או שהדפדפן אינו תומך במיקום חי.</span>}
        </div>
      )}
    </div>
  );
}
