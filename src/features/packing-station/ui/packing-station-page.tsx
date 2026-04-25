import { useEffect } from 'react';
import { usePackingStore } from '../model/packing-store';
import { RightPanel } from './right-panel';
import { PackingScene } from '../scene/packing-scene';
import {
  getPackDisabledReason,
  getPackedItemsWeight,
  getPalletFillPercent,
} from '../model/packing-selectors';

export function PackingStationPage() {
  const hydrateDemoSession = usePackingStore((s) => s.hydrateDemoSession);
  const packItem = usePackingStore((s) => s.packSelectedItemIntoSelectedCarton);
  const resetSession = usePackingStore((s) => s.resetSession);
  const undoLastAction = usePackingStore((s) => s.undoLastAction);
  const undoSnapshot = usePackingStore((s) => s.undoSnapshot);
  const cartonCount = usePackingStore((s) => s.session.pallet.cartons.length);
  const bufferCount = usePackingStore((s) => s.session.bufferItems.length);
  const packedWeight = usePackingStore(getPackedItemsWeight);
  const fillPercent = usePackingStore(getPalletFillPercent);
  const packDisabledReason = usePackingStore(getPackDisabledReason);

  useEffect(() => {
    hydrateDemoSession();
  }, [hydrateDemoSession]);

  return (
    <div className="flex h-screen w-full flex-col bg-slate-100 lg:flex-row">
      <div className="flex min-h-0 flex-1 flex-col">
        <header className="border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-semibold text-slate-900">Станция упаковки</h1>
              <p className="text-xs text-slate-500">Паллет · коробки · буфер товаров</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={undoLastAction}
                disabled={!undoSnapshot}
                className="rounded border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
              >
                Отменить{undoSnapshot ? `: ${undoSnapshot.label}` : ''}
              </button>
              <button
                type="button"
                onClick={resetSession}
                className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
              >
                Сбросить
              </button>
            </div>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <StatusTile label="Коробки" value={cartonCount.toString()} />
            <StatusTile label="Товары в буфере" value={bufferCount.toString()} />
            <StatusTile label="Упакованный вес" value={`${packedWeight.toFixed(1)} кг`} />
            <StatusTile label="Заполнение паллеты" value={`${Math.round(fillPercent)}%`} />
          </div>
        </header>
        <div className="border-b border-slate-200 bg-white px-4 py-3">
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <button
              type="button"
              onClick={packItem}
              disabled={Boolean(packDisabledReason)}
              className="min-h-12 rounded bg-green-600 px-5 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-300 md:min-w-72"
            >
              Упаковать выбранный товар
            </button>
            <div className={`text-sm ${packDisabledReason ? 'text-slate-500' : 'text-green-700'}`}>
              {packDisabledReason ?? 'Готово к упаковке'}
            </div>
          </div>
        </div>
        <main className="min-h-0 flex-1 p-3 sm:p-4">
          <PackingScene />
        </main>
      </div>

      <RightPanel />
    </div>
  );
}

function StatusTile({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2">
      <div className="text-xs font-medium uppercase tracking-normal text-slate-500">{label}</div>
      <div className="text-lg font-semibold text-slate-900">{value}</div>
    </div>
  );
}
