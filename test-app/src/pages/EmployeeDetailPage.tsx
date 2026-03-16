import React from 'react';
import { Card, Text, tokens } from '@fluentui/react-components';
import { Employee } from '../data/employees';
import { ProfileHeader } from '../components/ProfileHeader';
import { Tabs } from '../components/Tabs';
import { InfoGrid } from '../components/InfoGrid';
import { SkillList } from '../components/SkillTag';
import { ProgressBar } from '../components/ProgressBar';
import { Timeline } from '../components/Timeline';
import { Badge } from '../components/Badge';

function OverviewTab({ employee }: { employee: Employee }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
      <Card>
        <Text size={400} weight="semibold" block style={{ marginBottom: '16px' }}>Employee Info</Text>
        <InfoGrid items={[
          { label: 'Employee ID', value: employee.id },
          { label: 'Manager', value: employee.manager },
          { label: 'Start Date', value: new Date(employee.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) },
          { label: 'Level', value: employee.level },
          { label: 'Cost Center', value: employee.costCenter },
          { label: 'Phone', value: employee.phone },
        ]} />
      </Card>
      <Card>
        <Text size={400} weight="semibold" block style={{ marginBottom: '16px' }}>Skills</Text>
        <SkillList skills={employee.skills} />
      </Card>
    </div>
  );
}

function PerformanceTab({ employee }: { employee: Employee }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
      <Card>
        <Text size={400} weight="semibold" block style={{ marginBottom: '16px' }}>Goals</Text>
        {employee.goals.map((goal) => (
          <ProgressBar key={goal.name} label={goal.name} value={goal.progress} />
        ))}
      </Card>
      <Card>
        <Text size={400} weight="semibold" block style={{ marginBottom: '16px' }}>Review History</Text>
        {employee.reviews.map((review) => (
          <div key={review.period} style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: `1px solid ${tokens.colorNeutralStroke3}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Text weight="semibold" size={300}>{review.period}</Text>
              <Badge
                text={`${review.rating}/5`}
                variant={review.rating >= 4 ? 'success' : review.rating >= 3 ? 'info' : 'warning'}
              />
            </div>
            <Text size={300} style={{ color: tokens.colorNeutralForeground3, lineHeight: '1.5' }}>
              {review.summary}
            </Text>
          </div>
        ))}
      </Card>
    </div>
  );
}

function ActivityTab({ employee }: { employee: Employee }) {
  return (
    <div style={{ maxWidth: '600px' }}>
      <Timeline items={employee.activity} />
    </div>
  );
}

export function EmployeeDetailPage({ employee, onBack }: { employee: Employee; onBack: () => void }) {
  return (
    <main style={{ flex: 1, overflow: 'auto' }}>
      <ProfileHeader employee={employee} onBack={onBack} />
      <div style={{ padding: '24px' }}>
        <Tabs tabs={[
          { label: 'Overview', content: <OverviewTab employee={employee} /> },
          { label: 'Performance', content: <PerformanceTab employee={employee} /> },
          { label: 'Activity', content: <ActivityTab employee={employee} /> },
        ]} />
      </div>
    </main>
  );
}
