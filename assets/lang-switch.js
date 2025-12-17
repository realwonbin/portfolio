/*! lang-switch.js (ko/en/jp/zh/zh-hant/es/ar/vi/th) - unified router & prefs */
(function () {
  // ---- 0) 설정: 언어 맵 (폴더, IETF lang, RTL 여부)
  const MAP = {
    ko:        { path: '/',         code: 'ko',        rtl: false },
    en:        { path: '/en/',      code: 'en',        rtl: false },
    jp:        { path: '/jp/',      code: 'ja',        rtl: false },     // ja → /jp/
    zh:        { path: '/zh/',      code: 'zh-Hans',   rtl: false },     // 간체(중국/싱가포르)
    'zh-hant': { path: '/zh-hant/', code: 'zh-Hant',   rtl: false },     // 번체(대만/홍콩/마카오)
    es:        { path: '/es/',      code: 'es',        rtl: false },
    ar:        { path: '/ar/',      code: 'ar',        rtl: true  },
    vi:        { path: '/vi/',      code: 'vi',        rtl: false },
    th:        { path: '/th/',      code: 'th',        rtl: false },
  };

  // ---- 1) 쿼리 강제 (?lang=xx) → 저장
  const qs = new URLSearchParams(location.search);
  const forcedRaw = (qs.get('lang') || '').toLowerCase().trim();
  // 지역코드/동의어 보정
  const ALIAS = {
    ja: 'jp',
    'zh-cn': 'zh', 'zh-sg': 'zh', 'zh-hans': 'zh',
    'zh-tw': 'zh-hant', 'zh-hk': 'zh-hant', 'zh-mo': 'zh-hant',
  };
  const forced = ALIAS[forcedRaw] || forcedRaw;
  if (forced && MAP[forced]) {
    try { localStorage.setItem('prefLang', forced); } catch {}
  }

  // ---- 2) 저장된 선호
  let pref = null;
  try { pref = localStorage.getItem('prefLang'); } catch {}

  // ---- 3) 브라우저 언어 추정(첫 방문 전용)
  const nav = ((navigator.language || '') + '').toLowerCase();
  const nav2 = (Array.isArray(navigator.languages) && navigator.languages[0] || '').toLowerCase();
  const cand = nav2 || nav;

  function guessFromBrowser(code) {
    if (!code) return 'en';
    if (code.startsWith('ko')) return 'ko';
    if (code.startsWith('ja')) return 'jp';
    if (code.startsWith('es')) return 'es';
    if (code.startsWith('vi')) return 'vi';
    if (code.startsWith('th')) return 'th';
    if (code.startsWith('ar') || code.startsWith('fa') || code.startsWith('he') || code.startsWith('ur')) return 'ar';
    if (code.startsWith('zh')) {
      // 지역 변형 분기
      if (/-tw|zh-tw|zh-hk|zh-mo|han t|hant/.test(code)) return 'zh-hant';
      return 'zh';
    }
    return 'en';
  }
  const guess = guessFromBrowser(cand);

  // ---- 4) 현재 경로의 언어 식별
  const p = location.pathname;
  const here =
    p.startsWith('/en/')      ? 'en' :
    p.startsWith('/jp/')      ? 'jp' :
    p.startsWith('/zh-hant/') ? 'zh-hant' :
    p.startsWith('/zh/')      ? 'zh' :
    p.startsWith('/es/')      ? 'es' :
    p.startsWith('/ar/')      ? 'ar' :
    p.startsWith('/vi/')      ? 'vi' :
    p.startsWith('/th/')      ? 'th' : 'ko'; // 루트는 한국어

  // ---- 5) 이동 함수 (상단 인덱스 레벨에서만 경로 전환: 해시/쿼리 유지)
  function go(lang) {
    const dest = MAP[lang] && MAP[lang].path;
    if (!dest) return false;
    // 이미 해당 언어면 이동 안함
    if ((lang === 'ko' && here === 'ko') || (lang !== 'ko' && here === lang)) return false;

    // 홈만 언어 전환(사이트 구조 안정성 유지) — 해시/쿼리 보존
    const hash = location.hash || '';
    const query = location.search || '';
    location.replace(dest + (hash || '') + (query ? '' : '')); // 쿼리는 lang 소모 후 굳이 유지 안 함
    return true;
  }

  // ---- 6) 라우팅 순서: 사용자 선호 > (강제 없으면) 브라우저 추정
  if (pref && MAP[pref]) {
    if (go(pref)) return;
  } else if (!forced) {
    if (go(guess)) return;
  }

  // ---- 7) <html lang|dir> 정리 (현재 문서에 적용)
  const doc = document.documentElement;
  const currentKey = (pref && MAP[pref]) ? pref : (MAP[here] ? here : guess);
  const current = MAP[currentKey] || MAP.en;

  // 올바른 IETF 코드로 lang 셋
  if (doc.getAttribute('lang') !== current.code) {
    doc.setAttribute('lang', current.code);
  }
  // RTL 적용
  doc.setAttribute('dir', current.rtl ? 'rtl' : 'ltr');

  // ---- 8) 푸터/헤더 언어 스위치 클릭 시 선호 저장(프리페치/즉시반응)
  function onLangSwitchClick(e) {
    const a = e.target.closest('a[href*="?lang="]');
    if (!a) return;
    const url = new URL(a.href, location.origin);
    const langRaw = (url.searchParams.get('lang') || '').toLowerCase();
    const lang = ALIAS[langRaw] || langRaw;
    if (MAP[lang]) {
      try { localStorage.setItem('prefLang', lang); } catch {}
      // 같은 언어면 굳이 전체 새로고침하지 않도록 허용(기본 이동은 유지)
    }
  }
  document.addEventListener('click', onLangSwitchClick, { capture: true });

  // ---- 9) i18n 접근성: <body>에 data-lang 부여(스타일/스크립트 훅)
  (function tagBody() {
    try {
      document.body.setAttribute('data-lang', currentKey);
      if (current.rtl) document.body.classList.add('rtl');
      else document.body.classList.remove('rtl');
    } catch {}
  })();
})();
