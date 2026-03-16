import React from 'react';
import { Avatar } from './Avatar';
import { Page } from '../hooks/useAppState';

const navItems: { label: string; page: Page }[] = [
  { label: 'Dashboard', page: 'dashboard' },
  { label: 'People', page: 'people' },
  { label: 'Settings', page: 'settings' },
];

export function Header({ activePage, onNavigate }: { activePage: Page; onNavigate: (page: Page) => void }) {
  return (
    <header style={{
      height: '48px',
      padding: '0 24px',
      background: '#fff',
      borderBottom: '1px solid #e0e0e0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => onNavigate('dashboard')}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            background: '#0078d4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 700,
            fontSize: '13px',
          }}>
            C
          </div>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#242424' }}>
            Contoso HR
          </span>
        </div>

        <nav style={{ display: 'flex', gap: '2px', marginLeft: '16px' }}>
          {navItems.map(({ label, page }) => (
            <button
              key={page}
              onClick={() => onNavigate(page)}
              style={{
                padding: '6px 14px',
                borderRadius: '4px',
                border: 'none',
                background: activePage === page ? '#eff6fc' : 'transparent',
                color: activePage === page ? '#0078d4' : '#616161',
                fontSize: '13px',
                fontWeight: activePage === page ? 600 : 400,
                cursor: 'pointer',
              }}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '13px', color: '#616161' }}>admin@contoso.com</span>
        <Avatar name="Admin User" size={28} />
      </div>
    </header>
  );
}
