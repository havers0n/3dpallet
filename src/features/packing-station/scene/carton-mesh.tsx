import * as THREE from 'three';
import { useState } from 'react';
import { usePackingStore } from '../model/packing-store';
import {
  getCartonDimensions,
  getCartonFootprint,
  snapPositionToGrid,
  isValidCartonPosition,
  getInvalidCartonPositionReason,
} from '../../../domain/packing/carton-layout';
import type { CartonInstance, CartonPreset } from '../../../domain/packing/types';
import type { ThreeEvent } from '@react-three/fiber';

type PointerCaptureTarget = {
  setPointerCapture?: (pointerId: number) => void;
  releasePointerCapture?: (pointerId: number) => void;
};

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
  const [isDragging, setIsDragging] = useState(false);
  const [previewPosition, setPreviewPosition] = useState<[number, number, number] | null>(null);

  const pallet = usePackingStore((s) => s.session.pallet);
  const cartonMoveModeCartonId = usePackingStore((s) => s.cartonMoveModeCartonId);
  const cancelCartonMoveMode = usePackingStore((s) => s.cancelCartonMoveMode);
  const commitPosition = usePackingStore((s) => s.commitCartonPosition);
  const setMoveValidationMessage = usePackingStore((s) => s.setMoveValidationMessage);

  const isMoveModeActive = isSelected && cartonMoveModeCartonId === carton.id;
  const [w, h, d] = getCartonFootprint(carton, presets);
  const [baseW, _baseH, baseD] = getCartonDimensions(carton, presets);
  const rotationY = ((carton.rotationDeg ?? 0) * Math.PI) / 180;
  const yOffset = palletHeight + h / 2;
  const currentPosition = isDragging && previewPosition ? previewPosition : carton.palletPosition;
  const validPreview = previewPosition
    ? isValidCartonPosition(carton, previewPosition, pallet, presets)
    : true;

  const faceColor = isDragging
    ? validPreview
      ? '#22c55e'
      : '#ef4444'
    : isSelected
    ? '#3B82F6'
    : hovered
    ? '#E8C49A'
    : '#D4A574';
  const edgeColor = isDragging
    ? validPreview
      ? '#166534'
      : '#991b1b'
    : isSelected
    ? '#1D4ED8'
    : hovered
    ? '#A0782C'
    : '#8B6914';

  function handlePointerDown(event: ThreeEvent<PointerEvent>) {
    if (!isMoveModeActive) return;
    event.stopPropagation();
    (event.target as PointerCaptureTarget)?.setPointerCapture?.(event.pointerId);
    setIsDragging(true);
    setPreviewPosition(carton.palletPosition);
    setMoveValidationMessage(null);
  }

  function handlePointerMove(event: ThreeEvent<PointerEvent>) {
    if (!isDragging) return;
    event.stopPropagation();

    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -yOffset);
    const intersection = new THREE.Vector3();
    if (!event.ray.intersectPlane(plane, intersection)) return;

    const candidate: [number, number, number] = snapPositionToGrid([
      intersection.x - w / 2,
      0,
      intersection.z - d / 2,
    ]);
    setPreviewPosition(candidate);
    const reason = getInvalidCartonPositionReason(carton, candidate, pallet, presets);
    setMoveValidationMessage(reason);
  }

  function finishDrag(event: ThreeEvent<PointerEvent>) {
    if (!isDragging) return;
    event.stopPropagation();
    (event.target as PointerCaptureTarget)?.releasePointerCapture?.(event.pointerId);

    if (previewPosition) {
      commitPosition(carton.id, previewPosition);
    } else {
      cancelCartonMoveMode();
    }

    setIsDragging(false);
    setPreviewPosition(null);
  }

  return (
    <group
      position={[currentPosition[0] + w / 2, yOffset, currentPosition[2] + d / 2]}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <group rotation={[0, rotationY, 0]}>
        <mesh>
          <boxGeometry args={[baseW, h, baseD]} />
          <meshStandardMaterial color={faceColor} transparent opacity={isDragging ? 0.7 : 0.8} />
        </mesh>
        <lineSegments>
          <edgesGeometry attach="geometry" args={[new THREE.BoxGeometry(baseW, h, baseD)]} />
          <lineBasicMaterial color={edgeColor} />
        </lineSegments>
      </group>
    </group>
  );
}
