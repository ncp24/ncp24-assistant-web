// NCP24 widget.js — frontend-only (no server changes)
(() => {
  const API_URL = "https://assistant-dev.ncp24.com/api/chat";

  // ===== Styles (self-contained) =====
  const css = `
:root{--ncp:#e10600;--bg:#fff;--text:#222;--muted:#777;--shadow:0 10px 30px rgba(0,0,0,.10)}
.ncp-fab{position:fixed;right:18px;bottom:18px;width:56px;height:56px;border-radius:50%;background:var(--ncp);color:#fff;display:grid;place-items:center;cursor:pointer;box-shadow:var(--shadow);z-index:999999}
.ncp-panel{position:fixed;right:18px;bottom:84px;width:380px;max-width:92vw;height:560px;max-height:80vh;background:var(--bg);border-radius:18px;box-shadow:var(--shadow);display:none;flex-direction:column;overflow:hidden;z-index:999998}
.ncp-panel.open{display:flex}
.ncp-head{background:var(--ncp);color:#fff;padding:12px 14px;display:flex;align-items:center;gap:10px}
.ncp-head .logo{width:22px;height:22px;border-radius:50%;background:#fff;color:var(--ncp);display:grid;place-items:center;font-weight:800}
.ncp-head h3{margin:0;font-size:16px;flex:1}
.ncp-close{all:unset;cursor:pointer;font-size:18px}
.ncp-body{padding:14px;gap:10px;display:flex;flex-direction:column;overflow:auto;flex:1;background:#f7f7f8}
.row{display:flex;gap:10px}
.avatar{width:28px;height:28px;border-radius:50%;flex:0 0 28px;display:grid;place-items:center;font-size:13px;font-weight:700}
.avatar.bot{background:#ffe6e6;color:#b40000}
.avatar.me{background:#e6f0ff;color:#0a4d9e}
.bubble{max-width:80%;padding:10px 12px;border-radius:16px;font-size:14px;line-height:1.38;box-shadow:0 1px 2px rgba(0,0,0,.05);white-space:pre-wrap}
.bubble.me{margin-left:auto;background:#e10600;color:#fff}
.bubble.bot{background:#fff;color:#222}
.cards{display:grid;gap:10px}
.card{background:#fff;border:1px solid #ededed;border-radius:14px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,.04)}
.card .media{width:100%;height:140px;background:#f2f2f2;object-fit:cover;display:block}
.card .content{padding:10px 12px}
.card .title{font-weight:800;margin:0 0 4px 0}
.card .desc{font-size:13px;color:#555;max-height:3.2em;overflow:hidden}
.card .footer{display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-top:1px solid #f0f0f0}
.card .domain{display:flex;align-items:center;gap:8px;font-size:12px;color:#777}
.card .domain img{width:16px;height:16px;border-radius:4px}
.card .btn{background:var(--ncp);color:#fff;text-decoration:none;padding:8px 12px;border-radius:10px;font-weight:700;font-size:13px}
.ncp-input{display:flex;gap:8px;padding:10px;background:#fff;border-top:1px solid #eee}
.ncp-input input{flex:1;border:1px solid #ddd;border-radius:20px;padding:10px 14px;font-size:14px}
.ncp-input button{background:var(--ncp);color:#fff;border:0;border-radius:20px;padding:10px 14px;font-weight:700;cursor:pointer}
.chips{display:flex;gap:8px;flex-wrap:wrap;margin:6px 0 2px 42px}
.chip{background:#fff;border:1px solid #eee;border-radius:999px;padding:6px 10px;font-size:12px;cursor:pointer}
.spinner{width:18px;height:18px;border:2px solid #ddd;border-top-color:#fff;border-left-color:#fff;border-radius:50%;animation:spin .8s linear infinite;display:inline-block}
@keyframes spin{to{transform:rotate(360deg)}}
@media (max-width:480px){
  .ncp-panel{right:0;left:0;bottom:0;top:0;width:100vw;height:100vh;max-width:none;max-height:none;border-radius:0}
}
`; const style=document.createElement("style"); style.textContent=css; document.head.appendChild(style);

  // ===== DOM =====
  if(!document.getElementById("ncpFab")){
    const fab=document.createElement("div"); fab.id="ncpFab"; fab.className="ncp-fab";
    fab.innerHTML=`<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M21 12c0 4.4-4 8-9 8-1.13 0-2.21-.18-3.21-.5L3 21l1.64-3.28C4.23 16.5 4 14.79 4 13c0-4.4 4.03-8 9-8s8 3.6 8 7z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    document.body.appendChild(fab);
  }
  if(!document.getElementById("ncpPanel")){
    const el=document.createElement("section"); el.id="ncpPanel"; el.className="ncp-panel";
    el.innerHTML=`
      <div class="ncp-head">
        <div class="logo">N</div><h3>NCP24 Assistant</h3>
        <button class="ncp-close" id="ncpClose" aria-label="Close">✕</button>
      </div>
      <div class="ncp-body" id="ncpBody"></div>
      <div class="chips" id="ncpChips"></div>
      <form class="ncp-input" id="ncpForm">
        <input id="ncpInput" placeholder="Frag mich auf DE/EN/TR/RU…" autocomplete="off" />
        <button id="ncpSend" type="submit">Senden</button>
      </form>`;
    document.body.appendChild(el);
  }

  // ===== Refs =====
  const fab=document.getElementById("ncpFab");
  const panel=document.getElementById("ncpPanel");
  const close=document.getElementById("ncpClose");
  const body=document.getElementById("ncpBody");
  const chips=document.getElementById("ncpChips");
  const form=document.getElementById("ncpForm");
  const input=document.getElementById("ncpInput");
  const send=document.getElementById("ncpSend");

  // ===== Helpers (frontend only) =====
  const escapeHtml=(s)=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const urlHost=(u)=>{ try{ return new URL(u).host.replace(/^www\./,''); }catch{ return ""; } };
  const favUrl=(domain)=>`https://icons.duckduckgo.com/ip3/${domain}.ico`; // favicon ohne Server
  const findMdLinks=(t)=>{ const re=/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,out=[]; let m; while((m=re.exec(t))!==null){out.push({label:m[1],url:m[2]});} return out;};
  const findBareUrls=(t)=>{ const re=/(https?:\/\/[^\s)]+)/g,out=[]; let m; while((m=re.exec(t))!==null){out.push({label:m[1],url:m[1]});} return out;};

  // optionale Bannerbilder je Kategorie (lege diese in deinem Pages-Repo an, z. B. /assets/beaches.jpg)
  const ASSETS_BASE = "https://assistant-api.ncp24.com/assets";
  const bannerFor = (labelOrUrl) => {
    const s=(labelOrUrl||"").toLowerCase();
    if(/beach|strand/.test(s)) return `${ASSETS_BASE}/beaches.jpg`;
    if(/casino/.test(s))      return `${ASSETS_BASE}/casino.jpg`;
    if(/hotel/.test(s))       return `${ASSETS_BASE}/hotels.jpg`;
    if(/sight|attraction|sehensw/.test(s)) return `${ASSETS_BASE}/sights.jpg`;
    if(/history|museum/.test(s)) return `${ASSETS_BASE}/history.jpg`;
    return ""; // kein Bild -> Card ohne media
  };

  const row=(who,node)=>{
    const wrap=document.createElement("div"); wrap.className="row";
    const av=document.createElement("div"); av.className=`avatar ${who}`; av.textContent=who==='bot'?'N':'Du';
    const bubble=document.createElement("div"); bubble.className=`bubble ${who}`; bubble.appendChild(node);
    if(who==='bot'){ wrap.appendChild(av); wrap.appendChild(bubble); } else { wrap.appendChild(bubble); wrap.appendChild(av); }
    body.appendChild(wrap); body.scrollTop=body.scrollHeight;
  };
  const textNode=(t)=>{ const p=document.createElement("div"); p.textContent=t; return p; };

  // Karten ohne Server-Preview: Titel = Label, Domain-Icon + optionales Banner per Kategorie
  function buildCards(urls){
    const grid=document.createElement("div"); grid.className="cards";
    urls.forEach(({label,url})=>{
      const domain=urlHost(url);
      const img=bannerFor(`${label} ${url}`);
      const card=document.createElement("div"); card.className="card";
      if(img){ const m=document.createElement("img"); m.className="media"; m.src=img; m.alt=label; card.appendChild(m); }
      const content=document.createElement("div"); content.className="content";
      content.innerHTML=`<div class="title">${escapeHtml(label||'Link')}</div>`;
      card.appendChild(content);
      const foot=document.createElement("div"); foot.className="footer";
      foot.innerHTML=`<div class="domain"><img src="${favUrl(domain)}" alt=""><span>${escapeHtml(domain)}</span></div>
                      <a class="btn" href="${url}" target="_blank" rel="noopener noreferrer">Öffnen</a>`;
      card.appendChild(foot);
      grid.appendChild(card);
    });
    return grid;
  }

  async function renderBotReply(text){
    const lines=String(text).split(/\n+/).filter(Boolean);
    for(const line of lines){
      const md=findMdLinks(line);
      const bare=md.length?[]:findBareUrls(line);
      const labelMatch=line.match(/^\s*([A-Za-zÄÖÜäöü0-9\s&-]+):\s*(.*)$/);

      if(md.length || bare.length){
        const cards=buildCards(md.length?md:bare);
        row('bot', cards);
      } else if(labelMatch){
        const strong=document.createElement("div");
        strong.innerHTML=`<strong>${escapeHtml(labelMatch[1])}:</strong> ${escapeHtml(labelMatch[2])}`;
        row('bot', strong);
      } else {
        row('bot', textNode(line));
      }
    }
  }

  function sendUser(text){ row('me', textNode(text)); }

  async function sendMessage(msg){
    sendUser(msg);
    input.value=""; send.disabled=true;
    const sp=document.createElement("div"); sp.innerHTML='<span class="spinner"></span>'; row('bot', sp);
    try{
      const r=await fetch(API_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:msg})});
      const data=await r.json();
      body.removeChild(body.lastElementChild);
      await renderBotReply(data.reply || "❌ Keine Antwort erhalten.");
    }catch(e){
      body.removeChild(body.lastElementChild);
      await renderBotReply("❌ Fehler bei der Anfrage. Bitte erneut versuchen.");
    }finally{
      send.disabled=false; input.focus();
    }
  }

  // Quick Chips
  const QUICK=["Beaches","Sights & Attractions","Casinos","Hotels","Districts","History"];
  function buildChips(){
    chips.innerHTML="";
    QUICK.forEach(q=>{
      const c=document.createElement("div"); c.className="chip"; c.textContent=q;
      c.addEventListener("click",()=>sendMessage(q));
      chips.appendChild(c);
    });
  }

  // Events
  const fab=document.getElementById("ncpFab");
  const panel=document.getElementById("ncpPanel");
  const close=document.getElementById("ncpClose");
  const body=document.getElementById("ncpBody");
  const chips=document.getElementById("ncpChips");
  const form=document.getElementById("ncpForm");
  const input=document.getElementById("ncpInput");
  const send=document.getElementById("ncpSend");

  fab.addEventListener("click", ()=>{
    panel.classList.add("open");
    if(!body.children.length){
      renderBotReply("👋 Willkommen! Frag mich nach *Beaches*, *Sights & Attractions*, *Casinos*, *Hotels* u. v. m. – ich verlinke dich direkt zur passenden NCP24-Seite.");
      buildChips();
    }
  });
  close.addEventListener("click", ()=>panel.classList.remove("open"));
  form.addEventListener("submit",(e)=>{e.preventDefault(); const msg=input.value.trim(); if(msg) sendMessage(msg);});
})();
