import { useMemo } from 'react';
import type { CareerProgress } from '../../data/types';
import { municipalities } from '../../data/municipalities';
import { Distribution, computeDistribution } from '../stats/StatsModal';
import './CareerHistory.css';

const regionByName: Record<string, string> = {};
for (const m of municipalities) {
  regionByName[m.name] = m.region;
}

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
    name,
    region: regionByName[name] ?? '',
    ...(progress.stats[name] ?? { attempts: 0, date: '' }),
  }));

  const total = entries.length;
  const failures = progress.failures ?? [];
  const failCount = failures.length;
  const gamesPlayed = total + failCount;

  if (gamesPlayed === 0) return null;

  const attempts = entries.map((e) => e.attempts);
  const totalAttempts = attempts.reduce((a, b) => a + b, 0);
  const failAttempts = failures.reduce((a, f) => a + f.guesses, 0);
  const avg = total > 0 ? totalAttempts / total : 0;
  const firstTry = attempts.filter((a) => a === 1).length;
  const winRate = Math.round((total / gamesPlayed) * 100);

  return {
    total,
    gamesPlayed,
    totalAttempts: totalAttempts + failAttempts,
    avg,
    firstTry,
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

  const entries = progress.completed
    .map((name) => ({
      name,
      region: regionByName[name] ?? '',
      ...(progress.stats[name] ?? { attempts: 0, date: '' }),
    }))
    .reverse();

  if (!stats) {
    return (
      <div className="career-history-empty">Ei vielä pelattuja pelejä.</div>
    );
  }

  return (
    <div className="career-history">
      <div className="career-summary">
        <div className="career-summary-grid">
          <div className="career-summary-item">
            <span className="career-summary-value">
              {stats.total}/{municipalities.length}
            </span>
            <span className="career-summary-label">kuntaa</span>
          </div>
          <div className="career-summary-item">
            <span className="career-summary-value">{stats.winRate} %</span>
            <span className="career-summary-label">voittoprosentti</span>
          </div>
          <div className="career-summary-item">
            <span className="career-summary-value">{stats.avg.toFixed(1)}</span>
            <span className="career-summary-label">keskim. arvaukset</span>
          </div>
          <div className="career-summary-item">
            <span className="career-summary-value">{stats.firstTryPct} %</span>
            <span className="career-summary-label">ekalla arvauksella</span>
          </div>
          <div className="career-summary-item">
            <span className="career-summary-value">{stats.totalAttempts}</span>
            <span className="career-summary-label">arvauksia yht.</span>
          </div>
          <div className="career-summary-item">
            <span className="career-summary-value">{stats.failCount}</span>
            <span className="career-summary-label">epäonnistumisia</span>
          </div>
        </div>
      </div>

      <Distribution dist={distribution.dist} max={distribution.max} />

      <div className="career-section-title">Historia</div>
      <div className="career-entries">
        {entries.map(({ name, region, attempts, date }) => (
          <div key={name} className="career-history-row">
            <div className="career-history-name">
              <span className="career-history-municipality">{name}</span>
              <span className="career-history-region">{region}</span>
            </div>
            <div className="career-history-meta">
              <span className="career-history-attempts">
                {attempts === 1 ? '1 arvaus' : `${attempts} arvausta`}
              </span>
              <span className="career-history-date">{date}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
