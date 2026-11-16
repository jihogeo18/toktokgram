const POST_NAME = { p1: "① 도윤 (이단뛰기)", p2: "② 서윤 (말 걸지 마)", p3: "③ 하린 (놀이공원)" };
let key = sessionStorage.getItem("tt_admin") || "";
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

async function ensureKey() {
  while (true) {
    if (!key) key = prompt("관리자 키를 입력하세요") || "";
    if (!key) return false;
    const r = await fetch("/api/admin/check", { headers: { "x-admin-key": key } });
    if (r.ok) { sessionStorage.setItem("tt_admin", key); return true; }
    alert("키가 올바르지 않아요.");
    key = "";
  }
}

async function load() {
  const r = await fetch("/api/comments", { headers: { "x-admin-key": key }, cache: "no-store" });
  const { comments } = await r.json();
  comments.sort((a, b) => a.postId.localeCompare(b.postId) || a.createdAt - b.createdAt);
  document.getElementById("list").innerHTML = comments.length
    ? `<table><tr><th>게시물</th><th>이름</th><th>내용</th><th>♥</th><th>시간</th><th></th></tr>` +
      comments.map((c) => `<tr class="${c.hidden ? "hidden-row" : ""}">
        <td>${POST_NAME[c.postId]}</td><td>${esc(c.name)}</td><td>${esc(c.content)}</td><td>${c.likes}</td>
        <td>${new Date(c.createdAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}</td>
        <td style="white-space:nowrap"><button class="btn" data-hide="${c.id}">${c.hidden ? "보이기" : "숨기기"}</button>
        <button class="btn danger" data-del="${c.id}">삭제</button></td></tr>`).join("") + `</table>`
    : "<p>아직 댓글이 없어요.</p>";
}

async function call(method, url) {
  const r = await fetch(url, { method, headers: { "x-admin-key": key } });
  if (!r.ok) alert((await r.json()).error || "실패했어요.");
  load();
}

document.addEventListener("click", (e) => {
  const h = e.target.closest("[data-hide]");
  if (h) return call("PATCH", `/api/comments/${h.dataset.hide}`);
  const d = e.target.closest("[data-del]");
  if (d && confirm("이 댓글을 삭제할까요?")) return call("DELETE", `/api/comments/${d.dataset.del}`);
  if (e.target.id === "reset" && confirm("모든 댓글을 지울까요? 되돌릴 수 없어요.")) return call("POST", "/api/reset");
  if (e.target.id === "refresh") load();
});

ensureKey().then((ok) => {
  if (!ok) { document.getElementById("list").textContent = "관리자 키가 필요해요."; return; }
  load();
  setInterval(load, 4000);
});
