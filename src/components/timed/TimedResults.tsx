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
  onPlayAgain: () => void;
}

export function TimedResults({ results, onPlayAgain }: TimedResultsProps) {
  const correct = results.filter((r) => r.correct).length;
  const total = results.length;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const correctTimes = results.filter((r) => r.correct).map((r) => r.timeMs);
  const avgTime =
    correctTimes.length > 0
      ? correctTimes.reduce((a, b) => a + b, 0) / correctTimes.length
      : 0;
  const fastest = correctTimes.length > 0 ? Math.min(...correctTimes) : 0;
  const maxTime =
    results.length > 0 ? Math.max(...results.map((r) => r.timeMs)) : 1;

  return (
    <div className="timed-results">
      <h2 className="timed-results-title">Aika loppui!</h2>
      <div className="timed-results-stats">
        <div className="timed-stat">
          <span className="timed-stat-value">{correct}</span>
          <span className="timed-stat-label">/ {total} oikein</span>
        </div>
        <div className="timed-stat">
          <span className="timed-stat-value">{accuracy}%</span>
          <span className="timed-stat-label">tarkkuus</span>
        </div>
        {correctTimes.length > 0 && (
          <div className="timed-stat">
            <span className="timed-stat-value">
              {(avgTime / 1000).toFixed(1)}s
            </span>
            <span className="timed-stat-label">keskiarvo</span>
          </div>
        )}
        {correctTimes.length > 0 && (
          <div className="timed-stat">
            <span className="timed-stat-value">
              {(fastest / 1000).toFixed(1)}s
            </span>
            <span className="timed-stat-label">nopein</span>
          </div>
        )}
      </div>

      {results.length > 0 && (
        <div className="timed-answer-list">
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

      <div className="timed-results-actions">
        <button className="timed-btn timed-btn--primary" onClick={onPlayAgain}>
          Uusi peli
        </button>
      </div>
    </div>
  );
}
