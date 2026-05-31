import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { validateCPF, maskCPF, validatePhone, maskPhone, validateName } from "../../utils/cpfValidator";

function validateEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

export default function Step1Identity({ onNext }) {
  const navigate = useNavigate();
  const [nome,  setNome]  = useState({ value: "", touched: false, valid: null });
  const [cpf,   setCpf]   = useState({ value: "", touched: false, valid: null });
  const [tel,   setTel]   = useState({ value: "", touched: false, valid: null });
  const [email, setEmail] = useState({ value: "", touched: false, valid: null });

  const allValid = nome.valid === true && cpf.valid === true && tel.valid === true && email.valid === true;

  function handleNome(v) {
    setNome({ value: v, touched: true, valid: validateName(v) });
  }
  function handleCpf(v) {
    const masked = maskCPF(v);
    setCpf({ value: masked, touched: true, valid: masked.length === 14 ? validateCPF(masked) : false });
  }
  function handleTel(v) {
    const masked = maskPhone(v);
    setTel({ value: masked, touched: true, valid: validatePhone(masked) });
  }
  function handleEmail(v) {
    setEmail({ value: v, touched: true, valid: validateEmail(v) });
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!allValid) {
      // Reveal errors on all fields the user hasn't touched yet
      setNome(f => ({ ...f, touched: true, valid: validateName(f.value) }));
      setCpf(f => ({ ...f, touched: true, valid: f.value.length === 14 ? validateCPF(f.value) : false }));
      setTel(f => ({ ...f, touched: true, valid: validatePhone(f.value) }));
      setEmail(f => ({ ...f, touched: true, valid: validateEmail(f.value) }));
      return;
    }
    onNext({ nome: nome.value.trim(), cpf: cpf.value, telefone: tel.value, email: email.value.trim() });
  }

  return (
    <div className="dot-bg" style={{ minHeight: "100dvh", backgroundColor: "var(--bg-base)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 20px" }}>
      <div style={{ marginBottom: 40, textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 8 }}>
          <img src="/resources/logo.png" alt="BASE" style={{ width: 48, height: 48, objectFit: "contain", borderRadius: 10 }} />
          <span style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800, color: "var(--accent)", letterSpacing: "0.1em" }}>BASE</span>
        </div>
        <p style={{ color: "var(--text-secondary)", fontSize: 12, letterSpacing: "0.15em", textTransform: "uppercase" }}>
          Cadastro de Especialista
        </p>
      </div>

      <div style={{ width: "100%", maxWidth: 420, marginBottom: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: "var(--accent)", fontWeight: 700, letterSpacing: "0.1em" }}>ETAPA 1 DE 2</span>
          <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Identificação Pessoal</span>
        </div>
        <div style={{ height: 3, background: "var(--bg-elevated)", borderRadius: 2, overflow: "hidden" }}>
          <div style={{ height: "100%", width: "50%", background: "var(--accent)", borderRadius: 2, transition: "width 0.5s ease" }} />
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ width: "100%", maxWidth: 420, background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 16, padding: "32px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
            Identificação Pessoal
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            Preencha seus dados para cadastro na plataforma BASE.
          </p>
        </div>

        <Field label="Nome completo" placeholder="João Silva" value={nome.value}
          onChange={e => handleNome(e.target.value)} valid={nome.touched ? nome.valid : null}
          errorMsg="Mínimo 2 caracteres, sem números ou símbolos." />

        <Field label="CPF" placeholder="000.000.000-00" inputMode="numeric" value={cpf.value}
          onChange={e => handleCpf(e.target.value)} valid={cpf.touched ? cpf.valid : null}
          errorMsg="CPF inválido." />

        <Field label="Telefone" placeholder="(11) 99999-9999" inputMode="numeric" value={tel.value}
          onChange={e => handleTel(e.target.value)} valid={tel.touched ? tel.valid : null}
          errorMsg="DDD inválido ou número incorreto." />

        <Field label="E-mail" placeholder="seu@email.com" value={email.value}
          onChange={e => handleEmail(e.target.value)} valid={email.touched ? email.valid : null}
          errorMsg="E-mail inválido." />

        <button
          type="submit"
          style={{
            marginTop: 8, padding: "14px", borderRadius: 10, border: "none",
            background: allValid ? "var(--accent)" : "var(--bg-hover)",
            color: allValid ? "#fff" : "var(--text-muted)",
            fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 700,
            letterSpacing: "0.08em", cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          Próximo →
        </button>
        <button
          onClick={() => navigate("/login")}
          style={{ marginTop: 16, background: "none", border: "none", color: "var(--text-muted)", fontSize: 12, textAlign: "left", cursor: "pointer", fontFamily: "monospace", letterSpacing: "0.04em", padding: 0 }}
          onMouseEnter={e => e.currentTarget.style.color = "var(--text-secondary)"}
          onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
        >
          ← Voltar à tela inicial
        </button>
      </form>
    </div>
  );
}

function Field({ label, placeholder, inputMode, value, onChange, valid, errorMsg }) {
  const borderColor = valid === true ? "#22c55e" : valid === false ? "var(--accent)" : "var(--border)";
  const iconColor   = valid === true ? "#22c55e" : "var(--accent)";

  return (
    <div>
      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: valid === false ? "var(--accent)" : "var(--text-secondary)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
        {label}{valid === false && " *"}
      </label>
      <div style={{ position: "relative" }}>
        <input
          type="text"
          inputMode={inputMode}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          style={{
            width: "100%", padding: "12px 40px 12px 14px",
            background: "var(--bg-surface)",
            border: `1.5px solid ${borderColor}`,
            borderRadius: 8, color: "var(--text-primary)",
            fontSize: 15, outline: "none",
            transition: "border-color 0.2s ease",
            boxSizing: "border-box",
          }}
        />
        {valid !== null && (
          <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: iconColor, fontSize: 16, fontWeight: 700 }}>
            {valid ? "✓" : "✗"}
          </span>
        )}
      </div>
      {valid === false && (
        <p style={{ fontSize: 12, color: "var(--accent)", marginTop: 5 }}>{errorMsg}</p>
      )}
    </div>
  );
}
