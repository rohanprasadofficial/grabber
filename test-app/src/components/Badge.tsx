import React from 'react';
import { Badge as FluentBadge, PresenceBadge } from '@fluentui/react-components';

export type BadgeVariant = 'info' | 'success' | 'warning' | 'error' | 'neutral';

const variantMap: Record<BadgeVariant, 'informative' | 'success' | 'warning' | 'danger' | 'important'> = {
  info: 'informative',
  success: 'success',
  warning: 'warning',
  error: 'danger',
  neutral: 'important',
};

export function Badge({ text, variant = 'neutral' }: { text: string; variant?: BadgeVariant }) {
  return (
    <FluentBadge
      appearance="tint"
      color={variantMap[variant]}
      shape="rounded"
    >
      {text}
    </FluentBadge>
  );
}

export function StatusDot({ status }: { status: 'Active' | 'On Leave' | 'Offboarding' }) {
  const presenceStatus = status === 'Active' ? 'available' : status === 'On Leave' ? 'away' : 'busy';
  return (
    <PresenceBadge status={presenceStatus} size="tiny" style={{ marginRight: '6px' }} />
  );
}
