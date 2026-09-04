import React, { useEffect, useMemo, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Chip from '@material-ui/core/Chip';
import Icon from '@material-ui/core/Icon';
import PageShell from '/components/PageShell/PageShell.js';
import Seo from '/components/Seo/Seo.js';
import Card from '/components/Card/Card.js';
import CardBody from '/components/Card/CardBody.js';
import Button from '/components/CustomButtons/Button.js';
import CustomInput from '/components/CustomInput/CustomInput.js';
import Pagination from '/components/Pagination/Pagination.js';
import LoadingBar from '/components/LoadingBar/LoadingBar.js';
import EmptyState from '/components/EmptyState/EmptyState.js';
import { api, exportUrl } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useNotify } from '../context/NotificationContext';
import { usePagination } from '../lib/usePagination';

const useStyles = makeStyles((theme) => ({
  filterRow: { marginBottom: 24, display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' },
  row: {
    borderBottom: '1px solid #eee',
    padding: '16px 4px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 8,
  },
  url: { fontWeight: 600, wordBreak: 'break-all' },
  meta: { color: '#888', fontSize: 13, marginTop: 4 },
  chips: { marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' },
  actions: { display: 'flex', gap: 8, marginBottom: 16 },
  verdict: { fontWeight: 700, textTransform: 'uppercase', fontSize: 12, padding: '4px 10px', borderRadius: 12 },
}));

const VERDICT_COLOR = {
  malicious: { background: '#ffebee', color: '#c62828' },
  suspicious: { background: '#fff8e1', color: '#f9a825' },
  clean: { background: '#e8f5e9', color: '#2e7d32' },
};

function domainOf(url) {
  try {
    return new URL(url).hostname;
  } catch (_) {
    return url || '';
  }
}

export default function History() {
  const classes = useStyles();
  const { user, loading: authLoading } = useAuth();
  const notify = useNotify();
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    api.scans()
      .then((data) => setScans(Array.isArray(data) ? data : data?.scans || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(
    () => scans.filter((item) => domainOf(item.url).toLowerCase().includes(filter.trim().toLowerCase())),
    [scans, filter]
  );

  const { pageItems, pages } = usePagination(filtered);

  const handleQuickBlacklist = async (url) => {
    try {
      await api.addBlacklist(url, 'Flagged from scan history');
      notify.success('Added to blacklist');
    } catch (e) {
      notify.error(e.message || 'Failed to blacklist');
    }
  };

  const handleQuickWhitelist = async (url) => {
    try {
      await api.addWhitelist(url);
      notify.success('Added to whitelist');
    } catch (e) {
      notify.error(e.message || 'Failed to whitelist');
    }
  };

  const download = (format) => {
    window.open(exportUrl(format), '_blank');
  };

  return (
    <PageShell title="Scan History" subtitle="Every URL you have submitted, with verdicts, tags, and quick actions.">
      <Seo
        title="Scan History"
        description="Review every URL you have submitted to Phishion, with VirusTotal verdicts, tags, and CSV or JSON export for offline triage."
        path="/history"
      />
      <Card>
        <CardBody>
          <div className={classes.filterRow}>
            <CustomInput
              labelText="Filter by domain"
              id="domain-filter"
              formControlProps={{ fullWidth: false, style: { minWidth: 260 } }}
              inputProps={{ value: filter, onChange: (e) => setFilter(e.target.value) }}
            />
          </div>
          <div className={classes.actions}>
            <Button color="info" size="sm" onClick={() => download('csv')} disabled={!filtered.length}>
              <Icon>download</Icon> Export CSV
            </Button>
            <Button color="rose" size="sm" onClick={() => download('json')} disabled={!filtered.length}>
              <Icon>download</Icon> Export JSON
            </Button>
            <Button color="transparent" size="sm" onClick={load}>
              <Icon>refresh</Icon> Refresh
            </Button>
          </div>

          {(loading || authLoading) && <LoadingBar label="Loading scan history..." />}
          {error && <p style={{ color: '#c62828' }}>{error}</p>}
          {!loading && !error && filtered.length === 0 && (
            <EmptyState icon="history" title="No scans found" hint="Submit a URL from Inspect to get started." />
          )}

          {!loading && pageItems.map((item) => (
            <div className={classes.row} key={item.id}>
              <div style={{ flex: 1, minWidth: 240 }}>
                <div className={classes.url}>{item.url}</div>
                <div className={classes.meta}>
                  {item.status} · {new Date(item.scanned_at).toLocaleString()}
                  {item.malicious > 0 && ` · ${item.malicious} malicious`}
                  {item.suspicious > 0 && ` · ${item.suspicious} suspicious`}
                </div>
                {item.tags && item.tags.length > 0 && (
                  <div className={classes.chips}>
                    {item.tags.map((tag) => (
                      <Chip key={tag.id} label={tag.name} size="small" style={{ backgroundColor: tag.color, color: '#fff' }} />
                    ))}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                {item.verdict && (
                  <span className={classes.verdict} style={VERDICT_COLOR[item.verdict] || {}}>
                    {item.verdict}
                  </span>
                )}
                <div style={{ display: 'flex', gap: 6 }}>
                  <Button size="sm" color="success" simple onClick={() => handleQuickWhitelist(item.url)}>
                    Whitelist
                  </Button>
                  <Button size="sm" color="danger" simple onClick={() => handleQuickBlacklist(item.url)}>
                    Blacklist
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {!loading && filtered.length > 0 && (
            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
              <Pagination pages={pages} />
            </div>
          )}
        </CardBody>
      </Card>
    </PageShell>
  );
}
