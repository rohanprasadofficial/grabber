import React from 'react';
import { SearchBox } from '@fluentui/react-components';
import { DismissRegular } from '@fluentui/react-icons';

export function SearchBar({ value, onChange, placeholder = 'Search...' }: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <SearchBox
      value={value}
      onChange={(_e, data) => onChange(data.value)}
      placeholder={placeholder}
      dismiss={value ? <DismissRegular onClick={() => onChange('')} /> : null}
      style={{ width: '280px' }}
    />
  );
}
