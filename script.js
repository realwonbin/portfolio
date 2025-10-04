// script.js — minimal router: tabs + selects (no PJAX, no duplication)
(() => {
  const onReady = (fn) =>
    document.readyState !== "loading"
      ? fn()
      : document.addEventListener("DOMContentLoaded", fn);

  onReady(() => {
    // 0) optional: ?mode=popup → body 클래스
    if (new URLSearchParams(location.search).get("mode") === "popup") {
      document.body.classList.add("popup-layout");
    }

    // refs
    const nav = document.querySelector(".intro-nav");
    const sections = Array.from(document.querySelectorAll(".intro-section"));
    const tabs = Array.from(document.querySelectorAll(".intro-tab"));
    const SELECT_IDS = new Set(["surface", "irreducible", "inprogress"]);
    const SECTION_IDS = new Set(sections.map((s) => s.id));

    // core
    function setActive(id) {
      if (!SECTION_IDS.has(id)) return;
      sections.forEach((s) => s.classList.toggle("active", s.id === id));
      tabs.forEach((t) => {
        const on = t.dataset.intro === id;
        t.classList.toggle("active", on);
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.setAttribute("tabindex", on ? "0" : "-1");
      });
    }

    function syncFromHash() {
      const id = location.hash.slice(1) || (sections[0] && sections[0].id);
      if (id) setActive(id);
    }

    // 1) 탭 클릭(위임)
    nav?.addEventListener("click", (e) => {
      const a = e.target.closest(".intro-tab");
      if (!a) return;
      e.preventDefault();
      const id = a.dataset.intro;
      if (!id) return;
      setActive(id);
      history.replaceState(null, "", `#${id}`); // 공유/새로고침 대응
    });

    // 2) 해시 변경(뒤로/앞으로) 반영
    window.addEventListener("hashchange", syncFromHash);

    // 3) 하단 카테고리 셀렉트(위임)
    document.body.addEventListener("change", (e) => {
      const el = e.target;
      if (!(el instanceof HTMLSelectElement)) return;
      if (!SELECT_IDS.has(el.id)) return;
      const url = el.value && el.value.trim();
      if (url) location.href = url; // 항상 전체 페이지 전환
    });

    // init
    syncFromHash();
  });
})();
