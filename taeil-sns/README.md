# 태일솔루션 SNS 자동 게시

카드 HTML → PNG 5장 → 인터넷 주소로 업로드 → 인스타그램 캐러셀 + 스레드 게시.

---

## 어디서 돌리나

**깃허브에서 돕니다.** 부장님 PC를 켜둘 필요가 없고, 무료입니다.

```
매주 월요일   Claude 가 아이디어 3개 + 카드 5장을 만들어 이 저장소에 올림
     ↓
부장님        내용 확인
     ↓
Actions 탭    "Run workflow" 버튼 한 번
     ↓
깃허브        카드를 인터넷에 올리고 인스타·스레드에 게시
```

버튼을 안 누르면 아무것도 안 나갑니다. 완전 자동으로 바꾸고 싶으면
`.github/workflows/post.yml` 안의 `schedule:` 주석 세 줄만 풀면 됩니다.

---

## 처음 한 번만 하는 준비

### 1. 깃허브 저장소 만들기

`github.com` 가입 후 새 저장소를 만듭니다.

- 이름: `taeil-sns`
- 공개 범위: **Public** — 카드 이미지가 인터넷 주소로 열려야 인스타가 가져갑니다.
  비밀값은 저장소가 아니라 Secrets 에 따로 들어가니 안전합니다.

이 폴더 전체를 그 저장소에 올립니다.

### 2. 비밀값 넣기

저장소 → **Settings → Secrets and variables → Actions → New repository secret**

| 이름 | 값 |
|---|---|
| `IG_USER_ID` | 인스타그램 비즈니스 계정 ID |
| `IG_ACCESS_TOKEN` | 장기 액세스 토큰 |
| `IG_APP_ID` | Meta 앱 ID |
| `IG_APP_SECRET` | Meta 앱 시크릿 |
| `TH_USER_ID` | 스레드 사용자 ID (스레드도 쓸 때만) |
| `TH_ACCESS_TOKEN` | 스레드 토큰 (스레드도 쓸 때만) |

`REPO_ADMIN_TOKEN` 을 추가로 넣으면 토큰 연장까지 자동으로 됩니다.
(깃허브 개인 토큰, 권한은 `repo` 하나면 충분)

### 3. 연습 실행

Actions 탭 → **SNS 게시** → Run workflow → **연습 모드를 켠 채로** 실행.

카드를 그려서 인터넷에 올리는 데까지만 하고 **게시는 하지 않습니다.**
실행 기록에서 카드 이미지를 내려받아 눈으로 확인하세요.

---

## 매주 하는 일

1. `cards/` 폴더의 카드 5장과 `caption.txt` 를 새 내용으로 교체 (Claude 가 만들어 드립니다)
2. Actions 탭 → Run workflow → 연습 모드 **끄고** 실행

---

## 내 PC에서 돌리고 싶다면

```
npm install
npx playwright install chromium
cp config.example.json config.json      # 값을 채운다
node check.js                            # 연결 점검, 게시 안 함
node post.js --dry                       # 연습
node post.js                             # 실제 게시
node refresh.js                          # 토큰 60일 연장
```

`config.json` 은 비밀번호와 같습니다. 절대 저장소에 올리지 마세요.
(`.gitignore` 에 이미 넣어뒀습니다.)

---

## 알아둘 것

**토큰은 60일마다 만료됩니다.** 매달 1일 자동 연장이 걸려 있습니다. 만료되고 나면
연장이 안 되고 처음부터 다시 발급받아야 하니, 두 달 넘게 안 돌리지 마세요.

**인스타 캐러셀은 사진 2~10장**입니다. 5장이 기본이지만 늘리고 줄여도 됩니다.

**스레드는 사진 1장**만 올라갑니다. 1컷 후킹 카드를 씁니다.
본문은 `caption_threads.txt` 를 씁니다. 없으면 인스타 캡션을 그대로 씁니다.

**게시 한도** — 스레드는 24시간에 250건. 주 1회 게시라 걱정할 수준이 아닙니다.

**실패하면** 실행 기록에 오류 메시지가 그대로 남습니다.
그 메시지를 통째로 복사해서 알려주시면 원인을 찾아드립니다.

---

## 폴더 설명

```
cards/          카드 HTML 5장 — 매주 교체
caption.txt     인스타 캡션
caption_threads.txt  스레드 본문
lib/            실제 동작하는 코드
.github/workflows/   깃허브 자동 실행 설정
out/            만들어진 PNG (자동 생성)
```
