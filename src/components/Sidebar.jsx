import { mockEvents, } from "../data/events";
import { mockDemands } from "../data/demands";
import { mockVolunteers } from "../data/volunteers";

export default function Sidebar({ active, setActive, perfil }) {
  const defesaItems = [
    { id: "dashboard", icon: "▦", label: "Dashboard" },
    { id: "ocorrencias", icon: "◈", label: "Ocorrências" },
    { id: "pontos", icon: "◉", label: "Pontos de Coleta" },
    { id: "portal", icon: "◐", label: "Portal Doador" },
  ];
  const usuarioItems = [
    { id: "dashboard", icon: "▦", label: "Dashboard" },
    { id: "pontos", icon: "◉", label: "Pontos de Coleta" },
    { id: "ocorrencias", icon: "◈", label: "Ocorrências" },
    { id: "portal", icon: "◑", label: "Quero Ajudar" },
  ];
  const items = perfil === "defesa" ? defesaItems : usuarioItems;
  const accentColor = perfil === "defesa" ? "#ff3b3b" : "#0ea5e9";

  return (
    <aside style={{
      background: "#080f1a",
      borderRight: "1px solid #0f2040",
      width: 220,
      minHeight: "100vh",
      flexShrink: 0,
      display: "flex",
      flexDirection: "column",
    }}>
      <div style={{ padding: "24px 20px 18px", borderBottom: "1px solid #0f2040" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8,
            background: `linear-gradient(135deg, ${accentColor}, ${accentColor}88)`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
          }}>⬡</div>
          <div>
            <div style={{ fontFamily: "'Courier New', monospace", fontWeight: 700, fontSize: 15, color: "#e2e8f0", letterSpacing: 1 }}>PIRD</div>
            <div style={{ fontSize: 9, color: "#475569", letterSpacing: 2, textTransform: "uppercase" }}>Taubaté · SP</div>
          </div>
        </div>
        <div style={{ background: `${accentColor}15`, border: `1px solid ${accentColor}30`, borderRadius: 8, padding: "6px 10px" }}>
          <div style={{ fontSize: 9, color: accentColor, fontWeight: 700, letterSpacing: 1 }}>
            {perfil === "defesa" ? "🛡️ DEFESA CIVIL" : "👤 CIDADÃO"}
          </div>
        </div>
      </div>

      <nav style={{ padding: "12px 10px", flex: 1 }}>
        {items.map(item => (
          <button
            key={item.id}
            onClick={() => setActive(item.id)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              marginBottom: 2,
              transition: "all 0.15s",
              background: active === item.id ? `${accentColor}15` : "transparent",
              borderLeft: active === item.id ? `2px solid ${accentColor}` : "2px solid transparent",
              color: active === item.id ? "#e2e8f0" : "#475569",
              fontSize: 13,
              fontWeight: active === item.id ? 600 : 400,
              textAlign: "left",
            }}
          >
            <span style={{ fontSize: 15, color: active === item.id ? accentColor : "#334155" }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div style={{ padding: "0 14px 20px" }}>
        <div style={{ background: "#0f1f35", borderRadius: 10, padding: "12px 14px", border: "1px solid #1e3a5f" }}>
          <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
            {[
              { v: mockEvents.length, l: "E.A", c: "#ef4444" },
              { v: mockDemands.filter(d => d.priority >= 4).length, l: "D.U", c: "#f97316" },
              { v: mockVolunteers.filter(v => v.available).length, l: "V.A", c: "#10b981" },
            ].map(k => (
              <div key={k.l} style={{ textAlign: "center", flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: k.c, fontFamily: "monospace" }}>{k.v}</div>
                <div style={{ fontSize: 8, color: "#475569", letterSpacing: 1 }}>{k.l}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 10, color: "#334155", textAlign: "center" }}>Defesa Civil: 199</div>
        </div>
      </div>
    </aside>
  );
}
