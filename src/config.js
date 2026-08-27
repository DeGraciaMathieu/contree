// Constantes de configuration de Contrée.
// Valeurs extraites du prototype : aucune règle n'est décidée ici, seulement nommée.

/* ---------- géométrie / formats ---------- */
export const R_LONG = 4;          // rayon du plateau long
export const R_SHORT = 3;         // rayon du plateau court
export const CROSS_FACTOR = 10;   // prime de traversée = CROSS_FACTOR * R
export const DIRS = [[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]];

/* ---------- terrains et tirage ---------- */
export const TERRAINS = {
  foret:   {name:'Forêt',   fill:'#3d6b46', dark:'#2a4c31', light:'#5c8f63'},
  champ:   {name:'Champ',   fill:'#b9903c', dark:'#8f6d29', light:'#d9b563'},
  eau:     {name:'Eau',     fill:'#2f6f80', dark:'#22525f', light:'#5ea3b3'},
  pierre:  {name:'Pierre',  fill:'#6d6f7a', dark:'#4f515b', light:'#9597a2'},
  village: {name:'Village', fill:'#b2563a', dark:'#8a3f28', light:'#d3805f'},
};
export const WEIGHTS = [['foret',30],['champ',25],['eau',20],['pierre',15],['village',10]];
export const CMD_CHANCE = 0.32;   // chance qu'une tuile non-rare porte une commande
export const RARE_CHANCE = 0.14;  // chance de tirer une tuile rare

/* ---------- commandes ---------- */
export const COMMANDS = {
  foret_massif5:   {on:'foret',   text:'Massif de 5 forêts'},
  village_forets3: {on:'village', text:'3 forêts autour'},
  village_eau:     {on:'village', text:'2 eaux autour'},
  champ_villages2: {on:'champ',   text:'2 villages autour'},
  pierre_isolee:   {on:'pierre',  text:'Aucune pierre autour'},
};
export const CMD_BONUS = 15;      // points d'une commande satisfaite
export const CMD_FORETS3 = 3;     // forêts requises autour du village
export const CMD_EAU2 = 2;        // eaux requises autour du village
export const CMD_VILLAGES2 = 2;   // villages requis autour du champ
export const CMD_MASSIF5 = 5;     // taille du massif de forêts

/* ---------- tuiles rares ---------- */
export const RARES = {
  pont:   {on:'eau',   name:'Pont',   hint:'enjambe une case'},
  moulin: {on:'champ', name:'Moulin', hint:'+4 par village voisin'},
};
export const MOULIN_BONUS = 4;    // points de moulin par village voisin

/* ---------- score ---------- */
export const RIVER_PT = 3;             // points par tuile de rivière
export const VILLAGE_PT = 2;           // points par terrain différent autour d'un village
export const VILLAGE_WATER_MULT = 2;   // multiplicateur si une eau touche le village
export const MASSIF_T = ['foret','champ','pierre'];
export const MASSIF_MIN = 3;           // taille minimale d'un massif significatif

/* ---------- défausses et historique ---------- */
export const DISCARDS_MAX = 3;    // défausses par partie
export const HISTORY_MAX = 40;    // profondeur de la pile d'annulation

/* ---------- amorces initiales ---------- */
export const SEED_COUNT = 4;      // nombre d'amorces
export const SEED_RING_MIN = 2;   // distance minimale au centre
export const SEED_RING_MAX = 3;   // distance maximale au centre
export const SEED_SPACING = 3;    // écart minimal entre deux amorces
export const SEED_GUARD_MAX = 400; // garde anti-boucle du placement des amorces

/* ---------- objectifs de partie ---------- */
export const GOAL_BONUS = 30;
export const GOALS_PER_GAME = 3;  // objectifs tirés au début de chaque partie
export const GOAL_FERMER = {long:6, short:4};      // massifs de 3+ à fermer
export const GOAL_GROS = {long:11, short:8};       // taille du grand massif
export const GOAL_COMMANDES = {long:5, short:3};   // commandes satisfaites
export const GOAL_TOT_LIMIT = {long:46, short:30}; // cases posées pour "fermer tôt"
export const GOAL_ISOLES = {long:7, short:5};      // isolés tolérés en fin de partie

/* ---------- animation et rendu ---------- */
export const STEP = 75;           // décalage ms entre deux tuiles d'une fermeture
export const JOLT_DELAY = 40;     // délai ms avant le choc encaissé par une voisine
export const VIBRATE_PLACE = 8;              // vibration à la pose
export const VIBRATE_DISCARD = 6;            // vibration à la défausse
export const VIBRATE_CASCADE = [0,8,60,14];  // vibration à la fermeture d'un massif
export const DUST_MAX = 30;       // grains de poussière simultanés
export const SMOKE_T = 4800;      // période d'une volute de fumée (ms)
export const LIGHT_T = 30000;     // durée d'une traversée du nuage (ms)
export const SCORE_INTERP = 0.12; // coefficient d'interpolation du score affiché
export const FINISH_CAP = 2600;   // délai max avant l'écran de fin (ms)
export const FINISH_MARGIN = 900;  // marge après la cascade (ms)

/* ---------- persistance ---------- */
export const TOP_N = 10;          // entrées conservées au classement
export const LS_FMT = 'contree.format';
export const LS_KEY = 'contree.scores.v1';
