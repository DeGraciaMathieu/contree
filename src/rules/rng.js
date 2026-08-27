// Générateur pseudo-aléatoire seedé (LCG). Injecté partout où une règle tire au sort ;
// seul le câblage (main) décide de la graine. Un test passe une graine fixe et obtient
// un résultat déterministe.
export function createRng(seed) {
  let s = seed >>> 0;
  return function next() {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
