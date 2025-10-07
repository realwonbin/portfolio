// clocktower-map-lazy.js — 시계탑 전용(최적화판)
// 뷰포트 근접 시 SDK/데이터를 로드 → 지도/마커 초기화

const NCP_KEY_ID = "5yei7ae3lp"; // 네이버 클라우드 Console의 Client ID (= ncpKeyId)

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
  // 서버 캐시 개입을 줄이기 위해 no-store 사용
  const r = await fetch("../data/clock-places.json", { cache: "no-store" });
  if (!r.ok) throw new Error("places json load failed");
  return r.json();
}

function buildNaverLinks(p) {
  // 웹 링크(정확한 좌표로 열기), 앱 딥링크(모바일 우선)
  const title = encodeURIComponent(p.title || "");
  const web = p.naverUrl || `https://map.naver.com/v5/?ll=${p.lat},${p.lng}&c=16,0,0,0,dh`;
  const app = `nmap://map?lat=${p.lat}&lng=${p.lng}&zoom=16&name=${title}`;
  return { web, app };
}

function openInNaver(p, ev) {
  ev?.preventDefault?.();
  const { web, app } = buildNaverLinks(p);
  const ua = navigator.userAgent;
  const isMobile = /Android|iPhone|iPad|iPod/i.test(ua);

  if (isMobile) {
    // 앱 스킴 시도 → 700ms 내 반응 없으면 웹으로 폴백
    const t = setTimeout(() => window.open(web, "_blank", "noopener"), 700);
    // iOS/Android 모두 location.href가 가장 안정적
    location.href = app;
    // 앱으로 이동되면 브라우저 일시중지되어 타이머가 실행되지 않음
    return false;
  } else {
    window.open(web, "_blank", "noopener");
    return false;
  }
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

async function initMap() {
  if (mapLoaded || initStarted) return;
  initStarted = true;

  try {
    await ensureSdk();
    const PLACES = await fetchPlaces();

    const mapDiv = document.getElementById("map");
    if (!mapDiv) throw new Error("#map element not found");

    const center = PLACES.length
      ? new naver.maps.LatLng(PLACES[0].lat, PLACES[0].lng)
      : new naver.maps.LatLng(37.5665, 126.9780); // 서울

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

      const mk = new naver.maps.Marker({
        position: pos,
        map,
        title: p.title || ""
      });
      mk.__meta = p;

      naver.maps.Event.addListener(mk, "click", () => {
        info.setContent(makeInfoHtml(p));
        info.open(map, mk);
      });

      markers.push(mk);
    }

    if (markers.length) {
      // 패딩 약간 주고 맞춤
      try {
        map.fitBounds(bounds, { top: 20, right: 20, bottom: 20, left: 20 });
      } catch {
        map.fitBounds(bounds);
      }
      // 탭/레이아웃 전환 후 보정
      setTimeout(() => naver.maps.Event.trigger(map, "resize"), 120);
    }

    mapLoaded = true;
  } catch (err) {
    initStarted = false; // 다음 시도 허용
    console.error("[Clock Map] init failed:", err);
    const btn = document.getElementById("map-retry");
    if (btn) {
      btn.classList.remove("hidden");
      btn.addEventListener("click", () => initMap(), { once: true });
    }
  }
}

// 뷰포트 근접 시 자동 로드(IntersectionObserver) + 폴백
(function bootstrap() {
  const el = document.getElementById("mapWrap");
  if (!el) return;

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io.disconnect();
        initMap();
      }
    }, { rootMargin: "200px 0px" }); // 위/아래 200px 근접 시 로드
    io.observe(el);
  } else {
    // 구형 브라우저 폴백: 약간 딜레이 후 로드
    setTimeout(initMap, 300);
  }
})();
