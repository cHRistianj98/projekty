import { useEffect, useId, useRef, useState, type ReactNode, type FormEvent } from "react";
import { X, Wallet, Shield, Sprout, Clock3, House, Gem, Target, ArrowRight, ArrowRightLeft, ArrowUpRight, ArrowDownLeft, ChevronDown, Coins, LockKeyhole, Plus, CircleCheck, LoaderCircle, Image as ImageIcon, ReceiptText } from "lucide-react";
import type { Asset, AssetCategory, CashCurrency } from "../../types/Asset";
import { getAssetCategory, getAssetIconKey } from "../../types/Asset";
import type { PortfolioTransferInput, PurchaseTargetInput } from "../../api/portfolioApi";
import { marketPriceApi, type FxQuote } from "../../api/marketPriceApi";
import { AssetIcon } from "./assetIcons";
import type { PortfolioImagePosition, PortfolioInput, PortfolioWallet } from "../../types/Portfolio";
import type { FundedGoal } from "./portfolioView";
import { money, portfolioColors } from "./portfolioView";
import { defaultPortfolioImage, portfolioImagePresets, suggestedPortfolioImage } from "./portfolioImages";

export const walletIcons = { wallet: Wallet, shield: Shield, sprout: Sprout, clock: Clock3, house: House, gem: Gem, target: Target };
export function WalletIcon({ name, size = 23 }: { name: string; size?: number }) {
  const Icon = walletIcons[name as keyof typeof walletIcons] ?? Wallet;
  return <Icon size={size} />;
}
export const errorMessage = (error: unknown) => error instanceof Error ? error.message : "Nie udało się zapisać zmian. Spróbuj ponownie.";

export function PortfolioDialog({ title, subtitle, children, onClose, busy = false, wide = false, icon, className = "" }: {
  title: string; subtitle?: string; children: ReactNode; onClose: () => void; busy?: boolean; wide?: boolean; icon?: ReactNode; className?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => { const element = dialog.current; element?.showModal(); return () => element?.close(); }, []);
  return <dialog ref={dialog} className={`investment-dialog ${wide ? "wide" : ""} ${className}`} aria-labelledby={id}
    onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}
    onClick={event => { if (event.target === event.currentTarget && !busy) { const bounds = event.currentTarget.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose(); } }}>
    <header><div className="investment-dialog-heading">{icon && <span className="investment-dialog-icon">{icon}</span>}<div><h2 id={id}>{title}</h2>{subtitle && <p>{subtitle}</p>}</div></div><button type="button" className="investment-icon-button" aria-label="Zamknij" disabled={busy} onClick={onClose}><X size={20}/></button></header>
    {children}
  </dialog>;
}

