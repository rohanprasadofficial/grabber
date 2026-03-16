import React from 'react';

export function ProgressBar({ value, label, showPercent = true }: { value: number; label: string; showPercent?: boolean }) {
  const color = value >= 80 ? '#107c10' : value >= 50 ? '#0078d4' : '#ca5010';

  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
        <span style={{ fontSize: '12px', color: '#424242' }}>{label}</span>
        {showPercent && <span style={{ fontSize: '12px', color: '#616161' }}>{value}%</span>}
      </div>
      <div style={{
        height: '6px',
        borderRadius: '3px',
        background: '#f0f0f0',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${Math.min(100, value)}%`,
          height: '100%',
          borderRadius: '3px',
          background: color,
        }} />
      </div>
    </div>
  );
}
