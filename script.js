/* ===============================
 * script.js  —  Young Lee site core
 * 목표: 단순 · 빠름 · 안전 · 증분개선
 * =============================== */

/* ---------- 유틸 ---------- */
const $      = (sel, root = document) => root.querySelector(sel);
const $$     = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const on     = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);
const isSameOriginHTML = (url) => {
  try {
    const u = new URL(url, location.href);
    return u.origin === location.origin && /\.html?$/.test(u.pathname);
  } catch { return false; }
};

/* ---------- 0) 팝업 모드 ---------- */
function applyPopupModeFromQuery() {
  const mode = new URLSearchParams(location.search).get('mode');
  if (mode === 'popup') document.body.classList.add('popup-layout');
}

/* ---------- 1) 탭/섹션 전환 (해시 연동) ---------- */
function setupIntroTabs() {
  const sections = $$('.intro-section');
  const tabs     = $$('.intro-tab');

  if (!sections.length || !tabs.length) return;

  const idSet = new Set(sections.map(s => s.id)); // intro0, intro1 ...

  const activate = (introId, pushHash = true) => {
    if (!idSet.has(introId)) return;

    // 섹션 표시
    sections.forEach(s => s.classList.toggle('active', s.id === introId));

    // 탭 하이라이트
    tabs.forEach(a => {
      const target = a.getAttribute('href')?.startsWith('#')
        ? a.getAttribute('href').slice(1)
        : a.dataset.intro;
      a.classList.toggle('active', target === introId);
    });

    // 해시 동기화(뒤로가기 지원)
    if (pushHash) {
      const hash = `#${introId}`;
      if (location.hash !== hash) history.pushState(null, '', hash);
    }

    // 탭 전환 시 스크롤 상단 살짝 올려 사용자 맥락 유지
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 탭 클릭(현재 마크업: href="#" + data-intro)
  tabs.forEach(a => {
    on(a, 'click', (e) => {
      // 해시 링크(#introX)는 브라우저 기본 동작 허용 → hashchange로 처리
      const href = a.getAttribute('href') || '';
      if (href.startsWith('#') && href.length > 1) return;

      e.preventDefault();
      const target = a.dataset.intro || href.replace('#', '') || 'intro0';
      activate(target, true);
    });
  });

  // 초기 활성: 해시 우선, 없으면 첫 섹션
  const initial = location.hash?.slice(1);
  if (initial && idSet.has(initial)) activate(initial, false);
  else activate(sections[0].id, false);

  // 뒤/앞으로 가기
  on(window, 'hashchange', () => {
    const h = location.hash.slice(1);
    if (idSet.has(h)) activate(h, false);
  });
}

/* ---------- 2) 드롭다운 이동 ---------- */
function setupFooterSelects() {
  const selectIds = ['surface', 'irreducible', 'inprogress'];
  selectIds.forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;

    on(sel, 'change', () => {
      const url = sel.value;
      if (url) location.href = url;
    });
  });
}

/* ---------- 3) 이미지 힌트 일괄 적용 (긴 세로 페이지 체감 향상) ---------- */
function setupImageHints() {
  $$('img').forEach(img => {
    if (!img.hasAttribute('loading'))  img.setAttribute('loading', 'lazy');
    if (!img.hasAttribute('decoding')) img.setAttribute('decoding', 'async');
  });
}

/* ---------- 4) 초미니 프리페치 (호버 순간 다음 페이지 캐시) ---------- */
function setupHoverPrefetch() {
  const prefetched = new Set();

  on(document, 'mouseover', (e) => {
    const a = e.target.closest && e.target.closest('a');
    if (!a) return;

    const href = a.getAttribute('href');
    if (!href || prefetched.has(href) || !isSameOriginHTML(href)) return;

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    document.head.appendChild(link);
    prefetched.add(href);
  });
}

/* ---------- 5) 토글 링크(선택 기능): .toggle-link → .hidden-content ---------- */
function setupToggleLink() {
  const target = $('.hidden-content');
  if (!target) return;

  on(document, 'click', async (e) => {
    const a = e.target.closest && e.target.closest('.toggle-link');
    if (!a) return;

    e.preventDefault();
    const src = a.dataset.src;
    if (src && !target.dataset.loaded) {
      try {
        const res = await fetch(src, { credentials: 'same-origin' });
        target.innerHTML = await res.text();
        target.dataset.loaded = '1';
      } catch {
        target.textContent = '콘텐츠를 불러올 수 없습니다.';
      }
    }
    target.classList.toggle('show');
  });
}

/* ---------- 6) 언어 리다이렉트(선택): 필요 시 서버 사이드로 이전 권장 ---------- */
/*  index.html에 유사 코드가 있으므로, 중복 실행을 피하고 싶다면
    아래 함수를 주석 처리하거나, 서버 사이드로 옮기는 것을 권장. */
function maybeRedirectByLanguage() {
  // 한국어가 아닌 경우 en 으로. 봇/공유 미리보기 등을 고려해 서버 처리 권장.
  try {
    const lang = navigator.language || navigator.userLanguage || '';
    if (!lang.toLowerCase().startsWith('ko')) {
      // location.replace 사용 시 히스토리 오염 최소화
      // 필요 없으면 주석 처리
      // location.replace('/en/index.html');
    }
  } catch {}
}

/* ---------- 초기화 ---------- */
document.addEventListener('DOMContentLoaded', () => {
  applyPopupModeFromQuery();
  setupIntroTabs();
  setupFooterSelects();
  setupImageHints();
  setupHoverPrefetch();
  setupToggleLink();
  maybeRedirectByLanguage();
});
