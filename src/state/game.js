// État mutable de la partie et accès aux règles lié à l'état courant.
//
// Le prototype partageait un état mutable via des variables libres ; en modules ESM,
// cet état vit dans l'objet unique G, importé par render/, input/ et loop/. Les wrappers
// ci-dessous injectent le rayon/contexte courant dans les règles pures de src/rules/.
import { R_LONG, CROSS_FACTOR, HISTORY_MAX } from '../config.js';
import { buildCells, onBoard as _onBoard, neighbors as _neighbors, sides as _sides } from '../rules/geometry.js';
import { groups as _groups, isClosed as _isClosed } from '../rules/groups.js';
import { cmdOk as _cmdOk } from '../rules/commands.js';
import { goalOk as _goalOk, goalState as _goalState } from '../rules/goals.js';
import { score as _score } from '../rules/score.js';
import { validTargets as _validTargets } from '../rules/targets.js';

export const G = {
  rng: null,
  R: R_LONG,                       // rayon courant du plateau (mutable : format court/long)
  CROSS: CROSS_FACTOR * R_LONG,    // prime de traversée, proportionnelle au plateau
  cells: [],
  board: null, hand: null, nextHand: null, history: null,
  sel: null, ghost: null, effects: [], cachedScore: null,
  discards: 0, closedAt: null, shownScore: 0, finished: false, insp: null,
  dust: [], deal: false, goals: [], lastEntry: null,
};

export function buildShape(){ G.cells = buildCells(G.R); }   // lie la géométrie pure au rayon courant

export const onBoard = (q,r)=>_onBoard(q,r,G.R);
export const neighbors = (q,r)=>_neighbors(q,r,G.R);
export const sides = (q,r)=>_sides(q,r,G.R);
export const groups = (b,pred)=>_groups(b,pred,G.R);
export const isClosed = (b,g)=>_isClosed(b,g,G.R);
export const cmdOk = (b,k,c)=>_cmdOk(b,k,c,G.R);
export const goalCtx = ()=>({R:G.R, cells:G.cells, discards:G.discards});
export const goalOk = (b,g)=>_goalOk(b,g,goalCtx());
export const goalState = (b,g)=>_goalState(b,g,goalCtx());
export const score = (b)=>_score(b, {R:G.R, CROSS:G.CROSS, cells:G.cells, goals:G.goals, discards:G.discards});
export const validTargets = ()=>_validTargets(G.board, G.cells, G.R);

export function snapshot(){
  G.history.push({board:new Map([...G.board].map(([k,v])=>[k,{...v}])),
                  hand:G.hand.map(t=>t&&{...t}), nextHand:G.nextHand.map(t=>({...t})),
                  discards:G.discards, goals:G.goals.map(g=>({...g}))});
  if(G.history.length>HISTORY_MAX) G.history.shift();
}
