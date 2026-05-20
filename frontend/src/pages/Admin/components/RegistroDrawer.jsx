import { useState } from "react";

const CONSELHO_LINKS = {
  "Médico Clínico Geral":    { nome: "CFM", url: "https://portal.cfm.org.br/busca-medicos" },
  "Médico Emergencista":     { nome: "CFM", url: "https://portal.cfm.org.br/busca-medicos" },
  "Médico Cardiologista":    { nome: "CFM", url: "https://portal.cfm.org.br/busca-medicos" },
  "Médico Neurologista":     { nome: "CFM", url: "https://portal.cfm.org.br/busca-medicos" },
  "Médico Ortopedista":      { nome: "CFM", url: "https://portal.cfm.org.br/busca-medicos" },
  "Médico Intensivista (UTI)":{ nome: "CFM", url: "https://portal.cfm.org.br/busca-medicos" },
  "Enfermeiro(a)":           { nome: "COFEN", url: "https://cofen.gov.br/consulta-enfermeiro" },
  "Técnico de Enfermagem":   { nome: "COFEN", url: "https://cofen.gov.br/consulta-enfermeiro" },
  "Engenheiro de Segurança": { nome: "CONFEA/CREA", url: "https://www.confea.org.br" },
};

function fmt(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}
function fmtFull(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR");
}

export default function RegistroDrawer({ registro, onClose, onAprovar, onReprovar }) {
  const [obs,         setObs]         = useState("");
  const [confirmando, setConfirmando] = useState(null);

  if (!registro) return null;

  const conselho = CONSELHO_LINKS[registro.profissao];

  function handleAprovar() {
    if (confirmando !== "aprovar") { setConfirmando("aprovar"); return; }
    onAprovar(registro.id);
    setConfirmando(null); setObs(""); onClose();
  }

  function handleReprovar() {
    if (!obs.trim()) { alert("Informe o motivo da reprovação."); return; }
    if (confirmando !== "reprovar") { setConfirmando("reprovar"); return; }
    onReprovar(registro.id, obs.trim());
    setConfirmando(null); setObs(""); onClose();
  }

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 40 }} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 480, backgroundColor: "var(--bg-elevated)", borderLeft: "1px solid var(--border)", zIndex: 50, overflowY: "auto", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: 20, lineHeight: 1, padding: 0 }}>←</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>Revisar Cadastro</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>Cadastro em {fmtFull(registro.criadoEm)}</div>
          </div>
          <span style={{ backgroundColor: "rgba(234,179,8,0.12)", color: "#ca8a04", borderRadius: 99, fontSize: 11, fontWeight: 600, padding: "3px 10px" }}>⏳ Pendente</span>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: 20, display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Warning */}
          <div style={{ backgroundColor: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.3)", borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#ca8a04", marginBottom: 6 }}>⚠️ Validação manual obrigatória</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
              A autenticidade do número de registro ({registro.numeroRegistro}) deve ser verificada manualmente no conselho correspondente.
            </div>
            {conselho && (
              <a href={conselho.url} target="_blank" rel="noopener noreferrer"
                style={{ display: "inline-block", marginTop: 8, color: "var(--accent2)", fontSize: 12, fontWeight: 600 }}>
                🔗 Verificar no {conselho.nome} →
              </a>
            )}
          </div>

          {/* Personal data */}
          <section>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Dados Pessoais</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[["Nome completo", registro.nome], ["CPF", registro.cpf], ["Telefone", registro.telefone]].map(([label, value]) => (
                <div key={label} style={{ backgroundColor: "var(--bg-hover)", borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500 }}>{value || "—"}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Professional data */}
          <section>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Dados Profissionais</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[["Profissão", registro.profissao], ["Nº de Registro", registro.numeroRegistro]].map(([label, value]) => (
                <div key={label} style={{ backgroundColor: "var(--bg-hover)", borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 600 }}>{value || "—"}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Observation */}
          <section>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Observação do Revisor</div>
            <textarea value={obs} onChange={e => setObs(e.target.value)} rows={3}
              placeholder="Motivo de reprovação (obrigatório para reprovar)..."
              style={{ width: "100%", backgroundColor: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontSize: 13, padding: "10px 12px", resize: "vertical", fontFamily: "inherit" }} />
          </section>
        </div>

        {/* Actions */}
        <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 10 }}>
          <button onClick={handleReprovar} style={{ flex: 1, padding: 11, borderRadius: 8, border: "1px solid #dc2626", backgroundColor: confirmando === "reprovar" ? "#dc2626" : "rgba(220,38,38,0.1)", color: "#dc2626", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            {confirmando === "reprovar" ? "⚠️ Confirmar Reprovação" : "✗ Reprovar"}
          </button>
          <button onClick={handleAprovar} style={{ flex: 1, padding: 11, borderRadius: 8, border: "none", backgroundColor: confirmando === "aprovar" ? "#15803d" : "#16a34a", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            {confirmando === "aprovar" ? "✓ Confirmar Aprovação" : "✓ Aprovar"}
          </button>
        </div>
      </div>
    </>
  );
}
