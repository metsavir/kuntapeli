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
import { CoatCollection } from './components/CoatCollection';
import { CareerStats } from './components/CareerStats';
import { StatsModal } from './components/StatsModal';
import { useStats } from './hooks/useStats';
import './App.css';

const MODES: GameMode[] = ['daily', 'casual', 'career'];

function App() {
  const [mode, setMode] = useState<GameMode>('daily');
  const [clueType, setClueType] = useState<ClueType | null>(null);
  const career = useCareer(clueType ?? 'shape');
  const [careerAnswers, setCareerAnswers] = useState<Record<string, Municipality | null>>({});
  const careerAnswer = careerAnswers[clueType ?? 'shape'] ?? null;
  const setCareerAnswer = useCallback((m: Municipality | null) => {
    setCareerAnswers((prev) => ({ ...prev, [clueType ?? 'shape']: m }));
  }, [clueType]);

  // Three independent game instances — one per mode
  const daily = useGame('daily', { clueType });
  const casual = useGame('casual', { clueType });
  const careerGame = useGame('career', { initialAnswer: careerAnswer, clueType });

  const games = { daily, casual, career: careerGame };

  const { stats, recordGame } = useStats();
  const [showHelp, setShowHelp] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [debug, setDebug] = useState(false);
  const [careerView, setCareerView] = useState<'game' | 'map' | 'collection'>('game');
  const flipRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  // Initialize career answer
  useEffect(() => {
    const key = clueType ?? 'shape';
    if (!careerAnswers[key]) {
      setCareerAnswer(career.getRandomUnguessed());
    }
  }, [clueType]);

  // Reset career view when switching to career mode
  useEffect(() => {
    if (flipRef.current) {
      flipRef.current.style.transition = 'none';
      flipRef.current.querySelectorAll<HTMLElement>('.career-flip-face').forEach(el => el.style.transition = 'none');
      flipRef.current.offsetHeight;
      requestAnimationFrame(() => {
        if (flipRef.current) {
          flipRef.current.style.transition = '';
          flipRef.current.querySelectorAll<HTMLElement>('.career-flip-face').forEach(el => el.style.transition = '');
        }
      });
    }
    setCareerView('game');
  }, [mode]);

  // On game end for any mode: record stats, handle career logic
  const prevStatuses = useRef({ daily: daily.status, casual: casual.status, career: careerGame.status });
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
          setTimeout(() => setCareerView('map'), 1500);
        } else {
          career.markFailed(g.answer.name, g.guesses.length);
        }
      }
    }
  }, [daily.status, casual.status, careerGame.status]);

  const handleCareerNext = useCallback(() => {
    setCareerView('game');
    const next = career.getRandomUnguessed();
    setCareerAnswer(next);
  }, [career.getRandomUnguessed]);

  const careerComplete = career.completedCount === career.totalCount;

  // Scroll-snap: scroll to correct panel on pill button click
  const isProgScroll = useRef(false);
  const scrollToMode = useCallback((m: GameMode) => {
    const el = scrollerRef.current;
    if (!el) return;
    isProgScroll.current = true;
    const idx = MODES.indexOf(m);
    el.scrollTo({ left: idx * el.offsetWidth, behavior: 'smooth' });
  }, []);

  // Set up scroller: initial position + scroll listener
  const scrollCleanup = useRef<(() => void) | null>(null);
  const initRef = useCallback((el: HTMLDivElement | null) => {
    scrollCleanup.current?.();
    scrollCleanup.current = null;
    scrollerRef.current = el;
    if (!el) return;

    el.scrollLeft = MODES.indexOf(mode) * el.offsetWidth;

    let scrollTimer: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      if (isProgScroll.current) {
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(() => { isProgScroll.current = false; }, 100);
        return;
      }
      const idx = Math.round(el.scrollLeft / el.offsetWidth);
      const newMode = MODES[idx];
      if (newMode) setMode(newMode);
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    scrollCleanup.current = () => el.removeEventListener('scroll', onScroll);
  }, []);

  if (!clueType) {
    return <LandingPage onSelect={setClueType} />;
  }

  const renderClue = (name: string) =>
    clueType === 'shape' ? <MunicipalityShape name={name} /> : <CoatOfArms name={name} />;

  return (
    <div className="app">
      <Header
        dateStr={games[mode].dateStr}
        mode={mode}
        careerCount={`${career.completedCount}/${career.totalCount}`}
        onModeChange={(m) => { setMode(m); scrollToMode(m); }}
        onBack={() => { setClueType(null); setMode('daily'); }}
        onStats={() => setShowStatsModal(true)}
        onHelp={() => setShowHelp(true)}
        onDebugToggle={import.meta.env.DEV ? () => setDebug((d) => !d) : undefined}
      />
      {debug && (
        <div style={{ background: '#ff000030', color: '#ff8888', textAlign: 'center', padding: '0.25rem', fontSize: '0.75rem', fontFamily: 'monospace' }}>
          DEBUG: {games[mode].answer.name} ({games[mode].answer.region})
        </div>
      )}
      <div className="mode-scroller" ref={initRef}>
        {/* Daily panel */}
        <main className="app-body">
          {renderClue(daily.answer.name)}
          <GuessInput
            onSubmit={daily.submitGuess}
            onGiveUp={daily.giveUp}
            onHint={daily.showHint}
            hints={daily.hints}
            maxHints={daily.maxHints}
            disabled={daily.status !== 'playing'}
            attemptsLeft={daily.attemptsLeft}
          />
          <GuessList guesses={daily.guesses} />
          {daily.status !== 'playing' && (
            <GameOver
              status={daily.status}
              guesses={daily.guesses}
              answer={daily.answer}
              dateStr={daily.dateStr}
              mode="daily"
              stats={stats}
              clueType={clueType}
              careerComplete={false}
              onNewGame={daily.newGame}
            />
          )}
        </main>

        {/* Casual panel */}
        <main className="app-body">
          {renderClue(casual.answer.name)}
          <GuessInput
            onSubmit={casual.submitGuess}
            onGiveUp={casual.giveUp}
            onHint={casual.showHint}
            hints={casual.hints}
            maxHints={casual.maxHints}
            disabled={casual.status !== 'playing'}
            attemptsLeft={casual.attemptsLeft}
          />
          <GuessList guesses={casual.guesses} />
          {casual.status !== 'playing' && (
            <GameOver
              status={casual.status}
              guesses={casual.guesses}
              answer={casual.answer}
              dateStr={casual.dateStr}
              mode="casual"
              stats={stats}
              clueType={clueType}
              careerComplete={false}
              onNewGame={casual.newGame}
            />
          )}
        </main>

        {/* Career panel */}
        <main className="app-body">
          <CareerStats
            completed={career.completedCount}
            total={career.totalCount}
            view={careerView}
            onToggleMap={() => setCareerView((v) => v === 'map' ? 'game' : 'map')}
            onToggleCollection={() => setCareerView((v) => v === 'collection' ? 'game' : 'collection')}
          />
          <div ref={flipRef} className={`career-flip${careerView !== 'game' ? ` career-flip--${careerView}` : ''}`}>
            <div className="career-flip-face career-flip-front">
              {renderClue(careerGame.answer.name)}
              <GuessInput
                onSubmit={careerGame.submitGuess}
                onGiveUp={careerGame.giveUp}
                onHint={careerGame.showHint}
                hints={careerGame.hints}
                maxHints={careerGame.maxHints}
                disabled={careerGame.status !== 'playing'}
                attemptsLeft={careerGame.attemptsLeft}
              />
              <GuessList guesses={careerGame.guesses} />
            </div>
            <div className="career-flip-face career-flip-back">
              <FinlandMap
                completed={career.completedSet}
                failed={career.failedSet}
                careerStats={career.progress.stats}
                currentMunicipality={careerGame.status !== 'playing' && careerGame.status === 'won' ? careerGame.answer.name : undefined}
                visible={careerView === 'map'}
              />
            </div>
            <div className="career-flip-face career-flip-collection">
              <CoatCollection completedSet={career.completedSet} careerStats={career.progress.stats} visible={careerView === 'collection'} />
            </div>
          </div>
          {careerGame.status !== 'playing' && careerView !== 'collection' && (
            <GameOver
              status={careerGame.status}
              guesses={careerGame.guesses}
              answer={careerGame.answer}
              dateStr={careerGame.dateStr}
              mode="career"
              stats={stats}
              clueType={clueType}
              careerComplete={careerComplete}
              onNewGame={handleCareerNext}
            />
          )}
        </main>
      </div>
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
