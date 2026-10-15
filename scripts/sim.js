// Harnais de simulation : joue N parties avec un bot et affiche des stats.
// Rejoue le déroulé de loop/turn.js (amorces, objectifs, mains, pose) avec les seules
// règles pures, sans DOM ni son. Aucun bot ne défausse.
//
// Bots :
//   glouton    essaie chaque tuile de la main sur chaque case jouable et garde le coup
//              qui fait le plus monter le score immédiat ;
//   aleatoire  pose une tuile au hasard sur une case jouable au hasard ;
//   profils    (equilibre, massifs, rivieres, villages) jouent comme le glouton mais sur
//              une estimation de fin de partie (voir `projection`), chaque profil
//              surpondérant certains postes pour chercher une stratégie dominante.
//
//   npm run sim -- --n=1000 --format=court --graine=1 --bot=equilibre
import { R_SHORT, R_LONG, CROSS_FACTOR, DISCARDS_MAX, WEIGHTS, RARES, COMMANDS, MASSIF_T, MASSIF_MIN,
         RIVER_PT, VILLAGE_PT, VILLAGE_WATER_MULT, MOULIN_BONUS, CMD_BONUS, CMD_FORETS3, CMD_EAU2,
         CMD_VILLAGES2, CMD_MASSIF5, GOAL_BONUS, GOAL_ISOLES } from '../src/config.js';
import { createRng } from '../src/rules/rng.js';
import { buildCells, key, neighbors } from '../src/rules/geometry.js';
import { drawTerrain, drawHand, seeds } from '../src/rules/deck.js';
import { drawGoals, goalOk, GOAL_DEFS } from '../src/rules/goals.js';
import { cmdOk } from '../src/rules/commands.js';
import { score } from '../src/rules/score.js';
import { validTargets } from '../src/rules/targets.js';
import { groups, waterGroups } from '../src/rules/groups.js';

const POSTES = ['massifs', 'rivieres', 'villages', 'commandes', 'objectifs'];
const WEIGHT_SUM = WEIGHTS.reduce((s,[,w])=>s+w, 0);

// Coefficient appliqué à chaque poste de la projection (1 par défaut).
const PROFILS = {
  equilibre: {},
  massifs:   {massifs:2},
  rivieres:  {rivieres:2},
  villages:  {villages:2, commandes:2},
};

function playGame(R, rng, chooseMove){
  const cells = buildCells(R);
  const ctx = {R, CROSS:CROSS_FACTOR*R, cells, goals:null, discards:DISCARDS_MAX};
  const board = new Map();
  for(const [q,r] of seeds(rng, cells)){
    board.set(key(q,r), {terrain:drawTerrain(rng), cmd:null, done:false, rare:null});
  }
  ctx.goals = drawGoals(rng);
  let hand = drawHand(rng);
  let nextHand = drawHand(rng);

  while(board.size < cells.length){
    const best = chooseMove(board, hand, ctx);
    board.set(best.k, {...hand[best.i]});
    for(const g of ctx.goals) if(!g.done && goalOk(board, g, ctx)) g.done = true;   // un objectif atteint reste acquis
    hand[best.i] = null;
    if(hand.every(t=>t===null)){ hand = nextHand; nextHand = drawHand(rng); }
  }
  return {board, goals:ctx.goals, score:score(board, ctx), ctx};
}

function bestMove(board, hand, ctx, evaluate){
  const targets = validTargets(board, ctx.cells, ctx.R);
  let best = null;
  for(let i=0;i<hand.length;i++){
    if(!hand[i]) continue;
    for(const k of targets){
      board.set(k, hand[i]);
      const total = evaluate(board, ctx);
      board.delete(k);
      if(!best || total > best.total) best = {i, k, total};
    }
  }
  return best;
}

function randomMove(board, hand, ctx, rng){
  const targets = [...validTargets(board, ctx.cells, ctx.R)];
  const tiles = hand.flatMap((t,i)=>t ? [i] : []);
  return {i:tiles[Math.floor(rng()*tiles.length)], k:targets[Math.floor(rng()*targets.length)]};
}

const currentScore = (board, ctx)=>score(board, ctx).total;

