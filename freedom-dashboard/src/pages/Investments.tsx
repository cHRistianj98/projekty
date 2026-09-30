import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowRightLeft, ChartNoAxesCombined, ChartPie, CreditCard, LoaderCircle, MoreVertical, Pencil, Plus, Target, Trash2, TrendingUp, WalletCards } from "lucide-react";
import type { Asset } from "../types/Asset";
import { assetCategoryLabels, getAssetCategory, getAssetIconKey } from "../types/Asset";
import type { Goal } from "../types/Goal";
import type { MonthlySnapshot } from "../types/MonthlySnapshot";
import type { MoneyFlowOverview } from "../types/GoalAllocation";
import type { LiabilityAllocationOverview, LiabilityPortfolioAllocation } from "../types/LiabilityAllocation";
import type { PortfolioWallet } from "../types/Portfolio";
import { goalAllocationApi } from "../api/goalAllocationApi";
import { liabilityAllocationApi } from "../api/liabilityAllocationApi";
import { portfolioApi } from "../api/portfolioApi";
import { AssetIcon } from "../components/investments/assetIcons";
import { AddAssetModal } from "../components/investments/AddAssetModal";
import { EditAssetModal } from "../components/investments/EditAssetModal";
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
  onReleaseMoney: (goalId: number, assetId: number, amount: number) => Promise<void>;
};

