import { authApi } from "./authApi";
import { fromBackendAsset } from "./assetApi";
import type { Asset, MetalSymbol } from "../types/Asset";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

export type MetalQuote = {
  symbol: MetalSymbol;
  name: string;
  priceUsdPerTroyOunce: number;
  usdPlnRate: number;
  pricePlnPerTroyOunce: number;
  metalUpdatedAt: string;
  fxDate: string;
};

function headers(): HeadersInit {
  const token = authApi.getToken();
  if (!token) throw new Error("Brak tokenu JWT");
  return { Authorization: `Bearer ${token}` };
}

async function handle<T>(response: Response): Promise<T> {
  if (!response.ok) throw new Error((await response.text()) || `HTTP ${response.status}`);
  return response.json();
}

export const marketPriceApi = {
  async getMetalQuotes(): Promise<MetalQuote[]> {
    const rows = await handle<MetalQuote[]>(
      await fetch(`${API_URL}/api/market/metals/quotes`, { headers: headers() })
    );
    return rows.map((row) => ({
      ...row,
      priceUsdPerTroyOunce: Number(row.priceUsdPerTroyOunce),
      usdPlnRate: Number(row.usdPlnRate),
      pricePlnPerTroyOunce: Number(row.pricePlnPerTroyOunce),
    }));
  },

  async refreshMetalAssets(): Promise<Asset[]> {
    const rows = await handle<any[]>(
      await fetch(`${API_URL}/api/market/metals/refresh`, {
        method: "POST",
        headers: headers(),
      })
    );
    return rows.map(fromBackendAsset);
  },
};
