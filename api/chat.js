/* =========================================================
   PHÁP BẢO PHÚC LẠC • CHATBOT
   chat.js — bản vá nhỏ (patch) dành cho:
   - Sửa nút GỬI không phản hồi
   - Hiển thị Markdown (chữ đậm, tiêu đề, gạch dòng,…)
   - Xử lý lỗi server (FUNCTION_INVOCATION_FAILED) có fallback
   - Nút New Chat xoá sạch & focus vào ô nhập
   ========================================================= */

/* ---------- 0) Tiện ích tìm phần tử an toàn ---------- */
const $ = (sel) => document.querySelector(sel);

// Gắng tìm các phần tử dù dự án đặt class/id khác nhau
const els = {
  list: $("#messages") || $(".msgs") || $("#msgs") || $(".chat-list") || $("#chat-list"),
  input: $("#textarea") || $("textarea") || $("#input") || $(".chat-input"),
  send: $("#sendbtn") || $("[data-send]") || $(".btn-send") || $(".icon-send") || $(".send"),
  newChat: $("#newchatbtn") || $("[data-newchat]") || $(".btn-newchat") || $(".new-chat"),
  copyBtn: $("#copybtn") || $("[data-copy]"),
  downloadBtn: $("#downloadbtn") || $("[data-download]"),
};

// Nếu thiếu khung hiển thị thì tự tạo đơn giản để tránh lỗi
if (!els.list) {
  const box = document.createElement("div");
  box.id = "messages";
  box.style.cssText = "min-height:160px;border-radius:10px;background:#fff;border:1px solid #eee;padding:14px;";
  ( $("#chatbox") || document.body ).appendChild(box);
  els.list = box;
}

/* ---------- 1) Đảm bảo thư viện Markdown đã sẵn sàng ---------- */
(function ensureMarked() {
  if (window.marked) return;
  const s = document.createElement("script");
  s.src = "https://cdn.jsdelivr.net/npm/marked/marked.min.js";
  s.defer = true;
  document.head.appendChild(s);
})();

/* ---------- 2) Nạp bộ dữ liệu Phật học (Markdown) nếu có ---------- */
/* Cách 1: nếu đệ để file ở /data/Bo_12_Chu_De_Phat_Hoc.md */
(async function loadLocalDharma() {
  try {
    const res = await fetch("/data/Bo_12_Chu_De_Phat_Hoc.md", { cache: "no-cache" });
    if (res.ok) {
      window.phatHocData = await res.text();
      buildSectionIndex(window.phatHocData);
    }
  } catch(_) { /* im lặng – không sao */ }
})();

/* Cách 2: nếu không có file, có thể dán dữ liệu mẫu trực tiếp ở đây (tuỳ chọn) */
// window.phatHocData = `# MẪU
// ## Sáu căn, sáu trần, sáu thức
// **Ý nghĩa & thực hành** …
// `;

/* Tạo index nhanh -> tìm đoạn theo tiêu đề "## " */
let sectionIndex = [];
function buildSectionIndex(md) {
  sectionIndex = [];
  const lines = md.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    if (/^##\s+/.test(lines[i])) {
      const title = lines[i].replace(/^##\s+/, '').trim();
      sectionIndex.push({ title, line: i });
    }
  }
}
function findSectionByQuery(q) {
  if (!window.phatHocData || !sectionIndex.length) return null;
  const norm = (s) => s.toLowerCase().normalize("NFC");
  q = norm(q);

  // Tìm tiêu đề gần nghĩa bằng các từ khoá
  let best = sectionIndex.find(sec => {
    const t = norm(sec.title);
    return t.includes("sáu căn") || t.includes("sáu trần") || t.includes("sáu thức")
      ? (q.includes("sáu căn") || q.includes("sáu trần") || q.includes("sáu thức"))
      : q.includes(t);
  });

  if (!best) {
    // dò tiêu đề chứa bất kỳ từ trong câu hỏi
    best = sectionIndex.find(sec => norm(sec.title).split(/\s+/).some(w => q.includes(w)));
  }
  if (!best) return null;

  // cắt từ tiêu đề đó đến tiêu đề kế tiếp
  const lines = window.phatHocData.split(/\r?\n/);
  const start = best.line;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^##\s+/.test(lines[i])) { end = i; break; }
  }
  return lines.slice(start, end).join("\n");
}

