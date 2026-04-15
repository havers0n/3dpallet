import { usePackingStore } from '../model/packing-store';
import { getSelectedCarton, getCartonWeight } from '../model/packing-selectors';

export function SelectedCartonPanel() {
  const selectedCarton = usePackingStore(getSelectedCarton);
  const deleteCarton = usePackingStore((s) => s.deleteCarton);
  const packItem = usePackingStore((s) => s.packSelectedItemIntoSelectedCarton);
  const selectedBufferItemId = usePackingStore((s) => s.selectedBufferItemId);

  if (!selectedCarton) {
    return (
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-2">Selected Carton</h2>
        <p className="text-sm text-gray-400 italic">No carton selected</p>
      </div>
    );
  }

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
              <div key={pi.item.id} className="text-xs text-gray-500 flex justify-between items-center py-1">
                <span>{pi.item.name}</span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-3 flex gap-2">
          <button
            onClick={() => packItem()}
            disabled={!selectedBufferItemId}
            className="flex-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm rounded transition-colors"
          >
            Pack Selected Item
          </button>
          <button
            onClick={() => deleteCarton(selectedCarton.id)}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
