import { authApi } from "./authApi";
import type { PortfolioInput, PortfolioWallet, ValuationEvent } from "../types/Portfolio";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

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

  transfer: (sourceAssetId: number, targetAssetId: number, amount: number) =>
    fetch(`${API}/api/portfolios/transfer`, {
      method: "POST", headers: headers(), body: JSON.stringify({ sourceAssetId, targetAssetId, amount }),
    }).then(read<void>),

  moveAsset: (assetId: number, targetPortfolioId: number) =>
    fetch(`${API}/api/portfolios/move-asset`, {
      method: "POST", headers: headers(), body: JSON.stringify({ assetId, targetPortfolioId }),
    }).then(read<void>),

  valuations: () => fetch(`${API}/api/portfolios/valuations`, { headers: headers() }).then(read<ValuationEvent[]>),
};
