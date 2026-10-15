// Harnais de simulation : joue N parties avec un joueur glouton et affiche des stats.
// Rejoue le déroulé de loop/turn.js (amorces, objectifs, mains, pose) avec les seules
// règles pures, sans DOM ni son. Le glouton essaie chaque tuile de la main sur chaque
// case jouable, garde le coup qui fait le plus monter le score, et ne défausse jamais.
//
//   npm run sim -- --n=1000 --format=court --graine=1
import { R_SHORT, R_LONG, CROSS_FACTOR, DISCARDS_MAX, BAG, RARES, COMMANDS } from '../src/config.js';
import { createRng } from '../src/rules/rng.js';
import { buildCells, key } from '../src/rules/geometry.js';
import { buildBag, drawTerrain, drawHand, seeds } from '../src/rules/deck.js';
import { drawGoals, goalOk, GOAL_DEFS } from '../src/rules/goals.js';
import { cmdOk } from '../src/rules/commands.js';
import { score } from '../src/rules/score.js';
import { validTargets } from '../src/rules/targets.js';

const POSTES = ['massifs', 'rivieres', 'villages', 'commandes', 'objectifs'];

function playGame(R, rng){
  const cells = buildCells(R);
  const ctx = {R, CROSS:CROSS_FACTOR*R, cells, goals:null, discards:DISCARDS_MAX};
  let bag = buildBag();
  const board = new Map();
  for(const [q,r] of seeds(rng, cells)){
    const d = drawTerrain(bag, rng); bag = d.bag;
    board.set(key(q,r), {terrain:d.terrain, cmd:null, done:false, rare:null});
  }
  ctx.goals = drawGoals(rng);
  let d = drawHand(bag, rng); let hand = d.hand; bag = d.bag;
  d = drawHand(bag, rng); let nextHand = d.hand; bag = d.bag;

  while(board.size < cells.length){
    const best = bestMove(board, hand, ctx);
    board.set(best.k, {...hand[best.i]});
    for(const g of ctx.goals) if(!g.done && goalOk(board, g, ctx)) g.done = true;   // un objectif atteint reste acquis
    hand[best.i] = null;
    if(hand.every(t=>t===null)){ hand = nextHand; d = drawHand(bag, rng); nextHand = d.hand; bag = d.bag; }
  }
  return {board, goals:ctx.goals, score:score(board, ctx), ctx};
}

function bestMove(board, hand, ctx){
  const targets = validTargets(board, ctx.cells, ctx.R);
  let best = null;
  for(let i=0;i<hand.length;i++){
    if(!hand[i]) continue;
    for(const k of targets){
      board.set(k, hand[i]);
      const total = score(board, ctx).total;
      board.delete(k);
      if(!best || total > best.total) best = {i, k, total};
    }
  }
  return best;
}

function collect(game){
  const {board, goals, score:s, ctx} = game;
  const terrains = Object.fromEntries(BAG.map(([t])=>[t,0]));
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
  console.log(`\n${runs.length} parties · format ${args.format} · graine ${args.graine}\n`);
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

function parseArgs(argv){
  const args = {n:100, format:'court', graine:1};
  for(const a of argv){
    const [k,v] = a.replace(/^--/,'').split('=');
    if(k in args) args[k] = k==='format' ? v : Number(v);
  }
  if(!['court','long'].includes(args.format)) throw new Error('--format doit valoir court ou long');
  return args;
}

const args = parseArgs(process.argv.slice(2));
const R = args.format==='court' ? R_SHORT : R_LONG;
const runs = [];
for(let i=0;i<args.n;i++) runs.push(collect(playGame(R, createRng(args.graine + i))));   // une graine par partie : chacune rejouable seule
report(runs, args);
