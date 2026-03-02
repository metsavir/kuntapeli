const EARTH_RADIUS_KM = 6371;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_KM * c);
}

export function bearing(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLng = toRad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);
  const brng = toDeg(Math.atan2(y, x));
  return (brng + 360) % 360;
}

const DIRECTION_ARROWS: [number, string][] = [
  [22.5, '⬆️'],
  [67.5, '↗️'],
  [112.5, '➡️'],
  [157.5, '↘️'],
  [202.5, '⬇️'],
  [247.5, '↙️'],
  [292.5, '⬅️'],
  [337.5, '↖️'],
  [360, '⬆️'],
];

export function bearingToDirection(deg: number): string {
  for (const [threshold, arrow] of DIRECTION_ARROWS) {
    if (deg < threshold) return arrow;
  }
  return '⬆️';
}

// Max distance in Finland is roughly 1100km (Hanko to Utsjoki)
const MAX_DISTANCE_KM = 1100;

export function proximity(distanceKm: number): number {
  if (distanceKm === 0) return 100;
  // Exponential decay: closer distances get disproportionately higher scores
  const ratio = distanceKm / MAX_DISTANCE_KM;
  const score = Math.max(0, Math.round((1 - ratio ** 0.5) * 100));
  return Math.min(100, score);
}
