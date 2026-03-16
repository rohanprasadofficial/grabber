import React from 'react';

export type BadgeVariant = 'info' | 'success' | 'warning' | 'error' | 'neutral';

const styles: Record<BadgeVariant, { bg: string; color: string }> = {
  info:    { bg: '#e8f4fd', color: '#0078d4' },
  success: { bg: '#dff6dd', color: '#107c10' },
  warning: { bg: '#fff4ce', color: '#797600' },
  error:   { bg: '#fde7e9', color: '#d13438' },
  neutral: { bg: '#f0f0f0', color: '#616161' },
};

export function Badge({ text, variant = 'neutral' }: { text: string; variant?: BadgeVariant }) {
  const s = styles[variant];
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 8px',
      borderRadius: '100px',
      background: s.bg,
      color: s.color,
      fontSize: '11px',
      fontWeight: 600,
      lineHeight: '16px',
      whiteSpace: 'nowrap',
    }}>
      {text}
    </span>
  );
}

export function StatusDot({ status }: { status: 'Active' | 'On Leave' | 'Offboarding' }) {
  const color = status === 'Active' ? '#107c10' : status === 'On Leave' ? '#ca5010' : '#d13438';
  return (
    <span style={{
      display: 'inline-block',
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      background: color,
      marginRight: '6px',
      flexShrink: 0,
    }} />
  );
}
