import { useState, useEffect, useCallback } from 'react';
import './CoatOfArms.css';

interface CoatOfArmsProps {
  name: string;
}

export function CoatOfArms({ name }: CoatOfArmsProps) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setError(false);
    setLoaded(false);
  }, [name]);

  // Handle cached images that may already be complete on mount
  const imgRef = useCallback((img: HTMLImageElement | null) => {
    if (img?.complete && img.naturalWidth > 0) {
      setLoaded(true);
    }
  }, [name]);

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
        key={name}
        ref={imgRef}
        src={`${import.meta.env.BASE_URL}coats/${name}.png`}
        alt="Kunnan vaakuna"
        className="coat-of-arms-img"
        style={{ opacity: loaded ? 1 : 0 }}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        draggable={false}
      />
    </div>
  );
}
