import './CareerStats.css';

type CareerView = 'game' | 'map' | 'collection';

interface CareerStatsProps {
  completed: number;
  total: number;
  view: CareerView;
  onToggleMap: () => void;
  onToggleCollection: () => void;
}

export function CareerStats({ completed, total, view, onToggleMap, onToggleCollection }: CareerStatsProps) {
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
        <div className="career-toggle-group">
          <button
            className={`career-map-toggle${view === 'collection' ? ' career-map-toggle--active' : ''}`}
            onClick={onToggleCollection}
          >
            {view === 'collection' ? 'Piilota' : 'Kokoelma'}
          </button>
          <button
            className={`career-map-toggle${view === 'map' ? ' career-map-toggle--active' : ''}`}
            onClick={onToggleMap}
          >
            {view === 'map' ? 'Piilota kartta' : 'Kartta'}
          </button>
        </div>
      </div>
      <span className="career-count">
        {completed}/{total} kuntaa ({pct} %)
      </span>
    </div>
  );
}
