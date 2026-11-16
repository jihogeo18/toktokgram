// 톡톡그램 화면 스크립트
const POSTS = [
  {
    id: "p1", author: "도윤", color: "#ffd66b", place: "○○초 운동장", time: "1시간",
    likes: 12,
    caption: "줄넘기 이단뛰기 드디어 10개 성공!! 3주 동안 매일 연습함 ㅠㅠ",
    media: `<div class="media m1">
      <div class="m1-count">10<span>개</span></div>
      <div class="m1-title">이단뛰기 성공!</div>
      <div class="m1-days">연습 21일째 · 매일 30분</div>
      <div class="m1-rope" aria-hidden="true"></div>
    </div>`,
    seed: [
      { name: "익명1", content: "그게 뭐가 어렵냐ㅋ", likes: 5 },
      { name: "익명2", content: "난 50개 하는데", likes: 1 },
    ],
  },
  {
    id: "p2", author: "서윤", color: "#8fd3c8", place: "", time: "35분",
    likes: 0, readCount: 23,
    caption: "",
    media: `<div class="media m2"><p>오늘 발표 완전 망했다…<br>다들 웃던데.<br><br>그냥 아무도 말 걸지 마.</p></div>`,
    seed: [],
  },
  {
    id: "p3", author: "하치와레", color: "#b9c7f5", place: "우리 동굴집", time: "20분",
    likes: 31,
    caption: "오늘 저녁은 둘이서 따끈한 국수 🍜 우리 최고 ♥ #절친 #맛있다",
    media: `<div class="media photo"><img src="/img/post3.png" alt="친구 둘이 마주 앉아 국수를 먹는 사진"></div>`,
    seed: [
      { name: "익명3", content: "부럽다ㅠㅠ", likes: 2 },
      { name: "우사기", content: "..다음엔 나도 껴줘", likes: 0, avatar: "/img/yerin.png" },
    ],
  },
];

const ICON = {
  heart: '<path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.2 5.3 3.2 1.7-2 3.2-3.2 5.3-3.2 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z"/>',
  comment: '<path d="M20.5 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20.5l1.6-4.6A8.5 8.5 0 1 1 20.5 11.5z"/>',
  send: '<path d="M3 11.5 21 3l-8.5 18-2.2-7.3L3 11.5z"/>',
  save: '<path d="M6 3h12v18l-6-4.5L6 21z"/>',
};
const svg = (k, cls = "") => `<svg class="${cls}" viewBox="0 0 24 24">${ICON[k]}</svg>`;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// 로컬 저장: 이름, 내가 쓴 댓글, 하트 누른 댓글
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};
let myIds = new Set(store.get("tt_mine", []));
let liked = new Set(store.get("tt_liked", []));
let postLiked = new Set(store.get("tt_postliked", []));
let comments = [];
let version = 0;

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "방금";
  if (s < 3600) return `${Math.floor(s / 60)}분`;
  return `${Math.floor(s / 3600)}시간`;
}

function renderFeed() {
  const feed = document.getElementById("feed");
  const savedName = store.get("tt_name", "");
  feed.innerHTML = POSTS.map((p) => `
    <article class="post" id="${p.id}">
      <header class="post-head">
        <span class="ring sm"><span class="av" style="background:${p.color}">${p.author[0]}</span></span>
        <div class="who"><b>${p.author}</b>${p.place ? `<small>${p.place}</small>` : ""}</div>
        <span class="more" aria-hidden="true">···</span>
      </header>
      ${p.media}
      <div class="actions">
        <button class="icon-btn like-post ${postLiked.has(p.id) ? "on" : ""}" data-post="${p.id}" aria-label="좋아요">${svg("heart")}</button>
        <button class="icon-btn focus-input" data-post="${p.id}" aria-label="댓글 달기">${svg("comment")}</button>
        <span class="icon-btn" aria-hidden="true">${svg("send")}</span>
        <span class="icon-btn right" aria-hidden="true">${svg("save")}</span>
      </div>
      <div class="post-body">
        ${p.readCount != null
          ? `<div class="likes">읽음 ${p.readCount} · 좋아요 <span data-postlikes="${p.id}">${p.likes + (postLiked.has(p.id) ? 1 : 0)}</span>개</div>`
          : `<div class="likes">좋아요 <span data-postlikes="${p.id}">${p.likes + (postLiked.has(p.id) ? 1 : 0)}</span>개</div>`}
        ${p.caption ? `<p class="caption"><b>${p.author}</b> ${esc(p.caption)}</p>` : ""}
        <div class="comment-count" data-count="${p.id}"></div>
        <ul class="comments" data-list="${p.id}"></ul>
        <div class="time">${p.time} 전</div>
      </div>
      <form class="composer" data-post="${p.id}" autocomplete="off">
        <div class="row">
          <input class="name" name="author" maxlength="20" placeholder="이름" value="${esc(savedName)}" required>

        </div>
        <div class="row">
          <textarea name="content" rows="1" maxlength="300" placeholder="${p.author}에게 댓글 달기…" required></textarea>
          <button class="send" type="submit">보내기</button>
        </div>
      </form>
    </article>`).join("");
  renderComments();
}

