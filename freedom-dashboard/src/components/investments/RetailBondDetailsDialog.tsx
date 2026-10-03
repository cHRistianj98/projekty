import { useEffect, useRef, useState, type FormEvent } from "react";
import { FileSpreadsheet, Info, LoaderCircle, Plus, RefreshCw, ScrollText, Trash2, Upload, X } from "lucide-react";
import type { Asset } from "../../types/Asset";
import { retailBondApi, type RetailBondPortfolio } from "../../api/retailBondApi";
import { money } from "./portfolioView";

export function RetailBondDetailsDialog({ asset, onClose, onChanged }: {
  asset: Asset;
  onClose: () => void;
  onChanged: () => Promise<void>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [data, setData] = useState<RetailBondPortfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [code, setCode] = useState("");
  const [quantity, setQuantity] = useState("");
  const [blocked, setBlocked] = useState("0");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [gross, setGross] = useState("");

  useEffect(() => {
    dialog.current?.showModal();
    void load();
    return () => dialog.current?.close();
  }, [asset.id]);

  async function load() {
    setLoading(true); setError("");
    try { setData(await retailBondApi.get(asset.id)); }
    catch (cause) { setError(message(cause)); }
    finally { setLoading(false); }
  }

  async function refresh() {
    setBusy(true); setError("");
    try { setData(await retailBondApi.refresh(asset.id)); await onChanged(); }
    catch (cause) { setError(message(cause)); }
    finally { setBusy(false); }
  }

  async function add(event: FormEvent) {
    event.preventDefault();
    const qty = Number(quantity);
    const blockedQty = Number(blocked || 0);
    const grossValue = gross.trim() ? Number(gross) : undefined;
    if (!code.trim() || !purchaseDate || !Number.isInteger(qty) || qty <= 0 || !Number.isInteger(blockedQty) || blockedQty < 0 || blockedQty > qty) return;
    setBusy(true); setError("");
    try {
      setData(await retailBondApi.addPosition(asset.id, {
        emissionCode: code.trim().toUpperCase(), quantity: qty, blockedQuantity: blockedQty, purchaseDate,
        ...(grossValue != null && Number.isFinite(grossValue) ? { currentGrossValue: grossValue } : {}),
      }));
      setAdding(false); setCode(""); setQuantity(""); setBlocked("0"); setPurchaseDate(""); setGross("");
      await onChanged();
    } catch (cause) { setError(message(cause)); }
    finally { setBusy(false); }
  }

  async function remove(positionId: number) {
    if (!window.confirm("Usunąć tę emisję z Freedom Engine?")) return;
    setBusy(true); setError("");
    try { setData(await retailBondApi.deletePosition(asset.id, positionId)); await onChanged(); }
    catch (cause) { setError(message(cause)); }
    finally { setBusy(false); }
  }

  return <dialog ref={dialog} className="investment-dialog wide bond-details-dialog" onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>
    <header>
      <div className="investment-dialog-heading"><span className="investment-dialog-icon"><ScrollText size={23}/></span><div><h2>Emisje obligacji skarbowych</h2><p>{asset.name} · wartości netto po szacowanym podatku Belki</p></div></div>
      <button type="button" className="investment-icon-button" disabled={busy} onClick={onClose}><X size={20}/></button>
    </header>

    <div className="bond-details-body">
      {error && <p className="investment-error" role="alert">{error}</p>}
      {loading ? <div className="investment-empty"><LoaderCircle size={19} className="animate-spin"/>Pobieranie emisji…</div> : data && <>
        <section className="bond-summary-grid">
          <BondStat label="Nominał" value={money(data.nominalValue)}/>
          <BondStat label="Wartość brutto" value={money(data.grossValue)}/>
          <BondStat label="Podatek Belki" value={`-${money(data.taxAmount)}`} tone="tax"/>
          <BondStat label="Wartość netto" value={money(data.netValue)} tone="net"/>
        </section>

        <div className="bond-details-toolbar">
          <div><strong>{data.positions.length} emisji</strong><span>Wycena na {dateLabel(data.valuationDate)} · bez opłaty za przedterminowy wykup</span></div>
          <div className="investment-toolbar"><button type="button" className="investment-button secondary" disabled={busy} onClick={() => void refresh()}><RefreshCw size={14}/>Odśwież wycenę</button><button type="button" className="investment-button" disabled={busy} onClick={() => setAdding(value => !value)}><Plus size={14}/>Dodaj emisję</button></div>
        </div>

        {adding && <form className="bond-add-form" onSubmit={add}>
          <label>Kod emisji<input autoFocus required value={code} onChange={event => setCode(event.target.value.toUpperCase())} placeholder="COI0829" maxLength={12}/></label>
          <label>Liczba sztuk<input required type="number" min="1" step="1" value={quantity} onChange={event => setQuantity(event.target.value)} placeholder="74"/></label>
          <label>Zablokowane<input type="number" min="0" step="1" value={blocked} onChange={event => setBlocked(event.target.value)}/></label>
          <label>Dokładna data zakupu<input required type="date" value={purchaseDate} onChange={event => setPurchaseDate(event.target.value)}/></label>
          <label className="bond-gross-input">Wartość brutto dziś <small>opcjonalna; potrzebna dla starszych emisji kapitalizowanych, gdy brak danych online</small><input type="number" min="0" step="0.01" value={gross} onChange={event => setGross(event.target.value)} placeholder="np. 7449.58"/></label>
          <div className="bond-add-actions"><button type="button" className="investment-button secondary" disabled={busy} onClick={() => setAdding(false)}>Anuluj</button><button className="investment-button" disabled={busy}>{busy ? "Zapisywanie…" : "Dodaj emisję"}</button></div>
        </form>}

        <div className="bond-position-list">
          {[...data.positions]
            .sort((a, b) => b.purchaseDate.localeCompare(a.purchaseDate) || b.id - a.id)
            .map(item => <article className="bond-position-row" key={item.id}>
            <div className="bond-position-main"><div className="bond-emission-code">{item.emissionCode}</div><div className="bond-position-meta">{item.quantity} szt. · zakup {dateLabel(item.purchaseDate)} · wykup {dateLabel(item.maturityDate)}</div></div>
            <div className="bond-position-rate"><span>Oprocentowanie</span><strong>{item.currentRate == null ? "—" : `${item.currentRate.toLocaleString("pl-PL", { maximumFractionDigits: 2 })}%`}</strong>{item.currentPeriod != null && <small>okres {item.currentPeriod}</small>}</div>
            <div className="bond-position-money"><span>Brutto</span><strong>{money(item.currentGrossValue)}</strong><small>zysk {money(item.taxableGain)}</small></div>
            <div className="bond-position-money tax"><span>Belka</span><strong>-{money(item.taxAmount)}</strong><small>19% naliczonych odsetek</small></div>
            <div className="bond-position-money net"><span>Netto</span><strong>{money(item.currentNetValue)}</strong><small>na {dateLabel(item.valuationDate)}</small></div>
            <div className="bond-position-money redemption"><span className="bond-redemption-heading">Wykup dziś* <span className="bond-info-tooltip" tabIndex={0} aria-label="Dlaczego wykup może być niższy od nominału?" data-tooltip="Przy przedterminowym wykupie niektórych obligacji w kolejnych okresach odsetkowych pełna opłata może być wyższa niż bieżące naliczone odsetki. Dlatego chwilowa kwota wykupu może spaść poniżej 100 zł za sztukę."><Info size={12}/></span></span><strong>{money(item.currentRedemptionValue)}</strong><small>{money(item.currentRedemptionPricePerBond)}/szt. · opłata {money(item.earlyRedemptionFeePerBond)}/szt.</small></div>
            <div className="bond-position-actions">{item.blockedQuantity > 0 && <span className="bond-blocked">{item.blockedQuantity} zabl.</span>}<button type="button" className="investment-icon-button" disabled={busy} title="Usuń emisję" onClick={() => void remove(item.id)}><Trash2 size={16}/></button></div>
          </article>)}
          {!data.positions.length && <div className="investment-empty">Brak emisji. Dodaj je ręcznie albo zaimportuj XLS z serwisu Obligacje Skarbowe.</div>}
        </div>
      </>}
    </div>
  </dialog>;
}

export function RetailBondManualDialog({ portfolioId, onClose, onCreated }: {
  portfolioId: number;
  onClose: () => void;
  onCreated: (assetId: number) => Promise<void>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [quantity, setQuantity] = useState("");
  const [blocked, setBlocked] = useState("0");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [gross, setGross] = useState("");

  useEffect(() => { dialog.current?.showModal(); return () => dialog.current?.close(); }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const qty = Number(quantity);
    const blockedQty = Number(blocked || 0);
    const grossValue = gross.trim() ? Number(gross) : undefined;
    if (!code.trim() || !purchaseDate || !Number.isInteger(qty) || qty <= 0 || !Number.isInteger(blockedQty) || blockedQty < 0 || blockedQty > qty) return;
    setBusy(true); setError("");
    try {
      const result = await retailBondApi.addPositionToPortfolio(portfolioId, {
        emissionCode: code.trim().toUpperCase(), quantity: qty, blockedQuantity: blockedQty, purchaseDate,
        ...(grossValue != null && Number.isFinite(grossValue) ? { currentGrossValue: grossValue } : {}),
      });
      await onCreated(result.assetId);
      onClose();
    } catch (cause) { setError(message(cause)); }
    finally { setBusy(false); }
  }

  return <dialog ref={dialog} className="investment-dialog bond-manual-dialog" onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>
    <header><div className="investment-dialog-heading"><span className="investment-dialog-icon"><ScrollText size={23}/></span><div><h2>Dodaj emisję obligacji</h2><p>Freedom utworzy lub uzupełni zbiorcze aktywo „Obligacje skarbowe”.</p></div></div><button type="button" className="investment-icon-button" disabled={busy} onClick={onClose}><X size={20}/></button></header>
    <form className="bond-manual-form" onSubmit={submit}>
      <div className="bond-manual-grid">
        <label>Kod emisji<input autoFocus required value={code} onChange={event => setCode(event.target.value.toUpperCase())} placeholder="COI0829" maxLength={12}/><small>Typ, miesiąc i rok wynikają z kodu emisji.</small></label>
        <label>Liczba sztuk<input required type="number" min="1" step="1" value={quantity} onChange={event => setQuantity(event.target.value)} placeholder="74"/></label>
        <label>Zablokowane<input type="number" min="0" step="1" value={blocked} onChange={event => setBlocked(event.target.value)}/></label>
        <label>Dokładna data zakupu<input required type="date" value={purchaseDate} onChange={event => setPurchaseDate(event.target.value)}/><small>Dzień jest potrzebny do prawidłowego naliczania odsetek dziennych.</small></label>
        <label className="bond-gross-input">Wartość brutto dziś <small>Opcjonalna. Przy starszych emisjach z kapitalizacją może być potrzebna do odtworzenia bazy odsetek.</small><input type="number" min="0" step="0.01" value={gross} onChange={event => setGross(event.target.value)} placeholder="np. 7449.58"/></label>
      </div>
      <p className="investment-note">Dla COI/ROR/DOR i emisji, dla których Freedom pobierze aktualną tabelę odsetkową, kod + liczba sztuk + dokładna data zakupu zwykle wystarczą.</p>
      {error && <p className="investment-error" role="alert">{error}</p>}
      <footer><button type="button" className="investment-button secondary" disabled={busy} onClick={onClose}>Anuluj</button><button className="investment-button" disabled={busy}>{busy ? <LoaderCircle size={15} className="animate-spin"/> : <Plus size={15}/>} {busy ? "Zapisywanie…" : "Dodaj emisję"}</button></footer>
    </form>
  </dialog>;
}

export function RetailBondImportDialog({ portfolioId, onClose, onImported }: {
  portfolioId: number;
  onClose: () => void;
  onImported: (assetId: number) => Promise<void>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { dialog.current?.showModal(); return () => dialog.current?.close(); }, []);

  async function submit(event: FormEvent) {
    event.preventDefault(); if (!file) return;
    setBusy(true); setError("");
    try { const result = await retailBondApi.importXls(portfolioId, file); await onImported(result.assetId); onClose(); }
    catch (cause) { setError(message(cause)); }
    finally { setBusy(false); }
  }

  return <dialog ref={dialog} className="investment-dialog bond-import-dialog" onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>
    <header><div className="investment-dialog-heading"><span className="investment-dialog-icon"><FileSpreadsheet size={23}/></span><div><h2>Import obligacji skarbowych</h2><p>Wczytaj „Stan Rachunku Rejestrowego” z serwisu Obligacje Skarbowe.</p></div></div><button type="button" className="investment-icon-button" disabled={busy} onClick={onClose}><X size={20}/></button></header>
    <form className="bond-import-form" onSubmit={submit}>
      <label className="bond-file-drop"><Upload size={27}/><strong>{file ? file.name : "Wybierz plik .xls"}</strong><span>Freedom rozpozna emisje, liczbę obligacji, nominał, wartość aktualną i datę wykupu.</span><input type="file" accept=".xls,application/vnd.ms-excel" onChange={event => setFile(event.target.files?.[0] ?? null)}/></label>
      <p className="investment-note">Import aktualizuje istniejące emisje w tym portfelu zamiast tworzyć duplikaty. Wartość aktywa będzie sumą emisji po odjęciu szacowanego 19% podatku od naliczonych odsetek.</p>
      {error && <p className="investment-error" role="alert">{error}</p>}
      <footer><button type="button" className="investment-button secondary" disabled={busy} onClick={onClose}>Anuluj</button><button className="investment-button" disabled={busy || !file}>{busy ? <LoaderCircle size={15} className="animate-spin"/> : <FileSpreadsheet size={15}/>} {busy ? "Importowanie…" : "Importuj XLS"}</button></footer>
    </form>
  </dialog>;
}

function BondStat({ label, value, tone }: { label: string; value: string; tone?: "tax" | "net" }) {
  return <div className={`bond-summary-stat ${tone ?? ""}`}><span>{label}</span><strong>{value}</strong></div>;
}

function dateLabel(value: string) {
  try { return new Intl.DateTimeFormat("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(`${value}T12:00:00`)); }
  catch { return value; }
}

function message(cause: unknown) { return cause instanceof Error ? cause.message : "Operacja nie powiodła się."; }
