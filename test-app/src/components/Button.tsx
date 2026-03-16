import React from 'react';
import {
  Button as FluentButton,
  Tooltip,
} from '@fluentui/react-components';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  disabled?: boolean;
}

export function Button({ children, onClick, variant = 'secondary', size = 'md', disabled }: ButtonProps) {
  const appearance = variant === 'primary' ? 'primary'
    : variant === 'ghost' ? 'transparent'
    : variant === 'danger' ? 'primary'
    : 'secondary';

  return (
    <FluentButton
      appearance={appearance}
      size={size === 'sm' ? 'small' : 'medium'}
      disabled={disabled}
      onClick={onClick}
      style={variant === 'danger' ? { backgroundColor: '#d13438', borderColor: '#d13438' } : undefined}
    >
      {children}
    </FluentButton>
  );
}

export function IconButton({ icon, label, onClick }: { icon: string; label: string; onClick?: () => void }) {
  return (
    <Tooltip content={label} relationship="label">
      <FluentButton
        appearance="subtle"
        size="small"
        onClick={onClick}
        icon={<span>{icon}</span>}
      />
    </Tooltip>
  );
}
