import { test, expect, type Page } from "@playwright/test";
import { wealthBreakdown, fundedGoals, portfolioHistory } from "../src/components/investments/portfolioView";
import type { Asset } from "../src/types/Asset";
import type { MonthlySnapshot } from "../src/types/MonthlySnapshot";
import type { PortfolioWallet } from "../src/types/Portfolio";
import type { MoneyFlowOverview } from "../src/types/GoalAllocation";

async function setup(page: Page, empty = false) {
  const assets = empty ? [] : [
    { id: 1, portfolioId: 1, name: "Gotówka", value: 10000, category: "CASH", iconKey: "wallet", color: "#318bff", systemCash: true },
    { id: 2, portfolioId: 3, name: "Obligacje", value: 22500, category: "OTHER", iconKey: "shield", color: "#318bff" },
    { id: 3, portfolioId: 3, name: "Gotówka PLN", value: 7500, category: "CASH", color: "#ffbf3f" },
    { id: 4, portfolioId: 4, name: "ETF globalne", value: 60000, category: "STOCKS", color: "#35d5a4" },
    { id: 5, portfolioId: 4, name: "Akcje PL", value: 20000, category: "STOCKS", color: "#ffbf3f" },
    { id: 6, portfolioId: 4, name: "Obligacje", value: 20000, category: "OTHER", color: "#39c6d6" },
    { id: 7, portfolioId: 5, name: "Obligacje", value: 15000, category: "OTHER", color: "#318bff" },
    { id: 8, portfolioId: 5, name: "Gotówka PLN", value: 9000, category: "CASH", color: "#ffbf3f" },
    { id: 9, portfolioId: 5, name: "ETF krótkoterm.", value: 6000, category: "STOCKS", color: "#35d5a4" },
    { id: 10, portfolioId: 6, name: "Gotówka PLN", value: 20000, category: "CASH", color: "#f74763" },
  ];
  const wallets = [
    { id: 1, name: "Główny", type: "MAIN", color: "#318bff", iconKey: "wallet", systemPortfolio: true, targetAmount: null, monthlyContribution: 0 },
    { id: 2, name: "Cele", type: "GOALS", color: "#8b5cf6", iconKey: "target", systemPortfolio: true, targetAmount: null, monthlyContribution: 0 },
    ...empty ? [] : [
      { id: 3, name: "Poduszka", type: "CUSTOM", color: "#318bff", iconKey: "shield", systemPortfolio: false, targetAmount: 30000, monthlyContribution: 500 },
      { id: 4, name: "Długoterminowy", type: "CUSTOM", color: "#35d5a4", iconKey: "sprout", systemPortfolio: false, targetAmount: 300000, monthlyContribution: 1500 },
      { id: 5, name: "Krótkoterminowy", type: "CUSTOM", color: "#ffbf3f", iconKey: "clock", systemPortfolio: false, targetAmount: 50000, monthlyContribution: 500 },
      { id: 6, name: "Nadpłaty kredytu", type: "CUSTOM", color: "#f74763", iconKey: "house", systemPortfolio: false, targetAmount: 100000, monthlyContribution: 1000 },
    ],
  ];
  const overview = { totalAllocated: empty ? 0 : 30000, executedGoalIds: [], allocations: empty ? [] : [
    { goalId: 1, goalName: "Poduszka", assetId: 2, assetName: "Obligacje", amount: 22500 },
    { goalId: 1, goalName: "Poduszka", assetId: 3, assetName: "Gotówka PLN", amount: 7500 },
  ] };
  const goals = empty ? [] : [{ id: 1, name: "Poduszka", currentAmount: 30000, targetAmount: 30000, monthlyContribution: 500, color: "#8b5cf6", type: "EMERGENCY_FUND", priority: "HIGH" }];
  const now = new Date();
  const snapshots = empty ? [] : [80000, 92000, 111000, 130000, 144000, 155000, 167000, 180000].map((value, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 8 + index, 1);
    return { id: index + 1, month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`, closedAt: date.toISOString(), cashflow: { income: 0, expenses: 0, surplus: 0, savingsRate: 0, incomeTransactions: 0, expenseTransactions: 0 }, wealth: { assets: value, netWorth: value - 20000, liabilities: 20000 }, assets: [], goals: [], liabilities: [], player: { totalXp: 0, level: 1, levelName: "Start", unlockedAchievements: 0, totalAchievements: 0 } };
  });
  let failCreate = false;
  await page.addInitScript(() => {
    localStorage.setItem("freedom-auth-token", "test-session");
    localStorage.setItem("freedom-seen-achievements-v1", JSON.stringify(["wealth-10k", "wealth-30k", "wealth-100k", "wealth-250k", "wealth-500k", "wealth-1m", "wealth-3m", "savings-50", "surplus-10k", "surplus-20k", "positive-3", "invested-100k", "invested-250k", "goal-1", "debt-1"]));
  });
  await page.route("**/api/**", async route => {
    const request = route.request(); const url = new URL(request.url()); const path = url.pathname;
    if (!path.startsWith("/api/")) return route.continue();
    const fulfill = (json: unknown, status = 200) => route.fulfill({ status, json });
    if (path === "/api/auth/me") return fulfill({ id: 1, email: "preview@example.test" });
    if (path === "/api/assets") return fulfill(assets);
    if (path === "/api/goals") return fulfill(goals);
    if (path === "/api/monthly-snapshots") return fulfill(snapshots);
    if (path === "/api/goal-allocations/overview") return fulfill(overview);
    if (path === "/api/portfolios" && request.method() === "POST") {
      if (failCreate) { failCreate = false; return fulfill({ message: "Zapis chwilowo niedostępny" }, 503); }
      wallets.push({ id: 20, type: "CUSTOM", systemPortfolio: false, ...request.postDataJSON() }); return fulfill(wallets.at(-1), 201);
    }
    if (path === "/api/portfolios") return fulfill(wallets.map(wallet => {
      const members = assets.filter(asset => asset.portfolioId === wallet.id);
      const grossValue = members.reduce((sum, asset) => sum + asset.value, 0);
      const allocatedOut = overview.allocations.filter(row => members.some(asset => asset.id === row.assetId)).reduce((sum, row) => sum + row.amount, 0);
      return { ...wallet, grossValue, allocatedOut, value: wallet.type === "GOALS" ? overview.totalAllocated : grossValue - allocatedOut };
    }));
    if (path.startsWith("/api/portfolios/") && request.method() === "PUT") {
      Object.assign(wallets.find(w => w.id === Number(path.split("/").at(-1)))!, request.postDataJSON()); return fulfill({});
    }
    if (path === "/api/portfolios/transfer") {
      const { sourceAssetId, targetAssetId, amount } = request.postDataJSON();
      assets.find(asset => asset.id === sourceAssetId)!.value -= amount;
      assets.find(asset => asset.id === targetAssetId)!.value += amount;
      return route.fulfill({ status: 204 });
    }
    if (path.includes("/allocations/") && request.method() === "DELETE") {
      const assetId = Number(path.split("/").at(-1)); const amount = Number(url.searchParams.get("amount"));
      overview.allocations.find(row => row.assetId === assetId)!.amount -= amount;
      overview.totalAllocated -= amount; goals[0].currentAmount -= amount;
      return fulfill({});
    }
    return fulfill([]);
  });
  await page.goto("/investments");
  await expect(page.getByRole("heading", { name: "Inwestycje", exact: true })).toBeVisible();
  await expect(page.getByText("Pobieranie portfeli…")).toHaveCount(0);
  return { failNextCreate: () => { failCreate = true; }, assets, overview, wallets };
}

test("mockup layout, real totals, allocation tabs and responsive screen", async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await setup(page);
  const stats = page.locator(".investment-stats");
  await expect(stats).toContainText("190 000"); await expect(stats).toContainText("3 500"); await expect(stats).toContainText("30 000");
  await page.getByRole("button", { name: "Wg celów", exact: true }).click();
  await expect(page.locator(".wealth-legend")).toContainText("160 000");
  await page.getByRole("button", { name: "Wg portfeli", exact: true }).click();
  await expect(page.locator(".portfolio-cards > article")).toHaveCount(5);
  await expect(page.locator(".portfolio-cards > article").first()).toContainText("Główny");
  await expect(page.locator(".system-cash-strip")).toHaveCount(0);
  await page.screenshot({ path: "test-results/investments-desktop.png", fullPage: true });
  await page.getByRole("button", { name: "6M", exact: true }).click();
  await page.getByRole("button", { name: "MAX", exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  await page.screenshot({ path: "test-results/investments-mobile.png", fullPage: true });
  expect(errors).toEqual([]);
});

test("create retries after API failure and edit persists planning fields", async ({ page }) => {
  const state = await setup(page); state.failNextCreate();
  await page.getByRole("button", { name: "Dodaj portfel", exact: true }).first().click();
  await page.getByLabel("Nazwa portfela").fill("Emerytura");
  await page.getByLabel("Docelowa wartość (zł)").fill("250000");
  await page.getByLabel("Miesięczna wpłata (zł)").fill("800");
  await page.getByRole("button", { name: "Utwórz portfel" }).click();
  await expect(page.getByRole("alert")).toContainText("Zapis chwilowo niedostępny");
  await page.getByRole("button", { name: "Utwórz portfel" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".investment-stats")).toContainText("4 300");
  await page.getByRole("button", { name: "Opcje portfela Emerytura" }).click();
  await page.getByRole("button", { name: "Edytuj portfel", exact: true }).click();
  await expect(page.getByLabel("Docelowa wartość (zł)")).toHaveValue("250000");
  await page.getByLabel("Miesięczna wpłata (zł)").fill("1000");
  await page.getByRole("button", { name: "Zapisz zmiany", exact: true }).click();
  await expect(page.locator(".investment-stats")).toContainText("4 500");
});

test("transfer respects available capital; release refreshes goals and portfolio", async ({ page }) => {
  const state = await setup(page);
  await page.getByRole("button", { name: "Transfer", exact: true }).click();
  await page.getByLabel("Portfel źródłowy").selectOption("3");
  await page.getByLabel("Aktywo źródłowe").selectOption("2");
  await expect(page.locator(".transfer-side.source .transfer-balance")).toContainText("0 zł");
  await page.getByLabel("Kwota transferu", { exact: true }).fill("1");
  await expect(page.getByRole("button", { name: "Przenieś środki" })).toBeDisabled();
  await page.getByLabel("Portfel źródłowy").selectOption("1");
  await page.getByLabel("Portfel docelowy").selectOption("4");
  await page.getByLabel("Aktywo docelowe").selectOption("4");
  await page.getByLabel("Kwota transferu", { exact: true }).fill("1000");
  await expect(page.locator(".transfer-preview")).toContainText("9 000");
  await expect(page.locator(".transfer-preview")).toContainText("61 000");
  await page.getByRole("dialog").screenshot({ path: "test-results/transfer-desktop.png" });
  await page.getByRole("button", { name: "Przenieś środki" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(state.assets.reduce((sum, asset) => sum + asset.value, 0)).toBe(190000);
  await page.getByRole("button", { name: "Zwolnij środki", exact: true }).click();
  await page.getByLabel("Kwota do zwolnienia (zł)").fill("500");
  await page.getByRole("dialog").getByRole("button", { name: "Zwolnij środki", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".goal-capital-amount")).toContainText("29 500");
  await expect(page.locator(".investment-stats")).toContainText("190 000");
});

test("portfolio pickers filter assets, handle empty targets and never select the source twice", async ({ page }) => {
  const state = await setup(page);
  state.wallets.push({ id: 30, name: "Pusty portfel", type: "CUSTOM", color: "#35d5a4", iconKey: "sprout", systemPortfolio: false, targetAmount: null, monthlyContribution: 0 });
  await page.reload();
  await page.getByRole("button", { name: "Transfer", exact: true }).click();
  await expect(page.getByLabel("Portfel źródłowy")).toHaveValue("1");
  await expect(page.getByLabel("Aktywo źródłowe").locator("option")).toHaveCount(1);
  await page.getByLabel("Portfel docelowy").selectOption("1");
  await expect(page.getByLabel("Aktywo docelowe")).toBeDisabled();
  await expect(page.getByRole("button", { name: "Przenieś środki" })).toBeDisabled();
  await page.getByLabel("Portfel docelowy").selectOption("4");
  await expect(page.getByLabel("Aktywo docelowe").locator("option")).toHaveCount(3);
  await page.getByRole("button", { name: "Całość", exact: true }).click();
  await expect(page.getByLabel("Kwota transferu")).toHaveValue("10000.00");
  await expect(page.getByRole("button", { name: "Przenieś środki" })).toBeEnabled();
  await page.getByLabel("Kwota transferu").fill("10000.01");
  await expect(page.getByRole("button", { name: "Przenieś środki" })).toBeDisabled();
  await page.getByLabel("Kwota transferu").fill("1000");
  await page.setViewportSize({ width: 390, height: 844 });
  const bounds = await page.getByRole("dialog").boundingBox();
  expect(bounds!.width).toBeLessThanOrEqual(390);
  expect(await page.getByRole("dialog").evaluate(element => element.scrollWidth <= element.clientWidth)).toBeTruthy();
  await page.screenshot({ path: "test-results/transfer-mobile.png" });
  await page.getByLabel("Portfel docelowy").selectOption("30");
  await expect(page.getByLabel("Aktywo docelowe")).toBeDisabled();
  await page.getByRole("button", { name: "Dodaj aktywo do portfela" }).click();
  await expect(page.getByRole("heading", { name: "Dodaj aktywo", exact: true })).toBeVisible();
});

test("empty portfolio has honest history and no horizontal overflow", async ({ page }) => {
  await setup(page, true);
  await expect(page.getByText("Pierwszy punkt:", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: "Transfer", exact: true })).toBeDisabled();
  await expect(page.locator(".investment-stats")).toContainText("0");
});

test("wealth grouping never counts reservations twice or merges goals by name", () => {
  const assets = [{ id: 1, portfolioId: 1, name: "Cash", value: 10000, color: "#318bff", category: "cash" }] as Asset[];
  const wallets = [{ id: 1, name: "Main", type: "MAIN", color: "#318bff", grossValue: 10000, value: 8000, allocatedOut: 2000 }] as PortfolioWallet[];
  const overview: MoneyFlowOverview = { totalAllocated: 2500, executedGoalIds: [], allocations: [
    { goalId: 1, goalName: "Same name", assetId: 1, assetName: "Cash", amount: 1000 },
    { goalId: 2, goalName: "Same name", assetId: 1, assetName: "Cash", amount: 1000 },
    { goalId: 3, goalName: "Legacy", assetId: null, assetName: "Legacy", amount: 500 },
  ] };
  for (const mode of ["portfolios", "assets", "goals"] as const) expect(wealthBreakdown(mode, assets, wallets, overview).reduce((sum, row) => sum + row.value, 0)).toBe(10000);
  expect(fundedGoals(overview, [], assets, wallets)).toHaveLength(3);
  const snapshots = [{ month: "2026-01", wealth: { assets: 15000, netWorth: 10000 } }] as MonthlySnapshot[];
  const history = portfolioHistory(snapshots, 19000, 12, new Date(2026, 8, 29));
  expect(history.map(point => point.value)).toEqual([15000, 19000]);
});
