import { PresetList } from './preset-list';
import { BufferList } from './buffer-list';
import { SelectedCartonPanel } from './selected-carton-panel';

export function RightPanel() {
  return (
    <aside className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
      <div className="p-4 space-y-6">
        <PresetList />
        <BufferList />
        <SelectedCartonPanel />
      </div>
    </aside>
  );
}
