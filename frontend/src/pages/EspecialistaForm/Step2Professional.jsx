import { useState, useRef } from "react";
import { useGeocodingAutocomplete } from "../../hooks/useGeocodingAutocomplete.js";

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
  { id: "tec-resgate",          label: "Técnico em Resgate",           icon: "🔧", regLabel: "Nº do Registro Profissional", tipo: "REG" },
  { id: "eng-seguranca",        label: "Engenheiro de Segurança",      icon: "🏗️", regLabel: "Nº do CREA",                 tipo: "CREA" },
  { id: "guia-cao",             label: "Guia de Cão de Resgate",       icon: "🐕", regLabel: "Nº do Registro Profissional", tipo: "REG" },
  { id: "defesa-civil",         label: "Técnico Defesa Civil",         icon: "⚡", regLabel: "Nº do Registro Profissional", tipo: "REG" },
  { id: "mergulhador",          label: "Mergulhador de Resgate",       icon: "🤿", regLabel: "Nº do Registro Profissional", tipo: "REG" },
  { id: "psicologo",            label: "Psicólogo",                    icon: "🧩", regLabel: "Nº do CRP",                  tipo: "REG" },
  { id: "assistente-social",    label: "Assistente Social",            icon: "🤝", regLabel: "Nº do CRESS",                tipo: "REG" },
];

const UFS = ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"];

// ── Validação por tipo de registro ────────────────────────────────────────────

const REGISTRO_HINTS = {
  CRM:   "4 a 7 dígitos numéricos. Ex: 123456",
  COREN: "UF-XXX.XXX (ex: SP-123.456) ou 5 a 9 dígitos numéricos.",
  CREA:  "5 a 9 dígitos numéricos. Ex: 012345678",
  REG:   "4 a 15 caracteres alfanuméricos.",
};

function validateRegistroFormat(registro, tipo) {
  const v = registro.trim();
  switch (tipo) {
    case "CRM":
      if (/^\d{4,7}$/.test(v)) return { valid: true };
      return { valid: false, message: `CRM deve ter entre 4 e 7 dígitos numéricos. Ex: 123456` };
    case "COREN":
      if (/^[A-Z]{2}-\d{3}\.\d{3}$/.test(v) || /^\d{5,9}$/.test(v)) return { valid: true };
      return { valid: false, message: `COREN inválido. Use UF-XXX.XXX (ex: SP-123.456) ou 5–9 dígitos numéricos.` };
    case "CREA":
      if (/^\d{5,9}$/.test(v)) return { valid: true };
      return { valid: false, message: `CREA deve ter entre 5 e 9 dígitos numéricos.` };
    default: // REG
      if (v.length >= 4 && v.length <= 15) return { valid: true };
      return { valid: false, message: `Registro deve ter entre 4 e 15 caracteres.` };
  }
}

function maskCEP(v) {
  const d = v.replace(/\D/g, "").slice(0, 8);
  return d.length > 5 ? d.slice(0, 5) + "-" + d.slice(5) : d;
}

// ── Campo de endereço genérico ─────────────────────────────────────────────────

function AddrField({ label, placeholder, inputMode, value, onChange, error, errorMsg, style, inputSt, labelSt, children }) {
  return (
    <div style={style}>
      <label style={{ ...labelSt, color: error ? "var(--accent)" : "var(--text-secondary)" }}>
        {label}{error && " *"}
      </label>
      {children ?? (
        <input type="text" inputMode={inputMode} placeholder={placeholder} value={value} onChange={onChange}
          style={{ ...inputSt, borderColor: error ? "var(--accent)" : "var(--border)" }} />
      )}
      {error && <p style={{ fontSize: 12, color: "var(--accent)", marginTop: 5 }}>{errorMsg}</p>}
    </div>
  );
}

// ── Campo de rua com autocomplete ─────────────────────────────────────────────

