import { useState, useMemo } from "react";

const PROF_COLORS = {
  "Médico Clínico Geral":      "#2563eb",
  "Médico Emergencista":       "#2563eb",
  "Médico Cardiologista":      "#2563eb",
  "Médico Neurologista":       "#2563eb",
  "Médico Ortopedista":        "#2563eb",
  "Médico Intensivista (UTI)": "#2563eb",
  "Enfermeiro(a)":             "#16a34a",
  "Técnico de Enfermagem":     "#16a34a",
  "Bombeiro Civil":            "#dc2626",
  "Bombeiro Militar":          "#dc2626",
  "Paramédico / SAMU":         "#7c3aed",
  "Psicólogo":                 "#0891b2",
  "Assistente Social":         "#0891b2",
  "Engenheiro de Segurança":   "#d97706",
  "Engenheiro Civil":          "#d97706",
  "Técnico em Resgate":        "#71717a",
  "Socorrista":                "#71717a",
  "Defesa Civil":              "#FF6B1A",
};

const STATUS_MAP = {
  disponivel: { label: "Disponível", color: "#16a34a", bg: "rgba(22,163,74,0.12)" },
  a_caminho:  { label: "A caminho",  color: "#ca8a04", bg: "rgba(202,138,4,0.12)" },
  no_local:   { label: "No local",   color: "#dc2626", bg: "rgba(220,38,38,0.12)" },
};

const TABS = [
  { id: "disponivel", label: "Especialistas" },
  { id: "a_caminho",  label: "A caminho" },
  { id: "no_local",   label: "No local" },
];

