import { authApi } from "./authApi";
import type { Category, CategoryInput, CategoryType } from "../types/Category";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

function headers(): HeadersInit {
  const token = authApi.getToken();
  if (!token) throw new Error("Brak tokenu JWT");
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

async function read<T>(response: Response): Promise<T> {
  if (!response.ok) throw new Error((await response.text()) || `HTTP ${response.status}`);
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const categoryApi = {
  getAll: (type?: CategoryType) =>
    fetch(`${API_URL}/api/categories${type ? `?type=${type}` : ""}`, { headers: headers() }).then(read<Category[]>),
  create: (input: CategoryInput) =>
    fetch(`${API_URL}/api/categories`, { method: "POST", headers: headers(), body: JSON.stringify(input) }).then(read<Category>),
  update: (id: number, input: CategoryInput) =>
    fetch(`${API_URL}/api/categories/${id}`, { method: "PUT", headers: headers(), body: JSON.stringify(input) }).then(read<Category>),
  remove: (id: number) =>
    fetch(`${API_URL}/api/categories/${id}`, { method: "DELETE", headers: headers() }).then(read<void>),
};
