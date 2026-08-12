/* 쏙 랜딩 — 1차 가설 검증 라운드
   기획: 랜딩페이지-기획안.md 참고
   폼 수집 엔드포인트만 붙이면 바로 배포 가능한 상태 */

/* ────────── 설정 ────────── */

// Formspree / Google Apps Script / 자체 API 중 아무거나. 비워두면 콘솔에만 남음.
const FORM_ENDPOINT = '';

const USER_PHOTOS = ['photo-1.jpg', 'photo-2.jpg', 'photo-3.jpg'];
const OTHER_PHOTOS = ['photo-4.jpg', 'photo-5.jpg', 'photo-6.jpg', 'photo-7.jpg', 'photo-8.jpg', 'photo-9.jpg'];
const SLOT_COUNT = 9;
const TOAST_DELAY = 1600;   // S2 → S3
const OTHER_STAGGER = 220;  // 남이 올리는 사진 간격
const OTHER_NAME = '지우';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ────────── 계측 ────────── */

const utm = (() => {
  const q = new URLSearchParams(location.search);
  const pick = (k) => q.get(k) || undefined;
  return {
    source: pick('utm_source'),
    medium: pick('utm_medium'),
    campaign: pick('utm_campaign'),
  };
})();

const DEBUG = new URLSearchParams(location.search).has('debug');
const debugEl = document.getElementById('debug');
const debugList = document.getElementById('debugList');
if (DEBUG) debugEl.hidden = false;

window.dataLayer = window.dataLayer || [];

function track(name, params = {}) {
  const payload = { event: name, ...params, ...utm, ts: Date.now() };
  window.dataLayer.push(payload);
  if (typeof window.gtag === 'function') window.gtag('event', name, payload);
  console.debug('[track]', name, payload);
  if (DEBUG) {
    const li = document.createElement('li');
    li.textContent = name + ' ' + JSON.stringify(params);
    debugList.appendChild(li);
    debugEl.scrollTop = debugEl.scrollHeight;
  }
}

/* 섹션 노출 계측 */
const seen = new Set();
const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const id = e.target.dataset.section;
      if (seen.has(id)) return;
      seen.add(id);
      track('section_view', { section: id, depth: seen.size });
      if (id === 'demo') track('demo_view');
    });
  },
  { threshold: 0.4 }
);
document.querySelectorAll('[data-section]').forEach((el) => sectionObserver.observe(el));

/* Problem 카드 리빌 */
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add('in'), i * 110);
        revealObserver.unobserve(e.target);
      }
    });
  },
  { threshold: 0.3 }
);
document.querySelectorAll('.pains li').forEach((el) => revealObserver.observe(el));

/* ────────── 데모: 상태 머신 S0 → S4 ────────── */

const phone = document.getElementById('phone');
const grid = document.getElementById('grid');
const tray = document.getElementById('tray');
const toast = document.getElementById('toast');
const countEl = document.getElementById('count');
const miniMole = document.getElementById('miniMole');
const demoCta = document.getElementById('demoCta');

const state = {
  step: 'S0',
  placed: 0,
  interacted: false,
  othersFired: false,
  startedAt: 0,
  timers: [],
};

function later(fn, ms) {
  const t = setTimeout(fn, ms);
  state.timers.push(t);
  return t;
}

function buildDemo() {
  state.timers.forEach(clearTimeout);
  Object.assign(state, { step: 'S0', placed: 0, interacted: false, othersFired: false, startedAt: 0, timers: [] });

  grid.innerHTML = '';
  for (let i = 0; i < SLOT_COUNT; i++) {
    const s = document.createElement('div');
    s.className = 'slot';
    grid.appendChild(s);
  }

  tray.innerHTML = '';
  USER_PHOTOS.forEach((src, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'card';
    b.setAttribute('aria-label', `사진 ${i + 1} 넣기`);
    b.innerHTML = `<img src="./assets/${src}" alt="" />`;
    b.addEventListener('click', () => place(b, i));
    tray.appendChild(b);
  });

  toast.classList.remove('show');
  toast.textContent = '';
  demoCta.classList.add('hidden');
  updateCount();
}

function updateCount() {
  countEl.textContent = `${state.placed}장`;
}

function nextSlot() {
  return grid.querySelector('.slot:not(.filled)');
}

