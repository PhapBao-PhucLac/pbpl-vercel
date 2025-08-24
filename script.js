// script.js (PBPL safe header)
(() => {
  // Lấy phần tử (bản an toàn)
  const formEl = document.getElementById('chat-form');
  let   input  = document.getElementById('chat-input')  || document.getElementById('user-input');
  let   list   = document.getElementById('chat-list')
              || document.getElementById('chat-box')
              || document.getElementById('messages')
              || document.querySelector('.chat-list, .chat-box, .messages');

  // Nếu chưa có vùng hiển thị tin nhắn, tự tạo #chat-list và đặt ngay TRƯỚC form
  if (!list) {
    const d = document.createElement('div');
    d.id = 'chat-list';
    const host = formEl ? formEl.parentElement : document.body;
    if (formEl) host.insertBefore(d, formEl); else host.appendChild(d);
    list = d;
  }

  // Nếu chưa bắt được ô nhập, tìm ô text đầu tiên
  if (!input) {
    input = document.querySelector('#chat-input, #user-input, form input[type="text"], input[type="text"]');
  }

  // Cuộn xuống đáy (bản an toàn)
  const scrollToBottom = () => {
    if (!list) return;
    if (typeof list.scrollTo === 'function') {
      list.scrollTo({ top: list.scrollHeight, behavior: 'smooth' });
    } else {
      list.scrollTop = list.scrollHeight;
    }
  };

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
