import { useState } from 'react';
import { useGame } from './hooks/useGame';
import { Header } from './components/Header';
import { GuessInput } from './components/GuessInput';
import { GuessList } from './components/GuessList';
import { GameOver } from './components/GameOver';
import { HelpModal } from './components/HelpModal';
import './App.css';

function App() {
  const { guesses, status, answer, attemptsLeft, dateStr, submitGuess, giveUp, newGame } =
    useGame();
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="app">
      <Header dateStr={dateStr} onHelp={() => setShowHelp(true)} />
      <main className="app-body">
        <GuessInput
          onSubmit={submitGuess}
          onGiveUp={giveUp}
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
            onNewGame={newGame}
          />
        )}
      </main>
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  );
}

export default App;
