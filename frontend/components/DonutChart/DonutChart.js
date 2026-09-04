import React from 'react';
import { useTheme } from '@material-ui/core/styles';

const RADIUS = 60;
const STROKE = 22;
const CIRC = 2 * Math.PI * RADIUS;

export default function DonutChart({ segments, size = 160 }) {
  const theme = useTheme();
  const total = segments.reduce((sum, seg) => sum + (seg.value || 0), 0);
  let offset = 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
      <svg width={size} height={size} viewBox="0 0 160 160">
        <circle cx="80" cy="80" r={RADIUS} fill="none" stroke={theme.palette.divider} strokeWidth={STROKE} />
        {total > 0 && segments.map((seg, idx) => {
          if (!seg.value) return null;
          const fraction = seg.value / total;
          const dash = fraction * CIRC;
          const circle = (
            <circle
              key={idx}
              cx="80"
              cy="80"
              r={RADIUS}
              fill="none"
              stroke={seg.color}
              strokeWidth={STROKE}
              strokeDasharray={`${dash} ${CIRC - dash}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 80 80)"
              style={{ transition: 'stroke-dasharray 0.6s ease' }}
            />
          );
          offset += dash;
          return circle;
        })}
        <text x="80" y="80" textAnchor="middle" dominantBaseline="middle" fontSize="28" fontWeight="700" fill="currentColor">
          {total}
        </text>
        <text x="80" y="104" textAnchor="middle" dominantBaseline="middle" fontSize="12" fill={theme.palette.text.secondary}>
          total
        </text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {segments.map((seg, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: seg.color, display: 'inline-block' }} />
            <span style={{ fontSize: 14 }}>{seg.label}</span>
            <strong style={{ fontSize: 14 }}>{seg.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
