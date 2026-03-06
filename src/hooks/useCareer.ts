import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import type { CareerProgress, ClueType, Municipality } from '../data/types';
import { municipalities } from '../data/municipalities';
import { getTodayString } from '../utils/game';
import { getItem, setItem } from '../utils/storage';

function careerKey(clueType: ClueType): string {
  return `kuntapeli-career-${clueType}`;
}

const EMPTY: CareerProgress = { completed: [], stats: {}, failures: [] };

function parseCareer(raw: string | null): CareerProgress {
  if (!raw) return EMPTY;
  try {
    const parsed = JSON.parse(raw) as CareerProgress;
    return { ...parsed, failures: parsed.failures ?? [] };
  } catch {
    return EMPTY;
  }
}

export function useCareer(clueType: ClueType) {
  const [progress, setProgress] = useState<CareerProgress>(EMPTY);
  const loaded = useRef(false);
  const saving = useRef(false);

  // Async load from storage
  useEffect(() => {
    loaded.current = false;
    getItem(careerKey(clueType)).then((raw) => {
      setProgress(parseCareer(raw));
      loaded.current = true;
    });
  }, [clueType]);

  // Persist on change (skip initial empty state before load)
  useEffect(() => {
    if (!loaded.current) return;
    saving.current = true;
    setItem(careerKey(clueType), JSON.stringify(progress)).then(() => {
      saving.current = false;
    });
  }, [clueType, progress]);

  const completedSet = useMemo(
    () => new Set(progress.completed),
    [progress.completed],
  );
  const failedSet = useMemo(
    () =>
      new Set(
        progress.failures
          .map((f) => f.name)
          .filter((n) => !completedSet.has(n)),
      ),
    [progress.failures, completedSet],
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
        failures: prev.failures,
      };
    });
  }, []);

  const markFailed = useCallback((name: string, guessCount: number) => {
    setProgress((prev) => ({
      ...prev,
      failures: [
        ...prev.failures,
        { name, guesses: guessCount, date: getTodayString() },
      ],
    }));
  }, []);

  const getRandomUnguessed =
    useCallback(async (): Promise<Municipality | null> => {
      const raw = await getItem(careerKey(clueType));
      const current = parseCareer(raw);
      const completed = new Set(current.completed);
      const remaining = municipalities.filter((m) => !completed.has(m.name));
      if (remaining.length === 0) return null;
      return remaining[Math.floor(Math.random() * remaining.length)];
    }, [clueType]);

  return {
    progress,
    completedSet,
    failedSet,
    completedCount: progress.completed.length,
    totalCount: municipalities.length,
    markCompleted,
    markFailed,
    getRandomUnguessed,
  };
}
