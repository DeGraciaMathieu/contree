// Rendu de l'interface HTML : main, objectifs, panneau d'inspection, delta de pose,
// classement. Lit l'état G et écrit dans le DOM.
import { RARES, COMMANDS, CMD_BONUS, CMD_FORETS3, CMD_EAU2, CMD_VILLAGES2, CMD_MASSIF5,
         MASSIF_T, RIVER_PT, TERRAINS, VILLAGE_PT, VILLAGE_WATER_MULT, MOULIN_BONUS, GOAL_BONUS } from '../config.js';
import { key } from '../rules/geometry.js';
import { waterGroups } from '../rules/groups.js';
import { GOAL_DEFS } from '../rules/goals.js';
import { G, neighbors, sides, cmdOk, score, goalOk, goalState, goalCtx } from '../state/game.js';
import { loadScores } from '../state/scores.js';
import { paintMini, buildLightPath } from './board.js';
import { el, over } from './dom.js';
import { commit } from '../loop/turn.js';

const pts = n=>n+(n>1?' pts':' pt');

function groupOf(b,k){
  const t = b.get(k).terrain, seen = new Set([k]), st = [k], out = [];
  while(st.length){ const cur = st.pop(); out.push(cur);
    const [q,r] = cur.split(',').map(Number);
    for(const [nq,nr] of neighbors(q,r)){
      const nk = key(nq,nr), nc = b.get(nk);
      if(nc && nc.terrain===t && !seen.has(nk)){ seen.add(nk); st.push(nk); }
    }}
  return out;
}
const freeAround = ks=>{
  const f = new Set();
  ks.forEach(x=>{ const [q,r] = x.split(',').map(Number);
    neighbors(q,r).forEach(n=>{ const nk = key(n[0],n[1]); if(!G.board.has(nk)) f.add(nk); }); });
  return f;
};

function cmdRow(k,c){
  if(!c.cmd) return null;
  const [q,r] = k.split(',').map(Number);
  const nb = neighbors(q,r).map(n=>G.board.get(key(n[0],n[1])));
  const count = t=>nb.filter(x=>x&&x.terrain===t).length;
  const label = 'Commande — '+COMMANDS[c.cmd].text;
  if(cmdOk(G.board,k,c)) return [label, CMD_BONUS+' pts acquis'];
  // sinon on montre l'avancement
  let state;
  switch(c.cmd){
    case 'village_forets3': state = count('foret')+'/'+CMD_FORETS3; break;
    case 'village_eau':     state = count('eau')+'/'+CMD_EAU2; break;
    case 'champ_villages2': state = count('village')+'/'+CMD_VILLAGES2; break;
    case 'foret_massif5':   state = groupOf(G.board,k).length+'/'+CMD_MASSIF5; break;
    case 'pierre_isolee': {
      const libres = neighbors(q,r).filter(n=>!G.board.has(key(n[0],n[1]))).length;
      state = count('pierre') ? 'perdue' : (libres+' case'+(libres>1?'s':'')+' à remplir');
      break; }
  }
  return [label, state+' · '+CMD_BONUS+' pts', true];
}

function inspectData(k){
  const c = G.board.get(k), [q,r] = k.split(',').map(Number);
  const set = new Set([k]), rows = [];
  let title = TERRAINS[c.terrain].name, rule = '';

  if(MASSIF_T.includes(c.terrain)){
    const g = groupOf(G.board,k); g.forEach(x=>set.add(x));
    const free = freeAround(g); free.forEach(x=>set.add(x));
    const n = g.length;
    if(free.size){
      rows.push(['Massif ouvert de '+n, pts(n)+' pour l’instant']);
      rows.push(['S’il se ferme tel quel', pts(n*n), true]);
      rows.push(['Avec une case de plus', pts((n+1)*(n+1)), true]);
      rows.push(['Cases libres autour', free.size, true]);
    } else {
      rows.push(['Massif fermé de '+n, pts(n*n)+' acquis']);
    }
    rule = 'Un massif vaut sa taille tant qu’il est ouvert, sa taille au carré une fois entièrement entouré.';
  }

  if(c.terrain==='eau'){
    const g = waterGroups(G.board).find(gr=>gr.includes(k)) || [k];
    g.forEach(x=>set.add(x));
    const sd = new Set(); g.forEach(x=>{const[a,b]=x.split(',').map(Number); sides(a,b).forEach(i=>sd.add(i));});
    const cross = [...sd].some(i=>sd.has((i+3)%6));
    rows.push(['Rivière de '+g.length, pts(RIVER_PT*g.length)]);
    rows.push(['Une case de plus', '+'+RIVER_PT+' pts', true]);
    rows.push(cross ? ['Traversée du plateau', '+'+G.CROSS+' acquis']
                    : ['Traversée du plateau', sd.size ? '+'+G.CROSS+' si elle atteint le bord opposé' : '+'+G.CROSS+' de bord à bord', true]);
    rule = 'Un pont enjambe une case et raccorde deux tronçons séparés.';
  }

  if(c.terrain==='village'){
    const nbk = neighbors(q,r).map(n=>key(n[0],n[1]));
    nbk.forEach(x=>set.add(x));
    const nb = nbk.map(x=>G.board.get(x)).filter(Boolean);
    const kinds = new Set(nb.map(x=>x.terrain));
    const libres = nbk.filter(x=>!G.board.has(x)).length;
    const moulins = nb.filter(x=>x.rare==='moulin').length;
    const eau = kinds.has('eau');
    const val = VILLAGE_PT*kinds.size*(eau?VILLAGE_WATER_MULT:1) + MOULIN_BONUS*moulins;
    const maxK = Math.min(5, kinds.size + libres);
    const pot = VILLAGE_PT*maxK*((eau||libres)?VILLAGE_WATER_MULT:1) + MOULIN_BONUS*moulins;
    rows.push([kinds.size+' terrain'+(kinds.size>1?'s':'')+' différent'+(kinds.size>1?'s':'')+' autour', pts(val)]);
    rows.push(['Bonus eau', eau ? '×2 acquis' : (libres?'×2 si une eau le touche':'hors d’atteinte'), !eau]);
    if(moulins) rows.push(['Moulin voisin', '+'+pts(MOULIN_BONUS*moulins)]);
    if(libres) rows.push(['Cases libres autour', libres+' → jusqu’à '+pts(pot), true]);
    rule = 'Le village veut de la variété : il tire dans le sens inverse des massifs.';
  }

  const cr = cmdRow(k,c);
  if(cr) rows.push(cr);
  if(c.rare){ title += ' · '+RARES[c.rare].name; rule = RARES[c.rare].name+' — '+RARES[c.rare].hint+'.'; }
  return {title, rows, set, rule};
}

