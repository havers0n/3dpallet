import { describe, expect, it } from 'vitest';
import type { CartonInstance, CartonPreset, Pallet } from './types';
import { nextCartonSlotOnPallet } from './carton-layout';

const presets: CartonPreset[] = [
  {
    id: 'wide',
    name: 'Wide',
    dimensions: [6, 1, 10],
    maxWeight: 100,
  },
  {
    id: 'narrow',
    name: 'Narrow',
    dimensions: [4, 1, 10],
    maxWeight: 100,
  },
];

function carton(id: string, presetId: string, position: [number, number, number]): CartonInstance {
  return {
    id,
    presetId,
    label: id,
    palletPosition: position,
    items: [],
  };
}

describe('nextCartonSlotOnPallet', () => {
  it('uses existing carton boundaries as candidate slots', () => {
    const pallet: Pallet = {
      id: 'pallet',
      dimensions: [10, 1, 10],
      cartons: [carton('carton-1', 'wide', [0, 0, 0])],
    };

    expect(nextCartonSlotOnPallet(pallet, [4, 1, 10], presets)).toEqual([6, 0, 0]);
  });

  it('rejects cartons larger than the pallet footprint even when the pallet is empty', () => {
    const pallet: Pallet = {
      id: 'pallet',
      dimensions: [10, 1, 10],
      cartons: [],
    };

    expect(nextCartonSlotOnPallet(pallet, [11, 1, 10], presets)).toEqual([-1, 0, -1]);
  });
});
