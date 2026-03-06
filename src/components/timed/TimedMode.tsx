import { useState, useRef, useCallback, useEffect } from 'react';
import { municipalities } from '../../data/municipalities';
import { findMunicipality } from '../../utils/game';
import { CoatOfArms } from '../career/CoatOfArms';
import { GuessInput } from '../game/GuessInput';
import { TimedResults } from './TimedResults';
import './TimedMode.css';

interface RoundResult {
  name: string;
  guess: string;
  correct: boolean;
  timeMs: number;
}

const DURATIONS = [60, 180, 300]; // 1, 3, 5 minutes

function shuffleMunicipalities() {
  const arr = [...municipalities];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function TimedMode() {
  const [phase, setPhase] = useState<'pick' | 'playing' | 'done'>('pick');
  const [durationSec, setDurationSec] = useState(60);
  const [timeLeft, setTimeLeft] = useState(0);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [feedback, setFeedback] = useState<{
    type: 'correct' | 'wrong';
    answer: string;
  } | null>(null);

  const queue = useRef(shuffleMunicipalities());
  const roundStart = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const endTimeRef = useRef(0);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const current = queue.current[index % queue.current.length];

  const startGame = useCallback((seconds: number) => {
    setDurationSec(seconds);
    setTimeLeft(seconds);
    setIndex(0);
    setResults([]);
    setFeedback(null);
    queue.current = shuffleMunicipalities();
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

  if (phase === 'pick') {
    return (
      <div className="timed-container">
        <p className="timed-subtitle">
          Tunnista mahdollisimman monta vaakunaa aikarajan puitteissa.
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

      <div className="timed-clue" key={index}>
        <CoatOfArms name={current.name} />
        {feedback && (
          <div className={`timed-feedback timed-feedback--${feedback.type}`}>
            <p className="timed-feedback-text">{feedback.answer}</p>
          </div>
        )}
      </div>

      <GuessInput
        onSubmit={handleSubmit}
        onGiveUp={() => {}}
        onHint={() => {}}
        hints={[]}
        maxHints={0}
        disabled={!!feedback}
        attemptsLeft={1}
      />
    </div>
  );
}
