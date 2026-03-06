import { useState } from 'react';
import type { TimedScore } from '../../hooks/useTimedScores';
import { Modal } from '../Modal';
import { PillTabs } from '../PillTabs';
import './TimedMode.css';

type GameType = 'speed' | 'quiz';

const GAME_TYPE_OPTIONS: { key: GameType; label: string }[] = [
  { key: 'speed', label: 'Nopea' },
  { key: 'quiz', label: 'Tietovisa' },
];

const DURATION_OPTIONS = [
  { key: '60', label: '1 min' },
  { key: '180', label: '3 min' },
  { key: '300', label: '5 min' },
];

interface TimedScoresModalProps {
  gameType?: GameType;
  getScores: (gameType: GameType, durationSec: number) => TimedScore[];
  onClose: () => void;
}

export function TimedScoresModal({
  gameType: initialGameType,
  getScores,
  onClose,
}: TimedScoresModalProps) {
  const [gameType, setGameType] = useState<GameType>(
    initialGameType ?? 'speed',
  );
  const [duration, setDuration] = useState('60');
  const scores = getScores(gameType, Number(duration));

  return (
    <Modal onClose={onClose} className="timed-scores-modal">
      <h2 className="timed-scores-modal-title">Parhaat tulokset</h2>
      <PillTabs
        options={GAME_TYPE_OPTIONS}
        value={gameType}
        onChange={setGameType}
      />
      <PillTabs options={DURATION_OPTIONS} value={duration} onChange={setDuration} />
      {scores.length === 0 ? (
        <p className="timed-scores-empty">Ei tuloksia vielä</p>
      ) : (
        <div className="timed-highscore-list">
          {scores.map((s, i) => (
            <div key={i} className="timed-highscore-row">
              <span className="timed-highscore-rank">{i + 1}.</span>
              <span className="timed-highscore-score">{s.correct}</span>
              <span className="timed-highscore-detail">
                {s.accuracy}% · {(s.avgTimeMs / 1000).toFixed(1)}s
              </span>
              <span className="timed-highscore-date">{s.date}</span>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
