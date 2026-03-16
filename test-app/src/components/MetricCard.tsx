import React from 'react';
import {
  Card,
  CardHeader,
  Text,
  tokens,
} from '@fluentui/react-components';

export function MetricCard({ label, value, change, trend }: {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'flat';
}) {
  const trendColor = trend === 'up'
    ? tokens.colorPaletteGreenForeground1
    : trend === 'down'
    ? tokens.colorPaletteRedForeground1
    : tokens.colorNeutralForeground3;
  const arrow = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';

  return (
    <Card style={{ flex: 1, minWidth: 0 }}>
      <Text size={200} weight="medium" style={{ color: tokens.colorNeutralForeground3 }}>
        {label}
      </Text>
      <Text size={800} weight="bold" style={{ lineHeight: 1.1 }}>
        {value}
      </Text>
      <Text size={200} weight="medium" style={{ color: trendColor }}>
        {arrow} {change}
      </Text>
    </Card>
  );
}
