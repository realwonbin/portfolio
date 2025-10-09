// clocktower-map-lazy.js — 시계탑 전용(최적화판, click-to-load)

const NCP_KEY_ID = "5yei7ae3lp";

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
  // 웹: ll + c(zoom,lng,lat,...)로 센터 강제
  const web = p.naverUrl || `https://map.naver.com/v5/?ll=${lat},${lng}&c=16,${lng},${lat},0,0,dh`;
  // 앱: place 스킴(모바일에서 더 안정적)
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

function showMapShell() {
  const btn = document.getElementById("map-open");
  const m   = document.getElementById("map");
  if (btn && m) {
    btn.style.display = "none";
    m.classList.remove("hidden");
    m.setAttribute("aria-hidden", "false");
  }
}

async function initMap() {
  if (mapLoaded || initStarted) return;
  initStarted = true;
  showMapShell(); // 버튼 감추고 지도 컨테이너 표시

  try {
    await ensureSdk();
    const PLACES = await fetchPlaces();

    const mapDiv = document.getElementById("map");
    if (!mapDiv) throw new Error("#map element not found");

    const center = PLACES.length
      ? new naver.maps.LatLng(PLACES[0].lat, PLACES[0].lng)
      : new naver.maps.LatLng(37.5665, 126.9780);

    map = new naver.maps.Map("map", {
      center,
      zoom: 9,
      scaleControl: true,
      zoomControl: true,
      mapDataControl: false
    });

    info = new naver.maps.InfoWindow({
      anchorSkew: true,
      backgroundColor: "#111",
      borderColor: "#333",
      pixelOffset: new naver.maps.Point(0, -8)
    });

    const bounds = new naver.maps.LatLngBounds();
    markers = [];

    for (const p of PLACES) {
      const pos = new naver.maps.LatLng(p.lat, p.lng);
      bounds.extend(pos);

      const mk = new naver.maps.Marker({ position: pos, map, title: p.title || "" });
      mk.__meta = p;

      naver.maps.Event.addListener(mk, "click", () => {
        info.setContent(makeInfoHtml(p));
        info.open(map, mk);
      });

      markers.push(mk);
    }

    if (markers.length) {
      try {
        map.fitBounds(bounds, { top: 20, right: 20, bottom: 20, left: 20 });
      } catch {
        map.fitBounds(bounds);
      }
      setTimeout(() => naver.maps.Event.trigger(map, "resize"), 120);
    }

    mapLoaded = true;
  } catch (err) {
    initStarted = false;
    console.error("[Clock Map] init failed:", err);
    // 실패 시 버튼 다시 표시
    const btn = document.getElementById("map-open");
    const m   = document.getElementById("map");
    if (btn && m) { btn.style.display = ""; m.classList.add("hidden"); }
  }
}
window.initMap = initMap; // 외부 호출용 노출

// 탭 전환(이미지/지도) — 지도 탭 가면 로드/리사이즈
function setPage(page){
  const isGallery = page !== "map"; // 기본: 이미지
  document.getElementById("sec-gallery").classList.toggle("hidden", !isGallery);
  document.getElementById("sec-map").classList.toggle("hidden", isGallery);

  if (!isGallery) {
    if (!mapLoaded) {
      initMap();
    } else {
      requestAnimationFrame(()=> naver.maps.Event.trigger(map, "resize"));
    }
  }
}
window.setPage = setPage;

// Click-to-load: 버튼으로만 로드
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("map-open");
  if (btn) btn.addEventListener("click", () => initMap(), { once: true });
});
