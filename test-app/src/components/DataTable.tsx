import React from 'react';
import {
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  TableCellLayout,
  Text,
} from '@fluentui/react-components';
import { ArrowRightRegular } from '@fluentui/react-icons';
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
    <Table style={{ backgroundColor: 'var(--colorNeutralBackground1)' }}>
      <TableHeader>
        <TableRow>
          <TableHeaderCell>Name</TableHeaderCell>
          <TableHeaderCell>Title</TableHeaderCell>
          <TableHeaderCell>Department</TableHeaderCell>
          <TableHeaderCell>Location</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
          <TableHeaderCell style={{ width: '48px' }} />
        </TableRow>
      </TableHeader>
      <TableBody>
        {employees.map((emp) => (
          <TableRow
            key={emp.id}
            onClick={() => onSelect(emp.id)}
            style={{ cursor: 'pointer' }}
          >
            <TableCell>
              <TableCellLayout media={<Avatar name={emp.name} size={28} />}>
                <Text weight="medium">{emp.name}</Text>
                <br />
                <Text size={100} style={{ color: 'var(--colorNeutralForeground4)' }}>{emp.email}</Text>
              </TableCellLayout>
            </TableCell>
            <TableCell>
              <Text>{emp.title}</Text>
            </TableCell>
            <TableCell>
              <Text style={{ color: 'var(--colorNeutralForeground3)' }}>{emp.department}</Text>
            </TableCell>
            <TableCell>
              <Text style={{ color: 'var(--colorNeutralForeground3)' }}>{emp.location}</Text>
            </TableCell>
            <TableCell>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <StatusDot status={emp.status} />
                <Badge text={emp.status} variant={statusVariant(emp.status)} />
              </div>
            </TableCell>
            <TableCell>
              <IconButton icon="→" label="View" onClick={() => onSelect(emp.id)} />
            </TableCell>
          </TableRow>
        ))}
        {employees.length === 0 && (
          <TableRow>
            <TableCell colSpan={6} style={{ textAlign: 'center', padding: '32px' }}>
              <Text style={{ color: 'var(--colorNeutralForeground4)' }}>
                No employees match your filters.
              </Text>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
