import { authApi } from "./authApi";
import type { PortfolioInput, PortfolioWallet, ValuationEvent } from "../types/Portfolio";
import type { AssetCategory, CashCurrency } from "../types/Asset";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

export type PurchaseTargetInput = {
  name: string;
  category: AssetCategory;
  color?: string;
  iconKey?: string;
  cryptoCoinId?: string;
  cryptoSymbol?: string;
  cashCurrency?: CashCurrency;
  stockSymbol?: string;
  stockCurrency?: CashCurrency;
};

export type PortfolioTransferInput = {
  sourceAssetId: number;
  targetAssetId?: number | null;
  targetPortfolioId?: number | null;
  newTarget?: PurchaseTargetInput | null;
  amount: number;
  acquiredQuantity?: number | null;
  fee?: number;
};

function toBackendAssetCategory(category: AssetCategory) {
  switch (category) {
    case "cash": return "CASH";
    case "stocks": return "STOCKS";
    case "crypto": return "CRYPTO";
    case "realEstate": return "REAL_ESTATE";
    case "business": return "BUSINESS";
    case "vehicle": return "VEHICLE";
    case "metals": return "METALS";
    case "bonds": return "BONDS";
    default: return "OTHER";
  }
}

function transferBody(input: PortfolioTransferInput) {
  return {
    ...input,
    newTarget: input.newTarget ? {
      ...input.newTarget,
      category: toBackendAssetCategory(input.newTarget.category),
    } : null,
  };
}

type PortfolioApiWallet = Omit<PortfolioWallet, "imagePosition"> & {
  imagePosition?: "TOP" | "CENTER" | "BOTTOM" | null;
};

type PortfolioApiInput = Omit<PortfolioInput, "imagePosition"> & {
  imagePosition: "TOP" | "CENTER" | "BOTTOM";
};

function headers() {
  const token = authApi.getToken();
  if (!token) throw new Error("Zaloguj się ponownie.");
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

async function read<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.text();
    let message = body || `Nie udało się wykonać operacji (HTTP ${response.status}).`;
    try {
      const error = JSON.parse(body) as { message?: string };
      if (error.message) message = error.message;
    } catch { /* The server may return plain text. */ }
    throw new Error(message);
  }
  return response.status === 204 ? undefined as T : response.json();
}

function fromResponse(wallet: PortfolioApiWallet): PortfolioWallet {
  return {
    ...wallet,
    imagePosition: wallet.imagePosition?.toLowerCase() as PortfolioWallet["imagePosition"],
  };
}

function toRequest(input: PortfolioInput): PortfolioApiInput {
  return {
    ...input,
    imagePosition: input.imagePosition.toUpperCase() as PortfolioApiInput["imagePosition"],
  };
}

export const portfolioApi = {
  getAll: () => fetch(`${API}/api/portfolios`, { headers: headers() })
    .then(read<PortfolioApiWallet[]>)
    .then(wallets => wallets.map(fromResponse)),

  create: (input: PortfolioInput) => fetch(`${API}/api/portfolios`, {
    method: "POST", headers: headers(), body: JSON.stringify(toRequest(input)),
  }).then(read<PortfolioApiWallet>).then(fromResponse),

  update: (id: number, input: PortfolioInput) => fetch(`${API}/api/portfolios/${id}`, {
    method: "PUT", headers: headers(), body: JSON.stringify(toRequest(input)),
  }).then(read<PortfolioApiWallet>).then(fromResponse),

  remove: (id: number) => fetch(`${API}/api/portfolios/${id}`, {
    method: "DELETE", headers: headers(),
  }).then(read<void>),

  transfer: (input: PortfolioTransferInput) =>
    fetch(`${API}/api/portfolios/transfer`, {
      method: "POST", headers: headers(), body: JSON.stringify(transferBody(input)),
    }).then(read<void>),

  moveAsset: (assetId: number, targetPortfolioId: number) =>
    fetch(`${API}/api/portfolios/move-asset`, {
      method: "POST", headers: headers(), body: JSON.stringify({ assetId, targetPortfolioId }),
    }).then(read<void>),

  valuations: (limit = 100) => {
    const params = new URLSearchParams({ limit: String(Math.max(1, Math.min(5000, Math.trunc(limit)))) });
    return fetch(`${API}/api/portfolios/valuations?${params.toString()}`, { headers: headers() }).then(read<ValuationEvent[]>);
  },
};
