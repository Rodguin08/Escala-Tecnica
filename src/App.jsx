import { useState, useRef, useMemo } from "react";

const DEF_TEC = ["Rodrigo A", "Kelvin", "Cezar"];
const DEF_APR = ["Luis Paulo", "Romerson", "Leonardo Branquelli", "Abraão e Isaac", "Ana Thiele", "Caetano"];
const MN = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

const GR_MAR = {
  "01_M":"Andi e Poli","01_N":"André Connect",
  "08_M":"Dani e Romer","08_N":"Eliezer",
  "15_M":"GR1 Fabiano","15_N":"GR1 Fabiano",
  "22_M":"Juan e Fabi","22_N":"Enos Ana e Fabio",
  "29_M":"André Connect","29_N":"Andi e Poli",
};
const FIX_MAR = { "01_M": { tecnico: "Cezar e Kelvin", aprendiz: "Ana Thiele" } };

function genEvents(y, m) {
  const days = new Date(y, m + 1, 0).getDate();
  const list = [];
  const mm = String(m + 1).padStart(2, "0");
  for (let d = 1; d <= days; d++) {
    const dt = new Date(y, m, d);
    const dow = dt.getDay(); // 0=Sun 5=Fri 6=Sat
    const dd = String(d).padStart(2, "0");
    const dateStr = `${dd}/${mm}`;
    // Sort key: date * 10 + sub-order to keep Manhã before Noite
    const ts = d * 10;
    if (dow === 5) list.push({ id: `${y}-${mm}-${dd}_FN`, date: dateStr, d, dow, period: "Noite", day: "Sexta", evento: "Connect Adoles", gr: null, sort: ts + 1 });
    if (dow === 6) list.push({ id: `${y}-${mm}-${dd}_SN`, date: dateStr, d, dow, period: "Noite", day: "Sábado", evento: "Connect Jovens", gr: null, sort: ts + 1 });
    if (dow === 0) {
      const gM = (y === 2026 && m === 2) ? (GR_MAR[`${dd}_M`] || null) : null;
      const gN = (y === 2026 && m === 2) ? (GR_MAR[`${dd}_N`] || null) : null;
      list.push({ id: `${y}-${mm}-${dd}_DM`, date: dateStr, d, dow, period: "Manhã", day: "Domingo", evento: "Culto", gr: gM, sort: ts + 1 });
      list.push({ id: `${y}-${mm}-${dd}_DN`, date: dateStr, d, dow, period: "Noite", day: "Domingo", evento: "Culto", gr: gN, sort: ts + 2 });
    }
  }
  list.sort((a, b) => a.sort - b.sort);
  return list;
}

function assignRota(events, tecs, aprs, y, m) {
  let ti = 0, ai = 0;
  return events.map(ev => {
    const dd = String(ev.d).padStart(2, "0");
    const fk = `${dd}_${ev.period === "Manhã" ? "M" : "N"}`;
    if (y === 2026 && m === 2 && FIX_MAR[fk]) return { ...ev, ...FIX_MAR[fk] };
    return { ...ev, tecnico: tecs.length ? tecs[ti++ % tecs.length] : "", aprendiz: aprs.length ? aprs[ai++ % aprs.length] : "" };
  });
}

// Group by week Mon-Sun. Get the Monday of each event's week.
function getMonday(y, m, d) {
  const dt = new Date(y, m, d);
  const dow = dt.getDay(); // 0=Sun..6=Sat
  // Monday = 1. If dow=0 (Sun), Monday was 6 days ago
  const diff = dow === 0 ? 6 : dow - 1;
  const mon = new Date(dt);
  mon.setDate(dt.getDate() - diff);
  return mon.toISOString().slice(0, 10);
}

function groupWeeks(events, y, m) {
  if (!events.length) return [];
  const map = new Map();
  events.forEach(ev => {
    const mk = getMonday(y, m, ev.d);
    if (!map.has(mk)) map.set(mk, []);
    map.get(mk).push(ev);
  });
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([, evs]) => evs);
}

const TH = {
  Sexta: { accent: "#f59e0b", bg: "rgba(245,158,11,0.07)", tagC: "#78350f", tagBg: "#fbbf24" },
  "Sábado": { accent: "#ec4899", bg: "rgba(236,72,153,0.07)", tagC: "#831843", tagBg: "#f472b6" },
  Domingo: { accent: "#3b82f6", bg: "rgba(59,130,246,0.07)", tagC: "#1e3a5f", tagBg: "#60a5fa" },
};

