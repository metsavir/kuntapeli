import { useState, useMemo } from 'react';
import type {
  PlayerStats,
  GameMode,
  ClueType,
  CareerProgress,
} from '../../data/types';
import { CareerHistory } from '../career/CareerHistory';
import { Modal } from '../Modal';
import { ProgressRing } from './ProgressRing';
import { MAX_GUESSES } from '../../utils/game';
import './StatsModal.css';

type Tab = 'all' | 'daily' | 'casual' | 'career';

interface StatsModalProps {
  stats: PlayerStats;
  careerProgress: CareerProgress;
  clueType: ClueType;
  initialTab?: Tab;
  onClose: () => void;
}

function computeModeStats(stats: PlayerStats, mode?: GameMode) {
  const games = mode ? stats.games.filter((g) => g.mode === mode) : stats.games;
  const total = games.length;
  if (total === 0) return null;

  const wins = games.filter((g) => g.won);
  const winRate = Math.round((wins.length / total) * 100);
  const avgGuesses =
    wins.length > 0
      ? wins.reduce((sum, g) => sum + g.guesses, 0) / wins.length
      : 0;
  const firstTry = wins.filter((g) => g.guesses === 1).length;
  const firstTryPct =
    wins.length > 0 ? Math.round((firstTry / wins.length) * 100) : 0;
  const avgHints = games.reduce((sum, g) => sum + g.hintsUsed, 0) / total;

  return {
    total,
    wins: wins.length,
    winRate,
    avgGuesses,
    firstTry,
    firstTryPct,
    avgHints,
  };
}

export function computeDistribution(
  games: { won: boolean; guesses: number }[],
) {
  const dist: Record<string, number> = {};
  for (let i = 1; i <= MAX_GUESSES; i++) dist[String(i)] = 0;
  dist['X'] = 0;

  for (const g of games) {
    if (g.won) {
      dist[String(g.guesses)] = (dist[String(g.guesses)] ?? 0) + 1;
    } else {
      dist['X']++;
    }
  }

  const max = Math.max(...Object.values(dist), 1);
  return { dist, max };
}

const BAR_COLORS = [
  'var(--color-correct)',
  '#4a9e44',
  '#5a9a3e',
  '#6b9538',
  '#7c8f32',
  '#8d892c',
];

export function Distribution({
  dist,
  max,
}: {
  dist: Record<string, number>;
  max: number;
}) {
  return (
    <div className="stats-distribution">
      {Object.entries(dist).map(([key, count], i) => (
        <div key={key} className="stats-dist-row">
          <span className="stats-dist-label">{key}</span>
          <div className="stats-dist-bar-bg">
            <div
              className="stats-dist-bar"
              style={{
                width: `${(count / max) * 100}%`,
                background:
                  key === 'X'
                    ? 'var(--color-error)'
                    : (BAR_COLORS[i] ?? BAR_COLORS[5]),
              }}
            />
          </div>
          <span className="stats-dist-count">{count}</span>
        </div>
      ))}
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="stats-row">
      <span className="stats-row-label">{label}</span>
      <span className="stats-row-value">{value}</span>
    </div>
  );
}

const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'Kaikki' },
  { key: 'daily', label: 'Päivittäinen' },
  { key: 'casual', label: 'Harjoittelu' },
  { key: 'career', label: 'Ura' },
];

export function StatsModal({
  stats,
  careerProgress,
  clueType,
  initialTab = 'all',
  onClose,
}: StatsModalProps) {
  const [tab, setTab] = useState<Tab>(initialTab);

  const filtered = useMemo<PlayerStats>(
    () => ({
      ...stats,
      games: stats.games.filter((g) => g.clueType === clueType),
    }),
    [stats, clueType],
  );

  const streakInfo = stats.dailyStreaks?.[clueType] ?? {
    streak: 0,
    maxStreak: 0,
    lastDate: '',
  };

  const allStats = useMemo(() => computeModeStats(filtered), [filtered]);
  const dailyStats = useMemo(
    () => computeModeStats(filtered, 'daily'),
    [filtered],
  );
  const casualStats = useMemo(
    () => computeModeStats(filtered, 'casual'),
    [filtered],
  );
  const allDist = useMemo(
    () => computeDistribution(filtered.games),
    [filtered],
  );
  const dailyDist = useMemo(
    () => computeDistribution(filtered.games.filter((g) => g.mode === 'daily')),
    [filtered],
  );
  const casualDist = useMemo(
    () =>
      computeDistribution(filtered.games.filter((g) => g.mode === 'casual')),
    [filtered],
  );

  const renderModeTab = (
    modeStats: ReturnType<typeof computeModeStats>,
    dist: { dist: Record<string, number>; max: number },
    emptyMsg: string,
    extra?: React.ReactNode,
  ) => {
    if (!modeStats) {
      return <p className="stats-empty">{emptyMsg}</p>;
    }
    return (
      <>
        <div className="stats-hero">
          <ProgressRing
            value={modeStats.winRate}
            label={`${modeStats.winRate}%`}
            sublabel="voitto"
          />
          <div className="stats-hero-details">
            <StatRow label="Pelejä" value={String(modeStats.total)} />
            <StatRow
              label="Keskim. arvaukset"
              value={modeStats.avgGuesses.toFixed(1)}
            />
            <StatRow
              label="Ekalla arvauksella"
              value={`${modeStats.firstTryPct}%`}
            />
            <StatRow
              label="Keskim. vihjeet"
              value={modeStats.avgHints.toFixed(1)}
            />
            {extra}
          </div>
        </div>
        <Distribution dist={dist.dist} max={dist.max} />
      </>
    );
  };

  return (
    <Modal onClose={onClose} className="stats-modal">
      <h2>Tilastot</h2>

      <div className="stats-tabs">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            className={`stats-tab${tab === key ? ' stats-tab--active' : ''}`}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="stats-content">
        {tab === 'all' &&
          renderModeTab(allStats, allDist, 'Ei vielä pelattuja pelejä.')}

        {tab === 'daily' &&
          renderModeTab(
            dailyStats,
            dailyDist,
            'Ei vielä pelattuja päivittäisiä pelejä.',
            <>
              <StatRow label="Putki" value={String(streakInfo.streak)} />
              <StatRow
                label="Paras putki"
                value={String(streakInfo.maxStreak)}
              />
            </>,
          )}

        {tab === 'casual' &&
          renderModeTab(
            casualStats,
            casualDist,
            'Ei vielä pelattuja harjoittelupelejä.',
          )}

        {tab === 'career' && (
          <CareerHistory progress={careerProgress} />
        )}
      </div>
    </Modal>
  );
}
