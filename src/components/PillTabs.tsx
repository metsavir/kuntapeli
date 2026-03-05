import { useRef, useLayoutEffect } from 'react';
import './PillTabs.css';

interface PillTabsProps<K extends string> {
  options: { key: K; label: string }[];
  value: K;
  onChange: (key: K) => void;
  className?: string;
  stopPropagation?: boolean;
}

export function PillTabs<K extends string>({
  options,
  value,
  onChange,
  className,
  stopPropagation,
}: PillTabsProps<K>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const el = indicatorRef.current;
    if (!container || !el) return;
    const idx = options.findIndex((o) => o.key === value);
    const btn = container.children[idx + 1] as HTMLElement;
    if (!btn) return;

    if (firstRender.current) {
      el.style.transition = 'none';
    }
    el.style.left = btn.offsetLeft + 'px';
    el.style.width = btn.offsetWidth + 'px';
    el.style.visibility = 'visible';

    if (firstRender.current) {
      el.offsetHeight;
      el.style.transition = '';
      firstRender.current = false;
    }
  }, [value, options]);

  return (
    <div
      className={`pill-tabs${className ? ` ${className}` : ''}`}
      ref={containerRef}
    >
      <div
        className="pill-tabs-indicator"
        ref={indicatorRef}
        style={{ visibility: 'hidden' }}
      />
      {options.map(({ key, label }) => (
        <button
          key={key}
          className={`pill-tabs-btn${value === key ? ' pill-tabs-btn--active' : ''}`}
          onClick={
            stopPropagation
              ? (e) => {
                  e.stopPropagation();
                  onChange(key);
                }
              : () => onChange(key)
          }
        >
          {label}
        </button>
      ))}
    </div>
  );
}
