import type { PlayerStats, CareerProgress } from './types';
import { municipalities } from './municipalities';

export type BadgeCategory =
  | 'alkuun'
  | 'putket'
  | 'taito'
  | 'ura'
  | 'pelimaara'
  | 'maakunnat'
  | 'erikoiset';

export interface BadgeDefinition {
  id: string;
  emoji: string;
  image?: string; // path relative to BASE_URL (e.g. 'regions/uusimaa.png')
  name: string;
  description: string;
  category: BadgeCategory;
  check: (stats: PlayerStats, career: CareerProgress) => boolean;
}

export interface UnlockedBadge {
  id: string;
  unlockedAt: string; // ISO date string
}

export interface BadgeState {
  unlocked: Record<string, UnlockedBadge>;
}

const CATEGORY_LABELS: Record<BadgeCategory, string> = {
  alkuun: 'Alkuun',
  putket: 'Putket',
  taito: 'Taito',
  ura: 'Ura',
  pelimaara: 'Pelimäärä',
  maakunnat: 'Maakunnat',
  erikoiset: 'Erikoiset',
};

export const BADGE_CATEGORIES: { key: BadgeCategory; label: string }[] =
  Object.entries(CATEGORY_LABELS).map(([key, label]) => ({
    key: key as BadgeCategory,
    label,
  }));

function getCompletedRegionCount(career: CareerProgress): number {
  const regionTotals = new Map<string, number>();
  const regionCompleted = new Map<string, number>();

  for (const m of municipalities) {
    regionTotals.set(m.region, (regionTotals.get(m.region) ?? 0) + 1);
  }

  for (const name of career.completed) {
    const m = municipalities.find((x) => x.name === name);
    if (m) {
      regionCompleted.set(m.region, (regionCompleted.get(m.region) ?? 0) + 1);
    }
  }

  let count = 0;
  for (const [region, total] of regionTotals) {
    if ((regionCompleted.get(region) ?? 0) >= total) count++;
  }
  return count;
}

function isRegionComplete(career: CareerProgress, region: string): boolean {
  const total = municipalities.filter((m) => m.region === region);
  const completed = new Set(career.completed);
  return total.length > 0 && total.every((m) => completed.has(m.name));
}

function getMaxDailyStreak(stats: PlayerStats): number {
  const shapes = stats.dailyStreaks?.shape;
  const coats = stats.dailyStreaks?.coatOfArms;
  return Math.max(shapes?.maxStreak ?? 0, coats?.maxStreak ?? 0);
}

function hasConsecutiveWins(stats: PlayerStats, count: number): boolean {
  let streak = 0;
  for (const g of stats.games) {
    if (g.won) {
      streak++;
      if (streak >= count) return true;
    } else {
      streak = 0;
    }
  }
  return false;
}

