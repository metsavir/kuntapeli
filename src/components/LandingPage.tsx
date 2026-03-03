import type { ClueType } from '../data/types';
import './LandingPage.css';

interface LandingPageProps {
  onSelect: (clueType: ClueType) => void;
}

export function LandingPage({ onSelect }: LandingPageProps) {
  return (
    <div className="landing">
      <h1 className="landing-title">Kuntapeli</h1>
      <p className="landing-subtitle">Tunnista Suomen kunnat</p>
      <div className="landing-cards">
        <button className="landing-card" onClick={() => onSelect('shape')}>
          <div className="landing-card-visual">
            <svg viewBox="0 0 80 80" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinejoin="round">
              <path d="M20 15 L55 10 L65 30 L60 55 L40 70 L15 60 L10 35 Z" />
            </svg>
          </div>
          <span className="landing-card-label">Rajat</span>
        </button>
        <button className="landing-card" onClick={() => onSelect('coatOfArms')}>
          <div className="landing-card-visual">
            <img src="/coats/Helsinki.png" alt="" draggable={false} />
          </div>
          <span className="landing-card-label">Vaakunat</span>
        </button>
      </div>
    </div>
  );
}
