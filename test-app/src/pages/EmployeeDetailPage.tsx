import React from 'react';
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
      <div style={{ padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', background: '#fff' }}>
        <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#242424', margin: '0 0 16px' }}>Employee Info</h4>
        <InfoGrid items={[
          { label: 'Employee ID', value: employee.id },
          { label: 'Manager', value: employee.manager },
          { label: 'Start Date', value: new Date(employee.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) },
          { label: 'Level', value: employee.level },
          { label: 'Cost Center', value: employee.costCenter },
          { label: 'Phone', value: employee.phone },
        ]} />
      </div>
      <div style={{ padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', background: '#fff' }}>
        <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#242424', margin: '0 0 16px' }}>Skills</h4>
        <SkillList skills={employee.skills} />
      </div>
    </div>
  );
}

function PerformanceTab({ employee }: { employee: Employee }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
      <div style={{ padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', background: '#fff' }}>
        <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#242424', margin: '0 0 16px' }}>Goals</h4>
        {employee.goals.map((goal) => (
          <ProgressBar key={goal.name} label={goal.name} value={goal.progress} />
        ))}
      </div>
      <div style={{ padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', background: '#fff' }}>
        <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#242424', margin: '0 0 16px' }}>Review History</h4>
        {employee.reviews.map((review) => (
          <div key={review.period} style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #f0f0f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#242424' }}>{review.period}</span>
              <Badge
                text={`${review.rating}/5`}
                variant={review.rating >= 4 ? 'success' : review.rating >= 3 ? 'info' : 'warning'}
              />
            </div>
            <p style={{ fontSize: '13px', color: '#616161', margin: 0, lineHeight: '1.5' }}>
              {review.summary}
            </p>
          </div>
        ))}
      </div>
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
