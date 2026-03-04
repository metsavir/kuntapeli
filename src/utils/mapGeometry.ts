import type { MunicipalityShape } from '../data/types';

export interface BBox {
  minLng: number;
  maxLng: number;
  minLat: number;
  maxLat: number;
}

/** Extract outer rings from a Polygon or MultiPolygon. */
export function getRings(shape: MunicipalityShape): number[][][] {
  if (shape.type === 'Polygon') {
    return [(shape.coordinates as number[][][])[0]];
  }
  return (shape.coordinates as number[][][][]).map((poly) => poly[0]);
}

/** Build an SVG path string from rings, projecting with cosine latitude correction. */
export function buildPath(
  rings: number[][][],
  originLng: number,
  originLat: number,
  cosLat: number,
): string {
  return rings
    .map((ring) => {
      const points = ring.map(
        ([lng, lat]) => `${(lng - originLng) * cosLat},${originLat - lat}`,
      );
      return `M${points.join('L')}Z`;
    })
    .join('');
}

/** Compute bounding box from an array of coordinate rings. */
export function bboxFromRings(rings: number[][][]): BBox {
  let minLng = Infinity,
    maxLng = -Infinity,
    minLat = Infinity,
    maxLat = -Infinity;
  for (const ring of rings) {
    for (const [lng, lat] of ring) {
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }
  }
  return { minLng, maxLng, minLat, maxLat };
}

/** Compute bounding box from municipality names using their shapes. */
export function bboxFromNames(
  names: string[],
  allShapes: Record<string, MunicipalityShape>,
): BBox {
  let minLng = Infinity,
    maxLng = -Infinity,
    minLat = Infinity,
    maxLat = -Infinity;
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

/** Compute SVG viewBox and projection parameters from a bounding box. */
export function computeViewBox(
  bbox: BBox,
  pad: number,
): {
  viewBox: string;
  originLng: number;
  originLat: number;
  cosLat: number;
} {
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

/** Compute SVG path data and viewBox for a single municipality shape. */
export function computeShapePathData(shape: MunicipalityShape): {
  d: string;
  viewBox: string;
} {
  const rings = getRings(shape);
  const bbox = bboxFromRings(rings);
  const { viewBox, originLng, originLat, cosLat } = computeViewBox(bbox, 0.1);
  return { d: buildPath(rings, originLng, originLat, cosLat), viewBox };
}
