import type {
  Liability,
  LiabilityType,
} from "../types/Liability";

import { authApi } from "./authApi";

const API_URL =
  import.meta.env.VITE_API_URL ??
  "http://localhost:8080";

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
};

type LiabilityRequest = {
  name: string;
  type?: LiabilityType;
  originalAmount: number;
  remainingAmount: number;
  monthlyPayment: number;
  principalPayment: number;
  interestPayment: number;
  interestRate: number;
};

function getAuthorizationHeader() {
  const token = authApi.getToken();

  if (!token) {
    throw new Error(
      "Brak tokenu uwierzytelniającego."
    );
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

function toRequest(
  liability: Liability
): LiabilityRequest {
  return {
    name: liability.name,
    type: liability.type,
    originalAmount:
      liability.originalAmount,
    remainingAmount:
      liability.remainingAmount,
    monthlyPayment:
      liability.monthlyPayment,
    principalPayment:
      liability.principalPayment,
    interestPayment:
      liability.interestPayment,
    interestRate:
      liability.interestRate,
  };
}

function fromBackend(
  liability: BackendLiability
): Liability {
  return {
    id: liability.id,
    name: liability.name,

    ...(liability.type
      ? { type: liability.type }
      : {}),

    originalAmount:
      Number(liability.originalAmount),

    remainingAmount:
      Number(liability.remainingAmount),

    monthlyPayment:
      Number(liability.monthlyPayment),

    principalPayment:
      Number(liability.principalPayment),

    interestPayment:
      Number(liability.interestPayment),

    interestRate:
      Number(liability.interestRate),
  };
}

async function handleResponse(
  response: Response
) {
  if (!response.ok) {
    const body =
      await response.text();

    throw new Error(
      body ||
        `Liability API error: ${response.status}`
    );
  }
}

export const liabilityApi = {

  async getAll(): Promise<Liability[]> {
    const response = await fetch(
      `${API_URL}/api/liabilities`,
      {
        headers: {
          ...getAuthorizationHeader(),
        },
      }
    );

    await handleResponse(response);

    const liabilities =
      (await response.json()) as BackendLiability[];

    return liabilities.map(
      fromBackend
    );
  },

  async create(
    liability: Liability
  ): Promise<Liability> {
    const response = await fetch(
      `${API_URL}/api/liabilities`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          ...getAuthorizationHeader(),
        },

        body: JSON.stringify(
          toRequest(liability)
        ),
      }
    );

    await handleResponse(response);

    return fromBackend(
      (await response.json()) as BackendLiability
    );
  },

  async update(
    id: number,
    liability: Liability
  ): Promise<Liability> {
    const response = await fetch(
      `${API_URL}/api/liabilities/${id}`,
      {
        method: "PUT",

        headers: {
          "Content-Type":
            "application/json",

          ...getAuthorizationHeader(),
        },

        body: JSON.stringify(
          toRequest(liability)
        ),
      }
    );

    await handleResponse(response);

    return fromBackend(
      (await response.json()) as BackendLiability
    );
  },

  async remove(
    id: number
  ): Promise<void> {
    const response = await fetch(
      `${API_URL}/api/liabilities/${id}`,
      {
        method: "DELETE",

        headers: {
          ...getAuthorizationHeader(),
        },
      }
    );

    await handleResponse(response);
  },
};