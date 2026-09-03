import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';
import Icon from '@material-ui/core/Icon';
import PageShell from '/components/PageShell/PageShell.js';
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

const useStyles = makeStyles(() => ({
  row: { borderBottom: '1px solid #eee', padding: '12px 4px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
}));

export default function Search() {
  const classes = useStyles();
  const notify = useNotify();
  const [query, setQuery] = useState('');
  const [verdict, setVerdict] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  const { pageItems, pages } = usePagination(results);

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
      <Card>
        <CardBody>
          <form onSubmit={handleSearch}>
            <GridContainer>
              <GridItem xs={12} md={4}>
                <CustomInput labelText="Search by URL" id="q" inputProps={{ value: query, onChange: (e) => setQuery(e.target.value) }} formControlProps={{ fullWidth: true }} />
              </GridItem>
              <GridItem xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Verdict</InputLabel>
                  <Select value={verdict} onChange={(e) => setVerdict(e.target.value)}>
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
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <Button color="primary" type="submit" disabled={searching}>
                {searching ? 'Searching...' : 'Search'}
              </Button>
              <Button color="info" onClick={() => window.open(exportUrl('csv'), '_blank')}>
                <Icon>download</Icon> Export CSV
              </Button>
              <Button color="rose" onClick={() => window.open(exportUrl('json'), '_blank')}>
                <Icon>download</Icon> Export JSON
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h4>Results ({results.length})</h4>
          {searching && <LoadingBar label="Searching..." />}
          {!searching && searched && results.length === 0 && (
            <EmptyState icon="search_off" title="No matches" hint="Try adjusting your filters." />
          )}
          {!searching && pageItems.map((scan) => (
            <div className={classes.row} key={scan.id}>
              <span style={{ wordBreak: 'break-all', flex: 1 }}>{scan.url}</span>
              <span style={{ fontWeight: 600 }}>{scan.verdict || scan.status}</span>
              <span style={{ color: '#888' }}>{new Date(scan.scanned_at).toLocaleString()}</span>
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
