/* =====================================================================
   Pontinho — motor de jogos com curinga + bot (usa shared/melds.js)
   ===================================================================== */
"use strict";
/* ---------- motor de jogos com curinga: trincas e sequências do mesmo naipe ----------
   Usa RV13/RANK_OF de shared/melds.js. Uma carta é {r, s, id}; isW(c) diz se é curinga.
   Regra comum: jogo com 3+ cartas, pelo menos 2 naturais e nunca mais curingas que naturais.
   Trinca: mesmo valor, naipes diferentes (até 4 cartas). Sequência: mesmo naipe, A-2-3 ou Q-K-A
   (não vira K-A-2). Um curinga pode valer como ele mesmo (ex.: 2♣ em A♣ 2♣ 3♣). */
const KEY = c => c.r + c.s;
const SO4 = {'♣':0,'♥':1,'♠':2,'♦':3};

function mTrinca(nat, wild){
  const r = nat[0].r;
  if(nat.some(c => c.r !== r || c.r === 'JK')) return null;
  if(new Set(nat.map(c => c.s)).size !== nat.length) return null;
  if(nat.length + wild.length > 4) return null;
  return {type:'t', rank:r, order:nat.slice().sort((a,b) => SO4[a.s] - SO4[b.s]).concat(wild), wild:wild.length};
}
function mSeq(nat, wild){
  const s = nat[0].s;
  if(nat.some(c => c.s !== s || c.r === 'JK')) return null;
  for(const hi of [false, true]){
    const vs = nat.map(c => { const v = RV13(c.r); return v === 1 && hi ? 14 : v; });
    if(new Set(vs).size !== vs.length) continue;
    const mn = Math.min(...vs), mx = Math.max(...vs), gaps = mx - mn + 1 - vs.length;
    if(gaps > wild.length || nat.length + wild.length > 14) continue;
    const extra = wild.length - gaps, up = Math.min(14 - mx, extra), down = extra - up;
    if(mn - down < 1) continue;
    const sorted = nat.map((c,i) => ({c, v:vs[i]})).sort((a,b) => a.v - b.v), w = wild.slice(), order = [];
    for(let i=0;i<down;i++) order.push(w.shift());
    sorted.forEach((x,i) => { if(i) for(let g = sorted[i-1].v + 1; g < x.v; g++) order.push(w.shift()); order.push(x.c); });
    while(w.length) order.push(w.shift());
    return {type:'s', suit:s, order, wild:wild.length, lo:mn - down, hi:mx + up};
  }
  return null;
}
// valida um jogo; devolve {type, order, wild} ou null
function meldInfo(cards, isW){
  if(!Array.isArray(cards) || cards.length < 3) return null;
  if(cards.some(c => !c) || new Set(cards.map(c => c.id)).size !== cards.length) return null;
  const ws = cards.filter(isW), base = cards.filter(c => !isW(c));
  let best = null;
  const k = Math.min(ws.length, 6);
  for(let mask = 0; mask < (1 << k); mask++){
    const nat = base.slice(), wild = ws.slice(k);
    let bad = false;
    for(let i=0;i<k;i++){ if(mask >> i & 1){ if(ws[i].r === 'JK'){ bad = true; break; } nat.push(ws[i]); } else wild.push(ws[i]); }
    if(bad || nat.length < 2 || wild.length > nat.length) continue;
    const r = mTrinca(nat, wild) || mSeq(nat, wild);
    if(r && (!best || r.wild < best.wild)) best = r;
  }
  return best;
}

/* Melhor cobertura da mão: o maior número de cartas em jogos disjuntos e, no empate,
   o menor total de pontos sobrando (ptsOf) e o menor uso de curingas.
   nat = cartas naturais; wild = cartas curinga (usadas como curinga). */
