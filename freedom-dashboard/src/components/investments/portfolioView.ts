import type { Asset } from "../../types/Asset";
import { assetCategoryLabels, getAssetCategory } from "../../types/Asset";
import type { Goal } from "../../types/Goal";
import type { MoneyFlowOverview, PortfolioAllocation } from "../../types/GoalAllocation";
import type { MonthlySnapshot } from "../../types/MonthlySnapshot";
import type { PortfolioWallet } from "../../types/Portfolio";

export const portfolioColors = ["#318bff", "#35d5a4", "#ffbf3f", "#f74763", "#8b5cf6", "#39c6d6"];
export type Breakdown = { id: string; name: string; value: number; color: string };
export type FundedGoal = {
  id: number; name: string; amount: number; target: number; color: string;
  sources: string[]; allocations: PortfolioAllocation[];
};

export const money = (value: number) => new Intl.NumberFormat("pl-PL", {
  style: "currency", currency: "PLN", useGrouping: "always", maximumFractionDigits: 2, minimumFractionDigits: 0,
}).format(value);
export const percent = (value: number, total: number) =>
  new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 1 }).format(total > 0 ? value / total * 100 : 0) + "%";

export function allocationsByAsset(overview: MoneyFlowOverview | null) {
  const result = new Map<number, number>();
  for (const allocation of overview?.allocations ?? []) {
    if (allocation.assetId != null) result.set(allocation.assetId, (result.get(allocation.assetId) ?? 0) + allocation.amount);
  }
  return result;
}

export function fundedGoals(overview: MoneyFlowOverview | null, goals: Goal[], assets: Asset[], wallets: PortfolioWallet[]): FundedGoal[] {
  const result = new Map<number, FundedGoal>();
  for (const allocation of overview?.allocations ?? []) {
    const goal = goals.find(item => item.id === allocation.goalId);
    const row = result.get(allocation.goalId) ?? {
      id: allocation.goalId, name: allocation.goalName, amount: 0, target: goal?.targetAmount ?? 0,
      color: goal?.color ?? "#8b5cf6", sources: [], allocations: [],
    };
    row.amount += allocation.amount;
    row.allocations.push(allocation);
    const asset = assets.find(item => item.id === allocation.assetId);
    const source = wallets.find(item => item.id === asset?.portfolioId)?.name ?? "Nieprzypisane źródło";
    if (!row.sources.includes(source)) row.sources.push(source);
    result.set(row.id, row);
  }
  return [...result.values()];
}

export function wealthBreakdown(mode: "portfolios" | "assets" | "goals", assets: Asset[], wallets: PortfolioWallet[], overview: MoneyFlowOverview | null): Breakdown[] {
  if (mode === "assets") {
    const categories = new Map<string, Breakdown>();
    for (const asset of assets) {
      const category = getAssetCategory(asset);
      const row = categories.get(category) ?? { id: category, name: assetCategoryLabels[category], value: 0, color: portfolioColors[categories.size % portfolioColors.length] };
      row.value += asset.value;
      categories.set(category, row);
    }
    return [...categories.values()];
  }
  const allocated = allocationsByAsset(overview);
  // Legacy allocations without an existing asset cannot be counted as wealth.
  const backed = (overview?.allocations ?? []).filter(row => assets.some(asset => asset.id === row.assetId));
  const locked = backed.reduce((sum, row) => sum + row.amount, 0);
  if (mode === "goals") {
    const rows = new Map<number, Breakdown>();
    for (const row of backed) {
      const entry = rows.get(row.goalId) ?? { id: String(row.goalId), name: row.goalName, value: 0, color: portfolioColors[(rows.size + 4) % portfolioColors.length] };
      entry.value += row.amount;
      rows.set(row.goalId, entry);
    }
    return [{ id: "available", name: "Kapitał dostępny", value: assets.reduce((sum, a) => sum + a.value, 0) - locked, color: "#318bff" }, ...rows.values()];
  }
  const rows = wallets.filter(w => w.type !== "GOALS").map(wallet => ({
    id: String(wallet.id), name: wallet.name + (wallet.allocatedOut > 0 ? " · dostępne" : ""), color: wallet.color,
    value: assets.filter(asset => asset.portfolioId === wallet.id).reduce((sum, a) => sum + a.value - (allocated.get(a.id) ?? 0), 0),
  }));
  const unassigned = assets.filter(a => !wallets.some(w => w.id === a.portfolioId)).reduce((sum, a) => sum + a.value - (allocated.get(a.id) ?? 0), 0);
  if (unassigned !== 0) rows.push({ id: "unassigned", name: "Bez portfela", value: unassigned, color: "#64748b" });
  if (locked > 0) rows.push({ id: "locked", name: "Przypisane do celów", value: locked, color: "#8b5cf6" });
  return rows;
}

export function portfolioHistory(snapshots: MonthlySnapshot[], currentValue: number, months: number | null, now = new Date()) {
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const cutoff = months == null ? -Infinity : new Date(now.getFullYear(), now.getMonth() - months + 1, 1).getTime();
  const points = snapshots.filter(snapshot => snapshot.month < currentMonth).map(snapshot => {
    const [year, month] = snapshot.month.split("-").map(Number);
    return { time: new Date(year, month, 0).getTime(), value: snapshot.wealth.assets, current: false };
  }).filter(point => point.time >= cutoff).sort((a, b) => a.time - b.time);
  return [...points, { time: now.getTime(), value: currentValue, current: true }];
}