export function PortfolioForm({ wallet, onClose, onSave }: {
  wallet?: PortfolioWallet; onClose: () => void; onSave: (input: PortfolioInput) => Promise<void>;
}) {
  const [name, setName] = useState(wallet?.name ?? "");
  const [color, setColor] = useState(wallet?.color ?? portfolioColors[0]);
  const [iconKey, setIconKey] = useState(wallet?.iconKey ?? "shield");
  const [target, setTarget] = useState(wallet?.targetAmount?.toString() ?? "");
  const [contribution, setContribution] = useState(String(wallet?.monthlyContribution ?? 0));
  const [imageUrl, setImageUrl] = useState(wallet?.imageUrl ?? defaultPortfolioImage);
  const [imagePosition, setImagePosition] = useState<PortfolioImagePosition>(wallet?.imagePosition ?? "center");
  const [imageTouched, setImageTouched] = useState(Boolean(wallet?.imageUrl));
  const [previewError, setPreviewError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function changeName(value: string) {
    setName(value);
    if (!wallet && !imageTouched) {
      setImageUrl(suggestedPortfolioImage(value));
      setPreviewError(false);
    }
  }

  function chooseImage(url: string) {
    setImageUrl(url);
    setImageTouched(true);
    setPreviewError(false);
  }

  async function submit(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError("");
    try {
      await onSave({
        name: name.trim(),
        color,
        iconKey,
        targetAmount: target ? Number(target) : null,
        monthlyContribution: Number(contribution || 0),
        imageUrl: imageUrl.trim() || null,
        imagePosition,
      });
      onClose();
    } catch (cause) { setError(errorMessage(cause)); } finally { setSaving(false); }
  }

  return <PortfolioDialog title={wallet ? "Edytuj portfel" : "Dodaj portfel"} subtitle="Nadaj swoim pieniądzom kierunek." onClose={onClose} busy={saving} wide>
    <form onSubmit={submit} className="investment-form">
      <label>Nazwa portfela<input autoFocus required maxLength={120} value={name} onChange={event => changeName(event.target.value)} placeholder="np. Długoterminowy" /></label>

      <fieldset className="portfolio-image-fieldset">
        <legend>Grafika portfela</legend>
        <div className="portfolio-image-editor">
          <div className="portfolio-image-preview">
            {imageUrl && !previewError ? (
              <img
                key={imageUrl}
                src={imageUrl}
                alt="Podgląd grafiki portfela"
                style={{ objectPosition: imagePosition }}
                onError={() => setPreviewError(true)}
              />
            ) : (
              <div className="portfolio-image-empty"><ImageIcon size={28}/><span>Brak podglądu</span></div>
            )}
            <div className="portfolio-image-preview-shade"/>
            <strong>{name.trim() || "Twój portfel"}</strong>
          </div>

          <div className="portfolio-image-controls">
            <div className="portfolio-image-presets">
              {portfolioImagePresets.map(preset => (
                <button
                  type="button"
                  key={preset.key}
                  className={imageUrl === preset.url ? "selected" : ""}
                  aria-pressed={imageUrl === preset.url}
                  onClick={() => chooseImage(preset.url)}
                  title={preset.label}
                >
                  <img src={preset.url} alt="" />
                  <span>{preset.label}</span>
                </button>
              ))}
            </div>

            <label>
              Własny adres grafiki
              <input
                value={imageUrl}
                onChange={event => { setImageUrl(event.target.value); setImageTouched(true); setPreviewError(false); }}
                placeholder="/portfolios/long-term.webp lub https://..."
              />
            </label>

            <div>
              <span className="portfolio-image-position-label">Pozycja kadru</span>
              <div className="portfolio-image-position-options">
                {(["top", "center", "bottom"] as PortfolioImagePosition[]).map(position => (
                  <button
                    key={position}
                    type="button"
                    className={imagePosition === position ? "selected" : ""}
                    onClick={() => setImagePosition(position)}
                  >
                    {position === "top" ? "Góra" : position === "bottom" ? "Dół" : "Środek"}
                  </button>
                ))}
                <button type="button" className="remove" onClick={() => { setImageUrl(""); setImageTouched(true); setPreviewError(false); }}>
                  Bez grafiki
                </button>
              </div>
            </div>
          </div>
        </div>
      </fieldset>

      <div className="investment-form-columns">
        <label>Docelowa wartość (zł)<input type="number" min=".01" step=".01" value={target} onChange={event => setTarget(event.target.value)} placeholder="Opcjonalnie" /></label>
        <label>Miesięczna wpłata (zł)<input type="number" min="0" step=".01" value={contribution} onChange={event => setContribution(event.target.value)} /></label>
      </div>
      <p className="investment-note">Wpłata jest planem. Jej ustawienie nie przenosi pieniędzy automatycznie.</p>
      <fieldset><legend>Ikona portfela</legend><div className="investment-icon-options">{Object.entries(walletIcons).filter(([key]) => key !== "target").map(([key, Icon]) =>
        <button type="button" key={key} aria-label={{ wallet: "Portfel", shield: "Tarcza", sprout: "Roślina", clock: "Zegar", house: "Dom", gem: "Diament" }[key]} aria-pressed={iconKey === key} onClick={() => setIconKey(key)} className={iconKey === key ? "selected" : ""}><Icon size={22}/></button>)}</div></fieldset>
      <fieldset><legend>Kolor portfela</legend><div className="investment-color-options">{portfolioColors.map(item =>
        <button type="button" key={item} aria-label={`Kolor ${item}`} aria-pressed={color === item} onClick={() => setColor(item)} style={{ background: item }} className={color === item ? "selected" : ""} />)}</div></fieldset>
      {error && <p role="alert" className="investment-error">{error}</p>}
      <footer><button type="button" className="investment-button secondary" disabled={saving} onClick={onClose}>Anuluj</button><button className="investment-button" disabled={saving || !name.trim()}>{saving ? "Zapisywanie…" : wallet ? "Zapisz zmiany" : "Utwórz portfel"}</button></footer>
    </form>
  </PortfolioDialog>;
}
export function TransferForm({ assets, wallets, allocated, sourceId, onClose, onTransfer }: {
  assets: Asset[]; wallets: PortfolioWallet[]; allocated: Map<number, number>; sourceId?: number;
  onClose: () => void; onTransfer: (input: PortfolioTransferInput) => Promise<void>;
}) {
  const realWallets = wallets.filter(wallet => wallet.type !== "GOALS");
  const availableFor = (asset: Asset) => Math.max(0, asset.value - (allocated.get(asset.id) ?? 0));
  const initialSource = assets.find(asset => asset.id === sourceId)
    ?? assets.find(asset => isSpendablePurchaseSource(asset) && availableFor(asset) > 0)
    ?? assets.find(asset => availableFor(asset) > 0)
    ?? assets[0];
  const initialTargetWallet = realWallets.find(wallet => wallet.id !== initialSource?.portfolioId
    && assets.some(asset => asset.portfolioId === wallet.id))
    ?? realWallets.find(wallet => wallet.id !== initialSource?.portfolioId)
    ?? realWallets[0];

  const [sourceWalletId, setSourceWalletId] = useState(initialSource?.portfolioId ?? realWallets[0]?.id ?? 0);
  const [targetWalletId, setTargetWalletId] = useState(initialTargetWallet?.id ?? 0);
  const [sourceAssetId, setSourceAssetId] = useState(initialSource?.id ?? 0);
  const [targetAssetId, setTargetAssetId] = useState(0);
  const [targetMode, setTargetMode] = useState<"existing" | "new">("existing");
  const [amount, setAmount] = useState("");
  const [acquiredQuantity, setAcquiredQuantity] = useState("");
  const [fee, setFee] = useState("");
  const [newCategory, setNewCategory] = useState<Extract<AssetCategory, "crypto" | "stocks" | "cash">>("crypto");
  const [newName, setNewName] = useState("Bitcoin");
  const [cryptoCoinId, setCryptoCoinId] = useState("bitcoin");
  const [cryptoSymbol, setCryptoSymbol] = useState("BTC");
  const [stockSymbol, setStockSymbol] = useState("");
  const [stockCurrency, setStockCurrency] = useState<CashCurrency>("USD");
  const [cashCurrency, setCashCurrency] = useState<Exclude<CashCurrency, "PLN">>("USD");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fxQuote, setFxQuote] = useState<FxQuote | null>(null);
  const [fxQuoteLoading, setFxQuoteLoading] = useState(false);
  const [fxQuoteError, setFxQuoteError] = useState("");

  const sourceWallet = realWallets.find(wallet => wallet.id === sourceWalletId);
  const targetWallet = realWallets.find(wallet => wallet.id === targetWalletId);
  const sourceAssets = assets.filter(asset => asset.portfolioId === sourceWalletId);
  const source = sourceAssets.find(asset => asset.id === sourceAssetId) ?? sourceAssets[0];
  const targetAssets = assets.filter(asset => asset.portfolioId === targetWalletId && asset.id !== source?.id);
  const target = targetAssets.find(asset => asset.id === targetAssetId) ?? targetAssets[0];
  const targetUnit = targetMode === "existing" && target ? unitPurchaseMeta(target) : null;
  const isPurchase = targetMode === "new" || targetUnit !== null;
  const purchaseSourceAllowed = !!source && isSpendablePurchaseSource(source);
  const available = source ? availableFor(source) : 0;
  const reserved = source ? allocated.get(source.id) ?? 0 : 0;
  const numericAmount = Number(amount);
  const numericQuantity = Number(acquiredQuantity);
  const numericFee = fee.trim() === "" ? 0 : Number(fee);
  const totalDebit = numericAmount + numericFee;
  const newTargetValid = targetMode !== "new" || (
    !!targetWallet
    && newName.trim().length > 0
    && (newCategory !== "crypto" || (cryptoCoinId.trim().length > 0 && cryptoSymbol.trim().length > 0))
    && (newCategory !== "stocks" || stockSymbol.trim().length > 0)
    && newName.trim().length > 0
  );
  const targetValid = targetMode === "new" ? newTargetValid : !!target;
  const moneyValid = Number.isFinite(numericAmount) && numericAmount > 0
    && Math.abs(numericAmount * 100 - Math.round(numericAmount * 100)) < .000001;
  const feeValid = Number.isFinite(numericFee) && numericFee >= 0
    && Math.abs(numericFee * 100 - Math.round(numericFee * 100)) < .000001;
  const quantityValid = !isPurchase || (Number.isFinite(numericQuantity) && numericQuantity > 0);
  const sourceValid = !!source && (!isPurchase || purchaseSourceAllowed) && (numericFee === 0 || purchaseSourceAllowed);
  const valid = !!sourceWallet && !!targetWallet && targetValid && sourceValid
    && moneyValid && feeValid && quantityValid && totalDebit <= available;

  const currentQuantity = targetUnit?.quantity ?? 0;
  const resultingQuantity = currentQuantity + (isPurchase && Number.isFinite(numericQuantity) ? numericQuantity : 0);
  const impliedUnitPrice = isPurchase && numericQuantity > 0 && numericAmount > 0 ? numericAmount / numericQuantity : null;
  const targetName = targetMode === "new" ? newName.trim() : target?.name ?? "aktywo";
  const quantityLabel = targetMode === "new"
    ? newCategory === "crypto" ? `Otrzymane monety (${cryptoSymbol.trim().toUpperCase() || "krypto"})`
      : newCategory === "stocks" ? "Otrzymane akcje / jednostki"
        : `Otrzymana waluta (${cashCurrency})`
    : targetUnit?.label ?? "Otrzymane jednostki";
  const fxCurrency = targetMode === "new"
    ? (newCategory === "cash" ? cashCurrency : null)
    : (target && getAssetCategory(target) === "cash" && target.fxPriced && target.cashCurrency && target.cashCurrency !== "PLN" ? target.cashCurrency : null);
  const isFxPurchase = isPurchase && fxCurrency != null;
  const marketFxRate = isFxPurchase ? fxQuote?.ratePln ?? null : null;
  const bankFxRate = isFxPurchase && numericQuantity > 0 && numericAmount > 0 ? numericAmount / numericQuantity : null;
  const fxMarketValue = marketFxRate != null && numericQuantity > 0 ? marketFxRate * numericQuantity : null;
  const fxSpreadLoss = fxMarketValue != null && numericAmount > fxMarketValue ? numericAmount - fxMarketValue : 0;
  const fxSpreadPercent = marketFxRate != null && bankFxRate != null && marketFxRate > 0
    ? Math.max(0, (bankFxRate / marketFxRate - 1) * 100)
    : 0;
  const fxQuoteTimestampLabel = fxQuote?.quotedAt
    ? new Date(fxQuote.quotedAt).toLocaleString("pl-PL", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
      })
    : fxQuote?.effectiveDate ?? null;

  useEffect(() => {
    let cancelled = false;
    let intervalId: number | null = null;

    if (!fxCurrency) {
      setFxQuote(null);
      setFxQuoteError("");
      setFxQuoteLoading(false);
      return () => { cancelled = true; };
    }

    const load = async (silent = false) => {
      if (!silent) setFxQuoteLoading(true);
      setFxQuoteError("");
      try {
        const quote = await marketPriceApi.getFxQuote(fxCurrency);
        if (!cancelled) setFxQuote(quote);
      } catch (cause) {
        if (!cancelled) {
          if (!silent) setFxQuote(null);
          setFxQuoteError(errorMessage(cause));
        }
      } finally {
        if (!cancelled && !silent) setFxQuoteLoading(false);
      }
    };

    void load(false);
    intervalId = window.setInterval(() => { void load(true); }, 30_000);

    return () => {
      cancelled = true;
      if (intervalId != null) window.clearInterval(intervalId);
    };
  }, [fxCurrency]);

  function chooseSourceWallet(id: number) {
    setSourceWalletId(id);
    const candidates = assets.filter(asset => asset.portfolioId === id);
    setSourceAssetId((candidates.find(asset => isSpendablePurchaseSource(asset) && availableFor(asset) > 0)
      ?? candidates.find(asset => availableFor(asset) > 0)
      ?? candidates[0])?.id ?? 0);
    setFee("");
    setError("");
  }

  function chooseNewCategory(category: Extract<AssetCategory, "crypto" | "stocks" | "cash">) {
    setNewCategory(category);
    setAcquiredQuantity("");
    if (category === "crypto" && (!newName.trim() || newName === `Gotówka ${cashCurrency}`)) setNewName("Bitcoin");
    if (category === "cash") setNewName(`Gotówka ${cashCurrency}`);
    if (category === "stocks" && (newName === "Bitcoin" || newName.startsWith("Gotówka "))) setNewName("");
  }

  function buildNewTarget(): PurchaseTargetInput | null {
    if (targetMode !== "new") return null;
    if (newCategory === "crypto") return {
      name: newName.trim(), category: "crypto", color: "#f59e0b", iconKey: "bitcoin",
      cryptoCoinId: cryptoCoinId.trim().toLowerCase(), cryptoSymbol: cryptoSymbol.trim().toUpperCase(),
    };
    if (newCategory === "stocks") return {
      name: newName.trim(), category: "stocks", color: "#3b82f6", iconKey: "chart",
      stockSymbol: stockSymbol.trim().toUpperCase(), stockCurrency,
    };
    return {
      name: newName.trim() || `Gotówka ${cashCurrency}`, category: "cash", color: "#10b981", iconKey: "landmark",
      cashCurrency,
    };
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!valid || saving || !source) return;
    setSaving(true); setError("");
    try {
      if (isFxPurchase && fxCurrency) {
        // Refresh immediately before booking. Backend independently fetches a fresh
        // benchmark too and persists the exact quote used for the spread calculation.
        const freshQuote = await marketPriceApi.getFxQuote(fxCurrency, true);
        setFxQuote(freshQuote);
      }
      await onTransfer({
        sourceAssetId: source.id,
        targetAssetId: targetMode === "existing" ? target?.id ?? null : null,
        targetPortfolioId: targetMode === "new" ? targetWalletId : null,
        newTarget: buildNewTarget(),
        amount: numericAmount,
        acquiredQuantity: isPurchase ? numericQuantity : null,
        fee: numericFee,
      });
      onClose();
    } catch (cause) { setError(errorMessage(cause)); } finally { setSaving(false); }
  }

  return <PortfolioDialog
    title={isPurchase ? "Zakup aktywa" : "Transfer kapitału"}
    subtitle={isPurchase ? "Kwota zakupu znika z gotówki, a pozycja rośnie o faktycznie otrzymane jednostki." : "Twoje pieniądze. Nowy kierunek."}
    icon={<ArrowRightLeft size={24}/>} className="transfer-dialog" onClose={onClose} busy={saving}
  >
    <form onSubmit={submit} className="investment-form transfer-form">
      <div className="transfer-route">
        <section className="transfer-side source">
          <div className="transfer-side-heading"><span><ArrowUpRight size={17}/>Skąd płacisz</span><span className="transfer-step">01</span></div>
          <label>Portfel źródłowy
            <span className="transfer-select">
              <span className="transfer-select-icon" style={{ color: sourceWallet?.color }}><WalletIcon name={sourceWallet?.iconKey ?? "wallet"} size={21}/></span>
              <select value={sourceWalletId} disabled={saving} onChange={event => chooseSourceWallet(Number(event.target.value))}>
                {realWallets.map(wallet => <option key={wallet.id} value={wallet.id}>{wallet.name}{wallet.type === "MAIN" ? " · systemowy" : ""}</option>)}
              </select><ChevronDown size={15} className="transfer-select-chevron"/>
            </span>
          </label>
          <label>Źródło pieniędzy
            <span className="transfer-select">
              <span className="transfer-select-icon" style={{ color: source?.color }}>{source ? <AssetIcon iconKey={getAssetIconKey(source)} size={19}/> : <Coins size={19}/>}</span>
              <select value={source?.id ?? ""} disabled={saving || !sourceAssets.length} onChange={event => { setSourceAssetId(Number(event.target.value)); setFee(""); setError(""); }}>
                {!sourceAssets.length && <option value="">Brak aktywów w portfelu</option>}
                {sourceAssets.map(asset => <option key={asset.id} value={asset.id}>{asset.name}</option>)}
              </select><ChevronDown size={15} className="transfer-select-chevron"/>
            </span>
          </label>
          <div className="transfer-balance"><span><Wallet size={14}/>Dostępne</span><strong>{money(available)}</strong></div>
          <p className="transfer-reserved"><LockKeyhole size={12}/>{money(reserved)} zarezerwowane na cele lub zobowiązania</p>
          {isPurchase && source && !purchaseSourceAllowed && <p className="transfer-source-warning">Zakup jednostek wybierz z konta / gotówki w PLN. Dzięki temu liczba monet, akcji lub waluty pozostaje spójna.</p>}
        </section>

        <span className="transfer-route-arrow" aria-hidden="true"><ArrowRight size={20}/></span>

        <section className="transfer-side destination">
          <div className="transfer-side-heading"><span><ArrowDownLeft size={17}/>Co kupujesz</span><span className="transfer-step">02</span></div>
          <label>Portfel docelowy
            <span className="transfer-select">
              <span className="transfer-select-icon" style={{ color: targetWallet?.color }}><WalletIcon name={targetWallet?.iconKey ?? "wallet"} size={21}/></span>
              <select value={targetWalletId} disabled={saving} onChange={event => { setTargetWalletId(Number(event.target.value)); setTargetAssetId(0); setError(""); }}>
                {realWallets.map(wallet => <option key={wallet.id} value={wallet.id}>{wallet.name}{wallet.type === "MAIN" ? " · systemowy" : ""}</option>)}
              </select><ChevronDown size={15} className="transfer-select-chevron"/>
            </span>
          </label>

          <div className="transfer-target-mode" role="group" aria-label="Sposób wyboru pozycji docelowej">
            <button type="button" className={targetMode === "existing" ? "selected" : ""} onClick={() => { setTargetMode("existing"); setError(""); }}>Istniejąca pozycja</button>
            <button type="button" className={targetMode === "new" ? "selected" : ""} onClick={() => { setTargetMode("new"); setError(""); }}>+ Nowa pozycja</button>
          </div>

          {targetMode === "existing" ? <>
            <label>Aktywo docelowe
              <span className="transfer-select">
                <span className="transfer-select-icon" style={{ color: target?.color }}>{target ? <AssetIcon iconKey={getAssetIconKey(target)} size={19}/> : <Coins size={19}/>}</span>
                <select value={target?.id ?? ""} disabled={saving || !targetAssets.length} onChange={event => { setTargetAssetId(Number(event.target.value)); setAcquiredQuantity(""); setError(""); }}>
                  {!targetAssets.length && <option value="">Brak aktywa docelowego</option>}
                  {targetAssets.map(asset => <option key={asset.id} value={asset.id}>{asset.name}</option>)}
                </select><ChevronDown size={15} className="transfer-select-chevron"/>
              </span>
            </label>
            {target ? <>
              <div className="transfer-balance"><span><Coins size={14}/>{targetUnit ? "Aktualna ilość" : "Aktualna wartość aktywa"}</span><strong>{targetUnit ? `${formatUnits(targetUnit.quantity)} ${targetUnit.symbol}` : money(target.value)}</strong></div>
              <p className="transfer-reserved"><Plus size={12}/>{targetUnit ? "Zakup zwiększy liczbę jednostek, a wartość policzy rynek" : "Tutaj trafi przeniesiona kwota"}</p>
            </> : <div className="transfer-empty-target"><p>Brak aktywa docelowego. Możesz utworzyć pozycję bezpośrednio w tej operacji.</p><button type="button" className="investment-button secondary" onClick={() => setTargetMode("new")}><Plus size={14}/>Utwórz nową pozycję</button></div>}
          </> : <NewPurchaseTargetFields
            category={newCategory} onCategory={chooseNewCategory}
            name={newName} onName={setNewName}
            cryptoCoinId={cryptoCoinId} onCryptoCoinId={setCryptoCoinId}
            cryptoSymbol={cryptoSymbol} onCryptoSymbol={setCryptoSymbol}
            stockSymbol={stockSymbol} onStockSymbol={setStockSymbol}
            stockCurrency={stockCurrency} onStockCurrency={setStockCurrency}
            cashCurrency={cashCurrency} onCashCurrency={value => { setCashCurrency(value); if (!newName.trim() || newName.startsWith("Gotówka ")) setNewName(`Gotówka ${value}`); }}
            disabled={saving}
          />}
        </section>
      </div>

      <div className="transfer-amount-block">
        <label htmlFor="transfer-amount"><Coins size={16}/>{isPurchase ? "Kwota zapłacona za aktywo" : "Kwota transferu"}</label>
        <div className="transfer-amount-input"><input id="transfer-amount" required type="number" min=".01" max={Math.max(0, available - numericFee)} step=".01" placeholder="0,00" value={amount} disabled={saving} onChange={event => setAmount(event.target.value)} autoFocus/><span>PLN</span><button type="button" disabled={saving || available <= numericFee} onClick={() => setAmount(Math.max(0, available - numericFee).toFixed(2))}>Całość</button></div>
        {totalDebit > available && <p className="transfer-amount-error" role="status">Zakup + prowizja wymagają {money(totalDebit)}. Dostępne: {money(available)}.</p>}
      </div>

      {isPurchase && <div className="transfer-quantity-block">
        <div className="transfer-quantity-heading"><div><strong>{quantityLabel}</strong><small>Wpisz dokładnie tyle jednostek, ile faktycznie zaksięgowała giełda / broker / kantor.</small></div><span>ILOŚĆ</span></div>
        <input type="number" min="0.000000000001" step="any" placeholder="np. 0,005234" value={acquiredQuantity} disabled={saving} onChange={event => setAcquiredQuantity(event.target.value)} />
        {targetMode === "existing" && targetUnit && numericQuantity > 0 && <div className="transfer-quantity-preview"><span>Po zakupie</span><strong>{formatUnits(resultingQuantity)} {targetUnit.symbol}</strong></div>}
        {impliedUnitPrice !== null && Number.isFinite(impliedUnitPrice) && <p className="transfer-implied-price">Efektywna cena z wpisanych danych: <strong>{money(impliedUnitPrice)} / jednostkę</strong> (bez fee).</p>}
      </div>}

      {isFxPurchase && <div className="transfer-fx-benchmark">
        <div className="transfer-fx-benchmark-heading">
          <div><strong>Kurs kantoru vs bieżący rynek</strong><small>Freedom porównuje Twój efektywny kurs z możliwie świeżym notowaniem {fxCurrency}/PLN. Kurs odświeża się automatycznie co 30 s i ponownie przy zatwierdzeniu.</small></div>
          <span className={`transfer-fx-live ${fxQuote?.fallback ? "fallback" : fxQuote ? "intraday" : ""}`}>{fxQuoteLoading ? "POBIERAM…" : fxQuote ? (fxQuote.fallback ? "NBP FALLBACK" : "INTRADAY") : "BRAK KURSU"}</span>
        </div>
        {fxQuote && marketFxRate != null && <div className="transfer-fx-grid">
          <div><span>Kurs rynkowy</span><strong>1 {fxCurrency} = {marketFxRate.toLocaleString("pl-PL", { minimumFractionDigits: 4, maximumFractionDigits: 4 })} zł</strong><small>{fxQuoteTimestampLabel ?? "—"} · {fxQuote.provider ?? "rynek"}</small></div>
          <div><span>Twój kurs kantoru</span><strong>{bankFxRate != null ? `1 ${fxCurrency} = ${bankFxRate.toLocaleString("pl-PL", { minimumFractionDigits: 4, maximumFractionDigits: 4 })} zł` : "—"}</strong><small>zapłacone PLN ÷ otrzymane {fxCurrency}</small></div>
          <div><span>Wartość po kursie rynku</span><strong>{fxMarketValue != null ? money(fxMarketValue) : "—"}</strong><small>{numericQuantity > 0 ? `${formatUnits(numericQuantity)} ${fxCurrency}` : "Wpisz otrzymaną walutę"}</small></div>
          <div className={fxSpreadLoss > 0 ? "loss" : "ok"}><span>Ukryty koszt kursowy</span><strong>{fxMarketValue != null ? money(Math.max(0, fxSpreadLoss)) : "—"}</strong><small>{fxMarketValue != null ? `${fxSpreadPercent.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}% ponad benchmarkiem rynkowym` : "Policzymy automatycznie"}</small></div>
        </div>}
        {fxQuoteError && <p className="transfer-fx-error">Nie udało się pobrać bieżącego benchmarku FX: {fxQuoteError}</p>}
        {fxQuote && <div className="transfer-fx-source-line">
          <span>Źródło benchmarku: {fxQuote.source}</span>
          <span>{fxQuote.fallback ? "Kurs dzienny — fallback" : "Publiczne notowanie intraday może być opóźnione"}</span>
        </div>}
        {fxSpreadLoss > 0 && <div className="transfer-fx-expense-note"><ReceiptText size={16}/><p><strong>{money(fxSpreadLoss)} zostanie automatycznie zapisane jako wydatek.</strong><br/>Inwestycje → Spread walutowy · źródło: {source?.name ?? "konto źródłowe"}.</p></div>}
      </div>}

      {purchaseSourceAllowed && <div className="transfer-fee-block">
        <div className="transfer-fee-heading">
          <span className="transfer-fee-icon"><ReceiptText size={17}/></span>
          <div><strong>Prowizja / fee <em>opcjonalnie</em></strong><small>Jawna opłata operatora — niezależna od spreadu walutowego</small></div>
        </div>
        <div className="transfer-fee-input"><input type="number" min="0" step=".01" placeholder="0,00" value={fee} disabled={saving} onChange={event => setFee(event.target.value)}/><span>PLN</span></div>
        <p>Jeśli wpiszesz prowizję, Freedom utworzy wydatek <strong>Inwestycje → Prowizje i opłaty</strong> z opisem „Prowizja inwestycyjna · {targetName || "aktywo"}”.</p>
      </div>}

      {valid && <div className="transfer-preview" aria-live="polite">
        <div><span>W źródle po operacji</span><strong>{money(available - totalDebit)} <small>dostępne</small></strong></div>
        <ArrowRight size={17}/>
        <div><span>{isPurchase ? "Pozycja po zakupie" : "W aktywie docelowym"}</span><strong>{isPurchase ? `${formatUnits(resultingQuantity)} ${targetMode === "existing" ? targetUnit?.symbol ?? "j." : newCategory === "crypto" ? cryptoSymbol.toUpperCase() : newCategory === "cash" ? cashCurrency : "j."}` : money((target?.value ?? 0) + numericAmount)}</strong></div>
      </div>}

      <div className={`transfer-info ${numericFee > 0 || fxSpreadLoss > 0 ? "with-fee" : ""}`}><CircleCheck size={18}/><p>
        <strong>{isPurchase
          ? (numericFee > 0 || fxSpreadLoss > 0
              ? `Pewny koszt operacji: ${money(numericFee + fxSpreadLoss)}${fxSpreadLoss > 0 ? ` (${money(fxSpreadLoss)} spread + ${money(numericFee)} fee)` : " prowizji"}`
              : "Zakup nie jest wydatkiem konsumpcyjnym")
          : (numericFee > 0 ? `Majątek spadnie tylko o ${money(numericFee)} prowizji` : "Majątek pozostaje bez zmian")}</strong>
        <span>{isFxPurchase
          ? "Zapłacone PLN znikną ze źródła, otrzymana waluta zwiększy quantity pozycji, a różnica względem kursu rynkowego z chwili transakcji zostanie zaksięgowana jako koszt spreadu. Dodatkowa prowizja pozostaje osobnym kosztem."
          : isPurchase
            ? "Kwota zakupu zostanie odjęta ze źródła, liczba jednostek zostanie dodana do pozycji, a jej wartość PLN będzie wynikać z aktualnego kursu rynkowego. Wzrost wyceny nie tworzy przychodu w Finanse."
            : "Przenosisz kapitał między aktywami. Transfer nie jest przychodem ani wydatkiem."}</span>
      </p></div>

      {error && <p role="alert" className="investment-error">{error}</p>}
      <footer><button type="button" className="investment-button secondary" onClick={onClose} disabled={saving}>Anuluj</button><button className="investment-button" disabled={!valid || saving}>{saving ? <LoaderCircle size={16} className="animate-spin"/> : <ArrowRightLeft size={16}/>} {saving ? "Księgowanie…" : isPurchase ? "Kup aktywo" : "Przenieś środki"}</button></footer>
    </form>
  </PortfolioDialog>;
}

