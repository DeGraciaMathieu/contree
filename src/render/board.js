// Rendu du plateau sur canvas : géométrie écran, motifs de terrain, effets et boucle
// d'animation requestAnimationFrame (purement cosmétique — aucune règle décidée ici).
import { TERRAINS, DUST_MAX, SMOKE_T, LIGHT_T, SCORE_INTERP } from '../config.js';
import { key } from '../rules/geometry.js';
import { G, onBoard, cmdOk, validTargets } from '../state/game.js';
import { el } from './dom.js';

const REDUCED = matchMedia('(prefers-reduced-motion:reduce)').matches;
export const cv = document.getElementById('board');
let ctx = cv.getContext('2d');
let S = 22, OX = 0, OY = 0;

export function layout(){
  const w = cv.clientWidth;
  S = w / (Math.sqrt(3)*(2*G.R+1.35));
  const h = Math.ceil(S*1.5*2*G.R + S*2.6);
  cv.style.height = h+'px';
  const dpr = Math.min(devicePixelRatio||1, 2.5);
  cv.width = w*dpr; cv.height = h*dpr;
  ctx.setTransform(dpr,0,0,dpr,0,0);
  OX = w/2; OY = h/2;
  buildLightPath();
}
export const px = (q,r)=>[OX + S*Math.sqrt(3)*(q + r/2), OY + S*1.5*r];

export function hexAt(mx,my){
  const x = (mx-OX)/S, y = (my-OY)/S;
  const qf = (Math.sqrt(3)/3*x - y/3), rf = (2/3*y);
  let xc=qf, zc=rf, yc=-xc-zc;
  let rx=Math.round(xc), ry=Math.round(yc), rz=Math.round(zc);
  const dx=Math.abs(rx-xc), dy=Math.abs(ry-yc), dz=Math.abs(rz-zc);
  if(dx>dy&&dx>dz) rx=-ry-rz; else if(dy>dz) ry=-rx-rz; else rz=-rx-ry;
  return onBoard(rx,rz) ? [rx,rz] : null;
}

function hexPath(x,y,s){
  ctx.beginPath();
  for(let i=0;i<6;i++){
    const a=Math.PI/180*(60*i-30);
    const vx=x+s*Math.cos(a), vy=y+s*Math.sin(a);
    i?ctx.lineTo(vx,vy):ctx.moveTo(vx,vy);
  }
  ctx.closePath();
}

function motif(t,x,y,s){
  const T = TERRAINS[t];
  ctx.save();
  if(t==='foret'){
    ctx.fillStyle=T.dark;
    const ph = REDUCED ? 0 : performance.now()/1300 + (x*.7+y*.3)*.05;
    [[-.34,.12],[.02,-.22],[.34,.14]].forEach(([ox,oy],i)=>{
      const h=s*(i===1?.52:.44), w=s*.26, cx=x+ox*s, cy=y+oy*s+h*.3;
      const tilt = Math.sin(ph + i*1.7)*s*.055;      // la cime penche, le pied reste planté
      ctx.beginPath(); ctx.moveTo(cx+tilt,cy-h); ctx.lineTo(cx+w,cy); ctx.lineTo(cx-w,cy); ctx.closePath(); ctx.fill();
    });
  } else if(t==='champ'){
    ctx.strokeStyle=T.dark; ctx.lineWidth=Math.max(1,s*.075); ctx.lineCap='round';
    for(let i=-1;i<=1;i++){ const oy=y+i*s*.34;
      ctx.beginPath(); ctx.moveTo(x-s*.45,oy); ctx.lineTo(x+s*.45,oy); ctx.stroke(); }
  } else if(t==='eau'){
    const ph = REDUCED ? 0 : (performance.now()/620 + (x+y)*0.06);
    ctx.strokeStyle=T.light; ctx.lineWidth=Math.max(1,s*.09); ctx.lineCap='round';
    for(let i=-1;i<=1;i+=2){
      const oy = y + i*s*.2 + Math.sin(ph + i)*s*.055;
      ctx.beginPath(); ctx.moveTo(x-s*.4,oy);
      ctx.quadraticCurveTo(x+Math.sin(ph+i)*s*.12, oy-s*.22, x+s*.4, oy); ctx.stroke(); }
  } else if(t==='pierre'){
    ctx.fillStyle=T.dark;
    [[-.24,.14,.3],[.2,-.02,.36],[.06,.3,.2]].forEach(([ox,oy,rr])=>{
      ctx.beginPath(); ctx.arc(x+ox*s,y+oy*s,s*rr,0,7); ctx.fill(); });
  } else if(t==='village'){
    ctx.fillStyle=T.dark;
    [[-.26,.1,.30],[.22,-.05,.36]].forEach(([ox,oy,sc])=>{
      const w=s*sc, cx=x+ox*s, cy=y+oy*s;
      ctx.fillRect(cx-w/2,cy,w,w*.8);
      ctx.beginPath(); ctx.moveTo(cx-w*.68,cy); ctx.lineTo(cx,cy-w*.7); ctx.lineTo(cx+w*.68,cy);
      ctx.closePath(); ctx.fill(); });
  }
  ctx.restore();
}

