import { useState, useEffect, useCallback } from 'react';
import { getItem, setItem } from '../utils/storage';

export interface TimedScore {
  correct: number;
  total: number;
  accuracy: number;
  avgTimeMs: number;
  date: string;
}

type GameType = 'speed' | 'quiz';

const STORAGE_KEY = 'kuntapeli-timed-scores';
const MAX_SCORES = 10;

interface AllScores {
  [key: string]: TimedScore[];
}

function scoreKey(gameType: GameType, durationSec: number): string {
  return `${gameType}-${durationSec}`;
}

export function useTimedScores() {
  const [scores, setScores] = useState<AllScores>({});

  useEffect(() => {
    getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          setScores(JSON.parse(raw));
        } catch {
          // corrupted data
        }
      }
    });
  }, []);

  const addScore = useCallback(
    (gameType: GameType, durationSec: number, score: TimedScore) => {
      setScores((prev) => {
        const key = scoreKey(gameType, durationSec);
        const existing = prev[key] ?? [];
        const updated = [...existing, score]
          .sort((a, b) => b.correct - a.correct || a.avgTimeMs - b.avgTimeMs)
          .slice(0, MAX_SCORES);
        const next = { ...prev, [key]: updated };
        setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  const getScores = useCallback(
    (gameType: GameType, durationSec: number): TimedScore[] => {
      return scores[scoreKey(gameType, durationSec)] ?? [];
    },
    [scores],
  );

  return { addScore, getScores };
}
