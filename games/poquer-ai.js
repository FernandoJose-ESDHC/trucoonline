/* =====================================================================
   Pôquer (Texas Hold'em) — motor: avaliador de mãos, equidade por
   Monte Carlo e decisão dos bots. Cartas são inteiros 0..51:
   valor = c >> 2 (0 = 2 … 12 = Ás), naipe = c & 3.
   ===================================================================== */
"use strict";
const PQ = (() => {
  const RN = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
  const RNOME = ['2','3','4','5','6','7','8','9','10','Valete','Dama','Rei','Ás'];
  const RPLUR = ['2','3','4','5','6','7','8','9','10','Valetes','Damas','Reis','Ases'];
  const CATS = ['Carta alta','Par','Dois pares','Trinca','Sequência','Flush','Full house','Quadra','Straight flush'];

  /* ---------------- avaliador (melhor mão de 5 entre até 7) ---------------- */
  // tabela: maior carta da sequência para cada máscara de 13 bits (+1; 0 = sem sequência)
  const STR = new Int8Array(8192);
  for(let m=0;m<8192;m++){
    for(let h=12;h>=4;h--) if(((m >> (h-4)) & 31) === 31){ STR[m] = h + 1; break; }
    if(!STR[m] && (m & 0x100F) === 0x100F) STR[m] = 4;          // A-2-3-4-5 (alta = 5)
  }
  const POP = new Int8Array(8192);
  for(let m=1;m<8192;m++) POP[m] = POP[m >> 1] + (m & 1);
  function top(mask, k){ let v = 0, n = 0; for(let r=12;r>=0 && n<k;r--) if(mask & (1 << r)){ v = (v << 4) | r; n++; } return v << (4*(5-n)); }
  const cnt = new Int8Array(13), sm = new Int32Array(4);
  // pontuação: categoria << 20 | valores de desempate (4 bits cada, do mais importante ao menos)
  function evalN(cards, len){
    len = len == null ? cards.length : len;
    cnt.fill(0); sm.fill(0); let rm = 0;
    for(let i=0;i<len;i++){ const c = cards[i], r = c >> 2; cnt[r]++; sm[c & 3] |= 1 << r; rm |= 1 << r; }
    for(let s=0;s<4;s++) if(POP[sm[s]] >= 5){                       // com 7 cartas, flush exclui quadra e full
      const sf = STR[sm[s]];
      return sf ? (8 << 20) | ((sf-1) << 16) : (5 << 20) | top(sm[s], 5);
    }
    let q = -1, t1 = -1, t2 = -1, p1 = -1, p2 = -1;
    for(let r=12;r>=0;r--){
      const k = cnt[r];
      if(k === 4) q = r;
      else if(k === 3){ if(t1 < 0) t1 = r; else if(t2 < 0) t2 = r; }
      else if(k === 2){ if(p1 < 0) p1 = r; else if(p2 < 0) p2 = r; }
    }
    if(q >= 0) return (7 << 20) | (q << 16) | (top(rm & ~(1 << q), 1) >> 4);
    if(t1 >= 0 && (t2 >= 0 || p1 >= 0)){ const p = Math.max(t2, p1); return (6 << 20) | (t1 << 16) | (p << 12); }
    const sh = STR[rm]; if(sh) return (4 << 20) | ((sh-1) << 16);
    if(t1 >= 0) return (3 << 20) | (t1 << 16) | (top(rm & ~(1 << t1), 2) >> 4);
    if(p2 >= 0) return (2 << 20) | (p1 << 16) | (p2 << 12) | (top(rm & ~(1 << p1) & ~(1 << p2), 1) >> 8);
    if(p1 >= 0) return (1 << 20) | (p1 << 16) | (top(rm & ~(1 << p1), 3) >> 4);
    return top(rm, 5);
  }
  const catOf = sc => sc >> 20;
  const nib = (sc, k) => (sc >> (16 - 4*k)) & 15;
  // nome da mão em português (ex.: "Dois pares, Reis e 9")
  function handName(sc){
    const c = catOf(sc), a = nib(sc,0), b = nib(sc,1);
    switch(c){
      case 8: return a === 12 ? 'Royal flush' : `Straight flush até o ${RNOME[a]}`;
      case 7: return `Quadra de ${RPLUR[a]}`;
      case 6: return `Full house: ${RPLUR[a]} com ${RPLUR[b]}`;
      case 5: return `Flush, ${RNOME[a]} alto`;
      case 4: return `Sequência até o ${RNOME[a]}`;
      case 3: return `Trinca de ${RPLUR[a]}`;
      case 2: return `Dois pares, ${RPLUR[a]} e ${RPLUR[b]}`;
      case 1: return `Par de ${RPLUR[a]}`;
      default: return `Carta alta: ${RNOME[a]}`;
    }
  }
  // as 5 cartas que formam a melhor mão (para destacar na tela)
  function best5(cards){
    let best = -1, pick = null; const n = cards.length, h = [0,0,0,0,0];
    if(n <= 5) return {score:evalN(cards), cards:cards.slice()};
    for(let a=0;a<n;a++) for(let b=a+1;b<n;b++) for(let c=b+1;c<n;c++) for(let d=c+1;d<n;d++) for(let e=d+1;e<n;e++){
      h[0]=cards[a]; h[1]=cards[b]; h[2]=cards[c]; h[3]=cards[d]; h[4]=cards[e];
      const s = evalN(h, 5); if(s > best){ best = s; pick = h.slice(); }
    }
    return {score:best, cards:pick};
  }

  /* ---------------- força pré-flop (fórmula de Chen) e percentis ---------------- */
  function chen(c1, c2){
    let a = c1 >> 2, b = c2 >> 2; if(a < b) [a, b] = [b, a];
    const pts = r => r === 12 ? 10 : r === 11 ? 8 : r === 10 ? 7 : r === 9 ? 6 : (r + 2) / 2;
    let s = pts(a);
    if(a === b) return Math.max(5, s * 2);
    if((c1 & 3) === (c2 & 3)) s += 2;
    const gap = a - b - 1;
    s -= gap <= 0 ? 0 : gap === 1 ? 1 : gap === 2 ? 2 : gap === 3 ? 4 : 5;
    if(gap <= 1 && a < 10) s += 1;
    return Math.ceil(s);
  }
  // PCT[c1*52+c2] = fração das 1326 mãos iniciais que são melhores ou iguais (0 = AA, 1 = 72o)
  const PCT = new Float32Array(52*52);
  {
    const all = [];
    for(let a=0;a<52;a++) for(let b=a+1;b<52;b++) all.push([a, b, chen(a, b) + ((a >> 2) + (b >> 2)) / 100]);
    all.sort((x, y) => y[2] - x[2]);
    all.forEach(([a, b], i) => { PCT[a*52+b] = PCT[b*52+a] = (i + 1) / all.length; });
  }

  /* ---------------- equidade por Monte Carlo ---------------- */
  // ranges[i] = fração do topo das mãos que o adversário i pode ter (1 = qualquer)
  const pool = new Int8Array(52), tmp = new Int8Array(7), oh = new Int8Array(16);
  // conds[o] (opcional) = {min, bluff}: o adversário apostou nesta rua, então (salvo blefe) tem jogo feito
  // de categoria >= min que use carta dele, ou um projeto forte
  const t2 = new Int8Array(7);
  function fits(a, b, board, cond, bcat){
    if(Math.random() < cond.bluff) return true;
    t2[0] = a; t2[1] = b; for(let i=0;i<board.length;i++) t2[2+i] = board[i];
    const c = evalN(t2, 2 + board.length) >> 20;
    if(c >= cond.min && c > bcat) return true;
    return board.length < 5 && outs([a, b], board) >= 8;
  }
  function equity(hole, board, ranges, iters, conds){
    const bcat = board.length ? evalN(board) >> 20 : 0;
    const used = new Uint8Array(52); hole.forEach(c => used[c] = 1); board.forEach(c => used[c] = 1);
    let n0 = 0; for(let c=0;c<52;c++) if(!used[c]) pool[n0++] = c;
    const nb = 5 - board.length, k = ranges.length;
    let acc = 0;
    for(let it=0; it<iters; it++){
      let len = n0;
      const take = () => { const j = Math.floor(Math.random() * len); const c = pool[j]; pool[j] = pool[--len]; pool[len] = c; return c; };
      // mãos dos adversários (amostragem por rejeição dentro da faixa provável)
      for(let o=0;o<k;o++){
        const rg = ranges[o];
        let tries = 0, i, j;
        for(;;){
          i = Math.floor(Math.random() * len); j = Math.floor(Math.random() * (len - 1)); if(j >= i) j++;
          if((rg >= 1 || PCT[pool[i]*52+pool[j]] <= rg) && (!conds || !conds[o] || fits(pool[i], pool[j], board, conds[o], bcat)) || ++tries > 60) break;
        }
        const hi = Math.max(i, j), lo = Math.min(i, j);
        let c = pool[hi]; pool[hi] = pool[len-1]; pool[len-1] = c; len--; oh[2*o] = c;
        c = pool[lo]; pool[lo] = pool[len-1]; pool[len-1] = c; len--; oh[2*o+1] = c;
      }
      for(let i=0;i<board.length;i++) tmp[2+i] = board[i];
      for(let i=0;i<nb;i++) tmp[2+board.length+i] = take();
      tmp[0] = hole[0]; tmp[1] = hole[1];
      const mine = evalN(tmp, 7);
      let ties = 0, lose = false;
      for(let o=0;o<k && !lose;o++){
        tmp[0] = oh[2*o]; tmp[1] = oh[2*o+1];
        const s = evalN(tmp, 7);
        if(s > mine) lose = true; else if(s === mine) ties++;
      }
      if(!lose) acc += 1 / (ties + 1);
    }
    return acc / iters;
  }
  /* ---------------- leitura de projetos (draws) ---------------- */
  function outs(hole, board){
    if(board.length < 3 || board.length > 4) return 0;
    const all = hole.concat(board), sc = [0,0,0,0];
    all.forEach(c => sc[c & 3]++);
    let o = 0;
    for(let s=0;s<4;s++) if(sc[s] === 4 && hole.some(c => (c & 3) === s)) o += 9;
    let rm = 0; all.forEach(c => rm |= 1 << (c >> 2));
    if(!STR[rm]){
      let st = 0;
      for(let r=0;r<13;r++) if(!(rm & (1 << r))){ const m = rm | (1 << r); if(STR[m]) st++; }
      o += st >= 2 ? 8 : st === 1 ? 4 : 0;
    }
    return Math.min(15, o);
  }

  /* ---------------- decisão do bot ---------------- */
  const LV = {
    facil:  {it:180,  noise:.07, margin:-.03, bluff:.03, semi:.10, ranges:false, pos:false, model:false, slow:0, steal:0},
    normal: {it:550,  noise:.02, margin:.02,  bluff:.07, semi:.35, ranges:true,  pos:true,  model:false, slow:.05, steal:.35},
    dificil:{it:1200, noise:0,   margin:.01,  bluff:.11, semi:.55, ranges:true,  pos:true,  model:true,  slow:.12, steal:.6}
  };
  const round5 = x => Math.max(5, Math.round(x / 5) * 5);
  // faixa provável de mãos de um adversário a partir do que ele fez nesta mão (e do histórico)
  function rangeOf(st, o, P){
    if(!P.ranges) return 1;
    let r = st.pf[o] >= 3 ? .10 : st.pf[o] === 2 ? .26 : st.pf[o] === 1 ? .55 : 1;
    if(st.street > 0 && st.pf[o] === 0) r = .85;            // ficou no pote sem colocar fichas voluntárias (BB)
    if(P.model){
      const S = st.stats[o];
      if(S && S.h >= 8){ const loose = clamp(((S.vp + 1) / (S.h + 3)) / .30, .6, 1.9); r = Math.min(1, r * loose); }
    }
    return r;
  }
  // agressividade do adversário (apostas+aumentos / pagamentos)
  function aggOf(st, o){ const S = st.stats[o]; return S ? (S.br + 1) / (S.ca + 2) : .5; }

  function decide(st, me, diff){
    const P = LV[diff] || LV.normal;
    const hole = st.hole[me], board = st.board;
    const opps = []; for(let i=0;i<st.n;i++) if(i !== me && !st.out[i] && !st.folded[i]) opps.push(i);
    const k = Math.max(1, opps.length);
    const toCall = Math.max(0, st.cur - st.bet[me]), stack = st.chips[me];
    const pot = st.tot.reduce((a, b) => a + b, 0);
    const bb = st.bb;
        // leitura (Difícil): quem apostou/aumentou nesta rua tem, em geral, jogo feito
    let conds = null;
    if(P.model && st.street > 0 && st.sAgg){
      conds = opps.map(o => st.sAgg[o] ? {min: st.sAgg[o] >= 2 ? 2 : 1, bluff: clamp(.12 + .12 * (aggOf(st, o) - 1), .08, .45)} : null);
      if(!conds.some(Boolean)) conds = null;
    }
    let eq = equity(hole, board, opps.map(o => rangeOf(st, o, P)), P.it, conds);
    if(P.noise) eq = clamp(eq + (Math.random()*2 - 1) * P.noise, 0, 1);
    let hn = Math.pow(eq, 1 / k);                                     // força equivalente a mano a mano
    // posição: último a agir na rodada de apostas
    const lastToAct = P.pos && isLast(st, me);
    if(lastToAct && st.street > 0) hn += .03;
    const dr = st.street < 3 ? outs(hole, board) : 0;
    const others = opps.filter(o => !st.allin[o]);
    const canRaise = !st.acted[me] && others.length > 0 && stack > toCall;
    const maxTo = st.bet[me] + stack, minTo = Math.min(maxTo, st.cur + st.minR);
    const R = Math.random();
    // aposta/aumento para "to" (total na rodada), arredondado; perto do tudo vira all-in
    const raiseTo = x => { let to = Math.max(minTo, round5(x)); if(to >= maxTo * .7) to = maxTo; return {t:'raise', to:Math.min(to, maxTo)}; };
    const passive = toCall ? (stack <= toCall ? {t:'call'} : null) : {t:'check'};
    // leitura: quem apostou contra mim é agressivo (blefa mais) ou passivo (aposta só com jogo)?
    let rd = 0;
    if(P.model && toCall > 0){
      const agg = st.lastAgg >= 0 ? aggOf(st, st.lastAgg) : .5;
      rd = agg > 1.4 ? -.04 : agg < .6 ? .05 : 0;
    }
    // fold equity: menos adversários, adversários que largam muito → blefe rende mais
    let fe = 1 / k;
    if(P.model){ const fr = opps.map(o => { const S = st.stats[o]; return S && S.dec >= 8 ? S.fo / S.dec : .35; }); fe *= clamp(fr.reduce((a,b)=>a+b,0) / fr.length / .35, .5, 1.6); }

    /* --- pré-flop com pilha curta: empurra ou larga --- */
    if(st.street === 0 && stack + st.bet[me] <= 12 * bb){
      const thr = .5 + .02 * (k - 1) + (stack / bb) * .006;
      if(hn > thr || (toCall >= stack && eq > toCall / (pot + toCall) + .02)) return canRaise ? {t:'raise', to:maxTo} : toCall ? {t:'call'} : {t:'check'};
      if(toCall === 0) return {t:'check'};
      return {t:'fold'};
    }
    if(toCall === 0){
      // ninguém apostou: valor, proteção, semi-blefe ou blefe
      if(st.street === 0){
        // só o big blind chega aqui sem aposta (todos pagaram): aumenta com mão forte
        if(canRaise && hn > .66) return raiseTo(st.cur + (2.5 + k * .5) * bb);
        return {t:'check'};
      }
      if(canRaise && hn > .72){
        if(hn > .9 && st.street < 3 && R < P.slow) return {t:'check'};            // armadilha (slow play)
        const f = hn > .88 ? .75 : .6;
        return raiseTo(st.cur + pot * (diff === 'facil' ? .5 : f));
      }
      if(canRaise && hn > .6 && k <= 2 && (lastToAct || diff === 'facil') && R < .5) return raiseTo(pot * .45);
      if(canRaise && dr >= 8 && R < P.semi) return raiseTo(pot * .6);
      if(canRaise && R < P.bluff * fe * (lastToAct ? 1.6 : 1) * (st.street === 3 ? 1.2 : 1) && hn < .45) return raiseTo(pot * (.5 + Math.random() * .25));
      return {t:'check'};
    }
    // há aposta para pagar
    const po = toCall / (pot + toCall);
    const implied = dr >= 8 && st.street < 2 ? .04 : dr >= 4 && st.street < 2 ? .015 : 0;
    const need = po + P.margin + rd - implied;
    const commit = toCall >= stack * .5;
    // aumento por valor
    let rThr = st.street === 0 ? (st.raises >= 2 ? .74 : .64) : .78;
    if(st.street === 0 && lastToAct) rThr -= .03;
    if(canRaise && hn > rThr){
      if(st.street > 0 && hn > .9 && R < P.slow && st.street < 3) return passive || {t:'call'};
      const to = st.street === 0 ? st.cur * (st.raises >= 1 ? 3 : 3) : st.cur * 2.5 + (pot - st.cur) * .4;
      return raiseTo(to);
    }
    // roubo dos blinds em posição tardia (ninguém entrou ainda)
    if(st.street === 0 && canRaise && st.raises === 0 && toCall <= bb && lastToAct && hn > .5 && R < P.steal) return raiseTo(st.cur * 2.5);
    if(eq >= need + (commit ? .04 : 0)) return {t:'call'};
    // semi-blefe com aumento (projeto forte, ainda há cartas)
    if(canRaise && dr >= 8 && st.street > 0 && R < P.semi * .35 && !commit) return raiseTo(st.cur * 2.6);
    // blefe com aumento (raro; mano a mano, adversário que larga)
    if(canRaise && P.model && k === 1 && st.street > 0 && !commit && R < P.bluff * .35 * fe) return raiseTo(st.cur * 2.8);
    if(eq >= need - .03 && toCall <= bb && st.street === 0) return {t:'call'};    // completar barato
    return {t:'fold'};
  }
  // sou o último a agir nesta rodada? (ninguém depois de mim, até o botão)
  function isLast(st, me){
    for(let k=1;k<st.n;k++){
      const i = (me + k) % st.n;
      if(!st.out[i] && !st.folded[i] && !st.allin[i]){
        // se o próximo a falar vem antes do botão no sentido horário, não sou o último
        const dMe = (me - st.dealer + st.n) % st.n, dI = (i - st.dealer + st.n) % st.n;
        if(dI > dMe) return false;
      }
    }
    return true;
  }
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

  const card = c => ({r:RN[c >> 2], s:['♣','♥','♠','♦'][c & 3], id:'p' + c});
  return {RN, CATS, evalN, best5, handName, catOf, equity, chen, PCT, outs, decide, card, LV};
})();
