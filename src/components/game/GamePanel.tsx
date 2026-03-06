import type { ReactNode } from 'react';
import type { GameMode, ClueType } from '../../data/types';
import type { useGame } from '../../hooks/useGame';
import { GuessInput } from './GuessInput';
import { GuessList } from './GuessList';
import { GameOver } from './GameOver';

interface GamePanelProps {
  game: ReturnType<typeof useGame>;
  clue: ReactNode;
  mode: GameMode;
  clueType: ClueType;
  onNewGame: () => void;
}

export function GamePanel({
  game,
  clue,
  mode,
  clueType,
  onNewGame,
}: GamePanelProps) {
  const guessCount = game.guesses.length;

  return (
    <>
      <div className="clue-wrapper" data-guesses={guessCount}>
        {clue}
      </div>
      <GuessInput
        onSubmit={game.submitGuess}
        onGiveUp={game.giveUp}
        onHint={game.showHint}
        hints={game.hints}
        maxHints={game.maxHints}
        disabled={game.status !== 'playing'}
        attemptsLeft={game.attemptsLeft}
      />
      <GuessList
        guesses={game.guesses}
        minimal={
          clueType === 'coatOfArmsHard' || clueType === 'coatOfArmsImpossible'
        }
      />
      {game.status !== 'playing' && (
        <GameOver
          status={game.status}
          guesses={game.guesses}
          answer={game.answer}
          dateStr={game.dateStr}
          mode={mode}
          clueType={clueType}
          hintsUsed={game.hints.length}
          onNewGame={onNewGame}
        />
      )}
    </>
  );
}
