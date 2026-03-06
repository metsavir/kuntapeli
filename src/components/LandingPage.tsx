import { useState, useRef, useCallback, useEffect } from 'react';
import type { ClueType } from '../data/types';
import { getDailyAnswer, getTodayString } from '../utils/game';
import './LandingPage.css';

const COAT_CLUE_TYPES = [
  'coatOfArms',
  'coatOfArmsHard',
  'coatOfArmsImpossible',
] as const;

interface LandingPageProps {
  onSelect: (clueType: ClueType) => void;
}

export function LandingPage({ onSelect }: LandingPageProps) {
  const [showHelp, setShowHelp] = useState(false);
  const [loading, setLoading] = useState<ClueType | null>(null);

  const longPressTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const longPressTriggered = useRef(false);
  const [showHardConfirm, setShowHardConfirm] = useState(false);
  const [showImpossibleConfirm, setShowImpossibleConfirm] = useState(false);

  const impossibleTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const impossibleTriggered = useRef(false);

  // Prefetch daily coat images while user is on landing page
  useEffect(() => {
    const dateStr = getTodayString();
    for (const ct of COAT_CLUE_TYPES) {
      const name = getDailyAnswer(dateStr, ct).name;
      const img = new Image();
      img.src = `${import.meta.env.BASE_URL}coats/${name}.png`;
    }
  }, []);

  const handleSelect = (type: ClueType) => {
    if (longPressTriggered.current) return;
    setLoading(type);
    requestAnimationFrame(() => onSelect(type));
  };

  const handleCoatDown = useCallback(() => {
    longPressTriggered.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      setShowHardConfirm(true);
    }, 800);
  }, []);

  const handleCoatUp = useCallback(() => {
    clearTimeout(longPressTimer.current);
  }, []);

  if (loading) {
    return (
      <div className="landing">
        <span className="landing-spinner" />
      </div>
    );
  }

  return (
    <div className="landing">
      <h1 className="landing-title">Kuntapeli</h1>
      <p className="landing-subtitle">Tunnista Suomen kunnat</p>

      <div className="landing-cards">
        <button className="landing-card" onClick={() => handleSelect('shape')}>
          <div className="landing-card-visual">
            <svg
              viewBox="0 0 80 80"
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth="2"
              strokeLinejoin="round"
            >
              <path d="M20 15 L55 10 L65 30 L60 55 L40 70 L15 60 L10 35 Z" />
            </svg>
          </div>
          <span className="landing-card-label">Rajat</span>
        </button>
        <button
          className="landing-card"
          onClick={() => handleSelect('coatOfArms')}
          onPointerDown={handleCoatDown}
          onPointerUp={handleCoatUp}
          onPointerLeave={handleCoatUp}
          onContextMenu={(e) => e.preventDefault()}
        >
          <div className="landing-card-visual">
            <img
              src={`${import.meta.env.BASE_URL}coats/Helsinki.png`}
              alt=""
              draggable={false}
            />
          </div>
          <span className="landing-card-label">Vaakunat</span>
        </button>
      </div>

      {showHardConfirm && (
        <div className="landing-hard-confirm">
          <p className="landing-hard-title">Hard Mode</p>
          <p className="landing-hard-desc">
            1 arvaus, ei vihjeitä. Tunnistatko vaakunan?
          </p>
          <div className="landing-hard-actions">
            <button
              className="landing-hard-cancel"
              onClick={() => setShowHardConfirm(false)}
            >
              Peruuta
            </button>
            <button
              className="landing-hard-go"
              onClick={() => {
                if (impossibleTriggered.current) return;
                setShowHardConfirm(false);
                setLoading('coatOfArmsHard');
                requestAnimationFrame(() => onSelect('coatOfArmsHard'));
              }}
              onPointerDown={() => {
                impossibleTriggered.current = false;
                impossibleTimer.current = setTimeout(() => {
                  impossibleTriggered.current = true;
                  setShowHardConfirm(false);
                  setShowImpossibleConfirm(true);
                }, 800);
              }}
              onPointerUp={() => clearTimeout(impossibleTimer.current)}
              onPointerLeave={() => clearTimeout(impossibleTimer.current)}
              onContextMenu={(e) => e.preventDefault()}
            >
              Pelaan
            </button>
          </div>
        </div>
      )}

      {showImpossibleConfirm && (
        <div className="landing-hard-confirm landing-impossible-confirm">
          <p className="landing-hard-title">Impossible Mode</p>
          <p className="landing-hard-desc">
            1 arvaus, ei vihjeitä. Pelkkä heraldinen selitys.
          </p>
          <div className="landing-hard-actions">
            <button
              className="landing-hard-cancel"
              onClick={() => setShowImpossibleConfirm(false)}
            >
              Peruuta
            </button>
            <button
              className="landing-hard-go"
              onClick={() => {
                setShowImpossibleConfirm(false);
                setLoading('coatOfArmsImpossible');
                requestAnimationFrame(() => onSelect('coatOfArmsImpossible'));
              }}
            >
              Pelaan
            </button>
          </div>
        </div>
      )}

      <div className="landing-help-wrapper">
        <button
          className="landing-help-toggle"
          onClick={() => setShowHelp((v) => !v)}
        >
          {showHelp ? 'Sulje ohjeet' : 'Miten pelataan?'}
        </button>
        <div className={`landing-help-panel${showHelp ? ' open' : ''}`}>
          <div className="landing-help-panel-inner">
            <div className="landing-help-content">
              <p>
                Arvaa kunta rajakuvan tai vaakunan perusteella. Käytössäsi on{' '}
                <strong>6 arvausta</strong>.
              </p>
              <p>Jokaisesta arvauksesta näet:</p>
              <ul>
                <li>
                  <strong>Etäisyys</strong> — kilometrit oikeaan kuntaan
                </li>
                <li>
                  <strong>Suunta</strong> — nuoli kohti oikeaa kuntaa
                </li>
                <li>
                  <strong>Läheisyys</strong> — kuinka lähellä olet prosentteina
                </li>
              </ul>
              <p>
                Lisäksi voit käyttää enintään <strong>3 vihjettä</strong>:
                maakunta, väkiluku ja naapurikunnat.
              </p>
              <p className="landing-help-modes">
                <strong>Päivittäinen</strong> — sama kunta kaikille |{' '}
                <strong>Harjoittelu</strong> — pelaa rajattomasti |{' '}
                <strong>Ura</strong> — arvaa kaikki 308 kuntaa
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
