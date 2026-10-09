/* =====================================================================
   Sudoku — motor: gerador (solução única, nível pela técnica exigida),
   resolvedor lógico passo a passo (com explicação em português, usado
   na dica e no bot) e contagem de soluções por backtracking.
   ===================================================================== */
"use strict";
const SudokuAI = (() => {
  /* ---------- estrutura ---------- */
  const ROW = i => Math.floor(i/9), COL = i => i%9, BOX = i => Math.floor(ROW(i)/3)*3 + Math.floor(COL(i)/3);
  const UNITS = [];                                  // 0-8 linhas, 9-17 colunas, 18-26 quadrados
  for(let r=0;r<9;r++) UNITS.push([...Array(9)].map((_,c) => r*9+c));
  for(let c=0;c<9;c++) UNITS.push([...Array(9)].map((_,r) => r*9+c));
  for(let b=0;b<9;b++) UNITS.push([...Array(9)].map((_,k) => (Math.floor(b/3)*3 + Math.floor(k/3))*9 + (b%3)*3 + k%3));
  const UOF = [...Array(81)].map((_,i) => [ROW(i), 9+COL(i), 18+BOX(i)]);
  const PEERS = [...Array(81)].map((_,i) => { const s = new Set(); UOF[i].forEach(u => UNITS[u].forEach(j => j !== i && s.add(j))); return [...s]; });
  const ALL = 511;
  const PC = new Uint8Array(512); for(let m=1;m<512;m++) PC[m] = PC[m >> 1] + (m & 1);
  const DIG = m => { for(let d=1; d<=9; d++) if(m & (1 << (d-1))) return d; return 0; };
  const digits = m => { const o = []; for(let d=1; d<=9; d++) if(m & (1 << (d-1))) o.push(d); return o; };
  const bit = d => 1 << (d-1);
  const cellName = i => `L${ROW(i)+1}C${COL(i)+1}`;
  const unitName = u => u < 9 ? `na linha ${u+1}` : u < 18 ? `na coluna ${u-8}` : `no quadrado ${u-17}`;
  const list = a => a.length < 2 ? a.join('') : a.slice(0,-1).join(', ') + ' e ' + a[a.length-1];

  /* ---------- força bruta (contagem de soluções) ---------- */
  function countSolutions(g, limit){
    const a = g.slice(); let n = 0;
    const rows = new Array(9).fill(0), cols = new Array(9).fill(0), boxs = new Array(9).fill(0);
    for(let i=0;i<81;i++) if(a[i]){ const b = bit(a[i]); if((rows[ROW(i)] | cols[COL(i)] | boxs[BOX(i)]) & b) return 0; rows[ROW(i)] |= b; cols[COL(i)] |= b; boxs[BOX(i)] |= b; }
    function rec(){
      let best = -1, bm = 0, bc = 10;
      for(let i=0;i<81;i++){ if(a[i]) continue; const m = ALL & ~(rows[ROW(i)] | cols[COL(i)] | boxs[BOX(i)]); const c = PC[m];
        if(c < bc){ bc = c; best = i; bm = m; if(c <= 1) break; } }
      if(best < 0){ n++; return n >= limit; }
      if(!bc) return false;
      const r = ROW(best), c = COL(best), x = BOX(best);
      for(let d=1; d<=9; d++){ const b = bit(d); if(!(bm & b)) continue;
        a[best] = d; rows[r] |= b; cols[c] |= b; boxs[x] |= b;
        if(rec()) return true;
        a[best] = 0; rows[r] &= ~b; cols[c] &= ~b; boxs[x] &= ~b; }
      return false;
    }
    rec();
    return n;
  }
  function randomFull(rnd){
    const a = new Array(81).fill(0);
    function rec(i){
      if(i === 81) return true;
      const used = PEERS[i].reduce((m,j) => a[j] ? m | bit(a[j]) : m, 0);
      const ds = digits(ALL & ~used); for(let k=ds.length-1;k>0;k--){ const j = Math.floor(rnd()*(k+1)); [ds[k], ds[j]] = [ds[j], ds[k]]; }
      for(const d of ds){ a[i] = d; if(rec(i+1)) return true; }
      a[i] = 0; return false;
    }
    rec(0); return a;
  }

  /* ---------- candidatos ---------- */
  function cands(g){
    const C = new Array(81).fill(0);
    for(let i=0;i<81;i++){ if(g[i]) continue; let m = ALL; for(const j of PEERS[i]) if(g[j]) m &= ~bit(g[j]); C[i] = m; }
    return C;
  }

  /* ---------- técnicas (tier 1: simples, 2: intermediárias, 3: avançadas) ----------
     Cada uma devolve null ou {tier, tech, place:{i,v}} / {tier, tech, elim:[[i,mask]]}, com texto e casas destacadas. */
  function hiddenSingle(g, C, boxesOnly){
    for(let u = boxesOnly ? 18 : 0; u < (boxesOnly ? 27 : 18); u++){
      for(let d=1; d<=9; d++){
        const b = bit(d); let where = -1, k = 0, has = false;
        for(const i of UNITS[u]){ if(g[i] === d){ has = true; break; } if(C[i] & b){ where = i; k++; } }
        if(!has && k === 1) return {tier:1, tech:'Único lugar', place:{i:where, v:d}, hl:UNITS[u],
          text:`${unitName(u).replace(/^n/, 'N')}, o <b>${d}</b> só cabe na casa <b>${cellName(where)}</b>.`};
      }
    }
    return null;
  }
  function nakedSingle(g, C){
    for(let i=0;i<81;i++) if(!g[i] && PC[C[i]] === 1){ const d = DIG(C[i]);
      return {tier:1, tech:'Única possibilidade', place:{i, v:d}, hl:PEERS[i],
        text:`Na casa <b>${cellName(i)}</b> só cabe o <b>${d}</b>: os outros números já aparecem na linha, na coluna ou no quadrado dela.`}; }
    return null;
  }
  // um número num quadrado preso numa linha/coluna (e vice-versa)
  function locked(g, C){
    for(let d=1; d<=9; d++){ const b = bit(d);
      for(let u=18; u<27; u++){
        const cs = UNITS[u].filter(i => C[i] & b); if(cs.length < 2) continue;
        for(const kind of [0, 1]){
          const f = kind ? COL : ROW; if(!cs.every(i => f(i) === f(cs[0]))) continue;
          const line = kind ? 9 + COL(cs[0]) : ROW(cs[0]);
          const el = UNITS[line].filter(i => BOX(i) !== u-18 && (C[i] & b));
          if(el.length) return {tier:2, tech:'Bloqueio no quadrado', elim:el.map(i => [i, b]), hl:cs,
            text:`No quadrado ${u-17}, o <b>${d}</b> só pode ficar ${unitName(line).replace(/^n[ao] /, 'na ')}; então ele sai das outras casas ${unitName(line).replace(/^n([ao]) /, 'd$1 ')} (${list(el.map(cellName))}).`};
        }
      }
      for(let line=0; line<18; line++){
        const cs = UNITS[line].filter(i => C[i] & b); if(cs.length < 2) continue;
        if(!cs.every(i => BOX(i) === BOX(cs[0]))) continue;
        const bx = BOX(cs[0]), el = UNITS[18+bx].filter(i => !cs.includes(i) && (C[i] & b));
        if(el.length) return {tier:2, tech:'Bloqueio na linha/coluna', elim:el.map(i => [i, b]), hl:cs,
          text:`${unitName(line).replace(/^n/, 'N')}, o <b>${d}</b> só pode ficar dentro do quadrado ${bx+1}; então ele sai das outras casas desse quadrado (${list(el.map(cellName))}).`};
      }
    }
    return null;
  }
  // conjuntos nus (par/trinca): k casas com só k candidatos juntos
  function nakedSet(g, C, k){
    for(let u=0; u<27; u++){
      const cs = UNITS[u].filter(i => !g[i] && PC[C[i]] >= 2 && PC[C[i]] <= k);
      const pick = (start, sel, m) => {
        if(PC[m] > k) return null;
        if(sel.length === k){
          if(PC[m] !== k) return null;
          const el = UNITS[u].filter(i => !g[i] && !sel.includes(i) && (C[i] & m)).map(i => [i, C[i] & m]);
          return el.length ? {sel, m, el} : null;
        }
        for(let x=start; x<cs.length; x++){ const r = pick(x+1, sel.concat(cs[x]), m | C[cs[x]]); if(r) return r; }
        return null;
      };
      const r = pick(0, [], 0);
      if(r){ const ds = digits(r.m).join(' e ').replace(/ e (?=.* e )/g, ', ');
        return {tier:k === 2 ? 2 : 3, tech:k === 2 ? 'Par' : 'Trinca', elim:r.el, hl:r.sel,
          text:`${unitName(u).replace(/^n/, 'N')}, as casas ${list(r.sel.map(cellName))} só aceitam <b>${ds}</b> entre elas; então esses números saem das outras casas ${unitName(u).replace(/^n([ao]) /, 'd$1 ')}.`}; }
    }
    return null;
  }
  // conjuntos escondidos: k números que só cabem em k casas da unidade
  function hiddenSet(g, C, k){
    for(let u=0; u<27; u++){
      const pos = {}; const ds = [];
      for(let d=1; d<=9; d++){ const b = bit(d); if(UNITS[u].some(i => g[i] === d)) continue;
        const p = UNITS[u].filter(i => C[i] & b); if(p.length >= 2 && p.length <= k){ pos[d] = p; ds.push(d); } }
      const pick = (start, sel, cells) => {
        if(cells.size > k) return null;
        if(sel.length === k){
          if(cells.size !== k) return null;
          const m = sel.reduce((a,d) => a | bit(d), 0);
          const el = [...cells].filter(i => C[i] & ~m).map(i => [i, C[i] & ~m]);
          return el.length ? {sel, cells:[...cells], el} : null;
        }
        for(let x=start; x<ds.length; x++){ const r = pick(x+1, sel.concat(ds[x]), new Set([...cells, ...pos[ds[x]]])); if(r) return r; }
        return null;
      };
      const r = pick(0, [], new Set());
      if(r) return {tier:k === 2 ? 2 : 3, tech:k === 2 ? 'Par escondido' : 'Trinca escondida', elim:r.el, hl:r.cells,
        text:`${unitName(u).replace(/^n/, 'N')}, os números <b>${list(r.sel)}</b> só cabem nas casas ${list(r.cells.map(cellName))}; então essas casas não aceitam outros números.`};
    }
    return null;
  }
  // X-Wing (n=2) e Swordfish (n=3)
  function fish(g, C, n){
    for(let d=1; d<=9; d++){ const b = bit(d);
      for(const byRow of [true, false]){
        const base = [];
        for(let x=0;x<9;x++){ const U = UNITS[byRow ? x : 9+x]; if(U.some(i => g[i] === d)) continue;
          const p = U.filter(i => C[i] & b).map(i => byRow ? COL(i) : ROW(i)); if(p.length >= 2 && p.length <= n) base.push({x, p}); }
        const pick = (start, sel, cover) => {
          if(cover.size > n) return null;
          if(sel.length === n){
            if(cover.size !== n) return null;
            const xs = sel.map(s => s.x), el = [];
            cover.forEach(y => UNITS[byRow ? 9+y : y].forEach(i => { const xx = byRow ? ROW(i) : COL(i); if(!xs.includes(xx) && (C[i] & b)) el.push([i, b]); }));
            return el.length ? {xs, ys:[...cover], el} : null;
          }
          for(let k=start; k<base.length; k++){ const r = pick(k+1, sel.concat(base[k]), new Set([...cover, ...base[k].p])); if(r) return r; }
          return null;
        };
        const r = pick(0, [], new Set());
        if(r){ const L = byRow ? 'linhas' : 'colunas', O = byRow ? 'colunas' : 'linhas', nm = n === 2 ? 'X-Wing' : 'Swordfish';
          const hl = []; r.xs.forEach(x => r.ys.forEach(y => { const i = byRow ? x*9+y : y*9+x; if(C[i] & b) hl.push(i); }));
          return {tier:3, tech:nm, elim:r.el, hl,
            text:`${nm} do <b>${d}</b>: nas ${L} ${list(r.xs.map(x => x+1))} ele só pode ficar nas ${O} ${list(r.ys.sort().map(y => y+1))}. Seja como for, ocupa essas ${O} — então o ${d} sai das outras casas delas.`}; }
      }
    }
    return null;
  }
  // XY-Wing: pivô {x,y} vê {x,z} e {y,z}; z sai de quem vê as duas pontas
  function xyWing(g, C){
    for(let p=0;p<81;p++){ if(g[p] || PC[C[p]] !== 2) continue;
      const [x, y] = digits(C[p]);
      const wings = PEERS[p].filter(j => !g[j] && PC[C[j]] === 2 && PC[C[j] & C[p]] === 1);
      for(const a of wings) for(const c of wings){
        if(a >= c) continue;
        const za = C[a] & ~C[p], zc = C[c] & ~C[p];
        if(za !== zc || !za || (C[a] & C[c] & C[p])) continue;
        if((C[a] & C[p]) === (C[c] & C[p])) continue;
        const z = DIG(za), sa = new Set(PEERS[a]);
        const el = PEERS[c].filter(j => sa.has(j) && j !== p && (C[j] & za)).map(j => [j, za]);
        if(el.length) return {tier:3, tech:'XY-Wing', elim:el, hl:[p, a, c],
          text:`XY-Wing: a casa ${cellName(p)} é ${x} ou ${y}. Nos dois casos, ${cellName(a)} ou ${cellName(c)} vira <b>${z}</b>; então o ${z} sai das casas que enxergam as duas (${list(el.map(e => cellName(e[0])))}).`};
      }
    }
    return null;
  }
  const TECHS = [
    (g,C) => hiddenSingle(g, C, true), (g,C) => hiddenSingle(g, C, false), nakedSingle,
    locked, (g,C) => nakedSet(g, C, 2), (g,C) => hiddenSet(g, C, 2),
    (g,C) => nakedSet(g, C, 3), (g,C) => hiddenSet(g, C, 3), (g,C) => fish(g, C, 2), xyWing, (g,C) => fish(g, C, 3)
  ];
  function step(g, C, maxTier){
    for(const t of TECHS){ const r = t(g, C); if(r){ if(r.tier > (maxTier || 3)) return null; return r; } }
    return null;
  }
  function applyStep(g, C, r){
    if(r.place){ const {i, v} = r.place; g[i] = v; C[i] = 0; for(const j of PEERS[i]) C[j] &= ~bit(v); }
    else r.elim.forEach(([i, m]) => C[i] &= ~m);
  }
  // resolve só com lógica; devolve {solved, tier, steps}
  function rate(puzzle, maxTier){
    const g = puzzle.slice(), C = cands(g); let tier = 0, steps = 0;
    for(;;){
      if(g.every(x => x)) return {solved:true, tier, steps};
      for(let i=0;i<81;i++) if(!g[i] && !C[i]) return {solved:false, tier, steps};
      const r = step(g, C, maxTier); if(!r) return {solved:false, tier, steps};
      tier = Math.max(tier, r.tier); steps++; applyStep(g, C, r);
    }
  }
  // próxima casa a preencher por lógica (com a cadeia de eliminações antes dela)
  function nextPlacement(g0){
    const g = g0.slice(), C = cands(g), chain = [];
    for(let guard=0; guard<300; guard++){
      for(let i=0;i<81;i++) if(!g[i] && !C[i]) return {stuck:true, chain};
      const r = step(g, C, 3); if(!r) return {stuck:true, chain};
      if(r.place) return {place:r.place, last:r, chain, tier:Math.max(r.tier, ...chain.map(c => c.tier))};
      chain.push(r); applyStep(g, C, r);
    }
    return {stuck:true, chain};
  }

  /* ---------- gerador ---------- */
  function mulberry(a){ return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const LV = {facil:{tier:1, min:36, want:1}, medio:{tier:2, min:27, want:2}, dificil:{tier:3, min:22, want:3}};
  function attempt(level, rnd){
    const L = LV[level] || LV.medio, sol = randomFull(rnd), g = sol.slice();
    const order = [...Array(41).keys()]; for(let k=order.length-1;k>0;k--){ const j = Math.floor(rnd()*(k+1)); [order[k], order[j]] = [order[j], order[k]]; }
    let givens = 81;
    for(const i of order){
      const j = 80 - i, pair = i === j ? [i] : [i, j];
      if(givens - pair.length < L.min) continue;
      const save = pair.map(x => g[x]); pair.forEach(x => g[x] = 0);
      if(countSolutions(g, 2) !== 1 || !rate(g, L.tier).solved){ pair.forEach((x,k) => g[x] = save[k]); continue; }
      givens -= pair.length;
    }
    const r = rate(g, 3);
    return {puzzle:g, sol, givens, tier:r.tier, steps:r.steps};
  }
  function generate(level, seed, budgetMs){
    const rnd = mulberry(seed == null ? Math.floor(Math.random()*2**31) : seed), t0 = Date.now(), want = (LV[level] || LV.medio).want;
    let best = null;
    for(let k=0; k<200; k++){
      const a = attempt(level, rnd); a.tries = k+1;
      if(a.tier === want) return a;
      if(!best || a.tier > best.tier) best = a;
      if(Date.now() - t0 > (budgetMs || 1500)) break;
    }
    return best;
  }

  /* ---------- bot ----------
     Vê só a própria grade (nunca a solução). Devolve a próxima casa e a técnica mais difícil usada. */
  function botStep(g){ return nextPlacement(g); }

  return {UNITS, PEERS, ROW, COL, BOX, PC, digits, bit, cellName, cands, countSolutions, rate, step, applyStep, nextPlacement, generate, botStep, mulberry};
})();
if(typeof module !== 'undefined') module.exports = SudokuAI;
