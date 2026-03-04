import { useMemo } from 'react';
import type { PlayerStats, ClueType } from '../../data/types';
import { formatPopulation } from '../../utils/format';
import './PersonalComparison.css';

interface PersonalComparisonProps {
  municipality: string;
  population: number;
  stats: PlayerStats;
  clueType: ClueType;
}

export function PersonalComparison({ municipality, population, stats, clueType }: PersonalComparisonProps) {
  const history = useMemo(() => {
    const past = stats.games.filter(
      (g) => g.municipality === municipality && g.clueType === clueType
    );
    // Current game was just recorded — exclude it
    const previous = past.slice(0, -1);
    if (previous.length === 0) return null;

    const wins = previous.filter((g) => g.won);
    const bestResult = wins.length > 0
      ? Math.min(...wins.map((g) => g.guesses))
      : null;

    return { totalPlays: previous.length, bestResult };
  }, [stats.games, municipality, clueType]);

  return (
    <div className="personal-comparison">
      <div className="personal-fact">
        {formatPopulation(population)} asukasta
      </div>
      {history && (
        <div className="personal-history">
          {history.bestResult !== null
            ? `Pelattu ${history.totalPlays} kertaa aiemmin — paras tulos: ${history.bestResult} arvausta`
            : `Pelattu ${history.totalPlays} kertaa aiemmin — ei voittoja`}
        </div>
      )}
    </div>
  );
}
