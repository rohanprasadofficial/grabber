import React from 'react';
import {
  ProgressBar as FluentProgressBar,
  Text,
  tokens,
} from '@fluentui/react-components';

export function ProgressBar({ value, label, showPercent = true }: { value: number; label: string; showPercent?: boolean }) {
  const color = value >= 80 ? 'success' : value >= 50 ? 'brand' : 'warning';

  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
        <Text size={200}>{label}</Text>
        {showPercent && (
          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
            {value}%
          </Text>
        )}
      </div>
      <FluentProgressBar
        value={value / 100}
        color={color}
        thickness="medium"
      />
    </div>
  );
}
