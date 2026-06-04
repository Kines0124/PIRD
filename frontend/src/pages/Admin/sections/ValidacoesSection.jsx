import { useState, useMemo, useEffect, useRef } from "react";
import { gsap } from "gsap";
import * as adminApi from "../../../services/adminApi.js";
import RegistroDrawer from "../components/RegistroDrawer";
import { FaStaffSnake }        from "react-icons/fa6";
import { BsBox2HeartFill }     from "react-icons/bs";

const CONSELHOS = [
  { nome: "CFM — Médicos",             url: "https://portal.cfm.org.br/busca-medicos" },
  { nome: "COFEN — Enfermeiros",        url: "https://cofen.gov.br/consulta-enfermeiro" },
  { nome: "CFP — Psicólogos",           url: "https://cadastro.cfp.org.br" },
  { nome: "CONFEA/CREA — Engenheiros",  url: "https://www.confea.org.br" },
];

function fmt(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function StatusBadge({ status }) {
  const map = {
    pendente:  { color: "#ca8a04", bg: "rgba(202,138,4,0.1)",  label: "⏳ Pendente" },
    aprovado:  { color: "#16a34a", bg: "rgba(22,163,74,0.1)",  label: "✓ Aprovado" },
    reprovado: { color: "#dc2626", bg: "rgba(220,38,38,0.1)",  label: "✗ Reprovado" },
    rejeitado: { color: "#dc2626", bg: "rgba(220,38,38,0.1)",  label: "✗ Rejeitado" },
  };
  const s = map[status] || map.pendente;
  return (
    <span style={{ backgroundColor: s.bg, color: s.color, borderRadius: 99, fontSize: 11, fontWeight: 600, padding: "3px 10px" }}>
      {s.label}
    </span>
  );
}

// ── Counter card animado ────────────────────────────────────────────────────
function CounterCard({ item, animIndex }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    gsap.fromTo(
      ref.current,
      { y: 14, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.38, ease: "power2.out", delay: animIndex * 0.07 }
    );
  }, []);

  return (
    <div
      ref={ref}
      style={{ flex: 1, backgroundColor: item.bg, borderRadius: 10, padding: "14px 16px", border: `1px solid ${item.color}33`, opacity: 0, willChange: "transform, opacity" }}
    >
      <div style={{ fontSize: 26, fontWeight: 800, color: item.color }}>{item.value}</div>
      <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>{item.label}</div>
    </div>
  );
}

function Counters({ items }) {
  return (
    <div style={{ display: "flex", gap: 12 }}>
      {items.map((s, i) => <CounterCard key={s.label} item={s} animIndex={i} />)}
    </div>
  );
}

