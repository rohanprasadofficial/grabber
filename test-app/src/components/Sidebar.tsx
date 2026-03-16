import React from 'react';
import {
  Text,
  Badge as FluentBadge,
  tokens,
} from '@fluentui/react-components';
import { Page } from '../hooks/useAppState';

interface NavItem {
  label: string;
  page: Page;
  badge?: string;
}

const sections: { title: string; items: NavItem[] }[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', page: 'dashboard' },
      { label: 'People', page: 'people', badge: '12' },
    ],
  },
  {
    title: 'Manage',
    items: [
      { label: 'Settings', page: 'settings' },
    ],
  },
];

function SidebarItem({ label, active, badge, onClick }: {
  label: string;
  active: boolean;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '7px 12px',
        borderRadius: tokens.borderRadiusMedium,
        background: active ? tokens.colorBrandBackground2 : 'transparent',
        color: active ? tokens.colorBrandForeground1 : tokens.colorNeutralForeground2,
        fontSize: '13px',
        fontWeight: active ? 600 : 400,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      {label}
      {badge && (
        <FluentBadge appearance="tint" color="informative" size="small" shape="rounded">
          {badge}
        </FluentBadge>
      )}
    </div>
  );
}

export function Sidebar({ activePage, onNavigate }: { activePage: Page; onNavigate: (page: Page) => void }) {
  return (
    <aside style={{
      width: '200px',
      padding: '16px 8px',
      borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
      background: tokens.colorNeutralBackground2,
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      flexShrink: 0,
      overflowY: 'auto',
    }}>
      {sections.map((section) => (
        <div key={section.title} style={{ marginBottom: '12px' }}>
          <Text
            size={100}
            weight="semibold"
            style={{
              color: tokens.colorNeutralForeground4,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              padding: '0 12px 6px',
              display: 'block',
            }}
          >
            {section.title}
          </Text>
          {section.items.map((item) => (
            <SidebarItem
              key={item.page}
              label={item.label}
              active={activePage === item.page}
              badge={item.badge}
              onClick={() => onNavigate(item.page)}
            />
          ))}
        </div>
      ))}
    </aside>
  );
}
