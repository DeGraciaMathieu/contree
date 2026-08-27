// Satisfaction d'une commande portée par une tuile, d'après son voisinage.
// Fonction pure : le rayon R est passé explicitement.
import { CMD_FORETS3, CMD_EAU2, CMD_VILLAGES2, CMD_MASSIF5 } from '../config.js';
import { key, neighbors } from './geometry.js';

export function cmdOk(b,k,c,R){
  if(!c.cmd) return false;
  if(c.done) return true;
  const [q,r] = k.split(',').map(Number);
  const nb = neighbors(q,r,R).map(n=>b.get(key(n[0],n[1])));
  const count = t=>nb.filter(x=>x&&x.terrain===t).length;
  switch(c.cmd){
    case 'village_forets3': return count('foret')>=CMD_FORETS3;
    case 'village_eau':     return count('eau')>=CMD_EAU2;
    case 'champ_villages2': return count('village')>=CMD_VILLAGES2;
    case 'pierre_isolee':   return nb.length===neighbors(q,r,R).length &&
                                   neighbors(q,r,R).every(n=>b.has(key(n[0],n[1]))) && count('pierre')===0;
    case 'foret_massif5': {
      const seen=new Set([k]); const st=[k]; let n=0;
      while(st.length){ const cur=st.pop(); n++;
        const [cq,cr]=cur.split(',').map(Number);
        for(const [nq,nr] of neighbors(cq,cr,R)){
          const nk=key(nq,nr), nc=b.get(nk);
          if(nc && nc.terrain==='foret' && !seen.has(nk)){ seen.add(nk); st.push(nk); }
        }}
      return n>=CMD_MASSIF5;
    }
  }
  return false;
}
