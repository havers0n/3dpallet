import * as THREE from 'three';
import { useState } from 'react';
import { usePackingStore } from '../model/packing-store';
import { getCartonDimensions } from '../../../domain/packing/carton-layout';
import type { CartonInstance, CartonPreset } from '../../../domain/packing/types';

export function CartonMesh() {
  const cartons = usePackingStore((s) => s.session.pallet.cartons);
  const presets = usePackingStore((s) => s.session.availablePresets);
  const palletHeight = usePackingStore((s) => s.session.pallet.dimensions[1]);
  const selectedCartonId = usePackingStore((s) => s.selectedCartonId);
  const selectCarton = usePackingStore((s) => s.selectCarton);

  return (
    <group>
      {cartons.map((carton) => (
        <CartonMeshItem
          key={carton.id}
          carton={carton}
          presets={presets}
          palletHeight={palletHeight}
          isSelected={carton.id === selectedCartonId}
          onClick={() => selectCarton(carton.id)}
        />
      ))}
    </group>
  );
}

function CartonMeshItem({
  carton,
  presets,
  palletHeight,
  isSelected,
  onClick,
}: {
  carton: CartonInstance;
  presets: CartonPreset[];
  palletHeight: number;
  isSelected: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [w, h, d] = getCartonDimensions(carton, presets);
  const [x, _y, z] = carton.palletPosition;

  const faceColor = isSelected ? '#3B82F6' : hovered ? '#E8C49A' : '#D4A574';
  const edgeColor = isSelected ? '#1D4ED8' : hovered ? '#A0782C' : '#8B6914';

  // Cartons sit on top of the pallet surface, not inside it
  const yOffset = palletHeight + h / 2;

  return (
    <group
      position={[x + w / 2, yOffset, z + d / 2]}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <mesh>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={faceColor} transparent opacity={0.8} />
      </mesh>
      <lineSegments>
        <edgesGeometry attach="geometry" args={[new THREE.BoxGeometry(w, h, d)]} />
        <lineBasicMaterial color={edgeColor} />
      </lineSegments>
    </group>
  );
}
