import { useState, useCallback, useEffect } from 'react';
import type { CareerProgress, ClueType, Municipality } from '../data/types';
import { municipalities } from '../data/municipalities';
import { getTodayString } from '../utils/game';


function careerKey(clueType: ClueType): string {
  return `kuntapeli-career-${clueType}`;
}

function loadCareer(clueType: ClueType): CareerProgress {
  try {
    // Try clue-type-specific key first, fall back to legacy key for migration
    const raw = localStorage.getItem(careerKey(clueType))
      ?? (clueType === 'shape' ? localStorage.getItem('kuntapeli-career') : null);
    if (!raw) return { completed: [], stats: {} };
    return JSON.parse(raw) as CareerProgress;
  } catch {
    return { completed: [], stats: {} };
  }
}

function saveCareer(clueType: ClueType, progress: CareerProgress): void {
  localStorage.setItem(careerKey(clueType), JSON.stringify(progress));
}

export function useCareer(clueType: ClueType) {
  const [progress, setProgress] = useState<CareerProgress>(() => loadCareer(clueType));

  // Reload progress when clue type changes
  useEffect(() => {
    setProgress(loadCareer(clueType));
  }, [clueType]);

  useEffect(() => {
    saveCareer(clueType, progress);
  }, [clueType, progress]);

  const completedSet = new Set(progress.completed);
  const failedSet = new Set(
    (progress.failures ?? []).map((f) => f.name).filter((n) => !completedSet.has(n))
  );

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
    failedSet,
    completedCount: progress.completed.length,
    totalCount: municipalities.length,
    markCompleted,
    markFailed,
    getRandomUnguessed,
    getRegionStats,
  };
}
