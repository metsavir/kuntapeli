import { useEffect, useMemo, useRef, useState } from 'react';
import { municipalities } from '../../data/municipalities';
import { formatPopulation, formatDate } from '../../utils/format';
import './CoatCollection.css';

const municipalityByName = Object.fromEntries(
  municipalities.map((m) => [m.name, m]),
);

interface CoatCollectionProps {
  completedSet: Set<string>;
  careerStats: Record<string, { attempts: number; date: string }>;
  visible: boolean;
}

export function CoatCollection({
  completedSet,
  careerStats,
  visible,
}: CoatCollectionProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visible) {
      scrollRef.current?.scrollTo(0, 0);
      setSelected(null);
    }
  }, [visible]);

  const regions = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const m of municipalities) {
      const list = map.get(m.region) ?? [];
      list.push(m.name);
      map.set(m.region, list);
    }
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0], 'fi'))
      .map(([region, names]) => ({
        region,
        names: names.sort((a, b) => a.localeCompare(b, 'fi')),
        completed: names.filter((n) => completedSet.has(n)).length,
      }));
  }, [completedSet]);

  return (
    <div className="coat-collection" ref={scrollRef}>
      {selected &&
        (() => {
          const m = municipalityByName[selected];
          const stat = careerStats[selected];
          return (
            <div className="coat-collection-card-wrap">
              <div
                className="coat-collection-card"
                onClick={() => setSelected(null)}
              >
                <img
                  src={`${import.meta.env.BASE_URL}coats/${selected}.png`}
                  alt=""
                  className="fm-card-coat"
                  draggable={false}
                />
                <div className="fm-card-info">
                  <div className="fm-card-name">{selected}</div>
                  <div className="fm-card-detail">
                    {m.region} — {formatPopulation(m.population)} asukasta
                  </div>
                  {stat && (
                    <div className="fm-card-detail">
                      {stat.attempts === 1
                        ? '1 arvaus'
                        : `${stat.attempts} arvausta`}{' '}
                      — {formatDate(stat.date)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
      <div className="coat-collection-regions">
        {regions.map(({ region, names, completed }) => (
          <section key={region} className="coat-collection-region">
            <h3 className="coat-collection-region-header">
              {region}{' '}
              <span className="coat-collection-count">
                {completed}/{names.length}
              </span>
            </h3>
            <div className="coat-collection-grid">
              {names.map((name) => {
                const done = completedSet.has(name);
                return (
                  <button
                    key={name}
                    className={`coat-collection-cell${done ? ' coat-collection-cell--done' : ''}`}
                    onClick={() =>
                      done && setSelected(selected === name ? null : name)
                    }
                    aria-label={done ? name : undefined}
                  >
                    <img
                      src={`${import.meta.env.BASE_URL}coats/${name}.png`}
                      alt=""
                      draggable={false}
                      loading="lazy"
                    />
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
