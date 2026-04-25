import { useState } from 'react';
import { PresetList } from './preset-list';
import { BufferList } from './buffer-list';
import { SelectedCartonPanel } from './selected-carton-panel';

type PanelTab = 'presets' | 'buffer' | 'carton';

export function RightPanel() {
  const [activeTab, setActiveTab] = useState<PanelTab>('presets');

  return (
    <aside className="max-h-[44vh] overflow-hidden border-t border-slate-200 bg-white lg:max-h-none lg:w-96 lg:border-l lg:border-t-0">
      <div className="flex border-b border-slate-200 lg:hidden">
        <TabButton active={activeTab === 'presets'} onClick={() => setActiveTab('presets')}>
          Коробки
        </TabButton>
        <TabButton active={activeTab === 'buffer'} onClick={() => setActiveTab('buffer')}>
          Буфер
        </TabButton>
        <TabButton active={activeTab === 'carton'} onClick={() => setActiveTab('carton')}>
          Выбор
        </TabButton>
      </div>
      <div className="h-full overflow-y-auto p-4">
        <div className="hidden space-y-6 lg:block">
          <PresetList />
          <BufferList />
          <SelectedCartonPanel />
        </div>
        <div className="lg:hidden">
          {activeTab === 'presets' && <PresetList />}
          {activeTab === 'buffer' && <BufferList />}
          {activeTab === 'carton' && <SelectedCartonPanel />}
        </div>
      </div>
    </aside>
  );
}

function TabButton({
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
      className={`flex-1 px-3 py-3 text-sm font-semibold transition-colors ${
        active ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
      }`}
    >
      {children}
    </button>
  );
}
