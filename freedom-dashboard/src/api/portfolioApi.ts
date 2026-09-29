import {authApi} from "./authApi";
import type {PortfolioWallet,ValuationEvent} from "../types/Portfolio";
const API=import.meta.env.VITE_API_URL??"http://localhost:8080";
function h(){const t=authApi.getToken();if(!t)throw new Error("Brak tokenu JWT");return {Authorization:`Bearer ${t}`,"Content-Type":"application/json"};}
async function read<T>(r:Response):Promise<T>{if(!r.ok)throw new Error((await r.text())||`HTTP ${r.status}`);return r.status===204?undefined as T:r.json();}
export const portfolioApi={
 getAll:()=>fetch(`${API}/api/portfolios`,{headers:h()}).then(read<PortfolioWallet[]>),
 create:(x:{name:string;color?:string;iconKey?:string})=>fetch(`${API}/api/portfolios`,{method:"POST",headers:h(),body:JSON.stringify(x)}).then(read<PortfolioWallet>),
 update:(id:number,x:{name:string;color?:string;iconKey?:string})=>fetch(`${API}/api/portfolios/${id}`,{method:"PUT",headers:h(),body:JSON.stringify(x)}).then(read<PortfolioWallet>),
 remove:(id:number)=>fetch(`${API}/api/portfolios/${id}`,{method:"DELETE",headers:h()}).then(read<void>),
 transfer:(sourceAssetId:number,targetAssetId:number,amount:number)=>fetch(`${API}/api/portfolios/transfer`,{method:"POST",headers:h(),body:JSON.stringify({sourceAssetId,targetAssetId,amount})}).then(read<void>),
 valuations:()=>fetch(`${API}/api/portfolios/valuations`,{headers:h()}).then(read<ValuationEvent[]>),
};