function RuaField({ value, onChange, onSelect, error, inputSt, labelSt, showAddrErr }) {
  const [focused,   setFocused]   = useState(false);
  const [queryOn,   setQueryOn]   = useState(false);
  const { sugestoes, carregando } = useGeocodingAutocomplete(queryOn && value.length >= 3 ? value : "");

  function handleChange(e) {
    onChange(e.target.value);
    setQueryOn(true);
  }

  function handleSelect(sug) {
    // Extract just the street part (before first comma)
    const rua = sug.shortName || sug.placeName.split(",")[0];
    onSelect(rua);
    setQueryOn(false);
    setFocused(false);
  }

  const showDrop = focused && queryOn && sugestoes.length > 0;

  return (
    <div style={{ position: "relative" }}>
      <label style={{ ...labelSt, color: error ? "var(--accent)" : "var(--text-secondary)" }}>
        Rua / Avenida{error && " *"}
      </label>
      <div style={{ position: "relative" }}>
        <input
          type="text"
          placeholder="Rua das Flores"
          value={value}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          style={{ ...inputSt, borderColor: error ? "var(--accent)" : "var(--border)" }}
        />
        {carregando && (
          <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "var(--text-muted)" }}>…</span>
        )}
      </div>
      {showDrop && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, zIndex: 50, boxShadow: "0 8px 24px rgba(0,0,0,0.15)", overflow: "hidden" }}>
          {sugestoes.map(s => (
            <div key={s.id} onMouseDown={() => handleSelect(s)}
              style={{ padding: "9px 14px", cursor: "pointer", borderBottom: "1px solid var(--border)", fontSize: 13, color: "var(--text-primary)" }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--bg-hover)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <div style={{ fontWeight: 600 }}>{s.shortName}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{s.placeName}</div>
            </div>
          ))}
        </div>
      )}
      {error && <p style={{ fontSize: 12, color: "var(--accent)", marginTop: 5 }}>Rua obrigatória.</p>}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function Step2Professional({ userData, onNext }) {
  const [profissao, setProfissao] = useState("");
  const [registro,  setRegistro]  = useState("");
  const [uf,        setUf]        = useState("SP");
  const [validated, setValidated] = useState(false);
  const [fmtError,  setFmtError]  = useState(null);

  const [cep,       setCep]       = useState("");
  const [cepStatus, setCepStatus] = useState(null); // null | "loading" | "ok" | "error"
  const [rua,       setRua]       = useState("");
  const [numero,    setNumero]    = useState("");
  const [bairro,    setBairro]    = useState("");
  const [cidade,    setCidade]    = useState("");

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

  // ── CEP lookup via ViaCEP ──────────────────────────────────────────────────
  async function lookupCEP(raw) {
    const digits = raw.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setCepStatus("loading");
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (data.erro) { setCepStatus("error"); return; }
      setRua(data.logradouro || "");
      setBairro(data.bairro || "");
      setCidade(data.localidade || "");
      setCepStatus("ok");
    } catch {
      setCepStatus("error");
    }
  }

  function handleCepChange(v) {
    const masked = maskCEP(v);
    setCep(masked);
    setCepStatus(null);
    setShowAddrErr(false);
    if (masked.replace(/\D/g, "").length === 8) lookupCEP(masked);
  }

  // ── Registro ───────────────────────────────────────────────────────────────
  function handleRegistroChange(v) {
    setRegistro(v.replace(/[^A-Za-z0-9\-.]/g, ""));
    setValidated(false);
    setFmtError(null);
  }

  function handleValidate() {
    if (!prof) return;
    const result = validateRegistroFormat(registro, prof.tipo);
    if (!result.valid) { setFmtError(result.message); return; }
    setFmtError(null);
    setValidated(true);
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
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

        {/* Profissão */}
        <div>
          <label style={labelSt}>Qual sua atuação?</label>
          <select value={profissao} onChange={e => { setProfissao(e.target.value); setValidated(false); setFmtError(null); setRegistro(""); }} style={selectSt}>
            <option value="">— Selecione —</option>
            {PROFISSOES.map(p => <option key={p.id} value={p.id}>{p.icon} {p.label}</option>)}
          </select>
        </div>

        {/* Registro */}
        {prof && (
          <div>
            <label style={labelSt}>{prof.regLabel}</label>
            {/* Format hint */}
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8, marginTop: -4 }}>
              Formato: {REGISTRO_HINTS[prof.tipo]}
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                placeholder={prof.tipo === "CRM" ? "123456" : "Nº do registro"}
                value={registro}
                onChange={e => handleRegistroChange(e.target.value)}
                style={{ ...inputSt, flex: 1, borderColor: fmtError ? "var(--accent)" : validated ? "#22c55e" : "var(--border)" }}
              />
              {isMedico && (
                <select value={uf} onChange={e => setUf(e.target.value)} style={{ ...selectSt, width: 80 }}>
                  {UFS.map(u => <option key={u}>{u}</option>)}
                </select>
              )}
            </div>
            {fmtError && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginTop: 6, background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 7, padding: "8px 10px" }}>
                <span style={{ fontSize: 14, flexShrink: 0 }}>⚠️</span>
                <p style={{ fontSize: 12, color: "var(--accent)", margin: 0 }}>{fmtError}</p>
              </div>
            )}
          </div>
        )}

        {/* Botão validar */}
        {prof && !validated && (
          <button onClick={handleValidate} disabled={!canValidate}
            style={{
              padding: "12px", borderRadius: 8,
              border: `1px solid ${canValidate ? "var(--border-accent)" : "var(--border)"}`,
              background: canValidate ? "rgba(255,107,26,0.1)" : "transparent",
              color: canValidate ? "var(--accent)" : "var(--text-muted)",
              fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700,
              cursor: canValidate ? "pointer" : "not-allowed", letterSpacing: "0.08em",
            }}>
            Validar Registro
          </button>
        )}

        {/* Validado */}
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

        {/* Endereço */}
        {validated && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ height: 1, background: "var(--border)" }} />
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", letterSpacing: "0.1em", textTransform: "uppercase", margin: 0 }}>
              Endereço residencial
            </p>

            {/* CEP + Cidade */}
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: "0 0 150px" }}>
                <label style={{ ...labelSt, color: (showAddrErr && cep.replace(/\D/g,"").length !== 8) ? "var(--accent)" : "var(--text-secondary)" }}>
                  CEP{(showAddrErr && cep.replace(/\D/g,"").length !== 8) && " *"}
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type="text" inputMode="numeric" placeholder="00000-000"
                    value={cep} onChange={e => handleCepChange(e.target.value)}
                    style={{ ...inputSt, borderColor: cepStatus === "error" ? "var(--accent)" : cepStatus === "ok" ? "#22c55e" : (showAddrErr && cep.replace(/\D/g,"").length !== 8) ? "var(--accent)" : "var(--border)" }}
                  />
                  {cepStatus === "loading" && (
                    <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "var(--text-muted)" }}>⟳</span>
                  )}
                  {cepStatus === "ok" && (
                    <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "#22c55e" }}>✓</span>
                  )}
                </div>
                {cepStatus === "error" && <p style={{ fontSize: 11, color: "var(--accent)", marginTop: 4 }}>CEP não encontrado.</p>}
                {(showAddrErr && cep.replace(/\D/g,"").length !== 8) && <p style={{ fontSize: 12, color: "var(--accent)", marginTop: 5 }}>CEP obrigatório.</p>}
              </div>
              <AddrField
                label="Cidade" placeholder="São Paulo"
                value={cidade} onChange={e => { setCidade(e.target.value); setShowAddrErr(false); }}
                error={showAddrErr && cidade.trim().length < 2} errorMsg="Cidade obrigatória."
                style={{ flex: 1 }} inputSt={inputSt} labelSt={labelSt}
              />
            </div>

            {/* Rua com autocomplete */}
            <RuaField
              value={rua}
              onChange={v => { setRua(v); setShowAddrErr(false); }}
              onSelect={v => { setRua(v); setShowAddrErr(false); }}
              error={showAddrErr && rua.trim().length < 3}
              inputSt={inputSt} labelSt={labelSt}
            />

            {/* Número + Bairro */}
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
            }}>
            {submitting ? "Enviando..." : "✓ Enviar para Validação"}
          </button>
        )}
      </div>
    </div>
  );
}
