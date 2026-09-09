(() => {
  const prepareJustifiedGalleries = () => {
    document.querySelectorAll('.image-gallery.justified').forEach((gallery) => {
      const items = [...gallery.querySelectorAll(':scope > a, :scope > img')];
      if (!items.length) return;

      const layout = () => {
        const width = gallery.clientWidth;
        if (!width) return;
        const gap = 8;
        const targetHeight = width < 600 ? 128 : 170;
        const ratios = items.map((item) => {
          const image = item.matches('img') ? item : item.querySelector('img');
          return image?.naturalWidth && image?.naturalHeight ? image.naturalWidth / image.naturalHeight : 1;
        });

        let start = 0;
        while (start < items.length) {
          let end = start;
          let ratioTotal = 0;
          while (end < items.length) {
            ratioTotal += ratios[end];
            end += 1;
            if (ratioTotal * targetHeight + gap * (end - start - 1) >= width) break;
          }

          const isLastRow = end === items.length;
          const rowHeight = isLastRow
            ? Math.min(targetHeight, (width - gap * (end - start - 1)) / ratioTotal)
            : (width - gap * (end - start - 1)) / ratioTotal;

          for (let index = start; index < end; index += 1) {
            items[index].style.width = `${ratios[index] * rowHeight}px`;
            items[index].style.height = `${rowHeight}px`;
          }
          start = end;
        }
      };

      Promise.all(items.map((item) => {
        const image = item.matches('img') ? item : item.querySelector('img');
        if (!image || image.complete) return Promise.resolve();
        return new Promise((resolve) => image.addEventListener('load', resolve, { once: true }));
      })).then(layout);
      new ResizeObserver(layout).observe(gallery);
    });
  };

  const prepareHiddenGalleries = () => {
    document.querySelectorAll('.hidden-gallery').forEach((gallery) => {
      const precedingGrids = [...document.querySelectorAll('.image-gallery.two, .image-gallery.three, .image-gallery.four, .image-gallery.five, .image-gallery.six, .image-gallery.seven')]
        .filter((grid) => grid.compareDocumentPosition(gallery) & Node.DOCUMENT_POSITION_FOLLOWING);
      const visibleGrid = precedingGrids.at(-1);
      if (visibleGrid) {
        const visibleItems = [...visibleGrid.querySelectorAll(':scope > a')];
        const columnNames = ['two', 'three', 'four', 'five', 'six', 'seven'];
        const columns = columnNames.findIndex((name) => visibleGrid.classList.contains(name)) + 2;
        const completeRows = Math.min(Math.floor(visibleItems.length / columns) * columns, columns * 5);
        if (completeRows >= columns * 4 && visibleItems.length > completeRows) {
          visibleItems.slice(completeRows).reverse().forEach((item) => gallery.prepend(item));
        }
      }
    });
  };

  prepareHiddenGalleries();
  prepareJustifiedGalleries();

  if (new URLSearchParams(location.search).get('embed') === '1') {
    document.body.classList.add('embedded-content');
    return;
  }

  const projects = [
    { title: '표면의 말 : 황학동 만물시장에서 시작한 간판기록의 연속과 확장', items: [
      ['2007', '만물시장', 'everythingmarket.html'], ['2008', '인민로', 'renminro.html'],
      ['2009–10', '평화와 통일', 'pnr0910.html'], ['2018', '호안끼엠', 'hoankiem.html'],
      ['2021', '바이센지', 'weissensee.html'], ['2022', '사랑곳', 'sarangkot.html'],
      ['2023', '비늘', 'scale.html'], ['2024', '알고도날레스', 'algodonales.html'],
      ['2025', '담 Threshold', 'threshold.html']
    ]},
    { title: '환원되지 않는 것들 : 비선형적 시간으로부터 생태윤리적 감각으로', items: [
      ['2005', '대추와 꿀벌', 'haj.html'], ['2005–07', '문을 두드리다', 'kod.html'],
      ['2007', '캄보디아에서 온 37세의 분반나씨', 'cambo.html'], ['2009', '보이지 않는 당신', 'oosy.html'],
      ['2009–15', '돌탑', 'st.html'], ['2011–', '조화', 'af.html'],
      ['2023–26', '까만 사탕', 'carbon.html']
    ]},
    { title: '진행 중인 구조 : 사건의 기록과 유형의 발견', items: [
      ['2009', '충무로', 'chungmuro.html'], ['2017–18', '반딧불이', 'firefly.html'],
      ['2018, 25', '시계탑', 'clocktower.html'], ['2026', '지번', 'lot.html']
    ]}
  ];

  // 전시 아카이브 링크: 아래 이름과 주소만 실제 정보로 교체하면 됩니다.
  const exhibitionLinks = [
    ['Archive 01', '2025 값싼 시계와 반딧불이, PlanB Project Space', 'https://planb2025.younglee.co.kr/'],
    ['Archive 02', '2020 만물시장, Label Gallery', 'https://labelgallery.co.kr/exhibitions/%ec%9d%b4%ec%98%81%ec%9d%b4-%ec%88%98%ec%a7%91%ed%95%9c-%eb%a7%8c%eb%ac%bc%ec%8b%9c%ec%9e%a5%ec%9d%98-%ec%98%9b-%ea%b0%84%ed%8c%90%eb%93%a4/'],
    ['Archive 03', '2019 대추와 꿀벌, 인사아트스페이스', 'https://www.galleryinsaart.com/exhibition/%EC%9D%B4%EC%98%81-%EA%B0%9C%EC%9D%B8%EC%A0%84/']
  ];

  const onHome = document.body.classList.contains('home-sidebar-page');
  const inContents = location.pathname.includes('/contents/');
  const inTextPages = location.pathname.includes('/texts/');
  const rootPrefix = (inContents || inTextPages) ? '../' : '';
  const contentPrefix = inContents ? '' : `${rootPrefix}contents/`;
  const current = location.pathname.split('/').pop() || 'index.html';
  const sections = projects.map(({ title, items }) => `
    <section>
      <h2>${title}</h2>
      ${items.map(([year, name, href]) => `<a${href === current ? ' class="is-current" aria-current="page"' : ''} href="${contentPrefix}${href}?v=9"><span>${year}</span>${name}</a>`).join('')}
    </section>`).join('');

  const textSection = `
    <section class="sidebar-texts">
      <h2>생각</h2>
      <a href="${rootPrefix}texts/blue-chrysanthemum.html?v=9"><span>작업에 대한</span>푸른 국화</a>
      <a href="${rootPrefix}texts/tangled-thread.html?v=9"><span>존재에 대한</span>엉킨 실타래, 달항아리</a>
      <a href="${rootPrefix}texts/this-text-does-not-explain.html?v=9"><span>매체에 대한</span>이 글은 작업을 설명하지 않습니다</a>
      <a href="${rootPrefix}texts/near-things.html?v=9"><span>윤리에 대한</span>가까운 것들은 가장 멀리 있다</a>
    </section>`;

  const exhibitionSection = `
    <section class="sidebar-exhibitions">
      <button class="sidebar-exhibition-toggle" type="button" aria-expanded="false" aria-controls="sidebar-exhibition-links">
        <span>전시 기록</span><small>${exhibitionLinks.length}</small>
      </button>
      <div id="sidebar-exhibition-links" class="sidebar-exhibition-links">
        ${exhibitionLinks.map(([label, name, href]) => `<a href="${href}" target="_blank" rel="noopener noreferrer"><span>${label}</span>${name}</a>`).join('')}
      </div>
    </section>`;

  const bindExhibitionToggle = (scope) => {
    const toggle = scope.querySelector('.sidebar-exhibition-toggle');
    const links = scope.querySelector('.sidebar-exhibition-links');
    if (!toggle || !links) return;
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(open));
      links.classList.toggle('is-open', open);
    });
  };

  const bindSidebarNavigation = (aside, contentArea) => {
    aside.addEventListener('click', (event) => {
      const link = event.target.closest('a');
      if (!link || link.classList.contains('legacy-brand') || link.target === '_blank' || link.protocol === 'mailto:') return;

      const url = new URL(link.href, location.href);
      if (url.protocol !== 'file:' || !url.pathname.includes('/88_test/')) return;
      event.preventDefault();

      url.searchParams.set('embed', '1');
      let frame = contentArea.querySelector(':scope > .sidebar-content-frame');
      if (!frame) {
        frame = document.createElement('iframe');
        frame.className = 'sidebar-content-frame';
        frame.name = 'portfolio-content';
        frame.title = '선택한 콘텐츠';
        contentArea.replaceChildren(frame);
      }
      frame.src = url.href;
    });
  };

  const existingList = document.querySelector('.legacy-portfolio-layout .legacy-work-list');
  if (existingList) {
    if (!existingList.querySelector('.sidebar-texts')) existingList.insertAdjacentHTML('beforeend', textSection);
    if (!existingList.querySelector('.sidebar-exhibitions')) existingList.insertAdjacentHTML('beforeend', exhibitionSection);
    bindExhibitionToggle(existingList);
    return;
  }

  const aside = document.createElement('aside');
  aside.className = 'legacy-sidebar';
  aside.setAttribute('aria-label', '전체 작업 목록');
  aside.innerHTML = `
    <div class="legacy-sidebar-head">
      <a class="legacy-brand" href="${rootPrefix}index.html?v=9">이영 <span>Lee Young</span></a>
      <nav aria-label="사이트 메뉴"><a href="${rootPrefix}about.html?v=9">시작</a><a href="${rootPrefix}texts.html?v=9">생각</a><a href="${contentPrefix}resume.html?v=9">이력</a><a href="https://blog.younglee.co.kr" target="_blank" rel="noopener noreferrer">블로그</a><a href="https://www.instagram.com/iam2020/" target="_blank" rel="noopener noreferrer">인스타그램</a></nav>
    </div>
    <button class="legacy-list-toggle" type="button" aria-expanded="false" aria-controls="legacy-work-list">전체 작업 <span>20</span></button>
    <nav id="legacy-work-list" class="legacy-work-list">${sections}${textSection}${exhibitionSection}</nav>`;

  const main = document.querySelector(onHome ? 'main#top' : 'main.container');
  if (!main) return;
  const layout = document.createElement('div');
  layout.className = `legacy-portfolio-layout${onHome ? ' home-portfolio-layout' : ' content-portfolio-layout'}`;
  main.before(layout);
  if (onHome) {
    const content = document.createElement('div');
    content.className = 'home-content';
    const footer = document.querySelector('.site-footer');
    content.append(main);
    if (footer) content.append(footer);
    layout.append(aside, content);
    bindSidebarNavigation(aside, content);
  } else {
    const content = document.createElement('div');
    content.className = 'sidebar-content-area';
    content.append(main);
    layout.append(aside, content);
    bindSidebarNavigation(aside, content);
  }

  bindExhibitionToggle(aside);

  const button = aside.querySelector('.legacy-list-toggle');
  const list = aside.querySelector('.legacy-work-list');
  button.addEventListener('click', () => {
    const open = button.getAttribute('aria-expanded') !== 'true';
    button.setAttribute('aria-expanded', String(open));
    list.classList.toggle('is-open', open);
  });
})();
