<!-- script.js -->
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

  /* ===== PBPL: cuộn xuống cuối (đổi tên để khỏi trùng) ===== */
  function PBPL_scrollBottom(){
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

  // Sau khi submit form, chờ 80ms rồi cuộn
  if (form) form.addEventListener('submit', () => setTimeout(PBPL_scrollBottom, 80));

  // Nếu chỗ khác có bắn sự kiện này thì cũng cuộn
  document.addEventListener('pbpl:append', PBPL_scrollBottom);

  // Tự phát hiện có bubble mới ⇒ tự cuộn (không cần sửa chat.js)
  try {
    const ob = new MutationObserver(() => setTimeout(PBPL_scrollBottom, 20));
    if (list) ob.observe(list, { childList: true, subtree: true });
    if (msgs && msgs !== list) ob.observe(msgs, { childList: true, subtree: true });
  } catch {}

  if (!input) console.warn('[chat] Không tìm thấy #chat-input (script.js vẫn chạy)');
  console.log('[chat] Ready ✅');
})();
