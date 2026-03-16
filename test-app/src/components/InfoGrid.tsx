import React from 'react';

interface InfoItem {
  label: string;
  value: string;
}

export function InfoGrid({ items }: { items: InfoItem[] }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '16px',
    }}>
      {items.map((item) => (
        <div key={item.label}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#8a8a8a', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '4px' }}>
            {item.label}
          </div>
          <div style={{ fontSize: '13px', color: '#242424' }}>
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}
