import React, { type CSSProperties } from 'react';
import { POI_COLORS, POI_SHAPES, POI_SIZES } from '../../../constants';
import type { PoiColor, PoiShape, PoiSize, CustomPoi } from '../../../types';

interface PoiPanelProps {
  addPoiMode: boolean;
  setAddPoiMode: (v: boolean) => void;
  poiDraft: { lat: number; lon: number } | null;
  setPoiDraft: (v: { lat: number; lon: number } | null) => void;
  poiName: string;
  setPoiName: (v: string) => void;
  poiDescription: string;
  setPoiDescription: (v: string) => void;
  poiMarkerSize: PoiSize;
  setPoiMarkerSize: (v: PoiSize) => void;
  poiMarkerShape: PoiShape;
  setPoiMarkerShape: (v: PoiShape) => void;
  poiMarkerColor: PoiColor;
  setPoiMarkerColor: (v: PoiColor) => void;
  customPois: CustomPoi[];
  setCustomPois: (v: CustomPoi[]) => void;
  savePoi: () => void;
  importPois: (file: File | undefined) => Promise<void>;
  downloadJson: (name: string, data: any) => void;
  setFocusTarget: (v: any) => void;
  measureMode: boolean;
  setMeasureMode: (v: boolean) => void;
  setManualMeasure: (v: any[]) => void;
  showToast: (msg: string) => void;
}

