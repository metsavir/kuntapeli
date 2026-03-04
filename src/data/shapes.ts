import type { MunicipalityShape } from './types';

const cache = new Map<string, MunicipalityShape>();

export async function getShape(
  name: string,
): Promise<MunicipalityShape | null> {
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

let allShapesCache: Record<string, MunicipalityShape> | null = null;

export async function getAllShapes(): Promise<
  Record<string, MunicipalityShape>
> {
  if (allShapesCache) return allShapesCache;
  const res = await fetch(`${import.meta.env.BASE_URL}shapes/all.json`);
  allShapesCache = (await res.json()) as Record<string, MunicipalityShape>;
  return allShapesCache;
}