function fmt(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function DetailDrawer({ spec, effectiveStatus, onClose, onUpdateStatus }) {
  const color     = PROF_COLORS[spec.profissao] || "#71717a";
  const statusInfo = STATUS_MAP[effectiveStatus] || STATUS_MAP.disponivel;

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex" }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ flex: 1, background: "rgba(0,0,0,0.5)" }} onClick={onClose} />

      <div style={{ width: 420, background: "var(--bg-surface)", borderLeft: "1px solid var(--border)", display: "flex", flexDirection: "column", animation: "slideInRight 0.2s" }}>

        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", backgroundColor: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
            {spec.nome.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: "var(--text-primary)", marginBottom: 3 }}>{spec.nome}</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{spec.profissao}</div>
          </div>
          <button
            onClick={onClose}
            style={{ width: 28, height: 28, borderRadius: "50%", border: "1px solid var(--border)", background: "none", cursor: "pointer", color: "var(--text-secondary)", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
          >✕</button>
        </div>

        {/* Status badges */}
        <div style={{ padding: "12px 24px", borderBottom: "1px solid var(--border)", backgroundColor: "var(--bg-elevated)", display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ backgroundColor: "rgba(22,163,74,0.12)", color: "#16a34a", borderRadius: 99, fontSize: 12, fontWeight: 600, padding: "4px 12px" }}>
            ✓ Especialista Aprovado
          </span>
          <span style={{ backgroundColor: statusInfo.bg, color: statusInfo.color, borderRadius: 99, fontSize: 12, fontWeight: 600, padding: "4px 12px" }}>
            {statusInfo.label}
          </span>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 18 }}>

          {/* Dados pessoais */}
          <div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, marginBottom: 10, fontFamily: "var(--font-mono)" }}>
              Dados Pessoais
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "Nome completo", value: spec.nome },
                { label: "CPF",          value: spec.cpf },
                { label: "Telefone",     value: spec.telefone },
                { label: "Estado (UF)",  value: spec.uf || "—" },
              ].map(r => (
                <div key={r.label} style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 8, alignItems: "start" }}>
                  <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", paddingTop: 1 }}>{r.label}</span>
                  <span style={{ fontSize: 13, color: "var(--text-primary)", fontFamily: r.label === "CPF" ? "var(--font-mono)" : "inherit" }}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ height: 1, background: "var(--border)" }} />

          {/* Dados profissionais */}
          <div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, marginBottom: 10, fontFamily: "var(--font-mono)" }}>
              Dados Profissionais
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "Profissão",   value: spec.profissao },
                { label: "Nº Registro", value: spec.numeroRegistro || spec.numero_registro },
              ].map(r => (
                <div key={r.label} style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 8, alignItems: "start" }}>
                  <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", paddingTop: 1 }}>{r.label}</span>
                  <span style={{ fontSize: 13, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>{r.value || "—"}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ height: 1, background: "var(--border)" }} />

          {/* Histórico */}
          <div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, marginBottom: 10, fontFamily: "var(--font-mono)" }}>
              Histórico de Revisão
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "Cadastrado em", value: fmt(spec.criadoEm   || spec.criado_em) },
                { label: "Aprovado em",   value: fmt(spec.revisadoEm || spec.revisado_em) },
              ].map(r => (
                <div key={r.label} style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 8, alignItems: "start" }}>
                  <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", paddingTop: 1 }}>{r.label}</span>
                  <span style={{ fontSize: 13, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>{r.value}</span>
                </div>
              ))}
            </div>
            {spec.observacao && (
              <div style={{ marginTop: 10, background: "var(--bg-elevated)", borderRadius: 8, padding: "10px 12px", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, marginBottom: 4 }}>OBSERVAÇÃO</div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{spec.observacao}</div>
              </div>
            )}
          </div>
        </div>

        {/* Cheguei button (provisório) */}
        {effectiveStatus !== "no_local" && (
          <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)" }}>
            <button
              onClick={() => onUpdateStatus && onUpdateStatus(spec.id, "no_local")}
              style={{ width: "100%", background: "#dc2626", color: "#fff", border: "none", borderRadius: 8, padding: "10px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
            >
              📍 Cheguei — Marcar como "No local"
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function EspecialistaCard({ spec, effectiveStatus, onClick }) {
  const color    = PROF_COLORS[spec.profissao] || "#71717a";
  const statusInfo = STATUS_MAP[effectiveStatus] || STATUS_MAP.disponivel;

  return (
    <div
      onClick={onClick}
      style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "16px", cursor: "pointer", transition: "all 0.15s", display: "flex", gap: 14, alignItems: "flex-start" }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; e.currentTarget.style.background = "var(--bg-elevated)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--bg-surface)"; }}
    >
      <div style={{ width: 44, height: 44, borderRadius: "50%", backgroundColor: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
        {spec.nome.charAt(0).toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)", marginBottom: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {spec.nome}
        </div>
        <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 8 }}>{spec.profissao}</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 10, backgroundColor: statusInfo.bg, color: statusInfo.color, borderRadius: 99, padding: "1px 8px", fontWeight: 600 }}>
            {statusInfo.label}
          </span>
          {spec.uf && (
            <span style={{ fontSize: 10, color: "var(--text-muted)", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 6, padding: "1px 6px", fontFamily: "var(--font-mono)" }}>
              {spec.uf}
            </span>
          )}
          <span style={{ fontSize: 10, color: "var(--text-muted)", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 6, padding: "1px 6px", fontFamily: "var(--font-mono)" }}>
            {spec.numeroRegistro || spec.numero_registro || "—"}
          </span>
        </div>
      </div>
      <div style={{ fontSize: 14, color: "var(--text-muted)", flexShrink: 0 }}>›</div>
    </div>
  );
}