export const PoiPanel: React.FC<PoiPanelProps> = ({
  addPoiMode,
  setAddPoiMode,
  poiDraft,
  setPoiDraft,
  poiName,
  setPoiName,
  poiDescription,
  setPoiDescription,
  poiMarkerSize,
  setPoiMarkerSize,
  poiMarkerShape,
  setPoiMarkerShape,
  poiMarkerColor,
  setPoiMarkerColor,
  customPois,
  setCustomPois,
  savePoi,
  importPois,
  downloadJson,
  setFocusTarget,
  measureMode,
  setMeasureMode,
  setManualMeasure,
  showToast,
}) => {
  return (
    <div className="panel-section">
      <h3>נקודות עניין אישיות</h3>
      <div className="poi-box" data-testid="poi-box">
        <div className="route-actions">
          <button
            className="btn"
            onClick={() => {
              setAddPoiMode(!addPoiMode);
              setPoiDraft(null);
              if (measureMode) {
                setMeasureMode(false);
                setManualMeasure([]);
              }
              showToast(addPoiMode ? 'מצב הוספת נקודה כובה' : 'לחץ על המפה כדי לבחור נקודת עניין');
            }}
            aria-pressed={addPoiMode}
            data-testid="button-add-poi-mode"
          >
            {addPoiMode ? 'בטל בחירת נקודה' : 'הוסף נקודה מהמפה'}
          </button>
          <button
            className="btn ghost"
            disabled={!poiDraft}
            onClick={() => {
              setPoiDraft(null);
              showToast('בחירת נקודת העניין נוקתה');
            }}
            data-testid="button-clear-poi-draft"
          >
            נקה בחירה
          </button>
        </div>
        <div className="route-summary compact" data-testid="text-poi-draft">
          {poiDraft ? (
            <span>נבחרה נקודה: {poiDraft.lat.toFixed(5)}, {poiDraft.lon.toFixed(5)}</span>
          ) : addPoiMode ? (
            <span>לחץ על המפה כדי לבחור מיקום לנקודת עניין חדשה.</span>
          ) : (
            <span>אפשר להוסיף נקודת עניין עם שם ותיאור, ואז לשתף אותה כקובץ JSON.</span>
          )}
        </div>
        <input
          className="search"
          value={poiName}
          onChange={e => setPoiName(e.target.value)}
          placeholder="שם נקודת העניין…"
          data-testid="input-poi-name"
        />
        <textarea
          className="search poi-textarea"
          value={poiDescription}
          onChange={e => setPoiDescription(e.target.value)}
          placeholder="מידע קצר על הנקודה…"
          data-testid="textarea-poi-description"
        />
        <div className="poi-style-grid" data-testid="poi-style-controls">
          <div className="poi-choice-group">
            <span>גודל סמן</span>
            <div className="poi-choice-buttons" role="group" aria-label="בחירת גודל סמן">
              {POI_SIZES.map(size => (
                <button
                  key={size.value}
                  type="button"
                  className="poi-choice-btn"
                  aria-pressed={poiMarkerSize === size.value}
                  onClick={() => setPoiMarkerSize(size.value)}
                  data-testid={`button-poi-size-${size.value}`}
                >
                  {size.label}
                </button>
              ))}
            </div>
          </div>
          <div className="poi-choice-group">
            <span>צורת סמן</span>
            <div className="poi-choice-buttons" role="group" aria-label="בחירת צורת סמן">
              {POI_SHAPES.map(shape => (
                <button
                  key={shape.value}
                  type="button"
                  className="poi-choice-btn"
                  aria-pressed={poiMarkerShape === shape.value}
                  onClick={() => setPoiMarkerShape(shape.value)}
                  data-testid={`button-poi-shape-${shape.value}`}
                >
                  {shape.label}
                </button>
              ))}
            </div>
          </div>
          <div className="poi-choice-group">
            <span>צבע סמן</span>
            <div className="poi-color-buttons" role="group" aria-label="בחירת צבע סמן">
              {POI_COLORS.map(color => (
                <button
                  key={color.value}
                  type="button"
                  className="poi-color-btn"
                  aria-pressed={poiMarkerColor === color.value}
                  onClick={() => setPoiMarkerColor(color.value)}
                  style={{ '--poi-color': color.value } as CSSProperties}
                  data-testid={`button-poi-color-${color.label}`}
                  title={color.label}
                >
                  <span>{color.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="poi-preview" data-testid="poi-marker-preview" aria-label="תצוגה מקדימה של סמן">
            <span
              className={`poi-preview-pin poi-shape-${poiMarkerShape}`}
              style={{ '--poi-color': poiMarkerColor } as CSSProperties}
              data-size={poiMarkerSize}
            >
              {poiMarkerShape === 'star' ? '★' : ''}
            </span>
            <small>תצוגה מקדימה</small>
          </div>
        </div>
        <div className="route-actions">
          <button className="btn" disabled={!poiDraft} onClick={savePoi} data-testid="button-save-poi">
            שמור נקודה
          </button>
          <button
            className="btn ghost"
            disabled={customPois.length === 0}
            onClick={() => downloadJson('south-lebanon-pois.json', customPois)}
            data-testid="button-export-pois"
          >
            שתף נקודות כקובץ
          </button>
          <label className="file-import">
            ייבוא נקודות
            <input
              type="file"
              accept="application/json,.json"
              onChange={e => {
                importPois(e.target.files?.[0]).catch(() => undefined);
                e.currentTarget.value = '';
              }}
              data-testid="input-import-pois"
            />
          </label>
        </div>
        {customPois.length > 0 && (
          <div className="saved-routes poi-list" data-testid="poi-list">
            {customPois.map(poi => (
              <div className="saved-route" key={poi.id}>
                <button
                  onClick={() => {
                    setFocusTarget({ lat: poi.lat, lon: poi.lon, zoom: 14, id: `focus-${poi.id}-${Date.now()}` });
                    showToast(`המפה מוקדה על "${poi.name}"`);
                  }}
                  data-testid={`button-focus-poi-${poi.id}`}
                >
                  <strong>{poi.name}</strong>
                  <small>{poi.description || `${poi.lat.toFixed(4)}, ${poi.lon.toFixed(4)}`}</small>
                </button>
                <div style={{ display: 'flex', gap: '2px' }}>
                  <button
                    className="mini-delete"
                    onClick={() => {
                      setPoiName(poi.name);
                      setPoiDescription(poi.description || '');
                      setPoiMarkerSize(poi.size || 'medium');
                      setPoiMarkerShape(poi.shape || 'pin');
                      setPoiMarkerColor(poi.color || 'blue');
                      setPoiDraft({ lat: poi.lat, lon: poi.lon });
                      setAddPoiMode(true);
                      setCustomPois(customPois.filter(p => p.id !== poi.id));
                      showToast(`עריכת נקודה: ${poi.name}`);
                    }}
                    data-testid={`button-edit-poi-${poi.id}`}
                    aria-label={`עריכת ${poi.name}`}
                    title="עריכה"
                  >
                    ✎
                  </button>
                  <button
                    className="mini-delete"
                    onClick={() => {
                      setCustomPois(customPois.filter(p => p.id !== poi.id));
                      showToast(`נקודת העניין "${poi.name}" נמחקה`);
                    }}
                    data-testid={`button-delete-poi-${poi.id}`}
                    aria-label={`מחיקת ${poi.name}`}
                    title="מחיקה"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="legend-note">
          נקודות עניין נשמרות בזיכרון הפעיל של המכשיר בלבד. אין מסד נתונים משותף, ולכן אין דלף מידע בין משתמשים; שיתוף מתבצע רק דרך קובץ שהמשתמש בוחר לייצא.
        </p>
      </div>
    </div>
  );
};