function rareMotif(rare,x,y,s){
  ctx.save();
  if(rare==='pont'){                          // arche de pierre en travers de l'eau
    ctx.strokeStyle='#cbbfa6'; ctx.lineWidth=Math.max(1.4,s*.14); ctx.lineCap='butt';
    ctx.beginPath(); ctx.moveTo(x-s*.62,y+s*.1);
    ctx.quadraticCurveTo(x, y-s*.5, x+s*.62, y+s*.1); ctx.stroke();
    ctx.fillStyle='#9d907a';
    ctx.fillRect(x-s*.66,y+s*.06,s*.16,s*.3); ctx.fillRect(x+s*.5,y+s*.06,s*.16,s*.3);
  } else if(rare==='moulin'){                 // moulin : mât et quatre ailes
    ctx.strokeStyle='#5a4520'; ctx.lineWidth=Math.max(1.2,s*.11);
    ctx.beginPath(); ctx.moveTo(x,y+s*.42); ctx.lineTo(x,y-s*.18); ctx.stroke();
    ctx.strokeStyle='#f0e2bd'; ctx.lineWidth=Math.max(1,s*.09);
    const a0 = REDUCED ? 0.6 : performance.now()/900;
    for(let i=0;i<4;i++){ const a=a0+i*Math.PI/2;
      ctx.beginPath(); ctx.moveTo(x,y-s*.18);
      ctx.lineTo(x+Math.cos(a)*s*.42, y-s*.18+Math.sin(a)*s*.42); ctx.stroke(); }
  }
  ctx.restore();
}

export function paintTile(t,x,y,s,opts={}){
  const T = TERRAINS[t];
  hexPath(x,y,s*.955);
  ctx.fillStyle = T.fill; ctx.fill();
  if(opts.closed){ ctx.save(); ctx.globalAlpha=.5; ctx.fillStyle=T.light; ctx.fill(); ctx.restore(); }
  if(opts.flash){ ctx.save(); ctx.globalAlpha=opts.flash*.55; ctx.fillStyle='#fff6df'; ctx.fill(); ctx.restore(); }
  motif(t,x,y,s);
  if(opts.rare) rareMotif(opts.rare,x,y,s);
  if(opts.glow){
    ctx.save(); ctx.globalAlpha=.5+.3*Math.sin(performance.now()/420);
    ctx.strokeStyle='#8fe3f0'; ctx.lineWidth=Math.max(1.4,s*.1);
    hexPath(x,y,s*.7); ctx.stroke(); ctx.restore();
  }
  ctx.lineWidth = opts.closed ? Math.max(1.5,s*.11) : Math.max(1,s*.05);
  ctx.strokeStyle = opts.closed ? '#d9a441' : (opts.rare ? '#e8d5a3' : T.dark);
  hexPath(x,y,s*.955); ctx.stroke();
}

function cmdMark(c,x,y,s){
  if(!c.cmd) return;
  ctx.save();
  if(c.done){
    ctx.fillStyle='#d9a441'; ctx.beginPath(); ctx.arc(x,y-s*.58,s*.15,0,7); ctx.fill();
  } else {
    ctx.strokeStyle='#d9a441'; ctx.lineWidth=Math.max(1,s*.07);
    ctx.setLineDash([s*.22,s*.18]); hexPath(x,y,s*.66); ctx.stroke();
  }
  ctx.restore();
}

