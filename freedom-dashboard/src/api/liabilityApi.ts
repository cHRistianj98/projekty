import { authApi } from "./authApi";
import type { Liability, LiabilityImagePosition, LiabilityType } from "../types/Liability";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

type BackendLiability = {
  id: number;
  name: string;
  type?: LiabilityType | null;
  originalAmount: number;
  remainingAmount: number;
  monthlyPayment: number;
  principalPayment: number;
  interestPayment: number;
  interestRate: number;
  imageUrl?: string | null;
  imagePosition?: LiabilityImagePosition | null;
  iconKey?: string | null;
};

function headers(): HeadersInit {
  const token = authApi.getToken();
  if (!token) throw new Error("Brak tokenu.");
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

async function handle<T>(response: Response): Promise<T> {
  if (!response.ok) throw new Error((await response.text()) || `HTTP ${response.status}`);
  return response.json() as Promise<T>;
}

function fromBackend(value: BackendLiability): Liability {
  return {
    id: value.id,
    name: value.name,
    type: value.type ?? "OTHER",
    originalAmount: Number(value.originalAmount),
    remainingAmount: Number(value.remainingAmount),
    monthlyPayment: Number(value.monthlyPayment),
    principalPayment: Number(value.principalPayment),
    interestPayment: Number(value.interestPayment),
    interestRate: Number(value.interestRate),
    imageUrl: value.imageUrl || undefined,
    imagePosition: value.imagePosition ?? "center",
    iconKey: value.iconKey || undefined,
  };
}

function body(value: Liability) {
  return {
    name: value.name,
    type: value.type ?? "OTHER",
    originalAmount: value.originalAmount,
    remainingAmount: value.remainingAmount,
    monthlyPayment: value.monthlyPayment,
    principalPayment: value.principalPayment,
    interestPayment: value.interestPayment,
    interestRate: value.interestRate,
    // CRITICAL: 3.0 backend already accepts these fields. Previous API adapter
    // dropped them, which made uploaded images disappear after create/edit.
    imageUrl: value.imageUrl ?? null,
    imagePosition: value.imagePosition ?? "center",
    iconKey: value.iconKey ?? null,
  };
}

export const liabilityApi = {
  async getAll(): Promise<Liability[]> {
    const values = await handle<BackendLiability[]>(
      await fetch(`${API_URL}/api/liabilities`, { headers: headers() })
    );
    return values.map(fromBackend);
  },

  async create(value: Liability): Promise<Liability> {
    return fromBackend(await handle<BackendLiability>(
      await fetch(`${API_URL}/api/liabilities`, {
        method: "POST", headers: headers(), body: JSON.stringify(body(value)),
      })
    ));
  },

  async update(id: number, value: Liability): Promise<Liability> {
    return fromBackend(await handle<BackendLiability>(
      await fetch(`${API_URL}/api/liabilities/${id}`, {
        method: "PUT", headers: headers(), body: JSON.stringify(body(value)),
      })
    ));
  },

  async remove(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/api/liabilities/${id}`, {
      method: "DELETE", headers: headers(),
    });
    if (!response.ok) throw new Error((await response.text()) || `HTTP ${response.status}`);
  },
};
