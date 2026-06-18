import type { DroneAttack } from '../data/geo';

interface GeoJSONFeature {
  type: 'Feature';
  geometry: {
    type: string;
    coordinates: any; // Point: [number, number], LineString: [number, number][]
  };
  properties: Record<string, any>;
}

interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
  properties: {
    name: string;
    description: string;
    timestamp: string;
    totalAttacks: number;
    totalCasualties: number;
  };
}

/**
 * Convert drone attacks to GeoJSON FeatureCollection
 */
export function droneAttacksToGeoJSON(attacks: DroneAttack[]): GeoJSONFeatureCollection {
  const totalCasualties = attacks.reduce((sum, attack) => sum + (attack.casualties || 0), 0);

  const features: GeoJSONFeature[] = attacks.flatMap(attack => {
    const features: GeoJSONFeature[] = [];

    // Origin marker
    features.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [attack.origin.lon, attack.origin.lat],
      },
      properties: {
        type: 'origin',
        location: attack.origin.location,
        date: attack.date,
        attackId: attack.id,
        description: `Drone launch point for attack on ${new Date(attack.date).toLocaleDateString('he-IL')}`,
      },
    });

    // Target marker
    features.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [attack.target.lon, attack.target.lat],
      },
      properties: {
        type: 'target',
        location: attack.target.location,
        date: attack.date,
        attackId: attack.id,
        status: attack.status,
        casualties: attack.casualties || 0,
        assessment: attack.assessment,
        sources: attack.sources.map(s => `${s.label}: ${s.url}`).join('; '),
        description: `Target location: ${attack.target.location} (${attack.assessment})`,
      },
    });

    // Flight path
    if (attack.flightPath.length > 1) {
      features.push({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: attack.flightPath.map(point => [point.lon, point.lat]) as [number, number][],
        },
        properties: {
          type: 'flightPath',
          attackId: attack.id,
          origin: attack.origin.location,
          target: attack.target.location,
          date: attack.date,
          status: attack.status,
          distance: calculatePathDistance(attack.flightPath),
          description: `Flight path from ${attack.origin.location} to ${attack.target.location}`,
        },
      });
    }

    return features;
  });

  return {
    type: 'FeatureCollection',
    features,
    properties: {
      name: 'Hezbollah Drone Attacks on IDF (2024-2026)',
      description: 'Documented drone attacks with origin, target, and flight paths',
      timestamp: new Date().toISOString(),
      totalAttacks: attacks.length,
      totalCasualties,
    },
  };
}

/**
 * Export GeoJSON to file
 */
export function exportDroneDataAsGeoJSON(attacks: DroneAttack[], filename?: string): void {
  const geojson = droneAttacksToGeoJSON(attacks);
  const jsonString = JSON.stringify(geojson, null, 2);
  const blob = new Blob([jsonString], { type: 'application/geo+json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `drone-attacks-${new Date().toISOString().split('T')[0]}.geojson`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Calculate total distance of flight path
 */
function calculatePathDistance(path: Array<{ lat: number; lon: number }>): number {
  if (path.length < 2) return 0;

  let totalDistance = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const lat1 = (path[i].lat * Math.PI) / 180;
    const lon1 = (path[i].lon * Math.PI) / 180;
    const lat2 = (path[i + 1].lat * Math.PI) / 180;
    const lon2 = (path[i + 1].lon * Math.PI) / 180;

    // Haversine formula
    const dlat = lat2 - lat1;
    const dlon = lon2 - lon1;
    const a = Math.sin(dlat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const R = 6371; // Earth radius in km

    totalDistance += R * c;
  }

  return Math.round(totalDistance * 10) / 10; // One decimal place
}

/**
 * Export to CSV format
 */
export function exportDroneDataAsCSV(attacks: DroneAttack[], filename?: string): void {
  const rows: string[] = [
    ['ID', 'Date', 'Type', 'Status', 'Origin', 'Target', 'Casualties', 'Assessment'].join(','),
  ];

  attacks.forEach(attack => {
    rows.push(
      [
        attack.id,
        attack.date,
        attack.type,
        attack.status,
        attack.origin.location,
        attack.target.location,
        attack.casualties || '',
        `"${attack.assessment.replace(/"/g, '""')}"`,
      ].join(',')
    );
  });

  const csvString = rows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `drone-attacks-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
