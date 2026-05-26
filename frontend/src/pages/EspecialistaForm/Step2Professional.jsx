import { useState } from "react";

const BASE = "http://localhost:8080";

const PROFISSOES = [
  { id: "medico-geral",         label: "Médico Clínico Geral",        icon: "🏥", regLabel: "Nº do CRM",                   tipo: "CRM" },
  { id: "medico-emergencista",  label: "Médico Emergencista",          icon: "🚑", regLabel: "Nº do CRM",                   tipo: "CRM" },
  { id: "medico-cardiologista", label: "Médico Cardiologista",         icon: "❤️", regLabel: "Nº do CRM",                   tipo: "CRM" },
  { id: "medico-neurologista",  label: "Médico Neurologista",          icon: "🧠", regLabel: "Nº do CRM",                   tipo: "CRM" },
  { id: "medico-ortopedista",   label: "Médico Ortopedista",           icon: "🦴", regLabel: "Nº do CRM",                   tipo: "CRM" },
  { id: "medico-intensivista",  label: "Médico Intensivista (UTI)",    icon: "💬", regLabel: "Nº do CRM",                   tipo: "CRM" },
  { id: "enfermeiro",           label: "Enfermeiro(a)",                icon: "🏥", regLabel: "Nº do COREN",                 tipo: "COREN" },
  { id: "tec-enfermagem",       label: "Técnico de Enfermagem",        icon: "🩺", regLabel: "Nº do COREN",                 tipo: "COREN" },
  { id: "bombeiro-civil",       label: "Bombeiro Civil",               icon: "🔥", regLabel: "Registro CBM",                tipo: "CBM" },
  { id: "bombeiro-militar",     label: "Bombeiro Militar",             icon: "🚒", regLabel: "Matrícula Funcional",         tipo: "MATRICULA" },
  { id: "tec-resgate",          label: "Técnico em Resgate",           icon: "🔧", regLabel: "Nº do Registro Profissional", tipo: "REG" },
  { id: "paramedico",           label: "Paramédico / SAMU",            icon: "🏨", regLabel: "Nº do Registro Profissional", tipo: "REG" },
  { id: "eng-seguranca",        label: "Engenheiro de Segurança",      icon: "🏗️", regLabel: "Nº do CREA",                 tipo: "CREA" },
  { id: "guia-cao",             label: "Guia de Cão de Resgate",       icon: "🐕", regLabel: "Nº do Registro Profissional", tipo: "REG" },
  { id: "defesa-civil",         label: "Técnico em Defesa Civil",      icon: "⚡", regLabel: "Nº do Registro Profissional", tipo: "REG" },
  { id: "mergulhador",          label: "Mergulhador de Resgate",       icon: "🤿", regLabel: "Nº do Registro Profissional", tipo: "REG" },
  { id: "brigadista",           label: "Brigadista",                   icon: "🧯", regLabel: "Nº do Registro Profissional", tipo: "REG" },
  { id: "policial",             label: "Policial / Segurança Pública", icon: "👮", regLabel: "Nº do Registro Profissional", tipo: "REG" },
];

const UFS = ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"];

function AddrField({ label, placeholder, inputMode, value, onChange, error, errorMsg, style, inputSt, labelSt }) {
  return (
    <div style={style}>
      <label style={{ ...labelSt, color: error ? "var(--accent)" : "var(--text-secondary)" }}>
        {label}{error && " *"}
      </label>
      <input
        type="text"
        inputMode={inputMode}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        style={{ ...inputSt, borderColor: error ? "var(--accent)" : "var(--border)" }}
      />
      {error && <p style={{ fontSize: 12, color: "var(--accent)", marginTop: 5 }}>{errorMsg}</p>}
    </div>
  );
}

function validateRegistroFormat(registro, tipo) {
  const clean = registro.trim();
  if (clean.length < 4) return false;
  if (tipo === "CRM") return /^\d{4,7}$/.test(clean);
  if (tipo === "COREN") return /^\d{4,9}$/.test(clean);
  if (tipo === "CREA") return /^\d{5,9}$/.test(clean);
  return clean.length >= 4;
}

function maskCEP(v) {
  const d = v.replace(/\D/g, "").slice(0, 8);
  return d.length > 5 ? d.slice(0, 5) + "-" + d.slice(5) : d;
}

