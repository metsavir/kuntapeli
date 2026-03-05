import { useMemo } from 'react';
import type { CareerProgress } from '../../data/types';
import { municipalities } from '../../data/municipalities';
import { Distribution, computeDistribution } from '../stats/StatsModal';
import { ProgressRing } from '../stats/ProgressRing';
import './CareerHistory.css';

interface CareerHistoryProps {
  progress: CareerProgress;
}

function careerToGames(progress: CareerProgress) {
  const games: { won: boolean; guesses: number }[] = progress.completed.map(
    (name) => ({
      won: true,
      guesses: progress.stats[name]?.attempts ?? 0,
    }),
  );
  for (const f of progress.failures ?? []) {
    games.push({ won: false, guesses: f.guesses });
  }
  return games;
}

function computeStats(progress: CareerProgress) {
  const entries = progress.completed.map((name) => ({
    ...(progress.stats[name] ?? { attempts: 0, date: '' }),
  }));

  const total = entries.length;
  const failures = progress.failures ?? [];
  const failCount = failures.length;
  const gamesPlayed = total + failCount;

  if (gamesPlayed === 0) return null;

  const attempts = entries.map((e) => e.attempts);
  const totalAttempts = attempts.reduce((a, b) => a + b, 0);
  const avg = total > 0 ? totalAttempts / total : 0;
  const firstTry = attempts.filter((a) => a === 1).length;
  const winRate = Math.round((total / gamesPlayed) * 100);

  return {
    total,
    gamesPlayed,
    avg,
    firstTryPct: total > 0 ? Math.round((firstTry / total) * 100) : 0,
    winRate,
    failCount,
  };
}

export function CareerHistory({ progress }: CareerHistoryProps) {
  const stats = useMemo(() => computeStats(progress), [progress]);
  const distribution = useMemo(
    () => computeDistribution(careerToGames(progress)),
    [progress],
  );

  if (!stats) {
    return (
      <div className="career-history-empty">Ei vielä pelattuja pelejä.</div>
    );
  }

  const completionPct = Math.round((stats.total / municipalities.length) * 100);

  return (
    <>
      <div className="career-hero">
        <ProgressRing
          value={completionPct}
          label={`${stats.total}/${municipalities.length}`}
          sublabel="kuntaa"
          color="var(--color-primary)"
        />
        <div className="career-hero-details">
          <div className="career-stat-row">
            <span className="career-stat-label">Voittoprosentti</span>
            <span className="career-stat-value">{stats.winRate}%</span>
          </div>
          <div className="career-stat-row">
            <span className="career-stat-label">Keskim. arvaukset</span>
            <span className="career-stat-value">{stats.avg.toFixed(1)}</span>
          </div>
          <div className="career-stat-row">
            <span className="career-stat-label">Ekalla arvauksella</span>
            <span className="career-stat-value">{stats.firstTryPct}%</span>
          </div>
          <div className="career-stat-row">
            <span className="career-stat-label">Epäonnistumisia</span>
            <span className="career-stat-value">{stats.failCount}</span>
          </div>
        </div>
      </div>

      <Distribution dist={distribution.dist} max={distribution.max} />
    </>
  );
}
