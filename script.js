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

  /* ===== PBPL: scroll an toàn (đặt tên khác để không đụng chat.js) ===== */
  function PBPL_scrollBottom(){
    const el =
      document.getElementById('chat-list') ||
      document.getElementById('messages') ||
      document.getElementById('chat-box') ||
      null;

    if (!el) return;

    if (typeof el.scrollTo === 'function') {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    } else {
      el.scrollTop = el.scrollHeight;
    }
  }

  // Sau khi submit, cuộn xuống cuối (chờ 1 nhịp nhỏ cho bubble render)
  if (form) {
    form.addEventListener('submit', () => setTimeout(PBPL_scrollBottom, 80));
  }

  // Nếu nơi khác bắn sự kiện 'pbpl:append' thì cũng cuộn
  document.addEventListener('pbpl:append', PBPL_scrollBottom);

  // Chống lỗi khi chat.js dùng input.value nhưng input chưa có
  if (!input) {
    console.warn('[chat] Không tìm thấy #chat-input (script.js vẫn tiếp tục chạy)');
  }

  console.log('[chat] Ready ✅');
})();
