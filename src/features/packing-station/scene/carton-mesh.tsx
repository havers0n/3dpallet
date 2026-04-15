import * as THREE from 'three';
import { usePackingStore } from '../model/packing-store';
import { getCartonDimensions } from '../../../domain/packing/carton-layout';

export function CartonMesh() {
  const cartons = usePackingStore((s) => s.session.pallet.cartons);
  const presets = usePackingStore((s) => s.session.availablePresets);
  const selectedCartonId = usePackingStore((s) => s.selectedCartonId);

  return (
    <group>
      {cartons.map((carton) => {
        const isSelected = carton.id === selectedCartonId;
        const [w, h, d] = getCartonDimensions(carton, presets);
        const [x, _y, z] = carton.palletPosition;

        return (
          <group key={carton.id} position={[x + w / 2, h / 2, z + d / 2]}>
            <mesh>
              <boxGeometry args={[w, h, d]} />
              <meshStandardMaterial
                color={isSelected ? '#3B82F6' : '#D4A574'}
                transparent
                opacity={0.8}
              />
            </mesh>
            {/* Wireframe edge */}
            <lineSegments>
              <edgesGeometry attach="geometry" args={[new THREE.BoxGeometry(w, h, d)]} />
              <lineBasicMaterial color={isSelected ? '#1D4ED8' : '#8B6914'} />
            </lineSegments>
          </group>
        );
      })}
    </group>
  );
}
