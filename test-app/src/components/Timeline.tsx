import React from 'react';

interface TimelineItem {
  date: string;
  event: string;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function TimelineEntry({ item }: { item: TimelineItem }) {
  return (
    <div style={{ display: 'flex', gap: '12px', paddingBottom: '16px', position: 'relative' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <div style={{
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          background: '#0078d4',
          border: '2px solid #fff',
          boxShadow: '0 0 0 2px #0078d4',
          zIndex: 1,
        }} />
        <div style={{ width: '2px', flex: 1, background: '#e0e0e0', marginTop: '4px' }} />
      </div>
      <div style={{ paddingBottom: '8px' }}>
        <div style={{ fontSize: '12px', color: '#8a8a8a', marginBottom: '2px' }}>
          {formatDate(item.date)}
        </div>
        <div style={{ fontSize: '13px', color: '#242424' }}>
          {item.event}
        </div>
      </div>
    </div>
  );
}

export function Timeline({ items }: { items: TimelineItem[] }) {
  const sorted = [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div style={{ paddingTop: '4px' }}>
      {sorted.map((item, i) => (
        <TimelineEntry key={i} item={item} />
      ))}
    </div>
  );
}
