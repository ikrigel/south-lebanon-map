import { fmtKm } from '../../util';
import { SNAP_ANGLES, SNAP_LABELS } from '../../constants';

interface MapOverlaysProps {
  compassMode: boolean;
  setCompassMode: (mode: boolean) => void;
  mapBearing: number;
  userMapRotation: number;
  rotationLocked: boolean;
  toggleRotationLock: () => void;
  snapPickerOpen: boolean;
  setSnapPickerOpen: (open: boolean) => void;
  handleSnapRotation: (deg: number) => void;
  resetMapRotation: () => void;
  panelsCollapsed: boolean;
  handlePanelToggle: () => void;
  liveLocation: any;
  liveFollowDetached: boolean;
  centerLiveLocation: () => void;
  openMiniWindow: () => Promise<void>;
  setMiniOverlayOpen: (open: boolean) => void;
  measureMode: boolean;
  manualMeasure: [number, number][];
  manualKm: number | null;
}

export function MapOverlays(props: MapOverlaysProps) {
  return (
    <div className="map-overlays">
      <button
        className="compass-button"
        onClick={() => props.setCompassMode(!props.compassMode)}
        aria-pressed={props.compassMode}
        data-testid="button-compass"
        title={props.compassMode ? 'חזרה לצפון למעלה' : 'סובב לפי כיוון הנסיעה'}
      >
        <span className="compass-needle" style={{ transform: `rotate(${props.mapBearing + props.userMapRotation}deg)` }}>
          ▲
        </span>
        <span>{props.compassMode ? 'כיוון נסיעה' : 'צפון'}</span>
        <small>אזימוט {Math.round(props.mapBearing)}°</small>
      </button>
      {props.userMapRotation !== 0 && (
        <button
          className="compass-button reset-north-btn"
          onClick={props.resetMapRotation}
          data-testid="button-reset-north"
          title={`הצפן מחדש (סבב ${Math.round(props.userMapRotation)}°)`}
        >
          <span className="compass-needle" style={{ transform: `rotate(${props.userMapRotation}deg)`, color: 'var(--accent-warm, #f6c453)' }}>
            ▲
          </span>
          <span>הצפן</span>
          <small>{Math.round(props.userMapRotation)}° מסובב</small>
        </button>
      )}
      <button
        className={`rotation-lock-btn${props.rotationLocked ? ' active' : ''}`}
        onClick={props.toggleRotationLock}
        aria-pressed={props.rotationLocked}
        data-testid="button-rotation-lock"
        title={props.rotationLocked ? 'בטל נעילת סיבוב' : 'נעל סיבוב — סיבוב חופשי באצבעות מבוטל'}
      >
        <span className="lock-icon">{props.rotationLocked ? '🔒' : '🔓'}</span>
        <span>{props.rotationLocked ? 'נעול' : 'חופשי'}</span>
        <small>סיבוב</small>
      </button>
      {props.snapPickerOpen && (
        <div className="snap-rotation-picker" data-testid="snap-rotation-picker">
          <div className="snap-picker-title">בחר זוית סיבוב</div>
          <div className="snap-picker-grid">
            {SNAP_ANGLES.map(deg => (
              <button
                key={deg}
                className={`snap-angle-btn${props.userMapRotation === deg ? ' selected' : ''}`}
                onClick={() => props.handleSnapRotation(deg)}
                title={`סבב ${deg}°`}
              >
                <span style={{ display: 'inline-block', transform: `rotate(${deg}deg)` }}>↑</span>
                <span>{SNAP_LABELS[deg]}</span>
              </button>
            ))}
          </div>
          <button className="snap-picker-close" onClick={() => props.setSnapPickerOpen(false)}>
            סגור
          </button>
        </div>
      )}
      <button className="map-menu-fab" onClick={props.handlePanelToggle} aria-pressed={!props.panelsCollapsed} data-testid="button-map-toggle-menu">
        {props.panelsCollapsed ? 'פתח תפריט' : 'סגור תפריט'}
      </button>
      {props.panelsCollapsed && (
        <button
          className="mini-map-fab"
          onClick={() => props.openMiniWindow().catch(() => props.setMiniOverlayOpen(true))}
          data-testid="button-map-mini-window"
        >
          חלון מוקטן
        </button>
      )}
      {props.liveLocation && props.liveFollowDetached && (
        <button
          className={`center-live-fab ${props.panelsCollapsed ? 'below-mini' : ''}`}
          onClick={props.centerLiveLocation}
          data-testid="button-center-live"
          title="מרכז את המפה חזרה למיקום המכשיר"
        >
          מרכז אותי
          <small>חזרה לסמן</small>
        </button>
      )}
      {props.measureMode && (
        <div className="measure-hud" data-testid="hud-measure">
          <div className="row">
            <span>מצב מדידה ידנית</span>
          </div>
          <div className="row">
            <span>נקודות שנבחרו</span>
            <span className="km">{props.manualMeasure.length} / 2</span>
          </div>
          {props.manualKm !== null && (
            <div className="row">
              <span>מרחק (Haversine)</span>
              <span className="km" data-testid="text-manual-distance">
                {fmtKm(props.manualKm)}
              </span>
            </div>
          )}
          <div className="hint">לחיצה ראשונה — נקודה א׳, שנייה — נקודה ב׳. לחיצה שלישית מאפסת.</div>
        </div>
      )}
    </div>
  );
}
