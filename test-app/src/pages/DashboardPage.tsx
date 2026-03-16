import React from 'react';
import {
  Card,
  Text,
  tokens,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  TableCellLayout,
  ProgressBar as FluentProgressBar,
} from '@fluentui/react-components';
import { Employee } from '../data/employees';
import { MetricCard } from '../components/MetricCard';
import { Avatar } from '../components/Avatar';
import { Badge } from '../components/Badge';

function RecentHireRow({ emp, onClick }: { emp: Employee; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 0',
        borderBottom: `1px solid ${tokens.colorNeutralStroke3}`,
        cursor: 'pointer',
      }}
    >
      <Avatar name={emp.name} size={32} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <Text weight="medium" size={300} style={{ display: 'block' }}>{emp.name}</Text>
        <Text size={200} style={{ color: tokens.colorNeutralForeground4 }}>{emp.title}</Text>
      </div>
      <Badge text={emp.department} variant="neutral" />
    </div>
  );
}

function DepartmentBar({ department, count, total, color }: { department: string; count: number; total: number; color: string }) {
  const pct = Math.round((count / total) * 100);
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
        <Text size={200}>{department}</Text>
        <Text size={200} style={{ color: tokens.colorNeutralForeground4 }}>{count} ({pct}%)</Text>
      </div>
      <div style={{ height: '8px', borderRadius: '4px', background: tokens.colorNeutralBackground4, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: '4px', background: color }} />
      </div>
    </div>
  );
}

export function DashboardPage({ employees, onViewEmployee }: {
  employees: Employee[];
  onViewEmployee: (id: string) => void;
}) {
  const activeCount = employees.filter((e) => e.status === 'Active').length;
  const onLeaveCount = employees.filter((e) => e.status === 'On Leave').length;
  const offboardingCount = employees.filter((e) => e.status === 'Offboarding').length;
  const deptCounts: Record<string, number> = {};
  employees.forEach((e) => { deptCounts[e.department] = (deptCounts[e.department] || 0) + 1; });
  const deptColors: Record<string, string> = {
    'Engineering': '#0078d4', 'Design': '#8764b8', 'Product': '#ca5010',
    'Data & AI': '#107c10', 'Human Resources': '#d13438',
  };

  const recentHires = [...employees].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()).slice(0, 5);

  return (
    <main style={{ flex: 1, padding: '24px', overflow: 'auto' }}>
      <Text as="h2" size={500} weight="semibold" block style={{ marginBottom: '4px' }}>Dashboard</Text>
      <Text size={300} style={{ color: tokens.colorNeutralForeground3, display: 'block', marginBottom: '24px' }}>
        Organization overview and key metrics.
      </Text>

      {/* Metrics */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <MetricCard label="Total Employees" value={String(employees.length)} change="+2 this month" trend="up" />
        <MetricCard label="Active" value={String(activeCount)} change={`${onLeaveCount} on leave`} trend="flat" />
        <MetricCard label="Offboarding" value={String(offboardingCount)} change="1 this quarter" trend="down" />
        <MetricCard label="Avg Tenure" value="2.8 yr" change="+0.3 vs last year" trend="up" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Department breakdown */}
        <Card>
          <Text size={400} weight="semibold" block style={{ marginBottom: '16px' }}>
            Department Breakdown
          </Text>
          {Object.entries(deptCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([dept, count]) => (
              <DepartmentBar key={dept} department={dept} count={count} total={employees.length} color={deptColors[dept] || '#616161'} />
            ))
          }
        </Card>

        {/* Recent hires */}
        <Card>
          <Text size={400} weight="semibold" block style={{ marginBottom: '12px' }}>
            Recent Hires
          </Text>
          {recentHires.map((emp) => (
            <RecentHireRow key={emp.id} emp={emp} onClick={() => onViewEmployee(emp.id)} />
          ))}
        </Card>

        {/* Active Goals */}
        <Card style={{ gridColumn: 'span 2' }}>
          <Text size={400} weight="semibold" block style={{ marginBottom: '12px' }}>
            Active Goals Snapshot
          </Text>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Employee</TableHeaderCell>
                <TableHeaderCell>Goal</TableHeaderCell>
                <TableHeaderCell style={{ width: '200px' }}>Progress</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.slice(0, 6).flatMap((emp) =>
                emp.goals.slice(0, 1).map((goal) => (
                  <TableRow key={`${emp.id}-${goal.name}`}>
                    <TableCell>
                      <TableCellLayout media={<Avatar name={emp.name} size={24} />}>
                        <Text>{emp.name}</Text>
                      </TableCellLayout>
                    </TableCell>
                    <TableCell>
                      <Text style={{ color: tokens.colorNeutralForeground3 }}>{goal.name}</Text>
                    </TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FluentProgressBar
                          value={goal.progress / 100}
                          color={goal.progress >= 80 ? 'success' : goal.progress >= 50 ? 'brand' : 'warning'}
                          thickness="medium"
                          style={{ flex: 1 }}
                        />
                        <Text size={200} style={{ color: tokens.colorNeutralForeground3, width: '32px', textAlign: 'right' }}>
                          {goal.progress}%
                        </Text>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </main>
  );
}
