/* ====== PBPL – frontend logic ====== */
const el = (sel) => document.querySelector(sel);
const list = el('#messages');
const ta   = el('#input');
const form = el('#chatForm');
const send = el('#sendBtn');
const newBtn = el('#newChatBtn');

// gợi ý nút nhanh
document.querySelectorAll('.pill').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    ta.value = btn.getAttribute('data-q') || btn.textContent.trim();
    ta.focus();
  });
});

// thêm tin nhắn vào khung
function push(role, text){
  const div = document.createElement('div');
  div.className = 'msg ' + (role === 'user' ? 'user' : 'assistant');
  div.innerHTML = `<pre>${escapeHtml(text)}</pre>`;
  list.appendChild(div);
  list.scrollTop = list.scrollHeight;
}
function escapeHtml(s){
  return (s??'').replace(/[&<>]/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;' }[c]));
}

// NEW CHAT
function resetChat(focus=true){
  list.innerHTML = '';
  ta.value = '';
  if (focus) ta.focus();
}
newBtn.addEventListener('click', resetChat);
window.addEventListener('keydown', (e)=>{
  const k = (e.key||'').toLowerCase();
  if ((e.ctrlKey||e.metaKey) && e.shiftKey && k === 'k'){ e.preventDefault(); resetChat(); }
});

// gửi
form.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const question = ta.value.trim();
  if(!question) return;

  // UI
  send.disabled = true; ta.disabled = true;
  push('user', question);
  push('assistant', 'Đang xử lý câu hỏi của bạn...');

  try{
    const res = await fetch('/api/chat', {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({
        messages: [
          { role:'system', content: 'Bạn là Pháp Bảo Chatbot, trả lời tiếng Việt, ấm áp, tôn trọng, rõ ràng, có ví dụ ngắn khi phù hợp.' },
          { role:'user', content: question }
        ],
        temperature: 0.5,
        max_tokens: 600
      })
    });
    const data = await res.json();
    // thay nội dung "đang xử lý…" bằng câu trả lời thật
    list.lastElementChild.innerHTML = `<pre>${escapeHtml(data.reply || data.error || 'Xin lỗi, chưa nhận được phản hồi.')}</pre>`;
  }catch(err){
    list.lastElementChild.innerHTML = `<pre>Xin lỗi, có lỗi kết nối. (${err.message})</pre>`;
  }finally{
    send.disabled = false; ta.disabled = false; ta.focus();
  }
});
