import { authApi } from "./authApi";
import type { PortfolioInput, PortfolioWallet, ValuationEvent } from "../types/Portfolio";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

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

export const portfolioApi = {
  getAll: () => fetch(`${API}/api/portfolios`, { headers: headers() }).then(read<PortfolioWallet[]>),
  create: (input: PortfolioInput) => fetch(`${API}/api/portfolios`, {
    method: "POST", headers: headers(), body: JSON.stringify(input),
  }).then(read<PortfolioWallet>),
  update: (id: number, input: PortfolioInput) => fetch(`${API}/api/portfolios/${id}`, {
    method: "PUT", headers: headers(), body: JSON.stringify(input),
  }).then(read<PortfolioWallet>),
  remove: (id: number) => fetch(`${API}/api/portfolios/${id}`, {
    method: "DELETE", headers: headers(),
  }).then(read<void>),
  transfer: (sourceAssetId: number, targetAssetId: number, amount: number) =>
    fetch(`${API}/api/portfolios/transfer`, {
      method: "POST", headers: headers(), body: JSON.stringify({ sourceAssetId, targetAssetId, amount }),
    }).then(read<void>),
  valuations: () => fetch(`${API}/api/portfolios/valuations`, { headers: headers() }).then(read<ValuationEvent[]>),
};
