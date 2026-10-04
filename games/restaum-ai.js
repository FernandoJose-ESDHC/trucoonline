/* =====================================================================
   Solucionador do Resta Um (tabuleiro inglês de 33 casas e francês de 37).
   - Busca em profundidade fazendo/desfazendo pulos no lugar;
   - memória das posições SEM solução (tabela de espalhamento própria),
     guardadas na forma canônica (menor das 8 simetrias do tabuleiro);
   - poda pelas "classes de posição" (contagem de pinos nas diagonais
     módulo 3): se a classe da posição não bate com a do pino final, não
     há solução — e isso é provado na hora, sem buscar;
   - ordem dos pulos: primeiro os pinos mais longe da casa-alvo;
   - tabela "de trás para a frente" com todas as posições de poucos pinos que ainda
     terminam no alvo (a busca para ao chegar nelas);
   - funções-pagode (geradas por programação linear) que provam "não tem solução";
   - busca SEM recursão, que pode ser feita aos pedaços (não trava a tela);
   - limite de tempo: devolve {status:'timeout'} se não terminar a tempo.
   A memória vale entre chamadas (uma posição sem solução nunca passa a ter).
   ===================================================================== */
const RestaUmAI = (() => {
'use strict';
const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

/* ---------- conjunto de números (chaves de até 37 bits) ---------- */
class NumSet {
  constructor(bits, maxBits = 22){ this.bits = bits; this.maxBits = maxBits; this.cap = 1 << bits; this.mask = this.cap - 1; this.t = new Float64Array(this.cap); this.size = 0; }
  slot(k){
    const lo = k % 4294967296 | 0, hi = Math.floor(k / 4294967296) | 0;
    let h = Math.imul(lo ^ Math.imul(hi, 0x9E3779B1), 0x85EBCA6B); h ^= h >>> 13; h = Math.imul(h, 0xC2B2AE35); h ^= h >>> 16;
    return h & this.mask;
  }
  has(k){ let i = this.slot(k); const t = this.t; while(t[i] !== 0){ if(t[i] === k) return true; i = (i + 1) & this.mask; } return false; }
  add(k){
    if(this.size > this.cap * 0.7){
      if(this.bits < this.maxBits) this.grow(); else { this.t.fill(0); this.size = 0; }   // limite de memória: recomeça
    }
    let i = this.slot(k); const t = this.t;
    while(t[i] !== 0){ if(t[i] === k) return; i = (i + 1) & this.mask; }
    t[i] = k; this.size++;
  }
  grow(){
    const old = this.t; this.bits++; this.cap = 1 << this.bits; this.mask = this.cap - 1; this.t = new Float64Array(this.cap); this.size = 0;
    for(let i=0;i<old.length;i++) if(old[i] !== 0) this.add(old[i]);
  }
}

/* ---------- geometria dos tabuleiros ---------- */
const GEO = {};
function geo(kind){
  if(GEO[kind]) return GEO[kind];
  const valid = (r,c) => r >= 0 && r < 7 && c >= 0 && c < 7 &&
    (kind === 'fr' ? Math.abs(r-3) + Math.abs(c-3) <= 4 : (Math.abs(r-3) <= 1 || Math.abs(c-3) <= 1));
  const cells = [], idx = new Int8Array(49).fill(-1);
  for(let r=0;r<7;r++) for(let c=0;c<7;c++) if(valid(r,c)){ idx[r*7+c] = cells.length; cells.push(r*7+c); }
  const n = cells.length;
  // pulos [de, sobre, para] em índices de casa
  const J = [];
  for(let h=0;h<n;h++){
    const r = Math.floor(cells[h]/7), c = cells[h] % 7;
    for(const [dr,dc] of [[0,1],[0,-1],[1,0],[-1,0]]){
      if(valid(r+dr, c+dc) && valid(r+2*dr, c+2*dc)) J.push([h, idx[(r+dr)*7+c+dc], idx[(r+2*dr)*7+c+2*dc]]);
    }
  }
  // 8 simetrias do quadrado em volta do centro
  const TR = [(r,c)=>[r,c], (r,c)=>[c,6-r], (r,c)=>[6-r,6-c], (r,c)=>[6-c,r], (r,c)=>[r,6-c], (r,c)=>[6-r,c], (r,c)=>[c,r], (r,c)=>[6-c,6-r]];
  const SYM = TR.map(f => Int8Array.from(cells, cell => { const [r,c] = f(Math.floor(cell/7), cell % 7); return idx[r*7+c]; }));
  const P2 = Float64Array.from({length:n}, (_,i) => Math.pow(2, i));
  const SW = SYM.map(p => Float64Array.from(p, j => P2[j]));     // SW[k][h] = 2^(simetria k de h)
  // peso para ordenar pulos: perto do centro é melhor
  const CEN = Float64Array.from(cells, cell => { const r = Math.floor(cell/7), c = cell % 7; return Math.abs(r-3) + Math.abs(c-3); });
  // vizinhos (4 direções) de cada casa
  const NB = cells.map(cell => { const r = Math.floor(cell/7), c = cell % 7; return [[0,1],[0,-1],[1,0],[-1,0]].filter(([dr,dc]) => valid(r+dr,c+dc)).map(([dr,dc]) => idx[(r+dr)*7+c+dc]); });
  const A3 = Int8Array.from(cells, cell => (Math.floor(cell/7) + cell % 7) % 3);
  const B3 = Int8Array.from(cells, cell => (Math.floor(cell/7) - cell % 7 + 9) % 3);
  return GEO[kind] = {kind, n, cells, idx, J, SYM, SW, CEN, NB, A3, B3, valid};
}

// classe da posição (invariante dos pulos): 4 bits
function classOf(G, pegs){
  const a = [0,0,0], b = [0,0,0];
  for(let h=0;h<G.n;h++) if(pegs[h]){ a[G.A3[h]]++; b[G.B3[h]]++; }
  const ca = (a[0]^a[1])&1 | ((a[1]^a[2])&1) << 1, cb = (b[0]^b[1])&1 | ((b[1]^b[2])&1) << 1;
  return ca | cb << 2;
}
function classOfHole(G, h){ const p = new Uint8Array(G.n); p[h] = 1; return classOf(G, p); }
// casas onde o último pino ainda pode terminar
function possibleEnds(G, pegs){ const k = classOf(G, pegs); const out = []; for(let h=0;h<G.n;h++) if(classOfHole(G, h) === k) out.push(h); return out; }

/* ---------- funções-pagode ----------
   p(casa) com p(a)+p(b) >= p(c) para todo pulo a→(sobre b)→c: a soma de p sobre os
   pinos nunca aumenta. Se a soma já está abaixo de p(casa final), não há solução.
   Geradas offline por programação linear sobre milhares de posições sem solução. */
const PAGODAS = {
  en: [[-5,2,-3,5,2,3,-4,4,0,4,0,4,-4,0,5,5,6,3,3,0,-4,4,0,4,0,4,-4,5,2,3,-5,2,-3],[-1,0,-1,1,2,1,0,0,0,0,0,0,0,0,1,1,2,1,1,0,0,0,0,0,0,0,0,1,2,1,-1,0,-1],[-1,1,0,1,5,0,-6,6,0,6,0,6,-6,0,1,1,2,0,2,0,-6,6,0,6,0,6,-6,1,5,0,-1,1,0],[-3,2,-1,3,2,1,0,0,0,0,0,0,0,3,0,3,2,1,1,0,0,0,0,0,0,0,0,3,2,1,-3,2,-1],[-4,0,-4,4,2,4,0,0,0,0,0,0,0,2,2,4,2,4,4,0,-2,2,0,2,1,1,0,4,1,3,-4,2,-2],[0,1,-1,0,1,1,0,0,0,0,0,0,0,0,1,0,1,1,1,0,0,0,0,0,0,0,0,0,1,1,0,0,0],[-1,1,0,1,2,0,0,0,0,0,0,0,0,0,1,1,2,0,2,0,0,0,0,0,0,0,0,1,2,0,-1,1,0],[-1,0,-1,1,1,2,-1,1,0,1,1,0,1,2,2,1,2,1,3,4,-3,3,0,3,0,3,-3,1,0,1,-1,3,-1],[-3,0,-3,3,1,3,0,0,0,0,0,0,0,3,0,3,1,3,0,3,0,0,0,0,0,0,0,3,1,3,-3,0,-3],[-1,0,-1,3,2,1,0,0,0,0,0,0,0,0,3,3,2,1,1,0,0,0,0,0,0,0,0,3,2,1,-3,2,-1],[-1,0,-1,1,2,1,-2,2,0,2,0,2,-2,0,1,1,2,1,1,0,-2,2,0,2,0,2,-2,1,0,1,-1,2,-1],[0,0,0,0,1,0,-1,1,0,1,0,1,-1,0,2,0,2,0,2,0,-1,1,0,1,0,1,-1,0,1,0,0,0,0],[0,0,0,0,1,0,-1,1,0,1,0,1,-1,2,2,0,2,0,2,2,-3,3,0,3,0,3,-3,0,3,0,0,0,0],[-3,0,-3,4,5,3,-1,2,1,1,0,1,-1,3,2,5,6,3,3,0,-4,4,0,4,0,4,-1,5,2,3,-5,2,-3],[-3,2,-1,3,2,1,-1,1,0,1,0,1,-1,0,3,3,2,1,1,0,-1,1,0,1,1,2,-1,3,3,0,-3,4,1],[-1,1,0,1,2,0,-3,3,0,3,0,3,-3,1,0,1,1,0,1,1,-3,3,0,3,0,3,-3,1,2,0,-1,1,0],[-3,1,-3,3,1,3,0,0,0,0,0,0,0,1,2,3,1,3,2,1,-1,1,0,1,0,1,-1,3,0,3,-3,1,-3],[-1,1,-1,1,2,1,-3,3,0,3,0,3,-3,1,0,1,1,1,0,1,-3,3,0,3,0,3,-3,1,0,1,-1,3,-1],[-3,1,-3,3,0,3,-1,1,0,1,0,1,-1,1,2,3,1,3,1,2,0,0,0,0,0,0,0,3,1,3,-3,1,-3],[0,1,-1,0,2,1,-3,3,0,3,0,3,-3,1,1,0,1,1,0,1,-3,3,0,3,0,3,-3,0,2,1,0,1,-1],[-11,6,-5,11,6,5,-12,12,0,12,0,12,-12,4,7,11,6,5,1,4,-11,11,0,11,0,11,-11,11,6,5,-11,6,-5],[0,1,0,0,0,0,-1,1,0,1,0,1,-1,1,1,0,1,0,1,1,-2,2,0,2,0,2,-2,0,0,0,0,2,0],[-3,1,-3,3,0,3,-1,1,0,1,0,1,-1,1,2,3,1,3,2,1,-2,2,0,2,0,2,-2,3,1,3,-3,1,-3],[-3,1,-2,3,1,2,0,0,0,0,0,0,0,3,0,3,1,2,1,1,0,0,0,0,0,0,0,3,1,2,-3,1,-2],[-1,1,-2,1,1,2,0,0,0,0,0,0,0,1,0,1,1,2,1,1,0,0,0,0,0,0,0,1,1,2,-1,1,-2],[-11,6,-5,11,6,5,-11,11,0,11,0,11,-11,4,7,11,6,5,1,4,-7,7,0,7,5,12,-7,11,1,10,-11,6,-5],[0,1,-1,0,2,1,-3,3,0,3,0,3,-3,1,1,0,1,1,0,1,-2,2,0,2,1,3,-2,0,0,0,0,2,1],[-4,4,0,4,4,0,-8,8,0,8,0,8,-8,3,1,4,4,0,4,3,-9,9,0,9,0,9,-9,4,4,0,-4,5,0],[-3,1,-3,3,0,3,-1,1,0,1,0,1,-1,1,2,3,1,3,2,1,-1,1,0,1,0,1,-1,3,0,3,-3,1,-3],[-3,1,-2,3,1,2,0,0,0,0,0,0,0,1,2,3,1,2,0,2,0,0,0,0,0,0,0,3,1,2,-3,1,-2],[-3,1,-3,3,0,3,-1,1,0,1,0,1,-1,1,2,3,1,3,2,1,0,0,0,0,0,0,0,3,1,3,-3,1,-3]],
  fr: [[-3,3,-3,-3,3,0,3,-3,-3,3,0,3,0,3,-3,3,0,3,0,3,0,3,-3,3,0,3,0,3,-3,-2,3,1,3,-2,-3,2,-3],[-3,2,-3,-2,3,0,3,-2,1,2,0,2,0,2,1,3,0,3,0,3,0,3,-2,2,0,2,0,2,-2,-2,3,1,3,-2,-3,1,-3],[-6,0,-6,-3,6,3,6,-3,2,3,0,3,0,3,2,6,0,6,0,6,0,6,-3,3,0,3,0,3,-3,-3,6,3,6,-3,-6,0,-6],[-15,15,-13,-15,15,0,15,-12,5,15,0,15,2,13,5,15,0,15,2,13,1,14,-10,15,0,15,3,12,-9,-10,15,5,10,-5,-15,10,-7],[-3,2,-3,-2,3,0,3,-2,1,2,0,2,0,2,1,3,0,3,0,3,0,3,-2,2,0,2,0,2,-2,-1,3,2,3,-1,-3,0,-3],[-3,3,-3,-3,3,0,3,-3,1,3,0,3,0,3,1,3,0,3,0,3,0,3,-2,3,0,3,0,3,-2,-2,3,1,3,-2,-3,2,-3],[-1,1,-1,-1,1,0,1,-1,-1,1,0,1,0,1,-1,1,0,1,0,1,0,1,-1,1,0,1,0,1,-1,-1,1,0,1,-1,-1,1,-1],[-6,0,-6,-3,6,3,6,-3,-3,3,0,3,0,3,-3,6,0,6,0,6,0,6,2,3,0,3,0,3,2,-3,6,0,6,-3,-6,3,-6],[-35,17,-18,-21,36,15,23,-8,-30,31,1,32,5,37,-2,45,8,37,19,18,1,17,15,23,8,15,23,38,15,-15,45,4,41,-37,-37,19,-18],[-6,1,-5,-3,6,2,5,-3,-3,3,0,3,0,3,-3,6,0,6,1,5,0,5,2,3,0,3,0,3,2,-3,6,2,5,-3,-6,1,-5],[-24,11,-13,10,24,8,16,-6,-3,3,0,3,3,6,-3,11,13,24,11,13,0,13,8,8,0,8,2,6,8,5,24,9,15,-6,-24,11,-13],[-19,2,-17,-9,19,7,17,-9,-9,9,0,9,0,9,-9,19,0,19,2,17,0,17,7,9,2,7,2,9,7,-9,21,6,15,-9,-19,6,-13],[-3,0,-3,-1,3,1,3,0,-1,1,0,1,0,1,-1,3,0,3,0,3,1,2,1,1,0,1,1,0,1,-1,3,0,3,1,-3,1,-2],[-6,2,-4,4,6,2,4,0,0,0,0,0,0,0,0,2,4,6,2,4,0,4,2,2,0,2,2,0,2,2,6,3,3,0,-6,5,-1]]
};
const PAGI = {};
function pagodasOf(kind){ return PAGI[kind] || (PAGI[kind] = (PAGODAS[kind] || []).map(p => Int32Array.from(p))); }
function setPagodas(kind, list){ PAGODAS[kind] = list; delete PAGI[kind]; }
const ORDER = {fn:null};

/* ---------- tabela "de trás para a frente" ----------
   Todas as posições com até K pinos que AINDA terminam com um pino no alvo
   (ou em qualquer casa, alvo = -1), geradas desfazendo pulos a partir do fim.
   Na busca, ao chegar a K pinos basta consultar a tabela: resposta exata. */
const BACK = {};
const KBACK = {en:[9, 7], fr:[8, 6]};          // [com alvo, qualquer casa]
const TWO32 = 4294967296;
const bitOf = (lo, hi, h) => h < 32 ? (lo >>> h) & 1 : (hi >>> (h - 32)) & 1;
function backTable(kind, target){
  const id = kind + ':' + target;
  if(BACK[id]) return BACK[id];
  const G = geo(kind), n = G.n, J = G.J, P2 = G.SW[0];
  const K = KBACK[kind][target >= 0 ? 0 : 1];
  const set = new NumSet(15, 24);
  let layer = [];
  for(let t=0;t<n;t++) if(target < 0 || t === target){ layer.push(P2[t]); set.add(P2[t]); }
  for(let k=2;k<=K;k++){
    const next = [];
    for(let i=0;i<layer.length;i++){
      const s = layer[i], lo = s % TWO32 >>> 0, hi = Math.floor(s / TWO32);
      for(let j=0;j<J.length;j++){
        const m = J[j];   // desfaz o pulo m: o pino de m[2] volta para m[0] e m[1] reaparece
        if(bitOf(lo, hi, m[2]) && !bitOf(lo, hi, m[0]) && !bitOf(lo, hi, m[1])){
          const x = s - P2[m[2]] + P2[m[0]] + P2[m[1]];
          if(!set.has(x)){ set.add(x); next.push(x); }
        }
      }
    }
    layer = next;
  }
  return BACK[id] = {K, set};
}

/* ---------- memórias ---------- */
const DEAD = {};          // 'kind:alvo' → NumSet (posições sem solução, forma canônica)
function deadSet(kind, target){ const k = kind + ':' + target; return DEAD[k] || (DEAD[k] = new NumSet(16, 21)); }
const LINE = new Map();   // 'kind:alvo:posição' → próximo pulo de uma solução já achada
const rawKey = (G, b) => { let s = 0; for(let h=0;h<G.n;h++) if(b[h]) s += G.SW[0][h]; return s; };
function remember(kind, target, pegsIn, moves){
  if(LINE.size > 20000) LINE.clear();
  const G = geo(kind), b = Uint8Array.from(pegsIn);
  for(const m of moves){ LINE.set(kind + ':' + target + ':' + rawKey(G, b), m); b[m[0]] = 0; b[m[1]] = 0; b[m[2]] = 1; }
}
function known(kind, target, pegs){
  const m = LINE.get(kind + ':' + target + ':' + rawKey(geo(kind), pegs));
  return m ? m.slice() : null;
}

/* ---------- busca em profundidade SEM recursão, que pode ser pausada ----------
   job.step(ms) trabalha por até ms milissegundos e devolve 'running', 'ok' ou 'dead'.
   Assim a análise roda aos pouquinhos, sem travar a tela. */
function makeJob1(kind, pegsIn, target, restart){
  const G = geo(kind), n = G.n, J = G.J, nj = J.length;
  const b = Uint8Array.from(pegsIn);
  let pegs = 0; for(let x=0;x<n;x++) pegs += b[x] ? 1 : 0;
  const job = {status:'running', moves:null, nodes:0, proof:'', kind, target};
  const finish = (st, mv, proof) => { job.status = st; job.moves = mv || null; job.proof = proof || ''; job.step = () => job.status; return job; };
  if(pegs === 0) return finish('dead');
  if(pegs === 1) return (target < 0 || b[target]) ? finish('ok', []) : finish('dead');
  // poda por classe (contagem nas diagonais módulo 3)
  const ends = possibleEnds(G, b);
  if(target >= 0 ? !ends.includes(target) : !ends.length) return finish('dead', null, 'classe');
  // simetrias que preservam o alvo (a primeira é a identidade: h[0] = posição crua)
  const syms = [];
  for(let k=0;k<8;k++) if(target < 0 || G.SYM[k][target] === target) syms.push(k);
  const ns = syms.length, SWs = syms.map(k => G.SW[k]);
  const h = new Float64Array(ns);
  for(let i=0;i<ns;i++) for(let x=0;x<n;x++) if(b[x]) h[i] += SWs[i][x];
  // pagodes úteis para esta busca (limiar = valor mínimo do pino final)
  const pg = [], th = [];
  for(const p of pagodasOf(kind)){
    let t = 1e9; for(const e of (target >= 0 ? [target] : ends)) t = Math.min(t, p[e]);
    let neg = 0, cur = 0; for(let x=0;x<n;x++){ if(p[x] < 0) neg += p[x]; if(b[x]) cur += p[x]; }
    if(t <= neg) continue;
    if(cur < t) return finish('dead', null, 'pagode');
    pg.push(p); th.push(t);
  }
  const np = pg.length, PW = new Int32Array(np * n), T = Int32Array.from(th), pv = new Int32Array(np);
  for(let i=0;i<np;i++) for(let x=0;x<n;x++){ PW[i*n+x] = pg[i][x]; if(b[x]) pv[i] += pg[i][x]; }
  const tb = backTable(kind, target), K = tb.K, table = tb.set;
  const dead = deadSet(kind, target);
  const D = pegs + 1;
  const order = new Int32Array(nj * D), score = new Float64Array(nj), cnt = new Int32Array(D), qi = new Int32Array(D), keyAt = new Float64Array(D);
  const nbr = x => { let s = 0; const nb = G.NB[x]; for(let i=0;i<nb.length;i++) s += b[nb[i]]; return s; };
  const ofn = ORDER.fn;
  // ordem dos pulos: primeiro o pino mais longe do alvo (ou do centro)
  const DT = target >= 0 ? G.cells.map(c => Math.abs(Math.floor(c/7) - Math.floor(G.cells[target]/7)) + Math.abs(c%7 - G.cells[target]%7)) : G.CEN;
  let depth = 0, since = 0, restarts = 0, budget = RESTART.base, noise = 0;
  const restartOn = !!restart;

  function doMove(m, sgn){     // sgn = +1 faz o pulo, -1 desfaz
    const a = m[0], o = m[1], c = m[2];
    if(sgn > 0){ b[a] = 0; b[o] = 0; b[c] = 1; } else { b[a] = 1; b[o] = 1; b[c] = 0; }
    for(let i=0;i<ns;i++){ const w = SWs[i]; h[i] += sgn * (w[c] - w[a] - w[o]); }
    for(let i=0, q2=0;i<np;i++, q2+=n) pv[i] += sgn * (PW[q2+c] - PW[q2+a] - PW[q2+o]);
  }
  // entra num nó: 1 = resolvido, 0 = sem saída, 2 = precisa explorar (lances já gerados)
  function enter(){
    const left = pegs - depth;
    if(left <= K) return table.has(h[0]) ? 1 : 0;
    for(let i=0;i<np;i++) if(pv[i] < T[i]) return 0;
    let k = h[0]; for(let i=1;i<ns;i++) if(h[i] < k) k = h[i];
    if(dead.has(k)) return 0;
    keyAt[depth] = k;
    // gera e ordena os pulos: primeiro os que tiram pinos das pontas
    const base = depth * nj; let c = 0;
    for(let j=0;j<nj;j++){
      const m = J[j];
      if(b[m[0]] && b[m[1]] && !b[m[2]]){
        const s = ofn ? ofn(G, m, b, nbr) : DT[m[0]] + (noise ? noise * rnd() : 0);
        let i = c++;
        while(i > 0 && score[i-1] < s){ score[i] = score[i-1]; order[base+i] = order[base+i-1]; i--; }
        score[i] = s; order[base+i] = j;
      }
    }
    cnt[depth] = c; qi[depth] = 0;
    return 2;
  }
  // completa a solução descendo pela tabela
  function success(){
    const out = [];
    for(let d=0;d<depth;d++) out.push(J[order[d*nj + qi[d] - 1]].slice());
    let left = pegs - depth, raw = h[0];
    while(left > 1){
      let found = false;
      for(let j=0;j<nj && !found;j++){
        const m = J[j];
        if(b[m[0]] && b[m[1]] && !b[m[2]]){
          const x = raw - G.SW[0][m[0]] - G.SW[0][m[1]] + G.SW[0][m[2]];
          if(table.has(x)){ b[m[0]] = 0; b[m[1]] = 0; b[m[2]] = 1; raw = x; out.push(m.slice()); left--; found = true; }
        }
      }
      if(!found) break;    // não acontece: a tabela é fechada
    }
    remember(kind, target, pegsIn, out);
    return finish('ok', out);
  }
  const r0 = enter();
  if(r0 === 1) return success();
  if(r0 === 0) return finish('dead', null, 'pagode');

  job.step = function(ms){
    const deadline = now() + ms;
    for(;;){
      if((++job.nodes & 511) === 0 && now() > deadline) return 'running';
      // recomeça de tempos em tempos com outra ordem (as posições sem saída já
      // aprendidas continuam valendo): evita ficar preso numa região ruim
      if(++since > budget && restartOn){
        while(depth > 0){ depth--; doMove(J[order[depth*nj + qi[depth] - 1]], -1); }
        since = 0; budget = RESTART.base * luby(++restarts); noise = RESTART.noise;
        const r = enter();
        if(r === 1){ success(); return 'ok'; }
        if(r === 0){ finish('dead'); return 'dead'; }
      }
      const d = depth;
      if(qi[d] < cnt[d]){
        const m = J[order[d*nj + qi[d]]]; qi[d]++;
        doMove(m, 1); depth++;
        const r = enter();
        if(r === 1){ success(); return 'ok'; }
        if(r === 0){ depth--; doMove(m, -1); }
      } else {
        dead.add(keyAt[d]);
        if(d === 0){ finish('dead'); return 'dead'; }
        depth--;
        doMove(J[order[depth*nj + qi[depth] - 1]], -1);
      }
    }
  };
  return job;
}

// sequência de Luby (1,1,2,1,1,2,4,...) para o tamanho das tentativas
function luby(i){ let k = 1; while((1 << k) - 1 < i) k++; return (1 << k) - 1 === i ? 1 << (k - 1) : luby(i - (1 << (k - 1)) + 1); }
let seed = 12345;
const rnd = () => (seed = (Math.imul(seed, 1103515245) + 12345) & 0x7fffffff) / 0x7fffffff;
const RESTART = {on:true, any:false, base:30000, noise:2.5};

/* Duas buscas revezando (dividem a mesma memória de posições sem saída):
   uma em ordem fixa e outra que recomeça com outra ordem de vez em quando.
   Cada uma é muito melhor que a outra em certas posições; juntas, raramente demoram.
   Para "qualquer casa" vai só a de ordem fixa (prova mais rápido que não tem). */
function makeJob(kind, pegs, target){
  const subs = [makeJob1(kind, pegs, target, false)];
  if(RESTART.on && (target >= 0 || RESTART.any) && subs[0].status === 'running') subs.push(makeJob1(kind, pegs, target, true));
  const job = {status:subs[0].status, moves:subs[0].moves, proof:subs[0].proof, nodes:0};
  if(job.status !== 'running'){ job.step = () => job.status; return job; }
  let turn = 0;
  job.step = function(ms){
    const end = now() + ms;
    for(;;){
      const sj = subs[turn]; turn = (turn + 1) % subs.length;
      const st = sj.step(Math.min(4, Math.max(0.5, end - now())));
      job.nodes = subs.reduce((a, x) => a + x.nodes, 0);
      if(st !== 'running'){ job.status = st; job.moves = sj.moves; job.proof = sj.proof; job.step = () => job.status; return st; }
      if(now() >= end) return 'running';
    }
  };
  return job;
}

/* resolve de uma vez (com limite de tempo): {status:'ok', moves} | {status:'dead'} | {status:'timeout'} */
function solve(kind, pegs, {target = -1, ms = 1500} = {}){
  const job = makeJob(kind, pegs, target);
  const st = job.step(ms);
  return {status: st === 'running' ? 'timeout' : st, moves:job.moves, nodes:job.nodes, proof:job.proof};
}

/* pulos possíveis numa posição (índices de casa) */
function moves(kind, pegs){
  const G = geo(kind), out = [];
  for(const m of G.J) if(pegs[m[0]] && pegs[m[1]] && !pegs[m[2]]) out.push(m.slice());
  return out;
}

/* ---------- análise para a Dica ----------
   Primeiro procura terminar na casa "perfeita"; se isso for impossível, com um pino em
   qualquer casa. analyzer.step(ms) avança; analyzer.result fica pronto no fim:
   {status:'ok', move, perfect, perfectDead} | {status:'dead'} */
function analyzer(kind, pegs, perfect){
  const A = {result:null, work:0};
  let m = perfect >= 0 && known(kind, perfect, pegs);
  if(m){ A.result = {status:'ok', move:m, perfect:true}; A.step = () => A.result; return A; }
  let phase = perfect >= 0 ? 'perfect' : 'any', perfectDead = false;
  A.phase = phase;
  let job = phase === 'perfect' ? makeJob(kind, pegs, perfect) : null;
  const toAny = () => {
    phase = A.phase = 'any'; perfectDead = true;
    const mm = known(kind, -1, pegs);
    if(mm){ A.result = {status:'ok', move:mm, perfect:false, perfectDead}; return; }
    job = makeJob(kind, pegs, -1);
  };
  if(!job) toAny();
  A.step = function(ms){
    const end = now() + ms;
    while(!A.result && now() < end){
      const t0 = now();
      const st = job.step(Math.max(1, end - now()));
      A.work += now() - t0;
      if(st === 'ok') A.result = {status:'ok', move:job.moves[0] || null, perfect: phase === 'perfect', perfectDead, line:job.moves};
      else if(st === 'dead'){ if(phase === 'perfect') toAny(); else A.result = {status:'dead'}; }
    }
    return A.result;
  };
  return A;
}
/* versão síncrona (para testes e para o jogo automático) */
function hint(kind, pegs, perfect, ms = 1500){
  const A = analyzer(kind, pegs, perfect);
  const r = A.step(ms);
  return r || {status:'timeout', move:greedy(kind, pegs)};
}
// lance "razoável" sem busca completa (reserva)
function greedy(kind, pegs){
  const G = geo(kind), ms = moves(kind, pegs);
  if(!ms.length) return null;
  let best = null, bs = -1e9;
  for(const m of ms){
    const b = Uint8Array.from(pegs); b[m[0]] = 0; b[m[1]] = 0; b[m[2]] = 1;
    let iso = 0; for(let x=0;x<G.n;x++) if(b[x] && !G.NB[x].some(y => b[y])) iso++;
    const s = -iso * 3 - G.CEN[m[2]] + moves(kind, b).length * 0.2;
    if(s > bs){ bs = s; best = m; }
  }
  return best;
}
// prepara as tabelas (chamar com folga, ex.: logo depois de abrir o jogo)
function warm(kind, perfect){ backTable(kind, perfect); backTable(kind, -1); }

return {RESTART, geo, solve, makeJob, analyzer, setPagodas, ORDER, hint, moves, greedy, warm, known, classOf, possibleEnds, _dead:DEAD, _back:BACK, _line:LINE, KBACK};
})();
if(typeof module !== 'undefined') module.exports = RestaUmAI;
