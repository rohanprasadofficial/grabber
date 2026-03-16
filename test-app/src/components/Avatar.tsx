import React from 'react';

const palette = ['#5b5fc7', '#0078d4', '#107c10', '#d13438', '#ca5010', '#8764b8', '#008272', '#4f6bed'];

function colorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

export function Avatar({ name, size = 32, src }: { name: string; size?: number; src?: string }) {
  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  const bg = colorFromName(name);

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
        }}
      />
    );
  }

  return (
    <div
      title={name}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        background: bg,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: `${Math.round(size * 0.38)}px`,
        fontWeight: 600,
        flexShrink: 0,
        letterSpacing: '-0.02em',
      }}
    >
      {initials}
    </div>
  );
}
