import { useState, useCallback, useEffect, useRef } from 'react';
import './CoatOfArms.css';

interface CoatOfArmsProps {
  name: string;
}

export function CoatOfArms({ name }: CoatOfArmsProps) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const prevName = useRef(name);

  // Reset state when name changes
  useEffect(() => {
    if (name !== prevName.current) {
      prevName.current = name;
      setError(false);
      setLoaded(false);
    }
  }, [name]);

  // Handle cached images that are already complete
  const imgRef = useCallback((img: HTMLImageElement | null) => {
    if (img?.complete && img.naturalWidth > 0) {
      setLoaded(true);
    }
  }, []);

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
