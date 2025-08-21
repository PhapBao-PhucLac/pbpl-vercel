<!-- script.js -->
(() => {
  const form = document.getElementById("chat-form");
  const input = document.getElementById("chat-input");
  const list  = document.getElementById("chat-list");   // <ul> hoặc <div> chứa bong bóng

  // tiện ích
  const scrollToBottom = () => list.scrollTo({ top: list.scrollHeight, behavior: "smooth" });

  const addBubble = (text, who = "user") => {
    const li = document.createElement("li");
    li.className = `bubble ${who}`;
    li.innerHTML = text
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br/>");
    list.appendChild(li);
    scrollToBottom();
  };

  const setSending = (on) => {
    const btn = document.getElementById("send-btn");
    if (!btn) return;
    btn.disabled = on;
    btn.innerText = on ? "Đang gửi…" : "Gửi";
  };

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = input.value.trim();
    if (!msg) return;

    // hiện bong bóng người dùng
    addBubble(msg, "user");
    input.value = "";
    setSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          // tuỳ chọn: bạn có thể truyền system để định phong cách
          system: "Bạn là trợ lý Pháp học nói ngắn gọn, từ ái, tôn trọng chánh kiến."
        }),
      });

      // nếu server trả JSON lỗi tiêu chuẩn
      if (!res.ok) {
        const txt = await res.text();
        addBubble(`⚠️ Lỗi máy chủ (${res.status}).\n${txt}`, "bot");
        return;
      }

      const data = await res.json();
      if (data?.ok) {
        addBubble(data.answer || data.text || "(không có nội dung)", "bot");
      } else {
        // dạng lỗi có kèm chi tiết debug từ api/chat.js
        const detail = data?.error || data?.debug?.error || "Không rõ.";
        addBubble(`⚠️ Không nhận được câu trả lời.\nChi tiết: ${detail}`, "bot");
      }
    } catch (err) {
      addBubble(`⚠️ Lỗi kết nối: ${err?.message || err}`, "bot");
    } finally {
      setSending(false);
      scrollToBottom();
      input.focus();
    }
  });

  // gửi khi bấm Enter (Shift+Enter xuống dòng)
  input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      form.requestSubmit();
    }
  });
})();
