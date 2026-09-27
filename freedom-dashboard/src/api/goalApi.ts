import type { Goal } from "../types/Goal";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ??
  "http://localhost:8080";

type GoalApiResponse = Omit<Goal, "imagePosition"> & {
  imagePosition?: "CENTER" | "TOP" | "BOTTOM" | null;
};

type GoalApiRequest = {
  name: string;
  currentAmount: number;
  targetAmount: number;
  monthlyContribution: number;
  targetDate: string | null;
  priority: Goal["priority"] | null;
  type: Goal["type"] | null;
  color: string;
  imageUrl: string | null;
  imagePosition: "CENTER" | "TOP" | "BOTTOM" | null;
};

function toRequest(goal: Goal): GoalApiRequest {
  return {
    name: goal.name,
    currentAmount: goal.currentAmount,
    targetAmount: goal.targetAmount,
    monthlyContribution: goal.monthlyContribution,
    targetDate: goal.targetDate ?? null,
    priority: goal.priority ?? null,
    type: goal.type ?? null,
    color: goal.color,
    imageUrl: goal.imageUrl ?? null,
    imagePosition: goal.imagePosition
      ? (goal.imagePosition.toUpperCase() as
          | "CENTER"
          | "TOP"
          | "BOTTOM")
      : null,
  };
}

function fromResponse(goal: GoalApiResponse): Goal {
  return {
    ...goal,
    targetDate: goal.targetDate ?? undefined,
    priority: goal.priority ?? undefined,
    type: goal.type ?? undefined,
    imageUrl: goal.imageUrl ?? undefined,
    imagePosition: goal.imagePosition
      ? (goal.imagePosition.toLowerCase() as
          | "center"
          | "top"
          | "bottom")
      : undefined,
  };
}

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.text();

    throw new Error(
      `API ${response.status}: ${body || response.statusText}`
    );
  }

  return response.json() as Promise<T>;
}

export const goalApi = {
  async getAll(): Promise<Goal[]> {
    const response = await fetch(`${API_BASE_URL}/api/goals`);
    const data = await readJson<GoalApiResponse[]>(response);

    return data.map(fromResponse);
  },

  async create(goal: Goal): Promise<Goal> {
    const response = await fetch(`${API_BASE_URL}/api/goals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(toRequest(goal)),
    });

    return fromResponse(
      await readJson<GoalApiResponse>(response)
    );
  },

  async update(id: number, goal: Goal): Promise<Goal> {
    const response = await fetch(
      `${API_BASE_URL}/api/goals/${id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(toRequest(goal)),
      }
    );

    return fromResponse(
      await readJson<GoalApiResponse>(response)
    );
  },

  async remove(id: number): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/api/goals/${id}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      const body = await response.text();

      throw new Error(
        `API ${response.status}: ${body || response.statusText}`
      );
    }
  },
};
