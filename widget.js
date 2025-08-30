const API_BASE = "https://assistant-dev.ncp24.com"; // Backend/API (VPS)

const el = (q)=>document.querySelector(q);
const body= el('#ncpBody'), panel=el('#ncpPanel'), fab=el('#ncpFab'),
      input=el('#ncpInput'), form=el('#ncpForm'), closeBtn=el('#ncpClose');

const push = (txt, who='bot')=>{
  const b=document.createElement('div'); b.className='msg '+(who==='me'?'me':'bot'); b.textContent=txt;
  body.appendChild(b); body.scrollTop=body.scrollHeight;
};
const typing = ()=>{
  const wrap=document.createElement('div'); wrap.className='msg bot'; wrap.dataset.typing='1';
  wrap.innerHTML='<span class="spinner"></span> <span class="muted">Assistant is typing…</span>';
  body.appendChild(wrap); body.scrollTop=body.scrollHeight; return wrap;
};

fab.onclick = ()=> panel.classList.add('open');
closeBtn.onclick = ()=> panel.classList.remove('open');

form.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const q=(input.value||'').trim();
  if(!q) return;
  push(q,'me'); input.value='';
  const t=typing();
  try{
    const r = await fetch(`${API_BASE}/chat`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({message:q})
    });
    const data = await r.json();
    t.remove();
    push(data.reply || 'Keine Antwort erhalten.');
  }catch(err){
    t.remove();
    push('Fehler bei der Anfrage. Versuche es erneut.');
    console.error(err);
  }
});
