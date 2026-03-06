import { formatPopulation } from '../../utils/format';
import './PersonalComparison.css';

interface PersonalComparisonProps {
  population: number;
  failCount?: number;
}

export function PersonalComparison({
  population,
  failCount,
}: PersonalComparisonProps) {
  return (
    <div className="personal-comparison">
      <div className="personal-fact">
        {formatPopulation(population)} asukasta
      </div>
      {failCount != null && failCount > 0 && (
        <div className="personal-history">
          Epäonnistunut {failCount} {failCount === 1 ? 'kerta' : 'kertaa'}{' '}
          aiemmin
        </div>
      )}
    </div>
  );
}
