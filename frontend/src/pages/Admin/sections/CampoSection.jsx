import { useState, useMemo, useEffect, useRef } from "react";
import { gsap } from "gsap";
import MapaCampo from "../components/MapaCampo";

const TIPO_LABEL = {
  enchente: "Enchente", deslizamento: "Deslizamento", alagamento: "Alagamento",
  incendio: "Incêndio", desabamento: "Desabamento",
  intoxicacao: "Intoxicação", outro: "Outro",
};

const VIEW_OPTIONS = [
  { id: "ambos",    label: "Ambos" },
  { id: "eventos",  label: "Eventos" },
  { id: "criticos", label: "Pontos Críticos" },
];

// Ordem numérica de severidade para ordenação
const SEV_ORDER = { critico: 0, alto: 1, grave: 1, moderado: 2 };
function sevRank(e) {
  if (e.severity === "critico") return 0;
  if (e.severity === "alto" || e.severity === "grave") return 1;
  return 2;
}

// ── Stat item animado ───────────────────────────────────────────────────────
function StatItem({ item, animIndex }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    gsap.fromTo(ref.current,
      { y: 10, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.32, ease: "power2.out", delay: animIndex * 0.06 }
    );
  }, []);

  return (
    <div ref={ref} style={{ display: "flex", alignItems: "center", gap: 8, opacity: 0 }}>
      <span style={{ fontSize: 18 }}>{item.icon}</span>
      <div>
        <span style={{ fontWeight: 700, fontSize: 18, color: "var(--text-primary)" }}>{item.value}</span>
        <span style={{ fontSize: 12, color: "var(--text-secondary)", marginLeft: 6 }}>{item.label}</span>
      </div>
    </div>
  );
}

// ── Evento card animado ─────────────────────────────────────────────────────
function EventoCard({ evento, animIndex, onClick }) {
  const ref = useRef(null);
  const sevColor = evento.severity === "critico"
    ? "#FF4444"
    : evento.severity === "alto" || evento.severity === "grave"
    ? "#FF6B00"
    : "#F5A623";

  useEffect(() => {
    if (!ref.current) return;
    gsap.fromTo(ref.current,
      { x: 20, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.36, ease: "power3.out", delay: Math.min(animIndex * 0.055, 0.35) }
    );
  }, []);

  function handleMouseEnter() {
    gsap.to(ref.current, { x: 2, duration: 0.18, ease: "power2.out", overwrite: "auto" });
  }
  function handleMouseLeave() {
    gsap.to(ref.current, { x: 0, duration: 0.22, ease: "power2.inOut", overwrite: "auto" });
  }

  return (
    <div
      ref={ref}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border)",
        borderLeft: `3px solid ${sevColor}`, borderRadius: 10, padding: "10px 12px",
        cursor: evento.lat ? "pointer" : "default",
        opacity: 0, willChange: "transform, opacity",
        flexShrink: 0,
      }}
    >
      <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)", marginBottom: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {evento.title}
      </div>
      <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 5 }}>
        {TIPO_LABEL[evento.type] ?? evento.type}
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: sevColor, backgroundColor: `${sevColor}18`, borderRadius: 99, padding: "2px 8px" }}>
          {evento.severity === "critico" ? "Crítico" : evento.severity === "alto" || evento.severity === "grave" ? "Alto" : "Moderado"}
        </span>
        {(evento.address || evento.city) && (
          <span style={{ fontSize: 10, color: "var(--text-muted)" }}>📍 {evento.address || evento.city}</span>
        )}
      </div>
    </div>
  );
}

// ── Ponto crítico card animado ──────────────────────────────────────────────
function PontoCard({ pt, animIndex, onClick }) {
  const ref = useRef(null);
  const rColors = { critico: "#FF4444", alto: "#FF6B00", medio: "#F5A623" };
  const rColor = rColors[pt.risco] || rColors.medio;

  useEffect(() => {
    if (!ref.current) return;
    gsap.fromTo(ref.current,
      { x: 20, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.36, ease: "power3.out", delay: Math.min(animIndex * 0.055, 0.35) }
    );
  }, []);

  function handleMouseEnter() {
    gsap.to(ref.current, { x: 2, duration: 0.18, ease: "power2.out", overwrite: "auto" });
  }
  function handleMouseLeave() {
    gsap.to(ref.current, { x: 0, duration: 0.22, ease: "power2.inOut", overwrite: "auto" });
  }

  return (
    <div
      ref={ref}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border)",
        borderLeft: `3px solid ${rColor}`, borderRadius: 10, padding: "10px 12px",
        cursor: pt.lat ? "pointer" : "default",
        opacity: 0, willChange: "transform, opacity",
        flexShrink: 0,
      }}
    >
      <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)", marginBottom: 3 }}>
        {pt.name || pt.nome}
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: rColor, backgroundColor: `${rColor}18`, borderRadius: 99, padding: "2px 8px" }}>
          {pt.risco?.charAt(0).toUpperCase() + pt.risco?.slice(1)}
        </span>
        <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{pt.type || pt.tipo}</span>
      </div>
    </div>
  );
}

