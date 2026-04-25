import type { CartonInstance, Pallet, CartonPreset } from './types';

const GAP = 0; // cm gap between cartons on pallet
export const GRID_STEP = 2; // cm grid step for move-mode snapping

/**
 * Resolve the CartonPreset for a carton instance.
 * Returns undefined if no matching preset exists.
 */
export function resolveCartonPreset(
  carton: CartonInstance,
  presets: CartonPreset[],
): CartonPreset | undefined {
  return presets.find((p) => p.id === carton.presetId);
}

/**
 * Get carton dimensions [w, h, d] by resolving the preset.
 * Throws if the preset is not found — dimensions must come from preset data.
 */
export function getCartonDimensions(
  carton: CartonInstance,
  presets: CartonPreset[],
): [number, number, number] {
  const preset = resolveCartonPreset(carton, presets);
  if (!preset) {
    throw new Error(
      `Cannot resolve dimensions for carton "${carton.id}": preset "${carton.presetId}" not found`,
    );
  }
  return preset.dimensions;
}

export function getCartonFootprint(
  carton: CartonInstance,
  presets: CartonPreset[],
): [number, number, number] {
  const [w, h, d] = getCartonDimensions(carton, presets);
  const rotation = carton.rotationDeg ?? 0;
  if (rotation === 90) {
    return [d, h, w];
  }
  return [w, h, d];
}

export function snapPositionToGrid(
  position: [number, number, number],
): [number, number, number] {
  const [x, _y, z] = position;
  const snappedX = Math.round(x / GRID_STEP) * GRID_STEP;
  const snappedZ = Math.round(z / GRID_STEP) * GRID_STEP;
  return [snappedX, 0, snappedZ];
}

export function clampPositionToPalletXZ(
  position: [number, number, number],
  dimensions: [number, number, number],
  pallet: Pallet,
): [number, number, number] {
  const [x, y, z] = position;
  const [w, _h, d] = dimensions;
  const [pw, _ph, pd] = pallet.dimensions;

  const maxX = Math.max(0, pw - w);
  const maxZ = Math.max(0, pd - d);

  const clampedX = Math.min(Math.max(x, 0), maxX);
  const clampedZ = Math.min(Math.max(z, 0), maxZ);
  return [clampedX, y, clampedZ];
}

export function isValidCartonPosition(
  carton: CartonInstance,
  position: [number, number, number],
  pallet: Pallet,
  presets: CartonPreset[],
): boolean {
  return getInvalidCartonPositionReason(carton, position, pallet, presets) === null;
}

export function getInvalidCartonPositionReason(
  carton: CartonInstance,
  position: [number, number, number],
  pallet: Pallet,
  presets: CartonPreset[],
): string | null {
  const dimensions = getCartonFootprint(carton, presets);
  const [x, y, z] = position;
  const [, h] = dimensions;

  if (!cartonFitsOnPallet(position, dimensions, pallet)) {
    return 'Нельзя поставить коробку: за пределами паллеты.';
  }

  for (const otherCarton of pallet.cartons) {
    if (otherCarton.id === carton.id) continue;

    const [cx, cy, cz] = otherCarton.palletPosition;
    const [cw, ch, cd] = getCartonFootprint(otherCarton, presets);

    const overlapX = x < cx + cw + GAP && x + dimensions[0] + GAP > cx;
    const overlapY = y < cy + ch && y + h > cy;
    const overlapZ = z < cz + cd + GAP && z + dimensions[2] + GAP > cz;
    if (overlapX && overlapY && overlapZ) {
      return `Нельзя поставить коробку: пересекается с "${otherCarton.label}".`;
    }
  }

  if (!hasSupportAtHeight(carton, position, pallet, presets)) {
    return 'Нельзя поставить коробку: нет опоры под основанием.';
  }

  return null;
}

/**
 * Determine the next deterministic slot position on the pallet.
 * Uses a simple row-major grid scan: for each slot (col, row),
 * checks if the carton footprint fits without overlapping existing cartons.
 * Returns the first available slot origin [x, 0, z].
 */
