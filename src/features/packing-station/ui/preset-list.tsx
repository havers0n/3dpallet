import { usePackingStore } from '../model/packing-store';

export function PresetList() {
  const presets = usePackingStore((s) => s.session.availablePresets);
  const createCartonFromPreset = usePackingStore((s) => s.createCartonFromPreset);
  const createCartonMessage = usePackingStore((s) => s.createCartonMessage);

  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold text-slate-700">Пресеты коробок</h2>
      <div className="space-y-2">
        {presets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => createCartonFromPreset(preset.id)}
            className="w-full rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-left transition-colors hover:bg-blue-100"
          >
            <div className="font-medium text-blue-800">{preset.name}</div>
            <div className="text-xs text-blue-600">
              {preset.dimensions.join(' × ')} см · до {preset.maxWeight} кг
            </div>
          </button>
        ))}
      </div>
      {createCartonMessage && (
        <div className="mt-2 rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
          {createCartonMessage}
        </div>
      )}
    </section>
  );
}
