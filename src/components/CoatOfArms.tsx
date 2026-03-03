import { useState, useCallback } from 'react';
import './CoatOfArms.css';

interface CoatOfArmsProps {
  name: string;
}

// key={name} on the container forces a full remount when name changes,
// so state always starts fresh (false, false) for each municipality.
function CoatOfArmsInner({ name }: CoatOfArmsProps) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Handle cached images that are already complete on mount
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

export function CoatOfArms({ name }: CoatOfArmsProps) {
  return <CoatOfArmsInner key={name} name={name} />;
}
