/** Domain types for the packing station */

export interface Item {
  id: string;
  name: string;
  /** dimensions in cm [width, height, depth] */
  dimensions: [number, number, number];
  /** weight in kg */
  weight: number;
  sku: string;
}

export interface CartonPreset {
  id: string;
  name: string;
  /** internal dimensions in cm [width, height, depth] */
  dimensions: [number, number, number];
  /** max weight capacity in kg */
  maxWeight: number;
}

export interface PlacedItem {
  item: Item;
  /** position within carton in cm [x, y, z] */
  position: [number, number, number];
  /** actual packed orientation dimensions in cm [width, height, depth] */
  dimensions?: [number, number, number];
}

export interface CartonInstance {
  id: string;
  presetId: string;
  label: string;
  /** position on pallet in cm [x, y, z] */
  palletPosition: [number, number, number];
  /** rotation on pallet around Y axis in degrees */
  rotationDeg?: 0 | 90;
  items: PlacedItem[];
}

export interface Pallet {
  id: string;
  /** dimensions in cm [width, height, depth] */
  dimensions: [number, number, number];
  cartons: CartonInstance[];
}

export interface PackingSession {
  id: string;
  pallet: Pallet;
  bufferItems: Item[];
  availablePresets: CartonPreset[];
}
