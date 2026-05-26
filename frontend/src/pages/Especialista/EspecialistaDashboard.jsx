import { useState, useEffect } from "react";

const BASE = "http://localhost:8080";
const TOKEN_KEY = "pird_especialista_token";
const USER_KEY  = "pird_especialista_user";

const STATUS_LABEL = { pendente: "Aguardando resposta", aceita: "Aceita", recusada: "Recusada" };
const STATUS_COLOR = { pendente: "#f59e0b", aceita: "#22c55e", recusada: "#ef4444" };

const SEV_COLOR = {
  moderado: "#22c55e", medio: "#22c55e",
  alto: "#f59e0b",     grave: "#f59e0b",
  critico: "#ef4444",
};

export default function EspecialistaDashboard() {
  const [token,     setToken]     = useState(() => sessionStorage.getItem(TOKEN_KEY));
  const [user,      setUser]      = useState(() => { try { return JSON.parse(sessionStorage.getItem(USER_KEY)); } catch { return null; } });
  const [convs,     setConvs]     = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [fetchErr,  setFetchErr]  = useState(null);

  const [email,     setEmail]     = useState("");
  const [senha,     setSenha]     = useState("");
  const [loginErr,  setLoginErr]  = useState(null);
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    if (token) fetchConvs();
  }, [token]);

  async function fetchConvs() {
    setLoading(true);
    setFetchErr(null);
    try {
      const res = await fetch(`${BASE}/convocacoes/minhas`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { handleLogout(); return; }
      if (!res.ok) throw new Error("Erro ao carregar convocações.");
      setConvs(await res.json());
    } catch (err) {
      setFetchErr(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoggingIn(true);
    setLoginErr(null);
    try {
      const res = await fetch(`${BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });
      if (!res.ok) {
        setLoginErr("E-mail ou senha inválidos.");
        return;
      }
      const data = await res.json();
      sessionStorage.setItem(TOKEN_KEY, data.token);
      sessionStorage.setItem(USER_KEY, JSON.stringify({ nome: data.nome, email: data.email }));
      setToken(data.token);
      setUser({ nome: data.nome, email: data.email });
    } catch {
      setLoginErr("Erro de conexão com o servidor.");
    } finally {
      setLoggingIn(false);
    }
  }

  function handleLogout() {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    setConvs([]);
  }

  async function handleResponder(id, acao) {
    try {
      const res = await fetch(`${BASE}/convocacoes/${id}/${acao}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      setConvs(prev => prev.map(c => c.id === id ? { ...c, status: acao === "aceitar" ? "aceita" : "recusada" } : c));
    } catch {
      alert("Erro ao responder à convocação.");
    }
  }

  if (!token) return <LoginScreen email={email} setEmail={setEmail} senha={senha} setSenha={setSenha} onSubmit={handleLogin} loading={loggingIn} error={loginErr} />;

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg-base)", padding: "32px 20px" }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img src="/resources/logo.png" alt="PIRD" style={{ width: 36, height: 36, objectFit: "contain" }} />
            <div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, color: "var(--accent)" }}>PIRD</div>
              <div style={{ fontSize: 11, color: "var(--text-secondary)", letterSpacing: "0.1em" }}>PAINEL DO ESPECIALISTA</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              Olá, <strong style={{ color: "var(--text-primary)" }}>{user?.nome?.split(" ")[0]}</strong>
            </span>
            <button onClick={handleLogout}
              style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", fontSize: 12, cursor: "pointer" }}>
              Sair
            </button>
          </div>
        </div>

        {/* Convocações */}
        <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 16, padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 17, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
              Minhas Convocações
            </h2>
            <button onClick={fetchConvs} disabled={loading}
              style={{ padding: "6px 12px", borderRadius: 7, border: "1px solid var(--border)", background: "transparent", color: "var(--accent)", fontSize: 12, cursor: loading ? "not-allowed" : "pointer" }}>
              {loading ? "..." : "↺ Atualizar"}
            </button>
          </div>

          {fetchErr && (
            <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#ef4444", marginBottom: 16 }}>
              {fetchErr}
            </div>
          )}

          {!loading && convs.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)", fontSize: 14 }}>
              Nenhuma convocação no momento.
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {convs.map(c => (
              <ConvCard key={c.id} c={c} onResponder={handleResponder} />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

function ConvCard({ c, onResponder }) {
  const sevColor = SEV_COLOR[c.eventoSeveridade?.toLowerCase()] ?? "#94a3b8";
  const stColor  = STATUS_COLOR[c.status] ?? "#94a3b8";

  return (
    <div style={{ background: "var(--bg-surface)", border: `1px solid var(--border)`, borderLeft: `4px solid ${sevColor}`, borderRadius: 10, padding: "16px 18px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
        <div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>
            {c.eventoTitulo}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            {c.eventoTipo} · <span style={{ color: sevColor, fontWeight: 600 }}>{c.eventoSeveridade}</span>
          </div>
          {c.eventoEndereco && (
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>📍 {c.eventoEndereco}</div>
          )}
        </div>
        <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, background: `${stColor}18`, color: stColor, letterSpacing: "0.05em" }}>
          {STATUS_LABEL[c.status] ?? c.status}
        </span>
      </div>

      <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: c.status === "pendente" ? 12 : 0 }}>
        Convocado em {new Date(c.convocadoEm).toLocaleString("pt-BR")}
        {c.respondidoEm && ` · Respondido em ${new Date(c.respondidoEm).toLocaleString("pt-BR")}`}
      </div>

      {c.status === "pendente" && (
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => onResponder(c.id, "aceitar")}
            style={{ flex: 1, padding: "10px", borderRadius: 8, border: "none", background: "rgba(34,197,94,0.12)", color: "#22c55e", fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            ✓ Aceitar
          </button>
          <button onClick={() => onResponder(c.id, "recusar")}
            style={{ flex: 1, padding: "10px", borderRadius: 8, border: "none", background: "rgba(239,68,68,0.10)", color: "#ef4444", fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            ✗ Recusar
          </button>
        </div>
      )}
    </div>
  );
}

function LoginScreen({ email, setEmail, senha, setSenha, onSubmit, loading, error }) {
  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg-base)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 20px" }}>
      <div style={{ marginBottom: 40, textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 8 }}>
          <img src="/resources/logo.png" alt="PIRD" style={{ width: 48, height: 48, objectFit: "contain" }} />
          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: "var(--accent)", letterSpacing: "0.1em" }}>PIRD</span>
        </div>
        <p style={{ color: "var(--text-secondary)", fontSize: 12, letterSpacing: "0.15em", textTransform: "uppercase" }}>
          Painel do Especialista
        </p>
      </div>

      <form onSubmit={onSubmit} style={{ width: "100%", maxWidth: 380, background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 16, padding: "32px 28px", display: "flex", flexDirection: "column", gap: 18 }}>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
          Entrar
        </h2>

        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>E-mail</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required
            style={{ width: "100%", padding: "12px 14px", background: "var(--bg-surface)", border: "1.5px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontSize: 15, outline: "none", boxSizing: "border-box" }} />
        </div>

        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Senha</label>
          <input type="password" value={senha} onChange={e => setSenha(e.target.value)} placeholder="••••••••" required
            style={{ width: "100%", padding: "12px 14px", background: "var(--bg-surface)", border: "1.5px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontSize: 15, outline: "none", boxSizing: "border-box" }} />
        </div>

        {error && (
          <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#ef4444" }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={loading}
          style={{ marginTop: 4, padding: "14px", borderRadius: 10, border: "none", background: loading ? "var(--bg-hover)" : "var(--accent)", color: loading ? "var(--text-muted)" : "#fff", fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", letterSpacing: "0.08em" }}>
          {loading ? "Entrando..." : "Entrar →"}
        </button>
      </form>
    </div>
  );
}
