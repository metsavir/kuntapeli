import { useState, useCallback, useEffect, useRef } from 'react';
import type { GameState, GameMode, GuessResult, Municipality } from '../data/types';
import {
  getDailyAnswer,
  getRandomAnswer,
  getPopulationHint,
  getRegionHint,
  getNeighbourHint,
  getTodayString,
  evaluateGuess,
  findMunicipality,
  MAX_GUESSES,
} from '../utils/game';

function dailyStorageKey(clueType: string): string {
  return `kuntapeli-state-${clueType}`;
}

function loadDailyState(dateStr: string, clueType: string): GameState | null {
  try {
    const raw = localStorage.getItem(dailyStorageKey(clueType));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameState;
    if (parsed.date !== dateStr) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveDailyState(state: GameState, clueType: string): void {
  localStorage.setItem(dailyStorageKey(clueType), JSON.stringify(state));
}

function createDailyState(dateStr: string, clueType: string): GameState {
  return {
    date: dateStr,
    guesses: [],
    answer: getDailyAnswer(dateStr, clueType),
    status: 'playing',
  };
}

function createFreshState(dateStr: string, answer: Municipality): GameState {
  return {
    date: dateStr,
    guesses: [],
    answer,
    status: 'playing',
  };
}

interface UseGameOptions {
  initialAnswer?: Municipality | null;
  clueType?: string | null;
}

export function useGame(mode: GameMode, options?: UseGameOptions) {
  const dateStr = getTodayString();
  const clueType = options?.clueType ?? 'shape';
  const prevMode = useRef(mode);
  const prevClueType = useRef(clueType);
  const prevAnswer = useRef(options?.initialAnswer);

  function getAnswer(): Municipality {
    return options?.initialAnswer ?? getRandomAnswer();
  }

  const [state, setState] = useState<GameState>(() => {
    if (mode === 'daily') {
      return loadDailyState(dateStr, clueType) ?? createDailyState(dateStr, clueType);
    }
    return createFreshState(dateStr, getAnswer());
  });

  // Handle mode or clue type switches
  useEffect(() => {
    const modeChanged = prevMode.current !== mode;
    const clueTypeChanged = prevClueType.current !== clueType;
    prevMode.current = mode;
    prevClueType.current = clueType;

    if (!modeChanged && !clueTypeChanged) return;

    if (mode === 'daily') {
      setState(loadDailyState(dateStr, clueType) ?? createDailyState(dateStr, clueType));
    } else if (mode === 'career') {
      // Career state is managed via initialAnswer prop
      setState(createFreshState(dateStr, getAnswer()));
    } else {
      // Casual: always start fresh
      setState(createFreshState(dateStr, getRandomAnswer()));
    }
    setHints([]);
  }, [mode, clueType, dateStr]);

  // Handle career answer changes (when moving to next municipality)
  useEffect(() => {
    if (mode !== 'career') return;
    const newAnswer = options?.initialAnswer;
    if (newAnswer && newAnswer !== prevAnswer.current) {
      prevAnswer.current = newAnswer;
      setState(createFreshState(dateStr, newAnswer));
      setHints([]);
    }
  }, [mode, options?.initialAnswer, dateStr]);

  // Persist only daily mode
  useEffect(() => {
    if (mode === 'daily') {
      saveDailyState(state, clueType);
    }
  }, [state, mode, clueType]);

  const submitGuess = useCallback(
    (name: string): { error?: string; result?: GuessResult } => {
      if (state.status !== 'playing') {
        return { error: 'Peli on päättynyt' };
      }

      const municipality = findMunicipality(name);
      if (!municipality) {
        return { error: 'Kuntaa ei löydy' };
      }

      if (
        state.guesses.some(
          (g) => g.municipality.name.toLowerCase() === name.toLowerCase()
        )
      ) {
        return { error: 'Olet jo arvannut tämän kunnan' };
      }

      const result = evaluateGuess(municipality, state.answer);
      const newGuesses = [...state.guesses, result];
      let newStatus: GameState['status'] = 'playing';

      if (result.isCorrect) {
        newStatus = 'won';
      } else if (newGuesses.length >= MAX_GUESSES) {
        newStatus = 'lost';
      }

      const newState: GameState = {
        ...state,
        guesses: newGuesses,
        status: newStatus,
      };

      setState(newState);
      return { result };
    },
    [state]
  );

  const [hints, setHints] = useState<string[]>([]);

  const showHint = useCallback(() => {
    if (state.status !== 'playing') return;
    setHints((prev) => {
      const level = prev.length;
      if (level === 0) return [...prev, getRegionHint(state.answer)];
      if (level === 1) return [...prev, getPopulationHint(state.answer.population)];
      if (level === 2) return [...prev, getNeighbourHint(state.answer)];
      return prev;
    });
  }, [state]);

  const giveUp = useCallback(() => {
    if (state.status !== 'playing') return;
    setState({ ...state, status: 'lost' });
  }, [state]);

  const newGame = useCallback(() => {
    setState(createFreshState(dateStr, getAnswer()));
    setHints([]);
  }, [dateStr]);

  return {
    guesses: state.guesses,
    status: state.status,
    answer: state.answer,
    attemptsLeft: MAX_GUESSES - state.guesses.length,
    dateStr,
    submitGuess,
    showHint,
    hints,
    maxHints: 3,
    giveUp,
    newGame,
  };
}
