import React from 'react';
import { TYPES, SEVS } from '../../../constants';
import { TYPE_LABEL, TYPE_COLOR, SEV_LABEL } from '../../../util';

interface IncidentFiltersPanelProps {
  typeFilter: Set<string>;
  sevFilter: Set<string>;
  setTypeFilter: (filter: Set<string>) => void;
  setSevFilter: (filter: Set<string>) => void;
}

const toggleSet = (s: Set<string>, item: string) => {
  const newSet = new Set(s);
  if (newSet.has(item)) newSet.delete(item);
  else newSet.add(item);
  return newSet;
};

export const IncidentFiltersPanel: React.FC<IncidentFiltersPanelProps> = ({
  typeFilter,
  sevFilter,
  setTypeFilter,
  setSevFilter,
}) => {
  return (
    <>
      <div className="panel-section">
        <h3>סוגי אירועים</h3>
        <div className="chips" data-testid="chips-type">
          {TYPES.map(t => (
            <button
              key={t}
              className="chip"
              aria-pressed={typeFilter.has(t)}
              onClick={() => setTypeFilter(toggleSet(typeFilter, t))}
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
              onClick={() => setSevFilter(toggleSet(sevFilter, s))}
              data-testid={`chip-sev-${s}`}
            >
              {SEV_LABEL[s]}
            </button>
          ))}
        </div>
      </div>
    </>
  );
};