export function showInspect(k){
  const d = inspectData(k);
  G.insp = {k, set:d.set};
  el('insp-t').textContent = d.title;
  el('insp-b').innerHTML = d.rows.map(([a,b,dim])=>
    '<div class="l'+(dim?' dim':'')+'"><span>'+a+'</span><span>'+b+'</span></div>').join('')
    + (d.rule?'<div class="rule">'+d.rule+'</div>':'');
  el('insp').classList.add('on');
}
export function hideInspect(){ G.insp = null; el('insp').classList.remove('on'); }

export function refreshDelta(){
  el('place').disabled = !G.ghost;
  el('discard').disabled = G.sel===null || !G.hand[G.sel] || G.discards<=0;
  el('dleft').textContent = G.discards;
  if(!G.ghost){ el('delta').textContent=''; return; }
  const test = new Map(G.board);
  test.set(key(G.ghost[0],G.ghost[1]), {...G.hand[G.sel]});
  const d = score(test).total - G.cachedScore.total;
  const dd = el('delta');
  dd.textContent = (d>=0?'+':'')+d;
  dd.className = 'delta'+(d===0?' zero':'');
  el('hint').textContent = 'Retape la case, ou choisis la tuile suivante.';
}

export function renderHand(){
  const wrap = el('hand'); wrap.innerHTML='';
  G.hand.forEach((tile,i)=>{
    const d = document.createElement('div');
    d.className = 'slot' + (tile?'':' used') + (G.sel===i?' on':'') + (G.deal&&tile?' deal':'');
    if(G.deal && tile) d.style.animationDelay = (i*60)+'ms';
    const c = document.createElement('canvas');
    const cap = document.createElement('div');
    cap.className = 'cmd' + (tile&&tile.rare ? ' rare' : (tile&&tile.cmd?'':' none'));
    cap.textContent = tile ? (tile.rare ? RARES[tile.rare].name+' — '+RARES[tile.rare].hint
                            : (tile.cmd?COMMANDS[tile.cmd].text:TERRAINS[tile.terrain].name)) : '';
    d.appendChild(c); d.appendChild(cap); wrap.appendChild(d);
    if(tile) paintMini(c, tile, 24);
    d.addEventListener('click',()=>{
      if(!tile || G.finished) return;
      hideInspect();
      if(G.ghost && G.sel!==null && G.sel!==i){   // une pose est en attente : on la valide et on enchaîne
        commit();
        G.sel = i;
        el('hint').textContent = 'Touche une case libre.';
        renderHand(); refreshDelta();
        return;
      }
      G.sel = (G.sel===i?null:i); G.ghost=null; refreshDelta();
      el('hint').textContent = G.sel===null ? 'Choisis une tuile.' : 'Touche une case libre.';
      renderHand();
    });
  });
  G.deal = false;                                  // la distribution ne s'anime qu'une fois
  const nr = el('nextrow'); nr.innerHTML='';
  G.nextHand.forEach(t=>{ const c=document.createElement('canvas'); nr.appendChild(c); paintMini(c,t,10); });
}

export function renderGoals(){
  const wrap = el('goals'); wrap.innerHTML = '';
  G.goals.forEach(g=>{
    const d = GOAL_DEFS[g.id];
    const ok = goalOk(G.board,g);
    const e = document.createElement('div');
    e.className = 'goal' + (ok?' ok':'');
    const chip = typeof d.chip==='function' ? d.chip(goalCtx()) : d.chip;
    e.innerHTML = '<b>'+chip+'</b><i>'+goalState(G.board,g)+'</i>';
    e.addEventListener('click', ()=>{
      el('hint').textContent = d.text(goalCtx()) + (ok?' — acquis' : ' · +'+GOAL_BONUS+' pts');
    });
    wrap.appendChild(e);
  });
}

export function renderAll(){
  buildLightPath();
  renderGoals();
  el('undo').disabled = G.history.length===0;
  el('place').disabled = !G.ghost;
  renderHand();
  refreshDelta();
}

export function showScores(){
  const list = loadScores();
  el('scores-b').innerHTML = list.length ? list.map((x,i)=>{
    const d = new Date(x.d).toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit'});
    const me = G.lastEntry && x.d===G.lastEntry.d ? ' me' : '';
    return '<div class="sc'+me+'"><span class="rk">'+(i+1)+'</span>'
         + '<span class="pt">'+x.t+'</span><span class="dt">'+d+'</span></div>';
  }).join('') : '<div class="empty">Aucune partie terminée pour l’instant. Le pays doit être complet pour compter.</div>';
  el('scores').classList.add('on');
}

export function showScore(){ over.classList.add('on'); over.classList.remove('fade'); void over.offsetWidth; over.classList.add('fade'); }
