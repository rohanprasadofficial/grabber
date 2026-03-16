import React, { useState } from 'react';
import {
  TabList,
  Tab,
  SelectTabEvent,
  SelectTabData,
} from '@fluentui/react-components';

interface TabItem {
  label: string;
  content: React.ReactNode;
}

export function Tabs({ tabs, defaultIndex = 0 }: { tabs: TabItem[]; defaultIndex?: number }) {
  const [active, setActive] = useState(defaultIndex);

  const onTabSelect = (_event: SelectTabEvent, data: SelectTabData) => {
    setActive(Number(data.value));
  };

  return (
    <div>
      <TabList
        selectedValue={active}
        onTabSelect={onTabSelect}
        style={{ marginBottom: '16px' }}
      >
        {tabs.map((tab, i) => (
          <Tab key={tab.label} value={i}>
            {tab.label}
          </Tab>
        ))}
      </TabList>
      <div>{tabs[active]?.content}</div>
    </div>
  );
}
