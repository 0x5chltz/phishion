import React, { useState } from 'react';
import Router from 'next/router';
import { makeStyles } from '@material-ui/core/styles';
import PageShell from '/components/PageShell/PageShell.js';
import Card from '/components/Card/Card.js';
import CardBody from '/components/Card/CardBody.js';
import Button from '/components/CustomButtons/Button.js';
import { api } from '../lib/api';
import { useNotify } from '../context/NotificationContext';

const useStyles = makeStyles(() => ({
  card: { maxWidth: 480, margin: '0 auto', textAlign: 'center' },
}));

export default function DeleteAccount() {
  const classes = useStyles();
  const notify = useNotify();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.deleteAccount();
      notify.success('Account deleted');
      Router.push('/app');
    } catch (err) {
      notify.error(err.message || 'Failed to delete account');
      setDeleting(false);
    }
  };

  return (
    <PageShell title="Delete Account">
      <Card className={classes.card}>
        <CardBody>
          <p>
            This will permanently delete your account and every scan associated with it.
            This action cannot be undone.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 16 }}>
            <Button color="transparent" onClick={() => Router.push('/profile')} disabled={deleting}>
              Cancel
            </Button>
            <Button color="danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Yes, delete my account'}
            </Button>
          </div>
        </CardBody>
      </Card>
    </PageShell>
  );
}
