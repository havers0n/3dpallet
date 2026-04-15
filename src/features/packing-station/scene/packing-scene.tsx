import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useEffect } from 'react';
import { usePackingStore } from '../model/packing-store';
import { SceneLights } from './scene-lights';
import { PalletMesh } from './pallet-mesh';
import { CartonMesh } from './carton-mesh';

function SceneFraming() {
  const pallet = usePackingStore((s) => s.session.pallet);
  const [pw, ph, pd] = pallet.dimensions;

  // Pallet center — slightly elevated for better readability
  const target: [number, number, number] = [pw / 2, ph + 20, pd / 2];

  // Camera offset from pallet center: back, up, and to the side
  const camOffset = Math.max(pw, ph, pd) * 1.2;
  const cameraPosition: [number, number, number] = [
    pw / 2 + camOffset * 0.5,
    ph + camOffset * 0.8,
    pd / 2 + camOffset * 0.5,
  ];

  return (
    <>
      <OrbitControls
        makeDefault
        target={target}
        enableDamping
        dampingFactor={0.08}
        minDistance={camOffset * 0.3}
        maxDistance={camOffset * 3}
        maxPolarAngle={Math.PI / 2.05}
      />
      <CameraSetter position={cameraPosition} />
    </>
  );
}

function CameraSetter({ position }: { position: [number, number, number] }) {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(...position);
    camera.updateProjectionMatrix();
  }, [camera, position]);
  return null;
}

export function PackingScene() {
  return (
    <div className="w-full h-full bg-gray-900 rounded-lg overflow-hidden relative">
      <Canvas
        camera={{ position: [0, 0, 0], fov: 50 }}
        className="w-full h-full"
        onPointerMissed={() => usePackingStore.getState().selectCarton(null)}
      >
        <SceneLights />
        <SceneFraming />
        <PalletMesh />
        <CartonMesh />
      </Canvas>
    </div>
  );
}
