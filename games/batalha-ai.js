/* =====================================================================
   Bot da Batalha Naval (independente da Mesa).
   Grade 10×10, índice = linha*10 + coluna.
   Mapa de tiros (do ponto de vista de quem atira):
     0 = desconhecido, 1 = água, 2 = acerto (navio ainda não afundado),
     3 = navio afundado, 4 = água deduzida (vizinha de navio afundado)
   Regra: navios não se tocam, nem na diagonal.
   ===================================================================== */
const BatalhaAI = (() => {
'use strict';
const N = 10;
const NB8 = [], NB4 = [];
for(let i=0;i<100;i++){
  const r = (i/10)|0, c = i%10, a = [], b = [];
  for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++){
    if(!dr && !dc) continue;
    const r2 = r+dr, c2 = c+dc; if(r2<0||r2>9||c2<0||c2>9) continue;
    a.push(r2*10+c2); if(!dr || !dc) b.push(r2*10+c2);
  }
  NB8.push(a); NB4.push(b);
}
const cellsOf = (r, c, v, len) => { const out = []; for(let k=0;k<len;k++) out.push(v ? (r+k)*10 + c : r*10 + c + k); return out; };
// todas as posições possíveis de um navio de tamanho len (cada uma = lista de casas)
const PLACE = {};
for(const len of [2,3,4,5]){
  const arr = [];
  for(let r=0;r<10;r++) for(let c=0;c<10;c++){
    if(c + len <= 10) arr.push(cellsOf(r, c, false, len));
    if(len > 1 && r + len <= 10) arr.push(cellsOf(r, c, true, len));
  }
  PLACE[len] = arr;
}
// halo (vizinhança de 8) de uma posição, sem as próprias casas
const haloCache = new Map();
function halo(cells){
  const k = cells[0]*1000 + cells[cells.length-1];
  let h = haloCache.get(k);
  if(!h){ const s = new Set(cells); h = []; const seen = new Set(); for(const x of cells) for(const y of NB8[x]) if(!s.has(y) && !seen.has(y)){ seen.add(y); h.push(y); } haloCache.set(k, h); }
  return h;
}

/* ---------- frota aleatória e espalhada ---------- */
const FLEET_LENS = [5,4,3,3,2];
let NORMAL_CUT = 0.45;
function randomFleet(){
  for(let tries=0; tries<200; tries++){
    const occ = new Uint8Array(100), out = [];
    let ok = true;
    for(const len of FLEET_LENS){
      const opts = PLACE[len].filter(p => p.every(x => !occ[x]));
      if(!opts.length){ ok = false; break; }
      const p = opts[Math.floor(Math.random()*opts.length)];
      p.forEach(x => occ[x] = 2); halo(p).forEach(x => { if(!occ[x]) occ[x] = 1; });
      out.push({r:(p[0]/10)|0, c:p[0]%10, v: p.length > 1 && p[1] - p[0] === 10});
    }
    if(ok) return out;
  }
  return null;
}
// bot: escolhe a mais "espalhada" entre algumas frotas aleatórias (navios longe uns dos outros)
function spreadFleet(){
  let best = null, bs = -1;
  for(let k=0;k<8;k++){
    const f = randomFleet(); if(!f) continue;
    const cs = f.map((s,i) => cellsOf(s.r, s.c, s.v, FLEET_LENS[i]));
    let sc = 0;
    for(let a=0;a<cs.length;a++) for(let b=a+1;b<cs.length;b++){
      let m = 99; for(const x of cs[a]) for(const y of cs[b]){ const d = Math.abs(((x/10)|0) - ((y/10)|0)) + Math.abs(x%10 - y%10); if(d < m) m = d; }
      sc += Math.min(m, 5);
    }
    sc += Math.random() * 3;
    if(sc > bs){ bs = sc; best = f; }
  }
  return best || randomFleet();
}

/* ---------- mapa de densidade ---------- */
// K: mapa de tiros; lens: tamanhos dos navios que faltam afundar; strict: usa a regra de não encostar
function density(K, lens, strict){
  const hits = []; for(let i=0;i<100;i++) if(K[i] === 2) hits.push(i);
  const target = hits.length > 0;
  const cnt = new Float64Array(100);
  for(const len of lens){
    for(const p of PLACE[len]){
      let bad = false, hin = 0;
      for(const x of p){ const k = K[x]; if(k === 1 || k === 3 || k === 4){ bad = true; break; } if(k === 2) hin++; }
      if(bad) continue;
      if(target && !hin) continue;                 // no modo alvo só interessa quem passa pelos acertos
      if(strict){
        // nenhuma casa acertada pode ficar encostada sem estar dentro (seria outro navio encostado)
        let adj = false; for(const y of halo(p)) if(K[y] === 2){ adj = true; break; }
        if(adj) continue;
      }
      const w = target ? (strict ? 1 : Math.pow(8, hin)) : 1;
      for(const x of p) if(K[x] === 0) cnt[x] += w;
    }
  }
  return {cnt, target};
}
// amostragem conjunta (Difícil): Gibbs sobre frotas inteiras coerentes com tudo que já se sabe
// (água, afundados, acertos cobertos, navios sem encostar). Converge para a distribuição uniforme
// sobre as frotas possíveis — bem melhor que contar cada navio sozinho.
function jointSamples(K, lens, ms){
  const hits = []; for(let i=0;i<100;i++) if(K[i] === 2) hits.push(i);
  const isHit = i => K[i] === 2;
  const cand = {};
  for(const len of new Set(lens)) cand[len] = PLACE[len].filter(p => {
    for(const x of p){ const k = K[x]; if(k === 1 || k === 3 || k === 4) return false; }
    for(const y of halo(p)) if(isHit(y)) return false;     // acerto encostado e fora = outro navio encostado
    return true;
  });
  const n = lens.length, occ = new Int8Array(100).fill(-1);   // occ: dono da casa (navio) ou -1
  const blk = new Uint8Array(100);                            // casas proibidas pelos outros (navio + halo), contador
  let cur = new Array(n).fill(null);
  const put = (j, p, d) => { for(const x of p){ occ[x] = d > 0 ? j : -1; blk[x] += d; } for(const y of halo(p)) blk[y] += d; };
  const fits = p => { for(const x of p) if(blk[x]) return false; return true; };
  // estado inicial válido: coloca em ordem aleatória até cobrir todos os acertos
  const order = lens.map((_,j) => j).sort((a,b) => lens[b] - lens[a]);
  let ok = false;
  for(let t=0; t<300 && !ok; t++){
    occ.fill(-1); blk.fill(0); cur = new Array(n).fill(null);
    ok = true;
    for(const j of order){
      const opts = cand[lens[j]];
      // prefere quem cobre acertos ainda descobertos
      const unc = hits.filter(h => occ[h] < 0);
      let pool = unc.length ? opts.filter(p => p.some(x => unc.includes(x))) : opts;
      if(!pool.length || Math.random() < .15) pool = opts;
      let p = null;
      for(let k=0;k<60;k++){ const q = pool[Math.floor(Math.random()*pool.length)]; if(q && fits(q)){ p = q; break; } }
      if(!p){ ok = false; break; }
      cur[j] = p; put(j, p, 1);
    }
    if(ok && hits.some(h => occ[h] < 0)) ok = false;
  }
  if(!ok) return null;
  const cnt = new Float64Array(100), t0 = Date.now();
  let samples = 0, steps = 0;
  const valid = [];
  while(true){
    if((steps & 63) === 0 && Date.now() - t0 > ms) break;
    steps++;
    const j = Math.floor(Math.random()*n);
    put(j, cur[j], -1);
    // acertos que só este navio cobria precisam continuar cobertos
    const need = []; for(const h of hits) if(occ[h] < 0) need.push(h);
    valid.length = 0;
    for(const p of cand[lens[j]]){
      if(!fits(p)) continue;
      let good = true; for(const h of need) if(p.indexOf(h) < 0){ good = false; break; }
      if(good) valid.push(p);
    }
    const p = valid.length ? valid[Math.floor(Math.random()*valid.length)] : cur[j];
    cur[j] = p; put(j, p, 1);
    if(steps > 40 && steps % 3 === 0){ for(const q of cur) for(const x of q) cnt[x]++; samples++; }
  }
  return samples >= 50 ? cnt : null;
}
function argmax(cnt, K, filter){
  let best = -1, bv = -1, ties = [];
  for(let i=0;i<100;i++){
    if(K[i] !== 0 || (filter && !filter(i))) continue;
    const v = cnt[i];
    if(v > bv + 1e-9){ bv = v; ties = [i]; } else if(Math.abs(v - bv) <= 1e-9) ties.push(i);
  }
  if(!ties.length) return -1;
  best = ties[Math.floor(Math.random()*ties.length)];
  return best;
}
/* ---------- tiro ---------- */
function shoot(K, lens, diff){
  const unknown = []; for(let i=0;i<100;i++) if(K[i] === 0) unknown.push(i);
  if(!unknown.length) return -1;
  const minLen = Math.min(...lens);
  if(diff === 'facil'){
    // alvo simples: continua a linha de acertos ou tenta um vizinho
    const hits = []; for(let i=0;i<100;i++) if(K[i] === 2) hits.push(i);
    if(hits.length){
      const cand = [];
      for(const h of hits){
        for(const y of NB4[h]) if(K[y] === 0){
          const dir = y - h, back = h - dir;
          const inLine = back >= 0 && back < 100 && K[back] === 2 && Math.abs((back%10) - (h%10)) <= 1;
          cand.push({y, w: inLine ? 3 : 1});
        }
      }
      if(cand.length){
        const mx = Math.max(...cand.map(c => c.w)), top = cand.filter(c => c.w === mx);
        return top[Math.floor(Math.random()*top.length)].y;
      }
    }
    // caça em xadrez (casas onde cabe o menor navio)
    const par = Math.random() < .5 ? 0 : 1;
    let pool = unknown.filter(i => (((i/10)|0) + i%10) % 2 === par);
    if(!pool.length) pool = unknown;
    return pool[Math.floor(Math.random()*pool.length)];
  }
  const strict = diff === 'dificil';
  let {cnt, target} = density(K, lens, strict);
  if(strict){
    const js = jointSamples(K, lens, target ? 25 : 70);
    if(js){ const tot = js.reduce((a,b) => a+b, 0) || 1, tc = cnt.reduce((a,b) => a+b, 0) || 1;
      for(let i=0;i<100;i++) cnt[i] = js[i]/tot + 0.03 * cnt[i]/tc; }
  }
  if(!target && !strict){
    // Normal: na caça, sorteia entre as casas boas (≥ NORMAL_CUT do máximo), não sempre a melhor
    let mx = 0; for(let i=0;i<100;i++) if(K[i] === 0 && cnt[i] > mx) mx = cnt[i];
    const good = []; for(let i=0;i<100;i++) if(K[i] === 0 && cnt[i] >= mx * NORMAL_CUT && mx > 0) good.push(i);
    if(good.length) return good[Math.floor(Math.random()*good.length)];
  }
  let i = argmax(cnt, K);
  if(i < 0 || cnt[i] <= 0) i = unknown[Math.floor(Math.random()*unknown.length)];
  return i;
}
return { setCut: c => NORMAL_CUT = c, shoot, randomFleet, spreadFleet, cellsOf, PLACE, NB8, FLEET_LENS, density };
})();
