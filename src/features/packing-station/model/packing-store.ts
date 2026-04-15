import { create } from 'zustand';
import type { PackingSession } from '../../../domain/packing/types';
import { createDemoSession } from './demo-session';
import {
  packItemIntoCarton,
  unpackItemFromCarton,
  createCartonFromPreset,
  deleteCarton,
} from './packing-actions';

export interface PackingState {
  session: PackingSession;
  selectedCartonId: string | null;
  selectedBufferItemId: string | null;

  // Actions
  hydrateDemoSession: () => void;
  resetSession: () => void;
  selectCarton: (cartonId: string | null) => void;
  selectBufferItem: (itemId: string | null) => void;
  packSelectedItemIntoSelectedCarton: () => void;
  unpackItemFromCarton: (itemId: string, cartonId: string) => void;
  createCartonFromPreset: (presetId: string) => void;
  deleteCarton: (cartonId: string) => void;
}

export const usePackingStore = create<PackingState>((set, get) => ({
  session: createDemoSession(),
  selectedCartonId: null,
  selectedBufferItemId: null,

  hydrateDemoSession: () => {
    set({ session: createDemoSession(), selectedCartonId: null, selectedBufferItemId: null });
  },

  resetSession: () => {
    set({ session: createDemoSession(), selectedCartonId: null, selectedBufferItemId: null });
  },

  selectCarton: (cartonId: string | null) => {
    // Carton selection is independent — do not clear buffer item selection
    set({ selectedCartonId: cartonId });
  },

  selectBufferItem: (itemId: string | null) => {
    // Buffer item selection is independent — do not clear carton selection
    set({ selectedBufferItemId: itemId });
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
    const newState = createCartonFromPreset(state, presetId);
    set(newState);
  },

  deleteCarton: (cartonId: string) => {
    const state = get();
    const newState = deleteCarton(state, cartonId);
    set(newState);
  },
}));
