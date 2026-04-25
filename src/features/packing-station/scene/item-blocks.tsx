import * as THREE from 'three';
import { useMemo, useState } from 'react';
import type { CartonInstance, CartonPreset, PlacedItem } from '../../../domain/packing/types';
import { getCartonDimensions } from '../../../domain/packing/carton-layout';
import { usePackingStore } from '../model/packing-store';

const SKU_COLORS = ['#14b8a6', '#f97316', '#8b5cf6', '#22c55e', '#eab308', '#0ea5e9'];

export function ItemBlocks({
  carton,
  presets,
}: {
  carton: CartonInstance;
  presets: CartonPreset[];
}) {
  const selectedPackedItemId = usePackingStore((s) => s.selectedPackedItemId);
  const selectPackedItem = usePackingStore((s) => s.selectPackedItem);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const [cartonWidth, cartonHeight, cartonDepth] = getCartonDimensions(carton, presets);

  return (
    <group position={[-cartonWidth / 2, -cartonHeight / 2, -cartonDepth / 2]}>
      {carton.items.map((placedItem, index) => {
        const isSelected = placedItem.item.id === selectedPackedItemId;
        const isHovered = placedItem.item.id === hoveredItemId;
        return (
          <ItemBlock
            key={placedItem.item.id}
            placedItem={placedItem}
            index={index}
            isSelected={isSelected}
            isHovered={isHovered}
            onSelect={() => selectPackedItem(isSelected ? null : placedItem.item.id)}
            onHover={setHoveredItemId}
          />
        );
      })}
    </group>
  );
}

function ItemBlock({
  placedItem,
  index,
  isSelected,
  isHovered,
  onSelect,
  onHover,
}: {
  placedItem: PlacedItem;
  index: number;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: () => void;
  onHover: (itemId: string | null) => void;
}) {
  const { item, position } = placedItem;
  const [w, h, d] = item.dimensions;
  const color = useMemo(() => colorForSku(item.sku, index), [index, item.sku]);
  const edgeColor = isSelected ? '#fef08a' : isHovered ? '#ffffff' : '#083344';

  return (
    <group
      position={[position[0] + w / 2, position[1] + h / 2, position[2] + d / 2]}
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        onHover(item.id);
      }}
      onPointerOut={(event) => {
        event.stopPropagation();
        onHover(null);
      }}
    >
      <mesh>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial
          color={color}
          roughness={0.55}
          metalness={0.02}
          transparent
          opacity={isSelected || isHovered ? 0.98 : 0.88}
        />
      </mesh>
      <lineSegments>
        <edgesGeometry attach="geometry" args={[new THREE.BoxGeometry(w, h, d)]} />
        <lineBasicMaterial color={edgeColor} linewidth={isSelected ? 2 : 1} />
      </lineSegments>
      {isSelected && (
        <mesh scale={[1.06, 1.06, 1.06]}>
          <boxGeometry args={[w, h, d]} />
          <meshBasicMaterial color="#fde047" wireframe transparent opacity={0.85} />
        </mesh>
      )}
    </group>
  );
}

function colorForSku(sku: string, fallbackIndex: number): string {
  let hash = 0;
  for (let i = 0; i < sku.length; i += 1) {
    hash = (hash * 31 + sku.charCodeAt(i)) % SKU_COLORS.length;
  }
  return SKU_COLORS[(hash + fallbackIndex) % SKU_COLORS.length];
}
