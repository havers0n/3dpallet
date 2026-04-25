import * as THREE from 'three';
import { useState } from 'react';
import { Html, Text } from '@react-three/drei';
import { usePackingStore } from '../model/packing-store';
import {
  getCartonDimensions,
  getCartonFootprint,
  snapPositionToGrid,
  clampPositionToPalletXZ,
  isValidCartonPosition,
  getInvalidCartonPositionReason,
  resolveCartonPreviewPosition,
} from '../../../domain/packing/carton-layout';
import type { CartonInstance, CartonPreset } from '../../../domain/packing/types';
import type { ThreeEvent } from '@react-three/fiber';
import { ItemBlocks } from './item-blocks';

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
  const preset = presets.find((p) => p.id === carton.presetId);
  const rotationY = ((carton.rotationDeg ?? 0) * Math.PI) / 180;
  const yOffset = palletHeight + currentPositionY(carton, isDragging, previewPosition) + h / 2;
  const currentPosition = isDragging && previewPosition ? previewPosition : carton.palletPosition;
  const validPreview = previewPosition
    ? isValidCartonPosition(carton, previewPosition, pallet, presets)
    : true;
  const previewReason = previewPosition
    ? getInvalidCartonPositionReason(carton, previewPosition, pallet, presets)
    : null;
  const totalWeight = carton.items.reduce((sum, placed) => sum + placed.item.weight, 0);
  const weightRatio = preset ? Math.min(totalWeight / preset.maxWeight, 1) : 0;
  const cartonVolume = baseW * h * baseD;
  const itemVolume = carton.items.reduce((sum, placed) => {
    const [iw, ih, id] = placed.item.dimensions;
    return sum + iw * ih * id;
  }, 0);
  const volumeRatio = cartonVolume > 0 ? Math.min(itemVolume / cartonVolume, 1) : 0;

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

    const activeY = (previewPosition ?? carton.palletPosition)[1];
    const dragPlaneY = palletHeight + activeY + h / 2;
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -dragPlaneY);
    const intersection = new THREE.Vector3();
    if (!event.ray.intersectPlane(plane, intersection)) return;

    const snappedXZ: [number, number, number] = snapPositionToGrid([
      intersection.x - w / 2,
      activeY,
      intersection.z - d / 2,
    ]);
    const boundedXZ = clampPositionToPalletXZ(snappedXZ, [w, h, d], pallet);
    const candidate = resolveCartonPreviewPosition(
      carton,
      boundedXZ,
      pallet,
      presets,
      activeY,
    );
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
      {isDragging && (
        <MovePreviewMarker width={w} depth={d} isValid={validPreview} y={-h / 2 - 0.3} />
      )}
      <group rotation={[0, rotationY, 0]}>
        <mesh>
          <boxGeometry args={[baseW, h, baseD]} />
          <meshStandardMaterial
            color={faceColor}
            roughness={0.86}
            metalness={0}
            transparent
            opacity={isDragging ? 0.46 : 0.58}
          />
        </mesh>
        <CartonDetails width={baseW} height={h} depth={baseD} isSelected={isSelected} />
        <ItemBlocks carton={carton} presets={presets} />
        <lineSegments>
          <edgesGeometry attach="geometry" args={[new THREE.BoxGeometry(baseW, h, baseD)]} />
          <lineBasicMaterial color={edgeColor} />
        </lineSegments>
        <Text
          position={[0, h / 2 + 0.35, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={Math.max(4, Math.min(baseW, baseD) * 0.12)}
          maxWidth={Math.max(18, baseW * 0.84)}
          textAlign="center"
          anchorX="center"
          anchorY="middle"
          color={isSelected ? '#1d4ed8' : '#7c2d12'}
        >
          {carton.label}
        </Text>
      </group>
      {(isSelected || hovered || isDragging) && (
        <CartonBadge
          label={carton.label}
          itemCount={carton.items.length}
          weight={totalWeight}
          maxWeight={preset?.maxWeight ?? 0}
          weightRatio={weightRatio}
          volumeRatio={volumeRatio}
          positionY={h / 2 + 14}
        />
      )}
      {isDragging && previewReason && (
        <Html position={[0, h / 2 + 27, 0]} center distanceFactor={85}>
          <div className="max-w-56 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs font-medium text-red-800 shadow-lg">
            {previewReason}
          </div>
        </Html>
      )}
    </group>
  );
}

