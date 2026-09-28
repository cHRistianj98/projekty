import { authApi } from "./authApi";
import type {
  AllocateGoalMoneyRequest,
  GoalAllocationSummary,
} from "../types/GoalAllocation";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ??
  "http://localhost:8080";

function authHeaders() {
  const token = authApi.getToken();

  return {
    "Content-Type": "application/json",
    ...(token
      ? { Authorization: `Bearer ${token}` }
      : {}),
  };
}

async function readJson<T>(
  response: Response
): Promise<T> {
  if (!response.ok) {
    const body = await response.text();

    throw new Error(
      `API ${response.status}: ${
        body || response.statusText
      }`
    );
  }

  return response.json() as Promise<T>;
}

export const goalAllocationApi = {
  async getSummary(
    goalId: number
  ): Promise<GoalAllocationSummary> {
    const response = await fetch(
      `${API_BASE_URL}/api/goals/${goalId}/allocations`,
      {
        headers: authHeaders(),
      }
    );

    return readJson<GoalAllocationSummary>(
      response
    );
  },

  async allocate(
    goalId: number,
    request: AllocateGoalMoneyRequest
  ): Promise<GoalAllocationSummary> {
    const response = await fetch(
      `${API_BASE_URL}/api/goals/${goalId}/allocations`,
      {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(request),
      }
    );

    return readJson<GoalAllocationSummary>(
      response
    );
  },
};
