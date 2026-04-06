import { useState, useEffect, useMemo, useCallback } from "react";

const API = "https://web-production-7ef0a.up.railway.app";

// ============================================================
// DATA LAYER
// ============================================================
async function fetchAPI(path) {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// ============================================================
// THEME
// ============================================================
const T = {
  bg: "#08090d",
  card: "#0f1117",
  cardHover: "#151821",
  border: "#1e2333",
  borderLight: "#2c3452",
  text: "#dce1ed",
  textMuted: "#6b7a99",
  textDim: "#455068",
  amber: "#e8a838",
  amberDim: "#e8a83833",
  teal: "#2dd4a8",
  tealDim: "#2dd4a822",
  rose: "#e8436a",
  roseDim: "#e8436a22",
  blue: "#4d8bf5",
  blueDim: "#4d8bf522",
  violet: "#9b72f2",
};

// ============================================================
// COMPONENTS
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
      background: selected ? T.cardHover : T.card,
      border: `1px solid ${selected ? T.amber : T.border}`,
      borderRadius: 12, padding: 14, cursor: "pointer",
      transition: "all 0.15s ease",
      boxShadow: selected ? `0 0 24px ${T.amberDim}` : "none",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontFamily: "'Fira Code', monospace", fontSize: 10, color: T.amber }}>{hh.household_id?.slice(0, 8)}</span>
        <span style={{ fontSize: 10, color: T.textMuted, background: T.bg, padding: "2px 8px", borderRadius: 12 }}>{hh.household_type}</span>
      </div>
      <div style={{ display: "flex", gap: 10, fontSize: 11, color: T.textMuted, fontFamily: "'Fira Code', monospace" }}>
        <span>{hh.tenure}</span>
        <span style={{ color: T.textDim }}>·</span>
        <span>{hh.size} person{hh.size > 1 ? "s" : ""}</span>
        <span style={{ color: T.textDim }}>·</span>
        <span style={{ color: T.teal }}>${hh.income?.toLocaleString()}</span>
      </div>
      {hh.da_name && <div style={{ fontSize: 10, color: T.textDim, marginTop: 6 }}>{hh.da_name}</div>}
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
  const [loading, setLoading] = useState(true);
  const [hhPage, setHhPage] = useState(0);
  const [filters, setFilters] = useState({ type: "All", tenure: "All", da: "All" });

  useEffect(() => {
    Promise.all([
      fetchAPI("/api/stats/overview"),
      fetchAPI("/api/das"),
    ]).then(([s, d]) => {
      setStats(s);
      setDas(d);
      setLoading(false);
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
    } else {
      setHhDetail(null);
    }
  }, [selectedHH]);

  const tabs = [
    { key: "overview", label: "Overview" },
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
              {/* Tenure */}
              <div style={{ flex: "1 1 280px" }}>
                <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 2, color: T.textMuted, fontFamily: "'Fira Code', monospace", marginBottom: 12 }}>Tenure Split</div>
                {stats.tenure_split && (
                  <Bar data={stats.tenure_split.map(t => ({ label: t.tenure, value: t.count }))} color={T.teal} />
                )}
              </div>

              {/* Household Types */}
              <div style={{ flex: "1 1 340px" }}>
                <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 2, color: T.textMuted, fontFamily: "'Fira Code', monospace", marginBottom: 12 }}>Household Types</div>
                {stats.household_types && (
                  <Bar data={stats.household_types.map(h => ({ label: h.household_type, value: h.count }))} color={T.blue} />
                )}
              </div>
            </div>

            {/* Methodology */}
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

        {/* HOUSEHOLDS */}
        {tab === "households" && (
          <div>
            {/* Filters */}
            <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
              <select value={filters.type} onChange={e => { setFilters(f => ({ ...f, type: e.target.value })); setHhPage(0); }}
                style={{ background: T.card, color: T.text, border: `1px solid ${T.border}`, borderRadius: 8, padding: "7px 10px", fontSize: 12, fontFamily: "'Outfit', sans-serif" }}>
                <option value="All">All Types</option>
                {["Couple no children", "Couple with children", "Lone parent", "One-person", "Other"].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <select value={filters.tenure} onChange={e => { setFilters(f => ({ ...f, tenure: e.target.value })); setHhPage(0); }}
                style={{ background: T.card, color: T.text, border: `1px solid ${T.border}`, borderRadius: 8, padding: "7px 10px", fontSize: 12, fontFamily: "'Outfit', sans-serif" }}>
                <option value="All">All Tenure</option>
                <option value="Owner">Owner</option>
                <option value="Renter">Renter</option>
              </select>
              <select value={filters.da} onChange={e => { setFilters(f => ({ ...f, da: e.target.value })); setHhPage(0); }}
                style={{ background: T.card, color: T.text, border: `1px solid ${T.border}`, borderRadius: 8, padding: "7px 10px", fontSize: 12, fontFamily: "'Outfit', sans-serif" }}>
                <option value="All">All DAs</option>
                {das.map(d => <option key={d.da_id} value={d.da_id}>{d.da_id}</option>)}
              </select>
            </div>

            <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
              {/* List */}
              <div style={{ flex: "1 1 360px", minWidth: 280 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {households.length === 0 && <div style={{ color: T.textMuted, padding: 30, textAlign: "center" }}>No households found</div>}
                  {households.map(hh => (
                    <HHCard key={hh.household_id} hh={hh} selected={selectedHH === hh.household_id}
                      onClick={() => setSelectedHH(selectedHH === hh.household_id ? null : hh.household_id)} />
                  ))}
                </div>
                {/* Pagination */}
                <div style={{ display: "flex", gap: 8, marginTop: 14, justifyContent: "center", alignItems: "center" }}>
                  <button disabled={hhPage === 0} onClick={() => setHhPage(p => p - 1)}
                    style={{ background: T.card, color: hhPage === 0 ? T.textDim : T.text, border: `1px solid ${T.border}`, borderRadius: 6, padding: "5px 12px", cursor: hhPage === 0 ? "default" : "pointer", fontSize: 11, fontFamily: "'Outfit', sans-serif" }}>← Prev</button>
                  <span style={{ fontSize: 11, color: T.textMuted, fontFamily: "'Fira Code', monospace" }}>Page {hhPage + 1}</span>
                  <button disabled={households.length < 50} onClick={() => setHhPage(p => p + 1)}
                    style={{ background: T.card, color: households.length < 50 ? T.textDim : T.text, border: `1px solid ${T.border}`, borderRadius: 6, padding: "5px 12px", cursor: households.length < 50 ? "default" : "pointer", fontSize: 11, fontFamily: "'Outfit', sans-serif" }}>Next →</button>
                </div>
              </div>

              {/* Detail */}
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
                        { l: "Tenure", v: hhDetail.tenure },
                        { l: "Dwelling", v: hhDetail.dwelling_type },
                        { l: "Size", v: `${hhDetail.size} person${hhDetail.size > 1 ? "s" : ""}` },
                        { l: "DA", v: hhDetail.da_id },
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
