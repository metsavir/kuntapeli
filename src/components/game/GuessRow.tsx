import type { GuessResult } from '../../data/types';
import './GuessRow.css';

interface GuessRowProps {
  guess: GuessResult;
  minimal?: boolean;
}

export function GuessRow({ guess, minimal }: GuessRowProps) {
  if (guess.isCorrect) {
    return (
      <div className="guess-row guess-row--correct">
        <span className="guess-name">{guess.municipality.name}</span>
        <span className="guess-correct-label">Oikein!</span>
      </div>
    );
  }

  if (minimal) {
    return (
      <div className="guess-row guess-row--wrong">
        <span className="guess-name">{guess.municipality.name}</span>
        <span className="guess-wrong-label">Väärin</span>
      </div>
    );
  }

  const barClass =
    guess.proximity >= 80
      ? ' guess-proximity-bar--scorching'
      : guess.proximity >= 60
        ? ' guess-proximity-bar--warm'
        : '';

  return (
    <div className="guess-row">
      <span className="guess-name">{guess.municipality.name}</span>
      <span className="guess-distance">{guess.distance} km</span>
      <span className="guess-direction">{guess.direction}</span>
      <div className="guess-proximity">
        <div
          className={`guess-proximity-bar${barClass}`}
          style={{ width: `${guess.proximity}%` }}
        />
        <span className="guess-proximity-text">{guess.proximity}%</span>
      </div>
    </div>
  );
}
