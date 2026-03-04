import type { BadgeState } from '../../data/badges';
import { BADGE_DEFINITIONS, BADGE_CATEGORIES } from '../../data/badges';
import './BadgeGrid.css';

interface BadgeGridProps {
  badgeState: BadgeState;
}

export function BadgeGrid({ badgeState }: BadgeGridProps) {
  const totalUnlocked = Object.keys(badgeState.unlocked).length;

  return (
    <div className="badge-grid-container">
      <div className="badge-progress">
        {totalUnlocked}/{BADGE_DEFINITIONS.length} saavutusta
      </div>

      {BADGE_CATEGORIES.map(({ key, label }) => {
        const badges = BADGE_DEFINITIONS.filter((b) => b.category === key);
        if (badges.length === 0) return null;

        return (
          <div key={key} className="badge-category">
            <div className="badge-category-title">{label}</div>
            <div className="badge-category-grid">
              {badges.map((badge) => {
                const unlocked = badgeState.unlocked[badge.id];
                return (
                  <div
                    key={badge.id}
                    className={`badge-card${unlocked ? '' : ' badge-card--locked'}`}
                  >
                    {badge.image ? (
                      <img
                        className="badge-card-icon"
                        src={`${import.meta.env.BASE_URL}${badge.image}`}
                        alt={badge.name}
                      />
                    ) : (
                      <span className="badge-card-emoji">{badge.emoji}</span>
                    )}
                    <div className="badge-card-info">
                      <span className="badge-card-name">{badge.name}</span>
                      {unlocked && (
                        <span className="badge-card-desc">
                          {badge.description}
                        </span>
                      )}
                    </div>
                    {unlocked && (
                      <span className="badge-card-date">
                        {new Date(unlocked.unlockedAt).toLocaleDateString(
                          'fi-FI',
                        )}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