// ── Main section ────────────────────────────────────────────────────────────
export default function CampoSection({ events, criticalPoints = [], specialists, specialistStatuses = {}, onGoToEvent }) {
  const [filterTipo,       setFilterTipo]       = useState("");
  const [filterSeveridade, setFilterSeveridade] = useState("todos");
  const [filterView,       setFilterView]       = useState("ambos");
  const [flyTo,            setFlyTo]            = useState(null);

  const summaryRef  = useRef(null);
  const sidebarRef  = useRef(null);
  const mapRef      = useRef(null);
  const prevView    = useRef(filterView);
  const evListRef   = useRef(null);
  const ptListRef   = useRef(null);

  const aprovados = specialists.filter(s => !s.deletado);

  function getEffectiveStatus(spec) {
    const id = spec.especialistaId ?? spec.id;
    return specialistStatuses[String(id)] || spec.statusCampo || "disponivel";
  }

  const tipos = useMemo(
    () => [...new Set(events.map(e => e.type).filter(Boolean))].sort(),
    [events]
  );

  const eventosFiltrados = useMemo(() => {
    let list = events;
    if (filterTipo) list = list.filter(e => e.type === filterTipo);
    if (filterSeveridade !== "todos") {
      list = list.filter(e => {
        if (filterSeveridade === "critico")  return e.severity === "critico";
        if (filterSeveridade === "alto")     return e.severity === "alto" || e.severity === "grave";
        if (filterSeveridade === "moderado") return !["critico", "alto", "grave"].includes(e.severity);
        return true;
      });
    }
    // Ordenar por severidade: crítico → alto/grave → moderado
    return [...list].sort((a, b) => sevRank(a) - sevRank(b));
  }, [events, filterTipo, filterSeveridade]);

  const disponiveis = aprovados.filter(s => getEffectiveStatus(s) === "disponivel").length;
  const aCaminho    = aprovados.filter(s => getEffectiveStatus(s) === "a_caminho").length;
  const noLocal     = aprovados.filter(s => getEffectiveStatus(s) === "no_local").length;

  // FIX: "ambos" mostra TANTO eventos QUANTO pontos críticos
  const showEventos  = filterView === "ambos" || filterView === "eventos";
  const showCriticos = filterView === "ambos" || filterView === "criticos";

  const alertas = showEventos
    ? eventosFiltrados.map(e => ({
        id: String(e.id),
        titulo: e.title,
        endereco: e.address || e.city || "",
        tipo: e.type,
        criticidade: e.severity === "critico" ? "critico" : e.severity === "alto" ? "grave" : "moderado",
        profissionaisNecessarios: e.neededProfiles || [],
        coordenadas: e.lat ? { lat: parseFloat(e.lat), lng: parseFloat(e.lng) } : null,
        criadoEm: e.date || new Date().toISOString(),
        status: e.status,
      }))
    : [];

  const pontosNoMapa = showCriticos ? criticalPoints : [];

  // Entrada da seção
  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
    tl.fromTo(summaryRef.current, { y: -10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3 });
    tl.fromTo(mapRef.current,     { opacity: 0 },         { opacity: 1, duration: 0.4 }, "-=0.1");
    tl.fromTo(sidebarRef.current, { x: 18, opacity: 0 },  { x: 0, opacity: 1, duration: 0.35 }, "-=0.25");
  }, []);

  // Transição ao trocar de view
  useEffect(() => {
    if (prevView.current === filterView) return;
    prevView.current = filterView;
    [evListRef.current, ptListRef.current].forEach(el => {
      if (el) gsap.fromTo(el, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.22, ease: "power2.out" });
    });
  }, [filterView]);

  const selectStyle = {
    backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border)",
    borderRadius: 6, color: "var(--text-primary)", fontSize: 12,
    padding: "6px 8px", width: "100%", cursor: "pointer",
  };

  const stats = [
    { label: "Eventos no mapa",         value: showEventos  ? eventosFiltrados.length : 0, icon: "🗂️" },
    { label: "Pontos críticos",         value: showCriticos ? criticalPoints.length : 0,   icon: "⚠️" },
    { label: "Especialistas aprovados", value: aprovados.length,                            icon: "👥" },
    { label: "Disponíveis",             value: disponiveis,                                 icon: "✅" },
    { label: "A caminho",               value: aCaminho,                                    icon: "🚗" },
    { label: "No local",                value: noLocal,                                     icon: "📍" },
  ];

  // Altura dos cards nas listas (aprox 4 cards + scrollbar)
  const LIST_HEIGHT = 260; // px — cabe ~4 cards de ~58px + gap

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

      {/* Summary bar */}
      <div ref={summaryRef} style={{ padding: "12px 24px", backgroundColor: "var(--bg-elevated)", borderBottom: "1px solid var(--border)", display: "flex", gap: 24, flexWrap: "wrap", opacity: 0 }}>
        {stats.map((s, i) => <StatItem key={s.label} item={s} animIndex={i} />)}
      </div>

      {/* Map + sidebar */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>

        {/* Map — ocupa todo o espaço restante */}
        <div ref={mapRef} style={{ flex: 1, padding: 16, display: "flex", overflow: "hidden", opacity: 0 }}>
          <MapaCampo
            alertas={alertas}
            profissionais={[]}
            criticalPoints={pontosNoMapa}
            onVerMaisEvento={onGoToEvent}
            flyTo={flyTo}
          />
        </div>

        {/* Sidebar */}
        <div ref={sidebarRef} style={{ width: 290, borderLeft: "1px solid var(--border)", display: "flex", flexDirection: "column", overflow: "hidden", opacity: 0 }}>

          {/* View toggle */}
          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 8 }}>Exibir no mapa</div>
            <div style={{ display: "flex", gap: 4 }}>
              {VIEW_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setFilterView(opt.id)}
                  style={{
                    flex: 1, padding: "6px 0", fontSize: 11, fontWeight: 600,
                    border: `1px solid ${filterView === opt.id ? "var(--accent)" : "var(--border)"}`,
                    borderRadius: 6,
                    background: filterView === opt.id ? "rgba(255,107,26,0.12)" : "var(--bg-elevated)",
                    color: filterView === opt.id ? "var(--accent)" : "var(--text-secondary)",
                    cursor: "pointer", transition: "all 0.15s",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Conteúdo rolável da sidebar */}
          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>

            {/* ── Eventos ── */}
            {showEventos && (
              <div style={{ borderBottom: showCriticos ? "1px solid var(--border)" : "none" }}>
                {/* Filtros */}
                <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ fontWeight: 700, fontSize: 12, color: "var(--text-primary)", marginBottom: 8 }}>Filtrar Eventos</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)} style={selectStyle}>
                      <option value="">Todos os tipos</option>
                      {tipos.map(t => <option key={t} value={t}>{TIPO_LABEL[t] ?? t}</option>)}
                    </select>
                    <select value={filterSeveridade} onChange={e => setFilterSeveridade(e.target.value)} style={selectStyle}>
                      <option value="todos">Toda severidade</option>
                      <option value="critico">Crítico</option>
                      <option value="alto">Alto / Grave</option>
                      <option value="moderado">Moderado</option>
                    </select>
                  </div>
                  {(filterTipo || filterSeveridade !== "todos") && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{eventosFiltrados.length} de {events.length}</span>
                      <button onClick={() => { setFilterTipo(""); setFilterSeveridade("todos"); }}
                        style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 11, cursor: "pointer", padding: 0 }}>
                        ✕ Limpar
                      </button>
                    </div>
                  )}
                </div>

                {/* Lista de eventos — altura fixa ~4 cards + scroll */}
                <div
                  ref={evListRef}
                  style={{ height: LIST_HEIGHT, overflowY: "auto", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}
                >
                  {eventosFiltrados.length === 0 ? (
                    <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 13, padding: "30px 0" }}>
                      {events.length === 0 ? "Nenhum evento cadastrado" : "Nenhum evento para os filtros"}
                    </div>
                  ) : (
                    eventosFiltrados.map((e, i) => (
                      <EventoCard
                        key={e.id}
                        evento={e}
                        animIndex={i}
                        onClick={() => {
                          if (e.lat && e.lng) setFlyTo({ lat: parseFloat(e.lat), lng: parseFloat(e.lng), _t: Date.now() });
                        }}
                      />
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ── Pontos Críticos ── */}
            {showCriticos && (
              <div>
                <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ fontWeight: 700, fontSize: 12, color: "var(--text-primary)" }}>Pontos Críticos</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{criticalPoints.length} cadastrado{criticalPoints.length !== 1 ? "s" : ""}</div>
                </div>

                {/* Lista de pontos — altura fixa ~4 cards + scroll */}
                <div
                  ref={ptListRef}
                  style={{ height: LIST_HEIGHT, overflowY: "auto", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}
                >
                  {criticalPoints.length === 0 ? (
                    <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 13, padding: "30px 0" }}>
                      Nenhum ponto crítico cadastrado.
                    </div>
                  ) : (
                    criticalPoints.map((pt, i) => (
                      <PontoCard
                        key={pt.id}
                        pt={pt}
                        animIndex={i}
                        onClick={() => {
                          if (pt.lat && pt.lng) setFlyTo({ lat: parseFloat(pt.lat), lng: parseFloat(pt.lng), _t: Date.now() });
                        }}
                      />
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}