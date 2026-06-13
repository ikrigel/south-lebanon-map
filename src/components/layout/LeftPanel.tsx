import { NavigationPanel } from '../panels/left/NavigationPanel';
import { RecordingPanel } from '../panels/left/RecordingPanel';
import { MultiRoutePanel } from '../panels/left/MultiRoutePanel';
import { PoiPanel } from '../panels/left/PoiPanel';
import { FilterPanel } from '../panels/left/FilterPanel';
import { IncidentFiltersPanel } from '../panels/left/IncidentFiltersPanel';
import { SearchPanel } from '../panels/left/SearchPanel';
import { LabelPreferencesPanel } from '../panels/left/LabelPreferencesPanel';
import type { LayerVis } from '../../Map';

interface LeftPanelProps {
  panelRef: React.MutableRefObject<HTMLElement | null>;
  panelDragRef: React.MutableRefObject<any>;
  handlePanelDragStart: (y: number) => void;
  handlePanelDragMove: (y: number) => void;
  handlePanelDragEnd: () => void;
  mapSearchQuery: string;
  setMapSearchQuery: (q: string) => void;
  mapSearchResults: any[];
  setFocusTarget: (t: any) => void;
  setVisible: (fn: (v: LayerVis) => LayerVis) => void;
  setSelectedId: (id: string | null) => void;
  navigateFromCurrentPosition: (lat: number, lon: number, label: string) => void;
  openExternalNav: (lat: number, lon: number, label: string, startLat?: number, startLon?: number) => void;
  liveLocation: any;
  visible: LayerVis;
  visibleKey: (key: string) => void;
  [key: string]: any;
}

