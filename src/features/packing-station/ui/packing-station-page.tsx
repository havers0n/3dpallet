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
  const selectedCartonId = usePackingStore((s) => s.selectedCartonId);
  const selectedBufferItemId = usePackingStore((s) => s.selectedBufferItemId);
  const packedWeight = usePackingStore(getPackedItemsWeight);
  const fillPercent = usePackingStore(getPalletFillPercent);
  const packDisabledReason = usePackingStore(getPackDisabledReason);
  const hasSelection = Boolean(selectedCartonId || selectedBufferItemId);
  const canShowPackButton = Boolean(selectedCartonId && selectedBufferItemId);

  useEffect(() => {
    hydrateDemoSession();
  }, [hydrateDemoSession]);

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-slate-100 lg:flex-row">
      <div className="flex min-h-0 flex-1 flex-col">
        <header className="shrink-0 border-b border-slate-200 bg-white px-4 py-2 shadow-sm">
          <div className="grid gap-3 xl:grid-cols-[minmax(210px,auto)_1fr_auto] xl:items-center">
            <div className="flex min-w-0 items-center gap-3">
              <div className="min-w-0">
                <h1 className="truncate text-lg font-semibold leading-6 text-slate-900">Станция упаковки</h1>
                <p className="truncate text-xs text-slate-500">Паллет · коробки · буфер товаров</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              <StatusTile label="Коробки" value={cartonCount.toString()} />
              <StatusTile label="Буфер" value={bufferCount.toString()} />
              <StatusTile label="Вес" value={`${packedWeight.toFixed(1)} кг`} />
              <StatusTile label="Паллет" value={`${Math.round(fillPercent)}%`} />
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={undoLastAction}
                disabled={!undoSnapshot}
                className="h-10 rounded border border-slate-300 px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
              >
                {undoSnapshot ? `Отменить: ${undoSnapshot.label}` : 'Отменить'}
              </button>
              <button
                type="button"
                onClick={resetSession}
                className="h-10 rounded border border-red-200 bg-red-50 px-3 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
              >
                Сбросить
              </button>
            </div>
          </div>
          {hasSelection && (
            <div className="mt-2 flex flex-col gap-2 border-t border-slate-100 pt-2 md:flex-row md:items-center">
              {canShowPackButton && (
                <button
                  type="button"
                  onClick={packItem}
                  disabled={Boolean(packDisabledReason)}
                  className="h-11 rounded bg-green-600 px-5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-300 md:min-w-72"
                >
                  Упаковать выбранный товар
                </button>
              )}
              <div className={`text-sm ${packDisabledReason ? 'text-slate-500' : 'text-green-700'}`}>
                {packDisabledReason ?? 'Готово к упаковке'}
              </div>
            </div>
          )}
        </header>
        <main className="min-h-0 flex-1 p-3">
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
    <div className="rounded border border-slate-200 bg-slate-50 px-3 py-1.5">
      <div className="text-[11px] font-medium uppercase tracking-normal text-slate-500">{label}</div>
      <div className="text-base font-semibold leading-5 text-slate-900">{value}</div>
    </div>
  );
}
