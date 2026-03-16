import React from 'react';
import { Employee, departments, locations, statuses } from '../data/employees';
import { Filters } from '../hooks/useAppState';
import { SearchBar } from '../components/SearchBar';
import { FilterChip } from '../components/FilterChip';
import { EmployeeTable } from '../components/DataTable';
import { Button } from '../components/Button';

export function PeoplePage({ employees, filters, onFiltersChange, onViewEmployee }: {
  employees: Employee[];
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  onViewEmployee: (id: string) => void;
}) {
  return (
    <main style={{ flex: 1, padding: '24px', overflow: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#242424', margin: '0 0 4px' }}>People</h2>
          <p style={{ fontSize: '13px', color: '#616161', margin: 0 }}>
            {employees.length} employee{employees.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <Button variant="primary">+ Add Employee</Button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', alignItems: 'center' }}>
        <SearchBar
          value={filters.search}
          onChange={(search) => onFiltersChange({ ...filters, search })}
          placeholder="Search by name, title, or email..."
        />
        <FilterChip
          label="Department"
          value={filters.department}
          options={departments}
          onChange={(department) => onFiltersChange({ ...filters, department })}
        />
        <FilterChip
          label="Location"
          value={filters.location}
          options={locations}
          onChange={(location) => onFiltersChange({ ...filters, location })}
        />
        <FilterChip
          label="Status"
          value={filters.status}
          options={statuses}
          onChange={(status) => onFiltersChange({ ...filters, status })}
        />
        {(filters.department || filters.location || filters.status) && (
          <Button variant="ghost" size="sm" onClick={() => onFiltersChange({ search: filters.search, department: '', location: '', status: '' })}>
            Clear filters
          </Button>
        )}
      </div>

      {/* Table */}
      <EmployeeTable employees={employees} onSelect={onViewEmployee} />
    </main>
  );
}
