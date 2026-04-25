import type { PackingState } from './packing-store';
import type { CartonInstance, Item } from '../../../domain/packing/types';
import { getCartonFootprint, resolveCartonPreset } from '../../../domain/packing/carton-layout';
import {
  calculateItemPlacementInCarton,
  getPlacedItemDimensions,
} from '../../../domain/packing/placement';
import { itemExceedsWeightLimit } from '../../../domain/packing/guards';

export function getSelectedCarton(state: PackingState): CartonInstance | undefined {
  if (!state.selectedCartonId) return undefined;
  return state.session.pallet.cartons.find((c) => c.id === state.selectedCartonId);
}

export function getSelectedBufferItem(state: PackingState): Item | undefined {
  if (!state.selectedBufferItemId) return undefined;
  return state.session.bufferItems.find((i) => i.id === state.selectedBufferItemId);
}

export function getPackDisabledReason(state: PackingState): string | null {
  const selectedCarton = getSelectedCarton(state);
  const selectedItem = getSelectedBufferItem(state);

  if (!selectedCarton) return 'Выберите коробку';
  if (!selectedItem) return 'Выберите товар из буфера';

  const preset = resolveCartonPreset(selectedCarton, state.session.availablePresets);
  if (!preset) return 'Пресет коробки не найден';

  if (itemExceedsWeightLimit(selectedCarton, state.session.availablePresets, selectedItem.weight)) {
    return 'Превышен лимит веса коробки';
  }

  const placement = calculateItemPlacementInCarton(
    selectedItem,
    selectedCarton,
    state.session.availablePresets,
    selectedCarton.items,
  );
  if (!placement) {
    return 'Товар не помещается в выбранную коробку';
  }

  return null;
}

export function canPackSelectedItem(state: PackingState): boolean {
  return getPackDisabledReason(state) === null;
}

export function getCartonWeight(carton: CartonInstance): number {
  return carton.items.reduce((sum, pi) => sum + pi.item.weight, 0);
}

export function getCartonRemainingWeight(
  carton: CartonInstance,
  maxWeight: number,
): number {
  return Math.max(maxWeight - getCartonWeight(carton), 0);
}

export function getCartonVolumeFillPercent(
  carton: CartonInstance,
  state: PackingState,
): number {
  const preset = resolveCartonPreset(carton, state.session.availablePresets);
  if (!preset) return 0;

  const cartonVolume = preset.dimensions.reduce((volume, size) => volume * size, 1);
  if (cartonVolume <= 0) return 0;

  const itemVolume = carton.items.reduce((sum, placedItem) => {
    const [w, h, d] = getPlacedItemDimensions(placedItem);
    return sum + w * h * d;
  }, 0);

  return Math.min((itemVolume / cartonVolume) * 100, 100);
}

export function getPackedItemsWeight(state: PackingState): number {
  return state.session.pallet.cartons.reduce((sum, carton) => sum + getCartonWeight(carton), 0);
}

export function getPalletFillPercent(state: PackingState): number {
  const [palletWidth, _palletHeight, palletDepth] = state.session.pallet.dimensions;
  const palletArea = palletWidth * palletDepth;
  if (palletArea <= 0) return 0;

  const usedArea = state.session.pallet.cartons.reduce((sum, carton) => {
    const [width, _height, depth] = getCartonFootprint(carton, state.session.availablePresets);
    return sum + width * depth;
  }, 0);

  return Math.min((usedArea / palletArea) * 100, 100);
}
