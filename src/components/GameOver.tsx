import { useState } from 'react';
import type { GuessResult, Municipality, GameMode } from '../data/types';
import { generateShareText, getGameNumber } from '../utils/game';
import './GameOver.css';

interface GameOverProps {
  status: 'won' | 'lost';
  guesses: GuessResult[];
  answer: Municipality;
  dateStr: string;
  mode: GameMode;
  onNewGame: () => void;
}

export function GameOver({ status, guesses, answer, dateStr, mode, onNewGame }: GameOverProps) {
  const [copied, setCopied] = useState(false);
  const gameNumber = getGameNumber(dateStr);

  const handleShare = async () => {
    const text = generateShareText(guesses, gameNumber, status === 'won');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="game-over">
      {status === 'won' ? (
        <p className="game-over-message">
          Oikein! <strong>{answer.name}</strong> ({answer.region})
        </p>
      ) : (
        <p className="game-over-message">
          Oikea vastaus: <strong>{answer.name}</strong> ({answer.region})
        </p>
      )}
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
      </div>
    </div>
  );
}
