import { useState, useEffect, useMemo } from 'react';
import { getAllShapes } from '../data/shapes';
import type { MunicipalityShape } from '../data/types';
import './FinlandMap.css';

interface FinlandMapProps {
  completed: Set<string>;
  currentMunicipality?: string;
}

function getRings(shape: MunicipalityShape): number[][][] {
  if (shape.type === 'Polygon') {
    return [(shape.coordinates as number[][][])[0]];
  }
  return (shape.coordinates as number[][][][]).map((poly) => poly[0]);
}

function buildPath(
  rings: number[][][],
  originLng: number,
  originLat: number,
  cosLat: number
): string {
  return rings
    .map((ring) => {
      const points = ring.map(([lng, lat]) => {
        const x = (lng - originLng) * cosLat;
        const y = originLat - lat;
        return `${x},${y}`;
      });
      return `M${points.join('L')}Z`;
    })
    .join('');
}

export function FinlandMap({ completed, currentMunicipality }: FinlandMapProps) {
  const [allShapes, setAllShapes] = useState<Record<string, MunicipalityShape> | null>(null);

  useEffect(() => {
    getAllShapes().then(setAllShapes);
  }, []);

  const mapData = useMemo(() => {
    if (!allShapes) return null;

    // Compute global bounding box
    let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
    for (const shape of Object.values(allShapes)) {
      for (const ring of getRings(shape)) {
        for (const [lng, lat] of ring) {
          if (lng < minLng) minLng = lng;
          if (lng > maxLng) maxLng = lng;
          if (lat < minLat) minLat = lat;
          if (lat > maxLat) maxLat = lat;
        }
      }
    }

    const centerLat = (minLat + maxLat) / 2;
    const cosLat = Math.cos((centerLat * Math.PI) / 180);
    const width = (maxLng - minLng) * cosLat;
    const height = maxLat - minLat;
    const pad = 0.02;
    const vw = width * (1 + pad * 2);
    const vh = height * (1 + pad * 2);
    const originLng = minLng - (width * pad) / cosLat;
    const originLat = maxLat + height * pad;

    const paths = Object.entries(allShapes).map(([name, shape]) => ({
      name,
      d: buildPath(getRings(shape), originLng, originLat, cosLat),
    }));

    return { viewBox: `0 0 ${vw} ${vh}`, paths };
  }, [allShapes]);

  if (!mapData) {
    return <div className="finland-map-loading">Ladataan karttaa...</div>;
  }

  return (
    <div className="finland-map-container">
      <svg
        viewBox={mapData.viewBox}
        className="finland-map"
        preserveAspectRatio="xMidYMid meet"
      >
        {mapData.paths.map(({ name, d }) => (
          <path
            key={name}
            d={d}
            fillRule="evenodd"
            className={
              name === currentMunicipality
                ? 'fm-current'
                : completed.has(name)
                  ? 'fm-completed'
                  : 'fm-pending'
            }
          />
        ))}
      </svg>
    </div>
  );
}
