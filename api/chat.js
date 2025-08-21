// chat.js

const chatForm = document.querySelector("form");
const chatInput = document.querySelector("textarea");
const chatBox = document.querySelector("#chat-box");

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const message = chatInput.value.trim();
  if (!message) return;

  // Hiển thị câu hỏi của người dùng
  appendMessage("user", message);

  chatInput.value = "";

  // Gửi request tới API
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    const data = await res.json();

    if (data.ok && data.answer) {
      appendMessage("bot", data.answer);
    } else {
      appendMessage("bot", "Xin lỗi, chưa có câu trả lời.");
    }
  } catch (err) {
    console.error(err);
    appendMessage("bot", "Có lỗi xảy ra khi kết nối máy chủ.");
  }
});

// Hàm hiển thị tin nhắn
function appendMessage(sender, text) {
  const msg = document.createElement("div");
  msg.className = sender === "user" ? "msg user" : "msg bot";
  msg.innerHTML = `<p>${text}</p>`;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}
