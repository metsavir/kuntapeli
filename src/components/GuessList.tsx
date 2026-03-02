import type { GuessResult } from '../data/types';
import { GuessRow } from './GuessRow';
import './GuessList.css';

interface GuessListProps {
  guesses: GuessResult[];
}

export function GuessList({ guesses }: GuessListProps) {
  if (guesses.length === 0) return null;

  return (
    <div className="guess-list">
      {guesses.map((guess, i) => (
        <GuessRow key={i} guess={guess} />
      ))}
    </div>
  );
}
