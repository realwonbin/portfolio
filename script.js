// script.js — 탭 전환 + 카테고리 이동 + 안전한 popup 레이아웃 + (옵션) PJAX
document.addEventListener('DOMContentLoaded', () => {
  // 1) ?mode=popup → 안전하게 body 클래스 적용
  // 맨 위나 DOMContentLoaded 안 적당한 곳에 추가
  const ENABLE_PJAX = false;

  if (new URLSearchParams(location.search).get('mode') === 'popup') {
    document.body.classList.add('popup-layout');
  }

  // 2) 상단 탭 전환 (data-intro="intro0" ↔ #intro0)
  const tabs = document.querySelectorAll('.intro-tab');
  const sections = document.querySelectorAll('.intro-section');

  const activate = (id) => {
    sections.forEach(s => s.classList.toggle('active', s.id === id));
    tabs.forEach(t => t.classList.toggle('active', t.dataset.intro === id));
  };

  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      const id = tab.dataset.intro;
      if (!id) return;
      activate(id);
      history.replaceState(null, '', `#${id}`); // 해시 반영(새로고침/공유 대응)
      window.scrollTo({ top: 0, behavior: 'instant' });
    });
  });

  // 최초 진입 시 해시(#intro1 등) 있으면 그 섹션 활성화
  const hashId = location.hash.replace('#','');
  if (hashId && document.getElementById(hashId)) {
    activate(hashId);
  }

  // 3) 하단 카테고리 셀렉트 → 선택 시 해당 페이지로 이동(+popup 모드 유지)
  ['surface','irreducible','inprogress'].forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    sel.addEventListener('change', (e) => {
      const url = e.target.value;
      if (url && url.trim()) {
        location.href = `${url}?mode=popup`;
      }
    });
  });

  // 4) (선택) 같은 출처의 .html 링크는 본문만 빠르게 스왑(PJAX 느낌)
  //    메인 컨테이너를 현재 마크업에 맞춰 'main.container'로 사용
  const container = document.querySelector('main.container');
  if (container) {
    const sameOriginHTML = (href) => {
      try {
        const u = new URL(href, location.href);
        return u.origin === location.origin && /\.html?$/i.test(u.pathname);
      } catch { return false; }
    };

    async function swapTo(url, push = true) {
      try {
        const res = await fetch(url, { headers: { 'X-PJAX': 'true' } });
        const html = await res.text();
        const doc  = new DOMParser().parseFromString(html, 'text/html');
        const next = doc.querySelector('main.container') ||
                     doc.querySelector('main') ||
                     doc.body;
        if (!next) { location.href = url; return; }
        container.replaceChildren(...next.childNodes);
        if (push) history.pushState(null, '', url);
        window.scrollTo({ top: 0, behavior: 'instant' });
      } catch {
        location.href = url; // 네트워크 오류 시 정상 네비게이션
      }
    }

    document.addEventListener('click', (e) => {
      const a = e.target.closest('a');
      if (!a) return;
      const href = a.getAttribute('href') || '';
      if (!href || href.startsWith('#') || a.target === '_blank' || a.hasAttribute('download')) return;
      if (!sameOriginHTML(href)) return;
      e.preventDefault();
      swapTo(a.href, true);
    });

    window.addEventListener('popstate', () => swapTo(location.href, false));
  }
});