/* ---------- 3) Giao diện: thêm/xoá tin nhắn ---------- */
function mdToHtml(md) {
  if (!window.marked) return md; // phòng khi CDN chưa tải kịp
  return window.marked.parse(md);
}
function addMsg(role, text) {
  const wrap = document.createElement("div");
  wrap.className = `msg msg-${role}`;
  wrap.style.cssText = "margin:10px 0; white-space:normal; line-height:1.65;";

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.style.cssText = role === "user"
    ? "background:#f6f8fa;border:1px solid #eaeef2;padding:12px 14px;border-radius:10px;max-width:100%;"
    : "background:#ffffff;border:1px solid #e8e8e8;padding:12px 14px;border-radius:10px;max-width:100%;";

  // Hỗ trợ Markdown
  bubble.innerHTML = mdToHtml(text);
  wrap.appendChild(bubble);
  els.list.appendChild(wrap);
  els.list.scrollTop = els.list.scrollHeight;
}
function addSystemNote(text) {
  const note = document.createElement("div");
  note.style.cssText = "color:#9aa1a7;font-size:12px;margin:10px 2px;";
  note.textContent = text;
  els.list.appendChild(note);
  els.list.scrollTop = els.list.scrollHeight;
}
function resetChat() {
  els.list.innerHTML = "";
  if (els.input) {
    els.input.value = "";
    els.input.focus();
  }
}

/* ---------- 4) Gửi câu hỏi ---------- */
let busy = false;
let currentAbort = null;

async function ask(question) {
  if (busy) return;
  const q = (question || (els.input && els.input.value) || "").trim();
  if (!q) {
    if (els.input) els.input.focus();
    return;
  }

  addMsg("user", q);
  if (els.input) els.input.value = "";

  // Khoá nút gửi & chuẩn bị abort
  busy = true;
  if (els.send) {
    els.send.setAttribute("disabled", "true");
    els.send.style.opacity = "0.6";
  }
  if (currentAbort) try { currentAbort.abort(); } catch(_) {}
  const aborter = new AbortController();
  currentAbort = aborter;

  // Ghép context từ file Markdown (nếu có) để model trả lời sát nội dung
  const context = window.phatHocData ? `\n\n# TƯ LIỆU THAM KHẢO\n${window.phatHocData}` : "";

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q,
        // Nếu server /api/chat của đệ dùng trường khác, vẫn giữ "q" – phổ biến nhất
        context
      }),
      signal: aborter.signal
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} - ${text || "Server error"}`);
    }

    // Nhiều dự án trả về { answer: "...markdown..." }
    const data = await res.json().catch(() => ({}));
    const answer = data.answer || data.output || data.text || "";

    if (answer && typeof answer === "string") {
      addMsg("assistant", answer);
    } else {
      throw new Error("Empty response body");
    }

  } catch (err) {
    // Fallback khi server lỗi hoặc FUNCTION_INVOCATION_FAILED
    console.warn("API error:", err);
    const fallback = findSectionByQuery(q);
    if (fallback) {
      addMsg(
        "assistant",
        `> 💡 *Máy chủ đang bận, mình tạm hiển thị nội dung tóm lược từ tài liệu có sẵn.*\n\n${fallback}\n\n---\n*Bạn có muốn mình gợi ý bài đọc liên quan không?*`
      );
    } else {
      addMsg(
        "assistant",
        `**Xin lỗi**, máy chủ đang bận hoặc có lỗi tạm thời.\n\n\`\`\`\n${(err && err.message) || err}\n\`\`\`\n\nBạn có thể bấm **New Chat** rồi hỏi lại, hoặc thử một câu gần nghĩa hơn như:\n- "Giải thích tóm tắt Tứ Diệu Đế"\n- "Sáu căn sáu trần sáu thức là gì?"`
      );
    }
  } finally {
    busy = false;
    if (els.send) {
      els.send.removeAttribute("disabled");
      els.send.style.opacity = "1";
    }
    currentAbort = null;
  }
}

