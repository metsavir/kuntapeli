import { useState } from 'react';
import type { GuessResult, Municipality, GameMode, PlayerStats, ClueType } from '../../data/types';
import { generateShareText, getGameNumber } from '../../utils/game';
import { PersonalComparison } from './PersonalComparison';
import './GameOver.css';

interface GameOverProps {
  status: 'won' | 'lost';
  guesses: GuessResult[];
  answer: Municipality;
  dateStr: string;
  mode: GameMode;
  stats: PlayerStats;
  clueType: ClueType;
  careerComplete?: boolean;
  onNewGame: () => void;
}

export function GameOver({ status, guesses, answer, dateStr, mode, stats, clueType, careerComplete, onNewGame }: GameOverProps) {
  const [copied, setCopied] = useState(false);
  const gameNumber = getGameNumber(dateStr);

  const handleShare = async () => {
    const text = generateShareText(guesses, gameNumber, status === 'won', dateStr);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
      <PersonalComparison
        municipality={answer.name}
        population={answer.population}
        stats={stats}
        clueType={clueType}
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
          <p className="career-complete-message">Kaikki 308 kuntaa suoritettu!</p>
        )}
      </div>
    </div>
  );
}
