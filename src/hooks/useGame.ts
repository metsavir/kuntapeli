import { useState, useCallback, useEffect } from 'react';
import type { GameState, GuessResult } from '../data/types';
import {
  getDailyAnswer,
  getRandomAnswer,
  getTodayString,
  evaluateGuess,
  findMunicipality,
  MAX_GUESSES,
} from '../utils/game';

const STORAGE_KEY = 'kuntale-state';

function loadState(dateStr: string): GameState | null {
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

function saveState(state: GameState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function useGame() {
  const dateStr = getTodayString();
  const answer = getDailyAnswer(dateStr);

  const [state, setState] = useState<GameState>(() => {
    const saved = loadState(dateStr);
    if (saved) return saved;
    return {
      date: dateStr,
      guesses: [],
      answer,
      status: 'playing',
    };
  });

  useEffect(() => {
    saveState(state);
  }, [state]);

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
  }, [dateStr]);

  return {
    guesses: state.guesses,
    status: state.status,
    answer: state.answer,
    attemptsLeft: MAX_GUESSES - state.guesses.length,
    dateStr,
    submitGuess,
    giveUp,
    newGame,
  };
}
