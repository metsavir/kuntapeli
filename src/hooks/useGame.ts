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

const STORAGE_KEY = 'kuntapeli-state';

function loadDailyState(dateStr: string): GameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameState;
    if (parsed.date !== dateStr) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveDailyState(state: GameState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function createDailyState(dateStr: string): GameState {
  return {
    date: dateStr,
    guesses: [],
    answer: getDailyAnswer(dateStr),
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
}

export function useGame(mode: GameMode, options?: UseGameOptions) {
  const dateStr = getTodayString();
  const prevMode = useRef(mode);
  const prevAnswer = useRef(options?.initialAnswer);

  function getAnswer(): Municipality {
    return options?.initialAnswer ?? getRandomAnswer();
  }

  const [state, setState] = useState<GameState>(() => {
    if (mode === 'daily') {
      return loadDailyState(dateStr) ?? createDailyState(dateStr);
    }
    return createFreshState(dateStr, getAnswer());
  });

  // Handle mode switches
  useEffect(() => {
    if (prevMode.current === mode) return;
    prevMode.current = mode;

    if (mode === 'daily') {
      setState(loadDailyState(dateStr) ?? createDailyState(dateStr));
    } else {
      setState(createFreshState(dateStr, getAnswer()));
    }
    setHints([]);
  }, [mode, dateStr]);

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
      saveDailyState(state);
    }
  }, [state, mode]);

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