export function LeftPanel(props: LeftPanelProps) {
  return (
    <aside className="panel left" data-testid="panel-layers" ref={props.panelRef}>
      <div
        className="panel-drag-handle"
        data-testid="panel-drag-handle"
        aria-label="גרור לשינוי גובה התפריט"
        onMouseDown={e => { e.preventDefault(); props.handlePanelDragStart(e.clientY); }}
        onTouchStart={e => props.handlePanelDragStart(e.touches[0].clientY)}
        onMouseMove={e => { if (props.panelDragRef.current) { e.preventDefault(); props.handlePanelDragMove(e.clientY); } }}
        onTouchMove={e => { e.preventDefault(); props.handlePanelDragMove(e.touches[0].clientY); }}
        onMouseUp={props.handlePanelDragEnd}
        onMouseLeave={props.handlePanelDragEnd}
        onTouchEnd={props.handlePanelDragEnd}
      >
        <span className="panel-drag-pill" />
      </div>
      <div className="panel-scroll">
        <div className="panel-section map-search-section">
          <h3>חיפוש במפה</h3>
          <input
            className="search"
            placeholder="חפש כפר, עיר, רכס, הר, נחל או נקודת עניין…"
            value={props.mapSearchQuery}
            onChange={e => props.setMapSearchQuery(e.target.value)}
            data-testid="input-map-search"
          />
          <p className="legend-note">
            בחירה בתוצאה ממקמת את הנקודה במרכז המפה, פותחת זום קרוב ומציגה סמן מיקוד.
          </p>
          {props.mapSearchResults.length > 0 && (
            <div className="search-results map-search-results" data-testid="map-search-results">
              {props.mapSearchResults.map((result: any) => (
                <div key={result.id} className="search-result-row" data-testid={`result-row-${result.id}`}>
                  <button
                    className="search-result"
                    onClick={() => {
                      props.setFocusTarget({
                        lat: result.lat,
                        lon: result.lon,
                        zoom: result.zoom,
                        label: result.title,
                        id: `${result.id}-${Date.now()}`,
                      });
                      props.setVisible((v: LayerVis) => ({ ...v, cityLabels: true, settlementLabels: true, ridgeLabels: true, waterLabels: true }));
                      if ('incidentId' in result && typeof result.incidentId === 'string') props.setSelectedId(result.incidentId);
                    }}
                    data-testid={`button-map-search-result-${result.id}`}
                  >
                    <span>{result.title}</span>
                    <small>{result.subtitle}</small>
                  </button>
                  <div className="navigate-btn-group">
                    <button
                      className="btn navigate-here-btn navigate-here-primary"
                      onClick={() => props.navigateFromCurrentPosition(result.lat, result.lon, result.title)}
                      title="הגע מיישור ממיקום הנוכחי"
                      data-testid={`button-navigate-from-here-${result.id}`}
                    >
                      ▶ נווט מיכאן
                    </button>
                    <button
                      className="btn navigate-here-btn navigate-here-external"
                      onClick={() => props.openExternalNav(result.lat, result.lon, result.title,
                        props.liveLocation?.lat, props.liveLocation?.lon)}
                      title="פתח Waze / Google Maps"
                      data-testid={`button-open-external-nav-${result.id}`}
                    >
                      פתח Waze/Maps
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {props.mapSearchQuery.trim().length > 1 && props.mapSearchResults.length === 0 && (
            <p className="legend-note" data-testid="map-search-empty">לא נמצאו תוצאות. נסה כתיב עברי/אנגלי אחר או שם סמוך.</p>
          )}
        </div>

        <div className="panel-section">
          <h3>שכבות מידע</h3>
          <div className="layer-group-title">שכבות בסיס, ביטחון ותבליט</div>
          {[
            { key: 'pop' as const, label: 'תפוצת אוכלוסיה אזרחית', color: '#d0b58a' },
            { key: 'unifil' as const, label: 'יוניפי״ל — מטה ומגזרים', color: '#6da7d1' },
            { key: 'hez' as const, label: 'אזורי השפעת חזבאללה (איכותי)', color: '#b56466' },
            { key: 'blueLine' as const, label: 'הקו הכחול (מקורב)', color: '#5a8fbf' },
            { key: 'litani' as const, label: 'נהר הליטני וגבול אזור החיץ', color: '#4e7fb0' },
            { key: 'rivers' as const, label: 'נהרות — זהרני, אוואלי', color: '#4a90c4' },
            { key: 'topo' as const, label: 'טופוגרפיה — ניתוח תבליט וקרקע', color: '#88c37a' },
          ].map((l: any) => (
            <div
              key={l.key}
              className="toggle-row"
              data-active={props.visible[l.key]}
              onClick={() => props.visibleKey(l.key)}
              role="switch"
              aria-checked={props.visible[l.key]}
              data-testid={`toggle-layer-${l.key}`}
            >
              <div className="toggle-label">
                <span className="toggle-swatch" style={{ background: l.color }} />
                {l.label}
              </div>
              <span className="toggle-switch" />
            </div>
          ))}
          <div className="layer-group-title layer-group-title-labels">שכבות שמות בעברית</div>
          {[
            { key: 'cityLabels' as const, label: 'שמות בעברית — הפעלה כללית', color: '#f6c453' },
            { key: 'settlementLabels' as const, label: 'שמות יישובים וכפרים', color: '#f6c453' },
            { key: 'ridgeLabels' as const, label: 'רכסים, הרים ועמקים', color: '#d49a3a' },
            { key: 'waterLabels' as const, label: 'נחלים, ואדיות ונהרות', color: '#4e7fb0' },
          ].map((l: any) => (
            <div
              key={l.key}
              className="toggle-row"
              data-active={props.visible[l.key]}
              onClick={() => props.visibleKey(l.key)}
              role="switch"
              aria-checked={props.visible[l.key]}
              data-testid={`toggle-layer-${l.key}`}
            >
              <div className="toggle-label">
                <span className="toggle-swatch" style={{ background: l.color }} />
                {l.label}
              </div>
              <span className="toggle-switch" />
            </div>
          ))}
          <p className="legend-note">
            שכבת חזבאללה היא איכותית בלבד — מבוססת דיווחי תקשורת ומחקר ציבוריים, אינה מציינת מתקנים מבצעיים או יעדים תקיפים.
          </p>
          <div
            className="toggle-row"
            data-active={props.visible.sectColors}
            onClick={() => props.visibleKey('sectColors')}
            role="switch"
            aria-checked={props.visible.sectColors}
            data-testid="toggle-layer-sectColors"
          >
            <div className="toggle-label">
              <span className="toggle-swatch" style={{ background: 'linear-gradient(90deg,#2a8a6e,#b03030,#7b3fa0,#c97d2a)' }} />
              צביעת ישובים לפי השתייכות דתית
            </div>
            <span className="toggle-switch" />
          </div>
          {props.visible.sectColors && (
            <>
              <div className="sect-legend">
                {([
                  { sect: 'shia',      label: 'שיעים',    color: '#2a8a6e' },
                  { sect: 'sunni',     label: 'סונים',    color: '#c97d2a' },
                  { sect: 'christian', label: 'נוצרים',   color: '#b03030' },
                  { sect: 'druze',     label: 'דרוזים',   color: '#7b3fa0' },
                  { sect: 'mixed',     label: 'מעורב',    color: '#6b7280' },
                ] as const).map((s: any) => (
                  <div key={s.sect} className="sect-legend-row">
                    <span className="sect-legend-dot" style={{ background: s.color }} />
                    <span>{s.label}</span>
                  </div>
                ))}
              </div>
              <p className="legend-note">צבע הגבול והנקודה על תווית הישוב מציינים את ההשתייכות הדתית הדומיננטית.</p>
            </>
          )}
          <div className="layer-group-title layer-group-title-labels" style={{ marginTop: 12 }}>תוויות ניווט</div>
          <div
            className="toggle-row"
            data-active={props.visible.navLabels}
            onClick={() => props.visibleKey('navLabels')}
            role="switch"
            aria-checked={props.visible.navLabels}
            data-testid="toggle-layer-navLabels"
          >
            <div className="toggle-label">
              <span className="toggle-swatch" style={{ background: 'linear-gradient(90deg,#6ed1c2,#d49a3a)' }} />
              תוויות מסלול: יעד, מרחק, זמן צפוי והתקדמות
            </div>
            <span className="toggle-switch" />
          </div>
          {props.visible.navLabels && (
            <p className="legend-note">
              בזמן ניווט פעיל: תוצג תווית יעד (שם), מרחק כולל וזמן משוער על הנתיב,
              אחוז השלמת המסלול (כשיש GPS), ומרחק נותר ליעד על החץ המסמן מיקומך.
              כיבוי מנקה עבור מפה נקייה יותר.
            </p>
          )}
        </div>

        <NavigationPanel {...props} />
        <RecordingPanel {...props} />
        <MultiRoutePanel {...props} />
        <PoiPanel {...props} />
        <FilterPanel {...props} />
        <IncidentFiltersPanel {...props} />
        <SearchPanel {...props} onResultClick={result => {
          props.setFocusTarget({ lat: result.lat, lon: result.lon, zoom: result.zoom, id: `${result.id}-${Date.now()}` });
          if ('incidentId' in result && typeof result.incidentId === 'string') props.setSelectedId(result.incidentId);
        }} />
        <LabelPreferencesPanel {...props} />
      </div>
    </aside>
  );
}
