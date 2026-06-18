import React from 'react';
import type { DroneAttack } from '../../../data/geo';

interface DroneSummaryPanelProps {
  attacks: DroneAttack[];
  statistics: {
    totalAttacks: number;
    totalCasualties: number;
    confirmedCount: number;
    claimedCount: number;
    disputedCount: number;
    casualtiesByYear: Record<number, number>;
    attacksByYear: Record<number, number>;
    averageDistance: number;
  };
  onShowOnlyCasualties: (show: boolean) => void;
  showOnlyCasualties: boolean;
}

export const DroneSummaryPanel: React.FC<DroneSummaryPanelProps> = ({
  attacks,
  statistics,
  onShowOnlyCasualties,
  showOnlyCasualties,
}) => {
  if (attacks.length === 0) {
    return (
      <div className="panel-section">
        <p className="legend-note" style={{ color: 'var(--text-muted)' }}>
          אין התקפות כלים תואמות לפילטרים שנבחרו
        </p>
      </div>
    );
  }

  return (
    <div className="panel-section drone-summary">
      <h4 style={{ margin: '10px 0 8px' }}>סטטיסטיקה</h4>

      {/* Key Metrics */}
      <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
        <div className="kpi-card" style={{ padding: '8px', background: 'var(--bg-2)', borderRadius: '4px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>סה״כ התקפות</div>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#ef4444' }}>
            {statistics.totalAttacks}
          </div>
        </div>

        <div className="kpi-card" style={{ padding: '8px', background: 'var(--bg-2)', borderRadius: '4px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>סה״כ נפגעים</div>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#dc2626' }}>
            {statistics.totalCasualties}
          </div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-muted)' }}>
          סטטוס התקפות
        </div>
        <div style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
          <div style={{ flex: 1 }}>
            <span style={{ color: '#ef4444' }}>🔴</span> {statistics.confirmedCount} מאומת
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ color: '#f59e0b' }}>🟠</span> {statistics.claimedCount} טוען
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ color: '#fbbf24' }}>🟡</span> {statistics.disputedCount} מעורער
          </div>
        </div>
      </div>

      {/* Attacks by Year */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-muted)' }}>
          התפלגות לפי שנה
        </div>
        {[2024, 2025, 2026].map(year => (
          <div key={year} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
            <span>{year}: {statistics.attacksByYear[year] || 0} התקפות</span>
            <span style={{ fontWeight: '600' }}>{statistics.casualtiesByYear[year] || 0} נפגעים</span>
          </div>
        ))}
      </div>

      {/* Average Distance */}
      <div style={{ marginBottom: '12px', padding: '8px', background: 'var(--bg-2)', borderRadius: '4px' }}>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          ממוצע מרחק מגבול
        </div>
        <div style={{ fontSize: '14px', fontWeight: '600' }}>
          {statistics.averageDistance} ק״מ
        </div>
      </div>

      {/* Filter Options */}
      <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
        <div
          onClick={() => onShowOnlyCasualties(!showOnlyCasualties)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px',
            cursor: 'pointer',
            borderRadius: '4px',
            background: showOnlyCasualties ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
            fontSize: '12px',
          }}
        >
          <input
            type="checkbox"
            checked={showOnlyCasualties}
            onChange={() => {}}
            style={{ cursor: 'pointer' }}
          />
          <span>הצג רק התקפות עם נפגעים</span>
        </div>
      </div>

      {/* Info Note */}
      <p className="legend-note" style={{ marginTop: '10px', fontSize: '11px' }}>
        סטטיסטיקה מבוססת על התקפות הנראות לפי פילטרים פעילים
      </p>
    </div>
  );
};
