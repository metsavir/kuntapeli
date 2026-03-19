import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC_DIR = join(__dirname, '..', 'src', 'data');
const COATS_DIR = join(__dirname, '..', 'public', 'coats');

const UA = 'Kuntapeli/1.0 (municipality guessing game)';

function getAppNames() {
  const src = readFileSync(join(SRC_DIR, 'municipalities.ts'), 'utf-8');
  const names = [];
  for (const match of src.matchAll(/name:\s*'([^']+)'/g)) {
    names.push(match[1]);
  }
  return names;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// Parse "Wikiprojekti:Vaakunat" — a simple table mapping municipality → SVG file.
// Each row: [[Municipality]] | [[Image:file.svg|30px]]
async function fetchVaakunaMap() {
  const url =
    'https://fi.wikipedia.org/w/api.php?action=parse&page=Wikiprojekti:Vaakunat&prop=wikitext&format=json';
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`Wikipedia API returned ${res.status}`);
  const data = await res.json();
  const text = data.parse?.wikitext?.['*'] || '';

  const mapping = new Map();

  for (const row of text.split('|-')) {
    // Find SVG filename
    const imgMatch = row.match(
      /\[\[(?:Kuva|Image|File|Tiedosto):([^\]|]+\.svg)/i,
    );
    if (!imgMatch) continue;

    // Find municipality name: first wiki link that isn't an image/file/user link
    let name = null;
    for (const m of row.matchAll(/\[\[([^\]|]+?)(?:\|([^\]]*?))?\]\]/g)) {
      const target = m[1];
      if (/^(Kuva|Image|File|Tiedosto):/i.test(target)) continue;
      if (/^Käyttäjä:/i.test(target)) continue;
      name = (m[2] || m[1])
        .replace(/ \(kunta\)$/, '')
        .replace(/ \(kaupunki\)$/, '');
      break;
    }
    if (!name) continue;
    if (name.includes('maakunta') || name.includes('Wikiprojekti')) continue;

    if (!mapping.has(name)) {
      mapping.set(name, imgMatch[1]);
    }
  }

  return mapping;
}

// Batch query Commons for thumbnail URLs (up to 50 files at once)
async function batchGetThumbUrls(filenames, width = 200) {
  const results = new Map();
  for (let i = 0; i < filenames.length; i += 50) {
    const batch = filenames.slice(i, i + 50);
    const titles = batch.map((f) => 'File:' + f).join('|');
    const url = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(titles)}&prop=imageinfo&iiprop=url&iiurlwidth=${width}&format=json`;

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch(url, { headers: { 'User-Agent': UA } });
        if (!res.ok) {
          await sleep(1000);
          continue;
        }
        const data = await res.json();
        const pages = data.query?.pages || {};
        const normalized = new Map();
        for (const n of data.query?.normalized || []) {
          normalized.set(n.to, n.from);
        }
        for (const page of Object.values(pages)) {
          if (page.missing !== undefined) continue;
          const thumbUrl = page.imageinfo?.[0]?.thumburl;
          if (thumbUrl) {
            const title = (normalized.get(page.title) || page.title).replace(
              /^File:/,
              '',
            );
            results.set(title, thumbUrl);
          }
        }
        break;
      } catch {
        await sleep(1000);
      }
    }
    if (i + 50 < filenames.length) await sleep(200);
  }
  return results;
}

async function downloadImage(url, filepath) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      if (!res.ok) {
        await sleep(500);
        continue;
      }
      const buffer = Buffer.from(await res.arrayBuffer());
      writeFileSync(filepath, buffer);
      return true;
    } catch {
      await sleep(500);
    }
  }
  return false;
}

async function main() {
  const appNames = getAppNames();
  console.log(`Found ${appNames.length} municipalities`);

  console.log('Fetching coat mapping from Wikiprojekti:Vaakunat...');
  const wikiMap = await fetchVaakunaMap();
  console.log(`Parsed ${wikiMap.size} coat mappings`);

  if (!existsSync(COATS_DIR)) mkdirSync(COATS_DIR, { recursive: true });

  // Match names to SVG filenames
  const nameToFile = new Map();
  const unmatched = [];

  for (const name of appNames) {
    if (wikiMap.has(name)) {
      nameToFile.set(name, wikiMap.get(name));
    } else {
      unmatched.push(name);
    }
  }

  console.log(
    `Matched ${nameToFile.size}/${appNames.length}, ${unmatched.length} unmatched`,
  );
  if (unmatched.length > 0) {
    console.warn('Unmatched:');
    unmatched.forEach((n) => console.warn(`  - ${n}`));
  }

  // Batch resolve thumbnail URLs from Commons
  const allFiles = [...new Set(nameToFile.values())];
  console.log(`Resolving ${allFiles.length} thumbnail URLs from Commons...`);
  const thumbUrls = await batchGetThumbUrls(allFiles);
  console.log(`Got ${thumbUrls.size} thumbnail URLs`);

  // Download
  let downloaded = 0;
  let skipped = 0;
  const missing = [];
  const forceRefresh = process.argv.includes('--force');

  for (const name of appNames) {
    const outPath = join(COATS_DIR, `${name}.png`);
    if (!forceRefresh && existsSync(outPath)) {
      skipped++;
      downloaded++;
      continue;
    }

    const file = nameToFile.get(name);
    const thumbUrl = file ? thumbUrls.get(file) : null;

    if (thumbUrl) {
      const ok = await downloadImage(thumbUrl, outPath);
      if (ok) {
        downloaded++;
        process.stdout.write(`\r  ${downloaded}/${appNames.length} (${name})`);
        await sleep(50);
        continue;
      }
    }

    missing.push(name);
  }

  console.log(
    `\n\n✓ ${downloaded}/${appNames.length} coats (${skipped} cached)`,
  );
  if (missing.length) {
    console.warn(`\n⚠ ${missing.length} missing:`);
    missing.forEach((n) => console.warn(`  - ${n}`));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
