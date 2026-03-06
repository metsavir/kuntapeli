import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import type { Municipality } from '../../data/types';
import { municipalities } from '../../data/municipalities';
import { findMunicipality } from '../../utils/game';
import { CoatOfArms } from '../career/CoatOfArms';
import { GuessInput } from '../game/GuessInput';
import { TimedResults } from './TimedResults';
import type { TimedScore } from '../../hooks/useTimedScores';
import './TimedMode.css';

type GameType = 'speed' | 'quiz';

interface RoundResult {
  name: string;
  guess: string;
  correct: boolean;
  timeMs: number;
}

const DURATIONS = [60, 180, 300]; // 1, 3, 5 minutes

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function generateOptions(correct: Municipality): string[] {
  const others = municipalities.filter((m) => m.name !== correct.name);
  const wrong = shuffleArray(others)
    .slice(0, 3)
    .map((m) => m.name);
  return shuffleArray([correct.name, ...wrong]);
}

function QuizOptions({
  options,
  correctName,
  feedback,
  onSelect,
}: {
  options: string[];
  correctName: string;
  feedback: { type: 'correct' | 'wrong'; answer: string } | null;
  onSelect: (name: string) => void;
}) {
  return (
    <div className="timed-quiz-grid">
      {options.map((name) => {
        let cls = 'timed-quiz-option';
        if (feedback) {
          if (name === correctName) cls += ' timed-quiz-option--correct';
          else if (name === feedback.answer && feedback.type === 'wrong')
            cls += ' timed-quiz-option--wrong';
        }
        return (
          <button
            key={name}
            className={cls}
            onClick={() => onSelect(name)}
            disabled={!!feedback}
          >
            {name}
          </button>
        );
      })}
    </div>
  );
}

interface TimedModeProps {
  gameType: GameType;
  onPhaseChange?: (phase: 'pick' | 'playing' | 'done') => void;
  addScore: (
    gameType: 'speed' | 'quiz',
    durationSec: number,
    score: TimedScore,
  ) => void;
  getScores: (gameType: 'speed' | 'quiz', durationSec: number) => TimedScore[];
}

