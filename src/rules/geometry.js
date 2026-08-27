// Géométrie du plateau hexagonal (coordonnées axiales q,r). Fonctions pures :
// le rayon R du plateau est passé explicitement, jamais lu depuis un état global.
import { DIRS } from '../config.js';

export const key = (q,r)=>q+','+r;

export function buildCells(R){
  const cells = [];
  for(let q=-R;q<=R;q++) for(let r=-R;r<=R;r++) if(Math.abs(q+r)<=R) cells.push([q,r]);
  return cells;
}

export const onBoard = (q,r,R)=>Math.abs(q)<=R && Math.abs(r)<=R && Math.abs(q+r)<=R;

export const neighbors = (q,r,R)=>DIRS.map(d=>[q+d[0],r+d[1]]).filter(c=>onBoard(c[0],c[1],R));

export function sides(q,r,R){              // bords du plateau touchés (0..5, opposés = i et i+3)
  const x=q, z=r, y=-q-r, s=[];
  if(x===R)s.push(0); if(z===-R)s.push(1); if(y===R)s.push(2);
  if(x===-R)s.push(3); if(z===R)s.push(4); if(y===-R)s.push(5);
  return s;
}

export const dist = (a,b)=>(Math.abs(a[0]-b[0]) + Math.abs(a[1]-b[1]) + Math.abs(a[0]+a[1]-b[0]-b[1]))/2;
