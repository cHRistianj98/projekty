import { useState } from "react";
import { X } from "lucide-react";

import {
  assetCategoryLabels,
  getAssetCategory,
  type Asset,
  type AssetCategory,
} from "../../types/Asset";

type EditAssetModalProps = {
  asset: Asset;
  onClose: () => void;
  onUpdate: (asset: Asset) => void;
};

const availableColors = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#f97316",
  "#6366f1",
  "#a855f7",
  "#ec4899",
  "#64748b",
];

const categories = Object.entries(assetCategoryLabels) as [
  AssetCategory,
  string,
][];

export function EditAssetModal({
  asset,
  onClose,
  onUpdate,
}: EditAssetModalProps) {
  const [name, setName] = useState(asset.name);
  const [value, setValue] = useState(asset.value.toString());
  const [category, setCategory] =
    useState<AssetCategory>(getAssetCategory(asset));
  const [color, setColor] = useState(asset.color);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const numericValue = Number(value);

    if (
      name.trim() === "" ||
      numericValue < 0 ||
      Number.isNaN(numericValue)
    ) {
      return;
    }

    onUpdate({
      ...asset,
      name: name.trim(),
      value: numericValue,
      color,
      category,
    });

    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-800 bg-[#0b1322] shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold">Edytuj aktywo</h2>
            <p className="mt-1 text-sm text-slate-500">
              Zmień dane pozycji w portfelu
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-800 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Nazwa aktywa
            </label>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Kategoria
            </label>
            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value as AssetCategory)
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-blue-500"
            >
              {categories.map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
            {!asset.category && (
              <p className="mt-2 text-xs leading-5 text-amber-400/80">
                To starsze aktywo nie miało kategorii. Wybierz właściwą
                i zapisz — od tej chwili Engine będzie je klasyfikował.
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Aktualna wartość
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="0.01"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 pr-14 text-white outline-none transition focus:border-blue-500"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                zł
              </span>
            </div>
          </div>

          <div>
            <label className="mb-3 block text-sm font-medium text-slate-300">
              Kolor
            </label>
            <div className="flex flex-wrap gap-3">
              {availableColors.map((availableColor) => (
                <button
                  key={availableColor}
                  type="button"
                  onClick={() => setColor(availableColor)}
                  className={`h-9 w-9 rounded-full transition ${
                    color === availableColor
                      ? "scale-110 ring-2 ring-white ring-offset-2 ring-offset-[#0b1322]"
                      : "hover:scale-110"
                  }`}
                  style={{ backgroundColor: availableColor }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
            >
              Anuluj
            </button>
            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold transition hover:bg-blue-500"
            >
              Zapisz zmiany
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
