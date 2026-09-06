import React, { useState } from 'react';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';
import Icon from '@material-ui/core/Icon';
import PageShell from '/components/PageShell/PageShell.js';
import Seo from '/components/Seo/Seo.js';
import Card from '/components/Card/Card.js';
import CardBody from '/components/Card/CardBody.js';
import GridContainer from '/components/Grid/GridContainer.js';
import GridItem from '/components/Grid/GridItem.js';
import Button from '/components/CustomButtons/Button.js';
import CustomInput from '/components/CustomInput/CustomInput.js';
import Pagination from '/components/Pagination/Pagination.js';
import EmptyState from '/components/EmptyState/EmptyState.js';
import LoadingBar from '/components/LoadingBar/LoadingBar.js';
import { api, exportUrl } from '../lib/api';
import { useNotify } from '../context/NotificationContext';
import { usePagination } from '../lib/usePagination';
import { verdictColors } from '../context/ThemeContext';

const useStyles = makeStyles((theme) => ({
  toolbar: {
    display: 'flex',
    gap: theme.spacing(1.5),
    marginTop: theme.spacing(2.5),
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  spacer: { flex: 1, minWidth: theme.spacing(2) },
  resultsHead: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
    margin: `0 0 ${theme.spacing(1)}px`,
  },
  resultsTitle: { margin: 0, fontSize: '1.125rem', fontWeight: 700 },
  count: { color: theme.palette.text.secondary, fontVariantNumeric: 'tabular-nums', fontSize: 14 },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr auto auto',
    alignItems: 'center',
    gap: theme.spacing(2),
    padding: theme.spacing(1.5, 0.5),
    borderBottom: `1px solid ${theme.palette.divider}`,
    '&:last-child': { borderBottom: 'none' },
    '@media (max-width: 600px)': {
      gridTemplateColumns: '1fr auto',
    },
  },
  url: { wordBreak: 'break-all', color: theme.palette.text.primary },
  date: {
    color: theme.palette.text.secondary,
    fontSize: 13,
    whiteSpace: 'nowrap',
    '@media (max-width: 600px)': { gridColumn: '1 / -1' },
  },
  pill: {
    display: 'inline-block',
    padding: '2px 12px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    textTransform: 'capitalize',
    border: '1px solid transparent',
    whiteSpace: 'nowrap',
  },
}));

export default function Search() {
  const classes = useStyles();
  const theme = useTheme();
  const notify = useNotify();
  const [query, setQuery] = useState('');
  const [verdict, setVerdict] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  const { pageItems, pages } = usePagination(results);
  const vc = verdictColors(theme);

  const pillStyle = (value) => {
    const tone = vc[value];
    if (!tone) {
      return {
        background: theme.palette.action.hover,
        color: theme.palette.text.secondary,
        borderColor: theme.palette.divider,
      };
    }
    return { background: tone.background, color: tone.color, borderColor: tone.border };
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setSearching(true);
    try {
      const params = {};
      if (query) params.q = query;
      if (verdict) params.verdict = verdict;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      const res = await api.searchScans(params);
      setResults(res.scans || []);
      setSearched(true);
    } catch (err) {
      notify.error(err.message || 'Search failed');
    } finally {
      setSearching(false);
    }
  };

  return (
    <PageShell title="Search & Export" subtitle="Filter your scan history by URL, verdict, and date range.">
      <Seo
        title="Search & Export"
        description="Filter your scan history by URL fragment, verdict, and date range, then export the matching results as CSV or JSON for reporting."
        path="/search"
      />
      <Card>
        <CardBody>
          <form onSubmit={handleSearch}>
            <GridContainer>
              <GridItem xs={12} md={4}>
                <CustomInput labelText="Search by URL" id="q" inputProps={{ value: query, onChange: (e) => setQuery(e.target.value) }} formControlProps={{ fullWidth: true }} />
              </GridItem>
              <GridItem xs={12} md={2}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="verdict-label">Verdict</InputLabel>
                  <Select labelId="verdict-label" value={verdict} onChange={(e) => setVerdict(e.target.value)}>
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="malicious">Malicious</MenuItem>
                    <MenuItem value="suspicious">Suspicious</MenuItem>
                    <MenuItem value="clean">Clean</MenuItem>
                  </Select>
                </FormControl>
              </GridItem>
              <GridItem xs={12} md={3}>
                <CustomInput labelText="From" id="date-from" inputProps={{ type: 'date', value: dateFrom, onChange: (e) => setDateFrom(e.target.value) }} formControlProps={{ fullWidth: true }} />
              </GridItem>
              <GridItem xs={12} md={3}>
                <CustomInput labelText="To" id="date-to" inputProps={{ type: 'date', value: dateTo, onChange: (e) => setDateTo(e.target.value) }} formControlProps={{ fullWidth: true }} />
              </GridItem>
            </GridContainer>
            <div className={classes.toolbar}>
              <Button color="primary" type="submit" disabled={searching}>
                <Icon>search</Icon> {searching ? 'Searching...' : 'Search'}
              </Button>
              <span className={classes.spacer} />
              <Button color="info" simple onClick={() => window.open(exportUrl('csv'), '_blank')}>
                <Icon>download</Icon> Export CSV
              </Button>
              <Button color="info" simple onClick={() => window.open(exportUrl('json'), '_blank')}>
                <Icon>download</Icon> Export JSON
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <div className={classes.resultsHead}>
            <h4 className={classes.resultsTitle}>Results</h4>
            <span className={classes.count}>{results.length} match{results.length === 1 ? '' : 'es'}</span>
          </div>
          {searching && <LoadingBar label="Searching..." />}
          {!searching && searched && results.length === 0 && (
            <EmptyState icon="search_off" title="No matches" hint="Try adjusting your filters." />
          )}
          {!searching && !searched && results.length === 0 && (
            <EmptyState icon="manage_search" title="Search your scans" hint="Enter a URL, verdict, or date range above, then hit Search." />
          )}
          {!searching && pageItems.map((scan) => (
            <div className={classes.row} key={scan.id}>
              <span className={classes.url}>{scan.url}</span>
              <span className={classes.pill} style={pillStyle(scan.verdict)}>
                {scan.verdict || scan.status || 'unknown'}
              </span>
              <span className={classes.date}>{new Date(scan.scanned_at).toLocaleString()}</span>
            </div>
          ))}
          {!searching && results.length > 0 && (
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
              <Pagination pages={pages} />
            </div>
          )}
        </CardBody>
      </Card>
    </PageShell>
  );
}
