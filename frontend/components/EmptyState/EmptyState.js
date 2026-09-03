import React from 'react';
import Icon from '@material-ui/core/Icon';

export default function EmptyState({ icon = 'inbox', title = 'Nothing here yet', hint }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 16px', color: '#999' }}>
      <Icon style={{ fontSize: 48, marginBottom: 12, color: '#ccc' }}>{icon}</Icon>
      <div style={{ fontSize: 18, fontWeight: 600, color: '#666' }}>{title}</div>
      {hint && <div style={{ fontSize: 14, marginTop: 6 }}>{hint}</div>}
    </div>
  );
}
