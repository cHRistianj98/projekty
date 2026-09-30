import { authApi } from "./authApi";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

export type MyFinanceImportPreview = {
  fileName: string | null;
  sourceTransactions: number;
  alreadyImported: number;
  newTransactions: number;
  newIncomes: number;
  newExpenses: number;
  newIncomeAmount: number;
  newExpenseAmount: number;
  systemCashChange: number;
  newCategories: number;
  earliestDate: string | null;
  latestDate: string | null;
};

export type MyFinanceImportResult = {
  importedTransactions: number;
  importedIncomes: number;
  importedExpenses: number;
  duplicatesSkipped: number;
  categoriesCreated: number;
  incomeAmount: number;
  expenseAmount: number;
  systemCashChange: number;
};

function authHeaders(): HeadersInit {
  const token = authApi.getToken();
  if (!token) throw new Error("Brak tokenu JWT");
  return { Authorization: `Bearer ${token}` };
}

async function read<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const body = await response.json() as { message?: string; detail?: string };
      throw new Error(body.message ?? body.detail ?? `HTTP ${response.status}`);
    }
    throw new Error((await response.text()) || `HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
}

function form(file: File) {
  const body = new FormData();
  body.append("file", file);
  return body;
}

export const myFinanceImportApi = {
  preview: (file: File) =>
    fetch(`${API_URL}/api/imports/myfinance/preview`, {
      method: "POST",
      headers: authHeaders(),
      body: form(file),
    }).then(read<MyFinanceImportPreview>),

  importBackup: (file: File) =>
    fetch(`${API_URL}/api/imports/myfinance`, {
      method: "POST",
      headers: authHeaders(),
      body: form(file),
    }).then(read<MyFinanceImportResult>),
};
