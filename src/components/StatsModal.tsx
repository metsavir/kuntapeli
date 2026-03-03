import { useState, useMemo } from 'react';
import type { PlayerStats, GameMode, ClueType, CareerProgress } from '../data/types';
import { CareerHistory } from './CareerHistory';
import { MAX_GUESSES } from '../utils/game';
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
  const avgGuesses = wins.length > 0
    ? wins.reduce((sum, g) => sum + g.guesses, 0) / wins.length
    : 0;
  const firstTry = wins.filter((g) => g.guesses === 1).length;
  const firstTryPct = wins.length > 0 ? Math.round((firstTry / wins.length) * 100) : 0;
  const avgHints = games.reduce((sum, g) => sum + g.hintsUsed, 0) / total;

  return { total, wins: wins.length, winRate, avgGuesses, firstTry, firstTryPct, avgHints };
}

function computeDistribution(stats: PlayerStats, mode?: GameMode) {
  const games = mode ? stats.games.filter((g) => g.mode === mode) : stats.games;
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

function Distribution({ dist, max }: { dist: Record<string, number>; max: number }) {
  return (
    <>
      <div className="stats-section-title">Arvausjakauma</div>
      <div className="stats-distribution">
        {Object.entries(dist).map(([key, count]) => (
          <div key={key} className="stats-dist-row">
            <span className="stats-dist-label">{key}</span>
            <div className="stats-dist-bar-bg">
              <div
                className={`stats-dist-bar${key === 'X' ? ' stats-dist-bar--loss' : ''}`}
                style={{ width: `${(count / max) * 100}%` }}
              />
            </div>
            <span className="stats-dist-count">{count}</span>
          </div>
        ))}
      </div>
    </>
  );
}

const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'Kaikki' },
  { key: 'daily', label: 'Päivittäinen' },
  { key: 'casual', label: 'Harjoittelu' },
  { key: 'career', label: 'Ura' },
];

export function StatsModal({ stats, careerProgress, clueType, initialTab = 'all', onClose }: StatsModalProps) {
  const [tab, setTab] = useState<Tab>(initialTab);

  // Filter stats to current clue type
  const filtered = useMemo<PlayerStats>(() => ({
    ...stats,
    games: stats.games.filter((g) => g.clueType === clueType),
  }), [stats, clueType]);

  const streakInfo = stats.dailyStreaks?.[clueType] ?? { streak: 0, maxStreak: 0, lastDate: '' };

  const allStats = useMemo(() => computeModeStats(filtered), [filtered]);
  const dailyStats = useMemo(() => computeModeStats(filtered, 'daily'), [filtered]);
  const casualStats = useMemo(() => computeModeStats(filtered, 'casual'), [filtered]);
  const allDist = useMemo(() => computeDistribution(filtered), [filtered]);
  const dailyDist = useMemo(() => computeDistribution(filtered, 'daily'), [filtered]);
  const casualDist = useMemo(() => computeDistribution(filtered, 'casual'), [filtered]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal stats-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
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
          {tab === 'all' && (
            allStats ? (
              <>
                <div className="stats-grid">
                  <div className="stats-item">
                    <span className="stats-value">{allStats.total}</span>
                    <span className="stats-label">pelejä</span>
                  </div>
                  <div className="stats-item">
                    <span className="stats-value">{allStats.winRate} %</span>
                    <span className="stats-label">voittoprosentti</span>
                  </div>
                  <div className="stats-item">
                    <span className="stats-value">{allStats.avgGuesses.toFixed(1)}</span>
                    <span className="stats-label">keskim. arvaukset</span>
                  </div>
                  <div className="stats-item">
                    <span className="stats-value">{allStats.firstTryPct} %</span>
                    <span className="stats-label">ekalla arvauksella</span>
                  </div>
                  <div className="stats-item">
                    <span className="stats-value">{allStats.avgHints.toFixed(1)}</span>
                    <span className="stats-label">keskim. vihjeet</span>
                  </div>
                </div>
                <Distribution dist={allDist.dist} max={allDist.max} />
              </>
            ) : (
              <p className="stats-empty">Ei vielä pelattuja pelejä.</p>
            )
          )}

          {tab === 'daily' && (
            dailyStats ? (
              <>
                <div className="stats-grid">
                  <div className="stats-item">
                    <span className="stats-value">{dailyStats.total}</span>
                    <span className="stats-label">pelejä</span>
                  </div>
                  <div className="stats-item">
                    <span className="stats-value">{dailyStats.winRate} %</span>
                    <span className="stats-label">voittoprosentti</span>
                  </div>
                  <div className="stats-item">
                    <span className="stats-value">{streakInfo.streak}</span>
                    <span className="stats-label">putki</span>
                  </div>
                  <div className="stats-item">
                    <span className="stats-value">{streakInfo.maxStreak}</span>
                    <span className="stats-label">paras putki</span>
                  </div>
                  <div className="stats-item">
                    <span className="stats-value">{dailyStats.avgHints.toFixed(1)}</span>
                    <span className="stats-label">keskim. vihjeet</span>
                  </div>
                </div>
                <Distribution dist={dailyDist.dist} max={dailyDist.max} />
              </>
            ) : (
              <p className="stats-empty">Ei vielä pelattuja päivittäisiä pelejä.</p>
            )
          )}

          {tab === 'casual' && (
            casualStats ? (
              <>
                <div className="stats-grid">
                  <div className="stats-item">
                    <span className="stats-value">{casualStats.total}</span>
                    <span className="stats-label">pelejä</span>
                  </div>
                  <div className="stats-item">
                    <span className="stats-value">{casualStats.winRate} %</span>
                    <span className="stats-label">voittoprosentti</span>
                  </div>
                  <div className="stats-item">
                    <span className="stats-value">{casualStats.avgGuesses.toFixed(1)}</span>
                    <span className="stats-label">keskim. arvaukset</span>
                  </div>
                  <div className="stats-item">
                    <span className="stats-value">{casualStats.firstTryPct} %</span>
                    <span className="stats-label">ekalla arvauksella</span>
                  </div>
                  <div className="stats-item">
                    <span className="stats-value">{casualStats.avgHints.toFixed(1)}</span>
                    <span className="stats-label">keskim. vihjeet</span>
                  </div>
                </div>
                <Distribution dist={casualDist.dist} max={casualDist.max} />
              </>
            ) : (
              <p className="stats-empty">Ei vielä pelattuja harjoittelupelejä.</p>
            )
          )}

          {tab === 'career' && (
            <CareerHistory progress={careerProgress} />
          )}
        </div>
      </div>
    </div>
  );
}
