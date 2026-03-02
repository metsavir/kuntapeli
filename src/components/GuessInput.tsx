import { useState, useRef, useCallback, useEffect } from 'react';
import type { Municipality } from '../data/types';
import { searchMunicipalities } from '../utils/game';
import './GuessInput.css';

interface GuessInputProps {
  onSubmit: (name: string) => { error?: string };
  onGiveUp: () => void;
  onHint: () => void;
  hintText: string | null;
  disabled: boolean;
  attemptsLeft: number;
}

export function GuessInput({ onSubmit, onGiveUp, onHint, hintText, disabled, attemptsLeft }: GuessInputProps) {
  const [value, setValue] = useState('');
  const [suggestions, setSuggestions] = useState<Municipality[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const updateSuggestions = useCallback((query: string) => {
    const results = searchMunicipalities(query);
    setSuggestions(results.slice(0, 8));
    setSelectedIndex(-1);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValue(val);
    setError('');
    updateSuggestions(val);
  };

  const submit = (name: string) => {
    const result = onSubmit(name);
    if (result.error) {
      setError(result.error);
    } else {
      setValue('');
      setSuggestions([]);
      setError('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        submit(suggestions[selectedIndex].name);
      } else if (value.trim()) {
        submit(value.trim());
      }
    } else if (e.key === 'Escape') {
      setSuggestions([]);
    }
  };

  const handleSelect = (name: string) => {
    submit(name);
    inputRef.current?.focus();
  };

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[selectedIndex] as HTMLElement;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (disabled) return null;

  return (
    <div className="guess-input-wrapper">
      <div className="guess-input-row">
        <div className="guess-input-container">
          <input
            ref={inputRef}
            type="text"
            className="guess-input"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={`Arvaa kunta... (${attemptsLeft} jäljellä)`}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
          />
          {suggestions.length > 0 && (
            <ul className="suggestions" ref={listRef}>
              {suggestions.map((m, i) => (
                <li
                  key={m.name}
                  className={`suggestion ${i === selectedIndex ? 'suggestion--selected' : ''}`}
                  onMouseDown={() => handleSelect(m.name)}
                >
                  <span className="suggestion-name">{m.name}</span>
                  <span className="suggestion-region">{m.region}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          className="guess-submit"
          onClick={() => value.trim() && submit(value.trim())}
          disabled={!value.trim()}
        >
          Arvaa
        </button>
      </div>
      {error && <p className="guess-error">{error}</p>}
      {hintText && <p className="hint-text">{hintText}</p>}
      <div className="input-actions">
        <button className="hint-button" onClick={onHint} disabled={!!hintText}>
          Vihje
        </button>
        <button className="give-up-button" onClick={onGiveUp}>
          Luovuta
        </button>
      </div>
    </div>
  );
}
