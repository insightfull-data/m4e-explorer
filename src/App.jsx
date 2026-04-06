import { useState, useEffect, useRef, useCallback } from "react";

const API = "https://web-production-7ef0a.up.railway.app";

async function fetchAPI(path) {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// ============================================================
// THEME
// ============================================================
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

// ============================================================
// SMALL COMPONENTS
// ============================================================
function Stat({ label, value, color = T.amber, sub }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "20px 22px", flex: "1 1 170px", minWidth: 155 }}>
      <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 2, color: T.textMuted, fontFamily: "'Fira Code', monospace", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 800, color, fontFamily: "'Outfit', sans-serif", lineHeight: 1 }}>
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
            <div style={{ width: `${(d.value / max) * 100}%`, height: "100%", background: `linear-gradient(90deg, ${color}cc, ${color}66)`, borderRadius: 3, transition: "width 0.5s ease" }} />
          </div>
          <div style={{ width: 55, fontSize: 11, color: T.text, fontFamily: "'Fira Code', monospace", textAlign: "right" }}>{d.value.toLocaleString()}</div>
        </div>
      ))}
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
  const roleColors = { Reference: T.amber, Spouse: T.blue, Child: T.teal, Other: T.violet };
  const c = roleColors[m.role] || T.textMuted;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, background: T.bg, borderRadius: 10, padding: "10px 14px", border: `1px solid ${T.border}` }}>
      <div style={{ width: 34, height: 34, borderRadius: "50%", background: `${c}18`, border: `2px solid ${c}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: c, fontFamily: "'Outfit', sans-serif" }}>{m.age}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{m.sex}, Age {m.age}</div>
        <div style={{ fontSize: 11, color: T.textMuted }}>{m.role} · {m.language} · {m.age_bracket}</div>
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
// MAP COMPONENT (Leaflet)
// ============================================================
function DAMap({ das, geojson, onSelectDA }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const layerRef = useRef(null);
  const [selectedDA, setSelectedDA] = useState(null);
  const [metric, setMetric] = useState("population");
  const [leafletReady, setLeafletReady] = useState(false);

  // Load Leaflet
  useEffect(() => {
    if (window.L) { setLeafletReady(true); return; }
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
    document.head.appendChild(css);
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
    script.onload = () => setLeafletReady(true);
    document.head.appendChild(script);
  }, []);

  // Color scale
  const getColor = useCallback((value, min, max) => {
    const t = max > min ? (value - min) / (max - min) : 0.5;
    const colors = [
      [45, 50, 80],    // dark blue
      [29, 145, 120],  // teal
      [45, 212, 168],  // bright teal
      [232, 168, 56],  // amber
      [232, 67, 106],  // rose
    ];
    const idx = Math.min(t * (colors.length - 1), colors.length - 1.001);
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    const f = idx - lo;
    const r = Math.round(colors[lo][0] * (1 - f) + colors[hi][0] * f);
    const g = Math.round(colors[lo][1] * (1 - f) + colors[hi][1] * f);
    const b = Math.round(colors[lo][2] * (1 - f) + colors[hi][2] * f);
    return `rgb(${r},${g},${b})`;
  }, []);

  // Build DA lookup
  const daLookup = {};
  if (das) das.forEach(d => { daLookup[d.da_id] = d; });

  // Init map
  useEffect(() => {
    if (!leafletReady || !mapRef.current || mapInstance.current) return;
    const L = window.L;
    const map = L.map(mapRef.current, {
      center: [43.675, -79.295],
      zoom: 14,
      zoomControl: true,
      scrollWheelZoom: true,
    });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://carto.com">CARTO</a>',
      maxZoom: 19,
    }).addTo(map);
    mapInstance.current = map;
    return () => { map.remove(); mapInstance.current = null; };
  }, [leafletReady]);

  // Render GeoJSON
  useEffect(() => {
    if (!leafletReady || !mapInstance.current || !geojson || !das?.length) return;
    const L = window.L;
    const map = mapInstance.current;

    if (layerRef.current) { map.removeLayer(layerRef.current); }

    const values = das.map(d => {
      if (metric === "population") return d.population || 0;
      if (metric === "avg_income") return d.avg_income || 0;
      if (metric === "total_households") return d.total_households || 0;
      return 0;
    });
    const min = Math.min(...values);
    const max = Math.max(...values);

    const layer = L.geoJSON(geojson, {
      style: (feature) => {
        const daId = feature.properties.DAUID;
        const da = daLookup[daId];
        let val = 0;
        if (da) {
          if (metric === "population") val = da.population || 0;
          if (metric === "avg_income") val = da.avg_income || 0;
          if (metric === "total_households") val = da.total_households || 0;
        }
        const isSelected = selectedDA === daId;
        return {
          fillColor: getColor(val, min, max),
          fillOpacity: isSelected ? 0.9 : 0.65,
          weight: isSelected ? 3 : 1.5,
          color: isSelected ? T.amber : "rgba(255,255,255,0.25)",
          opacity: 1,
        };
      },
      onEachFeature: (feature, featureLayer) => {
        const daId = feature.properties.DAUID;
        const da = daLookup[daId];
        if (da) {
          featureLayer.bindTooltip(
            `<div style="font-family:monospace;font-size:11px;line-height:1.6">` +
            `<strong>DA ${daId}</strong><br/>` +
            `Pop: ${da.population?.toLocaleString() || "?"}<br/>` +
            `HH: ${da.total_households?.toLocaleString() || "?"}<br/>` +
            `</div>`,
            { sticky: true, className: "da-tooltip" }
          );
        }
        featureLayer.on("click", () => {
          setSelectedDA(daId);
          if (onSelectDA) onSelectDA(daId);
        });
        featureLayer.on("mouseover", () => {
          featureLayer.setStyle({ weight: 2.5, fillOpacity: 0.8 });
        });
        featureLayer.on("mouseout", () => {
          if (selectedDA !== daId) {
            featureLayer.setStyle({ weight: 1.5, fillOpacity: 0.65 });
          }
        });
      },
    });

    layer.addTo(map);
    layerRef.current = layer;

    // Fit bounds
    const bounds = layer.getBounds();
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [30, 30] });
  }, [leafletReady, geojson, das, metric, selectedDA]);

  const daInfo = selectedDA ? daLookup[selectedDA] : null;

  const metrics = [
    { key: "population", label: "Population" },
    { key: "avg_income", label: "Avg Income" },
    { key: "total_households", label: "Households" },
  ];

  return (
    <div>
      <style>{`
        .da-tooltip { background: ${T.card} !important; color: ${T.text} !important; border: 1px solid ${T.border} !important; border-radius: 8px !important; padding: 8px 12px !important; box-shadow: 0 4px 20px rgba(0,0,0,0.5) !important; }
        .da-tooltip .leaflet-tooltip-tip { display: none; }
        .leaflet-container { background: ${T.bg} !important; }
      `}</style>

      {/* Metric selector */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, alignItems: "center" }}>
        <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 2, color: T.textMuted, fontFamily: "'Fira Code', monospace" }}>Color by:</span>
        {metrics.map(m => (
          <button key={m.key} onClick={() => setMetric(m.key)} style={{
            background: metric === m.key ? T.amber + "22" : T.card,
            color: metric === m.key ? T.amber : T.textMuted,
            border: `1px solid ${metric === m.key ? T.amber : T.border}`,
            borderRadius: 8, padding: "5px 12px", fontSize: 11, cursor: "pointer",
            fontFamily: "'Outfit', sans-serif", fontWeight: 600,
          }}>{m.label}</button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
        {/* Map */}
        <div style={{ flex: "1 1 500px", minWidth: 320 }}>
          <div ref={mapRef} style={{
            width: "100%", height: 520, borderRadius: 14,
            border: `1px solid ${T.border}`, overflow: "hidden",
          }} />

          {/* Legend */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, justifyContent: "center" }}>
            <span style={{ fontSize: 10, color: T.textDim, fontFamily: "'Fira Code', monospace" }}>Low</span>
            <div style={{ width: 180, height: 8, borderRadius: 4, background: "linear-gradient(90deg, rgb(45,50,80), rgb(29,145,120), rgb(45,212,168), rgb(232,168,56), rgb(232,67,106))" }} />
            <span style={{ fontSize: 10, color: T.textDim, fontFamily: "'Fira Code', monospace" }}>High</span>
          </div>
        </div>

        {/* DA Detail panel */}
        <div style={{ flex: "0 0 280px", minWidth: 250 }}>
          {daInfo ? (
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20 }}>
              <div style={{ fontFamily: "'Fira Code', monospace", fontSize: 12, color: T.amber, marginBottom: 4 }}>DA {selectedDA}</div>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Dissemination Area</div>

              {[
                { l: "Population", v: daInfo.population?.toLocaleString(), c: T.text },
                { l: "Households", v: daInfo.total_households?.toLocaleString(), c: T.blue },
                { l: "Avg Income", v: daInfo.avg_income ? `$${Math.round(daInfo.avg_income).toLocaleString()}` : "N/A", c: T.teal },
                { l: "Land Area", v: `${daInfo.land_area || "?"} km²`, c: T.text },
              ].map(item => (
                <div key={item.l} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
                  <span style={{ fontSize: 11, color: T.textMuted }}>{item.l}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: item.c, fontFamily: "'Fira Code', monospace" }}>{item.v}</span>
                </div>
              ))}

              <button onClick={() => { setSelectedDA(null); }} style={{
                marginTop: 14, width: "100%", padding: "8px 0", background: T.bg, color: T.textMuted,
                border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 11, cursor: "pointer",
                fontFamily: "'Outfit', sans-serif",
              }}>Clear selection</button>
            </div>
          ) : (
            <div style={{ background: T.card, border: `1px dashed ${T.border}`, borderRadius: 14, padding: 40, textAlign: "center", color: T.textDim, fontSize: 13 }}>
              Click a DA on the map to view details
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
  const [loading, setLoading] = useState(true);
  const [hhPage, setHhPage] = useState(0);
  const [filters, setFilters] = useState({ type: "All", tenure: "All", da: "All" });

  useEffect(() => {
    Promise.all([
      fetchAPI("/api/stats/overview"),
      fetchAPI("/api/das"),
      fetch("/m4e_boundaries.geojson").then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([s, d, geo]) => {
      setStats(s); setDas(d); setGeojson(geo); setLoading(false);
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
    if (selectedHH) {
      fetchAPI(`/api/households/${selectedHH}`).then(setHhDetail).catch(console.error);
    } else { setHhDetail(null); }
  }, [selectedHH]);

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "map", label: "Map" },
    { key: "households", label: "Households" },
    { key: "demographics", label: "Demographics" },
  ];

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: T.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: T.text, fontFamily: "'Outfit', sans-serif" }}>
        <Loading />
        <div style={{ marginTop: 16, fontSize: 14, color: T.textMuted }}>Loading M4E data...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: "'Outfit', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${T.border}`, padding: "18px 24px", background: `linear-gradient(180deg, ${T.cardHover} 0%, ${T.bg} 100%)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.amber, boxShadow: `0 0 10px ${T.amber}88` }} />
          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.5 }}>M4E Synthetic Population</span>
          <span style={{ fontSize: 10, color: T.textMuted, background: T.card, padding: "3px 10px", borderRadius: 16, border: `1px solid ${T.border}`, fontFamily: "'Fira Code', monospace" }}>Census 2021 · Live Data</span>
        </div>
        <div style={{ fontSize: 12, color: T.textDim, marginTop: 4, marginLeft: 18 }}>The Beaches, Toronto — {stats?.total_individuals?.toLocaleString()} individuals · {stats?.total_das} DAs</div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: `1px solid ${T.border}`, padding: "0 24px" }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setSelectedHH(null); }} style={{
            padding: "11px 18px", fontSize: 12, fontWeight: 600, fontFamily: "'Outfit', sans-serif",
            color: tab === t.key ? T.amber : T.textMuted, background: "none", border: "none",
            borderBottom: `2px solid ${tab === t.key ? T.amber : "transparent"}`, cursor: "pointer",
          }}>{t.label}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "22px 24px", maxWidth: 1100 }}>

        {/* OVERVIEW */}
        {tab === "overview" && stats && (
          <div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 26 }}>
              <Stat label="Individuals" value={stats.total_individuals} sub="synthetic persons" />
              <Stat label="Households" value={stats.total_households} color={T.blue} sub="formed via IPF" />
              <Stat label="Median Age" value={stats.median_age} color={T.teal} sub="years" />
              <Stat label="Avg Income" value={`$${Math.round(stats.avg_income || 0).toLocaleString()}`} color={T.rose} sub="per household" />
              <Stat label="DAs" value={stats.total_das} color={T.violet} sub="dissemination areas" />
            </div>
            <div style={{ display: "flex", gap: 22, flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 280px" }}>
                <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 2, color: T.textMuted, fontFamily: "'Fira Code', monospace", marginBottom: 12 }}>Tenure Split</div>
                {stats.tenure_split && <Bar data={stats.tenure_split.map(t => ({ label: t.tenure, value: t.count }))} color={T.teal} />}
              </div>
              <div style={{ flex: "1 1 340px" }}>
                <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 2, color: T.textMuted, fontFamily: "'Fira Code', monospace", marginBottom: 12 }}>Household Types</div>
                {stats.household_types && <Bar data={stats.household_types.map(h => ({ label: h.household_type, value: h.count }))} color={T.blue} />}
              </div>
            </div>
            <div style={{ marginTop: 28, background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20 }}>
              <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 2, color: T.amber, fontFamily: "'Fira Code', monospace", marginBottom: 10 }}>Methodology</div>
              <div style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.8 }}>
                <strong style={{ color: T.text }}>IPF Engine</strong> — Iterative Proportional Fitting across Age × Sex × Language, run independently per DA using 2021 Census marginals. {stats.total_das} dissemination areas calibrated.
                <br /><br />
                <strong style={{ color: T.text }}>Household Formation</strong> — Sequential conditional assignment matching reference persons, spouses, and children by age compatibility and role constraints.
              </div>
            </div>
          </div>
        )}

        {/* MAP */}
        {tab === "map" && (
          <DAMap das={das} geojson={geojson} onSelectDA={(daId) => {}} />
        )}

        {/* HOUSEHOLDS */}
        {tab === "households" && (
          <div>
            <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
              <select value={filters.type} onChange={e => { setFilters(f => ({ ...f, type: e.target.value })); setHhPage(0); }}
                style={{ background: T.card, color: T.text, border: `1px solid ${T.border}`, borderRadius: 8, padding: "7px 10px", fontSize: 12, fontFamily: "'Outfit', sans-serif" }}>
                <option value="All">All Types</option>
                {["Couple no children", "Couple with children", "Lone parent", "One-person", "Other"].map(t => <option key={t} value={t}>{t}</option>)}
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
                  {households.map(hh => (
                    <HHCard key={hh.household_id} hh={hh} selected={selectedHH === hh.household_id}
                      onClick={() => setSelectedHH(selectedHH === hh.household_id ? null : hh.household_id)} />
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 14, justifyContent: "center", alignItems: "center" }}>
                  <button disabled={hhPage === 0} onClick={() => setHhPage(p => p - 1)}
                    style={{ background: T.card, color: hhPage === 0 ? T.textDim : T.text, border: `1px solid ${T.border}`, borderRadius: 6, padding: "5px 12px", cursor: hhPage === 0 ? "default" : "pointer", fontSize: 11, fontFamily: "'Outfit', sans-serif" }}>← Prev</button>
                  <span style={{ fontSize: 11, color: T.textMuted, fontFamily: "'Fira Code', monospace" }}>Page {hhPage + 1}</span>
                  <button disabled={households.length < 50} onClick={() => setHhPage(p => p + 1)}
                    style={{ background: T.card, color: households.length < 50 ? T.textDim : T.text, border: `1px solid ${T.border}`, borderRadius: 6, padding: "5px 12px", cursor: households.length < 50 ? "default" : "pointer", fontSize: 11, fontFamily: "'Outfit', sans-serif" }}>Next →</button>
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
                      {[
                        { l: "Tenure", v: hhDetail.tenure }, { l: "Dwelling", v: hhDetail.dwelling_type },
                        { l: "Size", v: `${hhDetail.size} person${hhDetail.size > 1 ? "s" : ""}` }, { l: "DA", v: hhDetail.da_id },
                      ].map(i => (
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
                  <div style={{ background: T.card, border: `1px dashed ${T.border}`, borderRadius: 14, padding: 40, textAlign: "center", color: T.textDim, fontSize: 13 }}>
                    Select a household to view details
                  </div>
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
                      {["DA", "Population", "Households", "Avg Income", "Avg Age", "Owner %"].map(h => (
                        <th key={h} style={{ padding: "8px 10px", textAlign: "left", color: T.textMuted, fontWeight: 500, fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {daComparison.map((d, i) => (
                      <tr key={d.da_id} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? "transparent" : T.card }}>
                        <td style={{ padding: "8px 10px", color: T.amber }}>{d.da_id}</td>
                        <td style={{ padding: "8px 10px" }}>{d.population?.toLocaleString()}</td>
                        <td style={{ padding: "8px 10px" }}>{d.total_households?.toLocaleString()}</td>
                        <td style={{ padding: "8px 10px", color: T.teal }}>${Math.round(d.avg_income || 0).toLocaleString()}</td>
                        <td style={{ padding: "8px 10px" }}>{d.avg_age}</td>
                        <td style={{ padding: "8px 10px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{ width: 60, height: 6, background: T.bg, borderRadius: 3, overflow: "hidden" }}>
                              <div style={{ width: `${d.owner_pct || 0}%`, height: "100%", background: T.blue, borderRadius: 3 }} />
                            </div>
                            <span>{d.owner_pct}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
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
