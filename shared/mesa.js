/* =====================================================================
   Central de Jogos — "Mesa": salas online + bots para qualquer jogo
   ---------------------------------------------------------------------
   Um jogo só precisa descrever as regras (ver docs/ADICIONAR-JOGO.md):
     Mesa.run({ id, name, setup, waiting, apply, bot, view, over, render, ... })
   A Mesa cuida de: tela inicial, criar/entrar em sala (PeerJS/WebRTC),
   sala de espera com lugares e chat, bots nos lugares vazios, reconexão,
   sincronização (cada um recebe só o que pode ver) e fim de partida.
   ===================================================================== */
"use strict";
const Mesa = (() => {
  const PEER_OPTS = { debug:0, config:{ iceServers:[
    {urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun1.l.google.com:19302'},{urls:'stun:stun2.l.google.com:19302'}]}};
  const CODE_CH = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const BOT_NAMES = ['Tião','Zé','Chico','Dito','Juca','Nhô Quim','Lurdinha','Dona Cida','Tonho','Bené'];
  const genCode = () => Array.from({length:5}, () => CODE_CH[Math.floor(Math.random()*CODE_CH.length)]).join('');

  let D = null;                 // definição do jogo
  const NET = { role:null, peer:null, conns:[], conn:null, code:'', leaving:false };
  const H = { phase:'lobby', seats:[], opts:{}, state:null, waiting:[], busy:false, tally:[], gameNo:0, lastOver:null, botTimer:null, stepTimer:null };
  let VIEW = null, logLines = [], overShown = 0;

  /* ------------------------------------------------------------------ */
  const nSeats = () => D.seats ? D.seats(H.opts) : (D.players || 2);
  const isHumanSeat = s => !!(H.seats[s] && H.seats[s].human);
  const seatOf = cid => H.seats.findIndex(x => x && x.cid === cid);
  const teamOf = s => D.team ? D.team(s, nSeats(), H.opts) : null;
  const seatLabel = s => D.seatLabel ? D.seatLabel(s, nSeats(), H.opts) : (teamOf(s) != null ? 'Dupla ' + (teamOf(s)+1) : 'Lugar ' + (s+1));

  function toHost(m){
    if(NET.role === 'guest'){ if(NET.conn && NET.conn.open) NET.conn.send(m); }
    else if(NET.role) hostHandle('host', m);
  }
  function emit(e){
    applyEvent(e);
    NET.conns.forEach(c => { try{ if(c.open) c.send({t:'ev', e}); }catch(_){} });
  }
  function viewFor(seat){
    return {
      phase:H.phase, code:NET.code, solo:NET.role === 'solo', me:seat, opts:H.opts, gameNo:H.gameNo, tally:H.tally,
      seats:H.seats.map((x,i) => x ? {name:x.name, human:x.human, online:x.online, host:x.cid === 'host', team:teamOf(i), label:seatLabel(i)} : null),
      waiting:H.busy ? [] : H.waiting.slice(), lastOver:H.lastOver,
      game: H.state && (H.phase === 'game' || H.phase === 'over') ? D.view(H.state, seat, H.opts) : null
    };
  }
  function sync(){
    if(NET.role === 'guest' || !NET.role) return;
    NET.conns.forEach(c => { try{ if(c.open) c.send({t:'view', v:viewFor(seatOf(c.peer))}); }catch(_){} });
    VIEW = viewFor(seatOf('host'));
    render();
  }

  /* ---------------------------- MOTOR ---------------------------------- */
  function startGame(){
    clearTimeout(H.botTimer); clearTimeout(H.stepTimer);
    const pool = BOT_NAMES.filter(n => !H.seats.some(s => s && s.name === n));
    for(let i=0;i<nSeats();i++) if(!H.seats[i]) H.seats[i] = {name:pool.shift() || 'Bot ' + (i+1), cid:null, human:false, online:true, wasHuman:false};
    if(H.tally.length !== nSeats()) H.tally = Array(nSeats()).fill(0);
    H.gameNo++; H.phase = 'game'; H.busy = false; H.lastOver = null;
    H.state = D.setup(H.seats.map(s => ({name:s.name, human:s.human})), H.opts);
    emit({k:'start', gameNo:H.gameNo});
    if(D.startEvents) D.startEvents(H.state, H.opts).forEach(emit);
    step();
  }
  function step(){
    if(H.phase !== 'game') return;
    clearTimeout(H.botTimer);
    const res = D.over(H.state, H.opts);
    if(res){ finish(res); return; }
    H.waiting = D.waiting(H.state, H.opts).slice();
    sync();
    const bots = H.waiting.filter(s => !isHumanSeat(s));
    if(bots.length){
      const s = bots[0];
      const ms = D.botDelay ? D.botDelay(H.state, s, H.opts) : 650;
      H.botTimer = setTimeout(() => {
        if(H.phase !== 'game' || H.busy || !H.waiting.includes(s) || isHumanSeat(s)) return;
        let a; try{ a = D.bot(H.state, s, H.opts); }catch(e){ console.error(e); }
        act(s, a, true);
      }, ms * CFG.speed);
    }
  }
  function act(seat, a, fromBot){
    if(H.phase !== 'game' || H.busy || !H.waiting.includes(seat)) return;
    let res;
    try{ res = D.apply(H.state, seat, a, H.opts); }catch(e){ console.error(e); res = {ok:false, err:'Jogada inválida'}; }
    if(!res || res.ok === false){
      if(fromBot){
        console.warn('bot fez jogada inválida', seat, a, res);
        H.botFails = (H.botFails || 0) + 1;
        if(H.botFails > 3 && D.botFallback){ const fb = D.botFallback(H.state, seat, H.opts); H.botFails = 0; if(fb){ act(seat, fb, false); return; } }
        if(H.botFails > 20){ console.error('bot travado'); return; }
        step();
      } else emit({k:'toast', seat, text: (res && res.err) || 'Jogada inválida'});
      return;
    }
    if(fromBot) H.botFails = 0;
    (res.events || []).forEach(emit);
    if(res.pause){
      H.busy = true; sync();
      H.stepTimer = setTimeout(() => { H.busy = false; step(); }, res.pause * CFG.speed);
    } else step();
  }
  function finish(res){
    H.phase = 'over'; H.waiting = [];
    (res.winners || []).forEach(s => { if(H.tally[s] != null) H.tally[s]++; });
    H.lastOver = {winners:res.winners || [], draw:!!res.draw, text:res.text || '', gameNo:H.gameNo, scores:res.scores || null};
    emit({k:'over', winners:H.lastOver.winners, draw:H.lastOver.draw});
    sync();
  }
  function seatWentBot(s){ if(H.phase === 'game' && H.waiting.includes(s)) step(); }

  /* --------------------- mensagens para o anfitrião -------------------- */
  function hostHandle(cid, m){
    if(!m || typeof m !== 'object') return;
    const seat = seatOf(cid), isHost = cid === 'host';
    switch(m.t){
      case 'sit': {
        const to = m.seat|0;
        if(H.phase !== 'lobby' || seat < 0 || to < 0 || to >= nSeats() || H.seats[to]) return;
        H.seats[to] = H.seats[seat]; H.seats[seat] = null; sync(); break;
      }
      case 'opts':
        if(isHost && (H.phase === 'lobby' || H.phase === 'over') && m.opts && typeof m.opts === 'object'){
          const next = Object.assign({}, H.opts);
          (D.options || []).forEach(o => { if(m.opts[o.key] != null && o.choices.some(c => String(c[0]) === String(m.opts[o.key]))) next[o.key] = o.choices.find(c => String(c[0]) === String(m.opts[o.key]))[0]; });
          const prev = H.opts, oldN = nSeats(); H.opts = next; const n = nSeats();
          if(n !== oldN){
            const humans = H.seats.filter(x => x && x.human);
            if(humans.length > n){ H.opts = prev; emit({k:'toast', seat:0, text:'Há mais jogadores na sala do que lugares nesse modo.'}); }
            else {
              const arr = Array(n).fill(null);
              H.seats.forEach((x,i) => { if(x && x.human){ if(i < n && !arr[i]) arr[i] = x; else arr[arr.findIndex(y => !y)] = x; } });
              H.seats = arr; H.tally = [];
            }
          }
          lsSet('central.opts.' + D.id, H.opts);
          sync();
        }
        break;
      case 'act': if(seat >= 0) act(seat, m.a, false); break;
      case 'chat': {
        const text = String(m.text || '').replace(/\s+/g,' ').trim().slice(0,120);
        if(text && seat >= 0) emit({k:'chat', seat, name:H.seats[seat].name, text});
        break;
      }
      case 'start': if(isHost && H.phase === 'lobby') startGame(); break;
      case 'again': if(isHost && H.phase === 'over') startGame(); break;
      case 'lobby':
        if(isHost && H.phase === 'over'){
          H.phase = 'lobby'; H.state = null;
          H.seats = H.seats.map(x => x && x.human && x.online ? x : null);
          sync();
        }
        break;
    }
  }
  function onGuestConn(conn){
    conn.on('data', m => {
      if(m && m.t === 'hello') guestJoin(conn, m.name);
      else if(seatOf(conn.peer) >= 0) hostHandle(conn.peer, m);
    });
    conn.on('close', () => guestLeave(conn.peer));
    conn.on('error', () => guestLeave(conn.peer));
  }
  function guestJoin(conn, rawName){
    if(seatOf(conn.peer) >= 0) return;
    const name = cleanName(rawName) || 'Jogador';
    let s;
    if(H.phase === 'lobby'){
      s = H.seats.findIndex((x,i) => !x && i < nSeats());
      if(s < 0) return reject(conn, 'A sala está cheia.');
      H.seats[s] = {name, cid:conn.peer, human:true, online:true, wasHuman:true};
    } else {
      // volta para o próprio lugar (mesmo nome), mesmo que a conexão antiga ainda não tenha caído
      s = H.seats.findIndex(x => x && x.wasHuman && x.name === name && x.cid !== 'host');
      if(s >= 0 && H.seats[s].human && H.seats[s].cid){
        const old = NET.conns.find(c => c.peer === H.seats[s].cid);
        if(old){ NET.conns.splice(NET.conns.indexOf(old), 1); try{ old.close(); }catch(_){} }
      }
      if(s < 0) s = H.seats.findIndex(x => x && !x.human);
      if(s < 0) return reject(conn, 'A partida já começou e todos os lugares têm jogadores.');
      const was = H.seats[s].name;
      Object.assign(H.seats[s], {name, cid:conn.peer, human:true, online:true, wasHuman:true});
      if(was !== name) emit({k:'log', text:`${esc(name)} assumiu o lugar de ${esc(was)}`});
    }
    NET.conns.push(conn);
    emit({k:'log', text:`${esc(name)} entrou na sala`});
    sync();
    if(H.phase === 'game') step();
  }
  function reject(conn, why){ try{ conn.send({t:'reject', why}); }catch(_){} setTimeout(() => { try{ conn.close(); }catch(_){} }, 600); }
  function guestLeave(cid){
    const i = NET.conns.findIndex(c => c.peer === cid); if(i < 0) return;
    NET.conns.splice(i,1);
    const s = seatOf(cid); if(s < 0) return;
    const name = H.seats[s].name;
    if(H.phase === 'lobby') H.seats[s] = null;
    else { Object.assign(H.seats[s], {human:false, online:false, cid:null}); seatWentBot(s); }
    emit({k:'log', text:`${esc(name)} saiu${H.phase === 'lobby' ? '' : ' — um bot assume até voltar'}`});
    sync();
  }

  /* --------------------------- INTERFACE -------------------------------- */
  function addLog(html){
    logLines.unshift(html); logLines = logLines.slice(0,40);
    const h = logLines.map(l => `<div>${l}</div>`).join('');
    $$('.logbox').forEach(b => b.innerHTML = h);
  }
  function bubble(seat, text){
    const st = $('#stage'), el = st && st.querySelector(`[data-seat="${seat}"]`);
    if(!el){ return; }
    const r = el.getBoundingClientRect(), sr = st.getBoundingClientRect();
    const b = document.createElement('div'); b.className = 'bubble'; b.textContent = text;
    b.style.left = clamp(r.left - sr.left + r.width/2 - 60, 4, sr.width - 160) + 'px';
    b.style.top = Math.max(4, r.top - sr.top - 34) + 'px';
    st.appendChild(b); setTimeout(() => b.remove(), 2200);
  }
  function applyEvent(e){
    if(!e) return;
    const me = VIEW ? VIEW.me : 0;
    switch(e.k){
      case 'log': addLog(e.text); break;
      case 'chat':
        addLog(`<span class="cn">${esc(e.name)}:</span> ${esc(e.text)}`);
        if(!$('#sidebox') || !$('#sidebox').classList.contains('open')) $('#bChat') && $('#bChat').classList.add('dot');
        bubble(e.seat, e.text.length > 40 ? e.text.slice(0,40) + '…' : e.text); Snd.msg(); break;
      case 'say': bubble(e.seat, e.text); break;
      case 'banner': banner(e.text, e.bad); break;
      case 'toast': if(e.seat == null || e.seat === me){ toast(e.text); if(e.seat === me) Snd.error(); } break;
      case 'snd': Snd[e.s] && Snd[e.s](); break;
      case 'over': {
        const res = e.draw ? 'd' : (e.winners.includes(me) ? 'w' : 'l');
        if(me >= 0 && NET.role){ Stats.add(D.id, res); }
        if(res === 'w'){ confetti(); Snd.fanfare(); } else if(res === 'l') Snd.lose();
        break;
      }
    }
    if(D.onEvent) try{ D.onEvent(e, VIEW, ui); }catch(err){ console.error(err); }
  }

  const ui = {
    get view(){ return VIEW; },
    get stage(){ return $('#stage'); },
    act(a){ toHost({t:'act', a}); },
    bubble, toast, log:addLog,
    rerender(){ render(); },
    isMyTurn(){ return !!(VIEW && VIEW.waiting.includes(VIEW.me)); }
  };

  function buildDOM(){
    const opts = (D.options || []).map(o => `<div><label class="lbl" for="opt_${o.key}">${esc(o.label)}</label>
      <select class="sel" id="opt_${o.key}">${o.choices.map(c => `<option value="${esc(c[0])}">${esc(c[1])}</option>`).join('')}</select></div>`).join('');
    const ropts = (D.options || []).map(o => `<div><label class="small" style="display:block;text-align:left;margin:0 0 4px">${esc(o.label)}</label>
      <select class="sel" id="ropt_${o.key}">${o.choices.map(c => `<option value="${esc(c[0])}">${esc(c[1])}</option>`).join('')}</select></div>`).join('');
    document.body.insertAdjacentHTML('afterbegin', `
<div class="screen" id="home"><div class="panel">
  <div class="title">${D.icon || ''} ${esc(D.name.toUpperCase())}</div>
  <div class="subtitle">${esc(D.tagline || (D.solo ? 'Para jogar sozinho' : 'Online ou contra bots'))}</div>
  ${D.solo ? '' : `<div class="field"><label for="nameIn">Seu nome</label><input class="txt" id="nameIn" maxlength="16" placeholder="Como te chamam na mesa?"></div>`}
  ${opts ? `<div class="field"><div class="row" style="flex-wrap:wrap">${opts}</div></div>` : ''}
  ${D.solo ? `<button class="big g" id="bSolo">Jogar</button>` : `
  <button class="big g" id="bCreate">Criar sala online</button>
  <div class="field"><label for="codeIn">Entrar numa sala</label>
    <div class="row"><input class="txt code" id="codeIn" maxlength="5" placeholder="CÓDIGO">
    <button class="big y" id="bJoin" style="flex:0 0 auto;width:auto;margin:0;padding:0 20px">Entrar</button></div></div>
  <div class="sep">ou</div>
  <button class="big d" id="bSolo">Jogar contra bots (offline)</button>`}
  <button class="big d ghost" id="bRules1">Ver regras</button>
  <a class="big d ghost" href="../index.html" style="display:block;text-align:center;text-decoration:none">← Central de Jogos</a>
  <div class="msg" id="homeMsg"></div><div class="small" id="histHome"></div>
</div></div>
<div class="screen hidden" id="room"><div class="panel">
  <div class="codebox"><div class="lbl">${esc(D.name.toUpperCase())} · CÓDIGO DA SALA</div><div class="code" id="roomCode">-----</div>
    <div class="row" style="justify-content:center;margin-top:6px">
      <button class="tbtn" id="bCopyCode" style="flex:0 0 auto">Copiar código</button>
      <button class="tbtn" id="bCopyLink" style="flex:0 0 auto">Copiar link</button></div></div>
  ${ropts ? `<div class="row" style="flex-wrap:wrap;margin-bottom:6px">${ropts}</div>` : ''}
  <div class="seats" id="seatGrid"></div>
  <p class="small" style="margin:0 0 10px">Clique num lugar vago para trocar. Lugares vazios viram bots ao iniciar.</p>
  <div class="logbox"></div>
  <form id="roomChat" class="row" style="margin-bottom:12px"><input class="txt" id="roomChatIn" maxlength="120" placeholder="Mensagem para a sala..."></form>
  <button class="big g" id="bStart">Iniciar partida</button>
  <div class="msg" id="roomMsg"></div>
  <button class="big d" id="bLeave1">Sair da sala</button>
</div></div>
<div id="game" class="hidden">
  <div class="gtop">
    <div class="gname">${D.icon || ''} ${esc(D.name)}<small id="gmode"></small></div>
    <div id="ginfo"></div>
    <div class="tools">
      <button class="tbtn" id="bRules2" title="Regras"><span class="ico">📖</span><span class="txt">Regras</span></button>
      <button class="tbtn" id="bSom" title="Som"><span class="ico" id="somIco">🔊</span><span class="txt" id="somTxt">Som</span></button>
      ${D.solo ? '' : `<button class="tbtn" id="bChat" title="Histórico e chat">💬</button>`}
      <button class="tbtn" id="bVel" title="Velocidade dos bots"><span class="ico">⏩</span><span class="txt" id="velTxt">Veloc.</span></button>
      <button class="tbtn" id="bLeave2" title="Sair"><span class="ico">✕</span><span class="txt">Sair</span></button>
    </div>
  </div>
  <div id="stage"></div>
  <div id="sidebox"><div class="logbox"></div><form id="chatForm"><input id="chatIn" maxlength="120" placeholder="Falar na mesa..."></form></div>
</div>`);
    ensureUI();
  }

  function renderRoom(v){
    $('#roomCode').textContent = v.code || '-----';
    const g = $('#seatGrid'); const n = v.seats.length;
    g.className = 'seats' + (n === 1 ? ' one' : '');
    let html = '';
    for(let s=0;s<n;s++){
      const x = v.seats[s];
      const t = x ? x.team : (D.team ? D.team(s, n, v.opts) : null);
      const lbl = x ? x.label : (D.seatLabel ? D.seatLabel(s, n, v.opts) : '');
      html += `<div class="seatbox ${x ? 'taken' : 'free'} ${s === v.me ? 'mine' : ''} ${t != null ? 't' + t : ''}" data-s="${s}">
        ${lbl ? `<span class="tm">${esc(lbl)}</span>` : ''}${x ? esc(x.name) + (s === v.me ? ' (você)' : '') + (x.host ? ' 👑' : '') : 'Vago — sentar aqui'}</div>`;
    }
    g.innerHTML = html;
    $$('.seatbox.free', g).forEach(b => b.onclick = () => toHost({t:'sit', seat:+b.dataset.s}));
    const isHost = NET.role === 'host';
    (D.options || []).forEach(o => { const el = $('#ropt_' + o.key); el.value = v.opts[o.key]; el.disabled = !isHost; });
    $('#bStart').classList.toggle('hidden', !isHost);
    const humans = v.seats.filter(Boolean).length;
    $('#roomMsg').textContent = (isHost ? (humans < n ? `${humans} jogador(es) na sala. ${n-humans} lugar(es) serão bots.` : 'Mesa completa!') : 'Aguardando o anfitrião iniciar a partida...')
      + (isHost && IS_IOS ? ' ⚠️ No iPhone, não troque de app nem bloqueie a tela enquanto for anfitrião.' : '');
    $('#bCopyLink').classList.toggle('hidden', !/^https?:/.test(location.protocol));
  }
  function renderOver(v){
    if(v.phase === 'over' && v.lastOver && overShown !== v.lastOver.gameNo){
      overShown = v.lastOver.gameNo;
      const lo = v.lastOver, me = v.me;
      const title = lo.draw ? '🤝 Empate!' : (lo.winners.includes(me) ? '🏆 Você venceu!' : '😩 Não foi dessa vez...');
      const st = Stats.get(D.id);
      const tally = v.seats.length > 1 ? `<p style="font-size:13px;opacity:.85">Vitórias nesta mesa: ${v.seats.map((s,i) => `${esc(s.name)} ${v.tally[i]||0}`).join(' · ')}</p>` : '';
      const html = `<h2>${title}</h2>${lo.text ? `<p>${lo.text}</p>` : ''}${tally}
        <p style="font-size:13px;opacity:.8">Seu histórico em ${esc(D.name)}: ${st.w} vitória(s) · ${st.l} derrota(s)${st.d ? ' · ' + st.d + ' empate(s)' : ''}</p>`;
      if(NET.role === 'solo') modal(html, [{label:'Jogar de novo', fn:() => toHost({t:'again'})}, {label:'Menu', cls:'b-no', fn:leave}], 'over');
      else if(NET.role === 'host') modal(html, [{label:'Nova partida', fn:() => toHost({t:'again'})}, {label:'Voltar à sala', cls:'b-no', fn:() => toHost({t:'lobby'})}], 'over');
      else modal(html + '<p class="hint">Aguardando o anfitrião...</p>', [{label:'OK'}], 'over');
    } else if(v.phase !== 'over' && modalTag === 'over') closeModal();
  }
  function render(){
    const v = VIEW, inHome = !NET.role || !v;
    $('#home').classList.toggle('hidden', !inHome);
    $('#room').classList.toggle('hidden', inHome || v.phase !== 'lobby');
    $('#game').classList.toggle('hidden', inHome || v.phase === 'lobby');
    if(inHome) return;
    if(v.phase === 'lobby'){ renderRoom(v); return; }
    $('#gmode').textContent = [v.solo ? (D.solo ? '' : 'CONTRA BOTS') : 'SALA ' + v.code, D.modeLabel ? D.modeLabel(v.opts) : ''].filter(Boolean).join(' · ');
    if(v.game){
      try{ $('#ginfo').innerHTML = D.topInfo ? D.topInfo(v.game, v) : ''; }catch(e){ console.error(e); }
      try{ D.render(v.game, v, ui); }catch(e){ console.error(e); }
    }
    $('#bVel').classList.toggle('hidden', NET.role === 'guest' || !!D.solo);
    renderOver(v);
  }

  /* ------------------------ criar / entrar / sair ----------------------- */
  const homeMsg = t => $('#homeMsg').textContent = t;
  function readOpts(prefix){
    const o = {};
    (D.options || []).forEach(op => { const el = $('#' + prefix + op.key); let val = el ? el.value : op.default;
      const ch = op.choices.find(c => String(c[0]) === String(val)); o[op.key] = ch ? ch[0] : op.default; });
    return o;
  }
  function getName(){
    if(D.solo) return CFG.name || 'Você';
    const n = cleanName($('#nameIn').value);
    if(!n){ homeMsg('Digite seu nome primeiro.'); $('#nameIn').focus(); return null; }
    CFG.name = n; saveCfg(); return n;
  }
  function checkPeer(){
    if(D.solo) return false;
    if(typeof Peer === 'undefined'){
      $('#bCreate').disabled = true; $('#bJoin').disabled = true;
      homeMsg('Sem internet: o modo online está indisponível. Contra bots funciona normalmente.');
      return false;
    }
    return true;
  }
  function setBusy(b){ ['#bCreate','#bJoin','#bSolo'].forEach(id => { const e = $(id); if(e) e.disabled = b; }); if(!b) checkPeer(); }
  function startSolo(){
    const name = getName(); if(!name) return;
    H.opts = readOpts('opt_'); lsSet('central.opts.' + D.id, H.opts);
    NET.role = 'solo'; NET.code = '';
    H.seats = Array(nSeats()).fill(null); H.seats[0] = {name, cid:'host', human:true, online:true, wasHuman:true};
    startGame();
  }
  function createRoom(){
    const name = getName(); if(!name || !checkPeer()) return;
    H.opts = readOpts('opt_'); lsSet('central.opts.' + D.id, H.opts);
    setBusy(true); homeMsg('Criando sala...');
    const attempt = n => {
      const code = genCode(), peer = new Peer('central-v1-' + D.id + '-' + code, PEER_OPTS);
      let opened = false;
      peer.on('open', () => {
        opened = true; NET.role = 'host'; NET.peer = peer; NET.code = code;
        H.phase = 'lobby'; H.seats = Array(nSeats()).fill(null);
        H.seats[0] = {name, cid:'host', human:true, online:true, wasHuman:true};
        addLog(`Sala <b>${code}</b> criada. Passe o código para os amigos!`); homeMsg('');
        try{ history.replaceState(null, '', '#' + code); }catch(_){}
        sync();
      });
      peer.on('connection', onGuestConn);
      peer.on('disconnected', () => { if(!NET.leaving){ try{ peer.reconnect(); }catch(_){} } });
      peer.on('error', err => {
        if(opened) return;
        try{ peer.destroy(); }catch(_){}
        if(err.type === 'unavailable-id' && n < 4) attempt(n+1);
        else { setBusy(false); homeMsg('Não foi possível criar a sala (' + err.type + '). Verifique a internet.'); }
      });
    };
    attempt(0);
  }
  function joinRoom(){
    const name = getName(); if(!name || !checkPeer()) return;
    const code = String($('#codeIn').value).toUpperCase().replace(/[^A-Z0-9]/g,'');
    if(code.length !== 5){ homeMsg('O código da sala tem 5 caracteres.'); return; }
    setBusy(true); homeMsg('Conectando na sala ' + code + '...');
    const peer = new Peer(undefined, PEER_OPTS);
    let done = false;
    const fail = msg => { if(done) return; done = true; try{ peer.destroy(); }catch(_){} NET.role = null; VIEW = null; render(); setBusy(false); homeMsg(msg); };
    peer.on('open', () => {
      const conn = peer.connect('central-v1-' + D.id + '-' + code, {reliable:true, serialization:'json'});
      const timer = setTimeout(() => { if(!conn.open) fail('Não deu para conectar. Tente outra rede (ex.: Wi-Fi em vez de 4G).'); }, 15000);
      conn.on('open', () => {
        clearTimeout(timer); done = true;
        NET.role = 'guest'; NET.peer = peer; NET.conn = conn; NET.code = code;
        conn.send({t:'hello', name}); homeMsg('');
        try{ history.replaceState(null, '', '#' + code); }catch(_){}
      });
      conn.on('data', m => {
        if(!m) return;
        if(m.t === 'view'){ VIEW = m.v; render(); }
        else if(m.t === 'ev') applyEvent(m.e);
        else if(m.t === 'reject'){ NET.leaving = true; fail(m.why); }
      });
      conn.on('close', hostGone);
    });
    peer.on('error', err => {
      if(err.type === 'peer-unavailable') fail('Sala não encontrada. Confira o código e o jogo (o anfitrião precisa estar com a sala aberta).');
      else if(!done) fail('Erro de conexão (' + err.type + ').');
      else if(NET.role === 'guest' && (err.type === 'network' || err.type === 'disconnected')) hostGone();
    });
  }
  function hostGone(){
    if(NET.leaving || NET.role !== 'guest') return;
    NET.leaving = true; closePModal();
    modal('<h2>Conexão perdida</h2><p>A conexão caiu (no celular acontece ao trocar de app ou bloquear a tela) ou o anfitrião saiu. Tente reconectar — o bot devolve o seu lugar.</p>',
      [{label:'Reconectar', fn:() => { try{ sessionStorage.setItem('central.autojoin', NET.code); }catch(_){}
          try{ NET.peer && NET.peer.destroy(); }catch(_){} location.href = location.href.split('#')[0] + '#' + NET.code; location.reload(); }},
       {label:'Voltar ao início', cls:'b-no', fn:leave}]);
  }
  function leave(){ NET.leaving = true; try{ NET.peer && NET.peer.destroy(); }catch(_){} location.href = location.href.split('#')[0]; }
  function confirmLeave(){
    if(NET.role === 'host' && NET.conns.length) modal('<h2>Sair da sala?</h2><p>Você é o anfitrião: se sair, a sala fecha para todos.</p>', [{label:'Sair mesmo', cls:'b-up', fn:leave}, {label:'Ficar', cls:'b-no'}]);
    else if(NET.role === 'solo' && H.phase === 'game') modal('<h2>Sair da partida?</h2><p>A partida atual será abandonada.</p>', [{label:'Sair', cls:'b-up', fn:leave}, {label:'Continuar', cls:'b-no'}]);
    else leave();
  }
  function showRules(){ modal(`<h2>Regras — ${esc(D.name)}</h2>` + (typeof D.rules === 'function' ? D.rules(H.opts) : D.rules || ''), [{label:'Entendi'}]); }
  function copy(text, ok){
    const done = () => { $('#roomMsg').textContent = ok; };
    if(navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, () => prompt('Copie:', text));
    else prompt('Copie:', text);
  }

  function wire(){
    $('#bRules1').onclick = showRules; $('#bRules2').onclick = showRules;
    if($('#bCreate')) $('#bCreate').onclick = createRoom;
    if($('#bJoin')) $('#bJoin').onclick = joinRoom;
    if($('#codeIn')) $('#codeIn').addEventListener('keydown', e => { if(e.key === 'Enter') joinRoom(); });
    $('#bSolo').onclick = startSolo;
    $('#bStart').onclick = () => toHost({t:'start'});
    (D.options || []).forEach(o => { const el = $('#ropt_' + o.key); if(el) el.onchange = () => toHost({t:'opts', opts:readOpts('ropt_')}); });
    $('#bLeave1').onclick = confirmLeave; $('#bLeave2').onclick = confirmLeave;
    $('#bCopyCode').onclick = () => copy(NET.code, 'Código copiado!');
    $('#bCopyLink').onclick = () => copy(shareLink(NET.code), 'Link copiado!');
    const sendChat = inp => { const t = inp.value.trim(); if(t){ toHost({t:'chat', text:t}); inp.value = ''; } };
    $('#roomChat').onsubmit = e => { e.preventDefault(); sendChat($('#roomChatIn')); };
    $('#chatForm').onsubmit = e => { e.preventDefault(); sendChat($('#chatIn')); };
    if($('#bChat')) $('#bChat').onclick = () => { $('#sidebox').classList.toggle('open'); $('#bChat').classList.remove('dot'); };
    $('#stage').addEventListener('click', () => $('#sidebox').classList.remove('open'));
    const refreshSom = () => { $('#somIco').textContent = CFG.sound ? '🔊' : '🔇'; $('#somTxt').textContent = CFG.sound ? '🔊 Som' : '🔇 Som'; };
    $('#bSom').onclick = () => { CFG.sound = !CFG.sound; saveCfg(); refreshSom(); };
    const VELS = [[1,'Normal'],[0.55,'Rápida'],[1.6,'Lenta']];
    const velLabel = () => { const n = (VELS.find(x => x[0] === CFG.speed) || VELS[0])[1]; $('#velTxt').textContent = 'Veloc.: ' + n; $('#bVel').title = 'Velocidade: ' + n; };
    $('#bVel').onclick = () => { const i = VELS.findIndex(x => x[0] === CFG.speed); CFG.speed = VELS[(i+1) % VELS.length][0]; saveCfg(); velLabel(); };
    refreshSom(); velLabel();
    window.addEventListener('beforeunload', e => { if(NET.role === 'host' && NET.conns.length && !NET.leaving){ e.preventDefault(); e.returnValue = ''; } });
    document.addEventListener('visibilitychange', () => {
      if(document.visibilityState !== 'visible') return;
      if(NET.role === 'host' && NET.peer && NET.peer.disconnected && !NET.peer.destroyed){ try{ NET.peer.reconnect(); }catch(_){} }
      if(NET.role === 'guest' && NET.conn && !NET.conn.open) hostGone();
    });
  }

  function run(def){
    D = def;
    document.documentElement.classList.add('app');
    document.title = def.name + ' — Central de Jogos';
    buildDOM(); wire();
    if($('#nameIn')) $('#nameIn').value = CFG.name || '';
    const saved = lsGet('central.opts.' + D.id) || {};
    const qs = new URLSearchParams(location.search);
    (D.options || []).forEach(o => {
      const el = $('#opt_' + o.key);
      let val = qs.get(o.key) != null ? qs.get(o.key) : (saved[o.key] != null ? saved[o.key] : o.default);
      if(el){ el.value = val; if(el.value === '' || el.value == null) el.value = o.default; }
    });
    const st = Stats.get(D.id);
    $('#histHome').textContent = (st.w || st.l || st.d) ? `Seu histórico: ${st.w} vitória(s) · ${st.l} derrota(s)${st.d ? ' · ' + st.d + ' empate(s)' : ''}` : '';
    if(location.hash.length > 1 && $('#codeIn')) $('#codeIn').value = location.hash.slice(1).toUpperCase().slice(0,5);
    checkPeer(); render();
    let auto = null; try{ auto = sessionStorage.getItem('central.autojoin'); sessionStorage.removeItem('central.autojoin'); }catch(_){}
    if(auto && $('#codeIn') && CFG.name && typeof Peer !== 'undefined'){ $('#codeIn').value = auto; joinRoom(); }
    else if(D.solo && qs.get('play') === '1') startSolo();
  }

  return { run, ui, _H:H, _NET:NET, _act:act, _step:step, _hostHandle:hostHandle };
})();
