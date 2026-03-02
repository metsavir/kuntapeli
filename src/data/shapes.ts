import shapeData from './municipality-shapes.json';
import type { MunicipalityShape } from './types';

const shapes = shapeData as Record<string, MunicipalityShape>;

export function getShape(name: string): MunicipalityShape | undefined {
  return shapes[name];
}
