import type { TimedScore } from '../../hooks/useTimedScores';
import './TimedMode.css';

interface TimedResult {
  name: string;
  guess: string;
  correct: boolean;
  timeMs: number;
}

interface TimedResultsProps {
  results: TimedResult[];
  durationSec: number;
  highScores: TimedScore[];
  onPlayAgain: () => void;
}

export function TimedResults({
  results,
  highScores,
  onPlayAgain,
}: TimedResultsProps) {
  const correct = results.filter((r) => r.correct).length;
  const total = results.length;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const correctTimes = results.filter((r) => r.correct).map((r) => r.timeMs);
  const avgTime =
    correctTimes.length > 0
      ? correctTimes.reduce((a, b) => a + b, 0) / correctTimes.length
      : 0;
  const maxTime =
    results.length > 0 ? Math.max(...results.map((r) => r.timeMs)) : 1;

  const isBest =
    highScores.length <= 1 || correct > (highScores[1]?.correct ?? 0);

  return (
    <div className="timed-results">
      {/* Hero card */}
      <div
        className={`timed-result-card timed-hero-card${isBest && correct > 0 ? ' timed-hero-card--best' : ''}`}
      >
        <span className="timed-hero-score">{correct}</span>
        <span className="timed-hero-label">
          / {total} oikein
        </span>
        <span className="timed-hero-details">
          {accuracy}%{correctTimes.length > 0 && ` · ${(avgTime / 1000).toFixed(1)}s ka.`}
        </span>
        {isBest && correct > 0 && (
          <span className="timed-best-badge">Uusi ennätys!</span>
        )}
      </div>

      {/* CTA */}
      <div className="timed-results-actions">
        <button className="timed-btn timed-btn--primary" onClick={onPlayAgain}>
          Uusi peli
        </button>
      </div>

      {/* High scores card */}
      {highScores.length > 0 &&
        (() => {
          const currentIdx = highScores.findIndex(
            (s) => s.correct === correct && s.accuracy === accuracy,
          );
          const top3 = highScores.slice(0, 3);
          const showCurrent = currentIdx >= 3;
          const showSeparator = currentIdx > 3;
          return (
            <div className="timed-result-card timed-highscores">
              <h3 className="timed-answer-list-title">Parhaat tulokset</h3>
              <div className="timed-highscore-list">
                {top3.map((s, i) => (
                  <div
                    key={i}
                    className={`timed-highscore-row${i === currentIdx ? ' timed-highscore-row--current' : ''}`}
                  >
                    <span className="timed-highscore-rank">{i + 1}.</span>
                    <span className="timed-highscore-score">{s.correct}</span>
                    <span className="timed-highscore-detail">
                      {s.accuracy}% · {(s.avgTimeMs / 1000).toFixed(1)}s
                    </span>
                    <span className="timed-highscore-date">{s.date}</span>
                  </div>
                ))}
                {showCurrent && (
                  <>
                    {showSeparator && (
                      <div className="timed-highscore-row timed-highscore-row--separator">
                        <span className="timed-highscore-rank">···</span>
                      </div>
                    )}
                    <div className="timed-highscore-row timed-highscore-row--current">
                      <span className="timed-highscore-rank">
                        {currentIdx + 1}.
                      </span>
                      <span className="timed-highscore-score">
                        {highScores[currentIdx].correct}
                      </span>
                      <span className="timed-highscore-detail">
                        {highScores[currentIdx].accuracy}% ·{' '}
                        {(highScores[currentIdx].avgTimeMs / 1000).toFixed(1)}s
                      </span>
                      <span className="timed-highscore-date">
                        {highScores[currentIdx].date}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })()}

      {/* Answers card */}
      {results.length > 0 && (
        <div className="timed-result-card timed-answer-list">
          <h3 className="timed-answer-list-title">Vastaukset</h3>
          <div className="timed-answers">
            {results.map((r, i) => (
              <div
                key={i}
                className={`timed-answer ${r.correct ? 'timed-answer--correct' : 'timed-answer--wrong'}`}
              >
                <span className="timed-answer-icon">
                  {r.correct ? '✓' : '✗'}
                </span>
                <span className="timed-answer-name">
                  {r.name}
                  {!r.correct && (
                    <span className="timed-answer-guess">{r.guess}</span>
                  )}
                </span>
                <div className="timed-answer-bar-wrap">
                  <div
                    className={`timed-answer-bar ${r.correct ? 'timed-answer-bar--correct' : 'timed-answer-bar--wrong'}`}
                    style={{ width: `${(r.timeMs / maxTime) * 100}%` }}
                  />
                </div>
                <span className="timed-answer-time">
                  {(r.timeMs / 1000).toFixed(1)}s
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
