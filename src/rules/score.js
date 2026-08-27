// Calcul du score complet d'un plateau. Fonction pure : tout ce qui dépasse le plateau
// (rayon, prime de traversée, cases, objectifs, défausses) arrive par le contexte.
import { RIVER_PT, CMD_BONUS, VILLAGE_PT, VILLAGE_WATER_MULT, MOULIN_BONUS, MASSIF_T, GOAL_BONUS } from '../config.js';
import { key, neighbors, sides } from './geometry.js';
import { groups, isClosed, waterGroups } from './groups.js';
import { cmdOk } from './commands.js';
import { goalOk } from './goals.js';

export function score(b, ctx){
  const { R, CROSS, cells, goals, discards } = ctx;
  const goalContext = { R, cells, discards };
  let massifs=0, rivieres=0, villages=0, commandes=0;
  const closed = new Set();
  for(const g of groups(b, c=>MASSIF_T.includes(c.terrain), R)){
    if(isClosed(b,g,R)){ massifs += g.cells.length*g.cells.length; g.cells.forEach(k=>closed.add(k)); }
    else massifs += g.cells.length;
  }
  const glow = new Set();
  for(const g of waterGroups(b)){
    rivieres += RIVER_PT*g.length;
    const s = new Set(); g.forEach(k=>{const[q,r]=k.split(',').map(Number); sides(q,r,R).forEach(i=>s.add(i));});
    if([...s].some(i=>s.has((i+3)%6))){ rivieres += CROSS; g.forEach(k=>glow.add(k)); }
  }
  for(const [k,c] of b){
    if(c.terrain!=='village') continue;
    const [q,r]=k.split(',').map(Number);
    const nb = neighbors(q,r,R).map(n=>b.get(key(n[0],n[1]))).filter(Boolean);
    const kinds = new Set(nb.map(x=>x.terrain));
    let v = VILLAGE_PT*kinds.size;
    if(kinds.has('eau')) v*=VILLAGE_WATER_MULT;
    v += MOULIN_BONUS * nb.filter(x=>x.rare==='moulin').length;
    villages += v;
  }
  for(const [k,c] of b) if(cmdOk(b,k,c,R)) commandes += CMD_BONUS;
  let objectifs = 0;
  for(const g of goals) if(goalOk(b,g,goalContext)) objectifs += GOAL_BONUS;
  return {massifs,rivieres,villages,commandes,objectifs,closed,glow,
          total:massifs+rivieres+villages+commandes+objectifs};
}
