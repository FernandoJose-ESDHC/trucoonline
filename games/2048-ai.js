/* =====================================================================
   2048 — motor: movimentos, sorteio de peças com semente (mesma sequência
   para todos na disputa) e bot expectimax (tabelas por linha + heurística
   de monotonicidade, casas vazias e fusões).
   Tabuleiro do jogo: 16 expoentes (0 = vazio, 1 = 2, 2 = 4, ... 11 = 2048).
   ===================================================================== */
"use strict";
const AI2048 = (() => {
  /* ---------- sorteio com semente (mulberry32, estado = 1 inteiro) ---------- */
  function rnd(p){              // p = {rng}; avança o estado e devolve [0,1)
    let a = (p.rng = (p.rng + 0x6D2B79F5) | 0);
    let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
  // põe uma peça nova (2 com 90%, 4 com 10%) numa casa vazia sorteada; devolve o índice ou -1
  function spawn(p){
    const empty = []; for(let i=0;i<16;i++) if(!p.b[i]) empty.push(i);
    if(!empty.length) return -1;
    const i = empty[Math.floor(rnd(p)*empty.length)];
    p.b[i] = rnd(p) < 0.9 ? 1 : 2;
    return i;
  }

  /* ---------- movimento no tabuleiro do jogo (com ids para animar) ----------
     dir: 0 cima, 1 direita, 2 baixo, 3 esquerda. Devolve null se nada mexe, ou
     {b, ids, gain, gone:[[id, destino]], merged:[ids]} */
  const LINES = [];
  for(let d=0; d<4; d++){
    const L = [];
    for(let k=0;k<4;k++){
      const line = [];
      for(let m=0;m<4;m++){
        // m = 0 é a casa para onde as peças andam
        const r = d === 0 ? m : d === 2 ? 3-m : k, c = d === 3 ? m : d === 1 ? 3-m : k;
        line.push(r*4 + c);
      }
      L.push(line);
    }
    LINES.push(L);
  }
  function slide(b, ids, dir, nextId){
    const nb = new Array(16).fill(0), nids = new Array(16).fill(0), gone = [], merged = [];
    let gain = 0, moved = false, nid = nextId;
    for(const line of LINES[dir]){
      let w = 0, lastIdx = -1;
      for(const i of line){
        if(!b[i]) continue;
        if(lastIdx >= 0 && nb[line[lastIdx]] === b[i] && !merged.includes(nids[line[lastIdx]])){
          const t = line[lastIdx];
          gone.push([nids[t], t], [ids[i], t]);
          nb[t] = b[i] + 1; gain += 1 << nb[t]; nids[t] = nid++; merged.push(nids[t]);
          moved = true; lastIdx = -2;          // não funde de novo nesta casa
          continue;
        }
        const t = line[w];
        nb[t] = b[i]; nids[t] = ids[i]; if(t !== i) moved = true;
        lastIdx = w; w++;
      }
    }
    if(!moved) return null;
    return {b:nb, ids:nids, gain, gone, merged, nid};
  }
  function canMove(b){ for(let d=0; d<4; d++) if(slide(b, b, d, 0)) return true; return false; }

  /* ---------- bot: tabuleiro compacto (4 linhas de 16 bits) ---------- */
  const LEFT = new Uint16Array(65536), RIGHT = new Uint16Array(65536), HEUR = new Float64Array(65536);
  (function tables(){
    for(let row=0; row<65536; row++){
      const l = [row & 15, (row >> 4) & 15, (row >> 8) & 15, (row >> 12) & 15];
      // heurística (inspirada no expectimax clássico de 2048)
      let sum = 0, empty = 0, merges = 0, prev = 0, counter = 0;
      for(const v of l){ sum += Math.pow(v, 3.5); if(!v) empty++; else { if(prev === v) counter++; else if(counter > 0){ merges += 1 + counter; counter = 0; } prev = v; } }
      if(counter > 0) merges += 1 + counter;
      let ml = 0, mr = 0;
      for(let i=1;i<4;i++){ if(l[i-1] > l[i]) ml += Math.pow(l[i-1], 4) - Math.pow(l[i], 4); else mr += Math.pow(l[i], 4) - Math.pow(l[i-1], 4); }
      HEUR[row] = 200000 + 270*empty + 700*merges - 47*Math.min(ml, mr) - 11*sum;
      // move para a esquerda
      const out = []; let i = 0; const t = l.filter(Boolean);
      while(i < t.length){ if(i+1 < t.length && t[i] === t[i+1] && t[i] < 15){ out.push(t[i]+1); i += 2; } else { out.push(t[i]); i++; } }
      while(out.length < 4) out.push(0);
      LEFT[row] = out[0] | out[1] << 4 | out[2] << 8 | out[3] << 12;
    }
    const rev = r => ((r & 15) << 12) | (((r >> 4) & 15) << 8) | (((r >> 8) & 15) << 4) | ((r >> 12) & 15);
    for(let row=0; row<65536; row++) RIGHT[row] = rev(LEFT[rev(row)]);
  })();
  const pack = b => [0,1,2,3].map(r => b[r*4] | b[r*4+1] << 4 | b[r*4+2] << 8 | b[r*4+3] << 12);
  function tr(B){
    const o = [0,0,0,0];
    for(let r=0;r<4;r++) for(let c=0;c<4;c++) o[c] |= ((B[r] >> (4*c)) & 15) << (4*r);
    return o;
  }
  function mv(B, d){
    if(d === 3) return B.map(r => LEFT[r]);
    if(d === 1) return B.map(r => RIGHT[r]);
    const T = tr(B);
    return tr(d === 0 ? T.map(r => LEFT[r]) : T.map(r => RIGHT[r]));
  }
  const same = (A, B) => A[0] === B[0] && A[1] === B[1] && A[2] === B[2] && A[3] === B[3];
  const heur = B => { const T = tr(B); return HEUR[B[0]] + HEUR[B[1]] + HEUR[B[2]] + HEUR[B[3]] + HEUR[T[0]] + HEUR[T[1]] + HEUR[T[2]] + HEUR[T[3]]; };
  const key = B => B[0] + ',' + B[1] + ',' + B[2] + ',' + B[3];
  function distinct(B){ const s = new Set(); B.forEach(r => { for(let c=0;c<4;c++){ const v = (r >> 4*c) & 15; if(v) s.add(v); } }); return s.size; }

  function expectimax(B, depth, prob, cache){
    if(depth <= 0 || prob < 0.0001) return heur(B);
    const k = key(B) + '|' + depth, hit = cache.get(k); if(hit !== undefined) return hit;
    let empties = 0, total = 0;
    for(let r=0;r<4;r++) for(let c=0;c<4;c++){
      if((B[r] >> 4*c) & 15) continue;
      empties++;
      for(const [v, pv] of [[1, 0.9], [2, 0.1]]){
        const N = B.slice(); N[r] |= v << 4*c;
        total += pv * maxNode(N, depth, prob * pv, cache);
      }
    }
    const res = empties ? total / empties : heur(B);
    cache.set(k, res);
    return res;
  }
  function maxNode(B, depth, prob, cache){
    let best = 0;
    for(let d=0; d<4; d++){
      const N = mv(B, d); if(same(N, B)) continue;
      best = Math.max(best, expectimax(N, depth - 1, prob, cache));
    }
    return best;
  }
  // avalia os 4 lances; lvl: 'facil' | 'normal' | 'dificil'
  function evalMoves(b, lvl){
    const B = pack(b), depth = lvl === 'facil' ? 1 : lvl === 'normal' ? 2 : Math.max(2, Math.min(3, distinct(B) - 2));
    const out = [];
    for(let d=0; d<4; d++){
      const N = mv(B, d); if(same(N, B)) continue;
      out.push({d, v:expectimax(N, depth, 1, new Map())});
    }
    return out;
  }
  function choose(b, lvl){
    const ev = evalMoves(b, lvl); if(!ev.length) return null;
    ev.sort((x, y) => y.v - x.v);
    // o Fácil às vezes escolhe um lance quase tão bom (erro de gente, nunca absurdo)
    if(lvl === 'facil' && ev.length > 1 && Math.random() < 0.3 && ev[1].v > ev[0].v - Math.abs(ev[0].v)*0.04) return ev[1].d;
    return ev[0].d;
  }
  // quão "apertado" está o tabuleiro (para o ritmo do bot)
  const emptyCount = b => b.reduce((s, v) => s + !v, 0);

  return {rnd, spawn, slide, canMove, choose, evalMoves, emptyCount, pack, mv};
})();
if(typeof module !== 'undefined') module.exports = AI2048;
