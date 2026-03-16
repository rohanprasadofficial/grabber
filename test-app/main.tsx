import React from 'react';
import { createRoot } from 'react-dom/client';
import { GrabberDevTools } from '@grabber/sdk';

// ===== Sample Fluent-like Components =====

function Header() {
  return (
    <header style={{
      padding: '16px 24px',
      background: '#f5f5f5',
      borderBottom: '1px solid #e0e0e0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '6px',
          background: '#0078d4',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontWeight: 700,
          fontSize: '14px',
        }}>
          G
        </div>
        <span style={{ fontSize: '16px', fontWeight: 600, color: '#242424' }}>
          Grabber SDK Test
        </span>
      </div>
      <nav style={{ display: 'flex', gap: '8px' }}>
        <NavButton label="Home" active />
        <NavButton label="Components" />
        <NavButton label="Settings" />
      </nav>
    </header>
  );
}

function NavButton({ label, active }: { label: string; active?: boolean }) {
  return (
    <button style={{
      padding: '6px 16px',
      borderRadius: '6px',
      border: 'none',
      background: active ? '#0078d4' : 'transparent',
      color: active ? '#fff' : '#616161',
      fontSize: '13px',
      fontWeight: 500,
      cursor: 'pointer',
    }}>
      {label}
    </button>
  );
}

function Card({ title, description }: { title: string; description: string }) {
  return (
    <div style={{
      padding: '20px',
      borderRadius: '8px',
      border: '1px solid #e0e0e0',
      background: '#fff',
      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    }}>
      <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#242424', marginBottom: '8px' }}>
        {title}
      </h3>
      <p style={{ fontSize: '13px', color: '#616161', lineHeight: '1.5', margin: 0 }}>
        {description}
      </p>
      <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
        <PrimaryButton>Edit</PrimaryButton>
        <SecondaryButton>Details</SecondaryButton>
      </div>
    </div>
  );
}

function PrimaryButton({ children }: { children: React.ReactNode }) {
  return (
    <button style={{
      padding: '6px 16px',
      borderRadius: '4px',
      border: 'none',
      background: '#0078d4',
      color: '#fff',
      fontSize: '13px',
      fontWeight: 500,
      cursor: 'pointer',
    }}>
      {children}
    </button>
  );
}

function SecondaryButton({ children }: { children: React.ReactNode }) {
  return (
    <button style={{
      padding: '6px 16px',
      borderRadius: '4px',
      border: '1px solid #d1d1d1',
      background: '#fff',
      color: '#242424',
      fontSize: '13px',
      fontWeight: 500,
      cursor: 'pointer',
    }}>
      {children}
    </button>
  );
}

function Badge({ text, variant = 'info' }: { text: string; variant?: 'info' | 'success' | 'warning' }) {
  const colors = {
    info: { bg: '#e8f4fd', text: '#0078d4' },
    success: { bg: '#dff6dd', text: '#107c10' },
    warning: { bg: '#fff4ce', text: '#797600' },
  };
  const c = colors[variant];
  return (
    <span style={{
      display: 'inline-flex',
      padding: '2px 10px',
      borderRadius: '100px',
      background: c.bg,
      color: c.text,
      fontSize: '11px',
      fontWeight: 600,
    }}>
      {text}
    </span>
  );
}

function Sidebar() {
  return (
    <aside style={{
      width: '220px',
      padding: '16px',
      borderRight: '1px solid #e0e0e0',
      background: '#fafafa',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
    }}>
      <SidebarItem label="Dashboard" active />
      <SidebarItem label="Analytics" />
      <SidebarItem label="Components" />
      <SidebarItem label="Design Tokens" />
      <SidebarItem label="Settings" />
    </aside>
  );
}

function SidebarItem({ label, active }: { label: string; active?: boolean }) {
  return (
    <div style={{
      padding: '8px 12px',
      borderRadius: '6px',
      background: active ? '#e8f4fd' : 'transparent',
      color: active ? '#0078d4' : '#424242',
      fontSize: '13px',
      fontWeight: active ? 600 : 400,
      cursor: 'pointer',
    }}>
      {label}
    </div>
  );
}

function DataTable() {
  const rows = [
    { name: 'Button', status: 'stable', tokens: 12 },
    { name: 'Input', status: 'stable', tokens: 8 },
    { name: 'Dialog', status: 'preview', tokens: 15 },
    { name: 'Menu', status: 'beta', tokens: 10 },
  ];

  return (
    <table style={{
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: '13px',
    }}>
      <thead>
        <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
          <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#424242' }}>Component</th>
          <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#424242' }}>Status</th>
          <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: '#424242' }}>Tokens</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.name} style={{ borderBottom: '1px solid #f0f0f0' }}>
            <td style={{ padding: '10px 12px', color: '#242424' }}>{row.name}</td>
            <td style={{ padding: '10px 12px' }}>
              <Badge
                text={row.status}
                variant={row.status === 'stable' ? 'success' : row.status === 'preview' ? 'info' : 'warning'}
              />
            </td>
            <td style={{ padding: '10px 12px', textAlign: 'right', color: '#616161' }}>{row.tokens}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ===== App =====

function App() {
  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", minHeight: '100vh', background: '#fff' }}>
      {/* Grabber SDK — the one line you add */}
      <GrabberDevTools />

      <Header />
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 61px)' }}>
        <Sidebar />
        <main style={{ flex: 1, padding: '24px', maxWidth: '900px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#242424', marginBottom: '4px' }}>
            Component Dashboard
          </h2>
          <p style={{ fontSize: '13px', color: '#616161', marginBottom: '24px' }}>
            Hover over any element and use the Grabber overlay to inspect it. Try Ctrl+Shift+G or click the button in the bottom-right.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
            <Card
              title="Fluent Button"
              description="Primary action button with brand colors. Uses borderRadiusMedium and spacingHorizontalM tokens."
            />
            <Card
              title="Fluent Input"
              description="Text input field with focus ring. Uses strokeWidthThin and colorNeutralStroke1 tokens."
            />
            <Card
              title="Fluent Dialog"
              description="Modal dialog with overlay. Uses shadow64 and borderRadiusXLarge tokens."
            />
            <Card
              title="Fluent Menu"
              description="Context menu with dividers. Uses colorNeutralBackground1 and spacingVerticalS tokens."
            />
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#242424', marginBottom: '12px' }}>
            Component Status
          </h3>
          <div style={{ border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
            <DataTable />
          </div>
        </main>
      </div>
    </div>
  );
}

// Mount
const root = createRoot(document.getElementById('root')!);
root.render(<App />);
