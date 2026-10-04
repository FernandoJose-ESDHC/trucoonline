/* =====================================================================
   Motor do bot de Quatro em Linha (7 colunas × 6 linhas).
   Bitboards em duas metades de 32 bits (bit = coluna*7 + linha, linha 0
   embaixo; a 7ª linha de cada coluna fica vazia como separador),
   negamax alfa-beta com janela nula, tabela de transposição, ordenação
   pelo centro e pelas ameaças que o lance cria, filtro de lances que
   entregam a vitória, aprofundamento iterativo com limite de tempo e
   avaliação por ameaças (com paridade de linha), ameaças empilhadas e
   posição.
   ===================================================================== */
const QuatroAI = (() => {
'use strict';
const W = 7, H = 6, SZ = W * H;
const ORDER = [3, 2, 4, 1, 5, 0, 6];
const WIN = 100000, INF = 1e9;

/* ---------- máscaras (pares lo/hi) ---------- */
const CL = new Int32Array(49), CH = new Int32Array(49);       // bit de cada casa
for(let i=0;i<49;i++){ if(i < 32) CL[i] = 1 << i; else CH[i] = 1 << (i - 32); }
let BL = 0, BH = 0, EVL = 0, EVH = 0;                          // tabuleiro; linhas pares (0,2,4)
for(let c=0;c<W;c++) for(let r=0;r<H;r++){
  const i = c*7 + r; BL |= CL[i]; BH |= CH[i];
  if(r % 2 === 0){ EVL |= CL[i]; EVH |= CH[i]; }
}
const ODL = BL & ~EVL, ODH = BH & ~EVH;
// tabela posicional (quantas quádruplas passam pela casa), em planos de bits
const TAB = [[3,4,5,5,4,3],[4,6,8,8,6,4],[5,8,11,11,8,5],[7,10,13,13,10,7],[5,8,11,11,8,5],[4,6,8,8,6,4],[3,4,5,5,4,3]];
const PLL = new Int32Array(4), PLH = new Int32Array(4);
for(let c=0;c<W;c++) for(let r=0;r<H;r++) for(let k=0;k<4;k++) if(TAB[c][r] >> k & 1){ PLL[k] |= CL[c*7+r]; PLH[k] |= CH[c*7+r]; }

/* ---------- operações de 64 bits em pares ---------- */
let rL = 0, rH = 0;
function shl(l, h, n){ rH = (h << n) | (l >>> (32 - n)); rL = l << n; }
function shr(l, h, n){ rL = (l >>> n) | (h << (32 - n)); rH = h >>> n; }
function pc(x){ x = x - ((x >>> 1) & 0x55555555); x = (x & 0x33333333) + ((x >>> 2) & 0x33333333); return (Math.imul((x + (x >>> 4)) & 0x0F0F0F0F, 0x01010101) >>> 24); }
// casas vazias que completariam 4 para as pedras (l,h)  →  wL, wH
let wL = 0, wH = 0;
const DIRS = [7, 6, 8];
function winPos(l, h, ml, mh){
  shl(l, h, 1); let aL = rL, aH = rH; shl(l, h, 2); aL &= rL; aH &= rH; shl(l, h, 3);
  let oL = aL & rL, oH = aH & rH;                                           // vertical
  for(let k=0;k<3;k++){
    const d = DIRS[k];
    shl(l, h, d); let xL = rL, xH = rH; shl(l, h, 2*d); xL &= rL; xH &= rH;
    shl(l, h, 3*d); oL |= xL & rL; oH |= xH & rH;
    shr(l, h, d);   oL |= xL & rL; oH |= xH & rH;
    shr(l, h, d); xL = rL; xH = rH; shr(l, h, 2*d); xL &= rL; xH &= rH;
    shl(l, h, d);   oL |= xL & rL; oH |= xH & rH;
    shr(l, h, 3*d); oL |= xL & rL; oH |= xH & rH;
  }
  wL = oL & (BL ^ ml); wH = oH & (BH ^ mh);
}
function hasFour(l, h){
  for(const d of [1, 7, 6, 8]){
    shr(l, h, d); const mL = l & rL, mH = h & rH;
    shr(mL, mH, 2*d); if((mL & rL) | (mH & rH)) return true;
  }
  return false;
}

/* ---------- posição ---------- */
let pL = 0, pH = 0, mL = 0, mH = 0, moves = 0;   // p = pedras de quem joga, m = todas
const ht = new Int8Array(W);
let posL = 0, posH = 0;                          // casas jogáveis
function possible(){
  posL = 0; posH = 0;
  for(let c=0;c<W;c++) if(ht[c] < H){ const i = c*7 + ht[c]; posL |= CL[i]; posH |= CH[i]; }
}
function play(c){ const i = c*7 + ht[c]; pL ^= mL; pH ^= mH; mL |= CL[i]; mH |= CH[i]; ht[c]++; moves++; }
function undo(c){ ht[c]--; const i = c*7 + ht[c]; mL &= ~CL[i]; mH &= ~CH[i]; pL ^= mL; pH ^= mH; moves--; }
function canWinNext(){ possible(); winPos(pL, pH, mL, mH); return ((wL & posL) | (wH & posH)) !== 0; }
// lances que não entregam a vitória imediata (Pons)  →  nlL, nlH
let nlL = 0, nlH = 0;
function nonLosing(){
  possible();
  winPos(pL ^ mL, pH ^ mH, mL, mH);
  const oL = wL, oH = wH;
  let fL = posL & oL, fH = posH & oH;
  let aL = posL, aH = posH;
  if(fL | fH){
    if(pc(fL) + pc(fH) > 1){ nlL = 0; nlH = 0; return; }   // duas ameaças: perdido
    aL = fL; aH = fH;
  }
  shr(oL, oH, 1);                                          // não jogar embaixo da casa vencedora do adversário
  nlL = aL & ~rL; nlH = aH & ~rH;
}
function colIn(c, l, h){ const i = c*7 + ht[c]; return ((l & CL[i]) | (h & CH[i])) !== 0; }
// quantas casas vencedoras o lance cria (ordenação)
function moveScore(c){
  const i = c*7 + ht[c];
  winPos(pL | CL[i], pH | CH[i], mL | CL[i], mH | CH[i]);
  return pc(wL) + pc(wH);
}

/* ---------- avaliação (ponto de vista de quem joga) ----------
   Regras de zugzwang (Allis): o 1º jogador quer ameaças em linhas ímpares
   (1ª, 3ª, 5ª), o 2º em linhas pares. Uma ameaça ímpar do 1º vale se o 2º
   não tem ameaça par abaixo dela na mesma coluna; senão, qualquer ameaça par
   "limpa" do 2º tende a decidir quando o tabuleiro for enchendo. */
function colBits(l, h, c){
  return c < 4 ? (l >>> (c*7)) & 63 : c === 4 ? ((l >>> 28) | (h << 4)) & 63 : (h >>> (c === 5 ? 3 : 10)) & 63;
}
function evaluate(){
  const oL = pL ^ mL, oH = pH ^ mH;
  let s = 0;
  for(let k=0;k<4;k++) s += (pc(pL & PLL[k]) + pc(pH & PLH[k]) - pc(oL & PLL[k]) - pc(oH & PLH[k])) << k;
  const first = (moves & 1) === 0;                         // quem joga agora é o 1º jogador?
  winPos(pL, pH, mL, mH); const aL = wL, aH = wH;
  winPos(oL, oH, mL, mH); const bL = wL, bH = wH;
  s += 8 * (pc(aL) + pc(aH) - pc(bL) - pc(bH));
  // ameaças do 1º (t1) e do 2º (t2)
  const t1L = first ? aL : bL, t1H = first ? aH : bH, t2L = first ? bL : aL, t2H = first ? bH : aH;
  let good1 = 0, good2 = 0, stack1 = 0, stack2 = 0;
  for(let c=0;c<W;c++){
    const x1 = colBits(t1L, t1H, c), x2 = colBits(t2L, t2H, c);
    if(!(x1 | x2)) continue;
    const o1 = x1 & 0b010101, e2 = x2 & 0b101010;          // bit 0 = 1ª linha (ímpar)
    const lo1 = o1 & -o1, le2 = e2 & -e2;
    if(o1 && !(e2 & (lo1 - 1))) good1++;
    if(e2 && !(o1 & (le2 - 1))) good2++;
    if(x1 & (x1 >> 1)) stack1++;                            // duas ameaças empilhadas
    if(x2 & (x2 >> 1)) stack2++;
  }
  let z = 0;                                                // do ponto de vista do 1º jogador
  if(good1) z += 120 + 20 * good1;
  else if(good2) z -= 120 + 20 * good2;
  z += 40 * (stack1 - stack2);
  return s + (first ? z : -z);
}

/* ---------- tabela de transposição ---------- */
const TTB = 20, TTSIZE = 1 << TTB;
const tK1 = new Int32Array(TTSIZE), tK2 = new Int32Array(TTSIZE), tSc = new Int32Array(TTSIZE),
      tDp = new Int8Array(TTSIZE), tFl = new Uint8Array(TTSIZE), tMv = new Int8Array(TTSIZE);
let k1 = 0, k2 = 0, kIdx = 0;
function key(){
  // chave única = posição + máscara (soma de 49 bits)
  const lo = (pL >>> 0) + (mL >>> 0);
  k1 = lo | 0; k2 = (pH + mH + (lo > 0xFFFFFFFF ? 1 : 0)) | 0;
  kIdx = Math.imul(k1 ^ Math.imul(k2, 0x85EBCA6B), 0x9E3779B1) >>> (32 - TTB);
}

/* ---------- busca ---------- */
let nodes = 0, deadline = 0, stopped = false;
const info = {depth:0, score:0};
const mvBuf = []; for(let i=0;i<=SZ;i++) mvBuf.push(new Int8Array(W));
const scBuf = []; for(let i=0;i<=SZ;i++) scBuf.push(new Int32Array(W));
function search(depth, alpha, beta, ply){
  if((++nodes & 4095) === 0 && Date.now() > deadline) stopped = true;
  if(stopped) return 0;
  if(canWinNext()) return WIN - (moves + 1);
  nonLosing();
  const nxL = nlL, nxH = nlH;
  if(!(nxL | nxH)) return -(WIN - (moves + 2));
  if(moves >= SZ - 2) return 0;
  const mx = WIN - (moves + 3);
  if(beta > mx){ beta = mx; if(alpha >= beta) return beta; }
  const mn = -(WIN - (moves + 4));
  if(alpha < mn){ alpha = mn; if(alpha >= beta) return alpha; }
  if(depth <= 0) return evaluate();
  key();
  const ti = kIdx, kk1 = k1, kk2 = k2;
  let ttm = -1;
  if(tFl[ti] && tK1[ti] === kk1 && tK2[ti] === kk2){
    ttm = tMv[ti];
    if(tDp[ti] >= depth){
      const s = tSc[ti], f = tFl[ti];
      if(f === 1) return s;
      if(f === 2 && s >= beta) return s;
      if(f === 3 && s <= alpha) return s;
    }
  }
  // lances (só os que não perdem na hora), ordenados
  const mv = mvBuf[ply], sc = scBuf[ply];
  let n = 0;
  for(let k=0;k<W;k++){
    const c = ORDER[k];
    if(ht[c] >= H || !colIn(c, nxL, nxH)) continue;
    const s = c === ttm ? 1e6 : moveScore(c) * 16 + (6 - k);
    let j = n++;
    while(j > 0 && sc[j-1] < s){ sc[j] = sc[j-1]; mv[j] = mv[j-1]; j--; }
    sc[j] = s; mv[j] = c;
  }
  const a0 = alpha;
  let best = -INF, bestC = mv[0];
  for(let i=0;i<n;i++){
    const c = mv[i];
    play(c);
    let s;
    if(i === 0) s = -search(depth - 1, -beta, -alpha, ply + 1);
    else {
      s = -search(depth - 1, -alpha - 1, -alpha, ply + 1);
      if(s > alpha && s < beta) s = -search(depth - 1, -beta, -alpha, ply + 1);
    }
    undo(c);
    if(stopped) return 0;
    if(s > best){ best = s; bestC = c; if(s > alpha){ alpha = s; if(s >= beta) break; } }
  }
  if(!tFl[ti] || depth >= tDp[ti] || tK1[ti] !== kk1 || tK2[ti] !== kk2){
    tK1[ti] = kk1; tK2[ti] = kk2; tSc[ti] = best; tDp[ti] = depth; tMv[ti] = bestC;
    tFl[ti] = best >= beta ? 2 : best > a0 ? 1 : 3;
  }
  return best;
}

/* ---------- interface com o jogo ----------
   b: array de 42 (índice = linha*7 + coluna, linha 0 embaixo), valores -1 vazio, 0 ou 1 (cor);
   turn: cor de quem joga. opts: {time, depth, noise} → coluna */
function load(b, turn){
  pL = pH = mL = mH = 0; moves = 0; ht.fill(0);
  for(let c=0;c<W;c++) for(let r=0;r<H;r++){
    const v = b[r*7 + c]; if(v < 0) continue;
    const i = c*7 + r; mL |= CL[i]; mH |= CH[i];
    if(v === turn){ pL |= CL[i]; pH |= CH[i]; }
    ht[c] = r + 1; moves++;
  }
}
/* ---------- livro de aberturas ----------
   Gerado offline com um solucionador exato (estilo Pascal Pons) para as
   posições até 6 pedras que o Difícil pode encontrar: chave = cada coluna
   em 2 dígitos base 36 (1<<altura | bits das pedras do 2º jogador),
   seguida do lance (1–7). */
const BOOK_DATA =
  '0101010101010140301010201010140701010401010140f01010801010140703010801010140701030801010140701010o0101014070101080301014' +
  '0701010801030140701010801010340303010401010140307010801010140303030801010140303010o0101014030301080301014030301080103014' +
  '0303010801010340301030401010140301070801010140301030o01010140301030803010140301030801030140301030801010340301010c0101014' +
  '0701010k01010140303010k01010140301030k01010140301011g01010150301010k03010140301010k01030140301010k0101034030101040301014' +
  '0301010o03010140301010807010140301010803030140301010401030140301010o01030140301010801070140301010401010340301010o0101034' +
  '010301020101012030501020101013070502020101013030d02020101014030506020101013030502060101014030502020301014030502020103013' +
  '030502020101034010d01020101014030d01040101014010t01040101014010d03040101014010d010c0101014010d01040301014010d01040103014' +
  '010d01040101034010503020101015030503020201014010d03020201014010507020201013010503060201014010503020601014010503020203013' +
  '0105030202010330105010601010140305010a0101014010d010a01010140105030a01010140105010q01010140105010a03010140105010a0103014' +
  '0105010a01010340105010203010140305010403010140105030403010140105010c0301014010501040701014010501040303014010501040301034' +
  '0105010201030140305010401030140105030401030140105010c0103014010501040107014010501040103034010501020101034030501040101034' +
  '0105030401010340105010c0101034010501040101074010103020101016030103020102014070103040102014030303040102014030107040102014' +
  '0301030c01020140301030403020140301030401060140301030401020340103030201020140107030401020140103070401020140103030c0102014' +
  '01030304030201401030304010601401030304010203401010702010201303010b02010201401030b02010201401010r02010201401010b060102014' +
  '01010b02030201401010b02010601501010b0201020360101030601020140301030a01020140103030a01020140101070a01020140101030q0102014' +
  '0101030a03020140101030a01060140101030a01020340101030203020140101070403020140101030c0302014010103040702014010103040306014' +
  '01010304030203401010302010601703010302010602401030302010602401010702010602401010306010602401010302030602301010302010e024' +
  '01010302010606401010302010203603010302010403401030302010403401010702010403301010306010403401010302030403401010302010c034' +
  '0101030201040730302010201030140702010401030140306010401030140302030401030140302010c0103014030201040107014030201040103034' +
  '010601020103014010e010401030140106030401030140106010c0103014010601040107014010601040103034010203020103012030403020103013' +
  '010c030201030140104070201030130104030601030140104030203030140104030201070140104030201030340102010601030140302010a0103014' +
  '0106010a01030140102030a01030130102010q01030130102010a01070140102010a01030340102010201070140102030401070140102010c0107014' +
  '01020104010f0160102010401070340102010201030340102030401030340102010c0103034010201040103074020101010101014040101030101014' +
  '0801010701010110402010701010140401020701010140401010b0101014040101070201014040101070102014040101070101024020201030101014' +
  '0204010701010140202020701010140202010b0101014020201070201014020201070102014020201070101024020102030101014020104070101014' +
  '0201020b01010140201020702010140201020701020140201020701010240201010501010140401010d01010140202010d01010140201020d0101014' +
  '0201010l01010140201010d02010140201010d01020140201010d01010240201010302010140201010b0201014020101070401014020101070202014' +
  '0201010301020140201010b01020140201010701040140201010301010240201010b0101024010201010101014010401030101012020c01030101014' +
  '010k01030101014010c02030101014010c01050101012010c01030201014010c01030102014010c01030101024010202030101014010402070101014' +
  '0102040701010140102020b01010140102020702010140102020701020140102010501010140104010d01010140102020d01010140102010l0101012' +
  '0102010d02010140102010d01020140102010302010140104010702010140102010b0201014010201070401014010201030102014010401070102014' +
  '0102010b010201401010201010101401010403010101302010c03010101401020c03010101401010k03010101401010c05010101401010c030201014' +
  '01010c03010201401010c0301010240101020501010140101040d01010140101020l01010140101020d0201014010102030201014010104070201014' +
  '0101020b02010140101010201010140201010601010140401010e01010140202010e01010130201020e01010120201010m01010130201010e0201014' +
  '0201010e01020140201010e01010240102010601010130202030601010140104030601010140102050601010140102030a0101014010203060201014' +
  '0102030601020140102030601010240101020601010150201020603010120102020603010110101040603010140101020a0301014010102060501014' +
  '0101020603010240101010a01010140201010q01010140102010q01010130101020q0101015010101160101013';
const BOOK = new Map();
for(let i=0; i + 15 <= BOOK_DATA.length; i += 15) BOOK.set(BOOK_DATA.slice(i, i + 14), +BOOK_DATA[i + 14] - 1);
function bookKey(b, mirror){
  let k = '';
  for(let cc=0; cc<W; cc++){
    const c = mirror ? W - 1 - cc : cc;
    let v = 0, h = 0;
    for(let r=0;r<H;r++){ const x = b[r*7 + c]; if(x < 0) break; if(x === 1) v |= 1 << r; h++; }
    v |= 1 << h;                                               // sentinela marca a altura
    k += v.toString(36).padStart(2, '0');
  }
  return k;
}
function bookMove(b){
  let m = BOOK.get(bookKey(b, false));
  if(m != null) return m;
  m = BOOK.get(bookKey(b, true));
  return m != null ? W - 1 - m : -1;
}
function legalCols(){ const a = []; for(const c of ORDER) if(ht[c] < H) a.push(c); return a; }
function think(b, turn, opts){
  load(b, turn);
  const legal = legalCols();
  if(!legal.length) return -1;
  if(legal.length === 1) return legal[0];
  // vitória imediata
  possible(); winPos(pL, pH, mL, mH);
  for(const c of legal) if(colIn(c, wL, wH)) return c;
  nonLosing();
  const safe = legal.filter(c => colIn(c, nlL, nlH));
  if(!safe.length){
    // perdido: ao menos tapa uma das ameaças
    winPos(pL ^ mL, pH ^ mH, mL, mH);
    return legal.find(c => colIn(c, wL, wH)) ?? legal[0];
  }
  if(safe.length === 1) return safe[0];
  if(moves === 0 && !opts.noise) return 3;
  if(opts.book && moves <= 7){ const m = bookMove(b); if(m >= 0 && ht[m] < H && safe.includes(m)) return m; }
  nodes = 0; stopped = false;
  const t0 = Date.now(); deadline = t0 + (opts.time || 1000);
  const maxD = Math.min(opts.depth || 42, SZ - moves);
  // Fácil: avalia cada lance com busca rasa e escolhe com um pouco de ruído
  if(opts.noise){
    const sc = safe.map(c => { play(c); const s = -search(maxD - 1, -INF, INF, 1); undo(c); return {c, s}; });
    const top = Math.max(...sc.map(x => x.s));
    if(top > WIN - 100) return sc.find(x => x.s === top).c;
    const ok = sc.filter(x => x.s > -WIN + 100);
    const pool = ok.length ? ok : sc;
    pool.forEach(x => x.r = x.s + Math.random() * opts.noise);
    pool.sort((x, y) => y.r - x.r);
    return pool[0].c;
  }
  const T = opts.time || 1000, solving = opts.solve && moves >= opts.solve;
  // 1) busca heurística com aprofundamento iterativo
  let order = safe.slice(), best = order[0];
  const idScore = new Map();
  if(solving) deadline = t0 + T * 0.4;
  info.depth = 0; info.score = 0; info.solved = false;
  for(let d=1; d<=maxD; d++){
    let alpha = -INF, bestD = -1;
    const scores = new Map();
    for(let i=0;i<order.length;i++){
      const c = order[i];
      play(c);
      let s;
      if(i === 0) s = -search(d - 1, -INF, -alpha, 1);
      else {
        s = -search(d - 1, -alpha - 1, -alpha, 1);
        if(!stopped && s > alpha) s = -search(d - 1, -INF, -alpha, 1);
      }
      undo(c);
      if(stopped) break;
      scores.set(c, s);
      if(s > alpha){ alpha = s; bestD = c; }
    }
    if(stopped){ if(bestD >= 0 && bestD !== order[0] && scores.get(bestD) > (scores.get(order[0]) ?? -INF)) best = bestD; break; }
    best = bestD >= 0 ? bestD : best;
    scores.forEach((v, c) => idScore.set(c, v));
    info.depth = d; info.score = alpha;
    order = [best].concat(order.filter(c => c !== best).sort((x, y) => (scores.get(y) ?? -INF) - (scores.get(x) ?? -INF)));
    if(Math.abs(alpha) > WIN - 100) return best;               // resultado já resolvido pela busca
    if(Date.now() - t0 > (solving ? T * 0.15 : T * 0.55)) break;
  }
  if(!solving) return best;
  // 2) Difícil: resolve de verdade (vence / empata / perde) cada lance, na ordem da busca
  stopped = false; deadline = t0 + T;
  const val = new Map();
  order = [best].concat(order.filter(c => c !== best));
  for(const c of order){
    play(c); const s = -search(99, -1, 1, 1); undo(c);
    if(stopped) break;
    val.set(c, s > 0 ? 1 : s < 0 ? -1 : 0);
    if(s > 0) return c;                                        // vence com jogo perfeito
  }
  info.solved = !stopped;
  const draws = order.filter(c => val.get(c) === 0);
  if(!stopped && draws.length) return draws[0];                // nenhum vence: segura o empate (o melhor pela busca)
  if(val.get(best) === -1){                                    // o escolhido perde: troca por um que não se sabe perdido
    const alt = order.find(c => val.get(c) !== -1);
    if(alt != null) return alt;
  }
  return best;
}
return { think, load, evaluate, hasFour, bookKey,
  // utilitários para testes
  _stats: () => Object.assign({nodes}, info) };
})();
if(typeof module !== 'undefined') module.exports = QuatroAI;
