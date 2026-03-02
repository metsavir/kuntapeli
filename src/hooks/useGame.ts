import { useState, useCallback, useEffect, useRef } from 'react';
import type { GameState, GameMode, GuessResult } from '../data/types';
import {
  getDailyAnswer,
  getRandomAnswer,
  getPopulationHint,
  getTodayString,
  evaluateGuess,
  findMunicipality,
  MAX_GUESSES,
} from '../utils/game';

const STORAGE_KEY = 'kuntale-state';

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

function createCasualState(dateStr: string): GameState {
  return {
    date: dateStr,
    guesses: [],
    answer: getRandomAnswer(),
    status: 'playing',
  };
}

export function useGame(mode: GameMode) {
  const dateStr = getTodayString();
  const prevMode = useRef(mode);

  const [state, setState] = useState<GameState>(() => {
    if (mode === 'daily') {
      return loadDailyState(dateStr) ?? createDailyState(dateStr);
    }
    return createCasualState(dateStr);
  });

  // Handle mode switches
  useEffect(() => {
    if (prevMode.current === mode) return;
    prevMode.current = mode;

    if (mode === 'daily') {
      setState(loadDailyState(dateStr) ?? createDailyState(dateStr));
    } else {
      setState(createCasualState(dateStr));
    }
    setHintText(null);
  }, [mode, dateStr]);

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

  const [hintText, setHintText] = useState<string | null>(null);

  const showHint = useCallback(() => {
    if (state.status !== 'playing') return;
    setHintText(getPopulationHint(state.answer.population));
  }, [state]);

  const giveUp = useCallback(() => {
    if (state.status !== 'playing') return;
    setState({ ...state, status: 'lost' });
  }, [state]);

  const newGame = useCallback(() => {
    const newAnswer = getRandomAnswer();
    setState({
      date: dateStr,
      guesses: [],
      answer: newAnswer,
      status: 'playing',
    });
    setHintText(null);
  }, [dateStr]);

  return {
    guesses: state.guesses,
    status: state.status,
    answer: state.answer,
    attemptsLeft: MAX_GUESSES - state.guesses.length,
    dateStr,
    submitGuess,
    showHint,
    hintText,
    giveUp,
    newGame,
  };
}