function NewPurchaseTargetFields({ category, onCategory, name, onName, cryptoCoinId, onCryptoCoinId, cryptoSymbol, onCryptoSymbol, stockSymbol, onStockSymbol, stockCurrency, onStockCurrency, cashCurrency, onCashCurrency, disabled }: {
  category: Extract<AssetCategory, "crypto" | "stocks" | "cash">;
  onCategory: (value: Extract<AssetCategory, "crypto" | "stocks" | "cash">) => void;
  name: string; onName: (value: string) => void;
  cryptoCoinId: string; onCryptoCoinId: (value: string) => void;
  cryptoSymbol: string; onCryptoSymbol: (value: string) => void;
  stockSymbol: string; onStockSymbol: (value: string) => void;
  stockCurrency: CashCurrency; onStockCurrency: (value: CashCurrency) => void;
  cashCurrency: Exclude<CashCurrency, "PLN">; onCashCurrency: (value: Exclude<CashCurrency, "PLN">) => void;
  disabled: boolean;
}) {
  return <div className="transfer-new-target">
    <div className="transfer-target-type">
      <button type="button" className={category === "crypto" ? "selected" : ""} onClick={() => onCategory("crypto")}>Krypto</button>
      <button type="button" className={category === "stocks" ? "selected" : ""} onClick={() => onCategory("stocks")}>Akcje / ETF</button>
      <button type="button" className={category === "cash" ? "selected" : ""} onClick={() => onCategory("cash")}>Waluta obca</button>
    </div>
    <label>Nazwa pozycji<input value={name} disabled={disabled} onChange={event => onName(event.target.value)} placeholder={category === "crypto" ? "Bitcoin" : category === "stocks" ? "Coca Cola" : `Gotówka ${cashCurrency}`} /></label>
    {category === "crypto" && <div className="investment-form-columns">
      <label>CoinGecko ID<input value={cryptoCoinId} disabled={disabled} onChange={event => onCryptoCoinId(event.target.value)} placeholder="bitcoin" /></label>
      <label>Symbol<input value={cryptoSymbol} disabled={disabled} onChange={event => onCryptoSymbol(event.target.value)} placeholder="BTC" /></label>
    </div>}
    {category === "stocks" && <div className="investment-form-columns">
      <label>Ticker Yahoo<input value={stockSymbol} disabled={disabled} onChange={event => onStockSymbol(event.target.value)} placeholder="MCD, DNP.WA, IWDA.L" /></label>
      <label>Waluta notowania<select value={stockCurrency} disabled={disabled} onChange={event => onStockCurrency(event.target.value as CashCurrency)}>{(["PLN", "USD", "EUR", "GBP", "CHF"] as CashCurrency[]).map(currency => <option key={currency}>{currency}</option>)}</select></label>
    </div>}
    {category === "cash" && <label>Waluta<select value={cashCurrency} disabled={disabled} onChange={event => onCashCurrency(event.target.value as Exclude<CashCurrency, "PLN">)}>{(["USD", "EUR", "CHF", "GBP", "CZK"] as Exclude<CashCurrency, "PLN">[]).map(currency => <option key={currency}>{currency}</option>)}</select></label>}
    <p className="investment-note">Pozycja zostanie utworzona z ilością z tej transakcji. Nie powstanie sztuczny „kapitał początkowy”.</p>
  </div>;
}

