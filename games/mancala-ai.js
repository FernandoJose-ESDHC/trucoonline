/* =====================================================================
   Motor do bot de Mancala (Kalah). Independente da Mesa.
   Casas: 0–5 do jogador 0 e depósito 6; 7–12 do jogador 1 e depósito 13.
   Negamax com poda alfa-beta, aprofundamento iterativo com limite de tempo,
   tabela de transposição (hash Zobrist) e ordenação de lances.
   Lance extra (última semente no próprio depósito) NÃO troca de lado:
   o valor do filho é usado sem inverter o sinal.
   ===================================================================== */
const MancalaAI = (() => {
'use strict';
const STORE = [6, 13];
/* ---------- regras rápidas (mesmas do jogo) ---------- */
// semeia a casa i do lado s em p (Int8Array/array de 14). Devolve o próximo a jogar (0/1) ou -1 se acabou.
function play(p, s, i){
  let n = p[i]; p[i] = 0;
  const skip = STORE[1-s];
  let pos = i;
  while(n > 0){ pos = pos === 13 ? 0 : pos + 1; if(pos === skip) continue; p[pos]++; n--; }
  let next = 1 - s;
  if(pos === STORE[s]) next = s;
  else {
    const lo = s ? 7 : 0;
    if(pos >= lo && pos < lo + 6 && p[pos] === 1 && p[12-pos] > 0){   // captura só com sementes do outro lado
      p[STORE[s]] += 1 + p[12-pos]; p[pos] = 0; p[12-pos] = 0;
    }
  }
  // fim: um lado vazio → o outro recolhe o que sobrou
  let a = 0, b = 0;
  for(let k=0;k<6;k++){ a += p[k]; b += p[7+k]; }
  if(a === 0 || b === 0){
    p[6] += a; p[13] += b;
    for(let k=0;k<6;k++){ p[k] = 0; p[7+k] = 0; }
    return -1;
  }
  return next;
}
/* ---------- Zobrist ---------- */
let seed = 0x2F6B1D37;
const rnd = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return seed | 0; };
const MAXC = 100;
const ZL = new Int32Array(14*MAXC), ZH = new Int32Array(14*MAXC);
for(let i=0;i<ZL.length;i++){ ZL[i] = rnd(); ZH[i] = rnd(); }
const ZSL = rnd(), ZSH = rnd();
let hLo = 0, hHi = 0;
function hash(p, s){
  let lo = 0, hi = 0;
  for(let i=0;i<14;i++){ const c = p[i] < MAXC ? p[i] : MAXC-1; lo ^= ZL[i*MAXC + c]; hi ^= ZH[i*MAXC + c]; }
  if(s){ lo ^= ZSL; hi ^= ZSH; }
  hLo = lo; hHi = hi;
}
/* ---------- avaliação (do ponto de vista de s) ---------- */
let TOTAL = 48, HALF = 24, W = {store:100, side:22, cap:28, extra:14};
const WIN = 1000000;
function evaluate(p, s){
  const o = 1 - s, my = STORE[s], op = STORE[o];
  if(p[my] > HALF) return WIN/2 + p[my] - p[op];
  if(p[op] > HALF) return -WIN/2 + p[my] - p[op];
  const lo = s ? 7 : 0, olo = o ? 7 : 0;
  let side = 0, oside = 0, extras = 0, cap = 0, ocap = 0;
  for(let k=0;k<6;k++){
    const i = lo + k, j = olo + k, n = p[i], m = p[j];
    side += n; oside += m;
    if(n === 6 - k || n === 19 - k) extras++;            // cai exatamente no depósito
    // captura possível já (n pequeno, cai numa casa vazia minha com sementes em frente)
    if(n && n < 13){
      let t = i + n; if(t > 12) t = -1;
      if(t >= lo && t < lo + 6 && t !== i && p[t] === 0 && p[12-t] > 0) cap = Math.max(cap, p[12-t] + 1);
    }
    if(m && m < 13){
      let t = j + m; if(o === 0 && t > 5) t = -1; if(o === 1 && t > 12) t = -1;
      if(t >= olo && t < olo + 6 && t !== j && p[t] === 0 && p[12-t] > 0) ocap = Math.max(ocap, p[12-t] + 1);
    }
  }
  // quem tem a vez aproveita a própria captura; a do adversário pesa menos (ainda dá para defender)
  return W.store*(p[my] - p[op]) + W.side*(side - oside) + W.cap*cap - 17*ocap + W.extra*extras;
}
/* ---------- busca ---------- */
const TTSIZE = 1 << 19, TTMASK = TTSIZE - 1;
const ttLo = new Int32Array(TTSIZE), ttHi = new Int32Array(TTSIZE), ttVal = new Int32Array(TTSIZE),
      ttDepth = new Int8Array(TTSIZE).fill(-1), ttFlag = new Uint8Array(TTSIZE), ttMove = new Int8Array(TTSIZE);
const STACK = Array.from({length:128}, () => new Int8Array(14));
let nodes = 0, deadline = 0, stopped = false;
function search(p, s, depth, alpha, beta, ply){
  if((++nodes & 2047) === 0 && Date.now() > deadline) stopped = true;
  if(stopped) return 0;
  if(p[STORE[s]] > HALF) return WIN - ply;
  if(p[STORE[1-s]] > HALF) return -WIN + ply;
  if(depth <= 0 || ply >= 120) return evaluate(p, s);
  hash(p, s);
  const lo0 = hLo, hi0 = hHi, slot = lo0 & TTMASK;
  let ttm = -1;
  if(ttLo[slot] === lo0 && ttHi[slot] === hi0){
    ttm = ttMove[slot];
    if(ttDepth[slot] >= depth){
      const v = ttVal[slot], f = ttFlag[slot];
      if(f === 0) return v;
      if(f === 1 && v >= beta) return v;
      if(f === 2 && v <= alpha) return v;
    }
  }
  // lances, com o da TT primeiro, depois os que dão vez extra, depois capturas
  const lo = s ? 7 : 0, ms = [], sc = [];
  for(let k=5;k>=0;k--){
    const i = lo + k, n = p[i]; if(!n) continue;
    let o = 0;
    if(i === ttm) o = 1000;
    else if(n === 6 - k || n === 19 - k) o = 500 + k;
    else if(n < 13){ const t = i + n; if(t < lo + 6 && p[t] === 0 && p[12-t] > 0) o = 100 + p[12-t]; }
    ms.push(i); sc.push(o);
  }
  for(let a=1;a<ms.length;a++){ const m = ms[a], o = sc[a]; let b = a - 1; while(b >= 0 && sc[b] < o){ ms[b+1] = ms[b]; sc[b+1] = sc[b]; b--; } ms[b+1] = m; sc[b+1] = o; }
  const a0 = alpha, child = STACK[ply];
  let best = -Infinity, bestM = ms[0];
  for(const i of ms){
    child.set(p);
    const nx = play(child, s, i);
    let v;
    if(nx < 0){ const d = child[STORE[s]] - child[STORE[1-s]]; v = d > 0 ? WIN - ply : d < 0 ? -WIN + ply : 0; }
    else if(nx === s) v = search(child, s, depth - 1, alpha, beta, ply + 1);
    else v = -search(child, 1 - s, depth - 1, -beta, -alpha, ply + 1);
    if(stopped) return 0;
    if(v > best){ best = v; bestM = i; }
    if(v > alpha) alpha = v;
    if(alpha >= beta) break;
  }
  ttLo[slot] = lo0; ttHi[slot] = hi0; ttVal[slot] = best; ttDepth[slot] = depth; ttMove[slot] = bestM;
  ttFlag[slot] = best <= a0 ? 2 : best >= beta ? 1 : 0;
  return best;
}
// valor de cada lance na raiz numa profundidade (exact: janela completa para todos, usado pelo Fácil)
function rootScores(p, s, depth, order, exact){
  const out = [];
  let alpha = -Infinity;
  for(const i of order){
    const c = Int8Array.from(p), nx = play(c, s, i);
    let v;
    if(nx < 0){ const d = c[STORE[s]] - c[STORE[1-s]]; v = d > 0 ? WIN : d < 0 ? -WIN : 0; }
    else if(nx === s) v = search(c, s, depth - 1, exact ? -Infinity : alpha, Infinity, 1);
    else v = -search(c, 1 - s, depth - 1, -Infinity, exact ? Infinity : -alpha, 1);
    if(stopped) return null;
    out.push({i, v});
    if(v > alpha) alpha = v;
  }
  return out;
}
/* opts: {time (ms), depth (máx.), noise (margem do Fácil)} → índice da casa */
function think(pits, s, opts){
  const p = Int8Array.from(pits);
  TOTAL = 0; for(let i=0;i<14;i++) TOTAL += p[i]; HALF = TOTAL >> 1;
  const legal = []; for(let k=0;k<6;k++) if(p[(s ? 7 : 0) + k]) legal.push((s ? 7 : 0) + k);
  if(legal.length <= 1) return {move:legal[0], depth:0, score:0};
  const t0 = Date.now(); deadline = t0 + (opts.time || 800); stopped = false; nodes = 0;
  const maxD = opts.depth || 60;
  let best = null, bestD = 0, scores = null, order = legal.slice().reverse(), hope = null, hopeScores = null;
  for(let d=1; d<=maxD; d++){
    const r = rootScores(p, s, d, order, !!opts.noise);
    if(!r) break;
    scores = r; bestD = d;
    r.sort((a,b) => b.v - a.v); best = r[0]; order = r.map(x => x.i);
    if(best.v > -WIN/2){ hope = best; hopeScores = r; }  // último lance "com esperança"
    if(Math.abs(best.v) >= WIN - 200) break;            // vitória/derrota forçada já vista
    if(Date.now() - t0 > (opts.time || 800) * 0.45) break; // a próxima iteração não caberia
  }
  if(!best) return {move:legal[0], depth:0, score:0};
  // derrota forçada contra jogo perfeito: joga o que parecia melhor antes de ver a derrota
  // (o adversário pode errar; entregar os pontos "do jeito mais lento" costuma ser pior)
  if(best.v <= -WIN/2 && hope){ best = hope; scores = hopeScores; }
  let move = best.i;
  if(opts.noise && scores.length > 1){                  // Fácil: escolhe entre os quase tão bons
    const ok = scores.filter(x => x.v >= best.v - opts.noise && Math.abs(x.v) < WIN/4);
    if(ok.length) move = ok[Math.floor(Math.random()*ok.length)].i;
  }
  return {move, depth:bestD, score:best.v, nodes};
}
return { think, play, evaluate, W };
})();
