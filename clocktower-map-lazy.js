// clocktower-map-lazy.js — 시계탑 전용(최적화판, click-to-load)
const NCP_KEY_ID = "5yei7ae3lp"; // 네이버 클라우드 콘솔 ncpKeyId

let map, info, markers = [];
let mapLoaded = false;
let initStarted = false;

window.navermap_authFailure = function () {
  console.warn("[NaverMaps] 인증 실패 — ncpKeyId / Web URL origins 확인");
};

function loadScript(src) {
  return new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = res;
    s.onerror = () => rej(new Error("script load fail: " + src));
    document.head.appendChild(s);
  });
}

async function ensureSdk() {
  if (window.naver && window.naver.maps) return;
  await loadScript(`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${NCP_KEY_ID}`);
}

async function fetchPlaces() {
  const r = await fetch("../data/clock-places.json", { cache: "no-store" });
  if (!r.ok) throw new Error("places json load failed");
  return r.json();
}

function buildNaverLinks(p) {
  const lat = Number(p.lat), lng = Number(p.lng);
  const titleEnc = encodeURIComponent(p.title || "");
  // 웹: ll + c(zoom,lng,lat,...)로 센터 고정
  const web = p.naverUrl || `https://map.naver.com/v5/?ll=${lat},${lng}&c=16,${lng},${lat},0,0,dh`;
  // 앱 스킴(모바일 안정)
  const app = `nmap://place?lat=${lat}&lng=${lng}&name=${titleEnc}&appname=kr.younglee.site`;
  return { web, app };
}

function openInNaver(p, ev) {
  ev?.preventDefault?.();
  const { web, app } = buildNaverLinks(p);
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (isMobile) {
    setTimeout(() => window.open(web, "_blank", "noopener"), 700);
    location.href = app; // 앱 시도 → 실패 시 타이머로 웹 폴백
  } else {
    window.open(web, "_blank", "noopener");
  }
  return false;
}

function makeInfoHtml(p) {
  const wrap = document.createElement("div");
  wrap.style.minWidth = "220px";
  wrap.innerHTML = `
    <div style="font-weight:700;margin-bottom:8px">${p.title || ""}</div>
    ${p.note ? `<div style="color:#9aa0a6;font-size:12px;margin-bottom:10px">${p.note}</div>` : ""}
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <a id="nv-open" class="btn" href="#" style="padding:6px 10px;border-radius:8px;border:1px solid #333">네이버지도에서 열기</a>
    </div>
  `;
  wrap.querySelector("#nv-open").addEventListener("click", (e) => openInNaver(p, e));
  return wrap;
}

/* -------------------- 모달 지도 -------------------- */
let modalMap = null, modalInfo = null, modalMarkers = null;
let modalLoaded = false;  // SDK/데이터 로드 완료 플래그

async function openMapModal(){
  const modal = document.getElementById('mapModal');
  const inner = document.getElementById('mapModalInner');
  if(!modal || !inner) return;

  // 표시
  modal.hidden = false;
  modal.setAttribute('aria-hidden','false');

  // 첫 오픈 시 로드/생성
  if(!modalLoaded){
    await ensureSdk();
    const PLACES = await fetchPlaces();

    const center = PLACES.length
      ? new naver.maps.LatLng(PLACES[0].lat, PLACES[0].lng)
      : new naver.maps.LatLng(37.5665, 126.9780);

    modalMap = new naver.maps.Map(inner, {
      center, zoom: 9, scaleControl: true, zoomControl: true, mapDataControl: false
    });

    modalInfo = new naver.maps.InfoWindow({
      anchorSkew: true, backgroundColor: "#111", borderColor: "#333",
      pixelOffset: new naver.maps.Point(0, -8)
    });

    const bounds = new naver.maps.LatLngBounds();
    modalMarkers = [];

    for(const p of PLACES){
      const pos = new naver.maps.LatLng(p.lat, p.lng);
      bounds.extend(pos);
      const mk = new naver.maps.Marker({ position: pos, map: modalMap, title: p.title||"" });
      naver.maps.Event.addListener(mk, "click", ()=>{
        modalInfo.setContent(makeInfoHtml(p));
        modalInfo.open(modalMap, mk);
      });
      modalMarkers.push(mk);
    }

    if(modalMarkers.length){
      try { modalMap.fitBounds(bounds, {top:20,right:20,bottom:20,left:20}); }
      catch { modalMap.fitBounds(bounds); }
      setTimeout(()=>naver.maps.Event.trigger(modalMap,"resize"),120);
    }

    modalLoaded = true;
  }else{
    // 재오픈 시 보정
    requestAnimationFrame(()=> naver.maps.Event.trigger(modalMap, "resize"));
  }

  // ESC로 닫기
  const esc = (e)=>{ if(e.key==="Escape") closeMapModal(); };
  document.addEventListener('keydown', esc, { once:true });
}

function closeMapModal(){
  const modal = document.getElementById('mapModal');
  if(!modal) return;
  modal.hidden = true;
  modal.setAttribute('aria-hidden','true');
}

// 버튼 바인딩
document.addEventListener('DOMContentLoaded', ()=>{
  const openBtn  = document.getElementById('map-open');
  const closeBtn = document.getElementById('map-close');
  const closeBg  = document.getElementById('map-close-bg');
  openBtn && openBtn.addEventListener('click', openMapModal);
  closeBtn && closeBtn.addEventListener('click', closeMapModal);
  closeBg && closeBg.addEventListener('click', closeMapModal);
});
