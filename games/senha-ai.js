/* =====================================================================
   Motor da Senha (descobrir a combinação de cores).
   - Códigos como números 0..C^P-1 (dígitos na base C);
   - resposta = pretos (cor e lugar certos) e brancos (cor certa, lugar errado);
   - "minimax" de Knuth: escolhe a tentativa cujo PIOR caso deixa menos
     possibilidades (resolve 4×6 com repetição em no máximo 5 tentativas);
   - entropia: escolhe a tentativa que, em média, mais divide as possibilidades
     (usada com amostras quando há possibilidades demais, como no 5×8).
   ===================================================================== */
const SenhaAI = (() => {
'use strict';
const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
const CTX = {};

/* contexto de um formato (P posições, C cores, com/sem repetição) */
function ctx(P, C, rep){
  const key = P + 'x' + C + (rep ? 'r' : 'n');
  if(CTX[key]) return CTX[key];
  const N = Math.pow(C, P);
  const dig = new Uint8Array(N * P), cnt = new Uint8Array(N * C);
  const ok = [];
  for(let x=0;x<N;x++){
    let v = x, distinct = true;
    for(let i=P-1;i>=0;i--){ const d = v % C; v = (v - d) / C; dig[x*P+i] = d; if(++cnt[x*C+d] > 1) distinct = false; }
    if(rep || distinct) ok.push(x);
  }
  return CTX[key] = {P, C, rep, N, dig, cnt, codes:Int32Array.from(ok), NF:(P+1)*(P+1)};
}
const toCode = (X, arr) => arr.reduce((a, d) => a * X.C + d, 0);
const toArr = (X, x) => Array.from(X.dig.subarray(x*X.P, x*X.P + X.P));

/* resposta codificada: pretos*(P+1) + brancos */
function fb(X, a, b){
  const P = X.P, C = X.C, dg = X.dig, ct = X.cnt;
  let bl = 0, tot = 0;
  for(let i=0;i<P;i++) if(dg[a*P+i] === dg[b*P+i]) bl++;
  for(let c=0;c<C;c++){ const u = ct[a*C+c], v = ct[b*C+c]; tot += u < v ? u : v; }
  return bl * (P+1) + (tot - bl);
}
function score(X, guess, secret){ const f = fb(X, toCode(X, guess), toCode(X, secret)); return {b:Math.floor(f / (X.P+1)), w:f % (X.P+1)}; }

/* possibilidades que batem com todas as respostas até agora */
function consistent(X, hist){
  const out = [], hs = hist.map(h => [toCode(X, h.g), h.b * (X.P+1) + h.w]);
  const codes = X.codes;
  outer: for(let i=0;i<codes.length;i++){
    const x = codes[i];
    for(let k=0;k<hs.length;k++) if(fb(X, hs[k][0], x) !== hs[k][1]) continue outer;
    out.push(x);
  }
  return out;
}

/* avalia uma tentativa contra um conjunto: devolve [pior caso, entropia] */
const part = new Int32Array(64);
function evalGuess(X, g, S){
  part.fill(0, 0, X.NF);
  for(let i=0;i<S.length;i++) part[fb(X, g, S[i])]++;
  let worst = 0, ent = 0; const n = S.length;
  for(let f=0;f<X.NF;f++){ const c = part[f]; if(c){ if(c > worst) worst = c; ent -= c / n * Math.log2(c / n); } }
  // acertar de vez (P pretos) conta como "resolvido": tira do pior caso
  const win = part[X.P*(X.P+1)];
  return [worst, ent, win];
}
function sample(arr, k, rnd){
  if(arr.length <= k) return Array.from(arr);
  const a = Array.from(arr);
  for(let i=0;i<k;i++){ const j = i + Math.floor(rnd() * (a.length - i)); const t = a[i]; a[i] = a[j]; a[j] = t; }
  return a.slice(0, k);
}

/* primeira tentativa: padrão fixo bom para cada formato, com cores sorteadas */
const OPENERS = { '4x6r':[0,0,1,1], '4x6n':[0,1,2,3], '5x8r':[0,0,1,2,3] };
function opener(X, rnd){
  const key = X.P + 'x' + X.C + (X.rep ? 'r' : 'n');
  let pat = OPENERS[key];
  if(!pat){ pat = []; for(let i=0;i<X.P;i++) pat.push(X.rep ? Math.floor(i / 2) : i); }
  const perm = sample(Array.from({length:X.C}, (_,i) => i), X.C, rnd);
  return pat.map(d => perm[d]);
}

/* escolhe a próxima tentativa.
   mode 'knuth': tentativas entre todos os códigos válidos (pode não ser consistente), minimax;
   mode 'hint' : só entre as possibilidades consistentes, minimax (desempate por entropia);
   em conjuntos grandes usa entropia sobre amostras. */
function choose(X, hist, {mode = 'knuth', rnd = Math.random, ms = 600} = {}){
  if(!hist.length) return {g:opener(X, rnd), left:X.codes.length};
  const S = consistent(X, hist);
  if(S.length <= 2) return {g:toArr(X, S[0]), left:S.length};
  const t0 = now();
  const pool = mode === 'hint' ? S : X.codes;
  const big = S.length * pool.length > 1.2e6;
  let cand, against;
  if(!big){ cand = Array.from(pool); against = S; }
  else {
    // amostragem: candidatos da lista consistente (+ alguns quaisquer) contra uma amostra das possibilidades
    against = sample(S, 800, rnd);
    cand = sample(S, mode === 'hint' ? 800 : 500, rnd);
    if(mode !== 'hint') cand = cand.concat(sample(X.codes, 250, rnd));
  }
  const inS = new Set(S);
  let best = -1, bw = Infinity, be = -1, bin = false;
  for(let i=0;i<cand.length;i++){
    const g = cand[i];
    const [worst, ent] = evalGuess(X, g, against);
    const isIn = inS.has(g);
    let better;
    if(big) better = ent > be + 1e-9 || (Math.abs(ent - be) <= 1e-9 && isIn && !bin);   // entropia
    else better = worst < bw || (worst === bw && ((isIn && !bin) || (isIn === bin && ent > be + 1e-9)));
    if(better){ best = g; bw = worst; be = ent; bin = isIn; }
    if((i & 63) === 0 && now() - t0 > ms && best >= 0) break;
  }
  return {g:toArr(X, best), left:S.length};
}

return {ctx, score, consistent, choose, toArr, toCode, fb};
})();
if(typeof module !== 'undefined') module.exports = SenhaAI;
