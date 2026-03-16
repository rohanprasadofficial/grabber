import React from 'react';
import { Employee } from '../data/employees';
import { Avatar } from './Avatar';
import { Badge, StatusDot } from './Badge';
import { Button } from './Button';

function statusVariant(status: Employee['status']) {
  if (status === 'Active') return 'success' as const;
  if (status === 'On Leave') return 'warning' as const;
  return 'error' as const;
}

export function ProfileHeader({ employee, onBack }: { employee: Employee; onBack: () => void }) {
  return (
    <div style={{
      padding: '24px',
      background: '#fff',
      borderBottom: '1px solid #e0e0e0',
    }}>
      <button
        onClick={onBack}
        style={{
          border: 'none',
          background: 'transparent',
          color: '#0078d4',
          fontSize: '13px',
          cursor: 'pointer',
          padding: 0,
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        &larr; Back to People
      </button>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
        <Avatar name={employee.name} size={64} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#242424', margin: 0 }}>
              {employee.name}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <StatusDot status={employee.status} />
              <Badge text={employee.status} variant={statusVariant(employee.status)} />
            </div>
          </div>
          <div style={{ fontSize: '14px', color: '#616161', marginBottom: '2px' }}>
            {employee.title} &middot; {employee.department}
          </div>
          <div style={{ fontSize: '13px', color: '#8a8a8a' }}>
            {employee.location} &middot; {employee.email}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="secondary">Edit Profile</Button>
          <Button variant="primary">Send Message</Button>
        </div>
      </div>
    </div>
  );
}
