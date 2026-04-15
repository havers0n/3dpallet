import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { SceneLights } from './scene-lights';
import { PalletMesh } from './pallet-mesh';
import { CartonMesh } from './carton-mesh';

export function PackingScene() {
  return (
    <div className="w-full h-full bg-gray-900 rounded-lg overflow-hidden relative">
      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
        <span className="text-white/30 text-sm font-medium">3D pallet scene</span>
      </div>
      <Canvas
        camera={{ position: [150, 120, 150], fov: 50 }}
        className="w-full h-full"
      >
        <SceneLights />
        <OrbitControls />
        <PalletMesh />
        <CartonMesh />
      </Canvas>
    </div>
  );
}
