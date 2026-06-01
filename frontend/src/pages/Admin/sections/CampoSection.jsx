import { useState, useMemo } from "react";
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

export default function CampoSection({ events, criticalPoints = [], specialists, specialistStatuses = {}, onGoToEvent }) {
  const [filterTipo,       setFilterTipo]       = useState("");
  const [filterSeveridade, setFilterSeveridade] = useState("todos");
  const [filterView,       setFilterView]       = useState("ambos");
  const [flyTo,            setFlyTo]            = useState(null);

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
    return list;
  }, [events, filterTipo, filterSeveridade]);

  const disponiveis = aprovados.filter(s => getEffectiveStatus(s) === "disponivel").length;
  const aCaminho    = aprovados.filter(s => getEffectiveStatus(s) === "a_caminho").length;
  const noLocal     = aprovados.filter(s => getEffectiveStatus(s) === "no_local").length;

  const alertas = (filterView !== "criticos" ? eventosFiltrados : []).map(e => ({
    id: String(e.id),
    titulo: e.title,
    endereco: e.address || e.city || "",
    tipo: e.type,
    criticidade: e.severity === "critico" ? "critico" : e.severity === "alto" ? "grave" : "moderado",
    profissionaisNecessarios: e.neededProfiles || [],
    coordenadas: e.lat ? { lat: parseFloat(e.lat), lng: parseFloat(e.lng) } : null,
    criadoEm: e.date || new Date().toISOString(),
    status: e.status,
  }));

  const pontosNoMapa = filterView !== "eventos" ? criticalPoints : [];

  const selectStyle = {
    backgroundColor: "var(--bg-elevated)",
    border: "1px solid var(--border)",
    borderRadius: 6,
    color: "var(--text-primary)",
    fontSize: 12,
    padding: "6px 8px",
    width: "100%",
    cursor: "pointer",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

      {/* Summary bar */}
      <div style={{ padding: "12px 24px", backgroundColor: "var(--bg-elevated)", borderBottom: "1px solid var(--border)", display: "flex", gap: 24, flexWrap: "wrap" }}>
        {[
          { label: "Eventos no mapa",         value: filterView !== "criticos" ? eventosFiltrados.length : 0, icon: "🗂️" },
          { label: "Pontos críticos",         value: filterView !== "eventos"  ? criticalPoints.length : 0,   icon: "⚠️" },
          { label: "Especialistas aprovados", value: aprovados.length,                                        icon: "👥" },
          { label: "Disponíveis",             value: disponiveis,                                             icon: "✅" },
          { label: "A caminho",               value: aCaminho,                                                icon: "🚗" },
          { label: "No local",                value: noLocal,                                                 icon: "📍" },
        ].map(s => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>{s.icon}</span>
            <div>
              <span style={{ fontWeight: 700, fontSize: 18, color: "var(--text-primary)" }}>{s.value}</span>
              <span style={{ fontSize: 12, color: "var(--text-secondary)", marginLeft: 6 }}>{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Map + sidebar */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* Map */}
        <div style={{ flex: 1, padding: 16, display: "flex", overflow: "hidden" }}>
          <MapaCampo
            alertas={alertas}
            profissionais={[]}
            criticalPoints={pontosNoMapa}
            onVerMaisEvento={onGoToEvent}
            flyTo={flyTo}
          />
        </div>

        {/* Sidebar */}
        <div style={{ width: 300, borderLeft: "1px solid var(--border)", display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* View filter */}
          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 8 }}>
              Exibir no mapa
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {VIEW_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setFilterView(opt.id)}
                  style={{ flex: 1, padding: "6px 0", fontSize: 11, fontWeight: 600, border: `1px solid ${filterView === opt.id ? "var(--accent)" : "var(--border)"}`, borderRadius: 6, background: filterView === opt.id ? "rgba(255,107,26,0.12)" : "var(--bg-elevated)", color: filterView === opt.id ? "var(--accent)" : "var(--text-secondary)", cursor: "pointer", transition: "all 0.15s" }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Event filters (shown only when not in criticos-only view) */}
          {filterView !== "criticos" && (
            <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 8 }}>
                Filtrar Eventos
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    {eventosFiltrados.length} de {events.length} eventos
                  </span>
                  <button
                    onClick={() => { setFilterTipo(""); setFilterSeveridade("todos"); }}
                    style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 11, cursor: "pointer", padding: 0 }}
                  >
                    ✕ Limpar
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Events list */}
          {filterView !== "criticos" && (
            <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
              {eventosFiltrados.length === 0 ? (
                <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 13, padding: "30px 0" }}>
                  {events.length === 0 ? "Nenhum evento cadastrado" : "Nenhum evento para os filtros aplicados"}
                </div>
              ) : (
                eventosFiltrados.map(e => {
                  const sevColor = e.severity === "critico" ? "#FF4444" : e.severity === "alto" || e.severity === "grave" ? "#FF6B00" : "#F5A623";
                  return (
                    <div
                      key={e.id}
                      onClick={() => {
                        if (e.lat && e.lng) setFlyTo({ lat: parseFloat(e.lat), lng: parseFloat(e.lng), _t: Date.now() });
                      }}
                      style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border)", borderLeft: `3px solid ${sevColor}`, borderRadius: 10, padding: "10px 12px", cursor: e.lat ? "pointer" : "default" }}
                    >
                      <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)", marginBottom: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {e.title}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 5 }}>
                        {TIPO_LABEL[e.type] ?? e.type}
                      </div>
                      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: sevColor, backgroundColor: `${sevColor}18`, borderRadius: 99, padding: "2px 8px" }}>
                          {e.severity === "critico" ? "Crítico" : e.severity === "alto" || e.severity === "grave" ? "Alto" : "Moderado"}
                        </span>
                        {(e.address || e.city) && (
                          <span style={{ fontSize: 10, color: "var(--text-muted)" }}>📍 {e.address || e.city}</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Critical points list */}
          {filterView !== "eventos" && (
            <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
              {criticalPoints.length === 0 ? (
                <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 13, padding: "30px 0" }}>
                  Nenhum ponto crítico cadastrado.
                </div>
              ) : (
                criticalPoints.map(pt => {
                  const rColors = { critico: "#FF4444", alto: "#FF6B00", medio: "#F5A623" };
                  const rColor = rColors[pt.risco] || rColors.medio;
                  return (
                    <div
                      key={pt.id}
                      onClick={() => {
                        if (pt.lat && pt.lng) setFlyTo({ lat: parseFloat(pt.lat), lng: parseFloat(pt.lng), _t: Date.now() });
                      }}
                      style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border)", borderLeft: `3px solid ${rColor}`, borderRadius: 10, padding: "10px 12px", cursor: pt.lat ? "pointer" : "default" }}
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
                })
              )}
            </div>
          )}

          {/* Legend */}
          <div style={{ padding: "12px 14px", borderTop: "1px solid var(--border)" }}>
            <div style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Legenda</div>
            {[
              { color: "#FF4444", label: "Evento Crítico",   shape: "circle" },
              { color: "#FF6B00", label: "Evento Grave",     shape: "circle" },
              { color: "#F5A623", label: "Evento Moderado",  shape: "circle" },
              { color: "#ef4444", label: "Ponto Crítico",    shape: "diamond" },
              { color: "#16a34a", label: "Especialista disp.", shape: "circle" },
            ].map(i => (
              <div key={i.label} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                {i.shape === "diamond"
                  ? <div style={{ width: 8, height: 8, transform: "rotate(45deg)", background: i.color, flexShrink: 0 }} />
                  : <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: i.color, flexShrink: 0 }} />
                }
                <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{i.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
