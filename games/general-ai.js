/* =====================================================================
   General (Bozó) — pontuação e bots.
   O bot Difícil joga a estratégia ótima de valor esperado: programação
   dinâmica sobre os 1024 estados de casas preenchidas × 252 jogadas
   possíveis de 5 dados × 462 escolhas de dados guardados × 3 lances.
   ===================================================================== */
"use strict";
const GN = (() => {
  const NAMES = ['Jogo de 1','Jogo de 2','Jogo de 3','Jogo de 4','Jogo de 5','Jogo de 6','Seguida','Full','Quadra','General'];
  const SHORT = ['1','2','3','4','5','6','Seguida','Full','Quadra','General'];
  const NC = 10, FULLM = (1 << NC) - 1;
  const BASE = [0,0,0,0,0,0,20,30,40,50], FIRST = [0,0,0,0,0,0,25,35,45,50];
  // pontos de uma casa para os dados (vetor de 5 valores 1..6); first = de primeira (1º lance)
  function score(cat, dice, first){
    const c = [0,0,0,0,0,0]; dice.forEach(d => c[d-1]++);
    return scoreC(cat, c, first);
  }
  function scoreC(cat, c, first){
    if(cat < 6) return c[cat] * (cat + 1);
    const mx = Math.max(...c);
    let ok = false;
    if(cat === 6) ok = (c[0] && c[1] && c[2] && c[3] && c[4] && !c[5]) || (!c[0] && c[1] && c[2] && c[3] && c[4] && c[5]) ? true : false;
    else if(cat === 7) ok = c.includes(3) && c.includes(2);
    else if(cat === 8) ok = mx >= 4;
    else if(cat === 9) ok = mx === 5;
    return ok ? (first ? FIRST[cat] : BASE[cat]) : 0;
  }
  const isGeneral = dice => dice.length === 5 && dice.every(d => d === dice[0]);

  /* ---------------- tabelas de multiconjuntos de dados ---------------- */
  const key = c => c[0] + 6*c[1] + 36*c[2] + 216*c[3] + 1296*c[4] + 7776*c[5];
  function multisets(k){ const out = [];
    const rec = (i, left, cur) => { if(i === 5){ cur[5] = left; out.push(cur.slice()); return; } for(let x=0;x<=left;x++){ cur[i] = x; rec(i+1, left-x, cur); } };
    rec(0, k, [0,0,0,0,0,0]); return out; }
  const FACT = [1,1,2,6,24,120];
  const prob = c => { const m = c.reduce((a,b) => a+b, 0); let p = FACT[m] / Math.pow(6, m); c.forEach(x => p /= FACT[x]); return p; };
  const ROLLS = multisets(5), RIDX = new Map(ROLLS.map((c,i) => [key(c), i]));
  const KEEPS = []; for(let k=0;k<=5;k++) KEEPS.push(...multisets(k));
  const KIDX = new Map(KEEPS.map((c,i) => [key(c), i]));
  const KSIZE = KEEPS.map(c => c.reduce((a,b) => a+b, 0));
  // transições: guardando K e rolando o resto → (jogada, probabilidade)
  const TR = KEEPS.map(K => { const m = 5 - K.reduce((a,b) => a+b, 0); return multisets(m).map(O => [RIDX.get(key(K.map((x,i) => x + O[i]))), prob(O)]); });
  // sub-multiconjuntos de cada jogada (o que dá para guardar)
  const SUB = ROLLS.map(r => { const out = [];
    const rec = (i, cur) => { if(i === 6){ out.push(KIDX.get(key(cur))); return; } for(let x=0;x<=r[i];x++){ cur[i] = x; rec(i+1, cur); } };
    rec(0, [0,0,0,0,0,0]); return out; });
  const P0 = new Float64Array(ROLLS.length); TR[KIDX.get(0)].forEach(([r, p]) => P0[r] = p);
  const SC = [], SCF = [];
  for(let c=0;c<NC;c++){ SC.push(Float64Array.from(ROLLS, r => scoreC(c, r, false))); SCF.push(Float64Array.from(ROLLS, r => scoreC(c, r, true))); }

  /* ---------------- resolve um estado ---------------- */
  // tabelas achatadas (bem mais rápidas)
  const NR = ROLLS.length, NK = KEEPS.length;
  const TRo = new Int32Array(NK + 1), SUBo = new Int32Array(NR + 1);
  TR.forEach((l, k) => TRo[k+1] = TRo[k] + l.length);
  SUB.forEach((l, r) => SUBo[r+1] = SUBo[r] + l.length);
  const TRr = new Int32Array(TRo[NK]), TRp = new Float64Array(TRo[NK]), SUBk = new Int32Array(SUBo[NR]);
  TR.forEach((l, k) => l.forEach(([r, p], j) => { TRr[TRo[k]+j] = r; TRp[TRo[k]+j] = p; }));
  SUB.forEach((l, r) => l.forEach((k, j) => SUBk[SUBo[r]+j] = k));
  const V3 = new Float64Array(NR), V2 = new Float64Array(NR), EK2 = new Float64Array(NK), EK1 = new Float64Array(NK);
  const expect = (V, EK) => { for(let k=0;k<NK;k++){ let s = 0; for(let j=TRo[k];j<TRo[k+1];j++) s += TRp[j] * V[TRr[j]]; EK[k] = s; } };
  // val(c, r, first) = valor de marcar a casa c com a jogada r. Preenche EK1/EK2 e devolve o valor esperado do turno.
  function turnTables(m, val){
    for(let r=0;r<NR;r++){ let b = -1e9; for(let c=0;c<NC;c++) if(!(m & (1 << c))){ const v = val(c, r, false); if(v > b) b = v; } V3[r] = b; }
    expect(V3, EK2);
    for(let r=0;r<NR;r++){ let b = V3[r]; for(let j=SUBo[r];j<SUBo[r+1];j++) if(EK2[SUBk[j]] > b) b = EK2[SUBk[j]]; V2[r] = b; }
    expect(V2, EK1);
    let E = 0;
    for(let r=0;r<NR;r++){ let b = -1e9; for(let c=0;c<NC;c++) if(!(m & (1 << c))){ const v = val(c, r, true); if(v > b) b = v; }
      for(let j=SUBo[r];j<SUBo[r+1];j++) if(EK1[SUBk[j]] > b) b = EK1[SUBk[j]]; E += P0[r] * b; }
    return E;
  }
  // valor esperado ótimo do resto da partida (solitário) para cada estado de casas preenchidas
  let EXACT = null;
  function solve(){
    if(EXACT) return EXACT;
    const E = new Float64Array(1 << NC);
    for(let m=FULLM-1;m>=0;m--) E[m] = turnTables(m, (c, r, f) => (f ? SCF : SC)[c][r] + E[m | (1 << c)]);
    return EXACT = E;
  }

  /* ---------------- decisão do bot ---------------- */
  const countsOf = dice => { const c = [0,0,0,0,0,0]; dice.forEach(d => c[d-1]++); return c; };
  const maskOf = cats => cats.reduce((m, v, i) => v != null ? m | (1 << i) : m, 0);
  // traduz um multiconjunto guardado para quais dados (índices) ficam
  function keepMask(dice, K){ const need = K.slice(); return dice.map(d => need[d-1] > 0 ? (need[d-1]--, true) : false); }
  // cats: casas do jogador (null = aberta); rollNo: lances já feitos (1..3); ctx: {need} = pontos para passar o líder
  // Difícil: sempre a melhor opção. Normal: sorteia entre as opções a até ~1,2 ponto da melhor (quase ótimo).
  function decide(dice, rollNo, cats, diff, ctx){
    if(diff === 'facil') return easy(dice, rollNo, cats);
    const E = solve(), m = maskOf(cats), r = RIDX.get(key(countsOf(dice)));
    let val, tol = diff === 'dificil' ? 0 : 1;
    if(diff === 'dificil' && NC - popc(m) === 1 && ctx && ctx.need > 0){
      // última casa e atrás no placar: maximiza a chance de passar o líder
      const need = ctx.need; val = (c, rr, f) => ((f ? SCF : SC)[c][rr] >= need ? 1 : 0);
    } else val = (c, rr, f) => (f ? SCF : SC)[c][rr] + E[m | (1 << c)];
    if(rollNo < 3) turnTables(m, val);
    const opts = [];
    for(let c=0;c<NC;c++) if(!(m & (1 << c))) opts.push({a:{t:'score', cat:c}, v:val(c, r, rollNo === 1)});
    if(rollNo < 3){ const EK = rollNo === 1 ? EK1 : EK2; for(let j=SUBo[r];j<SUBo[r+1];j++){ const k = SUBk[j]; if(KSIZE[k] === 5) continue; opts.push({a:{t:'roll', keep:keepMask(dice, KEEPS[k])}, v:EK[k] - 1e-9}); } }
    opts.sort((x, y) => y.v - x.v);
    const near = opts.filter(o => o.v >= opts[0].v - tol);
    return (tol ? near[Math.floor(Math.random() * near.length)] : opts[0]).a;
  }
  const popc = m => { let c = 0; while(m){ c += m & 1; m >>= 1; } return c; };
  // Fácil: guarda o número que mais saiu (ou o pedaço da seguida) e marca onde dá mais pontos agora
  const ROUGH = [2.1, 4.2, 6.3, 8.4, 10.5, 12.6, 12, 16, 12, 9];
  function easy(dice, rollNo, cats){
    const open = cats.map((v, i) => v == null ? i : -1).filter(i => i >= 0);
    const c = countsOf(dice), first = rollNo === 1;
    const bestNow = () => { let b = -1, bv = -1e9; for(const k of open){ const v = scoreC(k, c, first) - .45 * ROUGH[k] + Math.random() * 2; if(v > bv){ bv = v; b = k; } } return b; };
    // jogada pronta de valor alto: marca
    for(const k of [9, 8, 7, 6]) if(open.includes(k) && scoreC(k, c, first) > 0 && (k !== 8 || !open.includes(9) || rollNo === 3)) return {t:'score', cat:k};
    if(rollNo >= 3) return {t:'score', cat:bestNow()};
    // seguida: guarda valores distintos se faltar só 1
    if(open.includes(6)){
      for(const run of [[1,2,3,4,5],[2,3,4,5,6]]){ const have = run.filter(v => c[v-1] > 0); if(have.length === 4){ const keep = run.map(v => c[v-1] > 0 ? 1 : 0); const K = [0,0,0,0,0,0]; run.forEach((v, i) => K[v-1] = keep[i]); return {t:'roll', keep:keepMask(dice, K)}; } }
    }
    // guarda o número mais frequente (se valer para alguma casa aberta); empate → o maior
    let bf = -1, bs = -1;
    for(let f=1;f<=6;f++){ const useful = open.includes(f-1) || open.some(k => k >= 7); const s = c[f-1] * 10 + f + (useful ? 30 : 0); if(c[f-1] && s > bs){ bs = s; bf = f; } }
    const K = [0,0,0,0,0,0]; K[bf-1] = c[bf-1];
    if(c[bf-1] === 5) return {t:'score', cat:bestNow()};
    return {t:'roll', keep:keepMask(dice, K)};
  }
  return {NAMES, SHORT, NC, score, scoreC, isGeneral, decide, solve, BASE, FIRST};
})();
