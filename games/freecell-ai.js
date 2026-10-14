/* =====================================================================
   FreeCell — motor: distribuição clássica numerada (1–32000) e solucionador
   Cartas são números 0..51: posto = (c>>2)+1 (Ás=1 … Rei=13),
   naipe = c&3 na ordem clássica ♣ ♦ ♥ ♠ (♦ e ♥ vermelhos).
   ===================================================================== */
"use strict";
const FreeCellAI = (() => {
  const RK = c => (c >> 2) + 1, SU = c => c & 3, RED = c => ((c & 3) === 1 || (c & 3) === 2);
  const SUITS = ['♣','♦','♥','♠'];
  const RN = ['','A','2','3','4','5','6','7','8','9','10','J','Q','K'];
  const name = c => RN[RK(c)] + SUITS[SU(c)];

  // distribuição do FreeCell clássico (mesmo gerador linear do jogo nº 1 ao 32000)
  function deal(n){
    let seed = n >>> 0;
    const rnd = () => { seed = (seed * 214013 + 2531011) % 2147483648; return seed >>> 16; };
    const deck = [...Array(52).keys()], cols = [[],[],[],[],[],[],[],[]];
    for(let i=0;i<52;i++){
      const left = 52 - i, j = rnd() % left;
      cols[i % 8].push(deck[j]); deck[j] = deck[left - 1];
    }
    return cols;
  }

  // ------------------------------- regras --------------------------------
  const top = col => col[col.length - 1];
  const fits = (c, on) => RED(c) !== RED(on) && RK(on) === RK(c) + 1;   // c pode ir sobre "on"
  // quantas cartas o topo da coluna tem em sequência (cores alternadas, descendo)
  function runLen(col){
    let n = col.length ? 1 : 0;
    for(let k=col.length-1;k>0 && fits(col[k], col[k-1]);k--) n++;
    return n;
  }
  const freeCells = S => S.cells.reduce((a, x) => a + (x < 0), 0);
  const emptyCols = S => S.cols.reduce((a, c) => a + !c.length, 0);
  // máximo de cartas movidas de uma vez (células livres e colunas vazias como apoio)
  const capacity = (S, toEmpty) => (1 + freeCells(S)) * (1 << Math.max(0, emptyCols(S) - (toEmpty ? 1 : 0)));
  const canFound = (S, c) => S.found[SU(c)] === RK(c) - 1;
  // subir para a fundação é sempre seguro quando as duas de cor oposta já passaram de posto-1
  function safeUp(S, c){
    const r = RK(c); if(!canFound(S, c)) return false;
    if(r <= 2) return true;
    const o = RED(c) ? [0, 3] : [1, 2];
    return S.found[o[0]] >= r - 1 && S.found[o[1]] >= r - 1;
  }
  // aplica as subidas automáticas; devolve a lista do que subiu
  function autoUp(S){
    const done = [];
    for(let again=true;again;){
      again = false;
      for(let i=0;i<8;i++){ const c = top(S.cols[i]); if(c != null && safeUp(S, c)){ S.cols[i].pop(); S.found[SU(c)]++; done.push({from:{p:'c', i}, c}); again = true; } }
      for(let i=0;i<4;i++){ const c = S.cells[i]; if(c >= 0 && safeUp(S, c)){ S.cells[i] = -1; S.found[SU(c)]++; done.push({from:{p:'l', i}, c}); again = true; } }
    }
    return done;
  }
  // valida um lance {from:{p:'c',i,k}|{p:'l',i}, to:{p:'c',i}|{p:'l',i}|{p:'f'}}; devolve mensagem de erro ou null
  function check(S, m){
    const f = m.from, t = m.to;
    let cards;
    if(f.p === 'c'){ const col = S.cols[f.i]; if(!col || !Number.isInteger(f.k) || f.k < 0 || f.k >= col.length) return 'Jogada inválida.'; cards = col.slice(f.k); }
    else if(f.p === 'l'){ if(!(S.cells[f.i] >= 0)) return 'Jogada inválida.'; cards = [S.cells[f.i]]; }
    else return 'Jogada inválida.';
    for(let k=1;k<cards.length;k++) if(!fits(cards[k], cards[k-1])) return 'Só dá para mover cartas em sequência (cores alternadas, descendo).';
    const c = cards[0];
    if(t.p === 'f'){
      if(cards.length > 1) return 'Só uma carta por vez vai para a fundação.';
      return canFound(S, c) ? null : 'Essa carta ainda não pode subir.';
    }
    if(t.p === 'l'){
      if(cards.length > 1) return 'Cada célula livre guarda só uma carta.';
      if(!Number.isInteger(t.i) || t.i < 0 || t.i > 3) return 'Jogada inválida.';
      if(S.cells[t.i] >= 0) return 'Essa célula já está ocupada.';
      return f.p === 'l' && f.i === t.i ? 'Jogada inválida.' : null;
    }
    if(t.p === 'c'){
      if(!Number.isInteger(t.i) || t.i < 0 || t.i > 7 || (f.p === 'c' && f.i === t.i)) return 'Jogada inválida.';
      const dest = S.cols[t.i];
      if(dest.length && !fits(c, top(dest))) return 'Não encaixa: precisa ser uma carta de cor oposta e um posto abaixo.';
      const cap = capacity(S, !dest.length);
      if(cards.length > cap) return `Com as células e colunas livres agora dá para mover no máximo ${cap} carta${cap > 1 ? 's' : ''} de uma vez.`;
      return null;
    }
    return 'Jogada inválida.';
  }
  function exec(S, m){
    const f = m.from, t = m.to;
    let cards;
    if(f.p === 'c') cards = S.cols[f.i].splice(f.k);
    else { cards = [S.cells[f.i]]; S.cells[f.i] = -1; }
    if(t.p === 'f') S.found[SU(cards[0])]++;
    else if(t.p === 'l') S.cells[t.i] = cards[0];
    else S.cols[t.i].push(...cards);
    return cards.length;
  }

  // ----------------------------- solucionador ----------------------------
  const clone = S => ({cols:S.cols.map(c => c.slice()), cells:S.cells.slice(), found:S.found.slice()});
  const keyOf = S => S.cols.map(c => String.fromCharCode(...c.map(x => x + 48))).sort().join('|') + '/' +
    S.cells.filter(x => x >= 0).sort((a, b) => a - b).join(',') + '/' + S.found.join('');
  // lances candidatos (já sem os inúteis óbvios)
  function gen(S){
    const out = [], fc = S.cells.indexOf(-1), ec = S.cols.findIndex(c => !c.length);
    // fundação
    for(let i=0;i<8;i++){ const c = top(S.cols[i]); if(c != null && canFound(S, c)) out.push({from:{p:'c', i, k:S.cols[i].length - 1}, to:{p:'f'}}); }
    for(let i=0;i<4;i++){ const c = S.cells[i]; if(c >= 0 && canFound(S, c)) out.push({from:{p:'l', i}, to:{p:'f'}}); }
    // coluna → coluna (sequências)
    const capN = capacity(S, false), capE = capacity(S, true);
    for(let i=0;i<8;i++){
      const col = S.cols[i]; if(!col.length) continue;
      const run = runLen(col);
      for(let j=0;j<8;j++){
        if(j === i) continue;
        const d = S.cols[j];
        if(d.length){
          const need = RK(top(d)) - 1;    // posto que encaixa
          for(let n=1;n<=run && n<=capN;n++){ const c = col[col.length - n]; if(RK(c) === need && RED(c) !== RED(top(d))){ out.push({from:{p:'c', i, k:col.length - n}, to:{p:'c', i:j}}); break; } }
        }
      }
      if(ec >= 0 && run < col.length){        // para coluna vazia (só se libera algo)
        const n = Math.min(run, capE);
        out.push({from:{p:'c', i, k:col.length - n}, to:{p:'c', i:ec}});
        if(n > 1) out.push({from:{p:'c', i, k:col.length - 1}, to:{p:'c', i:ec}});
      }
    }
    // célula → coluna
    for(let i=0;i<4;i++){
      const c = S.cells[i]; if(c < 0) continue;
      for(let j=0;j<8;j++){ const d = S.cols[j]; if(d.length && fits(c, top(d))) out.push({from:{p:'l', i}, to:{p:'c', i:j}}); }
      if(ec >= 0) out.push({from:{p:'l', i}, to:{p:'c', i:ec}});
    }
    // coluna → célula
    if(fc >= 0) for(let i=0;i<8;i++) if(S.cols[i].length) out.push({from:{p:'c', i, k:S.cols[i].length - 1}, to:{p:'l', i:fc}});
    return out;
  }
  // estimativa de quanto falta (menor = melhor)
  function h(S){
    let v = 0, fsum = 0;
    for(let s=0;s<4;s++) fsum += S.found[s];
    v += (52 - fsum) * 6;
    // cartas por cima da próxima de cada naipe
    for(const col of S.cols){
      let minBelow = 99;
      for(let k=0;k<col.length;k++){
        const c = col[k], r = RK(c);
        if(r > minBelow) v += 2;              // carta maior sobre uma menor: vai ter de sair
        if(r < minBelow) minBelow = r;
        if(S.found[SU(c)] === r - 1) v += (col.length - 1 - k) * 3;
      }
    }
    for(const c of S.cells) if(c >= 0){ v += 3; if(S.found[SU(c)] === RK(c) - 1) v -= 2; }
    v -= emptyCols(S) * 4;
    return v;
  }
  // heap mínimo simples
  function Heap(){ const a = []; return {
    push(x){ a.push(x); let i = a.length - 1; while(i){ const p = (i - 1) >> 1; if(a[p].f <= a[i].f) break; [a[p], a[i]] = [a[i], a[p]]; i = p; } },
    pop(){ const r = a[0], l = a.pop(); if(a.length){ a[0] = l; let i = 0; for(;;){ const L = 2*i+1, R = L+1; let m = i;
      if(L < a.length && a[L].f < a[m].f) m = L; if(R < a.length && a[R].f < a[m].f) m = R; if(m === i) break; [a[m], a[i]] = [a[i], a[m]]; i = m; } } return r; },
    get size(){ return a.length; } }; }
  // busca "melhor primeiro"; devolve a lista de lances (sem as subidas automáticas) ou null
  function solve(S0, {nodes=60000, ms=1500, auto=true}={}){
    const t0 = Date.now(), S = clone(S0);
    if(auto) autoUp(S);
    const seen = new Set([keyOf(S)]), H = Heap();
    H.push({S, f:h(S), g:0, m:null, p:null});
    let n = 0;
    while(H.size){
      const N = H.pop();
      if(N.S.found.every(x => x === 13)){ const path = []; for(let x=N;x.p;x=x.p) path.push(x.m); return path.reverse(); }
      if(++n > nodes || (n % 512 === 0 && Date.now() - t0 > ms)) return null;
      for(const m of gen(N.S)){
        const T = clone(N.S); exec(T, m); if(auto) autoUp(T);
        const k = keyOf(T); if(seen.has(k)) continue; seen.add(k);
        H.push({S:T, f:h(T) + (N.g + 1) * 0.5, g:N.g + 1, m, p:N});
      }
    }
    return null;
  }
  return {RK, SU, RED, SUITS, RN, name, deal, top, fits, runLen, capacity, canFound, safeUp, autoUp, check, exec, solve, gen, clone, keyOf};
})();
if(typeof module !== 'undefined') module.exports = FreeCellAI;
