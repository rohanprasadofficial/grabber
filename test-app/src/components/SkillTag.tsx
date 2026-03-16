import React from 'react';
import { Badge as FluentBadge } from '@fluentui/react-components';

export function SkillTag({ label }: { label: string }) {
  return (
    <FluentBadge appearance="outline" color="informative" shape="rounded">
      {label}
    </FluentBadge>
  );
}

export function SkillList({ skills }: { skills: string[] }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
      {skills.map((skill) => (
        <SkillTag key={skill} label={skill} />
      ))}
    </div>
  );
}
