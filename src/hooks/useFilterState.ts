import { useState } from 'react';
import { TYPES, SEVS } from '../constants';
import { loadLocalFilterState } from '../storage/sessionLoaders';
import { incidents } from '../data/geo';

export const useFilterState = () => {
  const initialFilterStateRef = new (class { current: any | null = null })();
  if (initialFilterStateRef.current === null) initialFilterStateRef.current = loadLocalFilterState();

  const minYear = Math.min(...incidents.map(i => i.year));
  const maxYear = Math.max(...incidents.map(i => i.year));

  const [yearFrom, setYearFrom] = useState(() => {
    const saved = initialFilterStateRef.current?.yearFrom;
    return saved !== undefined && saved >= minYear && saved <= maxYear ? saved : minYear;
  });

  const [yearTo, setYearTo] = useState(() => {
    const saved = initialFilterStateRef.current?.yearTo;
    return saved !== undefined && saved >= minYear && saved <= maxYear ? saved : maxYear;
  });

  const [typeFilter, setTypeFilter] = useState<Set<string>>(() => {
    const saved = initialFilterStateRef.current?.typeFilter;
    if (saved && saved.length > 0) return new Set(saved.filter((t: string) => (TYPES as string[]).includes(t)));
    return new Set(TYPES);
  });

  const [sevFilter, setSevFilter] = useState<Set<string>>(() => {
    const saved = initialFilterStateRef.current?.sevFilter;
    if (saved && saved.length > 0) return new Set(saved.filter((s: string) => (SEVS as string[]).includes(s)));
    return new Set(SEVS);
  });

  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return {
    yearFrom, setYearFrom,
    yearTo, setYearTo,
    typeFilter, setTypeFilter,
    sevFilter, setSevFilter,
    query, setQuery,
    selectedId, setSelectedId,
  };
};
