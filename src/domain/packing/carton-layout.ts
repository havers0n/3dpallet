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

  if (!cartonFitsOnPallet(position, dimensions, pallet)) {
    return 'Cannot place carton: outside pallet bounds.';
  }

  for (const otherCarton of pallet.cartons) {
    if (otherCarton.id === carton.id) continue;

    const [cx, _cy, cz] = otherCarton.palletPosition;
    const [cw, _ch, cd] = getCartonFootprint(otherCarton, presets);
    const [x, _y, z] = position;

    const overlapX = x < cx + cw + GAP && x + dimensions[0] + GAP > cx;
    const overlapZ = z < cz + cd + GAP && z + dimensions[2] + GAP > cz;
    if (overlapX && overlapZ) {
      return `Cannot place carton: overlaps with "${otherCarton.label}".`;
    }
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

  if (pallet.cartons.length === 0) {
    return [0, 0, 0];
  }

  // Scan row by row (z), then column by column (x)
  // Use the carton's own footprint for grid pitch
  const rowPitch = cd + GAP;
  const colPitch = cw + GAP;

  for (let z = 0; z <= pd - cd; z += rowPitch) {
    for (let x = 0; x <= pw - cw; x += colPitch) {
      const candidate: [number, number, number] = [x, 0, z];
      if (slotIsFree(candidate, cartonDimensions, pallet, presets)) {
        return candidate;
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
    return 'Cannot create carton: preset footprint is larger than pallet footprint.';
  }

  const slot = nextCartonSlotOnPallet(pallet, cartonDimensions, presets);
  if (slot[0] >= 0) {
    return null;
  }

  if (GAP > 0) {
    return `Cannot create carton: no free slot on pallet with ${GAP} cm spacing rule.`;
  }
  return 'Cannot create carton: no free slot on pallet.';
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
  const [px, _py, pz] = position;
  const [pw, _ph, pd] = dimensions;

  for (const carton of pallet.cartons) {
    const [cx, _cy, cz] = carton.palletPosition;
    const [cw, _ch, cd] = getCartonFootprint(carton, presets);

    // Overlap check (2D projection on pallet surface)
    const overlapX = px < cx + cw + GAP && px + pw + GAP > cx;
    const overlapZ = pz < cz + cd + GAP && pz + pd + GAP > cz;
    if (overlapX && overlapZ) {
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
  const [x, _y, z] = position;
  const [w, _h, d] = dimensions;
  const [pw, _ph, pd] = pallet.dimensions;

  return x >= 0 && z >= 0 && x + w <= pw && z + d <= pd;
}
