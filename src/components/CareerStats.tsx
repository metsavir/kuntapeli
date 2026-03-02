import './CareerStats.css';

interface CareerStatsProps {
  completed: number;
  total: number;
  showMap: boolean;
  onToggleMap: () => void;
  showStats: boolean;
  onToggleStats: () => void;
}

export function CareerStats({ completed, total, showMap, onToggleMap, showStats, onToggleStats }: CareerStatsProps) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="career-stats">
      <div className="career-progress-row">
        <div className="career-progress-bar">
          <div
            className="career-progress-fill"
            style={{ width: `${pct}%` }}
          />
        </div>
        <button className="career-map-toggle" onClick={onToggleMap}>
          {showMap ? 'Piilota kartta' : 'Kartta'}
        </button>
        <button className="career-map-toggle" onClick={onToggleStats}>
          {showStats ? 'Piilota tilastot' : 'Tilastot'}
        </button>
      </div>
      <span className="career-count">
        {completed}/{total} kuntaa ({pct} %)
      </span>
    </div>
  );
}
