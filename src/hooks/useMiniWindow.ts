import { useEffect } from 'react';
import { isMobileLikeDevice } from '../navigation/externalNav';
import { fmtKm } from '../util';
import { miniEscape } from '../storage/storage';

interface UseMiniWindowDeps {
  navigationRoute: any;
  liveLocation: any;
  recordedTrack: any[];
  recordedKm: number;
  currentTurnInstruction: any;
  miniExternalWindowRef: React.MutableRefObject<Window | null>;
  setMiniOverlayOpen: (v: boolean) => void;
  setMiniStatus: (s: 'idle' | 'pip' | 'fallback' | 'popup' | 'mobile') => void;
  mapBearing: number;
}

export const useMiniWindow = (deps: UseMiniWindowDeps) => {
  const miniNavSvgMarkup = () => {
    const routePoints = deps.navigationRoute?.path && deps.navigationRoute.path.length >= 2
      ? deps.navigationRoute.path
      : deps.navigationRoute
        ? [
            [deps.navigationRoute.start.lat, deps.navigationRoute.start.lon],
            [deps.navigationRoute.end.lat, deps.navigationRoute.end.lon],
          ] as [number, number][]
        : deps.recordedTrack.length >= 2
          ? deps.recordedTrack
          : [];
    const livePoint: [number, number] | null = deps.liveLocation ? [deps.liveLocation.lat, deps.liveLocation.lon] : null;
    const allPoints = livePoint ? [...routePoints, livePoint] : routePoints;

    if (allPoints.length < 2) {
      return `<svg class="mini-nav-svg" viewBox="0 0 320 132" role="img" aria-label="אין מסלול להצגה">
        <rect x="1" y="1" width="318" height="130" rx="18" class="mini-nav-bg" />
        <path d="M34 92 C82 50 126 78 172 44 S252 42 286 76" class="mini-nav-placeholder" />
        <circle cx="34" cy="92" r="5" class="mini-nav-muted-dot" />
        <circle cx="286" cy="76" r="5" class="mini-nav-muted-dot" />
        <text x="160" y="69" text-anchor="middle" class="mini-nav-empty">בחר מסלול או התחל הקלטה</text>
      </svg>`;
    }

    const width = 320;
    const height = 132;
    const pad = 18;
    const lats = allPoints.map(p => p[0]);
    const lons = allPoints.map(p => p[1]);
    let minLat = Math.min(...lats);
    let maxLat = Math.max(...lats);
    let minLon = Math.min(...lons);
    let maxLon = Math.max(...lons);
    if (Math.abs(maxLat - minLat) < 0.01) {
      minLat -= 0.005;
      maxLat += 0.005;
    }
    if (Math.abs(maxLon - minLon) < 0.01) {
      minLon -= 0.005;
      maxLon += 0.005;
    }
    const project = ([lat, lon]: [number, number]) => {
      const x = pad + ((lon - minLon) / (maxLon - minLon)) * (width - pad * 2);
      const y = pad + ((maxLat - lat) / (maxLat - minLat)) * (height - pad * 2);
      return [Number(x.toFixed(1)), Number(y.toFixed(1))] as [number, number];
    };
    const routePath = routePoints.map(project).map(([x, y], idx) => `${idx === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ');
    const recordingPath = deps.recordedTrack.length >= 2
      ? deps.recordedTrack.map(project).map(([x, y], idx) => `${idx === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ')
      : '';
    const start = project(routePoints[0]);
    const end = project(routePoints[routePoints.length - 1]);
    const current = livePoint ? project(livePoint) : deps.recordedTrack.length >= 1 ? project(deps.recordedTrack[deps.recordedTrack.length - 1]) : end;
    const bearing = Math.round(deps.mapBearing);
    const modeLabel = deps.navigationRoute ? 'מסלול פעיל' : deps.recordedTrack.length >= 2 ? 'הקלטה פעילה' : 'מיני ניווט';

    return `<svg class="mini-nav-svg" viewBox="0 0 320 132" role="img" aria-label="${miniEscape(modeLabel)}">
      <rect x="1" y="1" width="318" height="130" rx="18" class="mini-nav-bg" />
      <path d="M24 36 H296 M24 66 H296 M24 96 H296 M76 18 V114 M160 18 V114 M244 18 V114" class="mini-nav-gridline" />
      ${recordingPath ? `<path d="${recordingPath}" class="mini-nav-recording" />` : ''}
      ${routePath ? `<path d="${routePath}" class="mini-nav-route" />` : ''}
      <circle cx="${start[0]}" cy="${start[1]}" r="5.5" class="mini-nav-start" />
      <circle cx="${end[0]}" cy="${end[1]}" r="5.5" class="mini-nav-end" />
      <g transform="translate(${current[0]} ${current[1]}) rotate(${bearing})">
        <path d="M0 -12 L7 8 L0 4 L-7 8 Z" class="mini-nav-live" />
      </g>
      <circle cx="${current[0]}" cy="${current[1]}" r="13" class="mini-nav-pulse" />
      <text x="18" y="23" class="mini-nav-label">${miniEscape(modeLabel)}</text>
      <text x="302" y="116" text-anchor="end" class="mini-nav-bearing">${bearing}°</text>
    </svg>`;
  };

  const miniWindowHtml = () => {
    const title = deps.navigationRoute
      ? `${deps.navigationRoute.start.label} ← ${deps.navigationRoute.end.label}`
      : 'אין מסלול פעיל';
    const distance = deps.navigationRoute ? fmtKm(deps.navigationRoute.km) : '—';
    const duration = deps.navigationRoute?.durationMin ? `${Math.round(deps.navigationRoute.durationMin)} דק׳` : '—';
    const location = deps.liveLocation ? `${deps.liveLocation.lat.toFixed(5)}, ${deps.liveLocation.lon.toFixed(5)}` : 'לא פעיל';
    const recording = deps.recordedTrack.length ? `${deps.recordedTrack.length} נק׳ · ${fmtKm(deps.recordedKm)}` : 'לא פעילה';
    const turn = deps.currentTurnInstruction?.text ?? 'אין הוראת פנייה זמינה';
    const miniMap = miniNavSvgMarkup();
    return `<!doctype html>
<html lang="he" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>מפת מצב — חלון מוקטן</title>
  <style>
    :root { color-scheme: dark; font-family: system-ui, "Segoe UI", sans-serif; background:#0f1217; color:#d8dee8; }
    body { margin:0; padding:14px; background:linear-gradient(145deg,#0f1217,#17202a); }
    .card { border:1px solid #2c3645; border-radius:16px; padding:14px; box-shadow:0 10px 30px rgba(0,0,0,.35); }
    h1 { margin:0 0 8px; font-size:15px; color:#6ed1c2; }
    .route { font-weight:800; line-height:1.4; margin-bottom:10px; }
    .mini-nav { margin:10px 0; border:1px solid #232b38; border-radius:16px; overflow:hidden; background:#0b0d10; }
    .mini-nav-svg { display:block; width:100%; height:auto; }
    .mini-nav-bg { fill:#111821; stroke:#2c3645; }
    .mini-nav-gridline { stroke:rgba(255,255,255,.08); stroke-width:1; }
    .mini-nav-route { fill:none; stroke:#6ed1c2; stroke-width:5; stroke-linecap:round; stroke-linejoin:round; }
    .mini-nav-recording { fill:none; stroke:#f6c453; stroke-width:3; stroke-linecap:round; stroke-linejoin:round; stroke-dasharray:7 6; opacity:.9; }
    .mini-nav-start { fill:#88c37a; stroke:#0b0d10; stroke-width:2; }
    .mini-nav-end { fill:#d96b6b; stroke:#0b0d10; stroke-width:2; }
    .mini-nav-live { fill:#5a8fbf; stroke:#eaf7ff; stroke-width:1.6; filter:drop-shadow(0 4px 8px rgba(0,0,0,.45)); }
    .mini-nav-pulse { fill:none; stroke:#5a8fbf; stroke-width:2; opacity:.35; }
    .mini-nav-placeholder { fill:none; stroke:#6ed1c2; stroke-width:4; stroke-linecap:round; stroke-dasharray:8 8; opacity:.55; }
    .mini-nav-muted-dot { fill:#8b97a8; opacity:.75; }
    .mini-nav-empty, .mini-nav-label, .mini-nav-bearing { fill:#8b97a8; font-size:11px; font-weight:700; }
    .grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
    .item { background:#131820; border:1px solid #232b38; border-radius:10px; padding:8px; }
    .turn { border:1px solid rgba(110,209,194,.32); background:rgba(110,209,194,.08); border-radius:12px; padding:9px 10px; margin:0 0 10px; line-height:1.45; }
    .turn small { color:#6ed1c2; }
    .turn strong { display:block; font-size:13px; }
    small { display:block; color:#8b97a8; font-size:10px; margin-bottom:3px; }
    strong { font-size:14px; }
    .note { margin-top:10px; color:#8b97a8; font-size:11px; line-height:1.4; }
  </style>
</head>
<body>
  <main class="card">
    <h1>חלון מוקטן — מיני ניווט</h1>
    <div class="route">${miniEscape(title)}</div>
    <div class="mini-nav">${miniMap}</div>
    <div class="turn"><small>הוראת פנייה במסלול</small><strong>${miniEscape(turn)}</strong></div>
    <div class="grid">
      <div class="item"><small>מרחק</small><strong>${miniEscape(distance)}</strong></div>
      <div class="item"><small>זמן תיאורטי</small><strong>${miniEscape(duration)}</strong></div>
      <div class="item"><small>מיקום חי</small><strong>${miniEscape(location)}</strong></div>
      <div class="item"><small>הקלטה</small><strong>${miniEscape(recording)}</strong></div>
    </div>
    <div class="note">במחשב שולחני החלון משתמש ב־Document Picture-in-Picture כאשר הדפדפן תומך בכך. בנייד האפליקציה משתמשת במיני־ניווט פנימי יציב.</div>
  </main>
</body>
</html>`;
  };

  const openMiniWindow = async () => {
    if (isMobileLikeDevice()) {
      if (deps.miniExternalWindowRef.current && !deps.miniExternalWindowRef.current.closed) {
        deps.miniExternalWindowRef.current.close();
        deps.miniExternalWindowRef.current = null;
      }
      deps.setMiniOverlayOpen(true);
      deps.setMiniStatus('mobile');
      return;
    }
    const pipApi = (window as Window & {
      documentPictureInPicture?: {
        requestWindow: (options: { width: number; height: number }) => Promise<Window>;
      };
    }).documentPictureInPicture;
    if (pipApi?.requestWindow) {
      try {
        const pipWindow = await pipApi.requestWindow({ width: 360, height: 300 });
        pipWindow.document.open();
        pipWindow.document.write(miniWindowHtml());
        pipWindow.document.close();
        deps.miniExternalWindowRef.current = pipWindow;
        deps.setMiniOverlayOpen(false);
        deps.setMiniStatus('pip');
        return;
      } catch {
        // Continue to popup / in-app fallback.
      }
    }
    const popup = window.open('', 'south-lebanon-mini-map', 'popup,width=360,height=300');
    if (popup) {
      popup.document.open();
      popup.document.write(miniWindowHtml());
      popup.document.close();
      try {
        popup.opener = null;
      } catch {
        // Some browsers block changing opener. The popup contains only local status HTML.
      }
      deps.miniExternalWindowRef.current = popup;
      deps.setMiniOverlayOpen(false);
      deps.setMiniStatus('popup');
      return;
    }
    deps.setMiniOverlayOpen(true);
    deps.setMiniStatus('fallback');
  };

  useEffect(() => {
    const miniWindow = deps.miniExternalWindowRef.current;
    if (!miniWindow || miniWindow.closed) return;
    try {
      miniWindow.document.open();
      miniWindow.document.write(miniWindowHtml());
      miniWindow.document.close();
    } catch {
      deps.miniExternalWindowRef.current = null;
    }
  }, [deps.navigationRoute, deps.liveLocation, deps.recordedTrack, deps.recordedKm, deps.currentTurnInstruction]);

  return { miniNavSvgMarkup, openMiniWindow };
};
