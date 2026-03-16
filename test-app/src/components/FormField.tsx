import React from 'react';
import {
  Input,
  Label,
  Select,
  Switch,
  Text,
  tokens,
  Field,
} from '@fluentui/react-components';

export function TextInput({ label, value, onChange, placeholder }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <Field label={label} style={{ marginBottom: '16px' }}>
      <Input
        value={value}
        onChange={(_e, data) => onChange(data.value)}
        placeholder={placeholder}
      />
    </Field>
  );
}

export function SelectInput({ label, value, options, onChange }: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <Field label={label} style={{ marginBottom: '16px' }}>
      <Select
        value={value}
        onChange={(_e, data) => onChange(data.value)}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </Select>
    </Field>
  );
}

export function ToggleField({ label, description, checked, onChange }: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      padding: '12px 0',
      borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    }}>
      <div>
        <Text weight="medium" size={300}>{label}</Text>
        {description && (
          <Text size={200} style={{ display: 'block', color: tokens.colorNeutralForeground4, marginTop: '2px' }}>
            {description}
          </Text>
        )}
      </div>
      <Switch
        checked={checked}
        onChange={(_e, data) => onChange(data.checked)}
      />
    </div>
  );
}