export default function App() {
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(2);
  const [tecs, setTecs] = useState([...DEF_TEC]);
  const [aprs, setAprs] = useState([...DEF_APR]);
  const [edits, setEdits] = useState({});
  const [eCell, setECell] = useState(null);
  const [eVal, setEVal] = useState("");
  const [panel, setPanel] = useState(false);
  const [nT, setNT] = useState("");
  const [nA, setNA] = useState("");
  const [ePer, setEPer] = useState(null);
  const [ePVal, setEPVal] = useState("");
  const [exp, setExp] = useState(false);

  const raw = useMemo(() => genEvents(year, month), [year, month]);
  const schedule = useMemo(() => {
    const base = assignRota(raw, tecs, aprs, year, month);
    return base.map(ev => ({ ...ev, ...(edits[ev.id] || {}) }));
  }, [raw, tecs, aprs, year, month, edits]);
  const weeks = useMemo(() => groupWeeks(schedule, year, month), [schedule, year, month]);

  const prev = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); setEdits({}); };
  const next = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); setEdits({}); };

  const addT = () => { const n = nT.trim(); if (n && !tecs.includes(n)) { setTecs(p => [...p, n]); setNT(""); } };
  const rmT = i => setTecs(p => p.filter((_, j) => j !== i));
  const addA = () => { const n = nA.trim(); if (n && !aprs.includes(n)) { setAprs(p => [...p, n]); setNA(""); } };
  const rmA = i => setAprs(p => p.filter((_, j) => j !== i));
  const startEP = (t, i, n) => { setEPer({ t, i }); setEPVal(n); };
  const saveEP = () => {
    if (!ePer) return; const v = ePVal.trim(); if (!v) { setEPer(null); return; }
    if (ePer.t === "tec") setTecs(p => { const n = [...p]; n[ePer.i] = v; return n; });
    else setAprs(p => { const n = [...p]; n[ePer.i] = v; return n; });
    setEPer(null);
  };

  const startE = (id, f, v) => { setECell({ id, f }); setEVal(v || ""); };
  const saveE = () => { if (!eCell) return; setEdits(p => ({ ...p, [eCell.id]: { ...(p[eCell.id] || {}), [eCell.f]: eVal } })); setECell(null); };
  const cancelE = () => setECell(null);

  const countFor = n => schedule.filter(ev => ev.tecnico === n || ev.aprendiz === n || (ev.tecnico && ev.tecnico.split(" e ").map(s => s.trim()).includes(n))).length;

  const exportPNG = () => {
    setExp(true);
    setTimeout(() => {
      try {
        const W = 860, pad = 30, rH = 30, wkL = 26, hH = 22, wkG = 14, sumH = 110;
        const H = pad + 80 + weeks.length * (wkL + hH + wkG) + schedule.length * rH + sumH + pad + 20;
        const c = document.createElement("canvas"); const s = 2;
        c.width = W * s; c.height = H * s;
        const x = c.getContext("2d"); x.scale(s, s);
        x.fillStyle = "#0f172a"; x.fillRect(0, 0, W, H);
        let y = pad;
        x.textAlign = "center"; x.fillStyle = "#e2e8f0"; x.font = "bold 20px system-ui";
        x.fillText(`Escala de Som — ${MN[month]} ${year}`, W / 2, y + 22);
        x.font = "12px system-ui"; x.fillStyle = "#64748b";
        x.fillText("Técnicos & Aprendizes · Igreja", W / 2, y + 40); y += 56;
        const legs = [{ l: "Sexta · Connect Adoles", c: "#f59e0b" }, { l: "Sábado · Connect Jovens", c: "#ec4899" }, { l: "Domingo · Culto", c: "#3b82f6" }];
        x.textAlign = "left"; let lx = W / 2 - 190;
        legs.forEach(l => { x.fillStyle = l.c; x.beginPath(); x.arc(lx + 5, y, 4, 0, Math.PI * 2); x.fill(); x.fillStyle = "#94a3b8"; x.font = "11px system-ui"; x.fillText(l.l, lx + 14, y + 4); lx += 135; }); y += 24;
        const cX = [pad, pad + 90, pad + 195, pad + 370, pad + 560];
        const cH = ["Data", "Evento", "Banda / GR", "Aprendiz", "Técnico"];
        weeks.forEach((wk, wi) => {
          const f = wk[0].date, la = wk[wk.length - 1].date;
          x.fillStyle = "#475569"; x.font = "bold 11px system-ui";
          x.fillText(`SEMANA ${wi + 1} · ${f} a ${la}`, pad, y + 12); y += wkL;
          x.fillStyle = "#3e4a5c"; x.font = "bold 9px system-ui";
          cH.forEach((h, i) => x.fillText(h.toUpperCase(), cX[i], y + 10)); y += hH;
          wk.forEach(ev => {
            const t = TH[ev.day] || TH.Domingo;
            x.fillStyle = t.bg;
            try { x.beginPath(); x.roundRect(pad - 4, y - 2, W - 2 * pad + 8, rH - 2, 5); x.fill(); } catch { x.fillRect(pad - 4, y - 2, W - 2 * pad + 8, rH - 2); }
            x.fillStyle = t.accent; x.fillRect(pad - 4, y - 2, 3, rH - 2);
            x.fillStyle = "#f1f5f9"; x.font = "bold 12px system-ui";
            x.fillText(`${ev.date} ${ev.period}`, cX[0], y + 16);
            x.font = "12px system-ui"; x.fillStyle = "#94a3b8"; x.fillText(ev.evento, cX[1], y + 16);
            x.fillStyle = ev.gr ? "#e2e8f0" : "#3e4a5c"; x.fillText(ev.gr || "—", cX[2], y + 16);
            x.fillStyle = ev.aprendiz ? "#e2e8f0" : "#3e4a5c"; x.fillText(ev.aprendiz || "—", cX[3], y + 16);
            x.fillStyle = ev.tecnico ? "#e2e8f0" : "#3e4a5c"; x.fillText(ev.tecnico || "—", cX[4], y + 16);
            y += rH;
          }); y += wkG;
        });
        try { x.fillStyle = "rgba(255,255,255,0.04)"; x.beginPath(); x.roundRect(pad - 4, y, W - 2 * pad + 8, sumH - 10, 8); x.fill(); } catch {}
        x.fillStyle = "#475569"; x.font = "bold 10px system-ui"; x.fillText("RESUMO", pad + 8, y + 18);
        let sx = pad + 8, sy = y + 36;
        [...tecs.map(n => ({ n, t: "TÉC" })), ...aprs.map(n => ({ n, t: "APR" }))].forEach(({ n, t }) => {
          const cnt = countFor(n); const lb = `${t} ${n}: ${cnt}`;
          x.font = "11px system-ui"; const lw = x.measureText(lb).width + 20;
          if (sx + lw > W - pad) { sx = pad + 8; sy += 22; }
          x.fillStyle = t === "TÉC" ? "rgba(99,102,241,0.15)" : "rgba(16,185,129,0.15)";
          try { x.beginPath(); x.roundRect(sx, sy - 10, lw, 18, 6); x.fill(); } catch { x.fillRect(sx, sy - 10, lw, 18); }
          x.fillStyle = t === "TÉC" ? "#818cf8" : "#34d399"; x.fillText(lb, sx + 6, sy + 2); sx += lw + 8;
        });
        const link = document.createElement("a");
        link.download = `escala-som-${MN[month].toLowerCase()}-${year}.png`;
        link.href = c.toDataURL("image/png"); link.click();
      } catch (e) { console.error(e); }
      setExp(false);
    }, 100);
  };

  const iS = { background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, padding: "5px 10px", color: "#e2e8f0", fontSize: 13, outline: "none", width: "100%" };
  const bS = c => ({ background: c, border: "none", borderRadius: 6, padding: "4px 10px", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" });

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(145deg,#0f172a 0%,#1e293b 50%,#0f172a 100%)", fontFamily: "'Segoe UI',system-ui,sans-serif", color: "#e2e8f0", padding: "20px 16px" }}>
      {/* Header */}
      <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 26 }}>🎚️</span>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, background: "linear-gradient(90deg,#60a5fa,#a78bfa,#f472b6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Escala de Som</h1>
            <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>Técnicos & Aprendizes · Igreja</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setPanel(!panel)} style={{ background: panel ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "8px 16px", color: "#e2e8f0", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>⚙️ Equipe</button>
          <button onClick={exportPNG} disabled={exp} style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 8, padding: "8px 16px", color: "#10b981", cursor: "pointer", fontSize: 13, fontWeight: 600, opacity: exp ? 0.5 : 1 }}>{exp ? "⏳..." : "📷 PNG"}</button>
        </div>
      </div>

      {/* Month nav */}
      <div style={{ maxWidth: 960, margin: "0 auto 20px", display: "flex", justifyContent: "center", alignItems: "center", gap: 20 }}>
        <button onClick={prev} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 16px", color: "#e2e8f0", cursor: "pointer", fontSize: 20, fontWeight: 700, lineHeight: 1 }}>‹</button>
        <div style={{ textAlign: "center", minWidth: 220 }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#f1f5f9" }}>{MN[month]}</div>
          <div style={{ fontSize: 14, color: "#64748b", fontWeight: 500 }}>{year}</div>
        </div>
        <button onClick={next} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 16px", color: "#e2e8f0", cursor: "pointer", fontSize: 20, fontWeight: 700, lineHeight: 1 }}>›</button>
      </div>

      {/* Panel */}
      {panel && (
        <div style={{ maxWidth: 960, margin: "0 auto 24px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div>
            <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: "#818cf8", textTransform: "uppercase", letterSpacing: "0.06em" }}>🎛️ Técnicos ({tecs.length})</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {tecs.map((t, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(99,102,241,0.08)", borderRadius: 8, padding: "6px 10px" }}>
                  {ePer?.t === "tec" && ePer.i === i ? (
                    <><input value={ePVal} onChange={e => setEPVal(e.target.value)} onKeyDown={e => e.key === "Enter" && saveEP()} style={{ ...iS, flex: 1 }} autoFocus /><button onClick={saveEP} style={bS("#10b981")}>✓</button><button onClick={() => setEPer(null)} style={bS("#64748b")}>✕</button></>
                  ) : (
                    <><span style={{ flex: 1, fontSize: 13 }}>{t}</span><button onClick={() => startEP("tec", i, t)} style={bS("rgba(255,255,255,0.1)")}>✏️</button><button onClick={() => rmT(i)} style={bS("rgba(239,68,68,0.3)")}>🗑</button></>
                  )}
                </div>
              ))}
              <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                <input value={nT} onChange={e => setNT(e.target.value)} onKeyDown={e => e.key === "Enter" && addT()} placeholder="Novo técnico..." style={{ ...iS, flex: 1 }} />
                <button onClick={addT} style={bS("#6366f1")}>+ Adicionar</button>
              </div>
            </div>
          </div>
          <div>
            <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: "#34d399", textTransform: "uppercase", letterSpacing: "0.06em" }}>🎓 Aprendizes ({aprs.length})</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {aprs.map((a, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(16,185,129,0.08)", borderRadius: 8, padding: "6px 10px" }}>
                  {ePer?.t === "apr" && ePer.i === i ? (
                    <><input value={ePVal} onChange={e => setEPVal(e.target.value)} onKeyDown={e => e.key === "Enter" && saveEP()} style={{ ...iS, flex: 1 }} autoFocus /><button onClick={saveEP} style={bS("#10b981")}>✓</button><button onClick={() => setEPer(null)} style={bS("#64748b")}>✕</button></>
                  ) : (
                    <><span style={{ flex: 1, fontSize: 13 }}>{a}</span><button onClick={() => startEP("apr", i, a)} style={bS("rgba(255,255,255,0.1)")}>✏️</button><button onClick={() => rmA(i)} style={bS("rgba(239,68,68,0.3)")}>🗑</button></>
                  )}
                </div>
              ))}
              <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                <input value={nA} onChange={e => setNA(e.target.value)} onKeyDown={e => e.key === "Enter" && addA()} placeholder="Novo aprendiz..." style={{ ...iS, flex: 1 }} />
                <button onClick={addA} style={bS("#10b981")}>+ Adicionar</button>
              </div>
            </div>
          </div>
          <div style={{ gridColumn: "1/-1", textAlign: "center", paddingTop: 4 }}>
            <button onClick={() => setEdits({})} style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", borderRadius: 8, padding: "10px 28px", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>🔄 Regerar Rodízio</button>
            <p style={{ fontSize: 11, color: "#64748b", marginTop: 6 }}>Limpa edições manuais e redistribui</p>
          </div>
        </div>
      )}

      {/* Schedule */}
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap", justifyContent: "center" }}>
          {[{ l: "Sexta · Connect Adoles", c: "#f59e0b" }, { l: "Sábado · Connect Jovens", c: "#ec4899" }, { l: "Domingo · Culto", c: "#3b82f6" }].map(x => (
            <div key={x.l} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#94a3b8" }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: x.c, display: "inline-block" }} />{x.l}
            </div>
          ))}
        </div>

        {!schedule.length && <div style={{ textAlign: "center", padding: 40, color: "#475569" }}>Nenhum evento neste mês</div>}

        {weeks.map((wk, wi) => {
          const first = wk[0].date, last = wk[wk.length - 1].date;
          return (
            <div key={wi} style={{ marginBottom: 22 }}>
              <h2 style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, paddingLeft: 4 }}>
                Semana {wi + 1} · {first} a {last}
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "110px 115px 1fr 1fr 1fr", gap: 1, padding: "0 4px", marginBottom: 4 }}>
                {["Data", "Evento", "Banda / GR", "🎓 Aprendiz", "🎛️ Técnico"].map(h => (
                  <div key={h} style={{ fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", padding: "4px 8px" }}>{h}</div>
                ))}
              </div>
              {wk.map((ev, ei) => {
                const th = TH[ev.day] || TH.Domingo;
                const isR = eCell?.id === ev.id;
                const Cell = ({ f, v, opts }) => {
                  if (isR && eCell.f === f) return (
                    <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
                      {opts ? (
                        <select value={eVal} onChange={e => setEVal(e.target.value)} style={{ ...iS, padding: "3px 6px", fontSize: 12 }} autoFocus>
                          <option value="" style={{ background: "#1e293b" }}>—</option>
                          {opts.map(o => <option key={o} value={o} style={{ background: "#1e293b" }}>{o}</option>)}
                        </select>
                      ) : (
                        <input value={eVal} onChange={e => setEVal(e.target.value)} onKeyDown={e => e.key === "Enter" && saveE()} style={{ ...iS, padding: "3px 6px", fontSize: 12 }} autoFocus />
                      )}
                      <button onClick={saveE} style={{ ...bS("#10b981"), padding: "2px 6px", fontSize: 11 }}>✓</button>
                      <button onClick={cancelE} style={{ ...bS("#64748b"), padding: "2px 6px", fontSize: 11 }}>✕</button>
                    </div>
                  );
                  return (
                    <div onClick={() => startE(ev.id, f, v)}
                      style={{ fontSize: 13, color: v ? "#e2e8f0" : "#3e4a5c", cursor: "pointer", padding: "2px 4px", borderRadius: 4 }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      title="Clique para editar"
                    >{v || "—"}</div>
                  );
                };
                return (
                  <div key={ei} style={{
                    display: "grid", gridTemplateColumns: "110px 115px 1fr 1fr 1fr", gap: 1,
                    background: "rgba(255,255,255,0.02)", borderLeft: `3px solid ${th.accent}`,
                    borderRadius: 8, padding: "10px 4px", marginBottom: 4,
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = th.bg}
                    onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                  >
                    <div style={{ padding: "0 8px" }}>
                      <span style={{ display: "inline-block", background: th.tagBg, color: th.tagC, fontSize: 9, fontWeight: 800, padding: "1px 7px", borderRadius: 10, textTransform: "uppercase", marginBottom: 2 }}>{ev.day}</span>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#f1f5f9" }}>{ev.date}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>{ev.period}</div>
                    </div>
                    <div style={{ padding: "0 8px", display: "flex", alignItems: "center" }}>
                      <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500, background: "rgba(255,255,255,0.04)", padding: "3px 8px", borderRadius: 6 }}>{ev.evento}</span>
                    </div>
                    <div style={{ padding: "0 8px", display: "flex", alignItems: "center" }}><Cell f="gr" v={ev.gr} /></div>
                    <div style={{ padding: "0 8px", display: "flex", alignItems: "center" }}><Cell f="aprendiz" v={ev.aprendiz} opts={aprs} /></div>
                    <div style={{ padding: "0 8px", display: "flex", alignItems: "center" }}><Cell f="tecnico" v={ev.tecnico} opts={tecs} /></div>
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Summary */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "18px 20px", marginTop: 8 }}>
          <h3 style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>📊 Resumo — {MN[month]} {year}</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {[...tecs.map(n => ({ name: n, type: "TÉC" })), ...aprs.map(n => ({ name: n, type: "APR" }))].map(({ name, type }) => {
              const cnt = countFor(name); const iT = type === "TÉC";
              return (
                <div key={name + type} style={{ background: iT ? "rgba(99,102,241,0.10)" : "rgba(16,185,129,0.10)", border: `1px solid ${iT ? "rgba(99,102,241,0.2)" : "rgba(16,185,129,0.2)"}`, borderRadius: 8, padding: "6px 12px", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 9, background: iT ? "#6366f1" : "#10b981", color: "#fff", padding: "1px 5px", borderRadius: 8, fontWeight: 800 }}>{type}</span>
                  <span>{name}</span>
                  <span style={{ background: "rgba(255,255,255,0.1)", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>{cnt}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <p style={{ textAlign: "center", color: "#3e4a5c", fontSize: 11, marginTop: 20 }}>
        Semana: Segunda a Domingo · ‹ › navegar meses · Clique para editar · 📷 exporta PNG
      </p>
    </div>
  );
}
