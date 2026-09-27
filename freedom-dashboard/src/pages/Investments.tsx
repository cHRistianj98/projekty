import { useState } from "react";
import type { ElementType } from "react";

import {
  ChartNoAxesCombined,
  CircleDollarSign,
  Plus,
  TrendingUp,
  Pencil,
  Trash2,
} from "lucide-react";

import { AddAssetModal } from "../components/investments/AddAssetModal";
import { EditAssetModal } from "../components/investments/EditAssetModal";

import {
  assetCategoryLabels,
  getAssetCategory,
  type Asset,
} from "../types/Asset";

import {
  calculateAssetPercentage,
  calculateNetWorth,
} from "../utils/portfolio";

type InvestmentsProps = {
  portfolio: Asset[];
  onAddAsset: (asset: Asset) => void;
  onUpdateAsset: (asset: Asset) => void;
  onDeleteAsset: (id: number) => void;
};

export function Investments({
  portfolio,
  onAddAsset,
  onUpdateAsset,
  onDeleteAsset,
}: InvestmentsProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  const portfolioValue = calculateNetWorth(portfolio);

  const largestAsset =
    portfolio.length > 0
      ? portfolio.reduce((largest, asset) =>
          asset.value > largest.value ? asset : largest
        )
      : null;

  function handleDelete(asset: Asset) {
    if (!window.confirm(`Usunąć "${asset.name}" z portfela?`)) return;
    onDeleteAsset(asset.id);
  }

  return (
    <main className="min-h-screen p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
            <ChartNoAxesCombined size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Inwestycje</h1>
            <p className="mt-1 text-sm text-slate-500">
              Twój portfel aktywów
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold transition hover:bg-blue-500"
        >
          <Plus size={18} />
          Dodaj aktywo
        </button>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
        <SummaryCard
          icon={CircleDollarSign}
          label="Wartość portfela"
          value={`${portfolioValue.toLocaleString("pl-PL")} zł`}
        />
        <SummaryCard
          icon={ChartNoAxesCombined}
          label="Liczba aktywów"
          value={portfolio.length.toString()}
        />
        <SummaryCard
          icon={TrendingUp}
          label="Największa pozycja"
          value={largestAsset ? largestAsset.name : "Brak"}
        />
      </div>

      <section className="mt-8 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70">
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold">Portfel</h2>
            <p className="mt-1 text-sm text-slate-500">
              Aktualna struktura majątku
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500">Łącznie</div>
            <div className="text-xl font-bold">
              {portfolioValue.toLocaleString("pl-PL")} zł
            </div>
          </div>
        </div>

        <div className="grid grid-cols-[1fr_170px_180px_120px_110px] border-b border-slate-800 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-600">
          <span>Aktywo</span>
          <span>Kategoria</span>
          <span className="text-right">Wartość</span>
          <span className="text-right">Udział</span>
          <span className="text-right">Akcje</span>
        </div>

        {portfolio.length === 0 && (
          <div className="px-6 py-12 text-center">
            <p className="text-slate-400">Twój portfel jest pusty.</p>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="mt-3 text-sm font-semibold text-blue-400 hover:text-blue-300"
            >
              Dodaj pierwsze aktywo
            </button>
          </div>
        )}

        {portfolio.map((asset) => {
          const percentage = calculateAssetPercentage(
            asset.value,
            portfolioValue
          );
          const category = getAssetCategory(asset);

          return (
            <div
              key={asset.id}
              className="grid grid-cols-[1fr_170px_180px_120px_110px] items-center border-b border-slate-800/60 px-6 py-5 last:border-b-0 transition hover:bg-slate-800/30"
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: asset.color }}
                />
                <span className="font-medium">{asset.name}</span>
              </div>

              <div>
                <span
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                    asset.category
                      ? "bg-blue-500/10 text-blue-400"
                      : "bg-amber-500/10 text-amber-400"
                  }`}
                >
                  {asset.category
                    ? assetCategoryLabels[category]
                    : "Do przypisania"}
                </span>
              </div>

              <span className="text-right font-semibold">
                {asset.value.toLocaleString("pl-PL")} zł
              </span>

              <span className="text-right text-slate-400">
                {percentage.toFixed(1)}%
              </span>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  title="Edytuj"
                  onClick={() => setEditingAsset(asset)}
                  className="rounded-lg p-2 text-slate-500 transition hover:bg-blue-500/10 hover:text-blue-400"
                >
                  <Pencil size={17} />
                </button>
                <button
                  type="button"
                  title="Usuń"
                  onClick={() => handleDelete(asset)}
                  className="rounded-lg p-2 text-slate-500 transition hover:bg-red-500/10 hover:text-red-400"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </div>
          );
        })}
      </section>

      {isAddModalOpen && (
        <AddAssetModal
          onClose={() => setIsAddModalOpen(false)}
          onAdd={onAddAsset}
        />
      )}

      {editingAsset && (
        <EditAssetModal
          asset={editingAsset}
          onClose={() => setEditingAsset(null)}
          onUpdate={onUpdateAsset}
        />
      )}
    </main>
  );
}

type SummaryCardProps = {
  icon: ElementType;
  label: string;
  value: string;
};

function SummaryCard({
  icon: Icon,
  label,
  value,
}: SummaryCardProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
        <Icon size={20} />
      </div>
      <div className="mt-4 text-sm text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}
