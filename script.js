// ===== UI helpers =====
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const list = $("#messages");
const ta   = $("#textarea");
const qbar = $("#qbar");

// Populate from quick chips
$$(".chip").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    const v = btn.getAttribute("data-q") || "";
    ta.value = v;
    ta.focus();
  });
});

// Send on button / Shift+Enter new line
$("#sendbtn").addEventListener("click", () => window.sendMessage());
ta.addEventListener("keydown", (e)=>{
  if (e.key === "Enter" && !e.shiftKey){
    e.preventDefault();
    window.sendMessage();
  }
});

// New chat
function resetChatUI(){
  list.innerHTML = "";
  ta.value = "";
  ta.focus();
}
$("#newchatbtn").addEventListener("click", resetChatUI);

// Keyboard shortcut New Chat
document.addEventListener("keydown", (e)=>{
  const mac = navigator.platform.toUpperCase().includes("MAC");
  const mod = mac ? e.metaKey : e.ctrlKey;
  if (mod && e.shiftKey && e.key.toLowerCase() === "k"){
    e.preventDefault();
    resetChatUI();
  }
});

// Copy & Download
$("#copybtn").addEventListener("click", ()=>{
  const all = $$(".bubble").map(n => n.innerText).join("\n\n");
  navigator.clipboard.writeText(all).then(()=> {
    toast("Đã sao chép ✨");
  });
});
$("#dlbtn").addEventListener("click", ()=>{
  const all = $$(".bubble").map(n => n.innerText).join("\n\n");
  const blob = new Blob([all], {type:"text/plain;charset=utf-8"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "pbpl_chat.txt";
  a.click();
  URL.revokeObjectURL(a.href);
});

// Small toast
function toast(msg){
  const note = document.createElement("div");
  note.className = "toast";
  note.textContent = msg;
  document.body.appendChild(note);
  setTimeout(()=>note.remove(), 1400);
}

// When users press Enter in greet bar
qbar.addEventListener("keydown",(e)=>{
  if(e.key==="Enter"){
    e.preventDefault();
    ta.value = qbar.value;
    ta.focus();
  }
});

// expose list/ta for chat.js
window.__pbpl = { list, ta };
