// Regroupement de cases : massifs de même terrain, tronçons d'eau (avec ponts) et
// détection de fermeture. Fonctions pures : le rayon R est passé explicitement.
import { DIRS } from '../config.js';
import { key, neighbors } from './geometry.js';

export function groups(b, pred, R){
  const seen = new Set(), out = [];
  for(const [k,c] of b){
    if(seen.has(k) || !pred(c)) continue;
    const g = [], stack = [k]; seen.add(k);
    while(stack.length){
      const cur = stack.pop(); g.push(cur);
      const [q,r] = cur.split(',').map(Number);
      for(const [nq,nr] of neighbors(q,r,R)){
        const nk = key(nq,nr), nc = b.get(nk);
        if(nc && !seen.has(nk) && nc.terrain===c.terrain){ seen.add(nk); stack.push(nk); }
      }
    }
    out.push({terrain:c.terrain, cells:g});
  }
  return out;
}

export function waterLinks(b,k){               // voisines d'eau, plus l'enjambée du pont sur les 3 axes
  const [q,r] = k.split(',').map(Number);
  const out = [];
  for(const [dq,dr] of DIRS){
    const nk = key(q+dq,r+dr), nc = b.get(nk);
    if(nc && nc.terrain==='eau') out.push(nk);
    const jk = key(q+2*dq,r+2*dr), jc = b.get(jk);
    if(jc && jc.terrain==='eau' && (b.get(k).rare==='pont' || jc.rare==='pont')) out.push(jk);
  }
  return out;
}

export function waterGroups(b){
  const seen = new Set(), out = [];
  for(const [k,c] of b){
    if(c.terrain!=='eau' || seen.has(k)) continue;
    const g = [], st = [k]; seen.add(k);
    while(st.length){ const cur = st.pop(); g.push(cur);
      for(const nk of waterLinks(b,cur)) if(!seen.has(nk)){ seen.add(nk); st.push(nk); } }
    out.push(g);
  }
  return out;
}

export const isClosed = (b,g,R)=>g.cells.every(k=>{
  const [q,r]=k.split(',').map(Number);
  return neighbors(q,r,R).every(n=>b.has(key(n[0],n[1])));
});
