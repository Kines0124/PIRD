import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import * as adminApi from "../../../services/adminApi.js";
import { gsap } from "gsap";
import { FaStaffSnake }        from "react-icons/fa6";

const PROF_COLORS = {
  "Médico Clínico Geral":      "#2563eb",
  "Médico Emergencista":       "#2563eb",
  "Médico Cardiologista":      "#2563eb",
  "Médico Neurologista":       "#2563eb",
  "Médico Ortopedista":        "#2563eb",
  "Médico Intensivista (UTI)": "#2563eb",
  "Enfermeiro(a)":             "#16a34a",
  "Técnico de Enfermagem":     "#16a34a",
  "Psicólogo":                 "#0891b2",
  "Assistente Social":         "#0891b2",
  "Engenheiro de Segurança":   "#d97706",
  "Engenheiro Civil":          "#d97706",
  "Técnico em Resgate":        "#71717a",
  "Técnico Defesa Civil":      "var(--accent)",
  "Guia de Cão de Resgate":    "#71717a",
  "Mergulhador de Resgate":    "#71717a",
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

// ---------- Animated counter for tab badges ----------
function AnimatedCount({ value }) {
  const ref = useRef(null);
  const prev = useRef(value);

  useEffect(() => {
    if (!ref.current || prev.current === value) return;
    gsap.fromTo(
      ref.current,
      { y: prev.current < value ? 6 : -6, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.3, ease: "power2.out" }
    );
    prev.current = value;
  }, [value]);

  return <span ref={ref}>{value}</span>;
}

// ---------- Detail Drawer ----------
function DetailDrawer({ spec, effectiveStatus, onClose, onUpdateStatus, onDelete }) {
  const color      = PROF_COLORS[spec.profissao] || "#71717a";
  const statusInfo = STATUS_MAP[effectiveStatus] || STATUS_MAP.disponivel;
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmText,     setConfirmText]     = useState("");
  const [deleteLoading,   setDeleteLoading]   = useState(false);
  const [deleteError,     setDeleteError]     = useState(null);

  const panelRef    = useRef(null);
  const overlayRef  = useRef(null);
  const contentRef  = useRef(null);

  // Entrada
  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.25 });
    tl.fromTo(panelRef.current,   { x: 40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.32 }, "<0.05");
    tl.fromTo(
      contentRef.current?.querySelectorAll(".drawer-row") || [],
      { y: 10, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.04, duration: 0.28 },
      "-=0.15"
    );
  }, []);

  function handleClose() {
    const tl = gsap.timeline({ onComplete: onClose });
    tl.to(panelRef.current,  { x: 40, opacity: 0, duration: 0.22, ease: "power2.in" });
    tl.to(overlayRef.current, { opacity: 0, duration: 0.18 }, "<0.04");
  }

  async function handleDeleteConfirm() {
    if (!confirmText || deleteLoading) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await adminApi.login(adminApi.getAdminEmail(), confirmText);
      onDelete(spec.especialistaId);
      handleClose();
    } catch {
      setDeleteError("Senha incorreta. Tente novamente.");
    } finally {
      setDeleteLoading(false);
    }
  }

  const Row = ({ label, value, mono }) => (
    <div className="drawer-row" style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 8, alignItems: "start" }}>
      <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", paddingTop: 1 }}>{label}</span>
      <span style={{ fontSize: 13, color: "var(--text-primary)", fontFamily: mono ? "var(--font-mono)" : "inherit" }}>{value}</span>
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex" }}>
      <div
        ref={overlayRef}
        style={{ flex: 1, background: "rgba(0,0,0,0.5)", opacity: 0 }}
        onClick={handleClose}
      />

      <div
        ref={panelRef}
        style={{ width: 420, background: "var(--bg-surface)", borderLeft: "1px solid var(--border)", display: "flex", flexDirection: "column", opacity: 0 }}
      >
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
            onClick={handleClose}
            style={{ width: 28, height: 28, borderRadius: "50%", border: "1px solid var(--border)", background: "none", cursor: "pointer", color: "var(--text-secondary)", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
          >✕</button>
        </div>

        {/* Status badges */}
        <div className="drawer-row" style={{ padding: "12px 24px", borderBottom: "1px solid var(--border)", backgroundColor: "var(--bg-elevated)", display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{ backgroundColor: "rgba(22,163,74,0.12)", color: "#16a34a", borderRadius: 99, fontSize: 12, fontWeight: 600, padding: "4px 12px", alignSelf: "flex-start" }}>
            ✓ Especialista Aprovado
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            {Object.entries(STATUS_MAP).map(([key, info]) => (
              <button
                key={key}
                onClick={() => onUpdateStatus && onUpdateStatus(spec.especialistaId, key)}
                style={{
                  backgroundColor: effectiveStatus === key ? info.bg : "transparent",
                  color: effectiveStatus === key ? info.color : "var(--text-muted)",
                  border: `1px solid ${effectiveStatus === key ? info.color : "var(--border)"}`,
                  borderRadius: 99, fontSize: 12, fontWeight: 600, padding: "4px 12px",
                  cursor: "pointer", transition: "all 0.15s",
                }}
              >
                {info.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div ref={contentRef} style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 18 }}>

          <div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, marginBottom: 10, fontFamily: "var(--font-mono)" }}>Dados Pessoais</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Row label="Nome completo" value={spec.nome} />
              <Row label="CPF"          value={spec.cpf} mono />
              <Row label="Telefone"     value={spec.telefone} />
              <Row label="Estado (UF)"  value={spec.uf || "—"} />
            </div>
          </div>

          <div style={{ height: 1, background: "var(--border)" }} />

          <div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, marginBottom: 10, fontFamily: "var(--font-mono)" }}>Dados Profissionais</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Row label="Profissão"   value={spec.profissao} />
              <Row label="Nº Registro" value={spec.numeroRegistro || spec.numero_registro || "—"} mono />
            </div>
          </div>

          <div style={{ height: 1, background: "var(--border)" }} />

          <div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, marginBottom: 10, fontFamily: "var(--font-mono)" }}>Endereço</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Row label="Rua / Nº"  value={[spec.rua, spec.numero].filter(Boolean).join(", ") || "—"} />
              <Row label="Bairro"    value={spec.bairro  || "—"} />
              <Row label="Cidade"    value={spec.cidade  || "—"} />
              <Row label="CEP"       value={spec.cep     || "—"} mono />
            </div>
          </div>

          <div style={{ height: 1, background: "var(--border)" }} />

          <div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, marginBottom: 10, fontFamily: "var(--font-mono)" }}>Histórico de Revisão</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Row label="Cadastrado em" value={fmt(spec.criadoEm   || spec.criado_em)} mono />
              <Row label="Aprovado em"   value={fmt(spec.revisadoEm || spec.revisado_em)} mono />
            </div>
            {spec.observacao && (
              <div style={{ marginTop: 10, background: "var(--bg-elevated)", borderRadius: 8, padding: "10px 12px", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, marginBottom: 4 }}>OBSERVAÇÃO</div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{spec.observacao}</div>
              </div>
            )}
          </div>
        </div>

        {/* Excluir */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)" }}>
          <button
            onClick={() => setShowDeleteModal(true)}
            style={{ width: "100%", background: "transparent", color: "#ef4444", border: "1px solid rgba(239,68,68,0.4)", borderRadius: 8, padding: "10px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.08)"; e.currentTarget.style.borderColor = "#ef4444"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.4)"; }}
          >
            🗑 Excluir Especialista
          </button>
        </div>
      </div>

      {/* Modal de confirmação */}
      {showDeleteModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 600, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)" }}>
          <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "28px 28px 24px", maxWidth: 400, width: "90%", display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 700, color: "var(--text-primary)" }}>Excluir Especialista</div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
              O especialista <strong style={{ color: "var(--text-primary)" }}>{spec.nome}</strong> perderá o acesso ao sistema, mas seus dados históricos serão preservados.
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>🔒 Confirme sua senha para prosseguir:</div>
            <input
              type="password"
              value={confirmText}
              onChange={e => { setConfirmText(e.target.value); setDeleteError(null); }}
              onKeyDown={e => e.key === "Enter" && !deleteLoading && handleDeleteConfirm()}
              placeholder="Sua senha"
              autoFocus
              style={{ background: "var(--bg-elevated)", border: `1px solid ${deleteError ? "#ef4444" : "var(--border)"}`, borderRadius: 7, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none" }}
            />
            {deleteError && <div style={{ fontSize: 12, color: "#ef4444", marginTop: -8 }}>{deleteError}</div>}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => { setShowDeleteModal(false); setConfirmText(""); setDeleteError(null); }}
                style={{ padding: "8px 18px", background: "none", border: "1px solid var(--border)", borderRadius: 7, color: "var(--text-secondary)", fontSize: 13, cursor: "pointer" }}
              >Cancelar</button>
              <button
                disabled={!confirmText || deleteLoading}
                onClick={handleDeleteConfirm}
                style={{ padding: "8px 18px", background: confirmText && !deleteLoading ? "#ef4444" : "var(--bg-elevated)", border: "none", borderRadius: 7, color: confirmText && !deleteLoading ? "#fff" : "var(--text-muted)", fontSize: 13, fontWeight: 700, cursor: confirmText && !deleteLoading ? "pointer" : "not-allowed", transition: "all 0.15s" }}
              >
                {deleteLoading ? "Verificando..." : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Card ----------
function EspecialistaCard({ spec, effectiveStatus, onClick, animIndex }) {
  const color      = PROF_COLORS[spec.profissao] || "#71717a";
  const statusInfo = STATUS_MAP[effectiveStatus] || STATUS_MAP.disponivel;
  const cardRef    = useRef(null);

  // Entrada staggered — controlada externamente via data-attr, mas também segura sozinha
  useEffect(() => {
    if (!cardRef.current) return;
    gsap.fromTo(
      cardRef.current,
      { y: 18, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.38, ease: "power2.out", delay: animIndex * 0.055 }
    );
  }, []); // roda só na montagem

  // Hover sutil com GSAP
  function handleMouseEnter() {
    gsap.to(cardRef.current, {
      y: -2,
      boxShadow: "0 6px 20px rgba(0,0,0,0.18)",
      duration: 0.22,
      ease: "power2.out",
      overwrite: "auto",
    });
  }
  function handleMouseLeave() {
    gsap.to(cardRef.current, {
      y: 0,
      boxShadow: "0 0px 0px rgba(0,0,0,0)",
      duration: 0.28,
      ease: "power2.inOut",
      overwrite: "auto",
    });
  }
  function handleMouseDown() {
    gsap.to(cardRef.current, { scale: 0.985, duration: 0.1, ease: "power1.in", overwrite: "auto" });
  }
  function handleMouseUp() {
    gsap.to(cardRef.current, { scale: 1, duration: 0.2, ease: "back.out(2)", overwrite: "auto" });
  }

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      style={{
        backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 10,
        padding: "16px", cursor: "pointer", display: "flex", gap: 14, alignItems: "flex-start",
        opacity: 0, // GSAP vai animar para 1
        willChange: "transform, opacity",
      }}
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

// ---------- Main Section ----------
export default function EspecialistasSection({ specialists, specialistStatuses = {}, onUpdateStatus, onDelete }) {
  const [selected,   setSelected]   = useState(null);
  const [search,     setSearch]     = useState("");
  const [filterProf, setFilterProf] = useState("");
  const [activeTab,  setActiveTab]  = useState("disponivel");

  const headerRef = useRef(null);
  const tabsRef   = useRef(null);
  const filtersRef= useRef(null);
  const gridRef   = useRef(null);
  const prevTab   = useRef(activeTab);

  const aprovados = specialists.filter(s => s.status === "aprovado");

  function getEffectiveStatus(spec) {
    return specialistStatuses[String(spec.especialistaId)] || spec.statusCampo || "disponivel";
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

  // Animação de entrada da seção inteira (só na montagem)
  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
    tl.fromTo(headerRef.current,  { y: -12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35 });
    tl.fromTo(tabsRef.current,    { y: -8,  opacity: 0 }, { y: 0, opacity: 1, duration: 0.3 }, "-=0.18");
    tl.fromTo(filtersRef.current, { y: -6,  opacity: 0 }, { y: 0, opacity: 1, duration: 0.28 }, "-=0.14");
  }, []);

  // Transição suave do grid ao trocar de tab
  useEffect(() => {
    if (!gridRef.current || prevTab.current === activeTab) return;
    prevTab.current = activeTab;
    gsap.fromTo(
      gridRef.current,
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 0.25, ease: "power2.out" }
    );
  }, [activeTab]);

  // Transição ao filtrar/pesquisar
  const lastSearch   = useRef(search);
  const lastFilter   = useRef(filterProf);
  useEffect(() => {
    if (!gridRef.current) return;
    if (lastSearch.current !== search || lastFilter.current !== filterProf) {
      lastSearch.current  = search;
      lastFilter.current  = filterProf;
      gsap.fromTo(
        gridRef.current,
        { opacity: 0.4 },
        { opacity: 1, duration: 0.2, ease: "power1.out" }
      );
    }
  }, [search, filterProf]);

  return (
    <div>
      {/* Header */}
      <div ref={headerRef} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20, opacity: 0 }}>
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
      <div ref={tabsRef} style={{ display: "flex", gap: 2, marginBottom: 18, borderBottom: "1px solid var(--border)", opacity: 0 }}>
        {TABS.map(t => (
          <div
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: "8px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600,
              transition: "color 0.18s", display: "flex", alignItems: "center", gap: 6,
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
              transition: "background 0.18s, color 0.18s",
              overflow: "hidden",
            }}>
              <AnimatedCount value={tabCounts[t.id]} />
            </span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div ref={filtersRef} style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap", opacity: 0 }}>
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
          <button className="btn btn-secondary btn-sm" onClick={() => { setSearch(""); setFilterProf(""); }}>
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
      <div ref={gridRef}>
        {aprovados.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><FaStaffSnake style={{color:"#22c55e"}}/></div>
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
            {lista.map((s, i) => (
              <EspecialistaCard
                key={s.id}
                spec={s}
                effectiveStatus={getEffectiveStatus(s)}
                onClick={() => setSelected(s)}
                animIndex={i}
              />
            ))}
          </div>
        )}
      </div>

      {/* Drawer */}
      {selected && (
        <DetailDrawer
          spec={selected}
          effectiveStatus={getEffectiveStatus(selected)}
          onClose={() => setSelected(null)}
          onUpdateStatus={onUpdateStatus}
          onDelete={id => { onDelete && onDelete(id); setSelected(null); }}
        />
      )}
    </div>
  );
}