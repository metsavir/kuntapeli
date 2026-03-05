import { useState, useEffect, useCallback, useRef } from 'react';
import type { GameMode, ClueType, Municipality } from './data/types';
import { useGame } from './hooks/useGame';
import { useCareer } from './hooks/useCareer';
import { useScrollSnap } from './hooks/useScrollSnap';
import { Header } from './components/Header';
import { GamePanel } from './components/game/GamePanel';
import { CareerPanel } from './components/career/CareerPanel';
import { MunicipalityShape } from './components/career/MunicipalityShape';
import { CoatOfArms } from './components/career/CoatOfArms';
import { LandingPage } from './components/LandingPage';
import { StatsModal } from './components/stats/StatsModal';
import { BadgeModal } from './components/stats/BadgeModal';
import { UpdateBanner } from './components/UpdateBanner';
import { BadgeToast } from './components/BadgeToast';
import { useStats } from './hooks/useStats';
import { useBadges } from './hooks/useBadges';
import './App.css';

const MODES: GameMode[] = ['daily', 'casual', 'career'];

function App() {
  const [mode, setMode] = useState<GameMode>('daily');
  const [clueType, setClueType] = useState<ClueType | null>(null);
  const career = useCareer(clueType ?? 'shape');
  const [careerAnswers, setCareerAnswers] = useState<
    Record<string, Municipality | null>
  >({});
  const careerAnswer = careerAnswers[clueType ?? 'shape'] ?? null;
  const setCareerAnswer = useCallback(
    (m: Municipality | null) => {
      setCareerAnswers((prev) => ({ ...prev, [clueType ?? 'shape']: m }));
    },
    [clueType],
  );

  // Three independent game instances — one per mode
  const daily = useGame('daily', { clueType });
  const casual = useGame('casual', { clueType });
  const careerGame = useGame('career', {
    initialAnswer: careerAnswer,
    clueType,
  });

  const games = { daily, casual, career: careerGame };

  const { stats, recordGame } = useStats();
  const { badgeState, checkBadges, newlyUnlocked, dismissToast } = useBadges(
    clueType ?? 'shape',
  );

  // Check badges whenever stats or career progress changes
  useEffect(() => {
    if (stats.games.length > 0) {
      checkBadges(stats, career.progress);
    }
  }, [stats, career.progress]);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showBadgesModal, setShowBadgesModal] = useState(false);
  const [debug, setDebug] = useState(false);
  const mapTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [careerView, setCareerView] = useState<'game' | 'map' | 'collection'>(
    'game',
  );

  // Initialize career answer
  useEffect(() => {
    const key = clueType ?? 'shape';
    if (!careerAnswers[key]) {
      setCareerAnswer(career.getRandomUnguessed());
    }
  }, [clueType]);

  // On game end for any mode: record stats, handle career logic
  const prevStatuses = useRef({
    daily: daily.status,
    casual: casual.status,
    career: careerGame.status,
  });
  useEffect(() => {
    for (const m of MODES) {
      const g = games[m];
      const prev = prevStatuses.current[m];
      prevStatuses.current[m] = g.status;

      if (g.status === 'playing' || prev !== 'playing') continue;

      recordGame({
        mode: m,
        clueType: clueType ?? 'shape',
        date: g.dateStr,
        municipality: g.answer.name,
        guesses: g.guesses.length,
        won: g.status === 'won',
        hintsUsed: g.hints.length,
      });

      if (m === 'career') {
        if (g.status === 'won') {
          career.markCompleted(g.answer.name, g.guesses.length);
          mapTimerRef.current = setTimeout(() => setCareerView('map'), 1500);
        } else {
          career.markFailed(g.answer.name, g.guesses.length);
        }
      }
    }
  }, [daily.status, casual.status, careerGame.status]);

  const handleCareerNext = useCallback(() => {
    clearTimeout(mapTimerRef.current);
    setCareerView('game');
    const next = career.getRandomUnguessed();
    setCareerAnswer(next);
  }, [career.getRandomUnguessed]);

  const careerComplete = career.completedCount === career.totalCount;

  const { initRef, scrollTo: scrollToMode } = useScrollSnap(MODES, setMode);

  if (!clueType) {
    return (
      <>
        <LandingPage onSelect={setClueType} />
        <UpdateBanner />
      </>
    );
  }

  const renderClue = (name: string) =>
    clueType === 'shape' ? (
      <MunicipalityShape name={name} />
    ) : (
      <CoatOfArms name={name} />
    );

  return (
    <div className="app">
      <Header
        mode={mode}
        onModeChange={(m) => {
          setMode(m);
          scrollToMode(m);
        }}
        onBack={() => {
          setClueType(null);
          setMode('daily');
        }}
        onStats={() => setShowStatsModal(true)}
        onBadges={() => setShowBadgesModal(true)}
        onDebugToggle={
          import.meta.env.DEV ? () => setDebug((d) => !d) : undefined
        }
      />
      {debug && (
        <div
          style={{
            background: '#ff000030',
            color: '#ff8888',
            textAlign: 'center',
            padding: '0.25rem',
            fontSize: '0.75rem',
            fontFamily: 'monospace',
          }}
        >
          DEBUG: {games[mode].answer.name} ({games[mode].answer.region})
        </div>
      )}
      <div className="mode-scroller" ref={initRef}>
        {/* Daily panel */}
        <main className="app-body">
          <GamePanel
            game={daily}
            clue={renderClue(daily.answer.name)}
            mode="daily"
            stats={stats}
            clueType={clueType}
            onNewGame={daily.newGame}
          />
        </main>

        {/* Casual panel */}
        <main className="app-body">
          <GamePanel
            game={casual}
            clue={renderClue(casual.answer.name)}
            mode="casual"
            stats={stats}
            clueType={clueType}
            onNewGame={casual.newGame}
          />
        </main>

        {/* Career panel */}
        <CareerPanel
          mode={mode}
          career={career}
          careerGame={careerGame}
          stats={stats}
          clueType={clueType}
          careerComplete={careerComplete}
          onNext={handleCareerNext}
          clue={renderClue(careerGame.answer.name)}
          careerView={careerView}
          onViewChange={setCareerView}
        />
      </div>
      {showStatsModal && (
        <StatsModal
          stats={stats}
          careerProgress={career.progress}
          clueType={clueType}
          initialTab={mode}
          onClose={() => setShowStatsModal(false)}
        />
      )}
      {showBadgesModal && (
        <BadgeModal
          badgeState={badgeState}
          onClose={() => setShowBadgesModal(false)}
        />
      )}
      {newlyUnlocked && (
        <BadgeToast badgeId={newlyUnlocked.badgeId} onDismiss={dismissToast} />
      )}
      <UpdateBanner />
    </div>
  );
}

export default App;
