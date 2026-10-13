/* =====================================================================
   Central de Jogos — opções em "botões" (chips) em vez de listas.
   Todo <select class="sel"> vira uma fileira de botões tocáveis, que
   quebram linha no celular. O <select> continua existindo (escondido),
   então o código dos jogos que lê/grava .value e .disabled segue igual.
   ===================================================================== */
(function(){
  "use strict";
  const css = `
.chipsel{display:flex;flex-wrap:wrap;gap:6px;margin-top:2px}
.chipsel button{flex:0 1 auto;min-height:40px;display:inline-flex;align-items:center;justify-content:center;padding:8px 14px;border-radius:999px;border:2px solid rgba(255,255,255,.22);
  background:rgba(0,0,0,.28);color:#e8fff2;font:inherit;font-size:14.5px;font-weight:700;cursor:pointer;line-height:1.15;
  transition:background .15s,border-color .15s,transform .08s;-webkit-tap-highlight-color:transparent;text-align:center}
.chipsel button:active{transform:scale(.96)}
.chipsel button.on{background:var(--gold,#e7b43a);border-color:var(--gold,#e7b43a);color:#3a2600;box-shadow:0 3px 10px rgba(231,180,58,.35)}
.chipsel button[data-lv="facil"].on{background:#3ecf7a;border-color:#3ecf7a;color:#06301a;box-shadow:0 3px 10px rgba(62,207,122,.35)}
.chipsel button[data-lv="dificil"].on{background:#e2504a;border-color:#e2504a;color:#fff;box-shadow:0 3px 10px rgba(226,80,74,.35)}
.chipsel button[data-lv]::before{content:"";display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:7px;vertical-align:1px;background:currentColor;opacity:.75}
.chipsel button[data-lv="facil"]:not(.on)::before{background:#3ecf7a;opacity:1}
.chipsel button[data-lv="normal"]:not(.on)::before{background:#e7b43a;opacity:1}
.chipsel button[data-lv="dificil"]:not(.on)::before{background:#e2504a;opacity:1}
.chipsel.dis button{opacity:.55;cursor:default}
.chipsel.dis button.on{opacity:.9}
select.sel.chipped{display:none!important}`;
  const st = document.createElement('style'); st.textContent = css;
  (document.head || document.documentElement).appendChild(st);

  const LV = {facil:'facil', fácil:'facil', normal:'normal', medio:'normal', 'médio':'normal', dificil:'dificil', 'difícil':'dificil'};
  const norm = s => String(s).toLowerCase().trim();
  const proto = HTMLSelectElement.prototype;
  const vDesc = Object.getOwnPropertyDescriptor(proto, 'value');
  const dDesc = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'disabled') || Object.getOwnPropertyDescriptor(proto, 'disabled');

  function enhance(sel){
    if(sel.dataset.chips || !sel.classList.contains('sel') || sel.multiple) return;
    sel.dataset.chips = '1';
    const box = document.createElement('div');
    box.className = 'chipsel'; box.setAttribute('role', 'radiogroup');
    const lab = sel.id && document.querySelector(`label[for="${sel.id}"]`);
    if(lab) box.setAttribute('aria-label', lab.textContent.trim());
    const build = () => {
      box.innerHTML = '';
      [...sel.options].forEach(o => {
        const b = document.createElement('button');
        b.type = 'button'; b.textContent = o.textContent; b.dataset.v = o.value;
        b.setAttribute('role', 'radio');
        const lv = LV[norm(o.value)] || LV[norm(o.textContent)];
        if(lv) b.dataset.lv = lv;
        b.onclick = () => {
          if(sel.disabled || sel.value === o.value) return;
          vDesc.set.call(sel, o.value); sync();
          sel.dispatchEvent(new Event('change', {bubbles:true}));
          sel.dispatchEvent(new Event('input', {bubbles:true}));
        };
        box.appendChild(b);
      });
      sync();
    };
    const sync = () => {
      const v = vDesc.get.call(sel);
      [...box.children].forEach(b => { const on = b.dataset.v === v; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
      box.classList.toggle('dis', !!dDesc.get.call(sel));
    };
    // o jogo continua usando sel.value = ... e sel.disabled = ...: os chips acompanham
    Object.defineProperty(sel, 'value', {configurable:true, get(){ return vDesc.get.call(this); }, set(v){ vDesc.set.call(this, v); sync(); }});
    if(dDesc) Object.defineProperty(sel, 'disabled', {configurable:true, get(){ return dDesc.get.call(this); }, set(v){ dDesc.set.call(this, v); sync(); }});
    new MutationObserver(build).observe(sel, {childList:true, subtree:true});
    sel.addEventListener('change', sync);
    sel.classList.add('chipped');
    sel.insertAdjacentElement('afterend', box);
    build();
  }
  function scan(root){ (root.querySelectorAll ? root : document).querySelectorAll('select.sel').forEach(enhance); }
  window.enhanceSelects = scan;
  const start = () => {
    scan(document);
    new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => { if(n.nodeType === 1){ if(n.matches && n.matches('select.sel')) enhance(n); else scan(n); } })))
      .observe(document.body, {childList:true, subtree:true});
  };
  if(document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
