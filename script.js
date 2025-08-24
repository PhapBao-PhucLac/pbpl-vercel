/* script.js – tiện ích UI an toàn, không đụng core logic trong chat.js */
(() => {
  // ===== Lấy phần tử DOM =====
  const form  = document.getElementById('chat-form');
  const input = document.getElementById('chat-input');
  const msgs  = document.getElementById('messages');
  let   list  = document.getElementById('chat-list');

  // Nếu thiếu #chat-list thì tạo mới (trước form)
  if (!list) {
    const d = document.createElement('div');
    d.id = 'chat-list';
    d.style.height = '420px';
    d.style.overflow = 'auto';
    (msgs || document.body).appendChild(d);
    list = d;
  }

  // ===== Cuộn xuống cuối (an toàn) =====
  function scrollToBottom(){
    if (!list) return;
    if (typeof list.scrollTo === 'function') {
      list.scrollTo({ top: list.scrollHeight, behavior: 'smooth' });
    } else {
      list.scrollTop = list.scrollHeight;
    }
  }

  /* ===== PBPL: scroll an toàn (một khối gọn) ===== */
function scrollToBottom(){
  const list =
    document.getElementById('chat-list') ||
    document.getElementById('messages') ||
    document.getElementById('chat-box') ||
    null;
  if (!list) return;

  if (typeof list.scrollTo === 'function') {
    list.scrollTo({ top: list.scrollHeight, behavior: 'smooth' });
  } else {
    list.scrollTop = list.scrollHeight;
  }
}

if (form) {
  form.addEventListener('submit', () => setTimeout(scrollToBottom, 80));
}
document.addEventListener('pbpl:append', scrollToBottom);
/* ===== hết khối ===== */

  // Nếu chat.js muốn báo “vừa thêm bubble”, có thể dispatch event này:
  // document.dispatchEvent(new CustomEvent('pbpl:append'));
  document.addEventListener('pbpl:append', scrollToBottom);

  // Chống lỗi khi chat.js dùng input.value nhưng input chưa có
  // (không làm gì, chỉ đảm bảo biến tồn tại)
  if (!input) {
    console.warn('[chat] Không tìm thấy #chat-input (script.js vẫn tiếp tục chạy)');
  }

  console.log('[chat] Ready ✅');
})();
