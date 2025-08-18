// ================================
// chat.js - phiên bản đầy đủ + Rescue Patch B
// ================================

// Lấy các phần tử giao diện
const chatForm = document.querySelector("#chat-form");
const chatInput = document.querySelector("#chat-input");
const chatBox = document.querySelector("#chat-box");

// Hàm thêm tin nhắn vào khung chat
function addMessage(sender, text) {
  const msg = document.createElement("div");
  msg.classList.add("message", sender);
  msg.innerHTML = `<p>${text}</p>`;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Hàm gửi câu hỏi đến server (API OpenAI)
async function sendMessage(userText) {
  try {
    // Hiển thị tin nhắn của người dùng
    addMessage("user", userText);

    // Gửi request đến server backend (/api/chat)
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message: userText })
    });

    if (!response.ok) {
      throw new Error("Lỗi server: " + response.status);
    }

    const data = await response.json();
    const botReply = data.reply || "Xin lỗi, tôi chưa có câu trả lời.";
    addMessage("bot", botReply);

  } catch (err) {
    console.error("❌ Lỗi khi gọi API:", err);
    addMessage("bot", "⚠️ A server error has occurred. (Rescue Patch B)");
  }
}

// Gắn sự kiện cho form
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (text !== "") {
    sendMessage(text);
    chatInput.value = "";
  }
});
