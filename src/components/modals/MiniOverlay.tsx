import { fmtKm } from '../../util';

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
}

export function MiniOverlay(props: MiniOverlayProps) {
  if (!props.miniOverlayOpen) return null;

  return (
    <div className="mini-overlay" data-testid="mini-overlay" role="dialog" aria-live="polite" aria-label="חלון מוקטן למצב ניווט">
      <div className="mini-overlay-head">
        <strong>חלון מוקטן — מצב ניווט</strong>
        <button className="mini-close" onClick={props.onClose} data-testid="button-close-mini-overlay" aria-label="סגירת חלון מוקטן">
          ×
        </button>
      </div>
      <div className="mini-route" data-testid="text-mini-route">
        {props.navigationRoute ? `${props.navigationRoute.start.label} ← ${props.navigationRoute.end.label}` : 'אין מסלול פעיל'}
      </div>
      <div className="mini-nav-panel" data-testid="mini-nav-map" aria-label="מפת מיני ניווט" dangerouslySetInnerHTML={{ __html: props.miniNavSvgMarkup() }} />
      <div className="mini-turn" data-testid="mini-turn-instruction">
        <small>הוראת פנייה במסלול</small>
        <b>{props.currentTurnInstruction?.text ?? 'אין הוראת פנייה זמינה'}</b>
      </div>
      <div className="mini-grid">
        <span>
          <small>מרחק</small>
          <b>{props.navigationRoute ? fmtKm(props.navigationRoute.km) : '—'}</b>
        </span>
        <span>
          <small>זמן</small>
          <b>{props.navigationRoute?.durationMin ? `${Math.round(props.navigationRoute.durationMin)} דק׳` : '—'}</b>
        </span>
        <span>
          <small>מיקום חי</small>
          <b>{props.liveLocation ? `${props.liveLocation.lat.toFixed(5)}, ${props.liveLocation.lon.toFixed(5)}` : 'לא פעיל'}</b>
        </span>
        <span>
          <small>הקלטה</small>
          <b>{props.recordedTrack.length ? `${props.recordedTrack.length} נק׳ · ${fmtKm(props.recordedKm)}` : 'לא פעילה'}</b>
        </span>
      </div>
      <p>
        {props.miniStatus === 'mobile'
          ? 'בנייד מוצג מיני־ניווט פנימי כדי למנוע פתיחת חלון חיצוני שעלולה להעביר את הדפדפן לרקע או לסגור את התצוגה.'
          : props.miniStatus === 'fallback'
          ? 'Picture-in-Picture או Popup נחסמו, לכן מוצג חלון צף בתוך האפליקציה.'
          : 'החלון המוקטן מציג תמונת מצב של הניווט וההקלטה.'}{' '}
        דפדפן ווב אינו יכול להבטיח z-order מעל כל האפליקציות בכל מכשיר.
      </p>
    </div>
  );
}
