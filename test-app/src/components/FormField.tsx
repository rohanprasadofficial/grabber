import React from 'react';

export function TextInput({ label, value, onChange, placeholder }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#424242', marginBottom: '4px' }}>
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '6px 12px',
          borderRadius: '4px',
          border: '1px solid #d1d1d1',
          fontSize: '13px',
          color: '#242424',
          boxSizing: 'border-box',
          outline: 'none',
        }}
      />
    </div>
  );
}

export function SelectInput({ label, value, options, onChange }: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#424242', marginBottom: '4px' }}>
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '6px 12px',
          borderRadius: '4px',
          border: '1px solid #d1d1d1',
          fontSize: '13px',
          color: '#242424',
          background: '#fff',
          boxSizing: 'border-box',
          outline: 'none',
        }}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

export function ToggleField({ label, description, checked, onChange }: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
      <div>
        <div style={{ fontSize: '13px', fontWeight: 500, color: '#242424' }}>{label}</div>
        {description && <div style={{ fontSize: '12px', color: '#8a8a8a', marginTop: '2px' }}>{description}</div>}
      </div>
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: '36px',
          height: '20px',
          borderRadius: '10px',
          background: checked ? '#0078d4' : '#c8c8c8',
          position: 'relative',
          cursor: 'pointer',
          flexShrink: 0,
          marginTop: '2px',
        }}
      >
        <div style={{
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          background: '#fff',
          position: 'absolute',
          top: '2px',
          left: checked ? '18px' : '2px',
          transition: 'left 0.15s ease',
          boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
        }} />
      </div>
    </div>
  );
}
