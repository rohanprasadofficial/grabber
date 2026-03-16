import React from 'react';
import {
  Text,
  tokens,
  TabList,
  Tab,
  SelectTabEvent,
  SelectTabData,
} from '@fluentui/react-components';
import { Avatar } from './Avatar';
import { Page } from '../hooks/useAppState';

const navItems: { label: string; page: Page }[] = [
  { label: 'Dashboard', page: 'dashboard' },
  { label: 'People', page: 'people' },
  { label: 'Settings', page: 'settings' },
];

export function Header({ activePage, onNavigate }: { activePage: Page; onNavigate: (page: Page) => void }) {
  const onTabSelect = (_event: SelectTabEvent, data: SelectTabData) => {
    onNavigate(data.value as Page);
  };

  return (
    <header style={{
      height: '48px',
      padding: '0 24px',
      background: tokens.colorNeutralBackground1,
      borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          onClick={() => onNavigate('dashboard')}
        >
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: tokens.borderRadiusMedium,
            background: tokens.colorBrandBackground,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: tokens.colorNeutralForegroundOnBrand,
            fontWeight: 700,
            fontSize: '13px',
          }}>
            C
          </div>
          <Text weight="semibold" size={300}>
            Contoso HR
          </Text>
        </div>

        <TabList
          selectedValue={activePage}
          onTabSelect={onTabSelect}
          size="small"
        >
          {navItems.map(({ label, page }) => (
            <Tab key={page} value={page}>
              {label}
            </Tab>
          ))}
        </TabList>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
          admin@contoso.com
        </Text>
        <Avatar name="Admin User" size={28} />
      </div>
    </header>
  );
}
