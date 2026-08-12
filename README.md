# 쏙 랜딩 페이지

1차 가설 검증 라운드용 랜딩. 빌드 도구 없는 정적 3파일이라 그대로 배포하면 된다.

```
index.html      마크업
styles.css      스타일 (디자인 토큰은 :root)
main.js         데모 상태 머신 · 폼 · 계측
assets/         더미 사진 9장, OG 카드, 파비콘
랜딩페이지-기획안.md   왜 이렇게 만들었는지
```

## 로컬에서 보기

```bash
python3 -m http.server 8000
# http://localhost:8000
```

`file://`로 열어도 대부분 동작하지만, 서버로 여는 걸 권장한다.

디버그 패널(발생한 이벤트가 하단에 쌓임):

```
http://localhost:8000/?debug=1&utm_source=everytime
```

## 배포 전 할 일 두 가지

**1. 폼 엔드포인트 연결** — `main.js` 상단 `FORM_ENDPOINT`

비워두면 콘솔에만 남는다. 가장 빠른 선택지는 Formspree 또는 Google Apps Script.
전송 페이로드는 3단계로 나뉘어 온다.

```jsonc
{ "stage": "email",     "email": "..." }
{ "stage": "intent",    "email": "...", "usecase": "mt", "target_date": "2026-09", "days_until": 34 }
{ "stage": "interview", "interview": true, ... }
```

`utm_source` / `utm_medium` / `utm_campaign`이 모든 요청에 자동으로 붙는다.

**2. OG 절대 경로** — `index.html`의 `og:image`

지금은 `./assets/og.png` 상대 경로다. 카톡·슬랙 크롤러는 절대 URL을 요구하므로 배포 도메인이 정해지면 바꿔야 한다.

```html
<meta property="og:image" content="https://내도메인/assets/og.png" />
```

카톡 공유 카드가 실질적인 첫 화면이다. 이거 안 바꾸면 링크를 아무리 뿌려도 썸네일이 안 뜬다.

## 계측 이벤트

`window.dataLayer`로 push되고 `gtag`가 있으면 자동 전달된다. GA4를 붙이려면 `index.html`에 gtag 스니펫만 추가하면 된다.

| 이벤트 | 의미 |
|---|---|
| `section_view` | 스크롤 깊이 |
| `demo_view` | 데모 노출 |
| `demo_interact` | **첫 사진 넣음 — 메시지가 통했는가** |
| `demo_complete` | S3까지 봄 — 가치를 이해했는가 |
| `demo_own_photo` | 내 사진 링크 클릭 (상위 세그먼트 선행 지표) |
| `email_submit` | 알림 신청 |
| `usecase_select` | 유스케이스 선택 |
| `intent_submit` | **`within_4w`가 핵심 지표** |
| `sticky_cta_view` / `sticky_cta_click` | 모바일 하단 고정 CTA |
| `interview_accept` | 인터뷰 수락 |

North Star: `intent_submit` 중 `within_4w: true` 비율.

## 데모 상태 머신

`main.js`의 `state.step`.

| 상태 | 트리거 |
|---|---|
| S0 | 초기화 |
| S1 | 사진 카드 탭 |
| S2 | 그리드에 안착 |
| S3 | 2장 이상 놓은 뒤 1.6초 → 토스트 + 남이 6장 채움 |
| S4 | CTA 노출 |

S3이 이 페이지의 핵심 1초다. 타이밍은 상단 상수(`TOAST_DELAY`, `OTHER_STAGGER`)로 조절한다.

## 모바일

유입의 대부분이 카톡 링크를 통한 모바일이라 모바일이 기준이다. 데스크톱은 같은 레이아웃을 가운데 정렬해서 보여준다.

- `env(safe-area-inset-bottom)` — 아이폰 홈 인디케이터 영역 회피
- 입력 필드 `font-size: 16px` — iOS에서 포커스 시 자동 확대되는 것 방지
- 버튼 최소 50px / 칩 최소 44px — 터치 타겟
- 호버 효과는 `@media (hover: hover)`로 격리 — 모바일에서 탭 후 호버가 눌러붙는 문제 방지
- 380px 이하(iPhone SE 등) 별도 브레이크포인트
- 가로 모드에서 히어로 축소

**하단 고정 CTA**: 데모를 지나친 뒤에만 뜨고, 폼 섹션에 닿으면 사라진다. 이미 이메일을 낸 사람에게는 다시 뜨지 않는다. 모바일에서 스크롤 이탈을 잡는 장치라 `sticky_cta_click` 비중을 꼭 확인할 것.

### 실기기에서 보기

```bash
python3 -m http.server 8000
ipconfig getifaddr en0        # 예: 192.168.0.12
# 폰에서 http://192.168.0.12:8000 접속 (같은 와이파이)
```

## 제품으로 가져갈 것

데모 컴포넌트는 랜딩 전용이 아니라 제품에서 재사용할 것을 전제로 짰다.

| 랜딩 | 제품 |
|---|---|
| `.grid` / `.slot` | 방 상세 사진 그리드 |
| `place()` 비행 애니메이션 | 실제 업로드 피드백 |
| `.toast` | 실시간 업로드 알림 |
| 두더지 SVG | 빈 상태 · 로딩 |

## 아직 안 한 것

- 실제 방 생성 / 업로드 (제품 영역)
- 폼 엔드포인트 연결
- GA4 스니펫
- 두더지 애니메이션 고도화 (지금은 CSS keyframe)
