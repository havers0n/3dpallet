import { useMemo, useState } from 'react';
import { usePackingStore } from '../model/packing-store';

export function BufferList() {
  const bufferItems = usePackingStore((s) => s.session.bufferItems);
  const selectedBufferItemId = usePackingStore((s) => s.selectedBufferItemId);
  const selectBufferItem = usePackingStore((s) => s.selectBufferItem);
  const [query, setQuery] = useState('');

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return bufferItems;

    return bufferItems.filter((item) => {
      const haystack = `${item.name} ${item.sku}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [bufferItems, query]);

  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-700">Буфер товаров ({bufferItems.length})</h2>
        {query && <span className="text-xs text-slate-400">Найдено: {filteredItems.length}</span>}
      </div>
      <label className="mb-2 block">
        <span className="sr-only">Поиск товаров</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Поиск по названию или SKU"
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </label>
      {bufferItems.length === 0 ? (
        <p className="rounded border border-slate-200 bg-slate-50 p-3 text-sm text-slate-400">
          Буфер пуст
        </p>
      ) : filteredItems.length === 0 ? (
        <p className="rounded border border-slate-200 bg-slate-50 p-3 text-sm text-slate-400">
          Товары не найдены
        </p>
      ) : (
        <div className="space-y-1">
          {filteredItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => selectBufferItem(selectedBufferItemId === item.id ? null : item.id)}
              className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                selectedBufferItemId === item.id
                  ? 'border-green-400 bg-green-100'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
              }`}
            >
              <div className="font-medium text-slate-800">{item.name}</div>
              <div className="text-xs text-slate-500">{item.sku}</div>
              <div className="text-xs text-slate-500">
                {item.dimensions.join(' × ')} см · {item.weight} кг
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
