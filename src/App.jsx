import { useState, useEffect, useRef, useCallback } from "react";

const API = "https://web-production-7ef0a.up.railway.app";

async function fetchAPI(path) {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

const T = {
  bg: "#08090d", card: "#0f1117", cardHover: "#151821",
  border: "#1e2333", borderLight: "#2c3452",
  text: "#dce1ed", textMuted: "#6b7a99", textDim: "#455068",
  amber: "#e8a838", amberDim: "#e8a83833",
  teal: "#2dd4a8", tealDim: "#2dd4a822",
  rose: "#e8436a", roseDim: "#e8436a22",
  blue: "#4d8bf5", blueDim: "#4d8bf522",
  violet: "#9b72f2",
};

const CAT_COLORS = {
  dining: T.amber, retail: T.blue, wellness: T.teal,
  health: T.rose, services: T.violet, family: "#8bc34a",
  financial: "#78909c", other: T.textMuted,
};

function Stat({ label, value, color = T.amber, sub }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "20px 22px", flex: "1 1 155px", minWidth: 140 }}>
      <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 2, color: T.textMuted, fontFamily: "'Fira Code', monospace", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color, fontFamily: "'Outfit', sans-serif", lineHeight: 1 }}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      {sub && <div style={{ fontSize: 11, color: T.textDim, marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

function Bar({ data, color = T.amber }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {data.map((d, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 120, fontSize: 11, color: T.textMuted, textAlign: "right", fontFamily: "'Fira Code', monospace", flexShrink: 0 }}>{d.label}</div>
          <div style={{ flex: 1, height: 18, background: T.card, borderRadius: 3, overflow: "hidden", border: `1px solid ${T.border}` }}>
            <div style={{ width: `${(d.value / max) * 100}%`, height: "100%", background: `linear-gradient(90deg, ${d.color || color}cc, ${d.color || color}66)`, borderRadius: 3, transition: "width 0.5s ease" }} />
          </div>
          <div style={{ width: 55, fontSize: 11, color: T.text, fontFamily: "'Fira Code', monospace", textAlign: "right" }}>{d.value.toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
}

function ScoreBar({ label, value, max = 20, color = T.amber }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
        <span style={{ color: T.textMuted }}>{label}</span>
        <span style={{ fontFamily: "'Fira Code', monospace", color: T.text }}>{value}</span>
      </div>
      <div style={{ height: 5, background: T.bg, borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.4s ease" }} />
      </div>
    </div>
  );
}

function HHCard({ hh, onClick, selected }) {
  return (
    <div onClick={onClick} style={{
      background: selected ? T.cardHover : T.card, border: `1px solid ${selected ? T.amber : T.border}`,
      borderRadius: 12, padding: 14, cursor: "pointer", transition: "all 0.15s ease",
      boxShadow: selected ? `0 0 24px ${T.amberDim}` : "none",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontFamily: "'Fira Code', monospace", fontSize: 10, color: T.amber }}>{hh.household_id?.slice(0, 8)}</span>
        <span style={{ fontSize: 10, color: T.textMuted, background: T.bg, padding: "2px 8px", borderRadius: 12 }}>{hh.household_type}</span>
      </div>
      <div style={{ display: "flex", gap: 10, fontSize: 11, color: T.textMuted, fontFamily: "'Fira Code', monospace" }}>
        <span>{hh.tenure}</span><span style={{ color: T.textDim }}>·</span>
        <span>{hh.size} person{hh.size > 1 ? "s" : ""}</span><span style={{ color: T.textDim }}>·</span>
        <span style={{ color: T.teal }}>${hh.income?.toLocaleString()}</span>
      </div>
    </div>
  );
}

function MemberRow({ m }) {
  const rc = { Reference: T.amber, Spouse: T.blue, Child: T.teal, Other: T.violet };
  const c = rc[m.role] || T.textMuted;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, background: T.bg, borderRadius: 10, padding: "10px 14px", border: `1px solid ${T.border}` }}>
      <div style={{ width: 34, height: 34, borderRadius: "50%", background: `${c}18`, border: `2px solid ${c}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: c }}>{m.age}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{m.sex}, Age {m.age}</div>
        <div style={{ fontSize: 11, color: T.textMuted }}>{m.role} · {m.language} · {m.age_bracket}</div>
      </div>
    </div>
  );
}

function BizCard({ biz }) {
  const catColor = CAT_COLORS[biz.category] || T.textMuted;
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: T.text, flex: 1, marginRight: 8 }}>{biz.name}</div>
        {biz.rating && <div style={{ fontSize: 12, fontWeight: 700, color: T.amber, fontFamily: "'Fira Code', monospace", flexShrink: 0 }}>{biz.rating}</div>}
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
        <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 12, background: `${catColor}22`, color: catColor, border: `1px solid ${catColor}44` }}>{biz.category}</span>
        {biz.subcategory && <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 12, background: T.bg, color: T.textMuted }}>{biz.subcategory.slice(0, 30)}</span>}
      </div>
      <div style={{ fontSize: 11, color: T.textDim }}>{biz.address}</div>
      <div style={{ display: "flex", gap: 10, marginTop: 6, fontSize: 10, color: T.textMuted, fontFamily: "'Fira Code', monospace" }}>
        <span>{biz.review_count || 0} reviews</span>
        <span>DA {biz.nearest_da_id}</span>
      </div>
    </div>
  );
}

function Loading() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60 }}>
      <div style={{ width: 36, height: 36, border: `2px solid ${T.border}`, borderTop: `2px solid ${T.amber}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ============================================================
// MAP
// ============================================================
function DAMap({ das, geojson, businesses, onSelectDA }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const layerRef = useRef(null);
  const bizLayerRef = useRef(null);
  const [selectedDA, setSelectedDA] = useState(null);
  const [metric, setMetric] = useState("population");
  const [showBiz, setShowBiz] = useState(true);
  const [leafletReady, setLeafletReady] = useState(false);

  useEffect(() => {
    if (window.L) { setLeafletReady(true); return; }
    const css = document.createElement("link");
    css.rel = "stylesheet"; css.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
    document.head.appendChild(css);
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
    script.onload = () => setLeafletReady(true);
    document.head.appendChild(script);
  }, []);

  const getColor = useCallback((value, min, max) => {
    const t = max > min ? (value - min) / (max - min) : 0.5;
    const colors = [[45,50,80],[29,145,120],[45,212,168],[232,168,56],[232,67,106]];
    const idx = Math.min(t * (colors.length - 1), colors.length - 1.001);
    const lo = Math.floor(idx), hi = Math.ceil(idx), f = idx - lo;
    return `rgb(${Math.round(colors[lo][0]*(1-f)+colors[hi][0]*f)},${Math.round(colors[lo][1]*(1-f)+colors[hi][1]*f)},${Math.round(colors[lo][2]*(1-f)+colors[hi][2]*f)})`;
  }, []);

  const daLookup = {};
  if (das) das.forEach(d => { daLookup[d.da_id] = d; });

  useEffect(() => {
    if (!leafletReady || !mapRef.current || mapInstance.current) return;
    const L = window.L;
    const map = L.map(mapRef.current, { center: [43.675, -79.295], zoom: 14, zoomControl: true, scrollWheelZoom: true });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", { attribution: '&copy; CARTO', maxZoom: 19 }).addTo(map);
    mapInstance.current = map;
    return () => { map.remove(); mapInstance.current = null; };
  }, [leafletReady]);

  // GeoJSON layer
  useEffect(() => {
    if (!leafletReady || !mapInstance.current || !geojson || !das?.length) return;
    const L = window.L, map = mapInstance.current;
    if (layerRef.current) map.removeLayer(layerRef.current);

    const getVal = (da) => {
      if (!da) return 0;
      if (metric === "population") return da.population || 0;
      if (metric === "walkability") return da.character_scores?.walkability_index || 0;
      if (metric === "dining") return da.character_scores?.dining_score || 0;
      if (metric === "total_households") return da.total_households || 0;
      return 0;
    };
    const vals = das.map(getVal);
    const min = Math.min(...vals), max = Math.max(...vals);

    const layer = L.geoJSON(geojson, {
      style: (f) => {
        const da = daLookup[f.properties.DAUID];
        const isSel = selectedDA === f.properties.DAUID;
        return { fillColor: getColor(getVal(da), min, max), fillOpacity: isSel ? 0.9 : 0.6, weight: isSel ? 3 : 1.5, color: isSel ? T.amber : "rgba(255,255,255,0.2)", opacity: 1 };
      },
      onEachFeature: (f, fl) => {
        const da = daLookup[f.properties.DAUID];
        if (da) {
          const cs = da.character_scores || {};
          fl.bindTooltip(
            `<div style="font-family:monospace;font-size:11px;line-height:1.6"><strong>DA ${f.properties.DAUID}</strong><br/>Pop: ${da.population?.toLocaleString()}<br/>Walkability: ${cs.walkability_index || "?"}/10<br/>Dining: ${cs.dining_score || 0} · Retail: ${cs.retail_score || 0}</div>`,
            { sticky: true, className: "da-tooltip" }
          );
        }
        fl.on("click", () => { setSelectedDA(f.properties.DAUID); if (onSelectDA) onSelectDA(f.properties.DAUID); });
        fl.on("mouseover", () => fl.setStyle({ weight: 2.5, fillOpacity: 0.8 }));
        fl.on("mouseout", () => { if (selectedDA !== f.properties.DAUID) fl.setStyle({ weight: 1.5, fillOpacity: 0.6 }); });
      },
    });
    layer.addTo(map);
    layerRef.current = layer;
    const bounds = layer.getBounds();
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [30, 30] });
  }, [leafletReady, geojson, das, metric, selectedDA]);

  // Business dots
  useEffect(() => {
    if (!leafletReady || !mapInstance.current) return;
    const L = window.L, map = mapInstance.current;
    if (bizLayerRef.current) { map.removeLayer(bizLayerRef.current); bizLayerRef.current = null; }
    if (!showBiz || !businesses?.length) return;

    const group = L.layerGroup();
    businesses.forEach(biz => {
      if (!biz.latitude || !biz.longitude) return;
      const color = CAT_COLORS[biz.category] || T.textMuted;
      const marker = L.circleMarker([biz.latitude, biz.longitude], {
        radius: 4, fillColor: color, fillOpacity: 0.85, weight: 1, color: "rgba(255,255,255,0.3)",
      });
      marker.bindTooltip(
        `<div style="font-family:monospace;font-size:11px;line-height:1.5"><strong>${biz.name}</strong><br/>${biz.category}${biz.rating ? ` · ${biz.rating}★` : ""}</div>`,
        { className: "da-tooltip" }
      );
      group.addLayer(marker);
    });
    group.addTo(map);
    bizLayerRef.current = group;
  }, [leafletReady, businesses, showBiz]);

  const daInfo = selectedDA ? daLookup[selectedDA] : null;
  const cs = daInfo?.character_scores || {};
  const metrics = [
    { key: "population", label: "Population" }, { key: "walkability", label: "Walkability" },
    { key: "dining", label: "Dining" }, { key: "total_households", label: "Households" },
  ];

  return (
    <div>
      <style>{`.da-tooltip{background:${T.card}!important;color:${T.text}!important;border:1px solid ${T.border}!important;border-radius:8px!important;padding:8px 12px!important;box-shadow:0 4px 20px rgba(0,0,0,0.5)!important}.da-tooltip .leaflet-tooltip-tip{display:none}.leaflet-container{background:${T.bg}!important}`}</style>

      <div style={{ display: "flex", gap: 8, marginBottom: 14, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 2, color: T.textMuted, fontFamily: "'Fira Code', monospace" }}>Color by:</span>
        {metrics.map(m => (
          <button key={m.key} onClick={() => setMetric(m.key)} style={{
            background: metric === m.key ? T.amber + "22" : T.card, color: metric === m.key ? T.amber : T.textMuted,
            border: `1px solid ${metric === m.key ? T.amber : T.border}`, borderRadius: 8, padding: "5px 12px", fontSize: 11, cursor: "pointer", fontFamily: "'Outfit', sans-serif", fontWeight: 600,
          }}>{m.label}</button>
        ))}
        <div style={{ width: 1, height: 20, background: T.border, margin: "0 4px" }} />
        <button onClick={() => setShowBiz(!showBiz)} style={{
          background: showBiz ? T.teal + "22" : T.card, color: showBiz ? T.teal : T.textMuted,
          border: `1px solid ${showBiz ? T.teal : T.border}`, borderRadius: 8, padding: "5px 12px", fontSize: 11, cursor: "pointer", fontFamily: "'Outfit', sans-serif", fontWeight: 600,
        }}>{showBiz ? "● Businesses" : "○ Businesses"}</button>
      </div>

      <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 500px", minWidth: 320 }}>
          <div ref={mapRef} style={{ width: "100%", height: 520, borderRadius: 14, border: `1px solid ${T.border}`, overflow: "hidden" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 10, color: T.textDim, fontFamily: "'Fira Code', monospace" }}>Low</span>
            <div style={{ width: 140, height: 6, borderRadius: 3, background: "linear-gradient(90deg, rgb(45,50,80), rgb(29,145,120), rgb(45,212,168), rgb(232,168,56), rgb(232,67,106))" }} />
            <span style={{ fontSize: 10, color: T.textDim, fontFamily: "'Fira Code', monospace" }}>High</span>
            {showBiz && <>
              <span style={{ marginLeft: 12, fontSize: 10, color: T.textDim }}>|</span>
              {Object.entries(CAT_COLORS).slice(0, 5).map(([cat, col]) => (
                <span key={cat} style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10, color: T.textDim }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: col, display: "inline-block" }} />{cat}
                </span>
              ))}
            </>}
          </div>
        </div>

        <div style={{ flex: "0 0 280px", minWidth: 250 }}>
          {daInfo ? (
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20 }}>
              <div style={{ fontFamily: "'Fira Code', monospace", fontSize: 12, color: T.amber, marginBottom: 4 }}>DA {selectedDA}</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Neighbourhood Profile</div>

              {[{ l: "Population", v: daInfo.population?.toLocaleString(), c: T.text },
                { l: "Households", v: daInfo.total_households?.toLocaleString(), c: T.blue },
              ].map(i => (
                <div key={i.l} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
                  <span style={{ fontSize: 11, color: T.textMuted }}>{i.l}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: i.c, fontFamily: "'Fira Code', monospace" }}>{i.v}</span>
                </div>
              ))}

              <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 2, color: T.amber, fontFamily: "'Fira Code', monospace", marginTop: 14, marginBottom: 10 }}>Character Scores</div>

              <ScoreBar label="Walkability" value={cs.walkability_index || 0} max={10} color={T.violet} />
              <ScoreBar label="Dining" value={cs.dining_score || 0} max={20} color={T.amber} />
              <ScoreBar label="Retail" value={cs.retail_score || 0} max={15} color={T.blue} />
              <ScoreBar label="Wellness" value={cs.wellness_score || 0} max={10} color={T.teal} />
              <ScoreBar label="Health" value={cs.health_score || 0} max={10} color={T.rose} />
              <ScoreBar label="Services" value={cs.services_score || 0} max={15} color={T.violet} />

              <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 10, marginTop: 10 }}>
                {[{ l: "Within 1km", v: cs.total_nearby_1km || 0 },
                  { l: "Within 500m", v: cs.total_nearby_500m || 0 },
                  { l: "Avg Rating", v: cs.avg_rating || "N/A" },
                ].map(i => (
                  <div key={i.l} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.textMuted, padding: "3px 0" }}>
                    <span>{i.l}</span>
                    <span style={{ color: T.text, fontFamily: "'Fira Code', monospace" }}>{i.v}</span>
                  </div>
                ))}
              </div>

              <button onClick={() => setSelectedDA(null)} style={{
                marginTop: 12, width: "100%", padding: "7px 0", background: T.bg, color: T.textMuted,
                border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 11, cursor: "pointer", fontFamily: "'Outfit', sans-serif",
              }}>Clear selection</button>
            </div>
          ) : (
            <div style={{ background: T.card, border: `1px dashed ${T.border}`, borderRadius: 14, padding: 40, textAlign: "center", color: T.textDim, fontSize: 13 }}>
              Click a DA on the map to view its neighbourhood profile and character scores
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function App() {
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [das, setDas] = useState([]);
  const [households, setHouseholds] = useState([]);
  const [selectedHH, setSelectedHH] = useState(null);
  const [hhDetail, setHhDetail] = useState(null);
  const [daComparison, setDaComparison] = useState([]);
  const [geojson, setGeojson] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [bizSummary, setBizSummary] = useState([]);
  const [bizFilter, setBizFilter] = useState({ category: "All", da: "All" });
  const [loading, setLoading] = useState(true);
  const [hhPage, setHhPage] = useState(0);
  const [bizPage, setBizPage] = useState(0);
  const [filters, setFilters] = useState({ type: "All", tenure: "All", da: "All" });

  useEffect(() => {
    Promise.all([
      fetchAPI("/api/stats/overview"),
      fetchAPI("/api/das"),
      fetch("/m4e_boundaries.geojson").then(r => r.ok ? r.json() : null).catch(() => null),
      fetchAPI("/api/businesses?limit=200"),
      fetchAPI("/api/businesses/summary"),
    ]).then(([s, d, geo, biz, bizSum]) => {
      setStats(s); setDas(d); setGeojson(geo); setBusinesses(biz); setBizSummary(bizSum); setLoading(false);
    }).catch(e => { console.error(e); setLoading(false); });
  }, []);

  useEffect(() => {
    if (tab === "households") {
      let url = `/api/households?limit=50&offset=${hhPage * 50}`;
      if (filters.type !== "All") url += `&household_type=${encodeURIComponent(filters.type)}`;
      if (filters.tenure !== "All") url += `&tenure=${filters.tenure}`;
      if (filters.da !== "All") url += `&da_id=${filters.da}`;
      fetchAPI(url).then(setHouseholds).catch(console.error);
    }
    if (tab === "demographics") {
      fetchAPI("/api/stats/da-comparison").then(setDaComparison).catch(console.error);
    }
  }, [tab, hhPage, filters]);

  useEffect(() => {
    if (tab === "businesses") {
      let url = `/api/businesses?limit=50&offset=${bizPage * 50}`;
      if (bizFilter.category !== "All") url += `&category=${bizFilter.category}`;
      if (bizFilter.da !== "All") url += `&da_id=${bizFilter.da}`;
      fetchAPI(url).then(setBusinesses).catch(console.error);
    }
  }, [tab, bizPage, bizFilter]);

  useEffect(() => {
    if (selectedHH) fetchAPI(`/api/households/${selectedHH}`).then(setHhDetail).catch(console.error);
    else setHhDetail(null);
  }, [selectedHH]);

  const tabs = [
    { key: "overview", label: "Overview" }, { key: "map", label: "Map" },
    { key: "businesses", label: "Businesses" }, { key: "households", label: "Households" },
    { key: "demographics", label: "Demographics" },
  ];

  if (loading) return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: T.text, fontFamily: "'Outfit', sans-serif" }}>
      <Loading /><div style={{ marginTop: 16, fontSize: 14, color: T.textMuted }}>Loading M4E data...</div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: "'Outfit', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet" />

      <div style={{ borderBottom: `1px solid ${T.border}`, padding: "18px 24px", background: `linear-gradient(180deg, ${T.cardHover} 0%, ${T.bg} 100%)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.amber, boxShadow: `0 0 10px ${T.amber}88` }} />
          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.5 }}>M4E Synthetic Population</span>
          <span style={{ fontSize: 10, color: T.textMuted, background: T.card, padding: "3px 10px", borderRadius: 16, border: `1px solid ${T.border}`, fontFamily: "'Fira Code', monospace" }}>Census 2021 · {stats?.total_businesses || 0} businesses</span>
        </div>
        <div style={{ fontSize: 12, color: T.textDim, marginTop: 4, marginLeft: 18 }}>The Beaches, Toronto — {stats?.total_individuals?.toLocaleString()} individuals · {stats?.total_das} DAs · {stats?.total_businesses} businesses</div>
      </div>

      <div style={{ display: "flex", borderBottom: `1px solid ${T.border}`, padding: "0 24px", overflowX: "auto" }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setSelectedHH(null); }} style={{
            padding: "11px 16px", fontSize: 12, fontWeight: 600, fontFamily: "'Outfit', sans-serif",
            color: tab === t.key ? T.amber : T.textMuted, background: "none", border: "none",
            borderBottom: `2px solid ${tab === t.key ? T.amber : "transparent"}`, cursor: "pointer", whiteSpace: "nowrap",
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{ padding: "22px 24px", maxWidth: 1100 }}>

        {/* OVERVIEW */}
        {tab === "overview" && stats && (
          <div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 26 }}>
              <Stat label="Individuals" value={stats.total_individuals} sub="synthetic persons" />
              <Stat label="Households" value={stats.total_households} color={T.blue} sub="formed via IPF" />
              <Stat label="Businesses" value={stats.total_businesses} color={T.teal} sub="from Outscraper" />
              <Stat label="Median Age" value={stats.median_age} color={T.violet} sub="years" />
              <Stat label="Avg Income" value={`$${Math.round(stats.avg_income || 0).toLocaleString()}`} color={T.rose} sub="per household" />
            </div>
            <div style={{ display: "flex", gap: 22, flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 280px" }}>
                <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 2, color: T.textMuted, fontFamily: "'Fira Code', monospace", marginBottom: 12 }}>Tenure Split</div>
                {stats.tenure_split && <Bar data={stats.tenure_split.map(t => ({ label: t.tenure, value: t.count }))} color={T.teal} />}
              </div>
              <div style={{ flex: "1 1 340px" }}>
                <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 2, color: T.textMuted, fontFamily: "'Fira Code', monospace", marginBottom: 12 }}>Business Categories</div>
                {bizSummary?.length > 0 && <Bar data={bizSummary.map(b => ({ label: b.category || b.total_count, value: b.total_count || b.business_count, color: CAT_COLORS[b.category] }))} />}
              </div>
            </div>
            <div style={{ display: "flex", gap: 22, flexWrap: "wrap", marginTop: 22 }}>
              <div style={{ flex: "1 1 340px" }}>
                <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 2, color: T.textMuted, fontFamily: "'Fira Code', monospace", marginBottom: 12 }}>Household Types</div>
                {stats.household_types && <Bar data={stats.household_types.map(h => ({ label: h.household_type, value: h.count }))} color={T.blue} />}
              </div>
            </div>
          </div>
        )}

        {/* MAP */}
        {tab === "map" && <DAMap das={das} geojson={geojson} businesses={businesses} onSelectDA={() => {}} />}

        {/* BUSINESSES */}
        {tab === "businesses" && (
          <div>
            <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
              <select value={bizFilter.category} onChange={e => { setBizFilter(f => ({ ...f, category: e.target.value })); setBizPage(0); }}
                style={{ background: T.card, color: T.text, border: `1px solid ${T.border}`, borderRadius: 8, padding: "7px 10px", fontSize: 12, fontFamily: "'Outfit', sans-serif" }}>
                <option value="All">All Categories</option>
                {Object.keys(CAT_COLORS).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={bizFilter.da} onChange={e => { setBizFilter(f => ({ ...f, da: e.target.value })); setBizPage(0); }}
                style={{ background: T.card, color: T.text, border: `1px solid ${T.border}`, borderRadius: 8, padding: "7px 10px", fontSize: 12, fontFamily: "'Outfit', sans-serif" }}>
                <option value="All">All DAs</option>
                {das.map(d => <option key={d.da_id} value={d.da_id}>{d.da_id}</option>)}
              </select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 10 }}>
              {businesses.map(b => <BizCard key={b.business_id} biz={b} />)}
            </div>
            {businesses.length === 0 && <div style={{ color: T.textMuted, padding: 30, textAlign: "center" }}>No businesses found</div>}
            <div style={{ display: "flex", gap: 8, marginTop: 14, justifyContent: "center", alignItems: "center" }}>
              <button disabled={bizPage === 0} onClick={() => setBizPage(p => p - 1)}
                style={{ background: T.card, color: bizPage === 0 ? T.textDim : T.text, border: `1px solid ${T.border}`, borderRadius: 6, padding: "5px 12px", cursor: bizPage === 0 ? "default" : "pointer", fontSize: 11 }}>← Prev</button>
              <span style={{ fontSize: 11, color: T.textMuted, fontFamily: "'Fira Code', monospace" }}>Page {bizPage + 1}</span>
              <button disabled={businesses.length < 50} onClick={() => setBizPage(p => p + 1)}
                style={{ background: T.card, color: businesses.length < 50 ? T.textDim : T.text, border: `1px solid ${T.border}`, borderRadius: 6, padding: "5px 12px", cursor: businesses.length < 50 ? "default" : "pointer", fontSize: 11 }}>Next →</button>
            </div>
          </div>
        )}

        {/* HOUSEHOLDS */}
        {tab === "households" && (
          <div>
            <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
              <select value={filters.type} onChange={e => { setFilters(f => ({ ...f, type: e.target.value })); setHhPage(0); }}
                style={{ background: T.card, color: T.text, border: `1px solid ${T.border}`, borderRadius: 8, padding: "7px 10px", fontSize: 12, fontFamily: "'Outfit', sans-serif" }}>
                <option value="All">All Types</option>
                {["Couple no children","Couple with children","Lone parent","One-person","Other"].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <select value={filters.tenure} onChange={e => { setFilters(f => ({ ...f, tenure: e.target.value })); setHhPage(0); }}
                style={{ background: T.card, color: T.text, border: `1px solid ${T.border}`, borderRadius: 8, padding: "7px 10px", fontSize: 12, fontFamily: "'Outfit', sans-serif" }}>
                <option value="All">All Tenure</option><option value="Owner">Owner</option><option value="Renter">Renter</option>
              </select>
              <select value={filters.da} onChange={e => { setFilters(f => ({ ...f, da: e.target.value })); setHhPage(0); }}
                style={{ background: T.card, color: T.text, border: `1px solid ${T.border}`, borderRadius: 8, padding: "7px 10px", fontSize: 12, fontFamily: "'Outfit', sans-serif" }}>
                <option value="All">All DAs</option>
                {das.map(d => <option key={d.da_id} value={d.da_id}>{d.da_id}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 360px", minWidth: 280 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {households.length === 0 && <div style={{ color: T.textMuted, padding: 30, textAlign: "center" }}>No households found</div>}
                  {households.map(hh => <HHCard key={hh.household_id} hh={hh} selected={selectedHH === hh.household_id} onClick={() => setSelectedHH(selectedHH === hh.household_id ? null : hh.household_id)} />)}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 14, justifyContent: "center" }}>
                  <button disabled={hhPage === 0} onClick={() => setHhPage(p => p - 1)} style={{ background: T.card, color: hhPage === 0 ? T.textDim : T.text, border: `1px solid ${T.border}`, borderRadius: 6, padding: "5px 12px", cursor: hhPage === 0 ? "default" : "pointer", fontSize: 11 }}>← Prev</button>
                  <span style={{ fontSize: 11, color: T.textMuted, fontFamily: "'Fira Code', monospace" }}>Page {hhPage + 1}</span>
                  <button disabled={households.length < 50} onClick={() => setHhPage(p => p + 1)} style={{ background: T.card, color: households.length < 50 ? T.textDim : T.text, border: `1px solid ${T.border}`, borderRadius: 6, padding: "5px 12px", cursor: households.length < 50 ? "default" : "pointer", fontSize: 11 }}>Next →</button>
                </div>
              </div>
              <div style={{ flex: "1 1 360px", minWidth: 280 }}>
                {hhDetail ? (
                  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 22 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                      <div>
                        <div style={{ fontFamily: "'Fira Code', monospace", fontSize: 12, color: T.amber }}>{hhDetail.household_id?.slice(0, 8)}</div>
                        <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>{hhDetail.household_type}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: T.teal }}>${hhDetail.income?.toLocaleString()}</div>
                        <div style={{ fontSize: 10, color: T.textMuted }}>annual income</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                      {[{l:"Tenure",v:hhDetail.tenure},{l:"Dwelling",v:hhDetail.dwelling_type},{l:"Size",v:`${hhDetail.size} person${hhDetail.size>1?"s":""}`},{l:"DA",v:hhDetail.da_id}].map(i => (
                        <div key={i.l} style={{ background: T.bg, borderRadius: 8, padding: "7px 12px", flex: "1 1 100px" }}>
                          <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 1, color: T.textDim }}>{i.l}</div>
                          <div style={{ fontSize: 13, fontWeight: 500, marginTop: 2 }}>{i.v}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 2, color: T.textMuted, marginBottom: 8 }}>Members</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {hhDetail.members?.map(m => <MemberRow key={m.individual_id} m={m} />)}
                    </div>
                  </div>
                ) : (
                  <div style={{ background: T.card, border: `1px dashed ${T.border}`, borderRadius: 14, padding: 40, textAlign: "center", color: T.textDim, fontSize: 13 }}>Select a household to view details</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* DEMOGRAPHICS */}
        {tab === "demographics" && (
          <div>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 2, color: T.textMuted, fontFamily: "'Fira Code', monospace", marginBottom: 14 }}>DA Comparison</div>
            {daComparison.length === 0 ? <Loading /> : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: "'Fira Code', monospace" }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                      {["DA","Pop","HH","Avg Income","Avg Age","Owner %","Walkability","Dining"].map(h => (
                        <th key={h} style={{ padding: "8px 8px", textAlign: "left", color: T.textMuted, fontWeight: 500, fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {daComparison.map((d, i) => {
                      const cs = d.character_scores || {};
                      return (
                        <tr key={d.da_id} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? "transparent" : T.card }}>
                          <td style={{ padding: "8px 8px", color: T.amber }}>{d.da_id}</td>
                          <td style={{ padding: "8px 8px" }}>{d.population?.toLocaleString()}</td>
                          <td style={{ padding: "8px 8px" }}>{d.total_households?.toLocaleString()}</td>
                          <td style={{ padding: "8px 8px", color: T.teal }}>${Math.round(d.avg_income || 0).toLocaleString()}</td>
                          <td style={{ padding: "8px 8px" }}>{d.avg_age}</td>
                          <td style={{ padding: "8px 8px" }}>{d.owner_pct}%</td>
                          <td style={{ padding: "8px 8px", color: T.violet }}>{cs.walkability_index || "—"}</td>
                          <td style={{ padding: "8px 8px", color: T.amber }}>{cs.dining_score || "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
