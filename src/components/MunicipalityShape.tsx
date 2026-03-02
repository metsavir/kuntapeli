import { useMemo } from 'react';
import { getShape } from '../data/shapes';
import './MunicipalityShape.css';

interface MunicipalityShapeProps {
  name: string;
}

/** Convert a Polygon or MultiPolygon to an array of polygon rings (outer only). */
function getRings(shape: { type: string; coordinates: number[][][] | number[][][][] }): number[][][] {
  if (shape.type === 'Polygon') {
    // Polygon: coordinates is [ring, ...holes], take outer ring only
    return [(shape.coordinates as number[][][])[0]];
  }
  // MultiPolygon: coordinates is polygon[], take outer ring of each
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

export function MunicipalityShape({ name }: MunicipalityShapeProps) {
  const pathData = useMemo(() => {
    const shape = getShape(name);
    if (!shape) return null;

    const rings = getRings(shape);

    // Compute bounding box
    let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
    for (const ring of rings) {
      for (const [lng, lat] of ring) {
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      }
    }

    // Aspect ratio correction for latitude
    const centerLat = (minLat + maxLat) / 2;
    const cosLat = Math.cos((centerLat * Math.PI) / 180);

    const width = (maxLng - minLng) * cosLat;
    const height = maxLat - minLat;

    // Add 10% padding
    const padX = width * 0.1;
    const padY = height * 0.1;

    const d = buildPath(rings, minLng - padX / cosLat, maxLat + padY, cosLat);
    const vw = width + padX * 2;
    const vh = height + padY * 2;

    return { d, viewBox: `0 0 ${vw} ${vh}` };
  }, [name]);

  if (!pathData) return null;

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
