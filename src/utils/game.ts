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

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
}

export function generateShareText(
  guesses: GuessResult[],
  gameNumber: number,
  won: boolean,
  dateStr: string
): string {
  const distances = guesses.map((g) => g.distance);
  const chain = distances.join(' → ') + ' km';
  const date = formatDate(dateStr);

  if (won) {
    return `Kuntale #${gameNumber} · ${date}\n✅ ${guesses.length}/6 arvausta\n\n📍 ${chain}\n\nhttps://kuntale.fi`;
  }

  const closest = Math.min(...distances);
  return `Kuntale #${gameNumber} · ${date}\n❌ 6/6 · lähin ${closest} km\n\n📍 ${chain}\n\nhttps://kuntale.fi`;
}

export function getPopulationHint(population: number): string {
  if (population < 2000) return 'Pieni kylä — alle 2 000 asukasta';
  if (population < 5000) return 'Pieni kunta — muutama tuhat asukasta';
  if (population < 15000) return 'Pikkukaupunki — alle 15 000 asukasta';
  if (population < 50000) return 'Keskikokoinen kaupunki — kymmeniätuhansia asukkaita';
  if (population < 100000) return 'Iso kaupunki — alle 100 000 asukasta';
  return 'Suuri kaupunki — yli 100 000 asukasta';
}

export function getRandomAnswer(): Municipality {
  const index = Math.floor(Math.random() * municipalities.length);
  return municipalities[index];
}

export const MAX_GUESSES = 6;
