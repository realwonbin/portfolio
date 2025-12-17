// script.js — tabs + category selects (no PJAX)
(() => {
  const onReady = (fn) =>
    document.readyState !== "loading"
      ? fn()
      : document.addEventListener("DOMContentLoaded", fn);

  onReady(() => {
    // ?mode=popup → 레이아웃 클래스(선택)
    if (new URLSearchParams(location.search).get("mode") === "popup") {
      document.body.classList.add("popup-layout");
    }

    const nav = document.querySelector(".intro-nav");
    const tabs = Array.from(document.querySelectorAll(".intro-tab"));
    const sections = Array.from(document.querySelectorAll(".intro-section"));
    const SELECT_IDS = new Set(["surface", "irreducible", "inprogress"]);

    const sectionIds = new Set(sections.map(s => s.id));

    function setActive(id){
      if(!sectionIds.has(id)) return;
      sections.forEach(s => s.classList.toggle("active", s.id === id));
      tabs.forEach(t => {
        const on = t.dataset.intro === id || t.getAttribute("href") === `#${id}`;
        t.classList.toggle("active", on);
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.setAttribute("tabindex", on ? "0" : "-1");
      });
    }

    function syncFromHash(){
  const h = location.hash.slice(1);
  const id = (h && sectionIds.has(h)) ? h : 'intro4';   // 기본을 intro1로
  setActive(id);
}

    // 탭 클릭 (위임)
    nav?.addEventListener("click", (e) => {
      const a = e.target.closest(".intro-tab");
      if (!a) return;
      e.preventDefault();
      const id = a.dataset.intro || (a.getAttribute("href") || "").replace("#","");
      if (!id) return;
      setActive(id);
      history.replaceState(null, "", `#${id}`);
      // 필요하면 다음 줄 활성화
      // window.scrollTo({ top: 0, behavior: "instant" });
    });

    // 뒤/앞으로 가기
    window.addEventListener("hashchange", syncFromHash);

    // 카테고리 셀렉트 (위임)
    document.body.addEventListener("change", (e) => {
      const el = e.target;
      if (!(el instanceof HTMLSelectElement)) return;
      if (!SELECT_IDS.has(el.id)) return;
      const url = el.value && el.value.trim();
      if (url) location.href = url; // 항상 전체 전환
    });

    // 첫 진입
    syncFromHash();
  });
})();
