import React, { useEffect, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';
import PageShell from '/components/PageShell/PageShell.js';
import Seo from '/components/Seo/Seo.js';
import Card from '/components/Card/Card.js';
import CardBody from '/components/Card/CardBody.js';
import GridContainer from '/components/Grid/GridContainer.js';
import GridItem from '/components/Grid/GridItem.js';
import Button from '/components/CustomButtons/Button.js';
import EmptyState from '/components/EmptyState/EmptyState.js';
import LoadingBar from '/components/LoadingBar/LoadingBar.js';
import { api } from '../lib/api';
import { useNotify } from '../context/NotificationContext';

const useStyles = makeStyles((theme) => ({
  select: { minWidth: 260, marginBottom: 16 },
  metric: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' },
}));

export default function Compare() {
  const classes = useStyles();
  const notify = useNotify();
  const [scans, setScans] = useState([]);
  const [idA, setIdA] = useState('');
  const [idB, setIdB] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.scans().then((data) => setScans(Array.isArray(data) ? data : data?.scans || [])).catch(() => {});
  }, []);

  const handleCompare = async () => {
    if (!idA || !idB) {
      notify.warning('Select two scans to compare');
      return;
    }
    if (idA === idB) {
      notify.warning('Choose two different scans');
      return;
    }
    setLoading(true);
    try {
      const res = await api.compareScans(idA, idB);
      setResult(res);
    } catch (err) {
      notify.error(err.message || 'Comparison failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell title="Compare Scans" subtitle="See how two scan results differ, side by side.">
      <Seo
        title="Compare Scans"
        description="Put two scan results side by side to see how a URL verdict, its detection counts, and its engine coverage changed between the runs."
        path="/compare"
      />
      <Card>
        <CardBody>
          <GridContainer>
            <GridItem xs={12} sm={5}>
              <FormControl className={classes.select} fullWidth>
                <InputLabel>Scan A</InputLabel>
                <Select value={idA} onChange={(e) => setIdA(e.target.value)}>
                  {scans.map((s) => (
                    <MenuItem key={s.id} value={s.id}>{s.url.slice(0, 50)}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </GridItem>
            <GridItem xs={12} sm={5}>
              <FormControl className={classes.select} fullWidth>
                <InputLabel>Scan B</InputLabel>
                <Select value={idB} onChange={(e) => setIdB(e.target.value)}>
                  {scans.map((s) => (
                    <MenuItem key={s.id} value={s.id}>{s.url.slice(0, 50)}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </GridItem>
            <GridItem xs={12} sm={2}>
              <Button color="primary" onClick={handleCompare} disabled={loading}>Compare</Button>
            </GridItem>
          </GridContainer>
        </CardBody>
      </Card>

      {loading && <LoadingBar label="Comparing scans..." />}

      {!loading && !result && scans.length === 0 && (
        <EmptyState icon="compare" title="No scans available yet" hint="Run a scan first from the Inspect page." />
      )}

      {!loading && result && (
        <GridContainer>
          {[result.scan1, result.scan2].map((scan, idx) => (
            <GridItem xs={12} md={6} key={scan.id}>
              <Card>
                <CardBody>
                  <h4>Scan {idx === 0 ? 'A' : 'B'}</h4>
                  <p style={{ wordBreak: 'break-all', fontWeight: 600 }}>{scan.url}</p>
                  <div className={classes.metric}><span>Verdict</span><strong>{scan.verdict || 'pending'}</strong></div>
                  <div className={classes.metric}><span>Malicious</span><strong>{scan.malicious}</strong></div>
                  <div className={classes.metric}><span>Suspicious</span><strong>{scan.suspicious}</strong></div>
                  <div className={classes.metric}><span>Harmless</span><strong>{scan.harmless}</strong></div>
                </CardBody>
              </Card>
            </GridItem>
          ))}
          <GridItem xs={12}>
            <Card>
              <CardBody>
                <h4>Summary</h4>
                <div className={classes.metric}>
                  <span>Verdicts match</span>
                  <strong style={{ color: result.comparison.verdict_match ? '#2e7d32' : '#c62828' }}>
                    {result.comparison.verdict_match ? 'Yes' : 'No'}
                  </strong>
                </div>
                <div className={classes.metric}><span>Malicious difference</span><strong>{result.comparison.malicious_diff}</strong></div>
                <div className={classes.metric}><span>Suspicious difference</span><strong>{result.comparison.suspicious_diff}</strong></div>
              </CardBody>
            </Card>
          </GridItem>
        </GridContainer>
      )}
    </PageShell>
  );
}