export function nextCartonSlotOnPallet(
  pallet: Pallet,
  cartonDimensions: [number, number, number],
  presets: CartonPreset[],
): [number, number, number] {
  const [pw, _ph, pd] = pallet.dimensions;
  const [cw, _ch, cd] = cartonDimensions;

  if (cw > pw || cd > pd) {
    return [-1, 0, -1];
  }

  if (pallet.cartons.length === 0) {
    return [0, 0, 0];
  }

  const levels = collectBaseHeightsFromStack(pallet, presets);

  for (const y of levels) {
    for (const [x, z] of collectPalletSlotOrigins(pallet, presets, y, [pw, pd])) {
      const candidate: [number, number, number] = [x, y, z];
      if (slotIsFree(candidate, cartonDimensions, pallet, presets)) {
        if (hasSupportForDimensions(candidate, cartonDimensions, pallet, presets)) {
          return candidate;
        }
      }
    }
  }

  // No slot found — pallet is full for this carton size
  return [-1, 0, -1];
}

export function getNoSlotReasonForCartonDimensions(
  pallet: Pallet,
  cartonDimensions: [number, number, number],
  presets: CartonPreset[],
): string | null {
  const [pw, _ph, pd] = pallet.dimensions;
  const [cw, _ch, cd] = cartonDimensions;

  if (cw > pw || cd > pd) {
    return 'Нельзя создать коробку: пресет больше основания паллеты.';
  }

  const slot = nextCartonSlotOnPallet(pallet, cartonDimensions, presets);
  if (slot[0] >= 0) {
    return null;
  }

  if (GAP > 0) {
    return `Нельзя создать коробку: нет свободного места с зазором ${GAP} см.`;
  }
  return 'Нельзя создать коробку: на паллете нет свободного места.';
}

/**
 * Check whether a slot at the given position overlaps with any existing carton.
 */
function slotIsFree(
  position: [number, number, number],
  dimensions: [number, number, number],
  pallet: Pallet,
  presets: CartonPreset[],
): boolean {
  const [px, py, pz] = position;
  const [pw, ph, pd] = dimensions;

  for (const carton of pallet.cartons) {
    const [cx, _cy, cz] = carton.palletPosition;
    const [cw, ch, cd] = getCartonFootprint(carton, presets);
    const cy = carton.palletPosition[1];

    // Overlap check (2D projection on pallet surface)
    const overlapX = px < cx + cw + GAP && px + pw + GAP > cx;
    const overlapY = py < cy + ch && py + ph > cy;
    const overlapZ = pz < cz + cd + GAP && pz + pd + GAP > cz;
    if (overlapX && overlapY && overlapZ) {
      return false;
    }
  }

  return true;
}

function collectBaseHeightsFromStack(
  pallet: Pallet,
  presets: CartonPreset[],
): number[] {
  const levels = new Set<number>([0]);
  for (const carton of pallet.cartons) {
    const [, h] = getCartonFootprint(carton, presets);
    levels.add(carton.palletPosition[1] + h);
  }
  return Array.from(levels).sort((a, b) => a - b);
}

function collectPalletSlotOrigins(
  pallet: Pallet,
  presets: CartonPreset[],
  y: number,
  palletFootprint: [number, number],
): [number, number][] {
  const [pw, pd] = palletFootprint;
  const xs = new Set<number>([0]);
  const zs = new Set<number>([0]);

  for (const carton of pallet.cartons) {
    const [cx, cy, cz] = carton.palletPosition;
    const [cw, ch, cd] = getCartonFootprint(carton, presets);
    if (cy !== y && cy + ch !== y) continue;
    xs.add(cx + cw + GAP);
    zs.add(cz + cd + GAP);
  }

  const origins: [number, number][] = [];
  const sortedZ = Array.from(zs)
    .filter((z) => z >= 0 && z < pd)
    .sort((a, b) => a - b);
  const sortedX = Array.from(xs)
    .filter((x) => x >= 0 && x < pw)
    .sort((a, b) => a - b);

  for (const z of sortedZ) {
    for (const x of sortedX) {
      origins.push([x, z]);
    }
  }

  return origins;
}

export function resolveCartonPreviewPosition(
  carton: CartonInstance,
  position: [number, number, number],
  pallet: Pallet,
  presets: CartonPreset[],
  preferredY: number,
): [number, number, number] {
  const [x, _y, z] = position;
  const levels = getSupportedBaseHeightsAtXZ(carton, [x, z], pallet, presets);
  const uniqueLevels = Array.from(new Set(levels)).sort((a, b) => a - b);

  const levelsByProximity = uniqueLevels.sort(
    (a, b) => Math.abs(a - preferredY) - Math.abs(b - preferredY),
  );

  for (const level of levelsByProximity) {
    const candidate: [number, number, number] = [x, level, z];
    if (isValidCartonPosition(carton, candidate, pallet, presets)) {
      return candidate;
    }
  }

  // Keep deterministic fallback even if invalid; UI will show reason.
  const fallbackLevel = levelsByProximity[0] ?? 0;
  return [x, fallbackLevel, z];
}

