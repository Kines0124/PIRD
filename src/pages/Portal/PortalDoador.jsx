import { useState } from "react";
import Tag from "../../components/Tag";
import { mockEvents } from "../../data/events";
import { mockDemands } from "../../data/demands";
import { mockPoints } from "../../data/points";
import { statusColor } from "../../constants/theme";
import { pct } from "../../utils/geo";

export default function PortalDoador() {
  const [tipo, setTipo] = useState(null);
  const [match, setMatch] = useState(null);

  function fazerMatch(t) {
    setTipo(t);
    const catMap = { "💧 Água": "Alimento", "🍱 Comida": "Alimento", "👕 Roupas": "Higiene", "🔧 Mão de Obra": "RH" };
    const cat = catMap[t];
    let melhor = null, maxPrio = 0;
    mockDemands.forEach(d => {
      if (d.category === cat && d.priority > maxPrio && pct(d.supplied, d.needed) < 80) {
        maxPrio = d.priority;
        melhor = mockEvents.find(e => e.id === d.event);
      }
    });
    setMatch(melhor || mockEvents[0]);
  }

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, color: "#0ea5e9", letterSpacing: 4, fontFamily: "monospace", marginBottom: 4 }}>PORTAL PÚBLICO</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#e2e8f0", fontFamily: "'Courier New', monospace", margin: 0 }}>Quero Ajudar</h1>
      </div>

      <div style={{ background: "#0f1f35", border: "1px solid #ef444430", borderRadius: 14, padding: "16px 20px", marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ fontSize: 22 }}>⚠️</div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#ef4444" }}>ZONA DE RISCO — NÃO SE APROXIME</div>
          <div style={{ fontSize: 12, color: "#94a3b8" }}>Estoril e Campos Elíseos — aguarde orientação da <strong style={{ color: "#ef4444" }}>Defesa Civil: 199</strong></div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Doe Itens */}
        <div style={{ background: "#0a1628", border: "1px solid #0f2040", borderRadius: 14, padding: 22 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0", marginBottom: 16 }}>📦 Quero Doar Itens</div>
          {!match ? (
            <div>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14 }}>Selecione o que você tem para oferecer:</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {["💧 Água", "🍱 Comida", "👕 Roupas", "🔧 Mão de Obra"].map(op => (
                  <button
                    key={op}
                    onClick={() => fazerMatch(op)}
                    style={{ background: "#050e1a", border: "1px solid #0f2040", borderRadius: 12, padding: "16px 10px", cursor: "pointer", textAlign: "center", transition: "all 0.2s" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#0ea5e940"; e.currentTarget.style.background = "#0a1628"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "#0f2040"; e.currentTarget.style.background = "#050e1a"; }}
                  >
                    <div style={{ fontSize: 26, marginBottom: 6 }}>{op.split(" ")[0]}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0" }}>{op.split(" ").slice(1).join(" ")}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <button onClick={() => { setMatch(null); setTipo(null); }} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 12, marginBottom: 14, padding: 0 }}>← Voltar</button>
              <div style={{ background: "#0f2040", border: "1px solid #0ea5e940", borderRadius: 12, padding: 16, marginBottom: 14, textAlign: "center" }}>
                <div style={{ fontSize: 10, color: "#0ea5e9", letterSpacing: 2, fontFamily: "monospace", marginBottom: 6 }}>✦ MELHOR DESTINO</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: "#f1f5f9", marginBottom: 4 }}>{match.title}</div>
                <Tag color={statusColor[match.status]}>{match.status}</Tag>
              </div>
              <div style={{ fontSize: 11, color: "#475569", letterSpacing: 2, fontFamily: "monospace", marginBottom: 8 }}>PONTOS DE COLETA</div>
              {mockPoints.filter(p => p.events.includes(match.id)).map(p => (
                <div key={p.id} style={{ padding: "8px 0", borderBottom: "1px solid #0f2040" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: "#475569" }}>📍 {p.address} · 📞 {p.contact}</div>
                </div>
              ))}
              <button style={{ width: "100%", marginTop: 12, padding: "12px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #0ea5e9, #2563eb)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                📍 VER ROTA NO MAPA
              </button>
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* O que mais precisa */}
          <div style={{ background: "#0a1628", border: "1px solid #0f2040", borderRadius: 14, padding: 22 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0", marginBottom: 14 }}>O que mais precisa agora</div>
            {mockDemands.filter(d => d.priority >= 4).map(d => (
              <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #0f2040" }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: d.priority >= 5 ? "#ef4444" : "#f97316", flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "#cbd5e1", flex: 1 }}>{d.item}</span>
                <Tag color={d.priority >= 5 ? "#ef4444" : "#f97316"}>{d.priority >= 5 ? "URGENTE" : "ALTO"}</Tag>
              </div>
            ))}
          </div>

          {/* Cadastro de voluntário */}
          <div style={{ background: "#0a1628", border: "1px solid #0f2040", borderRadius: 14, padding: 22 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0", marginBottom: 14 }}>🙋 Quero Ser Voluntário</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input placeholder="Seu nome completo" style={{ background: "#050e1a", border: "1px solid #0f2040", borderRadius: 8, padding: "10px 14px", color: "#94a3b8", fontSize: 13, outline: "none" }} />
              <select style={{ background: "#050e1a", border: "1px solid #0f2040", borderRadius: 8, padding: "10px 14px", color: "#94a3b8", fontSize: 13, outline: "none" }}>
                <option>Selecione sua especialidade</option>
                {["Médico/Enfermeiro", "Engenheiro", "Psicólogo", "Motorista", "Logística"].map(e => <option key={e}>{e}</option>)}
              </select>
              <input placeholder="Contato (WhatsApp)" style={{ background: "#050e1a", border: "1px solid #0f2040", borderRadius: 8, padding: "10px 14px", color: "#94a3b8", fontSize: 13, outline: "none" }} />
              <button style={{ background: "linear-gradient(135deg, #10b981, #0ea5e9)", border: "none", borderRadius: 10, padding: "12px", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                Me Cadastrar como Voluntário
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
