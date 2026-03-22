import { useState } from "react";
import DetalheOcorrencia from "./DetalheOcorrencia";
import FormNovoEvento from "./FormNovoEvento";
import Tag from "../../components/Tag";
import { mockEvents } from "../../data/events";
import { severityColor, severityLabel, statusColor } from "../../constants/theme";

export default function Ocorrencias({ perfil }) {
  const [sel, setSel] = useState(null);
  const [showForm, setShowForm] = useState(false);

  if (sel) return <DetalheOcorrencia evento={sel} perfil={perfil} onVoltar={() => setSel(null)} />;

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 10, color: perfil === "defesa" ? "#ff3b3b" : "#0ea5e9", letterSpacing: 4, fontFamily: "monospace", marginBottom: 4 }}>MÓDULO</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#e2e8f0", fontFamily: "'Courier New', monospace", margin: 0 }}>Ocorrências</h1>
        </div>
        {perfil === "defesa" && (
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              background: showForm ? "#ef444430" : "linear-gradient(135deg, #ef4444, #c0392b)",
              border: "none", borderRadius: 10, padding: "10px 20px",
              color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer",
            }}
          >
            {showForm ? "✕ Fechar" : "+ Nova Ocorrência"}
          </button>
        )}
      </div>

      {showForm && <FormNovoEvento onFechar={() => setShowForm(false)} />}

      {/* Mini-mapa SVG */}
      <div style={{ background: "#0a1628", border: "1px solid #0f2040", borderRadius: 14, overflow: "hidden", marginBottom: 20 }}>
        <div style={{ padding: "12px 18px", borderBottom: "1px solid #0f2040", display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 11, color: "#475569", letterSpacing: 2, textTransform: "uppercase" }}>Mapa — Taubaté, SP</span>
          <span style={{ fontSize: 10, color: "#0ea5e9" }}>23°01′S 45°33′O</span>
        </div>
        <div style={{ height: 200, background: "#050e1a", position: "relative", overflow: "hidden" }}>
          <svg width="100%" height="100%" viewBox="0 0 700 200" style={{ position: "absolute", inset: 0 }}>
            <line x1="0" y1="66" x2="700" y2="66" stroke="#0f2040" strokeWidth="1.5"/>
            <line x1="0" y1="132" x2="700" y2="132" stroke="#0f2040" strokeWidth="1.5"/>
            <line x1="120" y1="0" x2="120" y2="200" stroke="#0f2040" strokeWidth="1.5"/>
            <line x1="280" y1="0" x2="280" y2="200" stroke="#0f2040" strokeWidth="1.5"/>
            <line x1="430" y1="0" x2="430" y2="200" stroke="#0f2040" strokeWidth="1"/>
            <line x1="580" y1="0" x2="580" y2="200" stroke="#0f2040" strokeWidth="1"/>
            <path d="M0,145 Q80,130 150,145 Q220,158 300,138 Q380,118 450,132 Q530,148 700,128" stroke="#0ea5e930" strokeWidth="7" fill="none"/>
            <text x="20" y="52" fill="#1e3a5f" fontSize="9" fontFamily="monospace">ESTORIL</text>
            <text x="160" y="44" fill="#1e3a5f" fontSize="9" fontFamily="monospace">CENTRO</text>
            <text x="460" y="52" fill="#1e3a5f" fontSize="9" fontFamily="monospace">JD. NAÇÕES</text>
            <text x="135" y="105" fill="#1e3a5f" fontSize="9" fontFamily="monospace">M. CRUZEIRO</text>
            <text x="55" y="158" fill="#0ea5e940" fontSize="8" fontFamily="monospace">Rio Una</text>
          </svg>
          {[
            { left: "16%", top: "35%", cor: "#ef4444", label: "Alagamento Estoril", anim: "1.5s" },
            { left: "38%", top: "20%", cor: "#f97316", label: "Desliz. Cruzeiro", anim: "2s" },
            { left: "65%", top: "48%", cor: "#eab308", label: "Inundação Jd. Nações", anim: "2.5s" },
          ].map((p, i) => (
            <div key={i} style={{ position: "absolute", left: p.left, top: p.top, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: 14, height: 14, borderRadius: "50%", background: p.cor, boxShadow: `0 0 12px ${p.cor}`, animation: `pulse ${p.anim} infinite` }} />
              <div style={{ fontSize: 8, color: p.cor, marginTop: 3, background: "#0a1628dd", padding: "1px 5px", borderRadius: 3, whiteSpace: "nowrap", border: `1px solid ${p.cor}30` }}>{p.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Lista de eventos */}
      <div style={{ display: "grid", gap: 12 }}>
        {mockEvents.map(ev => (
          <div
            key={ev.id}
            onClick={() => setSel(ev)}
            style={{
              background: "#0a1628", border: "1px solid #0f2040", borderRadius: 14,
              padding: "18px 22px", cursor: "pointer",
              display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 16, alignItems: "center",
              transition: "border-color 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = `${severityColor[ev.severity]}40`}
            onMouseLeave={e => e.currentTarget.style.borderColor = "#0f2040"}
          >
            <div style={{
              width: 44, height: 44, borderRadius: 10,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
              background: `${severityColor[ev.severity]}15`,
              border: `1px solid ${severityColor[ev.severity]}30`,
              color: severityColor[ev.severity], fontWeight: 900, fontFamily: "monospace",
            }}>S{ev.severity}</div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0", margin: 0 }}>{ev.title}</h3>
                <Tag color={statusColor[ev.status]}>{ev.status}</Tag>
              </div>
              <div style={{ fontSize: 12, color: "#475569" }}>{ev.desc.slice(0, 90)}...</div>
              <div style={{ fontSize: 11, color: "#334155", marginTop: 4 }}>📅 {ev.date} · 📍 {ev.lat.toFixed(3)}, {ev.lng.toFixed(3)}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: severityColor[ev.severity], fontFamily: "monospace" }}>{severityLabel[ev.severity]}</div>
              <div style={{ fontSize: 11, color: "#334155", marginTop: 2 }}>Ver detalhes ›</div>
            </div>
          </div>
        ))}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(1.4)}}`}</style>
    </div>
  );
}
