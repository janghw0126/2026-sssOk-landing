// 웰컴 메일 — Gmail SMTP (Nodemailer). 서버리스 함수 전용
//
// 파일명이 `_` 로 시작하면 Vercel 이 엔드포인트로 만들지 않는다. api/ 안의 공용 모듈은
// 반드시 이 규칙을 지켜야 한다 — 안 그러면 /api/_email 로 외부에 노출된다.
//
// 필요한 환경변수:
//   GMAIL_USER          보내는사람@gmail.com
//   GMAIL_APP_PASSWORD  구글 앱 비밀번호 16자리 (공백 없이)
//
// 없으면 발송을 조용히 건너뛴다 — 키 없이도 로컬 개발과 등록 자체가 막히지 않게.
import nodemailer from "nodemailer";

const user = process.env.GMAIL_USER;
const pass = process.env.GMAIL_APP_PASSWORD;

// 나중에 다른 발송 서비스로 갈아탈 때 이 파일만 교체하면 되도록 발송부를 여기 가둬둠
const transporter =
  user && pass
    ? nodemailer.createTransport({ service: "gmail", auth: { user, pass } })
    : null;

export const emailEnabled = transporter !== null;

// 제목: 이모지 남발·전부대문자는 프로모션/스팸 분류 신호라 평범한 문장으로 유지
const SUBJECT = "[쏙] 출시 알림 신청이 완료됐어요 📸";

// 의도 수집 설문 (CLAUDE.md 남은 작업 3번). 단축 URL(forms.gle)은 목적지를 가린다는
// 이유로 스팸 점수가 붙으므로 원본 주소를 그대로 쓴다.
const SURVEY_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLScnn5-mLdCAqN97TwiqBgVMnfC0Qg6UPSBVqWMEfvSM2rgD_Q/viewform";

// 랜딩 디자인 토큰과 같은 값 (styles.css :root)
const C = {
  primary: "#F26D2C",
  ink: "#2E221C",
  sub: "#7A6B5E",
  bg: "#FFF6E9",
  line: "#EFE2D4",
};

// export: 발송 없이 브라우저로 미리보기/검수할 수 있게 열어둠
export function welcomeHtml() {
  // 메일 클라이언트는 CSS 변수·외부 스타일시트를 못 읽어서 전부 인라인 스타일 + 고정 색상
  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <!--
    다크 모드 대응: 선언이 없으면 Gmail·Apple Mail이 색을 임의로 반전시켜
    글자가 배경에 묻히는 사고가 난다. light 고정을 선언해 반전을 막는다.
    (일부 클라이언트는 무시하고 강제 반전하므로, 반전되더라도 읽히도록 대비를 넉넉히 잡아둔다.)
  -->
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <style>
    :root { color-scheme: light; supported-color-schemes: light; }
  </style>
</head>
<body style="margin:0;padding:0;background:${C.bg};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:440px;background:#ffffff;border:1px solid ${C.line};border-radius:16px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Pretendard',sans-serif;">
          <tr>
            <td style="padding:32px 32px 0;">
              <div style="font-size:15px;font-weight:800;color:${C.primary};letter-spacing:-0.01em;">쏙</div>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 0;">
              <h1 style="margin:0;font-size:24px;line-height:1.35;font-weight:800;color:${C.ink};letter-spacing:-0.02em;">
                안녕하세요!
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 0;">
              <p style="margin:0;font-size:15px;line-height:1.7;color:${C.sub};">
                출시 알림 신청이 정상적으로 접수됐어요.<br />
                쏙이 준비되는 순간, 이 메일로 가장 먼저 소식을 보내드릴게요.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 0;">
              <p style="margin:0;font-size:15px;line-height:1.7;color:${C.sub};">
                혹시 괜찮으시다면, 평소 어떤 모임에서 사진을 나누시는지 짧은 설문에 참여해주실 수 있을까요?
                더 쓸모 있는 서비스를 만드는 데 큰 도움이 될 것 같아요!
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 0;">
              <a href="${SURVEY_URL}" style="display:inline-block;background:${C.primary};color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:13px 24px;border-radius:10px;letter-spacing:-0.01em;">
                👉 1분 설문 참여하기
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 0;">
              <p style="margin:0;font-size:15px;line-height:1.7;color:${C.sub};">
                준비하는 동안 조금만 기다려주세요.<br />
                쏙이 완성되면 제일 먼저 소식 들고 찾아올게요 :)
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 0;">
              <div style="border-top:1px solid ${C.line};font-size:0;line-height:0;">&nbsp;</div>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 32px;">
              <p style="margin:0;font-size:13px;line-height:1.6;color:#B5A99C;">
                이 메일은 출시 알림을 신청하신 분께 발송됐어요.<br />
                신청한 적이 없다면 이 메일은 무시하셔도 괜찮습니다.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// HTML을 못 읽는 클라이언트용 대체본 — HTML 쪽 문구를 고치면 여기도 같이 고쳐야 함
const WELCOME_TEXT = `안녕하세요!

출시 알림 신청이 정상적으로 접수됐어요.
쏙이 준비되는 순간, 이 메일로 가장 먼저 소식을 보내드릴게요.

혹시 괜찮으시다면, 평소 어떤 모임에서 사진을 나누시는지
짧은 설문에 참여해주실 수 있을까요?
더 쓸모 있는 서비스를 만드는 데 큰 도움이 될 것 같아요!

👉 1분 설문 참여하기
${SURVEY_URL}

준비하는 동안 조금만 기다려주세요.
쏙이 완성되면 제일 먼저 소식 들고 찾아올게요 :)

─────────────────────────────

이 메일은 출시 알림을 신청하신 분께 발송됐어요.
신청한 적이 없다면 이 메일은 무시하셔도 괜찮습니다.`;

/**
 * 출시 알림 신청 완료 메일 발송.
 * 발송 실패가 신청 자체를 실패시키면 안 되므로 예외를 던지지 않고 성공 여부만 돌려준다.
 */
export async function sendWelcomeEmail(to) {
  if (!transporter) return false;

  try {
    await transporter.sendMail({
      from: `"쏙" <${user}>`,
      to,
      replyTo: user,
      subject: SUBJECT,
      text: WELCOME_TEXT,
      html: welcomeHtml(),
      headers: {
        // 수신거부 경로가 없는 발송은 스팸으로 분류될 확률이 크게 올라간다.
        // 전용 해지 엔드포인트가 없으므로 mailto 방식으로 최소한의 경로를 제공.
        "List-Unsubscribe": `<mailto:${user}?subject=unsubscribe>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });
    return true;
  } catch (error) {
    console.error("[email] 웰컴 메일 발송 실패:", error);
    return false;
  }
}
