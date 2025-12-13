// script.js — tabs + category selects (PJAX: swap #content-view only)
(() => {
  const onReady = (fn) =>
    document.readyState !== "loading"
      ? fn()
      : document.addEventListener("DOMContentLoaded", fn);

  const SELECT_IDS = new Set(["surface", "irreducible", "inprogress"]);

  function isSameOrigin(url) {
    try {
      const u = new URL(url, location.href);
      return u.origin === location.origin;
    } catch {
      return false;
    }
  }

  function absUrl(url) {
    return new URL(url, location.href).toString();
  }

  function getContentRoot(doc) {
    // 1순위: #content-view, 2순위: main.container, 3순위: body
    return doc.querySelector("#content-view") ||
           doc.querySelector("main.container") ||
           doc.body;
  }

  function bindTabs() {
    const nav = document.querySelector(".intro-nav");
    const tabs = Array.from(document.querySelectorAll(".intro-tab"));
    const sections = Array.from(document.querySelectorAll(".intro-section"));
    const sectionIds = new Set(sections.map(s => s.id));

    function setActive(id) {
      if (!sectionIds.has(id)) return;

      sections.forEach(s => {
        const on = (s.id === id);
        s.classList.toggle("active", on);
        s.hidden = !on; // 비활성 패널은 숨김
      });

      tabs.forEach(t => {
        const target = t.getAttribute("href")?.replace("#", "") || t.dataset.intro;
        const on = (target === id);
        t.classList.toggle("active", on);
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.setAttribute("tabindex", on ? "0" : "-1");
      });
    }

    function syncFromHash() {
      const h = location.hash.slice(1);
      const id = (h && sectionIds.has(h)) ? h : "intro0";
      setActive(id);
    }

    // 탭 클릭 (위임)
    nav?.addEventListener("click", (e) => {
      const a = e.target.closest(".intro-tab");
      if (!a) return;
      e.preventDefault();

      const id = a.dataset.intro || (a.getAttribute("href") || "").replace("#", "");
      if (!id) return;

      setActive(id);
      history.replaceState(history.state || null, "", `#${id}`);
    });

    // 키보드(좌우/홈/엔드) — roving tabindex
    nav?.addEventListener("keydown", (e) => {
      const keys = ["ArrowLeft", "ArrowRight", "Home", "End"];
      if (!keys.includes(e.key)) return;

      const orderedTabs = tabs;
      const currentIndex = orderedTabs.findIndex(t => t.getAttribute("tabindex") === "0");
      if (currentIndex < 0) return;

      let nextIndex = currentIndex;
      if (e.key === "ArrowLeft")  nextIndex = (currentIndex - 1 + orderedTabs.length) % orderedTabs.length;
      if (e.key === "ArrowRight") nextIndex = (currentIndex + 1) % orderedTabs.length;
      if (e.key === "Home")       nextIndex = 0;
      if (e.key === "End")        nextIndex = orderedTabs.length - 1;

      const next = orderedTabs[nextIndex];
      next.click();
      next.focus({ preventScroll: true });
      e.preventDefault();
    });

    window.addEventListener("hashchange", syncFromHash);
    syncFromHash();

    // swap 이후 재바인딩을 위해 반환
    return { syncFromHash };
  }

  async function swapContent(url, { push = true } = {}) {
    const view = document.querySelector("#content-view");
    if (!view) {
      // 구조가 없으면 전체 이동
      location.href = url;
      return;
    }

    const target = absUrl(url);

    // 외부면 전체 이동
    if (!isSameOrigin(target)) {
      location.href = target;
      return;
    }

    try {
      const res = await fetch(target, { credentials: "same-origin" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, "text/html");
      const incoming = getContentRoot(doc);

      // 내용 교체
      view.innerHTML = incoming.innerHTML;

      // 타이틀 반영(선택)
      const t = doc.querySelector("title");
      if (t?.textContent) document.title = t.textContent;

      // URL 반영
      if (push) history.pushState({ url: target }, "", target);

      // 교체 후: 탭/해시 로직 재바인딩
      bindTabs();

      // 콘텐츠 영역 상단으로(헤더/사이드바는 고정)
      view.scrollIntoView({ block: "start" });
    } catch (err) {
      // 실패하면 전체 이동으로 fallback
      location.href = target;
    }
  }

  onReady(() => {
    // ?mode=popup → 레이아웃 클래스(선택)
    if (new URLSearchParams(location.search).get("mode") === "popup") {
      document.body.classList.add("popup-layout");
    }

    // 탭 바인딩(초기)
    bindTabs();

    // 카테고리 셀렉트 (위임)
    document.body.addEventListener("change", (e) => {
      const el = e.target;
      if (!(el instanceof HTMLSelectElement)) return;
      if (!SELECT_IDS.has(el.id)) return;

      const url = el.value && el.value.trim();
      if (!url) return;

      // ✅ 기존: location.href = url
      // ✅ 변경: #content-view만 교체
      swapContent(url, { push: true });
    });

    // 뒤/앞으로가기(popstate): 내용만 다시 로드
    history.replaceState({ url: location.href }, "", location.href);
    window.addEventListener("popstate", (e) => {
      const url = (e.state && e.state.url) ? e.state.url : location.href;
      swapContent(url, { push: false });
    });
  });
})();
