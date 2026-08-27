// Boucle de jeu au tour par tour : intention → règle → état → rendu. Orchestre les
// règles pures, l'état G, le rendu et le son ; contient le timing d'animation (cascade,
// délai de fin) qui n'est pas une règle.
import { DISCARDS_MAX, STEP, JOLT_DELAY, FINISH_CAP, FINISH_MARGIN, CROSS_FACTOR, LS_FMT, R_SHORT, R_LONG,
         VIBRATE_PLACE, VIBRATE_DISCARD, VIBRATE_CASCADE } from '../config.js';
import { key } from '../rules/geometry.js';
import { drawTerrain, drawHand, seeds } from '../rules/deck.js';
import { drawGoals } from '../rules/goals.js';
import { G, buildShape, snapshot, score, cmdOk, goalOk, neighbors } from '../state/game.js';
import { bestScore, saveScore } from '../state/scores.js';
import { layout, px, spawnDust } from '../render/board.js';
import { renderAll, hideInspect, showScore } from '../render/ui.js';
import { el, over } from '../render/dom.js';
import { snd, buzz } from '../render/sound.js';

export function newGame(){
  G.board = new Map();
  for(const [q,r] of seeds(G.rng, G.cells))
    G.board.set(key(q,r), {terrain:drawTerrain(G.rng), cmd:null, done:false, rare:null});
  G.goals = drawGoals(G.rng);
  G.hand = drawHand(G.rng); G.nextHand = drawHand(G.rng); G.deal = true;
  G.history = []; G.sel = null; G.ghost = null; G.effects = []; G.dust = [];
  G.discards = DISCARDS_MAX; G.closedAt = new Map();
  G.finished = false; document.body.classList.remove('done'); hideInspect();
  G.lastEntry = null; el('scores').classList.remove('on');
  over.classList.remove('on');
  el('sheet').classList.remove('on');
  G.cachedScore = score(G.board);
  syncClosed(true);
  G.shownScore = G.cachedScore.total;
  el('score').textContent = G.shownScore;
  renderAll();
}

function syncClosed(instant){                  // aligne l'affichage des massifs fermés sur le score
  const next = new Map();
  for(const k of G.cachedScore.closed) next.set(k, G.closedAt.has(k) ? G.closedAt.get(k) : (instant?0:performance.now()));
  G.closedAt = next;
}

function cascade(k){                          // révèle le massif fermé depuis la tuile posée
  const now = performance.now();
  const fresh = [...G.cachedScore.closed].filter(c=>!G.closedAt.has(c));
  if(!fresh.length) return;
  const set = new Set(fresh);
  let ordered = [], seen = new Set();
  const start = set.has(k) ? [k] : [fresh[0]];
  const queue = start.slice(); start.forEach(x=>seen.add(x));
  while(queue.length){                        // parcours en largeur : l'onde part du centre
    const cur = queue.shift(); ordered.push(cur);
    const [q,r] = cur.split(',').map(Number);
    for(const [nq,nr] of neighbors(q,r)){
      const nk = key(nq,nr);
      if(set.has(nk) && !seen.has(nk)){ seen.add(nk); queue.push(nk); }
    }
    if(!queue.length){                        // autre massif fermé au même coup
      const next = fresh.find(x=>!seen.has(x));
      if(next){ seen.add(next); queue.push(next); }
    }
  }
  ordered.forEach((c,i)=>{
    G.closedAt.set(c, now + i*STEP);
    snd.carillon(i, ordered.length, i*STEP/1000);
  });
  buzz(VIBRATE_CASCADE);
}

