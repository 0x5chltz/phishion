import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Icon from '@material-ui/core/Icon';
import TextareaAutosize from '@material-ui/core/TextareaAutosize';
import PageShell from '/components/PageShell/PageShell.js';
import Card from '/components/Card/Card.js';
import CardBody from '/components/Card/CardBody.js';
import Button from '/components/CustomButtons/Button.js';
import EmptyState from '/components/EmptyState/EmptyState.js';
import { api } from '../lib/api';
import { useNotify } from '../context/NotificationContext';

const useStyles = makeStyles(() => ({
  textarea: {
    width: '100%',
    minHeight: 140,
    padding: 12,
    fontFamily: 'monospace',
    fontSize: 14,
    border: '1px solid #ccc',
    borderRadius: 6,
  },
  resultRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 12px',
    borderRadius: 6,
    marginBottom: 8,
  },
}));

export default function BatchScan() {
  const classes = useStyles();
  const notify = useNotify();
  const [raw, setRaw] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const urls = raw.split('\n').map((line) => line.trim()).filter(Boolean);

  const handleSubmit = async () => {
    if (urls.length === 0) {
      notify.warning('Enter at least one URL');
      return;
    }
    if (urls.length > 10) {
      notify.warning('Maximum 10 URLs per batch');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.batchScan(urls);
      setResult(res);
      notify.success(`Submitted ${res.total} scans`);
    } catch (err) {
      notify.error(err.message || 'Batch scan failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell title="Batch URL Scanning" subtitle="Submit up to 10 URLs at once for VirusTotal analysis.">
      <Card>
        <CardBody>
          <p style={{ color: '#888', marginBottom: 8 }}>One URL per line ({urls.length}/10)</p>
          <TextareaAutosize
            className={classes.textarea}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder={'https://example.com\nhttps://another-site.com'}
          />
          <div style={{ marginTop: 16 }}>
            <Button color="primary" onClick={handleSubmit} disabled={submitting}>
              <Icon>send</Icon> {submitting ? 'Submitting...' : 'Submit Batch'}
            </Button>
          </div>
        </CardBody>
      </Card>

      {result && (
        <Card>
          <CardBody>
            <h4>Results</h4>
            {result.scans.length === 0 && result.errors.length === 0 ? (
              <EmptyState icon="playlist_add" title="No results yet" />
            ) : (
              <>
                {result.scans.map((scan) => (
                  <div key={scan.id} className={classes.resultRow} style={{ background: '#e8f5e9' }}>
                    <span style={{ wordBreak: 'break-all' }}>{scan.url}</span>
                    <span style={{ fontWeight: 600 }}>{scan.status}</span>
                  </div>
                ))}
                {result.errors.map((err, idx) => (
                  <div key={idx} className={classes.resultRow} style={{ background: '#ffebee' }}>
                    <span style={{ wordBreak: 'break-all' }}>{err.url}</span>
                    <span style={{ color: '#c62828' }}>{err.error}</span>
                  </div>
                ))}
              </>
            )}
          </CardBody>
        </Card>
      )}
    </PageShell>
  );
}
