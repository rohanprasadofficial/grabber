import React from 'react';
import { Employee } from '../data/employees';
import { Avatar } from './Avatar';
import { Badge, StatusDot } from './Badge';
import { IconButton } from './Button';

function statusVariant(status: Employee['status']) {
  if (status === 'Active') return 'success' as const;
  if (status === 'On Leave') return 'warning' as const;
  return 'error' as const;
}

export function EmployeeTable({ employees, onSelect }: {
  employees: Employee[];
  onSelect: (id: string) => void;
}) {
  return (
    <div style={{ border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden', background: '#fff' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <thead>
          <tr style={{ background: '#fafafa', borderBottom: '1px solid #e0e0e0' }}>
            <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#424242' }}>Name</th>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#424242' }}>Title</th>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#424242' }}>Department</th>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#424242' }}>Location</th>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#424242' }}>Status</th>
            <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: '#424242' }}></th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => (
            <tr
              key={emp.id}
              onClick={() => onSelect(emp.id)}
              style={{ borderBottom: '1px solid #f0f0f0', cursor: 'pointer' }}
            >
              <td style={{ padding: '10px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Avatar name={emp.name} size={28} />
                  <div>
                    <div style={{ fontWeight: 500, color: '#242424' }}>{emp.name}</div>
                    <div style={{ fontSize: '11px', color: '#8a8a8a' }}>{emp.email}</div>
                  </div>
                </div>
              </td>
              <td style={{ padding: '10px 12px', color: '#424242' }}>{emp.title}</td>
              <td style={{ padding: '10px 12px', color: '#616161' }}>{emp.department}</td>
              <td style={{ padding: '10px 12px', color: '#616161' }}>{emp.location}</td>
              <td style={{ padding: '10px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <StatusDot status={emp.status} />
                  <Badge text={emp.status} variant={statusVariant(emp.status)} />
                </div>
              </td>
              <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                <IconButton icon="&#8594;" label="View" onClick={() => onSelect(emp.id)} />
              </td>
            </tr>
          ))}
          {employees.length === 0 && (
            <tr>
              <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#8a8a8a' }}>
                No employees match your filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
