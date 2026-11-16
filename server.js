// 톡톡그램 — 사이버 공감 수업 시연용 가상 SNS 서버
// 외부 패키지 없이 Node.js 기본 모듈만 사용합니다. (Node 18 이상)
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = process.env.PORT || 3000;
const ADMIN_KEY = process.env.ADMIN_KEY || "teacher1234"; // 배포 시 꼭 바꾸세요
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "comments.json");
const PUBLIC_DIR = path.join(__dirname, "public");
const POST_IDS = ["p1", "p2", "p3"];
const MAX_NAME = 20;
const MAX_CONTENT = 300;
const MAX_COMMENTS = 2000;

// ---------- 데이터 저장 (메모리 + JSON 파일) ----------
let comments = [];
try {
  comments = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
} catch (_) {
  comments = [];
}
let saveTimer = null;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFile(DATA_FILE, JSON.stringify(comments), () => {});
  }, 300);
}
let version = Date.now();
function bump() { version = Date.now(); save(); }

// ---------- 도우미 ----------
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
};
function send(res, status, body, type = "application/json; charset=utf-8") {
  res.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store" });
  res.end(typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => {
      data += c;
      if (data.length > 10_000) { reject(new Error("too large")); req.destroy(); }
    });
    req.on("end", () => {
      try { resolve(data ? JSON.parse(data) : {}); } catch (e) { reject(e); }
    });
  });
}
function clean(s, max) {
  return String(s ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max);
}
function isAdmin(req) {
  return (req.headers["x-admin-key"] || "") === ADMIN_KEY;
}
function clientIp(req) {
  return (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.socket.remoteAddress;
}
const lastPost = new Map(); // 도배 방지: 기기당 2초에 1개

function serveFile(res, file) {
  const full = path.join(PUBLIC_DIR, file);
  if (!full.startsWith(PUBLIC_DIR)) return send(res, 403, { error: "forbidden" });
  fs.readFile(full, (err, buf) => {
    if (err) return send(res, 404, { error: "not found" });
    send(res, 200, buf, MIME[path.extname(full)] || "application/octet-stream");
  });
}

// ---------- 라우팅 ----------
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  const p = url.pathname;

  try {
    // 화면
    if (req.method === "GET" && (p === "/" || p === "/index.html")) return serveFile(res, "index.html");
    if (req.method === "GET" && p === "/admin") return serveFile(res, "admin.html");
    if (req.method === "GET" && p === "/qr") return serveFile(res, "qr.html");
    if (req.method === "GET" && p === "/health") return send(res, 200, { ok: true });
    if (req.method === "GET" && /^\/(app\.js|style\.css|admin\.js|favicon\.svg)$/.test(p)) return serveFile(res, p.slice(1));
    if (req.method === "GET" && /^\/img\/[\w-]+\.(png|jpe?g|webp)$/.test(p)) return serveFile(res, p.slice(1));

    // 댓글 목록
    if (req.method === "GET" && p === "/api/comments") {
      return send(res, 200, { version, comments: comments.filter((c) => !c.hidden || isAdmin(req)) });
    }

    // 댓글 쓰기
    if (req.method === "POST" && p === "/api/comments") {
      const body = await readBody(req);
      const postId = String(body.postId || "");
      const name = clean(body.name, MAX_NAME);
      const content = clean(body.content, MAX_CONTENT);
      if (!POST_IDS.includes(postId)) return send(res, 400, { error: "게시물을 찾을 수 없어요." });
      if (!name) return send(res, 400, { error: "이름을 입력해 주세요." });
      if (!content) return send(res, 400, { error: "내용을 입력해 주세요." });
      if (comments.length >= MAX_COMMENTS) return send(res, 400, { error: "댓글이 가득 찼어요. 선생님께 알려 주세요." });
      // 도배 방지는 기기별로 적용 (같은 와이파이의 여러 사람은 IP가 같을 수 있음)
      const cid = clean(body.clientId, 64);
      const who = cid ? "c:" + cid : "ip:" + clientIp(req);
      const now = Date.now();
      if (now - (lastPost.get(who) || 0) < 2000) return send(res, 429, { error: "조금 천천히 보내 주세요." });
      lastPost.set(who, now);
      if (lastPost.size > 5000) lastPost.clear();
      const c = { id: crypto.randomUUID(), postId, name, content, likes: 0, createdAt: now, hidden: false };
      comments.push(c);
      bump();
      return send(res, 201, c);
    }

    // 댓글 하트
    let m = p.match(/^\/api\/comments\/([\w-]+)\/like$/);
    if (req.method === "POST" && m) {
      const c = comments.find((x) => x.id === m[1]);
      if (!c) return send(res, 404, { error: "not found" });
      const body = await readBody(req).catch(() => ({}));
      c.likes = Math.max(0, c.likes + (body.undo ? -1 : 1));
      bump();
      return send(res, 200, { likes: c.likes });
    }

    // 관리자: 숨기기/보이기, 삭제, 전체 초기화
    m = p.match(/^\/api\/comments\/([\w-]+)$/);
    if (m && (req.method === "DELETE" || req.method === "PATCH")) {
      if (!isAdmin(req)) return send(res, 401, { error: "관리자 키가 올바르지 않아요." });
      const i = comments.findIndex((x) => x.id === m[1]);
      if (i < 0) return send(res, 404, { error: "not found" });
      if (req.method === "DELETE") comments.splice(i, 1);
      else comments[i].hidden = !comments[i].hidden;
      bump();
      return send(res, 200, { ok: true });
    }
    if (req.method === "POST" && p === "/api/reset") {
      if (!isAdmin(req)) return send(res, 401, { error: "관리자 키가 올바르지 않아요." });
      comments = [];
      bump();
      return send(res, 200, { ok: true });
    }
    if (req.method === "GET" && p === "/api/admin/check") {
      return send(res, isAdmin(req) ? 200 : 401, { ok: isAdmin(req) });
    }

    send(res, 404, { error: "not found" });
  } catch (e) {
    send(res, 400, { error: "요청을 처리하지 못했어요." });
  }
});

server.listen(PORT, () => {
  console.log(`톡톡그램 실행 중: http://localhost:${PORT}`);
  if (ADMIN_KEY === "teacher1234") console.log("※ ADMIN_KEY 환경변수를 설정해 관리자 키를 바꾸세요.");
});
