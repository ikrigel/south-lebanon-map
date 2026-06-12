import React from 'react';
import { fmtKm, safeText } from '../../../util';
import { DIFFICULTY_LABELS, PASSABILITY_LABELS, MAX_MULTI_ROUTE_POINTS } from '../../../constants';
import type { DifficultyLevel, PassabilityLevel, MultiPointRoute } from '../../../types';
import { SavedMultiRoutesList } from './SavedMultiRoutesList';

interface MultiRoutePanelProps {
  multiRouteBuildMode: boolean;
  setMultiRouteBuildMode: (v: boolean) => void;
  multiRouteDraftPoints: any[];
  setMultiRouteDraftPoints: (v: any[]) => void;
  multiRouteTotalKm: number;
  multiRouteName: string;
  setMultiRouteName: (v: string) => void;
  multiRouteDescription: string;
  setMultiRouteDescription: (v: string) => void;
  multiRouteDifficulty: DifficultyLevel;
  setMultiRouteDifficulty: (v: DifficultyLevel) => void;
  multiRoutePassability: PassabilityLevel;
  setMultiRoutePassability: (v: PassabilityLevel) => void;
  savedMultiRoutes: MultiPointRoute[];
  setSavedMultiRoutes: (v: MultiPointRoute[]) => void;
  activeMultiRoute: MultiPointRoute | null;
  setActiveMultiRoute: (v: MultiPointRoute | null) => void;
  measureMode: boolean;
  setMeasureMode: (v: boolean) => void;
  addPoiMode: boolean;
  setAddPoiMode: (v: boolean) => void;
  saveMultiRoute: () => void;
  loadMultiRoute: (route: MultiPointRoute) => void;
  exportMultiRoute: (route: MultiPointRoute) => void;
  showToast: (msg: string) => void;
}

