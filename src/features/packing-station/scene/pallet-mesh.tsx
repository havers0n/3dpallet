import * as THREE from 'three';
import { useMemo } from 'react';
import { usePackingStore } from '../model/packing-store';

export function PalletMesh() {
  const pallet = usePackingStore((s) => s.session.pallet);
  const [pw, ph, pd] = pallet.dimensions;
  const gridPoints = useMemo(() => buildPalletGridPoints(pw, pd, 10), [pw, pd]);

  return (
    <group position={[pw / 2, ph / 2, pd / 2]}>
      {/* Pallet base */}
      <mesh>
        <boxGeometry args={[pw, ph, pd]} />
        <meshStandardMaterial color="#8B6914" />
      </mesh>
      {/* Pallet surface lines for visual */}
      <mesh position={[0, ph / 2 + 0.1, 0]}>
        <boxGeometry args={[pw, 0.2, pd]} />
        <meshStandardMaterial color="#A0782C" transparent opacity={0.5} />
      </mesh>
      <lineSegments position={[-pw / 2, ph / 2 + 0.35, -pd / 2]}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array(gridPoints), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#f8fafc" transparent opacity={0.42} />
      </lineSegments>
      <lineSegments position={[0, ph / 2 + 0.55, 0]}>
        <edgesGeometry attach="geometry" args={[new THREE.BoxGeometry(pw, 0.4, pd)]} />
        <lineBasicMaterial color="#eab308" />
      </lineSegments>
    </group>
  );
}

function buildPalletGridPoints(width: number, depth: number, step: number): number[] {
  const points: number[] = [];

  for (let x = 0; x <= width; x += step) {
    points.push(x, 0, 0, x, 0, depth);
  }

  for (let z = 0; z <= depth; z += step) {
    points.push(0, 0, z, width, 0, z);
  }

  return points;
}
