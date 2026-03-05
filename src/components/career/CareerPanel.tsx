import { useEffect, useRef, type ReactNode } from 'react';
import type { GameMode, ClueType, PlayerStats } from '../../data/types';
import type { useGame } from '../../hooks/useGame';
import type { useCareer } from '../../hooks/useCareer';
import { GuessInput } from '../game/GuessInput';
import { GuessList } from '../game/GuessList';
import { GameOver } from '../game/GameOver';
import { CareerStats } from './CareerStats';
import { FinlandMap } from './FinlandMap';
import { CoatCollection } from './CoatCollection';

interface CareerPanelProps {
  mode: GameMode;
  career: ReturnType<typeof useCareer>;
  careerGame: ReturnType<typeof useGame>;
  stats: PlayerStats;
  clueType: ClueType;
  careerComplete: boolean;
  onNext: () => void;
  clue: ReactNode;
  onViewChange: (view: 'game' | 'map' | 'collection') => void;
  careerView: 'game' | 'map' | 'collection';
}

export function CareerPanel({
  mode,
  career,
  careerGame,
  stats,
  clueType,
  careerComplete,
  onNext,
  clue,
  onViewChange,
  careerView,
}: CareerPanelProps) {
  const flipRef = useRef<HTMLDivElement>(null);

  // Reset flip animation instantly when switching modes
  useEffect(() => {
    if (flipRef.current) {
      flipRef.current.style.transition = 'none';
      flipRef.current
        .querySelectorAll<HTMLElement>('.career-flip-face')
        .forEach((el) => (el.style.transition = 'none'));
      flipRef.current.offsetHeight;
      requestAnimationFrame(() => {
        if (flipRef.current) {
          flipRef.current.style.transition = '';
          flipRef.current
            .querySelectorAll<HTMLElement>('.career-flip-face')
            .forEach((el) => (el.style.transition = ''));
        }
      });
    }
    onViewChange('game');
  }, [mode]);

  return (
    <main className="app-body">
      <CareerStats
        completed={career.completedCount}
        total={career.totalCount}
        view={careerView}
        clueType={clueType}
        onToggleMap={() => onViewChange(careerView === 'map' ? 'game' : 'map')}
        onToggleCollection={() =>
          onViewChange(careerView === 'collection' ? 'game' : 'collection')
        }
      />
      <div
        ref={flipRef}
        className={`career-flip${careerView !== 'game' ? ` career-flip--${careerView}` : ''}`}
      >
        <div className="career-flip-face career-flip-front">
          <div
            className="clue-wrapper"
            data-guesses={careerGame.guesses.length}
          >
            {clue}
          </div>
          <GuessInput
            onSubmit={careerGame.submitGuess}
            onGiveUp={careerGame.giveUp}
            onHint={careerGame.showHint}
            hints={careerGame.hints}
            maxHints={careerGame.maxHints}
            disabled={careerGame.status !== 'playing'}
            attemptsLeft={careerGame.attemptsLeft}
          />
          <GuessList
            guesses={careerGame.guesses}
            minimal={clueType === 'coatOfArmsHard'}
          />
          {careerGame.status !== 'playing' && (
            <GameOver
              status={careerGame.status}
              guesses={careerGame.guesses}
              answer={careerGame.answer}
              dateStr={careerGame.dateStr}
              mode="career"
              stats={stats}
              clueType={clueType}
              hintsUsed={careerGame.hints.length}
              careerComplete={careerComplete}
              onNewGame={onNext}
            />
          )}
        </div>
        <div className="career-flip-face career-flip-back">
          <FinlandMap
            completed={career.completedSet}
            failed={career.failedSet}
            careerStats={career.progress.stats}
            currentMunicipality={
              careerGame.status !== 'playing' && careerGame.status === 'won'
                ? careerGame.answer.name
                : undefined
            }
            visible={careerView === 'map'}
          />
          {careerGame.status !== 'playing' && (
            <GameOver
              status={careerGame.status}
              guesses={careerGame.guesses}
              answer={careerGame.answer}
              dateStr={careerGame.dateStr}
              mode="career"
              stats={stats}
              clueType={clueType}
              hintsUsed={careerGame.hints.length}
              careerComplete={careerComplete}
              onNewGame={onNext}
            />
          )}
        </div>
        <div className="career-flip-face career-flip-collection">
          <CoatCollection
            completedSet={career.completedSet}
            careerStats={career.progress.stats}
            visible={careerView === 'collection'}
          />
        </div>
      </div>
    </main>
  );
}
