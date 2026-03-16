import React from 'react';

export function SkillTag({ label }: { label: string }) {
  return (
    <span style={{
      display: 'inline-flex',
      padding: '3px 10px',
      borderRadius: '4px',
      background: '#f0f0f0',
      color: '#424242',
      fontSize: '12px',
      fontWeight: 500,
    }}>
      {label}
    </span>
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
