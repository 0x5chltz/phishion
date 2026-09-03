import React, { useEffect, useMemo, useState } from 'react';
import { makeStyles } from '@mui/styles';
import { Alert, Button, Card, CardContent, TextField, Typography } from '@mui/material';
import Header from '/components/Header/Header.js';
import HeaderLinks from '/components/Header/HeaderLinks.js';
import { api } from '../lib/api';

const useStyles = makeStyles({ container: { maxWidth: 1000, margin: '100px auto', padding: 24 }, row: { borderBottom: '1px solid #ddd', padding: '12px 0' }, actions: { display: 'flex', gap: 8, margin: '16px 0' } });
function domainOf(item) { try { return new URL(item.url || item.target || item.scan?.url).hostname; } catch (_) { return ''; } }
function download(items, type) { const text = type === 'json' ? JSON.stringify(items, null, 2) : [Object.keys(items[0] || {}).join(','), ...items.map((item) => Object.keys(items[0] || {}).map((key) => JSON.stringify(item[key] ?? '')).join(','))].join('\n'); const blob = new Blob([text], { type: type === 'json' ? 'application/json' : 'text/csv' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `phishion-history.${type}`; link.click(); URL.revokeObjectURL(link.href); }
export default function History() { const classes = useStyles(); const [scans, setScans] = useState([]); const [domain, setDomain] = useState(''); const [error, setError] = useState('');
  useEffect(() => { api.scans().then((data) => setScans(Array.isArray(data) ? data : data?.scans || [])).catch((e) => setError(e.message)); }, []);
  const filtered = useMemo(() => scans.filter((item) => domainOf(item).includes(domain.trim().toLowerCase())), [scans, domain]);
  return <><Header color="white" brand="Phishion" rightLinks={<HeaderLinks />} fixed /><main className={classes.container}><Card><CardContent><Typography variant="h4">Scan History</Typography><TextField label="Filter by domain" value={domain} onChange={(e) => setDomain(e.target.value)} fullWidth margin="normal" /><div className={classes.actions}><Button variant="outlined" onClick={() => download(filtered, 'csv')} disabled={!filtered.length}>Export CSV</Button><Button variant="outlined" onClick={() => download(filtered, 'json')} disabled={!filtered.length}>Export JSON</Button></div>{error && <Alert severity="error">{error}</Alert>}{filtered.map((item) => <div className={classes.row} key={item.id}><Typography>{item.url || item.target || item.scan?.url || 'Unknown URL'}</Typography><Typography variant="body2">{item.status || item.scan?.status || 'unknown'} · {item.scanned_at || item.created_at || item.createdAt || ''}</Typography></div>)}{!error && !filtered.length && <Typography>No scans found.</Typography>}</CardContent></Card></main></>;
}
