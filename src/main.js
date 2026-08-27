// Point d'entrée : câble les modules, décide la graine RNG et démarre la partie.
import { R_SHORT, R_LONG, LS_FMT } from './config.js';
import { createRng } from './rules/rng.js';
import { G } from './state/game.js';
import { layout, render } from './render/board.js';
import { newGame, setFormat } from './loop/turn.js';
import { bindInputs } from './input/handlers.js';
import { snd } from './render/sound.js';

addEventListener('pointerdown', ()=>snd.ready(), {once:true});
bindInputs();
G.rng = createRng((Date.now() >>> 0));           // graine décidée ici, au câblage
let fmt = R_SHORT;
try{ const v = parseInt(localStorage.getItem(LS_FMT),10); if(v===R_SHORT||v===R_LONG) fmt = v; }catch(e){}
setFormat(fmt, false);
layout(); newGame(); render();
