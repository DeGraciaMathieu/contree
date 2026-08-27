// Écouteurs d'événements : traduit clics et gestes en intentions de jeu. Appelé une fois
// au câblage (main).
import { R_SHORT, R_LONG } from '../config.js';
import { key } from '../rules/geometry.js';
import { G, validTargets } from '../state/game.js';
import { cv, hexAt, layout } from '../render/board.js';
import { showInspect, hideInspect, showScores, showScore, refreshDelta, hideStart } from '../render/ui.js';
import { commit, discard, undo, newGame, setFormat } from '../loop/turn.js';
import { el, over } from '../render/dom.js';
import { snd } from '../render/sound.js';

export function bindInputs(){
  cv.addEventListener('click', ev=>{
    if(G.finished) over.classList.remove('on');
    const rect = cv.getBoundingClientRect();
    const h = hexAt(ev.clientX-rect.left, ev.clientY-rect.top);
    if(!h){ hideInspect(); return; }
    const k = key(h[0],h[1]);
    if(G.board.has(k)){                            // tuile posée : on détaille ce qu'elle rapporte
      if(G.insp && G.insp.k===k) hideInspect(); else showInspect(k);
      return; }
    hideInspect();
    if(G.finished || G.sel===null){
      if(!G.finished) el('hint').textContent='Choisis une tuile.';
      return; }
    if(!validTargets().has(k)) { el('hint').textContent='Il faut poser à côté du pays existant.'; return; }
    if(G.ghost && G.ghost[0]===h[0] && G.ghost[1]===h[1]) return commit();
    G.ghost = h; refreshDelta();
  });

  el('place').addEventListener('click', commit);
  el('undo').addEventListener('click', undo);
  el('discard').addEventListener('click', discard);
  el('sound').addEventListener('click', ()=>{
    snd.on = !snd.on;
    el('sound').classList.toggle('off', !snd.on);
    el('sound').title = snd.on ? 'Son' : 'Muet';
    if(snd.on){ snd.ready(); snd.clac(); }
  });
  el('reset').addEventListener('click', newGame);
  el('rules').addEventListener('click', ()=>el('sheet').classList.add('on'));
  el('closesheet').addEventListener('click', ()=>el('sheet').classList.remove('on'));
  el('sheet').addEventListener('click', ev=>{ if(ev.target===el('sheet')) el('sheet').classList.remove('on'); });
  el('again').addEventListener('click', newGame);
  el('again2').addEventListener('click', newGame);
  el('seeboard').addEventListener('click', ()=>over.classList.remove('on'));
  el('seescore').addEventListener('click', showScore);
  el('insp-x').addEventListener('click', hideInspect);
  el('palmares').addEventListener('click', showScores);
  el('palmares2').addEventListener('click', showScores);
  el('closescores').addEventListener('click', ()=>el('scores').classList.remove('on'));
  el('scores').addEventListener('click', ev=>{ if(ev.target===el('scores')) el('scores').classList.remove('on'); });
  addEventListener('resize', ()=>{ layout(); });

  el('fmt3').addEventListener('click', ()=>{ setFormat(R_SHORT,true); el('sheet').classList.remove('on'); });
  el('fmt4').addEventListener('click', ()=>{ setFormat(R_LONG,true); el('sheet').classList.remove('on'); });

  el('start3').addEventListener('click', ()=>{ setFormat(R_SHORT,true); hideStart(); });   // écran d'accueil
  el('start4').addEventListener('click', ()=>{ setFormat(R_LONG,true); hideStart(); });
}
