import type { Municipality } from '../../data/types';
import { formatPopulation, formatDate } from '../../utils/format';
import './MunicipalityCard.css';

interface MunicipalityCardProps {
  name: string;
  municipality: Municipality;
  stat?: { attempts: number; date: string };
  failCount: number;
  showCoat?: boolean;
}

function triesColor(tries: number): string {
  if (tries <= 1) return 'var(--color-correct)';
  if (tries <= 3) return '#e6a020';
  return 'var(--color-error)';
}

export function MunicipalityCard({
  name,
  municipality,
  stat,
  failCount,
  showCoat = true,
}: MunicipalityCardProps) {
  const totalTries = failCount + 1;

  return (
    <>
      {showCoat && (
        <img
          src={`${import.meta.env.BASE_URL}coats/${name}.png`}
          alt=""
          className="fm-card-coat"
          draggable={false}
        />
      )}
      <div className="fm-card-info">
        <div className="fm-card-name">{name}</div>
        <div className="fm-card-detail">
          {municipality.region} — {formatPopulation(municipality.population)}{' '}
          asukasta
        </div>
        {stat && (
          <div className="fm-card-detail">
            <span
              className="fm-card-tries"
              style={{ color: triesColor(totalTries) }}
            >
              {totalTries === 1 ? '1 yritys' : `${totalTries} yritystä`}
            </span>{' '}
            · {formatDate(stat.date)}
          </div>
        )}
      </div>
    </>
  );
}
