import type { PackingState } from './packing-store';
import type { CartonInstance, Item } from '../../../domain/packing/types';

/**
 * Get the currently selected carton.
 */
export function getSelectedCarton(state: PackingState): CartonInstance | undefined {
  if (!state.selectedCartonId) return undefined;
  return state.session.pallet.cartons.find((c) => c.id === state.selectedCartonId);
}

/**
 * Get the currently selected buffer item.
 */
export function getSelectedBufferItem(state: PackingState): Item | undefined {
  if (!state.selectedBufferItemId) return undefined;
  return state.session.bufferItems.find((i) => i.id === state.selectedBufferItemId);
}

/**
 * Get total weight of items in a carton.
 */
export function getCartonWeight(carton: CartonInstance): number {
  return carton.items.reduce((sum, pi) => sum + pi.item.weight, 0);
}

/**
 * Get remaining weight capacity of a carton.
 */
export function getCartonRemainingWeight(
  carton: CartonInstance,
  maxWeight: number,
): number {
  return maxWeight - getCartonWeight(carton);
}
