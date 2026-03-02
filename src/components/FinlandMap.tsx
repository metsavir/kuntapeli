import { useState, useEffect, useMemo, useCallback } from 'react';
import { getAllShapes } from '../data/shapes';
import { municipalities } from '../data/municipalities';
import type { MunicipalityShape } from '../data/types';
import './FinlandMap.css';

interface FinlandMapProps {
  completed: Set<string>;
  currentMunicipality?: string;
}

// Build name → region lookup
const regionByName: Record<string, string> = {};
for (const m of municipalities) {
  regionByName[m.name] = m.region;
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

interface BBox {
  minLng: number; maxLng: number; minLat: number; maxLat: number;
}

function bboxFromNames(
  names: string[],
  allShapes: Record<string, MunicipalityShape>
): BBox {
  let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
  for (const name of names) {
    const shape = allShapes[name];
    if (!shape) continue;
    for (const ring of getRings(shape)) {
      for (const [lng, lat] of ring) {
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      }
    }
  }
  return { minLng, maxLng, minLat, maxLat };
}

function computeViewBox(bbox: BBox, pad: number): { viewBox: string; originLng: number; originLat: number; cosLat: number } {
  const centerLat = (bbox.minLat + bbox.maxLat) / 2;
  const cosLat = Math.cos((centerLat * Math.PI) / 180);
  const width = (bbox.maxLng - bbox.minLng) * cosLat;
  const height = bbox.maxLat - bbox.minLat;
  const vw = width * (1 + pad * 2);
  const vh = height * (1 + pad * 2);
  const originLng = bbox.minLng - (width * pad) / cosLat;
  const originLat = bbox.maxLat + height * pad;
  return { viewBox: `0 0 ${vw} ${vh}`, originLng, originLat, cosLat };
}

export function FinlandMap({ completed, currentMunicipality }: FinlandMapProps) {
  const [allShapes, setAllShapes] = useState<Record<string, MunicipalityShape> | null>(null);
  const [zoomedRegion, setZoomedRegion] = useState<string | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ name: string; x: number; y: number } | null>(null);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    getAllShapes().then(setAllShapes);
  }, []);

  useEffect(() => {
    if (!currentMunicipality) {
      setAnimating(false);
      return;
    }
    setAnimating(true);
    // 1.2s × 2 iterations = 2.4s
    const timer = setTimeout(() => setAnimating(false), 2400);
    return () => clearTimeout(timer);
  }, [currentMunicipality]);

  // Group names by region
  const regionNames = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const m of municipalities) {
      const list = map.get(m.region) ?? [];
      list.push(m.name);
      map.set(m.region, list);
    }
    return map;
  }, []);

  const mapData = useMemo(() => {
    if (!allShapes) return null;

    const allNames = Object.keys(allShapes);
    const globalBBox = bboxFromNames(allNames, allShapes);
    const global = computeViewBox(globalBBox, 0.02);

    // Pre-compute all paths using global projection
    const paths = allNames.map((name) => ({
      name,
      region: regionByName[name],
      d: buildPath(getRings(allShapes[name]), global.originLng, global.originLat, global.cosLat),
    }));

    // Pre-compute region viewboxes in global coordinate space
    const regionViewBoxes = new Map<string, string>();
    for (const [region, names] of regionNames) {
      const bbox = bboxFromNames(names, allShapes);
      // Convert region bbox to global coordinate space
      const x1 = (bbox.minLng - global.originLng) * global.cosLat;
      const y1 = global.originLat - bbox.maxLat;
      const w = (bbox.maxLng - bbox.minLng) * global.cosLat;
      const h = bbox.maxLat - bbox.minLat;
      const pad = Math.max(w, h) * 0.1;
      regionViewBoxes.set(region, `${x1 - pad} ${y1 - pad} ${w + pad * 2} ${h + pad * 2}`);
    }

    return { globalViewBox: global.viewBox, paths, regionViewBoxes };
  }, [allShapes, regionNames]);

  const handleClick = useCallback((name: string) => {
    const region = regionByName[name];
    if (!region) return;
    setZoomedRegion((prev) => prev === region ? null : region);
  }, []);

  const handleBackClick = useCallback(() => {
    setZoomedRegion(null);
  }, []);

  if (!mapData) {
    return <div className="finland-map-loading">Ladataan karttaa...</div>;
  }

  const activeViewBox = zoomedRegion
    ? mapData.regionViewBoxes.get(zoomedRegion) ?? mapData.globalViewBox
    : mapData.globalViewBox;

  return (
    <div className="finland-map-container">
      {zoomedRegion && (
        <button className="finland-map-back" onClick={handleBackClick}>
          ← {zoomedRegion}
        </button>
      )}
      <svg
        viewBox={activeViewBox}
        className="finland-map"
        preserveAspectRatio="xMidYMid meet"
      >
        {mapData.paths
          .filter(({ region }) => !zoomedRegion || region === zoomedRegion)
          .map(({ name, region, d }) => {
          const isCompleted = completed.has(name);
          const isCurrent = name === currentMunicipality;
          const showLabel = zoomedRegion && (isCompleted || isCurrent);
          return (
            <path
              key={name}
              d={d}
              fillRule="evenodd"
              className={[
                isCurrent
                  ? 'fm-current'
                  : isCompleted
                    ? 'fm-completed'
                    : 'fm-pending',
                tooltip?.name === name ? 'fm-municipality-hover' : '',
              ].join(' ')}
              onClick={animating ? undefined : () => handleClick(name)}
              onMouseEnter={animating ? undefined : (e) => {
                setHoveredRegion(region);
                if (showLabel) {
                  const svg = e.currentTarget.ownerSVGElement!;
                  const pt = svg.createSVGPoint();
                  pt.x = e.clientX;
                  pt.y = e.clientY;
                  const svgPt = pt.matrixTransform(svg.getScreenCTM()!.inverse());
                  setTooltip({ name, x: svgPt.x, y: svgPt.y });
                }
              }}
              onMouseLeave={animating ? undefined : () => {
                setHoveredRegion(null);
                setTooltip(null);
              }}
            />
          );
        })}
        {hoveredRegion && !zoomedRegion && (
          <path
            d={mapData.paths
              .filter(({ region }) => region === hoveredRegion)
              .map(({ d }) => d)
              .join('')}
            className="fm-region-outline"
            fillRule="evenodd"
            pointerEvents="none"
          />
        )}
        {tooltip && (
          <text
            x={tooltip.x}
            y={tooltip.y}
            className="fm-tooltip"
            textAnchor="middle"
          >
            {tooltip.name}
          </text>
        )}
      </svg>
    </div>
  );
}
