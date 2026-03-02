import type { GuessResult } from '../data/types';
import './GuessRow.css';

interface GuessRowProps {
  guess: GuessResult;
}

export function GuessRow({ guess }: GuessRowProps) {
  return (
    <div className={`guess-row ${guess.isCorrect ? 'guess-row--correct' : ''}`}>
      <span className="guess-name">{guess.municipality.name}</span>
      <span className="guess-distance">{guess.distance} km</span>
      <span className="guess-direction">{guess.direction}</span>
      <div className="guess-proximity">
        <div
          className="guess-proximity-bar"
          style={{ width: `${guess.proximity}%` }}
        />
        <span className="guess-proximity-text">{guess.proximity}%</span>
      </div>
    </div>
  );
}
