import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { DroneAttack } from '../data/geo';

interface UseDroneVisualizationProps {
  mapRef: React.MutableRefObject<any>;
  layersRef: React.MutableRefObject<any>;
  droneAttacks: DroneAttack[];
  visible: boolean;
  onDroneSelected?: (drone: DroneAttack) => void;
}

// Color coding by attack status
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'confirmed':
      return '#ef4444'; // Red - confirmed
    case 'claimed':
      return '#f59e0b'; // Amber - claimed
    case 'disputed':
      return '#fbbf24'; // Orange - disputed
    default:
      return '#9ca3af'; // Gray - unknown
  }
};

// Status label in Hebrew
const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'confirmed':
      return 'מאומת ✅';
    case 'claimed':
      return 'טוען 🔊';
    case 'disputed':
      return 'מעורער ⚠️';
    default:
      return 'לא ידוע';
  }
};

// Target type label in Hebrew
const getTargetTypeLabel = (type: string): string => {
  switch (type) {
    case 'military-base':
      return 'בסיס צבאי 🏗️';
    case 'military-patrol':
      return 'כוח צבאי 🛖';
    case 'civilian-area':
      return 'אזור אזרחי 🏘️';
    case 'reconnaissance':
      return 'סיור מודיעיני 📡';
    case 'idf-in-lebanon':
      return 'כוחות בלבנון 🚁';
    default:
      return type;
  }
};

export const useDroneVisualization = (props: UseDroneVisualizationProps) => {
  const droneLayerRef = useRef<L.FeatureGroup | null>(null);

  useEffect(() => {
    const map = props.mapRef.current;
    const layers = props.layersRef.current;

    if (!map || !layers) return;

    // Clear existing drone layer
    if (droneLayerRef.current) {
      droneLayerRef.current.clearLayers();
    }

    if (!props.visible || props.droneAttacks.length === 0) {
      return;
    }

    // Create drone layer group if it doesn't exist
    if (!droneLayerRef.current) {
      droneLayerRef.current = L.featureGroup().addTo(map);
      layers.drones = droneLayerRef.current;
    }

    const statusColor = (status: string) => getStatusColor(status);

    // Render each drone attack
    props.droneAttacks.forEach((drone) => {
      const color = statusColor(drone.status);

      // Origin marker (launch point)
      const originIcon = L.divIcon({
        className: 'drone-origin-marker',
        html: `<div style="width: 16px; height: 16px; background: ${color}; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 8px rgba(0,0,0,0.5);"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      L.marker([drone.origin.lat, drone.origin.lon], { icon: originIcon, interactive: true })
        .bindPopup(
          `<div style="font-size: 12px; text-align: right; direction: rtl; max-width: 220px;">
            <strong>${drone.origin.location}</strong> (${drone.origin.country === 'LB' ? 'לבנון 🇱🇧' : 'סוריה 🇸🇾'})<br/>
            <small>תאריך: ${new Date(drone.date).toLocaleDateString('he-IL')}</small><br/>
            <small style="color: #999;">קואורדינטות: ${drone.origin.lat.toFixed(4)}, ${drone.origin.lon.toFixed(4)}</small>
          </div>`
        )
        .addTo(droneLayerRef.current!);

      // Target marker (impact point)
      const targetIcon = L.divIcon({
        className: 'drone-target-marker',
        html: `<div style="width: 20px; height: 20px; background: ${color}; clip-path: polygon(50% 0%, 0% 38%, 38% 38%, 38% 100%, 62% 100%, 62% 38%, 100% 38%); box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      L.marker([drone.target.lat, drone.target.lon], { icon: targetIcon, interactive: true })
        .bindPopup(createTargetPopup(drone))
        .addTo(droneLayerRef.current!);

      // Flight path line
      const pathLatLngs = drone.flightPath.map((point) => [point.lat, point.lon] as [number, number]);

      L.polyline(pathLatLngs, {
        color: color,
        weight: 2,
        opacity: 0.6,
        dashArray: '5, 5',
        lineCap: 'round',
        lineJoin: 'round',
        interactive: true,
      })
        .bindPopup(createFlightPathPopup(drone))
        .addTo(droneLayerRef.current!);

      // Animated arrow along the path (optional, for visual interest)
      if (pathLatLngs.length >= 2) {
        // Add small decorative markers along the path
        const step = Math.max(1, Math.floor(pathLatLngs.length / 4));
        for (let i = step; i < pathLatLngs.length; i += step) {
          const arrowIcon = L.divIcon({
            className: 'drone-path-point',
            html: `<div style="width: 6px; height: 6px; background: ${color}; border-radius: 50%; opacity: 0.5;"></div>`,
            iconSize: [6, 6],
            iconAnchor: [3, 3],
          });

          L.marker(pathLatLngs[i], { icon: arrowIcon, interactive: false }).addTo(droneLayerRef.current!);
        }
      }
    });

    return () => {
      if (droneLayerRef.current) {
        droneLayerRef.current.clearLayers();
      }
    };
  }, [props.visible, props.droneAttacks, props.mapRef, props.layersRef]);

  return {
    droneLayer: droneLayerRef.current,
  };
};

// Helper function to create target popup
function createTargetPopup(drone: DroneAttack): string {
  const statusLabel = getStatusLabel(drone.status);
  const casualtyInfo = drone.casualties ? `<strong>נפגעים:</strong> ${drone.casualties}<br/>` : '<strong>נפגעים:</strong> 0<br/>';
  const targetTypeLabel = getTargetTypeLabel(drone.targetType);

  return `
    <div style="font-size: 12px; text-align: right; direction: rtl; max-width: 280px; line-height: 1.5;">
      <strong style="font-size: 13px;">${drone.target.location}</strong><br/>
      <strong>תאריך:</strong> ${new Date(drone.date).toLocaleDateString('he-IL')}<br/>
      <strong>סטטוס:</strong> ${statusLabel}<br/>
      <strong>סוג מטרה:</strong> ${targetTypeLabel}<br/>
      ${casualtyInfo}
      <strong>הערכה:</strong> ${drone.assessment}<br/>
      <strong>פרטים:</strong> ${drone.details}<br/>
      <small style="color: #999; font-size: 11px;">קואורדינטות: ${drone.target.lat.toFixed(4)}, ${drone.target.lon.toFixed(4)}</small>
    </div>
  `;
}

// Helper function to create flight path popup
function createFlightPathPopup(drone: DroneAttack): string {
  const sources = drone.sources.map((s) => `<a href="${s.url}" target="_blank" rel="noopener">${s.label}</a>`).join(', ');

  return `
    <div style="font-size: 11px; text-align: right; direction: rtl; max-width: 280px;">
      <strong>מסלול טיסה</strong><br/>
      <strong>מ:</strong> ${drone.origin.location}<br/>
      <strong>אל:</strong> ${drone.target.location}<br/>
      <strong>מקורות:</strong> ${sources}<br/>
      <small style="color: #666;">נקודות נתונים: ${drone.flightPath.length}</small>
    </div>
  `;
}
