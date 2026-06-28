import { useState, useMemo } from 'react';
import { fmtKm } from '../../util';
import { useSunTimes } from '../../hooks/useSunTimes';
import { useBearingInfo } from '../../hooks/useBearingInfo';
import { useMiniWindowPreferences } from '../../hooks/useMiniWindowPreferences';
import type { MiniWindowTileId } from '../../types';

interface MiniOverlayProps {
  miniOverlayOpen: boolean;
  onClose: () => void;
  navigationRoute: any;
  currentTurnInstruction: any;
  liveLocation: any;
  recordedTrack: any[];
  recordedKm: number;
  miniStatus: string;
  miniNavSvgMarkup: () => string;
  mapBearing?: number;
  startTime?: number;
  currentSpeed?: number;
}

export function MiniOverlay(props: MiniOverlayProps) {
  const [showSettings, setShowSettings] = useState(false);
  const { prefs, toggleTile, getEnabledTiles } = useMiniWindowPreferences();

  // Calculate bearing to target
  const bearingInfo = useBearingInfo(
    props.liveLocation?.lat ?? null,
    props.liveLocation?.lon ?? null,
    props.navigationRoute?.end.lat ?? null,
    props.navigationRoute?.end.lon ?? null,
    props.mapBearing ?? 0,
  );

  // Get sun times
  const sunTimes = useSunTimes(props.liveLocation?.lat ?? null, props.liveLocation?.lon ?? null);

  // Calculate elapsed time
  const elapsedMs = props.startTime ? Date.now() - props.startTime : 0;
  const elapsedMin = Math.floor(elapsedMs / 60000);

  // Calculate remaining distance dynamically
  const remainingDistance = useMemo(() => {
    if (!props.navigationRoute?.path || !props.liveLocation) return props.navigationRoute?.km || 0;

    let minDist = Infinity;
    let closestIdx = 0;

    for (let i = 0; i < props.navigationRoute.path.length; i++) {
      const [lat, lon] = props.navigationRoute.path[i];
      const dx = lat - props.liveLocation.lat;
      const dy = lon - props.liveLocation.lon;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) {
        minDist = dist;
        closestIdx = i;
      }
    }

    let remaining = 0;
    for (let i = closestIdx; i < props.navigationRoute.path.length - 1; i++) {
      const [lat1, lon1] = props.navigationRoute.path[i];
      const [lat2, lon2] = props.navigationRoute.path[i + 1];
      const dx = lat2 - lat1;
      const dy = lon2 - lon1;
      remaining += Math.sqrt(dx * dx + dy * dy) * 111; // Rough km conversion
    }
    return remaining;
  }, [props.navigationRoute, props.liveLocation]);

  const remainingTime = useMemo(() => {
    if (!props.navigationRoute || !props.currentSpeed || props.currentSpeed === 0)
      return props.navigationRoute?.durationMin || 0;
    return Math.round((remainingDistance / props.currentSpeed) * 60);
  }, [remainingDistance, props.currentSpeed, props.navigationRoute]);

  const eta = useMemo(() => {
    if (!props.navigationRoute) return null;
    const etaMs = Date.now() + remainingTime * 60000;
    return new Date(etaMs).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  }, [remainingTime, props.navigationRoute]);

  if (!props.miniOverlayOpen) return null;

  const enabledTiles = getEnabledTiles();

  const renderTile = (tileId: MiniWindowTileId) => {
    const baseProps = { className: 'mini-tile' };

    switch (tileId) {
      case 'distance':
        return (
          <span {...baseProps}>
            <small>מרחק</small>
            <b>{props.navigationRoute ? fmtKm(remainingDistance) : '—'}</b>
          </span>
        );
      case 'time':
        return (
          <span {...baseProps}>
            <small>זמן</small>
            <b>{props.navigationRoute ? `${remainingTime} דק׳` : '—'}</b>
          </span>
        );
      case 'location':
        return (
          <span {...baseProps}>
            <small>מיקום חי</small>
            <b>
              {props.liveLocation
                ? `${props.liveLocation.lat.toFixed(5)}, ${props.liveLocation.lon.toFixed(5)}`
                : 'לא פעיל'}
            </b>
          </span>
        );
      case 'recording':
        return (
          <span {...baseProps}>
            <small>הקלטה</small>
            <b>
              {props.recordedTrack.length
                ? `${props.recordedTrack.length} נק׳ · ${fmtKm(props.recordedKm)}`
                : 'לא פעילה'}
            </b>
          </span>
        );
      case 'bearing-target':
        return (
          <span {...baseProps}>
            <small>כיוון יעד</small>
            <b>{bearingInfo ? `${bearingInfo.toBearing}° ${bearingInfo.direction}` : '—'}</b>
          </span>
        );
      case 'bearing-current':
        return (
          <span {...baseProps}>
            <small>כיוון נוכחי</small>
            <b>{props.mapBearing ? `${Math.round(props.mapBearing)}°` : '—'}</b>
          </span>
        );
      case 'sunrise':
        return (
          <span {...baseProps}>
            <small>🌅 זריחה</small>
            <b>{sunTimes ? sunTimes.sunrise.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) : '—'}</b>
          </span>
        );
      case 'sunset':
        return (
          <span {...baseProps}>
            <small>🌆 שקיעה</small>
            <b>{sunTimes ? sunTimes.sunset.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) : '—'}</b>
          </span>
        );
      case 'elapsed-time':
        return (
          <span {...baseProps}>
            <small>⏳ זמן שחלף</small>
            <b>{`${elapsedMin} דק׳`}</b>
          </span>
        );
      case 'speed':
        return (
          <span {...baseProps}>
            <small>⚡ מהירות</small>
            <b>{props.currentSpeed ? `${Math.round(props.currentSpeed * 3.6)} קמ״ש` : '—'}</b>
          </span>
        );
      case 'eta':
        return (
          <span {...baseProps}>
            <small>🎯 הגעה משוער</small>
            <b>{eta || '—'}</b>
          </span>
        );
      case 'waypoint-distance':
        return (
          <span {...baseProps}>
            <small>🚩 מרחק לתחנה</small>
            <b>{'—'}</b>
          </span>
        );
      case 'grid-coords':
        return (
          <span {...baseProps}>
            <small>📊 קואורדינטות</small>
            <b>
              {props.liveLocation ? `${Math.round(props.liveLocation.lat)}, ${Math.round(props.liveLocation.lon)}` : '—'}
            </b>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`mini-overlay ${prefs.rotateToHeading ? 'rotate-enabled' : ''}`}
      style={{ transform: prefs.rotateToHeading ? `rotate(${props.mapBearing || 0}deg)` : 'none' }}
      data-testid="mini-overlay"
      role="dialog"
      aria-live="polite"
      aria-label="חלון מוקטן למצב ניווט"
    >
      <div className="mini-overlay-head">
        <strong>חלון מוקטן — ניווט</strong>
        <div className="mini-head-actions">
          <button
            className="mini-settings-btn"
            onClick={() => setShowSettings(!showSettings)}
            title="הגדרות"
            aria-label="הגדרות חלון מוקטן"
          >
            ⚙️
          </button>
          <button
            className="mini-close"
            onClick={props.onClose}
            data-testid="button-close-mini-overlay"
            aria-label="סגירת חלון מוקטן"
          >
            ×
          </button>
        </div>
      </div>

      {showSettings ? (
        <div className="mini-settings-panel">
          <h4>הגדרות תוויות</h4>
          <div className="mini-tile-list">
            {prefs.tiles.map(tile => (
              <label key={tile.id} className="mini-tile-toggle">
                <input type="checkbox" checked={tile.enabled} onChange={() => toggleTile(tile.id as MiniWindowTileId)} />
                <span>
                  {tile.icon} {tile.labelHe}
                  <em>({tile.category})</em>
                </span>
              </label>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="mini-route" data-testid="text-mini-route">
            {props.navigationRoute
              ? `${props.navigationRoute.start.label} ← ${props.navigationRoute.end.label}`
              : 'אין מסלול פעיל'}
          </div>
          <div
            className="mini-nav-panel"
            data-testid="mini-nav-map"
            aria-label="מפת מיני ניווט"
            dangerouslySetInnerHTML={{ __html: props.miniNavSvgMarkup() }}
          />
          <div className="mini-turn" data-testid="mini-turn-instruction">
            <small>הוראת פנייה במסלול</small>
            <b>{props.currentTurnInstruction?.text ?? 'אין הוראת פנייה זמינה'}</b>
          </div>
          <div className={`mini-grid ${prefs.compactMode ? 'compact' : ''}`}>
            {enabledTiles.map(tile => renderTile(tile.id as MiniWindowTileId))}
          </div>
        </>
      )}

      <p className="mini-info-text">
        {props.miniStatus === 'mobile'
          ? 'בנייד מוצג מיני־ניווט פנימי כדי למנוע פתיחת חלון חיצוני.'
          : props.miniStatus === 'fallback'
          ? 'Picture-in-Picture או Popup נחסמו, לכן מוצג חלון צף בתוך האפליקציה.'
          : 'החלון המוקטן מציג תמונת מצב של הניווט עם תוויות ניתנות להתאמה אישית.'}
      </p>
    </div>
  );
}
