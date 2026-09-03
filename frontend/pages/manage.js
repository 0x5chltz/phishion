import React, { useEffect, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Icon from '@material-ui/core/Icon';
import PageShell from '/components/PageShell/PageShell.js';
import CustomTabs from '/components/CustomTabs/CustomTabs.js';
import Button from '/components/CustomButtons/Button.js';
import CustomInput from '/components/CustomInput/CustomInput.js';
import EmptyState from '/components/EmptyState/EmptyState.js';
import LoadingBar from '/components/LoadingBar/LoadingBar.js';
import { api } from '../lib/api';
import { useNotify } from '../context/NotificationContext';
import { useConfirm } from '/components/ConfirmDialog/ConfirmDialog.js';

const useStyles = makeStyles(() => ({
  form: { display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap', alignItems: 'flex-end' },
  listItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    borderRadius: 8,
    marginBottom: 8,
  },
  tagChip: { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 16, marginRight: 8, marginBottom: 8, color: '#fff', fontSize: 13, fontWeight: 600 },
}));

function TagsPanel() {
  const classes = useStyles();
  const notify = useNotify();
  const [tags, setTags] = useState([]);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#9c27b0');
  const [loading, setLoading] = useState(true);

  const load = () => api.tags().then((r) => setTags(r.tags || [])).finally(() => setLoading(false));
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAdd = async () => {
    if (!name.trim()) return;
    try {
      await api.createTag(name.trim(), color);
      setName('');
      await load();
      notify.success('Tag created');
    } catch (e) {
      notify.error(e.message || 'Failed to create tag');
    }
  };

  if (loading) return <LoadingBar label="Loading tags..." />;

  return (
    <div>
      <div className={classes.form}>
        <CustomInput labelText="Tag name" id="tag-name" inputProps={{ value: name, onChange: (e) => setName(e.target.value) }} />
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{ width: 40, height: 40, border: 'none', cursor: 'pointer' }} />
        <Button color="primary" onClick={handleAdd}>Add Tag</Button>
      </div>
      {tags.length === 0 ? (
        <EmptyState icon="label" title="No tags yet" hint="Create tags to organize your scans." />
      ) : (
        <div>
          {tags.map((tag) => (
            <span key={tag.id} className={classes.tagChip} style={{ backgroundColor: tag.color }}>{tag.name}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function WhitelistPanel() {
  const classes = useStyles();
  const notify = useNotify();
  const confirm = useConfirm();
  const [items, setItems] = useState([]);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => api.whitelist().then((r) => setItems(r.whitelist || [])).finally(() => setLoading(false));
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAdd = async () => {
    if (!url.trim()) return;
    try {
      await api.addWhitelist(url.trim());
      setUrl('');
      await load();
      notify.success('Added to whitelist');
    } catch (e) {
      notify.error(e.message || 'Failed to add');
    }
  };

  const handleRemove = async (id) => {
    const ok = await confirm({ title: 'Remove from whitelist?', message: 'This URL pattern will no longer be trusted automatically.' });
    if (!ok) return;
    try {
      await api.removeWhitelist(id);
      await load();
      notify.success('Removed');
    } catch (e) {
      notify.error(e.message || 'Failed to remove');
    }
  };

  if (loading) return <LoadingBar label="Loading whitelist..." />;

  return (
    <div>
      <div className={classes.form}>
        <CustomInput labelText="URL pattern" id="wl-url" formControlProps={{ style: { minWidth: 320 } }} inputProps={{ value: url, onChange: (e) => setUrl(e.target.value) }} />
        <Button color="success" onClick={handleAdd}>Add</Button>
      </div>
      {items.length === 0 ? (
        <EmptyState icon="verified" title="Whitelist is empty" />
      ) : (
        items.map((item) => (
          <div key={item.id} className={classes.listItem} style={{ background: '#e8f5e9' }}>
            <span>{item.url}</span>
            <Button size="sm" color="danger" simple onClick={() => handleRemove(item.id)}>
              <Icon>close</Icon>
            </Button>
          </div>
        ))
      )}
    </div>
  );
}

function BlacklistPanel() {
  const classes = useStyles();
  const notify = useNotify();
  const [items, setItems] = useState([]);
  const [url, setUrl] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => api.blacklist().then((r) => setItems(r.blacklist || [])).finally(() => setLoading(false));
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAdd = async () => {
    if (!url.trim()) return;
    try {
      await api.addBlacklist(url.trim(), reason.trim());
      setUrl('');
      setReason('');
      await load();
      notify.success('Added to blacklist');
    } catch (e) {
      notify.error(e.message || 'Failed to add');
    }
  };

  if (loading) return <LoadingBar label="Loading blacklist..." />;

  return (
    <div>
      <div className={classes.form}>
        <CustomInput labelText="URL pattern" id="bl-url" inputProps={{ value: url, onChange: (e) => setUrl(e.target.value) }} />
        <CustomInput labelText="Reason (optional)" id="bl-reason" inputProps={{ value: reason, onChange: (e) => setReason(e.target.value) }} />
        <Button color="danger" onClick={handleAdd}>Add</Button>
      </div>
      {items.length === 0 ? (
        <EmptyState icon="block" title="Blacklist is empty" />
      ) : (
        items.map((item) => (
          <div key={item.id} className={classes.listItem} style={{ background: '#ffebee' }}>
            <div>
              <div style={{ fontWeight: 600 }}>{item.url}</div>
              {item.reason && <div style={{ fontSize: 13, color: '#888' }}>{item.reason}</div>}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default function Manage() {
  return (
    <PageShell title="Manage" subtitle="Organize scans with tags, and control trusted or blocked URLs.">
      <CustomTabs
        headerColor="primary"
        tabs={[
          { tabName: 'Tags', tabIcon: 'label', tabContent: <TagsPanel /> },
          { tabName: 'Whitelist', tabIcon: 'verified', tabContent: <WhitelistPanel /> },
          { tabName: 'Blacklist', tabIcon: 'block', tabContent: <BlacklistPanel /> },
        ]}
      />
    </PageShell>
  );
}
