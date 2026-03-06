import { getAllEntries, setItem } from './storage';

const KEY_PREFIXES = [
  'kuntapeli-career-',
  'kuntapeli-stats',
  'kuntapeli-badges-',
  'kuntapeli-state-',
];

function isGameKey(key: string): boolean {
  return KEY_PREFIXES.some((p) => key.startsWith(p));
}

export async function exportAllData(): Promise<void> {
  const all = await getAllEntries();
  const data: Record<string, string> = {};
  for (const [key, value] of all) {
    if (isGameKey(key)) {
      data[key] = value;
    }
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `kuntapeli-backup-${dateStr}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importData(file: File): Promise<void> {
  const text = await file.text();
  const data = JSON.parse(text) as Record<string, string>;

  // Validate: all keys must be game keys
  const keys = Object.keys(data);
  if (keys.length === 0) throw new Error('Tiedosto on tyhjä');
  if (!keys.every(isGameKey))
    throw new Error('Tiedosto sisältää virheellisiä avaimia');

  for (const [key, value] of Object.entries(data)) {
    await setItem(key, value);
  }

  window.location.reload();
}
