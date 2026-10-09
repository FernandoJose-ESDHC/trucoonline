/* =====================================================================
   Campo Minado — motor: gerador (casa inicial segura, opção "sem chute")
   e resolvedor lógico (regras simples, subconjuntos e enumeração da
   fronteira com probabilidades). Usado pelo bot e pelo gerador.
   ===================================================================== */
"use strict";
const MinaAI = (() => {
  const NB = {};                       // vizinhos em cache por "WxH"
  function nbrs(W, H){
    const k = W + 'x' + H; if(NB[k]) return NB[k];
    const a = [];
    for(let r=0;r<H;r++) for(let c=0;c<W;c++){
      const l = [];
      for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++){
        if(!dr && !dc) continue;
        const rr = r+dr, cc = c+dc;
        if(rr >= 0 && rr < H && cc >= 0 && cc < W) l.push(rr*W + cc);
      }
      a.push(l);
    }
    return NB[k] = a;
  }
  // números de cada casa a partir das minas
  function counts(W, H, mines){
    const nb = nbrs(W, H);
    return mines.map((m,i) => m ? -1 : nb[i].reduce((s,j) => s + mines[j], 0));
  }
  // abre a casa i (e a cascata de zeros) num vetor rev (-1 = fechada)
  function flood(W, H, num, rev, i){
    const nb = nbrs(W, H), out = [];
    if(rev[i] >= 0) return out;
    const stack = [i]; rev[i] = num[i]; out.push(i);
    while(stack.length){
      const x = stack.pop();
      if(num[x] !== 0) continue;
      for(const j of nb[x]) if(rev[j] < 0 && num[j] >= 0){ rev[j] = num[j]; out.push(j); stack.push(j); }
    }
    return out;
  }

  /* ---------- binomial (em double) ---------- */
  const LF = [0];
  const lfact = n => { while(LF.length <= n) LF.push(LF[LF.length-1] + Math.log(LF.length)); return LF[n]; };
  const lC = (n, k) => (k < 0 || k > n) ? -Infinity : lfact(n) - lfact(k) - lfact(n-k);

  /* ---------- resolvedor ----------
     rev: -1 fechada, 0..8 aberta. known: Set de minas já deduzidas (opcional).
     level 1 = regras simples, 2 = + subconjuntos, 3 = + enumeração/probabilidades.
     Devolve {safe:[...], mines:Set, prob:Map(casa->p), other:p, steps:{1:n,2:n,3:n}} */
  function analyze(W, H, M, rev, level, known, wantProb){
    const nb = nbrs(W, H), N = W*H;
    const K = new Set(known || []), S = new Set();
    const used = {1:0, 2:0, 3:0};
    let prob = null, other = null;
    const isU = j => rev[j] < 0 && !K.has(j) && !S.has(j);
    function build(){
      const cons = [];
      for(let i=0;i<N;i++){
        if(rev[i] <= 0) continue;
        let m = rev[i]; const U = [];
        for(const j of nb[i]){ if(rev[j] >= 0) continue; if(K.has(j)) m--; else if(!S.has(j)) U.push(j); }
        if(U.length) cons.push({U, m});
      }
      return cons;
    }
    for(let guard=0; guard<500; guard++){
      const cons = build();
      let changed = false;
      // 1) regras simples
      for(const c of cons){
        if(c.m === 0){ c.U.forEach(j => { if(!S.has(j)){ S.add(j); changed = true; } }); }
        else if(c.m === c.U.length){ c.U.forEach(j => { if(!K.has(j)){ K.add(j); changed = true; } }); }
      }
      if(changed){ used[1]++; continue; }
      if(level < 2) break;
      // 2) subconjuntos / sobreposição (regra 1-2)
      const byCell = new Map();
      cons.forEach((c,ci) => c.U.forEach(j => { if(!byCell.has(j)) byCell.set(j, []); byCell.get(j).push(ci); }));
      const sets = cons.map(c => new Set(c.U));
      outer:
      for(let a=0;a<cons.length;a++){
        const seen = new Set();
        for(const j of cons[a].U) for(const b of byCell.get(j)){
          if(b === a || seen.has(b)) continue; seen.add(b);
          const A = cons[a], B = cons[b];
          const onlyB = B.U.filter(x => !sets[a].has(x)), onlyA = A.U.filter(x => !sets[b].has(x));
          if(!onlyB.length) continue;
          const dm = B.m - A.m;
          if(dm === onlyB.length){
            onlyB.forEach(x => K.add(x)); onlyA.forEach(x => S.add(x)); changed = true; break outer;
          }
          if(!onlyA.length && dm === 0){ onlyB.forEach(x => S.add(x)); changed = true; break outer; }
        }
      }
      if(changed){ used[2]++; continue; }
      if(level < 3) break;
      // 3) enumeração da fronteira com a contagem total de minas
      const en = enumerate(cons, rev, K, S, M, N);
      if(!en) break;
      prob = en.prob; other = en.other;
      en.prob.forEach((p, j) => { if(p <= 1e-12){ S.add(j); changed = true; } else if(p >= 1 - 1e-12){ K.add(j); changed = true; } });
      if(en.other != null && en.nOther > 0){
        if(en.other <= 1e-12){ en.others.forEach(j => S.add(j)); changed = true; }
        else if(en.other >= 1 - 1e-12){ en.others.forEach(j => K.add(j)); changed = true; }
      }
      if(changed){ used[3]++; prob = null; continue; }
      break;
    }
    if(wantProb && !prob && level >= 2){
      const cons = build(), en = enumerate(cons, rev, K, S, M, N);
      if(en){ prob = en.prob; other = en.other; }
    }
    return {safe:[...S].filter(j => rev[j] < 0), mines:K, prob, other, used};
  }

  // enumera as configurações de cada componente da fronteira
  function enumerate(cons, rev, K, S, M, N){
    const front = new Map();   // casa -> índice
    cons.forEach(c => c.U.forEach(j => { if(!front.has(j)) front.set(j, front.size); }));
    const others = [];
    for(let i=0;i<N;i++) if(rev[i] < 0 && !K.has(i) && !S.has(i) && !front.has(i)) others.push(i);
    const R = M - K.size, O = others.length;
    if(R < 0) return null;
    // componentes (casas ligadas por restrições)
    const cells = [...front.keys()], par = cells.map((_,i) => i);
    const find = x => { while(par[x] !== x){ par[x] = par[par[x]]; x = par[x]; } return x; };
    cons.forEach(c => { const a = find(front.get(c.U[0])); c.U.forEach(j => { const b = find(front.get(j)); if(a !== b) par[b] = a; }); });
    const groups = new Map();
    cells.forEach((j,i) => { const r = find(i); if(!groups.has(r)) groups.set(r, {cells:[], cons:[]}); groups.get(r).cells.push(j); });
    cons.forEach(c => groups.get(find(front.get(c.U[0]))).cons.push(c));
    const comps = [];
    let budget = 400000;
    for(const g of groups.values()){
      const r = solveComp(g, budget); if(!r) return null;
      budget -= r.nodes; comps.push(r);
    }
    // combina as componentes com a contagem global: peso = C(O, R - k)
    const conv = (a, b) => { const o = new Array(a.length + b.length - 1).fill(0); for(let i=0;i<a.length;i++) if(a[i]) for(let j=0;j<b.length;j++) o[i+j] += a[i]*b[j]; return o; };
    // escala: normaliza cada distribuição para evitar estouro
    if(comps.some(c => !Math.max(...c.cnt))) return null;
    comps.forEach(c => { const mx = Math.max(...c.cnt); c.cnt = c.cnt.map(x => x/mx); c.cell = c.cell.map(v => v.map(x => x/mx)); });
    const all = comps.reduce((acc, c) => conv(acc, c.cnt), [1]);
    let maxL = -Infinity; const lw = k => lC(O, R - k);
    for(let k=0;k<all.length;k++) if(all[k]) maxL = Math.max(maxL, lw(k));
    if(maxL === -Infinity) return null;
    const w = k => Math.exp(lw(k) - maxL);
    let Z = 0, expOther = 0;
    for(let k=0;k<all.length;k++){ if(!all[k]) continue; const ww = all[k]*w(k); Z += ww; if(O) expOther += ww*(R-k)/O; }
    if(!(Z > 0)) return null;
    const prob = new Map();
    comps.forEach((c, ci) => {
      const rest = comps.reduce((acc, d, di) => di === ci ? acc : conv(acc, d.cnt), [1]);
      c.cells.forEach((j, x) => {
        let s = 0;
        for(let k=0;k<c.cnt.length;k++){ const v = c.cell[x][k]; if(!v) continue; for(let q=0;q<rest.length;q++) if(rest[q]) s += v*rest[q]*w(k+q); }
        prob.set(j, s/Z);
      });
    });
    return {prob, other: O ? expOther/Z : null, nOther:O, others};
  }
  // backtracking numa componente: cnt[k] = nº de soluções com k minas; cell[x][k] = soluções com mina em x
  function solveComp(g, budget){
    const cells = g.cells, n = cells.length, idx = new Map(cells.map((j,i) => [j,i]));
    const cs = g.cons.map(c => ({v:c.U.map(j => idx.get(j)), m:c.m}));
    const of = cells.map(() => []); cs.forEach((c,ci) => c.v.forEach(x => of[x].push(ci)));
    // ordem: busca em largura para propagar cedo
    const order = [], seen = new Array(n).fill(false);
    for(let s=0;s<n;s++){ if(seen[s]) continue; const q = [s]; seen[s] = true;
      while(q.length){ const x = q.shift(); order.push(x); for(const ci of of[x]) for(const y of cs[ci].v) if(!seen[y]){ seen[y] = true; q.push(y); } } }
    const val = new Array(n).fill(-1), sum = cs.map(() => 0), left = cs.map(c => c.v.length);
    const cnt = new Array(n+1).fill(0), cell = cells.map(() => new Array(n+1).fill(0));
    let nodes = 0, mines = 0, abort = false;
    function rec(p){
      if(++nodes > budget){ abort = true; return; }
      if(p === n){ cnt[mines]++; for(let x=0;x<n;x++) if(val[x]) cell[x][mines]++; return; }
      const x = order[p];
      for(let v=0; v<=1 && !abort; v++){
        let ok = true;
        for(const ci of of[x]){ const s = sum[ci] + v, l = left[ci] - 1; if(s > cs[ci].m || s + l < cs[ci].m){ ok = false; break; } }
        if(!ok) continue;
        val[x] = v; mines += v; for(const ci of of[x]){ sum[ci] += v; left[ci]--; }
        rec(p+1);
        val[x] = -1; mines -= v; for(const ci of of[x]){ sum[ci] -= v; left[ci]++; }
      }
    }
    rec(0);
    if(abort) return null;
    return {cells, cnt, cell, nodes};
  }

  /* ---------- gerador ---------- */
  // minas fora do 3×3 da casa inicial (abre um zero); com noGuess, só aceita campos resolvíveis sem chute
  function randomField(W, H, M, start){
    const nb = nbrs(W, H), N = W*H, ban = new Set([start, ...nb[start]]);
    let pool = []; for(let i=0;i<N;i++) if(!ban.has(i)) pool.push(i);
    if(pool.length < M){ ban.clear(); ban.add(start); pool = []; for(let i=0;i<N;i++) if(i !== start) pool.push(i); }
    for(let i=pool.length-1;i>0;i--){ const j = Math.floor(Math.random()*(i+1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    const mines = new Array(N).fill(0); pool.slice(0, M).forEach(i => mines[i] = 1);
    return mines;
  }
  function solvable(W, H, M, mines, start){
    const num = counts(W, H, mines), N = W*H, rev = new Array(N).fill(-1);
    flood(W, H, num, rev, start);
    let K = new Set(), safeLeft = N - M;
    const opened = () => rev.reduce((s,x) => s + (x >= 0), 0);
    for(let it=0; it<2000; it++){
      if(opened() === safeLeft) return true;
      const r = analyze(W, H, M, rev, 3, K);
      K = r.mines;
      if(!r.safe.length) return false;
      r.safe.forEach(j => { if(mines[j]) throw new Error('resolvedor errou'); flood(W, H, num, rev, j); });
    }
    return false;
  }
  function generate(W, H, M, start, noGuess, budgetMs){
    const t0 = Date.now();
    let tries = 0;
    for(;;){
      tries++;
      const mines = randomField(W, H, M, start);
      if(!noGuess || solvable(W, H, M, mines, start)) return {mines, tries, ok:true};
      if(Date.now() - t0 > (budgetMs || 1500)) return {mines, tries, ok:false};
    }
  }
  // casa inicial comum (para a disputa): longe das bordas
  function pickStart(W, H){
    const r = Math.floor(H*0.25 + Math.random()*H*0.5), c = Math.floor(W*0.25 + Math.random()*W*0.5);
    return r*W + c;
  }

  /* ---------- bot ----------
     Recebe só o que o jogador vê (rev) — nunca as minas. lvl: 'facil'|'normal'|'dificil'.
     Devolve {a:{t:'open', i}, ms} — ms = tempo de "pensar" em ritmo humano. */
  const PACE = {facil:{base:1000, sub:1800, enu:2600, guess:2200}, normal:{base:680, sub:1100, enu:1800, guess:1500}, dificil:{base:430, sub:720, enu:1250, guess:1000}};
  function plan(W, H, M, rev, lvl, last, start, known){
    const N = W*H, pace = PACE[lvl] || PACE.normal;
    const hidden = []; for(let i=0;i<N;i++) if(rev[i] < 0) hidden.push(i);
    const anyOpen = hidden.length < N - (known ? known.length : 0);
    if(!anyOpen){
      const i = start != null ? start : pickStart(W, H);
      return {a:{t:'open', i}, ms:pace.base*1.6, kind:'start'};
    }
    let level = lvl === 'facil' ? 2 : lvl === 'normal' ? 2 : 3;
    let r = analyze(W, H, M, rev, level, known, true);
    // o Fácil às vezes não enxerga a dedução por subconjunto e chuta (erro de gente)
    if(lvl === 'facil' && r.used[2] && Math.random() < 0.3){ level = 1; r = analyze(W, H, M, rev, 1, known, false); }
    const near = list => {             // escolhe a casa mais perto da última jogada (ritmo de gente)
      if(last == null) return list[Math.floor(Math.random()*list.length)];
      const lr = Math.floor(last/W), lc = last%W;
      let best = null, bd = Infinity;
      for(const j of list){ const d = Math.max(Math.abs(Math.floor(j/W)-lr), Math.abs(j%W-lc)) + Math.random()*0.5; if(d < bd){ bd = d; best = j; } }
      return best;
    };
    if(r.safe.length){
      const hard = r.used[3] ? pace.enu : r.used[2] ? pace.sub : pace.base;
      return {a:{t:'open', i:near(r.safe)}, ms:hard*(0.75 + Math.random()*0.5), kind:r.used[3] ? 'enu' : r.used[2] ? 'sub' : 'simple'};
    }
    // chute: menor probabilidade de mina
    const cand = hidden.filter(j => !r.mines.has(j));
    if(!cand.length) return null;
    let pr;
    if(r.prob && level >= 2 && lvl !== 'facil'){
      pr = j => r.prob.has(j) ? r.prob.get(j) : (r.other != null ? r.other : 0.5);
    } else {
      // estimativa local (Fácil): maior razão minas/fechadas entre os números vizinhos
      const nb = nbrs(W, H), dens = (M - r.mines.size) / Math.max(1, cand.length);
      pr = j => { let p = -1; for(const x of nb[j]) if(rev[x] > 0){ let m = rev[x], u = 0; for(const y of nb[x]) if(rev[y] < 0){ if(r.mines.has(y)) m--; else u++; } if(u) p = Math.max(p, m/u); }
        return (p < 0 ? dens : p) + (Math.random()-0.5)*0.12; };
    }
    let best = Infinity, list = [];
    for(const j of cand){
      // desempate: cantos e casas com mais vizinhos fechados dão mais informação
      const p = pr(j) - (level >= 3 ? 0.0001*nbrs(W,H)[j].filter(x => rev[x] < 0).length : 0);
      if(p < best - 1e-9){ best = p; list = [j]; } else if(Math.abs(p - best) <= 1e-9) list.push(j);
    }
    return {a:{t:'open', i:near(list)}, ms:pace.guess*(0.8 + Math.random()*0.5), kind:'guess', p:best};
  }

  return {nbrs, counts, flood, analyze, generate, solvable, pickStart, plan, PACE};
})();
if(typeof module !== 'undefined') module.exports = MinaAI;
