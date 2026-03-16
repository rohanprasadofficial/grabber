import React from 'react';
import { Badge } from './Badge';
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
        borderRadius: '6px',
        background: active ? '#eff6fc' : 'transparent',
        color: active ? '#0078d4' : '#424242',
        fontSize: '13px',
        fontWeight: active ? 600 : 400,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      {label}
      {badge && <Badge text={badge} variant="info" />}
    </div>
  );
}

export function Sidebar({ activePage, onNavigate }: { activePage: Page; onNavigate: (page: Page) => void }) {
  return (
    <aside style={{
      width: '200px',
      padding: '16px 8px',
      borderRight: '1px solid #e0e0e0',
      background: '#fafafa',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      flexShrink: 0,
      overflowY: 'auto',
    }}>
      {sections.map((section) => (
        <div key={section.title} style={{ marginBottom: '12px' }}>
          <div style={{
            fontSize: '11px',
            fontWeight: 600,
            color: '#8a8a8a',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            padding: '0 12px 6px',
          }}>
            {section.title}
          </div>
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
