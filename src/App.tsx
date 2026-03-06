import { useState, useEffect, useCallback, useRef, useTransition } from 'react';
import type { GameMode, ClueType, Municipality } from './data/types';
import { useGame } from './hooks/useGame';
import { useCareer } from './hooks/useCareer';
import { useScrollSnap } from './hooks/useScrollSnap';
import { Header } from './components/Header';
import { GamePanel } from './components/game/GamePanel';
import { CareerPanel } from './components/career/CareerPanel';
import { MunicipalityShape } from './components/career/MunicipalityShape';
import { CoatOfArms } from './components/career/CoatOfArms';
import { DescriptionClue } from './components/game/DescriptionClue';
import { LandingPage } from './components/LandingPage';
import { TimedMode } from './components/timed/TimedMode';
import { TimedScoresModal } from './components/timed/TimedScoresModal';
import { StatsModal } from './components/stats/StatsModal';
import { BadgeModal } from './components/stats/BadgeModal';
import { SettingsModal } from './components/SettingsModal';
import { UpdateBanner } from './components/UpdateBanner';
import { BadgeToast } from './components/BadgeToast';
import { useStats } from './hooks/useStats';
import { useBadges } from './hooks/useBadges';
import { useTimedScores } from './hooks/useTimedScores';
import './App.css';

const MODES: GameMode[] = ['daily', 'casual', 'career'];

function App() {
  const [mode, setMode] = useState<GameMode>('daily');
  const [clueType, setClueType] = useState<ClueType | null>(null);
  const [, startTransition] = useTransition();
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
  }, [stats, career.progress, checkBadges]);
  const { addScore: addTimedScore, getScores: getTimedScores } =
    useTimedScores();
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showTimedScores, setShowTimedScores] = useState(false);
  const [showBadgesModal, setShowBadgesModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [debug, setDebug] = useState(false);
  const [timedMode, setTimedMode] = useState(false);
  const [timedGameType, setTimedGameType] = useState<'speed' | 'quiz'>('speed');
  const [timedPlaying, setTimedPlaying] = useState(false);
  const mapTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [careerView, setCareerView] = useState<'game' | 'map' | 'collection'>(
    'game',
  );

  // Sync body background for hard mode theme
  useEffect(() => {
    if (clueType === 'coatOfArmsHard' || clueType === 'coatOfArmsImpossible') {
      const isLight = document.documentElement.dataset.theme === 'light';
      document.body.style.transition = 'background-color 2s ease-out';
      document.body.style.backgroundColor = isLight ? '#fdf0f0' : '#1e1a20';
    }
    return () => {
      document.body.style.transition = '';
      document.body.style.backgroundColor = '';
    };
  }, [clueType]);

  // Initialize career answer
  useEffect(() => {
    const key = clueType ?? 'shape';
    if (!careerAnswers[key]) {
      career.getRandomUnguessed().then(setCareerAnswer);
    }
  }, [clueType]);

  // On game end for any mode: record stats, handle career logic
  // Wait until daily game has loaded from async storage to avoid
  // treating the async status transition as a real game end.
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

      // Skip async-loaded daily games (status changed due to IndexedDB load, not gameplay)
      if (m === 'daily' && !daily.ready) continue;

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
  }, [daily.status, daily.ready, casual.status, careerGame.status]);

  const handleCareerNext = useCallback(() => {
    clearTimeout(mapTimerRef.current);
    setCareerView('game');
    career.getRandomUnguessed().then(setCareerAnswer);
  }, [career.getRandomUnguessed]);

  const careerComplete = career.completedCount === career.totalCount;

  const { initRef, scrollTo: scrollToMode } = useScrollSnap(MODES, setMode);

  if (!clueType) {
    return (
      <>
        <LandingPage
          onSelect={(ct) => startTransition(() => setClueType(ct))}
        />
        <UpdateBanner />
      </>
    );
  }

  const renderClue = (game: ReturnType<typeof useGame>) =>
    clueType === 'shape' ? (
      <MunicipalityShape name={game.answer.name} />
    ) : clueType === 'coatOfArmsImpossible' ? (
      <DescriptionClue description={game.answer.description} />
    ) : (
      <CoatOfArms name={game.answer.name} />
    );

  return (
    <div
      className={`app${clueType === 'coatOfArmsHard' || clueType === 'coatOfArmsImpossible' ? ' app--hard' : ''}`}
    >
      <Header
        minimal={timedMode}
        timedGameType={timedGameType}
        onTimedGameTypeChange={setTimedGameType}
        timedPlaying={timedPlaying}
        mode={mode}
        onModeChange={(m) => {
          setMode(m);
          scrollToMode(m);
        }}
        onBack={() => {
          if (timedMode) {
            setTimedMode(false);
          } else {
            setClueType(null);
            setMode('daily');
          }
        }}
        onStats={() => setShowStatsModal(true)}
        onTimedStats={() => setShowTimedScores(true)}
        onBadges={() => setShowBadgesModal(true)}
        onSettings={() => setShowSettingsModal(true)}
        onTimedMode={
          clueType !== 'shape' ? () => setTimedMode(true) : undefined
        }
        onDebugToggle={
          import.meta.env.DEV ? () => setDebug((d) => !d) : undefined
        }
      />
      {timedMode && (
        <TimedMode
          gameType={timedGameType}
          onPhaseChange={(p) => setTimedPlaying(p === 'playing')}
          addScore={addTimedScore}
          getScores={getTimedScores}
        />
      )}
      <div style={timedMode ? { display: 'none' } : undefined}>
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
              clue={renderClue(daily)}
              mode="daily"
              clueType={clueType}
              onNewGame={daily.newGame}
            />
          </main>

          {/* Casual panel */}
          <main className="app-body">
            <GamePanel
              game={casual}
              clue={renderClue(casual)}
              mode="casual"
              clueType={clueType}
              onNewGame={casual.newGame}
            />
          </main>

          {/* Career panel */}
          <CareerPanel
            mode={mode}
            career={career}
            careerGame={careerGame}
            clueType={clueType}
            careerComplete={careerComplete}
            onNext={handleCareerNext}
            clue={renderClue(careerGame)}
            careerView={careerView}
            onViewChange={setCareerView}
          />
        </div>
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
      {showTimedScores && (
        <TimedScoresModal
          getScores={getTimedScores}
          onClose={() => setShowTimedScores(false)}
        />
      )}
      {showBadgesModal && (
        <BadgeModal
          badgeState={badgeState}
          onClose={() => setShowBadgesModal(false)}
        />
      )}
      {showSettingsModal && (
        <SettingsModal onClose={() => setShowSettingsModal(false)} />
      )}
      {newlyUnlocked && (
        <BadgeToast badgeId={newlyUnlocked.badgeId} onDismiss={dismissToast} />
      )}
      <UpdateBanner />
    </div>
  );
}

export default App;
