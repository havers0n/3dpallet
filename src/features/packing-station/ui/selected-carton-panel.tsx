import { usePackingStore } from '../model/packing-store';
import { getCartonWeight, getSelectedCarton } from '../model/packing-selectors';

export function SelectedCartonPanel() {
  const selectedCarton = usePackingStore(getSelectedCarton);
  const deleteCarton = usePackingStore((s) => s.deleteCarton);
  const unpackItem = usePackingStore((s) => s.unpackItemFromCarton);
  const selectedPackedItemId = usePackingStore((s) => s.selectedPackedItemId);
  const selectPackedItem = usePackingStore((s) => s.selectPackedItem);
  const cartonMoveModeCartonId = usePackingStore((s) => s.cartonMoveModeCartonId);
  const moveValidationMessage = usePackingStore((s) => s.moveValidationMessage);
  const enterCartonMoveMode = usePackingStore((s) => s.enterCartonMoveMode);
  const cancelCartonMoveMode = usePackingStore((s) => s.cancelCartonMoveMode);
  const rotateSelectedCarton90 = usePackingStore((s) => s.rotateSelectedCarton90);

  if (!selectedCarton) {
    return (
      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-700">Выбранная коробка</h2>
        <p className="rounded border border-slate-200 bg-slate-50 p-3 text-sm text-slate-400">
          Коробка не выбрана
        </p>
      </section>
    );
  }

  const isMoveModeActive = cartonMoveModeCartonId === selectedCarton.id;

  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold text-slate-700">Выбранная коробка</h2>
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <div className="font-medium text-slate-800">{selectedCarton.label}</div>
        <div className="mt-1 text-xs text-slate-500">Товаров: {selectedCarton.items.length}</div>
        <div className="text-xs text-slate-500">
          Вес: {getCartonWeight(selectedCarton).toFixed(1)} кг
        </div>

        {selectedCarton.items.length > 0 && (
          <div className="mt-2 border-t border-slate-200 pt-2">
            <div className="mb-1 text-xs font-medium text-slate-600">Содержимое</div>
            {selectedCarton.items.map((pi) => (
              <div
                key={pi.item.id}
                className={`flex items-center justify-between gap-2 rounded px-2 py-1 text-xs transition-colors ${
                  selectedPackedItemId === pi.item.id
                    ? 'bg-yellow-100 text-yellow-900'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <button
                  type="button"
                  onClick={() => selectPackedItem(selectedPackedItemId === pi.item.id ? null : pi.item.id)}
                  className="min-w-0 flex-1 truncate text-left"
                >
                  {pi.item.name}
                </button>
                <button
                  type="button"
                  onClick={() => unpackItem(pi.item.id, selectedCarton.id)}
                  className="shrink-0 rounded border border-amber-300 bg-amber-100 px-2 py-0.5 text-xs text-amber-800 transition-colors hover:bg-amber-200"
                >
                  Вернуть
                </button>
              </div>
            ))}
          </div>
        )}

        {isMoveModeActive && (
          <div className="mt-3 rounded-md border border-yellow-100 bg-yellow-50 p-2 text-xs text-yellow-700">
            Режим перемещения активен. Перетащите коробку по паллете или нажмите на пустое место для отмены.
          </div>
        )}
        {moveValidationMessage && (
          <div className="mt-2 rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
            {moveValidationMessage}
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => deleteCarton(selectedCarton.id)}
            className="rounded bg-red-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-red-700"
          >
            Удалить
          </button>
          <button
            type="button"
            onClick={() => rotateSelectedCarton90()}
            className="rounded bg-indigo-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-indigo-700"
          >
            Повернуть 90°
          </button>
          {!isMoveModeActive ? (
            <button
              type="button"
              onClick={() => enterCartonMoveMode(selectedCarton.id)}
              className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-blue-700"
            >
              Переместить
            </button>
          ) : (
            <button
              type="button"
              onClick={() => cancelCartonMoveMode()}
              className="rounded bg-slate-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-slate-700"
            >
              Отменить перемещение
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
