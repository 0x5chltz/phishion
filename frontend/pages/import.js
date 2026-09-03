import React, { useRef, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Icon from '@material-ui/core/Icon';
import PageShell from '/components/PageShell/PageShell.js';
import Card from '/components/Card/Card.js';
import CardBody from '/components/Card/CardBody.js';
import Button from '/components/CustomButtons/Button.js';
import EmptyState from '/components/EmptyState/EmptyState.js';
import { importScans } from '../lib/api';
import { useNotify } from '../context/NotificationContext';

const useStyles = makeStyles(() => ({
  dropzone: {
    border: '2px dashed #ccc',
    borderRadius: 8,
    padding: 48,
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'border-color 0.2s, background 0.2s',
  },
  dropzoneActive: {
    borderColor: '#9c27b0',
    background: '#f9f0fb',
  },
  resultRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 12px',
    borderRadius: 6,
    marginBottom: 8,
  },
}));

export default function BulkImport() {
  const classes = useStyles();
  const notify = useNotify();
  const inputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFile = async (file) => {
    if (!file) return;
    if (!/\.(csv|txt)$/i.test(file.name)) {
      notify.error('Only .csv or .txt files are supported');
      return;
    }
    setUploading(true);
    try {
      const res = await importScans(file);
      setResult(res);
      notify.success(`Imported ${res.total} URLs`);
    } catch (err) {
      notify.error(err.message || 'Import failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  };

  return (
    <PageShell title="Bulk Import" subtitle="Upload a CSV or TXT file with URLs to queue for scanning.">
      <Card>
        <CardBody>
          <div
            className={`${classes.dropzone} ${dragActive ? classes.dropzoneActive : ''}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
          >
            <Icon style={{ fontSize: 48, color: '#9c27b0' }}>cloud_upload</Icon>
            <p style={{ marginTop: 12 }}>
              {uploading ? 'Uploading...' : 'Drag & drop a CSV/TXT file here, or click to browse'}
            </p>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.txt"
              hidden
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </div>
        </CardBody>
      </Card>

      {result && (
        <Card>
          <CardBody>
            <h4>Import Results</h4>
            <p style={{ color: '#888' }}>
              {result.total} submitted · {result.skipped || 0} skipped · {result.errors.length} errors
            </p>
            {result.scans.length === 0 && result.errors.length === 0 ? (
              <EmptyState icon="upload_file" title="Nothing imported" />
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
