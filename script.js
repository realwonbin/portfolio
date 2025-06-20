document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ JavaScript is running!");

    // 🔹 토글링크 이벤트 추가
    const toggleLinks = document.querySelectorAll(".toggle-link");

    if (toggleLinks.length === 0) {
        console.warn("⚠️ No toggle links found!");
    } else {
        toggleLinks.forEach(link => {
            link.addEventListener("click", function (event) {
                event.preventDefault();
                let file = this.getAttribute("data-file");

                console.log("✅ Clicked link, loading:", file);

                let contentBox = this.nextElementSibling;

                // ✅ `.hidden-content`가 존재하지 않으면 생성
                if (!contentBox || !contentBox.classList.contains("hidden-content")) {
                    console.warn("⚠️ No hidden content found. Creating a new one.");
                    contentBox = document.createElement("div");
                    contentBox.classList.add("hidden-content");
                    this.parentNode.insertBefore(contentBox, this.nextSibling);
                }

                if (contentBox.classList.contains("show")) {
                    console.log("🔄 Closing existing content");
                    contentBox.innerHTML = "";
                    contentBox.classList.remove("show");
                    return;
                }

                console.log("🔄 Fetching content from:", file);
                fetch(file)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`❌ Failed to load content: ${file}`);
                        }
                        return response.text();
                    })
                    .then(html => {
                        console.log("✅ Content loaded successfully:", file);
                        contentBox.innerHTML = html;
                        contentBox.classList.add("show");
                    })
                    .catch(error => {
                        console.error("❌ Error loading content:", error);
                        contentBox.innerHTML = "<p style='color: red;'>❌ 콘텐츠를 불러올 수 없습니다.</p>";
                    });
            });
        });
    }
  document.querySelectorAll('.intro-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
          const href = tab.getAttribute('href');
    if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
      return;
    }  
          e.preventDefault();
      
          // 모든 탭과 섹션 비활성화
          document.querySelectorAll('.intro-tab').forEach(t => t.classList.remove('active'));
          document.querySelectorAll('.intro-section').forEach(section => section.classList.remove('active'));
      
          // 선택한 탭/섹션 활성화
          const targetId = tab.getAttribute('data-intro');
          document.getElementById(targetId).classList.add('active');
          tab.classList.add('active');
        });
 });
      
    // 🔹 프로젝트 선택 드롭다운 이벤트 추가
  document.getElementById('surface').addEventListener('change', function () {
    if (this.value) window.location.href = this.value;
  });
  document.getElementById('irreducible').addEventListener('change', function () {
    if (this.value) window.location.href = this.value;
  });
  document.getElementById('inprogress').addEventListener('change', function () {
    if (this.value) window.location.href = this.value;
  });


    projectSelect.addEventListener("change", function () {
        const selectedProject = this.value;
        if (selectedProject) {
            console.log("✅ Opening project:", selectedProject);
            window.open(`${selectedProject}?mode=popup`, "_blank");
        }
    });

    // 🎯 새 창에서 다른 스타일 적용 (popup mode 체크)
    if (new URLSearchParams(window.location.search).get('mode') === 'popup') {
        document.body.classList.add('popup-layout');
    }
});
const pages = [
  { name: '조화', url: 'https://www.younglee.co.kr/contents/af.html' },
  { name: '문을 두드리다', url: 'https://www.younglee.co.kr/contents/kod.html' },
  { name: '보이지 않는 당신', url: 'https://www.younglee.co.kr/contents/oosy.html' },
  { name: '대추와 꿀벌', url: 'https://www.younglee.co.kr/contents/haj.html' },
  { name: '캄보디아에서 온 37세의 분반나씨', url: 'https://www.younglee.co.kr/contents/cambo.html' }
];

const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();

  const pages = [
    { name: '조화', url: 'https://www.younglee.co.kr/contents/af.html' },
    { name: '문을 두드리다', url: 'https://www.younglee.co.kr/contents/kod.html' },
    { name: '보이지 않는 당신', url: 'https://www.younglee.co.kr/contents/oosy.html' },
    { name: '대추와 꿀벌', url: 'https://www.younglee.co.kr/contents/haj.html' },
    { name: '캄보디아에서 온 37세의 분반나씨', url: 'https://www.younglee.co.kr/contents/cambo.html' }
  ];

  for (const pageInfo of pages) {
    const page = await browser.newPage();
    await page.goto(pageInfo.url, {waitUntil: 'networkidle0'});

    await page.pdf({
      path: `${pageInfo.name}.pdf`,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0mm',
        bottom: '0mm',
        left: '0mm',
        right: '0mm'
      }
    });

    await page.close();
    console.log(`${pageInfo.name}.pdf 생성 완료`);
  }

  await browser.close();
})();
