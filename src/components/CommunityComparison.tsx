import { useMemo } from 'react';
import { getCommunityStats } from '../data/communityStats';
import './CommunityComparison.css';

interface CommunityComparisonProps {
  municipality: string;
  attempts: number;
  won: boolean;
}

export function CommunityComparison({ municipality, attempts, won }: CommunityComparisonProps) {
  const stats = useMemo(
    () => getCommunityStats(municipality, attempts, won),
    [municipality, attempts, won]
  );

  return (
    <div className="community-comparison">
      <div className="community-row">
        <span className="community-label">Keskim. arvaukset</span>
        <span className="community-value">{stats.avgAttempts}</span>
      </div>
      <div className="community-row">
        <span className="community-label">Voittoprosentti</span>
        <span className="community-value">{stats.winRate} %</span>
      </div>
      <div className="community-row">
        <span className="community-label">Pelaajia</span>
        <span className="community-value">{stats.totalPlays}</span>
      </div>
      <div className="community-percentile">
        Parempi kuin <strong>{stats.percentile} %</strong> pelaajista
      </div>
    </div>
  );
}
