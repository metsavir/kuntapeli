import { useState } from 'react';
import type {
  GuessResult,
  Municipality,
  GameMode,
  ClueType,
} from '../../data/types';
import { generateShareText, getGameNumber } from '../../utils/game';
import { PersonalComparison } from './PersonalComparison';
import './GameOver.css';

interface GameOverProps {
  status: 'won' | 'lost';
  guesses: GuessResult[];
  answer: Municipality;
  dateStr: string;
  mode: GameMode;
  clueType: ClueType;
  hintsUsed: number;
  failCount?: number;
  careerComplete?: boolean;
  onNewGame: () => void;
}

export function GameOver({
  status,
  guesses,
  answer,
  dateStr,
  mode,
  clueType,
  hintsUsed,
  failCount,
  careerComplete,
  onNewGame,
}: GameOverProps) {
  const [copied, setCopied] = useState(false);
  const gameNumber = getGameNumber(dateStr);

  const handleShare = async () => {
    const text = generateShareText(
      guesses,
      gameNumber,
      status === 'won',
      dateStr,
      clueType,
      hintsUsed,
    );
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`game-over${status === 'won' ? ' game-over--won' : ''}`}>
      {status === 'won' && (
        <div className="game-over-flash" aria-hidden="true" />
      )}
      {status === 'won' ? (
        <p className="game-over-message">
          Oikein! <strong>{answer.name}</strong> ({answer.region})
        </p>
      ) : (
        <p className="game-over-message">
          Oikea vastaus: <strong>{answer.name}</strong> ({answer.region})
        </p>
      )}
      <PersonalComparison
        population={answer.population}
        failCount={mode === 'career' ? failCount : undefined}
      />
      <div className="game-over-actions">
        {mode === 'daily' && (
          <button className="share-button" onClick={handleShare}>
            {copied ? 'Kopioitu!' : 'Jaa tulos'}
          </button>
        )}
        {mode === 'casual' && (
          <button className="new-game-button" onClick={onNewGame}>
            Uusi peli
          </button>
        )}
        {mode === 'career' && !careerComplete && (
          <button className="new-game-button" onClick={onNewGame}>
            Seuraava
          </button>
        )}
        {mode === 'career' && careerComplete && (
          <p className="career-complete-message">
            Kaikki 308 kuntaa suoritettu!
          </p>
        )}
      </div>
    </div>
  );
}
