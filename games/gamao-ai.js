/* =====================================================================
   Gamão (backgammon) — gerador de lances + bot.
   Posição vista por quem joga: Int8Array(52)
     P[0]      = minhas pedras já retiradas      P[26] = retiradas do adversário
     P[1..24]  = minhas pedras no meu ponto k    P[27..50] = do adversário (no ponto dele)
     P[25]     = minhas pedras na barra          P[51] = adversário na barra
   Eu ando de 24 → 1 e retiro depois do 1. O meu ponto k é o ponto 25-k do
   adversário, então a casa do adversário correspondente ao meu ponto t é P[51-t].
   Bot: avaliação com conhecimento do jogo (pips, pedras expostas e quantas
   rolagens do adversário acertam, pontos feitos, primes, âncoras, barra,
   corrida/retirada com tabela exata de retirada) e, no Difícil, expectimax
   de 1 jogada sobre as 21 rolagens do adversário.
   ===================================================================== */
const GamaoAI = (() => {
'use strict';
const OPB = 51, OPOFF = 26;

/* ---------------------------- regras ---------------------------- */
function allHome(P){
  if(P[25]) return false;
  for(let k=7;k<=24;k++) if(P[k]) return false;
  return true;
}
// destino de um passo (f com o dado d) ou -1 se ilegal
function canStep(P, f, d){
  if(f < 1 || f > 25 || P[f] <= 0) return -1;
  if(f !== 25 && P[25] > 0) return -1;
  const t = f - d;
  if(t >= 1) return P[51 - t] >= 2 ? -1 : t;
  if(f === 25 || !allHome(P)) return -1;
  if(t === 0) return 0;
  for(let k=f+1;k<=6;k++) if(P[k] > 0) return -1;   // dado maior só retira a pedra mais alta
  return 0;
}
// aplica o passo (já validado); devolve 1 se bateu uma pedra
function doStep(P, f, t){
  P[f]--;
  if(t === 0){ P[0]++; return 0; }
  P[t]++;
  const o = 51 - t;
  if(P[o] === 1){ P[o] = 0; P[OPB]++; return 1; }
  return 0;
}
function flip(P){
  const Q = new Int8Array(52);
  for(let k=0;k<26;k++){ Q[k] = P[26+k]; Q[26+k] = P[k]; }
  return Q;
}
const keyOf = P => String.fromCharCode.apply(null, P);
const diceOf = (a, b) => a === b ? [a,a,a,a] : [Math.max(a, b), Math.min(a, b)];   // o maior primeiro
function without(arr, i){ const r = arr.slice(); r.splice(i,1); return r; }

// máximo de dados que dá para usar a partir de P com os dados restantes
function maxUsable(P, rem){
  if(!rem.length) return 0;
  let best = 0;
  const tried = new Set();
  for(let i=0;i<rem.length;i++){
    const d = rem[i]; if(tried.has(d)) continue; tried.add(d);
    for(let f=25; f>=1; f--){
      const t = canStep(P, f, d); if(t < 0) continue;
      const Q = P.slice(); doStep(Q, f, t);
      const v = 1 + maxUsable(Q, without(rem, i));
      if(v > best){ best = v; if(best === rem.length) return best; }
    }
  }
  return best;
}
// regras do início da vez: quantos dados tem de usar e se é obrigado a usar o maior
function turnInfo(P, a, b){
  const rem = diceOf(a, b), need = maxUsable(P, rem);
  let big = 0;
  if(need === 1 && a !== b){
    const hi = Math.max(a, b);
    for(let f=25; f>=1; f--) if(canStep(P, f, hi) >= 0){ big = hi; break; }
  }
  return {need, big};
}
// passos legais agora: [f, d, t], respeitando "usar o máximo de dados" e "usar o maior"
function legalSteps(P, rem, need, big){
  const out = [];
  if(need <= 0) return out;
  const tried = new Set();
  for(let i=0;i<rem.length;i++){
    const d = rem[i]; if(tried.has(d) || (big && d !== big)) continue; tried.add(d);
    for(let f=25; f>=1; f--){
      const t = canStep(P, f, d); if(t < 0) continue;
      const Q = P.slice(); doStep(Q, f, t);
      if(1 + maxUsable(Q, without(rem, i)) === need) out.push([f, d, t]);
    }
  }
  return out;
}
// todas as jogadas completas distintas (pela posição final): [{P, steps:[[f,d],...]}]
function genSeqs(P, a, b){
  const out = [], seen = new Map();
  let maxLen = 0;
  const visited = new Set();
  function rec(Q, rem, steps){
    let any = false;
    const tried = new Set();
    for(let i=0;i<rem.length;i++){
      const d = rem[i]; if(tried.has(d)) continue; tried.add(d);
      const rest = without(rem, i);
      for(let f=25; f>=1; f--){
        const t = canStep(Q, f, d); if(t < 0) continue;
        any = true;
        const R = Q.slice(); doStep(R, f, t);
        const vk = keyOf(R) + rest.join('');
        if(visited.has(vk)) continue;
        visited.add(vk);
        steps.push([f, d]); rec(R, rest, steps); steps.pop();
      }
    }
    if(!any){
      const n = steps.length;
      if(n < maxLen) return;
      if(n > maxLen){ maxLen = n; out.length = 0; seen.clear(); }
      const k = keyOf(Q);
      if(!seen.has(k)){ seen.set(k, out.length); out.push({P:Q, steps:steps.slice()}); }
    }
  }
  rec(P, diceOf(a, b), []);
  if(maxLen === 1 && a !== b){
    const hi = Math.max(a, b);
    if(out.some(s => s.steps[0][1] === hi)) return out.filter(s => s.steps[0][1] === hi);
  }
  return out;
}
function pips(P, off){ let s = 0; for(let k=1;k<=25;k++) s += k * P[off + k]; return s; }

/* ------------------- tabela exata de retirada ---------------------
   Para posições só com pedras na própria casa (pontos 1..6): número esperado
   de vezes (e variância) para retirar tudo, jogando para minimizar a média.
   Calculada sob demanda e guardada em memória. */
const BO = new Map();
const ROLLS = [];
for(let a=1;a<=6;a++) for(let b=a;b<=6;b++) ROLLS.push([a, b, a === b ? 1 : 2]);
function boKey(c){ return c[1] | c[2]<<4 | c[3]<<8 | c[4]<<12 | c[5]<<16 | c[6]<<20; }
function boBest(c, rem, memo){        // menor E alcançável usando os dados restantes
  if(!rem.length) return boGet(c);
  const mk = boKey(c) * 8 + rem.length;
  const hit = memo.get(mk); if(hit) return hit;
  let best = null;
  const tried = new Set();
  let hi = 0; for(let k=6;k>=1;k--) if(c[k]){ hi = k; break; }
  if(!hi) return ZERO;
  for(let i=0;i<rem.length;i++){
    const d = rem[i]; if(tried.has(d)) continue; tried.add(d);
    for(let f=1; f<=6; f++){
      if(!c[f]) continue;
      const t = f - d;
      if(t < 0 && f !== hi) continue;
      const n = c.slice(); n[f]--; if(t > 0) n[t]++;
      const r = boBest(n, without(rem, i), memo);
      if(!best || r[0] < best[0]) best = r;
    }
  }
  memo.set(mk, best);
  return best;
}
const ZERO = [0, 0];
function boGet(c){
  const key = boKey(c);
  let r = BO.get(key);
  if(r) return r;
  let any = false; for(let k=1;k<=6;k++) if(c[k]){ any = true; break; }
  if(!any){ r = [0, 0]; BO.set(key, r); return r; }
  let e = 0, e2 = 0;
  for(const [a, b, w] of ROLLS){
    const n = boBest(c, diceOf(a, b), new Map());   // n = [E, E[T²]] do próximo
    e += w * (1 + n[0]); e2 += w * (1 + 2*n[0] + n[1]);
  }
  r = [e/36, e2/36]; BO.set(key, r);
  return r;
}
function boStats(P, off){
  const c = [0,0,0,0,0,0,0];
  for(let k=1;k<=6;k++) c[k] = P[off + k];
  const r = boGet(c);
  return {e:r[0], v:Math.max(0.05, r[1] - r[0]*r[0])};
}

/* ---------------------------- avaliação ----------------------------
   Rede neural pequena (treinada jogando contra si mesma, método TD) que recebe
   o tabuleiro e, além dele, características clássicas calculadas aqui:
   contagem de pips, chance de o adversário acertar as minhas pedras expostas
   (contando as 36 rolagens, com bloqueios e entrada da barra), pontos feitos
   na casa, maior prime com pedras presas atrás, âncoras, pedras de trás e na
   barra. Devolve [vitória, gammon a favor, gammon contra] para quem acabou de
   jogar. Sem contato (corrida) usa contagem de pips com desperdício e uma
   tabela exata de retirada para até 8 pedras. */
const PHI = x => 1 / (1 + Math.exp(-1.702 * x));
const sig = x => 1 / (1 + Math.exp(-x));
const NI = 210, NH = 40, NO = 3;
const NET = { W1:new Float32Array(NI*NH), B1:new Float32Array(NH), W2:new Float32Array(NH*NO), B2:new Float32Array(NO) };

function noContact(P){
  let my = 0, op = 0;
  for(let k=25;k>=1;k--) if(P[k]){ my = k; break; }
  for(let k=25;k>=1;k--) if(P[26+k]){ op = k; break; }
  return my + op <= 25;
}
function homeOnly(P, off){ if(P[off+25]) return false; for(let k=7;k<=24;k++) if(P[off+k]) return false; return true; }
// rolagens esperadas para terminar uma corrida: tabela exata com até 8 pedras na casa,
// senão contagem de pips ajustada pelo desperdício (pedras amontoadas embaixo, buracos)
function raceRolls(P, off){
  let n = 0; for(let k=1;k<=25;k++) n += P[off+k];
  if(n <= 8 && homeOnly(P, off)) return boStats(P, off);
  let p = 0;
  for(let k=1;k<=25;k++) p += k*P[off+k];
  const c = k => P[off+k];
  let waste = 6.5 + 2*Math.max(0, c(1)-1) + Math.max(0, c(2)-1) + Math.max(0, c(3)-3);
  for(let k=4;k<=6;k++) if(!c(k)) waste += 0.9;
  for(let k=1;k<=6;k++) if(c(k) > 4) waste += 0.4 * (c(k) - 4);
  for(let k=7;k<=25;k++) if(c(k)) waste += 0.15 * c(k) * (k <= 12 ? 1 : 2);   // ainda falta entrar em casa
  const e = (p + waste) / 8.17;
  return {e, v:0.25 + 0.12*e};
}
// vezes que um lado ainda precisa para retirar a 1ª pedra (salvar o gammon)
function rollsToSave(P, off){
  let need = 0, out = 0, low = 0;
  for(let k=7;k<=25;k++){ need += (k - 6) * P[off+k]; out += P[off+k]; }
  for(let k=1;k<=6;k++) if(P[off+k]){ low = k; break; }
  need += low || 6;
  return {e:(need + 3 + 1.2*out) / 8.17, v:0.2 + 0.1*out};
}
function raceProbs(P){
  const m = raceRolls(P, 0), o = raceRolls(P, OPOFF);
  // o adversário está na vez: eu ganho se precisar de menos vezes que ele
  const win = PHI((o.e - m.e - 0.5) / Math.sqrt(m.v + o.v + 0.1));
  let wg = 0, lg = 0;
  if(P[OPOFF] === 0){ const g = rollsToSave(P, OPOFF); wg = PHI((g.e - m.e - 0.5) / Math.sqrt(m.v + g.v + 0.1)); }
  if(P[0] === 0){ const g = rollsToSave(P, 0); lg = PHI((g.e - o.e + 0.5) / Math.sqrt(o.v + g.v + 0.1)); }
  return [win, Math.min(wg, win), Math.min(lg, 1 - win)];
}

/* pedras sozinhas do lado s (0 = eu, 26 = adversário) contra o outro lado, que rola agora.
   Devolve [chance de ser acertado (rolagens/36), perda média em pips] */
const SRC = new Int8Array(16);
// valor de acertar o ponto k do lado s (0 se não há pedra sozinha lá)
function hv(P, s, k){ return (k >= 1 && k <= 24 && P[s+k] === 1) ? 29 - k : 0; }
function opn(P, s, m){ return m >= 1 && m <= 24 && P[s+m] < 2; }
function shots(P, s){
  const o = 26 - s;
  let any = false;
  for(let k=1;k<=24;k++) if(P[s+k] === 1){ any = true; break; }
  if(!any) return SH0;
  let ns = 0;                                       // pedras do atacante no número de ponto do lado s
  for(let j=1;j<=24;j++) if(P[o+j]) SRC[ns++] = 25 - j;
  const bar = P[o+25];
  let cnt = 0, loss = 0;
  for(let r=0;r<21;r++){
    const a = ROLLS[r][0], b = ROLLS[r][1], w = ROLLS[r][2];
    let best = 0, v;
    if(a !== b){
      if(bar >= 2){
        if((v = hv(P,s,a)) > best) best = v;
        if((v = hv(P,s,b)) > best) best = v;
      } else if(bar === 1){
        const ea = opn(P,s,a), eb = opn(P,s,b);
        if(ea || eb){
          if(ea && (v = hv(P,s,a)) > best) best = v;
          if(eb && (v = hv(P,s,b)) > best) best = v;
          if((v = hv(P,s,a+b)) > best) best = v;
          for(let q=0;q<ns;q++){ const m = SRC[q];
            if(ea && (v = hv(P,s,m+b)) > best) best = v;
            if(eb && (v = hv(P,s,m+a)) > best) best = v; }
        }
      } else {
        for(let q=0;q<ns;q++){ const m = SRC[q];
          if((v = hv(P,s,m+a)) > best) best = v;
          if((v = hv(P,s,m+b)) > best) best = v;
          if((opn(P,s,m+a) || opn(P,s,m+b)) && (v = hv(P,s,m+a+b)) > best) best = v; }
      }
    } else if(!bar || opn(P,s,a)){
      let left = 4;
      if(bar){ if((v = hv(P,s,a)) > best) best = v; left -= Math.min(4, bar); }
      if(left > 0) for(let q=-1;q<ns;q++){
        let pos = q < 0 ? (bar ? a : -99) : SRC[q];
        if(pos < 0) continue;
        for(let i=1;i<=left;i++){ pos += a; if(pos > 24 || P[s+pos] >= 2) break; if((v = hv(P,s,pos)) > best) best = v; }
      }
    }
    if(best){ cnt += w; loss += w * best; }
  }
  return [cnt / 36, loss / 36];
}
const SH0 = [0, 0];
// maior sequência de pontos feitos do lado s que tem pedras do outro lado presas atrás
function primeTrap(P, s){
  const o = 26 - s;
  let best = 0, run = 0;
  // pedras do outro lado atrás do meu ponto k = no número dele, pontos > 25-k (inclui a barra)
  for(let k=1;k<=24;k++){
    if(P[s+k] >= 2){
      run++;
      const low = k - run + 1;
      let trapped = P[o+25];
      for(let j=26-low; j<=24; j++) trapped += P[o+j];
      if(trapped && run > best) best = run;
    } else run = 0;
  }
  return best;
}
// entradas da rede (posição na vista de quem acabou de jogar)
const X = new Float32Array(NI);
const NZ = new Int16Array(NI);
let nnz = 0;
function feats(P){
  X.fill(0); nnz = 0;
  const put = (i, v) => { if(v){ X[i] = v; NZ[nnz++] = i; } };
  for(let side=0; side<2; side++){
    const s = side * 26, base = side * 96;
    for(let k=1;k<=24;k++){
      const n = P[s+k]; if(!n) continue;
      const i = base + (k-1)*4;
      put(i, 1); if(n >= 2) put(i+1, 1); if(n >= 3) put(i+2, 1); if(n > 3) put(i+3, (n-3)/2);
    }
  }
  put(192, P[25]/2); put(193, P[51]/2); put(194, P[0]/15); put(195, P[26]/15);
  const mp = pips(P, 0), op = pips(P, OPOFF);
  put(196, mp/150); put(197, op/150); put(198, (op - mp)/60);
  const sh = shots(P, 0), so = shots(P, OPOFF);
  put(199, sh[0]); put(200, sh[1]/12); put(201, so[0]);
  let mb = 0, ob = 0, ma = 0, oa = 0, mbk = 0, obk = 0;
  for(let k=1;k<=6;k++){ if(P[k] >= 2) mb++; if(P[26+k] >= 2) ob++; }
  for(let k=18;k<=24;k++){ if(P[k] >= 2) ma++; if(P[26+k] >= 2) oa++; }
  for(let k=19;k<=25;k++){ mbk += P[k]; obk += P[26+k]; }
  put(202, mb/6); put(203, ob/6); put(204, primeTrap(P, 0)/6); put(205, primeTrap(P, OPOFF)/6);
  put(206, ma/2); put(207, oa/2); put(208, mbk/5); put(209, obk/5);
}
const H = new Float32Array(NH), OUT = new Float32Array(NO);
function forward(){
  const W1 = NET.W1;
  for(let j=0;j<NH;j++) H[j] = NET.B1[j];
  for(let q=0;q<nnz;q++){ const i = NZ[q], v = X[i], o = i*NH; for(let j=0;j<NH;j++) H[j] += v * W1[o+j]; }
  for(let j=0;j<NH;j++) H[j] = sig(H[j]);
  for(let k=0;k<NO;k++){ let t = NET.B2[k]; for(let j=0;j<NH;j++) t += H[j] * NET.W2[j*NO+k]; OUT[k] = sig(t); }
  return [OUT[0], OUT[1], OUT[2]];
}
// [vitória, gammon a favor, gammon contra] para quem acabou de jogar
function probs(P){
  if(P[0] === 15) return [1, P[OPOFF] === 0 ? 1 : 0, 0];
  if(noContact(P)) return raceProbs(P);
  feats(P);
  return forward();
}
let GW = 1;                                   // peso do gammon (0 numa partida de 1 jogo)
const equity = p => 2*p[0] - 1 + GW * (p[1] - p[2]);
function evaluate(P){ return equity(probs(P)); }

/* ------------------------------ busca ------------------------------ */
// melhor resposta do lado P (estático) — devolve o valor para ele
function bestStatic(P, a, b){
  const seqs = genSeqs(P, a, b);
  if(!seqs.length) return evaluate(P);
  let best = -Infinity;
  for(const s of seqs){ if(s.P[0] === 15) return evaluate(s.P); const v = evaluate(s.P); if(v > best) best = v; }
  return best;
}
// valor esperado de P (eu acabei de jogar) olhando as 21 rolagens do adversário
function ply1(P, deadline){
  if(P[0] === 15) return evaluate(P);
  const O = flip(P);
  let tot = 0;
  for(const [a, b, w] of ROLLS){
    tot += w * -bestStatic(O, a, b);
    if(deadline && Date.now() > deadline) return null;
  }
  return tot / 36;
}
// 2 jogadas à frente: o adversário responde (melhor estático) e depois eu rolo de novo (melhor estático)
function ply2(P, deadline){
  if(P[0] === 15) return evaluate(P);
  const O = flip(P);
  let tot = 0;
  for(const [a, b, w] of ROLLS){
    const seqs = genSeqs(O, a, b);
    let best = null, bv = -Infinity;
    for(const s of seqs){ if(s.P[0] === 15){ best = s; bv = Infinity; break; } const v = evaluate(s.P); if(v > bv){ bv = v; best = s; } }
    const R = best ? best.P : O;
    if(R[0] === 15){ tot += w * -evaluate(R); continue; }
    // agora é a minha vez de rolar: média do meu melhor lance
    const M = flip(R);
    let t2 = 0;
    for(const [c, d, w2] of ROLLS) t2 += w2 * bestStatic(M, c, d);
    tot += w * t2 / 36;
    if(deadline && Date.now() > deadline) return null;
  }
  return tot / 36;
}
/* escolhe a jogada. level 0 fácil (às vezes escolhe uma jogada quase tão boa),
   1 normal (melhor pela avaliação), 2 difícil (expectimax de 1 jogada à frente) */
function choose(P, a, b, level, ms){
  const seqs = genSeqs(P, a, b);
  if(seqs.length <= 1) return seqs[0] ? seqs[0].steps : [];
  for(const s of seqs){ if(s.P[0] === 15) return s.steps; s.v = evaluate(s.P); }
  seqs.sort((x, y) => y.v - x.v);
  if(level === 0){
    const ok = seqs.filter((s, i) => i < 3 && s.v >= seqs[0].v - EASY_MARGIN);
    return ok[Math.floor(Math.random() * ok.length)].steps;
  }
  if(level === 1) return seqs[0].steps;
  const deadline = Date.now() + (ms || 1500), lv = level;
  const cand = seqs.filter((s, i) => i < 3 || (i < 10 && s.v >= seqs[0].v - 0.12));
  let best = cand[0], bv = -Infinity;
  for(const s of cand){
    const v = ply1(s.P, deadline);
    if(v === null) break;
    s.v1 = v;
    if(v > bv){ bv = v; best = s; }
  }
  if(level < 3) return best.steps;
  // nível 3: refina os melhores pelo 1 lance à frente com 2 lances à frente
  const top = cand.filter(s => s.v1 != null && s.v1 >= bv - 0.06).sort((x, y) => y.v1 - x.v1).slice(0, 3);
  if(top.length < 2) return best.steps;
  let b2 = null, v2 = -Infinity;
  for(const s of top){ const v = ply2(s.P, deadline); if(v === null) return best.steps; if(v > v2){ v2 = v; b2 = s; } }
  return b2.steps;
}
let EASY_MARGIN = 0.15;

/* ------------------------- pesos da rede ------------------------- */
function loadWeights(b64){
  const bin = typeof atob === 'function' ? atob(b64) : Buffer.from(b64, 'base64').toString('binary');
  const u = new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) u[i] = bin.charCodeAt(i);
  const q = new Int16Array(u.buffer), sc = 1/2048;
  let p = 0;
  for(const A of [NET.W1, NET.B1, NET.W2, NET.B2]) for(let i=0;i<A.length;i++) A[i] = q[p++] * sc;
}
function dumpWeights(){
  const all = [NET.W1, NET.B1, NET.W2, NET.B2], n = all.reduce((t, A) => t + A.length, 0);
  const q = new Int16Array(n); let p = 0;
  for(const A of all) for(let i=0;i<A.length;i++) q[p++] = Math.max(-32767, Math.min(32767, Math.round(A[i] * 2048)));
  return Buffer.from(q.buffer).toString('base64');
}
// pesos treinados (100 mil partidas do bot contra ele mesmo), int16 em base64
const WEIGHTS = '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';
if(WEIGHTS) loadWeights(WEIGHTS);
else { let sd = 12345; const r = () => { sd = (sd * 1103515245 + 12345) & 0x7fffffff; return sd / 0x7fffffff - 0.5; };
  for(const A of [NET.W1, NET.W2]) for(let i=0;i<A.length;i++) A[i] = r() * 0.2; }

return { loadWeights, dumpWeights, setEasy:m => { EASY_MARGIN = m; }, NET, NI, NH, NO, X, NZ, H, feats, forward, probs, nnzRef:() => nnz, setGW:g => { GW = g; }, canStep, doStep, flip, genSeqs, legalSteps, turnInfo, maxUsable, pips, evaluate, choose, ply1, noContact, allHome, ROLLS, keyOf, boStats };
})();
if(typeof module !== 'undefined') module.exports = GamaoAI;
