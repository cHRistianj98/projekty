import { authApi } from "./authApi";
import type {
  GoalCompletionRequest,
  GoalCompletionResponse,
  SpendableGoal,
} from "../types/GoalSpending";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ??
  "http://localhost:8080";

function headers(): HeadersInit {
  const token = authApi.getToken();

  return {
    "Content-Type": "application/json",
    ...(token
      ? { Authorization: `Bearer ${token}` }
      : {}),
  };
}

async function read<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.text();
    let message = body || response.statusText;

    try {
      const parsed = JSON.parse(body) as { message?: string };
      message = parsed.message ?? message;
    } catch {
      // plain-text backend response
    }

    if (response.status === 401 || response.status === 403) {
      authApi.removeToken();

      window.dispatchEvent(
        new CustomEvent("freedom:auth-expired")
      );

      throw new Error(
        "Sesja wygasła. Zaloguj się ponownie i spróbuj jeszcze raz."
      );
    }

    throw new Error(message || `HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const goalSpendingApi = {
  async getSpendable(assetId: number): Promise<SpendableGoal[]> {
    const response = await fetch(
      `${API_BASE_URL}/api/goals/spendable?assetId=${encodeURIComponent(assetId)}`,
      { headers: headers() }
    );

    return read<SpendableGoal[]>(response);
  },

  async complete(
    goalId: number,
    request: GoalCompletionRequest
  ): Promise<GoalCompletionResponse> {
    const response = await fetch(
      `${API_BASE_URL}/api/goals/${goalId}/complete`,
      {
        method: "POST",
        headers: headers(),
        body: JSON.stringify(request),
      }
    );

    return read<GoalCompletionResponse>(response);
  },

  async undoCompletion(goalId: number): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/api/goals/${goalId}/undo-completion`,
      {
        method: "POST",
        headers: headers(),
      }
    );

    if (!response.ok) {
      const body = await response.text();
      let message = body || response.statusText;

      try {
        const parsed = JSON.parse(body) as { message?: string };
        message = parsed.message ?? message;
      } catch {
        // plain-text backend response
      }

      if (response.status === 401 || response.status === 403) {
        authApi.removeToken();
        window.dispatchEvent(new CustomEvent("freedom:auth-expired"));
        throw new Error("Sesja wygasła. Zaloguj się ponownie i spróbuj jeszcze raz.");
      }

      throw new Error(message || `HTTP ${response.status}`);
    }
  },
};
