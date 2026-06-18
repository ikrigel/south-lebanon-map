import { useState, useMemo, useCallback } from 'react';
import type { DroneAttack } from '../data/geo';

interface DroneFilterState {
  yearFilter: Set<number>;
  statusFilter: Set<'confirmed' | 'claimed' | 'disputed'>;
  showOnlyCasualties: boolean;
  dateRangeStart?: string; // ISO date
  dateRangeEnd?: string; // ISO date
}

export const useDroneFiltering = (droneAttacks: DroneAttack[]) => {
  const [filters, setFilters] = useState<DroneFilterState>({
    yearFilter: new Set([2024, 2025, 2026]),
    statusFilter: new Set(['confirmed', 'claimed', 'disputed']),
    showOnlyCasualties: false,
  });

  const toggleYear = useCallback((year: number) => {
    setFilters(prev => {
      const newYearFilter = new Set(prev.yearFilter);
      if (newYearFilter.has(year)) {
        newYearFilter.delete(year);
      } else {
        newYearFilter.add(year);
      }
      return { ...prev, yearFilter: newYearFilter };
    });
  }, []);

  const toggleStatus = useCallback((status: 'confirmed' | 'claimed' | 'disputed') => {
    setFilters(prev => {
      const newStatusFilter = new Set(prev.statusFilter);
      if (newStatusFilter.has(status)) {
        newStatusFilter.delete(status);
      } else {
        newStatusFilter.add(status);
      }
      return { ...prev, statusFilter: newStatusFilter };
    });
  }, []);

  const setDateRange = useCallback((start?: string, end?: string) => {
    setFilters(prev => ({
      ...prev,
      dateRangeStart: start,
      dateRangeEnd: end,
    }));
  }, []);

  const toggleCasualtyFilter = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      showOnlyCasualties: !prev.showOnlyCasualties,
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      yearFilter: new Set([2024, 2025, 2026]),
      statusFilter: new Set(['confirmed', 'claimed', 'disputed']),
      showOnlyCasualties: false,
    });
  }, []);

  // Memoized filtered attacks
  const filteredAttacks = useMemo(() => {
    return droneAttacks.filter(attack => {
      // Year filter
      if (!filters.yearFilter.has(attack.year)) {
        return false;
      }

      // Status filter
      if (!filters.statusFilter.has(attack.status)) {
        return false;
      }

      // Date range filter
      if (filters.dateRangeStart && attack.date < filters.dateRangeStart) {
        return false;
      }
      if (filters.dateRangeEnd && attack.date > filters.dateRangeEnd) {
        return false;
      }

      // Casualty filter
      if (filters.showOnlyCasualties && !attack.casualties) {
        return false;
      }

      return true;
    });
  }, [droneAttacks, filters]);

  // Casualty statistics
  const statistics = useMemo(() => {
    const totalCasualties = filteredAttacks.reduce((sum, attack) => sum + (attack.casualties || 0), 0);
    const confirmedCount = filteredAttacks.filter(a => a.status === 'confirmed').length;
    const claimedCount = filteredAttacks.filter(a => a.status === 'claimed').length;
    const disputedCount = filteredAttacks.filter(a => a.status === 'disputed').length;

    const casualtiesByYear: Record<number, number> = {};
    filteredAttacks.forEach(attack => {
      casualtiesByYear[attack.year] = (casualtiesByYear[attack.year] || 0) + (attack.casualties || 0);
    });

    const attacksByYear: Record<number, number> = {};
    filteredAttacks.forEach(attack => {
      attacksByYear[attack.year] = (attacksByYear[attack.year] || 0) + 1;
    });

    return {
      totalAttacks: filteredAttacks.length,
      totalCasualties,
      confirmedCount,
      claimedCount,
      disputedCount,
      casualtiesByYear,
      attacksByYear,
      averageDistance: calculateAverageDistance(filteredAttacks),
    };
  }, [filteredAttacks]);

  return {
    filters,
    filteredAttacks,
    statistics,
    toggleYear,
    toggleStatus,
    setDateRange,
    toggleCasualtyFilter,
    resetFilters,
  };
};

// Helper function to calculate average distance from border
function calculateAverageDistance(attacks: DroneAttack[]): number {
  if (attacks.length === 0) return 0;

  // Approximate distance from Lebanon-Israel border (simplified calculation)
  // Border is roughly at lat 33.0°N, lon 35.5°E
  const borderLat = 33.0;
  const borderLon = 35.5;

  const totalDistance = attacks.reduce((sum, attack) => {
    const targetLat = attack.target.lat;
    const targetLon = attack.target.lon;

    // Simple Euclidean distance approximation
    const dlat = (targetLat - borderLat) * 111; // 1° latitude ≈ 111 km
    const dlon = (targetLon - borderLon) * 111 * Math.cos((targetLat * Math.PI) / 180);

    return sum + Math.sqrt(dlat * dlat + dlon * dlon);
  }, 0);

  return Math.round((totalDistance / attacks.length) * 10) / 10; // One decimal place in km
}
