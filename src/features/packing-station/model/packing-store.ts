import { create } from 'zustand';
import type { PackingSession } from '../../../domain/packing/types';
import { createDemoSession } from './demo-session';
import {
  packItemIntoCarton,
  unpackItemFromCarton,
  createCartonFromPreset,
  deleteCarton,
  commitCartonPosition,
  rotateCarton90,
} from './packing-actions';
import {
  getInvalidCartonPositionReason,
  getNoSlotReasonForCartonDimensions,
} from '../../../domain/packing/carton-layout';

const STORAGE_KEY = '3dpallet:packing-session:v1';

type UndoSnapshot = {
  label: string;
  session: PackingSession;
  selectedCartonId: string | null;
  selectedBufferItemId: string | null;
  selectedPackedItemId: string | null;
};

export interface PackingState {
  session: PackingSession;
  selectedCartonId: string | null;
  selectedBufferItemId: string | null;
  selectedPackedItemId: string | null;
  cartonMoveModeCartonId: string | null;
  moveValidationMessage: string | null;
  createCartonMessage: string | null;
  undoSnapshot: UndoSnapshot | null;

  // Actions
  hydrateDemoSession: () => void;
  resetSession: () => void;
  undoLastAction: () => void;
  selectCarton: (cartonId: string | null) => void;
  selectBufferItem: (itemId: string | null) => void;
  selectPackedItem: (itemId: string | null) => void;
  packSelectedItemIntoSelectedCarton: () => void;
  unpackItemFromCarton: (itemId: string, cartonId: string) => void;
  createCartonFromPreset: (presetId: string) => void;
  deleteCarton: (cartonId: string) => void;
  enterCartonMoveMode: (cartonId: string) => void;
  cancelCartonMoveMode: () => void;
  commitCartonPosition: (cartonId: string, position: [number, number, number]) => void;
  rotateSelectedCarton90: () => void;
  setMoveValidationMessage: (message: string | null) => void;
}

