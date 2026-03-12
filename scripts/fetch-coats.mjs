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

function toAscii(name) {
  return name
    .replace(/[äÄ]/g, (c) => (c === 'ä' ? 'a' : 'A'))
    .replace(/[öÖ]/g, (c) => (c === 'ö' ? 'o' : 'O'))
    .replace(/[åÅ]/g, (c) => (c === 'å' ? 'a' : 'A'));
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// Fetch SVG filenames from "Suomen kunnanvaakunat" Wikipedia article
async function fetchVaakunaList() {
  const url = 'https://fi.wikipedia.org/w/api.php?action=parse&page=Suomen_kunnanvaakunat&prop=wikitext&format=json';
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) return new Set();
  const data = await res.json();
  const text = data.parse?.wikitext?.['*'] || '';
  const files = new Set();
  for (const m of text.matchAll(/\[\[(?:Kuva|Image|File|Tiedosto):([^\]|]+\.svg)/gi)) {
    files.add(m[1]);
  }
  return files;
}

// Match municipality name to a filename from the list
function findFilename(name, svgFiles) {
  const nameLower = name.toLowerCase();
  // Exact patterns
  for (const pattern of [
    `${name}.vaakuna.svg`,
    `${name} vaakuna.svg`,
    `${name}n vaakuna.svg`,
    `${name.replace(' ', '.')}.vaakuna.svg`,
  ]) {
    for (const f of svgFiles) {
      if (f.toLowerCase() === pattern.toLowerCase()) return f;
    }
  }
  // startsWith
  for (const f of svgFiles) {
    if (f.toLowerCase().startsWith(nameLower) && /vaakuna/i.test(f)) return f;
  }
  return null;
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
        if (!res.ok) { await sleep(1000); continue; }
        const data = await res.json();
        const pages = data.query?.pages || {};
        // Build normalized title map to match back
        const normalized = new Map();
        for (const n of data.query?.normalized || []) {
          normalized.set(n.to, n.from);
        }
        for (const page of Object.values(pages)) {
          if (page.missing !== undefined) continue;
          const thumbUrl = page.imageinfo?.[0]?.thumburl;
          if (thumbUrl) {
            // Strip "File:" prefix from title
            const title = (normalized.get(page.title) || page.title).replace(/^File:/, '');
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
      if (!res.ok) { await sleep(500); continue; }
      const buffer = Buffer.from(await res.arrayBuffer());
      writeFileSync(filepath, buffer);
      return true;
    } catch {
      await sleep(500);
    }
  }
  return false;
}

// Manual overrides for municipalities with non-standard filenames
const MANUAL_FILENAMES = {
  'Järvenpää': 'Jarvenpaa.vaakuna.svg',
  'Nurmijärvi': 'Nurmijarvi.vaakuna.svg',
  'Kemiönsaari': 'Dragsfjärd.vaakuna.svg',
  'Koski Tl': 'Koski.Tl.vaakuna.svg',
  'Mänttä-Vilppula': 'Vilppula.vaakuna.svg',
  'Miehikkälä': 'Miehikkala.vaakuna.svg',
  'Evijärvi': 'Evijärvi.svg',
  'Pedersören kunta': 'Pedersöre.vaakuna.svg',
  'Merijärvi': 'Merijarvi.vaakuna.svg',
  'Pudasjärvi': 'Pudasjarvi.vaakuna.svg',
  'Ristijärvi': 'Ristijarvi.vaakuna.svg',
  'Sodankylä': 'Sodankyla.vaakuna.svg',
  'Tuusula': 'Tuusula.vaakuna.svg',
  'Huittinen': 'Huittisten.vaakuna.svg',
  'Sastamala': 'Karkku.vaakuna.svg',
  'Suonenjoki': 'Suonenjoki coat of arms.svg',
  'Kinnula': 'Kinnula_coat_of_arms.svg',
  'Jomala': 'Jomala.vapen.svg',
};

async function main() {
  const appNames = getAppNames();
  console.log(`Found ${appNames.length} municipalities`);

  console.log('Fetching vaakuna list from fi.wikipedia.org/wiki/Suomen_kunnanvaakunat...');
  const svgFiles = await fetchVaakunaList();
  console.log(`Found ${svgFiles.size} SVG files on page`);

  if (!existsSync(COATS_DIR)) mkdirSync(COATS_DIR, { recursive: true });

  // Phase 1: Match names to filenames
  const nameToFile = new Map();
  const unmatched = [];

  for (const name of appNames) {
    if (existsSync(join(COATS_DIR, `${name}.png`))) continue;
    // Check manual overrides first
    if (MANUAL_FILENAMES[name]) {
      nameToFile.set(name, MANUAL_FILENAMES[name]);
      continue;
    }
    const file = findFilename(name, svgFiles);
    if (file) {
      nameToFile.set(name, file);
    } else {
      unmatched.push(name);
    }
  }

  console.log(`Matched ${nameToFile.size} from page, ${unmatched.length} need fallback`);

  // Phase 2: Batch resolve thumbnail URLs from Commons
  const allFiles = [...nameToFile.values()];
  console.log('Resolving thumbnail URLs from Commons (batch)...');
  const thumbUrls = await batchGetThumbUrls(allFiles);
  console.log(`Got ${thumbUrls.size} thumbnail URLs`);

  // Phase 3: Download matched files
  let downloaded = 0;
  let skipped = 0;
  const missing = [];

  for (const name of appNames) {
    const outPath = join(COATS_DIR, `${name}.png`);
    if (existsSync(outPath)) { skipped++; downloaded++; continue; }

    const file = nameToFile.get(name);
    if (file) {
      const thumbUrl = thumbUrls.get(file);
      if (thumbUrl) {
        const ok = await downloadImage(thumbUrl, outPath);
        if (ok) {
          downloaded++;
          process.stdout.write(`\r  ${downloaded}/${appNames.length} (${name})`);
          await sleep(50);
          continue;
        }
      }
    }

    // Not matched or thumb not found — try fallback patterns on Commons
    const ascii = toAscii(name);
    const variants = [name];
    if (ascii !== name) variants.push(ascii);
    const patterns = variants.flatMap((v) => [
      `${v}.vaakuna.svg`,
      `${v} vaakuna.svg`,
      `${v}n vaakuna.svg`,
    ]);

    // Batch check these patterns
    const fallbackUrls = await batchGetThumbUrls(patterns);
    let found = false;
    for (const [, thumbUrl] of fallbackUrls) {
      const ok = await downloadImage(thumbUrl, outPath);
      if (ok) {
        downloaded++;
        found = true;
        process.stdout.write(`\r  ${downloaded}/${appNames.length} (${name} via fallback)`);
        await sleep(50);
        break;
      }
    }

    if (!found) missing.push(name);
  }

  console.log(`\n\n✓ Downloaded ${downloaded}/${appNames.length} coat of arms (${skipped} cached)`);
  if (missing.length) {
    console.warn(`\n⚠ ${missing.length} missing:`);
    missing.forEach((n) => console.warn(`  - ${n}`));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
