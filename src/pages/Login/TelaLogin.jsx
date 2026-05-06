import {Link} from "react-router-dom";
export default function TelaLogin({ onLogin }) {

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
        <h1 style={{ fontSize: 52, fontWeight: 900, color: "#f1f5f9", margin: 0, letterSpacing: -2, lineHeight: 1, fontFamily: "'Courier New', monospace" }}>PIRD</h1>
        <div style={{ fontSize: 11, color: "#334155", marginTop: 8, letterSpacing: 3, fontFamily: "monospace" }}>PLATAFORMA INTEGRADA DE RESPOSTA A DESASTRES</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center", marginTop: 16 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", animation: "blink 1s infinite" }} />
          <span style={{ fontSize: 12, color: "#ef4444", fontFamily: "monospace" }}>3 EVENTOS ATIVOS EM TAUBATÉ</span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 16 }}>
        {[
          { id: "defesa", icon: "🛡️", label: "Defesa Civil", desc: "Painel de comando e controle", cor: "#ef4444" },
          { id: "usuario", icon: "👤", label: "Cidadão", desc: "Doe, voluntarie-se ou reporte riscos", cor: "#0ea5e9" },
        ].map(p => (
          <button
            key={p.id}
            onClick={() => onLogin(p.id)}
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
      
      <Link to="/form" style={{
        marginTop: 32,
        color: "#5992C4",
        fontSize: 13,
        fontFamily: "monospace",
        textDecoration: "none",
        letterSpacing: 1,
      }}>
        Quero fazer uma doação →
      </Link>

      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    </div>
  );
  
}
