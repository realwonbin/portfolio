// script-pjax.js  —  좌측/상단 링크 클릭 시 #content만 교체
(() => {
  const container = document.querySelector('#content');
  if (!container) return;

  const sameOriginHTML = (href) => {
    try {
      const u = new URL(href, location.href);
      return u.origin === location.origin && /\.html?$/i.test(u.pathname);
    } catch { return false; }
  };

  // 본문 스왑
  async function swapTo(url, push = true) {
    const res = await fetch(url, { headers: { 'X-PJAX': 'true' }});
    const html = await res.text();
    const doc  = new DOMParser().parseFromString(html, 'text/html');

    // 우선순위: #content > main > article > body
    const next = doc.querySelector('#content') ||
                 doc.querySelector('main') ||
                 doc.querySelector('article') ||
                 doc.body;
    if (!next) { location.href = url; return; }

    // 내용만 교체
    container.replaceChildren(...next.childNodes);
    document.title = doc.title || document.title;

    // 하이라이트 업데이트
    document.querySelectorAll('.side-list a').forEach(a => {
      a.classList.toggle('active', a.href === new URL(url, location.href).href);
    });

    if (push) history.pushState(null, '', url);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  // 링크 가로채기(동일 출처 HTML만)
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a) return;

    // 새창, 다운로드, 외부 링크, 같은 페이지 #해시 전환은 건너뜀
    if (a.target === '_blank' || a.hasAttribute('download')) return;
    const href = a.getAttribute('href') || '';
    const isHashOnly = href.startsWith('#');
    if (!href || isHashOnly) return;
    if (!sameOriginHTML(href)) return;

    e.preventDefault();
    swapTo(a.href, true);
  });

  // 브라우저 뒤/앞으로 가기
  window.addEventListener('popstate', () => swapTo(location.href, false));

  // 마우스 오버 프리페치(체감 즉시 전환)
  const prefetched = new Set();
  document.addEventListener('mouseover', (e) => {
    const a = e.target.closest('a');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    if (!sameOriginHTML(href) || prefetched.has(href)) return;
    const link = document.createElement('link');
    link.rel = 'prefetch'; link.href = a.href;
    document.head.appendChild(link);
    prefetched.add(href);
  });
})();
