import { useCallback, useEffect, useRef, useState, type CSSProperties, type DragEvent as ReactDragEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowDownRight, ArrowRight, ArrowRightLeft, ArrowUpRight, Banknote, ChartNoAxesCombined, ChartPie, Check, ClipboardCopy, CreditCard, FileSpreadsheet, GripVertical, Landmark, ListTree, LoaderCircle, MoreVertical, Pencil, Plus, ScrollText, Sparkles, Target, Trash2, TrendingUp, TriangleAlert, WalletCards } from "lucide-react";
import type { Asset } from "../types/Asset";
import { assetCategoryLabels, getAssetCategory, getAssetIconKey, metalUnitLabel } from "../types/Asset";
import type { Goal } from "../types/Goal";
import type { MonthlySnapshot } from "../types/MonthlySnapshot";
import type { MoneyFlowOverview } from "../types/GoalAllocation";
import type { LiabilityAllocationOverview, LiabilityPortfolioAllocation } from "../types/LiabilityAllocation";
import type { Liability } from "../types/Liability";
import type { PortfolioWallet } from "../types/Portfolio";
import { goalAllocationApi } from "../api/goalAllocationApi";
import { liabilityAllocationApi } from "../api/liabilityAllocationApi";
import { liabilityApi } from "../api/liabilityApi";
import { portfolioApi } from "../api/portfolioApi";
import { AssetIcon } from "../components/investments/assetIcons";
import { AddAssetModal } from "../components/investments/AddAssetModal";
import { EditAssetModal } from "../components/investments/EditAssetModal";
import { CashReconciliationDialog } from "../components/investments/CashReconciliationDialog";
import { RetailBondDetailsDialog, RetailBondImportDialog, RetailBondManualDialog } from "../components/investments/RetailBondDetailsDialog";
import { Donut, HistoryChart, WealthChart } from "../components/investments/PortfolioCharts";
import { GoalCapitalDialog, PortfolioDialog, PortfolioForm, TransferForm, WalletIcon, errorMessage } from "../components/investments/PortfolioDialogs";
import { fundedGoals, money, percent, reservationsByAsset, type FundedGoal } from "../components/investments/portfolioView";
import "./Investments.css";

type InvestmentsProps = {
  portfolio: Asset[];
  goals: Goal[];
  monthlySnapshots: MonthlySnapshot[];
  onAddAsset: (asset: Asset) => Promise<void>;
  onUpdateAsset: (asset: Asset) => Promise<void>;
  onDeleteAsset: (id: number) => Promise<void>;
  onPortfolioChanged: () => Promise<void>;
  onTransactionsChanged: () => Promise<void>;
  onReleaseMoney: (goalId: number, assetId: number, amount: number) => Promise<void>;
};

function resolveGoalMiniImage(goal: FundedGoal) {
  if (goal.imageUrl) return { src: goal.imageUrl, position: goal.imagePosition ?? "center" };
  const normalized = goal.name.toLocaleLowerCase("pl-PL");
  if (goal.type === "CAR" || /(bmw|auto|samoch|car)/.test(normalized)) return { src: "/liabilities/car.webp", position: "center" as const };
  if (goal.type === "HOME" || /(dom|mieszkani|działk|dzialk|home)/.test(normalized)) return { src: "/liabilities/house.webp", position: "center" as const };
  if (goal.type === "EMERGENCY_FUND" || /(poduszk|awaryjn|rezerwa)/.test(normalized)) return { src: "/portfolios/emergency-fund.webp", position: "center" as const };
  if (goal.type === "TRAVEL" || /(podróż|podroz|wakac|urlop|travel)/.test(normalized)) return { src: "/portfolios/short-term.webp", position: "center" as const };
  if (/(zęb|zeb|dent|lecz)/.test(normalized)) return { src: "/portfolios/main.webp", position: "center" as const };
  return null;
}

