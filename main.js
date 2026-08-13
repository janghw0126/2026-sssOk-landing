// hero headline stagger
document.querySelectorAll(".hero h1 .w").forEach((w, i) => {
  w.animate(
    [
      { opacity: 0, transform: "translateY(26px)" },
      { opacity: 1, transform: "none" },
    ],
    {
      duration: 620,
      delay: 120 * i,
      easing: "cubic-bezier(.2,.7,.3,1)",
      fill: "forwards",
    },
  );
});

// scroll reveal — .rv(페이드+슬라이드) / .rv-fade(페이드만, 자체 transform 보존용) / .rv-pop(톡 튀는 등장)
const io = new IntersectionObserver(
  (es) => {
    es.forEach((e, i) => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add("in"), i * 90);
        io.unobserve(e.target);
      }
    });
  },
  { threshold: 0.15, rootMargin: "0px 0px -60px 0px" },
);
document.querySelectorAll(".rv, .rv-fade, .rv-pop").forEach((el) => {
  // .rv-hero(히어로 안 요소)는 아래 별도 처리 — 뷰포트가 낮으면 위 rootMargin
  // 컷오프 안쪽이라 IO가 "교차"로 안 잡아줘서 스크롤 안 해도 영영 안 뜨는 문제가 있었다
  if (el.classList.contains("rv-hero")) return;
  // 스크롤을 내린 채로 새로고침하면 이미 화면에 있는 요소들이 한 IO 콜백에
  // 무더기로 잡혀서 i*90ms 지연이 그대로 다 쌓인다(수십 개면 몇 초씩 밀림).
  // 이미 보이는 건 스크롤을 기다린 게 아니니 바로 노출하고, 아직 화면 밖인
  // 것만 관찰해서 스크롤할 때 한 줄씩 나타나는 원래 효과를 유지한다
  const r = el.getBoundingClientRect();
  if (r.top < innerHeight && r.bottom > 0) el.classList.add("in");
  else io.observe(el);
});

// 히어로 요소는 스크롤과 무관하게 페이지 로드와 함께 바로 재생한다.
// 순서는 CSS 의 animation-delay(각 요소 규칙 옆 주석 참고)가 맡는다
document.querySelectorAll(".rv-hero").forEach((el) => el.classList.add("in"));

// hero parallax — 뒤에 깔린 두 화면만 살짝 따라 움직인다 (--px/--py 는 styles.css 참고)
const art = document.getElementById("art");
addEventListener("mousemove", (e) => {
  if (innerWidth < 900) return;
  const x = e.clientX / innerWidth - 0.5,
    y = e.clientY / innerHeight - 0.5;
  art.querySelectorAll(".ph-left,.ph-right").forEach((el, i) => {
    const d = i ? -12 : 12;
    el.style.setProperty("--px", x * d + "px");
    el.style.setProperty("--py", y * d + "px");
  });
});

function focusForm() {
  const i = document.getElementById("email");
  i.scrollIntoView({ behavior: "smooth", block: "center" });
  setTimeout(() => {
    i.focus({ preventScroll: true });
    i.classList.add("pulse");
    setTimeout(() => i.classList.remove("pulse"), 2200);
  }, 600);
}
// 대기명단 등록 — Supabase REST API 를 직접 호출한다.
// 빌드 단계가 없는 정적 사이트라 키가 소스에 그대로 박히는데, publishable 키는
// 브라우저 노출을 전제로 만들어진 키다. waitlist_emails 에 RLS 가 걸려 있어서
// 이 키로는 insert 만 되고 select 는 빈 배열이 돌아온다(= 남의 이메일을 읽어갈 수 없다).
// 절대 secret 키로 바꾸지 말 것 — 그건 RLS 를 통째로 우회한다.
const SUPABASE_URL = "https://kxpaactclnhavfxetxyk.supabase.co";
const SUPABASE_KEY = "sb_publishable_9_rXw5pgmxPEXy-fRqmILA_XIrYLdsg";

async function submitForm(e) {
  e.preventDefault();

  const form = document.getElementById("emailForm");
  const btn = form.querySelector(".btn");
  const err = document.getElementById("formErr");
  const label = btn.textContent;
  const email = document.getElementById("email").value.trim().toLowerCase();

  err.textContent = "";
  btn.disabled = true;
  btn.textContent = "등록 중…";

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/waitlist_emails`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ email }),
    });

    // 409 = email unique 제약 위반 = 이미 등록한 사람.
    // 다시 신청했다고 에러를 보여줄 이유는 없으니 성공과 똑같이 처리한다.
    if (!res.ok && res.status !== 409) throw new Error(String(res.status));

    form.style.display = "none";
    document.getElementById("done").classList.add("on");
  } catch {
    // 실패했는데 완료 화면을 보여주면 사용자는 등록된 줄 알고 떠난다.
    // 폼을 그대로 두고 다시 시도할 수 있게 되돌린다.
    btn.disabled = false;
    btn.textContent = label;
    err.textContent = "등록에 실패했어요. 잠시 후 다시 시도해주세요.";
  }
}
