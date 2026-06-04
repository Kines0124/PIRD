import { useState } from "react";
import * as adminApi from "../../../services/adminApi.js";

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
  const [obs,            setObs]            = useState("");
  const [confirmStep,    setConfirmStep]    = useState(false);
  const [confirmSenha,   setConfirmSenha]   = useState("");
  const [confirmError,   setConfirmError]   = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [reprovando,     setReprovando]     = useState(false);

  if (!registro) return null;

  const conselho      = CONSELHO_LINKS[registro.profissao];
  const storedEmail   = adminApi.getAdminEmail();

  async function handleConfirmarAprovar() {
    if (!storedEmail) {
      setConfirmError("Sessão sem e-mail armazenado. Faça logout e login novamente.");
      return;
    }
    setConfirmLoading(true);
    setConfirmError(null);
    try {
      await adminApi.login(storedEmail, confirmSenha);
      onAprovar(registro.id);
      onClose();
    } catch {
      setConfirmError("Senha incorreta. Tente novamente.");
    } finally {
      setConfirmLoading(false);
    }
  }

  function handleReprovar() {
    if (!obs.trim()) { alert("Informe o motivo da reprovação."); return; }
    if (!reprovando) { setReprovando(true); return; }
    onReprovar(registro.id, obs.trim());
    setReprovando(false); setObs(""); onClose();
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

          {/* Address */}
          {(registro.rua || registro.cidade) && (
            <section>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Endereço</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  ["Rua / Nº",  [registro.rua, registro.numero].filter(Boolean).join(", ") || "—"],
                  ["Bairro",    registro.bairro || "—"],
                  ["Cidade",    registro.cidade || "—"],
                  ["CEP",       registro.cep    || "—"],
                ].map(([label, value]) => (
                  <div key={label} style={{ backgroundColor: "var(--bg-hover)", borderRadius: 8, padding: "10px 12px" }}>
                    <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500 }}>{value}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Observation */}
          <section>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Observação do Revisor</div>
            <textarea value={obs} onChange={e => setObs(e.target.value)} rows={3}
              placeholder="Motivo de reprovação (obrigatório para reprovar)..."
              style={{ width: "100%", backgroundColor: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontSize: 13, padding: "10px 12px", resize: "vertical", fontFamily: "inherit" }} />
          </section>
        </div>

        {/* Actions */}
        {confirmStep ? (
          <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 600 }}>
              🔒 Confirme sua senha para aprovar este especialista:
            </div>
            <input
              type="password"
              value={confirmSenha}
              onChange={e => { setConfirmSenha(e.target.value); setConfirmError(null); }}
              placeholder="Sua senha"
              autoFocus
              style={{ backgroundColor: "var(--bg-hover)", border: `1px solid ${confirmError ? "#ef4444" : "var(--border)"}`, borderRadius: 8, color: "var(--text-primary)", fontSize: 13, padding: "10px 12px", outline: "none" }}
            />
            {confirmError && (
              <div style={{ fontSize: 11, color: "#ef4444", fontFamily: "var(--font-mono)" }}>{confirmError}</div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { setConfirmStep(false); setConfirmSenha(""); setConfirmError(null); }} style={{ flex: 1, padding: 11, borderRadius: 8, border: "1px solid var(--border)", backgroundColor: "transparent", color: "var(--text-secondary)", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                Cancelar
              </button>
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
            <button onClick={handleReprovar} style={{ flex: 1, padding: 11, borderRadius: 8, border: "1px solid #dc2626", backgroundColor: reprovando ? "#dc2626" : "rgba(220,38,38,0.1)", color: reprovando ? "#fff" : "#dc2626", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              {reprovando ? "Confirmar Reprovação" : "✗ Reprovar"}
            </button>
            <button onClick={() => setConfirmStep(true)} style={{ flex: 1, padding: 11, borderRadius: 8, border: "none", backgroundColor: "#16a34a", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              ✓ Aprovar
            </button>
          </div>
        )}
      </div>
    </>
  );
}
