import { get, set, keys, entries } from 'idb-keyval';

/**
 * Async storage layer: IndexedDB primary, localStorage write-through fallback.
 * On read, migrates from localStorage to IndexedDB if IndexedDB is empty.
 */

export async function getItem(key: string): Promise<string | null> {
  try {
    const val = await get<string>(key);
    if (val !== undefined) return val;
  } catch {
    // IndexedDB unavailable — fall through to localStorage
  }

  // Migration path: try localStorage, write to IndexedDB if found
  try {
    const local = localStorage.getItem(key);
    if (local !== null) {
      try {
        await set(key, local);
      } catch {
        // write-through failed, that's ok
      }
    }
    return local;
  } catch {
    return null;
  }
}

export async function setItem(key: string, value: string): Promise<void> {
  // Write to both stores
  try {
    await set(key, value);
  } catch {
    // IndexedDB unavailable
  }
  try {
    localStorage.setItem(key, value);
  } catch {
    // localStorage full or unavailable
  }
}

export async function getAllKeys(): Promise<string[]> {
  try {
    return (await keys()).map(String);
  } catch {
    // Fallback: scan localStorage
    const result: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k) result.push(k);
    }
    return result;
  }
}

export async function getAllEntries(): Promise<[string, string][]> {
  try {
    const all = await entries<string, string>();
    if (all.length > 0) return all.map(([k, v]) => [String(k), v]);
  } catch {
    // fall through
  }
  // Fallback: scan localStorage
  const result: [string, string][] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k) {
      const v = localStorage.getItem(k);
      if (v !== null) result.push([k, v]);
    }
  }
  return result;
}