export function spawnDust(q,r){                  // six grains ocre qui retombent sous la tuile
  if(REDUCED) return;
  const [x,y] = px(q,r), now = performance.now();
  for(let i=0;i<6;i++) G.dust.push({
    x: x + (Math.random()-.5)*S*.7, y: y + S*.15,
    vx: (Math.random()-.5)*S*.055, vy: -S*(.012 + Math.random()*.05),
    r: S*(.045 + Math.random()*.05), t: now, life: 520 + Math.random()*260
  });
  if(G.dust.length>DUST_MAX) G.dust.splice(0, G.dust.length-DUST_MAX);
}
function drawDust(now){
  if(!G.dust.length) return;
  G.dust = G.dust.filter(d=>now-d.t < d.life);
  ctx.save(); ctx.fillStyle='#d9b478';
  for(const d of G.dust){
    const e = now-d.t, f = e/16.67, p = e/d.life;
    const x = d.x + d.vx*f, y = d.y + d.vy*f + .5*(S*.0045)*f*f;
    ctx.globalAlpha = (1-p)*.75;
    ctx.beginPath(); ctx.arc(x, y, d.r*(1-p*.4), 0, 7); ctx.fill();
  }
  ctx.restore();
}

function smoke(x,y,s,q,r,alpha){
  if(REDUCED) return;
  const base = ((q*7 + r*13) % 10 + 10) % 10 / 10 * SMOKE_T;
  const now = performance.now();
  ctx.save(); ctx.fillStyle='#cbd6d1';
  for(let i=0;i<3;i++){
    const p = ((now + base + i*SMOKE_T/3) % SMOKE_T) / SMOKE_T;
    if(p>0.78) continue;
    const k = p/0.78;
    const px2 = x + s*.22 + Math.sin(k*3.1 + i)*s*.16;
    const py2 = y - s*.28 - k*s*1.15;
    ctx.globalAlpha = alpha * 0.30 * (1-k) * Math.min(1,k*5);
    ctx.beginPath(); ctx.arc(px2, py2, s*(.09 + k*.20), 0, 7); ctx.fill();
  }
  ctx.restore();
}

let lightPath = null;
export function buildLightPath(){                // la lumière ne passe que sur le pays posé
  if(typeof Path2D==='undefined'){ lightPath = null; return; }
  const p = new Path2D();
  for(const [q,r] of G.cells){
    if(!G.board || !G.board.has(key(q,r))) continue;
    const [x,y] = px(q,r);
    for(let i=0;i<6;i++){
      const a=Math.PI/180*(60*i-30), vx=x+S*.955*Math.cos(a), vy=y+S*.955*Math.sin(a);
      i?p.lineTo(vx,vy):p.moveTo(vx,vy);
    }
    p.closePath();
  }
  lightPath = p;
}

function passingLight(now){                       // nuage : une ombre douce, puis une trainée chaude
  if(REDUCED || !lightPath) return;
  const w = cv.clientWidth, h = parseFloat(cv.style.height) || w;
  const span = w + h;
  const t = (now % LIGHT_T) / LIGHT_T;
  const c = -span*0.6 + t*span*2.2;              // position de la bande sur la diagonale
  ctx.save(); ctx.clip(lightPath);
  const mk = (offset,color,peak)=>{
    const a = c + offset;
    const g = ctx.createLinearGradient(a - span*.34, -span*.34, a + span*.34, span*.34);
    g.addColorStop(0,   color.replace('A','0'));
    g.addColorStop(0.5, color.replace('A',String(peak)));
    g.addColorStop(1,   color.replace('A','0'));
    return g;
  };
  ctx.fillStyle = mk(-span*0.22, 'rgba(4,16,20,A)', 0.16);
  ctx.fillRect(0,0,w,h);
  ctx.globalCompositeOperation='lighter';
  ctx.fillStyle = mk(0, 'rgba(255,214,150,A)', 0.055);
  ctx.fillRect(0,0,w,h);
  ctx.restore();
}

