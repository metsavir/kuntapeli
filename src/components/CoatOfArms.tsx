import { useState } from 'react';
import './CoatOfArms.css';

interface CoatOfArmsProps {
  name: string;
}

export function CoatOfArms({ name }: CoatOfArmsProps) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className="coat-of-arms-container">
        <div className="coat-of-arms-missing">Vaakunaa ei löytynyt</div>
      </div>
    );
  }

  return (
    <div className="coat-of-arms-container">
      <img
        src={`/coats/${name}.png`}
        alt="Kunnan vaakuna"
        className="coat-of-arms-img"
        onError={() => setError(true)}
        draggable={false}
      />
    </div>
  );
}
