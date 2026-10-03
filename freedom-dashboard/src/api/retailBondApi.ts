import { authApi } from "./authApi";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

export type RetailBondPosition = {
  id: number;
  emissionCode: string;
  quantity: number;
  availableQuantity: number;
  blockedQuantity: number;
  nominalValue: number;
  currentGrossValue: number;
  taxableGain: number;
  taxAmount: number;
  currentNetValue: number;
  earlyRedemptionFeePerBond: number;
  earlyRedemptionFee: number;
  earlyRedemptionTaxAmount: number;
  currentRedemptionValue: number;
  currentRedemptionPricePerBond: number;
  purchaseDate: string;
  maturityDate: string;
  valuationDate: string;
  currentRate?: number | null;
  currentPeriod?: number | null;
  source: string;
};

export type RetailBondPortfolio = {
  assetId: number;
  assetName: string;
  nominalValue: number;
  grossValue: number;
  taxableGain: number;
  taxAmount: number;
  netValue: number;
  valuationDate: string;
  positions: RetailBondPosition[];
};

export type RetailBondPositionInput = {
  emissionCode: string;
  quantity: number;
  blockedQuantity?: number;
  purchaseDate: string;
  currentGrossValue?: number;
};

function token(): string {
  const value = authApi.getToken();
  if (!value) throw new Error("Brak tokenu JWT");
  return value;
}

async function handle<T>(response: Response): Promise<T> {
  if (!response.ok) throw new Error((await response.text()) || `HTTP ${response.status}`);
  return response.json();
}

function normalize(row: RetailBondPortfolio): RetailBondPortfolio {
  return {
    ...row,
    nominalValue: Number(row.nominalValue),
    grossValue: Number(row.grossValue),
    taxableGain: Number(row.taxableGain),
    taxAmount: Number(row.taxAmount),
    netValue: Number(row.netValue),
    positions: row.positions.map(item => ({
      ...item,
      quantity: Number(item.quantity),
      availableQuantity: Number(item.availableQuantity),
      blockedQuantity: Number(item.blockedQuantity),
      nominalValue: Number(item.nominalValue),
      currentGrossValue: Number(item.currentGrossValue),
      taxableGain: Number(item.taxableGain),
      taxAmount: Number(item.taxAmount),
      currentNetValue: Number(item.currentNetValue),
      earlyRedemptionFeePerBond: Number(item.earlyRedemptionFeePerBond),
      earlyRedemptionFee: Number(item.earlyRedemptionFee),
      earlyRedemptionTaxAmount: Number(item.earlyRedemptionTaxAmount),
      currentRedemptionValue: Number(item.currentRedemptionValue),
      currentRedemptionPricePerBond: Number(item.currentRedemptionPricePerBond),
      currentRate: item.currentRate == null ? null : Number(item.currentRate),
      currentPeriod: item.currentPeriod == null ? null : Number(item.currentPeriod),
    })),
  };
}

export const retailBondApi = {
  async get(assetId: number): Promise<RetailBondPortfolio> {
    const row = await handle<RetailBondPortfolio>(await fetch(`${API_URL}/api/retail-bonds/assets/${assetId}`, {
      headers: { Authorization: `Bearer ${token()}` },
    }));
    return normalize(row);
  },

  async refresh(assetId: number): Promise<RetailBondPortfolio> {
    const row = await handle<RetailBondPortfolio>(await fetch(`${API_URL}/api/retail-bonds/assets/${assetId}/refresh`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token()}` },
    }));
    return normalize(row);
  },

  async addPositionToPortfolio(portfolioId: number, input: RetailBondPositionInput): Promise<RetailBondPortfolio> {
    const row = await handle<RetailBondPortfolio>(await fetch(`${API_URL}/api/retail-bonds/portfolios/${portfolioId}/positions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }));
    return normalize(row);
  },

  async addPosition(assetId: number, input: RetailBondPositionInput): Promise<RetailBondPortfolio> {
    const row = await handle<RetailBondPortfolio>(await fetch(`${API_URL}/api/retail-bonds/assets/${assetId}/positions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }));
    return normalize(row);
  },

  async deletePosition(assetId: number, positionId: number): Promise<RetailBondPortfolio> {
    const row = await handle<RetailBondPortfolio>(await fetch(`${API_URL}/api/retail-bonds/assets/${assetId}/positions/${positionId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token()}` },
    }));
    return normalize(row);
  },

  async importXls(portfolioId: number, file: File): Promise<RetailBondPortfolio> {
    const data = new FormData();
    data.append("file", file);
    const row = await handle<RetailBondPortfolio>(await fetch(`${API_URL}/api/retail-bonds/import?portfolioId=${portfolioId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token()}` },
      body: data,
    }));
    return normalize(row);
  },
};
