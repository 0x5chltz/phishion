import React from 'react';
import Icon from '@material-ui/core/Icon';
import { useTheme } from '@material-ui/core/styles';

export default function EmptyState({ icon = 'inbox', title = 'Nothing here yet', hint }) {
  const theme = useTheme();
  return (
    <div style={{ textAlign: 'center', padding: '56px 16px', color: theme.palette.text.secondary }}>
      <Icon style={{ fontSize: 44, marginBottom: 12, color: theme.palette.divider }}>{icon}</Icon>
      <div style={{ fontSize: 16, fontWeight: 600, color: theme.palette.text.primary }}>{title}</div>
      {hint && <div style={{ fontSize: 14, marginTop: 6, color: theme.palette.text.secondary }}>{hint}</div>}
    </div>
  );
}
