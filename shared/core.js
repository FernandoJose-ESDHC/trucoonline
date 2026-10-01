/* =====================================================================
   Central de Jogos — utilitários compartilhados (cartas, som, modais…)
   Carregado por todos os jogos da pasta /games e pela central.
   ===================================================================== */
"use strict";
const $ = (s, el=document) => el.querySelector(s);
const $$ = (s, el=document) => [...el.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pick = a => a[Math.floor(Math.random()*a.length)];
const clamp = (x,a,b) => Math.max(a, Math.min(b, x));
const cleanName = s => String(s||'').replace(/\s+/g,' ').trim().slice(0,16);
function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function lsGet(k){ try{ return JSON.parse(localStorage.getItem(k)); }catch(e){ return null; } }
function lsSet(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
const IS_IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

/* ---------- configurações globais (valem para todos os jogos) ---------- */
const CFG = Object.assign({speed:1, sound:true, name:''}, lsGet('central.cfg') || {});
{ // migração do truco antigo
  const old = lsGet('trucoMineiroNome'); if(!CFG.name && old) CFG.name = old;
  const oc = lsGet('trucoMineiroCfg'); if(oc && lsGet('central.cfg') === null){ CFG.speed = oc.speed || 1; CFG.sound = oc.sound !== false; }
}
const saveCfg = () => lsSet('central.cfg', CFG);
const sleep = ms => new Promise(r => setTimeout(r, ms * CFG.speed));

/* ---------- estatísticas por jogo ---------- */
const Stats = {
  all(){ return lsGet('central.stats') || {}; },
  get(id){ return this.all()[id] || {w:0,l:0,d:0}; },
  add(id, res){ const a = this.all(); const s = a[id] || {w:0,l:0,d:0}; s[res] = (s[res]||0) + 1; a[id] = s; lsSet('central.stats', a); }
};

/* ---------- som (Web Audio, sem arquivos) ---------- */
let actx = null;
function unlockAudio(){
  try{
    actx = actx || new (window.AudioContext||window.webkitAudioContext)();
    if(actx.state === 'suspended') actx.resume();
    const b = actx.createBuffer(1,1,22050), s = actx.createBufferSource(); s.buffer = b; s.connect(actx.destination); s.start(0);
  }catch(e){}
}
['touchend','pointerdown','click'].forEach(ev => document.addEventListener(ev, unlockAudio, {passive:true}));
function beep(freq=440, dur=0.08, type='triangle', vol=0.08, delay=0){
  if(!CFG.sound) return;
  try{
    actx = actx || new (window.AudioContext||window.webkitAudioContext)();
    const t0 = actx.currentTime + delay, o = actx.createOscillator(), g = actx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(actx.destination); o.start(t0); o.stop(t0 + dur);
  }catch(e){}
}
const Snd = {
  card: () => beep(300 + Math.random()*80, 0.06, 'square', 0.035),
  move: () => beep(220, 0.06, 'triangle', 0.07),
  capture: () => { beep(160, 0.08, 'square', 0.06); beep(120, 0.1, 'square', 0.05, 0.05); },
  deal: (n=12) => { for(let i=0;i<n;i++) beep(420 + Math.random()*120, 0.03, 'square', 0.02, i*0.06); },
  alert: () => { beep(220,0.15,'sawtooth',0.07); beep(330,0.22,'sawtooth',0.07,0.12); },
  win: () => [523,659,784].forEach((f,i) => beep(f,0.15,'triangle',0.08,i*0.11)),
  lose: () => [392,330,262].forEach((f,i) => beep(f,0.18,'triangle',0.08,i*0.13)),
  fanfare: () => [523,659,784,1046,784,1046].forEach((f,i) => beep(f,0.18,'triangle',0.09,i*0.12)),
  msg: () => beep(880,0.05,'sine',0.04),
  error: () => beep(140,0.12,'sawtooth',0.05)
};

/* ---------- cartas ---------- */
// carta = {r:'A'|'2'..'10'|'J'|'Q'|'K'|'JK', s:'♣♥♠♦'}; id opcional
const SUITS = ['♣','♥','♠','♦'];
const isRed = c => c && (c.s === '♥' || c.s === '♦');
const ck = c => c ? (c.id != null ? c.id : c.r + c.s) : 'X';
function makeDeck({ranks, decks=1, jokers=0}){
  const d = []; let id = 0;
  for(let k=0;k<decks;k++){
    for(const s of SUITS) for(const r of ranks) d.push({r, s, id: 'c' + (id++)});
    for(let j=0;j<jokers/decks;j++) d.push({r:'JK', s:j%2 ? '♥' : '♣', id:'c' + (id++)});
  }
  return d;
}
const RANKS13 = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
function cardEl(c, {back=false, label='', cls=''}={}){
  const d = document.createElement('div');
  if(back || !c){ d.className = 'card back ' + cls; return d; }
  if(c.r === 'JK'){
    d.className = 'card joker ' + (isRed(c) ? 'red ' : '') + cls;
    d.innerHTML = `<span class="tl">★</span><span class="mid">🃏</span><span class="br">★</span>`;
    return d;
  }
  d.className = 'card ' + (isRed(c) ? 'red ' : '') + cls;
  d.innerHTML = `<span class="tl">${c.r}<br>${c.s}</span><span class="mid">${c.s}</span><span class="br">${c.r}<br>${c.s}</span>` +
                (label ? `<span class="nm">${esc(label)}</span>` : '');
  return d;
}

/* ---------- animações ---------- */
function anim(el, kf, opts){ try{ return el && el.animate ? el.animate(kf, opts) : null; }catch(e){ return null; } }
function flyFrom(el, from, {delay=0, dur=380, rot=0}={}){
  if(!el || !from) return;
  const to = el.getBoundingClientRect(); if(!to.width) return;
  const dx = (from.left + from.width/2) - (to.left + to.width/2), dy = (from.top + from.height/2) - (to.top + to.height/2);
  const sc = from.width ? clamp(from.width/to.width, .35, 1.6) : .6;
  anim(el, [{transform:`translate(${dx}px,${dy}px) rotate(${rot}deg) scale(${sc})`},{transform:'none'}],
       {duration:dur, delay, easing:'cubic-bezier(.2,.8,.25,1)', fill:'backwards'});
}
function bump(el){ if(!el) return; el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }

/* ---------- elementos globais (banner, toast, confete, modais) ---------- */
function ensureUI(){
  if($('#banner')) return;
  document.body.insertAdjacentHTML('beforeend',
    '<div id="banner"></div><div id="toast"></div><canvas id="confetti"></canvas>' +
    '<div id="modal" class="mwrap"><div class="box" id="mbox"></div></div><div id="pmodal" class="mwrap"><div class="box" id="pbox"></div></div>');
}
let bannerT = null;
function banner(text, bad=false){ ensureUI(); const b = $('#banner'); b.innerHTML = `<span class="bn ${bad?'bad':''}">${esc(text)}</span>`; clearTimeout(bannerT); bannerT = setTimeout(()=>b.innerHTML='', 1400); }
let toastT = null;
function toast(text, ms=2200){ ensureUI(); const t = $('#toast'); t.textContent = text; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(()=>t.classList.remove('show'), ms); }
let modalTag = null;
function _modal(which, html, buttons, tag){
  ensureUI();
  const box = $(which === 'p' ? '#pbox' : '#mbox'), wrap = $(which === 'p' ? '#pmodal' : '#modal');
  box.innerHTML = html + (buttons && buttons.length ? '<div class="btns"></div>' : '');
  const bw = box.querySelector('.btns');
  (buttons||[]).forEach(b => {
    const el = document.createElement('button');
    el.className = b.cls || 'b-ok'; el.textContent = b.label;
    el.onclick = () => { if(b.keep) { b.fn && b.fn(); return; } wrap.classList.remove('show'); if(which !== 'p') modalTag = null; b.fn && b.fn(); };
    bw.appendChild(el);
  });
  wrap.classList.add('show');
  if(which !== 'p') modalTag = tag || null;
  return box;
}
const modal = (html, buttons, tag) => _modal('m', html, buttons, tag);
const pmodal = (html, buttons) => _modal('p', html, buttons);
function closeModal(){ $('#modal') && $('#modal').classList.remove('show'); modalTag = null; }
function closePModal(){ $('#pmodal') && $('#pmodal').classList.remove('show'); }
function confetti(){
  ensureUI();
  const cv = $('#confetti'); const ctx = cv.getContext && cv.getContext('2d');
  if(!ctx || !window.requestAnimationFrame) return;
  cv.width = innerWidth; cv.height = innerHeight;
  const cols = ['#e7b43a','#3ecf7a','#ff5a5a','#ffffff','#5ab0ff'];
  const ps = Array.from({length:170}, () => ({x:innerWidth/2+(Math.random()-.5)*200, y:innerHeight*.35, vx:(Math.random()-.5)*16, vy:-Math.random()*16-4,
    s:4+Math.random()*6, r:Math.random()*6, vr:(Math.random()-.5)*.4, c:pick(cols)}));
  const t0 = performance.now();
  (function f(t){
    ctx.clearRect(0,0,cv.width,cv.height);
    ps.forEach(p => { p.vy += .35; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.s/2,-p.s/4,p.s,p.s/2); ctx.restore(); });
    if(t - t0 < 3300) requestAnimationFrame(f); else ctx.clearRect(0,0,cv.width,cv.height);
  })(t0);
}

/* ---------- tela acesa durante o jogo ---------- */
let wakeLock = null;
async function keepAwake(){
  try{
    if(!('wakeLock' in navigator) || document.visibilityState !== 'visible') return;
    if(wakeLock && !wakeLock.released) return;
    wakeLock = await navigator.wakeLock.request('screen');
  }catch(_){}
}
document.addEventListener('visibilitychange', () => { if(document.visibilityState === 'visible') keepAwake(); });
['click','touchend'].forEach(ev => document.addEventListener(ev, keepAwake, {passive:true}));

/* ---------- PWA: funciona offline depois da 1ª visita ---------- */
if('serviceWorker' in navigator && /^https?:/.test(location.protocol)){
  window.addEventListener('load', () => {
    const base = (document.querySelector('script[src*="shared/core.js"]') || {}).src || '';
    const sw = base.replace(/shared\/core\.js.*$/, 'sw.js');
    if(sw) navigator.serviceWorker.register(sw).catch(()=>{});
  });
  // quando sai uma versão nova, recarrega uma vez para já usar ela
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if(reloaded || !navigator.serviceWorker.controller) return;
    reloaded = true;
    if(!document.querySelector('html.app') || document.querySelector('#home:not(.hidden)')) location.reload();
  });
}
