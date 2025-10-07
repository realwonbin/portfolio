// clocktower-map-lazy.js — 시계탑 페이지 전용, 클릭 시 Naver Maps SDK 로드

// 0) 좌표 데이터
const PLACES = [
  // { id, title, lat, lng, note }
  { id:"wonju-musil-park", title:"원주 무실 체육공원 시계탑", lat:37.34123, lng:127.92345, note:"야간 조명 약함" },
  { id:"yanggu-rotary",    title:"양구 로터리 시계",           lat:38.10651, lng:127.98992, note:"교차로 중앙" },
];

// ✅ 새 정책: ncpKeyId 사용
const NCP_KEY_ID = "5yei7ae3lp";  

let map, info, markers = [], mapLoaded = false;

// 인증 실패 시 메시지 보이기(선택)
window.navermap_authFailure = function () {
  const btn = document.getElementById("openMap");
  if (btn) btn.textContent = "인증 실패 — 콘솔의 도메인/키 확인";
  console.warn("Naver Maps auth failed. Check ncpKeyId & Web URL origins.");
};

function loadNaverSdkOnce() {
  return new Promise((res, rej) => {
    if (window.naver && window.naver.maps) return res();
    const s = document.createElement("script");
    s.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${NCP_KEY_ID}`;
    s.onload = () => res();
    s.onerror = () => rej(new Error("Naver Maps SDK load failed"));
    document.head.appendChild(s);
  });
}

function initMap() {
  const mapDiv = document.getElementById("map");
  mapDiv.style.display = "block";

  const center = PLACES.length
    ? new naver.maps.LatLng(PLACES[0].lat, PLACES[0].lng)
    : new naver.maps.LatLng(37.5665, 126.9780);

  map = new naver.maps.Map("map", {
    center, zoom: 9, scaleControl: true, zoomControl: true, mapDataControl: false
  });

  info = new naver.maps.InfoWindow({
    anchorSkew: true, backgroundColor: "#111", borderColor: "#333",
    pixelOffset: new naver.maps.Point(0, -8)
  });

  const bounds = new naver.maps.LatLngBounds();
  PLACES.forEach(p => {
    const pos = new naver.maps.LatLng(p.lat, p.lng);
    bounds.extend(pos);
    const mk = new naver.maps.Marker({ position: pos, map, title: p.title });
    mk.__meta = p;
    naver.maps.Event.addListener(mk, "click", () => {
      const html = `
        <div style="min-width:200px">
          <div style="font-weight:700;margin-bottom:4px">${p.title||""}</div>
          <div style="color:#9aa0a6;font-size:12px;margin-bottom:8px">${p.note||""}</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            ${p.id ? `<a class="btn" href="?id=${p.id}" style="padding:4px 8px;border-radius:8px;border:1px solid #333">이미지 보기</a>` : ""}
            <a class="btn" href="https://map.naver.com/v5/?ll=${p.lat},${p.lng}&c=16,0,0,0,dh" target="_blank" rel="noopener"
               style="padding:4px 8px;border-radius:8px;border:1px solid #333">네이버지도</a>
          </div>
        </div>`;
      info.setContent(html);
      info.open(map, mk);
    });
    markers.push(mk);
  });

  if (!bounds.isEmpty()) map.fitBounds(bounds);
  setTimeout(() => naver.maps.Event.trigger(map, "resize"), 80);
}

function wireMapButton() {
  const btn = document.getElementById("openMap");
  if (!btn) return;
  btn.addEventListener("click", async () => {
    if (mapLoaded) return;
    btn.textContent = "지도를 불러오는 중...";
    try {
      await loadNaverSdkOnce();
      initMap();
      mapLoaded = true;
      const img = document.querySelector("#mapWrap > img");
      if (img) img.style.display = "none";
      btn.style.display = "none";
    } catch (e) {
      btn.textContent = "로드 실패. 다시 시도";
      console.warn(e);
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", wireMapButton);
} else {
  wireMapButton();
}
