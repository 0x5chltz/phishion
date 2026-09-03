import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '/components/CustomButtons/Button.js';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      setState({
        title: options.title || 'Are you sure?',
        message: options.message || 'This action cannot be undone.',
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        danger: options.danger !== false,
        resolve,
      });
    });
  }, []);

  const handleClose = (result) => {
    if (state) state.resolve(result);
    setState(null);
  };

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <Dialog open={Boolean(state)} onClose={() => handleClose(false)} maxWidth="xs" fullWidth>
        {state && (
          <>
            <DialogTitle>{state.title}</DialogTitle>
            <DialogContent>
              <DialogContentText>{state.message}</DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button color="transparent" onClick={() => handleClose(false)}>
                {state.cancelText}
              </Button>
              <Button color={state.danger ? 'danger' : 'primary'} onClick={() => handleClose(true)}>
                {state.confirmText}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    return { confirm: async () => window.confirm('Are you sure?') };
  }
  return ctx.confirm;
}
