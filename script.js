// script.js — 탭 전환 + 카테고리 이동만 (PJAX 없음)
document.addEventListener('DOMContentLoaded', () => {
  // 1) ?mode=popup → body 클래스 적용
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
      history.replaceState(null, '', `#${id}`); // 해시 업데이트(공유/새로고침 대응)
      window.scrollTo({ top: 0, behavior: 'instant' });
    });
  });

  // 최초 진입 시 해시(#intro1 등) 있으면 그 섹션 활성화
  const hashId = location.hash.replace('#','');
  if (hashId && document.getElementById(hashId)) activate(hashId);

  // 3) 하단 카테고리 셀렉트 → 선택 시 해당 페이지로 이동
  ['surface','irreducible','inprogress'].forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    sel.addEventListener('change', (e) => {
      const url = e.target.value;
      if (url && url.trim()) location.href = url;
    });
  });
});
