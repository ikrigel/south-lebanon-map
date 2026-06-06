import React from 'react';
import { TYPES, SEVS } from '../../../constants';

const TYPE_COLOR: Record<string, string> = {
  rocket: '#ff6b6b',
  atgm: '#ffa94d',
  uav: '#74c0fc',
  idf_strike: '#b197fc',
  unifil: '#94d82d',
  ground: '#ff922b',
  displacement: '#748ffc',
};

const TYPE_LABEL: Record<string, string> = {
  rocket: 'רקטה',
  atgm: 'נ״ט',
  uav: 'כטב״ם',
  idf_strike: 'תקיפה',
  unifil: 'יוניפי״ל',
  ground: 'קרקע',
  displacement: 'עקור',
};

const SEV_LABEL: Record<string, string> = {
  low: 'נמוכה',
  med: 'בינונית',
  high: 'גבוהה',
};

const toggleSet = <T,>(set: Set<T>, item: T): Set<T> => {
  const newSet = new Set(set);
  if (newSet.has(item)) newSet.delete(item);
  else newSet.add(item);
  return newSet;
};

export const FilterSection: React.FC<{
  yearFrom: number;
  yearTo: number;
  years: number[];
  typeFilter: Set<string>;
  sevFilter: Set<string>;
  query: string;
  searchResults: any[];
  largeLabels: boolean;
  allLabels: boolean;
  onYearFromChange: (year: number) => void;
  onYearToChange: (year: number) => void;
  onTypeFilterToggle: (type: string) => void;
  onSevFilterToggle: (sev: string) => void;
  onQueryChange: (query: string) => void;
  onSearchResultClick: (result: any) => void;
  onSelectIncident: (id: string) => void;
  onAllLabelsToggle: () => void;
  onLargeLabelsToggle: () => void;
}> = ({
  yearFrom,
  yearTo,
  years,
  typeFilter,
  sevFilter,
  query,
  searchResults,
  largeLabels,
  allLabels,
  onYearFromChange,
  onYearToChange,
  onTypeFilterToggle,
  onSevFilterToggle,
  onQueryChange,
  onSearchResultClick,
  onSelectIncident,
  onAllLabelsToggle,
  onLargeLabelsToggle,
}) => {
  return (
    <>
      <div className="panel-section">
        <h3>טווח שנים</h3>
        <div className="year-range" data-testid="filter-year-range">
          <label>
            <span>משנה</span>
            <select
              value={yearFrom}
              onChange={e => onYearFromChange(Math.min(+e.target.value, yearTo))}
              data-testid="select-year-from"
            >
              {years.map(year => <option key={`from-${year}`} value={year}>{year}</option>)}
            </select>
          </label>
          <label>
            <span>עד שנה</span>
            <select
              value={yearTo}
              onChange={e => onYearToChange(Math.max(+e.target.value, yearFrom))}
              data-testid="select-year-to"
            >
              {years.map(year => <option key={`to-${year}`} value={year}>{year}</option>)}
            </select>
          </label>
        </div>
        <p className="year-summary" data-testid="text-year-summary">
          מוצגים אירועים מהשנים <bdi>{yearFrom}</bdi>–<bdi>{yearTo}</bdi>
        </p>
      </div>

      <div className="panel-section">
        <h3>סוגי אירועים</h3>
        <div className="chips" data-testid="chips-type">
          {TYPES.map(t => (
            <button
              key={t}
              className="chip"
              aria-pressed={typeFilter.has(t)}
              onClick={() => onTypeFilterToggle(t)}
              data-testid={`chip-type-${t}`}
              style={typeFilter.has(t) ? { background: TYPE_COLOR[t], borderColor: TYPE_COLOR[t], color: '#0b0d10' } : {}}
            >
              {TYPE_LABEL[t]}
            </button>
          ))}
        </div>
      </div>

      <div className="panel-section">
        <h3>חומרה</h3>
        <div className="chips" data-testid="chips-severity">
          {SEVS.map(s => (
            <button
              key={s}
              className="chip"
              aria-pressed={sevFilter.has(s)}
              onClick={() => onSevFilterToggle(s)}
              data-testid={`chip-sev-${s}`}
            >
              {SEV_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="panel-section">
        <h3>חיפוש חופשי</h3>
        <input
          className="search"
          placeholder="חיפוש יישוב, אירוע, יוניפי״ל, מקור או אזור…"
          value={query}
          onChange={e => onQueryChange(e.target.value)}
          data-testid="input-search"
        />
        {searchResults.length > 0 && (
          <div className="search-results" data-testid="search-results">
            {searchResults.map(result => (
              <button
                key={result.id}
                className="search-result"
                onClick={() => {
                  onSearchResultClick(result);
                  if ('incidentId' in result && typeof result.incidentId === 'string') {
                    onSelectIncident(result.incidentId);
                  }
                }}
                data-testid={`button-search-result-${result.id}`}
              >
                <span>{result.title}</span>
                <small>{result.subtitle}</small>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="panel-section">
        <h3>נראות שמות במפה</h3>
        <div
          className="toggle-row"
          data-active={allLabels}
          onClick={onAllLabelsToggle}
          role="switch"
          aria-checked={allLabels}
          data-testid="toggle-all-labels"
        >
          <div className="toggle-label">
            <span className="toggle-swatch label-swatch">כ</span>
            הצג את כל השמות תמיד
          </div>
          <span className="toggle-switch" />
        </div>
        <div
          className="toggle-row"
          data-active={largeLabels}
          onClick={onLargeLabelsToggle}
          role="switch"
          aria-checked={largeLabels}
          data-testid="toggle-large-labels"
        >
          <div className="toggle-label">
            <span className="toggle-swatch label-swatch">א</span>
            טקסט גדול לשמות יישובים ונקודות
          </div>
          <span className="toggle-switch" />
        </div>
        <p className="legend-note">
          "כל השמות" מציג את כל שמות המקומות והכפרים בלי להגדיל טקסט. "טקסט גדול" מגדיל את התוויות ומוסיף תעתיק באנגלית.
        </p>
      </div>
    </>
  );
};
