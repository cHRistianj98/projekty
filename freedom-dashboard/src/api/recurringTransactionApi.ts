import type { ExpenseCategory } from "../types/Cashflow";
import type { RecurringTransaction } from "../types/RecurringTransaction";
import { authApi } from "./authApi";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";
type BackendCategory = "FIXED" | "LIVING" | "INVESTMENT" | "GOAL";
type BackendRule = { id:number; type:"INCOME"|"EXPENSE"; name:string; amount:number; category?:BackendCategory|null; dayOfMonth:number; startDate:string; active:boolean };

function headers() { const token=authApi.getToken(); if(!token) throw new Error("Brak tokenu."); return {"Content-Type":"application/json",Authorization:`Bearer ${token}`}; }
async function handle<T>(r:Response):Promise<T>{ if(!r.ok) throw new Error((await r.text())||`HTTP ${r.status}`); return r.status===204 ? undefined as T : r.json(); }
function fromBackend(r:BackendRule):RecurringTransaction { return { id:r.id, type:r.type.toLowerCase() as "income"|"expense", name:r.name, amount:Number(r.amount), ...(r.category ? {category:r.category.toLowerCase() as ExpenseCategory}:{}), dayOfMonth:r.dayOfMonth, startDate:r.startDate, active:r.active }; }
function body(r:RecurringTransaction){ return { type:r.type.toUpperCase(), name:r.name, amount:r.amount, category:r.category?.toUpperCase() ?? null, dayOfMonth:r.dayOfMonth, startDate:r.startDate, active:r.active }; }

export const recurringTransactionApi = {
  async getAll(){ return (await handle<BackendRule[]>(await fetch(`${API_URL}/api/recurring-transactions`,{headers:headers()}))).map(fromBackend); },
  async create(rule:RecurringTransaction){ return fromBackend(await handle<BackendRule>(await fetch(`${API_URL}/api/recurring-transactions`,{method:"POST",headers:headers(),body:JSON.stringify(body(rule))}))); },
  async update(rule:RecurringTransaction){ return fromBackend(await handle<BackendRule>(await fetch(`${API_URL}/api/recurring-transactions/${rule.id}`,{method:"PUT",headers:headers(),body:JSON.stringify(body(rule))}))); },
  async remove(id:number){ await handle<void>(await fetch(`${API_URL}/api/recurring-transactions/${id}`,{method:"DELETE",headers:headers()})); },
};
