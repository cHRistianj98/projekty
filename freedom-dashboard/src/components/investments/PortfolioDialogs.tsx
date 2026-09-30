import { useEffect, useId, useRef, useState, type ReactNode, type FormEvent } from "react";
import { X, Wallet, Shield, Sprout, Clock3, House, Gem, Target, ArrowRight, ArrowRightLeft, ArrowUpRight, ArrowDownLeft, ChevronDown, Coins, LockKeyhole, Plus, CircleCheck, LoaderCircle, Image as ImageIcon } from "lucide-react";
import type { Asset } from "../../types/Asset";
import { getAssetIconKey } from "../../types/Asset";
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
export function TransferForm({ assets, wallets, allocated, sourceId, onClose, onTransfer, onAddAsset }: {
  assets: Asset[]; wallets: PortfolioWallet[]; allocated: Map<number, number>; sourceId?: number;
  onClose: () => void; onTransfer: (source: number, target: number, amount: number) => Promise<void>;
  onAddAsset: (portfolioId: number) => void;
}) {
  const realWallets = wallets.filter(wallet => wallet.type !== "GOALS");
  const availableFor = (asset: Asset) => Math.max(0, asset.value - (allocated.get(asset.id) ?? 0));
  const initialSource = assets.find(asset => asset.id === sourceId)
    ?? assets.find(asset => asset.systemCash && availableFor(asset) > 0)
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
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const sourceWallet = realWallets.find(wallet => wallet.id === sourceWalletId);
  const targetWallet = realWallets.find(wallet => wallet.id === targetWalletId);
  const sourceAssets = assets.filter(asset => asset.portfolioId === sourceWalletId);
  const source = sourceAssets.find(asset => asset.id === sourceAssetId) ?? sourceAssets[0];
  const targetAssets = assets.filter(asset => asset.portfolioId === targetWalletId && asset.id !== source?.id);
  const target = targetAssets.find(asset => asset.id === targetAssetId) ?? targetAssets[0];
  const available = source ? availableFor(source) : 0;
  const reserved = source ? allocated.get(source.id) ?? 0 : 0;
  const numericAmount = Number(amount);
  const valid = !!source && !!target && !!sourceWallet && !!targetWallet
    && Number.isFinite(numericAmount) && numericAmount > 0 && numericAmount <= available
    && Math.abs(numericAmount * 100 - Math.round(numericAmount * 100)) < .000001;

  function chooseSourceWallet(id: number) {
    setSourceWalletId(id);
    const candidates = assets.filter(asset => asset.portfolioId === id);
    setSourceAssetId((candidates.find(asset => availableFor(asset) > 0) ?? candidates[0])?.id ?? 0);
    setError("");
  }

  async function submit(event: FormEvent) {
    event.preventDefault(); if (!valid || saving || !source || !target) return;
    setSaving(true); setError("");
    try { await onTransfer(source.id, target.id, numericAmount); onClose(); }
    catch (cause) { setError(errorMessage(cause)); } finally { setSaving(false); }
  }
  return <PortfolioDialog title="Transfer kapitału" subtitle="Twoje pieniądze. Nowy kierunek." icon={<ArrowRightLeft size={24}/>} className="transfer-dialog" onClose={onClose} busy={saving}>
    <form onSubmit={submit} className="investment-form transfer-form">
      <div className="transfer-route">
        <section className="transfer-side source">
          <div className="transfer-side-heading"><span><ArrowUpRight size={17}/>Skąd przenosisz</span><span className="transfer-step">01</span></div>
          <label>Portfel źródłowy
            <span className="transfer-select">
              <span className="transfer-select-icon" style={{ color: sourceWallet?.color }}><WalletIcon name={sourceWallet?.iconKey ?? "wallet"} size={21}/></span>
              <select value={sourceWalletId} disabled={saving} onChange={event => chooseSourceWallet(Number(event.target.value))}>
                {realWallets.map(wallet => <option key={wallet.id} value={wallet.id}>{wallet.name}{wallet.type === "MAIN" ? " · systemowy" : ""}</option>)}
              </select><ChevronDown size={15} className="transfer-select-chevron"/>
            </span>
          </label>
          <label>Aktywo źródłowe
            <span className="transfer-select">
              <span className="transfer-select-icon" style={{ color: source?.color }}>{source ? <AssetIcon iconKey={getAssetIconKey(source)} size={19}/> : <Coins size={19}/>}</span>
              <select value={source?.id ?? ""} disabled={saving || !sourceAssets.length} onChange={event => { setSourceAssetId(Number(event.target.value)); setError(""); }}>
                {!sourceAssets.length && <option value="">Brak aktywów w portfelu</option>}
                {sourceAssets.map(asset => <option key={asset.id} value={asset.id}>{asset.name}</option>)}
              </select><ChevronDown size={15} className="transfer-select-chevron"/>
            </span>
          </label>
          <div className="transfer-balance"><span><Wallet size={14}/>Dostępne do transferu</span><strong>{money(available)}</strong></div>
          <p className="transfer-reserved"><LockKeyhole size={12}/>{money(reserved)} zarezerwowane na cele lub zobowiązania</p>
        </section>
        <span className="transfer-route-arrow" aria-hidden="true"><ArrowRight size={20}/></span>
        <section className="transfer-side destination">
          <div className="transfer-side-heading"><span><ArrowDownLeft size={17}/>Dokąd trafiają</span><span className="transfer-step">02</span></div>
          <label>Portfel docelowy
            <span className="transfer-select">
              <span className="transfer-select-icon" style={{ color: targetWallet?.color }}><WalletIcon name={targetWallet?.iconKey ?? "wallet"} size={21}/></span>
              <select value={targetWalletId} disabled={saving} onChange={event => { setTargetWalletId(Number(event.target.value)); setTargetAssetId(0); setError(""); }}>
                {realWallets.map(wallet => <option key={wallet.id} value={wallet.id}>{wallet.name}{wallet.type === "MAIN" ? " · systemowy" : ""}</option>)}
              </select><ChevronDown size={15} className="transfer-select-chevron"/>
            </span>
          </label>
          <label>Aktywo docelowe
            <span className="transfer-select">
              <span className="transfer-select-icon" style={{ color: target?.color }}>{target ? <AssetIcon iconKey={getAssetIconKey(target)} size={19}/> : <Coins size={19}/>}</span>
              <select value={target?.id ?? ""} disabled={saving || !targetAssets.length} onChange={event => setTargetAssetId(Number(event.target.value))}>
                {!targetAssets.length && <option value="">Brak aktywa docelowego</option>}
                {targetAssets.map(asset => <option key={asset.id} value={asset.id}>{asset.name}</option>)}
              </select><ChevronDown size={15} className="transfer-select-chevron"/>
            </span>
          </label>
          {target ? <><div className="transfer-balance"><span><Coins size={14}/>Aktualna wartość aktywa</span><strong>{money(target.value)}</strong></div><p className="transfer-reserved"><Plus size={12}/>Tutaj trafi przeniesiona kwota</p></> : <div className="transfer-empty-target"><p>Dodaj aktywo, które przyjmie środki.</p><button type="button" className="investment-button secondary" disabled={saving || !targetWallet} onClick={() => onAddAsset(targetWalletId)}><Plus size={14}/>Dodaj aktywo do portfela</button></div>}
        </section>
      </div>
      <div className="transfer-amount-block">
        <label htmlFor="transfer-amount"><Coins size={16}/>Kwota transferu</label>
        <div className="transfer-amount-input"><input id="transfer-amount" required type="number" min=".01" max={available} step=".01" placeholder="0,00" value={amount} disabled={saving} onChange={event => setAmount(event.target.value)} autoFocus/><span>PLN</span><button type="button" disabled={saving || available <= 0} onClick={() => setAmount(available.toFixed(2))}>Całość</button></div>
        {numericAmount > available && <p className="transfer-amount-error" role="status">Dostępne środki: {money(available)}. Rezerwacje na cele pozostają nienaruszone.</p>}
      </div>
      {valid && <div className="transfer-preview" aria-live="polite"><div><span>W źródle po transferze</span><strong>{money(available - numericAmount)} <small>dostępne</small></strong></div><ArrowRight size={17}/><div><span>W aktywie docelowym</span><strong>{money(target!.value + numericAmount)}</strong></div></div>}
      <div className="transfer-info"><CircleCheck size={18}/><p><strong>Majątek pozostaje bez zmian</strong><span>Przenosisz kapitał między aktywami. Transfer nie jest przychodem ani wydatkiem.</span></p></div>
      {error && <p role="alert" className="investment-error">{error}</p>}
      <footer><button type="button" className="investment-button secondary" onClick={onClose} disabled={saving}>Anuluj</button><button className="investment-button" disabled={!valid || saving}>{saving ? <LoaderCircle size={16} className="animate-spin"/> : <ArrowRightLeft size={16}/>} {saving ? "Przenoszenie…" : "Przenieś środki"}</button></footer>
    </form>
  </PortfolioDialog>;
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