let COVER_CACHE = new Map();
function coverNat(nat, wild, ptsOf, wildPts){
  const W = wild.length;
  const types = [], idx = {};
  for(const c of nat){ const k = KEY(c); if(idx[k] == null){ idx[k] = types.length; types.push({k, r:c.r, s:c.s, n:0, pts:ptsOf ? ptsOf(c) : 0, cards:[]}); } types[idx[k]].n++; types[idx[k]].cards.push(c); }
  const T = types.length;
  const cores = [], byType = types.map(() => []);
  const addCore = (ts, need, kind, size) => {
    const cap = kind === 't' ? Math.min(4 - size, ts.length - need) : Math.min(14 - size, ts.length - need);
    const ci = cores.length; cores.push({ts, need, kind, cap:Math.max(0, cap)}); byType[Math.min(...ts)].push(ci);
  };
  // trincas (2+ naipes diferentes do mesmo valor)
  const byR = {};
  types.forEach((t,i) => (byR[t.r] = byR[t.r] || []).push(i));
  for(const r in byR){
    const g = byR[r], m = g.length;
    for(let mask=1; mask < (1 << m); mask++){
      const ts = g.filter((_,i) => mask >> i & 1); if(ts.length < 2) continue;
      const need = Math.max(0, 3 - ts.length); if(need > W) continue;
      addCore(ts, need, 't', ts.length + need);
    }
  }
  // sequências: extremos naturais; no meio, buracos cobertos por curingas
  for(const s of ['♣','♥','♠','♦']){
    const pres = Array(15).fill(-1);
    types.forEach((t,i) => { if(t.s === s){ const v = RV13(t.r); pres[v] = i; if(v === 1) pres[14] = i; } });
    for(let a=1; a<=13; a++){
      if(pres[a] < 0) continue;
      let absent = 0;
      for(let b=a+1; b<=14; b++){
        if(b > a + 1 && pres[b-1] < 0) absent++;
        if(absent > W) break;
        if(pres[b] < 0 || (a === 1 && b === 14)) continue;
        const inner = []; for(let v=a+1; v<b; v++) if(pres[v] >= 0) inner.push(pres[v]);
        const len = b - a + 1, skipMax = Math.min(W - absent, inner.length);
        // escolhe quais do meio ficam de fora (viram buraco), até skipMax
        const rec = (from, skipped, kept) => {
          const ts = [pres[a]].concat(kept, inner.slice(from), [pres[b]]);
          const gaps = absent + skipped, need = gaps + Math.max(0, 3 - len);
          if(need <= W && need <= ts.length) addCore(ts, need, 's', Math.max(len, 3));
          if(skipped >= skipMax) return;
          for(let i=from; i<inner.length; i++) rec(i+1, skipped+1, kept.concat(inner.slice(from, i)));
        };
        rec(0, 0, []);
      }
    }
  }
  // busca exata
  const cnt = types.map(t => t.n);
  let remNat = nat.length;
  let best = {n:-1, pts:Infinity, wu:Infinity, pick:null};
  const pick = [], total = nat.length + W;
  const rec = (i, wLeft, covered, dead, cap) => {
    while(i < T && cnt[i] === 0) i++;
    if(i === T){
      const extra = Math.min(wLeft, cap), n = covered + (W - wLeft) + extra;
      const pts = dead + (wLeft - extra) * (wildPts || 0), wu = W - wLeft + extra;
      if(n > best.n || (n === best.n && (pts < best.pts || (pts === best.pts && wu < best.wu)))) best = {n, pts, wu, pick:pick.slice()};
      return;
    }
    if(covered + remNat + W < best.n) return;
    if(best.n === total) return;
    for(const ci of byType[i]){
      const c = cores[ci];
      if(c.need > wLeft) continue;
      let ok = true; for(const t of c.ts) if(cnt[t] <= 0){ ok = false; break; }
      if(!ok) continue;
      for(const t of c.ts) cnt[t]--; remNat -= c.ts.length; pick.push(ci);
      rec(i, wLeft - c.need, covered + c.ts.length, dead, cap + c.cap);
      pick.pop(); remNat += c.ts.length; for(const t of c.ts) cnt[t]++;
    }
    cnt[i]--; remNat--;
    rec(i, wLeft, covered, dead + types[i].pts, cap);
    cnt[i]++; remNat++;
  };
  rec(0, W, 0, 0, 0);
  // monta os jogos com as cartas de verdade; os curingas que sobram entram onde cabem
  const pool = types.map(t => t.cards.slice()), wl = wild.slice(), groups = [];
  for(const ci of best.pick){
    const c = cores[ci];
    groups.push({cards:c.ts.map(t => pool[t].pop()).concat(wl.splice(0, c.need)), cap:c.cap});
  }
  const spare = [];
  for(const g of groups){ while(wl.length && g.cap > 0){ const w = wl.shift(); spare.push(w); g.cards.push(w); g.cap--; } }
  return {n:best.n, pts:best.pts, wu:best.wu, groups:groups.map(g => g.cards), spare, left:pool.flat().concat(wl)};
}
// cobertura rápida (todos os curingas como curinga), com cache
function coverFast(cards, isW, ptsOf, wildPts){
  const key = cards.map(KEY).sort().join(',');
  let r = COVER_CACHE.get(key);
  if(r) return r;
  if(COVER_CACHE.size > 60000) COVER_CACHE = new Map();
  r = coverNat(cards.filter(c => !isW(c)), cards.filter(isW), ptsOf, wildPts);
  r = {n:r.n, pts:r.pts, wu:r.wu};
  COVER_CACHE.set(key, r);
  return r;
}
// cobertura exata (testa curingas valendo como eles mesmos); devolve os jogos montados
function coverFull(cards, isW, ptsOf, wildPts){
  const ws = cards.filter(c => isW(c) && c.r !== 'JK'), k = Math.min(ws.length, 4);
  let best = null;
  for(let mask = 0; mask < (1 << k); mask++){
    const asNat = ws.filter((_,i) => mask >> i & 1);
    const nat = cards.filter(c => !isW(c) || asNat.includes(c)), wild = cards.filter(c => isW(c) && !asNat.includes(c));
    const r = coverNat(nat, wild, ptsOf, wildPts);
    if(!best || r.n > best.n || (r.n === best.n && (r.pts < best.pts || (r.pts === best.pts && r.wu < best.wu)))) best = r;
    if(best.n === cards.length && best.wu === 0) break;
  }
  return best;
}

