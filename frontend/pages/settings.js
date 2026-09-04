import React, { useEffect, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Switch from '@material-ui/core/Switch';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import PageShell from '/components/PageShell/PageShell.js';
import Seo from '/components/Seo/Seo.js';
import Card from '/components/Card/Card.js';
import CardBody from '/components/Card/CardBody.js';
import Button from '/components/CustomButtons/Button.js';
import CustomInput from '/components/CustomInput/CustomInput.js';
import LoadingBar from '/components/LoadingBar/LoadingBar.js';
import { api } from '../lib/api';
import { useNotify } from '../context/NotificationContext';
import { useThemeMode } from '../context/ThemeContext';

const useStyles = makeStyles((theme) => ({
  row: { marginBottom: 20 },
}));

export default function Settings() {
  const classes = useStyles();
  const notify = useNotify();
  const { setThemeMode } = useThemeMode();
  const [preferences, setPreferences] = useState({
    theme: 'light',
    timezone: 'UTC',
    email_notifications: true,
    scan_completion_notifications: true,
    daily_digest: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.preferences()
      .then((res) => setPreferences(res.preferences))
      .catch(() => notify.error('Failed to load preferences'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggle = (key) => (e) => {
    setPreferences((prev) => ({ ...prev, [key]: e.target.checked }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.updatePreferences(preferences);
      setPreferences(res.preferences);
      setThemeMode(res.preferences.theme);
      notify.success('Preferences saved');
    } catch (err) {
      notify.error(err.message || 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell title="Settings" subtitle="Customize theme, timezone, and notification preferences.">
      <Seo
        title="Settings"
        description="Customize your Phishion account preferences, including theme, timezone, and how you are notified about scan results and scheduled runs."
        path="/settings"
        noindex
      />
      <Card>
        <CardBody>
          {loading ? (
            <LoadingBar label="Loading preferences..." />
          ) : (
            <form onSubmit={handleSubmit} style={{ maxWidth: 480 }}>
              <div className={classes.row}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.theme === 'dark'}
                      onChange={(e) => setPreferences((prev) => ({ ...prev, theme: e.target.checked ? 'dark' : 'light' }))}
                      color="primary"
                    />
                  }
                  label="Dark theme"
                />
              </div>

              <div className={classes.row}>
                <CustomInput
                  labelText="Timezone"
                  id="timezone"
                  formControlProps={{ fullWidth: true }}
                  inputProps={{
                    value: preferences.timezone,
                    onChange: (e) => setPreferences((prev) => ({ ...prev, timezone: e.target.value })),
                    placeholder: 'e.g. UTC, Asia/Jakarta',
                  }}
                />
              </div>

              <div className={classes.row}>
                <FormControlLabel
                  control={<Switch checked={preferences.email_notifications} onChange={handleToggle('email_notifications')} color="primary" />}
                  label="Enable email notifications"
                />
              </div>

              <div className={classes.row}>
                <FormControlLabel
                  control={<Switch checked={preferences.scan_completion_notifications} onChange={handleToggle('scan_completion_notifications')} color="primary" />}
                  label="Notify when scans complete"
                />
              </div>

              <div className={classes.row}>
                <FormControlLabel
                  control={<Switch checked={preferences.daily_digest} onChange={handleToggle('daily_digest')} color="primary" />}
                  label="Send daily digest"
                />
              </div>

              <Button color="primary" type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Preferences'}
              </Button>
            </form>
          )}
        </CardBody>
      </Card>
    </PageShell>
  );
}
