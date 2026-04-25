import type { Item, CartonInstance, Pallet, CartonPreset } from './types';
import { resolveCartonPreset } from './carton-layout';
import { getPlacedItemDimensions } from './placement';

/**
 * Pallet placement semantics:
 *   Pallet height is pallet thickness only. All pallet placement validation
 *   is X/Z (footprint) only. Carton height is independent of pallet height.
 */

/**
 * Check if an item is currently in the buffer.
 */
export function isInBuffer(item: Item, bufferItems: Item[]): boolean {
  return bufferItems.some((bi) => bi.id === item.id);
}

/**
 * Check if an item is inside a specific carton.
 */
export function isInCarton(item: Item, carton: CartonInstance): boolean {
  return carton.items.some((pi) => pi.item.id === item.id);
}

/**
 * Check if an item is in any carton on the pallet.
 */
export function isPacked(item: Item, pallet: Pallet): boolean {
  return pallet.cartons.some((carton) => isInCarton(item, carton));
}

/**
 * Validate that a carton has a valid preset reference.
 */
export function isValidCartonPreset(
  carton: CartonInstance,
  presets: CartonPreset[],
): boolean {
  return presets.some((p) => p.id === carton.presetId);
}

/**
 * Total weight of items currently in the carton.
 */
export function cartonItemWeight(carton: CartonInstance): number {
  return carton.items.reduce((sum, pi) => sum + pi.item.weight, 0);
}

/**
 * Check whether adding an item would exceed the preset's max weight.
 */
export function itemExceedsWeightLimit(
  carton: CartonInstance,
  presets: CartonPreset[],
  itemWeight: number,
): boolean {
  const preset = resolveCartonPreset(carton, presets);
  if (!preset) return true;

  return cartonItemWeight(carton) + itemWeight > preset.maxWeight;
}

/**
 * Check if the carton's items exceed the weight limit (given resolved maxWeight).
 */
export function isCartonOverweight(carton: CartonInstance, maxWeight: number): boolean {
  return cartonItemWeight(carton) > maxWeight;
}

/**
 * Validate that all items in a carton fit within its dimensions.
 * Resolves dimensions from the carton's preset.
 */
export function areItemsValidInCarton(
  carton: CartonInstance,
  presets: CartonPreset[],
): boolean {
  const preset = resolveCartonPreset(carton, presets);
  if (!preset) return false;

  const [cw, ch, cd] = preset.dimensions;

  return carton.items.every((pi) => {
    const [iw, ih, id] = getPlacedItemDimensions(pi);
    return iw <= cw && ih <= ch && id <= cd;
  });
}