export default function Step2Professional({ userData, onNext }) {
  const [profissao, setProfissao]   = useState("");
  const [registro,  setRegistro]    = useState("");
  const [uf,        setUf]          = useState("SP");
  const [validated, setValidated]   = useState(false);
  const [fmtError,  setFmtError]    = useState(null);

  const [cep,    setCep]    = useState("");
  const [rua,    setRua]    = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");

  const [showAddrErr,  setShowAddrErr]  = useState(false);
  const [submitting,   setSubmitting]   = useState(false);
  const [submitError,  setSubmitError]  = useState(null);

  const prof     = PROFISSOES.find(p => p.id === profissao);
  const isMedico = prof?.tipo === "CRM";

  const addressComplete =
    cep.replace(/\D/g, "").length === 8 &&
    rua.trim().length >= 3 &&
    numero.trim().length >= 1 &&
    bairro.trim().length >= 2 &&
    cidade.trim().length >= 2;

  function handleRegistroChange(v) {
    setRegistro(v.replace(/[^A-Za-z0-9\-.]/g, ""));
    setValidated(false);
    setFmtError(null);
  }

  function handleValidate() {
    if (!prof) return;
    if (!validateRegistroFormat(registro, prof.tipo)) {
      setFmtError("Formato de registro inválido para esta categoria.");
      return;
    }
    setFmtError(null);
    setValidated(true);
  }

  async function handleConfirm() {
    if (!prof || submitting) return;
    if (!addressComplete) { setShowAddrErr(true); return; }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(`${BASE}/especialistas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: userData.nome,
          cpf: userData.cpf,
          telefone: userData.telefone,
          email: userData.email,
          profissao: prof.label,
          numeroRegistro: `${prof.tipo === "CRM" ? `CRM/${uf}` : prof.tipo} ${registro}`,
          uf,
          rua: rua.trim(),
          numero: numero.trim(),
          bairro: bairro.trim(),
          cidade: cidade.trim(),
          cep,
        }),
      });
      if (!res.ok) throw new Error("Erro ao enviar cadastro.");
      const data = await res.json();
      sessionStorage.setItem("pird_registro_id", String(data.id));
      onNext();
    } catch (err) {
      setSubmitError(err.message || "Erro de conexão com o servidor.");
    } finally {
      setSubmitting(false);
    }
  }

  const canValidate = !!profissao && registro.length >= 4 && !validated;
  const canConfirm  = validated && addressComplete;

  const inputSt  = { width: "100%", padding: "12px 14px", background: "var(--bg-surface)", border: "1.5px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontSize: 15, outline: "none", boxSizing: "border-box" };
  const selectSt = { ...inputSt, cursor: "pointer" };
  const labelSt  = { display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 };

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg-base)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 20px", overflowY: "auto" }}>
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 4 }}>
          <img src="/resources/logo.png" alt="PIRD" style={{ width: 40, height: 40, objectFit: "contain" }} />
          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, color: "var(--accent)", letterSpacing: "0.1em" }}>PIRD</span>
        </div>
      </div>

      <div style={{ width: "100%", maxWidth: 440, marginBottom: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: "var(--accent)", fontWeight: 700, letterSpacing: "0.1em" }}>ETAPA 2 DE 2</span>
          <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Atuação Profissional</span>
        </div>
        <div style={{ height: 3, background: "var(--bg-elevated)", borderRadius: 2, overflow: "hidden" }}>
          <div style={{ height: "100%", width: "100%", background: "var(--accent)", borderRadius: 2 }} />
        </div>
      </div>

      <div style={{ width: "100%", maxWidth: 440, background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 16, padding: "28px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
            Atuação Profissional
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            Olá, <strong style={{ color: "var(--text-primary)" }}>{userData.nome.split(" ")[0]}</strong>. Selecione sua área de atuação.
          </p>
        </div>

        <div>
          <label style={labelSt}>Qual sua atuação?</label>
          <select value={profissao} onChange={e => { setProfissao(e.target.value); setValidated(false); setFmtError(null); }} style={selectSt}>
            <option value="">— Selecione —</option>
            {PROFISSOES.map(p => <option key={p.id} value={p.id}>{p.icon} {p.label}</option>)}
          </select>
        </div>

        {prof && (
          <div>
            <label style={labelSt}>{prof.regLabel}</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input type="text" placeholder={isMedico ? "123456" : "Nº do registro"} value={registro}
                onChange={e => handleRegistroChange(e.target.value)}
                style={{ ...inputSt, flex: 1, borderColor: fmtError ? "var(--accent)" : "var(--border)" }} />
              {isMedico && (
                <select value={uf} onChange={e => setUf(e.target.value)} style={{ ...selectSt, width: 80 }}>
                  {UFS.map(u => <option key={u}>{u}</option>)}
                </select>
              )}
            </div>
            {fmtError && <p style={{ fontSize: 12, color: "var(--accent)", marginTop: 5 }}>{fmtError}</p>}
          </div>
        )}

        {prof && !validated && (
          <button onClick={handleValidate} disabled={!canValidate}
            style={{
              padding: "12px", borderRadius: 8,
              border: `1px solid ${canValidate ? "var(--border-accent)" : "var(--border)"}`,
              background: canValidate ? "rgba(255,107,26,0.1)" : "transparent",
              color: canValidate ? "var(--accent)" : "var(--text-muted)",
              fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700,
              cursor: canValidate ? "pointer" : "not-allowed", letterSpacing: "0.08em",
            }}
          >
            Validar Registro
          </button>
        )}

        {validated && (
          <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 10, padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span>✅</span>
              <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700, color: "#22c55e" }}>Formato verificado</span>
            </div>
            <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              Número com formato válido. Um administrador da Defesa Civil fará a validação manual antes de liberar seu acesso.
            </p>
          </div>
        )}

        {validated && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ height: 1, background: "var(--border)" }} />
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", letterSpacing: "0.1em", textTransform: "uppercase", margin: 0 }}>
              Endereço residencial
            </p>

            <div style={{ display: "flex", gap: 12 }}>
              <AddrField
                label="CEP" placeholder="00000-000" inputMode="numeric"
                value={cep} onChange={e => { setCep(maskCEP(e.target.value)); setShowAddrErr(false); }}
                error={showAddrErr && cep.replace(/\D/g,"").length !== 8} errorMsg="CEP obrigatório (8 dígitos)."
                style={{ flex: "0 0 140px" }} inputSt={inputSt} labelSt={labelSt}
              />
              <AddrField
                label="Cidade" placeholder="São Paulo"
                value={cidade} onChange={e => { setCidade(e.target.value); setShowAddrErr(false); }}
                error={showAddrErr && cidade.trim().length < 2} errorMsg="Cidade obrigatória."
                style={{ flex: 1 }} inputSt={inputSt} labelSt={labelSt}
              />
            </div>

            <AddrField
              label="Rua / Avenida" placeholder="Rua das Flores"
              value={rua} onChange={e => { setRua(e.target.value); setShowAddrErr(false); }}
              error={showAddrErr && rua.trim().length < 3} errorMsg="Rua obrigatória."
              inputSt={inputSt} labelSt={labelSt}
            />

            <div style={{ display: "flex", gap: 12 }}>
              <AddrField
                label="Número" placeholder="123"
                value={numero} onChange={e => { setNumero(e.target.value); setShowAddrErr(false); }}
                error={showAddrErr && numero.trim().length < 1} errorMsg="Obrigatório."
                style={{ flex: "0 0 100px" }} inputSt={inputSt} labelSt={labelSt}
              />
              <AddrField
                label="Bairro" placeholder="Centro"
                value={bairro} onChange={e => { setBairro(e.target.value); setShowAddrErr(false); }}
                error={showAddrErr && bairro.trim().length < 2} errorMsg="Bairro obrigatório."
                style={{ flex: 1 }} inputSt={inputSt} labelSt={labelSt}
              />
            </div>
          </div>
        )}

        {submitError && (
          <div style={{ background: "rgba(255,59,59,0.08)", border: "1px solid rgba(255,59,59,0.25)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#ef4444" }}>
            {submitError}
          </div>
        )}

        {validated && (
          <button onClick={handleConfirm} disabled={!canConfirm || submitting}
            style={{
              padding: "14px", borderRadius: 10, border: "none",
              background: canConfirm && !submitting ? "var(--accent)" : "var(--bg-hover)",
              color: canConfirm && !submitting ? "#fff" : "var(--text-muted)",
              fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700,
              cursor: canConfirm && !submitting ? "pointer" : "not-allowed", letterSpacing: "0.08em",
            }}
          >
            {submitting ? "Enviando..." : "✓ Enviar para Validação"}
          </button>
        )}
      </div>
    </div>
  );
}
