import { useState, useEffect, useMemo, useCallback } from 'react';
import { getAllShapes } from '../../data/shapes';
import { municipalities } from '../../data/municipalities';
import type { Municipality, MunicipalityShape } from '../../data/types';
import { MunicipalityCard } from './MunicipalityCard';
import {
  getRings,
  buildPath,
  bboxFromNames,
  computeViewBox,
} from '../../utils/mapGeometry';
import './FinlandMap.css';

interface FinlandMapProps {
  completed: Set<string>;
  failed: Set<string>;
  careerStats: Record<string, { attempts: number; date: string }>;
  failures: { name: string; guesses: number; date: string }[];
  currentMunicipality?: string;
  visible?: boolean;
}

// Build name → region and name → municipality lookups
const regionByName: Record<string, string> = {};
const municipalityByName: Record<string, Municipality> = {};
for (const m of municipalities) {
  regionByName[m.name] = m.region;
  municipalityByName[m.name] = m;
}

export function FinlandMap({
  completed,
  failed,
  careerStats,
  failures,
  currentMunicipality,
  visible = true,
}: FinlandMapProps) {
  const [allShapes, setAllShapes] = useState<Record<
    string,
    MunicipalityShape
  > | null>(null);
  const [zoomedRegion, setZoomedRegion] = useState<string | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  // Increment pulseKey when map becomes visible with a currentMunicipality to re-trigger animation
  const [pulseKey, setPulseKey] = useState(0);
  useEffect(() => {
    if (visible && currentMunicipality) {
      setPulseKey((k) => k + 1);
    }
  }, [visible, currentMunicipality]);

  useEffect(() => {
    if (visible && !allShapes) {
      getAllShapes().then(setAllShapes);
    }
  }, [visible]);

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
      d: buildPath(
        getRings(allShapes[name]),
        global.originLng,
        global.originLat,
        global.cosLat,
      ),
    }));

    // Pre-compute region viewboxes in global coordinate space
    const regionViewBoxes = new Map<string, string>();
    for (const [region, names] of regionNames) {
      const bbox = bboxFromNames(names, allShapes);
      const x1 = (bbox.minLng - global.originLng) * global.cosLat;
      const y1 = global.originLat - bbox.maxLat;
      const w = (bbox.maxLng - bbox.minLng) * global.cosLat;
      const h = bbox.maxLat - bbox.minLat;
      const pad = Math.max(w, h) * 0.1;
      regionViewBoxes.set(
        region,
        `${x1 - pad} ${y1 - pad} ${w + pad * 2} ${h + pad * 2}`,
      );
    }

    // Compute region borders by finding boundary edges (edges not shared
    // between two municipalities in the same region)
    const regionBorders: { region: string; d: string }[] = [];
    for (const [region, names] of regionNames) {
      const edgeCounts = new Map<string, number>();
      const edgeCoords = new Map<string, [number, number, number, number]>();

      for (const name of names) {
        const shape = allShapes[name];
        if (!shape) continue;
        for (const ring of getRings(shape)) {
          for (let i = 0; i < ring.length - 1; i++) {
            const [x1, y1] = ring[i];
            const [x2, y2] = ring[i + 1];
            // Normalize edge direction so shared edges match
            const key =
              x1 < x2 || (x1 === x2 && y1 < y2)
                ? `${x1},${y1}-${x2},${y2}`
                : `${x2},${y2}-${x1},${y1}`;
            edgeCounts.set(key, (edgeCounts.get(key) ?? 0) + 1);
            if (!edgeCoords.has(key)) {
              edgeCoords.set(key, [x1, y1, x2, y2]);
            }
          }
        }
      }

      // Edges appearing once are boundary edges (region border or coastline)
      let d = '';
      for (const [key, count] of edgeCounts) {
        if (count === 1) {
          const [lng1, lat1, lng2, lat2] = edgeCoords.get(key)!;
          const sx1 = (lng1 - global.originLng) * global.cosLat;
          const sy1 = global.originLat - lat1;
          const sx2 = (lng2 - global.originLng) * global.cosLat;
          const sy2 = global.originLat - lat2;
          d += `M${sx1} ${sy1}L${sx2} ${sy2}`;
        }
      }
      regionBorders.push({ region, d });
    }

    return {
      globalViewBox: global.viewBox,
      paths,
      regionViewBoxes,
      regionBorders,
    };
  }, [allShapes, regionNames]);

  const handleClick = useCallback(
    (name: string) => {
      const region = regionByName[name];
      if (!region) return;

      if (zoomedRegion) {
        // Zoomed in — tap to select/deselect municipality
        const isKnown =
          completed.has(name) ||
          failed.has(name) ||
          name === currentMunicipality;
        if (isKnown) {
          setSelected((prev) => (prev === name ? null : name));
        }
      } else {
        // Zoomed out — tap to zoom into region
        setZoomedRegion(region);
        setSelected(null);
        setHoveredRegion(null);
      }
    },
    [zoomedRegion, completed, failed, currentMunicipality],
  );

  const handleBackClick = useCallback(() => {
    setZoomedRegion(null);
    setSelected(null);
  }, []);

  if (!mapData) {
    return <div className="finland-map-loading">Ladataan karttaa...</div>;
  }

  const activeViewBox = zoomedRegion
    ? (mapData.regionViewBoxes.get(zoomedRegion) ?? mapData.globalViewBox)
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
            const isCurrent = name === currentMunicipality;
            const isCompleted = completed.has(name);
            const isKnown = isCurrent || isCompleted;
            const className = isCurrent
              ? 'fm-current'
              : isCompleted
                ? 'fm-completed'
                : 'fm-pending';
            return (
              <path
                key={isCurrent ? `${name}-${pulseKey}` : name}
                d={d}
                fillRule="evenodd"
                className={`${className}${selected === name ? ' fm-selected' : ''}${zoomedRegion && isKnown ? ' fm-clickable' : ''}`}
                onClick={() => handleClick(name)}
                onMouseEnter={
                  !zoomedRegion ? () => setHoveredRegion(region) : undefined
                }
                onMouseLeave={
                  !zoomedRegion ? () => setHoveredRegion(null) : undefined
                }
              />
            );
          })}
        {!zoomedRegion &&
          mapData.regionBorders.map(({ region, d }) => (
            <path
              key={`border-${region}`}
              d={d}
              className="fm-region-border"
              fillRule="evenodd"
              pointerEvents="none"
            />
          ))}
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
      </svg>
      {selected &&
        (() => {
          const m = municipalityByName[selected];
          const isCompleted = completed.has(selected);
          const failCount = failures.filter((f) => f.name === selected).length;
          return (
            <div className="fm-card">
              <MunicipalityCard
                name={selected}
                municipality={m}
                stat={careerStats[selected]}
                failCount={failCount}
                showCoat={isCompleted}
              />
            </div>
          );
        })()}
    </div>
  );
}
