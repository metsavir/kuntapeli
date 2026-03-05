import { useEffect, useMemo, useRef, useState } from 'react';
import { municipalities } from '../../data/municipalities';
import { formatDate } from '../../utils/format';
import { MunicipalityCard } from './MunicipalityCard';
import './CoatCollection.css';

const municipalityByName = Object.fromEntries(
  municipalities.map((m) => [m.name, m]),
);

interface CoatCollectionProps {
  completedSet: Set<string>;
  completedOrder: string[];
  careerStats: Record<string, { attempts: number; date: string }>;
  failures: { name: string; guesses: number; date: string }[];
  visible: boolean;
}

type SortMode = 'region' | 'date' | 'tries';

const SORT_OPTIONS: { key: SortMode; label: string }[] = [
  { key: 'region', label: 'Maakunta' },
  { key: 'date', label: 'Päivämäärä' },
  { key: 'tries', label: 'Yritykset' },
];

export function CoatCollection({
  completedSet,
  completedOrder,
  careerStats,
  failures,
  visible,
}: CoatCollectionProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [sort, setSort] = useState<SortMode>('region');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visible) {
      scrollRef.current?.scrollTo(0, 0);
      setSelected(null);
    }
  }, [visible]);

  const failCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const f of failures) {
      map[f.name] = (map[f.name] ?? 0) + 1;
    }
    return map;
  }, [failures]);

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

  const { dateGroups, triesGroups } = useMemo(() => {
    const completed = municipalities
      .filter((m) => completedSet.has(m.name))
      .map((m) => ({
        name: m.name,
        stat: careerStats[m.name],
        tries: (failCounts[m.name] ?? 0) + 1,
      }));

    // Date groups
    const byDate = [...completed];
    const orderMap = new Map(completedOrder.map((n, i) => [n, i]));
    byDate.sort(
      (a, b) => (orderMap.get(b.name) ?? 0) - (orderMap.get(a.name) ?? 0),
    );
    const dateGroups: { label: string; names: string[] }[] = [];
    for (const item of byDate) {
      const label = item.stat ? formatDate(item.stat.date) : 'Tuntematon';
      const last = dateGroups[dateGroups.length - 1];
      if (last && last.label === label) {
        last.names.push(item.name);
      } else {
        dateGroups.push({ label, names: [item.name] });
      }
    }

    // Tries groups
    const byTries = [...completed];
    byTries.sort((a, b) => a.tries - b.tries);
    const triesBuckets = [1, 2, 3, 4, 5, 10, 20] as const;
    const triesLabel = (tries: number) => {
      if (tries === 1) return '1 yritys';
      if (tries <= 3) return `${tries} yritystä`;
      for (let i = triesBuckets.length - 1; i >= 0; i--) {
        if (tries >= triesBuckets[i]) {
          const next = triesBuckets[i + 1];
          return next
            ? `${triesBuckets[i]}–${next - 1} yritystä`
            : `${triesBuckets[i]}+ yritystä`;
        }
      }
      return `${tries} yritystä`;
    };
    const triesGroups: { label: string; names: string[] }[] = [];
    for (const item of byTries) {
      const label = triesLabel(item.tries);
      const last = triesGroups[triesGroups.length - 1];
      if (last && last.label === label) {
        last.names.push(item.name);
      } else {
        triesGroups.push({ label, names: [item.name] });
      }
    }
    for (const g of triesGroups)
      g.names.sort((a, b) => a.localeCompare(b, 'fi'));

    return { dateGroups, triesGroups };
  }, [completedSet, completedOrder, careerStats, failCounts]);

  const unguessed = useMemo(
    () =>
      municipalities
        .filter((m) => !completedSet.has(m.name))
        .sort((a, b) => a.name.localeCompare(b.name, 'fi')),
    [completedSet],
  );

  return (
    <div
      className="coat-collection"
      ref={scrollRef}
      onClick={() => setSelected(null)}
    >
      {selected &&
        (() => {
          const m = municipalityByName[selected];
          const failCount = failures.filter((f) => f.name === selected).length;
          return (
            <div className="coat-collection-card-wrap">
              <div
                className="coat-collection-card"
                onClick={(e) => e.stopPropagation()}
              >
                <MunicipalityCard
                  name={selected}
                  municipality={m}
                  stat={careerStats[selected]}
                  failCount={failCount}
                />
              </div>
            </div>
          );
        })()}
      <div className="coat-collection-body">
        <div
          className="coat-collection-sort"
          onClick={(e) => e.stopPropagation()}
        >
          {SORT_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              className={`coat-collection-sort-btn${sort === key ? ' coat-collection-sort-btn--active' : ''}`}
              onClick={() => setSort(key)}
            >
              {label}
            </button>
          ))}
        </div>
        <div
          className="coat-collection-regions"
          style={{ display: sort === 'region' ? undefined : 'none' }}
        >
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
                      onClick={(e) => {
                        if (done) {
                          e.stopPropagation();
                          setSelected(selected === name ? null : name);
                        }
                      }}
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
        {(['date', 'tries'] as const).map((mode) => (
          <div
            key={mode}
            className="coat-collection-regions"
            style={{ display: sort === mode ? undefined : 'none' }}
          >
            {(mode === 'date' ? dateGroups : triesGroups).map(
              ({ label, names }) => (
                <section key={label} className="coat-collection-region">
                  <h3 className="coat-collection-region-header">{label}</h3>
                  <div className="coat-collection-grid">
                    {names.map((name) => (
                      <button
                        key={name}
                        className="coat-collection-cell coat-collection-cell--done"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelected(selected === name ? null : name);
                        }}
                        aria-label={name}
                      >
                        <img
                          src={`${import.meta.env.BASE_URL}coats/${name}.png`}
                          alt=""
                          draggable={false}
                          loading="lazy"
                        />
                      </button>
                    ))}
                  </div>
                </section>
              ),
            )}
            <section className="coat-collection-region">
              <h3 className="coat-collection-region-header">Arvaamatta</h3>
              <div className="coat-collection-grid">
                {unguessed.map((m) => (
                  <button key={m.name} className="coat-collection-cell">
                    <img
                      src={`${import.meta.env.BASE_URL}coats/${m.name}.png`}
                      alt=""
                      draggable={false}
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            </section>
          </div>
        ))}
      </div>
    </div>
  );
}
