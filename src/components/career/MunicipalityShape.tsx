import { useState, useEffect } from 'react';
import { getShape } from '../../data/shapes';
import { computeShapePathData } from '../../utils/mapGeometry';
import './MunicipalityShape.css';

interface MunicipalityShapeProps {
  name: string;
}

export function MunicipalityShape({ name }: MunicipalityShapeProps) {
  const [pathData, setPathData] = useState<{
    d: string;
    viewBox: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setPathData(null);
    setLoading(true);
    getShape(name).then((shape) => {
      if (cancelled) return;
      if (shape) setPathData(computeShapePathData(shape));
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [name]);

  if (loading) {
    return (
      <div className="municipality-shape-container">
        <div className="shape-loading">Ladataan...</div>
      </div>
    );
  }

  if (!pathData) {
    return (
      <div className="municipality-shape-container">
        <div className="shape-error">Muotoa ei voitu ladata</div>
      </div>
    );
  }

  return (
    <div className="municipality-shape-container">
      <svg
        viewBox={pathData.viewBox}
        className="municipality-shape"
        preserveAspectRatio="xMidYMid meet"
      >
        <path d={pathData.d} fillRule="evenodd" />
      </svg>
    </div>
  );
}