export function TimedMode({
  gameType,
  onPhaseChange,
  addScore,
  getScores,
}: TimedModeProps) {
  const [phase, setPhase] = useState<'pick' | 'playing' | 'done'>('pick');

  useEffect(() => {
    onPhaseChange?.(phase);
  }, [phase, onPhaseChange]);

  // Reset to pick when game type changes (e.g. from results screen)
  useEffect(() => {
    if (phase !== 'playing') {
      setPhase('pick');
    }
  }, [gameType]);

  const [durationSec, setDurationSec] = useState(60);
  const [timeLeft, setTimeLeft] = useState(0);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [feedback, setFeedback] = useState<{
    type: 'correct' | 'wrong';
    answer: string;
  } | null>(null);

  const queue = useRef(shuffleArray(municipalities));
  const roundStart = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const endTimeRef = useRef(0);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const current = queue.current[index % queue.current.length];

  const quizOptions = useMemo(() => generateOptions(current), [current]);

  const startGame = useCallback((seconds: number) => {
    setDurationSec(seconds);
    setTimeLeft(seconds);
    setIndex(0);
    setResults([]);
    setFeedback(null);
    scoreSaved.current = false;
    queue.current = shuffleArray(municipalities);
    roundStart.current = Date.now();
    endTimeRef.current = Date.now() + seconds * 1000;
    setPhase('playing');
  }, []);

  // Timer interval
  useEffect(() => {
    if (phase !== 'playing') return;
    timerRef.current = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.ceil((endTimeRef.current - Date.now()) / 1000),
      );
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timerRef.current);
        clearTimeout(feedbackTimer.current);
        setFeedback(null);
        setPhase('done');
      }
    }, 100);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  // Save score when game ends
  const scoreSaved = useRef(false);
  useEffect(() => {
    if (phase !== 'done' || results.length === 0 || scoreSaved.current) return;
    scoreSaved.current = true;
    const correct = results.filter((r) => r.correct);
    const avgTimeMs =
      correct.length > 0
        ? correct.reduce((a, b) => a + b.timeMs, 0) / correct.length
        : 0;
    addScore(gameType, durationSec, {
      correct: correct.length,
      total: results.length,
      accuracy: Math.round((correct.length / results.length) * 100),
      avgTimeMs,
      date: new Date().toISOString().slice(0, 10),
    });
  }, [phase]);

  const advanceToNext = useCallback(() => {
    roundStart.current = Date.now();
    setFeedback(null);
    setIndex((i) => i + 1);
  }, []);

  const handleSubmit = useCallback(
    (name: string) => {
      if (feedback) return { error: 'Odota...' };
      const guess = findMunicipality(name);
      if (!guess) return { error: 'Tuntematon kunta' };

      const isCorrect = guess.name === current.name;
      const elapsed = Date.now() - roundStart.current;

      setResults((prev) => [
        ...prev,
        {
          name: current.name,
          guess: guess.name,
          correct: isCorrect,
          timeMs: elapsed,
        },
      ]);

      if (isCorrect) {
        setFeedback({ type: 'correct', answer: current.name });
        feedbackTimer.current = setTimeout(advanceToNext, 500);
      } else {
        setFeedback({ type: 'wrong', answer: current.name });
        feedbackTimer.current = setTimeout(advanceToNext, 1200);
      }

      return {};
    },
    [current, feedback, advanceToNext],
  );

  const handleQuizSelect = useCallback(
    (name: string) => {
      if (feedback) return;
      const isCorrect = name === current.name;
      const elapsed = Date.now() - roundStart.current;

      setResults((prev) => [
        ...prev,
        {
          name: current.name,
          guess: name,
          correct: isCorrect,
          timeMs: elapsed,
        },
      ]);

      if (isCorrect) {
        setFeedback({ type: 'correct', answer: current.name });
        feedbackTimer.current = setTimeout(advanceToNext, 500);
      } else {
        setFeedback({ type: 'wrong', answer: name });
        feedbackTimer.current = setTimeout(advanceToNext, 1200);
      }
    },
    [current, feedback, advanceToNext],
  );

  if (phase === 'pick') {
    return (
      <div className="timed-container">
        <p className="timed-subtitle">
          {gameType === 'speed'
            ? 'Kirjoita kunnan nimi mahdollisimman nopeasti. Jokainen oikea vastaus tuo pisteen.'
            : 'Valitse oikea kunta neljästä vaihtoehdosta. Nopeus ja tarkkuus ratkaisevat.'}
        </p>
        <div className="timed-duration-pick">
          {DURATIONS.map((sec) => (
            <button
              key={sec}
              className="timed-btn timed-btn--primary"
              onClick={() => startGame(sec)}
            >
              {sec / 60} min
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div className="timed-container">
        <TimedResults
          results={results}
          durationSec={durationSec}
          highScores={getScores(gameType, durationSec)}
          onPlayAgain={() => setPhase('pick')}
        />
      </div>
    );
  }

  const correct = results.filter((r) => r.correct).length;
  const pct = (timeLeft / durationSec) * 100;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="timed-container timed-playing">
      <div className="timed-hud">
        <button
          className="timed-quit"
          onClick={() => {
            clearInterval(timerRef.current);
            clearTimeout(feedbackTimer.current);
            setFeedback(null);
            setPhase('done');
          }}
          aria-label="Lopeta"
        >
          ✕
        </button>
        <div className="timed-score">{correct}</div>
        <div className="timed-timer-bar">
          <div
            className={`timed-timer-fill${timeLeft <= 10 ? ' timed-timer-fill--low' : ''}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="timed-clock">
          {minutes}:{seconds.toString().padStart(2, '0')}
        </div>
      </div>

      <div className="clue-wrapper">
        <CoatOfArms name={current.name} />
      </div>
      {feedback && gameType === 'speed' && (
        <div className={`timed-feedback timed-feedback--${feedback.type}`}>
          <p className="timed-feedback-text">{feedback.answer}</p>
        </div>
      )}

      {gameType === 'speed' ? (
        <GuessInput
          onSubmit={handleSubmit}
          onGiveUp={() => {}}
          onHint={() => {}}
          hints={[]}
          maxHints={0}
          disabled={!!feedback}
          attemptsLeft={1}
        />
      ) : (
        <QuizOptions
          options={quizOptions}
          correctName={current.name}
          feedback={feedback}
          onSelect={handleQuizSelect}
        />
      )}
    </div>
  );
}
