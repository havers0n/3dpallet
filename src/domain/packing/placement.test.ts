import { describe, expect, it } from 'vitest';
import type { CartonInstance, CartonPreset, Item, PlacedItem } from './types';
import { calculateItemPlacementInCarton } from './placement';

const preset: CartonPreset = {
  id: 'box',
  name: 'Box',
  dimensions: [10, 10, 10],
  maxWeight: 100,
};

const carton: CartonInstance = {
  id: 'carton-1',
  presetId: preset.id,
  label: 'Box #1',
  palletPosition: [0, 0, 0],
  items: [],
};

function item(id: string, dimensions: [number, number, number]): Item {
  return {
    id,
    name: id,
    sku: id,
    weight: 1,
    dimensions,
  };
}

describe('calculateItemPlacementInCarton', () => {
  it('rotates an item when the original orientation does not fit', () => {
    const smallPreset: CartonPreset = {
      ...preset,
      dimensions: [6, 4, 5],
    };
    const placement = calculateItemPlacementInCarton(
      item('rotated', [5, 6, 4]),
      { ...carton, presetId: smallPreset.id },
      [smallPreset],
      [],
    );

    expect(placement).toEqual({
      position: [0, 0, 0],
      dimensions: [6, 4, 5],
    });
  });

  it('uses occupied item boundaries as candidate slots', () => {
    const widePreset: CartonPreset = {
      ...preset,
      dimensions: [10, 2, 10],
    };
    const existing: PlacedItem[] = [
      {
        item: item('existing', [6, 2, 10]),
        position: [0, 0, 0],
        dimensions: [6, 2, 10],
      },
    ];

    const placement = calculateItemPlacementInCarton(
      item('narrow', [4, 2, 10]),
      { ...carton, presetId: widePreset.id },
      [widePreset],
      existing,
    );

    expect(placement).toEqual({
      position: [6, 0, 0],
      dimensions: [4, 2, 10],
    });
  });
});
