import { useEffect, useState } from 'react';
import './ProgressRing.css';

interface ProgressRingProps {
  value: number; // 0–100
  label: string;
  sublabel?: string;
  size?: number;
  color?: string;
}

export function ProgressRing({
  value,
  label,
  sublabel,
  size = 80,
  color = 'var(--color-correct)',
}: ProgressRingProps) {
  const [animated, setAnimated] = useState(false);
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - (animated ? value : 0) / 100);

  useEffect(() => {
    requestAnimationFrame(() => setAnimated(true));
  }, []);

  return (
    <div className="progress-ring" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`}>
        <circle
          className="progress-ring-bg"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <circle
          className="progress-ring-fill"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          style={{
            stroke: color,
            strokeDasharray: circumference,
            strokeDashoffset: offset,
          }}
        />
      </svg>
      <div className="progress-ring-text">
        <span
          className="progress-ring-value"
          style={label.length > 5 ? { fontSize: '0.8rem' } : undefined}
        >
          {label}
        </span>
        {sublabel && <span className="progress-ring-label">{sublabel}</span>}
      </div>
    </div>
  );
}
