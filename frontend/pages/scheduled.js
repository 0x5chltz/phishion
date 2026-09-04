import React, { useEffect, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import Icon from '@material-ui/core/Icon';
import PageShell from '/components/PageShell/PageShell.js';
import Seo from '/components/Seo/Seo.js';
import Card from '/components/Card/Card.js';
import CardBody from '/components/Card/CardBody.js';
import Button from '/components/CustomButtons/Button.js';
import CustomInput from '/components/CustomInput/CustomInput.js';
import EmptyState from '/components/EmptyState/EmptyState.js';
import LoadingBar from '/components/LoadingBar/LoadingBar.js';
import { api } from '../lib/api';
import { useNotify } from '../context/NotificationContext';
import { useConfirm } from '/components/ConfirmDialog/ConfirmDialog.js';

const useStyles = makeStyles((theme) => ({
  form: { display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24, flexWrap: 'wrap' },
  item: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
  },
}));

export default function ScheduledScans() {
  const classes = useStyles();
  const notify = useNotify();
  const confirm = useConfirm();
  const [scans, setScans] = useState([]);
  const [url, setUrl] = useState('');
  const [frequency, setFrequency] = useState('daily');
  const [loading, setLoading] = useState(true);

  const load = () => api.scheduledScans().then((r) => setScans(r.scans || [])).finally(() => setLoading(false));
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAdd = async () => {
    if (!url.trim()) return;
    try {
      await api.createScheduledScan(url.trim(), frequency);
      setUrl('');
      await load();
      notify.success('Scheduled scan created');
    } catch (e) {
      notify.error(e.message || 'Failed to create schedule');
    }
  };

  const handleToggle = async (scan) => {
    try {
      await api.updateScheduledScan(scan.id, { is_active: !scan.is_active });
      await load();
    } catch (e) {
      notify.error(e.message || 'Failed to update');
    }
  };

  const handleDelete = async (id) => {
    const ok = await confirm({ title: 'Delete schedule?', message: 'This recurring scan will stop running.' });
    if (!ok) return;
    try {
      await api.deleteScheduledScan(id);
      await load();
      notify.success('Schedule deleted');
    } catch (e) {
      notify.error(e.message || 'Failed to delete');
    }
  };

  return (
    <PageShell title="Scheduled Scans" subtitle="Automatically re-scan critical URLs on a recurring basis.">
      <Seo
        title="Scheduled Scans"
        description="Set recurring re-scans for URLs you are monitoring, so a phishing page that only goes live after your first check does not slip past."
        path="/scheduled"
      />
      <Card>
        <CardBody>
          <div className={classes.form}>
            <CustomInput
              labelText="URL to scan regularly"
              id="sched-url"
              formControlProps={{ style: { minWidth: 320 } }}
              inputProps={{ value: url, onChange: (e) => setUrl(e.target.value) }}
            />
            <Select value={frequency} onChange={(e) => setFrequency(e.target.value)}>
              <MenuItem value="daily">Daily</MenuItem>
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
            </Select>
            <Button color="primary" onClick={handleAdd}>Schedule</Button>
          </div>

          {loading ? (
            <LoadingBar label="Loading schedules..." />
          ) : scans.length === 0 ? (
            <EmptyState icon="event_repeat" title="No scheduled scans" hint="Set up recurring scans for URLs you monitor often." />
          ) : (
            scans.map((scan) => (
              <div key={scan.id} className={classes.item} style={{ background: scan.is_active ? '#f3e5f5' : '#f5f5f5' }}>
                <div>
                  <div style={{ fontWeight: 600, wordBreak: 'break-all' }}>{scan.url}</div>
                  <div style={{ fontSize: 13, color: '#888' }}>
                    {scan.frequency} {scan.last_scanned_at && `· last run ${new Date(scan.last_scanned_at).toLocaleString()}`}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button size="sm" color={scan.is_active ? 'success' : 'transparent'} onClick={() => handleToggle(scan)}>
                    {scan.is_active ? 'Active' : 'Inactive'}
                  </Button>
                  <Button size="sm" color="danger" simple onClick={() => handleDelete(scan.id)}>
                    <Icon>delete</Icon>
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardBody>
      </Card>
    </PageShell>
  );
}
