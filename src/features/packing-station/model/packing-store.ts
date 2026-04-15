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

export interface PackingState {
  session: PackingSession;
  selectedCartonId: string | null;
  selectedBufferItemId: string | null;
  cartonMoveModeCartonId: string | null;
  moveValidationMessage: string | null;
  createCartonMessage: string | null;

  // Actions
  hydrateDemoSession: () => void;
  resetSession: () => void;
  selectCarton: (cartonId: string | null) => void;
  selectBufferItem: (itemId: string | null) => void;
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
  cartonMoveModeCartonId: null,
  moveValidationMessage: null,
  createCartonMessage: null,

  hydrateDemoSession: () => {
    set({
      session: createDemoSession(),
      selectedCartonId: null,
      selectedBufferItemId: null,
      cartonMoveModeCartonId: null,
      moveValidationMessage: null,
      createCartonMessage: null,
    });
  },

  resetSession: () => {
    set({
      session: createDemoSession(),
      selectedCartonId: null,
      selectedBufferItemId: null,
      cartonMoveModeCartonId: null,
      moveValidationMessage: null,
      createCartonMessage: null,
    });
  },

  selectCarton: (cartonId: string | null) => {
    const state = get();

    set({
      selectedCartonId: cartonId,
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
    set({ selectedBufferItemId: itemId, createCartonMessage: null });
  },

  packSelectedItemIntoSelectedCarton: () => {
    const state = get();
    if (!state.selectedCartonId || !state.selectedBufferItemId) return;

    const newState = packItemIntoCarton(state, state.selectedBufferItemId, state.selectedCartonId);

    if (newState === state) return; // pack was rejected, no state change

    set({
      session: newState.session,
      selectedBufferItemId: null, // clear only item selection, keep carton selected
    });
  },

  unpackItemFromCarton: (itemId: string, cartonId: string) => {
    const state = get();
    const newState = unpackItemFromCarton(state, itemId, cartonId);
    set(newState);
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
      set({ createCartonMessage: reason ?? 'Cannot create carton at this time.' });
      return;
    }
    set({
      ...newState,
      cartonMoveModeCartonId: null,
      moveValidationMessage: null,
      createCartonMessage: null,
    });
  },

  deleteCarton: (cartonId: string) => {
    const state = get();
    const newState = deleteCarton(state, cartonId);
    set({
      ...newState,
      cartonMoveModeCartonId:
        newState.selectedCartonId === state.cartonMoveModeCartonId ? newState.selectedCartonId : null,
      moveValidationMessage: null,
      createCartonMessage: null,
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
    set({ ...newState, moveValidationMessage: null });
  },

  rotateSelectedCarton90: () => {
    const state = get();
    if (!state.selectedCartonId) return;
    const newState = rotateCarton90(state, state.selectedCartonId);
    if (newState === state) {
      set({ moveValidationMessage: 'Cannot rotate carton: not enough free space at current position.' });
      return;
    }
    set({ ...newState, moveValidationMessage: null });
  },

  setMoveValidationMessage: (message: string | null) => {
    set({ moveValidationMessage: message });
  },
}));
