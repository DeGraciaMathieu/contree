// Persistance des meilleurs scores (localStorage), un classement par format de plateau.
import { LS_KEY, TOP_N, R_LONG } from '../config.js';
import { G } from './game.js';

export function loadAll(){
  try{ const v = JSON.parse(localStorage.getItem(LS_KEY)); return Array.isArray(v) ? v : []; }
  catch(e){ return []; }
}
export const loadScores = ()=>loadAll().filter(x=>(x.f||R_LONG)===G.R);   // un classement par format
export function bestScore(){ const l = loadScores(); return l.length ? l[0].t : 0; }
export function saveScore(sc){
  const entry = {t:sc.total, d:Date.now(), f:G.R, m:sc.massifs, r:sc.rivieres,
                 v:sc.villages, c:sc.commandes, o:sc.objectifs};
  const mine = loadScores().concat([entry]).sort((a,b)=>b.t-a.t).slice(0,TOP_N);
  const autres = loadAll().filter(x=>(x.f||R_LONG)!==G.R);
  try{ localStorage.setItem(LS_KEY, JSON.stringify(autres.concat(mine))); }catch(e){}
  return {list:mine, entry, rank:mine.indexOf(entry)+1};
}
