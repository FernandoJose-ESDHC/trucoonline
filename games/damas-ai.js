/* =====================================================================
   Motor do bot de damas brasileiras (independente das regras da mesa).
   Faz/desfaz lances no lugar, hash Zobrist + tabela de transposição,
   aprofundamento iterativo com limite de tempo, extensão de capturas
   (captura é obrigatória, então a busca nunca para no meio de uma troca)
   e avaliação com material, avanço, centro, guarda da última linha,
   pedras prestes a virar dama e grande diagonal.
   ===================================================================== */
const DamasAI = (() => {
'use strict';
const CAPT = 9;                       // peça já capturada nesta sequência (continua no tabuleiro como obstáculo)
const b = new Int8Array(64);          // 1 pedra branca, 2 dama branca, -1 pedra vermelha, -2 dama vermelha
let side = 1, quiet = 0;
const NB = new Int8Array(256).fill(-1);
const DR = [-1,-1,1,1], DC = [-1,1,-1,1];
const DARK = [];
for(let s=0;s<64;s++){
  const r = s >> 3, c = s & 7;
  if((r + c) % 2 === 1) DARK.push(s);
  for(let d=0;d<4;d++){ const r2 = r + DR[d], c2 = c + DC[d]; if(r2 >= 0 && r2 < 8 && c2 >= 0 && c2 < 8) NB[s*4+d] = r2*8 + c2; }
}
/* ---------- Zobrist ---------- */
let seed = 0x6C8E9CF5;
const rnd = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return seed | 0; };
const ZL = new Int32Array(5*64), ZH = new Int32Array(5*64);
for(let i=0;i<ZL.length;i++){ ZL[i] = rnd(); ZH[i] = rnd(); }
const ZSL = rnd(), ZSH = rnd();
const zi = v => (v + 2) * 64;         // -2..2 → 0..4
let hLo = 0, hHi = 0;
function computeHash(){
  hLo = 0; hHi = 0;
  for(const s of DARK){ const v = b[s]; if(v){ hLo ^= ZL[zi(v)+s]; hHi ^= ZH[zi(v)+s]; } }
  if(side < 0){ hLo ^= ZSL; hHi ^= ZSH; }
}

/* ---------- geração de lances ---------- */
// lance: {path:[...], taken:[...], from, to}
let capBest = 0;
function dfs(out, cur, king, taken, path){
  let ext = false;
  for(let d=0; d<4; d++){
    if(king){
      let s = NB[cur*4+d];
      while(s >= 0 && b[s] === 0) s = NB[s*4+d];
      if(s < 0) continue;
      const v = b[s];
      if(v === CAPT || v * side > 0) continue;
      let l = NB[s*4+d];
      while(l >= 0 && b[l] === 0){
        ext = true;
        b[s] = CAPT; taken.push(s); path.push(l);
        dfs(out, l, king, taken, path);
        path.pop(); taken.pop(); b[s] = v;
        l = NB[l*4+d];
      }
    } else {
      const s = NB[cur*4+d]; if(s < 0) continue;
      const v = b[s];
      if(v === 0 || v === CAPT || v * side > 0) continue;
      const l = NB[s*4+d]; if(l < 0 || b[l] !== 0) continue;
      ext = true;
      b[s] = CAPT; taken.push(s); path.push(l);
      dfs(out, l, king, taken, path);
      path.pop(); taken.pop(); b[s] = v;
    }
  }
  if(!ext && taken.length){
    if(taken.length > capBest){ capBest = taken.length; out.length = 0; }
    if(taken.length === capBest) out.push({path:path.slice(), taken:taken.slice(), from:path[0], to:cur});
  }
}
function genMoves(){
  const out = [];
  capBest = 0;
  for(const s of DARK){
    const v = b[s]; if(v * side <= 0) continue;
    b[s] = 0;
    dfs(out, s, v === 2 || v === -2, [], [s]);
    b[s] = v;
  }
  if(out.length) return out;
  for(const s of DARK){
    const v = b[s]; if(v * side <= 0) continue;
    if(v === 2 || v === -2){
      for(let d=0;d<4;d++){ let t = NB[s*4+d]; while(t >= 0 && b[t] === 0){ out.push({path:[s,t], taken:[], from:s, to:t}); t = NB[t*4+d]; } }
    } else {
      const d0 = side > 0 ? 0 : 2;
      for(let d=d0; d<d0+2; d++){ const t = NB[s*4+d]; if(t >= 0 && b[t] === 0) out.push({path:[s,t], taken:[], from:s, to:t}); }
    }
  }
  return out;
}
/* ---------- faz / desfaz ---------- */
const stack = [];
function make(m){
  const v = b[m.from];
  const rec = {m, v, caps:m.taken.map(t => b[t]), quiet, hLo, hHi};
  stack.push(rec);
  hLo ^= ZL[zi(v)+m.from]; hHi ^= ZH[zi(v)+m.from];
  b[m.from] = 0;
  for(let i=0;i<m.taken.length;i++){ const t = m.taken[i], tv = b[t]; hLo ^= ZL[zi(tv)+t]; hHi ^= ZH[zi(tv)+t]; b[t] = 0; }
  let nv = v;
  const row = m.to >> 3;
  if(v === 1 && row === 0) nv = 2; else if(v === -1 && row === 7) nv = -2;
  b[m.to] = nv; hLo ^= ZL[zi(nv)+m.to]; hHi ^= ZH[zi(nv)+m.to];
  quiet = (m.taken.length || (v !== 2 && v !== -2)) ? 0 : quiet + 1;
  side = -side; hLo ^= ZSL; hHi ^= ZSH;
}
function unmake(){
  const r = stack.pop(), m = r.m;
  side = -side;
  b[m.to] = 0;
  b[m.from] = r.v;
  for(let i=0;i<m.taken.length;i++) b[m.taken[i]] = r.caps[i];
  quiet = r.quiet; hLo = r.hLo; hHi = r.hHi;
}
/* ---------- avaliação (ponto de vista de quem joga) ---------- */
const CENTER = new Int8Array(64);
for(const s of DARK){ const r = s >> 3, c = s & 7; CENTER[s] = (c >= 2 && c <= 5 ? 4 : 0) + (r >= 2 && r <= 5 ? 3 : 0) + ((c === 0 || c === 7) ? -4 : 0); }
function evaluate(){
  let wm = 0, wk = 0, bm = 0, bk = 0;
  for(const s of DARK){ const v = b[s]; if(v === 1) wm++; else if(v === 2) wk++; else if(v === -1) bm++; else if(v === -2) bk++; }
  const men = wm + bm, total = men + wk + bk;
  const late = total <= 10;
  const advW = late ? 9 : 3;
  let sc = 0;
  for(const s of DARK){
    const v = b[s]; if(!v) continue;
    const r = s >> 3, c = s & 7;
    if(v === 1){
      sc += 100 + (7 - r) * advW + CENTER[s];
      if(r === 7 && !bk && total > 12) sc += (c === 1 || c === 5) ? 12 : 6;      // guarda da última linha
      if(r === 1){ const a = NB[s*4], d = NB[s*4+1]; if((a >= 0 && !b[a]) || (d >= 0 && !b[d])) sc += 30; }
      // pedra apoiada (vizinho atrás) é mais difícil de capturar
      const bl = NB[s*4+2], br = NB[s*4+3];
      if((bl >= 0 && b[bl] > 0) || bl < 0) sc += 2; if((br >= 0 && b[br] > 0) || br < 0) sc += 2;
    } else if(v === -1){
      sc -= 100 + r * advW + CENTER[s];
      if(r === 0 && !wk && total > 12) sc -= (c === 2 || c === 6) ? 12 : 6;
      if(r === 6){ const a = NB[s*4+2], d = NB[s*4+3]; if((a >= 0 && !b[a]) || (d >= 0 && !b[d])) sc -= 30; }
      const fl = NB[s*4], fr = NB[s*4+1];
      if((fl >= 0 && b[fl] < 0) || fl < 0) sc -= 2; if((fr >= 0 && b[fr] < 0) || fr < 0) sc -= 2;
    } else {
      const kv = 310 + (r + c === 7 ? 25 : 0);                                     // dama na grande diagonal
      sc += v > 0 ? kv : -kv;
    }
  }
  // finais só de damas com pouca vantagem são empate na prática
  if(!men){
    const d = Math.abs(wk - bk), weak = Math.min(wk, bk);
    if(weak >= 1 && (weak >= 2 ? d <= 1 : Math.max(wk, bk) <= 3)) sc = sc / 6;
  }
  // com vantagem, trocar peças ajuda (simplificar)
  const mat = (wm + 3*wk) - (bm + 3*bk);
  if(mat) sc += mat * (24 - total) * 1.5;
  return (side > 0 ? sc : -sc) | 0;
}
/* ---------- busca ---------- */
const WIN = 100000, INF = 1e9;
const TTSIZE = 1 << 18, TTMASK = TTSIZE - 1;
const ttKey = new Int32Array(TTSIZE), ttScore = new Int32Array(TTSIZE), ttDepth = new Int8Array(TTSIZE), ttFlag = new Uint8Array(TTSIZE),
      ttBest = new Int16Array(TTSIZE);  // de*64+para do melhor lance
const histT = new Int32Array(64*64);
let nodes = 0, deadline = 0, stopped = false, rootBest = null;
const mkey = m => m.from*64 + m.to;
function search(depth, alpha, beta, ply, qdepth){
  if((++nodes & 1023) === 0 && Date.now() > deadline) stopped = true;
  if(stopped) return 0;
  if(quiet >= 40) return 0;
  if(ply >= 60) return evaluate();
  const ms = genMoves();
  if(!ms.length) return -WIN + ply;
  const forced = ms[0].taken.length > 0;
  if(depth <= 0){
    if(!forced || qdepth >= 12) return evaluate();
    depth = 0; qdepth++;          // capturas pendentes: continua até a troca acabar
  }
  const ti = hLo & TTMASK;
  let ttb = -1;
  if(ttKey[ti] === hHi && ttFlag[ti]){
    ttb = ttBest[ti];
    if(ply && ttDepth[ti] >= depth){
      let s = ttScore[ti]; if(s > WIN - 500) s -= ply; else if(s < -WIN + 500) s += ply;
      const f = ttFlag[ti];
      if(f === 1 || (f === 2 && s >= beta) || (f === 3 && s <= alpha)) return s;
    }
  }
  if(ms.length > 1){
    for(const m of ms) m.o = (mkey(m) === ttb ? 1e9 : 0) + m.taken.length*1e6 + histT[mkey(m)];
    ms.sort((x,y) => y.o - x.o);
  }
  const a0 = alpha;
  let best = -INF, bestM = null;
  for(let i=0;i<ms.length;i++){
    const m = ms[i];
    make(m);
    // lance único (ou captura forçada) não gasta profundidade
    const ext = ms.length === 1 ? 0 : 1;
    let s;
    if(i === 0) s = -search(depth - ext, -beta, -alpha, ply + 1, qdepth);
    else {
      s = -search(depth - ext, -alpha - 1, -alpha, ply + 1, qdepth);
      if(s > alpha && s < beta) s = -search(depth - ext, -beta, -alpha, ply + 1, qdepth);
    }
    unmake();
    if(stopped) return 0;
    if(s > best){ best = s; bestM = m;
      if(s > alpha){ alpha = s; if(ply === 0) rootBest = m;
        if(s >= beta){ if(!m.taken.length) histT[mkey(m)] += depth*depth; break; } } }
  }
  let st = best; if(st > WIN - 500) st += ply; else if(st < -WIN + 500) st -= ply;
  if(ttKey[ti] !== hHi || depth >= ttDepth[ti]){
    ttKey[ti] = hHi; ttScore[ti] = st; ttDepth[ti] = depth; ttBest[ti] = bestM ? mkey(bestM) : -1;
    ttFlag[ti] = best >= beta ? 2 : best > a0 ? 1 : 3;
  }
  return best;
}
/* ---------- interface com o jogo ---------- */
const CODE = {w:1, W:2, b:-1, B:-2};
function load(st){
  b.fill(0);
  for(let i=0;i<64;i++) b[i] = st.b[i] ? CODE[st.b[i]] : 0;
  side = st.turn === 'w' ? 1 : -1; quiet = st.quiet || 0; stack.length = 0;
  computeHash();
}
/* opts: {time, depth, noise} — devolve {path, taken} */
function think(st, opts){
  load(st);
  const ms = genMoves();
  if(!ms.length) return null;
  if(ms.length === 1) return ms[0];
  nodes = 0; stopped = false;
  for(let i=0;i<histT.length;i++) histT[i] >>= 2;
  const t0 = Date.now(); deadline = t0 + opts.time;
  if(opts.noise){
    const sc = ms.map(m => { make(m); const s = -search(opts.depth - 1, -INF, INF, 1, 0); unmake(); return {m, s: s + Math.random()*opts.noise}; });
    sc.sort((x,y) => y.s - x.s);
    return sc[0].m;
  }
  let best = ms[0], bestScore = 0;
  for(let d=1; d<=opts.depth; d++){
    rootBest = null;
    const s = search(d, -INF, INF, 0, 0);
    if(stopped){ if(rootBest && d > 1) best = rootBest; break; }
    if(rootBest){ best = rootBest; bestScore = s; }
    if(Math.abs(s) > WIN - 500) break;
    if(Date.now() - t0 > opts.time * 0.5) break;
  }
  return best;
}
return { think, load, genMoves, make, unmake, evaluate: () => evaluate() };
})();
if(typeof module !== 'undefined') module.exports = DamasAI;
