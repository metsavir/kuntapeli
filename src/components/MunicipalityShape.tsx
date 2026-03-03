import { useState, useEffect } from 'react';
import { getShape } from '../data/shapes';
import type { MunicipalityShape as Shape } from '../data/types';
import './MunicipalityShape.css';

interface MunicipalityShapeProps {
  name: string;
}

/** Convert a Polygon or MultiPolygon to an array of polygon rings (outer only). */
function getRings(shape: Shape): number[][][] {
  if (shape.type === 'Polygon') {
    return [(shape.coordinates as number[][][])[0]];
  }
  return (shape.coordinates as number[][][][]).map((poly) => poly[0]);
}

function buildPath(
  rings: number[][][],
  minLng: number,
  maxLat: number,
  cosLat: number
): string {
  return rings
    .map((ring) => {
      const points = ring.map(([lng, lat]) => {
        const x = (lng - minLng) * cosLat;
        const y = maxLat - lat;
        return `${x},${y}`;
      });
      return `M${points.join('L')}Z`;
    })
    .join('');
}

function computePathData(shape: Shape) {
  const rings = getRings(shape);

  let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
  for (const ring of rings) {
    for (const [lng, lat] of ring) {
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }
  }

  const centerLat = (minLat + maxLat) / 2;
  const cosLat = Math.cos((centerLat * Math.PI) / 180);
  const width = (maxLng - minLng) * cosLat;
  const height = maxLat - minLat;
  const padX = width * 0.1;
  const padY = height * 0.1;

  const d = buildPath(rings, minLng - padX / cosLat, maxLat + padY, cosLat);
  const vw = width + padX * 2;
  const vh = height + padY * 2;

  return { d, viewBox: `0 0 ${vw} ${vh}` };
}

export function MunicipalityShape({ name }: MunicipalityShapeProps) {
  const [pathData, setPathData] = useState<{ d: string; viewBox: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setPathData(null);
    setLoading(true);
    getShape(name).then((shape) => {
      if (cancelled) return;
      if (shape) setPathData(computePathData(shape));
      setLoading(false);
    });
    return () => { cancelled = true; };
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
