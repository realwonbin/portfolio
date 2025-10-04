/*! lang-switch.js (ko/en/jp/zh/zh-hant/es/ar) */
(function () {
  const MAP = {
    ko:       { path: '/',        code: 'ko',       rtl: false },
    en:       { path: '/en/',     code: 'en',       rtl: false },
    jp:       { path: '/jp/',     code: 'ja',       rtl: false },      // ja → /jp/
    zh:       { path: '/zh/',     code: 'zh-Hans',  rtl: false },      // 간체
    'zh-hant':{ path: '/zh-hant/',code: 'zh-Hant',  rtl: false },      // 번체
    es:       { path: '/es/',     code: 'es',       rtl: false },
    ar:       { path: '/ar/',     code: 'ar',       rtl: true  }
  };

  // 1) URL 강제(/?lang=xx) → 저장
  const qs = new URLSearchParams(location.search);
  const forced = (qs.get('lang') || '').toLowerCase(); // ko|en|jp|zh|zh-hant|es|ar
  if (forced && MAP[forced]) localStorage.setItem('prefLang', forced);

  // 2) 저장된 선호
  const pref = localStorage.getItem('prefLang'); // or null

  // 3) 브라우저 언어 추정(첫 방문 전용)
  const nav = (navigator.language || '').toLowerCase(); // ex: 'zh-cn'
  const guess =
    nav.startsWith('ko') ? 'ko' :
    nav.startsWith('ja') ? 'jp' :
    nav.startsWith('zh') ? 'zh' :
    nav.startsWith('es') ? 'es' :
    (nav.startsWith('ar') || nav.startsWith('fa') || nav.startsWith('he') || nav.startsWith('ur')) ? 'ar' :
    'en';

  // 4) 현재 경로의 언어
  const p = location.pathname;
  const here =
    p.startsWith('/en/')      ? 'en' :
    p.startsWith('/jp/')      ? 'jp' :
    p.startsWith('/zh-hant/') ? 'zh-hant' :
    p.startsWith('/zh/')      ? 'zh' :
    p.startsWith('/es/')      ? 'es' :
    p.startsWith('/ar/')      ? 'ar' : 'ko';

  // 5) 이동 함수
  function go(lang) {
    const dest = MAP[lang].path;
    if ((lang === 'ko' && here !== 'ko') || (lang !== 'ko' && here !== lang)) {
      location.replace(dest);
      return true;
    }
    return false;
  }

  // 6) 라우팅
  if (pref) {
    if (go(pref)) return;
  } else {
    if (!forced) { if (go(guess)) return; }
  }

  // 7) RTL 적용
  const doc = document.documentElement;
  const current = pref || guess;
  doc.setAttribute('dir', (MAP[current] && MAP[current].rtl) ? 'rtl' : 'ltr');
})();
