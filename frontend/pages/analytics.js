import React, { useEffect, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import PageShell from '/components/PageShell/PageShell.js';
import Seo from '/components/Seo/Seo.js';
import Card from '/components/Card/Card.js';
import CardBody from '/components/Card/CardBody.js';
import GridContainer from '/components/Grid/GridContainer.js';
import GridItem from '/components/Grid/GridItem.js';
import Button from '/components/CustomButtons/Button.js';
import LoadingBar from '/components/LoadingBar/LoadingBar.js';
import DonutChart from '/components/DonutChart/DonutChart.js';
import { api } from '../lib/api';
import { useNotify } from '../context/NotificationContext';

const useStyles = makeStyles((theme) => ({
  statCard: { textAlign: 'center', padding: '24px 12px' },
  statValue: { fontSize: 32, fontWeight: 700 },
  statLabel: { color: '#888', fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 },
}));

export default function Analytics() {
  const classes = useStyles();
  const notify = useNotify();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.analytics()
      .then((res) => setAnalytics(res.analytics))
      .catch((e) => notify.error(e.message || 'Failed to load analytics'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <PageShell title="Analytics Dashboard" subtitle="Threat trends and scan statistics across your account.">
      <Seo
        title="Analytics"
        description="Threat trends and verdict distribution across your scans, showing how many submitted URLs came back malicious, suspicious, or clean."
        path="/analytics"
      />
      {loading || !analytics ? (
        <LoadingBar label="Crunching analytics..." />
      ) : (
        <>
          <GridContainer>
            {[
              { label: 'Total Scans', value: analytics.total_scans, color: '#3f51b5' },
              { label: 'Completed', value: analytics.completed_scans, color: '#2e7d32' },
              { label: 'Malicious URLs', value: analytics.malicious_count, color: '#c62828' },
              { label: 'Suspicious URLs', value: analytics.suspicious_count, color: '#f9a825' },
            ].map((stat) => (
              <GridItem xs={12} sm={6} md={3} key={stat.label}>
                <Card>
                  <CardBody className={classes.statCard}>
                    <div className={classes.statValue} style={{ color: stat.color }}>{stat.value}</div>
                    <div className={classes.statLabel}>{stat.label}</div>
                  </CardBody>
                </Card>
              </GridItem>
            ))}
          </GridContainer>

          <GridContainer style={{ marginTop: 16 }}>
            <GridItem xs={12} md={6}>
              <Card>
                <CardBody>
                  <h4>Verdict Distribution</h4>
                  <DonutChart
                    segments={[
                      { label: 'Malicious', value: analytics.verdicts.malicious || 0, color: '#c62828' },
                      { label: 'Suspicious', value: analytics.verdicts.suspicious || 0, color: '#f9a825' },
                      { label: 'Clean', value: analytics.verdicts.clean || 0, color: '#2e7d32' },
                    ]}
                  />
                </CardBody>
              </Card>
            </GridItem>
            <GridItem xs={12} md={6}>
              <Card>
                <CardBody>
                  <h4>Quick Stats</h4>
                  <p>
                    Completion rate:{' '}
                    <strong>
                      {analytics.total_scans > 0 ? Math.round((analytics.completed_scans / analytics.total_scans) * 100) : 0}%
                    </strong>
                  </p>
                  <p>
                    Threat ratio:{' '}
                    <strong>
                      {analytics.total_scans > 0 ? Math.round((analytics.malicious_count / analytics.total_scans) * 100) : 0}%
                    </strong>
                  </p>
                </CardBody>
              </Card>
            </GridItem>
          </GridContainer>

          <Button color="primary" onClick={load} style={{ marginTop: 24 }}>
            Refresh Analytics
          </Button>
        </>
      )}
    </PageShell>
  );
}