export const usePackingStore = create<PackingState>((set, get) => ({
  session: createDemoSession(),
  selectedCartonId: null,
  selectedBufferItemId: null,
  selectedPackedItemId: null,
  cartonMoveModeCartonId: null,
  moveValidationMessage: null,
  createCartonMessage: null,
  undoSnapshot: null,

  hydrateDemoSession: () => {
    const storedSession = loadStoredSession();
    set({
      session: storedSession ?? createDemoSession(),
      selectedCartonId: null,
      selectedBufferItemId: null,
      selectedPackedItemId: null,
      cartonMoveModeCartonId: null,
      moveValidationMessage: null,
      createCartonMessage: null,
      undoSnapshot: null,
    });
  },

  resetSession: () => {
    const state = get();
    set({
      session: createDemoSession(),
      selectedCartonId: null,
      selectedBufferItemId: null,
      selectedPackedItemId: null,
      cartonMoveModeCartonId: null,
      moveValidationMessage: null,
      createCartonMessage: null,
      undoSnapshot: createUndoSnapshot(state, 'Сброс сессии'),
    });
  },

  undoLastAction: () => {
    const state = get();
    if (!state.undoSnapshot) return;

    set({
      session: state.undoSnapshot.session,
      selectedCartonId: state.undoSnapshot.selectedCartonId,
      selectedBufferItemId: state.undoSnapshot.selectedBufferItemId,
      selectedPackedItemId: state.undoSnapshot.selectedPackedItemId,
      cartonMoveModeCartonId: null,
      moveValidationMessage: null,
      createCartonMessage: null,
      undoSnapshot: null,
    });
  },

  selectCarton: (cartonId: string | null) => {
    const state = get();

    set({
      selectedCartonId: cartonId,
      selectedPackedItemId: null,
      cartonMoveModeCartonId:
        cartonId === null
          ? null
          : state.cartonMoveModeCartonId === cartonId
          ? state.cartonMoveModeCartonId
          : null,
      moveValidationMessage: null,
      createCartonMessage: null,
    });
  },

  selectBufferItem: (itemId: string | null) => {
    // Buffer item selection is independent — do not clear carton selection
    set({ selectedBufferItemId: itemId, selectedPackedItemId: null, createCartonMessage: null });
  },

  selectPackedItem: (itemId: string | null) => {
    set({ selectedPackedItemId: itemId, selectedBufferItemId: null, createCartonMessage: null });
  },

  packSelectedItemIntoSelectedCarton: () => {
    const state = get();
    if (!state.selectedCartonId || !state.selectedBufferItemId) return;

    const newState = packItemIntoCarton(state, state.selectedBufferItemId, state.selectedCartonId);

    if (newState === state) return; // pack was rejected, no state change

    set({
      session: newState.session,
      selectedBufferItemId: null, // clear only item selection, keep carton selected
      selectedPackedItemId: state.selectedBufferItemId,
      undoSnapshot: createUndoSnapshot(state, 'Упаковка товара'),
    });
  },

  unpackItemFromCarton: (itemId: string, cartonId: string) => {
    const state = get();
    const newState = unpackItemFromCarton(state, itemId, cartonId);
    set({
      ...newState,
      selectedPackedItemId: state.selectedPackedItemId === itemId ? null : state.selectedPackedItemId,
      undoSnapshot: createUndoSnapshot(state, 'Возврат товара'),
    });
  },

  createCartonFromPreset: (presetId: string) => {
    const state = get();
    const preset = state.session.availablePresets.find((p) => p.id === presetId);
    if (!preset) return;
    const newState = createCartonFromPreset(state, presetId);
    if (newState === state) {
      const reason = getNoSlotReasonForCartonDimensions(
        state.session.pallet,
        preset.dimensions,
        state.session.availablePresets,
      );
      set({ createCartonMessage: reason ?? 'Нельзя создать коробку сейчас.' });
      return;
    }
    set({
      ...newState,
      cartonMoveModeCartonId: null,
      moveValidationMessage: null,
      createCartonMessage: null,
      selectedPackedItemId: null,
      undoSnapshot: createUndoSnapshot(state, 'Создание коробки'),
    });
  },

  deleteCarton: (cartonId: string) => {
    const state = get();
    const deletedCarton = state.session.pallet.cartons.find((carton) => carton.id === cartonId);
    const selectedItemWasDeleted = deletedCarton?.items.some(
      (placedItem) => placedItem.item.id === state.selectedPackedItemId,
    );
    const newState = deleteCarton(state, cartonId);
    set({
      ...newState,
      cartonMoveModeCartonId:
        newState.selectedCartonId === state.cartonMoveModeCartonId ? newState.selectedCartonId : null,
      moveValidationMessage: null,
      createCartonMessage: null,
      selectedPackedItemId: selectedItemWasDeleted ? null : state.selectedPackedItemId,
      undoSnapshot: createUndoSnapshot(state, 'Удаление коробки'),
    });
  },

  enterCartonMoveMode: (cartonId: string) => {
    const state = get();
    if (state.selectedCartonId !== cartonId) return;
    set({ cartonMoveModeCartonId: cartonId, moveValidationMessage: null, createCartonMessage: null });
  },

  cancelCartonMoveMode: () => {
    set({ cartonMoveModeCartonId: null, moveValidationMessage: null });
  },

  commitCartonPosition: (cartonId: string, position: [number, number, number]) => {
    const state = get();
    const carton = state.session.pallet.cartons.find((c) => c.id === cartonId);
    if (!carton) return;
    const reason = getInvalidCartonPositionReason(
      carton,
      position,
      state.session.pallet,
      state.session.availablePresets,
    );
    if (reason) {
      set({ moveValidationMessage: reason });
      return;
    }
    const newState = commitCartonPosition(state, cartonId, position);
    if (newState === state) return;
    set({ ...newState, moveValidationMessage: null, undoSnapshot: createUndoSnapshot(state, 'Перемещение коробки') });
  },

  rotateSelectedCarton90: () => {
    const state = get();
    if (!state.selectedCartonId) return;
    const newState = rotateCarton90(state, state.selectedCartonId);
    if (newState === state) {
      set({ moveValidationMessage: 'Нельзя повернуть коробку: в текущей позиции недостаточно места.' });
      return;
    }
    set({ ...newState, moveValidationMessage: null, undoSnapshot: createUndoSnapshot(state, 'Поворот коробки') });
  },

  setMoveValidationMessage: (message: string | null) => {
    set({ moveValidationMessage: message });
  },
}));

usePackingStore.subscribe((state) => {
  saveStoredSession(state.session);
});

function createUndoSnapshot(state: PackingState, label: string): UndoSnapshot {
  return {
    label,
    session: state.session,
    selectedCartonId: state.selectedCartonId,
    selectedBufferItemId: state.selectedBufferItemId,
    selectedPackedItemId: state.selectedPackedItemId,
  };
}

function loadStoredSession(): PackingSession | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PackingSession;
    if (!parsed?.pallet || !Array.isArray(parsed.bufferItems) || !Array.isArray(parsed.availablePresets)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveStoredSession(session: PackingSession): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Persistence is useful, but the packing flow should keep working without it.
  }
}
