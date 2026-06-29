import React from 'react';
import { fmtKm } from '../util';

export const MiniOverlay: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  navigationRoute: any;
  currentTurnInstruction: any;
  liveLocation: any;
  recordedTrack: [number, number][];
  recordedKm: number;
  miniStatus: 'idle' | 'pip' | 'fallback' | 'popup' | 'mobile';
  miniNavSvgMarkup: () => string;
  currentSpeed?: number | null;
}> = ({
  isOpen,
  onClose,
  navigationRoute,
  currentTurnInstruction,
  liveLocation,
  recordedTrack,
  recordedKm,
  miniStatus,
  miniNavSvgMarkup,
  currentSpeed,
}) => {
  React.useEffect(() => {
    if (liveLocation) {
      console.log(`[MiniOverlay] liveLocation:`, liveLocation);
      console.log(`[MiniOverlay] currentSpeed prop:`, currentSpeed);
      console.log(`[MiniOverlay] liveLocation.speed:`, liveLocation.speed);
    }
  }, [liveLocation, currentSpeed]);
  if (!isOpen) return null;

  return (
    <div className="mini-overlay" data-testid="mini-overlay" role="dialog" aria-live="polite" aria-label="חלון מוקטן למצב ניווט">
      <div className="mini-overlay-head">
        <strong>חלון מוקטן — מצב ניווט</strong>
        <button
          className="mini-close"
          onClick={onClose}
          data-testid="button-close-mini-overlay"
          aria-label="סגירת חלון מוקטן"
        >
          ×
        </button>
      </div>
      <div className="mini-route" data-testid="text-mini-route">
        {navigationRoute ? `${navigationRoute.start.label} ← ${navigationRoute.end.label}` : 'אין מסלול פעיל'}
      </div>
      <div
        className="mini-nav-panel"
        data-testid="mini-nav-map"
        aria-label="מפת מיני ניווט"
        dangerouslySetInnerHTML={{ __html: miniNavSvgMarkup() }}
      />
      <div className="mini-turn" data-testid="mini-turn-instruction">
        <small>הוראת פנייה במסלול</small>
        <b>{currentTurnInstruction?.text ?? 'אין הוראת פנייה זמינה'}</b>
      </div>
      <div className="mini-grid">
        <span>
          <small>מרחק</small>
          <b>{navigationRoute ? fmtKm(navigationRoute.km) : '—'}</b>
        </span>
        <span>
          <small>זמן</small>
          <b>{navigationRoute?.durationMin ? `${Math.round(navigationRoute.durationMin)} דק׳` : '—'}</b>
        </span>
        <span>
          <small>מיקום חי</small>
          <b>{liveLocation ? `${liveLocation.lat.toFixed(5)}, ${liveLocation.lon.toFixed(5)}` : 'לא פעיל'}</b>
        </span>
        <span>
          <small>מהירות</small>
          <b>{currentSpeed !== null && currentSpeed !== undefined ? `${Math.round(currentSpeed)} קמ״ש` : '—'}</b>
        </span>
        <span>
          <small>הקלטה</small>
          <b>{recordedTrack.length ? `${recordedTrack.length} נק׳ · ${fmtKm(recordedKm)}` : 'לא פעילה'}</b>
        </span>
      </div>
      <p>
        {miniStatus === 'mobile'
          ? 'בנייד מוצג מיני־ניווט פנימי כדי למנוע פתיחת חלון חיצוני שעלולה להעביר את הדפדפן לרקע או לסגור את התצוגה.'
          : miniStatus === 'fallback'
          ? 'Picture-in-Picture או Popup נחסמו, לכן מוצג חלון צף בתוך האפליקציה.'
          : 'החלון המוקטן מציג תמונת מצב של הניווט וההקלטה.'}
        {' '}דפדפן ווב אינו יכול להבטיח z-order מעל כל האפליקציות בכל מכשיר.
      </p>
    </div>
  );
};
