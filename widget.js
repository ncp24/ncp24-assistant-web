// widget.js  —  self-contained NCP24 Assistant
(() => {
  const API_URL = "https://assistant-dev.ncp24.com/api/chat";

  // ---------- DOM & Styles automatisch einfügen ----------
  const css = `
:root{--ncp:#e10600;--bg:#fff;--text:#222;--muted:#777;--shadow:0 10px 30px rgba(0,0,0,.12)}
.ncp-fab{position:fixed;right:18px;bottom:18px;width:56px;height:56px;border-radius:50%;background:var(--ncp);color:#fff;display:grid;place-items:center;cursor:pointer;box-shadow:var(--shadow);z-index:999999}
.ncp-panel{position:fixed;right:18px;bottom:84px;width:360px;max-width:92vw;height:560px;max-height:78vh;background:var(--bg);border-radius:16px;box-shadow:var(--shadow);display:none;flex-direction:column;overflow:hidden;z-index:999998}
.ncp-panel.open{display:flex}
.ncp-head{background:var(--ncp);color:#fff;padding:12px 14px;display:flex;align-items:center;justify-content:space-between}
.ncp-head h3{margin:0;font-size:16px}
.ncp-body{padding:12px;gap:10px;display:flex;flex-direction:column;overflow:auto;flex:1;background:#f7f7f8}
.msg{max-width:80%;padding:10px 12px;border-radius:14px;font-size:14px;line-height:1.35;box-shadow:0 1px 2px rgba(0,0,0,.05);white-space:pre-wrap}
.me{align-self:flex-end;background:#e7f0ff}
.bot{align-self:flex-start;background:#fff}
.ncp-input{display:flex;gap:8px;padding:10px;background:#fff;border-top:1px solid #eee}
.ncp-input input{flex:1;border:1px solid #ddd;border-radius:12px;padding:10px 12px;font-size:14px}
.ncp-input button{background:var(--ncp);color:#fff;border:0;border-radius:12px;padding:10px 14px;font-weight:700;cursor:pointer}
.spinner{width:18px;height:18px;border:2px solid #ddd;border-top-color:#fff;border-left-color:#fff;border-radius:50%;animation:spin .8s linear infinite;display:inline-block}
@keyframes spin{to{transform:rotate(360deg)}}
/* Link-Karten */
.linkcard{background:#fff;border:1px solid #e9e9e9;border-radius:12px;padding:10px 12px;box-shadow:0 4px 14px rgba(0,0,0,.06);margin:8px 0}
.linkcard-head{display:flex;align-items:center;gap:8px;margin-bottom:6px}
.linkcard-head .dot{width:8px;height:8px;border-radius:50%;background:var(--ncp)}
.linkcard-head .title{font-weight:700;font-size:14px;color:#222}
.linkcard-body{display:flex;align-items:center;justify-content:space-between;gap:10px}
.linkcard-body .domain{font-size:12px;color:#666;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.linkcard-body .btn-open{background:var(--ncp);color:#fff;text-decoration:none;padding:8px 12px;border-radius:10px;font-weight:700;font-size:13px}
@media (max-width:480px){
  .ncp-panel{right:0;left:0;bottom:0;top:0;width:100vw;height:100vh;max-width:none;max-height:none;border-radius:0}
}`;
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  // Container bauen (nur wenn noch nicht vorhanden)
  if (!document.getElementById("ncpFab")) {
    const fab = document.createElement("div");
    fab.id = "ncpFab";
    fab.className = "ncp-fab";
    fab.innerHTML = `<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M21 12c0 4.4-4 8-9 8-1.13 0-2.21-.18-3.21-.5L3 21l1.64-3.28C4.23 16.5 4 14.79 4 13c0-4.4 4.03-8 9-8s8 3.6 8 7z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    document.body.appendChild(fab);
  }
  if (!document.getElementById("ncpPanel")) {
    const panel = document.createElement("section");
    panel.id = "ncpPanel";
    panel.className = "ncp-panel";
    panel.innerHTML = `
      <div class="ncp-head">
        <h3>NCP24 Assistant</h3>
        <button id="ncpClose" style="all:unset;cursor:pointer" aria-label="Close">✕</button>
      </div>
      <div class="ncp-body" id="ncpBody"></div>
      <form class="ncp-input" id="ncpForm">
        <input id="ncpInput" placeholder="Frag mich auf DE/EN/TR/RU…" autocomplete="off" />
        <button id="ncpSend" type="submit">Senden</button>
      </form>`;
    document.body.appendChild(panel);
  }

  // ---------- Elemente referenzieren ----------
  const fab     = document.getElementById("ncpFab");
  const panel   = document.getElementById("ncpPanel");
  const closeBtn= document.getElementById("ncpClose");
  const body    = document.getElementById("ncpBody");
  const form    = document.getElementById("ncpForm");
  const input   = document.getElementById("ncpInput");
  const sendBtn = document.getElementById("ncpSend");

  // ---------- Utils ----------
  const urlHost = (u) => { try { return new URL(u).host.replace(/^www\./,''); } catch { return ""; } };
  const escapeHtml = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const findMdLinks = (text) => { const re=/\[[^\]]+\]\((https?:\/\/[^\s)]+)\)/g, out=[]; let m; while((m=re.exec(text))!==null){ out.push({label:m[0].slice(1,m[0].indexOf(']')), url:m[1]}); } return out; };
  const findBareUrls = (text) => { const re=/(https?:\/\/[^\s)]+)/g, out=[]; let m; while((m=re.exec(text))!==null){ out.push({label:m[1], url:m[1]}); } return out; };

  const linkCard = ({label,url}) => {
    const card = document.createElement("div");
    card.className = "linkcard";
    card.innerHTML = `
      <div class="linkcard-head">
        <div class="dot"></div>
        <div class="title">${escapeHtml(label)}</div>
      </div>
      <div class="linkcard-body">
        <div class="domain">${escapeHtml(urlHost(url))}</div>
        <a class="btn-open" href="${url}" target="_blank" rel="noopener noreferrer">Öffnen</a>
      </div>`;
    return card;
  };

  function renderBotReply(text){
    const wrap = document.createElement("div");
    wrap.className = "msg bot";
    const lines = String(text).split(/\n+/).filter(Boolean);
    const frag = document.createDocumentFragment();

    for(const line of lines){
      const md = findMdLinks(line);
      const bare = md.length ? [] : findBareUrls(line);
      const labelMatch = line.match(/^\s*([A-Za-zÄÖÜäöü0-9\s&-]+):\s*(.*)$/);

      if(md.length || bare.length){
        const links = md.length ? md : bare;
        for(const L of links) frag.appendChild(linkCard(L));
      }else if(labelMatch){
        const p=document.createElement("p");
        p.innerHTML = `<strong>${escapeHtml(labelMatch[1])}:</strong> ${escapeHtml(labelMatch[2])}`;
        frag.appendChild(p);
      }else{
        const p=document.createElement("p");
        p.textContent = line;
        frag.appendChild(p);
      }
    }

    wrap.appendChild(frag);
    body.appendChild(wrap);
    body.scrollTop = body.scrollHeight;
  }

  function addUserMessage(text){
    const div = document.createElement("div");
    div.className = "msg me";
    div.textContent = text;
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
  }

  async function sendMessage(msg){
    addUserMessage(msg);
    input.value = "";
    sendBtn.disabled = true;

    const spin = document.createElement("div");
    spin.className = "msg bot";
    spin.innerHTML = '<span class="spinner"></span>';
    body.appendChild(spin);
    body.scrollTop = body.scrollHeight;

    try{
      const res = await fetch(API_URL, {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ message: msg })
      });
      const data = await res.json();
      spin.remove();
      renderBotReply(data.reply || "❌ Keine Antwort erhalten.");
    }catch(e){
      spin.remove();
      renderBotReply("❌ Fehler bei der Anfrage. Bitte erneut versuchen.");
    }finally{
      sendBtn.disabled = false;
      input.focus();
    }
  }

  // ---------- Events ----------
  fab.addEventListener("click", () => {
    panel.classList.add("open");
    if(!body.querySelector(".msg")){
      renderBotReply("👋 Willkommen! Frag mich nach *Beaches*, *Sights & Attractions*, *Casinos*, *Hotels* u. v. m. – ich verlinke dich direkt zur passenden NCP24-Seite.");
    }
  });
  closeBtn.addEventListener("click", () => panel.classList.remove("open"));
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const msg = input.value.trim();
    if(msg) sendMessage(msg);
  });
})();
