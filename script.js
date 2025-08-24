/* script.js – tiện ích UI an toàn, không đụng core logic trong chat.js */
(() => {
  // ===== Lấy phần tử DOM =====
  const form  = document.getElementById('chat-form');
  const input = document.getElementById('chat-input');
  const msgs  = document.getElementById('messages');
  let   list  = document.getElementById('chat-list');

  // Nếu thiếu #chat-list thì tạo mới (đặt trong #messages hoặc body)
  if (!list) {
    const d = document.createElement('div');
    d.id = 'chat-list';
    d.className = 'bubble-list';
    d.style.height   = '420px';
    d.style.overflow = 'auto';
    (msgs || document.body).appendChild(d);
    list = d;
  }

  /* ===== PBPL: scroll an toàn (một hàm duy nhất) ===== */
  function PBPL_scrollBottom() {
    const target =
      document.getElementById('chat-list') ||
      document.getElementById('messages') ||
      document.getElementById('chat-box') ||
      null;

    if (!target) return;

    if (typeof target.scrollTo === 'function') {
      target.scrollTo({ top: target.scrollHeight, behavior: 'smooth' });
    } else {
      target.scrollTop = target.scrollHeight;
    }
  }

  // Xuất ra global an toàn + alias cho tên cũ nếu có code khác gọi
  window.PBPL_scrollBottom = PBPL_scrollBottom;
  if (!('scrollToBottom' in window)) {
    window.scrollToBottom = PBPL_scrollBottom;
  }

  // Sau submit, cuộn xuống cuối
  if (form) {
    form.addEventListener('submit', () => setTimeout(PBPL_scrollBottom, 80));
  }

  // Cho phép nơi khác báo “vừa thêm bubble”
  document.addEventListener('pbpl:append', PBPL_scrollBottom);

  // Nếu thiếu input thì chỉ cảnh báo (không làm vỡ trang)
  if (!input) {
    console.warn('[chat] Không tìm thấy #chat-input (script.js vẫn tiếp tục chạy)');
  }

  console.log('[chat] Ready ✅');
})();
