import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  disabled?: boolean;
}

const variantStyles = {
  primary:   { bg: '#0078d4', color: '#fff', border: 'none', hoverBg: '#106ebe' },
  secondary: { bg: '#fff', color: '#242424', border: '1px solid #d1d1d1', hoverBg: '#f5f5f5' },
  ghost:     { bg: 'transparent', color: '#0078d4', border: 'none', hoverBg: '#f0f0f0' },
  danger:    { bg: '#d13438', color: '#fff', border: 'none', hoverBg: '#a4262c' },
};

export function Button({ children, onClick, variant = 'secondary', size = 'md', disabled }: ButtonProps) {
  const v = variantStyles[variant];
  const pad = size === 'sm' ? '4px 12px' : '6px 16px';
  const fontSize = size === 'sm' ? '12px' : '13px';

  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{
        padding: pad,
        borderRadius: '4px',
        border: v.border,
        background: disabled ? '#f0f0f0' : v.bg,
        color: disabled ? '#a0a0a0' : v.color,
        fontSize,
        fontWeight: 500,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        lineHeight: '20px',
      }}
    >
      {children}
    </button>
  );
}

export function IconButton({ icon, label, onClick }: { icon: string; label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      title={label}
      style={{
        width: '28px',
        height: '28px',
        borderRadius: '4px',
        border: '1px solid #e0e0e0',
        background: '#fff',
        color: '#616161',
        fontSize: '14px',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
      }}
    >
      {icon}
    </button>
  );
}
