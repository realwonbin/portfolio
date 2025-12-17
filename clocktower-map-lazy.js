// clocktower-map-lazy.js
const NCP_KEY_ID = "5yei7ae3lp";

let map, info, markers = [];
let mapLoaded = false;
let sdkReady = false;

function loadScript(src){
  return new Promise((res, rej)=>{
    const s = document.createElement("script");
    s.src = src; s.async = true;
    s.onload = res; s.onerror = ()=>rej(new Error("SDK load fail"));
    document.head.appendChild(s);
  });
}
async function ensureNaverSdk(){
  if (sdkReady) return;
  await loadScript(`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${NCP_KEY_ID}`);
  sdkReady = true;
}
async function fetchPlaces(){
  const r = await fetch("../data/clock-places.json", { cache:"no-store" });
  if (!r.ok) throw new Error("places json load failed");
  return r.json();
}

function openModal(){
  const m = document.getElementById("mapModal");
  m.hidden = false; m.setAttribute("aria-hidden","false");
  document.body.style.overflow = "hidden";
}
function closeModal(){
  const m = document.getElementById("mapModal");
  m.hidden = true; m.setAttribute("aria-hidden","true");
  document.body.style.overflow = "";
}

async function initMapInModal(){
  if (mapLoaded) { naver.maps.Event.trigger(map,"resize"); return; }

  await ensureNaverSdk();
  const PLACES = await fetchPlaces();

  const inner = document.getElementById("mapModalInner");
  inner.innerHTML = '<div id="map" style="width:100%;height:100%"></div>';

  const center = PLACES.length
    ? new naver.maps.LatLng(PLACES[0].lat, PLACES[0].lng)
    : new naver.maps.LatLng(37.5665,126.9780);

  map = new naver.maps.Map("map", {
    center, zoom: 9, scaleControl:true, zoomControl:true, mapDataControl:false
  });
  info = new naver.maps.InfoWindow({
    anchorSkew:true, backgroundColor:"#111", borderColor:"#333",
    pixelOffset: new naver.maps.Point(0,-8)
  });

  const bounds = new naver.maps.LatLngBounds();
  markers = [];

  for (const p of PLACES){
    const pos = new naver.maps.LatLng(p.lat, p.lng);
    bounds.extend(pos);
    const mk = new naver.maps.Marker({ position:pos, map, title:p.title||"" });
    naver.maps.Event.addListener(mk,"click",()=>{
      info.setContent(`
        <div style="min-width:220px">
          <div style="font-weight:700;margin-bottom:6px">${p.title||""}</div>
          ${p.note?`<div style="color:#9aa0a6;font-size:12px;margin-bottom:8px">${p.note}</div>`:""}
          <a href="${p.naverUrl || `https://map.naver.com/v5/?ll=${p.lat},${p.lng}&c=16,${p.lng},${p.lat},0,0,dh`}" target="_blank" rel="noopener"
             style="display:inline-block;padding:4px 8px;border:1px solid #333;border-radius:8px">네이버지도에서 열기</a>
        </div>`);
      info.open(map, mk);
    });
    markers.push(mk);
  }

  if (markers.length){
    try { map.fitBounds(bounds,{top:20,right:20,bottom:20,left:20}); }
    catch { map.fitBounds(bounds); }
    setTimeout(()=>naver.maps.Event.trigger(map,"resize"),120);
  }
  mapLoaded = true;
}

document.addEventListener("DOMContentLoaded", ()=>{
  const openBtn = document.getElementById("map-open");
  const closeBtn = document.getElementById("map-close");
  const closeBg  = document.getElementById("map-close-bg");

  if (openBtn) openBtn.addEventListener("click", async ()=>{
    openModal();
    try { await initMapInModal(); }
    catch (e){ console.error(e); }
  });

  [closeBtn, closeBg].forEach(el=> el && el.addEventListener("click", closeModal));
  document.addEventListener("keydown", (e)=>{ if (e.key === "Escape") closeModal(); });
});

window.navermap_authFailure = function(){
  console.warn("[NaverMaps] 인증 실패 — ncpKeyId 또는 Web URL origins 확인 필요");
};