/* =============================== PONTINHO: bot ===============================
   Valor da mão = cartas que ainda não formam jogo (cada uma custa) + os pontos que
   ficariam na mão se alguém batesse agora (pesando mais quando algum adversário está
   perto de bater ou quando eu estou perto de estourar) + as "saídas" (cartas vivas que
   completariam jogos, com peso enorme para as que fazem bater). Baixa os jogos, encaixa
   o que puder, nunca descarta curinga à toa e evita dar ao próximo a carta que ele quer. */
const DIFF = {facil:'Fácil', normal:'Normal', dificil:'Difícil'};
const PK = {rb:0.15, rt:1.4, ow:0.7, lx:4, fd:0.8, bust:2.2, hold:0, deep:0};   // ajustes do Difícil
const pIsW = c => c.r === '2' || c.r === 'JK';
const pPts = c => pIsW(c) ? 20 : c.r === 'A' ? 15 : (c.r === '10' || c.r === 'J' || c.r === 'Q' || c.r === 'K') ? 10 : +c.r;
const handPts = h => h.reduce((s,c) => s + pPts(c), 0);
function pNext(st, i){ for(let k=0;k<st.n;k++){ i = (i + 1) % st.n; if(st.alive[i]) return i; } return i; }
const pFits = (st, cards) => st.melds.findIndex(m => meldInfo(m.c.concat(cards), pIsW));
function pLive(st, seat, lvl){
  const cnt = {}; let wSeen = 0;
  const see = c => { if(pIsW(c)){ wSeen++; return; } const k = KEY(c); cnt[k] = (cnt[k] || 0) + 1; };
  st.hands[seat].forEach(see); st.melds.forEach(m => m.c.forEach(see));
  if(lvl === 'facil'){ const t = st.lixo[st.lixo.length-1]; if(t) see(t); }
  else { st.lixo.forEach(see); if(lvl === 'dificil') st.pub.forEach((cs,i) => { if(i !== seat) cs.forEach(see); }); }
  return {L:k => Math.max(0, 2 - (cnt[k] || 0)), W:Math.max(0, 12 - wSeen)};
}
function pRelated(h){
  const m = new Map();
  for(const c of h){
    if(pIsW(c)) continue;
    for(const s of ['♣','♥','♠','♦']) if(s !== c.s) m.set(c.r + s, {r:c.r, s, id:'?'});
    const v = RV13(c.r);
    for(const d of [-2,-1,1,2]){
      let w = v + d; if(v === 1 && d < 0) w = 14 + d;
      if(w < 1 || w > 14) continue;
      const r = RANK_OF(w); if(r !== '2') m.set(r + c.s, {r, s:c.s, id:'?'});
    }
  }
  return m;
}
// ameaça: quão perto alguém está de bater (0 a 1)
function pThreat(st, seat){
  let t = 0;
  st.hands.forEach((h,i) => { if(i === seat || !st.alive[i]) return; const n = h.length;
    t = Math.max(t, n <= 1 ? 1 : n === 2 ? 0.75 : n === 3 ? 0.45 : n === 4 ? 0.25 : n <= 6 ? 0.1 : 0.04); });
  return t;
}
function pRisk(st, seat, lvl, hand){
  if(lvl === 'facil') return 0.25;
  if(lvl === 'normal') return 0.2 + 0.5 * pThreat(st, seat);
  let r = PK.rb + PK.rt * pThreat(st, seat);
  const room = st.limit - st.score[seat];                     // quanto falta para estourar
  if(handPts(hand) >= room) r *= PK.bust; else if(handPts(hand) >= room * 0.6) r *= 1.4;
  return r;
}
// valor de uma mão (mais alto = melhor)
function pValue(st, hand, live, risk, ow){
  if(!hand.length) return 1e6;
  const cv = coverFast(hand, pIsW, pPts, 20), unc = hand.length - cv.n;
  if(unc === 0) return 5e5;
  let outs = 0;
  const tryCard = (card, L) => {
    if(L <= 0) return;
    const n2 = coverFast(hand.concat([card]), pIsW, pPts, 20).n, u2 = hand.length + 1 - n2;
    if(u2 <= 1) outs += L * 9; else if(n2 > cv.n + (pIsW(card) ? 1 : 0)) outs += L * (n2 - cv.n);
  };
  for(const [k, card] of pRelated(hand)) tryCard(card, live.L(k));
  tryCard({r:'JK', s:'♣', id:'?w'}, live.W / 3);             // curingas valem para tudo, mas são poucos
  return -unc * 10 - risk * cv.pts + outs * (ow || 0.7);
}
// quanto uma carta ajuda o próximo jogador (pelo que ele pegou do lixo e pelo que jogou fora)
function pFeed(st, seat, c, full){
  if(pIsW(c)) return 30;
  const nx = pNext(st, seat); let d = 0;
  if(pFits(st, [c]) >= 0) d += 8;                              // ele pegaria para encaixar
  for(const o of st.pub[nx] || []){
    if(o.r === c.r && o.s !== c.s) d += 5;
    else if(o.s === c.s){ const g = Math.abs(RV13(o.r) - RV13(c.r)); if(g === 1) d += 5; else if(g === 2) d += 3; }
  }
  if(full) for(const o of st.disc[nx] || []){
    if(o.r === c.r) d -= 2;
    else if(o.s === c.s && Math.abs(RV13(o.r) - RV13(c.r)) <= 1) d -= 1;
  }
  return d;
}
function pBestDiscard(st, seat, hand, lvl, live, risk){
  const nonW = hand.filter(c => !pIsW(c)), pool = nonW.length ? nonW : hand;
  let best = null;
  for(const c of pool){
    const rest = hand.filter(x => x !== c);
    let sc = pValue(st, rest, live, risk, lvl === 'dificil' ? PK.ow : 0.7);
    if(lvl === 'dificil') sc -= pFeed(st, seat, c, true) * PK.fd;
    sc += Math.random() * (lvl === 'facil' ? 5 : lvl === 'normal' ? 0.3 : 0.05);
    if(!best || sc > best.sc) best = {c, sc};
  }
  if(lvl === 'dificil' && PK.deep) return pDeep(st, seat, hand, pool, live, risk) || best;
  return best;
}
// Difícil: olha um lance à frente — para cada descarte bom, a média (pelas cartas vivas)
// do melhor valor depois da próxima compra e do próximo descarte
function pDeep(st, seat, hand, pool, live, risk){
  const ow = PK.ow, cands = pool.map(c => ({c, sc:pValue(st, hand.filter(x => x !== c), live, risk, ow) - pFeed(st, seat, c, true) * PK.fd}))
    .sort((a,b) => b.sc - a.sc).slice(0, PK.deep);
  if(cands.length < 2) return null;
  let unk = 104 - st.melds.reduce((a,m) => a + m.c.filter(c => !pIsW(c)).length, 0) - hand.filter(c => !pIsW(c)).length;
  let best = null;
  for(const k of cands){
    const rest = hand.filter(x => x !== k.c), base = pValue(st, rest, live, risk, ow);
    let ev = 0, wsum = 0;
    const tryX = (x, L) => {
      if(L <= 0) return;
      const h2 = rest.concat([x]); let mx = -Infinity;
      for(const d of h2){ if(pIsW(d)) continue; const v = pValue(st, h2.filter(y => y !== d), live, risk, ow); if(v > mx) mx = v; }
      ev += L * mx; wsum += L;
    };
    for(const [key, x] of pRelated(rest)) tryX(x, live.L(key));
    tryX({r:'JK', s:'♣', id:'?w'}, live.W);
    const other = Math.max(0, unk - wsum + live.W);
    ev += other * base; wsum += other;
    const sc = ev / Math.max(1, wsum) - pFeed(st, seat, k.c, true) * PK.fd;
    if(!best || sc > best.sc) best = {c:k.c, sc};
  }
  return best;
}
// plano para acabar com a mão agora: jogos novos + encaixes; sobra no máximo 1 carta (descarte)
function pPlanOut(st, hand){
  const cv = coverFull(hand, pIsW, pPts, 20);
  if(hand.length - cv.n > 3) return null;
  const table = st.melds.map(m => m.c.slice()).concat(cv.groups.map(g => g.slice()));
  const rest = [];
  const left = cv.left.slice().sort((a,b) => pIsW(a) - pIsW(b));
  for(const c of left){
    const i = table.findIndex(m => meldInfo(m.concat([c]), pIsW));
    if(i >= 0) table[i] = (meldInfo(table[i].concat([c]), pIsW)).order; else rest.push(c);
  }
  return rest.length <= 1 ? {groups:cv.groups, rest} : null;
}
function pontinhoBot(st, seat, lvl){
  if(st.phase === 'roundEnd') return {t:'next'};
  const h = st.hands[seat], live = pLive(st, seat, lvl), risk = pRisk(st, seat, lvl, h);
  if(st.phase === 'draw'){
    const top = st.lixo[st.lixo.length-1];
    if(!top) return {t:'monte'};
    const opts = [];
    // jogo novo com a carta do lixo + cartas da mão
    for(let i=0;i<h.length;i++) for(let j=i+1;j<h.length;j++){
      if(meldInfo([top, h[i], h[j]], pIsW)) opts.push([h[i], h[j]]);
    }
    const cvT = coverFull(h.concat([top]), pIsW, pPts, 20);
    for(const g of cvT.groups) if(g.includes(top) && g.length >= 3) opts.push(g.filter(c => c !== top));
    // encaixe direto num jogo da mesa
    const mi = lvl === 'facil' ? -1 : pFits(st, [top]);
    let best = null;
    const score = after => {
      if(after.length <= 1) return 1e6;
      const plan = pPlanOut(st, after); if(plan) return 9e5;
      return pBestDiscard(st, seat, after, lvl, live, risk).sc;
    };
    for(const ids of opts){
      if(lvl === 'facil' && ids.length > 2) continue;
      const after = h.filter(c => !ids.includes(c));
      const sc = score(after);
      if(!best || sc > best.sc) best = {sc, a:{t:'lixo', ids:ids.map(c => c.id)}};
    }
    if(mi >= 0){ const sc = score(h) + 2; if(!best || sc > best.sc) best = {sc, a:{t:'lixo', m:mi}}; }
    if(best){
      if(lvl === 'facil') return best.a;
      const now = pValue(st, h, live, risk);
      if(best.sc >= now - (lvl === 'dificil' ? PK.lx : 4)) return best.a;
    }
    return {t:'monte'};
  }
  // fase de jogar
  const plan = pPlanOut(st, h);
  if(plan){
    if(plan.groups.length) return {t:'meld', ids:plan.groups[0].map(c => c.id)};
    for(const c of h){ if(plan.rest.includes(c)) continue; const i = pFits(st, [c]); if(i >= 0) return {t:'add', m:i, ids:[c.id]}; }
    if(h.length === 1) return {t:'discard', id:h[0].id};
  }
  const cv = coverFull(h, pIsW, pPts, 20);
  const hold = lvl === 'dificil' && PK.hold && pThreat(st, seat) < PK.hold && h.length > 4;
  if(!hold) for(const g of cv.groups){
    let cards = g;
    if(lvl !== 'facil'){ const nat = g.filter(c => !cv.spare.includes(c)); if(meldInfo(nat, pIsW)) cards = nat; }
    if(h.length - cards.length >= 1) return {t:'meld', ids:cards.map(c => c.id)};
  }
  // encaixa o que sobra nos jogos da mesa
  const inG = new Set(cv.groups.flat());
  for(const c of h){
    if(inG.has(c) || pIsW(c) || h.length <= 1) continue;
    const i = st.melds.findIndex(m => (lvl !== 'facil' || m.o === seat) && meldInfo(m.c.concat([c]), pIsW));
    if(i >= 0) return {t:'add', m:i, ids:[c.id]};
  }
  // curinga parado na mão é caro: quando alguém está perto de bater, encaixa
  const wl = h.filter(pIsW);
  if(wl.length && h.length > 2 && lvl !== 'facil'){
    const th = pThreat(st, seat);
    if(th >= (lvl === 'dificil' ? 0.45 : 0.75)){
      const i = pFits(st, [wl[0]]);
      if(i >= 0) return {t:'add', m:i, ids:[wl[0].id]};
    }
  }
  return {t:'discard', id:pBestDiscard(st, seat, h, lvl, live, risk).c.id};
}
