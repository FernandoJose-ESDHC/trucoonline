/* =====================================================================
   Futebol de Botão — motor de física (passo fixo, determinístico),
   regras e bot. Campo 1000 × 640 (unidades livres), gol de 160 de boca.
   Corpo 0 = bola; depois os botões do time 0 (goleiro primeiro, defende
   o gol da esquerda) e os do time 1 (defende o da direita).
   O anfitrião simula a jogada inteira e guarda o resultado + trajetória
   compacta (quadros-chave a 40 fps) para todos animarem igual.
   ===================================================================== */
"use strict";
const BT = (() => {
  const L = 1000, WD = 640, GW = 80, GD = 46, gy0 = WD/2 - GW, gy1 = WD/2 + GW;
  const AREA_X = 130, AREA_Y0 = gy0 - 70, AREA_Y1 = gy1 + 70;   // pequena área (onde o goleiro pode andar)
  const DT = 1/120, KF = 3, KFPS = 40, MAXF = 120*20;
  const VMAX = 1500, RB = 12;
  const FR = {ball:[110, 0.55], btn:[230, 1.15]};
  const E_BB = 0.82, E_BALL = 0.88, E_WB = 0.72, E_WP = 0.5;

  // paredes: a bola entra nos gols; os botões não passam da linha do gol
  const SEG_B = [], SEG_P = [];
  for(const [gx, s] of [[0, -1], [L, 1]]){
    SEG_B.push([gx, 0, gx, gy0], [gx, gy1, gx, WD], [gx, gy0, gx + s*GD, gy0], [gx + s*GD, gy0, gx + s*GD, gy1], [gx + s*GD, gy1, gx, gy1]);
    SEG_P.push([gx, 0, gx, WD]);
  }
  SEG_B.push([0, 0, L, 0], [0, WD, L, WD]);
  SEG_P.push([0, 0, L, 0], [0, WD, L, WD]);

  /* ---------- formações (time 0, campo da esquerda; o time 1 é espelhado) ---------- */
  const FORM = {
    5:  [[0.045,0.5],[0.2,0.28],[0.2,0.72],[0.37,0.36],[0.37,0.64]],
    11: [[0.04,0.5],[0.15,0.14],[0.15,0.38],[0.15,0.62],[0.15,0.86],[0.29,0.14],[0.29,0.38],[0.29,0.62],[0.29,0.86],[0.41,0.38],[0.41,0.62]]
  };
  const radius = n => n === 11 ? 22 : 29;
  // propriedades por corpo
  function props(n){
    const N = 1 + 2*n, P = {N, n, r:new Float64Array(N), m:new Float64Array(N), gk:new Int8Array(N).fill(-1), team:new Int8Array(N).fill(-1)};
    P.r[0] = RB; P.m[0] = 1;
    for(let t=0;t<2;t++) for(let k=0;k<n;k++){
      const i = 1 + t*n + k;
      P.team[i] = t; P.r[i] = radius(n) + (k === 0 ? 9 : 0); P.m[i] = k === 0 ? 4 : 3;
      if(k === 0) P.gk[i] = t;
    }
    return P;
  }
  const PROPS = {5:props(5), 11:props(11)};
  function kickoff(n, kick){
    const r = radius(n), b = [{x:L/2, y:WD/2}];
    for(let t=0;t<2;t++) FORM[n].forEach(([fx,fy], k) => b.push({x: t ? L - fx*L : fx*L, y:fy*WD}));
    // quem dá a saída põe um atacante encostado atrás da bola
    const i = kick*n + n;    // último botão do time (atacante)
    b[i] = {x: kick ? L/2 + RB + r + 3 : L/2 - RB - r - 3, y:WD/2};
    return b;
  }

  /* ---------- simulação ---------- */
  const r0 = v => Math.round(v);
  function sim(P, B, si, vx0, vy0, rec){
    const N = P.N, X = new Float64Array(N), Y = new Float64Array(N), VX = new Float64Array(N), VY = new Float64Array(N);
    for(let i=0;i<N;i++){ X[i] = B[i].x; Y[i] = B[i].y; }
    VX[si] = vx0; VY[si] = vy0;
    let touch = false, goal = -1, K = 0, f = 0, hits = 0;
    const trk = rec ? Array.from({length:N}, () => []) : null;
    const snap = () => { for(let i=0;i<N;i++) trk[i].push(r0(X[i]), r0(Y[i])); K++; };
    const hitFrames = [];
    for(; f<MAXF && goal < 0; f++){
      if(rec && f % KF === 0) snap();
      let vm = 0;
      for(let i=0;i<N;i++){ const s = VX[i]*VX[i] + VY[i]*VY[i]; if(s > vm) vm = s; }
      if(vm === 0) break;
      const ns = Math.min(16, Math.max(1, Math.ceil(Math.sqrt(vm)*DT/(RB*0.5)))), h = DT/ns;
      for(let k=0;k<ns && goal < 0;k++){
        for(let i=0;i<N;i++){
          if(VX[i] === 0 && VY[i] === 0) continue;
          X[i] += VX[i]*h; Y[i] += VY[i]*h;
          const fr = i ? FR.btn : FR.ball, s = Math.sqrt(VX[i]*VX[i] + VY[i]*VY[i]), s2 = s - (fr[0] + fr[1]*s)*h;
          if(s2 <= 2){ VX[i] = 0; VY[i] = 0; } else { const q = s2/s; VX[i] *= q; VY[i] *= q; }
        }
        // corpo × corpo
        for(let i=0;i<N;i++) for(let j=i+1;j<N;j++){
          if(VX[i] === 0 && VY[i] === 0 && VX[j] === 0 && VY[j] === 0) continue;
          const rr = P.r[i] + P.r[j], dx = X[j] - X[i]; if(dx > rr || dx < -rr) continue;
          const dy = Y[j] - Y[i]; if(dy > rr || dy < -rr) continue;
          const d2 = dx*dx + dy*dy; if(d2 >= rr*rr) continue;
          const d = Math.sqrt(d2) || 1e-6, nx = d2 ? dx/d : 1, ny = d2 ? dy/d : 0;
          const mi = P.m[i], mj = P.m[j], ov = rr - d;
          X[i] -= nx*ov*mj/(mi + mj); Y[i] -= ny*ov*mj/(mi + mj); X[j] += nx*ov*mi/(mi + mj); Y[j] += ny*ov*mi/(mi + mj);
          const vr = (VX[i] - VX[j])*nx + (VY[i] - VY[j])*ny;
          if(vr <= 0) continue;
          const e = i === 0 ? E_BALL : E_BB, J = (1 + e)*vr/(1/mi + 1/mj);
          VX[i] -= J*nx/mi; VY[i] -= J*ny/mi; VX[j] += J*nx/mj; VY[j] += J*ny/mj;
          if(i === 0 && j === si) touch = true;
          if(rec && hitFrames.length < 40 && vr > 120) hitFrames.push(K);
          hits++;
        }
        // paredes, goleiro preso na área, gol
        for(let i=0;i<N;i++){
          const r = P.r[i];
          if(X[i] > r + 1 && X[i] < L - r - 1 && Y[i] > r + 1 && Y[i] < WD - r - 1 && P.gk[i] < 0) continue;
          const segs = i ? SEG_P : SEG_B, e = i ? E_WP : E_WB;
          for(let s=0;s<segs.length;s++){
            const g = segs[s], ex = g[2] - g[0], ey = g[3] - g[1];
            let t = ((X[i] - g[0])*ex + (Y[i] - g[1])*ey)/(ex*ex + ey*ey); t = t < 0 ? 0 : t > 1 ? 1 : t;
            const qx = X[i] - (g[0] + ex*t), qy = Y[i] - (g[1] + ey*t), q2 = qx*qx + qy*qy;
            if(q2 >= r*r) continue;
            const q = Math.sqrt(q2) || 1e-6, nx = qx/q, ny = qy/q;
            X[i] += nx*(r - q); Y[i] += ny*(r - q);
            const vn = VX[i]*nx + VY[i]*ny;
            if(vn < 0){ VX[i] -= (1 + e)*vn*nx; VY[i] -= (1 + e)*vn*ny; }
          }
          if(P.gk[i] >= 0){
            const x0 = P.gk[i] ? L - AREA_X : 0, x1 = P.gk[i] ? L : AREA_X;
            if(X[i] < x0 + r){ X[i] = x0 + r; if(VX[i] < 0) VX[i] = -VX[i]*0.4; }
            if(X[i] > x1 - r){ X[i] = x1 - r; if(VX[i] > 0) VX[i] = -VX[i]*0.4; }
            if(Y[i] < AREA_Y0 + r){ Y[i] = AREA_Y0 + r; if(VY[i] < 0) VY[i] = -VY[i]*0.4; }
            if(Y[i] > AREA_Y1 - r){ Y[i] = AREA_Y1 - r; if(VY[i] > 0) VY[i] = -VY[i]*0.4; }
          }
        }
        if(X[0] < -RB) goal = 1; else if(X[0] > L + RB) goal = 0;
      }
    }
    const res = {X, Y, touch, goal, hits};
    if(rec){
      snap();
      const tr = [];
      for(let i=0;i<N;i++){
        const a = trk[i]; let s0 = -1, e0 = -1;
        for(let k=1;k<K;k++) if(a[2*k] !== a[0] || a[2*k+1] !== a[1]){ s0 = k; break; }
        if(s0 < 0) continue;
        for(let k=K-2;k>=0;k--) if(a[2*k] !== a[2*K-2] || a[2*k+1] !== a[2*K-1]){ e0 = k; break; }
        const st = Math.max(0, s0 - 1), en = Math.min(K - 1, e0 + 1);
        tr.push({i, s:st, p:a.slice(2*st, 2*en + 2)});
      }
      res.tr = {K, tr, hf:hitFrames};
    }
    return res;
  }

  /* ---------- regras ---------- */
  // ns = botões por time; maxT = toques por vez; alvo = gols para vencer (0 = por tempo); seats = 2 ou 4
  function newState(o){
    const st = {n:o.n, bd:kickoff(o.n, 0), sc:[0,0], turn:0, tq:0, maxT:o.maxT, alvo:o.alvo, fim:o.fim || 0, timeUp:false,
      seats:o.seats, rot:[0,1], shots:0, win:null, msg:'', last:null, no:0, names:o.names || null, kick:0};
    return st;
  }
  const P_ = st => PROPS[st.n];
  const teamOfSeat = (st, seat) => st.seats === 4 ? seat % 2 : seat;
  const seatNow = st => st.seats === 4 ? st.turn + 2*st.rot[st.turn] : st.turn;
  function check(st, seat, a){
    if(!a || typeof a !== 'object') return 'Jogada inválida.';
    const P = P_(st), i = a.i;
    if(!Number.isInteger(i) || i < 1 || i >= P.N || P.team[i] !== st.turn) return 'Escolha um botão do seu time.';
    if(teamOfSeat(st, seat) !== st.turn) return 'Não é a sua vez.';
    if(!Number.isFinite(a.a) || !Number.isFinite(a.p) || a.p < 0.02 || a.p > 1) return 'Força inválida.';
    return '';
  }
  function passTurn(st){
    st.turn = 1 - st.turn; st.tq = 0;
    if(st.seats === 4) st.rot[st.turn] = 1 - st.rot[st.turn];
  }
  // os goleiros se ajeitam entre a bola e o centro do próprio gol (como no botão de mesa)
  function placeKeepers(st){
    const P = P_(st), B = st.bd[0];
    for(let t=0;t<2;t++){
      const g = 1 + t*st.n, r = P.r[g], gx = t ? L : 0, cy = WD/2;
      const dx = B.x - gx, dy = B.y - cy, d = Math.hypot(dx, dy) || 1;
      const k = Math.min(r + 10, Math.max(0, d - RB - r - 6));
      let x = gx + dx/d*k, y = cy + dy/d*k;
      x = clampN(x, t ? L - AREA_X + r : r, t ? L - r : AREA_X - r); y = clampN(y, AREA_Y0 + r, AREA_Y1 - r);
      let ok = true;
      for(let i=0;i<P.N;i++) if(i !== g){ const rr = P.r[i] + r + 1; if(d2(st.bd[i], {x, y}) < rr*rr){ ok = false; break; } }
      if(ok) st.bd[g] = {x, y};
    }
  }
  function resolve(st, a, rec){
    const P = P_(st), team = st.turn, sp = a.p*VMAX;
    const r = sim(P, st.bd, a.i, sp*Math.cos(a.a), sp*Math.sin(a.a), rec);
    const prev = st.bd;
    st.bd = prev.map((o, i) => ({x:r.X[i], y:r.Y[i]}));
    st.shots++;
    let ban = null, msg = '';
    if(r.goal >= 0){
      st.sc[r.goal]++;
      const nm = st.names ? st.names[r.goal] : '';
      msg = r.goal === team ? `Gol! ${st.sc[0]} × ${st.sc[1]}` : `Gol contra! ${st.sc[0]} × ${st.sc[1]}`;
      ban = {text:'⚽ GOOOL!', team:r.goal, nm};
      if(st.alvo && st.sc[r.goal] >= st.alvo) st.win = r.goal;
      // saída de bola para quem sofreu
      st.endBd = st.bd;
      st.bd = kickoff(st.n, 1 - r.goal);
      st.turn = r.goal; passTurn(st);   // vez do time que sofreu
      st.kick = st.turn;
    } else if(r.touch){
      placeKeepers(st);
      st.tq++;
      if(st.tq >= st.maxT){ passTurn(st); msg = st.maxT > 1 ? 'Acabaram os toques: vez do adversário.' : ''; }
      else msg = `Tocou na bola: mais ${st.maxT - st.tq} toque${st.maxT - st.tq > 1 ? 's' : ''}.`;
      st.endBd = null;
    } else { passTurn(st); placeKeepers(st); msg = 'Não acertou a bola: vez do adversário.'; st.endBd = null; }
    if(st.win == null && st.shots >= 500) st.win = st.sc[0] > st.sc[1] ? 0 : st.sc[1] > st.sc[0] ? 1 : -1;
    st.msg = msg; st.no++;
    st.last = {no:st.no, team, i:a.i, a:a.a, p:a.p, tr:r.tr || null, ban, goal:r.goal, touch:r.touch};
    return r;
  }

  /* ---------- bot ---------- */
  const LV = {
    facil:  {sd:0.035, psd:0.12, ms:120, rob:false, pick:3, maxB:3},
    normal: {sd:0.012, psd:0.06, ms:300, rob:true, pick:1, maxB:6},
    dificil:{sd:0.004, psd:0.025, ms:650, rob:true, pick:1, maxB:11}
  };
  let BUDGET = 1;
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const distOf = (v, fr) => { if(v <= 0) return 0; const t = Math.log(1 + fr[1]*v/fr[0])/fr[1]; return (v - fr[0]*t)/fr[1]; };
  function speedFor(d, fr){ let lo = 0, hi = 6000; for(let k=0;k<36;k++){ const m = (lo + hi)/2; if(distOf(m, fr) < d) lo = m; else hi = m; } return hi; }
  function segClear(st, P, ax, ay, bx, by, s1, s2, rad){
    const ex = bx - ax, ey = by - ay, L2 = ex*ex + ey*ey || 1e-9;
    for(let i=0;i<P.N;i++){
      if(i === s1 || i === s2) continue; const o = st.bd[i];
      let t = ((o.x - ax)*ex + (o.y - ay)*ey)/L2; t = t < 0 ? 0 : t > 1 ? 1 : t;
      const qx = o.x - ax - ex*t, qy = o.y - ay - ey*t, rr = rad + P.r[i];
      if(qx*qx + qy*qy < rr*rr) return false;
    }
    return true;
  }
  const goalX = team => team ? 0 : L;           // gol que o time ataca
  const GOAL_AIMS = [gy0 + RB + 14, WD/2, gy1 - RB - 14];
  // chutes possíveis (botão → bola → alvo); kind 'g' = gol
  function shots(st, team, out, lim){
    const P = P_(st), B = st.bd[0], gx = goalX(team), dir = team ? -1 : 1;
    const targets = GOAL_AIMS.map(y => ({x:gx + dir*20, y, g:true}));
    targets.push({x:gx - dir*L*0.25, y:WD*0.15}, {x:gx - dir*L*0.25, y:WD*0.85}, {x:gx - dir*L*0.12, y:WD/2},
      {x:B.x + dir*260, y:clampN(B.y - 180, 40, WD - 40)}, {x:B.x + dir*260, y:clampN(B.y + 180, 40, WD - 40)});
    const mine = [];
    for(let i=1;i<P.N;i++) if(P.team[i] === team) mine.push(i);
    mine.sort((p,q) => d2(st.bd[p], B) - d2(st.bd[q], B));
    for(const i of mine.slice(0, lim)){
      const o = st.bd[i], rr = P.r[i] + RB;
      for(const T of targets){
        const dx = T.x - B.x, dy = T.y - B.y, dd = Math.hypot(dx, dy); if(dd < 1) continue;
        const ux = dx/dd, uy = dy/dd, gx2 = B.x - ux*rr, gy2 = B.y - uy*rr;
        const vx = gx2 - o.x, vy = gy2 - o.y, d1 = Math.hypot(vx, vy); if(d1 < 1) continue;
        const cs = (vx*ux + vy*uy)/d1; if(cs < 0.3) continue;
        if(!segClear(st, P, o.x, o.y, gx2, gy2, i, 0, P.r[i] - 2)) continue;
        const clear2 = segClear(st, P, B.x, B.y, T.x, T.y, 0, i, RB);
        if(T.g && !clear2) continue;
        const k = cs*(1 + E_BALL)*P.m[i]/(P.m[i] + 1);
        const vb = speedFor(dd + (T.g ? 220 : 0), FR.ball), vB = vb/k, vs = speedFor(d1 + distOf(vB, FR.btn), FR.btn);
        const ease = Math.pow(cs, 1.5)*Math.exp(-(d1*0.6 + dd)/1100);
        out.push({i, a:Math.atan2(vy, vx), p:Math.min(1, Math.max(0.05, vs/VMAX)), ease, g:!!T.g, clear:clear2});
      }
    }
    return out;
  }
  const d2 = (a, b) => (a.x - b.x)*(a.x - b.x) + (a.y - b.y)*(a.y - b.y);
  const clampN = (x, a, b) => Math.max(a, Math.min(b, x));
  function threat(st, team){
    const c = shots(st, team, [], 6);
    let m = 0; for(const s of c) if(s.g && s.ease > m) m = s.ease;
    return m;
  }
  function clone(st){ return Object.assign({}, st, {bd:st.bd.map(o => ({x:o.x, y:o.y})), sc:st.sc.slice(), rot:st.rot.slice(), names:null, last:null, endBd:null}); }
  function value(st0, team, act){
    const s = clone(st0); const r = resolve(s, act, false);
    if(s.win != null) return s.win === team ? 1e6 : s.win < 0 ? 0 : -1e6;
    if(r.goal >= 0) return r.goal === team ? 1e5 : -1e5;
    const B = s.bd[0], prog = team ? 1 - B.x/L : B.x/L;
    let v = 500*prog;
    if(s.turn === team) v += 150 + 900*threat(s, team) + 60*(s.maxT - s.tq);
    else {
      v -= 1100*threat(s, 1 - team);
      // perto do próprio gol e com o adversário perto da bola: perigo
      const P = P_(s); let near = 1e9;
      for(let i=1;i<P.N;i++) if(P.team[i] !== team) near = Math.min(near, Math.sqrt(d2(s.bd[i], B)));
      if(prog < 0.3) v -= (0.3 - prog)*900*Math.exp(-near/250);
    }
    return v;
  }
  function gauss(){ let u = 0, w = 0; while(!u) u = Math.random(); while(!w) w = Math.random(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*w); }
  function bot(st, seat, lvl){
    const Lv = LV[lvl] || LV.normal, t0 = now(), budget = Lv.ms*BUDGET, team = st.turn;
    const P = P_(st), cands = shots(st, team, [], Lv.maxB);
    // chutão: direto no centro da bola com os mais próximos
    const mine = []; for(let i=1;i<P.N;i++) if(P.team[i] === team) mine.push(i);
    mine.sort((p,q) => d2(st.bd[p], st.bd[0]) - d2(st.bd[q], st.bd[0]));
    for(const i of mine.slice(0, 3)){
      const o = st.bd[i], a = Math.atan2(st.bd[0].y - o.y, st.bd[0].x - o.x);
      cands.push({i, a, p:0.55, ease:0.05}, {i, a, p:0.9, ease:0.04});
    }
    cands.sort((p,q) => q.ease - p.ease);
    const scored = [];
    const evalAct = act => {
      if(!Lv.rob) return value(st, team, act);
      const d = Math.max(Lv.sd*1.4, 0.006);
      return 0.5*value(st, team, act) + 0.25*value(st, team, Object.assign({}, act, {a:act.a + d})) + 0.25*value(st, team, Object.assign({}, act, {a:act.a - d}));
    };
    for(const c of cands){
      if(now() - t0 > budget && scored.length) break;
      const mults = c.g ? [1, 1.25, 1.6] : [0.8, 1, 1.3];
      for(const m of mults){
        const act = {i:c.i, a:c.a, p:Math.min(1, Math.max(0.04, c.p*m))};
        scored.push({act, v:evalAct(act)});
      }
    }
    if(!scored.length) return fallback(st);
    scored.sort((p,q) => q.v - p.v);
    let best = scored[0];
    if(Lv.pick > 1){ const top = scored.filter(x => x.v >= best.v - 150).slice(0, Lv.pick); best = top[Math.floor(Math.random()*top.length)]; }
    const act = Object.assign({}, best.act);
    act.a += gauss()*Lv.sd;
    act.p = Math.min(1, Math.max(0.04, act.p*(1 + gauss()*Lv.psd)));
    return act;
  }
  function fallback(st){
    const P = P_(st); let bi = -1, bd = 1e18;
    for(let i=1;i<P.N;i++) if(P.team[i] === st.turn){ const d = d2(st.bd[i], st.bd[0]); if(d < bd){ bd = d; bi = i; } }
    const o = st.bd[bi];
    return {i:bi, a:Math.atan2(st.bd[0].y - o.y, st.bd[0].x - o.x), p:0.6};
  }

  return { L, WD, GW, GD, gy0, gy1, AREA_X, AREA_Y0, AREA_Y1, RB, KFPS, VMAX, PROPS, FR,
    newState, check, resolve, bot, fallback, teamOfSeat, seatNow, sim, setBudget(k){ BUDGET = k; } };
})();
