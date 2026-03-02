// Mock community stats — will be replaced with real API later

export interface MunicipalityStats {
  avgAttempts: number;
  winRate: number;
  totalPlays: number;
  percentile: number; // your rank: "better than X% of players"
}

// Deterministic pseudo-random from municipality name
function hash(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = ((h << 5) - h + name.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function getCommunityStats(name: string, playerAttempts: number, won: boolean): MunicipalityStats {
  const h = hash(name);

  // Generate plausible mock stats based on name hash
  const avgAttempts = 2.0 + seededRandom(h) * 2.5; // 2.0 - 4.5
  const winRate = 55 + seededRandom(h + 1) * 35; // 55% - 90%
  const totalPlays = 50 + Math.floor(seededRandom(h + 2) * 450); // 50 - 500

  // Calculate percentile based on player's attempts vs average
  let percentile: number;
  if (!won) {
    percentile = Math.floor(seededRandom(h + 3) * 20); // 0-20% if lost
  } else if (playerAttempts <= 1) {
    percentile = 80 + Math.floor(seededRandom(h + 4) * 18); // 80-98%
  } else if (playerAttempts <= avgAttempts) {
    percentile = 50 + Math.floor(seededRandom(h + 5) * 35); // 50-85%
  } else {
    percentile = 10 + Math.floor(seededRandom(h + 6) * 40); // 10-50%
  }

  return {
    avgAttempts: Math.round(avgAttempts * 10) / 10,
    winRate: Math.round(winRate),
    totalPlays,
    percentile,
  };
}
