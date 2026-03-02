import { useState } from 'react';
import type { GameMode } from './data/types';
import { useGame } from './hooks/useGame';
import { Header } from './components/Header';
import { GuessInput } from './components/GuessInput';
import { GuessList } from './components/GuessList';
import { GameOver } from './components/GameOver';
import { HelpModal } from './components/HelpModal';
import { MunicipalityShape } from './components/MunicipalityShape';
import './App.css';

function App() {
  const [mode, setMode] = useState<GameMode>('daily');
  const { guesses, status, answer, attemptsLeft, dateStr, submitGuess, showHint, hintText, giveUp, newGame } =
    useGame(mode);
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="app">
      <Header dateStr={dateStr} mode={mode} onModeChange={setMode} onHelp={() => setShowHelp(true)} />
      <main className="app-body">
        <MunicipalityShape name={answer.name} />
        <GuessInput
          onSubmit={submitGuess}
          onGiveUp={giveUp}
          onHint={showHint}
          hintText={hintText}
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
            onNewGame={newGame}
          />
        )}
      </main>
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  );
}

export default App;
