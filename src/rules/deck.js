// Pioche : tirage pondéré des terrains, des tuiles (rares et commandes) et placement
// des amorces initiales. Fonctions pures : le hasard arrive par le rng injecté, les
// cases du plateau par argument.
import { WEIGHTS, RARES, COMMANDS, RARE_CHANCE, CMD_CHANCE,
         SEED_COUNT, SEED_RING_MIN, SEED_RING_MAX, SEED_SPACING, SEED_GUARD_MAX } from '../config.js';
import { dist } from './geometry.js';

export function drawTerrain(rng){
  const tot = WEIGHTS.reduce((a,w)=>a+w[1],0);
  let n = rng()*tot;
  for(const [t,w] of WEIGHTS){ n-=w; if(n<=0) return t; }
  return 'foret';
}

export function drawTile(rng){
  const terrain = drawTerrain(rng);
  const rares = Object.keys(RARES).filter(k=>RARES[k].on===terrain);
  if(rares.length && rng()<RARE_CHANCE)
    return {terrain, cmd:null, done:false, rare:rares[(rng()*rares.length)|0]};
  const pool = Object.keys(COMMANDS).filter(k=>COMMANDS[k].on===terrain);
  const cmd = (pool.length && rng()<CMD_CHANCE) ? pool[(rng()*pool.length)|0] : null;
  return {terrain, cmd, done:false, rare:null};
}

export const drawHand = (rng)=>[drawTile(rng),drawTile(rng),drawTile(rng)];

export function seeds(rng, cells){             // 4 amorces dispersées : chaque partie démarre autrement
  const out = [[0,0]];
  const pool = cells.filter(c=>{ const d = dist(c,[0,0]); return d>=SEED_RING_MIN && d<=SEED_RING_MAX; });
  let guard = 0;
  while(out.length<SEED_COUNT && guard++<SEED_GUARD_MAX){
    const c = pool[(rng()*pool.length)|0];
    if(out.every(o=>dist(o,c)>=SEED_SPACING)) out.push(c);
  }
  return out;
}
