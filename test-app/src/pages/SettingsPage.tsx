import React, { useState } from 'react';
import {
  Card,
  Text,
  tokens,
  MessageBar,
  MessageBarBody,
} from '@fluentui/react-components';
import { TextInput, SelectInput, ToggleField } from '../components/FormField';
import { Button } from '../components/Button';

function SettingsSection({ title, description, children }: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card style={{ marginBottom: '16px' }}>
      <Text size={400} weight="semibold" block>{title}</Text>
      <Text size={200} style={{ color: tokens.colorNeutralForeground4, display: 'block', marginBottom: '16px' }}>
        {description}
      </Text>
      {children}
    </Card>
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
      <Text as="h2" size={500} weight="semibold" block style={{ marginBottom: '4px' }}>Settings</Text>
      <Text size={300} style={{ color: tokens.colorNeutralForeground3, display: 'block', marginBottom: '24px' }}>
        Manage your account preferences and notifications.
      </Text>

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

      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
        {saved && (
          <MessageBar intent="success">
            <MessageBarBody>Settings saved!</MessageBarBody>
          </MessageBar>
        )}
        <Button variant="secondary">Cancel</Button>
        <Button variant="primary" onClick={handleSave}>Save Changes</Button>
      </div>
    </main>
  );
}
