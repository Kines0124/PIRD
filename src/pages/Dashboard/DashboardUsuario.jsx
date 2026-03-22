import KpiCard from "../../components/KpiCard";
import Tag from "../../components/Tag";
import { mockEvents } from "../../data/events";
import { mockDemands } from "../../data/demands";
import { mockPoints } from "../../data/points";

export default function DashboardUsuario({ onNavigate }) {
  const ea = mockEvents.length;
  const du = mockDemands.filter(d => d.priority >= 4).length;

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, color: "#0ea5e9", letterSpacing: 4, fontFamily: "monospace", marginBottom: 4 }}>TAUBATÉ · SP</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#e2e8f0", fontFamily: "'Courier New', monospace", margin: 0 }}>Como posso ajudar?</h1>
      </div>

      <div style={{ display: "flex", gap: 14, marginBottom: 24 }}>
        <KpiCard label="Eventos Ativos" valor={ea} sub="E.A" color="#ef4444" icon="🚨" />
        <KpiCard label="Demandas Urgentes" valor={du} sub="D.U" color="#f97316" icon="⚠️" />
      </div>

      <div style={{ background: "#0f1f35", border: "1px solid #ef444430", borderRadius: 14, padding: "16px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ fontSize: 22 }}>⚠️</div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#ef4444" }}>ZONA DE RISCO — NÃO SE APROXIME</div>
          <div style={{ fontSize: 12, color: "#94a3b8" }}>Estoril e Campos Elíseos — aguarde orientação da <strong style={{ color: "#ef4444" }}>Defesa Civil: 199</strong></div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 20 }}>
        <div style={{ background: "#0a1628", border: "1px solid #0f2040", borderRadius: 14, padding: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: "#475569", letterSpacing: 2, textTransform: "uppercase" }}>O que mais precisa agora</div>
            <button onClick={() => onNavigate("portal")} style={{ background: "none", border: "none", color: "#0ea5e9", fontSize: 11, cursor: "pointer" }}>Quero ajudar ›</button>
          </div>
          {mockDemands.filter(d => d.priority >= 4).map(d => (
            <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #0f2040" }}>
              <div style={{
                width: 7, height: 7, borderRadius: "50%",
                background: d.priority >= 5 ? "#ef4444" : "#f97316",
                boxShadow: `0 0 5px ${d.priority >= 5 ? "#ef4444" : "#f97316"}`,
                flexShrink: 0,
              }} />
              <span style={{ fontSize: 13, color: "#cbd5e1", flex: 1 }}>{d.item}</span>
              <Tag color={d.priority >= 5 ? "#ef4444" : "#f97316"}>{d.priority >= 5 ? "URGENTE" : "ALTO"}</Tag>
            </div>
          ))}
        </div>

        <div style={{ background: "#0a1628", border: "1px solid #0f2040", borderRadius: 14, padding: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: "#475569", letterSpacing: 2, textTransform: "uppercase" }}>Pontos de Coleta</div>
            <button onClick={() => onNavigate("pontos")} style={{ background: "none", border: "none", color: "#0ea5e9", fontSize: 11, cursor: "pointer" }}>Ver todos ›</button>
          </div>
          {mockPoints.slice(0, 4).map(p => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #0f2040" }}>
              <div style={{
                width: 7, height: 7,
                borderRadius: p.type === "Fixo" ? "50%" : 2,
                background: p.type === "Fixo" ? "#0ea5e9" : "#8b5cf6",
                flexShrink: 0,
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: "#cbd5e1", fontWeight: 600 }}>{p.name}</div>
                <div style={{ fontSize: 11, color: "#475569" }}>{p.contact}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