export function render(){
  const now = performance.now();
  ctx.clearRect(0,0,cv.width,cv.height);
  const doneCmds = new Set();
  for(const [k,c] of G.board) if(cmdOk(G.board,k,c)) doneCmds.add(k);

  const targets = G.ghost ? null : validTargets();
  const puffs = [];
  for(const [q,r] of G.cells){
    const k = key(q,r), [x,y] = px(q,r), c = G.board.get(k);
    if(c){
      const e = G.effects.find(e=>e.k===k && e.type==='pop');
      const grow = e ? Math.min(1,(now-e.t)/220) : 1;
      const j = G.effects.find(e=>e.k===k && e.type==='jolt');
      let jolt = 1, jx = 0, jy = 0;
      if(j && !REDUCED){                          // la voisine encaisse le choc : elle recule puis revient
        const jp = (now-j.t)/300;
        if(jp>0 && jp<1){
          const w = Math.sin(jp*Math.PI);
          jolt = 1 - .05*w;
          const push = Math.max(1.5, S*.10)*w;
          jx = j.ox*push; jy = j.oy*push;
        }
      }
      const s = S*jolt*(REDUCED?1:(0.72+0.28*(1-Math.pow(1-grow,3))));
      const dim = G.insp && !G.insp.set.has(k);
      if(dim) ctx.save(), ctx.globalAlpha = 0.3;
      if(G.cachedScore.closed.has(k) && !G.closedAt.has(k)) G.closedAt.set(k, now);
      const ct = G.closedAt.get(k);
      const shut = ct!==undefined && now>=ct;
      const flash = shut && !REDUCED ? Math.max(0, 1-(now-ct)/320) : 0;
      paintTile(c.terrain,x+jx,y+jy,s,{closed:shut, flash, rare:c.rare, glow:G.cachedScore.glow.has(k)});
      cmdMark({cmd:c.cmd,done:doneCmds.has(k)},x+jx,y+jy,S);
      if(c.terrain==='village') puffs.push([x,y,q,r,dim?0.3:1]);
      if(dim) ctx.restore();
      if(G.insp && G.insp.k===k){
        ctx.lineWidth=Math.max(1.6,S*.11); ctx.strokeStyle='#f0d089';
        hexPath(x,y,S*.955); ctx.stroke();
      }
    } else {
      hexPath(x,y,S*.955);
      ctx.fillStyle='#132728'; ctx.fill();
      const ok = G.sel!==null && targets && targets.has(k);
      const cible = G.insp && G.insp.set.has(k);
      ctx.lineWidth = cible ? 1.4 : 1;
      ctx.strokeStyle = cible ? 'rgba(240,208,137,.5)' : (ok ? 'rgba(217,164,65,.55)' : '#1c3739');
      ctx.stroke();
    }
  }
  for(const [x,y,q,r,a] of puffs) smoke(x,y,S,q,r,a);
  drawDust(now);
  passingLight(now);

  if(G.ghost){
    const [x,y] = px(G.ghost[0],G.ghost[1]);
    ctx.save(); ctx.globalAlpha = REDUCED?.85:(.62+.18*Math.sin(now/280));
    paintTile(G.hand[G.sel].terrain,x,y,S,{rare:G.hand[G.sel].rare});
    ctx.restore();
    ctx.lineWidth=Math.max(1.6,S*.1); ctx.strokeStyle='#d9a441';
    hexPath(x,y,S*.955); ctx.stroke();
  }
  G.effects = G.effects.filter(e=>now-e.t < (e.type==='float'?1100:(e.type==='jolt'?340:400)));
  for(const e of G.effects){
    if(e.type!=='float') continue;
    const p=(now-e.t)/1100, [x,y]=px(e.q,e.r);
    ctx.save(); ctx.globalAlpha=1-p*p;
    ctx.fillStyle='#d9a441'; ctx.font='600 '+(S*.95)+'px Fraunces, serif';
    ctx.textAlign='center'; ctx.fillText('+'+e.n, x, y-S*.6-p*S*1.6); ctx.restore();
  }
  const target = G.cachedScore.total;
  if(G.shownScore !== target){
    const d = target - G.shownScore;
    G.shownScore = REDUCED || Math.abs(d)<1 ? target : G.shownScore + d*SCORE_INTERP;
    const v = Math.abs(target-G.shownScore)<0.5 ? target : Math.round(G.shownScore);
    if(v===target) G.shownScore = target;
    el('score').textContent = v;
  }
  requestAnimationFrame(render);
}

export function paintMini(canvas, tile, size){
  const c = canvas.getContext('2d');
  const dpr = Math.min(devicePixelRatio||1,2.5);
  const w = canvas.clientWidth||52, h = canvas.clientHeight||60;
  canvas.width=w*dpr; canvas.height=h*dpr;
  c.setTransform(dpr,0,0,dpr,0,0);
  const keep = ctx; ctx = c;                    // les routines de dessin écrivent dans ctx
  paintTile(tile.terrain, w/2, h/2, size, {rare:tile.rare});
  cmdMark(tile, w/2, h/2, size);
  ctx = keep;
}
