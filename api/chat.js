// Chat logic — call your Vercel serverless function /api/chat
const { list, ta } = window.__pbpl;

// Render helper: Markdown -> HTML (safe)
function renderMarkdown(md){
  const html = marked.parse(md || "");
  return DOMPurify.sanitize(html);
}

function addMsg(role, html){
  const li = document.createElement("li");
  li.className = "msg" + (role === "me" ? " me" : "");
  li.innerHTML = `<div class="bubble" role="group">${html}</div>`;
  list.appendChild(li);
  li.scrollIntoView({behavior:"smooth", block:"end"});
  return li.querySelector(".bubble");
}

async function callAPI(prompt){
  // Bạn đã có endpoint /api/chat trên Vercel dùng OPENAI_API_KEY
  // Bản này gửi cấu hình theo yêu cầu: temperature=0.5, giới hạn ~320 từ (≈ 480 tokens)
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({
      prompt,
      temperature: 0.5,
      max_tokens: 480,
      system: [
        "Bạn là Pháp Bảo Chatbot: giọng từ tốn, ấm, rõ ràng; tránh giáo điều.",
        "Ưu tiên ví dụ gần gũi, kết thúc bằng gợi ý thực hành ngắn.",
        "Nếu nội dung chứa Markdown (#, ##, **, - ...), hãy dùng như định dạng trình bày."
      ].join(" ")
    })
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json(); // { text: "..." } — giữ đúng với /api/chat của bạn
}

window.sendMessage = async function(){
  const content = (ta.value || "").trim();
  if(!content) { ta.focus(); return; }

  // User bubble
  addMsg("me", renderMarkdown(content));
  ta.value = "";
  ta.focus();

  // Assistant placeholder
  const holder = addMsg("assistant", "<em>Đang xử lý câu hỏi của bạn...</em>");

  try{
    const data = await callAPI(content);
    holder.innerHTML = renderMarkdown(data.text || "(không có nội dung)");
  }catch(err){
    holder.innerHTML = `<span style="color:#b91c1c">Xin lỗi, có lỗi khi gọi API.</span><br><small>${DOMPurify.sanitize(String(err.message || err))}</small>`;
  }
};