// ── Specialist pending card ─────────────────────────────────────────────────
function RegistroCard({ reg, onRevisar, onDeletar, animIndex }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting,   setDeleting]   = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    if (!cardRef.current) return;
    gsap.fromTo(
      cardRef.current,
      { x: 28, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.4, ease: "power3.out", delay: animIndex * 0.06 }
    );
  }, []);

  function handleMouseEnter() {
    gsap.to(cardRef.current, { x: 2, duration: 0.2, ease: "power2.out", overwrite: "auto" });
  }
  function handleMouseLeave() {
    gsap.to(cardRef.current, { x: 0, duration: 0.25, ease: "power2.inOut", overwrite: "auto" });
  }

  async function handleDelete() {
    setDeleting(true);
    await onDeletar();
    setDeleting(false);
    setConfirming(false);
  }

  return (
    <div
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        backgroundColor: "var(--bg-elevated)", border: `1px solid ${confirming ? "#dc262655" : "var(--border)"}`,
        borderRadius: 10, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14,
        transition: "border-color 0.2s", opacity: 0, willChange: "transform, opacity",
      }}
    >
      <div style={{ width: 44, height: 44, borderRadius: "50%", backgroundColor: "var(--bg-hover)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "var(--text-primary)", flexShrink: 0 }}>
        {reg.nome.charAt(0).toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)", marginBottom: 2 }}>{reg.nome}</div>
        <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{reg.profissao} · {reg.numeroRegistro}</div>
        <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>Cadastro: {fmt(reg.criadoEm)}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
        <StatusBadge status={reg.status} />
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {reg.status === "pendente" && !confirming && (
            <button onClick={onRevisar} style={{ backgroundColor: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 7, color: "var(--text-secondary)", fontSize: 12, padding: "5px 12px", cursor: "pointer", fontWeight: 500 }}>
              Revisar →
            </button>
          )}
          {!confirming ? (
            <button onClick={() => setConfirming(true)} title="Excluir cadastro"
              style={{ background: "none", border: "1px solid transparent", borderRadius: 7, color: "var(--text-muted)", fontSize: 15, padding: "4px 8px", cursor: "pointer", lineHeight: 1 }}
              onMouseEnter={e => { e.target.style.color = "#dc2626"; e.target.style.background = "rgba(220,38,38,0.07)"; }}
              onMouseLeave={e => { e.target.style.color = "var(--text-muted)"; e.target.style.background = "none"; }}>
              🗑
            </button>
          ) : (
            <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
              <span style={{ fontSize: 11, color: "#dc2626", fontWeight: 600 }}>Excluir?</span>
              <button onClick={handleDelete} disabled={deleting} style={{ backgroundColor: "#dc2626", border: "none", borderRadius: 6, color: "#fff", fontSize: 11, padding: "4px 10px", cursor: "pointer", fontWeight: 700 }}>
                {deleting ? "..." : "Sim"}
              </button>
              <button onClick={() => setConfirming(false)} style={{ backgroundColor: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text-secondary)", fontSize: 11, padding: "4px 10px", cursor: "pointer" }}>
                Não
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Collection point pending card ───────────────────────────────────────────
function RegistroPontoCard({ reg, onRevisar, animIndex }) {
  const cardRef = useRef(null);

  useEffect(() => {
    if (!cardRef.current) return;
    gsap.fromTo(
      cardRef.current,
      { x: 28, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.4, ease: "power3.out", delay: animIndex * 0.06 }
    );
  }, []);

  function handleMouseEnter() {
    gsap.to(cardRef.current, { x: 2, duration: 0.2, ease: "power2.out", overwrite: "auto" });
  }
  function handleMouseLeave() {
    gsap.to(cardRef.current, { x: 0, duration: 0.25, ease: "power2.inOut", overwrite: "auto" });
  }

  return (
    <div
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14, opacity: 0, willChange: "transform, opacity" }}
    >
      <div style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: "rgba(222,57,63,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
        📦
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)", marginBottom: 2 }}>{reg.nomeLocal}</div>
        <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
          CNPJ: {reg.cnpj} · {reg.tipoPonto ? "Fixo" : "Temporário"}
        </div>
        <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>
          📍 {reg.rua}, {reg.numero} — {reg.cidade} · Cadastro: {fmt(reg.criadoEm)}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
        <StatusBadge status={reg.status} />
        {reg.status === "pendente" && (
          <button onClick={onRevisar} style={{ backgroundColor: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 7, color: "var(--text-secondary)", fontSize: 12, padding: "5px 12px", cursor: "pointer", fontWeight: 500 }}>
            Revisar →
          </button>
        )}
      </div>
    </div>
  );
}

// ── Histórico card animado ──────────────────────────────────────────────────
function HistoricoCard({ item, animIndex }) {
  const isPonto    = item._tipo === "ponto_coleta";
  const isAprovado = item.status === "aprovado";
  const statusColor = isAprovado ? "#16a34a" : "#dc2626";
  const statusBg    = isAprovado ? "rgba(22,163,74,0.1)" : "rgba(220,38,38,0.1)";
  const statusLabel = isAprovado ? "✓ Aprovado" : isPonto ? "✗ Rejeitado" : "✗ Reprovado";
  const cardRef = useRef(null);

  useEffect(() => {
    if (!cardRef.current) return;
    gsap.fromTo(
      cardRef.current,
      { x: 24, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.36, ease: "power2.out", delay: Math.min(animIndex * 0.045, 0.4) }
    );
  }, []);

  return (
    <div
      ref={cardRef}
      style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14, opacity: 0, willChange: "transform, opacity" }}
    >
      <div style={{ width: 44, height: 44, borderRadius: isPonto ? 8 : "50%", backgroundColor: isPonto ? "rgba(222,57,63,0.12)" : "var(--bg-hover)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: isPonto ? 18 : 16, fontWeight: 700, color: "var(--text-primary)", flexShrink: 0 }}>
        {isPonto ? "📦" : item._nome.charAt(0).toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)", marginBottom: 2 }}>{item._nome}</div>
        <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{item._desc}</div>
        <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>
          {isPonto ? "Ponto de Coleta" : "Especialista"} · Revisado em: {fmt(item._date)}
        </div>
        {item.observacao && (
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3, fontStyle: "italic" }}>
            💬 {item.observacao}
          </div>
        )}
      </div>
      <span style={{ backgroundColor: statusBg, color: statusColor, borderRadius: 99, fontSize: 11, fontWeight: 600, padding: "3px 10px", flexShrink: 0 }}>
        {statusLabel}
      </span>
    </div>
  );
}

