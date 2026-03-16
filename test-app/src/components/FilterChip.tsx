import React from 'react';

export function FilterChip({ label, value, options, onChange }: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        padding: '4px 10px',
        borderRadius: '4px',
        border: '1px solid #d1d1d1',
        background: value ? '#eff6fc' : '#fff',
        color: value ? '#0078d4' : '#616161',
        fontSize: '12px',
        fontWeight: value ? 600 : 400,
        cursor: 'pointer',
        outline: 'none',
      }}
    >
      <option value="">{label}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  );
}
