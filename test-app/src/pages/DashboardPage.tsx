import React from 'react';
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
        borderBottom: '1px solid #f5f5f5',
        cursor: 'pointer',
      }}
    >
      <Avatar name={emp.name} size={32} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: 500, color: '#242424' }}>{emp.name}</div>
        <div style={{ fontSize: '12px', color: '#8a8a8a' }}>{emp.title}</div>
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
        <span style={{ fontSize: '12px', color: '#424242' }}>{department}</span>
        <span style={{ fontSize: '12px', color: '#8a8a8a' }}>{count} ({pct}%)</span>
      </div>
      <div style={{ height: '8px', borderRadius: '4px', background: '#f0f0f0', overflow: 'hidden' }}>
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
      <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#242424', margin: '0 0 4px' }}>Dashboard</h2>
      <p style={{ fontSize: '13px', color: '#616161', margin: '0 0 24px' }}>
        Organization overview and key metrics.
      </p>

      {/* Metrics */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <MetricCard label="Total Employees" value={String(employees.length)} change="+2 this month" trend="up" />
        <MetricCard label="Active" value={String(activeCount)} change={`${onLeaveCount} on leave`} trend="flat" />
        <MetricCard label="Offboarding" value={String(offboardingCount)} change="1 this quarter" trend="down" />
        <MetricCard label="Avg Tenure" value="2.8 yr" change="+0.3 vs last year" trend="up" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Department breakdown */}
        <div style={{ padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', background: '#fff' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#242424', margin: '0 0 16px' }}>
            Department Breakdown
          </h3>
          {Object.entries(deptCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([dept, count]) => (
              <DepartmentBar key={dept} department={dept} count={count} total={employees.length} color={deptColors[dept] || '#616161'} />
            ))
          }
        </div>

        {/* Recent hires */}
        <div style={{ padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', background: '#fff' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#242424', margin: '0 0 12px' }}>
            Recent Hires
          </h3>
          {recentHires.map((emp) => (
            <RecentHireRow key={emp.id} emp={emp} onClick={() => onViewEmployee(emp.id)} />
          ))}
        </div>

        {/* Upcoming reviews */}
        <div style={{ padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', background: '#fff', gridColumn: 'span 2' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#242424', margin: '0 0 12px' }}>
            Active Goals Snapshot
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#424242' }}>Employee</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#424242' }}>Goal</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#424242', width: '200px' }}>Progress</th>
              </tr>
            </thead>
            <tbody>
              {employees.slice(0, 6).flatMap((emp) =>
                emp.goals.slice(0, 1).map((goal) => (
                  <tr key={`${emp.id}-${goal.name}`} style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <td style={{ padding: '8px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Avatar name={emp.name} size={22} />
                        <span style={{ color: '#242424' }}>{emp.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '8px 12px', color: '#616161' }}>{goal.name}</td>
                    <td style={{ padding: '8px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, height: '6px', borderRadius: '3px', background: '#f0f0f0', overflow: 'hidden' }}>
                          <div style={{
                            width: `${goal.progress}%`,
                            height: '100%',
                            borderRadius: '3px',
                            background: goal.progress >= 80 ? '#107c10' : goal.progress >= 50 ? '#0078d4' : '#ca5010',
                          }} />
                        </div>
                        <span style={{ fontSize: '12px', color: '#616161', width: '32px', textAlign: 'right' }}>{goal.progress}%</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
