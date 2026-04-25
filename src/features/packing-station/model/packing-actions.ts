import type { CartonInstance } from '../../../domain/packing/types';
import type { PackingState } from './packing-store';
import {
  nextCartonSlotOnPallet,
  isValidCartonPosition,
  getInvalidCartonPositionReason,
} from '../../../domain/packing/carton-layout';
import { calculateItemPlacementInCarton } from '../../../domain/packing/placement';
import { itemExceedsWeightLimit } from '../../../domain/packing/guards';
import { createCartonId } from './carton-id';

export type PackingActionResult = {
  ok: boolean;
  state: PackingState;
  reason: string | null;
};

function ok(state: PackingState): PackingActionResult {
  return { ok: true, state, reason: null };
}

function rejected(state: PackingState, reason: string): PackingActionResult {
  return { ok: false, state, reason };
}

export function packItemIntoCarton(
  state: PackingState,
  itemId: string,
  cartonId: string,
): PackingActionResult {
  const carton = state.session.pallet.cartons.find((c) => c.id === cartonId);
  if (!carton) return rejected(state, 'Коробка не найдена');

  const itemIndex = state.session.bufferItems.findIndex((i) => i.id === itemId);
  if (itemIndex === -1) return rejected(state, 'Товар не найден в буфере');

  const item = state.session.bufferItems[itemIndex];
  const presets = state.session.availablePresets;

  if (itemExceedsWeightLimit(carton, presets, item.weight)) {
    return rejected(state, 'Превышен лимит веса коробки');
  }

  const placement = calculateItemPlacementInCarton(item, carton, presets, carton.items);
  if (!placement) {
    return rejected(state, 'Товар не помещается в выбранную коробку');
  }

  const newBufferItems = [...state.session.bufferItems];
  newBufferItems.splice(itemIndex, 1);

  const newCartons = state.session.pallet.cartons.map((c) => {
    if (c.id !== cartonId) return c;
    return {
      ...c,
      items: [
        ...c.items,
        {
          item,
          position: placement.position,
          dimensions: placement.dimensions,
        },
      ],
    };
  });

  return ok({
    ...state,
    session: {
      ...state.session,
      bufferItems: newBufferItems,
      pallet: {
        ...state.session.pallet,
        cartons: newCartons,
      },
    },
  });
}

export function unpackItemFromCarton(
  state: PackingState,
  itemId: string,
  cartonId: string,
): PackingActionResult {
  const carton = state.session.pallet.cartons.find((c) => c.id === cartonId);
  if (!carton) return rejected(state, 'Коробка не найдена');

  const placedItem = carton.items.find((pi) => pi.item.id === itemId);
  if (!placedItem) return rejected(state, 'Товар не найден в коробке');

  const newCartons = state.session.pallet.cartons.map((c) => {
    if (c.id !== cartonId) return c;
    return {
      ...c,
      items: c.items.filter((pi) => pi.item.id !== itemId),
    };
  });

  return ok({
    ...state,
    session: {
      ...state.session,
      bufferItems: [...state.session.bufferItems, placedItem.item],
      pallet: {
        ...state.session.pallet,
        cartons: newCartons,
      },
    },
  });
}

export function createCartonFromPreset(
  state: PackingState,
  presetId: string,
): PackingActionResult {
  const preset = state.session.availablePresets.find((p) => p.id === presetId);
  if (!preset) return rejected(state, 'Пресет коробки не найден');

  const dimensions = preset.dimensions;
  const rotatedDimensions: [number, number, number] = [
    dimensions[2],
    dimensions[1],
    dimensions[0],
  ];

  const position = nextCartonSlotOnPallet(
    state.session.pallet,
    dimensions,
    state.session.availablePresets,
  );
  const rotatedPosition = nextCartonSlotOnPallet(
    state.session.pallet,
    rotatedDimensions,
    state.session.availablePresets,
  );

  const useRotatedPlacement = position[0] < 0 && rotatedPosition[0] >= 0;
  const finalPosition = useRotatedPlacement ? rotatedPosition : position;

  if (finalPosition[0] < 0) {
    return rejected(state, 'На паллете нет свободного места');
  }

  const cartonId = createCartonId(state.session.pallet);
  const newCarton: CartonInstance = {
    id: cartonId,
    presetId,
    label: `${preset.name} #${state.session.pallet.cartons.length + 1}`,
    palletPosition: finalPosition,
    rotationDeg: useRotatedPlacement ? 90 : 0,
    items: [],
  };

  return ok({
    ...state,
    session: {
      ...state.session,
      pallet: {
        ...state.session.pallet,
        cartons: [...state.session.pallet.cartons, newCarton],
      },
    },
    selectedCartonId: cartonId,
  });
}

export function rotateCarton90(state: PackingState, cartonId: string): PackingActionResult {
  const carton = state.session.pallet.cartons.find((c) => c.id === cartonId);
  if (!carton) return rejected(state, 'Коробка не найдена');

  const nextRotation: 0 | 90 = (carton.rotationDeg ?? 0) === 90 ? 0 : 90;
  const rotatedCarton: CartonInstance = {
    ...carton,
    rotationDeg: nextRotation,
  };

  const reason = getInvalidCartonPositionReason(
    rotatedCarton,
    rotatedCarton.palletPosition,
    state.session.pallet,
    state.session.availablePresets,
  );
  if (reason) {
    return rejected(state, reason);
  }

  const newCartons = state.session.pallet.cartons.map((c) => {
    if (c.id !== cartonId) return c;
    return rotatedCarton;
  });

  return ok({
    ...state,
    session: {
      ...state.session,
      pallet: {
        ...state.session.pallet,
        cartons: newCartons,
      },
    },
  });
}

export function commitCartonPosition(
  state: PackingState,
  cartonId: string,
  position: [number, number, number],
): PackingActionResult {
  if (state.selectedCartonId !== cartonId) {
    return rejected(state, 'Коробка не выбрана');
  }
  if (state.cartonMoveModeCartonId !== cartonId) {
    return rejected(state, 'Режим перемещения не активен');
  }

  const carton = state.session.pallet.cartons.find((c) => c.id === cartonId);
  if (!carton) return rejected(state, 'Коробка не найдена');

  if (
    !isValidCartonPosition(carton, position, state.session.pallet, state.session.availablePresets)
  ) {
    return rejected(
      state,
      getInvalidCartonPositionReason(
        carton,
        position,
        state.session.pallet,
        state.session.availablePresets,
      ) ?? 'Позиция коробки недоступна',
    );
  }

  const newCartons = state.session.pallet.cartons.map((c) => {
    if (c.id !== cartonId) return c;
    return {
      ...c,
      palletPosition: position,
    };
  });

  return ok({
    ...state,
    session: {
      ...state.session,
      pallet: {
        ...state.session.pallet,
        cartons: newCartons,
      },
    },
    cartonMoveModeCartonId: null,
  });
}

export function deleteCarton(state: PackingState, cartonId: string): PackingActionResult {
  const carton = state.session.pallet.cartons.find((c) => c.id === cartonId);
  if (!carton) return rejected(state, 'Коробка не найдена');

  const bufferItemsFromCarton = carton.items.map((pi) => pi.item);

  return ok({
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
  });
}
