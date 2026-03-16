import React from 'react';
import { GrabberDevTools } from '@grabber/sdk';
import { useAppState } from './hooks/useAppState';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { PeoplePage } from './pages/PeoplePage';
import { EmployeeDetailPage } from './pages/EmployeeDetailPage';
import { SettingsPage } from './pages/SettingsPage';

export function App() {
  const state = useAppState();

  const renderPage = () => {
    switch (state.page) {
      case 'people':
        return (
          <PeoplePage
            employees={state.filteredEmployees}
            filters={state.filters}
            onFiltersChange={state.setFilters}
            onViewEmployee={state.viewEmployee}
          />
        );
      case 'employee-detail':
        return state.selectedEmployee ? (
          <EmployeeDetailPage
            employee={state.selectedEmployee}
            onBack={() => state.navigate('people')}
          />
        ) : null;
      case 'settings':
        return <SettingsPage />;
      default:
        return (
          <DashboardPage
            employees={state.allEmployees}
            onViewEmployee={state.viewEmployee}
          />
        );
    }
  };

  const sidebarPage = state.page === 'employee-detail' ? 'people' : state.page;

  return (
    <div style={{
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
      minHeight: '100vh',
      background: '#f5f5f5',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <GrabberDevTools />
      <Header activePage={sidebarPage} onNavigate={state.navigate} />
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <Sidebar activePage={sidebarPage} onNavigate={state.navigate} />
        {renderPage()}
      </div>
    </div>
  );
}
