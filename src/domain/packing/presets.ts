import type { CartonPreset, Item, Pallet } from './types';

export const cartonPresets: CartonPreset[] = [
  {
    id: 'preset-small',
    name: 'Small Box',
    dimensions: [30, 20, 20],
    maxWeight: 10,
  },
  {
    id: 'preset-medium',
    name: 'Medium Box',
    dimensions: [50, 30, 30],
    maxWeight: 20,
  },
  {
    id: 'preset-large',
    name: 'Large Box',
    dimensions: [60, 40, 40],
    maxWeight: 30,
  },
];

export const demoItems: Item[] = [
  {
    id: 'item-1',
    name: 'Widget A',
    dimensions: [10, 5, 5],
    weight: 0.5,
    sku: 'SKU-WA-001',
  },
  {
    id: 'item-2',
    name: 'Gadget B',
    dimensions: [15, 10, 8],
    weight: 1.2,
    sku: 'SKU-GB-002',
  },
  {
    id: 'item-3',
    name: 'Doohickey C',
    dimensions: [20, 15, 10],
    weight: 2.0,
    sku: 'SKU-DC-003',
  },
  {
    id: 'item-4',
    name: 'Thingamajig D',
    dimensions: [8, 8, 8],
    weight: 0.8,
    sku: 'SKU-TD-004',
  },
  {
    id: 'item-5',
    name: 'Widget E',
    dimensions: [10, 5, 5],
    weight: 0.5,
    sku: 'SKU-WE-005',
  },
];

export const demoPallet: Pallet = {
  id: 'pallet-1',
  dimensions: [120, 15, 80],
  cartons: [],
};
