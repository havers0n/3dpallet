import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { usePackingStore } from '../model/packing-store';
import { SceneLights } from './scene-lights';
import { PalletMesh } from './pallet-mesh';
import { CartonMesh } from './carton-mesh';
import { getCartonFootprint } from '../../../domain/packing/carton-layout';

type CameraMode = 'iso' | 'top' | 'front';

function SceneFraming({
  cameraMode,
  resetToken,
}: {
  cameraMode: CameraMode;
  resetToken: number;
}) {
  const pallet = usePackingStore((s) => s.session.pallet);
  const presets = usePackingStore((s) => s.session.availablePresets);
  const selectedCartonId = usePackingStore((s) => s.selectedCartonId);
  const moveModeCartonId = usePackingStore((s) => s.cartonMoveModeCartonId);
  const [pw, ph, pd] = pallet.dimensions;
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const { camera } = useThree();
  const selectedCarton = pallet.cartons.find((carton) => carton.id === selectedCartonId);

  const target = useMemo<[number, number, number]>(() => {
    if (!selectedCarton) {
      return [pw / 2, ph + 20, pd / 2];
    }

    const [cw, ch, cd] = getCartonFootprint(selectedCarton, presets);
    const [x, y, z] = selectedCarton.palletPosition;
    return [x + cw / 2, ph + y + ch / 2, z + cd / 2];
  }, [pd, ph, presets, pw, selectedCarton]);

  const camOffset = Math.max(pw, ph, pd) * (selectedCarton ? 0.95 : 1.25);
  const cameraPosition = useMemo<[number, number, number]>(() => {
    if (cameraMode === 'top') {
      return [target[0], target[1] + camOffset * 1.25, target[2] + 0.01];
    }
    if (cameraMode === 'front') {
      return [target[0], target[1] + camOffset * 0.35, target[2] + camOffset * 1.05];
    }
    return [
      target[0] + camOffset * 0.48,
      target[1] + camOffset * 0.72,
      target[2] + camOffset * 0.58,
    ];
  }, [camOffset, cameraMode, target]);

  useEffect(() => {
    camera.position.set(cameraPosition[0], cameraPosition[1], cameraPosition[2]);
    camera.lookAt(target[0], target[1], target[2]);
    camera.updateProjectionMatrix();
    controlsRef.current?.target.set(target[0], target[1], target[2]);
    controlsRef.current?.update();
  }, [camera, cameraPosition, resetToken, target]);

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enabled={!moveModeCartonId}
      target={target}
      enableDamping
      dampingFactor={0.08}
      minDistance={camOffset * 0.25}
      maxDistance={camOffset * 3.2}
      maxPolarAngle={cameraMode === 'top' ? Math.PI / 2 : Math.PI / 2.05}
    />
  );
}

function CameraHud({
  cameraMode,
  onCameraModeChange,
  onResetView,
}: {
  cameraMode: CameraMode;
  onCameraModeChange: (mode: CameraMode) => void;
  onResetView: () => void;
}) {
  return (
    <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-2 rounded-md border border-white/10 bg-slate-950/70 p-2 shadow-lg backdrop-blur">
      <CameraButton active={cameraMode === 'iso'} onClick={() => onCameraModeChange('iso')}>
        Iso
      </CameraButton>
      <CameraButton active={cameraMode === 'top'} onClick={() => onCameraModeChange('top')}>
        Top
      </CameraButton>
      <CameraButton active={cameraMode === 'front'} onClick={() => onCameraModeChange('front')}>
        Front
      </CameraButton>
      <button
        type="button"
        onClick={onResetView}
        className="rounded border border-slate-500 px-2.5 py-1 text-xs font-medium text-slate-100 transition-colors hover:border-white hover:bg-white/10"
      >
        Reset view
      </button>
    </div>
  );
}

function CameraButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors ${
        active
          ? 'bg-sky-400 text-slate-950'
          : 'border border-slate-500 text-slate-100 hover:border-white hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  );
}

export function PackingScene() {
  const [cameraMode, setCameraMode] = useState<CameraMode>('iso');
  const [resetToken, setResetToken] = useState(0);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg bg-gray-900">
      <CameraHud
        cameraMode={cameraMode}
        onCameraModeChange={setCameraMode}
        onResetView={() => setResetToken((token) => token + 1)}
      />
      <Canvas
        camera={{ position: [0, 0, 0], fov: 50 }}
        className="h-full w-full"
        shadows
        onPointerMissed={() => {
          const state = usePackingStore.getState();
          if (state.cartonMoveModeCartonId) {
            state.cancelCartonMoveMode();
          } else {
            state.selectCarton(null);
          }
        }}
      >
        <color attach="background" args={['#111827']} />
        <SceneLights />
        <SceneFraming cameraMode={cameraMode} resetToken={resetToken} />
        <PalletMesh />
        <CartonMesh />
      </Canvas>
    </div>
  );
}
