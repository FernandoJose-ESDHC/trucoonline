/* =====================================================================
   Motor do bot de xadrez (independente das regras da mesa).
   Tabuleiro 10x12 com inteiros, faz/desfaz lances, hash Zobrist,
   tabela de transposição, aprofundamento iterativo com limite de tempo,
   PVS, lance nulo, LMR, lances matadores/histórico, quiescência e
   avaliação com fase de jogo (meio-jogo × final), estrutura de peões,
   mobilidade, segurança do rei e técnica de mate nos finais.
   ===================================================================== */
const ChessAI = (() => {
'use strict';
const OFF = 16, WP = 1, WN = 2, WB = 3, WR = 4, WQ = 5, WK = 6;
const KN = [-21,-19,-12,-8,8,12,19,21], KG = [-11,-10,-9,-1,1,9,10,11], BI = [-11,-9,9,11], RO = [-10,-1,1,10];
const VAL = [0,100,320,330,500,900,0];
const MG = [0,88,320,335,480,940,0], EG = [0,110,290,310,520,920,0];
const PH = [0,0,1,1,2,4,0];
const bd = new Uint8Array(120);
const ROW = new Int8Array(120), COL = new Int8Array(120), I64 = new Int8Array(120).fill(-1);
const S120 = new Uint8Array(64);
for(let i=0;i<64;i++){ const s = 21 + (i>>3)*10 + (i&7); S120[i] = s; ROW[s] = i>>3; COL[s] = i&7; I64[s] = i; }
const CMASK = new Uint8Array(120).fill(15);
CMASK[95] = 15 & ~3; CMASK[98] = 15 & ~1; CMASK[91] = 15 & ~2;
CMASK[25] = 15 & ~12; CMASK[28] = 15 & ~4; CMASK[21] = 15 & ~8;

/* ---------- Zobrist ---------- */
let seed = 0x2545F491;
const rnd = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return seed | 0; };
const ZL = new Int32Array(16*120), ZH = new Int32Array(16*120);
for(let i=0;i<ZL.length;i++){ ZL[i] = rnd(); ZH[i] = rnd(); }
const ZSL = rnd(), ZSH = rnd();
const ZCL = new Int32Array(16), ZCH = new Int32Array(16); for(let i=0;i<16;i++){ ZCL[i] = rnd(); ZCH[i] = rnd(); }
const ZEL = new Int32Array(120), ZEH = new Int32Array(120); for(let i=0;i<120;i++){ ZEL[i] = rnd(); ZEH[i] = rnd(); }

let side = 0, castle = 0, ep = 0, half = 0, hLo = 0, hHi = 0;
const kpos = [0,0];

function computeHash(){
  let lo = 0, hi = 0;
  for(let s=21;s<=98;s++){ const p = bd[s]; if(p && p !== OFF){ lo ^= ZL[p*120+s]; hi ^= ZH[p*120+s]; } }
  if(side){ lo ^= ZSL; hi ^= ZSH; }
  lo ^= ZCL[castle]; hi ^= ZCH[castle];
  if(ep){ lo ^= ZEL[ep]; hi ^= ZEH[ep]; }
  hLo = lo; hHi = hi;
}

/* ---------- pilha de desfazer ---------- */
const MAXH = 1024;
const uMove = new Int32Array(MAXH), uCap = new Uint8Array(MAXH), uCas = new Uint8Array(MAXH), uEp = new Uint8Array(MAXH),
      uHalf = new Int16Array(MAXH), uLo = new Int32Array(MAXH), uHi = new Int32Array(MAXH);
let hp = 0;

// lance = de | para<<7 | promo<<14 | flags<<17   (flags: 1 en passant, 2 roque, 4 avanço duplo, 8 captura)
const mFrom = m => m & 127, mTo = m => (m >> 7) & 127, mPromo = m => (m >> 14) & 7, mFl = m => m >> 17;
const enc = (f, t, pr, fl) => f | (t << 7) | (pr << 14) | (fl << 17);

function attacked(sq, by){
  const c = by << 3;
  if(by === 0){ if(bd[sq+9] === WP || bd[sq+11] === WP) return true; }
  else { if(bd[sq-9] === 9 || bd[sq-11] === 9) return true; }
  const n = c|WN, k = c|WK, b = c|WB, r = c|WR, q = c|WQ;
  for(let i=0;i<8;i++){ if(bd[sq+KN[i]] === n) return true; if(bd[sq+KG[i]] === k) return true; }
  for(let i=0;i<4;i++){
    let d = BI[i], s = sq + d; while(bd[s] === 0) s += d; let p = bd[s]; if(p === b || p === q) return true;
    d = RO[i]; s = sq + d; while(bd[s] === 0) s += d; p = bd[s]; if(p === r || p === q) return true;
  }
  return false;
}
const inCheck = () => attacked(kpos[side], side ^ 1);

function make(m){
  const from = m & 127, to = (m >> 7) & 127, promo = (m >> 14) & 7, fl = m >> 17;
  const p = bd[from], cap = bd[to];
  uMove[hp] = m; uCap[hp] = cap; uCas[hp] = castle; uEp[hp] = ep; uHalf[hp] = half; uLo[hp] = hLo; uHi[hp] = hHi; hp++;
  let lo = hLo ^ ZL[p*120+from], hi = hHi ^ ZH[p*120+from];
  if(cap){ lo ^= ZL[cap*120+to]; hi ^= ZH[cap*120+to]; }
  const np = promo ? (promo | (side << 3)) : p;
  bd[to] = np; bd[from] = 0;
  lo ^= ZL[np*120+to]; hi ^= ZH[np*120+to];
  if(fl & 1){
    const cs = to + (side ? -10 : 10), cp = bd[cs];
    uCap[hp-1] = cp; bd[cs] = 0; lo ^= ZL[cp*120+cs]; hi ^= ZH[cp*120+cs];
  } else if(fl & 2){
    let rf, rt; if(to > from){ rf = to + 1; rt = to - 1; } else { rf = to - 2; rt = to + 1; }
    const r = bd[rf]; bd[rt] = r; bd[rf] = 0;
    lo ^= ZL[r*120+rf] ^ ZL[r*120+rt]; hi ^= ZH[r*120+rf] ^ ZH[r*120+rt];
  }
  if((p & 7) === WK) kpos[side] = to;
  lo ^= ZCL[castle]; hi ^= ZCH[castle];
  castle &= CMASK[from] & CMASK[to];
  lo ^= ZCL[castle]; hi ^= ZCH[castle];
  if(ep){ lo ^= ZEL[ep]; hi ^= ZEH[ep]; ep = 0; }
  if(fl & 4){ ep = (from + to) >> 1; lo ^= ZEL[ep]; hi ^= ZEH[ep]; }
  half = ((p & 7) === WP || cap) ? 0 : half + 1;
  side ^= 1; lo ^= ZSL; hi ^= ZSH;
  hLo = lo; hHi = hi;
  if(attacked(kpos[side ^ 1], side)){ unmake(); return false; }
  return true;
}
function unmake(){
  hp--;
  const m = uMove[hp], from = m & 127, to = (m >> 7) & 127, promo = (m >> 14) & 7, fl = m >> 17;
  side ^= 1;
  const p = promo ? (WP | (side << 3)) : bd[to];
  bd[from] = p;
  if(fl & 1){ bd[to] = 0; bd[to + (side ? -10 : 10)] = uCap[hp]; }
  else bd[to] = uCap[hp];
  if(fl & 2){ if(to > from){ bd[to+1] = bd[to-1]; bd[to-1] = 0; } else { bd[to-2] = bd[to+1]; bd[to+1] = 0; } }
  if((p & 7) === WK) kpos[side] = from;
  castle = uCas[hp]; ep = uEp[hp]; half = uHalf[hp]; hLo = uLo[hp]; hHi = uHi[hp];
}
function makeNull(){
  uMove[hp] = 0; uCas[hp] = castle; uEp[hp] = ep; uHalf[hp] = half; uLo[hp] = hLo; uHi[hp] = hHi; hp++;
  if(ep){ hLo ^= ZEL[ep]; hHi ^= ZEH[ep]; ep = 0; }
  side ^= 1; hLo ^= ZSL; hHi ^= ZSH; half = 0;
}
function unmakeNull(){ hp--; side ^= 1; ep = uEp[hp]; half = uHalf[hp]; hLo = uLo[hp]; hHi = uHi[hp]; }

/* ---------- geração de lances (pseudo-legais) ---------- */
function gen(out, capsOnly){
  let n = 0;
  const me = side, opp = me ^ 1;
  for(let sq=21; sq<=98; sq++){
    const p = bd[sq]; if(!p || p === OFF || (p >> 3) !== me) continue;
    const t = p & 7;
    if(t === WP){
      const d = me ? 10 : -10, to = sq + d;
      const promoRank = me ? (to >= 91) : (to <= 28);
      const start = me ? (sq >= 31 && sq <= 38) : (sq >= 81 && sq <= 88);
      if(bd[to] === 0){
        if(promoRank){ out[n++] = enc(sq,to,WQ,0); if(!capsOnly){ out[n++] = enc(sq,to,WN,0); out[n++] = enc(sq,to,WR,0); out[n++] = enc(sq,to,WB,0); } }
        else if(!capsOnly){ out[n++] = enc(sq,to,0,0); if(start && bd[to+d] === 0) out[n++] = enc(sq,to+d,0,4); }
      }
      for(let k=0;k<2;k++){
        const t2 = to + (k ? 1 : -1), q = bd[t2];
        if(q && q !== OFF && (q >> 3) === opp){
          if(promoRank){ out[n++] = enc(sq,t2,WQ,8); if(!capsOnly){ out[n++] = enc(sq,t2,WN,8); out[n++] = enc(sq,t2,WR,8); out[n++] = enc(sq,t2,WB,8); } }
          else out[n++] = enc(sq,t2,0,8);
        } else if(ep && t2 === ep) out[n++] = enc(sq,t2,0,9);
      }
    } else if(t === WN || t === WK){
      const D = t === WN ? KN : KG;
      for(let i=0;i<8;i++){
        const to = sq + D[i], q = bd[to];
        if(q === OFF) continue;
        if(q === 0){ if(!capsOnly) out[n++] = enc(sq,to,0,0); }
        else if((q >> 3) === opp) out[n++] = enc(sq,to,0,8);
      }
      if(t === WK && !capsOnly){
        if(me === 0 && sq === 95){
          if((castle & 1) && !bd[96] && !bd[97] && bd[98] === WR && !attacked(95,1) && !attacked(96,1) && !attacked(97,1)) out[n++] = enc(95,97,0,2);
          if((castle & 2) && !bd[94] && !bd[93] && !bd[92] && bd[91] === WR && !attacked(95,1) && !attacked(94,1) && !attacked(93,1)) out[n++] = enc(95,93,0,2);
        } else if(me === 1 && sq === 25){
          if((castle & 4) && !bd[26] && !bd[27] && bd[28] === 12 && !attacked(25,0) && !attacked(26,0) && !attacked(27,0)) out[n++] = enc(25,27,0,2);
          if((castle & 8) && !bd[24] && !bd[23] && !bd[22] && bd[21] === 12 && !attacked(25,0) && !attacked(24,0) && !attacked(23,0)) out[n++] = enc(25,23,0,2);
        }
      }
    } else {
      const D = t === WB ? BI : t === WR ? RO : KG;
      for(let i=0;i<D.length;i++){
        const d = D[i]; let to = sq + d;
        while(true){
          const q = bd[to];
          if(q === 0){ if(!capsOnly) out[n++] = enc(sq,to,0,0); }
          else { if(q !== OFF && (q >> 3) === opp) out[n++] = enc(sq,to,0,8); break; }
          to += d;
        }
      }
    }
  }
  return n;
}

/* ---------- avaliação ---------- */
const flip = a => { const r = []; for(let i=0;i<64;i++) r[i] = a[(7 - (i>>3))*8 + (i&7)]; return r; };
// tabelas do ponto de vista das brancas, índice 0 = a8
const PST_MG = [null,
 [0,0,0,0,0,0,0,0, 60,60,60,60,60,60,60,60, 12,14,24,32,32,24,14,12, 6,6,12,26,26,12,6,6, 0,0,4,22,22,4,0,0, 4,-4,-6,4,4,-6,-4,4, 4,8,8,-22,-22,8,8,4, 0,0,0,0,0,0,0,0],
 [-50,-40,-30,-30,-30,-30,-40,-50,-40,-20,0,0,0,0,-20,-40,-30,0,10,15,15,10,0,-30,-30,5,15,20,20,15,5,-30,-30,0,15,20,20,15,0,-30,-30,5,10,15,15,10,5,-30,-40,-20,0,5,5,0,-20,-40,-50,-40,-30,-30,-30,-30,-40,-50],
 [-20,-10,-10,-10,-10,-10,-10,-20,-10,0,0,0,0,0,0,-10,-10,0,5,10,10,5,0,-10,-10,5,5,10,10,5,5,-10,-10,0,10,10,10,10,0,-10,-10,10,10,10,10,10,10,-10,-10,5,0,0,0,0,5,-10,-20,-10,-10,-10,-10,-10,-10,-20],
 [0,0,0,0,0,0,0,0,5,10,10,10,10,10,10,5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,0,0,0,5,5,0,0,0],
 [-20,-10,-10,-5,-5,-10,-10,-20,-10,0,0,0,0,0,0,-10,-10,0,5,5,5,5,0,-10,-5,0,5,5,5,5,0,-5,0,0,5,5,5,5,0,-5,-10,5,5,5,5,5,0,-10,-10,0,5,0,0,0,0,-10,-20,-10,-10,-5,-5,-10,-10,-20],
 [-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-20,-30,-30,-40,-40,-30,-30,-20,-10,-20,-20,-20,-20,-20,-20,-10,20,20,-5,-5,-5,-5,20,20,20,30,10,0,0,10,30,20]
];
const PST_EG = [null,
 [0,0,0,0,0,0,0,0, 90,90,90,90,90,90,90,90, 55,55,55,55,55,55,55,55, 32,32,32,32,32,32,32,32, 16,16,16,16,16,16,16,16, 6,6,6,6,6,6,6,6, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0],
 [-50,-40,-30,-30,-30,-30,-40,-50,-40,-20,0,0,0,0,-20,-40,-30,0,10,15,15,10,0,-30,-30,5,15,20,20,15,5,-30,-30,0,15,20,20,15,0,-30,-30,5,10,15,15,10,5,-30,-40,-20,0,5,5,0,-20,-40,-50,-40,-30,-30,-30,-30,-40,-50],
 [-20,-10,-10,-10,-10,-10,-10,-20,-10,0,0,0,0,0,0,-10,-10,0,5,10,10,5,0,-10,-10,5,10,10,10,10,5,-10,-10,5,10,10,10,10,5,-10,-10,0,5,10,10,5,0,-10,-10,0,0,0,0,0,0,-10,-20,-10,-10,-10,-10,-10,-10,-20],
 [5,5,5,5,5,5,5,5, 10,10,10,10,10,10,10,10, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0],
 [-20,-10,-10,-5,-5,-10,-10,-20,-10,0,5,5,5,5,0,-10,-10,5,10,10,10,10,5,-10,-5,5,10,15,15,10,5,-5,-5,5,10,15,15,10,5,-5,-10,5,10,10,10,10,5,-10,-10,0,5,5,5,5,0,-10,-20,-10,-10,-5,-5,-10,-10,-20],
 [-50,-40,-30,-20,-20,-30,-40,-50,-30,-20,-10,0,0,-10,-20,-30,-30,-10,20,30,30,20,-10,-30,-30,-10,30,40,40,30,-10,-30,-30,-10,30,40,40,30,-10,-30,-30,-10,20,30,30,20,-10,-30,-30,-30,0,0,0,0,-30,-30,-50,-30,-30,-30,-30,-30,-30,-50]
];
// tabelas combinadas por peça (com cor) e casa 10x12
const TMG = [], TEG = [];
for(let c=0;c<2;c++) for(let t=1;t<=6;t++){
  const p = (c << 3) | t, mg = c ? flip(PST_MG[t]) : PST_MG[t], eg = c ? flip(PST_EG[t]) : PST_EG[t];
  TMG[p] = new Int16Array(120); TEG[p] = new Int16Array(120);
  for(let i=0;i<64;i++){ TMG[p][S120[i]] = MG[t] + mg[i]; TEG[p][S120[i]] = EG[t] + eg[i]; }
}
const PASS_MG = [0,0,5,10,20,35,60,0], PASS_EG = [0,10,15,25,45,75,120,0];
const MOB_MG = [0,0,4,5,2,1], MOB_EG = [0,0,4,5,4,2], MOB_BASE = [0,0,4,6,7,13], ATK_W = [0,0,2,2,3,5];
const pf = [new Int8Array(10), new Int8Array(10)];          // peões por coluna
const wMax = new Int8Array(10), bMin = new Int8Array(10);   // peão branco mais atrasado / preto mais atrasado (por linha)

function evaluate(){
  let mg0 = 0, mg1 = 0, eg0 = 0, eg1 = 0, phase = 0;
  pf[0].fill(0); pf[1].fill(0); wMax.fill(-1); bMin.fill(8);
  const mat = [0,0], nb = [0,0], np = [0,0];
  for(let s=21;s<=98;s++){
    const p = bd[s]; if(!p || p === OFF) continue;
    const t = p & 7, c = p >> 3;
    if(c){ mg1 += TMG[p][s]; eg1 += TEG[p][s]; } else { mg0 += TMG[p][s]; eg0 += TEG[p][s]; }
    phase += PH[t]; mat[c] += VAL[t];
    if(t === WP){ np[c]++; const f = COL[s] + 1; pf[c][f]++; const r = ROW[s];
      if(c === 0){ if(r > wMax[f]) wMax[f] = r; } else { if(r < bMin[f]) bMin[f] = r; } }
    else if(t === WB) nb[c]++;
  }
  // as tabelas de "mais atrasado" precisam do contrário para peões passados:
  // passado (brancas) = nenhum peão preto à frente nas 3 colunas → precisa do peão preto MAIS ADIANTADO (menor linha)
  // já temos bMin (menor linha das pretas) e wMax (maior linha das brancas)
  const kz = [kpos[0], kpos[1]];
  let atk0 = 0, atk1 = 0, atkN0 = 0, atkN1 = 0;    // ataques contra o rei branco (0) / preto (1)
  for(let s=21;s<=98;s++){
    const p = bd[s]; if(!p || p === OFF) continue;
    const t = p & 7, c = p >> 3, f = COL[s] + 1, r = ROW[s];
    if(t === WP){
      let m = 0, e = 0;
      if(pf[c][f] > 1){ m -= 8; e -= 16; }
      if(!pf[c][f-1] && !pf[c][f+1]){ m -= 10; e -= 14; }
      if(c === 0){
        if(bMin[f-1] >= r && bMin[f] >= r && bMin[f+1] >= r){ const rk = 7 - r; m += PASS_MG[rk]; e += PASS_EG[rk];
          if(bd[s-10] !== 0) e -= PASS_EG[rk] >> 2; }
      } else {
        if(wMax[f-1] <= r && wMax[f] <= r && wMax[f+1] <= r){ const rk = r; m += PASS_MG[rk]; e += PASS_EG[rk];
          if(bd[s+10] !== 0) e -= PASS_EG[rk] >> 2; }
      }
      if(c){ mg1 += m; eg1 += e; } else { mg0 += m; eg0 += e; }
      continue;
    }
    if(t === WK) continue;
    // mobilidade e ataques perto do rei inimigo
    const ek = kz[c ^ 1], ekr = ROW[ek], ekc = COL[ek];
    let mob = 0, hits = 0;
    if(t === WN){
      for(let i=0;i<8;i++){ const to = s + KN[i], q = bd[to]; if(q === OFF) continue;
        if(q === 0 || (q >> 3) !== c){ mob++; if(Math.abs(ROW[to]-ekr) <= 1 && Math.abs(COL[to]-ekc) <= 1) hits++; } }
    } else {
      const D = t === WB ? BI : t === WR ? RO : KG;
      for(let i=0;i<D.length;i++){ const d = D[i]; let to = s + d;
        while(true){ const q = bd[to]; if(q === OFF) break;
          if(q === 0 || (q >> 3) !== c){ mob++; if(Math.abs(ROW[to]-ekr) <= 1 && Math.abs(COL[to]-ekc) <= 1) hits++; }
          if(q !== 0) break; to += d; } }
      if(t === WR){
        if(!pf[c][f]){ const open = !pf[c^1][f]; if(c){ mg1 += open ? 25 : 12; eg1 += open ? 10 : 5; } else { mg0 += open ? 25 : 12; eg0 += open ? 10 : 5; } }
      }
    }
    const dm = (mob - MOB_BASE[t]);
    if(c){ mg1 += dm*MOB_MG[t]; eg1 += dm*MOB_EG[t]; } else { mg0 += dm*MOB_MG[t]; eg0 += dm*MOB_EG[t]; }
    if(hits){ if(c){ atk0 += hits*ATK_W[t]; atkN0++; } else { atk1 += hits*ATK_W[t]; atkN1++; } }
  }
  // segurança do rei (meio-jogo): escudo de peões e ataques
  for(let c=0;c<2;c++){
    const k = kz[c], f = COL[k], r = ROW[k];
    let sh = 0;
    const home = c ? r <= 1 : r >= 6;
    if(home && (f <= 2 || f >= 5)){
      const fw = c ? 10 : -10, own = c ? 9 : 1;
      for(let df=-1; df<=1; df++){
        const ff = f + df; if(ff < 0 || ff > 7) continue;
        const s1 = k + fw + df, s2 = k + 2*fw + df;
        if(bd[s1] === own) sh += 0; else if(bd[s2] === own) sh -= 10; else sh -= 24;
      }
    } else if(!home) sh -= 12;
    const units = c ? atk1 : atk0, nAtt = c ? atkN1 : atkN0;
    const danger = nAtt >= 2 ? Math.min(450, (units*units*3) >> 1) : 0;
    if(c) mg1 += sh - danger; else mg0 += sh - danger;
  }
  if(nb[0] >= 2){ mg0 += 30; eg0 += 50; }
  if(nb[1] >= 2){ mg1 += 30; eg1 += 50; }
  if(phase > 24) phase = 24;
  let score = (((mg0 - mg1) * phase) + ((eg0 - eg1) * (24 - phase))) / 24;
  // finais: sem peões e pouca vantagem não ganha; com vantagem clara, empurra o rei inimigo pro canto
  const strong = score > 0 ? 0 : 1, weak = strong ^ 1;
  const diff = mat[strong] - mat[weak];
  if(np[strong] === 0 && diff < 400) score /= (mat[strong] <= 330 ? 16 : 4);
  else if(phase <= 10 && diff >= 300){
    const wk = kz[weak], sk = kz[strong];
    const cd = Math.max(3 - COL[wk], COL[wk] - 4) + Math.max(3 - ROW[wk], ROW[wk] - 4);
    const kd = Math.abs(COL[wk] - COL[sk]) + Math.abs(ROW[wk] - ROW[sk]);
    const bonus = cd*12 + (14 - kd)*5;
    score += strong === 0 ? bonus : -bonus;
  }
  score = side === 0 ? score : -score;
  return (score | 0) + 12;   // pequeno bônus de quem tem a vez
}

/* ---------- busca ---------- */
const MATE = 30000, INF = 32000, MAXPLY = 64;
const TTSIZE = 1 << 19, TTMASK = TTSIZE - 1;
const ttKey = new Int32Array(TTSIZE), ttMove = new Int32Array(TTSIZE), ttScore = new Int16Array(TTSIZE),
      ttDepth = new Int8Array(TTSIZE), ttFlag = new Uint8Array(TTSIZE);   // flag: 0 vazio, 1 exato, 2 inferior (>=beta), 3 superior (<=alpha)
const lists = [], scores = [];
for(let i=0;i<MAXPLY+8;i++){ lists.push(new Int32Array(256)); scores.push(new Int32Array(256)); }
const killers = new Int32Array((MAXPLY+8)*2);
const histT = new Int32Array(16*120);
let nodes = 0, deadline = 0, stopped = false, rootBest = 0, rootScore = 0, gameHist = [], rootSide = 0;
const CONTEMPT = 20;

function isRepetition(){
  const lim = Math.max(0, hp - half);
  for(let i=hp-2; i>=lim; i-=2) if(uLo[i] === hLo && uHi[i] === hHi) return true;
  if(half >= hp){
    for(let i=0;i<gameHist.length;i+=2) if(gameHist[i] === hLo && gameHist[i+1] === hHi) return true;
  }
  return false;
}
function nonPawn(c){
  for(let s=21;s<=98;s++){ const p = bd[s]; if(p && p !== OFF && (p >> 3) === c){ const t = p & 7; if(t !== WP && t !== WK) return true; } }
  return false;
}
function orderMoves(n, list, sc, ttm, ply){
  const k1 = killers[ply*2], k2 = killers[ply*2+1];
  for(let i=0;i<n;i++){
    const m = list[i];
    if(m === ttm){ sc[i] = 30000000; continue; }
    const fl = m >> 17, pr = (m >> 14) & 7;
    if(fl & 8){ const vic = fl & 1 ? WP : (bd[(m >> 7) & 127] & 7); sc[i] = 20000000 + VAL[vic]*16 - (bd[m & 127] & 7) + (pr === WQ ? 8000 : 0); }
    else if(pr === WQ) sc[i] = 19000000;
    else if(m === k1) sc[i] = 18000000;
    else if(m === k2) sc[i] = 17000000;
    else sc[i] = histT[bd[m & 127]*120 + ((m >> 7) & 127)];
  }
}
function pickNext(i, n, list, sc){
  let b = i;
  for(let j=i+1;j<n;j++) if(sc[j] > sc[b]) b = j;
  if(b !== i){ const tm = list[i]; list[i] = list[b]; list[b] = tm; const ts = sc[i]; sc[i] = sc[b]; sc[b] = ts; }
  return list[i];
}
function checkTime(){ if((++nodes & 1023) === 0 && Date.now() > deadline) stopped = true; }

function qsearch(alpha, beta, ply){
  checkTime(); if(stopped) return 0;
  const stand = evaluate();
  if(ply >= MAXPLY) return stand;
  if(stand >= beta) return stand;
  if(stand > alpha) alpha = stand;
  const list = lists[ply], sc = scores[ply];
  const n = gen(list, true);
  orderMoves(n, list, sc, 0, ply);
  for(let i=0;i<n;i++){
    const m = pickNext(i, n, list, sc), fl = m >> 17;
    if(!((m >> 14) & 7)){
      const vic = fl & 1 ? WP : (bd[(m >> 7) & 127] & 7);
      if(stand + VAL[vic] + 200 < alpha) continue;                 // poda delta
    }
    if(!make(m)) continue;
    const s = -qsearch(-beta, -alpha, ply + 1);
    unmake();
    if(stopped) return 0;
    if(s > alpha){ alpha = s; if(s >= beta) return s; }
  }
  return alpha;
}

function search(depth, alpha, beta, ply, allowNull){
  if(ply && (half >= 100 || isRepetition())) return side === rootSide ? -CONTEMPT : CONTEMPT;   // não aceita empate à toa
  const chk = inCheck();
  if(chk) depth++;
  if(depth <= 0) return qsearch(alpha, beta, ply);
  checkTime(); if(stopped) return 0;
  if(ply >= MAXPLY) return evaluate();
  const pv = beta - alpha > 1;
  // mate a distância: não adianta procurar mais longe que o mate já achado
  if(ply){ alpha = Math.max(alpha, -MATE + ply); beta = Math.min(beta, MATE - ply - 1); if(alpha >= beta) return alpha; }
  const ti = hLo & TTMASK;
  let ttm = 0;
  if(ttKey[ti] === hHi && ttFlag[ti]){
    ttm = ttMove[ti];
    if(!pv && ply && ttDepth[ti] >= depth){
      let s = ttScore[ti]; if(s > MATE - 200) s -= ply; else if(s < -MATE + 200) s += ply;
      const f = ttFlag[ti];
      if(f === 1 || (f === 2 && s >= beta) || (f === 3 && s <= alpha)) return s;
    }
  }
  let staticEval = 0;
  if(!chk && !pv){
    staticEval = evaluate();
    // poda reversa (a posição já é boa demais)
    if(depth <= 3 && staticEval - 110*depth >= beta && Math.abs(beta) < MATE - 200) return staticEval;
    // lance nulo
    if(allowNull && depth >= 3 && staticEval >= beta && nonPawn(side)){
      makeNull();
      const s = -search(depth - 1 - (depth >= 6 ? 3 : 2), -beta, -beta + 1, ply + 1, false);
      unmakeNull();
      if(stopped) return 0;
      if(s >= beta && Math.abs(s) < MATE - 200) return beta;
    }
  }
  const list = lists[ply], sc = scores[ply];
  const n = gen(list, false);
  orderMoves(n, list, sc, ttm, ply);
  let legalN = 0, best = -INF, bestM = 0;
  const a0 = alpha;
  const futile = !pv && !chk && depth <= 2 && staticEval + (depth === 1 ? 180 : 360) <= alpha;
  for(let i=0;i<n;i++){
    const m = pickNext(i, n, list, sc);
    const fl = m >> 17, quiet = !(fl & 8) && !((m >> 14) & 7);
    if(!make(m)) continue;
    legalN++;
    const gives = inCheck();
    if(futile && quiet && !gives && legalN > 1){ unmake(); continue; }
    let s;
    if(legalN === 1) s = -search(depth - 1, -beta, -alpha, ply + 1, true);
    else {
      let red = 0;
      if(depth >= 3 && legalN > 3 && quiet && !chk && !gives && m !== killers[ply*2] && m !== killers[ply*2+1])
        red = 1 + (legalN > 8 ? 1 : 0) + (depth >= 8 && legalN > 16 ? 1 : 0);
      s = -search(depth - 1 - red, -alpha - 1, -alpha, ply + 1, true);
      if(s > alpha && red) s = -search(depth - 1, -alpha - 1, -alpha, ply + 1, true);
      if(s > alpha && s < beta) s = -search(depth - 1, -beta, -alpha, ply + 1, true);
    }
    unmake();
    if(stopped) return 0;
    if(s > best){
      best = s; bestM = m;
      if(s > alpha){
        alpha = s;
        if(ply === 0){ rootBest = m; rootScore = s; }
        if(s >= beta){
          if(quiet){
            if(killers[ply*2] !== m){ killers[ply*2+1] = killers[ply*2]; killers[ply*2] = m; }
            const hi = bd[m & 127]*120 + ((m >> 7) & 127);
            histT[hi] += depth*depth; if(histT[hi] > 1000000) for(let k=0;k<histT.length;k++) histT[k] >>= 1;
          }
          break;
        }
      }
    }
  }
  if(!legalN) return chk ? -MATE + ply : 0;
  // grava na tabela de transposição
  let st = best; if(st > MATE - 200) st += ply; else if(st < -MATE + 200) st -= ply;
  if(ttKey[ti] !== hHi || depth >= ttDepth[ti] || ttFlag[ti] !== 1){
    ttKey[ti] = hHi; ttMove[ti] = bestM; ttScore[ti] = st; ttDepth[ti] = depth;
    ttFlag[ti] = best >= beta ? 2 : best > a0 ? 1 : 3;
  }
  return best;
}

/* ---------- interface com o jogo ---------- */
const CODE = {P:1,N:2,B:3,R:4,Q:5,K:6};
function load(b, turn, cas, epIdx, hf){
  bd.fill(OFF);
  for(let i=0;i<64;i++){
    const x = b[i], s = S120[i];
    if(!x){ bd[s] = 0; continue; }
    const up = x.toUpperCase(), c = x === up ? 0 : 1;
    bd[s] = CODE[up] | (c << 3);
    if(up === 'K') kpos[c] = s;
  }
  side = turn === 'w' ? 0 : 1;
  castle = (cas.K ? 1 : 0) | (cas.Q ? 2 : 0) | (cas.k ? 4 : 0) | (cas.q ? 8 : 0);
  ep = epIdx >= 0 ? S120[epIdx] : 0; half = hf || 0; hp = 0;
  computeHash();
}
function hashOfKey(key){
  const parts = key.split(',');
  if(parts.length !== 64) return null;
  const mt = /^([PNBRQKpnbrqk]?)([wb])(K?Q?k?q?)(-?\d+)$/.exec(parts[63]);
  if(!mt) return null;
  const b = parts.slice(0, 63).concat([mt[1]]);
  const cas = {K:mt[3].includes('K'), Q:mt[3].includes('Q'), k:mt[3].includes('k'), q:mt[3].includes('q')};
  load(b, mt[2], cas, +mt[4], 0);
  return [hLo, hHi];
}
const toGame = m => ({from:I64[m & 127], to:I64[(m >> 7) & 127], promo:[null,null,'N','B','R','Q'][(m >> 14) & 7] || undefined});

function rootMoves(){
  const list = new Int32Array(256), n = gen(list, false), out = [];
  for(let i=0;i<n;i++){ if(make(list[i])){ unmake(); out.push(list[i]); } }
  return out;
}

/* st: estado da mesa; opts: {time, depth, noise} */
function think(st, opts){
  // histórico da partida (só o que pode repetir: desde o último lance irreversível)
  gameHist = [];
  const keys = (st.keys || []).slice(0, -1).slice(-Math.max(0, st.half || 0));
  for(const k of keys){ const h = hashOfKey(k); if(h) gameHist.push(h[0], h[1]); }
  load(st.b, st.turn, st.castle, st.ep, st.half);
  rootSide = side;
  const moves = rootMoves();
  if(!moves.length) return null;
  if(moves.length === 1) return {move:toGame(moves[0]), score:0, depth:0};
  nodes = 0; stopped = false; killers.fill(0);
  for(let k=0;k<histT.length;k++) histT[k] >>= 2;
  const t0 = Date.now(); deadline = t0 + opts.time;
  // fácil: olha só um pouco à frente e escolhe com "ruído" entre os lances parecidos
  if(opts.noise){
    const sc = [];
    for(const m of moves){
      make(m);
      let s = -search(opts.depth - 1, -INF, INF, 1, true);
      unmake();
      sc.push({m, s: s + Math.random()*opts.noise});
    }
    sc.sort((a,b) => b.s - a.s);
    return {move:toGame(sc[0].m), score:sc[0].s, depth:opts.depth};
  }
  let best = moves[0], bestScore = 0, done = 0;
  for(let d=1; d<=opts.depth; d++){
    rootBest = 0;
    let s, alpha = -INF, beta = INF;
    if(d >= 5){ alpha = bestScore - 40; beta = bestScore + 40; }
    while(true){
      s = search(d, alpha, beta, 0, false);
      if(stopped) break;
      if(s <= alpha){ alpha = -INF; continue; }
      if(s >= beta){ beta = INF; continue; }
      break;
    }
    if(stopped){ if(rootBest && rootScore > bestScore - 30) best = rootBest; break; }
    if(rootBest){ best = rootBest; bestScore = s; }
    done = d;
    if(Math.abs(s) > MATE - 200 && d >= 4) break;           // achou mate: não precisa ir além
    if(Date.now() - t0 > opts.time * 0.55) break;           // a próxima iteração não caberia
  }
  return {move:toGame(best), score:bestScore, depth:done, nodes};
}

function perft(d){
  if(!d) return 1;
  const list = new Int32Array(256), n = gen(list, false);
  let c = 0;
  for(let i=0;i<n;i++){ if(make(list[i])){ c += perft(d-1); unmake(); } }
  return c;
}
return { think, load, perft, evaluate: () => evaluate() };
})();
if(typeof module !== 'undefined') module.exports = ChessAI;
