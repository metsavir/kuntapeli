import type { Municipality, GuessResult } from '../data/types';
import { municipalities } from '../data/municipalities';
import { haversineDistance, bearing, bearingToDirection, proximity } from './geo';

// Deterministic daily answer from date string
export function getDailyAnswer(dateStr: string): Municipality {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash * 31 + dateStr.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % municipalities.length;
  return municipalities[index];
}

// Game number: days since launch (March 2, 2026)
export function getGameNumber(dateStr: string): number {
  const launch = new Date('2026-03-02');
  const current = new Date(dateStr);
  return Math.floor((current.getTime() - launch.getTime()) / 86400000) + 1;
}

export function getTodayString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function evaluateGuess(
  guess: Municipality,
  answer: Municipality
): GuessResult {
  const dist = haversineDistance(guess.lat, guess.lng, answer.lat, answer.lng);
  const bear = bearing(guess.lat, guess.lng, answer.lat, answer.lng);
  const dir = bearingToDirection(bear);
  const prox = proximity(dist);
  const isCorrect = guess.name === answer.name;

  return {
    municipality: guess,
    distance: dist,
    bearing: bear,
    direction: dir,
    proximity: prox,
    isCorrect,
  };
}

export function findMunicipality(name: string): Municipality | undefined {
  return municipalities.find(
    (m) => m.name.toLowerCase() === name.toLowerCase()
  );
}

export function searchMunicipalities(query: string): Municipality[] {
  if (!query) return [];
  const lower = query.toLowerCase();
  return municipalities.filter((m) => m.name.toLowerCase().startsWith(lower));
}

function proximityToSquare(prox: number): string {
  if (prox === 100) return '🟩';
  if (prox >= 75) return '🟨';
  if (prox >= 50) return '🟧';
  if (prox >= 25) return '🟥';
  return '⬛';
}

export function generateShareText(
  guesses: GuessResult[],
  gameNumber: number,
  won: boolean
): string {
  const score = won ? `${guesses.length}/6` : 'X/6';
  const rows = guesses
    .map((g) => {
      if (g.isCorrect) return '🟩🎯';
      return `${proximityToSquare(g.proximity)}${g.direction}`;
    })
    .join('\n');
  return `Kuntale #${gameNumber} ${score}\n\n${rows}\n\nhttps://kuntale.fi`;
}

export function getRandomAnswer(): Municipality {
  const index = Math.floor(Math.random() * municipalities.length);
  return municipalities[index];
}

export const MAX_GUESSES = 6;
