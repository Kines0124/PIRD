import { Link, useNavigate } from "react-router-dom";
export default function TelaLogin({ onLogin }) {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: "100vh",
      background: "#050e1a",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Georgia', serif",
    }}>
      <div style={{
        position: "fixed", inset: 0,
        backgroundImage: "radial-gradient(ellipse at 20% 30%, #ef444406, transparent 50%), radial-gradient(ellipse at 80% 70%, #0ea5e906, transparent 50%)",
        pointerEvents: "none",
      }} />
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <div style={{ fontSize: 10, letterSpacing: 6, color: "#ef4444", fontFamily: "monospace", marginBottom: 12 }}>TAUBATÉ · SP</div>
        <h1 style={{ fontSize: 52, fontWeight: 900, color: "#f1f5f9", margin: 0, letterSpacing: -2, lineHeight: 1, fontFamily: "'Courier New', monospace" }}>BASE</h1>
        <div style={{ fontSize: 11, color: "#334155", marginTop: 8, letterSpacing: 3, fontFamily: "monospace" }}>PLATAFORMA INTEGRADA DE RESPOSTA A DESASTRES</div>
      </div>
      <div style={{ display: "flex", gap: 16 }}>
        {[
          { id: "defesa",       icon: "🛡️", label: "Defesa Civil",      desc: "Painel de comando e controle",    cor: "#ef4444" },
          { id: "especialista", icon: "⚕️", label: "Especialista",      desc: "Acesse seu painel e convocações", cor: "#10b981" },
          { id: "ponto",        icon: "📦", label: "Ponto de Coleta",   desc: "Gestão de estoque e doações",     cor: "#E8294C" },
        ].map(p => (
          <button
            key={p.id}
            onClick={() => {
              if (p.id === "especialista") navigate("/especialistas/painel");
              else if (p.id === "ponto") navigate("/pontos-coleta");
              else onLogin(p.id);
            }}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
              padding: "28px 36px", background: "#0a1628",
              border: `1px solid ${p.cor}20`, borderRadius: 18,
              cursor: "pointer", width: 200, transition: "all 0.2s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = `${p.cor}60`;
              e.currentTarget.style.background = "#0f1f35";
              e.currentTarget.style.transform = "translateY(-4px)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = `${p.cor}20`;
              e.currentTarget.style.background = "#0a1628";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div style={{
              width: 56, height: 56, borderRadius: 14,
              background: `${p.cor}15`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28,
            }}>{p.icon}</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0", fontFamily: "monospace", marginBottom: 4 }}>{p.label}</div>
              <div style={{ fontSize: 12, color: "#475569" }}>{p.desc}</div>
            </div>
          </button>
        ))}
      </div>
      
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginTop: 32 }}>
        <Link to="/form" style={{
          color: "#5992C4",
          fontSize: 13,
          fontFamily: "monospace",
          textDecoration: "none",
          letterSpacing: 1,
        }}>
          📦 Quero fazer uma doação →
        </Link>

        <Link to="/pontos-coleta/novo" style={{
          color: "#E8294C",
          fontSize: 13,
          fontFamily: "monospace",
          textDecoration: "none",
          letterSpacing: 1,
        }}>
          🏪 Sou responsável por um ponto de coleta →
        </Link>

        <Link to="/especialistas/cadastro" style={{
          color: "#10b981",
          fontSize: 13,
          fontFamily: "monospace",
          textDecoration: "none",
          letterSpacing: 1,
        }}>
          ⚕️ Sou especialista e quero me cadastrar →
        </Link>
      </div>

      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    </div>
  );
  
}
