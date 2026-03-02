import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC_DIR = join(__dirname, '..', 'src', 'data');
const SHAPES_DIR = join(__dirname, '..', 'public', 'shapes');

const WFS_URL =
  'https://geo.stat.fi/geoserver/tilastointialueet/wfs?service=WFS&version=2.0.0&request=GetFeature&typeName=tilastointialueet:kunta1000k_2026&outputFormat=json&srsName=EPSG:4326';

// Extract municipality names from the source file
function getAppNames() {
  const src = readFileSync(join(SRC_DIR, 'municipalities.ts'), 'utf-8');
  const names = [];
  for (const match of src.matchAll(/name:\s*'([^']+)'/g)) {
    names.push(match[1]);
  }
  return names;
}

// Round coordinates to 3 decimal places (~110m precision, fine for overview shapes)
const PRECISION = 1000;
function roundCoords(coords) {
  if (typeof coords[0] === 'number') {
    return [Math.round(coords[0] * PRECISION) / PRECISION, Math.round(coords[1] * PRECISION) / PRECISION];
  }
  return coords.map(roundCoords);
}

// Remove consecutive duplicate points created by rounding
function dedup(ring) {
  const out = [ring[0]];
  for (let i = 1; i < ring.length; i++) {
    if (ring[i][0] !== ring[i - 1][0] || ring[i][1] !== ring[i - 1][1]) {
      out.push(ring[i]);
    }
  }
  return out;
}

function simplifyGeometry(coordinates, type) {
  if (type === 'Polygon') {
    return coordinates.map((ring) => dedup(roundCoords(ring)));
  }
  // MultiPolygon
  return coordinates.map((poly) => poly.map((ring) => dedup(roundCoords(ring))));
}

// Approximate area of a polygon ring using the shoelace formula (in degree² units)
function ringArea(ring) {
  let area = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    area += (ring[j][0] + ring[i][0]) * (ring[j][1] - ring[i][1]);
  }
  return Math.abs(area / 2);
}

// Filter out tiny polygons from a MultiPolygon. Keep polygons whose area is
// at least `minFraction` of the largest polygon's area.
const MIN_AREA_FRACTION = 0.005;

function filterSmallPolygons(coordinates) {
  const areas = coordinates.map((poly) => ringArea(poly[0]));
  const maxArea = Math.max(...areas);
  const threshold = maxArea * MIN_AREA_FRACTION;
  return coordinates.filter((_, i) => areas[i] >= threshold);
}

async function main() {
  console.log('Fetching municipality shapes from Statistics Finland...');
  const res = await fetch(WFS_URL);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);

  const geojson = await res.json();
  console.log(`Received ${geojson.features.length} features`);

  // Name mappings: GeoJSON nimi → app name
  const nameMap = {
    'Maarianhamina - Mariehamn': 'Maarianhamina',
  };

  // Build shape map keyed by Finnish name (matching app data)
  const shapes = {};
  for (const feature of geojson.features) {
    const rawName = feature.properties.nimi;
    const name = nameMap[rawName] ?? rawName;
    let { type, coordinates } = feature.geometry;
    if (type === 'MultiPolygon') {
      coordinates = filterSmallPolygons(coordinates);
      if (coordinates.length === 1) {
        type = 'Polygon';
        coordinates = coordinates[0];
      }
    }
    shapes[name] = { type, coordinates: simplifyGeometry(coordinates, type) };
  }

  // Validate against app municipality names
  const appNames = getAppNames();
  const shapeNames = new Set(Object.keys(shapes));

  const missing = appNames.filter((n) => !shapeNames.has(n));
  const extra = [...shapeNames].filter((n) => !appNames.includes(n));

  if (missing.length) {
    console.warn(`\n⚠ ${missing.length} app municipalities NOT found in GeoJSON:`);
    missing.forEach((n) => console.warn(`  - ${n}`));
  }
  if (extra.length) {
    console.log(`\nℹ ${extra.length} GeoJSON names not in app data:`);
    extra.forEach((n) => console.log(`  - ${n}`));
  }
  if (!missing.length) {
    console.log('\n✓ All app municipality names matched!');
  }

  // Write individual JSON files to public/shapes/
  if (existsSync(SHAPES_DIR)) rmSync(SHAPES_DIR, { recursive: true });
  mkdirSync(SHAPES_DIR, { recursive: true });

  let totalBytes = 0;
  for (const [name, shape] of Object.entries(shapes)) {
    const json = JSON.stringify(shape);
    totalBytes += Buffer.byteLength(json);
    writeFileSync(join(SHAPES_DIR, `${name}.json`), json);
  }

  const totalKB = (totalBytes / 1024).toFixed(0);
  console.log(`\nWrote ${Object.keys(shapes).length} shape files to ${SHAPES_DIR} (${totalKB} KB total)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
