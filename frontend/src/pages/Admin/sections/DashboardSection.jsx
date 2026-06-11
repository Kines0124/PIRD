import { useMemo, useRef, useLayoutEffect } from "react";
import { gsap } from "gsap";
import { AiOutlineAlert } from "react-icons/ai";
import { IoWarningOutline }    from "react-icons/io5";
import { FaCircle } from "react-icons/fa";

const TIPO_COLOR = {
  enchente:          "#0EA5E9",
  deslizamento:      "#7C3AED",
  alagamento:        "#0369A1",
  incendio:          "#DC2626",
  desabamento:       "#64748B",
  acidente_transito: "#F97316",
  intoxicacao:       "#059669",
  outro:             "#F43F5E",
};

const SEVERITY_COLOR = {
  critico: "#dc2626",
  alto:    "#ea580c",
  medio:   "#ca8a04",
  baixo:   "#16a34a",
};

function timeAgo(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `${m}min atrás`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h atrás`;
  return `${Math.floor(h / 24)}d atrás`;
}

export default function DashboardSection({
  events = [],
  criticalPoints = [],
  collectionPoints = [],
  specialists = [],
  volunteers = [],
}) {
  // ── Refs por grupo de elementos ──────────────────────────────────────────
  const statCardsRef  = useRef([]);
  const statValsRef   = useRef([]);
  const panelsRef     = useRef([]);
  const eventItemsRef = useRef([]);
  const sevCardsRef   = useRef([]);
  const sevValsRef    = useRef([]);
  const donutSegsRef  = useRef([]);
  const donutTotalRef = useRef(null);

  const setRef = (arr) => (i) => (el) => { arr.current[i] = el; };

  // ── Dados derivados ──────────────────────────────────────────────────────
  const ativos = useMemo(() => events.filter(e => e.status === "ativo"), [events]);
  const criticos = ativos.filter(e => e.severity === "critico").length;

  const stats = [
    { label: "Eventos Ativos",   value: ativos.length,         icon: <AiOutlineAlert style={{color: "red", fontSize: 23}}/>, color: "#dc2626", bg: "rgba(220,38,38,0.08)",  isCritical: true  },
    { label: "Eventos Críticos", value: criticos,              icon: <FaCircle style={{color:"red"}}/>, color: "#dc2626", bg: "rgba(220,38,38,0.08)",  isCritical: true  },
    { label: "Pontos Críticos",  value: criticalPoints.length, icon: <IoWarningOutline style={{color: "yellow", fontSize:22}}/>, color: "#ea580c", bg: "rgba(234,88,12,0.08)",  isCritical: false },
  ];

  const countByTipo = useMemo(() => {
    const map = {};
    ativos.forEach(e => { map[e.type] = (map[e.type] || 0) + 1; });
    return Object.entries(map).map(([tipo, count]) => ({ tipo, count }));
  }, [ativos]);

  const recentes = useMemo(() =>
    [...ativos].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).slice(0, 5),
  [ativos]);

  const donutSegments = useMemo(() => {
    const total = countByTipo.reduce((s, x) => s + x.count, 0);
    if (total === 0) return [];
    const R    = 74;
    const circ = 2 * Math.PI * R;
    let acc    = 0;
    return countByTipo.map(({ tipo, count }) => {
      const len = (count / total) * circ - 2;
      const off = acc;
      acc += len + 2;
      return { tipo, count, len, off, color: TIPO_COLOR[tipo] ?? "#9ca3af", circ };
    });
  }, [countByTipo]);

  const total = donutSegments.reduce((s, x) => s + x.count, 0);

  // ── Animações simultâneas ────────────────────────────────────────────────
  useLayoutEffect(() => {
    const statCards  = statCardsRef.current.filter(Boolean);
    const statVals   = statValsRef.current.filter(Boolean);
    const panels     = panelsRef.current.filter(Boolean);
    const eventItems = eventItemsRef.current.filter(Boolean);
    const sevCards   = sevCardsRef.current.filter(Boolean);
    const sevVals    = sevValsRef.current.filter(Boolean);
    const donutSegs  = donutSegsRef.current.filter(Boolean);

    // Estado inicial — evita flicker
    gsap.set(statCards,  { opacity: 0, y: 18 });
    gsap.set(panels,     { opacity: 0, y: 18 });
    gsap.set(eventItems, { opacity: 0, x: 24 });
    gsap.set(sevCards,   { opacity: 0, scaleY: 0, transformOrigin: "bottom" });

    const ease = "power3.out";

    // Todos os grupos disparam ao mesmo tempo
    gsap.to(statCards,  { opacity: 1, y: 0,      duration: 0.4, stagger: 0.07, ease });
    gsap.to(panels,     { opacity: 1, y: 0,      duration: 0.4, stagger: 0.08, ease, delay: 0.05 });
    gsap.to(eventItems, { opacity: 1, x: 0,      duration: 0.35, stagger: 0.06, ease, delay: 0.08 });
    gsap.to(sevCards,   { opacity: 1, scaleY: 1, duration: 0.4, stagger: 0.07, ease: "back.out(1.5)", delay: 0.05 });

    // Contadores dos stat cards
    statVals.forEach(el => {
      const end = parseInt(el.dataset.target, 10);
      if (isNaN(end) || end === 0) return;
      const obj = { val: 0 };
      el.textContent = "0";
      gsap.to(obj, {
        val: end, duration: 0.8, ease: "power2.out",
        onUpdate()  { el.textContent = Math.round(this.targets()[0].val); },
        onComplete(){ el.textContent = end; },
      });
    });

    // Contadores de severidade
    sevVals.forEach(el => {
      const end = parseInt(el.dataset.target, 10);
      if (isNaN(end) || end === 0) return;
      const obj = { val: 0 };
      el.textContent = "0";
      gsap.to(obj, {
        val: end, duration: 0.7, ease: "power2.out", delay: 0.08,
        onUpdate()  { el.textContent = Math.round(this.targets()[0].val); },
        onComplete(){ el.textContent = end; },
      });
    });

    // Segmentos do donut — todos crescem juntos
    const R    = 74;
    const circ = 2 * Math.PI * R;
    donutSegs.forEach(seg => {
      const finalDashArray = seg.getAttribute("stroke-dasharray");
      gsap.set(seg, { attr: { strokeDasharray: `0 ${circ}` } });
      gsap.to(seg, {
        attr: { strokeDasharray: finalDashArray },
        duration: 0.6, ease: "power2.out", delay: 0.1,
      });
    });

    // Contador central do donut
    const donutEl = donutTotalRef.current;
    if (donutEl) {
      const end = parseInt(donutEl.dataset.target, 10);
      if (!isNaN(end) && end > 0) {
        const obj = { val: 0 };
        donutEl.textContent = "0";
        gsap.to(obj, {
          val: end, duration: 0.7, ease: "power2.out", delay: 0.1,
          onUpdate()  { donutEl.textContent = Math.round(this.targets()[0].val); },
          onComplete(){ donutEl.textContent = end; },
        });
      }
    }

    return () => {
      gsap.killTweensOf([...statCards, ...panels, ...eventItems, ...sevCards, ...donutSegs]);
    };
  }, [ativos.length, countByTipo]);

  // Pulse infinito nos ícones críticos (independente, não interfere nas entradas)
  useLayoutEffect(() => {
    const icons = document.querySelectorAll(".stat-icon--critical");
    if (!icons.length) return;
    gsap.to(icons, { scale: 1.15, repeat: -1, yoyo: true, duration: 0.9, ease: "sine.inOut", delay: 1.2 });
    return () => gsap.killTweensOf(icons);
  }, []);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: 24, overflowY: "auto", height: "100%" }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>Dashboard</div>
        <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>Visão geral do sistema</div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 24 }}>
        {stats.map((s, i) => (
          <div
            key={s.label}
            ref={setRef(statCardsRef)(i)}
            className="stat-card"
            style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 10, padding: "16px 18px" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                className={s.isCritical ? "stat-icon stat-icon--critical" : "stat-icon"}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}
              >
                {s.icon}
              </div>
              <div>
                <div
                  ref={setRef(statValsRef)(i)}
                  className="stat-value"
                  data-target={s.value}
                  style={{ fontSize: 26, fontWeight: 800, color: s.color, lineHeight: 1 }}
                >
                  {s.value}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>{s.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Donut + Eventos Recentes */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* Donut */}
        <div
          ref={setRef(panelsRef)(0)}
          className="dashboard-panel"
          style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 10, padding: 20 }}
        >
          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", marginBottom: 16 }}>Eventos por Tipo</div>
          {donutSegments.length === 0 ? (
            <div style={{ color: "var(--text-secondary)", fontSize: 13, textAlign: "center", padding: "20px 0" }}>Nenhum evento ativo</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
              <div style={{ position: "relative", width: 200, height: 200 }}>
                <svg viewBox="0 0 200 200" width="200" height="200" style={{ transform: "rotate(-90deg)", display: "block" }}>
                  <circle cx="100" cy="100" r="74" fill="none" stroke="var(--bg-hover)" strokeWidth="28" />
                  {donutSegments.map((seg, i) => (
                    <circle
                      key={seg.tipo}
                      ref={setRef(donutSegsRef)(i)}
                      className="donut-seg"
                      cx="100" cy="100" r="74"
                      fill="none"
                      stroke={seg.color}
                      strokeWidth="28"
                      strokeDasharray={`${seg.len} ${seg.circ}`}
                      strokeDashoffset={-seg.off}
                      strokeLinecap="butt"
                    />
                  ))}
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                  <span
                    ref={donutTotalRef}
                    className="donut-total"
                    data-target={total}
                    style={{ fontSize: 36, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 }}
                  >
                    {total}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 3 }}>eventos</span>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px", width: "100%" }}>
                {donutSegments.map(seg => (
                  <div key={seg.tipo} style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, flexShrink: 0, backgroundColor: seg.color }} />
                    <span style={{ fontSize: 11, color: "var(--text-secondary)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{seg.tipo}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-primary)", flexShrink: 0 }}>{seg.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Eventos Recentes */}
        <div
          ref={setRef(panelsRef)(1)}
          className="dashboard-panel"
          style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 10, padding: 20 }}
        >
          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", marginBottom: 16 }}>Eventos Recentes</div>
          {recentes.length === 0 ? (
            <div style={{ color: "var(--text-secondary)", fontSize: 13, textAlign: "center", padding: "20px 0" }}>Nenhum evento</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {recentes.map((e, i) => (
                <div
                  key={e.id}
                  ref={setRef(eventItemsRef)(i)}
                  className="event-item"
                  style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 12px", backgroundColor: "var(--bg-hover)", borderRadius: 8, borderLeft: `3px solid ${SEVERITY_COLOR[e.severity] || "#666"}`, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.title}</div>
                    <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>{e.type}</div>
                  </div>
                  <span style={{ fontSize: 11, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{timeAgo(e.date)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Distribuição por Severidade */}
      <div style={{ marginTop: 16, backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 10, padding: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", marginBottom: 16 }}>Distribuição por Severidade</div>
        <div style={{ display: "flex", gap: 16 }}>
          {[
            ["critico", "🔴 Crítico"],
            ["alto",    "🟠 Alto"],
            ["medio",   "🟡 Médio"],
            ["baixo",   "🟢 Baixo"],
          ].map(([s, lbl], i) => {
            const count = ativos.filter(e => e.severity === s).length;
            return (
              <div
                key={s}
                ref={setRef(sevCardsRef)(i)}
                className="sev-card"
                style={{ flex: 1, textAlign: "center", padding: 16, backgroundColor: "var(--bg-hover)", borderRadius: 10, borderTop: `3px solid ${SEVERITY_COLOR[s]}` }}
              >
                <div
                  ref={setRef(sevValsRef)(i)}
                  className="sev-value"
                  data-target={count}
                  style={{ fontSize: 28, fontWeight: 800, color: SEVERITY_COLOR[s] }}
                >
                  {count}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>{lbl}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}