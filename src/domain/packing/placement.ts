import type { PlacedItem, Item, CartonInstance, CartonPreset } from './types';
import { resolveCartonPreset } from './carton-layout';

export type ItemPlacement = {
  position: [number, number, number];
  dimensions: [number, number, number];
};

/**
 * Calculate the position for a new item inside a carton.
 * Kept for callers that only need coordinates.
 */
export function calculateItemPositionInCarton(
  item: Item,
  carton: CartonInstance,
  presets: CartonPreset[],
  existingItems: PlacedItem[],
): [number, number, number] {
  return (
    calculateItemPlacementInCarton(item, carton, presets, existingItems)?.position ?? [-1, -1, -1]
  );
}

/**
 * Calculate a deterministic item placement inside a carton.
 * The scanner tries all unique item orientations and uses candidate origins
 * from the boundaries of already placed items, which fills fragmented space
 * better than stepping by the new item's own dimensions.
 */
export function calculateItemPlacementInCarton(
  item: Item,
  carton: CartonInstance,
  presets: CartonPreset[],
  existingItems: PlacedItem[],
): ItemPlacement | null {
  const preset = resolveCartonPreset(carton, presets);
  if (!preset) {
    return null;
  }

  const orientations = getItemOrientations(item);

  if (!orientations.some((dimensions) => fitsWithinCarton([0, 0, 0], dimensions, preset.dimensions))) {
    return null;
  }

  const candidates = getFreeSlotOrigins(existingItems, preset.dimensions);
  for (const position of candidates) {
    for (const dimensions of orientations) {
      if (!fitsWithinCarton(position, dimensions, preset.dimensions)) continue;
      if (!collidesWithAny(position, dimensions, existingItems)) {
        return { position, dimensions };
      }
    }
  }

  return null;
}

export function getPlacedItemDimensions(placedItem: PlacedItem): [number, number, number] {
  return placedItem.dimensions ?? placedItem.item.dimensions;
}

export function getItemOrientations(item: Item): [number, number, number][] {
  const [w, h, d] = item.dimensions;
  const orientations: [number, number, number][] = [
    [w, h, d],
    [w, d, h],
    [h, w, d],
    [h, d, w],
    [d, w, h],
    [d, h, w],
  ];
  const seen = new Set<string>();
  return orientations.filter((dimensions) => {
    const key = dimensions.join('x');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getFreeSlotOrigins(
  existingItems: PlacedItem[],
  cartonDimensions: [number, number, number],
): [number, number, number][] {
  const [cw, ch, cd] = cartonDimensions;
  const xs = new Set<number>([0]);
  const ys = new Set<number>([0]);
  const zs = new Set<number>([0]);

  for (const placed of existingItems) {
    const [x, y, z] = placed.position;
    const [w, h, d] = getPlacedItemDimensions(placed);
    xs.add(x + w);
    ys.add(y + h);
    zs.add(z + d);
  }

  const positions: [number, number, number][] = [];
  for (const y of sortedInside(ys, ch)) {
    for (const z of sortedInside(zs, cd)) {
      for (const x of sortedInside(xs, cw)) {
        positions.push([x, y, z]);
      }
    }
  }
  return positions;
}

function sortedInside(values: Set<number>, limit: number): number[] {
  return Array.from(values)
    .filter((value) => value >= 0 && value < limit)
    .sort((a, b) => a - b);
}

function fitsWithinCarton(
  position: [number, number, number],
  dimensions: [number, number, number],
  cartonDimensions: [number, number, number],
): boolean {
  const [x, y, z] = position;
  const [w, h, d] = dimensions;
  const [cw, ch, cd] = cartonDimensions;
  return x + w <= cw && y + h <= ch && z + d <= cd;
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
    const [ow, oh, od] = getPlacedItemDimensions(placed);

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
 * Check if an item fits within the carton dimensions in any orientation.
 */
export function itemFitsInCarton(
  item: Item,
  cartonWidth: number,
  cartonHeight: number,
  cartonDepth: number,
): boolean {
  return getItemOrientations(item).some(
    ([iw, ih, id]) => iw <= cartonWidth && ih <= cartonHeight && id <= cartonDepth,
  );
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