export function Investments({ portfolio, goals, monthlySnapshots, onAddAsset, onUpdateAsset, onDeleteAsset, onPortfolioChanged, onTransactionsChanged, onReleaseMoney }: InvestmentsProps) {
  const [wallets, setWallets] = useState<PortfolioWallet[]>([]);
  const [overview, setOverview] = useState<MoneyFlowOverview | null>(null);
  const [liabilityOverview, setLiabilityOverview] = useState<LiabilityAllocationOverview | null>(null);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState<PortfolioWallet | "new" | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [addTo, setAddTo] = useState<number | null>(null);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [transfer, setTransfer] = useState<{ sourceId?: number } | null>(null);
  const [goalDialog, setGoalDialog] = useState<{ goal: FundedGoal; release: boolean } | null>(null);
  const [menu, setMenu] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [managerError, setManagerError] = useState("");
  const [deleteWallet, setDeleteWallet] = useState<PortfolioWallet | null>(null);
  const [deleteAsset, setDeleteAsset] = useState<Asset | null>(null);
  const [bondDetailsAsset, setBondDetailsAsset] = useState<Asset | null>(null);
  const [bondImportPortfolioId, setBondImportPortfolioId] = useState<number | null>(null);
  const [bondManualPortfolioId, setBondManualPortfolioId] = useState<number | null>(null);
  const [cashReconciliationOpen, setCashReconciliationOpen] = useState(false);
  const [draggingAssetId, setDraggingAssetId] = useState<number | null>(null);
  const [dragOverWalletId, setDragOverWalletId] = useState<number | null>(null);
  const [pendingAssetMove, setPendingAssetMove] = useState<{ asset: Asset; source: PortfolioWallet; target: PortfolioWallet; mergeBonds: boolean } | null>(null);
  const [assetMoveError, setAssetMoveError] = useState("");
  const [analysisPrompt, setAnalysisPrompt] = useState<string | null>(null);
  const [analysisPromptMode, setAnalysisPromptMode] = useState<"PERCENT" | "AMOUNT">("PERCENT");
  const [promptCopied, setPromptCopied] = useState(false);
  const requestId = useRef(0);

  const refresh = useCallback(async () => {
    const request = ++requestId.current;
    try {
      const [nextWallets, nextOverview, nextLiabilityOverview, nextLiabilities] = await Promise.all([
        portfolioApi.getAll(),
        goalAllocationApi.getOverview(),
        liabilityAllocationApi.getOverview(),
        liabilityApi.getAll(),
      ]);
      if (request === requestId.current) {
        setWallets(nextWallets);
        setOverview(nextOverview);
        setLiabilityOverview(nextLiabilityOverview);
        setLiabilities(nextLiabilities);
        setError("");
      }
    } catch (cause) {
      if (request === requestId.current) setError(errorMessage(cause));
    } finally { if (request === requestId.current) setLoading(false); }
  }, []);
  useEffect(() => { void refresh(); return () => { requestId.current++; }; }, [refresh, portfolio, goals]);
  useEffect(() => {
    if (menu == null) return;
    const close = () => setMenu(null);
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    document.addEventListener("click", close); document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("click", close); document.removeEventListener("keydown", escape); };
  }, [menu]);

  const realWallets = wallets.filter(wallet => wallet.type !== "GOALS")
    .sort((a, b) => Number(b.type === "MAIN") - Number(a.type === "MAIN"));
  const total = portfolio.reduce((sum, asset) => sum + asset.value, 0);
  const monthly = realWallets.reduce((sum, wallet) => sum + (wallet.monthlyContribution ?? 0), 0);
  const goalLocked = overview?.totalAllocated ?? 0;
  const liabilityLocked = liabilityOverview?.totalAllocated ?? 0;
  const locked = goalLocked + liabilityLocked;
  const allocated = reservationsByAsset(overview, liabilityOverview);
  const funded = fundedGoals(overview, goals, portfolio, wallets);
  const fundedLiabilities = groupFundedLiabilities(liabilityOverview, portfolio, wallets);
  const selected = wallets.find(wallet => wallet.id === selectedId);
  const selectedAssets = portfolio.filter(asset => asset.portfolioId === selectedId).sort((a, b) => b.value - a.value);
  const portfolioMonthChanges = portfolioMonthlyChanges(portfolio, realWallets, monthlySnapshots);
  const assetMonthChanges = assetMonthlyChanges(portfolio, monthlySnapshots);
  const known = !loading && !error && overview !== null && liabilityOverview !== null;
  const addPortfolio = <button type="button" className="investment-button" onClick={() => setForm("new")}><Plus size={16}/>Dodaj portfel</button>;

  async function managerAction(action: () => Promise<void>) {
    setBusy(true); setManagerError("");
    try { await action(); await refresh(); }
    catch (cause) { setManagerError(errorMessage(cause)); }
    finally { setBusy(false); }
  }

  function startAssetDrag(event: ReactDragEvent<HTMLDivElement>, asset: Asset) {
    if (asset.systemCash || busy) {
      event.preventDefault();
      return;
    }
    setDraggingAssetId(asset.id);
    setAssetMoveError("");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("application/x-freedom-asset-id", String(asset.id));
    event.dataTransfer.setData("text/plain", String(asset.id));
  }

  function dragOverWallet(event: ReactDragEvent<HTMLElement>, wallet: PortfolioWallet) {
    if (draggingAssetId == null) return;
    const asset = portfolio.find(item => item.id === draggingAssetId);
    if (!asset || asset.systemCash || asset.portfolioId === wallet.id) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (dragOverWalletId !== wallet.id) setDragOverWalletId(wallet.id);
  }

  function dropAssetOnWallet(event: ReactDragEvent<HTMLElement>, target: PortfolioWallet) {
    event.preventDefault();
    const rawId = event.dataTransfer.getData("application/x-freedom-asset-id") || event.dataTransfer.getData("text/plain");
    const assetId = Number(rawId || draggingAssetId);
    const asset = portfolio.find(item => item.id === assetId);
    setDraggingAssetId(null);
    setDragOverWalletId(null);
    if (!asset || asset.systemCash || asset.portfolioId === target.id) return;

    const source = realWallets.find(wallet => wallet.id === asset.portfolioId);
    if (!source) return;
    const mergeBonds = getAssetCategory(asset) === "bonds" && portfolio.some(item =>
      item.id !== asset.id &&
      item.portfolioId === target.id &&
      getAssetCategory(item) === "bonds" &&
      item.name.toLocaleLowerCase("pl-PL") === "obligacje skarbowe"
    );
    setAssetMoveError("");
    setPendingAssetMove({ asset, source, target, mergeBonds });
  }

  async function confirmAssetMove() {
    if (!pendingAssetMove) return;
    setBusy(true);
    setAssetMoveError("");
    try {
      await portfolioApi.moveAsset(pendingAssetMove.asset.id, pendingAssetMove.target.id);
      await onPortfolioChanged();
      await refresh();
      setPendingAssetMove(null);
    } catch (cause) {
      setAssetMoveError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  function generateAnalysisPrompt(mode: "PERCENT" | "AMOUNT") {
    setAnalysisPromptMode(mode);
    setAnalysisPrompt(buildPortfolioAnalysisPrompt({
      assets: portfolio,
      wallets: realWallets,
      goals,
      goalOverview: overview,
      liabilities,
      liabilityOverview,
      mode,
    }));
    setPromptCopied(false);
  }

  function openAnalysisPrompt() {
    generateAnalysisPrompt("PERCENT");
  }

  async function copyAnalysisPrompt() {
    if (!analysisPrompt) return;
    try {
      await copyTextToClipboard(analysisPrompt);
      setPromptCopied(true);
      window.setTimeout(() => setPromptCopied(false), 2200);
    } catch {
      setPromptCopied(false);
    }
  }

  return <main className="investments-page">
    <header className="investments-header">
      <div className="investments-title"><span className="investment-heading-icon"><ChartNoAxesCombined size={26}/></span><div><h1>Inwestycje</h1><p>Zarządzaj swoimi portfelami i buduj majątek na przyszłość.</p></div></div>
      {addPortfolio}
    </header>

    {error && <div className="investment-error investment-load-error" role="alert"><span>Nie udało się odświeżyć portfeli: {error}</span><button type="button" onClick={() => void refresh()}>Spróbuj ponownie</button></div>}

    <section className="investment-stats" aria-label="Podsumowanie inwestycji">
      <StatCard tone="green" icon={<WalletCards size={22}/>} label="Łączna wartość portfeli" value={money(total)} caption="Wszystkie portfele i aktywa" art="bars"/>
      <StatCard tone="blue" icon={<ChartPie size={24}/>} label="Liczba portfeli" value={known ? String(realWallets.length) : "—"} caption="Portfel główny i portfele własne" art="blocks"/>
      <StatCard tone="amber" icon={<TrendingUp size={25}/>} label="Miesięczne wpłaty" value={known ? money(monthly) : "—"} caption="Planowane do wszystkich portfeli" art="bars"/>
      <StatCard tone="purple" icon={<Target size={24}/>} label="Kapitał zarezerwowany" value={known ? money(locked) : "—"} caption={known ? `${money(goalLocked)} cele · ${money(liabilityLocked)} zobowiązania` : "Pobieranie rezerwacji…"} art="stat-ring"/>
    </section>

    <div className="investment-charts">
      <WealthChart assets={portfolio} wallets={wallets} overview={overview} liabilityOverview={liabilityOverview} total={total} snapshots={monthlySnapshots}/>
      <HistoryChart snapshots={monthlySnapshots} total={total}/>
    </div>

    <section className="investment-panel portfolios-panel">
      <div className="investment-panel-heading">
        <div className="investment-section-title"><span className="investment-section-icon"><WalletCards size={20}/></span><div><h2>Portfele</h2><p>Twoje strategie inwestycyjne w jednym miejscu.</p></div></div>
        <div className="investment-toolbar"><button type="button" className="investment-button secondary ai-prompt-toolbar" onClick={openAnalysisPrompt} disabled={!known || !realWallets.length || !portfolio.length} title="Wygeneruj lokalnie prompt do analizy portfeli, celów i zobowiązań — bez wysyłania danych do API"><Sparkles size={15}/>Generuj prompt</button><button type="button" className="investment-button secondary" onClick={() => setCashReconciliationOpen(true)}><Landmark size={15}/>Uzgodnij gotówkę</button><button type="button" className="investment-button secondary transfer-toolbar" onClick={() => setTransfer({})} disabled={!known || portfolio.length < 1}><ArrowRightLeft size={15}/>Transfer</button>{addPortfolio}</div>
      </div>
      {loading ? <div className="investment-empty"><LoaderCircle size={20} className="animate-spin"/>Pobieranie portfeli…</div> : !realWallets.length ? <div className="investment-empty">Dodaj pierwszy portfel i nadaj swoim inwestycjom kierunek.</div> :
        <div className="portfolio-cards">{realWallets.map(wallet => {
          const assets = portfolio.filter(asset => asset.portfolioId === wallet.id).sort((a, b) => b.value - a.value);
          const monthChange = portfolioMonthChanges.get(wallet.id);
          const progress = wallet.targetAmount ? wallet.grossValue / wallet.targetAmount * 100 : null;
          const breakdown = assets.filter(asset => asset.value > 0).map(asset => ({ id: String(asset.id), name: asset.name, value: asset.value, color: asset.color }));
          const debtReservations = liabilityReservationsForWallet(wallet.id, liabilityOverview, portfolio);
          return <article
            className={`portfolio-card ${dragOverWalletId === wallet.id ? "portfolio-card-drop-target" : ""}`}
            key={wallet.id}
            style={{ "--portfolio-accent": wallet.color } as CSSProperties}
            onDragOver={event => dragOverWallet(event, wallet)}
            onDrop={event => dropAssetOnWallet(event, wallet)}
          >
            {wallet.imageUrl && (
              <div className="portfolio-card-cover">
                <img
                  src={wallet.imageUrl}
                  alt=""
                  style={{ objectPosition: wallet.imagePosition ?? "center" }}
                />
                <div className="portfolio-card-cover-shade"/>
              </div>
            )}
            <div className="portfolio-card-body">
              <div className="portfolio-card-heading">
                <span className="portfolio-card-icon"><WalletIcon name={wallet.iconKey}/></span>
                <h3>{wallet.name}</h3>
                {wallet.systemPortfolio ? <span className="portfolio-system-tag">SYSTEM</span> : <div className="portfolio-menu-container">
                  <button type="button" aria-label={`Opcje portfela ${wallet.name}`} aria-expanded={menu === wallet.id} className="investment-icon-button" onClick={event => { event.stopPropagation(); setMenu(menu === wallet.id ? null : wallet.id); }}><MoreVertical size={19}/></button>
                  {menu === wallet.id && <div className="portfolio-menu"><button type="button" onClick={() => setForm(wallet)}><Pencil size={14}/>Edytuj portfel</button><button type="button" onClick={() => { setManagerError(""); setDeleteWallet(wallet); }}><Trash2 size={14}/>Usuń portfel</button></div>}
                </div>}
              </div>
              <div className="portfolio-card-value">
                <strong>{money(wallet.grossValue)}</strong>
                <span>{percent(wallet.grossValue, total)} majątku</span>
                {monthChange != null && Math.abs(monthChange) > 0.005 && <span
                  className={`portfolio-month-change ${monthChange > 0 ? "positive" : "negative"}`}
                  title="Zmiana wartości portfela względem ostatniego zamkniętego miesiąca"
                  aria-label={`Zmiana miesiąc do miesiąca: ${monthChange > 0 ? "wzrost" : "spadek"} ${Math.abs(monthChange).toLocaleString("pl-PL", { maximumFractionDigits: 1 })}%`}
                >
                  {monthChange > 0 ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>}
                  {Math.abs(monthChange).toLocaleString("pl-PL", { maximumFractionDigits: 1 })}%
                </span>}
              </div>
              <div className="portfolio-progress-block">
                <div className="investment-progress" role="progressbar" aria-label={`Cel portfela ${wallet.name}`} aria-valuenow={Math.round(Math.min(100, Math.max(0, progress ?? 0)))} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${Math.min(100, Math.max(0, progress ?? 0))}%` }}/></div>
                <div className="portfolio-progress-label"><span>{wallet.targetAmount ? `Cel: ${money(wallet.targetAmount)}` : wallet.systemPortfolio ? "Gotówka i bieżące środki" : "Brak kwoty docelowej"}</span><span>{progress == null ? "—" : `${Math.round(progress)}%`}</span></div>
              </div>
              <div className="portfolio-composition"><Donut rows={breakdown} small/><div className="portfolio-composition-legend">
                {assets.slice(0, 4).map(asset => {
                  const change = asset.systemCash ? null : assetLiveChange(asset);
                  const unallocatedDeficit = asset.systemCash && asset.value < 0;
                  return <div
                    key={asset.id}
                    className={`composition-row ${asset.systemCash ? "system-cash" : "draggable"} ${draggingAssetId === asset.id ? "dragging" : ""}`}
                    draggable={!asset.systemCash && !busy}
                    onDragStart={event => startAssetDrag(event, asset)}
                    onDragEnd={() => { setDraggingAssetId(null); setDragOverWalletId(null); }}
                    title={asset.systemCash ? "Środki nierozdzielone są sterowane automatycznie" : `Przeciągnij ${asset.name} do innego portfela`}
                  >
                    {!asset.systemCash && <span className="portfolio-drag-grip" aria-hidden="true"><GripVertical size={13}/></span>}
                    <span className="investment-dot" style={{ background: asset.color }}/>
                    <span className="composition-name" title={asset.name}>{unallocatedDeficit ? <><span>Środki nierozdzielone</span><small className="unallocated-deficit-note">DO UZGODNIENIA</small></> : <>{percent(asset.value, wallet.grossValue)}&nbsp; {asset.name}</>}</span>
                    {change != null && <span title={change.title} className={`asset-change-badge ${change.value >= 0 ? "positive" : "negative"}`}><span className="asset-change-icon">{change.value >= 0 ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>}</span>{formatChangePercent(change.value)}</span>}
                    <span className={`composition-value ${unallocatedDeficit ? "negative" : ""}`}>{money(asset.value)}</span>
                  </div>;
                })}
                {assets.length > 4 && <span className="investment-note">+ {assets.length - 4} pozostałych aktywów</span>}
                {!assets.length && <span className="investment-note">Dodaj pierwsze aktywo</span>}
              </div></div>
              {debtReservations.length > 0 && <div className="portfolio-debt-reservations" aria-label="Rezerwy na zobowiązania">
                {debtReservations.slice(0, 2).map(item => <Link to="/liabilities" className="portfolio-debt-chip" key={item.liabilityId}>
                  <img src={item.imageUrl || "/liabilities/card.webp"} alt="" style={{ objectPosition: item.imagePosition ?? "center" }}/><span><small>NA SPŁATĘ</small><strong title={item.name}>{item.name}</strong></span><b>{money(item.amount)}</b>
                </Link>)}
                {debtReservations.length > 2 && <span className="portfolio-debt-more">+{debtReservations.length - 2} zobowiąz.</span>}
              </div>}
              {wallet.allocatedOut > 0 && <p className="portfolio-reserved">{money(wallet.allocatedOut)} zarezerwowane · dostępne {money(wallet.value)}</p>}
              <button type="button" className="investment-button secondary portfolio-manage" onClick={() => { setSelectedId(wallet.id); setManagerError(""); }}>Zarządzaj portfelem <ArrowRight size={14}/></button>
            </div>
          </article>;
        })}</div>}
    </section>

    <section className="investment-panel goals-capital-panel">
      <div className="investment-panel-heading">
        <div className="investment-section-title"><span className="investment-section-icon purple"><Target size={24}/></span><div><h2>Kapitał przypisany do celów</h2><p>Środki z portfeli zarezerwowane na konkretne cele.</p></div></div>
        <Link to="/goals" className="investment-button secondary">Przejdź do celów <ArrowRight size={15}/></Link>
      </div>
      {!funded.length && <div className="investment-empty">{loading ? "Pobieranie rezerwacji…" : "Przypisz środki do celu, aby zobaczyć je tutaj."}</div>}
      <div className="goal-capital-rows">{funded.map(goal => <article className="goal-capital-row" key={goal.id}>
        <div className="goal-capital-name">
          {(() => {
            const image = resolveGoalMiniImage(goal);
            return image ? (
              <div className="goal-capital-thumb">
                <img src={image.src} alt="" style={{ objectPosition: image.position }} />
              </div>
            ) : (
              <span className="portfolio-card-icon"><Target size={22}/></span>
            );
          })()}
          <div><h3>{goal.name}</h3><p>Z portfeli: {goal.sources.join(", ")}</p></div>
        </div>
        <strong className="goal-capital-amount">{money(goal.amount)}</strong>
        <div className="goal-capital-progress"><div className="investment-progress purple"><span style={{ width: `${goal.target > 0 ? Math.min(100, goal.amount / goal.target * 100) : 0}%` }}/></div><span>{goal.target > 0 ? percent(goal.amount, goal.target) : "—"}</span></div>
        <div className="goal-capital-sources">{goal.allocations.slice(0, 3).map((row, index) => <div key={`${row.assetId}-${index}`}><span className="investment-dot" style={{ background: portfolio.find(asset => asset.id === row.assetId)?.color ?? "#8b5cf6" }}/><span>{row.assetName}</span><strong>{money(row.amount)}</strong></div>)}{goal.allocations.length > 3 && <span className="investment-note">+ {goal.allocations.length - 3} źródeł</span>}</div>
        <div className="goal-capital-actions"><button type="button" className="investment-button secondary" onClick={() => setGoalDialog({ goal, release: false })}>Szczegóły</button><button type="button" className="investment-button secondary" disabled={!known || !goal.allocations.some(row => row.assetId != null)} onClick={() => setGoalDialog({ goal, release: true })}>Zwolnij środki</button></div>
      </article>)}</div>
    </section>

    <section className="investment-panel liability-capital-panel">
      <div className="investment-panel-heading">
        <div className="investment-section-title"><span className="investment-section-icon amber"><CreditCard size={22}/></span><div><h2>Kapitał przeznaczony na spłatę zobowiązań</h2><p>To nadal Twoje aktywa — tylko zarezerwowane na konkretny dług.</p></div></div>
        <Link to="/liabilities" className="investment-button secondary">Przejdź do zobowiązań <ArrowRight size={15}/></Link>
      </div>
      {!fundedLiabilities.length && <div className="investment-empty">{loading ? "Pobieranie rezerwacji…" : "Przypisz aktywa do zobowiązania, aby zobaczyć je tutaj."}</div>}
      <div className="goal-capital-rows">{fundedLiabilities.map(item => {
        const effectiveRemaining = Math.max(item.bankRemainingAmount - item.amount, 0);
        const coverage = item.bankRemainingAmount > 0 ? Math.min(100, item.amount / item.bankRemainingAmount * 100) : 100;
        return <article className="goal-capital-row liability-capital-row" key={item.id}>
          <div className="goal-capital-name liability-capital-name">
            <img src={item.imageUrl || "/liabilities/card.webp"} alt="" style={{ objectPosition: item.imagePosition ?? "center" }}/>
            <div><h3>{item.name}</h3><p>Z portfeli: {item.sources.join(", ")}</p></div>
          </div>
          <strong className="goal-capital-amount liability-capital-amount">{money(item.amount)}</strong>
          <div className="goal-capital-progress"><div className="investment-progress amber"><span style={{ width: `${coverage}%` }}/></div><span>{Math.round(coverage)}%</span></div>
          <div className="goal-capital-sources">{item.allocations.slice(0, 3).map((row, index) => <div key={`${row.assetId}-${index}`}><span className="investment-dot" style={{ background: portfolio.find(asset => asset.id === row.assetId)?.color ?? "#f59e0b" }}/><span>{row.assetName}</span><strong>{money(row.amount)}</strong></div>)}{item.allocations.length > 3 && <span className="investment-note">+ {item.allocations.length - 3} źródeł</span>}</div>
          <div className="goal-capital-actions"><span className="liability-effective-caption">Efektywnie niepokryte<br/><strong>{money(effectiveRemaining)}</strong></span><Link to="/liabilities" className="investment-button secondary">Zarządzaj</Link></div>
        </article>;
      })}</div>
    </section>

    {analysisPrompt && <PortfolioDialog
      wide
      className="portfolio-ai-prompt-dialog"
      title="Prompt do analizy finansów"
      subtitle={analysisPromptMode === "PERCENT"
        ? "Wersja prywatna: portfele, cele i zobowiązania opisane wyłącznie procentami — bez kwot."
        : "Wersja pełna: rzeczywiste kwoty PLN, aby AI mogło zaproponować dokładny plan alokacji kapitału."}
      icon={<Sparkles size={22}/>}
      onClose={() => { setAnalysisPrompt(null); setPromptCopied(false); }}
    >
      <div className="portfolio-ai-prompt">
        <div className="portfolio-ai-mode-switch" role="group" aria-label="Wersja promptu">
          <button
            type="button"
            className={analysisPromptMode === "PERCENT" ? "active" : ""}
            onClick={() => generateAnalysisPrompt("PERCENT")}
          >
            <ChartPie size={15}/> Procentowy
            <small>bez kwot</small>
          </button>
          <button
            type="button"
            className={analysisPromptMode === "AMOUNT" ? "active amount" : ""}
            onClick={() => generateAnalysisPrompt("AMOUNT")}
          >
            <Banknote size={15}/> Kwotowy
            <small>konkretny plan PLN</small>
          </button>
        </div>
        <div className="portfolio-ai-prompt-badges" aria-label="Właściwości promptu">
          <span><Sparkles size={12}/>Bez API</span>
          <span>{analysisPromptMode === "PERCENT" ? "Wyłącznie %" : "Rzeczywiste PLN"}</span>
          <span>Cele + zobowiązania</span>
          <span>Odpowiedź po polsku</span>
        </div>
        <div className="portfolio-ai-prompt-hint">
          <strong>Gotowy do wklejenia.</strong>
          <span>{analysisPromptMode === "PERCENT"
            ? "AI dostaje strukturę portfeli, postęp celów, terminy, oprocentowanie zobowiązań oraz procentowe przypisania kapitału. Ma ocenić, czy obecny plan prowadzi do realizacji celów i jak go poprawić."
            : "AI dostaje realne kwoty i ma rozpisać konkretnie, ile PLN skierować do każdego portfela, celu, inwestycji lub nadpłaty zobowiązania oraz w jakiej kolejności."}</span>
        </div>
        <textarea
          className="portfolio-ai-prompt-textarea"
          readOnly
          spellCheck={false}
          value={analysisPrompt}
          aria-label="Wygenerowany prompt do analizy portfeli"
          onFocus={event => event.currentTarget.select()}
        />
        <footer className="portfolio-ai-prompt-actions">
          <button type="button" className="investment-button secondary" onClick={() => { setAnalysisPrompt(null); setPromptCopied(false); }}>Zamknij</button>
          <button type="button" className={`investment-button portfolio-ai-copy ${promptCopied ? "copied" : ""}`} onClick={() => void copyAnalysisPrompt()}>
            {promptCopied ? <Check size={16}/> : <ClipboardCopy size={16}/>}
            {promptCopied ? "Skopiowano" : "Skopiuj prompt"}
          </button>
        </footer>
      </div>
    </PortfolioDialog>}

    {form && <PortfolioForm wallet={form === "new" ? undefined : form} onClose={() => setForm(null)} onSave={async input => { if (form === "new") await portfolioApi.create(input); else await portfolioApi.update(form.id, input); await refresh(); }}/>}
    {transfer && <TransferForm assets={portfolio} wallets={realWallets} allocated={allocated} sourceId={transfer.sourceId} onClose={() => setTransfer(null)} onTransfer={async input => { await portfolioApi.transfer(input); await Promise.all([onPortfolioChanged(), onTransactionsChanged()]); await refresh(); }}/>}
    {goalDialog && <GoalCapitalDialog goal={goalDialog.goal} release={goalDialog.release} onClose={() => setGoalDialog(null)} onRelease={async (assetId, amount) => { await onReleaseMoney(goalDialog.goal.id, assetId, amount); await refresh(); }}/>}
    {selected && <PortfolioDialog wide title={selected.name} subtitle={`${money(selected.grossValue)} w aktywach · ${money(selected.value)} dostępne`} busy={busy} onClose={() => setSelectedId(null)}>
      <div className="investment-manager">
        <div className="investment-toolbar">
          <button type="button" className="investment-button" disabled={busy} onClick={() => { setSelectedId(null); setAddTo(selected.id); }}><Plus size={15}/>Dodaj aktywo</button>
          <button type="button" className="investment-button secondary bond-toolbar-button" disabled={busy} onClick={() => { setSelectedId(null); setBondManualPortfolioId(selected.id); }}><ScrollText size={15}/>Dodaj emisję</button>
          <button type="button" className="investment-button secondary bond-toolbar-button" disabled={busy} onClick={() => { setSelectedId(null); setBondImportPortfolioId(selected.id); }}><FileSpreadsheet size={15}/>Import XLS</button>
          <button type="button" className="investment-button secondary" disabled={busy || !known || portfolio.length < 1} onClick={() => { setSelectedId(null); setTransfer({ sourceId: selectedAssets[0]?.id }); }}><ArrowRightLeft size={15}/>Transfer</button>
          {!selected.systemPortfolio && <button type="button" className="investment-button secondary" disabled={busy} onClick={() => { setSelectedId(null); setForm(selected); }}><Pencil size={15}/>Edytuj portfel</button>}
        </div>
        {managerError && <p className="investment-error" role="alert">{managerError}</p>}
        {!selectedAssets.length && <p className="investment-empty">Ten portfel czeka na pierwsze aktywo.</p>}
        {selectedAssets.map(asset => {
          const change = asset.systemCash ? null : assetLiveChange(asset);
          const monthChange = asset.systemCash ? undefined : assetMonthChanges.get(asset.id);
          const unallocatedDeficit = asset.systemCash && asset.value < 0;
          return <div className="managed-asset" key={asset.id}>
            <span className="managed-asset-icon" style={{ color: asset.color }}><AssetIcon iconKey={getAssetIconKey(asset)} size={24}/></span>
            <div className="managed-asset-info"><h3>{asset.name} {asset.systemCash && <span className="portfolio-system-tag">SYSTEM</span>} {(asset.marketPriced || asset.fxPriced || asset.stockPriced) && <span className="portfolio-system-tag">LIVE</span>}</h3><span>{assetCategoryLabels[getAssetCategory(asset)]}{asset.fxPriced && asset.cashQuantity != null ? ` · ${asset.cashQuantity.toLocaleString("pl-PL", { maximumFractionDigits: 2 })} ${asset.cashCurrency ?? ""}` : ""}{asset.marketPriced && asset.metalQuantity != null ? ` · ${asset.metalQuantity.toLocaleString("pl-PL")} ${metalUnitLabel(asset.metalUnit)}` : ""}{asset.marketPriced && asset.cryptoQuantity != null ? ` · ${asset.cryptoQuantity.toLocaleString("pl-PL", { maximumFractionDigits: 8 })} ${asset.cryptoSymbol ?? ""}` : ""}{asset.stockPriced && asset.stockQuantity != null ? ` · ${asset.stockQuantity.toLocaleString("pl-PL", { maximumFractionDigits: 6 })} ${asset.stockSymbol ?? ""}` : ""}{asset.marketPriced && asset.realEstateAreaSqm != null ? ` · ${asset.realEstateAreaSqm.toLocaleString("pl-PL")} m²` : ""}</span>{asset.fxPriced && asset.fxRatePln != null && <small>FX: 1 {asset.cashCurrency} = {asset.fxRatePln.toLocaleString("pl-PL", { minimumFractionDigits: 4, maximumFractionDigits: 4 })} zł{asset.fxEffectiveDate ? ` · kurs z ${asset.fxEffectiveDate}` : ""}</small>}{asset.marketPriced && asset.marketPriceUsd != null && asset.usdPlnRate != null && <small>Spot: ${asset.marketPriceUsd.toLocaleString("en-US", { maximumFractionDigits: 2 })}/oz · USD/PLN {asset.usdPlnRate.toLocaleString("pl-PL", { maximumFractionDigits: 4 })}</small>}{asset.marketPriced && asset.cryptoPricePln != null && <small>CoinGecko: {asset.cryptoPricePln.toLocaleString("pl-PL", { maximumFractionDigits: asset.cryptoPricePln < 1 ? 8 : 2 })} zł / {asset.cryptoSymbol ?? "token"}</small>}{asset.stockPriced && asset.stockCurrentPrice != null && <small>Stooq: {asset.stockCurrentPrice.toLocaleString("pl-PL", { maximumFractionDigits: 6 })} {asset.stockCurrency ?? ""}</small>}{asset.stockPriced && asset.stockGrossValuePln != null && <small>Brutto: {money(asset.stockGrossValuePln)} · koszt: {money(asset.stockCostBasisPln ?? 0)} · wynik: {money(asset.stockUnrealizedGainPln ?? 0)} · est. podatek: -{money(asset.stockTaxAmountPln ?? 0)} · netto: {money(asset.value)}</small>}{asset.marketPriced && asset.realEstateMedianPriceSqm != null && <small>mScanner / RCN: {asset.realEstateMedianPriceSqm.toLocaleString("pl-PL", { maximumFractionDigits: 0 })} zł/m² · {asset.realEstateResolvedArea ?? asset.realEstateCity}{asset.realEstateRecordCount != null ? ` · ${asset.realEstateRecordCount} transakcji` : ""}</small>}{asset.marketPriced && asset.realEstateValuationMode === "MARKET_ANCHORED" && asset.realEstateQualityFactor != null && <small>Kotwica zakupu: {(asset.realEstateQualityFactor >= 1 ? "+" : "")}{((asset.realEstateQualityFactor - 1) * 100).toLocaleString("pl-PL", { maximumFractionDigits: 1 })}% vs rynek · est. {(asset.realEstateEstimatedPriceSqm ?? asset.realEstateMedianPriceSqm ?? 0).toLocaleString("pl-PL", { maximumFractionDigits: 0 })} zł/m²</small>}{getAssetCategory(asset) === "bonds" && asset.bondGrossValue != null && <small className="bond-aggregate-caption">Wartość netto po podatku Belki · szczegóły i emisje pod przyciskiem „Emisje”</small>}<small>Zarezerwowane: {money(allocated.get(asset.id) ?? 0)} · dostępne: {money(asset.value - (allocated.get(asset.id) ?? 0))}</small></div>
            <div className="managed-asset-value">
              <strong className={unallocatedDeficit ? "unallocated-deficit-value" : ""}>{money(asset.value)}</strong>
              {unallocatedDeficit && <span className="unallocated-deficit-badge" title="Wydatki bez wskazanego źródła przekroczyły nierozdzielone środki. Uzgodnij stan kont i gotówki, gdy będziesz znać rzeczywiste salda.">DO UZGODNIENIA</span>}
              <div className="managed-asset-changes">
                {monthChange != null && Math.abs(monthChange) > 0.005 && <span
                  className={`asset-change-badge large ${monthChange > 0 ? "positive" : "negative"}`}
                  title="Zmiana wartości tej pozycji w PLN względem ostatniego zamkniętego miesiąca"
                ><span className="asset-change-icon">{monthChange > 0 ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>}</span>m/m {Math.abs(monthChange).toLocaleString("pl-PL", { maximumFractionDigits: 1 })}%</span>}
                {change != null && <span title={change.title} className={`asset-change-badge large ${change.value >= 0 ? "positive" : "negative"}`}><span className="asset-change-icon">{change.value >= 0 ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>}</span>{change.label} {formatChangePercent(change.value)}</span>}
              </div>
            </div>
            {!asset.systemCash ? <div className="managed-asset-controls">
              <label><span className="sr-only">Portfel aktywa {asset.name}</span><select disabled={busy} value={asset.portfolioId} onChange={event => void managerAction(async () => { await portfolioApi.moveAsset(asset.id, Number(event.target.value)); await onPortfolioChanged(); })}>{realWallets.map(wallet => <option key={wallet.id} value={wallet.id}>{wallet.name}</option>)}</select></label>
              {getAssetCategory(asset) === "bonds" ? <button type="button" disabled={busy} className="investment-button secondary bond-details-button" onClick={() => { setSelectedId(null); setBondDetailsAsset(asset); }}><ListTree size={14}/>Emisje</button> : <button type="button" disabled={busy} className="investment-icon-button" aria-label={`Edytuj ${asset.name}`} onClick={() => { setSelectedId(null); setEditingAsset(asset); }}><Pencil size={16}/></button>}
              <button type="button" disabled={busy || (allocated.get(asset.id) ?? 0) > 0} title={(allocated.get(asset.id) ?? 0) > 0 ? "Najpierw zwolnij rezerwacje na cele lub zobowiązania" : "Usuń aktywo"} className="investment-icon-button" aria-label={`Usuń ${asset.name}`} onClick={() => { setSelectedId(null); setManagerError(""); setDeleteAsset(asset); }}><Trash2 size={16}/></button>
            </div> : <span className="portfolio-system-tag">AUTO</span>}
          </div>;
        })}
      </div>
    </PortfolioDialog>}
    {pendingAssetMove && <PortfolioDialog
      title="Przenieść całe aktywo?"
      subtitle="Ta operacja zmienia strukturę portfeli. Potwierdź, zanim Freedom przeniesie pozycję."
      busy={busy}
      onClose={() => { if (!busy) { setPendingAssetMove(null); setAssetMoveError(""); } }}
    >
      <div className="investment-form asset-move-confirmation">
        <div className="asset-move-summary">
          <span className="managed-asset-icon" style={{ color: pendingAssetMove.asset.color }}><AssetIcon iconKey={getAssetIconKey(pendingAssetMove.asset)} size={24}/></span>
          <div><small>PRZENOSISZ W CAŁOŚCI</small><strong>{pendingAssetMove.asset.name}</strong><span>{money(pendingAssetMove.asset.value)}</span></div>
        </div>
        <div className="asset-move-route">
          <div><small>Z PORTFELA</small><strong>{pendingAssetMove.source.name}</strong></div>
          <span className="asset-move-route-arrow"><ArrowRight size={18}/></span>
          <div><small>DO PORTFELA</small><strong>{pendingAssetMove.target.name}</strong></div>
        </div>
        <div className="asset-move-warning">
          <TriangleAlert size={18}/>
          <div><strong>Operacja obejmuje całą pozycję.</strong><span>{pendingAssetMove.mergeBonds
            ? "W portfelu docelowym są już Obligacje skarbowe. Wszystkie emisje zostaną przeniesione, a identyczne emisje (kod + data zakupu) zostaną scalone i zsumowane."
            : getAssetCategory(pendingAssetMove.asset) === "bonds"
              ? "Wszystkie emisje obligacji przejdą razem z aktywem do nowego portfela."
              : "Aktywo zachowa swoją wartość i historię, ale od tej chwili będzie należeć do portfela docelowego."}</span></div>
        </div>
        {assetMoveError && <p className="investment-error" role="alert">{assetMoveError}</p>}
        <footer>
          <button type="button" className="investment-button secondary" disabled={busy} onClick={() => { setPendingAssetMove(null); setAssetMoveError(""); }}>Anuluj</button>
          <button type="button" className="investment-button asset-move-confirm-button" disabled={busy} onClick={() => void confirmAssetMove()}>{busy ? "Przenoszenie…" : "Tak, przenieś aktywo"}</button>
        </footer>
      </div>
    </PortfolioDialog>}
    {cashReconciliationOpen && <CashReconciliationDialog
      onClose={() => setCashReconciliationOpen(false)}
      onReconciled={async () => { await onPortfolioChanged(); await refresh(); }}
      onAddCashAsset={() => {
        setCashReconciliationOpen(false);
        const main = realWallets.find(wallet => wallet.type === "MAIN") ?? realWallets[0];
        if (main) setAddTo(main.id);
      }}
    />}
    {bondDetailsAsset && <RetailBondDetailsDialog asset={bondDetailsAsset} onClose={() => setBondDetailsAsset(null)} onChanged={async () => { await onPortfolioChanged(); await refresh(); }}/>}
    {bondManualPortfolioId != null && <RetailBondManualDialog portfolioId={bondManualPortfolioId} onClose={() => setBondManualPortfolioId(null)} onCreated={async () => { await onPortfolioChanged(); await refresh(); }}/>}
    {bondImportPortfolioId != null && <RetailBondImportDialog portfolioId={bondImportPortfolioId} onClose={() => setBondImportPortfolioId(null)} onImported={async () => { await onPortfolioChanged(); await refresh(); }}/>}
    {addTo != null && <AddAssetModal onClose={() => setAddTo(null)} onAdd={async asset => { await onAddAsset({ ...asset, portfolioId: addTo }); await refresh(); }}/>}
    {editingAsset && <EditAssetModal asset={editingAsset} onClose={() => setEditingAsset(null)} onUpdate={async asset => { await onUpdateAsset(asset); await refresh(); }}/>}
    {(deleteWallet || deleteAsset) && <PortfolioDialog title={deleteWallet ? "Usuń portfel" : "Usuń aktywo"} onClose={() => { setDeleteWallet(null); setDeleteAsset(null); }} busy={busy}>
      <div className="investment-form"><p>{deleteWallet ? `Usunąć portfel „${deleteWallet.name}”? Portfel musi być pusty.` : `Usunąć aktywo „${deleteAsset?.name}”? Jego wartość zostanie odjęta od majątku.`}</p>{managerError && <p role="alert" className="investment-error">{managerError}</p>}<footer><button type="button" className="investment-button secondary" disabled={busy} onClick={() => { setDeleteWallet(null); setDeleteAsset(null); }}>Anuluj</button><button type="button" className="investment-button danger" disabled={busy} onClick={() => void managerAction(async () => { if (deleteWallet) await portfolioApi.remove(deleteWallet.id); else if (deleteAsset) await onDeleteAsset(deleteAsset.id); setDeleteWallet(null); setDeleteAsset(null); })}>{busy ? "Usuwanie…" : "Usuń"}</button></footer></div>
    </PortfolioDialog>}
  </main>;
}

type PortfolioPromptMode = "PERCENT" | "AMOUNT";

type PortfolioPromptInput = {
  assets: Asset[];
  wallets: PortfolioWallet[];
  goals: Goal[];
  goalOverview: MoneyFlowOverview | null;
  liabilities: Liability[];
  liabilityOverview: LiabilityAllocationOverview | null;
  mode: PortfolioPromptMode;
};

function buildPortfolioAnalysisPrompt({
  assets,
  wallets,
  goals,
  goalOverview,
  liabilities,
  liabilityOverview,
  mode,
}: PortfolioPromptInput): string {
  const analysableAssets = assets.filter(asset => !asset.systemCash);
  const totalValue = analysableAssets.reduce((sum, asset) => sum + asset.value, 0);
  const walletValues = new Map(wallets.map(wallet => [
    wallet.id,
    analysableAssets.filter(asset => asset.portfolioId === wallet.id).reduce((sum, asset) => sum + asset.value, 0),
  ]));
  const sortedWallets = wallets.slice().sort((a, b) => (walletValues.get(b.id) ?? 0) - (walletValues.get(a.id) ?? 0));
  const amountMode = mode === "AMOUNT";
  const lines: string[] = [
    "Jesteś doświadczonym analitykiem portfelowym i planistą finansowym. Przeanalizuj poniższą strukturę mojego majątku, portfeli, celów i zobowiązań. Odpowiedz po polsku.",
    "",
    "CEL ANALIZY",
    "Chcę maksymalizować oczekiwaną długoterminową stopę zwrotu, ale jednocześnie realizować cele finansowe w terminie, zachować odpowiednią płynność i rozsądnie zarządzać zobowiązaniami. Nie traktuj maksymalizacji zysku w oderwaniu od ryzyka, terminów celów i kosztu długu.",
    "",
    "WAŻNE ZASADY",
  ];

  if (amountMode) {
    lines.push(
      "- Ta wersja celowo zawiera rzeczywiste kwoty. Używaj PLN i podawaj konkretne kwoty działań.",
      "- Na końcu przygotuj wykonawczy plan: dokładnie ile PLN skierować do którego portfela, aktywa, celu lub nadpłaty zobowiązania.",
      "- Jeżeli rekomendujesz sprzedaż/przeniesienie kapitału, napisz ile PLN sprzedać lub przenieść, skąd i dokąd.",
      "- Jeżeli nie da się policzyć dokładnej kwoty bez dodatkowej informacji, wskaż brakującą informację i podaj warunkową regułę zamiast zgadywać."
    );
  } else {
    lines.push(
      "- Celowo nie podaję żadnych kwot. Pracuj wyłącznie na udziałach procentowych i punktach procentowych.",
      "- Nie próbuj odgadywać mojego majątku ani przeliczać udziałów na wartości pieniężne.",
      "- Rekomendacje dla celów i zobowiązań również zapisuj procentowo: jako % celu, % zobowiązania, % portfela lub % całego majątku."
    );
  }

  lines.push(
    "- Każdy portfel oceń osobno, a potem oceń cały majątek jako jeden system.",
    "- Dla każdego celu oceń, czy jest realizowany prawidłowo, czy obecne tempo wystarczy do terminu i czy źródła finansowania są sensowne.",
    "- Dla każdego zobowiązania oceń koszt długu, stopień zabezpieczenia kapitałem i sens nadpłaty względem inwestowania. Nie zakładaj, że spłata długu zawsze jest najlepsza.",
    "- Uwzględnij zależność między celami a portfelami: kapitał zarezerwowany na bliski cel nie powinien być oceniany jak kapitał z horyzontem 20 lat.",
    "- Jeżeli z nazwy instrumentu nie da się pewnie ustalić indeksu, regionu, sektora, kosztów lub składu, zaznacz niepewność zamiast zgadywać.",
    "- Środki nierozdzielone są technicznym clearingiem Freedom Engine i zostały pominięte w danych inwestycyjnych.",
    "- Weź pod uwagę nakładanie się ekspozycji między ETF-ami, akcjami, obligacjami, walutami, metalami, nieruchomościami i krypto.",
    "",
    "DANE — STRUKTURA PORTFELI"
  );

  for (const wallet of sortedWallets) {
    const walletAssets = analysableAssets
      .filter(asset => asset.portfolioId === wallet.id)
      .slice()
      .sort((a, b) => b.value - a.value);
    const walletValue = walletValues.get(wallet.id) ?? 0;
    lines.push("");
    if (amountMode) {
      lines.push(`PORTFEL: ${wallet.name} — ${formatPromptMoney(walletValue)} (${formatPromptPercent(walletValue, totalValue)} całego analizowanego majątku)`);
      if ((wallet.monthlyContribution ?? 0) > 0) lines.push(`- planowana wpłata miesięczna: ${formatPromptMoney(wallet.monthlyContribution ?? 0)}`);
      if ((wallet.targetAmount ?? 0) > 0) lines.push(`- cel wartości portfela: ${formatPromptMoney(wallet.targetAmount ?? 0)}; realizacja ${formatPromptPercent(walletValue, wallet.targetAmount ?? 0)}`);
    } else {
      lines.push(`PORTFEL: ${wallet.name} — ${formatPromptPercent(walletValue, totalValue)} całego analizowanego majątku`);
      if ((wallet.monthlyContribution ?? 0) > 0) lines.push(`- planowana wpłata miesięczna: ${formatPromptPercent(wallet.monthlyContribution ?? 0, walletValue)} obecnej wartości portfela miesięcznie`);
      if ((wallet.targetAmount ?? 0) > 0) lines.push(`- realizacja celu wartości portfela: ${formatPromptPercent(walletValue, wallet.targetAmount ?? 0)}`);
    }
    if (!walletAssets.length || walletValue === 0) {
      lines.push("- brak aktywów o niezerowym udziale");
      continue;
    }
    for (const asset of walletAssets) {
      const category = assetCategoryLabels[getAssetCategory(asset)];
      lines.push(amountMode
        ? `- ${asset.name} [${category}] — ${formatPromptMoney(asset.value)} (${formatPromptPercent(asset.value, walletValue)} portfela)`
        : `- ${asset.name} [${category}] — ${formatPromptPercent(asset.value, walletValue)} portfela`);
    }
  }

  const classTotals = new Map<string, number>();
  for (const asset of analysableAssets) {
    const label = assetCategoryLabels[getAssetCategory(asset)];
    classTotals.set(label, (classTotals.get(label) ?? 0) + asset.value);
  }
  const classes = [...classTotals.entries()].sort((a, b) => b[1] - a[1]);
  lines.push("", "ŁĄCZNA STRUKTURA KLAS AKTYWÓW");
  for (const [label, value] of classes) {
    lines.push(amountMode
      ? `- ${label} — ${formatPromptMoney(value)} (${formatPromptPercent(value, totalValue)})`
      : `- ${label} — ${formatPromptPercent(value, totalValue)}`);
  }

  appendGoalsToPrompt(lines, { goals, goalOverview, assets, wallets, totalValue, amountMode });
  appendLiabilitiesToPrompt(lines, { liabilities, liabilityOverview, assets, wallets, totalValue, amountMode });
  appendPortfolioCommitmentsToPrompt(lines, { goalOverview, liabilityOverview, assets, wallets, amountMode });

  lines.push(
    "",
    "ODPOWIEDŹ PRZYGOTUJ W TEJ STRUKTURZE",
    "1. Ocena całości — dywersyfikacja, koncentracja, potencjał wzrostu, płynność oraz relacja aktywów do zobowiązań i celów.",
    "2. Ocena każdego portfela — co jest dobre, co ogranicza oczekiwany zwrot, jakie są ryzyka i czy rola portfela pasuje do finansowanych z niego celów/zobowiązań.",
    "3. Cele finansowe — oceń każdy cel osobno: postęp, tempo, termin, obecne źródła finansowania i czy plan jest realistyczny. Wskaż cele zagrożone lub nadmiernie finansowane.",
    "4. Zobowiązania — oceń każde osobno: koszt, tempo spłaty, kapitał zarezerwowany na spłatę i czy lepiej nadpłacać, utrzymać obecny plan czy inwestować nadwyżki.",
    "5. Nakładanie się ekspozycji — wskaż duplikaty oraz instrumenty dające podobną ekspozycję.",
    "6. Co zwiększyć / co zmniejszyć — zaproponuj konkretne zmiany i wyjaśnij ich wpływ na zwrot, ryzyko i realizację celów.",
    "7. Docelowa alokacja — zaproponuj strukturę każdego portfela i całego majątku. Każda proponowana struktura procentowa musi sumować się do 100%.",
    "8. Plan realizacji celów — dla każdego celu podaj rekomendowane tempo finansowania, portfel/aktywa źródłowe oraz kolejność finansowania względem innych celów.",
    "9. Plan obsługi zobowiązań — wskaż priorytet nadpłat i minimalny kapitał, który warto pozostawić płynny zamiast przeznaczać na spłatę.",
    "10. Priorytety — uporządkuj zmiany od najbardziej wpływowej do najmniej istotnej.",
    "11. Ryzyka — co może pójść źle oraz jaki horyzont inwestycyjny jest potrzebny."
  );

  if (amountMode) {
    lines.push(
      "",
      "NA KOŃCU OBOWIĄZKOWO DODAJ TABELĘ „KONKRETNY PLAN W PLN”",
      "Dla każdego działania podaj: PRIORYTET | SKĄD | DOKĄD | KWOTA PLN | KIEDY | UZASADNIENIE.",
      "Uwzględnij osobno jednorazowe przesunięcia obecnego kapitału i rekomendowane miesięczne wpłaty.",
      "Jeżeli sugerujesz zakupy inwestycyjne, podaj dokładnie ile PLN do każdej klasy/instrumentu; jeżeli sugerujesz realizację celu lub nadpłatę długu, również podaj dokładną kwotę PLN.",
      "Sprawdź arytmetykę: suma rekomendowanych przesunięć nie może przekraczać kapitału, który wskazujesz jako źródło."
    );
  } else {
    lines.push(
      "",
      "NA KOŃCU DODAJ TABELĘ „PLAN PROCENTOWY”",
      "Dla każdego działania podaj: PRIORYTET | SKĄD | DOKĄD | ZMIANA W PP / % CELU | KIEDY | UZASADNIENIE.",
      "Nie używaj w tej tabeli ani nigdzie indziej wartości pieniężnych."
    );
  }

  lines.push("", "Nie ograniczaj się do ogólników typu „dywersyfikuj”. Odnoś się do konkretnych portfeli, aktywów, celów, zobowiązań i ich przypisań z danych powyżej.");
  return lines.join("\n");
}

type GoalPromptContext = {
  goals: Goal[];
  goalOverview: MoneyFlowOverview | null;
  assets: Asset[];
  wallets: PortfolioWallet[];
  totalValue: number;
  amountMode: boolean;
};

function appendGoalsToPrompt(lines: string[], context: GoalPromptContext) {
  const { goals, goalOverview, assets, wallets, totalValue, amountMode } = context;
  lines.push("", "CELE FINANSOWE I ICH FINANSOWANIE");
  if (!goals.length) {
    lines.push("- brak zdefiniowanych celów");
    return;
  }

  const sortedGoals = goals.slice().sort((a, b) => goalPriorityRank(a.priority) - goalPriorityRank(b.priority) || goalRemaining(b) - goalRemaining(a));
  for (const goal of sortedGoals) {
    const allocations = (goalOverview?.allocations ?? []).filter(row => row.goalId === goal.id);
    const reservedByAllocations = allocations.reduce((sum, row) => sum + row.amount, 0);
    const reserved = goalOverview ? reservedByAllocations : (goal.reservedAmount ?? 0);
    const spent = goal.spentAmount ?? 0;
    const currentForAnalysis = goal.status === "COMPLETED"
      ? goal.currentAmount
      : Math.min(goal.targetAmount, reserved + spent);
    const remaining = goal.status === "COMPLETED" ? 0 : Math.max(goal.targetAmount - currentForAnalysis, 0);
    const requiredMonthly = goal.targetDate ? remaining / monthsUntil(goal.targetDate) : null;
    const sources = groupGoalAllocationsByWallet(allocations, assets, wallets);

    lines.push("");
    lines.push(`CEL: ${goal.name}${goal.status ? ` — status ${goal.status}` : ""}${goal.priority ? ` — priorytet ${goal.priority}` : ""}`);
    if (goal.targetDate) lines.push(`- termin: ${goal.targetDate} (${monthsUntil(goal.targetDate)} mies. do terminu wg dzisiejszej daty, minimum 1 mies. dla bieżącego miesiąca)`);
    if (amountMode) {
      lines.push(`- budżet celu: ${formatPromptMoney(goal.targetAmount)}`);
      lines.push(`- zrealizowano: ${formatPromptMoney(currentForAnalysis)} (${formatPromptPercent(currentForAnalysis, goal.targetAmount)})`);
      lines.push(`- obecnie zarezerwowane: ${formatPromptMoney(reserved)}; wydano: ${formatPromptMoney(spent)}; brakuje: ${formatPromptMoney(remaining)}`);
      lines.push(`- planowana wpłata miesięczna: ${formatPromptMoney(goal.monthlyContribution)}`);
      if (requiredMonthly != null) lines.push(`- tempo potrzebne do terminu przy prostym podziale brakującej kwoty: ${formatPromptMoney(requiredMonthly)} / mies.`);
    } else {
      lines.push(`- realizacja celu: ${formatPromptPercent(currentForAnalysis, goal.targetAmount)}`);
      lines.push(`- obecnie zarezerwowane: ${formatPromptPercent(reserved, goal.targetAmount)} celu; wydano: ${formatPromptPercent(spent, goal.targetAmount)} celu; pozostaje: ${formatPromptPercent(remaining, goal.targetAmount)} celu`);
      lines.push(`- planowana wpłata miesięczna: ${formatPromptPercent(goal.monthlyContribution, goal.targetAmount)} wartości celu / mies.`);
      if (requiredMonthly != null) lines.push(`- tempo potrzebne do terminu: ${formatPromptPercent(requiredMonthly, goal.targetAmount)} wartości celu / mies.`);
    }

    if (!sources.length) {
      lines.push("- przypisane źródła z portfeli: brak");
    } else {
      lines.push("- przypisane źródła z portfeli:");
      for (const source of sources) {
        const walletValue = analysableWalletValue(source.walletId, assets);
        const dynamicLabel = source.dynamicPortfolio ? " [DYNAMICZNIE PRZYPISANY CAŁY PORTFEL]" : "";
        lines.push(amountMode
          ? `  • ${source.walletName}${dynamicLabel}: ${formatPromptMoney(source.amount)} (${formatPromptPercent(source.amount, goal.targetAmount)} budżetu celu; ${formatPromptPercent(source.amount, walletValue)} portfela)`
          : `  • ${source.walletName}${dynamicLabel}: ${formatPromptPercent(source.amount, goal.targetAmount)} budżetu celu; ${formatPromptPercent(source.amount, walletValue)} portfela; ${formatPromptPercent(source.amount, reserved || goal.targetAmount)} obecnej rezerwy celu`);
        for (const detail of source.assets) {
          lines.push(amountMode
            ? `    - ${detail.name}: ${formatPromptMoney(detail.amount)}`
            : `    - ${detail.name}: ${formatPromptPercent(detail.amount, goal.targetAmount)} budżetu celu`);
        }
      }
    }

    if (amountMode && totalValue > 0) lines.push(`- budżet celu odpowiada ${formatPromptPercent(goal.targetAmount, totalValue)} analizowanego majątku`);
  }
}

type LiabilityPromptContext = {
  liabilities: Liability[];
  liabilityOverview: LiabilityAllocationOverview | null;
  assets: Asset[];
  wallets: PortfolioWallet[];
  totalValue: number;
  amountMode: boolean;
};

function appendLiabilitiesToPrompt(lines: string[], context: LiabilityPromptContext) {
  const { liabilities, liabilityOverview, assets, wallets, totalValue, amountMode } = context;
  lines.push("", "ZOBOWIĄZANIA I KAPITAŁ PRZEZNACZONY NA ICH SPŁATĘ");
  if (!liabilities.length) {
    lines.push("- brak zdefiniowanych zobowiązań");
    return;
  }

  const sorted = liabilities.slice().sort((a, b) => b.interestRate - a.interestRate || b.remainingAmount - a.remainingAmount);
  for (const liability of sorted) {
    const allocations = (liabilityOverview?.allocations ?? []).filter(row => row.liabilityId === liability.id);
    const reserved = allocations.reduce((sum, row) => sum + row.amount, 0);
    const uncovered = Math.max(liability.remainingAmount - reserved, 0);
    const sources = groupLiabilityAllocationsByWallet(allocations, assets, wallets);

    lines.push("");
    lines.push(`ZOBOWIĄZANIE: ${liability.name}${liability.type ? ` [${liability.type}]` : ""}`);
    lines.push(`- oprocentowanie: ${liability.interestRate.toLocaleString("pl-PL", { maximumFractionDigits: 2 })}%`);
    if (amountMode) {
      lines.push(`- kwota początkowa: ${formatPromptMoney(liability.originalAmount)}`);
      lines.push(`- pozostało wg banku/systemu: ${formatPromptMoney(liability.remainingAmount)} (${formatPromptPercent(liability.remainingAmount, liability.originalAmount)} kwoty początkowej)`);
      lines.push(`- rata miesięczna: ${formatPromptMoney(liability.monthlyPayment)}; kapitał: ${formatPromptMoney(liability.principalPayment)}; odsetki: ${formatPromptMoney(liability.interestPayment)}`);
      lines.push(`- kapitał zarezerwowany na spłatę: ${formatPromptMoney(reserved)} (${formatPromptPercent(reserved, liability.remainingAmount)} obecnego salda)`);
      lines.push(`- efektywnie niepokryte po uwzględnieniu rezerwy: ${formatPromptMoney(uncovered)}`);
      if (totalValue > 0) lines.push(`- obecne saldo to ${formatPromptPercent(liability.remainingAmount, totalValue)} analizowanego majątku`);
    } else {
      lines.push(`- pozostałe saldo: ${formatPromptPercent(liability.remainingAmount, liability.originalAmount)} kwoty początkowej`);
      lines.push(`- rata miesięczna: ${formatPromptPercent(liability.monthlyPayment, liability.remainingAmount)} obecnego salda / mies.`);
      lines.push(`- struktura raty: kapitał ${formatPromptPercent(liability.principalPayment, liability.monthlyPayment)}, odsetki ${formatPromptPercent(liability.interestPayment, liability.monthlyPayment)}`);
      lines.push(`- kapitał zarezerwowany na spłatę: ${formatPromptPercent(reserved, liability.remainingAmount)} obecnego salda`);
      lines.push(`- efektywnie niepokryte po uwzględnieniu rezerwy: ${formatPromptPercent(uncovered, liability.remainingAmount)} obecnego salda`);
      if (totalValue > 0) lines.push(`- obecne saldo zobowiązania względem analizowanego majątku: ${formatPromptPercent(liability.remainingAmount, totalValue)}`);
    }

    if (!sources.length) {
      lines.push("- portfele/aktywa zarezerwowane na spłatę: brak");
    } else {
      lines.push("- portfele/aktywa zarezerwowane na spłatę:");
      for (const source of sources) {
        const walletValue = analysableWalletValue(source.walletId, assets);
        lines.push(amountMode
          ? `  • ${source.walletName}: ${formatPromptMoney(source.amount)} (${formatPromptPercent(source.amount, liability.remainingAmount)} obecnego salda; ${formatPromptPercent(source.amount, walletValue)} portfela)`
          : `  • ${source.walletName}: ${formatPromptPercent(source.amount, liability.remainingAmount)} obecnego salda; ${formatPromptPercent(source.amount, walletValue)} portfela`);
        for (const detail of source.assets) {
          lines.push(amountMode
            ? `    - ${detail.name}: ${formatPromptMoney(detail.amount)}`
            : `    - ${detail.name}: ${formatPromptPercent(detail.amount, liability.remainingAmount)} obecnego salda`);
        }
      }
    }
  }
}

type PortfolioCommitmentContext = {
  goalOverview: MoneyFlowOverview | null;
  liabilityOverview: LiabilityAllocationOverview | null;
  assets: Asset[];
  wallets: PortfolioWallet[];
  amountMode: boolean;
};

function appendPortfolioCommitmentsToPrompt(lines: string[], context: PortfolioCommitmentContext) {
  const { goalOverview, liabilityOverview, assets, wallets, amountMode } = context;
  lines.push("", "MAPA PORTFEL → CELE I ZOBOWIĄZANIA");

  let any = false;
  for (const wallet of wallets) {
    const walletValue = analysableWalletValue(wallet.id, assets);
    const assetIds = new Set(assets.filter(asset => asset.portfolioId === wallet.id).map(asset => asset.id));
    const goalRows = (goalOverview?.allocations ?? []).filter(row =>
      row.portfolioId === wallet.id || (row.assetId != null && assetIds.has(row.assetId))
    );
    const liabilityRows = (liabilityOverview?.allocations ?? []).filter(row =>
      row.portfolioId === wallet.id || (row.assetId != null && assetIds.has(row.assetId))
    );
    const goalTotal = goalRows.reduce((sum, row) => sum + row.amount, 0);
    const liabilityTotal = liabilityRows.reduce((sum, row) => sum + row.amount, 0);
    const reservedTotal = goalTotal + liabilityTotal;
    if (reservedTotal <= 0) continue;
    any = true;

    lines.push("");
    lines.push(amountMode
      ? `PORTFEL ${wallet.name}: łącznie przypisane ${formatPromptMoney(reservedTotal)} (${formatPromptPercent(reservedTotal, walletValue)} wartości portfela)`
      : `PORTFEL ${wallet.name}: łącznie przypisane ${formatPromptPercent(reservedTotal, walletValue)} wartości portfela`);

    const goalsByName = new Map<string, number>();
    for (const row of goalRows) goalsByName.set(row.goalName, (goalsByName.get(row.goalName) ?? 0) + row.amount);
    for (const [name, amount] of [...goalsByName.entries()].sort((a, b) => b[1] - a[1])) {
      lines.push(amountMode
        ? `- cel „${name}”: ${formatPromptMoney(amount)} (${formatPromptPercent(amount, walletValue)} portfela)`
        : `- cel „${name}”: ${formatPromptPercent(amount, walletValue)} portfela`);
    }

    const liabilitiesByName = new Map<string, number>();
    for (const row of liabilityRows) liabilitiesByName.set(row.liabilityName, (liabilitiesByName.get(row.liabilityName) ?? 0) + row.amount);
    for (const [name, amount] of [...liabilitiesByName.entries()].sort((a, b) => b[1] - a[1])) {
      lines.push(amountMode
        ? `- zobowiązanie „${name}”: ${formatPromptMoney(amount)} (${formatPromptPercent(amount, walletValue)} portfela)`
        : `- zobowiązanie „${name}”: ${formatPromptPercent(amount, walletValue)} portfela`);
    }
  }

  if (!any) lines.push("- brak kapitału z portfeli przypisanego do celów lub zobowiązań");
}

type PromptAllocationSource = {
  walletId: number | null;
  walletName: string;
  amount: number;
  assets: { name: string; amount: number }[];
  dynamicPortfolio?: boolean;
};

function groupGoalAllocationsByWallet(
  allocations: MoneyFlowOverview["allocations"],
  assets: Asset[],
  wallets: PortfolioWallet[]
): PromptAllocationSource[] {
  const result = new Map<string, PromptAllocationSource>();
  for (const row of allocations) {
    const asset = assets.find(item => item.id === row.assetId);
    const wallet = wallets.find(item => item.id === (row.portfolioId ?? asset?.portfolioId));
    const walletId = wallet?.id ?? row.portfolioId ?? null;
    const walletName = wallet?.name ?? row.portfolioName ?? "Nieprzypisane źródło";
    const key = walletId != null ? `wallet-${walletId}` : `name-${walletName}`;
    const current = result.get(key) ?? { walletId, walletName, amount: 0, assets: [], dynamicPortfolio: false };
    current.amount += row.amount;
    current.dynamicPortfolio = current.dynamicPortfolio || row.sourceType === "PORTFOLIO";
    current.assets.push({ name: row.assetName, amount: row.amount });
    result.set(key, current);
  }
  return [...result.values()].sort((a, b) => b.amount - a.amount);
}

function groupLiabilityAllocationsByWallet(
  allocations: LiabilityPortfolioAllocation[],
  assets: Asset[],
  wallets: PortfolioWallet[]
): PromptAllocationSource[] {
  const result = new Map<string, PromptAllocationSource>();
  for (const row of allocations) {
    const asset = assets.find(item => item.id === row.assetId);
    const wallet = wallets.find(item => item.id === (row.portfolioId ?? asset?.portfolioId));
    const walletId = wallet?.id ?? row.portfolioId ?? null;
    const walletName = wallet?.name ?? row.portfolioName ?? "Nieprzypisane źródło";
    const key = walletId != null ? `wallet-${walletId}` : `name-${walletName}`;
    const current = result.get(key) ?? { walletId, walletName, amount: 0, assets: [] };
    current.amount += row.amount;
    current.assets.push({ name: row.assetName, amount: row.amount });
    result.set(key, current);
  }
  return [...result.values()].sort((a, b) => b.amount - a.amount);
}

function analysableWalletValue(walletId: number | null, assets: Asset[]): number {
  if (walletId == null) return 0;
  return assets.filter(asset => !asset.systemCash && asset.portfolioId === walletId).reduce((sum, asset) => sum + asset.value, 0);
}

function goalRemaining(goal: Goal): number {
  if (goal.status === "COMPLETED") return 0;
  return Math.max(goal.targetAmount - goal.currentAmount, 0);
}

function monthsUntil(dateValue: string): number {
  const target = new Date(`${dateValue}T12:00:00`);
  const now = new Date();
  if (Number.isNaN(target.getTime())) return 1;
  return Math.max(1, (target.getFullYear() - now.getFullYear()) * 12 + target.getMonth() - now.getMonth());
}

function goalPriorityRank(priority?: Goal["priority"]): number {
  if (priority === "HIGH") return 0;
  if (priority === "MEDIUM") return 1;
  if (priority === "LOW") return 2;
  return 3;
}

function formatPromptMoney(value: number): string {
  if (!Number.isFinite(value)) return "0 PLN";
  return `${value.toLocaleString("pl-PL", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} PLN`;
}

function formatPromptPercent(value: number, total: number): string {
  if (!Number.isFinite(value) || !Number.isFinite(total) || total === 0) return "0%";
  return `${(value / total * 100).toLocaleString("pl-PL", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

async function copyTextToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);
  if (!copied) throw new Error("Nie udało się skopiować promptu.");
}

function latestClosedSnapshot(snapshots: MonthlySnapshot[]): MonthlySnapshot | null {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  return snapshots
    .filter(snapshot => snapshot.month < currentMonth)
    .sort((a, b) => b.month.localeCompare(a.month))[0] ?? null;
}

function assetMonthlyChanges(assets: Asset[], snapshots: MonthlySnapshot[]): Map<number, number> {
  const result = new Map<number, number>();
  const previous = latestClosedSnapshot(snapshots);
  if (!previous) return result;

  const previousById = new Map(previous.assets.map(asset => [asset.id, asset.value]));
  for (const asset of assets) {
    if (asset.systemCash) continue;
    const previousValue = previousById.get(asset.id);
    if (previousValue == null || previousValue <= 0) continue;
    result.set(asset.id, (asset.value - previousValue) / previousValue * 100);
  }
  return result;
}

function portfolioMonthlyChanges(assets: Asset[], wallets: PortfolioWallet[], snapshots: MonthlySnapshot[]): Map<number, number> {
  const result = new Map<number, number>();
  const previous = latestClosedSnapshot(snapshots);
  if (!previous) return result;

  const currentAssetById = new Map(assets.map(asset => [asset.id, asset]));
  for (const wallet of wallets) {
    const currentValue = assets
      .filter(asset => asset.portfolioId === wallet.id)
      .reduce((sum, asset) => sum + asset.value, 0);

    let previousValue = 0;
    let comparableAssets = 0;
    for (const snapshotAsset of previous.assets) {
      const currentAsset = currentAssetById.get(snapshotAsset.id);
      if (currentAsset?.portfolioId !== wallet.id) continue;
      previousValue += snapshotAsset.value;
      comparableAssets += 1;
    }

    if (comparableAssets === 0 || previousValue <= 0) continue;
    result.set(wallet.id, (currentValue - previousValue) / previousValue * 100);
  }
  return result;
}

type AssetLiveChange = {
  value: number;
  label: "24h" | "1d";
  title: string;
};

function assetLiveChange(asset: Asset): AssetLiveChange | null {
  if (asset.cryptoChange24h != null) return {
    value: asset.cryptoChange24h,
    label: "24h",
    title: "Zmiana ceny w ostatnich 24 godzinach",
  };
  if (asset.stockChangePercent != null) return {
    value: asset.stockChangePercent,
    label: "24h",
    title: "Zmiana ceny instrumentu względem poprzedniej sesji",
  };
  if (getAssetCategory(asset) === "bonds" && asset.bondChange1dPercent != null) return {
    value: asset.bondChange1dPercent,
    label: "1d",
    title: `Zmiana wartości netto obligacji od poprzedniego dnia${asset.bondChange1dAmount != null ? `: ${asset.bondChange1dAmount >= 0 ? "+" : ""}${money(asset.bondChange1dAmount)}` : ""}`,
  };
  return null;
}

function formatChangePercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toLocaleString("pl-PL", { maximumFractionDigits: 2 })}%`;
}

type WalletLiabilityReservation = {
  liabilityId: number;
  name: string;
  imageUrl?: string | null;
  imagePosition?: string | null;
  amount: number;
};

function liabilityReservationsForWallet(
  walletId: number,
  overview: LiabilityAllocationOverview | null,
  assets: Asset[]
): WalletLiabilityReservation[] {
  const assetIds = new Set(assets.filter(asset => asset.portfolioId === walletId).map(asset => asset.id));
  const grouped = new Map<number, WalletLiabilityReservation>();

  for (const allocation of overview?.allocations ?? []) {
    if (allocation.assetId == null || !assetIds.has(allocation.assetId)) continue;
    const current = grouped.get(allocation.liabilityId) ?? {
      liabilityId: allocation.liabilityId,
      name: allocation.liabilityName,
      imageUrl: allocation.liabilityImageUrl,
      imagePosition: allocation.liabilityImagePosition,
      amount: 0,
    };
    current.amount += allocation.amount;
    grouped.set(allocation.liabilityId, current);
  }

  return [...grouped.values()].sort((a, b) => b.amount - a.amount);
}

type FundedLiability = {
  id: number;
  name: string;
  imageUrl?: string | null;
  imagePosition?: string | null;
  originalAmount: number;
  bankRemainingAmount: number;
  amount: number;
  sources: string[];
  allocations: LiabilityPortfolioAllocation[];
};

function groupFundedLiabilities(overview: LiabilityAllocationOverview | null, assets: Asset[], wallets: PortfolioWallet[]): FundedLiability[] {
  const result = new Map<number, FundedLiability>();
  for (const allocation of overview?.allocations ?? []) {
    const current = result.get(allocation.liabilityId) ?? {
      id: allocation.liabilityId,
      name: allocation.liabilityName,
      imageUrl: allocation.liabilityImageUrl,
      imagePosition: allocation.liabilityImagePosition,
      originalAmount: allocation.originalAmount,
      bankRemainingAmount: allocation.bankRemainingAmount,
      amount: 0,
      sources: [],
      allocations: [],
    };
    current.amount += allocation.amount;
    current.allocations.push(allocation);
    const asset = assets.find(item => item.id === allocation.assetId);
    const wallet = wallets.find(item => item.id === asset?.portfolioId);
    const source = wallet ? `${wallet.name} / ${allocation.assetName}` : allocation.assetName;
    if (!current.sources.includes(source)) current.sources.push(source);
    result.set(current.id, current);
  }
  return [...result.values()];
}

function StatCard({ tone, icon, label, value, caption, art }: { tone: string; icon: ReactNode; label: string; value: string; caption: string; art: string }) {
  return <article className={`investment-stat ${tone}`}><div className="investment-stat-icon">{icon}</div><p>{label}</p><strong>{value}</strong><span>{caption}</span>
    <div className={`investment-stat-art ${art}`} aria-hidden="true">{art === "stat-ring" ? <ChartPie/> : art === "blocks" ? <>{[0,1,2,3,4,5].map(item => <i key={item}/>)}</> : <><TrendingUp/>{[35, 55, 73, 93].map(height => <i key={height} style={{ height }}/>)}</>}</div>
  </article>;
}