/* ---------- projection de fin de partie ---------- */
// Ce que le bot croit que le plateau vaudra une fois plein, poste par poste. Ce n'est pas
// le score (rules/score.js reste la référence pour le résultat final) mais son estimation :
// massif ouvert → n² (tout se ferme au plateau plein) ; rivière → prime de traversée au
// prorata du chemin parcouru ; village → terrains attendus sur les cases libres voisines ;
// commande ou objectif en cours → bonus au prorata du progrès.
function projection(board, ctx){
  const { R, CROSS, goals } = ctx;
  const around = k=>{ const [q,r]=k.split(',').map(Number); return neighbors(q,r,R).map(n=>key(n[0],n[1])); };

  const massifGroups = groups(board, c=>MASSIF_T.includes(c.terrain), R).map(g=>{
    const empties = new Set();
    for(const k of g.cells) for(const n of around(k)) if(!board.has(n)) empties.add(n);
    return {cells:g.cells, size:g.cells.length, empties:empties.size};
  });
  const massifs = massifGroups.reduce((s,g)=>s+g.size*g.size, 0);

  let rivieres = 0;
  for(const g of waterGroups(board)) rivieres += RIVER_PT*g.length + CROSS*(1 - crossingLeft(g, R)/(2*R));

  let villages = 0;
  for(const [k,c] of board){
    if(c.terrain!=='village') continue;
    const nbKeys = around(k);
    const filled = nbKeys.map(n=>board.get(n)).filter(Boolean);
    const empties = nbKeys.length - filled.length;
    const kinds = new Set(filled.map(x=>x.terrain));
    let expected = kinds.size, water = kinds.has('eau') ? 1 : 0;
    for(const [t,w] of WEIGHTS){
      if(kinds.has(t)) continue;
      const p = 1 - (1 - w/WEIGHT_SUM)**empties;   // chance que ce terrain apparaisse sur une case libre
      expected += p;
      if(t==='eau') water = p;
    }
    villages += VILLAGE_PT*expected*(1 + water*(VILLAGE_WATER_MULT-1))
              + MOULIN_BONUS*filled.filter(x=>x.rare==='moulin').length;
  }

  let commandes = 0, cmdDone = 0;
  for(const [k,c] of board){
    if(!c.cmd) continue;
    if(cmdOk(board, k, c, R)){ commandes += CMD_BONUS; cmdDone++; }
    else commandes += CMD_BONUS*cmdProgress(board, k, c, around(k), massifGroups);
  }

  let objectifs = 0;
  for(const g of goals) objectifs += GOAL_BONUS*(g.done ? 1 : goalProgress(g.id, board, ctx, massifGroups, cmdDone));

  return {massifs, rivieres, villages, commandes, objectifs};
}

// Cases d'eau qu'il reste à poser pour relier deux bords opposés (0 si le tronçon traverse déjà).
function crossingLeft(g, R){
  const cells = g.map(k=>k.split(',').map(Number));
  const toSide = (q,r,i)=>[R-q, r+R, R+q+r, q+R, R-r, R-q-r][i];   // distance aux bords 0..5 de geometry.sides
  let left = Infinity;
  for(let i=0;i<3;i++){
    const a = Math.min(...cells.map(([q,r])=>toSide(q,r,i)));
    const b = Math.min(...cells.map(([q,r])=>toSide(q,r,i+3)));
    left = Math.min(left, a+b);
  }
  return left;
}

// Progrès (0..1) d'une commande non satisfaite ; 0 si elle est devenue impossible.
function cmdProgress(board, k, c, nbKeys, massifGroups){
  const filled = nbKeys.map(n=>board.get(n)).filter(Boolean);
  const empties = nbKeys.length - filled.length;
  const count = t=>filled.filter(x=>x.terrain===t).length;
  const toward = (t,need)=>count(t)+empties >= need ? count(t)/need : 0;
  switch(c.cmd){
    case 'village_forets3': return toward('foret', CMD_FORETS3);
    case 'village_eau':     return toward('eau', CMD_EAU2);
    case 'champ_villages2': return toward('village', CMD_VILLAGES2);
    case 'pierre_isolee':   return count('pierre') ? 0 : filled.length/nbKeys.length;
    case 'foret_massif5': {
      const g = massifGroups.find(g=>g.cells.includes(k));
      return g.empties ? g.size/CMD_MASSIF5 : 0;
    }
  }
  return 0;
}

// Progrès (0..1) d'un objectif non atteint, en comptant qu'un plateau plein ferme tout massif.
function goalProgress(id, board, ctx, massifGroups, cmdDone){
  const need = GOAL_DEFS[id].need(ctx);
  const big = massifGroups.filter(g=>g.size>=MASSIF_MIN);
  switch(id){
    case 'fermer':    return Math.min(big.length, need)/need;
    case 'gros':      return Math.min(massifGroups.reduce((m,g)=>Math.max(m,g.size), 0), need)/need;
    case 'commandes': return Math.min(cmdDone, need)/need;
    case 'tot':       return board.size > GOAL_DEFS.tot.limite(ctx) ? 0
                           : big.reduce((m,g)=>Math.max(m, 1/(1+g.empties)), 0);   // le massif le plus près de se fermer
    case 'defausse':  return ctx.discards===DISCARDS_MAX ? 1 : 0;
    case 'isoles': {
      const limit = ctx.R>=R_LONG ? GOAL_ISOLES.long : GOAL_ISOLES.short;
      const stuck = massifGroups.filter(g=>g.size===1 && g.empties===0).length;   // isolés définitifs
      return stuck > limit ? 0 : 1 - stuck/(limit+1);
    }
  }
  return 0;
}

