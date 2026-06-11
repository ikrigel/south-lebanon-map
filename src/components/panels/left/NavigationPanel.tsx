import type { RouteDisplayMode, SavedRoute, TurnInstruction } from '../../../types';
import { NAV_SCALES, DEFAULT_NAV_SCALE_LABEL } from '../../../constants';
import { fmtKm, safeText } from '../../../util';
import type { RouteOption } from '../../../hooks/useRouteOptions';

interface NavigationPanelProps {
  navStartId: string;
  setNavStartId: (id: string) => void;
  navEndId: string;
  setNavEndId: (id: string) => void;
  navStartQuery: string;
  setNavStartQuery: (q: string) => void;
  navEndQuery: string;
  setNavEndQuery: (q: string) => void;
  navStart: any;
  navEnd: any;
  startMatches: any[];
  endMatches: any[];
  liveLocation: any;
  locationStatus: 'idle' | 'watching' | 'error';
  watchId: number | null;
  navigationRoute: any;
  routeOptions: RouteOption[];
  routeDisplayMode: RouteDisplayMode;
  setRouteDisplayMode: (mode: RouteDisplayMode) => void;
  routeName: string;
  setRouteName: (name: string) => void;
  savedRoutes: SavedRoute[];
  setSavedRoutes: (routes: SavedRoute[]) => void;
  navScaleLabel: string;
  setNavScaleLabel: (label: string) => void;
  activeRouteId: 'drive' | 'foot' | 'aerial';
  setActiveRouteId: (id: 'drive' | 'foot' | 'aerial') => void;
  roadRoute: any;
  footRoute: any;
  navCustomStart: any;
  setNavCustomStart: (start: any) => void;
  navCustomEnd: any;
  setNavCustomEnd: (end: any) => void;
  voiceGuidance: string;
  setVoiceGuidance: (mode: string) => void;
  setVoiceMode: (mode: string) => void;
  voiceLanguage: string;
  setVoiceLanguage: (lang: string) => void;
  voiceStatus: 'idle' | 'speaking' | 'unsupported';
  currentTurnInstruction: TurnInstruction | null;
  navPoints: any[];
  showToast: (msg: string) => void;
  beginLiveLocationWatch: () => void;
  toggleLiveLocation: () => void;
  loadSavedRoute: (route: SavedRoute) => void;
  saveCurrentRoute: () => void;
  importRoutes: (file: File | undefined) => Promise<void>;
  downloadJson: (name: string, data: any) => void;
  openExternalNav: (lat: number, lon: number, label: string, startLat?: number, startLon?: number) => void;
  testVoiceGuidance: () => void;
  setFocusTarget: (target: any) => void;
  liveToastShownRef: React.MutableRefObject<boolean>;
  setLiveFollowDetached: (detached: boolean) => void;
}

export function NavigationPanel(props: NavigationPanelProps) {
  return (
    <div className="panel-section" id="nav-section">
      <h3>ניווט כבישים נקודה לנקודה</h3>
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
        <details className="route-advanced">
          <summary>בחירה מרשימה מלאה</summary>
          <label>
            <span>נקודת מוצא</span>
            <select value={props.navStartId} onChange={e => props.setNavStartId(e.target.value)} data-testid="select-route-start">
              <option value="">בחר נקודת מוצא…</option>
              {['נקודות עניין אישיות', 'יישובים בלבנון', 'יישובי ייחוס בישראל', 'רכסים, הרים, נחלים ונהרות', 'נקודות יוניפי״ל ציבוריות', 'אירועים מדווחים'].map(group => (
                <optgroup key={group} label={group}>
                  {props.navPoints.filter(p => p.group === group).map(p => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          <label>
            <span>יעד</span>
            <select value={props.navEndId} onChange={e => props.setNavEndId(e.target.value)} data-testid="select-route-end">
              <option value="">בחר יעד…</option>
              {['נקודות עניין אישיות', 'יישובים בלבנון', 'יישובי ייחוס בישראל', 'רכסים, הרים, נחלים ונהרות', 'נקודות יוניפי״ל ציבוריות', 'אירועים מדווחים'].map(group => (
                <optgroup key={group} label={group}>
                  {props.navPoints.filter(p => p.group === group).map(p => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
        </details>
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
        {props.routeOptions.length > 0 ? (
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
        )}
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
        <div className="voice-guidance-box" data-testid="voice-guidance-box">
          <div className="voice-guidance-head">
            <strong>הנחיות קוליות</strong>
            <span data-testid="text-voice-status">
              {props.voiceStatus === 'speaking' ? 'משמיע כעת' : props.voiceStatus === 'unsupported' ? 'לא נתמך בדפדפן' : 'מוכן'}
            </span>
          </div>
          <div className="voice-language-grid" role="group" aria-label="בחירת שפת הנחיות קוליות">
            {([['he', 'עברית', 'בדיקה והנחיות בעברית.'], ['en', 'English', 'Test and guidance in English.']] as const).map(([lang, label, desc]) => (
              <button
                key={lang}
                className="voice-language-btn"
                onClick={() => {
                  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                  props.setVoiceLanguage(lang);
                }}
                aria-pressed={props.voiceLanguage === lang}
                data-testid={`button-voice-lang-${lang}`}
              >
                <span>{label}</span>
                <small>{desc}</small>
              </button>
            ))}
          </div>
          <div className="voice-mode-grid" role="group" aria-label="בחירת מצב הנחיות קוליות">
            {([['off', 'ללא קול', 'לא יושמעו הנחיות.'], ['basic', 'בסיסיות', 'הכרזת מסלול ועדכוני מרחק מעטים.'], ['detailed', 'מפורטות', 'מסלול, זמן, מרחק, כיוון ודיוק מיקום.']] as const).map(([mode, label, desc]) => (
              <button
                key={mode}
                className="voice-mode-btn"
                onClick={() => props.setVoiceMode(mode)}
                aria-pressed={props.voiceGuidance === mode}
                data-testid={`button-voice-${mode}`}
              >
                <span>{label}</span>
                <small>{desc}</small>
              </button>
            ))}
          </div>
          <div className="route-actions">
            <button className="btn ghost" disabled={props.voiceGuidance === 'off'} onClick={props.testVoiceGuidance} data-testid="button-voice-test">
              בדיקת קול
            </button>
          </div>
          <div className="turn-instruction-card" data-testid="turn-instruction-card">
            <span>הוראת פנייה במסלול</span>
            <strong data-testid="text-turn-instruction">{props.currentTurnInstruction?.text ?? 'בחר מסלול כדי לקבל הוראת פנייה.'}</strong>
            <small>
              {props.currentTurnInstruction
                ? props.currentTurnInstruction.confidence === 'route'
                  ? 'מבוסס על הוראות OSRM כאשר זמינות, או על מסלול מיובא/שמור.'
                  : 'אומדן לפי קו מוצא ויעד בלבד, ללא פירוט פניות כביש.'
                : 'ההוראה תתעדכן כאשר ייבחר מסלול פעיל.'}
            </small>
          </div>
        </div>
        <div className="save-route-box">
          <input className="search" value={props.routeName} onChange={e => props.setRouteName(e.target.value)} placeholder="שם למסלול לשמירה…" data-testid="input-route-name" />
          <div className="route-actions">
            <button className="btn" disabled={!props.navigationRoute} onClick={props.saveCurrentRoute} data-testid="button-save-route">
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
          <button className="btn ghost" disabled={props.savedRoutes.length === 0} onClick={() => props.downloadJson('south-lebanon-routes-library.json', props.savedRoutes)} data-testid="button-export-all-routes">
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
      </div>
    </div>
  );
}
