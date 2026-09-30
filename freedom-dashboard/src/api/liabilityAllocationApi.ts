import { authApi } from "./authApi";
import type {
  LiabilityAllocationOverview,
  LiabilityAllocationSummary,
} from "../types/LiabilityAllocation";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

function headers(): HeadersInit {
  const token = authApi.getToken();
  if (!token) throw new Error("Zaloguj się ponownie.");
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

async function read<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.text();
    let message = body || `HTTP ${response.status}`;
    try {
      const parsed = JSON.parse(body) as { message?: string };
      if (parsed.message) message = parsed.message;
    } catch { /* plain text */ }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export const liabilityAllocationApi = {
  getSummary(liabilityId: number): Promise<LiabilityAllocationSummary> {
    return fetch(`${API}/api/liabilities/${liabilityId}/allocations`, { headers: headers() })
      .then(read<LiabilityAllocationSummary>);
  },

  getOverview(): Promise<LiabilityAllocationOverview> {
    return fetch(`${API}/api/liability-allocations/overview`, { headers: headers() })
      .then(read<LiabilityAllocationOverview>);
  },

  allocate(liabilityId: number, assetId: number, amount: number): Promise<LiabilityAllocationSummary> {
    return fetch(`${API}/api/liabilities/${liabilityId}/allocations`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ assetId, amount }),
    }).then(read<LiabilityAllocationSummary>);
  },

  release(liabilityId: number, assetId: number, amount: number): Promise<LiabilityAllocationSummary> {
    return fetch(
      `${API}/api/liabilities/${liabilityId}/allocations/${assetId}?amount=${encodeURIComponent(amount)}`,
      { method: "DELETE", headers: headers() }
    ).then(read<LiabilityAllocationSummary>);
  },
};
