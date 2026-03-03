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
import { CommunityComparison } from './components/CommunityComparison';
import { StatsModal } from './components/StatsModal';
import { useStats } from './hooks/useStats';
import './App.css';

// Career view phases after game ends:
// 'shape'  → still showing the isolated shape (initial win/loss view)
// 'map'    → transitioned to Finland map with municipality highlighted
type CareerPhase = 'shape' | 'map';

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
  const [careerPhase, setCareerPhase] = useState<CareerPhase>('shape');
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

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

    // Career-specific: mark progress and transition to map
    if (mode === 'career') {
      if (status === 'won') {
        career.markCompleted(answer.name, guesses.length);
      } else {
        career.markFailed(answer.name, guesses.length);
      }

      timerRef.current = setTimeout(() => {
        setCareerPhase('map');
      }, 1500);
    }

    return () => clearTimeout(timerRef.current);
  }, [mode, status]);

  const handleCareerNext = useCallback(() => {
    setShowMap(false);
    setCareerPhase('shape');
    clearTimeout(timerRef.current);
    const next = career.getRandomUnguessed();
    setCareerAnswer(next);
  }, [career.getRandomUnguessed]);

  const handleNewGame = mode === 'career' ? handleCareerNext : newGame;
  const careerComplete = mode === 'career' && career.completedCount === career.totalCount;

  // Show map if: auto-revealed after win, OR manually toggled
  const isCareerMapPhase = mode === 'career' && status !== 'playing' && careerPhase === 'map';
  const mapVisible = mode === 'career' && (isCareerMapPhase || showMap);

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
        {mapVisible ? (
          <>
            <div className={isCareerMapPhase ? 'career-map-reveal' : undefined}>
              <FinlandMap
                completed={career.completedSet}
                currentMunicipality={status === 'won' ? answer.name : undefined}
              />
            </div>
            {status !== 'playing' && (
              <div className="game-over career-map-actions">
                <p className="game-over-message">
                  {status === 'won' ? 'Oikein' : 'Oikea vastaus'}: <strong>{answer.name}</strong> ({answer.region})
                </p>
                <CommunityComparison
                  municipality={answer.name}
                  attempts={guesses.length}
                  won={status === 'won'}
                />
                {careerComplete ? (
                  <p className="career-complete-message">Kaikki 308 kuntaa suoritettu!</p>
                ) : (
                  <button className="new-game-button" onClick={handleNewGame}>
                    Seuraava
                  </button>
                )}
              </div>
            )}
          </>
        ) : (
          <>
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
            {status !== 'playing' && (
              <GameOver
                status={status}
                guesses={guesses}
                answer={answer}
                dateStr={dateStr}
                mode={mode}
                careerComplete={careerComplete}
                onNewGame={handleNewGame}
              />
            )}
          </>
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
