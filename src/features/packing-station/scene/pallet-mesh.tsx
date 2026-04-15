import { usePackingStore } from '../model/packing-store';

export function PalletMesh() {
  const pallet = usePackingStore((s) => s.session.pallet);
  const [pw, ph, pd] = pallet.dimensions;

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
    </group>
  );
}
