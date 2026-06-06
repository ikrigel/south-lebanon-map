import React from 'react';
import type { CustomPoi, PoiColor, PoiShape, PoiSize } from '../../../types';
import { POI_COLORS, POI_SHAPES, POI_SIZES } from '../../../constants';

export const PoiSection: React.FC<{
  addPoiMode: boolean;
  poiDraft: { lat: number; lon: number } | null;
  poiName: string;
  poiDescription: string;
  poiMarkerSize: PoiSize;
  poiMarkerShape: PoiShape;
  poiMarkerColor: PoiColor;
  customPois: CustomPoi[];
  onAddPoiModeToggle: () => void;
  onClearDraft: () => void;
  onPoiNameChange: (name: string) => void;
  onPoiDescriptionChange: (desc: string) => void;
  onPoiSizeChange: (size: PoiSize) => void;
  onPoiShapeChange: (shape: PoiShape) => void;
  onPoiColorChange: (color: PoiColor) => void;
  onSavePoi: () => void;
  onExportPois: () => void;
  onImportPois: (file: File) => Promise<void>;
  showToast: (message: string) => void;
}> = ({
  addPoiMode,
  poiDraft,
  poiName,
  poiDescription,
  poiMarkerSize,
  poiMarkerShape,
  poiMarkerColor,
  customPois,
  onAddPoiModeToggle,
  onClearDraft,
  onPoiNameChange,
  onPoiDescriptionChange,
  onPoiSizeChange,
  onPoiShapeChange,
  onPoiColorChange,
  onSavePoi,
  onExportPois,
  onImportPois,
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
              onAddPoiModeToggle();
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
              onClearDraft();
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
          onChange={e => onPoiNameChange(e.target.value)}
          placeholder="שם נקודת העניין…"
          data-testid="input-poi-name"
        />

        <textarea
          className="search poi-textarea"
          value={poiDescription}
          onChange={e => onPoiDescriptionChange(e.target.value)}
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
                  onClick={() => onPoiSizeChange(size.value as PoiSize)}
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
                  onClick={() => onPoiShapeChange(shape.value as PoiShape)}
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
                  onClick={() => onPoiColorChange(color.value as PoiColor)}
                  style={{ '--poi-color': color.value } as React.CSSProperties}
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
              style={{ '--poi-color': poiMarkerColor } as React.CSSProperties}
              data-size={poiMarkerSize}
            >
              {poiMarkerShape === 'star' ? '★' : ''}
            </span>
            <small>תצוגה מקדימה</small>
          </div>
        </div>

        <div className="route-actions">
          <button className="btn" disabled={!poiDraft} onClick={onSavePoi} data-testid="button-save-poi">
            שמור נקודה
          </button>
          <button
            className="btn ghost"
            disabled={customPois.length === 0}
            onClick={onExportPois}
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
                onImportPois(e.target.files?.[0]!).catch(() => undefined);
                e.currentTarget.value = '';
              }}
              data-testid="input-import-pois"
            />
          </label>
        </div>
      </div>
    </div>
  );
};
