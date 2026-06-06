import React from 'react';
import { openExternalNav } from '../../../navigation/externalNav';

export const MapSearchSection: React.FC<{
  mapSearchQuery: string;
  mapSearchResults: any[];
  liveLocation: any;
  onQueryChange: (query: string) => void;
  onResultClick: (result: any) => void;
  onNavigateFromHere: (lat: number, lon: number, label: string) => void;
  onSelectIncident: (id: string) => void;
  onToggleLabels: () => void;
}> = ({
  mapSearchQuery,
  mapSearchResults,
  liveLocation,
  onQueryChange,
  onResultClick,
  onNavigateFromHere,
  onSelectIncident,
  onToggleLabels,
}) => {
  return (
    <div className="panel-section map-search-section">
      <h3>חיפוש במפה</h3>
      <input
        className="search"
        placeholder="חפש כפר, עיר, רכס, הר, נחל או נקודת עניין…"
        value={mapSearchQuery}
        onChange={e => onQueryChange(e.target.value)}
        data-testid="input-map-search"
      />
      <p className="legend-note">
        בחירה בתוצאה ממקמת את הנקודה במרכז המפה, פותחת זום קרוב ומציגה סמן מיקוד.
      </p>
      {mapSearchResults.length > 0 && (
        <div className="search-results map-search-results" data-testid="map-search-results">
          {mapSearchResults.map(result => (
            <div key={result.id} className="search-result-row" data-testid={`result-row-${result.id}`}>
              <button
                className="search-result"
                onClick={() => {
                  onResultClick(result);
                  onToggleLabels();
                  if ('incidentId' in result && typeof result.incidentId === 'string') {
                    onSelectIncident(result.incidentId);
                  }
                }}
                data-testid={`button-map-search-result-${result.id}`}
              >
                <span>{result.title}</span>
                <small>{result.subtitle}</small>
              </button>
              <div className="navigate-btn-group">
                <button
                  className="btn navigate-here-btn navigate-here-primary"
                  onClick={() => onNavigateFromHere(result.lat, result.lon, result.title)}
                  title="הגע מיישור ממיקום הנוכחי"
                  data-testid={`button-navigate-from-here-${result.id}`}
                >
                  ▶ נווט מיכאן
                </button>
                <button
                  className="btn navigate-here-btn navigate-here-external"
                  onClick={() => openExternalNav(result.lat, result.lon, result.title,
                    liveLocation?.lat, liveLocation?.lon)}
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
      {mapSearchQuery.trim().length > 1 && mapSearchResults.length === 0 && (
        <p className="legend-note" data-testid="map-search-empty">לא נמצאו תוצאות. נסה כתיב עברי/אנגלי אחר או שם סמוך.</p>
      )}
    </div>
  );
};
