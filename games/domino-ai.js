/* =====================================================================
   Bot do Dominó (duplo-seis). Independente da Mesa.
   Recebe só o que o jogador pode saber ("conhecimento"):
     {n, team, me, hand, ends, board, counts, bone, lacks, opened, must, armL, armR}
   - lacks[q][v]: q certamente NÃO tem pedra com o número v (passou/comprou com v na ponta)
   - opened[q][v]: quantas vezes q abriu (deixou na ponta) o número v
   Normal: heurísticas (descarregar carroças e pedras pesadas, variedade na mão,
   trancar o número que o próximo adversário não tem, proteger o parceiro,
   contar o que já saiu e calcular se trancar compensa).
   Difícil: simulação (Monte Carlo com mãos sorteadas coerentes com os passes).
   ===================================================================== */
const DominoAI = (() => {
'use strict';
const T = [];
for(let a=0;a<=6;a++) for(let b=a;b<=6;b++) T.push([a,b]);
const pips = id => T[id][0] + T[id][1];
const has = (id, v) => T[id][0] === v || T[id][1] === v;
const dbl = id => T[id][0] === T[id][1];
const other = (id, v) => T[id][0] === v ? T[id][1] : T[id][0];
const cfg = {time:900};

/* ---------- lances ---------- */
function moves(K){
  const h = K.hand, e = K.ends;
  if(!e) return (K.must != null ? [K.must] : h).map(id => ({id, side:'R'}));
  const out = [];
  for(const id of h){
    const l = has(id, e[0]), r = has(id, e[1]);
    if(l && r && e[0] === e[1]) out.push({id, side: K.armL <= K.armR ? 'L' : 'R'});   // tanto faz o lado
    else { if(l) out.push({id, side:'L'}); if(r) out.push({id, side:'R'}); }
  }
  return out;
}
function newEnds(e, m){
  if(!e) return T[m.id].slice();
  return m.side === 'L' ? [other(m.id, e[0]), e[1]] : [e[0], other(m.id, e[1])];
}
const partnerOf = K => K.team ? (K.me + 2) % 4 : -1;
const isOpp = (K, q) => q !== K.me && (!K.team || q % 2 !== K.me % 2);

/* ---------- contagem: o que não vi (mãos dos outros + monte) ---------- */
function unseen(K){
  const seen = new Uint8Array(28);
  K.board.forEach(id => seen[id] = 1); K.hand.forEach(id => seen[id] = 1);
  const u = []; for(let id=0;id<28;id++) if(!seen[id]) u.push(id);
  return u;
}
const lacksTile = (K, q, id) => K.lacks[q][T[id][0]] || K.lacks[q][T[id][1]];
// probabilidade de q NÃO ter nenhuma pedra com os números vals
function probNone(K, U, q, vals){
  const h = K.counts[q]; if(!h) return 1;
  let pool = 0, m = 0;
  for(const id of U){ if(lacksTile(K, q, id)) continue; pool++; if(vals.some(v => has(id, v))) m++; }
  if(m === 0) return 1;
  if(pool - m < h) return 0;
  let p = 1; for(let i=0;i<h;i++) p *= (pool - m - i) / (pool - i);
  return p;
}
function avgPips(K, U, q){
  let s = 0, n = 0; for(const id of U){ if(lacksTile(K, q, id)) continue; s += pips(id); n++; }
  return n ? s / n : 6;
}
// depois do lance, nenhuma pedra fora da mesa serve nas pontas → jogo trancado
function locksAfter(K, U, m, ne, after){
  const all = U.concat(after);
  return !all.some(id => has(id, ne[0]) || has(id, ne[1]));
}
// valor esperado (em pontos) de trancar agora
function lockValue(K, U, after){
  const mine = after.reduce((s, id) => s + pips(id), 0);
  const est = q => K.counts[q] * avgPips(K, U, q);
  if(K.team){
    const p = partnerOf(K);
    const ours = mine + est(p), theirs = est((K.me+1)%4) + est((K.me+3)%4);
    const pw = 1 / (1 + Math.exp((ours - theirs) / 4));
    return pw * theirs - (1 - pw) * ours;
  }
  const others = []; for(let q=0;q<K.n;q++) if(q !== K.me) others.push(est(q));
  const best = Math.min(...others), sum = others.reduce((a,b) => a+b, 0);
  const pw = 1 / (1 + Math.exp((mine - best) / 4));
  return pw * sum - (1 - pw) * mine;
}

/* ---------- heurística (Fácil/Normal) ---------- */
function heur(K, U, m, level){
  const id = m.id, after = K.hand.filter(x => x !== id), ne = newEnds(K.ends, m);
  let s = pips(id) * 1.0 + (dbl(id) ? 5 : 0);              // carroças e pedras pesadas saem cedo
  if(!after.length) return 1e6;                             // bateu!
  // variedade de números na mão e controle das pontas
  const nums = new Set(); after.forEach(x => { nums.add(T[x][0]); nums.add(T[x][1]); });
  s += 1.3 * nums.size;
  const fit = after.filter(x => has(x, ne[0]) || has(x, ne[1])).length;
  s += 2.2 * Math.min(fit, 3) - (fit === 0 ? 3 : 0);
  if(level === 'facil'){                                    // o Fácil só evita trancar quando está perdendo
    if(locksAfter(K, U, m, ne, after)){ const lv = lockValue(K, U, after); if(lv < 0) s += lv; }
    return s;
  }
  // carroças que estão "morrendo" (quase todas as pedras do número já saíram)
  const outCnt = new Array(7).fill(0); K.board.forEach(x => { outCnt[T[x][0]]++; if(!dbl(x)) outCnt[T[x][1]]++; });
  if(dbl(id)) s += outCnt[T[id][0]] >= 4 ? 3 : 0;
  for(const x of after) if(dbl(x)){ const v = T[x][0]; if(outCnt[v] + (has(id, v) && !dbl(id) ? 1 : 0) >= 5) s -= 4; }
  // domínio: números que só eu tenho (os outros não têm mais) nas pontas me dão controle
  const nxt = (K.me + 1) % K.n;
  const pNext = probNone(K, U, nxt, ne);
  const bonePen = K.bone > 0 ? 0.45 : 1;                    // com monte, ele compra em vez de passar
  s += 9 * pNext * bonePen;
  if(K.team){
    const p = partnerOf(K), prev = (K.me + 3) % 4;
    s -= 5 * probNone(K, U, p, ne);                          // não feche o parceiro
    s += 3 * probNone(K, U, prev, ne);                       // e o outro adversário também
    // números que o parceiro abriu: não cubra a ponta dele
    if(K.ends){
      const covered = m.side === 'L' ? K.ends[0] : K.ends[1];
      if(!ne.includes(covered)) s -= 2.5 * Math.min(2, K.opened[p][covered] || 0);
      for(const v of ne) s += 1.2 * Math.min(2, K.opened[p][v] || 0);
    }
  } else if(K.n > 2){
    for(let q=0;q<K.n;q++) if(q !== K.me && q !== nxt) s += 2 * probNone(K, U, q, ne) * bonePen;
  }
  // trancar compensa?
  if(locksAfter(K, U, m, ne, after)) s += lockValue(K, U, after) * 0.9;
  return s;
}

/* ---------- Monte Carlo (Difícil) ---------- */
function shuffleIn(a){ for(let i=a.length-1;i>0;i--){ const j = Math.floor(Math.random()*(i+1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
// sorteia as mãos dos outros e o monte, respeitando contagens e números que cada um não tem
function sampleDeal(K, U){
  const others = []; for(let q=0;q<K.n;q++) if(q !== K.me) others.push(q);
  for(let att=0; att<40; att++){
    const pool = shuffleIn(U.slice()), hands = [];
    const relax = att >= 30;
    const ord = others.slice().sort((a,b) => (U.filter(id => !lacksTile(K, a, id)).length - K.counts[a]) - (U.filter(id => !lacksTile(K, b, id)).length - K.counts[b]));
    let ok = true;
    for(const q of ord){
      const take = [];
      for(let i=0;i<pool.length && take.length < K.counts[q];){
        if(relax || !lacksTile(K, q, pool[i])){ take.push(pool[i]); pool.splice(i, 1); } else i++;
      }
      if(take.length < K.counts[q]){ ok = false; break; }
      hands[q] = take;
    }
    if(ok){ hands[K.me] = K.hand.slice(); return {hands, bone:pool}; }
  }
  return null;
}
// política rápida das simulações (todos jogam com as mãos sorteadas à mostra)
function rollPick(hands, p, ms, e, n, team){
  if(ms.length === 1) return ms[0];
  const nx = (p + 1) % n, hp = hands[p];
  let best = ms[0], bs = -1e9;
  for(const m of ms){
    const ne = e ? (m.side === 'L' ? [other(m.id, e[0]), e[1]] : [e[0], other(m.id, e[1])]) : T[m.id];
    let s = pips(m.id) + (dbl(m.id) ? 4 : 0) + Math.random() * 2;
    if(!hands[nx].some(x => has(x, ne[0]) || has(x, ne[1]))) s += (team && nx % 2 === p % 2) ? -6 : 7;
    let fit = 0; for(const x of hp) if(x !== m.id && (has(x, ne[0]) || has(x, ne[1]))) fit++;
    s += 1.5 * Math.min(fit, 3);
    if(s > bs){ bs = s; best = m; }
  }
  return best;
}
function rollMoves(h, e){
  const out = [];
  for(const id of h){
    if(!e){ out.push({id, side:'R'}); continue; }
    const l = has(id, e[0]), r = has(id, e[1]);
    if(l) out.push({id, side:'L'}); if(r && !(l && e[0] === e[1])) out.push({id, side:'R'});
  }
  return out;
}
// joga o resto da mão a partir do lance m do jogador me; devolve o saldo de pontos (meu lado − adversários)
function rollout(K, deal, m){
  const n = K.n, hands = deal.hands.map(h => h ? h.slice() : []), bone = deal.bone.slice();
  let e = K.ends ? K.ends.slice() : null;
  const play = (p, mv) => { const h = hands[p]; h.splice(h.indexOf(mv.id), 1); e = e ? (mv.side === 'L' ? [other(mv.id, e[0]), e[1]] : [e[0], other(mv.id, e[1])]) : T[mv.id].slice(); };
  play(K.me, m);
  let p = K.me, passes = 0, winner = -1, locked = false;
  if(!hands[p].length) winner = p;
  let guard = 0;
  while(winner < 0 && guard++ < 200){
    p = (p + 1) % n;
    let ms = rollMoves(hands[p], e);
    while(!ms.length && bone.length){ const d = bone.pop(); hands[p].push(d); if(has(d, e[0]) || has(d, e[1])) ms = rollMoves([d], e); }
    if(!ms.length){ if(++passes >= n){ locked = true; break; } continue; }
    passes = 0;
    play(p, rollPick(hands, p, ms, e, n, K.team));
    if(!hands[p].length) winner = p;
  }
  const tot = hands.map(h => h.reduce((s, id) => s + pips(id), 0));
  const gain = new Array(n).fill(0);
  if(K.team){
    const side = q => q % 2;
    let w = -1;
    if(winner >= 0) w = side(winner);
    else { const a = tot[0] + tot[2], b = tot[1] + tot[3]; w = a < b ? 0 : b < a ? 1 : -1; }
    if(w >= 0){ const pts = tot[1-w] + tot[3-w]; return side(K.me) === w ? pts : -pts; }
    return 0;
  }
  if(winner < 0){
    const mn = Math.min(...tot), ws = tot.map((t,q) => t === mn ? q : -1).filter(q => q >= 0);
    if(ws.length === 1) winner = ws[0];
  }
  if(winner >= 0){ gain[winner] = tot.reduce((a,b) => a+b, 0) - tot[winner]; }
  let others = 0; for(let q=0;q<n;q++) if(q !== K.me) others = Math.max(others, gain[q]);
  return gain[K.me] - others;
}
function montecarlo(K, U, ms, budget){
  const t0 = Date.now(), sum = new Float64Array(ms.length);
  let n = 0;
  while(Date.now() - t0 < budget && n < 4000){
    const deal = sampleDeal(K, U); if(!deal) break;
    for(let i=0;i<ms.length;i++) sum[i] += rollout(K, deal, ms[i]);
    n++;
  }
  return n ? Array.from(sum, x => x / n) : null;
}

/* ---------- escolha ---------- */
function think(K, level){
  const ms = moves(K);
  if(!ms.length) return null;
  if(ms.length === 1) return ms[0];
  const U = unseen(K);
  const hs = ms.map(m => heur(K, U, m, level));
  if(level === 'dificil'){
    const mc = montecarlo(K, U, ms, cfg.time);
    if(mc){
      let bi = 0, bv = -1e9;
      for(let i=0;i<ms.length;i++){ const v = mc[i] + 0.04 * hs[i]; if(v > bv){ bv = v; bi = i; } }
      return ms[bi];
    }
  }
  let bi = 0;
  for(let i=1;i<ms.length;i++) if(hs[i] > hs[bi]) bi = i;
  if(level === 'facil'){
    // erra de leve: sorteia entre os lances quase tão bons
    const ok = ms.map((m,i) => i).filter(i => hs[i] >= hs[bi] - 3);
    bi = ok[Math.floor(Math.random()*ok.length)];
  }
  return ms[bi];
}
return { think, moves, newEnds, T, pips, has, dbl, other, cfg, heur, unseen };
})();
