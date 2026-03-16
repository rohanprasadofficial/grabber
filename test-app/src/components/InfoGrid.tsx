import React from 'react';
import { Text, tokens } from '@fluentui/react-components';

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
          <Text
            size={100}
            weight="semibold"
            style={{
              color: tokens.colorNeutralForeground4,
              textTransform: 'uppercase',
              letterSpacing: '0.3px',
              display: 'block',
              marginBottom: '4px',
            }}
          >
            {item.label}
          </Text>
          <Text size={300}>
            {item.value}
          </Text>
        </div>
      ))}
    </div>
  );
}