/* ---------- 5) Gán sự kiện UI ---------- */
function bindUI() {
  // Enter gửi – Shift+Enter xuống dòng
  if (els.input) {
    els.input.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" && !ev.shiftKey) {
        ev.preventDefault();
        ask();
      }
    });
  }

  // Nút gửi
  if (els.send) {
    els.send.addEventListener("click", () => ask());
  }

  // Nút New Chat
  if (els.newChat) {
    els.newChat.addEventListener("click", () => {
      resetChat();
      addSystemNote('Bắt đầu cuộc hội thoại mới. 🙏');
    });
  }

  // Copy toàn bộ
  if (els.copyBtn) {
    els.copyBtn.addEventListener("click", async () => {
      try {
        const all = Array.from(els.list.querySelectorAll(".bubble"))
          .map(n => n.innerText.trim())
          .join("\n\n— — —\n\n");
        await navigator.clipboard.writeText(all);
        addSystemNote("✅ Đã sao chép nội dung cuộc trò chuyện.");
      } catch {
        addSystemNote("⚠️ Trình duyệt không cho phép sao chép tự động.");
      }
    });
  }

  // Tải .txt
  if (els.downloadBtn) {
    els.downloadBtn.addEventListener("click", () => {
      const all = Array.from(els.list.querySelectorAll(".bubble"))
        .map(n => n.innerText.trim())
        .join("\n\n— — —\n\n");
      const blob = new Blob([all], { type: "text/plain;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "pbpl_chat.txt";
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 500);
      addSystemNote("💾 Đã tải tệp cuộc trò chuyện.");
    });
  }

  // Gợi ý lời chào đầu – nếu khung đang rỗng
  if (!els.list.innerText.trim()) {
    addSystemNote(
      'Xin chào! Bạn có thể thử hỏi: **"Giải thích Tứ Diệu Đế thật dễ hiểu"**, hoặc **"Sáu căn sáu trần sáu thức là gì?"**.'
    );
  }
}

document.addEventListener("DOMContentLoaded", bindUI);
/* =========================================================
   PBPL • Rescue Patch B — Tự bắt lỗi server & trả lời dự phòng
   Dán ĐOẠN NÀY Ở CUỐI FILE chat.js (sau tất cả các code khác)
   ========================================================= */
console.log("[PBPL] chat.js loaded & rescue patch active");

(function watchServerErrors() {
  // Quan sát toàn bộ trang, khi một node mới (phần lỗi) xuất hiện sẽ xử lý ngay.
  const obs = new MutationObserver((muts) => {
    for (const m of muts) {
      for (const node of m.addedNodes) {
        if (node.nodeType !== 1) continue; // chỉ xét element
        const el = /** @type {HTMLElement} */ (node);
        const text = (el.innerText || "").trim();
        if (!text) continue;

        // Bắt các biến thể phổ biến của lỗi server
        const isServerError =
          text.includes("FUNCTION_INVOCATION_FAILED") ||
          text.includes("A server error has occurred") ||
          text.includes("Xin lỗi, đã xảy ra lỗi khi xử lý câu hỏi");

        if (isServerError && !el.dataset.pbplHandled) {
          el.dataset.pbplHandled = "1";

          // Cố gắng lấy câu hỏi gần nhất (dòng ngay phía trước lỗi)
          let q = "";
          try {
            const root = el.parentElement || el;
            const allTxt = (root.innerText || "").split(/\r?\n/).map(s => s.trim()).filter(Boolean);
            const errIdx = allTxt.findIndex(s =>
              s.includes("FUNCTION_INVOCATION_FAILED") ||
              s.includes("A server error has occurred")
            );
            // Thường câu hỏi nằm 1–2 dòng trước lỗi
            if (errIdx > 0) q = allTxt[errIdx - 2] || allTxt[errIdx - 1] || "";
          } catch (_) {}

          if (!q && els.input) q = (els.input.value || "").trim();

          // Tìm đoạn phù hợp trong tài liệu Markdown (nếu đã nạp)
          let reply = "";
          const sec = (typeof findSectionByQuery === "function") ? findSectionByQuery(q) : null;

          if (sec) {
            reply =
`> 💡 *Máy chủ đang bận, mình tạm hiển thị nội dung tóm lược từ tài liệu có sẵn.*  

${sec}

---

*Bạn muốn mình gợi ý thêm bài đọc liên quan không?*`;
          } else {
            reply =
`**Xin lỗi**, máy chủ đang bận hoặc có lỗi tạm thời.

Bạn có thể hỏi lại, hoặc thử những câu gần nghĩa như:
- "Giải thích Tứ Diệu Đế thật dễ hiểu"
- "Sáu căn, sáu trần, sáu thức là gì?"
- "Bát Chánh Đạo ứng dụng hằng ngày"`;
          }

          // Chen câu trả lời dự phòng vào khung chat (Markdown)
          try { addMsg("assistant", reply); } catch (_) {
            // Nếu chưa có addMsg (rất hiếm), tạo tối thiểu:
            const div = document.createElement("div");
            div.style.cssText = "margin:10px 0;padding:12px;border:1px solid #eee;background:#fff;border-radius:10px;white-space:pre-wrap;line-height:1.65";
            div.textContent = reply.replace(/[*_`>#]/g, ""); // bỏ ký hiệu MD nếu không có renderer
            (document.querySelector("#messages") || document.body).appendChild(div);
          }
        }
      }
    }
  });

  obs.observe(document.body, { childList: true, subtree: true });
})();
