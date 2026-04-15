import type { CartonInstance, Pallet, CartonPreset } from './types';

const GAP = 2; // cm gap between cartons on pallet

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
    const [cw, _ch, cd] = getCartonDimensions(carton, presets);

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

  return x + w <= pw && z + d <= pd;
}
