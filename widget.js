(() => {
  const API_URL = "https://assistant-dev.ncp24.com/api/chat";

  const fab = document.getElementById("ncpFab");
  const panel = document.getElementById("ncpPanel");
  const closeBtn = document.getElementById("ncpClose");
  const body = document.getElementById("ncpBody");
  const form = document.getElementById("ncpForm");
  const input = document.getElementById("ncpInput");
  const sendBtn = document.getElementById("ncpSend");

  function addMessage(text, who = "bot") {
    const div = document.createElement("div");
    div.className = `msg ${who}`;
    div.textContent = text;
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
  }

  async function sendMessage(msg) {
    addMessage(msg, "me");
    input.value = "";
    sendBtn.disabled = true;

    // Lade-Spinner
    const spin = document.createElement("div");
    spin.className = "msg bot";
    spin.innerHTML = '<span class="spinner"></span>';
    body.appendChild(spin);
    body.scrollTop = body.scrollHeight;

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });
      const data = await res.json();
      spin.remove();
      addMessage(data.reply || "❌ Keine Antwort erhalten.", "bot");
    } catch (e) {
      spin.remove();
      addMessage("❌ Fehler bei der Anfrage. Bitte erneut versuchen.", "bot");
    } finally {
      sendBtn.disabled = false;
      input.focus();
    }
  }

  // Events
  fab.addEventListener("click", () => panel.classList.add("open"));
  closeBtn.addEventListener("click", () => panel.classList.remove("open"));
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const msg = input.value.trim();
    if (msg) sendMessage(msg);
  });

  // Begrüßung beim Öffnen
  fab.addEventListener("click", () => {
    if (!body.querySelector(".msg")) {
      addMessage("👋 Hallo! Ich bin dein NCP24 Assistant. Wie kann ich helfen?", "bot");
    }
  });
})();
