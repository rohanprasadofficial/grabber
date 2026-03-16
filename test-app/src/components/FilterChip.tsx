import React from 'react';
import { Select } from '@fluentui/react-components';

export function FilterChip({ label, value, options, onChange }: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <Select
      value={value}
      onChange={(_e, data) => onChange(data.value)}
      size="small"
      appearance="outline"
    >
      <option value="">{label}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </Select>
  );
}
