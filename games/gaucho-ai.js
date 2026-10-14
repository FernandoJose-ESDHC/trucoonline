/* =====================================================================
   Truco Gaúcho — regras (motor da Mesa) e bots
   Baralho espanhol de 40 cartas (sem 8, 9 e 10): espadas, paus (bastos),
   copas e ouros. Envido, flor, truco/retruco/vale quatro, malas e boas.
   Tudo fica dentro de GA para não colidir com os nomes do core.js.
   ===================================================================== */
"use strict";
const GA = (() => {
  const SU = ['e','b','c','o'];                                   // espadas, bastos (paus), copas, ouros
  const SNAME = {e:'espadas', b:'paus', c:'copas', o:'ouros'};
  const RK = [1,2,3,4,5,6,7,10,11,12];
  const CARDS = [];
  SU.forEach((s,si) => RK.forEach((r,ri) => CARDS.push({r, s, id:'g' + (si*10 + ri)})));
  const ix = c => +String(c.id).slice(1);
  // hierarquia fixa: espadão > bastião > 7 espadas > 7 ouros > 3 > 2 > ás falso > rei > cavalo > valete > 7 falso > 6 > 5 > 4
  function powRS(r, s){
    if(r === 1 && s === 'e') return 14;
    if(r === 1 && s === 'b') return 13;
    if(r === 7 && s === 'e') return 12;
    if(r === 7 && s === 'o') return 11;
    return {3:10, 2:9, 1:8, 12:7, 11:6, 10:5, 7:4, 6:3, 5:2, 4:1}[r];
  }
  const POW = CARDS.map(c => powRS(c.r, c.s));
  const SUI = CARDS.map(c => SU.indexOf(c.s));
  const EVV = CARDS.map(c => c.r >= 10 ? 0 : c.r);               // figuras valem 0 no envido
  const MATA = {g0:'ESPADÃO', g10:'BASTIÃO', g6:'7 ESPADA', g36:'7 OURO'};
  const FIG = {10:'VALETE', 11:'CAVALO', 12:'REI'};
  const TV = [1,2,3,4];                                           // valor da mão por nível de truco
  const CALL = ['', 'Truco', 'Retruco', 'Vale quatro'];
  const EK = {E:'Envido', R:'Real envido', F:'Falta envido'};
  const EVAL = {E:2, R:3};
  const HAND_PAUSE = 2600;
  const team = s => s % 2;
  const rnd = Math.random;
  const clampN = (x,a,b) => Math.max(a, Math.min(b, x));
  const escH = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const cardName = c => (c.r === 1 ? 'Ás' : FIG[c.r] ? FIG[c.r][0] + FIG[c.r].slice(1).toLowerCase() : c.r) + ' de ' + SNAME[c.s];

  /* ---------------------------- pontos ---------------------------- */
  function envPts(a){                                             // a = índices das 3 cartas originais
    let best = -1;
    for(let i=0;i<a.length;i++) for(let j=i+1;j<a.length;j++)
      if(SUI[a[i]] === SUI[a[j]]) best = Math.max(best, 20 + EVV[a[i]] + EVV[a[j]]);
    if(best < 0) for(const x of a) best = Math.max(best, EVV[x]);
    return best;
  }
  const isFlor = a => a.length === 3 && SUI[a[0]] === SUI[a[1]] && SUI[a[1]] === SUI[a[2]];
  const florPts = a => 20 + EVV[a[0]] + EVV[a[1]] + EVV[a[2]];
  // falta envido: o que falta ao líder para fechar; se os dois estão nas malas, vale a partida
  function falta(st, wt){
    const lead = Math.max(st.score[0], st.score[1]);
    return lead < st.T/2 ? st.T - st.score[wt] : st.T - lead;
  }
  function envNext(chain){
    if(!chain.length) return ['E','R','F'];
    const last = chain[chain.length-1];
    if(last === 'F') return [];
    if(last === 'R') return ['F'];
    return chain.filter(k => k === 'E').length < 2 ? ['E','R','F'] : ['R','F'];
  }
  const envSum = ch => ch.reduce((s,k) => s + (EVAL[k] || 0), 0);
  const envAcc = (st, ch, wt) => ch.includes('F') ? falta(st, wt) : envSum(ch);
  const envRef = ch => ch.length === 1 ? 1 : envSum(ch.slice(0, -1));
  function chainLabel(st, ch){
    if(!ch.length) return '';
    const lead = Math.max(st.score[0], st.score[1]);
    return ch.map(k => EK[k]).join(' + ') + (ch.includes('F') ? (lead < st.T/2 ? ' (vale a partida)' : ` (vale ${st.T - lead})`) : ` (vale ${envSum(ch)})`);
  }

  /* -------------------------- vazas ------------------------------- */
  // resultado das vazas (-1 = parda). Primeira parda: decide a seguinte. Ganhou a 1ª e
  // empatou depois: vale a 1ª. Tudo empatado: ganha o time do mão.
  function decide(v, manoT){
    if(v.length === 2){
      const [a,b] = v;
      if(a !== -1 && a === b) return a;
      if(a === -1 && b !== -1) return b;
      if(a !== -1 && b === -1) return a;
      return null;
    }
    if(v.length === 3){
      const [a,b,c] = v;
      if(c !== -1) return c;
      if(a !== -1) return a;
      if(b !== -1) return b;
      return manoT;
    }
    return null;
  }
  function tableTop(table){
    if(!table.length) return null;
    let top = -1, player = -1, tie = false;
    for(const e of table){
      const pw = POW[ix(e)];
      if(pw > top){ top = pw; player = e.p; tie = false; }
      else if(pw === top && team(e.p) !== team(player)) tie = true;
    }
    return {top, player, team: tie ? -1 : team(player)};
  }

  /* --------------------------- estado ------------------------------ */
  const nameOf = (st, s) => escH(st.names[s] || '?');
  const teamName = (st, t) => [...Array(st.n).keys()].filter(s => team(s) === t).map(s => nameOf(st, s)).join(' & ');
  function setup(players, o){
    const n = [2,4,6].includes(+o.jog) ? +o.jog : 4;
    const st = {n, names:players.map(p => p.name), humans:players.map(p => !!p.human), T:+o.pontos === 24 ? 24 : 30,
      flor:o.flor !== 'nao', score:[0,0], dealer:Math.floor(rnd()*n), handNo:0, phase:'play', winTeam:-1};
    const ev = [{k:'banner', text:'TRUCO GAÚCHO'}];
    newHand(st, ev);
    st._ev = ev;
    return st;
  }
  function newHand(st, ev){
    const n = st.n;
    st.handNo++; st.dealer = (st.dealer + 1) % n; st.mano = (st.dealer + 1) % n;
    const d = [...Array(40).keys()];
    for(let i=d.length-1;i>0;i--){ const j = Math.floor(rnd()*(i+1)); [d[i],d[j]] = [d[j],d[i]]; }
    st.orig = []; st.hands = [];
    for(let p=0;p<n;p++){
      const h = d.splice(0,3); st.orig[p] = h;
      st.hands[p] = h.slice().sort((a,b) => POW[a] - POW[b]).map(i => Object.assign({}, CARDS[i]));
    }
    Object.assign(st, {phase:'play', turn:st.mano, vStart:st.mano, table:[], vazas:[], lastVaza:null, played:[],
      playedBy:[...Array(n)].map(() => []), caps:Array(n).fill(99), raisers:[], bluffed:[false,false], summary:null,
      tr:{lv:0, val:1, holder:-1, pend:null},
      env:{done:false, chain:[], seat:-1, first:false, callers:[], res:null},
      flr:{seats:[], res:null}});
    ev.push({k:'snd', s:'deal'}, {k:'deal', hand:st.handNo, dealer:st.dealer},
      {k:'log', text:`— Mão ${st.handNo}: ${nameOf(st, st.dealer)} deu as cartas; ${nameOf(st, st.mano)} é mão.`});
    if(st.flor){
      const fs = [];
      for(let k=0;k<n;k++){ const s = (st.mano + k) % n; if(isFlor(st.orig[s])) fs.push(s); }
      if(fs.length) resolveFlor(st, fs, ev);
    }
  }
  function award(st, t, pts, why, ev){
    st.score[t] += pts;
    ev.push({k:'pts', team:t, pts, why}, {k:'log', text:`<b>${teamName(st, t)}</b> +${pts} — ${why}`});
  }
  function checkEnd(st){
    for(const t of [0,1]) if(st.score[t] >= st.T){ st.phase = 'end'; st.winTeam = t; return true; }
    return false;
  }
  function endHand(st, t, pts, why, ev){
    award(st, t, pts, why, ev);
    st.summary = {team:t, pts, why};
    st.tr.pend = null;
    if(!checkEnd(st)){
      st.phase = 'handEnd';
      st.nextAt = Date.now() + HAND_PAUSE * (typeof CFG !== 'undefined' && CFG.speed ? CFG.speed : 1);
    }
  }
  function resolveFlor(st, fs, ev){
    const teams = [...new Set(fs.map(team))];
    fs.forEach(s => ev.push({k:'grito', seat:s, text:'Flor!'}));
    st.env.done = true;
    if(teams.length === 1){
      const pts = 3 * fs.length;
      st.flr = {seats:fs, res:{team:teams[0], pts, vals:null}};
      award(st, teams[0], pts, fs.length > 1 ? `${fs.length} flores` : 'flor', ev);
    } else {
      const vals = {}; let bs = -1;
      for(const s of fs){ vals[s] = florPts(st.orig[s]); if(bs < 0 || vals[s] > vals[bs]) bs = s; }  // empate: o mais perto do mão
      const other = fs.find(s => team(s) !== team(fs[0]));
      ev.push({k:'say', seat:other, text:'Contraflor!'});
      fs.forEach(s => ev.push({k:'log', text:`${nameOf(st, s)}: flor de ${vals[s]}`}));
      st.flr = {seats:fs, res:{team:team(bs), pts:6, vals}};
      award(st, team(bs), 6, `contraflor (${vals[bs]} pontos)`, ev);
    }
    checkEnd(st);
  }

  /* ----------------------- o que cada um pode ----------------------- */
  const canTruco = (st, s) => st.phase === 'play' && s === st.turn && st.tr.lv < 3 && (st.tr.lv === 0 || st.tr.holder === team(s));
  function envOpts(st, s){
    if(st.env.done || st.vazas.length || st.playedBy[s].length) return [];
    if(st.phase === 'play') return s === st.turn && st.tr.lv === 0 ? ['E','R','F'] : [];
    // "o envido está primeiro": resposta ao truco (só ao primeiro truco, na primeira vaza)
    if(st.phase === 'respTruco') return st.tr.lv === 0 && st.tr.pend && st.tr.pend.lv === 1 && team(s) !== st.tr.pend.team ? ['E','R','F'] : [];
    return [];
  }
  function respTeam(st){
    if(st.phase === 'respTruco') return 1 - st.tr.pend.team;
    if(st.phase === 'respEnv') return 1 - team(st.env.seat);
    return -1;
  }
  function respSeats(st){
    const rt = respTeam(st), from = st.phase === 'respTruco' ? st.tr.pend.seat : st.env.seat;
    const ss = []; for(let k=1;k<=st.n;k++){ const s = (from + k) % st.n; if(team(s) === rt) ss.push(s); }
    const hs = ss.filter(s => st.humans[s]);
    return hs.length ? hs : [ss[0]];
  }
  function waiting(st){
    if(st.phase === 'play') return [st.turn];
    if(st.phase === 'respTruco' || st.phase === 'respEnv') return respSeats(st);
    return [];
  }

  /* ----------------------------- jogadas ----------------------------- */
  const bad = err => ({ok:false, err:err || 'Jogada inválida.'});
  function apply(st, seat, a){
    if(!a || typeof a !== 'object' || typeof a.t !== 'string') return bad();
    const ev = [];
    if(st.phase === 'play'){
      if(seat !== st.turn) return bad('Não é a sua vez.');
      if(a.t === 'card') return playCard(st, seat, a.id, ev);
      if(a.t === 'truco'){
        if(!canTruco(st, seat)) return bad(st.tr.lv >= 3 ? 'Já está no vale quatro.' : 'Agora não dá para aumentar: o "quero" está com o outro time.');
        if(a.bluff) st.bluffed[team(seat)] = true;
        callTruco(st, seat, st.tr.lv + 1, ev);
        return {events:ev};
      }
      if(a.t === 'env'){
        if(!envOpts(st, seat).includes(a.k)) return bad('O envido só pode ser cantado na primeira vaza, antes de você jogar sua carta e antes de aceitarem o truco.');
        callEnv(st, seat, a.k, ev);
        return {events:ev};
      }
      if(a.t === 'mazo'){
        ev.push({k:'say', seat, text:'Me vou ao mazo!'});
        endHand(st, 1 - team(seat), st.tr.val, `${nameOf(st, seat)} foi ao mazo`, ev);
        return {events:ev};
      }
      return bad();
    }
    if(st.phase === 'respTruco'){
      const p = st.tr.pend;
      if(team(seat) === p.team) return bad('Espere a resposta do outro time.');
      if(a.t === 'quero'){
        st.tr.lv = p.lv; st.tr.val = TV[p.lv]; st.tr.holder = team(seat); st.tr.pend = null; st.phase = 'play';
        ev.push({k:'say', seat, text:'Quero!'}, {k:'log', text:`${nameOf(st, seat)} quis. A mão vale <b>${st.tr.val}</b>.`}, {k:'value'});
        return {events:ev};
      }
      if(a.t === 'nao'){
        ev.push({k:'say', seat, text:'Não quero!'});
        endHand(st, p.team, st.tr.val, `${teamName(st, team(seat))} não quiseram o ${CALL[p.lv].toLowerCase()}`, ev);
        return {events:ev};
      }
      if(a.t === 'truco'){
        if(p.lv >= 3) return bad('Não há aumento depois do vale quatro.');
        st.tr.lv = p.lv; st.tr.val = TV[p.lv]; st.tr.holder = team(seat);
        if(a.bluff) st.bluffed[team(seat)] = true;
        callTruco(st, seat, p.lv + 1, ev);
        return {events:ev};
      }
      if(a.t === 'env'){
        if(!envOpts(st, seat).includes(a.k)) return bad('Agora não dá para cantar envido.');
        callEnv(st, seat, a.k, ev);
        return {events:ev};
      }
      return bad();
    }
    if(st.phase === 'respEnv'){
      const ct = team(st.env.seat);
      if(team(seat) === ct) return bad('Espere a resposta do outro time.');
      if(a.t === 'quero'){
        ev.push({k:'say', seat, text:'Quero!'});
        resolveEnv(st, ev);
        afterEnv(st);
        return {events:ev, pause:2300};
      }
      if(a.t === 'nao'){
        const pts = envRef(st.env.chain);
        ev.push({k:'say', seat, text:'Não quero!'});
        st.env.res = {refused:true, team:ct, pts, ann:null};
        award(st, ct, pts, `${teamName(st, team(seat))} não quiseram o envido`, ev);
        afterEnv(st);
        return {events:ev, pause:1200};
      }
      if(a.t === 'env'){
        if(!envNext(st.env.chain).includes(a.k)) return bad('Esse aumento não é permitido agora.');
        callEnv(st, seat, a.k, ev);
        return {events:ev};
      }
      return bad();
    }
    return bad('Aguarde a próxima mão.');
  }
  function callTruco(st, seat, lv, ev){
    st.tr.pend = {lv, seat, team:team(seat)};
    st.phase = 'respTruco';
    st.raisers.push(seat);
    ev.push({k:'grito', seat, text:CALL[lv] + '!'}, {k:'log', text:`${nameOf(st, seat)} cantou <b>${CALL[lv]}</b>`});
  }
  function callEnv(st, seat, k, ev){
    if(!st.env.chain.length) st.env.first = st.phase === 'respTruco';
    st.env.chain.push(k); st.env.seat = seat; st.env.callers.push({seat, k});
    st.phase = 'respEnv';
    ev.push({k:'grito', seat, text:EK[k] + '!'}, {k:'log', text:`${nameOf(st, seat)} cantou <b>${EK[k]}</b>`});
  }
  function afterEnv(st){
    st.env.done = true;
    if(checkEnd(st)) return;
    st.phase = st.env.first ? 'respTruco' : 'play';
  }
  // cada um canta os pontos a partir do mão; quem não ganha diz "são boas"
  function resolveEnv(st, ev){
    const n = st.n, ann = {};
    let best = -1, bs = -1;
    for(let k=0;k<n;k++){
      const s = (st.mano + k) % n, v = envPts(st.orig[s]);
      if(bs < 0){ best = v; bs = s; ann[s] = {v}; ev.push({k:'say', seat:s, text:`Tenho ${v}!`}); }
      else if(team(s) !== team(bs)){
        if(v > best){ best = v; bs = s; ann[s] = {v}; ev.push({k:'say', seat:s, text:`${v} são melhores!`}); }
        else { ann[s] = {max:best}; ev.push({k:'say', seat:s, text:'São boas!'}); }
      }
    }
    const wt = team(bs), pts = envAcc(st, st.env.chain, wt);
    st.env.res = {refused:false, team:wt, pts, ann, best, seat:bs};
    ev.push({k:'log', text:`Envido: ${nameOf(st, bs)} com <b>${best}</b> pontos.`});
    award(st, wt, pts, `envido (${best})`, ev);
  }
  function playCard(st, seat, id, ev){
    const h = st.hands[seat], i = h.findIndex(c => c.id === id);
    if(i < 0) return bad('Essa carta não está na sua mão.');
    const c = h.splice(i,1)[0], x = ix(c);
    const t0 = tableTop(st.table);
    if(t0 && t0.team !== -1 && t0.team !== team(seat) && POW[x] < t0.top) st.caps[seat] = Math.min(st.caps[seat], t0.top);
    st.table.push({p:seat, id:c.id}); st.played.push(x); st.playedBy[seat].push(x);
    ev.push({k:'snd', s:'card'});
    if(st.table.length < st.n){ st.turn = (seat + 1) % st.n; return {events:ev}; }
    // fecha a vaza
    const r = tableTop(st.table), no = st.vazas.length + 1;
    st.vazas.push(r.team);
    st.lastVaza = {cards:st.table.slice(), win: r.team === -1 ? -1 : r.player, no};
    st.table = [];
    ev.push({k:'log', text: r.team === -1 ? `${no}ª vaza: parda (empate)` : `${no}ª vaza: ${nameOf(st, r.player)}`});
    if(r.team !== -1) ev.push({k:'snd', s:'move'});
    const d = decide(st.vazas, team(st.mano));
    if(d !== null){
      const why = st.tr.lv ? `ganharam o ${CALL[st.tr.lv].toLowerCase()}` : 'ganharam a mão';
      endHand(st, d, st.tr.val, why, ev);
      return {events:ev};
    }
    st.turn = st.vStart = r.player;
    return {events:ev, pause:1150};
  }
  function tick(st, o, now){
    if(st.phase !== 'handEnd' || now < st.nextAt) return null;
    const ev = [];
    newHand(st, ev);
    return {changed:true, events:ev};
  }
  function over(st){
    if(st.phase !== 'end') return null;
    const w = st.winTeam;
    return {winners:[...Array(st.n).keys()].filter(s => team(s) === w),
      text:`<b>${teamName(st, w)}</b> chegaram a ${st.T}. Placar: <b>${st.score[w]}</b> × <b>${st.score[1-w]}</b>.`};
  }

  /* ------------------------------ visão ------------------------------ */
  function actionsFor(st, s){
    if(s < 0) return null;
    if(st.phase === 'play' && s === st.turn)
      return {play:true, truco: canTruco(st, s) ? CALL[st.tr.lv + 1] : null, env:envOpts(st, s), mazo:true};
    if(st.phase === 'respTruco' && team(s) === respTeam(st)){
      const p = st.tr.pend;
      return {resp:'truco', call:CALL[p.lv], by:p.seat, accVal:TV[p.lv], refVal:st.tr.val,
        up: p.lv < 3 ? CALL[p.lv + 1] : null, env:envOpts(st, s)};
    }
    if(st.phase === 'respEnv' && team(s) === respTeam(st)){
      const ch = st.env.chain;
      return {resp:'env', call:EK[ch[ch.length-1]], by:st.env.seat, label:chainLabel(st, ch), refVal:envRef(ch),
        up:envNext(ch).map(k => ({k, label:EK[k]}))};
    }
    return null;
  }
  function view(st, seat){
    return {n:st.n, names:st.names, me:seat, T:st.T, flor:st.flor, score:st.score, dealer:st.dealer, mano:st.mano,
      handNo:st.handNo, phase:st.phase, turn:st.turn,
      hand: seat >= 0 ? st.hands[seat] : [], counts:st.hands.map(h => h.length),
      table:st.table, lastVaza:st.lastVaza, vazas:st.vazas,
      tr:{lv:st.tr.lv, val:st.tr.val, holder:st.tr.holder, pend:st.tr.pend},
      env:{done:st.env.done, chain:st.env.chain, seat:st.env.seat, res:st.env.res, label:chainLabel(st, st.env.chain)},
      flr:st.flr, summary:st.summary, winTeam:st.winTeam, acts:actionsFor(st, seat),
      myEnv: seat < 0 ? '-' : (st.flor && isFlor(st.orig[seat]) ? 'flor de ' + florPts(st.orig[seat]) : envPts(st.orig[seat]))};
  }

  /* =====================================================================
     BOTS
     Fácil: regras simples (força das cartas e pontos de envido) com erros leves.
     Normal: Monte Carlo — sorteia as cartas escondidas e joga a mão até o fim
       centenas de vezes; considera que quem truca/canta envido costuma ter jogo.
     Difícil: Monte Carlo com mais amostras e LEITURA da mesa: os pontos cantados
       no envido ("tenho 31", "são boas"), a flor, quem fugiu da vaza etc.
       restringem as cartas possíveis de cada um.
     Blefe com frequência controlada (no máximo um por time e mão no truco).
     Na resposta, os bots do mesmo time combinam a força ("señas" do truco).
     ===================================================================== */
  const DIFF = {
    facil:  {N:0,   NE:0,   bluff:0.03, bluffEnv:0.04, noise:0.12, cond:false, read:false},
    normal: {N:220, NE:160, bluff:0.06, bluffEnv:0.06, noise:0.03, cond:true,  read:false},
    dificil:{N:700, NE:420, bluff:0.09, bluffEnv:0.08, noise:0,    cond:true,  read:true}
  };
  const TUNE0 = {minQ:[0.7,0.8,0.88], accF:1.6, rq:[0.78,0.86], runB:0, envM:0.004, envAcc:0};
  for(const k in DIFF) DIFF[k].tu = Object.assign({}, TUNE0);
  // chance de vencer a PARTIDA com o placar a × b (DP aproximada: truco + envido por mão)
  const MWC = {};
  function mwFn(T){
    if(MWC[T]) return MWC[T];
    const tv = [[1,.5],[2,.28],[3,.14],[4,.08]], evd = [[0,.5],[1,.12],[2,.24],[3,.09],[5,.05]];
    const memo = new Map();
    const f = (a, b) => {
      if(a >= T) return 1; if(b >= T) return 0;
      const key = a*100 + b; if(memo.has(key)) return memo.get(key);
      let x = 0;
      for(const [v,pv] of tv) for(const [e,pe] of evd)
        x += pv*pe*0.25*(f(a+v+e, b) + f(a+v, b+e) + f(a+e, b+v) + f(a, b+v+e));
      memo.set(key, x); return x;
    };
    return MWC[T] = f;
  }
  const mw = (st, a, b) => mwFn(st.T)(a, b);

  // política usada nas simulações (como joga um jogador razoável)
  function rChoose(hd, q, tb, vz){
    let lo = 0, hi = 0;
    for(let i=1;i<hd.length;i++){ if(hd[i] < hd[lo]) lo = i; if(hd[i] > hd[hi]) hi = i; }
    if(!tb.length){
      if(vz.length === 0 && hd.length === 3){ for(let i=0;i<3;i++) if(i !== lo && i !== hi) return i; }
      return hi;
    }
    let top = -2, tp = -1, tie = false;
    for(const e of tb){ if(e.pw > top){ top = e.pw; tp = e.p; tie = false; } else if(e.pw === top && e.p%2 !== tp%2) tie = true; }
    const myT = q % 2;
    if(!tie && tp % 2 === myT) return lo;
    let best = -1;
    for(let i=0;i<hd.length;i++) if(hd[i] > top && (best < 0 || hd[i] < hd[best])) best = i;
    if(best >= 0) return best;
    if(vz.length === 0 || vz[0] === myT){ for(let i=0;i<hd.length;i++) if(hd[i] === top) return i; }
    return lo;
  }
  function rollout(t, h, tb, st0, vz0, manoT){
    const n = h.length, vz = vz0.slice();
    let s0 = st0;
    for(let g=0; g<4; g++){
      while(tb.length < n){
        const q = (s0 + tb.length) % n;
        if(!h[q].length) return 0.5;
        const i = rChoose(h[q], q, tb, vz);
        tb.push({p:q, pw:h[q][i]}); h[q].splice(i,1);
      }
      let top = -2, tp = -1, tie = false;
      for(const e of tb){ if(e.pw > top){ top = e.pw; tp = e.p; tie = false; } else if(e.pw === top && e.p%2 !== tp%2) tie = true; }
      vz.push(tie ? -1 : tp % 2);
      const d = decide(vz, manoT);
      if(d !== null) return d === t ? 1 : 0;
      s0 = tp; tb = [];
    }
    return 0.5;
  }
  // verossimilhança de quem canta: mãos fracas ficam improváveis (a não ser como blefe)
  function raiserLik(pws, bluff){
    if(!pws.length) return 1;
    let a = -1, b = -1;
    for(const x of pws){ if(x > a){ b = a; a = x; } else if(x > b) b = x; }
    const q = (a/14)*0.65 + (Math.max(b,0)/14)*0.35;
    return bluff + (1-bluff)*clampN((q - 0.38)/0.4, 0.03, 1);
  }
  const ENV_TH = {E:[22,8], R:[25,6], F:[27,5]};
  const envLik = (E, k, bluff) => bluff + (1-bluff)*clampN((E - ENV_TH[k][0]) / ENV_TH[k][1], 0.03, 1);

  // o que o lugar p sabe: própria mão, cartas jogadas, cantos e pontos anunciados
  function know(st, p, D, o={}){
    const n = st.n, own = st.hands[p].map(ix);
    const known = new Set(own); st.played.forEach(x => known.add(x));
    const pool = []; for(let i=0;i<40;i++) if(!known.has(i)) pool.push(i);
    const counts = st.hands.map(h => h.length);
    const K = {p, t:team(p), n, own, pool, counts, playedBy:st.playedBy, manoT:team(st.mano), mano:st.mano,
      table:st.table.map(e => ({p:e.p, pw:POW[ix(e)]})), starter:st.vStart, vazas:st.vazas.slice(),
      lists:{}, order:[], soft:[]};
    // restrições "duras" (só no Difícil): pontos cantados e flor
    if(D.read){
      for(let q=0;q<n;q++){
        if(q === p || !counts[q]) continue;
        const fs = [];
        const an = st.env.res && st.env.res.ann && st.env.res.ann[q];
        if(an) fs.push(an.v != null ? (a => envPts(a) === an.v) : (a => envPts(a) <= an.max));
        if(st.flor){ const hf = st.flr.seats.includes(q); fs.push(a => isFlor(a) === hf); }
        if(!fs.length) continue;
        const pre = st.playedBy[q], k = counts[q], L = [], m = pool.length;
        const test = c => fs.every(f => f(pre.concat(c)));
        if(k === 1){ for(let i=0;i<m;i++){ const c = [pool[i]]; if(test(c)) L.push(c); } }
        else if(k === 2){ for(let i=0;i<m;i++) for(let j=i+1;j<m;j++){ const c = [pool[i],pool[j]]; if(test(c)) L.push(c); } }
        else for(let i=0;i<m;i++) for(let j=i+1;j<m;j++) for(let l=j+1;l<m;l++){ const c = [pool[i],pool[j],pool[l]]; if(test(c)) L.push(c); }
        if(L.length && L.length < 0.97 * comb(m, k)){ K.lists[q] = L; K.order.push(q); }
      }
      K.order.sort((a,b) => K.lists[a].length - K.lists[b].length);
    }
    // restrições "moles" (Normal e Difícil): quem trucou, quem cantou envido, quem fugiu da vaza
    if(D.cond){
      const rs = o.raiser != null ? o.raiser : lastOppRaiser(st, p);
      if(rs >= 0 && team(rs) !== K.t){
        const nr = st.raisers.filter(s => team(s) === team(rs)).length;
        K.soft.push({q:rs, kind:'truco', bluff: nr <= 1 ? 0.2 : 0.1});
      }
      for(let q=0;q<n;q++) if(q !== p && team(q) !== K.t && st.caps[q] < 99) K.soft.push({q, kind:'cap', cap:st.caps[q]});
      // envido cantado por adversários sem pontos anunciados (pendente ou recusado)
      if(!(st.env.res && st.env.res.ann)){
        const best = {};
        const rank = {E:0, R:1, F:2};
        for(const c of st.env.callers) if(team(c.seat) !== K.t && (best[c.seat] == null || rank[c.k] > rank[best[c.seat]])) best[c.seat] = c.k;
        for(const q in best) K.soft.push({q:+q, kind:'env', k:best[q], bluff:0.12});
      }
    }
    return K;
  }
  function lastOppRaiser(st, p){
    for(let i=st.raisers.length-1;i>=0;i--) if(team(st.raisers[i]) !== team(p)) return st.raisers[i];
    return -1;
  }
  function comb(m, k){ return k === 1 ? m : k === 2 ? m*(m-1)/2 : m*(m-1)*(m-2)/6; }
  // sorteia as mãos escondidas (índices) de acordo com o que se sabe; devolve {h, w}
  function sampleOne(K){
    const h = new Array(K.n);
    for(let tries=0; tries<6; tries++){
      const used = new Set(); let ok = true;
      for(const q of K.order){
        const L = K.lists[q]; let got = null;
        for(let k=0;k<14;k++){ const c = L[Math.floor(rnd()*L.length)]; if(c.every(x => !used.has(x))){ got = c; break; } }
        if(!got){ ok = false; break; }
        got.forEach(x => used.add(x)); h[q] = got.slice();
      }
      if(!ok) continue;
      const rest = K.pool.filter(x => !used.has(x));
      let k = 0;
      for(let q=0;q<K.n;q++){
        if(q === K.p){ h[q] = K.own.slice(); continue; }
        if(K.lists[q]) continue;
        const arr = [];
        for(let j=0;j<K.counts[q] && k<rest.length;j++){
          const r = k + Math.floor(rnd()*(rest.length-k));
          const tmp = rest[k]; rest[k] = rest[r]; rest[r] = tmp;
          arr.push(rest[k]); k++;
        }
        h[q] = arr;
      }
      return {h, w:softW(K, h)};
    }
    // não achou combinação coerente: ignora as restrições duras
    return sampleOne(Object.assign({}, K, {lists:{}, order:[]}));
  }
  function softW(K, h){
    let w = 1;
    for(const c of K.soft){
      const hq = h[c.q]; if(!hq) continue;
      if(c.kind === 'truco') w *= raiserLik(hq.map(x => POW[x]), c.bluff);
      else if(c.kind === 'cap'){ for(const x of hq) if(POW[x] > c.cap) w *= 0.35; }
      else if(c.kind === 'env') w *= envLik(envPts(K.playedBy[c.q].concat(hq)), c.k, c.bluff);
    }
    return w;
  }
  function samples(K, N){ const out = []; for(let i=0;i<N;i++) out.push(sampleOne(K)); return out; }
  // chance de ganhar a mão jogando a carta de força pw (ou seguindo sem escolher, pw = null)
  function mcEval(K, S, pw){
    let sum = 0, ws = 0;
    for(const s of S){
      const h = s.h.map(a => a.map(x => POW[x]));
      const tb = K.table.slice();
      if(pw != null){ const i = h[K.p].indexOf(pw); h[K.p].splice(i,1); tb.push({p:K.p, pw}); }
      sum += s.w * rollout(K.t, h, tb, K.starter, K.vazas, K.manoT);
      ws += s.w;
    }
    return ws ? sum/ws : 0.5;
  }
  // chance de o time de p ganhar o envido (cada um canta a partir do mão)
  function envEval(st, K, S){
    const myE = envPts(st.orig[K.p]);
    let sum = 0, ws = 0;
    for(const s of S){
      let best = -1, bs = -1;
      for(let k=0;k<K.n;k++){
        const q = (K.mano + k) % K.n;
        const v = q === K.p ? myE : envPts(K.playedBy[q].concat(s.h[q]));
        if(v > best){ best = v; bs = q; }
      }
      sum += s.w * (team(bs) === K.t ? 1 : 0); ws += s.w;
    }
    return ws ? sum/ws : 0.5;
  }
  function strength(st, p){
    const h = st.hands[p].map(c => POW[ix(c)]).sort((a,b) => b-a), t = team(p);
    let s = (h[0]||0)/14*0.6 + (h[1]||0)/14*0.3 + (h[2]||0)/14*0.1;
    const won = st.vazas.filter(v => v === t).length, lost = st.vazas.filter(v => v === 1-t).length;
    s += won*0.25 - lost*0.3;
    const tt = tableTop(st.table);
    if(tt && tt.team === t) s += 0.1;
    if(!h.length) s = won > lost ? 0.8 : 0.2;
    return clampN(s, 0, 1);
  }
  function easyChoose(st, p){
    const h = st.hands[p], t = team(p);
    const idx = h.map((c,i) => i).sort((a,b) => POW[ix(h[a])] - POW[ix(h[b])]);
    const low = idx[0], high = idx[idx.length-1], mid = idx[Math.floor(idx.length/2)];
    const tt = tableTop(st.table);
    if(!tt) return st.vazas.length === 0 && h.length === 3 ? mid : high;
    if(tt.team === t) return low;
    const beat = idx.filter(i => POW[ix(h[i])] > tt.top);
    return beat.length ? beat[0] : low;
  }
  function plan(st, p, D){
    const h = st.hands[p];
    if(!D.N){
      let i = easyChoose(st, p);
      if(rnd() < D.noise && h.length > 1){        // erro de iniciante: a carta "do lado", nunca um absurdo
        const ord = h.map((c,j) => j).sort((a,b) => POW[ix(h[a])] - POW[ix(h[b])]);
        const k = ord.indexOf(i);
        i = ord[k > 0 && (k === ord.length-1 || rnd() < 0.5) ? k-1 : k+1];
      }
      return {id:h[i].id, pwin:strength(st, p)};
    }
    const K = know(st, p, D), S = samples(K, D.N);
    const pws = [...new Set(h.map(c => POW[ix(c)]))];
    let best = null;
    for(const pw of pws){
      const raw = mcEval(K, S, pw), sc = raw - pw*0.0012;   // empate técnico: guarda a carta mais forte
      if(!best || sc > best.sc) best = {pw, sc, raw};
    }
    return {id:h.find(c => POW[ix(c)] === best.pw).id, pwin:best.raw};
  }
  function estimate(st, q, D, raiser){
    if(!D.N) return strength(st, q);
    const K = know(st, q, D, {raiser});
    return mcEval(K, samples(K, D.N), null);
  }
  function wantsTruco(st, p, D, pwin){
    const t = team(p), my = st.score[t], op = st.score[1-t];
    const v = st.tr.val, nl = st.tr.lv + 1, v1 = TV[nl];
    const real = D.N ? pwin : mcEval(know(st, p, D), samples(know(st, p, D), 80), null);
    if(real >= 0.97 || real <= 0.04) return null;                 // mão já decidida
    const q = clampN(pwin + (rnd()*2-1)*D.noise, 0, 1);
    if(D.N && q > 0.9 && st.vazas.length === 0 && st.tr.lv === 0 && rnd() < 0.3) return null;   // espera o adversário trucar
    const tu = D.tu, acc = clampN(tu.accF*(1-q), 0.05, 0.95);
    const evR = acc*(q*mw(st, my+v1, op) + (1-q)*mw(st, my, op+v1)) + (1-acc)*mw(st, my+v, op);
    const evN = q*mw(st, my+v, op) + (1-q)*mw(st, my, op+v);
    const minQ = tu.minQ[nl-1];
    const top = Math.max(-1, ...st.hands[p].map(c => POW[ix(c)]));
    const goods = top >= 11 || (st.vazas.includes(t) && top >= 9) || real >= 0.9;
    if(goods && q >= minQ && evR > evN + 0.006) return {t:'truco'};
    // blefe: raro, um por mão por time, só no truco, com mão "vendável"
    if(nl !== 1 || st.bluffed[t]) return null;
    if(q < 0.15 || q > 0.5) return null;
    if(mw(st, my, op+v1) < mw(st, my, op) - 0.2) return null;
    const bl = D.bluff * (st.vazas[0] === t ? 1.4 : 1) * (st.hands[p].length <= 1 ? 1.2 : 0.6);
    return rnd() < bl ? {t:'truco', bluff:true} : null;
  }
  const botMates = (st, p) => [...Array(st.n).keys()].filter(q => team(q) === team(p) && (q === p || !st.humans[q]));
  function respTruco(st, p, D){
    const pend = st.tr.pend, rt = team(p);
    const eo = envOpts(st, p);
    if(eo.length){ const k = envCall(st, p, D); if(k) return {t:'env', k}; }
    const my = st.score[rt], op = st.score[1-rt];
    let pr;
    if(!D.N){ pr = Math.max(...botMates(st, p).map(q => strength(st, q))); pr = clampN(pr - 0.08 + (rnd()*2-1)*D.noise, 0, 1); }
    else pr = Math.max(...botMates(st, p).slice(0, 2).map(q => estimate(st, q, D, pend.seat)));
    pr = clampN(pr + (rnd()*2-1)*D.noise, 0, 1);
    const v = st.tr.val, v1 = TV[pend.lv];
    const run = mw(st, my, op+v), acc = pr*mw(st, my+v1, op) + (1-pr)*mw(st, my, op+v1);
    let best = acc + D.tu.runB >= run ? 'quero' : 'nao', bv = Math.max(acc, run);
    if(pend.lv < 3){
      const v2 = TV[pend.lv+1];
      const rai = pr*mw(st, my+v2, op) + (1-pr)*mw(st, my, op+v2);
      if(rai > bv + 0.01 && pr > D.tu.rq[pend.lv === 1 ? 0 : 1]) best = 'truco';
      else if(best === 'quero' && pend.lv === 1 && pr > 0.55 && !st.bluffed[rt] && rnd() < D.bluff*0.4) return {t:'truco', bluff:true};
    }
    return {t:best};
  }
  // decide se canta envido (e qual) na própria vez ou em resposta ao truco
  function envCall(st, p, D){
    const t = team(p), E = envPts(st.orig[p]);
    if(!D.N){
      const e = E + (rnd()*2-1)*D.noise*20;
      if(e >= 31) return rnd() < 0.5 ? 'R' : 'E';
      if(e >= 27) return 'E';
      return rnd() < D.bluffEnv ? 'E' : null;
    }
    const K = know(st, p, D), pe = envEval(st, K, samples(K, D.NE));
    const my = st.score[t], op = st.score[1-t];
    let best = null, bv = mw(st, my, op) + D.tu.envM;
    for(const k of ['E','R','F']){
      const vW = k === 'F' ? falta(st, t) : EVAL[k], vL = k === 'F' ? falta(st, 1-t) : EVAL[k];
      if((k === 'R' && pe < 0.72) || (k === 'F' && pe < 0.86)) continue;   // canto alto só com pontos altos
      const dk = {E:0.1, R:0.14, F:0.22}[k];                                 // quanto maior a aposta, mais o aceite indica pontos
      const acc = clampN(1.25*(1-pe) + 0.1 - dk/2, 0.08, 0.95), pw = clampN(pe - dk, 0, 1);
      const ev = acc*(pw*mw(st, my+vW, op) + (1-pw)*mw(st, my, op+vL)) + (1-acc)*mw(st, my+1, op);
      if(ev > bv){ bv = ev; best = k; }
    }
    if(!best && pe < 0.35 && rnd() < D.bluffEnv) best = 'E';
    return best;
  }
  function respEnv(st, p, D){
    const ch = st.env.chain, rt = team(p), ct = 1 - rt, E = envPts(st.orig[p]);
    const nx = envNext(ch);
    if(!D.N){
      const need = ch.includes('F') ? 30 : 24 + 2*ch.length;
      const e = E + (rnd()*2-1)*D.noise*20;
      if(e >= 32 && nx.length && rnd() < 0.5) return {t:'env', k:nx.includes('R') ? 'R' : nx[0]};
      return {t: e >= need ? 'quero' : 'nao'};
    }
    let pe = 0;
    for(const q of botMates(st, p).slice(0, 2)){ const K = know(st, q, D); pe = Math.max(pe, envEval(st, K, samples(K, D.NE))); }
    const my = st.score[rt], op = st.score[ct];
    const acc = pe*mw(st, my + envAcc(st, ch, rt), op) + (1-pe)*mw(st, my, op + envAcc(st, ch, ct));
    const ref = mw(st, my, op + envRef(ch));
    let best = {t: acc + D.tu.envAcc >= ref ? 'quero' : 'nao'}, bv = Math.max(acc, ref);
    if(pe > 0.62) for(const k of nx){
      const c2 = ch.concat(k);
      const a2 = clampN(1.2*(1-pe) + 0.15, 0.15, 0.9), pw = clampN(pe - 0.08, 0, 1);
      const ev = a2*(pw*mw(st, my + envAcc(st, c2, rt), op) + (1-pw)*mw(st, my, op + envAcc(st, c2, ct))) + (1-a2)*mw(st, my + envRef(c2), op);
      if(ev > bv + 0.01){ bv = ev; best = {t:'env', k}; }
    }
    return best;
  }
  function bot(st, p, o){
    const D = DIFF[o && o.diff] || DIFF.normal;
    if(st.phase === 'respTruco') return respTruco(st, p, D);
    if(st.phase === 'respEnv') return respEnv(st, p, D);
    if(st.phase !== 'play' || p !== st.turn) return {t:'none'};
    if(envOpts(st, p).length){ const k = envCall(st, p, D); if(k) return {t:'env', k}; }
    const pl = plan(st, p, D);
    if(canTruco(st, p)){ const tr = wantsTruco(st, p, D, pl.pwin); if(tr) return tr; }
    return {t:'card', id:pl.id};
  }
  function botFallback(st, p){
    if(st.phase === 'respTruco' || st.phase === 'respEnv') return {t:'quero'};
    if(st.phase === 'play' && st.hands[p].length) return {t:'card', id:st.hands[p][0].id};
    return null;
  }

  return {setup, waiting, apply, over, view, tick, bot, botFallback, DIFF,
    CARDS, POW, ix, MATA, FIG, SNAME, CALL, EK, TV, envPts, isFlor, florPts, falta, envNext, envAcc, envRef, decide, cardName,
    _internal:{know, samples, mcEval, envEval, plan, strength, mw}};
})();
