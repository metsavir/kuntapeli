import type { BadgeState } from '../../data/badges';
import { BadgeGrid } from './BadgeGrid';
import { Modal } from '../Modal';

interface BadgeModalProps {
  badgeState: BadgeState;
  onClose: () => void;
}

export function BadgeModal({ badgeState, onClose }: BadgeModalProps) {
  return (
    <Modal onClose={onClose} className="stats-modal">
      <h2>Saavutukset</h2>
      <div className="stats-content">
        <BadgeGrid badgeState={badgeState} />
      </div>
    </Modal>
  );
}
