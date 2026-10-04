/* =====================================================================
   Go — motor de regras + bot (Monte Carlo Tree Search).
   Tabuleiro com borda (lado N+2), tabelas tipadas e cadeias com
   "pseudo-liberdades" (contagem, soma e soma dos quadrados das posições das
   liberdades), o que permite saber em O(1) se uma cadeia foi capturada ou
   está em atari. Hash Zobrist para o superko posicional.
   Bot: UCT + RAVE (AMAF) com valores iniciais heurísticos (capturar, salvar
   atari, não se auto-atarir, evitar a 1ª linha no começo) e simulações
   rápidas com padrões simples (salvar/capturar em atari perto do último
   lance, não encher o próprio olho, não se auto-atarir).
   ===================================================================== */
const GoAI = (() => {
'use strict';
const EMPTY = 0, BLACK = 1, WHITE = 2, EDGE = 3;
const MAXW = 21, MAXS = MAXW * MAXW;

/* ---------- números aleatórios rápidos (xorshift) ---------- */
let rs = (Date.now() ^ 0x9E3779B9) | 0 || 1;
const rnd = () => { rs ^= rs << 13; rs ^= rs >>> 17; rs ^= rs << 5; return (rs >>> 0) / 4294967296; };
/* ---------- Zobrist (semente fixa: o hash é o mesmo em todo navegador) ---------- */
let zs = 0x2545F491;
const zr = () => { zs ^= zs << 13; zs ^= zs >>> 17; zs ^= zs << 5; return zs | 0; };
const Z1 = new Int32Array(3 * MAXS), Z2 = new Int32Array(3 * MAXS);
for(let i=0;i<Z1.length;i++){ Z1[i] = zr(); Z2[i] = zr(); }

/* ---------- padrões 3×3 (estilo MoGo/Michi) em volta do último lance ----------
   X/O = pedras (qualquer cor, a tabela inclui a troca de cores), x = "não X",
   o = "não O", . = vazio, ' ' = borda, ? = qualquer coisa. Centro sempre vazio. */
const PAT_SRC = [
  ['XOX', '...', '???'],   // hane que envolve
  ['XO.', '...', '?.?'],   // hane sem corte
  ['XO?', 'X..', 'x.?'],   // magari
  ['.O.', 'X..', '...'],   // encosto na diagonal
  ['XO?', 'O.o', '?o?'],   // corte desprotegido
  ['XO?', 'O.X', '???'],   // corte espiado
  ['?X?', 'O.O', 'ooo'],   // corte
  ['OX?', 'o.O', '???'],   // corte em keima
  ['X.?', 'O.?', '   '],   // borda: perseguir
  ['OX?', 'X.O', '   '],   // borda: bloquear corte
  ['?X?', 'x.O', '   '],   // borda: bloquear ligação
  ['?XO', 'x.x', '   '],   // borda: sagari
  ['?OX', 'X.O', '   ']    // borda: cortar
];
const PAT = new Uint8Array(65536);
(function(){
  const rot = p => [p[2][0]+p[1][0]+p[0][0], p[2][1]+p[1][1]+p[0][1], p[2][2]+p[1][2]+p[0][2]];
  const vf = p => [p[2], p[1], p[0]], hf = p => p.map(l => l.split('').reverse().join(''));
  const sw = p => p.map(l => l.replace(/[XxOo]/g, c => ({X:'O', x:'o', O:'X', o:'x'})[c]));
  const SETS = {'.':[0], 'X':[1], 'O':[2], ' ':[3], 'x':[0,2,3], 'o':[0,1,3], '?':[0,1,2,3]};
  const ORDER = [[0,0],[0,1],[0,2],[1,0],[1,2],[2,0],[2,1],[2,2]];   // NO, N, NE, O, L, SO, S, SE
  for(const p0 of PAT_SRC) for(const p1 of [p0, rot(p0)]) for(const p2 of [p1, vf(p1)]) for(const p3 of [p2, hf(p2)]) for(const p of [p3, sw(p3)]){
    (function exp(i, code){
      if(i === 8){ PAT[code] = 1; return; }
      const [r, c] = ORDER[i];
      for(const v of SETS[p[r][c]]) exp(i + 1, code | (v << (2*i)));
    })(0, 0);
  }
})();

// registro de lances de uma simulação (para o AMAF)
const CAND = new Int16Array(32);
const LOGP = new Int16Array(4000), LOGC = new Uint8Array(4000);
let logN = 0;

class Board {
  constructor(N){
    this.N = N; this.W = N + 2; const S = this.S = this.W * this.W;
    this.b = new Uint8Array(S); this.head = new Int16Array(S); this.next = new Int16Array(S);
    this.lc = new Int32Array(S); this.ls = new Int32Array(S); this.ls2 = new Int32Array(S); this.sz = new Int16Array(S);
    this.emp = new Int16Array(S); this.epos = new Int16Array(S); this.ne = 0;
    this.mark = new Int32Array(S); this.stamp = 1;
    this.clear();
  }
  clear(){
    const {W, b} = this;
    b.fill(EDGE); this.ne = 0;
    for(let r=1;r<=this.N;r++) for(let c=1;c<=this.N;c++){ const p = r*W + c; b[p] = EMPTY; this.addEmpty(p); }
    this.turn = BLACK; this.ko = -1; this.last = -1; this.last2 = -1; this.passes = 0; this.h1 = 0; this.h2 = 0;
    this.caps = [0, 0, 0];
  }
  copyFrom(o){
    this.b.set(o.b); this.head.set(o.head); this.next.set(o.next); this.lc.set(o.lc); this.ls.set(o.ls); this.ls2.set(o.ls2);
    this.sz.set(o.sz); this.emp.set(o.emp); this.epos.set(o.epos); this.ne = o.ne;
    this.turn = o.turn; this.ko = o.ko; this.last = o.last; this.last2 = o.last2; this.passes = o.passes; this.h1 = o.h1; this.h2 = o.h2;
    this.caps = o.caps.slice();
  }
  addEmpty(p){ this.epos[p] = this.ne; this.emp[this.ne++] = p; }
  delEmpty(p){ const i = this.epos[p], q = this.emp[--this.ne]; this.emp[i] = q; this.epos[q] = i; }
  // ponto (r,c) 0-based <-> posição interna
  pt(i){ const N = this.N; return ((i / N | 0) + 1) * this.W + (i % N) + 1; }
  ix(p){ return ((p / this.W | 0) - 1) * this.N + (p % this.W) - 1; }
  // carrega um tabuleiro (array N*N com 0/1/2)
  load(arr, turn){
    this.clear();
    const {b, head, next, sz, W} = this;
    for(let i=0;i<arr.length;i++) if(arr[i]){ const p = this.pt(i); b[p] = arr[i]; this.delEmpty(p); this.h1 ^= Z1[arr[i]*MAXS + p]; this.h2 ^= Z2[arr[i]*MAXS + p]; head[p] = -1; }
    for(let i=0;i<arr.length;i++){
      const p0 = this.pt(i);
      if(!arr[i] || head[p0] !== -1) continue;
      // monta a cadeia por busca em largura
      const c = b[p0], st = [p0], stones = [];
      head[p0] = p0;
      while(st.length){
        const p = st.pop(); stones.push(p);
        for(const q of [p-W, p-1, p+1, p+W]) if(b[q] === c && head[q] === -1){ head[q] = p0; st.push(q); }
      }
      for(let k=0;k<stones.length;k++) next[stones[k]] = stones[(k+1) % stones.length];
      sz[p0] = stones.length; this.lc[p0] = 0; this.ls[p0] = 0; this.ls2[p0] = 0;
      for(const p of stones) for(const q of [p-W, p-1, p+1, p+W]) if(b[q] === EMPTY) this.addLib(p0, q);
    }
    this.turn = turn || BLACK;
  }
  toArray(){ const out = new Array(this.N*this.N); for(let i=0;i<out.length;i++) out[i] = this.b[this.pt(i)]; return out; }
  hash(){ return (this.h1 >>> 0).toString(36) + '.' + (this.h2 >>> 0).toString(36); }

  addLib(h, p){ this.lc[h]++; this.ls[h] += p; this.ls2[h] += p*p; }
  remLib(h, p){ this.lc[h]--; this.ls[h] -= p; this.ls2[h] -= p*p; }
  inAtari(h){ const n = this.lc[h]; return n > 0 && this.ls[h] * this.ls[h] === n * this.ls2[h]; }
  atariLib(h){ return this.ls[h] / this.lc[h]; }
  onlyLibIs(h, p){ const n = this.lc[h]; return n > 0 && this.ls[h] === p*n && this.ls2[h] === p*p*n; }

  isLegal(p, c){
    const b = this.b;
    if(b[p] !== EMPTY || p === this.ko) return false;
    const W = this.W, o = 3 - c, head = this.head;
    if(b[p-W] === EMPTY || b[p-1] === EMPTY || b[p+1] === EMPTY || b[p+W] === EMPTY) return true;
    for(let d=0; d<4; d++){
      const q = p + (d === 0 ? -W : d === 1 ? -1 : d === 2 ? 1 : W), v = b[q];
      if(v === c){ if(!this.onlyLibIs(head[q], p)) return true; }
      else if(v === o){ if(this.onlyLibIs(head[q], p)) return true; }
    }
    return false;
  }
  merge(a, c){
    const {head, next} = this;
    if(this.sz[a] < this.sz[c]){ const t = a; a = c; c = t; }
    let s = c; do { head[s] = a; s = next[s]; } while(s !== c);
    const t = next[a]; next[a] = next[c]; next[c] = t;
    this.sz[a] += this.sz[c]; this.lc[a] += this.lc[c]; this.ls[a] += this.ls[c]; this.ls2[a] += this.ls2[c];
    return a;
  }
  removeChain(h){
    const {b, next, head, W} = this, c = b[h];
    let s = h, n = 0;
    do { b[s] = EMPTY; this.addEmpty(s); this.h1 ^= Z1[c*MAXS + s]; this.h2 ^= Z2[c*MAXS + s]; n++; s = next[s]; } while(s !== h);
    s = h;
    do {
      for(let d=0; d<4; d++){
        const q = s + (d === 0 ? -W : d === 1 ? -1 : d === 2 ? 1 : W), v = b[q];
        if(v === BLACK || v === WHITE) this.addLib(head[q], s);
      }
      s = next[s];
    } while(s !== h);
    return n;
  }
  // joga (o lance já precisa ser legal); devolve o nº de pedras capturadas
  play(p, c){
    const {b, head, W} = this, o = 3 - c;
    this.delEmpty(p);
    b[p] = c; head[p] = p; this.next[p] = p; this.sz[p] = 1; this.lc[p] = 0; this.ls[p] = 0; this.ls2[p] = 0;
    this.h1 ^= Z1[c*MAXS + p]; this.h2 ^= Z2[c*MAXS + p];
    for(let d=0; d<4; d++){
      const q = p + (d === 0 ? -W : d === 1 ? -1 : d === 2 ? 1 : W), v = b[q];
      if(v === EMPTY) this.addLib(p, q); else if(v !== EDGE) this.remLib(head[q], p);
    }
    for(let d=0; d<4; d++){
      const q = p + (d === 0 ? -W : d === 1 ? -1 : d === 2 ? 1 : W);
      if(b[q] === c && head[q] !== head[p]) this.merge(head[p], head[q]);
    }
    let cap = 0, capPt = -1;
    for(let d=0; d<4; d++){
      const q = p + (d === 0 ? -W : d === 1 ? -1 : d === 2 ? 1 : W);
      if(b[q] === o && this.lc[head[q]] === 0){ cap += this.removeChain(head[q]); capPt = q; }
    }
    const h = head[p];
    this.ko = (cap === 1 && this.sz[h] === 1 && this.lc[h] === 1) ? capPt : -1;
    this.caps[c] += cap;
    this.turn = o; this.last2 = this.last; this.last = p; this.passes = 0;
    return cap;
  }
  pass(){ this.turn = 3 - this.turn; this.ko = -1; this.last2 = this.last; this.last = -1; this.passes++; }

  // "olho" do jogador c: os 4 vizinhos são dele (ou borda) e não é olho falso
  isEye(p, c){
    const b = this.b, W = this.W;
    let v;
    if(((v = b[p-W]) !== c && v !== EDGE) || ((v = b[p-1]) !== c && v !== EDGE) || ((v = b[p+1]) !== c && v !== EDGE) || ((v = b[p+W]) !== c && v !== EDGE)) return false;
    const o = 3 - c;
    let bad = 0, edge = 0;
    if((v = b[p-W-1]) === EDGE) edge = 1; else if(v === o) bad++;
    if((v = b[p-W+1]) === EDGE) edge = 1; else if(v === o) bad++;
    if((v = b[p+W-1]) === EDGE) edge = 1; else if(v === o) bad++;
    if((v = b[p+W+1]) === EDGE) edge = 1; else if(v === o) bad++;
    return bad + edge < 2;
  }
  // liberdades reais da cadeia h (conta até max)
  libs(h, max){
    const {b, next, W} = this, st = ++this.stamp, m = this.mark;
    let n = 0, s = h;
    do {
      for(let d=0; d<4; d++){
        const q = s + (d === 0 ? -W : d === 1 ? -1 : d === 2 ? 1 : W);
        if(b[q] === EMPTY && m[q] !== st){ m[q] = st; if(++n >= max) return n; }
      }
      s = next[s];
    } while(s !== h);
    return n;
  }
  // depois de jogar em p, a cadeia de c fica com 1 liberdade (sem capturar nada)?
  selfAtari(p, c){
    const {b, head, W} = this, o = 3 - c;
    let ne = 0, e1 = -1, fr = 0;
    for(let d=0; d<4; d++){
      const q = p + (d === 0 ? -W : d === 1 ? -1 : d === 2 ? 1 : W), v = b[q];
      if(v === EMPTY){ if(++ne >= 2) return false; e1 = q; }
      else if(v === o){ if(this.inAtari(head[q])) return false; }
      else if(v === c) fr++;
    }
    if(!fr) return true;
    const st = ++this.stamp, m = this.mark;
    m[p] = st; let n = 0;
    if(e1 >= 0){ m[e1] = st; n = 1; }
    for(let d=0; d<4; d++){
      const q = p + (d === 0 ? -W : d === 1 ? -1 : d === 2 ? 1 : W);
      if(b[q] !== c) continue;
      const h = head[q];
      if(this.lc[h] >= 6 && !this.inAtari(h) && this.lc[h] > 8) return false;   // cadeia folgada
      let s = h;
      do {
        for(let e=0; e<4; e++){
          const x = s + (e === 0 ? -W : e === 1 ? -1 : e === 2 ? 1 : W);
          if(b[x] === EMPTY && m[x] !== st){ m[x] = st; if(++n >= 2) return false; }
        }
        s = this.next[s];
      } while(s !== h);
    }
    return true;
  }
  // tamanho da cadeia que ficaria em auto-atari (para decidir se é aceitável)
  groupSizeAfter(p, c){
    const {b, head, W} = this; let n = 1, h0 = -1, h1 = -1, h2 = -1;
    for(let d=0; d<4; d++){
      const q = p + (d === 0 ? -W : d === 1 ? -1 : d === 2 ? 1 : W);
      if(b[q] !== c) continue;
      const h = head[q]; if(h === h0 || h === h1 || h === h2) continue;
      if(h0 < 0) h0 = h; else if(h1 < 0) h1 = h; else h2 = h;
      n += this.sz[h];
    }
    return n;
  }
  // captura alguma cadeia adversária vizinha da cadeia h que esteja em atari
  captureNeighbor(h, c){
    const {b, head, next, W} = this, o = 3 - c;
    let s = h;
    do {
      for(let d=0; d<4; d++){
        const q = s + (d === 0 ? -W : d === 1 ? -1 : d === 2 ? 1 : W);
        if(b[q] === o && this.inAtari(head[q])){ const l = this.atariLib(head[q]); if(this.isLegal(l, c)) return l; }
      }
      s = next[s];
    } while(s !== h);
    return -1;
  }
  // código da vizinhança 3×3 do ponto p (para a tabela PAT)
  pat3(p){
    const b = this.b, W = this.W;
    return b[p-W-1] | b[p-W] << 2 | b[p-W+1] << 4 | b[p-1] << 6 | b[p+1] << 8 | b[p+W-1] << 10 | b[p+W] << 12 | b[p+W+1] << 14;
  }
  /* lance da simulação rápida */
  policy(c){
    const {b, head, W} = this, o = 3 - c, last = this.last;
    if(last > 0){
      // 1) cadeias minhas em atari perto do último lance: capturar quem ataca ou fugir
      for(let d=0; d<4; d++){
        const q = last + (d === 0 ? -W : d === 1 ? -1 : d === 2 ? 1 : W);
        if(b[q] !== c) continue;
        const h = head[q]; if(!this.inAtari(h)) continue;
        const cap = this.captureNeighbor(h, c); if(cap > 0) return cap;
        const l = this.atariLib(h);
        if(this.isLegal(l, c) && !this.selfAtari(l, c)){
          // foge com prioridade se ganhar liberdades de verdade (na escada perdida, só às vezes)
          let e = 0; if(b[l-W] === EMPTY) e++; if(b[l-1] === EMPTY) e++; if(b[l+1] === EMPTY) e++; if(b[l+W] === EMPTY) e++;
          if(e >= 2 || rnd() < 0.5) return l;
        }
      }
      // 2) capturar a pedra que acabou de ser jogada (ou vizinhas) em atari
      if(b[last] === o && this.inAtari(head[last])){ const l = this.atariLib(head[last]); if(rnd() < 0.9 && this.isLegal(l, c)) return l; }
      for(let d=0; d<4; d++){
        const q = last + (d === 0 ? -W : d === 1 ? -1 : d === 2 ? 1 : W);
        if(b[q] === o && this.inAtari(head[q])){ const l = this.atariLib(head[q]); if(rnd() < 0.7 && this.isLegal(l, c)) return l; }
      }
    }
    // 3) padrões 3×3 em volta dos dois últimos lances
    if(last > 0 && rnd() < 0.95){
      let n = 0;
      for(const L of [last, this.last2]){
        if(L <= 0) continue;
        for(let d=0; d<8; d++){
          const q = L + (d === 0 ? -W-1 : d === 1 ? -W : d === 2 ? -W+1 : d === 3 ? -1 : d === 4 ? 1 : d === 5 ? W-1 : d === 6 ? W : W+1);
          if(b[q] !== EMPTY || !PAT[this.pat3(q)]) continue;
          if(!this.isLegal(q, c) || this.selfAtari(q, c)) continue;
          CAND[n++] = q;
        }
      }
      if(n) return CAND[(rnd() * n) | 0];
    }
    // 4) aleatório: legal, sem encher o próprio olho e sem auto-atari
    const ne = this.ne; if(!ne) return -1;
    let i = (rnd() * ne) | 0;
    for(let k=0;k<ne;k++, i++){
      if(i >= ne) i = 0;
      const p = this.emp[i];
      if(p === this.ko || this.isEye(p, c) || !this.isLegal(p, c)) continue;
      if(this.selfAtari(p, c) && (this.groupSizeAfter(p, c) > 1 || rnd() < 0.85)) continue;
      return p;
    }
    return -1;
  }
  // simulação até o fim; devolve o vencedor (contagem por área)
  playout(komi, own){
    let moves = 0; const limit = this.N * this.N * 3;
    while(this.passes < 2 && moves++ < limit){
      const c = this.turn, p = this.policy(c);
      if(p < 0) this.pass();
      else { this.play(p, c); if(logN < LOGP.length){ LOGP[logN] = p; LOGC[logN++] = c; } }
    }
    return this.areaWinner(komi, own);
  }
  // contagem simples por área (pontos vazios cercados só por uma cor)
  areaWinner(komi, own){
    const {b, W, N} = this;
    let sc = -komi;
    for(let r=1;r<=N;r++) for(let c=1;c<=N;c++){
      const p = r*W + c; let v = b[p];
      if(v === EMPTY){
        let bl = 0, wh = 0;
        for(const q of [p-W, p-1, p+1, p+W]){ if(b[q] === BLACK) bl = 1; else if(b[q] === WHITE) wh = 1; }
        v = bl && !wh ? BLACK : wh && !bl ? WHITE : 0;
      }
      if(v === BLACK) sc++; else if(v === WHITE) sc--;
      if(own && v) own[p] += v === BLACK ? 1 : -1;
    }
    return sc > 0 ? BLACK : WHITE;
  }
}

/* ----------------------------- MCTS ----------------------------- */
class Node {
  constructor(p, c){ this.p = p; this.c = c; this.n = 0; this.w = 0; this.rn = 0; this.rw = 0; this.pn = 0; this.pw = 0; this.ch = null; }
}
// valores iniciais (lances "virtuais") de um lance novo na árvore
function prior(bd, nd, early){
  const p = nd.p, c = nd.c;
  if(p < 0){ nd.pn = 20; nd.pw = 0; return; }       // passar só vale a pena quando as simulações mostram
  const {b, head, W, N} = bd, o = 3 - c;
  let pn = 10, pw = 5;
  let capt = 0, save = 0;
  for(const q of [p-W, p-1, p+1, p+W]){
    const v = b[q];
    if(v === o && bd.inAtari(head[q])) capt += bd.sz[head[q]];
    else if(v === c && bd.inAtari(head[q])) save += bd.sz[head[q]];
  }
  if(capt){ pn += 20; pw += 18; }
  if(save && !bd.selfAtari(p, c)){ pn += 15; pw += 13; }
  if(!capt && bd.selfAtari(p, c)){ pn += 20; pw += bd.groupSizeAfter(p, c) > 1 ? 0 : 3; }
  const r = (p / W | 0), cc = p % W, line = Math.min(r, cc, N + 1 - r, N + 1 - cc);
  if(early){ if(line === 1){ pn += 15; pw += 2; } else if(line === 2 && N > 9){ pn += 5; pw += 1.5; } }
  if(PAT[bd.pat3(p)]){ pn += 10; pw += 8; }
  // perto dos dois últimos lances
  for(const L of [bd.last, bd.last2]) if(L > 0){ const dr = Math.abs((L / W | 0) - r), dc = Math.abs(L % W - cc); if(dr <= 1 && dc <= 1){ pn += 4; pw += 3; } }
  nd.pn = pn; nd.pw = pw;
}
function expand(nd, bd){
  const c = bd.turn, ch = [];
  const early = bd.ne > bd.N * bd.N * 0.75;
  for(let i=0;i<bd.ne;i++){
    const p = bd.emp[i];
    if(!bd.isLegal(p, c) || bd.isEye(p, c)) continue;
    const k = new Node(p, c); prior(bd, k, early); ch.push(k);
  }
  const ps = new Node(-1, c); prior(bd, ps, early); ch.push(ps);
  nd.ch = ch;
}
const RAVE_B = 0.0004, UCT_C = 0.15;
function select(nd, rave){
  let best = null, bv = -1;
  const lnN = Math.log(nd.n + 1);
  for(const k of nd.ch){
    const n = k.n + k.pn;
    let v = (k.w + k.pw) / n;
    if(rave && k.rn){ const beta = k.rn / (k.rn + n + k.rn * n * RAVE_B); v = (1 - beta) * v + beta * k.rw / k.rn; }
    v += UCT_C * Math.sqrt(lnN / n);
    if(v > bv){ bv = v; best = k; }
  }
  return best;
}
/* pensa a partir de um estado {N, b:[...], turn, ko, hist:[hash...]}
   opções: {ms, komi, tree:true (falso = só simulações na raiz), rave:true} */
function think(g, opt){
  const N = g.N, komi = opt.komi != null ? opt.komi : 6.5;
  const root = new Board(N); root.load(g.b, g.turn);
  root.ko = g.ko != null && g.ko >= 0 ? root.pt(g.ko) : -1;
  root.last = g.last != null && g.last >= 0 ? root.pt(g.last) : -1;
  root.passes = g.passes || 0;
  const hist = new Set(g.hist || []);
  const bd = new Board(N), tmp = new Board(N);
  const top = new Node(-2, 3 - g.turn);
  expand(top, root);
  // superko na raiz: tira lances que repetem uma posição anterior
  top.ch = top.ch.filter(k => { if(k.p < 0) return true; tmp.copyFrom(root); tmp.play(k.p, g.turn); return !hist.has(tmp.hash()); });
  const own = new Float32Array(root.S);
  const tree = opt.tree !== false, rave = opt.rave !== false, EXP = opt.expand || (N > 9 ? 3 : 1);
  const t0 = Date.now(), end = t0 + (opt.ms || 1000);
  const mk = new Uint8Array(root.S), mkc = new Uint8Array(root.S);
  let sims = 0;
  const path = [];
  while(true){
    if((sims & 31) === 0 && Date.now() > end && sims >= 64) break;
    if(sims >= (opt.max || 1e9)) break;
    sims++;
    bd.copyFrom(root); logN = 0; path.length = 0;
    let nd = top; path.push(nd);
    while(nd.ch){
      const k = select(nd, rave);
      if(k.p < 0) bd.pass(); else { bd.play(k.p, k.c); LOGP[logN] = k.p; LOGC[logN++] = k.c; }
      path.push(k); nd = k;
      if(bd.passes >= 2) break;
      if(!nd.ch && tree && nd.n >= EXP && path.length < 60){ expand(nd, bd); }
      else if(!nd.ch) break;
    }
    bd.passes = 0;                       // dois passes na árvore: a simulação resolve as pedras mortas
    const win = bd.playout(komi, own);
    // atualização (UCT + AMAF)
    for(const x of path){ x.n++; if(x.c === win) x.w++; }
    if(rave){
      // percorre os lances do fim para o começo guardando quem jogou primeiro em cada ponto
      mk.fill(0);
      let li = logN - 1;
      for(let d=path.length - 1; d>=0; d--){
        // lances a partir da profundidade d: índice no log = nº de lances (não-passe) até path[d]
        const nodeAt = path[d];
        const start = countPlays(path, d);
        while(li >= start){ mk[LOGP[li]] = 1; mkc[LOGP[li]] = LOGC[li]; li--; }
        if(nodeAt.ch) for(const k of nodeAt.ch){ if(k.p >= 0 && mk[k.p] && mkc[k.p] === k.c){ k.rn++; if(k.c === win) k.rw++; } }
      }
    }
  }
  let best = null, alt = null;
  for(const k of top.ch){ if(!best || k.n > best.n) best = k; if(k.p >= 0 && (!alt || k.n > alt.n)) alt = k; }
  for(let i=0;i<own.length;i++) own[i] /= sims;
  return {move: best.p < 0 ? -1 : root.ix(best.p), alt: alt ? root.ix(alt.p) : -1, altRate: alt && alt.n ? alt.w / alt.n : 0, rate: best.n ? best.w / best.n : 0.5, sims, own, root, top, ms: Date.now() - t0,
    ownAt: i => own[root.pt(i)]};
}
function countPlays(path, d){ let n = 0; for(let i=1;i<=d;i++) if(path[i].p >= 0) n++; return n; }

/* --------------- fim de jogo: pedras mortas e contagem ---------------
   Faz muitas simulações a partir da posição final; a cadeia que termina
   capturada na maioria delas é considerada morta. */
function estimate(arr, N, turn, komi, n){
  const root = new Board(N); root.load(arr, turn);
  const bd = new Board(N);
  const ob = new Float32Array(root.S), ow = new Float32Array(root.S);
  const own = new Float32Array(root.S);
  for(let i=0;i<(n || 600);i++){
    bd.copyFrom(root); own.fill(0); logN = 0;
    bd.playout(komi, own);
    for(let p=0;p<root.S;p++){ if(own[p] > 0) ob[p]++; else if(own[p] < 0) ow[p]++; }
  }
  const tot = n || 600, dead = [];
  // decide por cadeia (média das pedras)
  const seen = new Uint8Array(root.S);
  for(let i=0;i<N*N;i++){
    const p = root.pt(i), c = root.b[p];
    if(!c || seen[p]) continue;
    const h = root.head[p];
    let s = h, lost = 0, cnt = 0;
    do { seen[s] = 1; lost += (c === BLACK ? ow[s] : ob[s]) / tot; cnt++; s = root.next[s]; } while(s !== h);
    if(lost / cnt > 0.5){ s = h; do { dead.push(root.ix(s)); s = root.next[s]; } while(s !== h); }
  }
  return dead;
}
// contagem por área com as pedras mortas retiradas: {b, w, terr:[0/1/2 por ponto], stones:{1,2}, area:{1,2}}
function score(arr, N, dead){
  const a = arr.slice(); const ds = new Set(dead || []);
  for(const i of ds) a[i] = 0;
  const terr = new Array(N*N).fill(0), seen = new Uint8Array(N*N);
  const stones = [0, 0, 0], area = [0, 0, 0];
  for(let i=0;i<N*N;i++) if(a[i]) stones[a[i]]++;
  for(let i=0;i<N*N;i++){
    if(a[i] || seen[i]) continue;
    const reg = [], st = [i]; seen[i] = 1; let bl = 0, wh = 0;
    while(st.length){
      const p = st.pop(); reg.push(p);
      const r = p / N | 0, c = p % N;
      for(const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]){
        const rr = r + dr, cc = c + dc; if(rr < 0 || cc < 0 || rr >= N || cc >= N) continue;
        const q = rr*N + cc;
        if(a[q] === 1) bl = 1; else if(a[q] === 2) wh = 1; else if(!seen[q]){ seen[q] = 1; st.push(q); }
      }
    }
    const owner = bl && !wh ? 1 : wh && !bl ? 2 : 0;
    if(owner) for(const p of reg){ terr[p] = owner; area[owner]++; }
  }
  return {terr, stones, area, black: stones[1] + area[1], white: stones[2] + area[2]};
}

return { Board, think, estimate, score, EMPTY, BLACK, WHITE, setSeed: s => { rs = s | 0 || 1; } };
})();
if(typeof module !== 'undefined') module.exports = GoAI;