const profileScore = profil=>(board, ctx)=>{
  const p = projection(board, ctx);
  return POSTES.reduce((s,poste)=>s + p[poste]*(profil[poste] ?? 1), 0);
};

/* ---------- collecte et rapport ---------- */
function collect(game){
  const {board, goals, score:s, ctx} = game;
  const terrains = Object.fromEntries(WEIGHTS.map(([t])=>[t,0]));
  const rares = Object.fromEntries(Object.keys(RARES).map(r=>[r,0]));
  const cmds = [];
  for(const [k,c] of board){
    terrains[c.terrain]++;
    if(c.rare) rares[c.rare]++;
    if(c.cmd) cmds.push({id:c.cmd, ok:cmdOk(board, k, c, ctx.R)});
  }
  return {total:s.total, postes:Object.fromEntries(POSTES.map(p=>[p,s[p]])), terrains, rares, cmds,
          goals:goals.map(g=>({id:g.id, ok:goalOk(board, g, ctx)}))};
}

const mean = xs=>xs.reduce((a,x)=>a+x,0)/xs.length;
const fmt = x=>x.toFixed(1);
const pct = (a,b)=>b ? (100*a/b).toFixed(0)+' %' : '—';

function report(runs, args){
  const totals = runs.map(r=>r.total).sort((a,b)=>a-b);
  const m = mean(totals);
  const sd = Math.sqrt(mean(totals.map(x=>(x-m)**2)));
  console.log(`\n${runs.length} parties · format ${args.format} · graine ${args.graine} · bot ${args.bot}\n`);
  console.log('Score total');
  console.table({moyenne:fmt(m), médiane:totals[totals.length>>1], min:totals[0], max:totals.at(-1), 'écart-type':fmt(sd)});

  console.log('Détail du score (moyenne par partie)');
  console.table(Object.fromEntries(POSTES.map(p=>[p, fmt(mean(runs.map(r=>r.postes[p])))])));

  console.log('Tuiles posées, amorces incluses (moyenne par partie)');
  console.table({
    ...Object.fromEntries(Object.keys(runs[0].terrains).map(t=>[t, fmt(mean(runs.map(r=>r.terrains[t])))])),
    ...Object.fromEntries(Object.keys(runs[0].rares).map(x=>['rare '+x, fmt(mean(runs.map(r=>r.rares[x])))])),
    commandes: fmt(mean(runs.map(r=>r.cmds.length))),
  });

  console.log('Commandes satisfaites');
  const cmdRows = {};
  for(const id of Object.keys(COMMANDS)){
    const all = runs.flatMap(r=>r.cmds.filter(c=>c.id===id));
    cmdRows[id] = {posées:all.length, satisfaites:all.filter(c=>c.ok).length, taux:pct(all.filter(c=>c.ok).length, all.length)};
  }
  console.table(cmdRows);

  console.log('Objectifs réussis');
  const goalRows = {};
  for(const id of Object.keys(GOAL_DEFS)){
    const all = runs.flatMap(r=>r.goals.filter(g=>g.id===id));
    goalRows[id] = {tirés:all.length, réussis:all.filter(g=>g.ok).length, taux:pct(all.filter(g=>g.ok).length, all.length)};
  }
  console.table(goalRows);
}

const BOTS = ['glouton', 'aleatoire', ...Object.keys(PROFILS)];

function parseArgs(argv){
  const args = {n:100, format:'court', graine:1, bot:'glouton'};
  for(const a of argv){
    const [k,v] = a.replace(/^--/,'').split('=');
    if(k in args) args[k] = ['format','bot'].includes(k) ? v : Number(v);
  }
  if(!['court','long'].includes(args.format)) throw new Error('--format doit valoir court ou long');
  if(!BOTS.includes(args.bot)) throw new Error('--bot doit valoir '+BOTS.join(', '));
  return args;
}

const args = parseArgs(process.argv.slice(2));
const R = args.format==='court' ? R_SHORT : R_LONG;
const runs = [];
for(let i=0;i<args.n;i++){
  const seed = args.graine + i;   // une graine par partie : chacune rejouable seule
  const moveRng = createRng(~seed);   // RNG distinct des coups : même pioche pour tous les bots à graine égale
  const chooseMove = args.bot==='glouton'   ? (board, hand, ctx)=>bestMove(board, hand, ctx, currentScore)
                   : args.bot==='aleatoire' ? (board, hand, ctx)=>randomMove(board, hand, ctx, moveRng)
                   : (board, hand, ctx)=>bestMove(board, hand, ctx, profileScore(PROFILS[args.bot]));
  runs.push(collect(playGame(R, createRng(seed), chooseMove)));
}
report(runs, args);
