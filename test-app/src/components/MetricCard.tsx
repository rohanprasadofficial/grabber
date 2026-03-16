import React from 'react';

export function MetricCard({ label, value, change, trend }: {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'flat';
}) {
  const trendColor = trend === 'up' ? '#107c10' : trend === 'down' ? '#d13438' : '#616161';
  const arrow = trend === 'up' ? '\u2191' : trend === 'down' ? '\u2193' : '\u2192';

  return (
    <div style={{
      padding: '16px 20px',
      borderRadius: '8px',
      border: '1px solid #e0e0e0',
      background: '#fff',
      flex: 1,
      minWidth: 0,
    }}>
      <div style={{ fontSize: '12px', color: '#616161', fontWeight: 500, marginBottom: '6px' }}>
        {label}
      </div>
      <div style={{ fontSize: '28px', fontWeight: 700, color: '#242424', lineHeight: 1.1 }}>
        {value}
      </div>
      <div style={{ fontSize: '12px', color: trendColor, marginTop: '6px', fontWeight: 500 }}>
        {arrow} {change}
      </div>
    </div>
  );
}