function fillSlot(src) {
  const slot = nextSlot();
  if (!slot) return false;
  slot.classList.add('filled');
  slot.innerHTML = `<img src="${src}" alt="" />`;
  state.placed++;
  updateCount();
  return true;
}

/* 카드 → 구멍 → 그리드 */
function place(card, index) {
  if (card.classList.contains('gone')) return;
  const src = card.querySelector('img').src;

  if (!state.interacted) {
    state.interacted = true;
    state.startedAt = performance.now();
    state.step = 'S1';
    track('demo_interact', { method: 'tap', photo_index: index });
  }

  card.classList.add('gone');

  const finish = () => {
    fillSlot(src);
    state.step = 'S2';
    if (tray.querySelectorAll('.card:not(.gone)').length === 0) markTrayEmpty();
    if (state.placed >= 2 && !state.othersFired) {
      state.othersFired = true;
      later(othersArrive, TOAST_DELAY);
    }
  };

  if (reduced) {
    finish();
    return;
  }

  const stage = phone.getBoundingClientRect();
  const from = card.getBoundingClientRect();
  const hole = miniMole.getBoundingClientRect();

  const ghost = document.createElement('div');
  ghost.className = 'ghost';
  ghost.style.width = from.width + 'px';
  ghost.style.height = from.height + 'px';
  ghost.style.left = from.left - stage.left + 'px';
  ghost.style.top = from.top - stage.top + 'px';
  ghost.innerHTML = `<img src="${src}" alt="" />`;
  phone.appendChild(ghost);

  const dx = hole.left + hole.width / 2 - (from.left + from.width / 2);
  const dy = hole.top + hole.height * 0.62 - (from.top + from.height / 2);

  ghost.animate(
    [
      { transform: 'translate(0,0) scale(1) rotate(0deg)', opacity: 1 },
      { transform: `translate(${dx * 0.5}px, ${dy - 26}px) scale(.9) rotate(-8deg)`, opacity: 1, offset: 0.55 },
      { transform: `translate(${dx}px, ${dy}px) scale(.16) rotate(-14deg)`, opacity: 0.9 },
    ],
    { duration: 460, easing: 'cubic-bezier(.5,.05,.5,1)' }
  ).onfinish = () => {
    ghost.remove();
    miniMole.classList.add('eat');
    later(() => miniMole.classList.remove('eat'), 360);
    finish();
  };
}

function markTrayEmpty() {
  if (tray.querySelector('.tray-empty')) return;
  const p = document.createElement('p');
  p.className = 'tray-empty';
  p.textContent = '다 넣었어요';
  tray.appendChild(p);
}

/* S3 — 다른 사람이 올리는 순간. 이 데모의 핵심 */
function othersArrive() {
  state.step = 'S3';
  const n = Math.min(OTHER_PHOTOS.length, SLOT_COUNT - state.placed);
  toast.textContent = `${OTHER_NAME}님이 사진 ${n}장을 올렸어요`;
  toast.classList.add('show');

  OTHER_PHOTOS.slice(0, n).forEach((src, i) => {
    later(() => fillSlot(`./assets/${src}`), reduced ? 0 : i * OTHER_STAGGER);
  });

  later(
    () => {
      track('demo_complete', { duration_ms: Math.round(performance.now() - state.startedAt) });
      state.step = 'S4';
      demoCta.classList.remove('hidden');
      later(() => toast.classList.remove('show'), 2600);
    },
    reduced ? 0 : n * OTHER_STAGGER + 200
  );
}

demoCta.addEventListener('click', () => {
  track('demo_cta_click');
  document.getElementById('intent').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  document.getElementById('email').focus({ preventScroll: true });
});

document.getElementById('reset').addEventListener('click', () => {
  track('demo_reset');
  buildDemo();
});

/* 내 사진으로 해보기 — 서버 전송 없음. createObjectURL만 사용 */
const ownFile = document.getElementById('ownFile');
document.querySelector('.own-link').addEventListener('click', () => track('demo_own_photo'));
ownFile.addEventListener('change', () => {
  const files = [...ownFile.files].slice(0, SLOT_COUNT);
  if (!files.length) return;
  track('demo_own_photo_selected', { count: files.length });
  files.forEach((f, i) => later(() => fillSlot(URL.createObjectURL(f)), reduced ? 0 : i * 160));
  if (!state.othersFired) {
    state.othersFired = true;
    later(othersArrive, TOAST_DELAY + files.length * 160);
  }
});