function commentLi(c, seeded) {
  const mine = !seeded && myIds.has(c.id);
  const on = !seeded && liked.has(c.id);
  return `<li class="cmt ${mine ? "mine" : ""} ${c.hidden ? "hidden-c" : ""}">
    ${c.avatar
      ? `<img class="av xs photo" src="${c.avatar}" alt="${esc(c.name)} 프로필">`
      : `<span class="av xs" style="background:${seeded ? "#e3e6ea" : colorFor(c.name)}">${esc(c.name[0] || "?")}</span>`}
    <div class="cbody">
      <p><b>${esc(c.name)}</b> ${esc(c.content)}</p>
      <small>${seeded ? "1시간" : timeAgo(c.createdAt)}${(c.likes || 0) > 0 ? ` · 좋아요 ${c.likes}개` : ""}${mine ? " · 내 댓글" : ""}</small>
    </div>
    ${seeded
      ? `<span class="heart" aria-hidden="true">${svg("heart")}</span>`
      : `<button class="heart ${on ? "on" : ""}" data-like="${c.id}" aria-label="이 댓글에 하트">${svg("heart")}</button>`}
  </li>`;
}

function colorFor(name) {
  const palette = ["#ffd66b", "#8fd3c8", "#b9c7f5", "#ffb49e", "#c9e6a5", "#f5c2e7", "#a8dcf0"];
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.codePointAt(0)) >>> 0;
  return palette[h % palette.length];
}

function renderComments() {
  for (const p of POSTS) {
    const list = document.querySelector(`[data-list="${p.id}"]`);
    if (!list) continue;
    const mine = comments.filter((c) => c.postId === p.id).sort((a, b) => a.createdAt - b.createdAt);
    list.innerHTML = p.seed.map((c) => commentLi(c, true)).join("") + mine.map((c) => commentLi(c, false)).join("");
    const total = p.seed.length + mine.length;
    document.querySelector(`[data-count="${p.id}"]`).textContent = total ? `댓글 ${total}개` : "아직 댓글이 없어요";
  }
}

async function load() {
  try {
    const r = await fetch("/api/comments", { cache: "no-store" });
    const data = await r.json();
    if (data.version !== version) {
      version = data.version;
      comments = data.comments;
      renderComments();
    }
  } catch (_) { /* 잠시 연결이 끊겨도 다음 주기에 다시 시도 */ }
}

function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove("show"), 2200);
}

document.addEventListener("submit", async (e) => {
  const form = e.target.closest(".composer");
  if (!form) return;
  e.preventDefault();
  const name = form.author.value.trim();
  const content = form.content.value.trim();
  if (!name) return toast("이름을 입력해 주세요.");
  if (!content) return toast("내용을 입력해 주세요.");
  const btn = form.querySelector(".send");
  btn.disabled = true;
  try {
    const r = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId: form.dataset.post, name, content }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || "보내지 못했어요.");
    store.set("tt_name", name);
    document.querySelectorAll(".composer .name").forEach((i) => { if (!i.value) i.value = name; });
    myIds.add(data.id);
    store.set("tt_mine", [...myIds]);
    comments.push(data);
    renderComments();
    form.content.value = "";
    autosize(form.content);
    toast("댓글이 달렸어요!");
  } catch (err) {
    toast(err.message);
  } finally {
    btn.disabled = false;
  }
});

document.addEventListener("click", async (e) => {
  const chip = e.target.closest(".chip");
  if (chip) {
    const ta = chip.closest(".composer").content;
    if (!ta.value.includes(chip.dataset.tag)) {
      ta.value = (ta.value.trimEnd() + " " + chip.dataset.tag).trimStart();
      autosize(ta);
    }
    ta.focus();
    return;
  }
  const f = e.target.closest(".focus-input");
  if (f) { document.querySelector(`.composer[data-post="${f.dataset.post}"] textarea`).focus(); return; }

  const lp = e.target.closest(".like-post");
  if (lp) {
    const id = lp.dataset.post;
    postLiked.has(id) ? postLiked.delete(id) : postLiked.add(id);
    store.set("tt_postliked", [...postLiked]);
    lp.classList.toggle("on");
    const base = POSTS.find((p) => p.id === id).likes;
    document.querySelector(`[data-postlikes="${id}"]`).textContent = base + (postLiked.has(id) ? 1 : 0);
    return;
  }

  const h = e.target.closest("[data-like]");
  if (h) {
    const id = h.dataset.like;
    const undo = liked.has(id);
    undo ? liked.delete(id) : liked.add(id);
    store.set("tt_liked", [...liked]);
    const c = comments.find((x) => x.id === id);
    if (c) c.likes = Math.max(0, (c.likes || 0) + (undo ? -1 : 1));
    renderComments();
    fetch(`/api/comments/${id}/like`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ undo }),
    }).catch(() => {});
  }
});

function autosize(ta) { ta.style.height = "auto"; ta.style.height = Math.min(ta.scrollHeight, 140) + "px"; }
document.addEventListener("input", (e) => { if (e.target.matches(".composer textarea")) autosize(e.target); });

renderFeed();
load();
setInterval(() => { if (!document.hidden) load(); }, 3000);
setInterval(renderComments, 60000); // 'n분 전' 갱신
