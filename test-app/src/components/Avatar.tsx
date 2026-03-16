import React from 'react';
import { Avatar as FluentAvatar } from '@fluentui/react-components';

export function Avatar({ name, size = 32, src }: { name: string; size?: number; src?: string }) {
  // Map pixel sizes to Fluent Avatar sizes
  const fluentSize = size <= 20 ? 20 : size <= 24 ? 24 : size <= 28 ? 28 : size <= 32 ? 32 : size <= 36 ? 36 : size <= 40 ? 40 : size <= 48 ? 48 : size <= 56 ? 56 : size <= 64 ? 64 : 72;

  return (
    <FluentAvatar
      name={name}
      image={src ? { src } : undefined}
      size={fluentSize as 20 | 24 | 28 | 32 | 36 | 40 | 48 | 56 | 64 | 72}
      color="colorful"
    />
  );
}
