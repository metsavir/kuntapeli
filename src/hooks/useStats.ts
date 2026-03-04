import { useState, useCallback, useEffect } from 'react';
import type { GameRecord, PlayerStats, DailyStreakInfo } from '../data/types';

const STORAGE_KEY = 'kuntapeli-stats';

const emptyStreak: DailyStreakInfo = { streak: 0, maxStreak: 0, lastDate: '' };

function emptyStats(): PlayerStats {
  return { games: [], dailyStreaks: {} };
}

function loadStats(): PlayerStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStats();
    const parsed = JSON.parse(raw) as PlayerStats;
    return { games: parsed.games, dailyStreaks: parsed.dailyStreaks ?? {} };
  } catch {
    return emptyStats();
  }
}

function saveStats(stats: PlayerStats): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
}

/** Check if dateA is exactly one day before dateB (YYYY-MM-DD strings) */
function isYesterday(dateA: string, dateB: string): boolean {
  const a = new Date(dateA + 'T00:00:00');
  const b = new Date(dateB + 'T00:00:00');
  const diff = b.getTime() - a.getTime();
  return diff === 86400000;
}

export function useStats() {
  const [stats, setStats] = useState<PlayerStats>(loadStats);

  useEffect(() => {
    saveStats(stats);
  }, [stats]);

  const recordGame = useCallback((record: GameRecord) => {
    setStats((prev) => {
      // Prevent duplicate daily records for same date + clueType
      if (record.mode === 'daily') {
        const alreadyRecorded = prev.games.some(
          (g) =>
            g.mode === 'daily' &&
            g.date === record.date &&
            g.clueType === record.clueType,
        );
        if (alreadyRecorded) return prev;
      }

      const games = [...prev.games, record];
      const dailyStreaks = { ...prev.dailyStreaks };

      if (record.mode === 'daily') {
        const key = record.clueType;
        const prev_streak = dailyStreaks[key] ?? { ...emptyStreak };
        let { streak, maxStreak, lastDate } = prev_streak;

        if (record.won) {
          if (lastDate === record.date) {
            // Already recorded a daily game today — no streak change
          } else if (isYesterday(lastDate, record.date)) {
            streak += 1;
          } else {
            streak = 1;
          }
          maxStreak = Math.max(maxStreak, streak);
        } else {
          streak = 0;
        }
        lastDate = record.date;

        dailyStreaks[key] = { streak, maxStreak, lastDate };
      }

      return { games, dailyStreaks };
    });
  }, []);

  return { stats, recordGame };
}
