(() => {
  const header = document.querySelector('.site-header');
  const menuButton = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.site-nav');
  const updateHeader = () => header?.classList.toggle('is-scrolled', scrollY > 8);
  updateHeader(); addEventListener('scroll', updateHeader, { passive: true });
  menuButton?.addEventListener('click', () => { const open = menuButton.getAttribute('aria-expanded') !== 'true'; menuButton.setAttribute('aria-expanded', String(open)); menuButton.textContent = open ? '닫기' : '메뉴'; nav?.classList.toggle('is-open', open); });
  nav?.addEventListener('click', (event) => { if (!event.target.closest('a')) return; menuButton?.setAttribute('aria-expanded', 'false'); if (menuButton) menuButton.textContent = '메뉴'; nav.classList.remove('is-open'); });
  const year = document.querySelector('#year'); if (year) year.textContent = new Date().getFullYear();
})();
