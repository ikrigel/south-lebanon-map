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
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const { prefs, toggleTile, setFontSize, getEnabledTiles, moveTile, resetToDefault } = useMiniWindowPreferences();

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
    if (!props.navigationRoute) return 0;

    // If we have current speed and it's realistic (> 0.5 km/h), use it for calculation
    // Speed is now provided in km/h (calculated from GPS position deltas)
    if (props.currentSpeed && props.currentSpeed > 0.5) {
      // Speed is in km/h, distance is in km, result should be in minutes
      const speedKmPerMin = props.currentSpeed / 60;
      return Math.round(remainingDistance / speedKmPerMin);
    }

    // Fallback to estimated speed based on route type
    // For driving routes: assume 60 km/h average (accounting for traffic, turns, etc.)
    // For foot routes: assume 5 km/h
    // For aerial routes: assume 100 km/h
    let estimatedSpeedKmh = 60; // default for road routes

    if (props.navigationRoute.id === 'foot') {
      estimatedSpeedKmh = 5;
    } else if (props.navigationRoute.id === 'aerial') {
      estimatedSpeedKmh = 100;
    }

    // Convert estimated speed from km/h to km/min, then calculate time
    const estimatedSpeedKmMin = estimatedSpeedKmh / 60;
    return Math.round(remainingDistance / estimatedSpeedKmMin);
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
        const formatTime = (minutes: number) => {
          const totalSeconds = Math.round(minutes * 60);
          const hours = Math.floor(totalSeconds / 3600);
          const mins = Math.floor((totalSeconds % 3600) / 60);
          const secs = totalSeconds % 60;
          if (hours > 0) {
            return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
          } else {
            return `${mins}:${secs.toString().padStart(2, '0')}`;
          }
        };
        return (
          <span {...baseProps}>
            <small>זמן</small>
            <b>{props.navigationRoute ? formatTime(remainingTime) : '—'}</b>
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
        // Speed is provided in km/h (calculated from GPS position deltas)
        const speedInKmh = props.currentSpeed ? Math.round(props.currentSpeed) : null;
        if (props.currentSpeed !== undefined && props.currentSpeed !== null) {
          console.log(`[MiniOverlay] Speed: ${props.currentSpeed} km/h (calculated from GPS)`);
        }
        return (
          <span {...baseProps}>
            <small>⚡ מהירות</small>
            <b>{speedInKmh ? `${speedInKmh} קמ״ש` : '—'}</b>
          </span>
        );
      case 'eta':
        return (
          <span {...baseProps}>
            <small>🎯 הגעה משוער</small>
            <b>{eta || '—'}</b>
          </span>
        );
      case 'grid-coords':
        const targetLat = props.navigationRoute?.end?.lat ?? props.liveLocation?.lat;
        const targetLon = props.navigationRoute?.end?.lon ?? props.liveLocation?.lon;
        return (
          <span {...baseProps}>
            <small>📊 קואורדינטות</small>
            <b>
              {targetLat && targetLon ? `${targetLat.toFixed(5)}, ${targetLon.toFixed(5)}` : '—'}
            </b>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="mini-overlay"
      style={{ transform: 'none' }}
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
          <div className="mini-settings-header">
            <h4>הגדרות תוויות</h4>
            <button
              className="mini-reset-btn"
              onClick={resetToDefault}
              title="איפוס לברירת המחדל"
              aria-label="איפוס סדר תוויות לברירת המחדל"
            >
              🔄 איפוס
            </button>
          </div>
          <div className="mini-tile-list">
            {prefs.tiles.map((tile, idx) => (
              <div
                key={tile.id}
                className={`mini-tile-item ${draggedIndex === idx ? 'dragging' : ''}`}
                draggable
                onDragStart={() => setDraggedIndex(idx)}
                onDragOver={(e) => e.preventDefault()}
                onDragEnter={(e) => e.preventDefault()}
                onDrop={() => {
                  if (draggedIndex !== null && draggedIndex !== idx) {
                    moveTile(draggedIndex, idx);
                    setDraggedIndex(null);
                  }
                }}
                onDragEnd={() => setDraggedIndex(null)}
              >
                <div className="mini-drag-handle">⋮⋮</div>
                <label className="mini-tile-toggle">
                  <input
                    type="checkbox"
                    checked={tile.enabled}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleTile(tile.id as MiniWindowTileId);
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                  />
                  <span>
                    {tile.icon} {tile.labelHe}
                    <em>({tile.category})</em>
                  </span>
                </label>
              </div>
            ))}
          </div>

          <div className="mini-font-size-section">
            <h4>גודל גופן</h4>
            <div className="mini-font-size-buttons">
              <button
                className={`mini-font-btn ${prefs.fontSize === 'small' ? 'active' : ''}`}
                onClick={() => setFontSize('small')}
                title="קטן"
              >
                S
              </button>
              <button
                className={`mini-font-btn ${prefs.fontSize === 'medium' ? 'active' : ''}`}
                onClick={() => setFontSize('medium')}
                title="בינוני"
              >
                M
              </button>
              <button
                className={`mini-font-btn ${prefs.fontSize === 'large' ? 'active' : ''}`}
                onClick={() => setFontSize('large')}
                title="גדול"
              >
                L
              </button>
              <button
                className={`mini-font-btn ${prefs.fontSize === 'xlarge' ? 'active' : ''}`}
                onClick={() => setFontSize('xlarge')}
                title="גדול מאד"
              >
                XL
              </button>
              <button
                className={`mini-font-btn ${prefs.fontSize === 'xxlarge' ? 'active' : ''}`}
                onClick={() => setFontSize('xxlarge')}
                title="גדול במאד מאד"
              >
                XXL
              </button>
            </div>
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
          <div className={`mini-grid ${prefs.compactMode ? 'compact' : ''} font-${prefs.fontSize}`}>
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
