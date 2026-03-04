import type { Municipality, GuessResult, ClueType } from '../data/types';
import { municipalities } from '../data/municipalities';
import {
  haversineDistance,
  bearing,
  bearingToDirection,
  proximity,
} from './geo';
import { formatDate } from './format';

// Deterministic daily answer from date string + clue type
export function getDailyAnswer(
  dateStr: string,
  clueType: string = 'shape',
): Municipality {
  const seed = dateStr + ':' + clueType;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
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
  answer: Municipality,
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
    (m) => m.name.toLowerCase() === name.toLowerCase(),
  );
}

export function searchMunicipalities(query: string): Municipality[] {
  if (!query) return [];
  const lower = query.toLowerCase();
  return municipalities.filter((m) => m.name.toLowerCase().startsWith(lower));
}

export function generateShareText(
  guesses: GuessResult[],
  gameNumber: number,
  won: boolean,
  dateStr: string,
  clueType: ClueType,
  hintsUsed: number,
): string {
  const mode = clueType === 'shape' ? 'Rajat' : 'Vaakunat';
  const distances = guesses.map((g) => g.distance);
  const chain = distances.join(' → ') + ' km';
  const date = formatDate(dateStr);
  const hints =
    hintsUsed > 0
      ? ` · 💡 ${hintsUsed === 1 ? '1 vihje' : `${hintsUsed} vihjettä`}`
      : '';

  if (won) {
    return `Kuntapeli #${gameNumber} (${mode}) · ${date}\n✅ ${guesses.length}/6 arvausta${hints}\n\n📍 ${chain}`;
  }

  const closest = Math.min(...distances);
  return `Kuntapeli #${gameNumber} (${mode}) · ${date}\n❌ 6/6 · lähin ${closest} km${hints}\n\n📍 ${chain}`;
}

export function getPopulationHint(population: number): string {
  if (population < 2000) return 'Pieni kylä — alle 2 000 asukasta';
  if (population < 5000) return 'Pieni kunta — muutama tuhat asukasta';
  if (population < 15000) return 'Pikkukaupunki — alle 15 000 asukasta';
  if (population < 50000)
    return 'Keskikokoinen kaupunki — kymmeniätuhansia asukkaita';
  if (population < 100000) return 'Iso kaupunki — alle 100 000 asukasta';
  return 'Suuri kaupunki — yli 100 000 asukasta';
}

export function getRegionHint(answer: Municipality): string {
  return `Maakunta: ${answer.region}`;
}

export function getNeighbourHint(answer: Municipality): string {
  const distances = municipalities
    .filter((m) => m.name !== answer.name)
    .map((m) => ({
      name: m.name,
      dist: haversineDistance(m.lat, m.lng, answer.lat, answer.lng),
    }))
    .sort((a, b) => a.dist - b.dist);

  const neighbours = distances.slice(0, 3).map((d) => d.name);
  return `Naapurit: ${neighbours.join(', ')}`;
}

export function getRandomAnswer(): Municipality {
  const index = Math.floor(Math.random() * municipalities.length);
  return municipalities[index];
}

export const MAX_GUESSES = 6;