function CartonDetails({
  width,
  height,
  depth,
  isSelected,
}: {
  width: number;
  height: number;
  depth: number;
  isSelected: boolean;
}) {
  const seamColor = isSelected ? '#1d4ed8' : '#9a6b2f';
  const flapColor = isSelected ? '#bfdbfe' : '#d7ad78';
  const strapColor = isSelected ? '#2563eb' : '#8b5a2b';

  return (
    <>
      <mesh position={[0, height / 2 + 0.08, -depth * 0.24]}>
        <boxGeometry args={[width * 0.92, 0.18, depth * 0.03]} />
        <meshStandardMaterial color={flapColor} roughness={0.9} />
      </mesh>
      <mesh position={[0, height / 2 + 0.1, depth * 0.24]}>
        <boxGeometry args={[width * 0.92, 0.18, depth * 0.03]} />
        <meshStandardMaterial color={flapColor} roughness={0.9} />
      </mesh>
      <mesh position={[0, height / 2 + 0.16, 0]}>
        <boxGeometry args={[width * 0.96, 0.2, 0.45]} />
        <meshStandardMaterial color={seamColor} roughness={0.78} />
      </mesh>
      <mesh position={[0, 0, depth / 2 + 0.08]}>
        <boxGeometry args={[width * 0.1, height * 0.92, 0.18]} />
        <meshStandardMaterial color={strapColor} transparent opacity={0.35} />
      </mesh>
      <mesh position={[-width / 2 - 0.08, 0, 0]}>
        <boxGeometry args={[0.18, height * 0.92, depth * 0.08]} />
        <meshStandardMaterial color={strapColor} transparent opacity={0.28} />
      </mesh>
    </>
  );
}

function MovePreviewMarker({
  width,
  depth,
  isValid,
  y,
}: {
  width: number;
  depth: number;
  isValid: boolean;
  y: number;
}) {
  const color = isValid ? '#22c55e' : '#ef4444';

  return (
    <group position={[0, y, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshBasicMaterial color={color} transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>
      <lineSegments>
        <edgesGeometry attach="geometry" args={[new THREE.BoxGeometry(width, 0.4, depth)]} />
        <lineBasicMaterial color={color} />
      </lineSegments>
    </group>
  );
}

function CartonBadge({
  label,
  itemCount,
  weight,
  maxWeight,
  weightRatio,
  volumeRatio,
  positionY,
}: {
  label: string;
  itemCount: number;
  weight: number;
  maxWeight: number;
  weightRatio: number;
  volumeRatio: number;
  positionY: number;
}) {
  return (
    <Html position={[0, positionY, 0]} center distanceFactor={90}>
      <div className="min-w-44 rounded-md border border-slate-200 bg-white/95 px-3 py-2 text-xs text-slate-700 shadow-lg backdrop-blur">
        <div className="mb-1 truncate font-semibold text-slate-900">{label}</div>
        <div className="flex justify-between gap-3">
          <span>{itemCount} items</span>
          <span>{weight.toFixed(1)} / {maxWeight.toFixed(0)} kg</span>
        </div>
        <MetricBar label="Weight" ratio={weightRatio} color="#2563eb" />
        <MetricBar label="Volume" ratio={volumeRatio} color="#16a34a" />
      </div>
    </Html>
  );
}

function MetricBar({
  label,
  ratio,
  color,
}: {
  label: string;
  ratio: number;
  color: string;
}) {
  return (
    <div className="mt-1">
      <div className="mb-0.5 flex justify-between text-[10px] uppercase tracking-normal text-slate-500">
        <span>{label}</span>
        <span>{Math.round(ratio * 100)}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded bg-slate-200">
        <div className="h-full rounded" style={{ width: `${Math.round(ratio * 100)}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function currentPositionY(
  carton: CartonInstance,
  isDragging: boolean,
  previewPosition: [number, number, number] | null,
): number {
  if (isDragging && previewPosition) return previewPosition[1];
  return carton.palletPosition[1];
}
