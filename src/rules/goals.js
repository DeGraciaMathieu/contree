// Objectifs de partie. Fonctions pures : le contexte {R, cells, discards} est passé
// explicitement (jamais lu depuis un état global).
//
// Règle de conception : un objectif ne doit jamais dépendre de ce que la pioche donne,
// seulement de ce que le joueur en fait. Pas de terrain nommé, pas de longueur de
// rivière — uniquement des mesures de placement.
import { MASSIF_T, MASSIF_MIN, DISCARDS_MAX, R_LONG,
         GOAL_FERMER, GOAL_GROS, GOAL_COMMANDES, GOAL_TOT_LIMIT, GOAL_ISOLES } from '../config.js';
import { groups, isClosed } from './groups.js';
import { cmdOk } from './commands.js';

const plein = (b,ctx)=>b.size === ctx.cells.length;
const closedGroups = (b,ctx)=>groups(b, c=>MASSIF_T.includes(c.terrain), ctx.R).filter(g=>isClosed(b,g,ctx.R));
const countCmdDone = (b,ctx)=>{ let n=0; for(const [k,c] of b) if(cmdOk(b,k,c,ctx.R)) n++; return n; };
const seuls = (b,ctx)=>closedGroups(b,ctx).filter(g=>g.cells.length===1).length;

export const GOAL_DEFS = {
  fermer: {
    chip:'Massifs de 3+', atEnd:false,
    need:ctx=>ctx.R>=R_LONG?GOAL_FERMER.long:GOAL_FERMER.short,
    text:ctx=>'Fermer '+(ctx.R>=R_LONG?GOAL_FERMER.long:GOAL_FERMER.short)+' massifs d’au moins '+MASSIF_MIN+' cases, quels qu’ils soient',
    val:(b,ctx)=>closedGroups(b,ctx).filter(g=>g.cells.length>=MASSIF_MIN).length },
  gros: {
    chip:'Grand massif', atEnd:false,
    need:ctx=>ctx.R>=R_LONG?GOAL_GROS.long:GOAL_GROS.short,
    text:ctx=>'Un massif fermé de '+(ctx.R>=R_LONG?GOAL_GROS.long:GOAL_GROS.short)+' cases, n’importe quel terrain',
    val:(b,ctx)=>closedGroups(b,ctx).reduce((m,g)=>Math.max(m,g.cells.length),0) },
  commandes: {
    chip:'Commandes', atEnd:false,
    need:ctx=>ctx.R>=R_LONG?GOAL_COMMANDES.long:GOAL_COMMANDES.short,
    text:ctx=>(ctx.R>=R_LONG?'Cinq':'Trois')+' commandes satisfaites',
    val:countCmdDone },
  tot: {
    chip:'Fermer tôt', atEnd:false,
    need:ctx=>1,
    limite:ctx=>ctx.R>=R_LONG?GOAL_TOT_LIMIT.long:GOAL_TOT_LIMIT.short,
    text:ctx=>'Fermer un massif de '+MASSIF_MIN+' cases ou plus avant la '+(ctx.R>=R_LONG?GOAL_TOT_LIMIT.long:GOAL_TOT_LIMIT.short)+'ᵉ case posée',
    val:(b,ctx)=>(b.size <= (ctx.R>=R_LONG?GOAL_TOT_LIMIT.long:GOAL_TOT_LIMIT.short) && closedGroups(b,ctx).some(g=>g.cells.length>=MASSIF_MIN))?1:0,
    state:(b,ctx)=>{ const l = ctx.R>=R_LONG?GOAL_TOT_LIMIT.long:GOAL_TOT_LIMIT.short; return b.size<=l ? b.size+'/'+l : 'raté'; } },
  defausse: {
    chip:'Sans défausse', atEnd:true,
    need:ctx=>1,
    text:ctx=>'Terminer la partie sans rien défausser',
    val:(b,ctx)=>(plein(b,ctx) && ctx.discards===DISCARDS_MAX)?1:0,
    state:(b,ctx)=>ctx.discards===DISCARDS_MAX?'intacte':'perdu' },
  isoles: {
    chip:ctx=>'Moins de '+((ctx.R>=R_LONG?GOAL_ISOLES.long:GOAL_ISOLES.short)+1)+' isolés', atEnd:true,
    need:ctx=>1,
    text:ctx=>'Terminer avec au plus '+(ctx.R>=R_LONG?GOAL_ISOLES.long:GOAL_ISOLES.short)+' massifs réduits à une seule case',
    val:(b,ctx)=>(plein(b,ctx) && seuls(b,ctx) <= (ctx.R>=R_LONG?GOAL_ISOLES.long:GOAL_ISOLES.short))?1:0,
    state:(b,ctx)=>seuls(b,ctx)+' isolé'+(seuls(b,ctx)>1?'s':'') },
};

export function drawGoals(rng){
  return Object.keys(GOAL_DEFS).sort(()=>rng()-0.5).slice(0,3)
         .map(id=>({id, done:false}));
}
export const goalOk = (b,g,ctx)=>g.done || GOAL_DEFS[g.id].val(b,ctx) >= GOAL_DEFS[g.id].need(ctx);
export function goalState(b,g,ctx){
  const d = GOAL_DEFS[g.id];
  if(goalOk(b,g,ctx)) return '✓';
  if(d.state) return d.state(b,ctx);
  const need = d.need(ctx);
  return need>1 ? Math.min(d.val(b,ctx),need)+'/'+need : '—';
}
