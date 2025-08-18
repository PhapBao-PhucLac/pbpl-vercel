/* ===== Helpers: chọn phần tử linh hoạt theo nhiều selector ===== */
const $ = (sel) => document.querySelector(sel);
const pick = (...sels) => sels.map((s) => $(s)).find(Boolean);

/* Các “điểm nối” có thể khác tên giữa các phiên bản → dùng nhiều selector dự phòng */
const ta      = pick('#textarea', '#chat-input', 'textarea');
const sendBtn = pick('#sendBtn', '#send', '.send', '[data-role="send"]');
const list    = pick('#messages', '.msgs', '.message-list', '[data-role="messages"]');
const newBtn  = pick('#newchat-btn', '#newchat', '.newchat', '[data-role="newchat"]');

/* Chữ gợi ý tiếng Việt để trợ lý luôn trả lời bằng tiếng Việt */
const viHint =
  '— Vui lòng trả lời bằng **TIẾNG VIỆT** rõ ràng, từ tốn; ' +
  'giải thích súc tích, có ví dụ khi phù hợp; dùng **đậm** cho tiêu đề ngắn.';

/* ===== UI tiện ích ===== */
function scrollToBottom() {
  if (!list) return;
  // cuộn mượt khi có nội dung mới
  list.scrollTop = list.scrollHeight;
}

function setSendingState(sending) {
  if (sendBtn) {
    sendBtn.disabled = sending;
    sendBtn.setAttribute('aria-busy', sending ? 'true' : 'false');
  }
  if (ta) ta.readOnly = sending; // tránh sửa khi đang stream
}

/* ===== Khối thông báo "Đang xử lý…" ===== */
let pendingNode = null;

function showPending() {
  if (!list) return;
  // Nếu đã có pending thì bỏ đi để tránh lặp
  hidePending();

  const wrap = document.createElement('div');
  wrap.className = 'msg msg-pending'; // <- class bạn đã thêm style trong CSS
  wrap.setAttribute('data-role', 'pending');

  // Nội dung tiếng Việt theo yêu cầu
  wrap.textContent = 'Đang xử lý câu hỏi của bạn…';

  list.appendChild(wrap);
  pendingNode = wrap;
  scrollToBottom();
}

function hidePending() {
  if (pendingNode && pendingNode.parentNode) {
    pendingNode.parentNode.removeChild(pendingNode);
  }
  pendingNode = null;
}

/* ===== Render 1 message (phía bot hoặc user) ===== */
function renderMessage({ role, text }) {
  if (!list) return;

  const item = document.createElement('div');
  item.className = `msg ${role === 'user' ? 'msg-user' : 'msg-bot'}`;
  item.innerHTML = escapeAndNl2br(text);

  list.appendChild(item);
  scrollToBottom();
}

/* an toàn: escape HTML đơn giản + xuống dòng */
function escapeAndNl2br(s = '') {
  const t = String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return t.replace(/\n/g, '<br>');
}

/* ===== Gọi API backend ===== */
async function callAPI(userText, history = []) {
  // Ghép thêm gợi ý tiếng Việt (không thay đổi câu hỏi của người dùng)
  const text = `${userText}\n\n${viHint}`;

  // API path / payload có thể khác — giữ nguyên endpoint hiện có của bạn
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, history }),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(msg || 'Lỗi máy chủ');
  }
  const data = await res.json();
  // giả định backend trả { answer: "...", history: [...] }
  return data;
}

/* ===== Logic gửi ===== */
let chatHistory = []; // nếu backend cần, bạn có thể lưu/tải vào localStorage

async function sendCurrentMessage() {
  if (!ta || !ta.value) return;

  const raw = ta.value.trim();
  if (!raw) return;

  setSendingState(true);
  showPending();

  // render user trước (tùy ý)
  renderMessage({ role: 'user', text: raw });

  try {
    const { answer, history } = await callAPI(raw, chatHistory);
    hidePending();

    // render bot
    renderMessage({ role: 'assistant', text: answer || '(Không có nội dung trả lời.)' });

    // cập nhật lịch sử (nếu backend trả về)
    if (Array.isArray(history)) chatHistory = history;
    ta.value = '';
  } catch (err) {
    hidePending();
    renderMessage({
      role: 'assistant',
      text: `Xin lỗi, đã xảy ra lỗi khi xử lý câu hỏi. (\u26A0\uFE0F ${err.message})`,
    });
  } finally {
    setSendingState(false);
    ta.focus();
  }
}

/* ===== Reset “New Chat” ===== */
function resetChatUI() {
  if (list) list.innerHTML = '';
  if (ta) {
    ta.value = '';
    ta.focus();
  }
  chatHistory = [];
  hidePending();
}

/* ===== Sự kiện bàn phím: Enter gửi, Shift+Enter xuống dòng ===== */
if (ta) {
  ta.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const isMetaEnter =
        e.metaKey || e.ctrlKey; // cho phép Ctrl/Cmd+Enter cũng gửi
      if (!e.shiftKey || isMetaEnter) {
        e.preventDefault();
        sendCurrentMessage();
      }
    }
  });
}

/* ===== Gắn sự kiện nút bấm ===== */
if (sendBtn) sendBtn.addEventListener('click', sendCurrentMessage);
if (newBtn)  newBtn.addEventListener('click', resetChatUI);

/* ===== Khởi tạo ban đầu ===== */
(function init() {
  // Nếu cần auto-focus ô nhập
  if (ta) ta.focus();
})();
