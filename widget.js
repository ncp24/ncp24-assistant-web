(() => {
  const API_URL = "https://assistant-dev.ncp24.com/api/chat";

  const fab     = document.getElementById("ncpFab");
  const panel   = document.getElementById("ncpPanel");
  const closeBtn= document.getElementById("ncpClose");
  const body    = document.getElementById("ncpBody");
  const form    = document.getElementById("ncpForm");
  const input   = document.getElementById("ncpInput");
  const sendBtn = document.getElementById("ncpSend");

  // ===== Utils =====
  const urlHost = (u) => { try { return new URL(u).host.replace(/^www\./,''); } catch { return ""; } };
  const escapeHtml = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  const findMdLinks = (text) => {
    const re = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g; const out=[]; let m;
    while((m=re.exec(text))!==null){ out.push({label:m[1],url:m[2]}); }
    return out;
  };
  const findBareUrls = (text) => {
    const re = /(https?:\/\/[^\s)]+)/g; const out=[]; let m;
    while((m=re.exec(text))!==null){ out.push({label:m[1],url:m[1]}); }
    return out;
  };

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

      // „casinos: …“ → Label fett ausgeben
      const labelMatch = line.match(/^\s*([A-Za-zÄÖÜäöü0-9\s&-]+):\s*(.*)$/);

      if(md.length || bare.length){
        const links = md.length ? md : bare;
        for(const L of links) frag.appendChild(linkCard(L));
      } else if(labelMatch){
        const p=document.createElement("p");
        p.innerHTML = `<strong>${escapeHtml(labelMatch[1])}:</strong> ${escapeHtml(labelMatch[2])}`;
        frag.appendChild(p);
      } else {
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

  // Events
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
