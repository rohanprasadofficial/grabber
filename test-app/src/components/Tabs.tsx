import React, { useState } from 'react';

interface Tab {
  label: string;
  content: React.ReactNode;
}

export function Tabs({ tabs, defaultIndex = 0 }: { tabs: Tab[]; defaultIndex?: number }) {
  const [active, setActive] = useState(defaultIndex);

  return (
    <div>
      <div style={{ display: 'flex', borderBottom: '1px solid #e0e0e0', marginBottom: '16px' }}>
        {tabs.map((tab, i) => (
          <button
            key={tab.label}
            onClick={() => setActive(i)}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderBottom: i === active ? '2px solid #0078d4' : '2px solid transparent',
              background: 'transparent',
              color: i === active ? '#0078d4' : '#616161',
              fontSize: '13px',
              fontWeight: i === active ? 600 : 400,
              cursor: 'pointer',
              marginBottom: '-1px',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div>{tabs[active]?.content}</div>
    </div>
  );
}
