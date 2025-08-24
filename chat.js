/* chat.js — PBPL Streaming
   - Streaming qua SSE (text/event-stream) hoặc chunk text thường
   - Hiện chữ dần, có "đang soạn..."
   - Log chi tiết, không khai báo trùng
*/

const API_URL = "/api/chat";

/* ============== Grab DOM ============== */
const chatBox =
  document.getElementById("chat-box") ||
  document.getElementById("messages") ||
  document.getElementById("chat-list") ||
  null;

const chatForm =
  document.getElementById("chat-form") ||
  document.querySelector('form[data-role="chat"]') ||
  document.querySelector("form#chat") ||
  document.querySelector("form") ||
  null;

const userInput =
  document.getElementById("user-input") ||
  (chatForm ? chatForm.querySelector("textarea, input[type='text']") : null) ||
  null;

/* ============== Helpers ============== */
function esc(s = "") {
  return String(s)
    .replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]))
    .replace(/\n/g, "<br>");
}
function escChunk(s = "") {
  // dùng cho stream: chỉ escape & < > " ' ; xuống dòng đổi thành <br>
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function scrollToBottom() {
  const el =
    chatBox ||
    document.getElementById("chat-box") ||
    document.getElementById("messages") ||
    document.getElementById("chat-list");
  if (!el) return;
  const max = el.scrollHeight;
  try {
    if (typeof el.scrollTo === "function") el.scrollTo({ top: max, behavior: "smooth" });
    else el.scrollTop = max;
  } catch {
    el.scrollTop = max;
  }
}

function appendMessage(role, html) {
  if (!chatBox) return;
  const row = document.createElement("div");
  row.className = `msg ${role}`;
  const bubble = document.createElement("div");
  bubble.className = `bubble ${role}`;
  bubble.innerHTML = html;
  row.appendChild(bubble);
  chatBox.appendChild(row);
  scrollToBottom();
  return bubble; // trả bubble để cập nhật khi stream
}

function showTyping() {
  if (!chatBox || document.getElementById("typing-row")) return;
  const row = document.createElement("div");
  row.className = "msg bot";
  row.id = "typing-row";
  const bubble = document.createElement("div");
  bubble.className = "bubble bot";
  bubble.innerHTML = `
    <div class="typing">
      <span class="dot"></span><span class="dot"></span><span class="dot"></span>
    </div>`;
  row.appendChild(bubble);
  chatBox.appendChild(row);
  scrollToBottom();
}
function hideTyping() {
  const el = document.getElementById("typing-row");
  if (el) el.remove();
}

/* ============== UX nhỏ: Enter để gửi ============== */
if (userInput && chatForm) {
  userInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      chatForm.requestSubmit();
    }
  });
}

/* ============== Streaming core ============== */
async function streamToBubble(res, bubble) {
  const contentType = res.headers.get("Content-Type") || "";
  const reader = res.body?.getReader?.();
  if (!reader) {
    // fallback đọc 1 lần
    const text = await res.text();
    bubble.innerHTML = esc(text);
    return;
  }

  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  let dirty = false;
  let rafPending = false;

  const flush = () => {
    if (!dirty) return;
    bubble.innerHTML = buffer.replace(/\n/g, "<br>");
    dirty = false;
    scrollToBottom();
    rafPending = false;
  };

  // Batch update theo frame để mượt
  const scheduleFlush = () => {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(flush);
  };

  // SSE mode: "data: ..." kết thúc bằng \n\n, [DONE] để ngắt
  const useSSE = contentType.includes("text/event-stream");

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });

    if (useSSE) {
      // Gom vào sseBuf rồi tách theo \n\n
      let sseBuf = chunk;
      // nếu có buffer sse chưa xử xong thì gắn trước
      // (ở đây buffer text chung chính là 'buffer' nội dung hiển thị,
      // còn sseBuf chỉ để tách event)
      const events = (sseBuf.split("\n\n") || []);
      for (let i = 0; i < events.length; i++) {
        const ev = events[i].trim();
        if (!ev) continue;
        // hỗ trợ cả nhiều dòng "data: ..." trong 1 event
        const lines = ev.split("\n").filter(l => l.startsWith("data:"));
        const data = lines.map(l => l.slice(5).trim()).join("\n");
        if (!data || data === "[DONE]") continue;
        buffer += escChunk(data);
        dirty = true;
      }
      scheduleFlush();
    } else {
      // Plain text chunk: thêm thẳng
      buffer += escChunk(chunk);
      dirty = true;
      scheduleFlush();
    }
  }
  flush();
}

/* ============== Submit handler (stream) ============== */
if (chatForm) {
  chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const q = (userInput?.value || "").trim();
    if (!q) return;

    appendMessage("user", esc(q));
    if (userInput) {
      userInput.value = "";
      userInput.disabled = true;
    }

    showTyping();

    const reqId = Math.random().toString(36).slice(2, 8);
    const t0 = performance.now();
    console.groupCollapsed(`[PBPL ${reqId}] POST ${API_URL}`);
    console.log("payload:", { message: q });

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: q, stream: true }), // gợi ý server bật stream
      });

      const t1 = performance.now();
      console.log("status:", res.status, res.statusText, `(${(t1 - t0).toFixed(0)} ms)`);

      hideTyping();

      // Tạo bubble rỗng để đổ stream vào
      const botBubble = appendMessage("bot", "");

      if (!res.ok) {
        const text = await res.text();
        botBubble.innerHTML = esc(`⚠️ Lỗi máy chủ (${res.status}): ${text}`);
        return;
      }

      await streamToBubble(res, botBubble);
    } catch (err) {
      hideTyping();
      appendMessage("bot", esc(`⚠️ Lỗi kết nối API: ${err?.message || err}`));
      console.error("[PBPL] fetch error:", err);
    } finally {
      console.groupEnd();
      if (userInput) {
        userInput.disabled = false;
        userInput.focus();
      }
    }
  });
} else {
  console.warn("[PBPL] Không tìm thấy chatForm.");
}

/* ============== Init ============== */
window.addEventListener("load", () => {
  console.log("[PBPL] chat.js streaming ready ✔");
  scrollToBottom();
});
