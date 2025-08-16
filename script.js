document.addEventListener("DOMContentLoaded", function () {
  const sendBtn = document.getElementById("send-btn");
  const chatInput = document.getElementById("chat-input");
  const chatOutput = document.getElementById("chat-output");

  sendBtn.addEventListener("click", sendMessage);
  chatInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  function sendMessage() {
    const userText = chatInput.value.trim();
    if (userText === "") return;

    const userBubble = document.createElement("div");
    userBubble.classList.add("user-message");
    userBubble.textContent = userText;
    chatOutput.appendChild(userBubble);

    chatInput.value = "";

    setTimeout(() => {
      const botBubble = document.createElement("div");
      botBubble.classList.add("bot-message");
      botBubble.textContent = "Đang xử lý câu hỏi của bạn...";
      chatOutput.appendChild(botBubble);
      chatOutput.scrollTop = chatOutput.scrollHeight;
    }, 500);
  }
});