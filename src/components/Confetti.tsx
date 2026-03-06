import { useMemo } from 'react';
import { createPortal } from 'react-dom';
import './Confetti.css';

const COLORS = [
  '#4a6cf7',
  '#538d4e',
  '#e74c3c',
  '#f39c12',
  '#9b59b6',
  '#1abc9c',
];

export function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        delay: `${Math.random() * 0.8}s`,
        duration: `${1.5 + Math.random() * 1.5}s`,
        size: 6 + Math.random() * 6,
      })),
    [],
  );

  return createPortal(
    <div className="confetti">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: p.left,
            backgroundColor: p.color,
            width: p.size,
            height: p.size,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}
    </div>,
    document.body,
  );
}
