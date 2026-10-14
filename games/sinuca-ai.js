/* =====================================================================
   Sinuca — motor de física (passo fixo, determinístico), regras e bot.
   Unidades: centímetros e segundos. Área de jogo 254 × 127, bola de
   raio 2,86. A bola 0 é a branca. O anfitrião simula a tacada inteira e
   guarda o resultado + uma trajetória compacta (quadros-chave a 40 fps)
   para todos animarem igual.
   ===================================================================== */
"use strict";
const SN = (() => {
  const W = 254, H = 127, R = 2.86, R2 = 2*R, D2 = R2*R2;
  const DT = 1/120, KF = 3, KFPS = 40, MAXF = 120*40;
  const VMAX = 560;                    // velocidade da tacada com força 100%
  const FA = 14, FK = 0.30;             // atrito: desaceleração fixa + proporcional
  const EB = 0.95, EC = 0.75, ET = 0.97; // restituição bola×bola, tabela (normal e tangente)
  const CC = 7.4, SS = 6.6, RAIL = 11;  // boca das caçapas de canto / meio, largura da borda

  /* ---------- tabelas (segmentos) e caçapas ---------- */
  const SEG = [];
  const CORNERS = [[0,0,1,1],[W,0,-1,1],[0,H,1,-1],[W,H,-1,-1]];
  for(const [ox,oy,sx,sy] of CORNERS){
    SEG.push([ox+sx*CC, oy, ox+sx*(CC-1.6), oy-sy*7]);
    SEG.push([ox, oy+sy*CC, ox-sx*7, oy+sy*(CC-1.6)]);
  }
  for(const [oy,sy] of [[0,1],[H,-1]]){
    SEG.push([W/2-SS, oy, W/2-SS+1.4, oy-sy*7]);
    SEG.push([W/2+SS, oy, W/2+SS-1.4, oy-sy*7]);
    SEG.push([CC, oy, W/2-SS, oy]); SEG.push([W/2+SS, oy, W-CC, oy]);
  }
  SEG.push([0, CC, 0, H-CC]); SEG.push([W, CC, W, H-CC]);
  // caçapas: centro (desenho), pontos de mira e "pontas" da boca (para o bot checar a passagem)
  const POCKETS = CORNERS.map(([ox,oy,sx,sy]) => ({
    x:ox - sx*2.6, y:oy - sy*2.6, r:6.4, side:false, nx:-sx, ny:-sy,
    aims:[[ox - sx*1.2, oy - sy*1.2],[ox + sx*1.9, oy - sy*1.6],[ox - sx*1.6, oy + sy*1.9]],
    tips:[[ox + sx*CC, oy],[ox, oy + sy*CC]]
  })).concat([[0,1],[H,-1]].map(([oy,sy]) => ({
    x:W/2, y:oy - sy*4.6, r:6.4, side:true, nx:0, ny:-sy,
    aims:[[W/2, oy - sy*3],[W/2 - 1.3, oy - sy*3],[W/2 + 1.3, oy - sy*3]],
    tips:[[W/2 - SS, oy],[W/2 + SS, oy]]
  })));

  /* ---------- simulação ---------- */
  const r1 = v => Math.round(v*10)/10;
  // B: [{x,y,in}] (índice = número da bola). Devolve posições finais, 1ª bola tocada, caçapadas e (rec) a trajetória
  function sim(B, vx0, vy0, spin, rec){
    const n = B.length;
    const X = new Float64Array(n), Y = new Float64Array(n), VX = new Float64Array(n), VY = new Float64Array(n), on = new Uint8Array(n);
    for(let i=0;i<n;i++){ X[i] = B[i].x; Y[i] = B[i].y; on[i] = B[i].in ? 0 : 1; }
    VX[0] = vx0; VY[0] = vy0;
    const sp0 = Math.hypot(vx0, vy0) || 1, ux = vx0/sp0, uy = vy0/sp0;
    let first = -1, spinOn = !!spin, K = 0, hits = 0, cush = 0;
    const pots = [], pk = {}, trk = rec ? Array.from({length:n}, () => []) : null;
    const snap = () => { for(let i=0;i<n;i++) trk[i].push(r1(X[i]), r1(Y[i])); K++; };
    let f = 0;
    for(; f<MAXF; f++){
      if(rec && f % KF === 0) snap();
      let vm = 0;
      for(let i=0;i<n;i++) if(on[i]){ const s = VX[i]*VX[i] + VY[i]*VY[i]; if(s > vm) vm = s; }
      if(vm === 0) break;
      const ns = Math.min(24, Math.max(1, Math.ceil(Math.sqrt(vm)*DT/(R*0.45)))), h = DT/ns;
      for(let k=0;k<ns;k++){
        // move + atrito
        for(let i=0;i<n;i++){
          if(!on[i] || (VX[i] === 0 && VY[i] === 0)) continue;
          X[i] += VX[i]*h; Y[i] += VY[i]*h;
          const s = Math.sqrt(VX[i]*VX[i] + VY[i]*VY[i]), s2 = s - (FA + FK*s)*h;
          if(s2 <= 0.6){ VX[i] = 0; VY[i] = 0; } else { const q = s2/s; VX[i] *= q; VY[i] *= q; }
        }
        // bola × bola
        for(let i=0;i<n;i++){
          if(!on[i]) continue;
          for(let j=i+1;j<n;j++){
            if(!on[j]) continue;
            if(VX[i] === 0 && VY[i] === 0 && VX[j] === 0 && VY[j] === 0) continue;
            const dx = X[j] - X[i]; if(dx > R2 || dx < -R2) continue;
            const dy = Y[j] - Y[i]; if(dy > R2 || dy < -R2) continue;
            const d2 = dx*dx + dy*dy; if(d2 >= D2) continue;
            const d = Math.sqrt(d2) || 1e-6, nx = d2 ? dx/d : 1, ny = d2 ? dy/d : 0;
            const ov = (R2 - d)/2; X[i] -= nx*ov; Y[i] -= ny*ov; X[j] += nx*ov; Y[j] += ny*ov;
            const vr = (VX[i] - VX[j])*nx + (VY[i] - VY[j])*ny;
            if(vr <= 0) continue;
            let cs = 0;
            if(i === 0 && first < 0){ first = j; cs = Math.sqrt(VX[0]*VX[0] + VY[0]*VY[0]); }
            const J = vr*(1 + EB)/2;
            VX[i] -= J*nx; VY[i] -= J*ny; VX[j] += J*nx; VY[j] += J*ny;
            if(cs && spinOn){ VX[0] += spin*0.45*cs*ux; VY[0] += spin*0.45*cs*uy; spinOn = false; }
            hits++;
          }
        }
        // tabelas e caçapas
        for(let i=0;i<n;i++){
          if(!on[i]) continue;
          const x0 = X[i], y0 = Y[i];
          if(x0 > R + 0.5 && x0 < W - R - 0.5 && y0 > R + 0.5 && y0 < H - R - 0.5) continue;
          for(let s=0;s<SEG.length;s++){
            const g = SEG[s], ex = g[2] - g[0], ey = g[3] - g[1];
            let t = ((X[i] - g[0])*ex + (Y[i] - g[1])*ey)/(ex*ex + ey*ey); t = t < 0 ? 0 : t > 1 ? 1 : t;
            const qx = X[i] - (g[0] + ex*t), qy = Y[i] - (g[1] + ey*t), q2 = qx*qx + qy*qy;
            if(q2 >= R*R) continue;
            const q = Math.sqrt(q2) || 1e-6, nx = qx/q, ny = qy/q;
            X[i] += nx*(R - q); Y[i] += ny*(R - q);
            const vn = VX[i]*nx + VY[i]*ny;
            if(vn < 0){
              VX[i] -= (1 + EC)*vn*nx; VY[i] -= (1 + EC)*vn*ny;
              const vt = -VX[i]*ny + VY[i]*nx;
              VX[i] -= (1 - ET)*vt*-ny; VY[i] -= (1 - ET)*vt*nx;
              if(first >= 0) cush++;
            }
          }
          if(X[i] < -R*0.8 || X[i] > W + R*0.8 || Y[i] < -R*0.8 || Y[i] > H + R*0.8){
            on[i] = 0; VX[i] = 0; VY[i] = 0; pots.push(i); pk[i] = K;
          }
        }
      }
    }
    const res = {first, pots, X, Y, on, hits, cush, frames:f};
    if(rec){
      snap();
      const tr = [];
      for(let i=0;i<n;i++){
        const a = trk[i]; let s0 = -1, e0 = -1;
        for(let k=1;k<K;k++) if(a[2*k] !== a[0] || a[2*k+1] !== a[1]){ s0 = k; break; }
        if(s0 < 0) continue;
        for(let k=K-2;k>=0;k--) if(a[2*k] !== a[2*K-2] || a[2*k+1] !== a[2*K-1]){ e0 = k; break; }
        const st = Math.max(0, s0 - 1), en = Math.min(K - 1, e0 + 1);
        tr.push({i, s:st, p:a.slice(2*st, 2*en + 2)});
      }
      res.tr = {K, tr, pk};
    }
    return res;
  }

  /* ---------- regras ---------- */
  // 8: lisas 1–7 (L), listradas 9–15 (R), preta 8. br: bolas 1 (vermelha) a 7 (preta), valor = número
  const FOOT = [W*0.75, H/2];
  const SPOT = [null,[W*0.75 + R2 + 0.4, H/2],[W*0.2, H/2 + H*0.17],[W*0.2, H/2 - H*0.17],[W*0.2, H/2],[W/2, H/2],[W*0.75, H/2],[W*0.91, H/2]];
  const ZONE = {any:W, brk:W*0.25, head:W*0.2};
  const grpOf = n => n < 8 ? 'L' : 'R';
  const GRP_BALLS = {L:[1,2,3,4,5,6,7], R:[9,10,11,12,13,14,15]};

  function newBalls(mode){
    const b = [{x:W*0.2, y:H/2, in:false}];
    if(mode === '8'){
      // triângulo: 8 no meio da 3ª fileira, cantos de trás um liso e um listrado
      const sol = shuf([1,2,3,4,5,6,7]), str = shuf([9,10,11,12,13,14,15]);
      const backL = sol.pop(), backR = str.pop();
      const rest = shuf(sol.concat(str));
      const order = [];
      for(let row=0; row<5; row++) for(let j=0; j<=row; j++){
        let n;
        if(row === 2 && j === 1) n = 8;
        else if(row === 4 && j === 0) n = Math.random() < 0.5 ? backL : backR;
        else if(row === 4 && j === 4) n = order.includes(backL) ? backR : backL;
        else n = null;
        order.push(n);
      }
      for(let k=0;k<order.length;k++) if(order[k] == null) order[k] = rest.pop();
      for(let k=0;k<order.length;k++) if(order[k] == null) order[k] = 0;
      let k = 0;
      for(let row=0; row<5; row++) for(let j=0; j<=row; j++){
        const n = order[k++];
        b[n] = {x:FOOT[0] + row*(R2*0.8661 + 0.02), y:FOOT[1] + (j - row/2)*(R2 + 0.03), in:false};
      }
    } else for(let n=1;n<=7;n++) b[n] = {x:SPOT[n][0], y:SPOT[n][1], in:false};
    return b;
  }
  function shuf(a){ for(let i=a.length-1;i>0;i--){ const j = Math.floor(Math.random()*(i+1)); [a[i],a[j]] = [a[j],a[i]]; } return a; }
  const objsOn = st => { const r = []; for(let n=1;n<st.b.length;n++) if(!st.b[n].in) r.push(n); return r; };

  function newState(mode, names){
    const st = {mode, b:newBalls(mode), turn:0, names, mao:true, zone:mode === '8' ? 'brk' : 'head',
      brk:mode === '8', grp:[null,null], score:[0,0], livre:false, shots:0, win:null, msg:'', last:null, no:0};
    return st;
  }
  // bolas que a branca pode tocar primeiro
  function legal(st){
    const on = objsOn(st);
    if(st.mode === '8'){
      if(st.brk) return on;
      const g = st.grp[st.turn];
      if(!g) return on.filter(n => n !== 8);
      const mine = on.filter(n => n !== 8 && grpOf(n) === g);
      return mine.length ? mine : [8];
    }
    if(!on.length) return [];
    return st.livre ? on : [on[0]];
  }
  const free = (st, x, y, skip) => { for(let n=0;n<st.b.length;n++){ if(n === skip) continue; const o = st.b[n]; if(!o.in && (o.x-x)*(o.x-x) + (o.y-y)*(o.y-y) < D2 + 0.01) return false; } return true; };
  function placeOk(st, x, y){
    if(!Number.isFinite(x) || !Number.isFinite(y)) return false;
    if(x < R || x > W - R || y < R || y > H - R) return false;
    if(x > (ZONE[st.zone] || W)) return false;
    return free(st, x, y, 0);
  }
  function respot(st, n){
    const s = n === 8 ? FOOT : SPOT[n];
    const tries = [0];
    for(let k=1;k<60;k++) tries.push(k*(R2 + 0.05), -k*(R2 + 0.05));
    for(const dx of tries){
      const x = s[0] + dx;
      if(x < R || x > W - R) continue;
      if(free(st, x, s[1], n)){ st.b[n] = {x, y:s[1], in:false}; return; }
    }
    st.b[n] = {x:s[0], y:s[1], in:false};
  }
  const maxGain = on => on.length ? on.reduce((a,n) => a + n, 0) + (on.length - 1)*on[on.length - 1] : 0;
  const BR_NAME = ['branca','vermelha','amarela','verde','marrom','azul','rosa','preta'];
  const ballName = (st, n) => st.mode === '8' ? (n === 8 ? 'a 8' : 'a ' + n) : 'a ' + BR_NAME[n];

  // valida a jogada; devolve mensagem de erro ou ''
  function check(st, a){
    if(!a || typeof a !== 'object') return 'Jogada inválida.';
    if(!Number.isFinite(a.a) || !Number.isFinite(a.p) || a.p < 0.03 || a.p > 1) return 'Força inválida.';
    if(a.s != null && (!Number.isFinite(a.s) || a.s < -1 || a.s > 1)) return 'Efeito inválido.';
    if(st.mao && !placeOk(st, a.x, a.y)) return st.zone === 'any' ? 'Posição inválida para a branca.' : 'A branca precisa ficar atrás da linha da cabeceira, sem encostar em outra bola.';
    return '';
  }
  // aplica a tacada (já validada) no estado; rec = guardar trajetória
  function resolve(st, seat, a, rec){
    const opp = 1 - seat, nm = st.names ? st.names[seat] : '', on0 = objsOn(st), leg = legal(st);
    if(st.mao) st.b[0] = {x:a.x, y:a.y, in:false};
    const cue = {x:st.b[0].x, y:st.b[0].y}, sp = a.p*VMAX;
    const r = sim(st.b, sp*Math.cos(a.a), sp*Math.sin(a.a), a.s || 0, rec);
    for(let n=0;n<st.b.length;n++){ const o = st.b[n]; if(!o.in){ o.x = r.X[n]; o.y = r.Y[n]; if(!r.on[n]) o.in = true; } }
    st.shots++;
    const cueIn = r.pots.includes(0), pots = r.pots.filter(n => n !== 0);
    let foul = '', cont = false, ban = null, msg = '';
    if(st.mode === '8'){
      const brk = st.brk, onEight = leg.length === 1 && leg[0] === 8;
      st.brk = false;
      if(cueIn) foul = 'a branca caiu';
      else if(r.first < 0) foul = 'não tocou em nenhuma bola';
      else if(!brk && !leg.includes(r.first)) foul = r.first === 8 ? 'tocou primeiro na 8' : 'tocou primeiro numa bola do adversário';
      if(pots.includes(8)){
        if(brk){ respot(st, 8); pots.splice(pots.indexOf(8), 1); msg = 'A 8 caiu na saída e voltou para a marca.'; }
        else {
          if(onEight && !foul){ st.win = seat; msg = `${nm} encaçapou a 8 e venceu!`; ban = {text:'🎱 Bola 8!'}; }
          else { st.win = opp; msg = `${nm} encaçapou a 8 ${foul ? 'com falta (' + foul + ')' : 'antes da hora'} e perdeu.`; ban = {text:'A 8 caiu antes da hora!', bad:true}; }
          return fin(st, seat, a, r, cue, {foul, msg, ban, cueIn});
        }
      }
      if(!foul && !brk && !st.grp[seat] && pots.length){
        const g = grpOf(pots[0]); st.grp[seat] = g; st.grp[opp] = g === 'L' ? 'R' : 'L';
        msg = `${nm} fica com as ${g === 'L' ? 'lisas' : 'listradas'}.`;
      }
      if(!foul) cont = brk ? pots.length > 0 : !!st.grp[seat] && pots.some(n => grpOf(n) === st.grp[seat]);
      if(foul){ st.mao = true; st.zone = 'any'; if(cueIn) st.b[0].in = true; msg = `Falta de ${nm}: ${foul}. Bola na mão para ${st.names ? st.names[opp] : ''}.`; ban = {text:'Falta!', bad:true}; }
      else st.mao = false;
      if(!foul && pots.length && !ban) ban = {text: pots.length > 1 ? `${pots.length} bolas!` : 'Caiu!'};
      if(st.shots >= 400 && st.win == null){ st.win = -1; msg = 'Limite de tacadas: empate.'; }
    } else {
      const T = on0[0], livre = st.livre;
      if(cueIn) foul = 'a branca caiu';
      else if(r.first < 0) foul = 'não tocou em nenhuma bola';
      else if(!livre && r.first !== T) foul = `tocou primeiro ${ballName(st, r.first)} (a bola da vez era ${ballName(st, T)})`;
      else if(!livre && pots.some(n => n !== T)) foul = 'encaçapou bola que não era a da vez';
      if(foul){
        const pen = Math.max(4, T, r.first > 0 ? r.first : 0, ...pots);
        st.score[opp] += pen;
        pots.forEach(n => respot(st, n));
        st.livre = false;
        if(cueIn){ st.b[0].in = true; st.mao = true; st.zone = 'head'; } else st.mao = false;
        msg = `Falta de ${nm}: ${foul}. +${pen} para ${st.names ? st.names[opp] : ''}.`; ban = {text:`Falta! +${pen}`, bad:true};
      } else {
        st.mao = false;
        if(pots.length){
          const pts = pots.reduce((s,n) => s + n, 0);
          st.score[seat] += pts; cont = true;
          if(livre) pots.forEach(n => { if(n !== T) respot(st, n); });
          const left = objsOn(st).length;
          st.livre = left > 0 && pots.includes(T);
          msg = `${nm} fez ${pts} ponto${pts > 1 ? 's' : ''}${st.livre ? ' — bola livre!' : '.'}`;
          ban = {text:`+${pts}`};
        } else st.livre = false;
      }
      const left = objsOn(st);
      const d = st.score[0] - st.score[1];
      if(!left.length){ st.win = d > 0 ? 0 : d < 0 ? 1 : -1; msg = (msg ? msg + ' ' : '') + 'Mesa limpa!'; }
      else if(Math.abs(d) > maxGain(left)){ st.win = d > 0 ? 0 : 1; msg = (msg ? msg + ' ' : '') + 'Não há mais pontos suficientes na mesa para virar.'; }
      else if(st.shots >= 300){ st.win = d > 0 ? 0 : d < 0 ? 1 : -1; msg = 'Limite de tacadas.'; }
    }
    return fin(st, seat, a, r, cue, {foul, msg, ban, cueIn, cont});
  }
  function fin(st, seat, a, r, cue, o){
    if(st.win == null) st.turn = o.cont ? seat : 1 - seat;
    st.msg = o.msg;
    st.no++;
    st.last = {no:st.no, seat, cue, a:a.a, p:a.p, tr:r.tr || null, ban:o.ban, foul:o.foul};
    return o;
  }

  /* ---------- bot ---------- */
  const LV = {
    facil:  {sd:0.011, psd:0.07, ms:140, spins:[0], rob:false, pick:3},
    normal: {sd:0.0035, psd:0.03, ms:350, spins:[0,-0.6], rob:true, pick:1},
    dificil:{sd:0.0010, psd:0.012, ms:750, spins:[0,0.6,-0.6], rob:true, pick:1}
  };
  let BUDGET = 1;   // escala do tempo (testes)
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  function distOf(v){ if(v <= 0) return 0; const t = Math.log(1 + FK*v/FA)/FK; return (v - FA*t)/FK; }
  function speedFor(d){ let lo = 0, hi = 4000; for(let k=0;k<40;k++){ const m = (lo + hi)/2; if(distOf(m) < d) lo = m; else hi = m; } return hi; }
  function segClear(st, ax, ay, bx, by, s1, s2, rad){
    const ex = bx - ax, ey = by - ay, L2 = ex*ex + ey*ey || 1e-9, r2 = rad*rad;
    for(let n=0;n<st.b.length;n++){
      if(n === s1 || n === s2) continue; const o = st.b[n]; if(o.in) continue;
      let t = ((o.x - ax)*ex + (o.y - ay)*ey)/L2; t = t < 0 ? 0 : t > 1 ? 1 : t;
      const qx = o.x - ax - ex*t, qy = o.y - ay - ey*t;
      if(qx*qx + qy*qy < r2) return false;
    }
    return true;
  }
  function tipsClear(pk, bx, by, px, py){
    const ex = px - bx, ey = py - by, L2 = ex*ex + ey*ey;
    for(const [tx,ty] of pk.tips){
      let t = ((tx - bx)*ex + (ty - by)*ey)/L2; t = t < 0 ? 0 : t > 1 ? 1 : t;
      const qx = tx - bx - ex*t, qy = ty - by - ey*t;
      if(qx*qx + qy*qy < R*R*1.06) return false;
    }
    return true;
  }
  // tacadas diretas para caçapa a partir da branca em (cx,cy)
  function potShots(st, cx, cy, leg, out, place){
    for(const T of leg){
      const B = st.b[T];
      for(const pk of POCKETS){
        let bestA = null;
        for(const [px,py] of pk.aims){
          const dx = px - B.x, dy = py - B.y, d2 = Math.hypot(dx, dy); if(d2 < 0.1) continue;
          const ux = dx/d2, uy = dy/d2;
          if(pk.side ? ux*pk.nx + uy*pk.ny < 0.42 : ux*pk.nx + uy*pk.ny < 0.35) continue;
          const gx = B.x - ux*R2, gy = B.y - uy*R2;
          const vx = gx - cx, vy = gy - cy, d1 = Math.hypot(vx, vy); if(d1 < 0.5) continue;
          const cs = (vx*ux + vy*uy)/d1; if(cs < 0.2) continue;
          if(!tipsClear(pk, B.x, B.y, px, py)) continue;
          if(!segClear(st, cx, cy, gx, gy, 0, T, R2 - 0.05)) continue;
          if(!segClear(st, B.x, B.y, px, py, T, 0, R2 - 0.05)) continue;
          const ease = Math.pow(cs, 1.6)*Math.exp(-(d1*0.45 + d2)/240)*(pk.side ? 0.85 : 1);
          if(!bestA || ease > bestA.ease){
            const vo = speedFor(d2 + 18), vc = vo/(cs*(1 + EB)/2), vs = speedFor(d1 + distOf(vc));
            bestA = {a:Math.atan2(vy, vx), p:Math.min(1, Math.max(0.06, vs/VMAX)), ease, T};
          }
        }
        if(bestA){ if(place){ bestA.x = cx; bestA.y = cy; } out.push(bestA); }
      }
    }
    return out;
  }
  // qualidade da melhor tacada de quem joga agora (0..1)
  function bestEase(st){
    if(st.win != null) return 0;
    if(st.mao) return st.zone === 'any' ? 0.85 : 0.5;
    const c = potShots(st, st.b[0].x, st.b[0].y, legal(st), [], false);
    let m = 0; for(const x of c) if(x.ease > m) m = x.ease;
    return m;
  }
  function clone(st){ return Object.assign({}, st, {b:st.b.map(o => ({x:o.x, y:o.y, in:o.in})), grp:st.grp.slice(), score:st.score.slice(), names:null, last:null}); }
  const gone = (st, g) => g ? GRP_BALLS[g].filter(n => st.b[n].in).length : 0;
  function value(st0, seat, act){
    const s = clone(st0); resolve(s, seat, act, false);
    if(s.win != null) return s.win === seat ? 1e5 : s.win < 0 ? 0 : -1e5;
    let v = 0;
    if(s.mode === 'br') v += 45*((s.score[seat] - st0.score[seat]) - (s.score[1-seat] - st0.score[1-seat]));
    else {
      const gm = s.grp[seat], go = s.grp[1-seat];
      v += 40*(gone(s, gm) - gone(st0, gm)) - 18*(gone(s, go) - gone(st0, go));
    }
    if(s.turn === seat) v += 140 + 320*bestEase(s);
    else v -= 320*bestEase(s) + (s.mao ? 120 : 0);
    return v;
  }
  function gauss(){ let u = 0, w = 0; while(!u) u = Math.random(); while(!w) w = Math.random(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*w); }
  // posições para a bola na mão: atrás da bola-alvo, na linha da caçapa (com pequenos cortes)
  function placements(st, leg){
    const out = [];
    for(const T of leg){
      const B = st.b[T];
      for(const pk of POCKETS){
        const [px,py] = pk.aims[0], dx = px - B.x, dy = py - B.y, d = Math.hypot(dx, dy), ux = dx/d, uy = dy/d;
        const gx = B.x - ux*R2, gy = B.y - uy*R2;
        for(const D of [14, 30, 55]) for(const ang of [0, 0.28, -0.28]){
          const c = Math.cos(ang), s = Math.sin(ang), wx = ux*c - uy*s, wy = ux*s + uy*c;
          const x = gx - wx*D, y = gy - wy*D;
          if(placeOk(st, x, y)) out.push([x, y]);
        }
      }
    }
    if(out.length < 4){
      for(let k=0;k<60 && out.length < 12;k++){
        const x = R + Math.random()*((ZONE[st.zone] || W) - 2*R), y = R + Math.random()*(H - 2*R);
        if(placeOk(st, x, y)) out.push([x, y]);
      }
    }
    return out;
  }
  function bot(st, seat, lvl){
    const L = LV[lvl] || LV.normal, t0 = now(), budget = L.ms*BUDGET;
    const leg = legal(st);
    // saída da bola 8: força máxima na bola da frente
    if(st.mode === '8' && st.brk){
      let x = W*0.2, y = H/2 + (Math.random() - 0.5)*24;
      if(!placeOk(st, x, y)){ x = W*0.2; y = H/2; }
      let ap = 1; for(let n=1;n<st.b.length;n++) if(st.b[n].x < st.b[ap].x) ap = n;
      return {a:Math.atan2(st.b[ap].y - y, st.b[ap].x - x) + gauss()*0.004, p:lvl === 'facil' ? 0.85 : 0.97, s:0, x, y};
    }
    const cands = [];
    if(st.mao){ for(const [x,y] of placements(st, leg)) potShots(st, x, y, leg, cands, true); }
    else potShots(st, st.b[0].x, st.b[0].y, leg, cands, false);
    cands.sort((p,q) => q.ease - p.ease);
    const scored = [];
    const evalAct = act => {
      if(!L.rob) return value(st, seat, act);
      const d = Math.max(L.sd*1.5, 0.0018);
      return 0.5*value(st, seat, act) + 0.25*value(st, seat, Object.assign({}, act, {a:act.a + d})) + 0.25*value(st, seat, Object.assign({}, act, {a:act.a - d}));
    };
    const tryAct = act => { if(check(st, act)) return; scored.push({act, v:evalAct(act)}); };
    for(const c of cands.slice(0, 18)){
      if(now() - t0 > budget*0.75) break;
      for(const m of [1, 1.4, 1.9]) for(const s of L.spins){
        const act = {a:c.a, p:Math.min(1, Math.max(0.06, c.p*m + (m > 1 ? 0.04 : 0))), s};
        if(st.mao){ act.x = c.x; act.y = c.y; }
        tryAct(act);
      }
    }
    // sem boa tacada: defesa (tocar numa bola própria e deixar o adversário sem jogada)
    let best = scored.reduce((m,x) => !m || x.v > m.v ? x : m, null);
    if(!best || best.v < 180){
      let cx = st.b[0].x, cy = st.b[0].y;
      if(st.mao){ const pl = placements(st, leg); [cx, cy] = pl.length ? pl[0] : [W*0.15, H/2]; }
      const safe = [];
      for(const T of leg){
        const B = st.b[T], dx = B.x - cx, dy = B.y - cy, d = Math.hypot(dx, dy) || 1, px = -dy/d, py = dx/d;
        for(const off of [0, 1.2, -1.2, 2.2, -2.2]) for(const p of [0.14, 0.24, 0.38]){
          const act = {a:Math.atan2(B.y + py*off - cy, B.x + px*off - cx), p, s:0};
          if(st.mao){ act.x = cx; act.y = cy; }
          safe.push(act);
        }
      }
      for(const act of shuf(safe)){
        if(now() - t0 > budget && scored.length) break;
        if(!check(st, act)) scored.push({act, v:value(st, seat, act)});
      }
      best = scored.reduce((m,x) => !m || x.v > m.v ? x : m, null);
    }
    if(!best) return fallback(st);
    if(L.pick > 1){
      const top = scored.filter(x => x.v >= best.v - 90).sort((p,q) => q.v - p.v).slice(0, L.pick);
      best = top[Math.floor(Math.random()*top.length)] || best;
    }
    const act = Object.assign({}, best.act);
    act.a += gauss()*L.sd;
    act.p = Math.min(1, Math.max(0.05, act.p*(1 + gauss()*L.psd)));
    return act;
  }
  function fallback(st){
    const leg = legal(st);
    let x = st.b[0].x, y = st.b[0].y;
    if(st.mao){
      const lim = ZONE[st.zone] || W; let ok = false;
      for(let k=0;k<400 && !ok;k++){ x = R + Math.random()*(lim - 2*R); y = R + Math.random()*(H - 2*R); ok = placeOk(st, x, y); }
    }
    const T = st.b[leg[0] || 1] || {x:W/2, y:H/2};
    const act = {a:Math.atan2(T.y - y, T.x - x), p:0.45, s:0};
    if(st.mao){ act.x = x; act.y = y; }
    return act;
  }

  return { W, H, R, RAIL, KFPS, VMAX, SEG, POCKETS, SPOT, FOOT, ZONE, CC, SS, BR_NAME,
    sim, newState, legal, check, resolve, placeOk, objsOn, grpOf, bot, fallback, value, potShots,
    setBudget(k){ BUDGET = k; } };
})();
