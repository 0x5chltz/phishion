import React from 'react';
import CustomLinearProgress from '/components/CustomLinearProgress/CustomLinearProgress.js';

export default function LoadingBar({ label = 'Loading...' }) {
  return (
    <div style={{ padding: '32px 0' }}>
      <CustomLinearProgress color="primary" variant="indeterminate" />
      <div style={{ textAlign: 'center', marginTop: 12, color: '#888', fontSize: 14 }}>{label}</div>
    </div>
  );
}
