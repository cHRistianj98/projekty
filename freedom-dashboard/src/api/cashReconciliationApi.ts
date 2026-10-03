import { authApi } from "./authApi";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

export type CashReconciliationAsset = {
  assetId: number;
  name: string;
  value: number;
  reserved: number;
  systemCash: boolean;
  portfolioId: number;
};

export type CashReconciliationResponse = {
  assets: CashReconciliationAsset[];
  previousTotal: number;
  currentTotal: number;
  adjustment: number;
};

function headers(): HeadersInit {
  const token = authApi.getToken();
  if (!token) throw new Error("Zaloguj się ponownie.");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

async function read<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.text();
    let message = body || `Nie udało się wykonać operacji (HTTP ${response.status}).`;
    try {
      const parsed = JSON.parse(body) as { message?: string };
      if (parsed.message) message = parsed.message;
    } catch { /* plain text response */ }
    throw new Error(message);
  }
  return response.json();
}

function normalize(response: CashReconciliationResponse): CashReconciliationResponse {
  return {
    ...response,
    previousTotal: Number(response.previousTotal),
    currentTotal: Number(response.currentTotal),
    adjustment: Number(response.adjustment),
    assets: response.assets.map(asset => ({
      ...asset,
      value: Number(asset.value),
      reserved: Number(asset.reserved),
    })),
  };
}

export const cashReconciliationApi = {
  get: () => fetch(`${API}/api/assets/cash-reconciliation`, { headers: headers() })
    .then(read<CashReconciliationResponse>)
    .then(normalize),

  reconcile: (balances: Array<{ assetId: number; targetValue: number }>) =>
    fetch(`${API}/api/assets/cash-reconciliation`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ balances }),
    }).then(read<CashReconciliationResponse>).then(normalize),
};
