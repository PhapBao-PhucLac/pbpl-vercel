const chatBox = document.getElementById("chat-box");
const form = document.getElementById("chat-form");
const textarea = form.querySelector("textarea");

// Hàm thêm tin nhắn vào khung chat
function addMessage(text, sender = "bot", typingEffect = false) {
  const msg = document.createElement("div");
  msg.classList.add("msg", sender);

  if (typingEffect) {
    let i = 0;
    function typeChar() {
      if (i < text.length) {
        msg.textContent += text.charAt(i);
        i++;
        chatBox.scrollTop = chatBox.scrollHeight; // luôn cuộn xuống
        setTimeout(typeChar, 20); // tốc độ chữ chạy
      }
    }
    typeChar();
  } else {
    msg.textContent = text;
  }

  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight; // auto scroll
}

// Lắng nghe form submit
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = textarea.value.trim();
  if (!text) return;

  // Hiển thị tin nhắn user
  addMessage(text, "user");
  textarea.value = "";

  // Gửi tới API backend
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });
    const data = await res.json();

    // Hiển thị trả lời bot (chữ chạy)
    if (data.answer) {
      addMessage(data.answer, "bot", true);
    } else {
      addMessage("❌ Xin lỗi, không nhận được trả lời.", "bot");
    }
  } catch (err) {
    console.error(err);
    addMessage("⚠️ Lỗi kết nối API.", "bot");
  }
});
