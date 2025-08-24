/* script.js – tiện ích UI an toàn, không đụng core logic trong chat.js */
(() => {
  // ===== Lấy phần tử DOM =====
  const form  = document.getElementById('chat-form');
  const input = document.getElementById('chat-input');
  const msgs  = document.getElementById('messages');
  let   list  = document.getElementById('chat-list');

  // Nếu thiếu #chat-list thì tạo mới (trước form / trong khung messages nếu có)
  if (!list) {
    const d = document.createElement('div');
    d.id = 'chat-list';
    d.style.height = '420px';
    d.style.overflow = 'auto';
    (msgs || document.body).appendChild(d);
    list = d;
  }

  /* ===== PBPL: cuộn xuống cuối an toàn (1 khối gọn) ===== */
  function scrollToBottom(){
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

  // Sau khi submit form, đợi 80ms rồi cuộn đáy
  if (form) {
    form.addEventListener('submit', () => setTimeout(scrollToBottom, 80));
  }

  // Mỗi lần chat.js thêm bubble thì dispatch event này
  //   document.dispatchEvent(new CustomEvent('pbpl:append'));
  // Ở đây chỉ lắng nghe 1 lần (không gắn trùng)
  document.addEventListener('pbpl:append', scrollToBottom);

  // Chống lỗi khi input chưa có
  if (!input) {
    console.warn('[chat] Không tìm thấy #chat-input (script.js vẫn tiếp tục chạy)');
  }

  console.log('[chat] Ready ✅');
})();
