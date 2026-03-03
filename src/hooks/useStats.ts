import { useState, useCallback, useEffect } from 'react';
import type { GameRecord, PlayerStats, DailyStreakInfo } from '../data/types';

const STORAGE_KEY = 'kuntapeli-stats';

const emptyStreak: DailyStreakInfo = { streak: 0, maxStreak: 0, lastDate: '' };

function emptyStats(): PlayerStats {
  return { games: [], dailyStreaks: {} };
}

function migrateStats(raw: PlayerStats): PlayerStats {
  // Migrate old flat streak fields → per-clueType dailyStreaks
  if (!raw.dailyStreaks && raw.dailyStreak != null) {
    return {
      games: raw.games,
      dailyStreaks: {
        shape: { streak: raw.dailyStreak, maxStreak: raw.dailyMaxStreak ?? 0, lastDate: raw.lastDailyDate ?? '' },
        coatOfArms: { ...emptyStreak },
      },
    };
  }
  return { games: raw.games, dailyStreaks: raw.dailyStreaks ?? {} };
}

function loadStats(): PlayerStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStats();
    return migrateStats(JSON.parse(raw) as PlayerStats);
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
