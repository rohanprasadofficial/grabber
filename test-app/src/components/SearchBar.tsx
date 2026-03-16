import React from 'react';

export function SearchBar({ value, onChange, placeholder = 'Search...' }: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '6px 12px',
      borderRadius: '4px',
      border: '1px solid #d1d1d1',
      background: '#fff',
      width: '280px',
    }}>
      <span style={{ color: '#8a8a8a', fontSize: '13px', flexShrink: 0 }}>&#128269;</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          border: 'none',
          outline: 'none',
          fontSize: '13px',
          color: '#242424',
          flex: 1,
          background: 'transparent',
          minWidth: 0,
        }}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          style={{ border: 'none', background: 'transparent', color: '#8a8a8a', cursor: 'pointer', padding: '0 2px', fontSize: '14px' }}
        >
          &times;
        </button>
      )}
    </div>
  );
}
