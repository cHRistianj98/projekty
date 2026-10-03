import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowRightLeft, FileSpreadsheet, Info, LoaderCircle, Plus, RefreshCw, ScrollText, Trash2, Upload, X } from "lucide-react";
import type { Asset } from "../../types/Asset";
import { retailBondApi, type RetailBondPortfolio, type RetailBondPosition } from "../../api/retailBondApi";
import { portfolioApi } from "../../api/portfolioApi";
import type { PortfolioWallet } from "../../types/Portfolio";
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
  const [portfolios, setPortfolios] = useState<PortfolioWallet[]>([]);
  const [positionAction, setPositionAction] = useState<{ type: "transfer" | "remove"; position: RetailBondPosition } | null>(null);
  const [actionQuantity, setActionQuantity] = useState("");
  const [targetPortfolioId, setTargetPortfolioId] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    dialog.current?.showModal();
    setPage(1);
    void load();
    return () => dialog.current?.close();
  }, [asset.id]);

  async function load() {
    setLoading(true); setError("");
    try {
      const [bondData, walletData] = await Promise.all([retailBondApi.get(asset.id), portfolioApi.getAll()]);
      setData(bondData);
      setPortfolios(walletData.filter(wallet => wallet.type !== "GOALS"));
    } catch (cause) { setError(message(cause)); }
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

  function openPositionAction(type: "transfer" | "remove", position: RetailBondPosition) {
    const targets = portfolios.filter(wallet => wallet.id !== asset.portfolioId);
    setPositionAction({ type, position });
    setActionQuantity(String(position.availableQuantity));
    setTargetPortfolioId(type === "transfer" ? String(targets[0]?.id ?? "") : "");
    setError("");
  }

  function changePage(nextPage: number) {
    setPage(nextPage);
    setPositionAction(null);
    requestAnimationFrame(() => {
      document.querySelector(".bond-position-list")?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    });
  }

  async function executePositionAction(event: FormEvent) {
    event.preventDefault();
    if (!positionAction) return;
    const qty = Number(actionQuantity);
    const max = positionAction.position.availableQuantity;
    if (!Number.isInteger(qty) || qty <= 0 || qty > max) {
      setError(`Podaj liczbę od 1 do ${max} dostępnych sztuk.`);
      return;
    }

    setBusy(true); setError("");
    try {
      if (positionAction.type === "transfer") {
        const portfolioId = Number(targetPortfolioId);
        if (!Number.isInteger(portfolioId) || portfolioId <= 0) throw new Error("Wybierz portfel docelowy.");
        setData(await retailBondApi.transferQuantity(asset.id, positionAction.position.id, portfolioId, qty));
      } else {
        setData(await retailBondApi.removeQuantity(asset.id, positionAction.position.id, qty));
      }
      setPositionAction(null);
      setActionQuantity("");
      setTargetPortfolioId("");
      await onChanged();
    } catch (cause) { setError(message(cause)); }
    finally { setBusy(false); }
  }

  const sortedPositions = data ? [...data.positions].sort((a, b) => b.purchaseDate.localeCompare(a.purchaseDate) || b.id - a.id) : [];
  const pageSize = 10;
  const pageCount = Math.max(1, Math.ceil(sortedPositions.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * pageSize;
  const visiblePositions = sortedPositions.slice(pageStart, pageStart + pageSize);

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
          {visiblePositions.map(item => <div className="bond-position-item" key={item.id}>
              <article className="bond-position-row">
                <div className="bond-position-main"><div className="bond-emission-code">{item.emissionCode}</div><div className="bond-position-meta">{item.quantity} szt. · zakup {dateLabel(item.purchaseDate)} · wykup {dateLabel(item.maturityDate)}</div></div>
                <div className="bond-position-rate"><span>Oprocentowanie</span><strong>{item.currentRate == null ? "—" : `${item.currentRate.toLocaleString("pl-PL", { maximumFractionDigits: 2 })}%`}</strong>{item.currentPeriod != null && <small>okres {item.currentPeriod}</small>}</div>
                <div className="bond-position-money"><span>Brutto</span><strong>{money(item.currentGrossValue)}</strong><small>zysk {money(item.taxableGain)}</small></div>
                <div className="bond-position-money tax"><span>Belka</span><strong>-{money(item.taxAmount)}</strong><small>19% naliczonych odsetek</small></div>
                <div className="bond-position-money net"><span>Netto</span><strong>{money(item.currentNetValue)}</strong><small>na {dateLabel(item.valuationDate)}</small></div>
                <div className="bond-position-money redemption"><span className="bond-redemption-heading">Wykup dziś* <span className="bond-info-tooltip" tabIndex={0} aria-label="Dlaczego wykup może być niższy od nominału?" data-tooltip="Przy przedterminowym wykupie niektórych obligacji w kolejnych okresach odsetkowych pełna opłata może być wyższa niż bieżące naliczone odsetki. Dlatego chwilowa kwota wykupu może spaść poniżej 100 zł za sztukę."><Info size={12}/></span></span><strong>{money(item.currentRedemptionValue)}</strong><small>{money(item.currentRedemptionPricePerBond)}/szt. · opłata {money(item.earlyRedemptionFeePerBond)}/szt.</small></div>
                <div className="bond-position-actions">
                  {item.blockedQuantity > 0 && <span className="bond-blocked">{item.blockedQuantity} zabl.</span>}
                  <button type="button" className="investment-icon-button bond-transfer-button" disabled={busy || item.availableQuantity <= 0 || portfolios.filter(wallet => wallet.id !== asset.portfolioId).length === 0} title="Przenieś część emisji" onClick={() => openPositionAction("transfer", item)}><ArrowRightLeft size={16}/></button>
                  <button type="button" className="investment-icon-button bond-remove-button" disabled={busy || item.availableQuantity <= 0} title="Usuń część emisji" onClick={() => openPositionAction("remove", item)}><Trash2 size={16}/></button>
                </div>
              </article>

              {positionAction?.position.id === item.id && <form className={`bond-position-action-panel ${positionAction.type}`} onSubmit={executePositionAction}>
                <div className="bond-position-action-copy">
                  <strong>{positionAction.type === "transfer" ? `Przenieś ${item.emissionCode}` : `Usuń część ${item.emissionCode}`}</strong>
                  <span>Dostępne: {item.availableQuantity} szt.{item.blockedQuantity > 0 ? ` · ${item.blockedQuantity} szt. zablokowanych` : ""}</span>
                </div>
                <label>Liczba sztuk<input autoFocus type="number" min="1" max={item.availableQuantity} step="1" value={actionQuantity} onChange={event => setActionQuantity(event.target.value)}/></label>
                {positionAction.type === "transfer" && <label>Portfel docelowy<select value={targetPortfolioId} onChange={event => setTargetPortfolioId(event.target.value)}>{portfolios.filter(wallet => wallet.id !== asset.portfolioId).map(wallet => <option value={wallet.id} key={wallet.id}>{wallet.name}</option>)}</select></label>}
                <div className="bond-position-action-note">{positionAction.type === "transfer" ? "Ta sama emisja w portfelu docelowym zostanie automatycznie scalona." : "Usunięcie dotyczy tylko Freedom Engine — nie składa dyspozycji wykupu w serwisie Obligacje Skarbowe."}</div>
                <div className="bond-position-action-buttons"><button type="button" className="investment-button secondary" disabled={busy} onClick={() => setPositionAction(null)}>Anuluj</button><button className={`investment-button ${positionAction.type === "remove" ? "bond-remove-submit" : ""}`} disabled={busy}>{busy ? "Zapisywanie…" : positionAction.type === "transfer" ? "Przenieś" : "Usuń sztuki"}</button></div>
              </form>}
            </div>)}
          {!data.positions.length && <div className="investment-empty">Brak emisji. Dodaj je ręcznie albo zaimportuj XLS z serwisu Obligacje Skarbowe.</div>}
          {data.positions.length > pageSize && <nav className="bond-pagination" aria-label="Strony emisji obligacji">
            <span className="bond-pagination-range">{pageStart + 1}–{Math.min(pageStart + pageSize, sortedPositions.length)} z {sortedPositions.length}</span>
            <div className="bond-pagination-controls">
              <button type="button" className="bond-page-nav" disabled={currentPage === 1} onClick={() => changePage(currentPage - 1)} aria-label="Poprzednia strona">‹</button>
              {Array.from({ length: pageCount }, (_, index) => index + 1).map(pageNumber => <button type="button" key={pageNumber} className={`bond-page-number ${pageNumber === currentPage ? "active" : ""}`} aria-current={pageNumber === currentPage ? "page" : undefined} onClick={() => changePage(pageNumber)}>{pageNumber}</button>)}
              <button type="button" className="bond-page-nav" disabled={currentPage === pageCount} onClick={() => changePage(currentPage + 1)} aria-label="Następna strona">›</button>
            </div>
          </nav>}
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