function getSupportedBaseHeightsAtXZ(
  carton: CartonInstance,
  positionXZ: [number, number],
  pallet: Pallet,
  presets: CartonPreset[],
): number[] {
  const [x, z] = positionXZ;
  const dimensions = getCartonFootprint(carton, presets);
  const heights = collectBaseHeightsFromStack(pallet, presets);
  const supported: number[] = [];

  for (const y of heights) {
    if (hasSupportForDimensions([x, y, z], dimensions, pallet, presets, carton.id)) {
      supported.push(y);
    }
  }

  return supported;
}

function hasSupportAtHeight(
  carton: CartonInstance,
  position: [number, number, number],
  pallet: Pallet,
  presets: CartonPreset[],
): boolean {
  return hasSupportForDimensions(
    position,
    getCartonFootprint(carton, presets),
    pallet,
    presets,
    carton.id,
  );
}

type Rect2D = {
  x0: number;
  x1: number;
  z0: number;
  z1: number;
};

function hasSupportForDimensions(
  position: [number, number, number],
  dimensions: [number, number, number],
  pallet: Pallet,
  presets: CartonPreset[],
  ignoreCartonId?: string,
): boolean {
  const [x, y, z] = position;
  const [w, _h, d] = dimensions;
  if (y === 0) return true;

  const base: Rect2D = { x0: x, x1: x + w, z0: z, z1: z + d };
  const supports: Rect2D[] = [];

  for (const otherCarton of pallet.cartons) {
    if (ignoreCartonId && otherCarton.id === ignoreCartonId) continue;
    const [ox, oy, oz] = otherCarton.palletPosition;
    const [ow, oh, od] = getCartonFootprint(otherCarton, presets);
    const topY = oy + oh;
    if (topY !== y) continue;

    supports.push({
      x0: ox,
      x1: ox + ow,
      z0: oz,
      z1: oz + od,
    });
  }

  return rectCoveredBySupports(base, supports);
}

function rectCoveredBySupports(base: Rect2D, supports: Rect2D[]): boolean {
  const clipped = supports
    .map((r) => ({
      x0: Math.max(base.x0, r.x0),
      x1: Math.min(base.x1, r.x1),
      z0: Math.max(base.z0, r.z0),
      z1: Math.min(base.z1, r.z1),
    }))
    .filter((r) => r.x1 > r.x0 && r.z1 > r.z0);

  if (clipped.length === 0) return false;

  const xs = Array.from(new Set([base.x0, base.x1, ...clipped.flatMap((r) => [r.x0, r.x1])])).sort(
    (a, b) => a - b,
  );

  for (let i = 0; i < xs.length - 1; i += 1) {
    const xStart = xs[i];
    const xEnd = xs[i + 1];
    if (xEnd <= xStart) continue;
    const xMid = (xStart + xEnd) / 2;

    const zIntervals = clipped
      .filter((r) => r.x0 <= xMid && xMid < r.x1)
      .map((r) => [r.z0, r.z1] as [number, number])
      .sort((a, b) => a[0] - b[0]);

    if (zIntervals.length === 0) return false;

    let coveredUntil = base.z0;
    for (const [z0, z1] of zIntervals) {
      if (z0 > coveredUntil) {
        return false;
      }
      coveredUntil = Math.max(coveredUntil, z1);
      if (coveredUntil >= base.z1) {
        break;
      }
    }
    if (coveredUntil < base.z1) {
      return false;
    }
  }

  return true;
}

/**
 * Check if a carton can fit at a given position on the pallet.
 */
export function cartonFitsOnPallet(
  position: [number, number, number],
  dimensions: [number, number, number],
  pallet: Pallet,
): boolean {
  const [x, y, z] = position;
  const [w, _h, d] = dimensions;
  const [pw, _ph, pd] = pallet.dimensions;

  return y >= 0 && x >= 0 && z >= 0 && x + w <= pw && z + d <= pd;
}
