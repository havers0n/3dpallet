import { useEffect } from 'react';
import { usePackingStore } from '../model/packing-store';
import { RightPanel } from './right-panel';
import { PackingScene } from '../scene/packing-scene';

export function PackingStationPage() {
  const hydrateDemoSession = usePackingStore((s) => s.hydrateDemoSession);

  useEffect(() => {
    hydrateDemoSession();
  }, [hydrateDemoSession]);

  return (
    <div className="flex h-screen w-full bg-gray-100">
      {/* Center: 3D Scene */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow px-4 py-3">
          <h1 className="text-lg font-semibold text-gray-800">Packing Station</h1>
        </header>
        <main className="flex-1 p-4">
          <PackingScene />
        </main>
      </div>

      {/* Right Panel */}
      <RightPanel />
    </div>
  );
}
