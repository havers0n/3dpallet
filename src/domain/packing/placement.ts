import type { PlacedItem, Item, CartonInstance, CartonPreset } from './types';
import { resolveCartonPreset } from './carton-layout';

/**
 * Calculate the position for a new item inside a carton.
 * Deterministic slot scanning: X first, then Z, then Y.
 * First free valid slot wins.
 *
 * Pallet/pack height semantics:
 *   Pallet height is pallet thickness only. Placement validation on the pallet
 *   is X/Z (footprint) only. Carton height is independent.
 *
 * Item placement inside a carton scans occupied positions and places the next
 * item at the first slot where the item fits without colliding with existing items.
 * Returns [-1, -1, -1] if no valid slot exists.
 */
export function calculateItemPositionInCarton(
  item: Item,
  carton: CartonInstance,
  presets: CartonPreset[],
  existingItems: PlacedItem[],
): [number, number, number] {
  const preset = resolveCartonPreset(carton, presets);
  if (!preset) {
    return [-1, -1, -1];
  }

  const [cw, ch, cd] = preset.dimensions;
  const [iw, ih, id] = item.dimensions;

  // Item larger than carton in any dimension — cannot fit at all
  if (iw > cw || ih > ch || id > cd) {
    return [-1, -1, -1];
  }

  // Deterministic slot scanning: X first, then Z, then Y.
  // Step size equals the item's own footprint.
  for (let y = 0; y <= ch - ih; y += ih) {
    for (let z = 0; z <= cd - id; z += id) {
      for (let x = 0; x <= cw - iw; x += iw) {
        const candidate: [number, number, number] = [x, y, z];
        if (!collidesWithAny(candidate, item.dimensions, existingItems)) {
          return candidate;
        }
      }
    }
  }

  // No free slot found
  return [-1, -1, -1];
}

/**
 * Check whether the candidate position collides with any existing placed item.
 * Uses strict AABB overlap on all three axes.
 */
function collidesWithAny(
  position: [number, number, number],
  dimensions: [number, number, number],
  existingItems: PlacedItem[],
): boolean {
  const [px, py, pz] = position;
  const [pw, ph, pd] = dimensions;

  for (const placed of existingItems) {
    const [ox, oy, oz] = placed.position;
    const [ow, oh, od] = placed.item.dimensions;

    const overlapX = px < ox + ow && px + pw > ox;
    const overlapY = py < oy + oh && py + ph > oy;
    const overlapZ = pz < oz + od && pz + pd > oz;

    if (overlapX && overlapY && overlapZ) {
      return true;
    }
  }

  return false;
}

/**
 * Check if an item fits within the carton dimensions.
 */
export function itemFitsInCarton(
  item: Item,
  cartonWidth: number,
  cartonHeight: number,
  cartonDepth: number,
): boolean {
  const [iw, ih, id] = item.dimensions;
  return iw <= cartonWidth && ih <= cartonHeight && id <= cartonDepth;
}

/**
 * Check if adding an item would exceed the carton's weight limit.
 */
export function itemFitsWeightLimit(
  currentWeight: number,
  itemWeight: number,
  maxWeight: number,
): boolean {
  return currentWeight + itemWeight <= maxWeight;
}
