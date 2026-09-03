import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import SnackbarContent from '/components/Snackbar/SnackbarContent.js';

const NotificationContext = createContext(null);

const COLOR_BY_TYPE = {
  success: 'success',
  error: 'danger',
  warning: 'warning',
  info: 'info',
};

let idCounter = 0;

export function NotificationProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const notify = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++idCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
    timers.current[id] = setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  const value = useMemo(() => ({
    notify,
    success: (message, duration) => notify(message, 'success', duration),
    error: (message, duration) => notify(message, 'error', duration),
    warning: (message, duration) => notify(message, 'warning', duration),
    info: (message, duration) => notify(message, 'info', duration),
  }), [notify]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 2000,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          maxWidth: 360,
        }}
      >
        {toasts.map((toast) => (
          <div key={toast.id} onClick={() => dismiss(toast.id)} style={{ cursor: 'pointer' }}>
            <SnackbarContent
              message={toast.message}
              color={COLOR_BY_TYPE[toast.type] || 'info'}
              close
            />
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotify() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    return {
      notify: () => {},
      success: () => {},
      error: () => {},
      warning: () => {},
      info: () => {},
    };
  }
  return ctx;
}
