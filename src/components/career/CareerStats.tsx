import type { ClueType } from '../../data/types';
import './CareerStats.css';

type CareerView = 'game' | 'map' | 'collection';

interface CareerStatsProps {
  completed: number;
  total: number;
  view: CareerView;
  clueType: ClueType;
  onToggleMap: () => void;
  onToggleCollection: () => void;
}

export function CareerStats({
  completed,
  total,
  view,
  clueType,
  onToggleMap,
  onToggleCollection,
}: CareerStatsProps) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="career-stats">
      <div className="career-progress-row">
        <div className="career-progress-bar">
          <div className="career-progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="career-toggle-group">
          {(clueType === 'coatOfArms' || clueType === 'coatOfArmsHard') && (
            <button
              className={`career-map-toggle${view === 'collection' ? ' career-map-toggle--active' : ''}`}
              onClick={onToggleCollection}
            >
              Kokoelma
            </button>
          )}
          <button
            className={`career-map-toggle${view === 'map' ? ' career-map-toggle--active' : ''}`}
            onClick={onToggleMap}
          >
            Kartta
          </button>
        </div>
      </div>
      <span className="career-count">
        {completed}/{total} kuntaa ({pct} %)
      </span>
    </div>
  );
}
