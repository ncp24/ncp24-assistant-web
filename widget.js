(function () {
  const API_URL = "https://assistant-dev.ncp24.com/api/chat";

  // --- UI Grundstruktur ---
  const container = document.createElement("div");
  container.id = "ncp24-assistant";
  container.innerHTML = `
    <button id="chat-toggle">💬</button>
    <div id="chat-box" style="display:none;">
      <div id="chat-header">NCP24 Assistant <span id="chat-close">×</span></div>
      <div id="chat-log"></div>
      <div id="chat-input-row">
        <input id="chat-input" placeholder="Frag mich auf DE/EN/TR/RU…" />
        <button id="chat-send">Send</button>
      </div>
    </div>
  `;
  document.body.appendChild(container);

  // --- Styles ---
  const style = document.createElement("style");
  style.innerHTML = `
    #ncp24-assistant { position: fixed; bottom: 20px; right: 20px; font-family: Arial, sans-serif; z-index: 9999; }
    #chat-toggle { background: #ff2a2a; border: none; border-radius: 50%; color: #fff; width: 60px; height: 60px; cursor: pointer; font-size: 24px; }
    #chat-box { width: 320px; height: 420px; background: #fff; border: 1px solid #ddd; border-radius: 12px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.2); margin-bottom: 10px; }
    #chat-header { background: #ff2a2a; color: #fff; padding: 10px; font-weight: bold; display: flex; justify-content: space-between; align-items: center; }
    #chat-close { cursor: pointer; }
    #chat-log { flex: 1; padding: 10px; overflow-y: auto; font-size: 14px; background: #fafafa; }
    #chat-log div { margin-bottom: 6px; }
    #chat-log .user { color: #333; }
    #chat-log .bot { color: #0a6; }
    #chat-input-row { display: flex; border-top: 1px solid #ddd; }
    #chat-input { flex: 1; border: none; padding: 10px; outline: none; font-size: 14px; }
    #chat-send { background: #ff2a2a; color: #fff; border: none; padding: 10px 16px; cursor: pointer; }
  `;
  document.head.appendChild(style);

  // --- Elemente referenzieren ---
  const toggleBtn = document.getElementById("chat-toggle");
  const chatBox = document.getElementById("chat-box");
  const closeBtn = document.getElementById("chat-close");
  const log = document.getElementById("chat-log");
  const input = document.getElementById("chat-input");
  const sendBtn = document.getElementById("chat-send");

  // --- Funktionen ---
  function addMessage(text, cls) {
    const div = document.createElement("div");
    div.className = cls;
    div.textContent = (cls === "user" ? "Du: " : "Bot: ") + text;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
  }

  async function sendMessage() {
    const msg = input.value.trim();
    if (!msg) return;
    addMessage(msg, "user");
    input.value = "";
    sendBtn.disabled = true;

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });
      const data = await res.json();
      if (data.reply) {
        addMessage(data.reply, "bot");
      } else {
        addMessage("❌ Fehler: Keine Antwort erhalten", "bot");
      }
    } catch (e) {
      addMessage("❌ Fehler bei der Anfrage. Versuche es erneut.", "bot");
    } finally {
      sendBtn.disabled = false;
      input.focus();
    }
  }

  // --- Event Listener ---
  toggleBtn.addEventListener("click", () => {
    chatBox.style.display = chatBox.style.display === "none" ? "flex" : "none";
  });
  closeBtn.addEventListener("click", () => {
    chatBox.style.display = "none";
  });
  sendBtn.addEventListener("click", sendMessage);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
  });
})();
