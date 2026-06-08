import React from 'react';

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  lat: number;
  lon: number;
  zoom: number;
  incidentId?: string;
}

interface SearchPanelProps {
  query: string;
  searchResults: SearchResult[];
  setQuery: (query: string) => void;
  onResultClick: (result: SearchResult) => void;
}

export const SearchPanel: React.FC<SearchPanelProps> = ({
  query,
  searchResults,
  setQuery,
  onResultClick,
}) => {
  return (
    <div className="panel-section">
      <h3>חיפוש חופשי</h3>
      <input
        className="search"
        placeholder="חיפוש יישוב, אירוע, יוניפי״ל, מקור או אזור…"
        value={query}
        onChange={e => setQuery(e.target.value)}
        data-testid="input-search"
      />
      {searchResults.length > 0 && (
        <div className="search-results" data-testid="search-results">
          {searchResults.map(result => (
            <button
              key={result.id}
              className="search-result"
              onClick={() => onResultClick(result)}
              data-testid={`button-search-result-${result.id}`}
            >
              <span>{result.title}</span>
              <small>{result.subtitle}</small>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
