import type { PackingSession } from '../../../domain/packing/types';
import { demoPallet, cartonPresets, demoItems } from '../../../domain/packing/presets';

/**
 * Create a demo session for initial state.
 */
export function createDemoSession(): PackingSession {
  return {
    id: 'demo-session-1',
    pallet: {
      ...demoPallet,
      cartons: [],
    },
    bufferItems: [...demoItems],
    availablePresets: [...cartonPresets],
  };
}
