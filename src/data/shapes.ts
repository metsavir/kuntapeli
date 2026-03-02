import type { MunicipalityShape } from './types';

const cache = new Map<string, MunicipalityShape>();

export async function getShape(name: string): Promise<MunicipalityShape | null> {
  const cached = cache.get(name);
  if (cached) return cached;

  try {
    const res = await fetch(`${import.meta.env.BASE_URL}shapes/${name}.json`);
    if (!res.ok) return null;
    const shape = (await res.json()) as MunicipalityShape;
    cache.set(name, shape);
    return shape;
  } catch {
    return null;
  }
}
