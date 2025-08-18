
(() => {
  const $ = (sel, root=document) => root.querySelector(sel);
  const messagesEl = $('#messages');
  const textbox = $('#textbox');
  const sendBtn = $('#sendBtn');
  const newBtn = $('#newchatBtn');
  const copyBtn = $('#copyBtn');
  const dlBtn = $('#dlBtn');
  const promptTip = $('#promptTip');

  // Utilities
  const addMsg = (role, html) => {
    const li = document.createElement('li');
    li.className = `msg ${role}`;
    li.innerHTML = `
      <div class="role">${role==='me' ? personIcon() : botIcon()}</div>
      <div class="bubble">${html}</div>
    `;
    messagesEl.appendChild(li);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return li;
  };
  const escapeHtml = (s) => s.replace(/[&<>]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[ch]));
  const personIcon = () => '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm7 8a7 7 0 0 0-14 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  const botIcon = () => '<svg viewBox="0 0 24 24" width="16" height="16"><rect x="4" y="4" width="16" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 20h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  const setBusy = (busy) => { sendBtn.disabled = busy; textbox.disabled = busy && false; };

  // Send flow
  async function doSend() {
    const q = textbox.value.trim();
    if (!q) return;
    setBusy(true);
    addMsg('me', escapeHtml(q));
    textbox.value = '';
    const thinking = addMsg('bot', 'Đang xử lý câu hỏi của bạn…');
    try {
      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ message: q })
      });
      let text = '';
      const ct = r.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        const data = await r.json();
        text = (data.answer || data.output || JSON.stringify(data));
      } else {
        text = await r.text();
      }
      thinking.querySelector('.bubble').textContent = text.trim();
    } catch (err) {
      thinking.querySelector('.bubble').textContent = 'Xin lỗi, có lỗi kết nối. Vui lòng thử lại.';
    } finally {
      setBusy(false);
      textbox.focus();
    }
  }

  // Events
  sendBtn.addEventListener('click', doSend);
  textbox.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      doSend();
    }
  });
  newBtn.addEventListener('click', resetChat);
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      resetChat();
    }
  });
  copyBtn.addEventListener('click', () => {
    const lastBot = [...messagesEl.querySelectorAll('.msg.bot .bubble')].pop();
    if (!lastBot) return;
    navigator.clipboard.writeText(lastBot.textContent || '').then(()=>{
      flashTip('Đã sao chép câu trả lời.');
    });
  });
  dlBtn.addEventListener('click', () => {
    const all = [...messagesEl.querySelectorAll('.msg')]
      .map(li => (li.classList.contains('me') ? 'Bạn: ' : 'Chatbot: ') + (li.querySelector('.bubble')?.textContent || ''))
      .join('\n\n');
    const blob = new Blob([all], {type:'text/plain;charset=utf-8'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'pbpl_chat.txt';
    a.click();
    URL.revokeObjectURL(a.href);
  });

  // Quick chips
  document.querySelectorAll('.chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const v = `Tôi muốn tìm hiểu về “${btn.dataset.topic}”. Hãy giải thích giúp tôi thật rõ ràng, dễ hiểu và có ví dụ ứng dụng thực tế.`;
      textbox.value = v;
      textbox.focus();
      promptTip.hidden = false;
      promptTip.textContent = 'Gợi ý đã chèn vào ô nhập — bấm Enter để gửi.';
      setTimeout(()=> promptTip.hidden = true, 2500);
    });
  });

  // Reset
  function resetChat() {
    messagesEl.innerHTML = '';
    textbox.value = '';
    textbox.focus();
  }

  // Tip
  function flashTip(text) {
    promptTip.hidden = false;
    promptTip.textContent = text;
    setTimeout(()=> promptTip.hidden = true, 1800);
  }

  // Focus on load
  setTimeout(()=>textbox.focus(), 200);
})();
