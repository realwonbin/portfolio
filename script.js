// script.js
(() => {
  const onReady = (fn) =>
    document.readyState !== "loading"
      ? fn()
      : document.addEventListener("DOMContentLoaded", fn);

  const SELECT_IDS = new Set(["surface", "irreducible", "inprogress"]);

  function qs(sel, root = document){ return root.querySelector(sel); }
  function qsa(sel, root = document){ return Array.from(root.querySelectorAll(sel)); }

  function setIntroActive(id){
    const sections = qsa(".intro-section");
    const tabs = qsa(".intro-tab");
    const ids = new Set(sections.map(s => s.id));
    if(!ids.has(id)) id = "intro0";

    sections.forEach(s => {
      const on = s.id === id;
      s.classList.toggle("active", on);
      s.hidden = !on;
    });

    tabs.forEach(t => {
      const target = (t.getAttribute("href") || "").replace("#","");
      const on = target === id;
      t.classList.toggle("active", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.setAttribute("tabindex", on ? "0" : "-1");
    });

    // intro 모드로 전환
    qs("#intro-panels").hidden = false;
    qs("#project-view").hidden = true;
  }

  function getQueryParam(name){
    return new URLSearchParams(location.search).get(name);
  }

  function setQueryParam(name, value){
    const u = new URL(location.href);
    if(value == null || value === ""){
      u.searchParams.delete(name);
    }else{
      u.searchParams.set(name, value);
    }
    return u;
  }

  function extractMainHTML(doc){
    // 가능한 한 "내용"만 뽑는다.
    // 1) #content-view (다른 페이지에 있으면)
    // 2) main
    // 3) main.container
    // 4) body
    const candidate =
      doc.querySelector("#content-view") ||
      doc.querySelector("main.container") ||
      doc.querySelector("main") ||
      doc.body;

    // header/nav/footer 같은 반복 요소는 제거 시도(안전한 범위)
    const clone = candidate.cloneNode(true);

    qsa("script, header, nav, footer", clone).forEach(n => n.remove());

    return clone.innerHTML;
  }

  async function loadProject(url, {push = true} = {}){
    const projectView = qs("#project-view");
    const introPanels = qs("#intro-panels");
    const out = qs("#project-content");
    const meta = qs("#project-meta");

    // UI 상태: 프로젝트 모드
    introPanels.hidden = true;
    projectView.hidden = false;

    out.innerHTML = `<div style="color:#666; padding:10px 0;">Loading…</div>`;
    meta.textContent = url;

    try{
      const abs = new URL(url, location.href).toString();
      const res = await fetch(abs, { credentials: "same-origin" });
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();

      const doc = new DOMParser().parseFromString(html, "text/html");
      const title = doc.querySelector("title")?.textContent?.trim();
      if(title) document.title = title;

      out.innerHTML = extractMainHTML(doc);

      // URL 상태 반영: ?p=...
      const next = setQueryParam("p", url);
      // intro hash는 의미 없으니 제거(원하면 유지 가능)
      next.hash = "";
      if(push) history.pushState({p:url}, "", next.toString());

      // 상단 탭의 aria-selected 상태는 "현재 intro를 보고 있지 않다"는 느낌을 주기 위해 모두 비활성 처리
      // (원하면 마지막 선택 탭을 유지하도록 바꿀 수 있음)
      qsa(".intro-tab").forEach(t => {
        t.classList.remove("active");
        t.setAttribute("aria-selected", "false");
        t.setAttribute("tabindex", "-1");
      });

    }catch(e){
      out.innerHTML = `
        <div style="color:#666; padding:10px 0;">
          로드 실패. <a href="${url}">이 링크</a>로 이동해 확인하세요.
        </div>`;
    }
  }

  function bindTopTabs(){
    const nav = qs(".intro-nav");
    if(!nav) return;

    nav.addEventListener("click", (e) => {
      const a = e.target.closest(".intro-tab");
      if(!a) return;
      e.preventDefault();

      const id = (a.getAttribute("href") || "").replace("#","");
      if(!id) return;

      // ✅ 서문 탭 클릭 = intro 모드로 전환 + 해시 반영 + ?p 제거
      const next = setQueryParam("p", "");
      next.hash = `#${id}`;
      history.pushState({intro:id}, "", next.toString());
      setIntroActive(id);
    });

    nav.addEventListener("keydown", (e) => {
      const keys = ["ArrowLeft","ArrowRight","Home","End"];
      if(!keys.includes(e.key)) return;

      const tabs = qsa(".intro-tab");
      const currentIndex = tabs.findIndex(t => t.getAttribute("tabindex") === "0");
      const idx = currentIndex >= 0 ? currentIndex : 0;

      let nextIndex = idx;
      if(e.key === "ArrowLeft")  nextIndex = (idx - 1 + tabs.length) % tabs.length;
      if(e.key === "ArrowRight") nextIndex = (idx + 1) % tabs.length;
      if(e.key === "Home")       nextIndex = 0;
      if(e.key === "End")        nextIndex = tabs.length - 1;

      tabs[nextIndex].click();
      tabs[nextIndex].focus({preventScroll:true});
      e.preventDefault();
    });
  }

  function bindSidebarSelects(){
    document.body.addEventListener("change", (e) => {
      const el = e.target;
      if(!(el instanceof HTMLSelectElement)) return;
      if(!SELECT_IDS.has(el.id)) return;

      const url = (el.value || "").trim();
      if(!url) return;

      loadProject(url, {push:true});
    });

    // “시작 섹션 안의 썸네일 링크”도 같은 방식으로 로드하고 싶으면
    document.body.addEventListener("click", (e) => {
      const a = e.target.closest('a[data-load="project"]');
      if(!a) return;
      const href = a.getAttribute("href");
      if(!href) return;
      e.preventDefault();
      loadProject(href, {push:true});
    });

    // 서문으로 돌아가기 버튼
    qs("#btn-back")?.addEventListener("click", () => {
      const next = setQueryParam("p", "");
      // hash 없으면 intro0로
      next.hash = location.hash && location.hash.startsWith("#intro") ? location.hash : "#intro0";
      history.pushState({intro: next.hash.slice(1)}, "", next.toString());
      setIntroActive(next.hash.slice(1));
    });
  }

  function bootFromURL(){
    const p = getQueryParam("p");
    if(p){
      // 프로젝트 모드
      loadProject(p, {push:false});
      return;
    }

    // 서문 모드: hash 기준, 없으면 intro0 강제
    const h = location.hash.slice(1);
    if(h && h.startsWith("intro")){
      setIntroActive(h);
    }else{
      // ✅ “잠깐 보였다가 다른 탭으로 바뀌는 현상” 방지: hash를 intro0로 고정
      const next = new URL(location.href);
      next.hash = "#intro0";
      history.replaceState({intro:"intro0"}, "", next.toString());
      setIntroActive("intro0");
    }
  }

  onReady(() => {
    bindTopTabs();
    bindSidebarSelects();

    // 뒤/앞으로가기
    window.addEventListener("popstate", () => bootFromURL());

    bootFromURL();
  });
})();
