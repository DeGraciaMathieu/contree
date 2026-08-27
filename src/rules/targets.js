// Cases où une tuile peut être posée : libres et adjacentes au pays déjà posé.
// Fonction pure : plateau, cases et rayon passés explicitement.
import { key, neighbors } from './geometry.js';

export function validTargets(board, cells, R){
  const s = new Set();
  for(const [q,r] of cells){
    const k = key(q,r);
    if(board.has(k)) continue;
    if(neighbors(q,r,R).some(n=>board.has(key(n[0],n[1])))) s.add(k);
  }
  return s;
}