function isSpendablePurchaseSource(asset: Asset) {
  return getAssetCategory(asset) === "cash" && !asset.fxPriced;
}

function unitPurchaseMeta(asset: Asset): { quantity: number; symbol: string; label: string } | null {
  if (getAssetCategory(asset) === "crypto" && asset.cryptoCoinId && asset.cryptoQuantity != null) {
    return { quantity: asset.cryptoQuantity, symbol: asset.cryptoSymbol || "krypto", label: `Otrzymane monety (${asset.cryptoSymbol || "krypto"})` };
  }
  if (getAssetCategory(asset) === "stocks" && asset.stockPriced && asset.stockQuantity != null) {
    return { quantity: asset.stockQuantity, symbol: "szt.", label: "Otrzymane akcje / jednostki" };
  }
  if (getAssetCategory(asset) === "cash" && asset.fxPriced && asset.cashCurrency && asset.cashCurrency !== "PLN" && asset.cashQuantity != null) {
    return { quantity: asset.cashQuantity, symbol: asset.cashCurrency, label: `Otrzymana waluta (${asset.cashCurrency})` };
  }
  return null;
}

function formatUnits(value: number) {
  return new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 12 }).format(value);
}

export function GoalCapitalDialog({ goal, release, onClose, onRelease }: {
  goal: FundedGoal; release: boolean; onClose: () => void; onRelease: (assetId: number, amount: number) => Promise<void>;
}) {
  const releasable = goal.allocations.filter(row => row.assetId != null);
  const [assetId, setAssetId] = useState(releasable[0]?.assetId ?? 0);
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const maximum = releasable.find(row => row.assetId === assetId)?.amount ?? 0;
  async function submit(event: FormEvent) {
    event.preventDefault(); if (Number(amount) <= 0 || Number(amount) > maximum) return;
    setSaving(true); setError("");
    try { await onRelease(assetId, Number(amount)); onClose(); }
    catch (cause) { setError(errorMessage(cause)); } finally { setSaving(false); }
  }
  return <PortfolioDialog title={release ? `Zwolnij środki · ${goal.name}` : goal.name} subtitle={`Przypisany kapitał: ${money(goal.amount)}`} onClose={onClose} busy={saving}>
    <form className="investment-form" onSubmit={submit}>
      <div className="goal-capital-details">{goal.allocations.map((row, index) => <div key={`${row.assetId}-${index}`}><span>{row.assetName}{row.assetId == null ? " · bez powiązania z aktywem" : ""}</span><strong>{money(row.amount)}</strong></div>)}</div>
      {release && <>
        <label>Źródło rezerwacji<select value={assetId} onChange={event => setAssetId(Number(event.target.value))}>{releasable.map(row => <option key={row.assetId} value={row.assetId!}>{row.assetName}</option>)}</select></label>
        <label>Kwota do zwolnienia (zł)<input required type="number" min=".01" step=".01" max={maximum} value={amount} onChange={event => setAmount(event.target.value)} autoFocus /></label>
        <p className="investment-note">Możesz zwolnić {money(maximum)}. Środki będą ponownie dostępne w portfelu źródłowym. Wartość majątku się nie zmieni.</p>
      </>}
      {error && <p className="investment-error" role="alert">{error}</p>}
      <footer><button type="button" className="investment-button secondary" onClick={onClose} disabled={saving}>{release ? "Anuluj" : "Zamknij"}</button>{release && <button className="investment-button" disabled={saving || Number(amount) <= 0 || Number(amount) > maximum}>{saving ? "Zwalnianie…" : "Zwolnij środki"}</button>}</footer>
    </form>
  </PortfolioDialog>;
}
