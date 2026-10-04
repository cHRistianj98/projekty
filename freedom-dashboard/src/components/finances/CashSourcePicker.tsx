import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, ChevronRight, WalletCards } from "lucide-react";
import type { Asset } from "../../types/Asset";
import { getAssetCategory, getAssetIconKey } from "../../types/Asset";
import type { PortfolioWallet } from "../../types/Portfolio";
import { AssetIcon } from "../investments/assetIcons";
import { WalletIcon } from "../investments/PortfolioDialogs";

type CashSourcePickerProps = {
  assets: Asset[];
  wallets: PortfolioWallet[];
  value?: number;
  onChange: (assetId: number) => Promise<void> | void;
  variant?: "compact" | "field";
  disabled?: boolean;
  tone?: "blue" | "emerald";
  title?: string;
};

type PickerPosition = {
  top: number;
  left: number;
  width: number;
};

export function CashSourcePicker({
  assets,
  wallets,
  value,
  onChange,
  variant = "field",
  disabled = false,
  tone = "blue",
  title,
}: CashSourcePickerProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [position, setPosition] = useState<PickerPosition | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);

  const walletById = useMemo(
    () => new Map(wallets.map((wallet) => [wallet.id, wallet])),
    [wallets]
  );

  const cashAssets = useMemo(
    () => assets
      .filter((asset) => asset.systemCash || getAssetCategory(asset) === "cash")
      .slice()
      .sort((a, b) => {
        const walletA = walletById.get(a.portfolioId ?? -1);
        const walletB = walletById.get(b.portfolioId ?? -1);
        const mainA = isMainWallet(walletA);
        const mainB = isMainWallet(walletB);

        // 1) wszystko z portfela Głównego zawsze na początku
        // 2) potem pozostałe aktywa po prostu od największego salda
        if (mainA !== mainB) return mainA ? -1 : 1;
        if (b.value !== a.value) return b.value - a.value;

        return (walletA?.name ?? "").localeCompare(walletB?.name ?? "", "pl")
          || a.name.localeCompare(b.name, "pl");
      }),
    [assets, walletById]
  );

  const selectedAsset = cashAssets.find((asset) => asset.id === value);
  const selectedWallet = selectedAsset?.portfolioId == null
    ? undefined
    : walletById.get(selectedAsset.portfolioId);

  function updatePosition() {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const width = Math.min(430, Math.max(310, window.innerWidth - 24));
    const maxLeft = Math.max(12, window.innerWidth - width - 12);
    const left = Math.min(Math.max(12, rect.left), maxLeft);
    const estimatedHeight = Math.min(410, 92 + cashAssets.length * 68);
    const roomBelow = window.innerHeight - rect.bottom - 12;
    const top = roomBelow >= Math.min(estimatedHeight, 300)
      ? rect.bottom + 8
      : Math.max(12, rect.top - estimatedHeight - 8);

    setPosition({ top, left, width });
  }

  useEffect(() => {
    if (!open) return;
    updatePosition();

    const onPointerDown = (event: MouseEvent) => {
      const node = event.target as Node;
      if (triggerRef.current?.contains(node) || popupRef.current?.contains(node)) return;
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onViewportChange = () => updatePosition();

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onViewportChange);
    window.addEventListener("scroll", onViewportChange, true);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onViewportChange);
      window.removeEventListener("scroll", onViewportChange, true);
    };
  }, [open, cashAssets.length]);

  async function choose(assetId: number) {
    if (busy) return;
    if (assetId === value) {
      setOpen(false);
      return;
    }

    setBusy(true);
    setError("");
    try {
      await onChange(assetId);
      setOpen(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Nie udało się zmienić źródła pieniędzy.");
    } finally {
      setBusy(false);
    }
  }

  const trigger = variant === "compact" ? (
    <button
      ref={triggerRef}
      type="button"
      disabled={disabled || !cashAssets.length}
      onClick={() => {
        setError("");
        setOpen((current) => !current);
      }}
      className={`group/source inline-flex min-w-0 cursor-pointer items-center gap-2 rounded-xl border px-2 py-1.5 text-left shadow-sm transition hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-50 ${
        selectedAsset?.systemCash
          ? "border-amber-400/25 bg-amber-400/[0.07] hover:border-amber-300/45"
          : "border-cyan-400/20 bg-cyan-400/[0.055] hover:border-cyan-300/40"
      }`}
      title={title ?? "Kliknij, aby zmienić źródło pieniędzy"}
    >
      <PortfolioVisual wallet={selectedWallet} compact />
      <span className="min-w-0">
        <span className={`block max-w-28 truncate text-[10px] font-black ${selectedAsset?.systemCash ? "text-amber-300" : "text-slate-300"}`}>
          {selectedWallet?.name ?? "Portfel"}
        </span>
      </span>
      <ChevronRight size={11} className="shrink-0 text-slate-600" />
      <AssetVisual asset={selectedAsset} compact />
      <span className="min-w-0">
        <span className={`block max-w-40 truncate text-[10px] font-black ${selectedAsset?.systemCash ? "text-amber-300" : "text-slate-200"}`}>
          {selectedAsset ? assetDisplayName(selectedAsset) : "Wybierz źródło"}
        </span>
      </span>
      <ChevronDown size={12} className={`ml-0.5 shrink-0 text-slate-500 transition ${open ? "rotate-180" : ""}`} />
    </button>
  ) : (
    <button
      ref={triggerRef}
      type="button"
      disabled={disabled || !cashAssets.length}
      onClick={() => {
        setError("");
        setOpen((current) => !current);
      }}
      className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border bg-slate-950/55 px-3 py-3 text-left transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50 ${
        open
          ? tone === "emerald" ? "border-emerald-500/60 ring-2 ring-emerald-500/10" : "border-blue-500/60 ring-2 ring-blue-500/10"
          : "border-slate-700 hover:border-slate-600"
      }`}
    >
      <PortfolioVisual wallet={selectedWallet} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-xs font-black text-slate-200">{selectedWallet?.name ?? "Portfel"}</span>
          <ChevronRight size={12} className="shrink-0 text-slate-600" />
          <span className="truncate text-sm font-black text-white">
            {selectedAsset ? assetDisplayName(selectedAsset) : "Wybierz źródło"}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-500">
          {selectedAsset && <><AssetVisual asset={selectedAsset} compact /><span>{assetTypeLabel(selectedAsset)}</span><span>•</span><span className={selectedAsset.value < 0 ? "font-bold text-amber-300" : ""}>{money(selectedAsset.value)}</span></>}
        </div>
      </div>
      <ChevronDown size={17} className={`shrink-0 text-slate-500 transition ${open ? "rotate-180" : ""}`} />
    </button>
  );

  return (
    <>
      {trigger}
      {open && position && typeof document !== "undefined" && createPortal(
        <div
          ref={popupRef}
          className="fixed z-[10000] overflow-hidden rounded-2xl border border-slate-700/90 bg-[#081321] shadow-[0_24px_80px_rgba(0,0,0,.72)]"
          style={{ top: position.top, left: position.left, width: position.width } as CSSProperties}
        >
          <div className="border-b border-slate-800 bg-[#0b1727] px-4 py-3">
            <p className="text-sm font-black text-slate-100">Wybierz źródło pieniędzy</p>
            <p className="mt-0.5 text-[10px] leading-4 text-slate-500">Tylko konta, gotówka i środki nierozdzielone.</p>
          </div>

          <div className="max-h-[330px] space-y-2 overflow-y-auto p-2">
            {cashAssets.map((asset) => {
              const wallet = asset.portfolioId == null ? undefined : walletById.get(asset.portfolioId);
              const selected = asset.id === value;
              return (
                <button
                  key={asset.id}
                  type="button"
                  disabled={busy}
                  onClick={() => void choose(asset.id)}
                  className={`grid w-full cursor-pointer grid-cols-[48px_minmax(0,1fr)_18px_48px_minmax(0,1fr)_22px] items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition disabled:cursor-wait disabled:opacity-60 ${
                    selected
                      ? "border-blue-400/40 bg-blue-500/[0.09] shadow-[inset_0_0_24px_rgba(59,130,246,.05)]"
                      : "border-slate-800 bg-slate-950/45 hover:border-slate-700 hover:bg-slate-900/90"
                  }`}
                >
                  <PortfolioVisual wallet={wallet} />
                  <div className="min-w-0">
                    <span className="block truncate text-[9px] font-bold uppercase tracking-[.12em] text-slate-600">Portfel</span>
                    <span className="mt-0.5 block truncate text-xs font-black text-slate-200">{wallet?.name ?? "Portfel"}</span>
                  </div>
                  <ChevronRight size={14} className="text-slate-600" />
                  <AssetVisual asset={asset} />
                  <div className="min-w-0">
                    <span className="block truncate text-xs font-black text-white">{assetDisplayName(asset)}</span>
                    <span className={`mt-0.5 block truncate text-[10px] ${asset.value < 0 ? "font-bold text-amber-300" : "text-slate-500"}`}>
                      {assetTypeLabel(asset)} · {money(asset.value)}
                    </span>
                  </div>
                  {selected ? <Check size={17} className="text-blue-300" /> : <span />}
                </button>
              );
            })}
          </div>

          {error && (
            <p className="border-t border-red-500/20 bg-red-500/[0.07] px-4 py-2.5 text-[10px] text-red-300">{error}</p>
          )}
        </div>,
        document.body
      )}
    </>
  );
}

function PortfolioVisual({ wallet, compact = false }: { wallet?: PortfolioWallet; compact?: boolean }) {
  const size = compact ? "h-6 w-6 rounded-md" : "h-11 w-11 rounded-xl";
  if (wallet?.imageUrl) {
    return (
      <span className={`relative grid shrink-0 place-items-center overflow-hidden border border-white/10 bg-slate-900 ${size}`}>
        <img
          src={wallet.imageUrl}
          alt=""
          className="h-full w-full object-cover"
          style={{ objectPosition: wallet.imagePosition ?? "center" }}
        />
        <span className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
      </span>
    );
  }

  return (
    <span
      className={`grid shrink-0 place-items-center border border-white/10 bg-slate-900 ${size}`}
      style={{ color: wallet?.color ?? "#7dd3fc" }}
    >
      <WalletIcon name={wallet?.iconKey ?? "wallet"} size={compact ? 12 : 19} />
    </span>
  );
}

function AssetVisual({ asset, compact = false }: { asset?: Asset; compact?: boolean }) {
  const size = compact ? "h-6 w-6 rounded-md" : "h-11 w-11 rounded-xl";
  const color = asset?.systemCash ? "#fbbf24" : asset?.color ?? "#34d399";
  return (
    <span
      className={`grid shrink-0 place-items-center border border-white/10 ${size}`}
      style={{ color, backgroundColor: `${color}12` }}
    >
      {asset ? <AssetIcon iconKey={getAssetIconKey(asset)} size={compact ? 12 : 19} /> : <WalletCards size={compact ? 12 : 19} />}
    </span>
  );
}

function assetDisplayName(asset: Asset): string {
  return asset.systemCash ? "Środki nierozdzielone" : asset.name;
}

function assetTypeLabel(asset: Asset): string {
  if (asset.systemCash) return "Clearing systemowy";
  if (asset.fxPriced && asset.cashCurrency) return `Gotówka · ${asset.cashCurrency}`;
  return "Gotówka / konto";
}

function money(value: number): string {
  return `${value.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł`;
}


function isMainWallet(wallet?: PortfolioWallet): boolean {
  if (!wallet) return false;
  const normalized = wallet.name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  return wallet.type === "MAIN" || normalized.includes("glowny");
}
