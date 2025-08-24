// ===== Grab DOM =====
// ===== PBPL: cuộn xuống cuối an toàn =====
const __pbplScrollEl =
  document.getElementById('chat-list') ||  // nếu có
  document.getElementById('messages') ||   // nếu có
  document.getElementById('chat-box') ||   // fallback
  null;

function scrollToBottom(){
  const el = __pbplScrollEl;
  if (!el) return;                           // không có phần tử thì bỏ qua
  if (typeof el.scrollTo === 'function') {
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  } else {
    el.scrollTop = el.scrollHeight;
  }
}
// ===== Helpers =====
const esc = (s) =>
  s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
   .replace(/\n/g,'<br>');

const scrollToBottom = () => {
  // cuộn mượt xuống cuối mỗi khi có tin nhắn
  chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: 'smooth' });
};

const appendMessage = (role, html) => {
  const row = document.createElement('div');
  row.className = `msg ${role}`;

  const bubble = document.createElement('div');
  bubble.className = `bubble ${role}`;
  bubble.innerHTML = html;

  row.appendChild(bubble);
  chatBox.appendChild(row);
  scrollToBottom();
};

// Hiển thị "đang soạn…" của bot
const showTyping = () => {
  const row = document.createElement('div');
  row.className = 'msg bot';
  row.id = 'typing-row';

  const bubble = document.createElement('div');
  bubble.className = 'bubble bot';
  bubble.innerHTML = `<div class="typing">
      <span class="dot"></span><span class="dot"></span><span class="dot"></span>
    </div>`;

  row.appendChild(bubble);
  chatBox.appendChild(row);
  scrollToBottom();
};
const hideTyping = () => {
  const el = document.getElementById('typing-row');
  if (el) el.remove();
};

// (Tùy chọn) Enter để gửi, Shift+Enter để xuống dòng
if (userInput) {
  userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      chatForm.requestSubmit(); // native submit
    }
  });
}

// ===== Gửi câu hỏi =====
chatForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const q = (userInput.value || '').trim();
  if (!q) return;

  // User bubble
  appendMessage('user', esc(q));
  userInput.value = '';
  userInput.disabled = true;

  // Typing…
  showTyping();

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: q }),
    });

    if (!res.ok) {
      // server trả text nên đọc text để xem lỗi
      const text = await res.text();
      hideTyping();
      appendMessage('bot', esc(`⚠️ Lỗi máy chủ (${res.status}): ${text}`));
      return;
    }

    const data = await res.json();
    hideTyping();

    const answer = data?.answer || data?.text || '(không có nội dung)';
    appendMessage('bot', esc(answer));
  } catch (err) {
    hideTyping();
    appendMessage('bot', esc(`⚠️ Lỗi kết nối API: ${err.message}`));
  } finally {
    userInput.disabled = false;
    userInput.focus();
  }
});

// Cuộn xuống cuối khi tải trang
window.addEventListener('load', scrollToBottom);
