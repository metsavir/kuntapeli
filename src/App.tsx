import { useState, useEffect, useCallback, useRef } from 'react';
import type { GameMode, ClueType, Municipality } from './data/types';
import { useGame } from './hooks/useGame';
import { useCareer } from './hooks/useCareer';
import { Header } from './components/Header';
import { GuessInput } from './components/GuessInput';
import { GuessList } from './components/GuessList';
import { GameOver } from './components/GameOver';
import { HelpModal } from './components/HelpModal';
import { MunicipalityShape } from './components/MunicipalityShape';
import { CoatOfArms } from './components/CoatOfArms';
import { LandingPage } from './components/LandingPage';
import { FinlandMap } from './components/FinlandMap';
import { CareerStats } from './components/CareerStats';
import { StatsModal } from './components/StatsModal';
import { useStats } from './hooks/useStats';
import './App.css';

function App() {
  const [mode, setMode] = useState<GameMode>('daily');
  const [clueType, setClueType] = useState<ClueType | null>(null);
  const career = useCareer(clueType ?? 'shape');
  const [careerAnswers, setCareerAnswers] = useState<Record<string, Municipality | null>>({});
  const careerAnswer = careerAnswers[clueType ?? 'shape'] ?? null;
  const setCareerAnswer = useCallback((m: Municipality | null) => {
    setCareerAnswers((prev) => ({ ...prev, [clueType ?? 'shape']: m }));
  }, [clueType]);

  const { guesses, status, answer, attemptsLeft, dateStr, submitGuess, showHint, hints, maxHints, giveUp, newGame } =
    useGame(mode, { initialAnswer: mode === 'career' ? careerAnswer : undefined, clueType });
  const { stats, recordGame } = useStats();
  const [showHelp, setShowHelp] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [debug, setDebug] = useState(false);
  const [showMap, setShowMap] = useState(false);

  // When switching modes or clue type, reset career overlays and pick an unguessed municipality if needed
  useEffect(() => {
    setShowMap(false);
    const key = clueType ?? 'shape';
    if (mode === 'career' && !careerAnswers[key]) {
      setCareerAnswer(career.getRandomUnguessed());
    }
  }, [mode, clueType]);

  // On game end: record stats for all modes, handle career-specific logic
  const prevStatus = useRef(status);
  useEffect(() => {
    const wasPlaying = prevStatus.current === 'playing';
    prevStatus.current = status;

    if (status === 'playing' || !wasPlaying) return;

    // Record game for stats (all modes)
    recordGame({
      mode,
      clueType: clueType ?? 'shape',
      date: dateStr,
      municipality: answer.name,
      guesses: guesses.length,
      won: status === 'won',
      hintsUsed: hints.length,
    });

    // Career-specific: mark progress and auto-show map on win
    if (mode === 'career') {
      if (status === 'won') {
        career.markCompleted(answer.name, guesses.length);
        setTimeout(() => setShowMap(true), 1500);
      } else {
        career.markFailed(answer.name, guesses.length);
      }
    }
  }, [mode, status]);

  const handleCareerNext = useCallback(() => {
    setShowMap(false);
    const next = career.getRandomUnguessed();
    setCareerAnswer(next);
  }, [career.getRandomUnguessed]);

  const handleNewGame = mode === 'career' ? handleCareerNext : newGame;
  const careerComplete = mode === 'career' && career.completedCount === career.totalCount;

  if (!clueType) {
    return <LandingPage onSelect={setClueType} />;
  }

  return (
    <div className="app">
      <Header
        dateStr={dateStr}
        mode={mode}
        careerCount={`${career.completedCount}/${career.totalCount}`}
        onModeChange={setMode}
        onBack={() => { setClueType(null); setMode('daily'); }}
        onStats={() => setShowStatsModal(true)}
        onHelp={() => setShowHelp(true)}
        onDebugToggle={import.meta.env.DEV ? () => setDebug((d) => !d) : undefined}
      />
      {debug && (
        <div style={{ background: '#ff000030', color: '#ff8888', textAlign: 'center', padding: '0.25rem', fontSize: '0.75rem', fontFamily: 'monospace' }}>
          DEBUG: {answer.name} ({answer.region})
        </div>
      )}
      <main className="app-body">
        {mode === 'career' && (
          <CareerStats
            completed={career.completedCount}
            total={career.totalCount}
            showMap={showMap}
            onToggleMap={() => setShowMap((v) => !v)}
          />
        )}
        <div className={`career-flip${mode === 'career' && showMap ? ' career-flip--map' : ''}`}>
          <div className="career-flip-face career-flip-front">
            {clueType === 'shape' ? (
              <MunicipalityShape name={answer.name} />
            ) : (
              <CoatOfArms name={answer.name} />
            )}
            <GuessInput
              onSubmit={submitGuess}
              onGiveUp={giveUp}
              onHint={showHint}
              hints={hints}
              maxHints={maxHints}
              disabled={status !== 'playing'}
              attemptsLeft={attemptsLeft}
            />
            <GuessList guesses={guesses} />
          </div>
          <div className="career-flip-face career-flip-back">
            <FinlandMap
              completed={career.completedSet}
              failed={career.failedSet}
              careerStats={career.progress.stats}
              currentMunicipality={status !== 'playing' && status === 'won' ? answer.name : undefined}
              visible={showMap}
            />
          </div>
        </div>
        {status !== 'playing' && (
          <GameOver
            status={status}
            guesses={guesses}
            answer={answer}
            dateStr={dateStr}
            mode={mode}
            stats={stats}
            clueType={clueType!}
            careerComplete={careerComplete}
            onNewGame={handleNewGame}
          />
        )}
      </main>
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      {showStatsModal && (
        <StatsModal
          stats={stats}
          careerProgress={career.progress}
          clueType={clueType}
          initialTab={mode}
          onClose={() => setShowStatsModal(false)}
        />
      )}
    </div>
  );
}

export default App;
