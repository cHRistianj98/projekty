import type { Asset, AssetCategory, AssetIconKey } from "../types/Asset";
import { authApi } from "./authApi";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

type BackendAssetCategory =
  | "CASH"
  | "STOCKS"
  | "CRYPTO"
  | "REAL_ESTATE"
  | "BUSINESS"
  | "VEHICLE"
  | "OTHER";

type BackendAsset = {
  id: number;
  name: string;
  value: number;
  color: string;
  category: BackendAssetCategory;
  iconKey?: AssetIconKey | null;
  systemCash?: boolean;
  portfolioId: number;
};

function authHeaders(): HeadersInit {
  const token = authApi.getToken();
  if (!token) throw new Error("Brak tokenu JWT");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

async function handle<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error((await response.text()) || `HTTP ${response.status}`);
  }
  return response.status === 204 ? (undefined as T) : response.json();
}

function toBackendCategory(category?: AssetCategory): BackendAssetCategory {
  switch (category) {
    case "cash": return "CASH";
    case "stocks": return "STOCKS";
    case "crypto": return "CRYPTO";
    case "realEstate": return "REAL_ESTATE";
    case "business": return "BUSINESS";
    case "vehicle": return "VEHICLE";
    default: return "OTHER";
  }
}

function fromBackendCategory(category: BackendAssetCategory): AssetCategory {
  switch (category) {
    case "CASH": return "cash";
    case "STOCKS": return "stocks";
    case "CRYPTO": return "crypto";
    case "REAL_ESTATE": return "realEstate";
    case "BUSINESS": return "business";
    case "VEHICLE": return "vehicle";
    default: return "other";
  }
}

function fromBackend(row: BackendAsset): Asset {
  return {
    id: row.id,
    name: row.name,
    value: Number(row.value),
    color: row.color,
    category: fromBackendCategory(row.category),
    ...(row.iconKey ? { iconKey: row.iconKey } : {}),
    systemCash: Boolean(row.systemCash),
    portfolioId: row.portfolioId,
  };
}

function body(asset: Asset) {
  return {
    name: asset.name,
    value: asset.value,
    color: asset.color,
    category: toBackendCategory(asset.category),
    iconKey: asset.iconKey ?? null,
    portfolioId: asset.portfolioId ?? null,
  };
}

export const assetApi = {
  async getAll(): Promise<Asset[]> {
    const rows = await handle<BackendAsset[]>(
      await fetch(`${API_URL}/api/assets`, { headers: authHeaders() })
    );
    return rows.map(fromBackend);
  },

  async create(asset: Asset): Promise<Asset> {
    const row = await handle<BackendAsset>(
      await fetch(`${API_URL}/api/assets`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(body(asset)),
      })
    );
    return fromBackend(row);
  },

  async update(id: number, asset: Asset): Promise<Asset> {
    const row = await handle<BackendAsset>(
      await fetch(`${API_URL}/api/assets/${id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(body(asset)),
      })
    );
    return fromBackend(row);
  },

  async remove(id: number): Promise<void> {
    await handle<void>(
      await fetch(`${API_URL}/api/assets/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      })
    );
  },
};
