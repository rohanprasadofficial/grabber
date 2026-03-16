import React from 'react';
import { Text, tokens } from '@fluentui/react-components';
import { ArrowLeftRegular } from '@fluentui/react-icons';
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
      background: tokens.colorNeutralBackground1,
      borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    }}>
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeftRegular /> Back to People
      </Button>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', marginTop: '16px' }}>
        <Avatar name={employee.name} size={64} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <Text size={500} weight="semibold">
              {employee.name}
            </Text>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <StatusDot status={employee.status} />
              <Badge text={employee.status} variant={statusVariant(employee.status)} />
            </div>
          </div>
          <Text size={300} style={{ color: tokens.colorNeutralForeground3, display: 'block', marginBottom: '2px' }}>
            {employee.title} &middot; {employee.department}
          </Text>
          <Text size={200} style={{ color: tokens.colorNeutralForeground4 }}>
            {employee.location} &middot; {employee.email}
          </Text>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="secondary">Edit Profile</Button>
          <Button variant="primary">Send Message</Button>
        </div>
      </div>
    </div>
  );
}
