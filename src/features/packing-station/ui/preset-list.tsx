import { usePackingStore } from '../model/packing-store';

export function PresetList() {
  const presets = usePackingStore((s) => s.session.availablePresets);
  const createCartonFromPreset = usePackingStore((s) => s.createCartonFromPreset);
  const createCartonMessage = usePackingStore((s) => s.createCartonMessage);

  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-700 mb-2">Carton Presets</h2>
      <div className="space-y-2">
        {presets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => createCartonFromPreset(preset.id)}
            className="w-full text-left px-3 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
          >
            <div className="font-medium text-blue-800">{preset.name}</div>
            <div className="text-xs text-blue-600">
              {preset.dimensions.join(' × ')} cm · {preset.maxWeight} kg max
            </div>
          </button>
        ))}
      </div>
      {createCartonMessage && (
        <div className="mt-2 text-xs text-red-700 bg-red-50 rounded-md p-2 border border-red-200">
          {createCartonMessage}
        </div>
      )}
    </div>
  );
}
