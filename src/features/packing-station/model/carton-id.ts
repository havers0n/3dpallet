import type { Pallet } from '../../../domain/packing/types';

const CARTON_ID_PREFIX = 'carton-';

export function createCartonId(pallet: Pallet): string {
  const usedIds = new Set(pallet.cartons.map((carton) => carton.id));
  let next = pallet.cartons.length + 1;

  while (usedIds.has(`${CARTON_ID_PREFIX}${next}`)) {
    next += 1;
  }

  return `${CARTON_ID_PREFIX}${next}`;
}
