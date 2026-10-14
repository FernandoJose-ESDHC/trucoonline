/* =====================================================================
   Motor do bot de Cinco em Linha (Gomoku) — independente da Mesa.
   - Avaliação por "janelas de 5": cada trecho de 5 casas em linha que só
     tem pedras de uma cor vale VAL[quantidade]. Isso já distingue quatro
     aberto (2 janelas com 4) de quatro fechado (1), três aberto de fechado.
     As somas são mantidas de forma incremental a cada lance.
   - Geração de lances só perto das pedras (até 2 casas), ordenados por
     ataque + defesa; lances forçados (bloquear um quatro) estendem a busca.
   - Negamax alfa-beta com aprofundamento iterativo, tabela de transposição
     (Zobrist) e limite de tempo.
   - VCF (vitória por quatros seguidos): procura uma sequência de quatros
     que o adversário é obrigado a bloquear até virar dois quatros = vitória.
     No Difícil também confere se o lance escolhido não deixa VCF para o outro.
   Casa = linha*N + coluna. Cores: 1 = pretas, 2 = brancas.
   ===================================================================== */
const GomokuAI = (() => {
'use strict';
const VAL = [0, 1, 12, 120, 1400, 0];
const WIN = 1e7;
const DIRS = [[0,1],[1,0],[1,1],[1,-1]];

/* ---------- geometria (cacheada por tamanho) ---------- */
const GEO = {};
function geo(N){
  if(GEO[N]) return GEO[N];
  const NN = N*N, wc = [], cw = Array.from({length:NN}, () => []);
  for(let r=0;r<N;r++) for(let c=0;c<N;c++) for(const [dr,dc] of DIRS){
    const er = r + 4*dr, ec = c + 4*dc;
    if(er < 0 || er >= N || ec < 0 || ec >= N) continue;
    const w = wc.length / 5;
    for(let k=0;k<5;k++){ const i = (r + k*dr)*N + c + k*dc; wc.push(i); cw[i].push(w); }
  }
  const near = [];
  for(let i=0;i<NN;i++){
    const r = i / N | 0, c = i % N, a = [];
    for(let dr=-2;dr<=2;dr++) for(let dc=-2;dc<=2;dc++){
      if(!dr && !dc) continue;
      const rr = r + dr, cc = c + dc;
      if(rr >= 0 && rr < N && cc >= 0 && cc < N) a.push(rr*N + cc);
    }
    near.push(Int16Array.from(a));
  }
  // números aleatórios de Zobrist (duas chaves de 32 bits)
  let seed = 0x9E3779B9 ^ N;
  const rnd = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return seed | 0; };
  const z1 = new Int32Array(NN*3), z2 = new Int32Array(NN*3);
  for(let i=0;i<NN*3;i++){ z1[i] = rnd(); z2[i] = rnd(); }
  return GEO[N] = {N, NN, nW:wc.length/5, wc:Int16Array.from(wc), cw:cw.map(a => Int16Array.from(a)), near, z1, z2};
}

/* ---------- posição ---------- */
function Engine(N, exact){
  const G = geo(N);
  this.G = G; this.N = N; this.exact = !!exact;
  this.b = new Int8Array(G.NN);
  this.cnt = [null, new Int8Array(G.nW), new Int8Array(G.nW)];
  this.sc = [0, 0, 0];          // soma das janelas "vivas" por cor
  this.f4 = [0, 0, 0];          // nº de janelas com 4 da cor e nenhuma do outro
  this.f3 = [0, 0, 0];          // idem com 3 (três que pode virar quatro)
  this.nr = new Int16Array(G.NN);
  this.h1 = 0; this.h2 = 0; this.stones = 0;
  this.mark = new Int32Array(G.NN); this.stamp = 1;
}
Engine.prototype.make = function(i, p){
  const G = this.G, q = 3 - p, cp = this.cnt[p], cq = this.cnt[q], ws = G.cw[i];
  for(let k=0;k<ws.length;k++){
    const w = ws[k], m = cp[w], o = cq[w];
    if(o === 0){ this.sc[p] += VAL[m+1] - VAL[m]; if(m === 3){ this.f4[p]++; this.f3[p]--; } else if(m === 4) this.f4[p]--; else if(m === 2) this.f3[p]++; }
    else if(m === 0){ this.sc[q] -= VAL[o]; if(o === 4) this.f4[q]--; else if(o === 3) this.f3[q]--; }
    cp[w] = m + 1;
  }
  this.b[i] = p; this.stones++;
  const nb = G.near[i]; for(let k=0;k<nb.length;k++) this.nr[nb[k]]++;
  this.h1 ^= G.z1[i*3+p]; this.h2 ^= G.z2[i*3+p];
};
Engine.prototype.unmake = function(i){
  const G = this.G, p = this.b[i], q = 3 - p, cp = this.cnt[p], cq = this.cnt[q], ws = G.cw[i];
  for(let k=0;k<ws.length;k++){
    const w = ws[k], m = cp[w] - 1, o = cq[w];
    cp[w] = m;
    if(o === 0){ this.sc[p] -= VAL[m+1] - VAL[m]; if(m === 3){ this.f4[p]--; this.f3[p]++; } else if(m === 4) this.f4[p]++; else if(m === 2) this.f3[p]--; }
    else if(m === 0){ this.sc[q] += VAL[o]; if(o === 4) this.f4[q]++; else if(o === 3) this.f3[q]++; }
  }
  this.b[i] = 0; this.stones--;
  const nb = G.near[i]; for(let k=0;k<nb.length;k++) this.nr[nb[k]]--;
  this.h1 ^= G.z1[i*3+p]; this.h2 ^= G.z2[i*3+p];
};
// colocar p em i faz cinco? (com "exato", seis ou mais não vale)
Engine.prototype.wins = function(i, p){
  const N = this.N, b = this.b, r0 = i / N | 0, c0 = i % N;
  for(const [dr,dc] of DIRS){
    let n = 1, r = r0 + dr, c = c0 + dc;
    while(r >= 0 && r < N && c >= 0 && c < N && b[r*N+c] === p){ n++; r += dr; c += dc; }
    r = r0 - dr; c = c0 - dc;
    while(r >= 0 && r < N && c >= 0 && c < N && b[r*N+c] === p){ n++; r -= dr; c -= dc; }
    if(this.exact ? n === 5 : n >= 5) return true;
  }
  return false;
};
// casas onde p completa cinco agora (lista sem repetição)
Engine.prototype.winCells = function(p, max){
  const out = [];
  if(!this.f4[p]) return out;
  const G = this.G, cp = this.cnt[p], cq = this.cnt[3-p], b = this.b, st = ++this.stamp;
  for(let w=0;w<G.nW;w++){
    if(cp[w] !== 4 || cq[w] !== 0) continue;
    for(let k=0;k<5;k++){
      const i = G.wc[w*5+k];
      if(b[i] === 0 && this.mark[i] !== st){ this.mark[i] = st; if(this.wins(i, p)){ out.push(i); if(out.length >= max) return out; } }
    }
  }
  return out;
};
// casas candidatas com nota de ataque/defesa para quem joga (p)
Engine.prototype.gen = function(p){
  const G = this.G, NN = G.NN, b = this.b, nr = this.nr, q = 3 - p, cp = this.cnt[p], cq = this.cnt[q];
  const mv = [], sc = [];
  for(let i=0;i<NN;i++){
    if(b[i] !== 0 || nr[i] === 0) continue;
    const ws = G.cw[i]; let att = 0, def = 0;
    for(let k=0;k<ws.length;k++){
      const w = ws[k], m = cp[w], o = cq[w];
      if(o === 0) att += VAL[m+1] - VAL[m];
      else if(m === 0) def += VAL[o+1] - VAL[o];
    }
    mv.push(i); sc.push(att * 1.15 + def);
  }
  return {mv, sc};
};
// quem joga (p) consegue fazer um quatro aberto / quatro duplo agora? (vitória certa se o outro não tem quatro)
Engine.prototype.openFour = function(p){
  if(this.f3[p] < 2) return false;
  const G = this.G, cp = this.cnt[p], cq = this.cnt[3-p], b = this.b, st = ++this.stamp;
  for(let w=0;w<G.nW;w++){
    if(cp[w] !== 3 || cq[w] !== 0) continue;
    for(let k=0;k<5;k++){
      const i = G.wc[w*5+k];
      if(b[i] !== 0 || this.mark[i] === st) continue;
      this.mark[i] = st;
      this.make(i, p); const n = this.winCells(p, 2).length; this.unmake(i);
      if(n >= 2) return true;
    }
  }
  return false;
};
// avaliação para quem joga (p); chamada só quando ninguém tem quatro
Engine.prototype.evalFor = function(p){
  const q = 3 - p;
  if(this.openFour(p)) return WIN / 4;        // faz quatro aberto no próximo lance
  let e = this.sc[p] * 1.2 - this.sc[q];
  if(this.f3[q] >= 4) e -= 300;               // adversário com ameaças duplas
  return e;
};

/* ---------- busca ---------- */
function Search(eng, cfg){
  this.e = eng; this.cfg = cfg; this.tt = new Map(); this.nodes = 0;
  this.t0 = Date.now(); this.stop = false;
}
const ABORT = {};
Search.prototype.timeUp = function(){
  if((++this.nodes & 511) === 0 && Date.now() - this.t0 > this.cfg.time) this.stop = true;
  if(this.stop) throw ABORT;
};
Search.prototype.ordered = function(p, limit){
  const e = this.e, g = e.gen(p), idx = g.mv.map((_, k) => k);
  idx.sort((a, b) => g.sc[b] - g.sc[a]);
  return idx.slice(0, limit).map(k => g.mv[k]);
};
Search.prototype.negamax = function(p, depth, alpha, beta, ply){
  this.timeUp();
  const e = this.e, q = 3 - p;
  if(e.f4[p] && e.winCells(p, 1).length) return WIN - ply;
  if(e.stones >= e.G.NN) return 0;
  const block = e.f4[q] ? e.winCells(q, 2) : [];
  if(block.length >= 2) return -(WIN - ply - 1);
  if(depth <= 0 && !block.length) return e.evalFor(p);
  const a0 = alpha, key = e.h1, ent = this.tt.get(key);
  let ttMove = -1;
  if(ent && ent.k2 === e.h2){
    ttMove = ent.m;
    if(ent.d >= depth){
      if(ent.f === 0) return ent.v;
      if(ent.f === 1 && ent.v >= beta) return ent.v;
      if(ent.f === 2 && ent.v <= alpha) return ent.v;
    }
  }
  let moves, nd = depth - 1;
  if(block.length){ moves = block; if(ply < 24) nd = depth; }        // lance forçado: não gasta profundidade
  else {
    moves = this.ordered(p, depth >= 4 ? this.cfg.k1 : this.cfg.k2);
    if(ttMove >= 0){ const j = moves.indexOf(ttMove); if(j > 0){ moves.splice(j, 1); moves.unshift(ttMove); } }
  }
  let best = -Infinity, bm = moves[0];
  for(const m of moves){
    e.make(m, p);
    let v;
    try{ v = -this.negamax(q, nd, -beta, -alpha, ply + 1); }
    finally{ e.unmake(m); }
    if(v > best){ best = v; bm = m; }
    if(v > alpha) alpha = v;
    if(alpha >= beta) break;
  }
  if(this.tt.size > 400000) this.tt.clear();
  this.tt.set(key, {k2:e.h2, d:depth, v:best, f: best <= a0 ? 2 : best >= beta ? 1 : 0, m:bm});
  return best;
};

/* ---------- VCF: vitória por quatros seguidos ---------- */
function VCF(eng, maxNodes){ this.e = eng; this.nodes = 0; this.max = maxNodes; this.memo = new Map(); }
VCF.prototype.run = function(p, depth){
  const e = this.e, q = 3 - p;
  if(++this.nodes > this.max) return -1;
  const mine = e.winCells(p, 1);
  if(mine.length) return mine[0];
  if(depth <= 0) return -1;
  const theirs = e.winCells(q, 2);
  if(theirs.length >= 2) return -1;
  const key = e.h1 + ':' + e.h2 + ':' + p;
  const old = this.memo.get(key); if(old != null && old >= depth) return -1;
  // casas que fazem quatro: vazias em janelas com 3 minhas e nenhuma do outro
  const G = e.G, cp = e.cnt[p], cq = e.cnt[q], cand = [], st = ++e.stamp;
  if(theirs.length){ cand.push(theirs[0]); }
  else for(let w=0;w<G.nW;w++){
    if(cp[w] !== 3 || cq[w] !== 0) continue;
    for(let k=0;k<5;k++){ const i = G.wc[w*5+k]; if(e.b[i] === 0 && e.mark[i] !== st){ e.mark[i] = st; cand.push(i); } }
  }
  for(const c of cand){
    e.make(c, p);
    const w = e.winCells(p, 2);
    let ok = false;
    if(w.length >= 2) ok = true;
    else if(w.length === 1 && !e.wins(w[0], q)){
      e.make(w[0], q);
      ok = this.run(p, depth - 1) >= 0;
      e.unmake(w[0]);
    }
    e.unmake(c);
    if(ok) return c;
    if(this.nodes > this.max) return -1;
  }
  this.memo.set(key, depth);
  return -1;
};

/* ---------- VCT: vitória por ameaças seguidas (quatros e três abertos) ----------
   Ataque: lance que faz quatro (resposta única) ou que ameaça quatro aberto.
   Defesa contra a ameaça de quatro aberto: qualquer casa das janelas com 3 do
   atacante, ou um quatro do defensor (aí o ataque é considerado fracassado).
   Só devolve vitória se TODAS as defesas perdem — resultado seguro. */
function VCT(eng, maxNodes, maxMs){ this.e = eng; this.nodes = 0; this.max = maxNodes; this.memo = new Map(); this.t0 = Date.now(); this.ms = maxMs || 1e9; }
VCT.prototype.cells = function(p, need){      // casas vazias em janelas com `need` pedras de p e nenhuma do outro
  const e = this.e, G = e.G, cp = e.cnt[p], cq = e.cnt[3-p], out = [], st = ++e.stamp;
  for(let w=0;w<G.nW;w++){
    if(cp[w] !== need || cq[w] !== 0) continue;
    for(let k=0;k<5;k++){ const i = G.wc[w*5+k]; if(e.b[i] === 0 && e.mark[i] !== st){ e.mark[i] = st; out.push(i); } }
  }
  return out;
};
VCT.prototype.run = function(p, depth){
  const e = this.e, q = 3 - p;
  if(++this.nodes > this.max) return -1;
  if((this.nodes & 127) === 0 && Date.now() - this.t0 > this.ms) this.nodes = this.max + 1;
  const mine = e.winCells(p, 1); if(mine.length) return mine[0];
  if(depth <= 0) return -1;
  const theirs = e.winCells(q, 2);
  if(theirs.length >= 2) return -1;
  const key = e.h1 + ':' + e.h2 + ':' + p;
  const old = this.memo.get(key); if(old != null && old >= depth) return -1;
  let cand;
  if(theirs.length) cand = theirs;                         // tem de bloquear; segue se o bloqueio também ameaça
  else {
    const f = this.cells(p, 3), t = this.cells(p, 2), seen = new Set(f);
    cand = f.concat(t.filter(i => !seen.has(i)));
  }
  for(const c of cand){
    e.make(c, p);
    let ok = false;
    const w = e.winCells(p, 2);
    if(w.length >= 2) ok = true;
    else if(w.length === 1){                               // quatro: resposta única
      if(!e.wins(w[0], q)){ e.make(w[0], q); ok = !e.f4[q] || !e.winCells(q, 1).length ? this.run(p, depth - 1) >= 0 : false; e.unmake(w[0]); }
    }
    else if(!e.f4[q] && e.openFour(p)){                   // ameaça de quatro aberto
      const defs = this.cells(p, 3).concat(this.cells(q, 3));
      ok = defs.length > 0;
      for(const d of defs){
        e.make(d, q);
        const r = e.f4[q] && e.winCells(q, 1).length ? -1 : this.run(p, depth - 1);
        e.unmake(d);
        if(r < 0){ ok = false; break; }
        if(this.nodes > this.max){ ok = false; break; }
      }
    }
    e.unmake(c);
    if(ok) return c;
    if(this.nodes > this.max) return -1;
  }
  this.memo.set(key, depth);
  return -1;
};

/* ---------- escolha do lance ---------- */
// b: array N*N (0/1/2); p: cor de quem joga; cfg: {time, depth, k1, k2, vcf, vcfNodes, guard, noise}
function think(b, N, p, exact, cfg){
  const e = new Engine(N, exact), q = 3 - p;
  for(let i=0;i<b.length;i++) if(b[i]) e.make(i, b[i]);
  const center = (N >> 1) * N + (N >> 1);
  if(e.stones === 0) return center;
  if(e.stones === 1 && !b[center]) return center;
  // 1) ganhar já; 2) bloquear o cinco do adversário
  const mine = e.winCells(p, 1); if(mine.length) return mine[0];
  const theirs = e.winCells(q, 2); if(theirs.length) return theirs[0];
  // 3) vitória forçada por quatros
  if(cfg.vcf){
    const r = new VCF(e, cfg.vcfNodes || 20000).run(p, cfg.vcf);
    if(r >= 0) return r;
  }
  // 3b) vitória forçada por ameaças (quatros e três abertos)
  if(cfg.vct){
    const r = new VCT(e, cfg.vctNodes || 20000, cfg.vctMs || 400).run(p, cfg.vct);
    if(r >= 0){ think.info = {vct:true}; return r; }
  }
  // 4) busca alfa-beta com aprofundamento iterativo
  const S = new Search(e, cfg);
  let root = S.ordered(p, cfg.k1 + 4), scores = new Map();
  let bestMove = root[0];
  for(let d = 1; d <= cfg.depth; d++){
    const cur = new Map(); let alpha = -Infinity, bm = -1, bv = -Infinity;
    try{
      for(const m of root){
        e.make(m, p);
        let v;
        try{ v = -S.negamax(q, d - 1, -Infinity, cfg.noise ? Infinity : -alpha, 1); }
        finally{ e.unmake(m); }
        cur.set(m, v);
        if(v > bv){ bv = v; bm = m; }
        if(v > alpha) alpha = v;
      }
    }catch(err){ if(err !== ABORT) throw err; break; }
    scores = cur; bestMove = bm; think.info = {d, bv, nodes:S.nodes};
    root.sort((a, b2) => cur.get(b2) - cur.get(a));
    if(bv >= WIN - 100 || (bv <= -(WIN - 100) && d >= 3)) break;      // resultado já decidido
    if(Date.now() - S.t0 > cfg.time * 0.55) break;                    // próxima iteração não caberia
  }
  // Fácil: escolhe entre lances quase tão bons
  if(cfg.noise && scores.size){
    const bv = scores.get(bestMove);
    if(bv < WIN / 8 && bv > -WIN / 8){
      const ok = root.filter(m => scores.has(m) && scores.get(m) >= bv - cfg.noise);
      if(ok.length) bestMove = ok[Math.floor(Math.random() * ok.length)];
    }
  }
  // 5) Difícil: não deixar vitória forçada (por quatros ou por ameaças) para o adversário
  if(cfg.guard){
    let hit = -1;
    const tryMove = m => {
      e.make(m, p);
      let r = new VCF(e, cfg.guard).run(q, cfg.vcf || 10);
      if(r < 0 && cfg.guardVct) r = new VCT(e, cfg.guardVct, cfg.guardMs || 150).run(q, 8);
      e.unmake(m);
      if(r >= 0 && hit < 0) hit = r;
      return r < 0;
    };
    if(!tryMove(bestMove)){
      const alt = root.filter(m => m !== bestMove).slice(0, 12);
      if(hit >= 0 && !alt.includes(hit) && !e.b[hit]) alt.unshift(hit);   // ocupar a casa-chave do ataque
      for(const m of alt){ if(Date.now() - S.t0 > cfg.time * 1.8) break; if(tryMove(m)){ bestMove = m; break; } }
    }
  }
  return bestMove;
}

return { think, Engine, VCF, VCT };
})();
if(typeof module !== 'undefined') module.exports = GomokuAI;
