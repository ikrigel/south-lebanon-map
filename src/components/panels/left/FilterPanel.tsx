import React from 'react';

interface FilterPanelProps {
  yearFrom: number;
  yearTo: number;
  years: number[];
  setYearFrom: (year: number) => void;
  setYearTo: (year: number) => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  yearFrom,
  yearTo,
  years,
  setYearFrom,
  setYearTo,
}) => {
  return (
    <div className="panel-section">
      <h3>טווח שנים</h3>
      <div className="year-range" data-testid="filter-year-range">
        <label>
          <span>משנה</span>
          <select
            value={yearFrom}
            onChange={e => setYearFrom(Math.min(+e.target.value, yearTo))}
            data-testid="select-year-from"
          >
            {years.map(year => <option key={`from-${year}`} value={year}>{year}</option>)}
          </select>
        </label>
        <label>
          <span>עד שנה</span>
          <select
            value={yearTo}
            onChange={e => setYearTo(Math.max(+e.target.value, yearFrom))}
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
  );
};
