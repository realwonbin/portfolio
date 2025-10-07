// clocktower-map-lazy.js — 시계탑 전용. 뷰포트 근접 시 SDK/데이터를 로드해 지도 초기화

const NCP_KEY_ID = "5yei7ae3lp";  // 콘솔의 Client ID 값 그대로

let map, info, markers = [], mapLoaded = false;

window.navermap_authFailure = function () {
  console.warn("Naver Maps auth failed. ncpKeyId / Web URL origins 확인");
};

function loadScript(src){
  return new Promise((res, rej)=>{
    const s = document.createElement("script");
    s.src = src; s.onload = res; s.onerror = ()=>rej(new Error("script load fail: "+src));
    document.head.appendChild(s);
  });
}

async function ensureSdk(){ if(!(window.naver && window.naver.maps)){
  await loadScript(`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${NCP_KEY_ID}`);
}}

async function fetchPlaces(){
  const r = await fetch("../data/clock-places.json", {cache:"no-cache"});
  if(!r.ok) throw new Error("places json load failed");
  return r.json();
}

async function initMap(){
  if(mapLoaded) return;
  mapLoaded = true;

  await ensureSdk();
  const PLACES = await fetchPlaces();

  const mapDiv = document.getElementById("map");
  const center = PLACES.length
    ? new naver.maps.LatLng(PLACES[0].lat, PLACES[0].lng)
    : new naver.maps.LatLng(37.5665, 126.9780); // 서울

  map = new naver.maps.Map("map", {
    center, zoom: 9, scaleControl: true, zoomControl: true, mapDataControl: false
  });

  info = new naver.maps.InfoWindow({
    anchorSkew: true, backgroundColor: "#111", borderColor: "#333",
    pixelOffset: new naver.maps.Point(0, -8)
  });

  const bounds = new naver.maps.LatLngBounds();
  PLACES.forEach(p=>{
    const pos = new naver.maps.LatLng(p.lat, p.lng);
    bounds.extend(pos);
    const mk = new naver.maps.Marker({ position: pos, map, title: p.title });
    mk.__meta = p;
    naver.maps.Event.addListener(mk, "click", ()=>{
      const html = `
            <div style="min-width:220px">
                <div style="font-weight:700;margin-bottom:4px">${p.title||""}</div>
                <div style="color:#9aa0a6;font-size:12px;margin-bottom:10px">${p.note||""}</div>
                <div style="display:flex;gap:6px;flex-wrap:wrap">
                ${p.id ? `<a class="btn" href="?id=${p.id}" style="padding:4px 8px;border-radius:8px;border:1px solid #333">이미지 보기</a>` : ""}
                <a class="btn" href="${p.naverUrl || `https://map.naver.com/v5/?ll=${p.lat},${p.lng}&c=16,0,0,0,dh`}"
                    target="_blank" rel="noopener"
                    style="padding:4px 8px;border-radius:8px;border:1px solid #333">
                    네이버지도에서 열기
                </a>
                </div>
            </div>`;

      info.setContent(html);
      info.open(map, mk);
    });
    markers.push(mk);
  });

  if (markers.length) map.fitBounds(bounds);
  setTimeout(()=> naver.maps.Event.trigger(map, "resize"), 80);
}

// 뷰포트 근접 시 자동 로드(퍼포먼스 유지)
(function(){
  const el = document.getElementById("mapWrap");
  if(!el) return;
  const io = new IntersectionObserver((entries)=>{
    if(entries.some(e=>e.isIntersecting)){
      io.disconnect(); initMap();
    }
  }, {rootMargin:"200px 0px"}); // 화면 위/아래 200px 근접 시 로드
  io.observe(el);
})();
