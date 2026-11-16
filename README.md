# 톡톡그램 — 사이버 공감 수업 시연용 가상 SNS

인스타그램처럼 보이는 모바일 웹페이지에 고정 게시물 3개가 올라가 있고, 누구나 **이름 + 내용**을 입력하고 **보내기**를 눌러 댓글을 달 수 있습니다. 다른 사람이 단 댓글은 3초마다 자동으로 보입니다.

## 주소 구성

| 주소 | 용도 |
| --- | --- |
| `/` | 학생(청중) 화면. QR로 접속하는 곳 |
| `/qr` | 발표 화면에 띄울 큰 QR 코드 (자기 주소로 자동 생성) |
| `/admin` | 교사용 관리: 장난 댓글 숨기기·삭제, 전체 초기화 (관리자 키 필요) |
| `/health` | 서버 상태 확인용 |

## 파일 구성

```
toktokgram/
├─ server.js        # 서버 (외부 패키지 없음, Node.js 18 이상)
├─ package.json
└─ public/
   ├─ index.html    # 학생 화면
   ├─ app.js        # 게시물 3개 내용과 댓글 기능 (게시물 글을 바꾸려면 이 파일 맨 위 POSTS 수정)
   ├─ style.css
   ├─ admin.html, admin.js
   ├─ qr.html
   └─ favicon.svg
```

## 내 컴퓨터에서 먼저 실행해 보기 (선택)

1. https://nodejs.org 에서 Node.js LTS 설치
2. 이 폴더에서 터미널(명령 프롬프트)을 열고 `npm start`
3. 브라우저에서 http://localhost:3000 접속 (관리 화면 키 기본값: `teacher1234`)

## 인터넷에 배포하기 — Render 무료 플랜 (약 10분)

### 1단계. GitHub에 올리기
1. https://github.com 가입 → 오른쪽 위 **+** → **New repository**
2. 이름 `toktokgram`, **Public** 선택 → **Create repository**
3. 새 저장소 화면에서 **uploading an existing file** 클릭
4. 압축을 푼 `toktokgram` 폴더 **안의 내용물**(server.js, package.json, public 폴더, README.md)을 끌어다 놓기 → **Commit changes**
   - `server.js`가 저장소 맨 위에 보여야 합니다. `toktokgram/server.js`처럼 한 단계 안에 들어가 있으면 안 됩니다.

### 2단계. Render에서 서버 만들기
1. https://render.com → **Get Started** → **GitHub로 가입**
2. 대시보드에서 **New +** → **Web Service**
3. GitHub 연결을 허용하고 `toktokgram` 저장소 선택 → **Connect**
4. 설정값:
   - **Name**: `toktokgram-원하는이름` (주소가 `https://이름.onrender.com`이 됩니다)
   - **Region**: Singapore (한국에서 가장 가까움)
   - **Branch**: main
   - **Runtime / Language**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: **Free**
5. **Environment Variables**에서 **Add Environment Variable**
   - Key `ADMIN_KEY`, Value: 나만 아는 비밀번호 (관리 화면용)
6. **Create Web Service** → 로그에 `톡톡그램 실행 중`이 뜨고 상태가 **Live**가 되면 완료
7. 화면 위쪽의 `https://○○○.onrender.com` 주소가 학생 접속 주소입니다.

### 3단계. QR 만들기
- `https://○○○.onrender.com/qr` 을 열면 그 주소로 연결되는 QR이 크게 나옵니다. 발표 슬라이드 13번에 이 화면을 캡처해 넣거나, 시연 중 이 탭을 띄우세요.

## 시연 당일 체크리스트

- [ ] **시연 2~3분 전에 주소를 한 번 열어 서버 깨우기** — 무료 플랜은 15분 동안 접속이 없으면 잠들고, 다시 깨어나는 데 약 1분 걸립니다.
- [ ] 발표 내내 노트북에서 학생 화면 탭을 열어 두기 (3초마다 서버에 요청을 보내므로 잠들지 않습니다)
- [ ] `/admin`에서 **전체 초기화**로 테스트 댓글 지우기
- [ ] 휴대폰 1대로 QR 접속 → 댓글 1개 달아 보기 → 관리 화면에서 삭제

## 알아 둘 점

- 무료 플랜은 **서버가 재시작·재배포되거나 잠들면 댓글이 사라집니다.** 수업 시연용으로는 문제없지만, 남겨야 할 댓글은 시연 직후 `/admin` 화면을 캡처해 두세요.
- 같은 휴대폰에서는 2초에 댓글 1개만 보낼 수 있습니다(도배 방지). 이름은 최대 20자, 내용은 최대 300자입니다.
- 게시물 글이나 미리 달린 댓글을 바꾸려면 `public/app.js` 맨 위 `POSTS`를 고쳐 GitHub에 다시 올리면 Render가 자동으로 다시 배포합니다.
