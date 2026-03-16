import React, { useState } from 'react';
import { TextInput, SelectInput, ToggleField } from '../components/FormField';
import { Button } from '../components/Button';

function SettingsSection({ title, description, children }: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{
      padding: '20px',
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      background: '#fff',
      marginBottom: '16px',
    }}>
      <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#242424', margin: '0 0 2px' }}>{title}</h3>
      <p style={{ fontSize: '12px', color: '#8a8a8a', margin: '0 0 16px' }}>{description}</p>
      {children}
    </div>
  );
}

export function SettingsPage() {
  const [displayName, setDisplayName] = useState('Admin User');
  const [email, setEmail] = useState('admin@contoso.com');
  const [timezone, setTimezone] = useState('(UTC-08:00) Pacific Time');
  const [language, setLanguage] = useState('English (US)');
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [slackNotifs, setSlackNotifs] = useState(false);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [compactView, setCompactView] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <main style={{ flex: 1, padding: '24px', overflow: 'auto', maxWidth: '680px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#242424', margin: '0 0 4px' }}>Settings</h2>
      <p style={{ fontSize: '13px', color: '#616161', margin: '0 0 24px' }}>
        Manage your account preferences and notifications.
      </p>

      <SettingsSection title="Profile" description="Your personal information and preferences.">
        <TextInput label="Display Name" value={displayName} onChange={setDisplayName} />
        <TextInput label="Email" value={email} onChange={setEmail} />
        <SelectInput label="Timezone" value={timezone} options={[
          '(UTC-08:00) Pacific Time',
          '(UTC-05:00) Eastern Time',
          '(UTC+00:00) UTC',
          '(UTC+01:00) Central European Time',
          '(UTC+05:30) India Standard Time',
          '(UTC+09:00) Japan Standard Time',
        ]} onChange={setTimezone} />
        <SelectInput label="Language" value={language} options={[
          'English (US)', 'English (UK)', 'Spanish', 'French', 'German', 'Japanese', 'Hindi',
        ]} onChange={setLanguage} />
      </SettingsSection>

      <SettingsSection title="Notifications" description="Choose what notifications you receive.">
        <ToggleField
          label="Email notifications"
          description="Receive updates about employee changes via email"
          checked={emailNotifs}
          onChange={setEmailNotifs}
        />
        <ToggleField
          label="Slack notifications"
          description="Get real-time alerts in your Slack workspace"
          checked={slackNotifs}
          onChange={setSlackNotifs}
        />
        <ToggleField
          label="Weekly digest"
          description="Summary of org changes sent every Monday"
          checked={weeklyDigest}
          onChange={setWeeklyDigest}
        />
      </SettingsSection>

      <SettingsSection title="Appearance" description="Customize how the portal looks.">
        <ToggleField
          label="Dark mode"
          description="Use dark color theme across the portal"
          checked={darkMode}
          onChange={setDarkMode}
        />
        <ToggleField
          label="Compact view"
          description="Reduce spacing for denser information display"
          checked={compactView}
          onChange={setCompactView}
        />
      </SettingsSection>

      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        {saved && <span style={{ fontSize: '13px', color: '#107c10', alignSelf: 'center' }}>Settings saved!</span>}
        <Button variant="secondary">Cancel</Button>
        <Button variant="primary" onClick={handleSave}>Save Changes</Button>
      </div>
    </main>
  );
}
