/* =====================================================================
   Motor do bot de Reversi (independente das regras da mesa).
   Bitboards com dois inteiros de 32 bits (lo = casas 0..31, hi = 32..63),
   negamax alfa-beta com janela nula (PVS), aprofundamento iterativo,
   limite de tempo e tabela de transposição (chave = o tabuleiro inteiro).
   Avaliação: cantos, casas X e C perigosas, mobilidade, mobilidade
   potencial (fronteira), discos estáveis, paridade e, no fim, peças.
   Com poucas casas vazias faz busca EXATA até o fim (maior saldo de peças).
   Casa = linha*8 + coluna (linha 0 em cima, coluna 0 à esquerda).
   ===================================================================== */
const ReversiAI = (() => {
'use strict';
const INNER = 0x7E7E7E7E;                 // sem as colunas 0 e 7 (evita "dar a volta" na borda)
const NOT_A = 0xFEFEFEFE | 0, NOT_H = 0x7F7F7F7F;
// direções: deslocamento, para a esquerda (<<)?, usa máscara de borda?
const DN = [1, 1, 8, 8, 7, 7, 9, 9];
const DL = [1, 0, 1, 0, 1, 0, 1, 0];
const DM = [1, 1, 0, 0, 1, 1, 1, 1];

let rh = 0, rl = 0;                       // resultado dos deslocamentos
function shl(h, l, n){ rh = (h << n) | (l >>> (32 - n)); rl = l << n; }
function shr(h, l, n){ rl = (l >>> n) | (h << (32 - n)); rh = h >>> n; }
function pop(x){
  x = x - ((x >>> 1) & 0x55555555);
  x = (x & 0x33333333) + ((x >>> 2) & 0x33333333);
  return Math.imul((x + (x >>> 4)) & 0x0F0F0F0F, 0x01010101) >>> 24;
}
const bitIdx = x => 31 - Math.clz32(x & -x);

/* ---------- lances possíveis (resultado em MH, ML) ---------- */
let MH = 0, ML = 0;
function genMoves(ph, pl, oh, ol){
  const eh = ~(ph | oh), el = ~(pl | ol);
  let mh = 0, ml = 0;
  for(let d = 0; d < 8; d++){
    const n = DN[d], left = DL[d];
    const omh = DM[d] ? oh & INNER : oh, oml = DM[d] ? ol & INNER : ol;
    if(left) shl(ph, pl, n); else shr(ph, pl, n);
    let xh = rh & omh, xl = rl & oml;
    for(let k = 0; k < 5; k++){
      if(left) shl(xh, xl, n); else shr(xh, xl, n);
      xh |= rh & omh; xl |= rl & oml;
    }
    if(left) shl(xh, xl, n); else shr(xh, xl, n);
    mh |= rh & eh; ml |= rl & el;
  }
  MH = mh; ML = ml;
}
/* ---------- peças viradas por um lance na casa s (resultado em FH, FL) ---------- */
let FH = 0, FL = 0;
function flips(ph, pl, oh, ol, s){
  let fh = 0, fl = 0;
  const bh = s >= 32 ? 1 << (s - 32) : 0, bl = s < 32 ? 1 << s : 0;
  for(let d = 0; d < 8; d++){
    const n = DN[d], left = DL[d];
    const omh = DM[d] ? oh & INNER : oh, oml = DM[d] ? ol & INNER : ol;
    let th = 0, tl = 0;
    if(left) shl(bh, bl, n); else shr(bh, bl, n);
    let xh = rh, xl = rl;
    while((xh & omh) | (xl & oml)){
      th |= xh; tl |= xl;
      if(left) shl(xh, xl, n); else shr(xh, xl, n);
      xh = rh; xl = rl;
    }
    if((xh & ph) | (xl & pl)){ fh |= th; fl |= tl; }
  }
  FH = fh; FL = fl;
}
/* vizinhança (8 direções) de um conjunto — para fronteira/mobilidade potencial */
let NH = 0, NL = 0;
function neighbors(h, l){
  let nh = 0, nl = 0;
  const ah = h & NOT_H, al = l & NOT_H, bh = h & NOT_A, bl = l & NOT_A;   // podem ir para a direita / esquerda
  shl(ah, al, 1); nh |= rh; nl |= rl;
  shr(bh, bl, 1); nh |= rh; nl |= rl;
  shl(h, l, 8); nh |= rh; nl |= rl;
  shr(h, l, 8); nh |= rh; nl |= rl;
  shl(ah, al, 9); nh |= rh; nl |= rl;
  shr(bh, bl, 9); nh |= rh; nl |= rl;
  shl(bh, bl, 7); nh |= rh; nl |= rl;
  shr(ah, al, 7); nh |= rh; nl |= rl;
  NH = nh; NL = nl;
}

/* ---------- máscaras de casas especiais ---------- */
const bit = s => s >= 32 ? [1 << (s - 32), 0] : [0, 1 << s];
const CORN = [0, 7, 56, 63];
const XSQ = [9, 14, 49, 54];
const CSQ = [[1, 8], [6, 15], [48, 57], [55, 62]];
// bordas: casa sem vizinho na direção (linha 0, linha 7, coluna 0, coluna 7)
const ROW0 = [0, 0xFF], ROW7 = [0xFF000000 | 0, 0], COL0 = [0x01010101, 0x01010101], COL7 = [0x80808080 | 0, 0x80808080 | 0];
const EDGE = [ROW0[0] | ROW7[0] | COL0[0] | COL7[0], ROW0[1] | ROW7[1] | COL0[1] | COL7[1]];
/* discos estáveis de P: não podem mais ser virados. Em cada um dos 4 eixos o disco
   precisa estar protegido: borda ou vizinho estável da mesma cor de um dos lados,
   ou a linha inteira daquele eixo cheia. Itera até estabilizar. */
let fullAx = new Int32Array(8);
function fullLines(fh, fl){
  // linhas horizontais cheias
  let hh = 0, hl = 0;
  for(let r = 0; r < 4; r++){ const m = 0xFF << (r * 8); if((fl & m) === m) hl |= m; if((fh & m) === m) hh |= m; }
  fullAx[0] = hh; fullAx[1] = hl;
  // verticais: AND de todas as linhas
  let v = fl & fh; v &= v >>> 16; v &= v >>> 8; v &= 0xFF; v |= v << 8; v |= v << 16;
  fullAx[2] = v; fullAx[3] = v;
  // diagonais: propaga "tudo cheio até a borda" nos dois sentidos de cada diagonal
  for(let a = 0; a < 2; a++){
    const n = a ? 9 : 7;
    // máscara do resultado para não "dar a volta": <<9 e >>7 não podem cair na coluna 0; <<7 e >>9 na coluna 7
    const mL = a ? NOT_A : NOT_H, mR = a ? NOT_H : NOT_A;
    // C1: casas cheias com tudo cheio para trás (s-n, s-2n, ...) até a borda
    let ch = 0, cl = 0;
    for(let k = 0; k < 8; k++){
      shl(ch, cl, n);
      ch = fh & ((rh & mL) | edgePrev(a, 1, 1)); cl = fl & ((rl & mL) | edgePrev(a, 1, 0));
    }
    // C2: idem para frente (s+n, s+2n, ...)
    let dh = 0, dl = 0;
    for(let k = 0; k < 8; k++){
      shr(dh, dl, n);
      dh = fh & ((rh & mR) | edgePrev(a, 0, 1)); dl = fl & ((rl & mR) | edgePrev(a, 0, 0));
    }
    fullAx[4 + a * 2] = ch & dh; fullAx[5 + a * 2] = cl & dl;
  }
}
/* casas sem vizinho "de trás" numa diagonal: a=0 (passo 7: de cima-direita para baixo-esquerda),
   a=1 (passo 9). fromLeft=1: o vizinho de trás é s-n (deslocamento <<). h=1 → metade alta. */
const EP = (() => {
  const t = new Int32Array(8);
  for(let s = 0; s < 64; s++){
    const r = s >> 3, c = s & 7;
    for(let a = 0; a < 2; a++){
      // passo 7: s-7 = (r-1, c+1); s+7 = (r+1, c-1). passo 9: s-9 = (r-1,c-1); s+9 = (r+1,c+1)
      const back1 = a ? (r - 1 < 0 || c - 1 < 0) : (r - 1 < 0 || c + 1 > 7);   // vizinho s-n fora
      const back0 = a ? (r + 1 > 7 || c + 1 > 7) : (r + 1 > 7 || c - 1 < 0);   // vizinho s+n fora
      const [h, l] = bit(s);
      if(back1){ t[a * 4 + 2] |= h; t[a * 4 + 3] |= l; }
      if(back0){ t[a * 4 + 0] |= h; t[a * 4 + 1] |= l; }
    }
  }
  return t;
})();
function edgePrev(a, fromLeft, hi){ return EP[a * 4 + (fromLeft ? 2 : 0) + (hi ? 0 : 1)]; }

function stableOf(ph, pl, fa){
  // fa: fullAx já calculado para o tabuleiro atual
  let sh = 0, sl = 0;
  for(let it = 0; it < 12; it++){
    // eixo horizontal
    shl(sh & NOT_H, sl & NOT_H, 1); let ah = rh | COL0[0], al = rl | COL0[1];          // vizinho da esquerda estável
    shr(sh & NOT_A, sl & NOT_A, 1); ah |= rh | COL7[0]; al |= rl | COL7[1];             // vizinho da direita estável
    ah |= fa[0]; al |= fa[1];
    // vertical
    shl(sh, sl, 8); let bh = rh | ROW0[0], bl = rl | ROW0[1];
    shr(sh, sl, 8); bh |= rh | ROW7[0]; bl |= rl | ROW7[1];
    bh |= fa[2]; bl |= fa[3];
    // diagonal passo 7
    shl(sh & NOT_A, sl & NOT_A, 7); let ch = rh | EP[2], cl = rl | EP[3];
    shr(sh & NOT_H, sl & NOT_H, 7); ch |= rh | EP[0]; cl |= rl | EP[1];
    ch |= fa[4]; cl |= fa[5];
    // diagonal passo 9
    shl(sh & NOT_H, sl & NOT_H, 9); let dh = rh | EP[6], dl = rl | EP[7];
    shr(sh & NOT_A, sl & NOT_A, 9); dh |= rh | EP[4]; dl |= rl | EP[5];
    dh |= fa[6]; dl |= fa[7];
    const nh = ph & ah & bh & ch & dh, nl = pl & al & bl & cl & dl;
    if(nh === sh && nl === sl) break;
    sh = nh; sl = nl;
  }
  return pop(sh) + pop(sl);
}

/* ---------- avaliação (ponto de vista de quem joga: P) ---------- */
const CORNER_H = (1 << 24) | (1 << 31), CORNER_L = 1 | (1 << 7);
let W = null;                               // pesos (podem variar por nível)
const W_BASE = {corner:80, x:34, c:11, mob:9, mobR:90, pot:3, stab:22, parity:9, disc:2};
function evaluate(ph, pl, oh, ol){
  const eh = ~(ph | oh), el = ~(pl | ol);
  const empties = pop(eh) + pop(el);
  let sc = 0;
  // cantos e casas perigosas ao lado de canto vazio
  for(let k = 0; k < 4; k++){
    const s = CORN[k];
    const hi = s >= 32, m = hi ? 1 << (s - 32) : 1 << s;
    const pC = hi ? ph & m : pl & m, oC = hi ? oh & m : ol & m;
    if(pC){ sc += W.corner; continue; }
    if(oC){ sc -= W.corner; continue; }
    const x = XSQ[k], xm = x >= 32 ? 1 << (x - 32) : 1 << x, xh = x >= 32;
    if(xh ? ph & xm : pl & xm) sc -= W.x; else if(xh ? oh & xm : ol & xm) sc += W.x;
    for(const c of CSQ[k]){
      const cm = c >= 32 ? 1 << (c - 32) : 1 << c, chi = c >= 32;
      if(chi ? ph & cm : pl & cm) sc -= W.c; else if(chi ? oh & cm : ol & cm) sc += W.c;
    }
  }
  // mobilidade
  genMoves(ph, pl, oh, ol); const mp = pop(MH) + pop(ML);
  genMoves(oh, ol, ph, pl); const mo = pop(MH) + pop(ML);
  sc += W.mob * (mp - mo) + ((W.mobR * (mp - mo)) / (mp + mo + 2) | 0);
  // mobilidade potencial: casas vazias vizinhas das peças do adversário
  neighbors(oh, ol); const pp = pop(NH & eh) + pop(NL & el);
  neighbors(ph, pl); const po = pop(NH & eh) + pop(NL & el);
  sc += W.pot * (pp - po);
  // estabilidade (só vale a pena calcular quando há algum canto ocupado)
  const occ = ((ph | oh) & CORNER_H) | ((pl | ol) & CORNER_L);
  if(occ){
    fullLines(~eh, ~el);
    sc += W.stab * (stableOf(ph, pl, fullAx) - stableOf(oh, ol, fullAx));
  }
  // paridade: com número ímpar de casas vazias, quem joga deve fazer o último lance
  if(empties < 24) sc += (empties & 1) ? W.parity : -W.parity;
  // peças: no fim valem; no começo, ter poucas é até melhor
  const dd = (pop(ph) + pop(pl)) - (pop(oh) + pop(ol));
  if(empties < 16) sc += dd * W.disc * (18 - empties) / 3 | 0;
  else if(empties > 40) sc -= dd;
  return sc;
}
const finalScore = (ph, pl, oh, ol) => {
  const d = (pop(ph) + pop(pl)) - (pop(oh) + pop(ol));
  return d > 0 ? WIN + d : d < 0 ? -WIN + d : 0;
};

/* ---------- busca ---------- */
const WIN = 20000, INF = 1e9;
const TTB = 19, TTSIZE = 1 << TTB, TTMASK = TTSIZE - 1;
const ttK = new Int32Array(TTSIZE * 4), ttS = new Int32Array(TTSIZE), ttD = new Int8Array(TTSIZE), ttF = new Uint8Array(TTSIZE), ttM = new Int8Array(TTSIZE);
const hist = new Int32Array(64);
// ordem estática das casas (cantos primeiro, casas X por último)
const SQV = [
  100,-20, 10,  5,  5, 10,-20,100,
  -20,-50, -2, -2, -2, -2,-50,-20,
   10, -2,  1,  1,  1,  1, -2, 10,
    5, -2,  1,  0,  0,  1, -2,  5,
    5, -2,  1,  0,  0,  1, -2,  5,
   10, -2,  1,  1,  1,  1, -2, 10,
  -20,-50, -2, -2, -2, -2,-50,-20,
  100,-20, 10,  5,  5, 10,-20,100];
let nodes = 0, deadline = 0, stopped = false, rootBest = -1;
function ttIndex(ph, pl, oh, ol){
  let h = Math.imul(pl ^ 0x9E3779B9, 0x85EBCA6B) ^ Math.imul(ph ^ 0x7F4A7C15, 0xC2B2AE35);
  h ^= Math.imul(ol ^ 0x165667B1, 0x27D4EB2F) ^ Math.imul(oh ^ 0x61C88647, 0x1B873593);
  h ^= h >>> 15; h = Math.imul(h, 0x2C1B3C6D); h ^= h >>> 12;
  return h & TTMASK;
}
const mvBuf = [];                            // buffers de lances por profundidade
for(let i = 0; i < 80; i++) mvBuf.push({sq:new Int8Array(32), sc:new Int32Array(32)});

function listMoves(ph, pl, oh, ol, ply, ttb){
  genMoves(ph, pl, oh, ol);
  const buf = mvBuf[ply]; let n = 0, mh = MH, ml = ML;
  while(ml){ const b = ml & -ml; const s = 31 - Math.clz32(b); buf.sq[n] = s; buf.sc[n] = (s === ttb ? 1e6 : 0) + SQV[s] * 8 + hist[s]; n++; ml ^= b; }
  while(mh){ const b = mh & -mh; const s = 63 - Math.clz32(b); buf.sq[n] = s; buf.sc[n] = (s === ttb ? 1e6 : 0) + SQV[s] * 8 + hist[s]; n++; mh ^= b; }
  // ordenação por inserção
  for(let i = 1; i < n; i++){
    const s = buf.sq[i], v = buf.sc[i]; let j = i - 1;
    while(j >= 0 && buf.sc[j] < v){ buf.sq[j + 1] = buf.sq[j]; buf.sc[j + 1] = buf.sc[j]; j--; }
    buf.sq[j + 1] = s; buf.sc[j + 1] = v;
  }
  return n;
}
function search(ph, pl, oh, ol, depth, alpha, beta, ply, passed){
  if((++nodes & 1023) === 0 && Date.now() > deadline) stopped = true;
  if(stopped) return 0;
  if(depth <= 0) return evaluate(ph, pl, oh, ol);
  const ti = ttIndex(ph, pl, oh, ol), k4 = ti * 4;
  let ttb = -1;
  if(ttF[ti] && ttK[k4] === pl && ttK[k4 + 1] === ph && ttK[k4 + 2] === ol && ttK[k4 + 3] === oh){
    ttb = ttM[ti];
    if(ply && ttD[ti] >= depth){
      const s = ttS[ti], f = ttF[ti];
      if(f === 1 || (f === 2 && s >= beta) || (f === 3 && s <= alpha)) return s;
    }
  }
  const n = listMoves(ph, pl, oh, ol, ply, ttb);
  if(!n){
    if(passed) return finalScore(ph, pl, oh, ol);
    return -search(oh, ol, ph, pl, depth - 1, -beta, -alpha, ply + 1, true);
  }
  const buf = mvBuf[ply], a0 = alpha;
  let best = -INF, bestS = -1;
  for(let i = 0; i < n; i++){
    const s = buf.sq[i];
    flips(ph, pl, oh, ol, s);
    const bh = s >= 32 ? 1 << (s - 32) : 0, bl = s < 32 ? 1 << s : 0;
    const nph = ph | FH | bh, npl = pl | FL | bl, noh = oh & ~FH, nol = ol & ~FL;
    let v;
    if(i === 0) v = -search(noh, nol, nph, npl, depth - 1, -beta, -alpha, ply + 1, false);
    else {
      v = -search(noh, nol, nph, npl, depth - 1, -alpha - 1, -alpha, ply + 1, false);
      if(v > alpha && v < beta) v = -search(noh, nol, nph, npl, depth - 1, -beta, -alpha, ply + 1, false);
    }
    if(stopped) return 0;
    if(v > best){
      best = v; bestS = s;
      if(v > alpha){ alpha = v; if(ply === 0) rootBest = s;
        if(v >= beta){ hist[s] += depth * depth; break; } }
    }
  }
  if(!ttF[ti] || depth >= ttD[ti]){
    ttK[k4] = pl; ttK[k4 + 1] = ph; ttK[k4 + 2] = ol; ttK[k4 + 3] = oh;
    ttS[ti] = best; ttD[ti] = depth; ttM[ti] = bestS;
    ttF[ti] = best >= beta ? 2 : best > a0 ? 1 : 3;
  }
  return best;
}

/* ---------- fim de jogo: busca exata do saldo de peças ---------- */
const ebuf = [];
for(let i = 0; i < 40; i++) ebuf.push({sq:new Int8Array(32), sc:new Int32Array(32)});
function solve(ph, pl, oh, ol, alpha, beta, ply, passed, empties){
  if((++nodes & 1023) === 0 && Date.now() > deadline) stopped = true;
  if(stopped) return 0;
  genMoves(ph, pl, oh, ol);
  let mh = MH, ml = ML;
  if(!(mh | ml)){
    if(passed){ const d = (pop(ph) + pop(pl)) - (pop(oh) + pop(ol)); return d > 0 ? d + empties : d < 0 ? d - empties : 0; }
    return -solve(oh, ol, ph, pl, -beta, -alpha, ply + 1, true, empties);
  }
  if(empties === 1){
    const s = ml ? 31 - Math.clz32(ml) : 63 - Math.clz32(mh);
    flips(ph, pl, oh, ol, s);
    const f = pop(FH) + pop(FL);
    const d = (pop(ph) + pop(pl)) - (pop(oh) + pop(ol));
    return d + 2 * f + 1;
  }
  const buf = ebuf[ply]; let n = 0;
  const ordered = empties > 6;
  while(ml){ const b = ml & -ml; buf.sq[n++] = 31 - Math.clz32(b); ml ^= b; }
  while(mh){ const b = mh & -mh; buf.sq[n++] = 63 - Math.clz32(b); mh ^= b; }
  if(ordered){
    // "mais rápido primeiro": lances que deixam o adversário com menos opções
    for(let i = 0; i < n; i++){
      const s = buf.sq[i];
      flips(ph, pl, oh, ol, s);
      const bh = s >= 32 ? 1 << (s - 32) : 0, bl = s < 32 ? 1 << s : 0;
      genMoves(oh & ~FH, ol & ~FL, ph | FH | bh, pl | FL | bl);
      buf.sc[i] = -(pop(MH) + pop(ML)) * 16 + SQV[s];
    }
    for(let i = 1; i < n; i++){
      const s = buf.sq[i], v = buf.sc[i]; let j = i - 1;
      while(j >= 0 && buf.sc[j] < v){ buf.sq[j + 1] = buf.sq[j]; buf.sc[j + 1] = buf.sc[j]; j--; }
      buf.sq[j + 1] = s; buf.sc[j + 1] = v;
    }
  }
  let best = -INF;
  for(let i = 0; i < n; i++){
    const s = buf.sq[i];
    flips(ph, pl, oh, ol, s);
    const bh = s >= 32 ? 1 << (s - 32) : 0, bl = s < 32 ? 1 << s : 0;
    const v = -solve(oh & ~FH, ol & ~FL, ph | FH | bh, pl | FL | bl, -beta, -alpha, ply + 1, false, empties - 1);
    if(stopped) return 0;
    if(v > best){ best = v; if(ply === 0) rootBest = s; if(v > alpha){ alpha = v; if(v >= beta) break; } }
  }
  return best;
}

/* ---------- interface com o jogo ---------- */
// st.b: array de 64 com '', 'b', 'w'; me: 'b'|'w'
function boards(b, me){
  let ph = 0, pl = 0, oh = 0, ol = 0;
  for(let s = 0; s < 64; s++){
    if(!b[s]) continue;
    const mine = b[s] === me;
    if(s < 32){ if(mine) pl |= 1 << s; else ol |= 1 << s; }
    else { if(mine) ph |= 1 << (s - 32); else oh |= 1 << (s - 32); }
  }
  return [ph, pl, oh, ol];
}
function rootMoves(ph, pl, oh, ol){
  genMoves(ph, pl, oh, ol);
  const out = []; let mh = MH, ml = ML;
  while(ml){ const b = ml & -ml; out.push(31 - Math.clz32(b)); ml ^= b; }
  while(mh){ const b = mh & -mh; out.push(63 - Math.clz32(b)); mh ^= b; }
  return out;
}
function child(ph, pl, oh, ol, s){
  flips(ph, pl, oh, ol, s);
  const bh = s >= 32 ? 1 << (s - 32) : 0, bl = s < 32 ? 1 << s : 0;
  return [oh & ~FH, ol & ~FL, ph | FH | bh, pl | FL | bl];
}
/* opts: {time, depth, exact (nº de casas vazias para busca exata), noise (margem do Fácil)}
   devolve a casa escolhida (0..63) ou -1 se não houver lance */
function think(b, me, opts){
  W = Object.assign({}, W_BASE, opts.w || {});
  const [ph, pl, oh, ol] = boards(b, me);
  const ms = rootMoves(ph, pl, oh, ol);
  if(!ms.length) return -1;
  if(ms.length === 1) return ms[0];
  const empties = 64 - pop(ph) - pop(pl) - pop(oh) - pop(ol);
  const t0 = Date.now(); deadline = t0 + opts.time; nodes = 0; stopped = false;
  for(let i = 0; i < 64; i++) hist[i] >>= 2;
  // Fácil: nota cada lance com busca rasa e sorteia entre os quase tão bons
  if(opts.noise){
    const sc = ms.map(s => { const c = child(ph, pl, oh, ol, s);
      let v;
      if(empties <= (opts.exact || 0)){ v = -solve(c[0], c[1], c[2], c[3], -INF, INF, 1, false, empties - 1) * 40; }
      else v = -search(c[0], c[1], c[2], c[3], (opts.depth || 3) - 1, -INF, INF, 1, false);
      return {s, v}; });
    const top = Math.max(...sc.map(x => x.v));
    const ok = sc.filter(x => x.v >= top - opts.noise);
    return pick(ok).s;
  }
  let best = ms[0];
  // busca exata no fim do jogo (com limite de tempo; se não terminar, usa a busca normal)
  if(empties <= (opts.exact || 0)){
    deadline = t0 + Math.max(opts.time * 3, 1500);
    rootBest = -1;
    const v = solve(ph, pl, oh, ol, -65, 65, 0, false, empties);
    if(!stopped && rootBest >= 0){ lastInfo = {depth:'exato', score:v, nodes, ms:Date.now() - t0}; return rootBest; }
    stopped = false; deadline = Date.now() + opts.time;
  }
  // aprofundamento iterativo; no começo, desempata ao acaso entre lances iguais
  let bestScore = 0, reached = 0;
  for(let d = 1; d <= (opts.depth || 60); d++){
    rootBest = -1;
    const v = search(ph, pl, oh, ol, d, -INF, INF, 0, false);
    if(stopped){ if(rootBest >= 0 && d > 2) best = rootBest; break; }
    if(rootBest >= 0){ best = rootBest; bestScore = v; reached = d; }
    if(Math.abs(v) >= WIN) break;
    if(d >= empties) break;
    if(Date.now() - t0 > opts.time * 0.45) break;
  }
  lastInfo = {depth:reached, score:bestScore, nodes, ms:Date.now() - t0};
  return best;
}
let lastInfo = null;
const pick = a => a[Math.floor(Math.random() * a.length)];
return { think, boards, genMoves:(ph,pl,oh,ol) => { genMoves(ph,pl,oh,ol); return [MH, ML]; }, flips:(ph,pl,oh,ol,s) => { flips(ph,pl,oh,ol,s); return [FH, FL]; },
  evaluate:(b, me) => { W = Object.assign({}, W_BASE); const x = boards(b, me); return evaluate(x[0], x[1], x[2], x[3]); },
  stable:(b, me) => { const [ph,pl,oh,ol] = boards(b, me); fullLines(ph|oh, pl|ol); return stableOf(ph, pl, fullAx); },
  get info(){ return lastInfo; } };
})();
if(typeof module !== 'undefined') module.exports = ReversiAI;
