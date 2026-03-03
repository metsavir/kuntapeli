import { useState, useCallback, useEffect } from 'react';
import type { CareerProgress, Municipality } from '../data/types';
import { municipalities } from '../data/municipalities';
import { getTodayString } from '../utils/game';


const CAREER_KEY = 'kuntapeli-career';

function loadCareer(): CareerProgress {
  try {
    const raw = localStorage.getItem(CAREER_KEY);
    if (!raw) return { completed: [], stats: {} };
    return JSON.parse(raw) as CareerProgress;
  } catch {
    return { completed: [], stats: {} };
  }
}

function saveCareer(progress: CareerProgress): void {
  localStorage.setItem(CAREER_KEY, JSON.stringify(progress));
}

export function useCareer() {
  const [progress, setProgress] = useState<CareerProgress>(loadCareer);

  useEffect(() => {
    saveCareer(progress);
  }, [progress]);

  const completedSet = new Set(progress.completed);

  const markCompleted = useCallback((name: string, attempts: number) => {
    setProgress((prev) => {
      if (prev.completed.includes(name)) return prev;
      return {
        completed: [...prev.completed, name],
        stats: {
          ...prev.stats,
          [name]: { attempts, date: getTodayString() },
        },
      };
    });
  }, []);

  const markFailed = useCallback((name: string, guessCount: number) => {
    setProgress((prev) => ({
      ...prev,
      failures: [...(prev.failures ?? []), { name, guesses: guessCount, date: getTodayString() }],
    }));
  }, []);

  const getRandomUnguessed = useCallback((): Municipality | null => {
    const remaining = municipalities.filter((m) => !completedSet.has(m.name));
    if (remaining.length === 0) return null;
    return remaining[Math.floor(Math.random() * remaining.length)];
  }, [completedSet]);

  const getRegionStats = useCallback(() => {
    const regionMap = new Map<string, { total: number; completed: number }>();
    for (const m of municipalities) {
      const entry = regionMap.get(m.region) ?? { total: 0, completed: 0 };
      entry.total++;
      if (completedSet.has(m.name)) entry.completed++;
      regionMap.set(m.region, entry);
    }
    return [...regionMap.entries()].map(([region, counts]) => ({
      region,
      ...counts,
    }));
  }, [completedSet]);

  return {
    progress,
    completedSet,
    completedCount: progress.completed.length,
    totalCount: municipalities.length,
    markCompleted,
    markFailed,
    getRandomUnguessed,
    getRegionStats,
  };
}