buildDemo();

/* ────────── 의도 수집 폼 (2단계) ────────── */

const submission = { email: '', usecase: null, target_date: null, days_until: null, interview: null };

const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2');
const step3 = document.getElementById('step3');
const step4 = document.getElementById('step4');
const emailErr = document.getElementById('emailErr');

function show(el) {
  [step1, step2, step3, step4].forEach((s) => (s.hidden = s !== el));
  syncSticky();
}

function daysUntil(monthValue) {
  if (!monthValue) return null;
  const [y, m] = monthValue.split('-').map(Number);
  if (!y || !m) return null;
  const target = new Date(y, m - 1, 15);
  return Math.round((target - new Date()) / 86400000);
}

async function send(payload) {
  if (!FORM_ENDPOINT) {
    console.info('[form] 엔드포인트 미설정. 전송 대신 로그만 남깁니다.', payload);
    return;
  }
  try {
    await fetch(FORM_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, ...utm }),
    });
  } catch (e) {
    console.warn('[form] 전송 실패', e);
  }
}

document.getElementById('emailForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  emailErr.hidden = valid;
  if (!valid) {
    track('email_invalid');
    return;
  }
  submission.email = email;
  track('email_submit');
  send({ stage: 'email', email });
  show(step2);
  step2.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
});

document.getElementById('chips').addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  document.querySelectorAll('#chips .chip').forEach((c) => c.classList.toggle('on', c === chip));
  submission.usecase = chip.dataset.v;
  track('usecase_select', { usecase: submission.usecase });
});

const whenInput = document.getElementById('when');
const unknownBtn = document.getElementById('unknown');
unknownBtn.addEventListener('click', () => {
  unknownBtn.classList.toggle('on');
  if (unknownBtn.classList.contains('on')) whenInput.value = '';
});
whenInput.addEventListener('input', () => unknownBtn.classList.remove('on'));

document.getElementById('detailSubmit').addEventListener('click', () => {
  submission.target_date = unknownBtn.classList.contains('on') ? null : whenInput.value || null;
  submission.days_until = daysUntil(submission.target_date);
  track('intent_submit', {
    usecase: submission.usecase,
    target_date: submission.target_date,
    days_until: submission.days_until,
    within_4w: submission.days_until !== null && submission.days_until <= 28,
  });
  send({ stage: 'intent', ...submission });
  show(step3);
});

document.getElementById('yes').addEventListener('click', () => {
  submission.interview = true;
  track('interview_accept', { accepted: true });
  send({ stage: 'interview', ...submission });
  show(step4);
});

document.getElementById('no').addEventListener('click', () => {
  submission.interview = false;
  track('interview_accept', { accepted: false });
  send({ stage: 'interview', ...submission });
  show(step4);
});

/* ────────── 하단 고정 CTA (모바일) ──────────
   데모를 지나친 뒤부터 노출, 폼 섹션에 닿으면 숨김.
   이미 이메일을 낸 사람에게는 다시 보여주지 않는다. */

const stickybar = document.getElementById('stickybar');
const demoSection = document.getElementById('demo');
const intentSection = document.getElementById('intent');

let pastDemo = false;
let atIntent = false;
let stickyShown = false;

function syncSticky() {
  const should = pastDemo && !atIntent && !step1.hidden;
  stickybar.hidden = false;
  stickybar.classList.toggle('show', should);
  document.body.classList.toggle('has-sticky', should);
  if (should && !stickyShown) {
    stickyShown = true;
    track('sticky_cta_view');
  }
}

new IntersectionObserver(
  ([e]) => {
    pastDemo = !e.isIntersecting && e.boundingClientRect.top < 0;
    syncSticky();
  },
  { threshold: 0 }
).observe(demoSection);

new IntersectionObserver(
  ([e]) => {
    atIntent = e.isIntersecting;
    syncSticky();
  },
  { threshold: 0.15 }
).observe(intentSection);

document.getElementById('stickyCta').addEventListener('click', () => {
  track('sticky_cta_click');
  intentSection.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  document.getElementById('email').focus({ preventScroll: true });
});

/* nav / hero CTA 계측 */
document.querySelectorAll('[data-cta]').forEach((el) => {
  el.addEventListener('click', () => track('cta_click', { where: el.dataset.cta }));
});
