import { useEffect, useMemo, useState } from "react";
import {
  ChartNoAxesCombined,
  Coins,
  Pencil,
  PieChart,
  Plus,
  Sparkles,
  Trash2,
  TrendingUp,
  WalletCards,
  ArrowRightLeft,
  FolderPlus,
} from "lucide-react";

import type {
  Asset,
  AssetCategory,
} from "../types/Asset";
import {
  assetCategoryLabels,
  getAssetCategory,
  getAssetIconKey,
} from "../types/Asset";
import { AssetIcon } from "../components/investments/assetIcons";
import { goalAllocationApi } from "../api/goalAllocationApi";
import type { MoneyFlowOverview } from "../types/GoalAllocation";
import type { PortfolioWallet } from "../types/Portfolio";
import { portfolioApi } from "../api/portfolioApi";

import { AddAssetModal } from "../components/investments/AddAssetModal";
import { EditAssetModal } from "../components/investments/EditAssetModal";

type InvestmentsProps = {
  portfolio: Asset[];
  onAddAsset: (asset: Asset) => void;
  onUpdateAsset: (asset: Asset) => void;
  onDeleteAsset: (id: number) => void;
  onPortfolioChanged: () => Promise<void>;
};

export function Investments({
  portfolio,
  onAddAsset,
  onUpdateAsset,
  onDeleteAsset,
  onPortfolioChanged,
}: InvestmentsProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingAsset, setEditingAsset] =
    useState<Asset | null>(null);

  const [moneyFlow,setMoneyFlow]=useState<MoneyFlowOverview|null>(null);
  const [wallets,setWallets]=useState<PortfolioWallet[]>([]);
  const [isWalletOpen,setIsWalletOpen]=useState(false);
  const [isTransferOpen,setIsTransferOpen]=useState(false);
  async function refreshWallets(){try{setWallets(await portfolioApi.getAll());}catch(e){console.error("Portfele:",e);}}
  useEffect(()=>{void refreshWallets();},[portfolio,moneyFlow?.totalAllocated]);

  useEffect(()=>{
    let cancelled=false;
    goalAllocationApi.getOverview().then(x=>{if(!cancelled)setMoneyFlow(x);})
      .catch(e=>console.error("Money Flow overview:",e));
    return()=>{cancelled=true;};
  },[portfolio]);

  const allocatedByAsset=new Map<number,number>();
  for(const a of moneyFlow?.allocations??[]){
    if(a.assetId!==null) allocatedByAsset.set(a.assetId,(allocatedByAsset.get(a.assetId)??0)+a.amount);
  }
  const availablePortfolio=portfolio.map(asset=>({
    ...asset,
    availableValue:Math.max(asset.value-(allocatedByAsset.get(asset.id)??0),0),
  }));

  const total = useMemo(
    () =>
      portfolio.reduce(
        (sum, asset) => sum + asset.value,
        0
      ),
    [portfolio]
  );

  const largest = useMemo(
    () =>
      portfolio.reduce<Asset | null>(
        (current, asset) =>
          !current || asset.value > current.value
            ? asset
            : current,
        null
      ),
    [portfolio]
  );

  const largestShare =
    largest && total > 0
      ? (largest.value / total) * 100
      : 0;

  const categoryCount = new Set(
    portfolio.map((asset) =>
      getAssetCategory(asset)
    )
  ).size;

  return (
    <main className="min-h-screen bg-[#050c18] text-white">
      <div className="mx-auto max-w-[1600px] px-5 py-6 lg:px-7">
        <header className="flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/25 shadow-[0_10px_35px_rgba(37,99,235,.18)]">
              <ChartNoAxesCombined size={26} />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight">
                Inwestycje
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Twój portfel aktywów. Buduj majątek na przyszłość.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setIsWalletOpen(true)} className="flex cursor-pointer items-center gap-2 rounded-xl border border-violet-500/25 bg-violet-500/10 px-4 py-3 text-sm font-bold text-violet-200 transition hover:bg-violet-500/15"><FolderPlus size={18}/>Nowy portfel</button>
          <button type="button" onClick={() => setIsTransferOpen(true)} className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-bold text-slate-200 transition hover:border-blue-500/40"><ArrowRightLeft size={18}/>Transfer</button>
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold shadow-lg shadow-blue-950/30 transition hover:bg-blue-500 hover:-translate-y-0.5"
          >
            <Plus size={18} />
            Dodaj aktywo
          </button>
          </div>
        </header>

        <section className="mt-8 grid gap-4 xl:grid-cols-3">
          <HeroCard
            accent="emerald"
            label="Wartość portfela"
            value={formatMoney(total)}
            subtitle="Łączna wartość Twoich aktywów"
            icon={<WalletCards size={24} />}
            art={<CoinStackArt />}
          />

          <HeroCard
            accent="violet"
            label="Liczba aktywów"
            value={String(portfolio.length)}
            subtitle={`${categoryCount} ${plural(categoryCount, "kategoria", "kategorie", "kategorii")}`}
            icon={<PieChart size={24} />}
            art={<BarsArt />}
          />

          <HeroCard
            accent="amber"
            label="Największa pozycja"
            value={largest?.name ?? "Brak aktywów"}
            subtitle={
              largest
                ? `${largestShare.toFixed(1)}% całego portfela`
                : "Dodaj pierwsze aktywo"
            }
            icon={<Sparkles size={24} />}
            art={<OrbArt />}
            compact
          />
        </section>

        <section className="mt-6">
          <div className="mb-3 flex items-end justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-blue-400">Portfolio Engine</p><h2 className="mt-1 text-xl font-black">Twoje portfele</h2></div><p className="text-xs text-slate-500">Transfery między aktywami nie zmieniają Net Worth</p></div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {wallets.map(w=>{const pct=total>0?(w.value/total)*100:0; const isGoals=w.type==="GOALS"; return <div key={w.id} className={`relative overflow-hidden rounded-2xl border p-5 ${isGoals?"border-violet-500/30 bg-violet-500/[.07]":"border-slate-800 bg-slate-900/70"}`}>
              <div className="flex items-center justify-between"><span className="rounded-lg px-2 py-1 text-[9px] font-black uppercase tracking-[.12em]" style={{color:w.color,backgroundColor:`${w.color}18`}}>{w.type==="MAIN"?"SYSTEM":w.type==="GOALS"?"LOCKED":"PORTFEL"}</span><span className="text-xs font-bold text-slate-500">{pct.toFixed(1)}%</span></div>
              <h3 className="mt-4 text-lg font-black">{w.name}</h3><p className="mt-1 text-2xl font-black" style={{color:w.color}}>{formatMoney(w.value)}</p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full" style={{width:`${Math.min(100,pct)}%`,backgroundColor:w.color}}/></div>
              <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-slate-800">
                {(isGoals
                  ? (moneyFlow?.allocations??[]).reduce<{name:string;value:number;color:string}[]>((acc,a)=>{const found=acc.find(x=>x.name===a.goalName);if(found)found.value+=a.amount;else acc.push({name:a.goalName,value:a.amount,color:["#8b5cf6","#22c55e","#f59e0b","#3b82f6"][acc.length%4]});return acc;},[])
                  : portfolio.filter(a=>a.portfolioId===w.id).map(a=>({name:a.name,value:Math.max(a.value-(allocatedByAsset.get(a.id)??0),0),color:a.color})))
                  .filter(x=>x.value>0).map(x=><div key={x.name} title={`${x.name}: ${formatMoney(x.value)}`} style={{width:`${w.value>0?(x.value/w.value)*100:0}%`,backgroundColor:x.color}} />)}
              </div>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-500">
                {(isGoals
                  ? (moneyFlow?.allocations??[]).reduce<{name:string;value:number;color:string}[]>((acc,a)=>{const found=acc.find(x=>x.name===a.goalName);if(found)found.value+=a.amount;else acc.push({name:a.goalName,value:a.amount,color:["#8b5cf6","#22c55e","#f59e0b","#3b82f6"][acc.length%4]});return acc;},[])
                  : portfolio.filter(a=>a.portfolioId===w.id).map(a=>({name:a.name,value:Math.max(a.value-(allocatedByAsset.get(a.id)??0),0),color:a.color})))
                  .filter(x=>x.value>0).slice(0,4).map(x=><span key={x.name}><i className="mr-1 inline-block h-1.5 w-1.5 rounded-full" style={{backgroundColor:x.color}}/>{x.name} {w.value>0?((x.value/w.value)*100).toFixed(0):0}%</span>)}
              </div>
              {w.allocatedOut>0&&<p className="mt-3 text-[11px] text-slate-500">Do Celów: <b className="text-violet-300">{formatMoney(w.allocatedOut)}</b></p>}
              {isGoals&&<p className="mt-3 text-[11px] text-slate-500">Skład procentowy wynika automatycznie z aktywnych celów.</p>}
            </div>})}
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-3xl border border-blue-500/20 bg-slate-900/65 shadow-[0_20px_60px_rgba(0,0,0,.22)]">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/20">
                <PieChart size={23} />
              </div>
              <div>
                <h2 className="text-xl font-black">Portfel</h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  Aktualna struktura majątku
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[10px] font-black uppercase tracking-[.18em] text-slate-600">
                Łącznie
              </div>
              <div className="mt-1 text-xl font-black">
                {formatMoney(total)}
              </div>
            </div>
          </div>

          {portfolio.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <Coins className="mx-auto h-10 w-10 text-slate-700" />
              <h3 className="mt-4 text-lg font-bold">
                Portfel jest pusty
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Dodaj pierwsze aktywo i zacznij budować strukturę majątku.
              </p>
            </div>
          ) : (
            <>
              <div className="hidden grid-cols-[minmax(280px,1fr)_190px_150px_220px_90px] gap-4 border-b border-slate-800 px-6 py-3 text-[10px] font-black uppercase tracking-[.16em] text-slate-600 lg:grid">
                <span>Aktywo</span>
                <span>Kategoria</span>
                <span className="text-right">Wartość</span>
                <span>Udział</span>
                <span className="text-right">Akcje</span>
              </div>

              <div className="space-y-2 p-3">
                {availablePortfolio.map((asset) => {
                  const category =
                    getAssetCategory(asset);
                  const share =
                    total > 0
                      ? (asset.value / total) * 100
                      : 0;
                  const visual =
                    assetVisual(category, asset.color);
                  const iconKey = getAssetIconKey(asset);

                  return (
                    <div
                      key={asset.id}
                      className="group relative overflow-hidden rounded-2xl border transition duration-200 hover:-translate-y-0.5"
                      style={{
                        borderColor: `${visual.color}35`,
                        background: `linear-gradient(90deg, ${visual.color}18 0%, rgba(15,23,42,.86) 43%, rgba(15,23,42,.62) 100%)`,
                        boxShadow: `0 12px 35px ${visual.color}0b`,
                      }}
                    >
                      <div
                        className="pointer-events-none absolute inset-y-0 left-[31%] w-[240px] opacity-[0.10] blur-[0.2px] transition group-hover:opacity-[0.16]"
                        style={{
                          background: `radial-gradient(circle, ${visual.color} 0%, transparent 68%)`,
                        }}
                      />

                      <div className="relative grid gap-4 px-4 py-3.5 lg:grid-cols-[minmax(280px,1fr)_190px_150px_220px_90px] lg:items-center">
                        <div className="flex min-w-0 items-center gap-4">
                          <div
                            className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl ring-1 ring-white/10"
                            style={{
                              width: 52,
                              height: 52,
                              color: visual.color,
                              backgroundColor: `${visual.color}22`,
                              boxShadow: `0 10px 30px ${visual.color}20`,
                            }}
                          >
                            <AssetIcon iconKey={iconKey} size={24} />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="truncate text-base font-black text-slate-50">
                                {asset.name}
                              </div>
                              {asset.systemCash && (
                                <span className="shrink-0 rounded-full border border-blue-400/20 bg-blue-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-[.12em] text-blue-300">
                                  SYSTEM
                                </span>
                              )}
                            </div>
                            <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                              <span
                                className="h-1.5 w-1.5 rounded-full"
                                style={{
                                  backgroundColor: visual.color,
                                  boxShadow: `0 0 10px ${visual.color}`,
                                }}
                              />
                              {visual.subtitle}
                              {wallets.length>0 && !asset.systemCash && <select value={asset.portfolioId ?? ""} onChange={async e=>{onUpdateAsset({...asset,portfolioId:Number(e.target.value)});}} onClick={e=>e.stopPropagation()} className="ml-2 rounded-md border border-slate-700 bg-slate-950 px-1.5 py-0.5 text-[10px] text-slate-400">{wallets.filter(w=>w.type!=="GOALS").map(w=><option key={w.id} value={w.id}>{w.name}</option>)}</select>}
                            </div>
                          </div>
                        </div>

                        <div>
                          <span
                            className="inline-flex rounded-full border px-2.5 py-1 text-xs font-bold"
                            style={{
                              color: visual.color,
                              borderColor: `${visual.color}25`,
                              backgroundColor: `${visual.color}12`,
                            }}
                          >
                            {assetCategoryLabels[category]}
                          </span>
                        </div>

                        <div className="text-left text-base font-black lg:text-right">
                          {formatMoney(asset.value)}
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="w-12 text-sm font-semibold text-slate-300">
                            {share.toFixed(1)}%
                          </span>
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.min(100, share)}%`,
                                backgroundColor: visual.color,
                                boxShadow: `0 0 12px ${visual.color}`,
                              }}
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-1">
                          {asset.systemCash ? (
                            <div
                              title="Gotówka systemowa jest sterowana przez przychody i wydatki"
                              className="rounded-xl border border-blue-400/15 bg-blue-500/[0.06] px-2.5 py-2 text-[9px] font-black uppercase tracking-[.12em] text-blue-300"
                            >
                              AUTO
                            </div>
                          ) : (
                            <>
                              <button
                                type="button"
                                title="Edytuj"
                                onClick={() =>
                                  setEditingAsset(asset)
                                }
                                className="cursor-pointer rounded-xl p-2.5 text-slate-500 transition hover:bg-blue-500/10 hover:text-blue-300"
                              >
                                <Pencil size={17} />
                              </button>
                              <button
                                type="button"
                                title="Usuń"
                                onClick={() =>
                                  onDeleteAsset(asset.id)
                                }
                                className="cursor-pointer rounded-xl p-2.5 text-slate-500 transition hover:bg-red-500/10 hover:text-red-300"
                              >
                                <Trash2 size={17} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </div>

      {isAddOpen && (
        <AddAssetModal
          onClose={() => setIsAddOpen(false)}
          onAdd={onAddAsset}
        />
      )}

      {(moneyFlow?.allocations.length ?? 0) > 0 && (
        <section className="mt-6 overflow-hidden rounded-3xl border border-violet-500/20 bg-[#0b1322]">
          <div className="border-b border-slate-800 px-6 py-5">
            <p className="text-[10px] font-black uppercase tracking-[.18em] text-violet-400">Kapitał przypisany do celów</p>
            <h2 className="mt-1 text-xl font-black text-white">Pieniądze pracujące na konkretne plany</h2>
            <p className="mt-1 text-xs text-slate-500">Są częścią Net Worth, ale nie są już dostępne do swobodnego wydania.</p>
          </div>
          <div className="grid gap-3 p-5 lg:grid-cols-2">
            {(moneyFlow?.allocations ?? []).map((a,i)=>(
              <div key={`${a.goalId}-${a.assetId}-${i}`} className="rounded-2xl border border-violet-500/15 bg-violet-500/[0.05] p-4">
                <div className="flex items-center justify-between gap-4">
                  <div><p className="font-black text-white">🎯 {a.goalName}</p><p className="mt-1 text-xs text-slate-500">{a.assetName}</p></div>
                  <p className="text-lg font-black text-violet-300">{a.amount.toLocaleString("pl-PL")} zł</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}


      {isWalletOpen && <WalletModal onClose={()=>setIsWalletOpen(false)} onCreate={async name=>{await portfolioApi.create({name,color:"#8b5cf6",iconKey:"wallet"});await refreshWallets();setIsWalletOpen(false);}}/>}
      {isTransferOpen && <TransferModal assets={portfolio} onClose={()=>setIsTransferOpen(false)} onTransfer={async(s,t,a)=>{await portfolioApi.transfer(s,t,a);await onPortfolioChanged();await refreshWallets();setIsTransferOpen(false);}}/>}

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


function WalletModal({onClose,onCreate}:{onClose:()=>void;onCreate:(name:string)=>Promise<void>}){const[name,setName]=useState("");const[saving,setSaving]=useState(false);return <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"><div className="w-full max-w-md rounded-3xl border border-violet-500/20 bg-[#0b1322] p-6"><p className="text-[10px] font-black uppercase tracking-[.16em] text-violet-400">Nowy portfel</p><h2 className="mt-1 text-xl font-black">Oddziel kapitał według przeznaczenia</h2><input autoFocus value={name} onChange={e=>setName(e.target.value)} placeholder="np. Poduszka" className="mt-5 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400/50"/><div className="mt-5 flex justify-end gap-2"><button onClick={onClose} className="rounded-xl border border-slate-700 px-4 py-2">Anuluj</button><button disabled={!name.trim()||saving} onClick={async()=>{setSaving(true);await onCreate(name.trim());}} className="rounded-xl bg-violet-500 px-4 py-2 font-black text-white disabled:opacity-40">UTWÓRZ</button></div></div></div>}
function TransferModal({assets,onClose,onTransfer}:{assets:Asset[];onClose:()=>void;onTransfer:(s:number,t:number,a:number)=>Promise<void>}){const[s,setS]=useState(assets[0]?.id??0);const[t,setT]=useState(assets[1]?.id??assets[0]?.id??0);const[a,setA]=useState("1000");const[saving,setSaving]=useState(false);const amount=Number(a.replace(",","."));return <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"><div className="w-full max-w-lg rounded-3xl border border-blue-500/20 bg-[#0b1322] p-6"><p className="text-[10px] font-black uppercase tracking-[.16em] text-blue-400">Transfer majątku</p><h2 className="mt-1 text-xl font-black">Przenieś kapitał bez zmiany Net Worth</h2><div className="mt-5 grid gap-3"><select value={s} onChange={e=>setS(Number(e.target.value))} className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3">{assets.map(x=><option key={x.id} value={x.id}>Z: {x.name} · {formatMoney(x.value)}</option>)}</select><select value={t} onChange={e=>setT(Number(e.target.value))} className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3">{assets.map(x=><option key={x.id} value={x.id}>Do: {x.name}</option>)}</select><input value={a} onChange={e=>setA(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-xl font-black"/></div><p className="mt-3 text-xs text-slate-500">To nie jest przychód ani wydatek. Zmienia się tylko struktura Twojego majątku.</p><div className="mt-5 flex justify-end gap-2"><button onClick={onClose} className="rounded-xl border border-slate-700 px-4 py-2">Anuluj</button><button disabled={s===t||!Number.isFinite(amount)||amount<=0||saving} onClick={async()=>{setSaving(true);try{await onTransfer(s,t,amount);}catch(e){setSaving(false);alert(e instanceof Error?e.message:"Transfer nieudany");}}} className="rounded-xl bg-blue-600 px-4 py-2 font-black disabled:opacity-40">TRANSFER</button></div></div></div>}

type Accent = "emerald" | "violet" | "amber";

function HeroCard({
  accent,
  label,
  value,
  subtitle,
  icon,
  art,
  compact = false,
}: {
  accent: Accent;
  label: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  art: React.ReactNode;
  compact?: boolean;
}) {
  const styles = {
    emerald: {
      border: "border-emerald-500/35",
      bg: "from-emerald-500/20 via-emerald-950/30 to-slate-950",
      icon: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/25",
      value: "text-emerald-300",
    },
    violet: {
      border: "border-violet-500/35",
      bg: "from-violet-500/20 via-violet-950/30 to-slate-950",
      icon: "bg-violet-500/15 text-violet-300 ring-violet-500/25",
      value: "text-violet-200",
    },
    amber: {
      border: "border-amber-500/35",
      bg: "from-amber-500/20 via-amber-950/30 to-slate-950",
      icon: "bg-amber-500/15 text-amber-300 ring-amber-500/25",
      value: "text-amber-100",
    },
  }[accent];

  return (
    <div
      className={`group relative min-h-[150px] overflow-hidden rounded-2xl border bg-gradient-to-br p-5 shadow-xl transition hover:-translate-y-0.5 ${styles.border} ${styles.bg}`}
    >
      <div className="relative z-10 max-w-[70%]">
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ring-1 ${styles.icon}`}>
          {icon}
        </div>
        <div className="mt-4 text-sm font-medium text-slate-400">
          {label}
        </div>
        <div className={`mt-1 font-black tracking-tight ${compact ? "text-2xl" : "text-3xl"} ${styles.value}`}>
          {value}
        </div>
        <div className="mt-2 text-xs text-slate-500">
          {subtitle}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-y-0 right-0 w-[44%] opacity-80 transition duration-300 group-hover:scale-105 group-hover:opacity-100">
        {art}
      </div>
    </div>
  );
}

function CoinStackArt() {
  return (
    <div className="relative h-full w-full">
      <div className="absolute bottom-5 right-5 h-16 w-16 rounded-full border-[10px] border-amber-400/60 bg-amber-300/10 shadow-[0_0_35px_rgba(251,191,36,.25)]" />
      <div className="absolute bottom-8 right-16 h-12 w-12 rounded-full border-[8px] border-emerald-400/45 bg-emerald-300/10" />
      <div className="absolute bottom-4 right-7 h-3 w-24 rounded-full bg-amber-400/20 blur-sm" />
      <Coins className="absolute right-8 top-5 h-16 w-16 text-emerald-300/20" />
    </div>
  );
}

function BarsArt() {
  return (
    <div className="relative h-full w-full">
      <div className="absolute bottom-5 right-6 flex items-end gap-2">
        {[38, 64, 88].map((height, index) => (
          <div
            key={height}
            className="w-7 rounded-t-lg border border-blue-400/20 bg-gradient-to-t from-blue-700/35 to-blue-400/55 shadow-[0_0_25px_rgba(59,130,246,.16)]"
            style={{ height }}
          >
            <span className="sr-only">{index}</span>
          </div>
        ))}
      </div>
      <TrendingUp className="absolute right-8 top-5 h-16 w-16 text-violet-300/15" />
    </div>
  );
}

function OrbArt() {
  return (
    <div className="relative h-full w-full">
      <div className="absolute right-3 top-1/2 h-28 w-28 -translate-y-1/2 rounded-full border border-amber-300/30 bg-[radial-gradient(circle_at_35%_30%,rgba(253,230,138,.5),rgba(245,158,11,.15)_35%,rgba(15,23,42,.1)_68%)] shadow-[0_0_50px_rgba(245,158,11,.18)]" />
      <div className="absolute right-10 top-1/2 h-20 w-[1px] -translate-y-1/2 rotate-[28deg] bg-amber-200/20" />
      <div className="absolute right-10 top-1/2 h-[1px] w-20 -translate-y-1/2 bg-amber-200/20" />
    </div>
  );
}

function assetVisual(
  category: AssetCategory,
  fallbackColor: string
) {
  switch (category) {
    case "cash":
      return { color: "#3b82f6", subtitle: "Płynny kapitał • konto / gotówka" };
    case "stocks":
      return { color: "#10b981", subtitle: "Rynek kapitałowy • akcje / ETF" };
    case "crypto":
      return { color: "#f97316", subtitle: "Aktywa cyfrowe • kryptowaluty" };
    case "realEstate":
      return { color: "#06b6d4", subtitle: "Nieruchomości • majątek trwały" };
    case "business":
      return { color: "#a855f7", subtitle: "Biznes • udziały / kapitał" };
    case "vehicle":
      return { color: "#94a3b8", subtitle: "Pojazd • majątek użytkowy" };
    default:
      return { color: fallbackColor || "#64748b", subtitle: "Pozostałe aktywa" };
  }
}

function formatMoney(value: number) {
  return `${value.toLocaleString("pl-PL")} zł`;
}

function plural(
  value: number,
  one: string,
  few: string,
  many: string
) {
  if (value === 1) return one;
  if (
    value % 10 >= 2 &&
    value % 10 <= 4 &&
    !(value % 100 >= 12 && value % 100 <= 14)
  ) {
    return few;
  }
  return many;
}