export default function EspecialistasSection({ specialists, specialistStatuses = {}, onUpdateStatus }) {
  const [selected,   setSelected]   = useState(null);
  const [search,     setSearch]     = useState("");
  const [filterProf, setFilterProf] = useState("");
  const [activeTab,  setActiveTab]  = useState("disponivel");

  const aprovados = specialists.filter(s => s.status === "aprovado");

  function getEffectiveStatus(spec) {
    return specialistStatuses[String(spec.id)] || spec.statusCampo || "disponivel";
  }

  const profissoes = useMemo(
    () => [...new Set(aprovados.map(s => s.profissao))].sort(),
    [aprovados]
  );

  const tabCounts = useMemo(() => ({
    disponivel: aprovados.filter(s => getEffectiveStatus(s) === "disponivel").length,
    a_caminho:  aprovados.filter(s => getEffectiveStatus(s) === "a_caminho").length,
    no_local:   aprovados.filter(s => getEffectiveStatus(s) === "no_local").length,
  }), [aprovados, specialistStatuses]);

  const lista = useMemo(() => {
    let list = aprovados.filter(s => getEffectiveStatus(s) === activeTab);
    if (filterProf) list = list.filter(s => s.profissao === filterProf);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        s.nome.toLowerCase().includes(q) ||
        s.profissao.toLowerCase().includes(q) ||
        (s.uf || "").toLowerCase().includes(q) ||
        (s.numeroRegistro || s.numero_registro || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [aprovados, activeTab, filterProf, search, specialistStatuses]);

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 10, color: "var(--accent)", letterSpacing: "0.1em", fontFamily: "var(--font-mono)", marginBottom: 4 }}>CADASTROS</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", margin: 0, fontFamily: "var(--font-display)" }}>
            Especialistas Aprovados
          </h2>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            {aprovados.length} aprovado{aprovados.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, marginBottom: 18, borderBottom: "1px solid var(--border)" }}>
        {TABS.map(t => (
          <div
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: "8px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600,
              transition: "all 0.15s", display: "flex", alignItems: "center", gap: 6,
              color: activeTab === t.id ? "var(--text-primary)" : "var(--text-secondary)",
              borderBottom: activeTab === t.id ? "2px solid var(--accent)" : "2px solid transparent",
              marginBottom: -1,
            }}
          >
            {t.label}
            <span style={{
              minWidth: 18, height: 18, borderRadius: 99, fontSize: 10, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px",
              background: activeTab === t.id ? "var(--accent)" : "var(--bg-elevated)",
              color: activeTab === t.id ? "#fff" : "var(--text-muted)",
            }}>
              {tabCounts[t.id]}
            </span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
        <input
          className="search-input"
          placeholder="Buscar por nome, profissão, UF ou registro..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 220 }}
        />
        <select
          value={filterProf}
          onChange={e => setFilterProf(e.target.value)}
          style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "6px 12px", color: "var(--text-primary)", fontSize: 12.5, cursor: "pointer", fontFamily: "var(--font-body)" }}
        >
          <option value="">Todas as profissões</option>
          {profissoes.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        {(search || filterProf) && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => { setSearch(""); setFilterProf(""); }}
          >
            ✕ Limpar
          </button>
        )}
      </div>

      {/* Contagem filtrada */}
      {(search || filterProf) && (
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 14 }}>
          {lista.length} resultado{lista.length !== 1 ? "s" : ""} encontrado{lista.length !== 1 ? "s" : ""}
        </div>
      )}

      {/* Grid */}
      {aprovados.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">⚕️</div>
          <div className="empty-state-text">Nenhum especialista aprovado ainda. Acesse <strong>Validações</strong> para revisar os cadastros pendentes.</div>
        </div>
      ) : lista.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <div className="empty-state-text">
            {search || filterProf
              ? "Nenhum especialista encontrado para os filtros aplicados."
              : `Nenhum especialista com status "${TABS.find(t => t.id === activeTab)?.label}" no momento.`}
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
          {lista.map(s => (
            <EspecialistaCard
              key={s.id}
              spec={s}
              effectiveStatus={getEffectiveStatus(s)}
              onClick={() => setSelected(s)}
            />
          ))}
        </div>
      )}

      {/* Drawer de detalhe */}
      {selected && (
        <DetailDrawer
          spec={selected}
          effectiveStatus={getEffectiveStatus(selected)}
          onClose={() => setSelected(null)}
          onUpdateStatus={onUpdateStatus}
        />
      )}
    </div>
  );
}
