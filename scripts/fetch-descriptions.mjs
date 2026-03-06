import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC_DIR = join(__dirname, '..', 'src', 'data');

const UA = 'Kuntapeli/1.0 (municipality guessing game)';
const API_URL =
  'https://fi.wikipedia.org/w/api.php?action=parse&page=Suomen_kunnanvaakunat&prop=wikitext&format=json';

function getAppNames() {
  const src = readFileSync(join(SRC_DIR, 'municipalities.ts'), 'utf-8');
  const names = [];
  for (const match of src.matchAll(/name:\s*'([^']+)'/g)) {
    names.push(match[1]);
  }
  return names;
}

async function main() {
  console.log('Fetching coat of arms descriptions from Wikipedia...');

  const res = await fetch(API_URL, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  const data = await res.json();
  const text = data.parse?.wikitext?.['*'] || '';

  // Extract name → description pairs from the wiki table
  // Handles both [[Name]] and [[Name (qualifier)|DisplayName]] formats
  const nameToDesc = {};

  // Pattern for piped links: [[Target|DisplayName]]
  for (const m of text.matchAll(
    /\|\s*'''\[\[[^\]|]+\|([^\]]+)\]\]'''[^\n]*\n''([^']+)''/g,
  )) {
    nameToDesc[m[1].trim()] = m[2].trim();
  }

  // Pattern for simple links: [[Name]]
  for (const m of text.matchAll(
    /\|\s*'''\[\[([^\]|]+)\]\]'''[^\n]*\n''([^']+)''/g,
  )) {
    const name = m[1].trim();
    if (!nameToDesc[name]) {
      nameToDesc[name] = m[2].trim();
    }
  }

  // Validate against app municipalities
  const appNames = getAppNames();
  const matched = appNames.filter((n) => nameToDesc[n]);
  const missing = appNames.filter((n) => !nameToDesc[n]);

  console.log(`Matched ${matched.length} of ${appNames.length} municipalities`);
  if (missing.length) {
    console.warn(`⚠ Missing: ${missing.join(', ')}`);
  }

  // Update municipalities.ts — add description field
  let src = readFileSync(join(SRC_DIR, 'municipalities.ts'), 'utf-8');
  let updated = 0;

  for (const name of appNames) {
    const desc = nameToDesc[name];
    if (!desc) continue;

    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(
      `(name:\\s*'${escaped}'[^}]*?population:\\s*\\d+)(,?\\s*})`,
      's',
    );
    const match = src.match(pattern);
    if (!match) continue;
    if (match[0].includes('description:')) continue;

    // Escape single quotes in description
    const safeDesc = desc.replace(/'/g, "\\'");
    const newEntry = `${match[1]},\n    description: '${safeDesc}',\n  }`;
    src = src.replace(match[0], newEntry);
    updated++;
  }

  writeFileSync(join(SRC_DIR, 'municipalities.ts'), src);
  console.log(`Updated ${updated} municipalities with descriptions`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
