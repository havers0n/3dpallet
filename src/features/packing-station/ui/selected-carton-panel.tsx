import { usePackingStore } from '../model/packing-store';
import { getSelectedCarton, getCartonWeight } from '../model/packing-selectors';

export function SelectedCartonPanel() {
  const selectedCarton = usePackingStore(getSelectedCarton);
  const deleteCarton = usePackingStore((s) => s.deleteCarton);
  const packItem = usePackingStore((s) => s.packSelectedItemIntoSelectedCarton);
  const unpackItem = usePackingStore((s) => s.unpackItemFromCarton);
  const selectedBufferItemId = usePackingStore((s) => s.selectedBufferItemId);
  const selectedPackedItemId = usePackingStore((s) => s.selectedPackedItemId);
  const selectPackedItem = usePackingStore((s) => s.selectPackedItem);
  const cartonMoveModeCartonId = usePackingStore((s) => s.cartonMoveModeCartonId);
  const moveValidationMessage = usePackingStore((s) => s.moveValidationMessage);
  const enterCartonMoveMode = usePackingStore((s) => s.enterCartonMoveMode);
  const cancelCartonMoveMode = usePackingStore((s) => s.cancelCartonMoveMode);
  const rotateSelectedCarton90 = usePackingStore((s) => s.rotateSelectedCarton90);

  if (!selectedCarton) {
    return (
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-2">Selected Carton</h2>
        <p className="text-sm text-gray-400 italic">No carton selected</p>
      </div>
    );
  }

  const isMoveModeActive = cartonMoveModeCartonId === selectedCarton.id;

  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-700 mb-2">Selected Carton</h2>
      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
        <div className="font-medium text-gray-800">{selectedCarton.label}</div>
        <div className="text-xs text-gray-500 mt-1">
          Items: {selectedCarton.items.length}
        </div>
        <div className="text-xs text-gray-500">
          Weight: {getCartonWeight(selectedCarton).toFixed(1)} kg
        </div>

        {selectedCarton.items.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="text-xs font-medium text-gray-600 mb-1">Contents:</div>
            {selectedCarton.items.map((pi) => (
              <div
                key={pi.item.id}
                className={`flex items-center justify-between gap-2 rounded px-2 py-1 text-xs transition-colors ${
                  selectedPackedItemId === pi.item.id
                    ? 'bg-yellow-100 text-yellow-900'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <button
                  onClick={() => selectPackedItem(selectedPackedItemId === pi.item.id ? null : pi.item.id)}
                  className="min-w-0 flex-1 truncate text-left"
                >
                  {pi.item.name}
                </button>
                <button
                  onClick={() => unpackItem(pi.item.id, selectedCarton.id)}
                  className="shrink-0 rounded border border-amber-300 bg-amber-100 px-2 py-0.5 text-xs text-amber-800 transition-colors hover:bg-amber-200"
                >
                  Unpack
                </button>
              </div>
            ))}
          </div>
        )}

        {isMoveModeActive && (
          <div className="mt-3 text-xs text-yellow-700 bg-yellow-50 rounded-md p-2 border border-yellow-100">
            Move mode active. Drag the carton on the pallet or click empty space to cancel.
          </div>
        )}
        {moveValidationMessage && (
          <div className="mt-2 text-xs text-red-700 bg-red-50 rounded-md p-2 border border-red-200">
            {moveValidationMessage}
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() => packItem()}
            disabled={!selectedBufferItemId}
            className="flex-1 min-w-[140px] px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm rounded transition-colors"
          >
            Pack Selected Item
          </button>
          <button
            onClick={() => deleteCarton(selectedCarton.id)}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
          >
            Delete
          </button>
          <button
            onClick={() => rotateSelectedCarton90()}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded transition-colors"
          >
            Rotate 90°
          </button>
          {!isMoveModeActive ? (
            <button
              onClick={() => enterCartonMoveMode(selectedCarton.id)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
            >
              Move
            </button>
          ) : (
            <button
              onClick={() => cancelCartonMoveMode()}
              className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors"
            >
              Cancel Move
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