export function commit(){
  if(!G.ghost || G.sel===null) return;
  snapshot();
  const k = key(G.ghost[0],G.ghost[1]);
  const tile = {...G.hand[G.sel]};
  G.board.set(k, tile);
  const before = G.cachedScore.total;
  G.cachedScore = score(G.board);
  for(const [bk,c] of G.board) if(c.cmd && !c.done && cmdOk(G.board,bk,c)) c.done = true;
  for(const g of G.goals) if(!g.done && goalOk(G.board,g)){ g.done = true; snd.fanfare(); }
  const gain = G.cachedScore.total - before;
  G.effects.push({type:'pop',k,t:performance.now()});
  if(gain!==0) G.effects.push({type:'float',q:G.ghost[0],r:G.ghost[1],n:gain,t:performance.now()});
  snd.clac(); buzz(VIBRATE_PLACE); hideInspect();
  spawnDust(G.ghost[0],G.ghost[1]);
  const [cx,cy] = px(G.ghost[0],G.ghost[1]);
  for(const [nq,nr] of neighbors(G.ghost[0],G.ghost[1])){
    const nk = key(nq,nr);
    if(!G.board.has(nk)) continue;
    const [nx,ny] = px(nq,nr), d = Math.hypot(nx-cx,ny-cy) || 1;
    G.effects.push({type:'jolt', k:nk, t:performance.now()+JOLT_DELAY, ox:(nx-cx)/d, oy:(ny-cy)/d});
  }
  cascade(k);
  syncClosed(false);
  G.hand[G.sel] = null; G.ghost = null;
  if(G.hand.every(t=>t===null)){ G.hand = G.nextHand; G.nextHand = drawHand(G.rng); G.deal = true; }
  const next = G.hand.findIndex(t=>t);          // sélectionne automatiquement la prochaine tuile à poser
  G.sel = next===-1 ? null : next;
  if(G.sel!==null) el('hint').textContent = 'Touche une case libre.';
  renderAll();
  if([...G.cells].every(([q,r])=>G.board.has(key(q,r)))) finish();
}

export function discard(){
  if(G.sel===null || G.discards<=0 || !G.hand[G.sel]) return;
  snapshot();
  G.discards--;
  G.hand[G.sel] = null; G.ghost = null; G.sel = null;
  if(G.hand.every(t=>t===null)){ G.hand = G.nextHand; G.nextHand = drawHand(G.rng); G.deal = true; }
  snd.defausse(); buzz(VIBRATE_DISCARD);
  el('hint').textContent = G.discards ? 'Tuile écartée. Il t’en reste '+G.discards+'.' : 'Tuile écartée. C’était la dernière.';
  renderAll();
}

const row = (a,b)=>'<div class="row"><span>'+a+'</span><span>'+b+'</span></div>';

function finish(){
  G.finished = true;
  G.sel = null; G.ghost = null;
  document.body.classList.add('done');
  el('hint').textContent = 'Le pays est complet.';
  const s = G.cachedScore;
  const avant = bestScore();
  const res = saveScore(s);
  G.lastEntry = res.entry;
  const record = s.total > avant;
  if(record) snd.fanfare();
  const ligne = record
    ? (avant ? 'Nouveau record — précédent : '+avant : 'Premier pays achevé')
    : (res.rank ? res.rank+'ᵉ meilleur score · record : '+avant : 'Record : '+avant);
  el('breakdown').innerHTML =
    row('Massifs fermés', s.massifs) + row('Rivières', s.rivieres) +
    row('Villages', s.villages) + row('Commandes', s.commandes) +
    row('Objectifs', s.objectifs) +
    '<div class="row tot"><span>Total</span><span>'+s.total+'</span></div>' +
    '<div class="row rec"><span>'+ligne+'</span><span></span></div>';
  // on laisse la dernière cascade se terminer avant de recouvrir le plateau
  const last = Math.max(performance.now(), ...G.closedAt.values());
  setTimeout(showScore, Math.min(FINISH_CAP, last - performance.now() + FINISH_MARGIN));
}

export function undo(){
  const h = G.history.pop(); if(!h) return;
  G.board = h.board; G.hand = h.hand; G.nextHand = h.nextHand; G.discards = h.discards; G.goals = h.goals;
  G.sel=null; G.ghost=null; G.effects=[]; G.dust=[]; G.cachedScore = score(G.board);
  G.closedAt = new Map(); syncClosed(true); hideInspect();
  G.shownScore = G.cachedScore.total; el('score').textContent = G.shownScore;
  over.classList.remove('on');
  el('hint').textContent='Coup annulé.';
  renderAll();
}

export function setFormat(r, restart){
  G.R = r; G.CROSS = CROSS_FACTOR*r;
  buildShape();
  try{ localStorage.setItem(LS_FMT, String(r)); }catch(e){}
  el('fmt3').classList.toggle('on', r===R_SHORT);
  el('fmt4').classList.toggle('on', r===R_LONG);
  el('lbtitre').textContent = 'Meilleurs scores — '+(r===R_SHORT?'court':'long');
  if(restart){ layout(); newGame(); }
}
