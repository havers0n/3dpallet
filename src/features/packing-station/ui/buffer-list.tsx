import { usePackingStore } from '../model/packing-store';

export function BufferList() {
  const bufferItems = usePackingStore((s) => s.session.bufferItems);
  const selectedBufferItemId = usePackingStore((s) => s.selectedBufferItemId);
  const selectBufferItem = usePackingStore((s) => s.selectBufferItem);

  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-700 mb-2">Buffer Items ({bufferItems.length})</h2>
      {bufferItems.length === 0 ? (
        <p className="text-sm text-gray-400 italic">No items in buffer</p>
      ) : (
        <div className="space-y-1">
          {bufferItems.map((item) => (
            <button
              key={item.id}
              onClick={() => selectBufferItem(selectedBufferItemId === item.id ? null : item.id)}
              className={`w-full text-left px-3 py-2 rounded-lg border transition-colors ${
                selectedBufferItemId === item.id
                  ? 'bg-green-100 border-green-400'
                  : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
              }`}
            >
              <div className="font-medium text-gray-800">{item.name}</div>
              <div className="text-xs text-gray-500">{item.sku}</div>
              <div className="text-xs text-gray-500">
                {item.dimensions.join(' × ')} cm · {item.weight} kg
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
