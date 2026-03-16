import { useState, useCallback } from 'react';
import { employees as allEmployees, Employee } from '../data/employees';

export type Page = 'dashboard' | 'people' | 'employee-detail' | 'settings';

export interface Filters {
  search: string;
  department: string;
  location: string;
  status: string;
}

export function useAppState() {
  const [page, setPage] = useState<Page>('dashboard');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    search: '',
    department: '',
    location: '',
    status: '',
  });

  const navigate = useCallback((p: Page) => {
    setPage(p);
    if (p !== 'employee-detail') setSelectedEmployeeId(null);
  }, []);

  const viewEmployee = useCallback((id: string) => {
    setSelectedEmployeeId(id);
    setPage('employee-detail');
  }, []);

  const filteredEmployees = allEmployees.filter((emp) => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (!emp.name.toLowerCase().includes(q) && !emp.title.toLowerCase().includes(q) && !emp.email.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (filters.department && emp.department !== filters.department) return false;
    if (filters.location && emp.location !== filters.location) return false;
    if (filters.status && emp.status !== filters.status) return false;
    return true;
  });

  const selectedEmployee: Employee | null = selectedEmployeeId
    ? allEmployees.find((e) => e.id === selectedEmployeeId) ?? null
    : null;

  return {
    page,
    navigate,
    filters,
    setFilters,
    filteredEmployees,
    allEmployees,
    selectedEmployee,
    viewEmployee,
  };
}
