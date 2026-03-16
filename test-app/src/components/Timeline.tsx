import React from 'react';
import { Text, tokens } from '@fluentui/react-components';

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
          background: tokens.colorBrandBackground,
          border: `2px solid ${tokens.colorNeutralBackground1}`,
          boxShadow: `0 0 0 2px ${tokens.colorBrandBackground}`,
          zIndex: 1,
        }} />
        <div style={{ width: '2px', flex: 1, background: tokens.colorNeutralStroke2, marginTop: '4px' }} />
      </div>
      <div style={{ paddingBottom: '8px' }}>
        <Text size={200} style={{ color: tokens.colorNeutralForeground4, display: 'block', marginBottom: '2px' }}>
          {formatDate(item.date)}
        </Text>
        <Text size={300}>
          {item.event}
        </Text>
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
