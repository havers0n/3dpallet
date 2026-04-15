import type { CartonInstance } from '../../../domain/packing/types';
import type { PackingState } from './packing-store';
import { nextCartonSlotOnPallet } from '../../../domain/packing/carton-layout';
import { calculateItemPositionInCarton } from '../../../domain/packing/placement';
import { itemExceedsWeightLimit } from '../../../domain/packing/guards';

/**
 * Pack a buffer item into the selected carton.
 * Validates:
 *   - item is in buffer
 *   - item fits in carton by dimensions (slot scanning)
 *   - item does not exceed preset max weight
 */
export function packItemIntoCarton(
  state: PackingState,
  itemId: string,
  cartonId: string,
): PackingState {
  const carton = state.session.pallet.cartons.find((c) => c.id === cartonId);
  if (!carton) return state;

  const itemIndex = state.session.bufferItems.findIndex((i) => i.id === itemId);
  if (itemIndex === -1) return state;

  const item = state.session.bufferItems[itemIndex];
  const presets = state.session.availablePresets;

  // Weight check against preset maxWeight
  if (itemExceedsWeightLimit(carton, presets, item.weight)) return state;

  // Calculate grid position for the new item via deterministic slot scanning
  const position = calculateItemPositionInCarton(
    item,
    carton,
    presets,
    carton.items,
  );

  // If item doesn't fit in any slot, reject
  if (position[0] < 0) return state;

  const newBufferItems = [...state.session.bufferItems];
  newBufferItems.splice(itemIndex, 1);

  const newCartons = state.session.pallet.cartons.map((c) => {
    if (c.id !== cartonId) return c;
    return {
      ...c,
      items: [...c.items, { item, position }],
    };
  });

  return {
    ...state,
    session: {
      ...state.session,
      bufferItems: newBufferItems,
      pallet: {
        ...state.session.pallet,
        cartons: newCartons,
      },
    },
  };
}

/**
 * Unpack an item from a carton back to buffer.
 */
export function unpackItemFromCarton(
  state: PackingState,
  itemId: string,
  cartonId: string,
): PackingState {
  const carton = state.session.pallet.cartons.find((c) => c.id === cartonId);
  if (!carton) return state;

  const placedItem = carton.items.find((pi) => pi.item.id === itemId);
  if (!placedItem) return state;

  const newCartons = state.session.pallet.cartons.map((c) => {
    if (c.id !== cartonId) return c;
    return {
      ...c,
      items: c.items.filter((pi) => pi.item.id !== itemId),
    };
  });

  return {
    ...state,
    session: {
      ...state.session,
      bufferItems: [...state.session.bufferItems, placedItem.item],
      pallet: {
        ...state.session.pallet,
        cartons: newCartons,
      },
    },
  };
}

/**
 * Create a new carton from a preset.
 * Uses deterministic slot allocation on the pallet.
 */
export function createCartonFromPreset(
  state: PackingState,
  presetId: string,
): PackingState {
  const preset = state.session.availablePresets.find((p) => p.id === presetId);
  if (!preset) return state;

  const dimensions = preset.dimensions;
  const position = nextCartonSlotOnPallet(
    state.session.pallet,
    dimensions,
    state.session.availablePresets,
  );

  // If no slot available, reject
  if (position[0] < 0) return state;

  const cartonId = `carton-${Date.now()}`;
  const newCarton: CartonInstance = {
    id: cartonId,
    presetId,
    label: `${preset.name} #${state.session.pallet.cartons.length + 1}`,
    palletPosition: position,
    items: [],
  };

  return {
    ...state,
    session: {
      ...state.session,
      pallet: {
        ...state.session.pallet,
        cartons: [...state.session.pallet.cartons, newCarton],
      },
    },
    selectedCartonId: cartonId,
  };
}

/**
 * Delete a carton and return its items to buffer.
 */
export function deleteCarton(state: PackingState, cartonId: string): PackingState {
  const carton = state.session.pallet.cartons.find((c) => c.id === cartonId);
  if (!carton) return state;

  const bufferItemsFromCarton = carton.items.map((pi) => pi.item);

  return {
    ...state,
    session: {
      ...state.session,
      bufferItems: [...state.session.bufferItems, ...bufferItemsFromCarton],
      pallet: {
        ...state.session.pallet,
        cartons: state.session.pallet.cartons.filter((c) => c.id !== cartonId),
      },
    },
    selectedCartonId: state.selectedCartonId === cartonId ? null : state.selectedCartonId,
  };
}
