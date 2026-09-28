import type { ExpenseCategory } from "../types/Cashflow";
import type { MonthlyBudgetPlan } from "../types/Budget";
import { authApi } from "./authApi";
const API_URL=import.meta.env.VITE_API_URL ?? "http://localhost:8080";
type BackendPlan={month:string;limits:{category:string;limit:number}[]};
function headers(){const token=authApi.getToken();if(!token)throw new Error("Brak tokenu.");return{"Content-Type":"application/json",Authorization:`Bearer ${token}`};}
async function handle<T>(r:Response):Promise<T>{if(!r.ok)throw new Error((await r.text())||`HTTP ${r.status}`);return r.json();}
function fromBackend(p:BackendPlan):MonthlyBudgetPlan{return{month:p.month,limits:p.limits.map(l=>({category:l.category.toLowerCase() as ExpenseCategory,limit:Number(l.limit)}))};}
function body(p:MonthlyBudgetPlan){return{month:p.month,limits:p.limits.map(l=>({category:l.category.toUpperCase(),limit:l.limit}))};}
export const budgetApi={
 async getAll(){return(await handle<BackendPlan[]>(await fetch(`${API_URL}/api/budget-plans`,{headers:headers()}))).map(fromBackend);},
 async save(plan:MonthlyBudgetPlan){return fromBackend(await handle<BackendPlan>(await fetch(`${API_URL}/api/budget-plans`,{method:"PUT",headers:headers(),body:JSON.stringify(body(plan))})));},
};
