/* =====================================================================
   Central de Jogos — combinações de cartas (usado por Pife e Canastra)
   ===================================================================== */
"use strict";
const RV13 = r => r === 'A' ? 1 : r === 'J' ? 11 : r === 'Q' ? 12 : r === 'K' ? 13 : +r;
const RANK_OF = v => v === 1 || v === 14 ? 'A' : v === 11 ? 'J' : v === 12 ? 'Q' : v === 13 ? 'K' : String(v);

/* ---------- PIFE: trincas (mesmo valor, naipes diferentes) e sequências do mesmo naipe ---------- */
function pifeMelds(cards){
  const out = [];
  // trincas
  const byR = {};
  cards.forEach(c => (byR[c.r] = byR[c.r] || []).push(c));
  for(const r in byR){
    const g = byR[r];
    const combos = (arr, k, start=0, cur=[]) => { if(cur.length === k){ if(new Set(cur.map(c => c.s)).size === k) out.push(cur.slice()); return; }
      for(let i=start;i<arr.length;i++){ cur.push(arr[i]); combos(arr, k, i+1, cur); cur.pop(); } };
    combos(g, 3); combos(g, 4);
  }
  // sequências (Ás baixo A-2-3 ou alto Q-K-A)
  for(const s of ['♣','♥','♠','♦']){
    const bys = {};
    cards.filter(c => c.s === s).forEach(c => { const v = RV13(c.r); (bys[v] = bys[v] || []).push(c); if(v === 1) (bys[14] = bys[14] || []).push(c); });
    for(let start=1; start<=12; start++){
      const run = [];
      for(let v=start; v<=14 && bys[v]; v++){
        run.push(v);
        if(run.length >= 3){
          // escolhe uma carta por valor (há 2 baralhos: gera combinações)
          const pickRun = (i, cur) => { if(i === run.length){ if(new Set(cur.map(c => c.id)).size === cur.length) out.push(cur.slice()); return; }
            for(const c of bys[run[i]]){ cur.push(c); pickRun(i+1, cur); cur.pop(); } };
          pickRun(0, []);
        }
      }
    }
  }
  return out;
}
// melhor cobertura: maior número de cartas em jogos disjuntos
function pifeBest(cards){
  const melds = pifeMelds(cards).map(m => ({ids:new Set(m.map(c => c.id)), cards:m}));
  let best = {n:0, sets:[]};
  const rec = (used, sets, from) => {
    const n = used.size; if(n > best.n){ best = {n, sets:sets.slice()}; }
    if(best.n === cards.length) return;
    for(let i=from;i<melds.length;i++){
      const m = melds[i]; let ok = true; for(const id of m.ids) if(used.has(id)){ ok = false; break; }
      if(!ok) continue;
      m.ids.forEach(id => used.add(id)); sets.push(m.cards);
      rec(used, sets, i+1);
      sets.pop(); m.ids.forEach(id => used.delete(id));
      if(best.n === cards.length) return;
    }
  };
  rec(new Set(), [], 0);
  return best;
}
// potencial: pares e quase-sequências fora dos jogos
function pifePotential(cards, covered){
  const free = cards.filter(c => !covered.has(c.id)); let p = 0;
  for(let i=0;i<free.length;i++) for(let j=i+1;j<free.length;j++){
    const a = free[i], b = free[j];
    if(a.r === b.r && a.s !== b.s) p += 2;
    else if(a.s === b.s){ const d = Math.abs(RV13(a.r) - RV13(b.r)); if(d === 1) p += 2; else if(d === 2) p += 1; }
  }
  return p;
}
function pifeScore(cards){ const b = pifeBest(cards); const cov = new Set(); b.sets.forEach(s => s.forEach(c => cov.add(c.id))); return b.n * 10 + pifePotential(cards, cov); }

/* ---------- CANASTRA: sequências do mesmo naipe, 2 é coringa ---------- */
// devolve null se inválido, ou {suit, wild:true/false, order:[cartas em ordem], len}
function canastraMeld(cards){
  if(!cards || cards.length < 3 || cards.length > 14) return null;
  const non2 = cards.filter(c => c.r !== '2');
  const suits = new Set(non2.map(c => c.s));
  if(suits.size > 1) return null;
  const suit = non2.length ? non2[0].s : null;
  if(!suit) return null;
  const twos = cards.filter(c => c.r === '2');
  // tenta usar 2 do mesmo naipe como natural (no máximo um), resto como coringa (máx 1 coringa)
  const tries = [];
  const sameTwos = twos.filter(c => c.s === suit);
  tries.push({nat:[], wild:twos});
  if(sameTwos.length) tries.push({nat:[sameTwos[0]], wild:twos.filter(c => c !== sameTwos[0])});
  let best = null;
  for(const t of tries){
    if(t.wild.length > 1) continue;
    const nat = non2.concat(t.nat);
    for(const aceHigh of [false, true]){
      const vals = nat.map(c => { const v = RV13(c.r); return v === 1 && aceHigh ? 14 : v; });
      if(new Set(vals).size !== vals.length) continue;
      const mn = Math.min(...vals), mx = Math.max(...vals), gaps = (mx - mn + 1) - vals.length;
      if(gaps > t.wild.length) continue;
      // monta ordem
      const sorted = nat.map((c,i) => ({c, v:vals[i]})).sort((a,b) => a.v - b.v);
      const order = []; let w = t.wild.slice();
      for(let i=0;i<sorted.length;i++){
        if(i > 0) for(let g = sorted[i-1].v + 1; g < sorted[i].v; g++) order.push(w.shift());
        order.push(sorted[i].c);
      }
      if(w.length){ if(mx < 14) order.push(w.shift()); else if(mn > 1) order.unshift(w.shift()); else continue; }
      const res = {suit, wild: t.wild.length > 0, order, len:cards.length, low:mn, high: mx + (t.wild.length > gaps && mx < 14 ? 1 : 0)};
      if(!best || (best.wild && !res.wild)) best = res;
    }
  }
  return best;
}
const canastraPts = c => c.r === 'A' ? 15 : c.r === '2' ? 10 : ['8','9','10','J','Q','K'].includes(c.r) ? 10 : 5;
