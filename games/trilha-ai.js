/* =====================================================================
   Motor do bot de Trilha (Moinho / Nine Men's Morris).
   Tabuleiro de 24 casas em bits (casa = anel*8 + k; anel 0 = externo,
   k = 0..7 em sentido horário a partir do canto de cima à esquerda).
   Negamax alfa-beta com janela nula, aprofundamento iterativo com limite
   de tempo, tabela de transposição (chave exata: peças + mãos + vez),
   detecção de repetição e avaliação com material, trilhas, trilhas
   quase formadas (que dá para fechar no próximo lance), mobilidade,
   peças bloqueadas e "trilha dupla" (peça que abre uma trilha e fecha
   outra indo e voltando). O lance inclui a remoção.
   ===================================================================== */
const TrilhaAI = (() => {
'use strict';
/* ---------- geometria ---------- */
const N = 24, ALL = (1 << N) - 1;
const ADJ = new Int32Array(N);                 // máscara de vizinhos
const ADJL = [];                               // lista de vizinhos
const MILLS = [];                              // máscaras das 16 trilhas
const MILLS_OF = [];                           // trilhas que passam por cada casa
for(let i=0;i<N;i++) ADJL.push([]);
const link = (a, b) => { ADJ[a] |= 1 << b; ADJ[b] |= 1 << a; ADJL[a].push(b); ADJL[b].push(a); };
for(let r=0;r<3;r++) for(let k=0;k<8;k++){
  link(r*8 + k, r*8 + (k+1) % 8);
  if(k % 2 && r < 2) link(r*8 + k, (r+1)*8 + k);
}
for(let r=0;r<3;r++) for(let j=0;j<8;j+=2) MILLS.push((1 << (r*8+j)) | (1 << (r*8+j+1)) | (1 << (r*8 + (j+2) % 8)));
for(let k=1;k<8;k+=2) MILLS.push((1 << k) | (1 << (8+k)) | (1 << (16+k)));
for(let i=0;i<N;i++) MILLS_OF.push(MILLS.filter(m => m >> i & 1));
const pc = x => { x = x - ((x >>> 1) & 0x55555555); x = (x & 0x33333333) + ((x >>> 2) & 0x33333333); return (Math.imul((x + (x >>> 4)) & 0x0F0F0F0F, 0x01010101) >>> 24); };
const lowBit = x => 31 - Math.clz32(x & -x);
const formsMill = (own, to) => { for(const m of MILLS_OF[to]) if((own & m) === m) return true; return false; };
function millMask(own){ let r = 0; for(const m of MILLS) if((own & m) === m) r |= m; return r; }
function removable(opp){ const r = opp & ~millMask(opp); return r || opp; }

/* ---------- posição ---------- */
const bb = new Int32Array(2), hand = new Int32Array(2);
let side = 0;
function phaseOf(s){ return hand[s] > 0 ? 0 : pc(bb[s]) <= 3 ? 2 : 1; }   // 0 colocar, 1 mover, 2 voar
// lances: [de, para, remove] codificados num inteiro: ((de+1)*24 + para)*25 + (rem+1)
const enc = (f, t, r) => ((f + 1) * 24 + t) * 25 + (r + 1);
const decF = m => Math.floor(m / 600) - 1, decT = m => Math.floor(m / 25) % 24, decR = m => m % 25 - 1;
function genMoves(buf){
  let n = 0;
  const me = side, op = 1 - side, own = bb[me], opp = bb[op], empty = ALL & ~(own | opp);
  const ph = phaseOf(me), rmAll = opp ? removable(opp) : 0;
  let o = ph === 0 ? 1 : own;
  while(o){
    let f = -1;
    if(ph !== 0){ f = lowBit(o); o &= o - 1; } else o = 0;
    let tg = ph === 1 ? ADJ[f] & empty : empty;
    const base = f >= 0 ? own & ~(1 << f) : own;
    while(tg){
      const t = lowBit(tg); tg &= tg - 1;
      if(rmAll && formsMill(base | (1 << t), t)){
        let rm = rmAll;
        while(rm){ const r = lowBit(rm); rm &= rm - 1; buf[n++] = enc(f, t, r); }
      } else buf[n++] = enc(f, t, -1);
    }
  }
  return n;
}
const undoStack = [];
function make(m){
  const f = decF(m), t = decT(m), r = decR(m), me = side;
  undoStack.push(m);
  if(f < 0) hand[me]--; else bb[me] &= ~(1 << f);
  bb[me] |= 1 << t;
  if(r >= 0) bb[1 - me] &= ~(1 << r);
  side = 1 - side;
}
function unmake(){
  const m = undoStack.pop(), f = decF(m), t = decT(m), r = decR(m);
  side = 1 - side; const me = side;
  bb[me] &= ~(1 << t);
  if(f < 0) hand[me]++; else bb[me] |= 1 << f;
  if(r >= 0) bb[1 - me] |= 1 << r;
}
const total = s => pc(bb[s]) + hand[s];
// chave exata da posição (2 inteiros)
const key1 = () => bb[0] | (hand[0] << 24) | (side << 28);
const key2 = () => bb[1] | (hand[1] << 24);

/* ---------- avaliação ---------- */
const DEG = new Int32Array(N); for(let i=0;i<N;i++) DEG[i] = ADJL[i].length;
function mobility(s){
  const own = bb[s], empty = ALL & ~(bb[0] | bb[1]);
  let n = 0, blocked = 0, o = own;
  while(o){ const f = lowBit(o); o &= o - 1; const k = pc(ADJ[f] & empty); n += k; if(!k) blocked++; }
  return [n, blocked];
}
// lado s: trilhas, quase-trilhas fecháveis, trilhas duplas
function shape(s, ph){
  const own = bb[s], opp = bb[1 - s], empty = ALL & ~(own | opp);
  let mills = 0, open2 = 0, closable = 0, dbl = 0, closeTargets = 0;
  for(const m of MILLS){
    const mo = own & m;
    if(mo === m){ mills++; continue; }
    if(opp & m || pc(mo) !== 2) continue;
    open2++;
    const hole = m & ~mo, h = lowBit(hole);
    // dá para fechar no próximo lance?
    if(ph === 0 || ph === 2){ closable++; closeTargets |= hole; }
    else if(ADJ[h] & own & ~m){
      closable++; closeTargets |= hole;
      // trilha dupla: a peça que fecha esta sai de outra trilha já formada
      let mv = ADJ[h] & own & ~m;
      while(mv){ const p = lowBit(mv); mv &= mv - 1; for(const m2 of MILLS_OF[p]) if((own & m2) === m2){ dbl++; break; } }
    }
  }
  // duas ameaças diferentes ao mesmo tempo (o adversário só tapa uma)
  const forks = pc(closeTargets) >= 2 ? 1 : 0;
  // trilha corrida: peça de uma trilha formada que sai para uma casa vazia e volta,
  // sem que o adversário consiga ocupar a casa que ela deixou
  let run = 0, runFree = 0;
  for(const m of MILLS){
    if((own & m) !== m) continue;
    let ps = m;
    while(ps){ const p = lowBit(ps); ps &= ps - 1;
      if(!(ADJ[p] & empty)) continue;
      run++;
      if(!(ADJ[p] & opp)){ runFree++; break; }
    }
  }
  return {mills, open2, closable, dbl, forks, empty, run, runFree};
}
function evalSide(s, toMove){
  const ph = phaseOf(s);
  const sh = shape(s, ph);
  let v = 150 * total(s) + 14 * sh.mills + 8 * sh.open2;
  if(ph === 0){
    // colocação: casas com mais vizinhos valem mais
    // liberdade: casas vazias vizinhas (quem fica sem espaço é bloqueado na fase de mover)
    const [lib, blk] = mobility(s);
    v += 16 * lib - 45 * blk;
    v += 10 * sh.closable + 22 * sh.dbl + 12 * sh.runFree;
  } else if(ph === 1){
    const [mob, blk] = mobility(s);
    v += 4 * mob - 10 * blk + 20 * sh.closable + 70 * sh.dbl;
    // trilha corrida só é imparável se o adversário não voa nem coloca peças
    if(sh.runFree) v += phaseOf(1 - s) === 1 ? 110 : 20;
    v += 6 * sh.run;
  } else v += 30 * sh.closable;
  // quem não está na vez e tem duas ameaças diferentes ganha uma peça (só dá para tapar uma)
  if(!toMove && sh.forks) v += ph === 2 ? 130 : 95;
  return v;
}
function evaluate(){ return evalSide(side, true) - evalSide(1 - side, false) + 10; }

/* ---------- busca ---------- */
const WIN = 100000, INF = 1e9;
const TTB = 20, TTSIZE = 1 << TTB;
const tK1 = new Int32Array(TTSIZE), tK2 = new Int32Array(TTSIZE), tSc = new Int32Array(TTSIZE),
      tDp = new Int8Array(TTSIZE), tFl = new Uint8Array(TTSIZE), tMv = new Int32Array(TTSIZE);
const hist = new Int32Array(15000);
const MB = [], SB = []; for(let i=0;i<72;i++){ MB.push(new Int32Array(1024)); SB.push(new Int32Array(1024)); }
const pathK1 = new Int32Array(80), pathK2 = new Int32Array(80);
let gameKeys = new Set();
let nodes = 0, deadline = 0, stopped = false;
function isRepeat(ply, k1, k2){
  if(hand[0] || hand[1]) return false;
  for(let p = ply - 2; p >= 0; p -= 2) if(pathK1[p] === k1 && pathK2[p] === k2) return true;
  return gameKeys.has(k1 + ',' + k2);
}
// pega o melhor lance restante (ordenação preguiçosa)
function nextBest(mv, sc, i, n){
  let b = i;
  for(let j=i+1;j<n;j++) if(sc[j] > sc[b]) b = j;
  if(b !== i){ const t = mv[i]; mv[i] = mv[b]; mv[b] = t; const u = sc[i]; sc[i] = sc[b]; sc[b] = u; }
  return mv[i];
}
// quiescência: só lances que fecham trilha (a posição "parada" pode ser avaliada)
function qsearch(alpha, beta, ply, qd){
  if((++nodes & 2047) === 0 && Date.now() > deadline) stopped = true;
  if(stopped) return 0;
  const stand = evaluate();
  if(stand >= beta || qd >= 4 || ply >= 70) return stand;
  if(stand > alpha) alpha = stand;
  const mv = MB[ply], sc = SB[ply];
  const all = genMoves(mv);
  let n = 0;
  for(let i=0;i<all;i++) if(decR(mv[i]) >= 0){ mv[n] = mv[i]; sc[n] = evalRm(mv[i]); n++; }
  if(!n) return stand;
  let best = stand;
  for(let i=0;i<n;i++){
    const m = nextBest(mv, sc, i, n);
    make(m);
    const s = total(side) < 3 ? WIN - ply - 1 : -qsearch(-beta, -alpha, ply + 1, qd + 1);
    unmake();
    if(stopped) return 0;
    if(s > best){ best = s; if(s > alpha){ alpha = s; if(s >= beta) break; } }
  }
  return best;
}
// preferência de remoção: tirar peça adversária que está prestes a fechar trilha ou com mais vizinhos
function evalRm(m){
  const r = decR(m), op = 1 - side, opp = bb[op];
  let v = DEG[r];
  for(const mm of MILLS_OF[r]) if(pc(opp & mm) === 2 && !(bb[side] & mm)) v += 6;
  return v;
}
function search(depth, alpha, beta, ply){
  if((++nodes & 2047) === 0 && Date.now() > deadline) stopped = true;
  if(stopped) return 0;
  const k1 = key1(), k2 = key2();
  pathK1[ply] = k1; pathK2[ply] = k2;
  if(ply && isRepeat(ply, k1, k2)) return 0;
  if(total(side) < 3) return -WIN + ply;
  const mv = MB[ply], sc = SB[ply];
  const n = genMoves(mv);
  if(!n) return -WIN + ply;
  if(depth <= 0 || ply >= 60) return qsearch(alpha, beta, ply, 0);
  const ti = Math.imul(k1 ^ Math.imul(k2, 0x85EBCA6B), 0x9E3779B1) >>> (32 - TTB);
  let ttm = -1;
  if(tFl[ti] && tK1[ti] === k1 && tK2[ti] === k2){
    ttm = tMv[ti];
    if(ply && tDp[ti] >= depth){
      let s = tSc[ti]; if(s > WIN - 500) s -= ply; else if(s < -WIN + 500) s += ply;
      const f = tFl[ti];
      if(f === 1 || (f === 2 && s >= beta) || (f === 3 && s <= alpha)) return s;
    }
  }
  // ordenação: lance da tabela, remoções, histórico
  for(let i=0;i<n;i++){ const m = mv[i]; sc[i] = m === ttm ? 1e9 : decR(m) >= 0 ? 1e6 + evalRm(m) : hist[m]; }
  const a0 = alpha;
  let best = -INF, bestM = mv[0];
  for(let i=0;i<n;i++){
    const m = nextBest(mv, sc, i, n);
    make(m);
    let s;
    if(total(side) < 3) s = WIN - ply - 1;
    else if(i === 0) s = -search(depth - 1, -beta, -alpha, ply + 1);
    else {
      s = -search(depth - 1, -alpha - 1, -alpha, ply + 1);
      if(s > alpha && s < beta) s = -search(depth - 1, -beta, -alpha, ply + 1);
    }
    unmake();
    if(stopped) return 0;
    if(s > best){ best = s; bestM = m;
      if(s > alpha){ alpha = s; if(s >= beta){ if(decR(m) < 0) hist[m] += depth * depth; break; } } }
  }
  let st = best; if(st > WIN - 500) st += ply; else if(st < -WIN + 500) st -= ply;
  if(!tFl[ti] || depth >= tDp[ti] || tK1[ti] !== k1 || tK2[ti] !== k2){
    tK1[ti] = k1; tK2[ti] = k2; tSc[ti] = st; tDp[ti] = depth; tMv[ti] = bestM;
    tFl[ti] = best >= beta ? 2 : best > a0 ? 1 : 3;
  }
  return best;
}

/* ---------- interface com o jogo ----------
   st: {b:[24] (-1 vazio, 0/1 cor), hand:[n0,n1], turn:cor, keys:[chaves já ocorridas]}
   opts: {time, depth, noise} → {from, to, rm} (from = -1 na colocação, rm = -1 sem remoção);
   only: {from, to} limita aos lances com essa origem/destino (para escolher só a remoção) */
function load(st){
  bb[0] = bb[1] = 0;
  for(let i=0;i<N;i++) if(st.b[i] >= 0) bb[st.b[i]] |= 1 << i;
  hand[0] = st.hand[0]; hand[1] = st.hand[1]; side = st.turn; undoStack.length = 0;
}
const posKey = () => key1() + ',' + key2();
function think(st, opts, only){
  load(st);
  gameKeys = new Set(st.keys || []);
  pathK1[0] = key1(); pathK2[0] = key2();
  const rb = new Int32Array(1024); let ms = Array.from(rb.subarray(0, genMoves(rb)));
  if(only) ms = ms.filter(m => decF(m) === only.from && decT(m) === only.to);
  if(!ms.length) return null;
  const out = m => ({from:decF(m), to:decT(m), rm:decR(m)});
  if(ms.length === 1) return out(ms[0]);
  nodes = 0; stopped = false;
  for(let i=0;i<hist.length;i++) hist[i] >>= 2;
  const t0 = Date.now(); deadline = t0 + (opts.time || 1000);
  const maxD = opts.depth || 60;
  // nota de cada lance na raiz
  const rootScore = (m, d, alpha, beta) => {
    make(m);
    let s;
    if(total(side) < 3) s = WIN - 1;
    else s = -search(d - 1, -beta, -alpha, 1);
    unmake();
    return s;
  };
  if(opts.noise){
    const sc = ms.map(m => ({m, s: rootScore(m, maxD, -INF, INF)}));
    const top = Math.max(...sc.map(x => x.s));
    if(top > WIN - 500) return out(sc.find(x => x.s === top).m);
    sc.forEach(x => x.r = x.s + Math.random() * opts.noise);
    sc.sort((a, b) => b.r - a.r);
    return out(sc[0].m);
  }
  let order = ms.slice(), best = ms[0];
  // na colocação, variedade: começa a ordem sorteada (empates ficam com o 1º)
  if(hand[side] >= 8) order.sort(() => Math.random() - .5);
  for(let d=1; d<=maxD; d++){
    let alpha = -INF, bestD = null;
    const scores = new Map();
    for(let i=0;i<order.length;i++){
      const m = order[i];
      let s;
      if(i === 0) s = rootScore(m, d, -INF, INF);
      else {
        s = rootScore(m, d, alpha, alpha + 1);
        if(!stopped && s > alpha) s = rootScore(m, d, alpha, INF);
      }
      if(stopped) break;
      scores.set(m, s);
      if(s > alpha){ alpha = s; bestD = m; }
    }
    if(stopped){ if(bestD != null && bestD !== order[0] && scores.get(bestD) > (scores.has(order[0]) ? scores.get(order[0]) : -INF)) best = bestD; break; }
    if(bestD != null) best = bestD;
    order = [best].concat(order.filter(m => m !== best));
    if(Math.abs(alpha) > WIN - 500) break;
    if(Date.now() - t0 > (opts.time || 1000) * 0.5) break;
  }
  return out(best);
}
// lances legais (para o jogo validar) e chave para repetição
function legal(st){ load(st); const rb = new Int32Array(1024); return Array.from(rb.subarray(0, genMoves(rb))).map(m => ({from:decF(m), to:decT(m), rm:decR(m)})); }
function keyOf(st){ load(st); return posKey(); }
return { think, legal, keyOf, MILLS, ADJL, formsMill, removable, millMask, _stats: () => ({nodes}) };
})();
if(typeof module !== 'undefined') module.exports = TrilhaAI;
