import { useMemo } from 'react';
import type { PlayerStats, GameMode, ClueType } from '../../data/types';
import { formatPopulation } from '../../utils/format';
import './PersonalComparison.css';

interface PersonalComparisonProps {
  municipality: string;
  population: number;
  stats: PlayerStats;
  mode: GameMode;
  clueType: ClueType;
  showHistory?: boolean;
}

export function PersonalComparison({
  municipality,
  population,
  stats,
  mode,
  clueType,
  showHistory = true,
}: PersonalComparisonProps) {
  const history = useMemo(() => {
    const past = stats.games.filter(
      (g) =>
        g.municipality === municipality &&
        g.clueType === clueType &&
        g.mode === mode,
    );
    // Current game was just recorded — exclude it
    const previous = past.slice(0, -1);
    if (previous.length === 0) return null;

    const wins = previous.filter((g) => g.won);
    const bestResult =
      wins.length > 0 ? Math.min(...wins.map((g) => g.guesses)) : null;

    return { totalPlays: previous.length, bestResult };
  }, [stats.games, municipality, clueType]);

  return (
    <div className="personal-comparison">
      <div className="personal-fact">
        {formatPopulation(population)} asukasta
      </div>
      {showHistory && history && (
        <div className="personal-history">
          {history.bestResult !== null
            ? `Pelattu ${history.totalPlays} kertaa aiemmin — paras tulos: ${history.bestResult} arvausta`
            : `Pelattu ${history.totalPlays} kertaa aiemmin — ei voittoja`}
        </div>
      )}
    </div>
  );
}
