import { usePackingStore } from '../model/packing-store';

export function PresetList() {
  const presets = usePackingStore((s) => s.session.availablePresets);
  const createCartonFromPreset = usePackingStore((s) => s.createCartonFromPreset);
  const createCartonMessage = usePackingStore((s) => s.createCartonMessage);

  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold text-slate-700">Пресеты коробок</h2>
      <div className="grid grid-cols-3 gap-2">
        {presets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => createCartonFromPreset(preset.id)}
            title={`${preset.name}: ${preset.dimensions.join(' × ')} см · до ${preset.maxWeight} кг`}
            aria-label={`Создать ${preset.name}`}
            className="group flex h-20 min-w-0 flex-col items-center justify-center gap-1 rounded border border-blue-200 bg-blue-50 px-2 text-center transition-colors hover:bg-blue-100"
          >
            <span className="relative h-7 w-8 shrink-0">
              <span className="absolute left-1 top-2 h-4 w-5 skew-y-[-18deg] border border-blue-500 bg-blue-100 transition-colors group-hover:bg-blue-200" />
              <span className="absolute left-3 top-0 h-4 w-5 skew-y-[18deg] border border-blue-500 bg-blue-200 transition-colors group-hover:bg-blue-300" />
              <span className="absolute left-3 top-2 h-4 w-5 skew-y-[18deg] border border-blue-500 bg-blue-300 transition-colors group-hover:bg-blue-400" />
            </span>
            <span className="max-w-full truncate text-xs font-semibold text-blue-800">{getPresetShortLabel(preset.name)}</span>
            <span className="text-[10px] leading-3 text-blue-600">до {preset.maxWeight} кг</span>
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

function getPresetShortLabel(name: string): string {
  const [firstWord] = name.trim().split(/\s+/);
  return firstWord || name;
}
