/* chat.js — Pháp Bảo Phúc Lạc (PBPL)
   - Cuộn xuống cuối an toàn
   - Append bong bóng chat
   - Gửi API /api/chat (non-stream)
   - Log chi tiết request/response & lỗi
   - Không khai báo trùng, không đệ quy vô hạn
*/

/* ===================== Grab DOM ===================== */
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

/* ===================== Helpers ===================== */
// escape HTML + xuống dòng thành <br>
function esc(s = "") {
  return String(s)
    .replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]))
    .replace(/\n/g, "<br>");
}

// Cuộn xuống cuối an toàn (mượt nếu hỗ trợ)
function scrollToBottom() {
  const el =
    chatBox ||
    document.getElementById("chat-box") ||
    document.getElementById("messages") ||
    document.getElementById("chat-list");

  if (!el) return;
  const max = el.scrollHeight;
  try {
    if (typeof el.scrollTo === "function") {
      el.scrollTo({ top: max, behavior: "smooth" });
    } else {
      el.scrollTop = max; // fallback
    }
  } catch {
    el.scrollTop = max;
  }
}

// Tạo & thêm tin nhắn
function appendMessage(role, html) {
  if (!chatBox) return console.warn("[PBPL] Không tìm thấy chatBox để append.");

  const row = document.createElement("div");
  row.className = `msg ${role}`;

  const bubble = document.createElement("div");
  bubble.className = `bubble ${role}`;
  bubble.innerHTML = html;

  row.appendChild(bubble);
  chatBox.appendChild(row);
  scrollToBottom();
}

// Hiển thị "đang soạn…" của bot
function showTyping() {
  if (!chatBox) return;
  if (document.getElementById("typing-row")) return; // tránh trùng

  const row = document.createElement("div");
  row.className = "msg bot";
  row.id = "typing-row";

  const bubble = document.createElement("div");
  bubble.className = "bubble bot";
  bubble.innerHTML = `
    <div class="typing">
      <span class="dot"></span><span class="dot"></span><span class="dot"></span>
    </div>
  `;

  row.appendChild(bubble);
  chatBox.appendChild(row);
  scrollToBottom();
}

function hideTyping() {
  const el = document.getElementById("typing-row");
  if (el) el.remove();
}

/* ===================== UX nhỏ: Enter để gửi ===================== */
if (userInput && chatForm) {
  userInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      chatForm.requestSubmit();
    }
  });
}

/* ===================== Gửi câu hỏi ===================== */
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

    // --- Logging nhóm cho 1 request ---
    const reqId = Math.random().toString(36).slice(2, 8);
    const t0 = performance.now();
    console.groupCollapsed(`[PBPL ${reqId}] POST /api/chat`);
    console.log("payload:", { message: q });

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: q }),
      });

      const t1 = performance.now();
      console.log("status:", res.status, res.statusText, `(${(t1 - t0).toFixed(0)} ms)`);

      // Thử đọc JSON; nếu thất bại thì đọc text để log lỗi máy chủ
      let data = null;
      let rawText = null;
      try {
        data = await res.clone().json();
      } catch {
        rawText = await res.text();
      }

      if (!res.ok) {
        console.warn("server-error body:", data ?? rawText);
        hideTyping();
        appendMessage(
          "bot",
          esc(`⚠️ Lỗi máy chủ (${res.status}): ${rawText ?? JSON.stringify(data)}`)
        );
        return;
      }

      console.log("response JSON:", data);

      hideTyping();

      const answer =
        data?.answer ??
        data?.text ??
        data?.message ??
        (typeof data === "string" ? data : "") ||
        "(không có nội dung)";

      appendMessage("bot", esc(answer));
    } catch (err) {
      console.error("[PBPL] fetch error:", err);
      hideTyping();
      appendMessage("bot", esc(`⚠️ Lỗi kết nối API: ${err?.message || err}`));
    } finally {
      console.groupEnd();
      if (userInput) {
        userInput.disabled = false;
        userInput.focus();
      }
    }
  });
} else {
  console.warn("[PBPL] Không tìm thấy chatForm. Hãy đảm bảo form có id='chat-form' hoặc thêm data-role='chat'.");
}

/* ===================== Khởi động ===================== */
window.addEventListener("load", () => {
  console.log("[PBPL] chat.js ready ✔");
  scrollToBottom();
});