export const MultiRoutePanel: React.FC<MultiRoutePanelProps> = ({
  multiRouteBuildMode,
  setMultiRouteBuildMode,
  multiRouteDraftPoints,
  setMultiRouteDraftPoints,
  multiRouteTotalKm,
  multiRouteName,
  setMultiRouteName,
  multiRouteDescription,
  setMultiRouteDescription,
  multiRouteDifficulty,
  setMultiRouteDifficulty,
  multiRoutePassability,
  setMultiRoutePassability,
  savedMultiRoutes,
  setSavedMultiRoutes,
  activeMultiRoute,
  setActiveMultiRoute,
  measureMode,
  setMeasureMode,
  addPoiMode,
  setAddPoiMode,
  saveMultiRoute,
  loadMultiRoute,
  exportMultiRoute,
  showToast,
}) => {
  return (
    <div className="panel-section">
      <h3>בנייה ידנית של מסלול נקודות</h3>
      <div className="recording-box">
        <p className="legend-note">
          לחץ "הפעל מצב בנייה" ואז לחץ על המפה כדי להוסיף נקודות למסלול. לאחר מכן מלא פרטים ושמור.
        </p>
        <div className="route-actions">
          <button
            className="btn"
            onClick={() => {
              setMultiRouteBuildMode(!multiRouteBuildMode);
              if (multiRouteBuildMode) {
                showToast('מצב בניית מסלול כבה');
              } else {
                if (measureMode) { setMeasureMode(false); }
                if (addPoiMode) { setAddPoiMode(false); }
                showToast('לחץ על המפה כדי להוסיף נקודות למסלול');
              }
            }}
            aria-pressed={multiRouteBuildMode}
            data-testid="button-multi-route-build-mode"
          >
            {multiRouteBuildMode ? 'עצור בנייה' : 'הפעל מצב בנייה'}
          </button>
          <button
            className="btn ghost"
            disabled={multiRouteDraftPoints.length === 0}
            onClick={() => {
              setMultiRouteDraftPoints(multiRouteDraftPoints.slice(0, -1).map((p, i) => ({ ...p, order: i })));
              showToast('הנקודה האחרונה הוסרה');
            }}
            data-testid="button-multi-route-undo"
          >
            בטל נקודה אחרונה
          </button>
          <button
            className="btn ghost"
            disabled={multiRouteDraftPoints.length === 0}
            onClick={() => {
              setMultiRouteDraftPoints([]);
              showToast('טיוטת המסלול נוקתה');
            }}
            data-testid="button-multi-route-clear-draft"
          >
            נקה טיוטה
          </button>
        </div>
        <div className="route-summary compact">
          {multiRouteBuildMode && <span>מצב בנייה פעיל · {multiRouteDraftPoints.length} נקודות · {multiRouteDraftPoints.length >= 2 ? fmtKm(multiRouteTotalKm) : '—'}</span>}
          {!multiRouteBuildMode && multiRouteDraftPoints.length > 0 && <span>טיוטה: {multiRouteDraftPoints.length} נקודות · {multiRouteDraftPoints.length >= 2 ? fmtKm(multiRouteTotalKm) : '—'}</span>}
          {!multiRouteBuildMode && multiRouteDraftPoints.length === 0 && <span>לחץ "הפעל מצב בנייה" ואז הוסף נקודות למפה.</span>}
        </div>
        <input
          className="search"
          value={multiRouteName}
          onChange={e => setMultiRouteName(e.target.value)}
          placeholder="שם המסלול…"
          data-testid="input-multi-route-name"
        />
        <textarea
          className="search poi-textarea"
          value={multiRouteDescription}
          onChange={e => setMultiRouteDescription(e.target.value)}
          placeholder="תיאור המסלול, הערות, נקודות ציון…"
          data-testid="textarea-multi-route-description"
        />
        <div className="poi-style-grid">
          <div className="poi-choice-group">
            <span>רמת קושי</span>
            <div className="poi-choice-buttons" role="group" aria-label="רמת קושי">
              {(Object.entries(DIFFICULTY_LABELS) as [DifficultyLevel, string][]).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  className="poi-choice-btn"
                  aria-pressed={multiRouteDifficulty === val}
                  onClick={() => setMultiRouteDifficulty(val)}
                  data-testid={`button-difficulty-${val}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="poi-choice-group">
            <span>רמת עבירות</span>
            <div className="poi-choice-buttons" role="group" aria-label="רמת עבירות">
              {(Object.entries(PASSABILITY_LABELS) as [PassabilityLevel, string][]).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  className="poi-choice-btn"
                  aria-pressed={multiRoutePassability === val}
                  onClick={() => setMultiRoutePassability(val)}
                  data-testid={`button-passability-${val}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="route-actions">
          <button
            className="btn"
            disabled={multiRouteDraftPoints.length < 2}
            onClick={saveMultiRoute}
            data-testid="button-save-multi-route"
          >
            שמור מסלול
          </button>
        </div>
        <SavedMultiRoutesList
          savedMultiRoutes={savedMultiRoutes}
          activeMultiRoute={activeMultiRoute}
          setSavedMultiRoutes={setSavedMultiRoutes}
          setActiveMultiRoute={setActiveMultiRoute}
          loadMultiRoute={loadMultiRoute}
          exportMultiRoute={exportMultiRoute}
          showToast={showToast}
        />
        <div className="route-actions" style={{ marginTop: 8 }}>
          <label className="file-import">
            ייבוא מסלול קובץ
            <input
              type="file"
              accept="application/json,.json"
              onChange={async e => {
                const file = e.target.files?.[0];
                e.currentTarget.value = '';
                if (!file) return;
                try {
                  const text = await file.text();
                  const data = JSON.parse(text);
                  const routes = (Array.isArray(data) ? data : [data]).slice(0, 50);
                  const valid = routes.filter((r: any) =>
                    r && Array.isArray(r.points) && r.points.length >= 2 &&
                    r.points.every((p: any) => typeof p.lat === 'number' && typeof p.lon === 'number')
                  ).map((r: any): MultiPointRoute => ({
                    id: safeText(r.id) || `multi-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
                    name: safeText(r.name, 'מסלול מיובא') || 'מסלול מיובא',
                    description: safeText(r.description, ''),
                    difficulty: ['easy','medium','hard','extreme'].includes(r.difficulty) ? r.difficulty : 'medium',
                    passability: ['paved','dirt','offroad','foot_only'].includes(r.passability) ? r.passability : 'dirt',
                    points: r.points.slice(0, MAX_MULTI_ROUTE_POINTS).map((p: any, i: number) => ({
                      lat: p.lat,
                      lon: p.lon,
                      label: safeText(p.label, `נקודה ${i+1}`) || `נקודה ${i+1}`,
                      order: i,
                    })),
                    totalKm: typeof r.totalKm === 'number' ? r.totalKm : 0,
                    createdAt: safeText(r.createdAt, new Date().toISOString()) || new Date().toISOString(),
                  }));
                  if (valid.length) {
                    setSavedMultiRoutes([...valid, ...savedMultiRoutes]);
                    showToast(`${valid.length} מסלולים יובאו`);
                  } else {
                    showToast('לא נמצאו מסלולים תקינים בקובץ');
                  }
                } catch {
                  showToast('שגיאה בקריאת הקובץ');
                }
              }}
              data-testid="input-import-multi-route"
            />
          </label>
        </div>
        <p className="legend-note">
          הקובץ המיוצא הוא JSON — ניתן לשתף אותו עם אחרים שישתמשו בייבוא. הקובץ כולל שם, תיאור, רמת קושי, רמת עבירות ורשימת נקודות הגיאוגרפיות.
        </p>
      </div>
    </div>
  );
};
