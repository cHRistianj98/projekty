import type { NetWorthSnapshot } from "../types/NetWorthHistory";
import { authApi } from "./authApi";
const API_URL=import.meta.env.VITE_API_URL ?? "http://localhost:8080";
type BackendPoint={month:string;value:number};
function headers(){const token=authApi.getToken();if(!token)throw new Error("Brak tokenu.");return{"Content-Type":"application/json",Authorization:`Bearer ${token}`};}
async function handle<T>(r:Response):Promise<T>{if(!r.ok)throw new Error((await r.text())||`HTTP ${r.status}`);return r.json();}
function fromBackend(p:BackendPoint):NetWorthSnapshot{
 const date=p.month.length===10?p.month:`${p.month}-01`;
 return{id:Number(date.replaceAll("-","")),date,value:Number(p.value)};
}
export const netWorthHistoryApi={
 async getAll(){return(await handle<BackendPoint[]>(await fetch(`${API_URL}/api/net-worth-history`,{headers:headers()}))).map(fromBackend);},
 async save(point:NetWorthSnapshot){const month=point.date;return fromBackend(await handle<BackendPoint>(await fetch(`${API_URL}/api/net-worth-history`,{method:"PUT",headers:headers(),body:JSON.stringify({month,value:point.value})})));},
};
