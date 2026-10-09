let chatRequestInProgress = false;

function toggleChat() {
  document.getElementById("chat-box").classList.toggle("hidden");
}

function appendChatMessage(message, role) {
  const messages = document.getElementById("chat-messages");
  const wrapper = document.createElement("div");
  const bubble = document.createElement("div");
  const isUser = role === "user";

  wrapper.className = isUser ? "text-right" : "";
  bubble.className = isUser
    ? "bg-cyan-950 border border-cyan-700 p-2 rounded-lg inline-block text-cyan-200 whitespace-pre-wrap"
    : role === "error"
      ? "bg-red-950 border border-red-900 p-2 rounded-lg inline-block text-red-400 whitespace-pre-wrap"
      : role === "loading"
        ? "bg-zinc-900 border border-zinc-700 p-2 rounded-lg inline-block text-zinc-500 whitespace-pre-wrap"
        : "bg-zinc-900 border border-yellow-900 p-2 rounded-lg inline-block text-yellow-400 whitespace-pre-wrap";
  bubble.textContent = message;
  wrapper.appendChild(bubble);
  messages.appendChild(wrapper);
  messages.scrollTop = messages.scrollHeight;
  return wrapper;
}

async function sendMessage() {
  const input = document.getElementById("chat-input");
  const message = input.value.trim();
  if (!message || chatRequestInProgress) return;

  input.value = "";
  appendChatMessage(message, "user");
  const loading = appendChatMessage("Procesando petición al núcleo...", "loading");
  chatRequestInProgress = true;

  try {
    const response = await fetch("/geminiChat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    const data = await response.json();
    loading.remove();

    if (!response.ok) {
      throw new Error(data.error || `El servicio respondió con HTTP ${response.status}.`);
    }
    if (typeof data.reply !== "string" || !data.reply.trim()) {
      throw new Error("El servicio no devolvió una respuesta válida.");
    }
    appendChatMessage(data.reply, "assistant");
  } catch (error) {
    loading.remove();
    appendChatMessage(`No se pudo completar el chat: ${error.message}`, "error");
  } finally {
    chatRequestInProgress = false;
  }
}
