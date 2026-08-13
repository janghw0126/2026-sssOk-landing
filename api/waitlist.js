// 출시 대기 이메일 등록 API — waitlist_emails 에 저장하고 웰컴 메일을 보낸다.
//
// 랜딩은 빌드 없는 정적 HTML 이지만, Vercel 은 정적 파일과 api/ 서버리스 함수를
// 함께 서빙한다. 그래서 프레임워크 없이도 이 파일 하나로 Node 가 돌고,
// SMTP 자격증명을 브라우저에 노출하지 않고 메일을 보낼 수 있다.
import { sendWelcomeEmail } from "./_email.js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST만 허용해요." });
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("[waitlist] SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY 환경변수가 없습니다.");
    return res.status(500).json({ error: "서버 설정이 완료되지 않았어요." });
  }

  // Vercel 이 JSON 본문을 파싱해 주지만, 문자열로 올 때를 대비해 한 번 더 감싼다
  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: "잘못된 요청이에요." });
    }
  }

  const email = body?.email;
  if (typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
    return res.status(400).json({ error: "올바른 이메일 주소를 입력해주세요." });
  }

  const normalized = email.trim().toLowerCase();

  // publishable 키로 넣는다 — 테이블의 insert 정책이 그대로 적용되므로
  // 권한 규칙이 RLS 한 곳에만 있다. secret 키를 쓰면 RLS 를 우회하게 된다.
  const upstream = await fetch(`${SUPABASE_URL}/rest/v1/waitlist_emails`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ email: normalized }),
  });

  // 409 = email unique 제약 위반 = 이미 등록한 사람 → 성공으로 취급.
  const alreadyRegistered = upstream.status === 409;

  if (!upstream.ok && !alreadyRegistered) {
    console.error("[waitlist] insert 실패:", upstream.status, await upstream.text());
    return res
      .status(500)
      .json({ error: "등록 중 문제가 발생했어요. 잠시 후 다시 시도해주세요." });
  }

  // 재신청이어도 항상 보낸다 — "신청 완료"를 봤는데 메일이 안 오는 상황을 없애기 위함.
  // (첫 메일이 스팸함으로 갔거나 발송에 실패했던 사용자의 유일한 복구 수단)
  // 메일 실패가 등록 실패로 이어지면 안 되므로 결과는 응답에만 싣고 상태코드는 유지한다.
  const emailed = await sendWelcomeEmail(normalized);

  return res.status(200).json({ ok: true, alreadyRegistered, emailed });
}
