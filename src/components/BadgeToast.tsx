import { useEffect } from 'react';
import { BADGE_DEFINITIONS } from '../data/badges';
import './BadgeToast.css';

interface BadgeToastProps {
  badgeId: string;
  onDismiss: () => void;
}

export function BadgeToast({ badgeId, onDismiss }: BadgeToastProps) {
  const badge = BADGE_DEFINITIONS.find((b) => b.id === badgeId);

  useEffect(() => {
    const timer = setTimeout(onDismiss, 3500);
    return () => clearTimeout(timer);
  }, [badgeId, onDismiss]);

  if (!badge) return null;

  return (
    <div className="badge-toast" onClick={onDismiss}>
      {badge.image ? (
        <img
          className="badge-toast-icon"
          src={`${import.meta.env.BASE_URL}${badge.image}`}
          alt={badge.name}
        />
      ) : (
        <span className="badge-toast-emoji">{badge.emoji}</span>
      )}
      <div className="badge-toast-text">
        <span className="badge-toast-title">Uusi saavutus!</span>
        <span className="badge-toast-name">{badge.name}</span>
      </div>
    </div>
  );
}
