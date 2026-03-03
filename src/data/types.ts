export interface Municipality {
  name: string;
  lat: number;
  lng: number;
  region: string;
  population: number;
}

export interface GuessResult {
  municipality: Municipality;
  distance: number; // km
  bearing: number; // degrees
  direction: string; // arrow emoji
  proximity: number; // 0-100%
  isCorrect: boolean;
}

export type GameMode = 'daily' | 'casual' | 'career';
export type ClueType = 'shape' | 'coatOfArms';

export interface CareerProgress {
  completed: string[];
  stats: Record<string, { attempts: number; date: string }>;
  failures?: { name: string; guesses: number; date: string }[];
}

export interface MunicipalityShape {
  type: 'Polygon' | 'MultiPolygon';
  coordinates: number[][][] | number[][][][];
}

export interface GameState {
  date: string;
  guesses: GuessResult[];
  answer: Municipality;
  status: 'playing' | 'won' | 'lost';
}