function hasPerfectDailyWeek(stats: PlayerStats): boolean {
  const dailyWins = stats.games
    .filter((g) => g.mode === 'daily' && g.won)
    .map((g) => g.date)
    .sort();

  for (let i = 0; i <= dailyWins.length - 7; i++) {
    const start = new Date(dailyWins[i]);
    const end = new Date(dailyWins[i + 6]);
    const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays === 6) return true;
  }
  return false;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // === Alkuun (Getting started) ===
  {
    id: 'first-game',
    emoji: '🎮',
    name: 'Ensimmäinen peli',
    description: 'Pelaa ensimmäinen peli',
    category: 'alkuun',
    check: (stats) => stats.games.length >= 1,
  },
  {
    id: 'first-win',
    emoji: '🏆',
    name: 'Ensimmäinen voitto',
    description: 'Voita ensimmäinen peli',
    category: 'alkuun',
    check: (stats) => stats.games.some((g) => g.won),
  },
  {
    id: 'first-daily-win',
    emoji: '📅',
    name: 'Päivän sankari',
    description: 'Voita päivittäinen peli',
    category: 'alkuun',
    check: (stats) => stats.games.some((g) => g.mode === 'daily' && g.won),
  },

  // === Putket (Streaks) ===
  {
    id: 'streak-3',
    emoji: '🔥',
    name: '3 päivän putki',
    description: 'Pelaa päivittäinen peli 3 päivänä peräkkäin',
    category: 'putket',
    check: (stats) => getMaxDailyStreak(stats) >= 3,
  },
  {
    id: 'streak-7',
    emoji: '🔥',
    name: 'Viikon putki',
    description: 'Pelaa päivittäinen peli 7 päivänä peräkkäin',
    category: 'putket',
    check: (stats) => getMaxDailyStreak(stats) >= 7,
  },
  {
    id: 'streak-14',
    emoji: '💪',
    name: '2 viikon putki',
    description: 'Pelaa päivittäinen peli 14 päivänä peräkkäin',
    category: 'putket',
    check: (stats) => getMaxDailyStreak(stats) >= 14,
  },
  {
    id: 'streak-30',
    emoji: '⚡',
    name: 'Kuukauden putki',
    description: 'Pelaa päivittäinen peli 30 päivänä peräkkäin',
    category: 'putket',
    check: (stats) => getMaxDailyStreak(stats) >= 30,
  },

  // === Taito (Skill) ===
  {
    id: 'first-try',
    emoji: '🎯',
    name: 'Suoraan maaliin',
    description: 'Arvaa kunta ensimmäisellä yrityksellä',
    category: 'taito',
    check: (stats) => stats.games.some((g) => g.won && g.guesses === 1),
  },
  {
    id: 'no-hints',
    emoji: '🧠',
    name: 'Ei vihjeitä',
    description: 'Voita peli ilman vihjeitä',
    category: 'taito',
    check: (stats) => stats.games.some((g) => g.won && g.hintsUsed === 0),
  },
  {
    id: 'win-streak-5',
    emoji: '🌟',
    name: '5 voittoa putkeen',
    description: 'Voita 5 peliä peräkkäin',
    category: 'taito',
    check: (stats) => hasConsecutiveWins(stats, 5),
  },
  {
    id: 'perfect-week',
    emoji: '💎',
    name: 'Täydellinen viikko',
    description: 'Voita päivittäinen peli 7 päivänä peräkkäin',
    category: 'taito',
    check: (stats) => hasPerfectDailyWeek(stats),
  },

  // === Ura (Career) ===
  {
    id: 'career-10',
    emoji: '🗺️',
    name: '10 kuntaa',
    description: 'Arvaa 10 kuntaa uralla',
    category: 'ura',
    check: (_stats, career) => career.completed.length >= 10,
  },
  {
    id: 'career-50',
    emoji: '🗺️',
    name: '50 kuntaa',
    description: 'Arvaa 50 kuntaa uralla',
    category: 'ura',
    check: (_stats, career) => career.completed.length >= 50,
  },
  {
    id: 'career-100',
    emoji: '🗺️',
    name: '100 kuntaa',
    description: 'Arvaa 100 kuntaa uralla',
    category: 'ura',
    check: (_stats, career) => career.completed.length >= 100,
  },
  {
    id: 'career-200',
    emoji: '🗺️',
    name: '200 kuntaa',
    description: 'Arvaa 200 kuntaa uralla',
    category: 'ura',
    check: (_stats, career) => career.completed.length >= 200,
  },
  {
    id: 'career-308',
    emoji: '👑',
    name: 'Kaikki kunnat',
    description: 'Arvaa kaikki 308 kuntaa uralla',
    category: 'ura',
    check: (_stats, career) => career.completed.length >= 308,
  },
  {
    id: 'region-1',
    emoji: '📍',
    name: 'Ensimmäinen maakunta',
    description: 'Suorita kaikki kunnat yhdestä maakunnasta',
    category: 'ura',
    check: (_stats, career) => getCompletedRegionCount(career) >= 1,
  },

  // === Pelimäärä (Volume) ===
  {
    id: 'games-10',
    emoji: '🎲',
    name: '10 peliä',
    description: 'Pelaa 10 peliä',
    category: 'pelimaara',
    check: (stats) => stats.games.length >= 10,
  },
  {
    id: 'games-50',
    emoji: '🎲',
    name: '50 peliä',
    description: 'Pelaa 50 peliä',
    category: 'pelimaara',
    check: (stats) => stats.games.length >= 50,
  },
  {
    id: 'games-100',
    emoji: '🎲',
    name: '100 peliä',
    description: 'Pelaa 100 peliä',
    category: 'pelimaara',
    check: (stats) => stats.games.length >= 100,
  },
  {
    id: 'games-500',
    emoji: '🎲',
    name: '500 peliä',
    description: 'Pelaa 500 peliä',
    category: 'pelimaara',
    check: (stats) => stats.games.length >= 500,
  },

  // === Maakunnat (Regions) ===
  {
    id: 'region-uusimaa',
    emoji: '🏙️',
    image: 'regions/uusimaa.png',
    name: 'Uusimaa',
    description: 'Suorita kaikki Uudenmaan kunnat uralla',
    category: 'maakunnat',
    check: (_stats, career) => isRegionComplete(career, 'Uusimaa'),
  },
  {
    id: 'region-varsinais-suomi',
    emoji: '⚓',
    image: 'regions/varsinais-suomi.png',
    name: 'Varsinais-Suomi',
    description: 'Suorita kaikki Varsinais-Suomen kunnat uralla',
    category: 'maakunnat',
    check: (_stats, career) => isRegionComplete(career, 'Varsinais-Suomi'),
  },
  {
    id: 'region-satakunta',
    emoji: '🏭',
    image: 'regions/satakunta.png',
    name: 'Satakunta',
    description: 'Suorita kaikki Satakunnan kunnat uralla',
    category: 'maakunnat',
    check: (_stats, career) => isRegionComplete(career, 'Satakunta'),
  },
  {
    id: 'region-kanta-hame',
    emoji: '🏰',
    image: 'regions/kanta-hame.png',
    name: 'Kanta-Häme',
    description: 'Suorita kaikki Kanta-Hämeen kunnat uralla',
    category: 'maakunnat',
    check: (_stats, career) => isRegionComplete(career, 'Kanta-Häme'),
  },
  {
    id: 'region-pirkanmaa',
    emoji: '🏗️',
    image: 'regions/pirkanmaa.png',
    name: 'Pirkanmaa',
    description: 'Suorita kaikki Pirkanmaan kunnat uralla',
    category: 'maakunnat',
    check: (_stats, career) => isRegionComplete(career, 'Pirkanmaa'),
  },
  {
    id: 'region-paijat-hame',
    emoji: '⛷️',
    image: 'regions/paijat-hame.png',
    name: 'Päijät-Häme',
    description: 'Suorita kaikki Päijät-Hämeen kunnat uralla',
    category: 'maakunnat',
    check: (_stats, career) => isRegionComplete(career, 'Päijät-Häme'),
  },
  {
    id: 'region-kymenlaakso',
    emoji: '🚢',
    image: 'regions/kymenlaakso.png',
    name: 'Kymenlaakso',
    description: 'Suorita kaikki Kymenlaakson kunnat uralla',
    category: 'maakunnat',
    check: (_stats, career) => isRegionComplete(career, 'Kymenlaakso'),
  },
  {
    id: 'region-etela-karjala',
    emoji: '🌲',
    image: 'regions/etela-karjala.png',
    name: 'Etelä-Karjala',
    description: 'Suorita kaikki Etelä-Karjalan kunnat uralla',
    category: 'maakunnat',
    check: (_stats, career) => isRegionComplete(career, 'Etelä-Karjala'),
  },
  {
    id: 'region-etela-savo',
    emoji: '🛶',
    image: 'regions/etela-savo.png',
    name: 'Etelä-Savo',
    description: 'Suorita kaikki Etelä-Savon kunnat uralla',
    category: 'maakunnat',
    check: (_stats, career) => isRegionComplete(career, 'Etelä-Savo'),
  },
  {
    id: 'region-pohjois-savo',
    emoji: '🧈',
    image: 'regions/pohjois-savo.png',
    name: 'Pohjois-Savo',
    description: 'Suorita kaikki Pohjois-Savon kunnat uralla',
    category: 'maakunnat',
    check: (_stats, career) => isRegionComplete(career, 'Pohjois-Savo'),
  },
  {
    id: 'region-pohjois-karjala',
    emoji: '🐻',
    image: 'regions/pohjois-karjala.png',
    name: 'Pohjois-Karjala',
    description: 'Suorita kaikki Pohjois-Karjalan kunnat uralla',
    category: 'maakunnat',
    check: (_stats, career) => isRegionComplete(career, 'Pohjois-Karjala'),
  },
  {
    id: 'region-keski-suomi',
    emoji: '🏔️',
    image: 'regions/keski-suomi.png',
    name: 'Keski-Suomi',
    description: 'Suorita kaikki Keski-Suomen kunnat uralla',
    category: 'maakunnat',
    check: (_stats, career) => isRegionComplete(career, 'Keski-Suomi'),
  },
  {
    id: 'region-etela-pohjanmaa',
    emoji: '🌾',
    image: 'regions/etela-pohjanmaa.png',
    name: 'Etelä-Pohjanmaa',
    description: 'Suorita kaikki Etelä-Pohjanmaan kunnat uralla',
    category: 'maakunnat',
    check: (_stats, career) => isRegionComplete(career, 'Etelä-Pohjanmaa'),
  },
  {
    id: 'region-pohjanmaa',
    emoji: '🌊',
    image: 'regions/pohjanmaa.png',
    name: 'Pohjanmaa',
    description: 'Suorita kaikki Pohjanmaan kunnat uralla',
    category: 'maakunnat',
    check: (_stats, career) => isRegionComplete(career, 'Pohjanmaa'),
  },
  {
    id: 'region-keski-pohjanmaa',
    emoji: '🐟',
    image: 'regions/keski-pohjanmaa.png',
    name: 'Keski-Pohjanmaa',
    description: 'Suorita kaikki Keski-Pohjanmaan kunnat uralla',
    category: 'maakunnat',
    check: (_stats, career) => isRegionComplete(career, 'Keski-Pohjanmaa'),
  },
  {
    id: 'region-pohjois-pohjanmaa',
    emoji: '❄️',
    image: 'regions/pohjois-pohjanmaa.png',
    name: 'Pohjois-Pohjanmaa',
    description: 'Suorita kaikki Pohjois-Pohjanmaan kunnat uralla',
    category: 'maakunnat',
    check: (_stats, career) => isRegionComplete(career, 'Pohjois-Pohjanmaa'),
  },
  {
    id: 'region-kainuu',
    emoji: '🌿',
    image: 'regions/kainuu.png',
    name: 'Kainuu',
    description: 'Suorita kaikki Kainuun kunnat uralla',
    category: 'maakunnat',
    check: (_stats, career) => isRegionComplete(career, 'Kainuu'),
  },
  {
    id: 'region-lappi',
    emoji: '🦌',
    image: 'regions/lappi.png',
    name: 'Lappi',
    description: 'Suorita kaikki Lapin kunnat uralla',
    category: 'maakunnat',
    check: (_stats, career) => isRegionComplete(career, 'Lappi'),
  },
  {
    id: 'region-ahvenanmaa',
    emoji: '🏝️',
    image: 'regions/ahvenanmaa.png',
    name: 'Ahvenanmaa',
    description: 'Suorita kaikki Ahvenanmaan kunnat uralla',
    category: 'maakunnat',
    check: (_stats, career) => isRegionComplete(career, 'Ahvenanmaa'),
  },

  // === Erikoiset (Special) ===
  {
    id: 'guess-helsinki',
    emoji: '🏛️',
    name: 'Pääkaupunki',
    description: 'Arvaa Helsinki oikein',
    category: 'erikoiset',
    check: (stats) =>
      stats.games.some((g) => g.municipality === 'Helsinki' && g.won),
  },
];
