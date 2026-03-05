import type { ReactNode } from 'react';
import type { GameMode, ClueType, PlayerStats } from '../../data/types';
import type { useGame } from '../../hooks/useGame';
import { GuessInput } from './GuessInput';
import { GuessList } from './GuessList';
import { GameOver } from './GameOver';

interface GamePanelProps {
  game: ReturnType<typeof useGame>;
  clue: ReactNode;
  mode: GameMode;
  stats: PlayerStats;
  clueType: ClueType;
  careerComplete?: boolean;
  onNewGame: () => void;
}

export function GamePanel({
  game,
  clue,
  mode,
  stats,
  clueType,
  careerComplete = false,
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
        minimal={clueType === 'coatOfArmsHard'}
      />
      {game.status !== 'playing' && (
        <GameOver
          status={game.status}
          guesses={game.guesses}
          answer={game.answer}
          dateStr={game.dateStr}
          mode={mode}
          stats={stats}
          clueType={clueType}
          hintsUsed={game.hints.length}
          careerComplete={careerComplete}
          onNewGame={onNewGame}
        />
      )}
    </>
  );
}