// ── Drawer ponto de coleta animado ──────────────────────────────────────────
function RegistroPontoDrawer({ registro, onClose, onAprovarRegistro, onRejeitarRegistro }) {
  const [obs,            setObs]            = useState("");
  const [confirmStep,    setConfirmStep]    = useState(false);
  const [confirmSenha,   setConfirmSenha]   = useState("");
  const [confirmError,   setConfirmError]   = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const overlayRef = useRef(null);
  const panelRef   = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.25 });
    tl.fromTo(panelRef.current,   { x: 48, opacity: 0 }, { x: 0, opacity: 1, duration: 0.35 }, "<0.06");
    tl.fromTo(
      contentRef.current?.querySelectorAll(".drawer-item") || [],
      { x: 16, opacity: 0 },
      { x: 0, opacity: 1, stagger: 0.06, duration: 0.28 },
      "-=0.16"
    );
  }, []);

  function handleClose() {
    const tl = gsap.timeline({ onComplete: onClose });
    tl.to(panelRef.current,   { x: 48, opacity: 0, duration: 0.22, ease: "power2.in" });
    tl.to(overlayRef.current, { opacity: 0, duration: 0.18 }, "<0.04");
  }

  if (!registro) return null;

  const storedEmail = adminApi.getAdminEmail();

  function handleRejeitar() {
    if (!obs.trim()) { alert("Informe o motivo da recusa."); return; }
    onRejeitarRegistro(registro.id, obs.trim());
    handleClose();
  }

  async function handleConfirmarAprovar() {
    if (!storedEmail) {
      setConfirmError("Sessão sem e-mail armazenado. Faça logout e login novamente.");
      return;
    }
    setConfirmLoading(true);
    setConfirmError(null);
    try {
      await adminApi.login(storedEmail, confirmSenha);
      onAprovarRegistro(registro.id);
      handleClose();
    } catch {
      setConfirmError("Senha incorreta. Tente novamente.");
    } finally {
      setConfirmLoading(false);
    }
  }

  function cancelConfirm() {
    setConfirmStep(false);
    setConfirmSenha("");
    setConfirmError(null);
  }

  const field = (label, value) => (
    <div key={label} className="drawer-item" style={{ backgroundColor: "var(--bg-hover)", borderRadius: 8, padding: "10px 12px" }}>
      <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500 }}>{value || "—"}</div>
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 40, display: "flex", justifyContent: "flex-end" }}>
      <div
        ref={overlayRef}
        style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", opacity: 0 }}
        onClick={handleClose}
      />
      <div
        ref={panelRef}
        style={{ position: "relative", width: 480, backgroundColor: "var(--bg-elevated)", borderLeft: "1px solid var(--border)", zIndex: 50, display: "flex", flexDirection: "column", opacity: 0, willChange: "transform, opacity" }}
      >
        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={handleClose} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: 20, lineHeight: 1, padding: 0 }}>←</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>Revisar Cadastro</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>📦 Ponto de Coleta</div>
          </div>
          <span style={{ backgroundColor: "rgba(234,179,8,0.12)", color: "#ca8a04", borderRadius: 99, fontSize: 11, fontWeight: 600, padding: "3px 10px" }}>⏳ Pendente</span>
        </div>

        {/* Content */}
        <div ref={contentRef} style={{ flex: 1, padding: 20, display: "flex", flexDirection: "column", gap: 20, overflowY: "auto" }}>
          <section className="drawer-item">
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Dados do Ponto</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {field("Nome do ponto",    registro.nomeLocal)}
              {field("CNPJ",            registro.cnpj)}
              {field("Tipo",            registro.tipoPonto ? "Fixo" : "Temporário")}
              {field("Telefone",        registro.telefone)}
              {registro.email && field("E-mail", registro.email)}
            </div>
          </section>

          <section className="drawer-item">
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Endereço</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {field("Rua / logradouro", registro.rua)}
              {field("Número",          registro.numero)}
              {field("Bairro",          registro.bairro)}
              {field("Cidade",          registro.cidade)}
              {registro.cep && field("CEP", registro.cep)}
            </div>
          </section>

          <section className="drawer-item">
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Observação do Revisor</div>
            <textarea value={obs} onChange={e => setObs(e.target.value)} rows={3}
              placeholder="Motivo da recusa (obrigatório para rejeitar)..."
              style={{ width: "100%", backgroundColor: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontSize: 13, padding: "10px 12px", resize: "vertical", fontFamily: "inherit" }} />
          </section>
        </div>

        {/* Actions */}
        {confirmStep ? (
          <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 600 }}>🔒 Confirme sua senha para aprovar este ponto:</div>
            <input
              type="password"
              value={confirmSenha}
              onChange={e => { setConfirmSenha(e.target.value); setConfirmError(null); }}
              placeholder="Sua senha"
              autoFocus
              style={{ backgroundColor: "var(--bg-hover)", border: `1px solid ${confirmError ? "#ef4444" : "var(--border)"}`, borderRadius: 8, color: "var(--text-primary)", fontSize: 13, padding: "10px 12px", outline: "none" }}
            />
            {confirmError && <div style={{ fontSize: 11, color: "#ef4444", fontFamily: "var(--font-mono)" }}>{confirmError}</div>}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={cancelConfirm} style={{ flex: 1, padding: 11, borderRadius: 8, border: "1px solid var(--border)", backgroundColor: "transparent", color: "var(--text-secondary)", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Cancelar</button>
              <button
                onClick={handleConfirmarAprovar}
                disabled={!confirmSenha || confirmLoading}
                style={{ flex: 1, padding: 11, borderRadius: 8, border: "none", backgroundColor: confirmSenha && !confirmLoading ? "#16a34a" : "var(--bg-hover)", color: confirmSenha && !confirmLoading ? "#fff" : "var(--text-muted)", fontWeight: 700, fontSize: 13, cursor: confirmSenha && !confirmLoading ? "pointer" : "not-allowed", transition: "all 0.15s" }}
              >
                {confirmLoading ? "Verificando..." : "✓ Confirmar Aprovação"}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 10 }}>
            <button onClick={handleRejeitar} style={{ flex: 1, padding: 11, borderRadius: 8, border: "1px solid #dc2626", backgroundColor: "rgba(220,38,38,0.1)", color: "#dc2626", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>✗ Rejeitar</button>
            <button onClick={() => setConfirmStep(true)} style={{ flex: 1, padding: 11, borderRadius: 8, border: "none", backgroundColor: "#16a34a", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>✓ Aprovar</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main section ────────────────────────────────────────────────────────────
export default function ValidacoesSection({
  specialists,
  onAprovar,
  onReprovar,
  onDeletar,
  registros = [],
  onAprovarRegistro,
  onRejeitarRegistro,
}) {
  const [mainTab,    setMainTab]    = useState("especialistas");
  const [drawerReg,  setDrawerReg]  = useState(null);
  const [drawerPC,   setDrawerPC]   = useState(null);
  const [histFilter, setHistFilter] = useState({ tipo: "todos", status: "todos", data: "" });

  const headerRef  = useRef(null);
  const tabsRef    = useRef(null);
  const contentRef = useRef(null);
  const prevTab    = useRef(mainTab);

  // Entrada da seção
  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
    tl.fromTo(headerRef.current, { y: -12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.32 });
    tl.fromTo(tabsRef.current,   { y: -6,  opacity: 0 }, { y: 0, opacity: 1, duration: 0.28 }, "-=0.14");
  }, []);

  // Transição ao trocar de tab
  useEffect(() => {
    if (!contentRef.current || prevTab.current === mainTab) return;
    prevTab.current = mainTab;
    gsap.fromTo(
      contentRef.current,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.26, ease: "power2.out" }
    );
  }, [mainTab]);

  // Specialists
  const pendentesEsp  = specialists.filter(s => s.status === "pendente");
  const aprovadosEsp  = specialists.filter(s => s.status === "aprovado");
  const reprovadosEsp = specialists.filter(s => s.status === "reprovado");

  // Registros
  const pendentesPC  = registros.filter(r => r.status === "pendente");
  const aprovadosPC  = registros.filter(r => r.status === "aprovado");
  const rejeitadosPC = registros.filter(r => r.status === "rejeitado");

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const aprovadosEspHoje  = aprovadosEsp.filter(s => s.revisadoEm  && new Date(s.revisadoEm)  >= today).length;
  const reprovadosEspHoje = reprovadosEsp.filter(s => s.revisadoEm && new Date(s.revisadoEm)  >= today).length;
  const aprovadosPCHoje   = aprovadosPC.filter(r  => r.revisadoEm  && new Date(r.revisadoEm)  >= today).length;
  const rejeitadosPCHoje  = rejeitadosPC.filter(r => r.revisadoEm  && new Date(r.revisadoEm)  >= today).length;

  const historico = useMemo(() => {
    const espItems = [...aprovadosEsp, ...reprovadosEsp].map(s => ({
      ...s, _tipo: "especialista", _nome: s.nome, _desc: s.profissao, _date: s.revisadoEm || s.criadoEm,
    }));
    const pcItems = [...aprovadosPC, ...rejeitadosPC].map(r => ({
      ...r, _tipo: "ponto_coleta", _nome: r.nomeLocal, _desc: `CNPJ: ${r.cnpj}`, _date: r.revisadoEm || r.criadoEm,
    }));
    let list = [...espItems, ...pcItems].sort((a, b) => new Date(b._date) - new Date(a._date));
    if (histFilter.tipo !== "todos")   list = list.filter(i => i._tipo === histFilter.tipo);
    if (histFilter.status === "aprovado")
      list = list.filter(i => i.status === "aprovado");
    if (histFilter.status === "rejeitado")
      list = list.filter(i => i.status === "reprovado" || i.status === "rejeitado");
    if (histFilter.data)
      list = list.filter(i => new Date(i._date).toISOString().slice(0, 10) === histFilter.data);
    return list;
  }, [aprovadosEsp, reprovadosEsp, aprovadosPC, rejeitadosPC, histFilter]);

  const tabStyle = (id) => ({
    padding: "8px 18px", border: "none", cursor: "pointer", backgroundColor: "transparent",
    fontSize: 13, fontWeight: mainTab === id ? 700 : 400,
    color: mainTab === id ? "var(--text-primary)" : "var(--text-secondary)",
    borderBottom: mainTab === id ? "2px solid var(--accent)" : "2px solid transparent",
    marginBottom: -1, display: "flex", alignItems: "center", gap: 6,
    transition: "color 0.18s",
  });

  return (
    <div style={{ padding: 24, height: "100%", display: "flex", flexDirection: "column", gap: 16, overflowY: "auto" }}>

      {/* Header */}
      <div ref={headerRef} style={{ opacity: 0 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>Validações de Cadastro</div>
        <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>Revisão de especialistas e pontos de coleta</div>
      </div>

      {/* Tabs */}
      <div ref={tabsRef} style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--border)", opacity: 0 }}>
        <button style={tabStyle("especialistas")} onClick={() => setMainTab("especialistas")}>
          <FaStaffSnake style={{color:"#22c55e"}}/> Especialistas
          {pendentesEsp.length > 0 && (
            <span style={{ minWidth: 18, height: 18, borderRadius: 99, fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px", background: mainTab === "especialistas" ? "var(--accent)" : "rgba(202,138,4,0.2)", color: mainTab === "especialistas" ? "#fff" : "#ca8a04", transition: "background 0.18s, color 0.18s" }}>
              {pendentesEsp.length}
            </span>
          )}
        </button>
        <button style={tabStyle("pontos")} onClick={() => setMainTab("pontos")}>
          <BsBox2HeartFill style={{color: "#3B82F6"}}/> Pontos de Coleta
          {pendentesPC.length > 0 && (
            <span style={{ minWidth: 18, height: 18, borderRadius: 99, fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px", background: mainTab === "pontos" ? "var(--accent)" : "rgba(202,138,4,0.2)", color: mainTab === "pontos" ? "#fff" : "#ca8a04", transition: "background 0.18s, color 0.18s" }}>
              {pendentesPC.length}
            </span>
          )}
        </button>
        <button style={tabStyle("historico")} onClick={() => setMainTab("historico")}>
          🕐 Histórico
        </button>
      </div>

      {/* Conteúdo da tab ativa */}
      <div ref={contentRef}>

        {/* ── Especialistas ── */}
        {mainTab === "especialistas" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Counters items={[
              { label: "Pendentes",       value: pendentesEsp.length,  color: "#ca8a04", bg: "rgba(202,138,4,0.1)" },
              { label: "Aprovados hoje",  value: aprovadosEspHoje,     color: "#16a34a", bg: "rgba(22,163,74,0.1)" },
              { label: "Reprovados hoje", value: reprovadosEspHoje,    color: "#dc2626", bg: "rgba(220,38,38,0.1)" },
            ]} />

            <div style={{ backgroundColor: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.25)", borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#60a5fa", marginBottom: 6 }}>ℹ️ Verificação Obrigatória — Conselhos Profissionais</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 8 }}>
                Antes de aprovar qualquer cadastro, verifique o número de registro no site oficial do conselho correspondente.
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {CONSELHOS.map(c => (
                  <a key={c.nome} href={c.url} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 11, color: "#60a5fa", fontWeight: 600, backgroundColor: "rgba(37,99,235,0.1)", padding: "3px 10px", borderRadius: 99, textDecoration: "none" }}>
                    🔗 {c.nome}
                  </a>
                ))}
              </div>
            </div>

            {pendentesEsp.length === 0
              ? <div style={{ textAlign: "center", color: "var(--text-secondary)", fontSize: 14, padding: "40px 0" }}>✅ Nenhum especialista pendente</div>
              : <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {pendentesEsp.map((reg, i) => (
                    <RegistroCard key={reg.id} reg={reg} animIndex={i}
                      onRevisar={() => setDrawerReg(reg)}
                      onDeletar={() => onDeletar(reg.id)} />
                  ))}
                </div>
            }
          </div>
        )}

        {/* ── Pontos de Coleta ── */}
        {mainTab === "pontos" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Counters items={[
              { label: "Pendentes",       value: pendentesPC.length, color: "#ca8a04", bg: "rgba(202,138,4,0.1)" },
              { label: "Aprovados hoje",  value: aprovadosPCHoje,    color: "#16a34a", bg: "rgba(22,163,74,0.1)" },
              { label: "Rejeitados hoje", value: rejeitadosPCHoje,   color: "#dc2626", bg: "rgba(220,38,38,0.1)" },
            ]} />

            <div style={{ backgroundColor: "rgba(222,57,63,0.06)", border: "1px solid rgba(222,57,63,0.25)", borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "var(--accent)", marginBottom: 4 }}>🔒 Aprovação com confirmação de senha</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                Para aprovar um ponto de coleta, será necessário confirmar sua senha de acesso. Verifique os dados do cadastro antes de prosseguir.
              </div>
            </div>

            {pendentesPC.length === 0
              ? <div style={{ textAlign: "center", color: "var(--text-secondary)", fontSize: 14, padding: "40px 0" }}>✅ Nenhum ponto de coleta pendente</div>
              : <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {pendentesPC.map((reg, i) => (
                    <RegistroPontoCard key={reg.id} reg={reg} animIndex={i}
                      onRevisar={() => setDrawerPC(reg)} />
                  ))}
                </div>
            }
          </div>
        )}

        {/* ── Histórico ── */}
        {mainTab === "historico" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <select
                value={histFilter.tipo}
                onChange={e => setHistFilter(f => ({ ...f, tipo: e.target.value }))}
                style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontSize: 13, padding: "7px 10px" }}
              >
                <option value="todos">Todos os tipos</option>
                <option value="especialista">Especialistas</option>
                <option value="ponto_coleta">Pontos de Coleta</option>
              </select>
              <select
                value={histFilter.status}
                onChange={e => setHistFilter(f => ({ ...f, status: e.target.value }))}
                style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontSize: 13, padding: "7px 10px" }}
              >
                <option value="todos">Todos os status</option>
                <option value="aprovado">Aprovados</option>
                <option value="rejeitado">Reprovados / Rejeitados</option>
              </select>
              <input
                type="date"
                value={histFilter.data}
                onChange={e => setHistFilter(f => ({ ...f, data: e.target.value }))}
                style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontSize: 13, padding: "7px 10px" }}
              />
            </div>
            {historico.length === 0
              ? <div style={{ textAlign: "center", color: "var(--text-secondary)", fontSize: 14, padding: "30px 0" }}>Nenhum registro no histórico</div>
              : <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {historico.map((item, i) => (
                    <HistoricoCard key={`${item._tipo}-${item.id}-${i}`} item={item} animIndex={i} />
                  ))}
                </div>
            }
          </div>
        )}
      </div>

      {/* Drawers */}
      <RegistroDrawer
        registro={drawerReg}
        onClose={() => setDrawerReg(null)}
        onAprovar={id => { onAprovar(id); setDrawerReg(null); }}
        onReprovar={(id, obs) => { onReprovar(id, obs); setDrawerReg(null); }}
      />

      {drawerPC && (
        <RegistroPontoDrawer
          registro={drawerPC}
          onClose={() => setDrawerPC(null)}
          onAprovarRegistro={id => { onAprovarRegistro && onAprovarRegistro(id); }}
          onRejeitarRegistro={(id, obs) => { onRejeitarRegistro && onRejeitarRegistro(id, obs); }}
        />
      )}
    </div>
  );
}