export function Investments({ portfolio, goals, monthlySnapshots, onAddAsset, onUpdateAsset, onDeleteAsset, onPortfolioChanged, onReleaseMoney }: InvestmentsProps) {
  const [wallets, setWallets] = useState<PortfolioWallet[]>([]);
  const [overview, setOverview] = useState<MoneyFlowOverview | null>(null);
  const [liabilityOverview, setLiabilityOverview] = useState<LiabilityAllocationOverview | null>(null);
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
  const requestId = useRef(0);

  const refresh = useCallback(async () => {
    const request = ++requestId.current;
    try {
      const [nextWallets, nextOverview, nextLiabilityOverview] = await Promise.all([
        portfolioApi.getAll(),
        goalAllocationApi.getOverview(),
        liabilityAllocationApi.getOverview(),
      ]);
      if (request === requestId.current) {
        setWallets(nextWallets);
        setOverview(nextOverview);
        setLiabilityOverview(nextLiabilityOverview);
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
  const selectedAssets = portfolio.filter(asset => asset.portfolioId === selectedId);
  const known = !loading && !error && overview !== null && liabilityOverview !== null;
  const addPortfolio = <button type="button" className="investment-button" onClick={() => setForm("new")}><Plus size={16}/>Dodaj portfel</button>;

  async function managerAction(action: () => Promise<void>) {
    setBusy(true); setManagerError("");
    try { await action(); await refresh(); }
    catch (cause) { setManagerError(errorMessage(cause)); }
    finally { setBusy(false); }
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
      <WealthChart assets={portfolio} wallets={wallets} overview={overview} liabilityOverview={liabilityOverview} total={total}/>
      <HistoryChart snapshots={monthlySnapshots} total={total}/>
    </div>

    <section className="investment-panel portfolios-panel">
      <div className="investment-panel-heading">
        <div className="investment-section-title"><span className="investment-section-icon"><WalletCards size={20}/></span><div><h2>Portfele</h2><p>Twoje strategie inwestycyjne w jednym miejscu.</p></div></div>
        <div className="investment-toolbar"><button type="button" className="investment-button secondary transfer-toolbar" onClick={() => setTransfer({})} disabled={!known || portfolio.length < 1}><ArrowRightLeft size={15}/>Transfer</button>{addPortfolio}</div>
      </div>
      {loading ? <div className="investment-empty"><LoaderCircle size={20} className="animate-spin"/>Pobieranie portfeli…</div> : !realWallets.length ? <div className="investment-empty">Dodaj pierwszy portfel i nadaj swoim inwestycjom kierunek.</div> :
        <div className="portfolio-cards">{realWallets.map(wallet => {
          const assets = portfolio.filter(asset => asset.portfolioId === wallet.id);
          const progress = wallet.targetAmount ? wallet.grossValue / wallet.targetAmount * 100 : null;
          const breakdown = assets.map(asset => ({ id: String(asset.id), name: asset.name, value: asset.value, color: asset.color }));
          const debtReservations = liabilityReservationsForWallet(wallet.id, liabilityOverview, portfolio);
          return <article className="portfolio-card" key={wallet.id} style={{ "--portfolio-accent": wallet.color } as CSSProperties}>
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
              <div className="portfolio-card-value"><strong>{money(wallet.grossValue)}</strong><span>{percent(wallet.grossValue, total)} majątku</span></div>
              <div className="portfolio-progress-block">
                <div className="investment-progress" role="progressbar" aria-label={`Cel portfela ${wallet.name}`} aria-valuenow={Math.round(Math.min(100, Math.max(0, progress ?? 0)))} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${Math.min(100, Math.max(0, progress ?? 0))}%` }}/></div>
                <div className="portfolio-progress-label"><span>{wallet.targetAmount ? `Cel: ${money(wallet.targetAmount)}` : wallet.systemPortfolio ? "Gotówka i bieżące środki" : "Brak kwoty docelowej"}</span><span>{progress == null ? "—" : `${Math.round(progress)}%`}</span></div>
              </div>
              <div className="portfolio-composition"><Donut rows={breakdown} small/><div className="portfolio-composition-legend">
                {assets.slice(0, 3).map(asset => <div key={asset.id}><span className="investment-dot" style={{ background: asset.color }}/><span className="composition-name" title={asset.name}>{percent(asset.value, wallet.grossValue)}&nbsp; {asset.name}</span><span>{money(asset.value)}</span></div>)}
                {assets.length > 3 && <span className="investment-note">+ {assets.length - 3} pozostałych aktywów</span>}
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
        <div className="goal-capital-name"><span className="portfolio-card-icon"><Target size={22}/></span><div><h3>{goal.name}</h3><p>Z portfeli: {goal.sources.join(", ")}</p></div></div>
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

    {form && <PortfolioForm wallet={form === "new" ? undefined : form} onClose={() => setForm(null)} onSave={async input => { if (form === "new") await portfolioApi.create(input); else await portfolioApi.update(form.id, input); await refresh(); }}/>}
    {transfer && <TransferForm assets={portfolio} wallets={realWallets} allocated={allocated} sourceId={transfer.sourceId} onClose={() => setTransfer(null)} onAddAsset={walletId => { setTransfer(null); setAddTo(walletId); }} onTransfer={async (source, target, amount) => { await portfolioApi.transfer(source, target, amount); await onPortfolioChanged(); await refresh(); }}/>}
    {goalDialog && <GoalCapitalDialog goal={goalDialog.goal} release={goalDialog.release} onClose={() => setGoalDialog(null)} onRelease={async (assetId, amount) => { await onReleaseMoney(goalDialog.goal.id, assetId, amount); await refresh(); }}/>}
    {selected && <PortfolioDialog wide title={selected.name} subtitle={`${money(selected.grossValue)} w aktywach · ${money(selected.value)} dostępne`} busy={busy} onClose={() => setSelectedId(null)}>
      <div className="investment-manager">
        <div className="investment-toolbar"><button type="button" className="investment-button" disabled={busy} onClick={() => { setSelectedId(null); setAddTo(selected.id); }}><Plus size={15}/>Dodaj aktywo</button><button type="button" className="investment-button secondary" disabled={busy || !known || portfolio.length < 1} onClick={() => { setSelectedId(null); setTransfer({ sourceId: selectedAssets[0]?.id }); }}><ArrowRightLeft size={15}/>Transfer</button>{!selected.systemPortfolio && <button type="button" className="investment-button secondary" disabled={busy} onClick={() => { setSelectedId(null); setForm(selected); }}><Pencil size={15}/>Edytuj portfel</button>}</div>
        {managerError && <p className="investment-error" role="alert">{managerError}</p>}
        {!selectedAssets.length && <p className="investment-empty">Ten portfel czeka na pierwsze aktywo.</p>}
        {selectedAssets.map(asset => <div className="managed-asset" key={asset.id}>
          <span className="managed-asset-icon" style={{ color: asset.color }}><AssetIcon iconKey={getAssetIconKey(asset)} size={24}/></span>
          <div className="managed-asset-info"><h3>{asset.name} {asset.systemCash && <span className="portfolio-system-tag">SYSTEM</span>}</h3><span>{assetCategoryLabels[getAssetCategory(asset)]}</span><small>Zarezerwowane: {money(allocated.get(asset.id) ?? 0)} · dostępne: {money(asset.value - (allocated.get(asset.id) ?? 0))}</small></div>
          <strong>{money(asset.value)}</strong>
          {!asset.systemCash ? <div className="managed-asset-controls"><label><span className="sr-only">Portfel aktywa {asset.name}</span><select disabled={busy} value={asset.portfolioId} onChange={event => void managerAction(() => onUpdateAsset({ ...asset, portfolioId: Number(event.target.value) }))}>{realWallets.map(wallet => <option key={wallet.id} value={wallet.id}>{wallet.name}</option>)}</select></label><button type="button" disabled={busy} className="investment-icon-button" aria-label={`Edytuj ${asset.name}`} onClick={() => { setSelectedId(null); setEditingAsset(asset); }}><Pencil size={16}/></button><button type="button" disabled={busy || (allocated.get(asset.id) ?? 0) > 0} title={(allocated.get(asset.id) ?? 0) > 0 ? "Najpierw zwolnij rezerwacje na cele lub zobowiązania" : "Usuń aktywo"} className="investment-icon-button" aria-label={`Usuń ${asset.name}`} onClick={() => { setSelectedId(null); setManagerError(""); setDeleteAsset(asset); }}><Trash2 size={16}/></button></div> : <span className="portfolio-system-tag">AUTO</span>}
        </div>)}
      </div>
    </PortfolioDialog>}
    {addTo != null && <AddAssetModal onClose={() => setAddTo(null)} onAdd={async asset => { await onAddAsset({ ...asset, portfolioId: addTo }); await refresh(); }}/>}
    {editingAsset && <EditAssetModal asset={editingAsset} onClose={() => setEditingAsset(null)} onUpdate={async asset => { await onUpdateAsset(asset); await refresh(); }}/>}
    {(deleteWallet || deleteAsset) && <PortfolioDialog title={deleteWallet ? "Usuń portfel" : "Usuń aktywo"} onClose={() => { setDeleteWallet(null); setDeleteAsset(null); }} busy={busy}>
      <div className="investment-form"><p>{deleteWallet ? `Usunąć portfel „${deleteWallet.name}”? Portfel musi być pusty.` : `Usunąć aktywo „${deleteAsset?.name}”? Jego wartość zostanie odjęta od majątku.`}</p>{managerError && <p role="alert" className="investment-error">{managerError}</p>}<footer><button type="button" className="investment-button secondary" disabled={busy} onClick={() => { setDeleteWallet(null); setDeleteAsset(null); }}>Anuluj</button><button type="button" className="investment-button danger" disabled={busy} onClick={() => void managerAction(async () => { if (deleteWallet) await portfolioApi.remove(deleteWallet.id); else if (deleteAsset) await onDeleteAsset(deleteAsset.id); setDeleteWallet(null); setDeleteAsset(null); })}>{busy ? "Usuwanie…" : "Usuń"}</button></footer></div>
    </PortfolioDialog>}
  </main>;
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
