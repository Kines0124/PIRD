import KpiCard from "../../components/KpiCard";
import Tag from "../../components/Tag";
import { mockEvents } from "../../data/events";
import { mockDemands } from "../../data/demands";
import { mockVolunteers } from "../../data/volunteers";
import { categoryColors, severityColor, severityLabel, statusColor } from "../../constants/theme";
import { pct } from "../../utils/geo";

export default function DashboardDefesa({ onNavigate }) {
  const ea = mockEvents.length;
  const du = mockDemands.filter(d => d.priority >= 4).length;
  const va = mockVolunteers.filter(v => v.available).length;
  const totalNeeded = mockDemands.reduce((a, b) => a + b.needed, 0);
  const totalSupplied = mockDemands.reduce((a, b) => a + b.supplied, 0);
  const atendGeral = pct(totalSupplied, totalNeeded);

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, color: "#ff3b3b", letterSpacing: 4, fontFamily: "monospace", marginBottom: 4 }}>VISÃO GERAL</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#e2e8f0", fontFamily: "'Courier New', monospace", margin: 0 }}>Dashboard de Comando</h1>
      </div>

      <div style={{ display: "flex", gap: 14, marginBottom: 24 }}>
        <KpiCard label="Eventos Ativos" valor={ea} sub="E.A" color="#ef4444" icon="🚨" />
        <KpiCard label="Demandas Urgentes" valor={du} sub="D.U" color="#f97316" icon="⚠️" />
        <KpiCard label="Voluntários Ativos" valor={va} sub="V.A" color="#10b981" icon="🙋" />
        <KpiCard label="Atendimento Geral" valor={`${atendGeral}%`} sub={`${totalSupplied.toLocaleString()} itens`} color="#0ea5e9" icon="📦" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20 }}>
        <div style={{ background: "#0a1628", border: "1px solid #0f2040", borderRadius: 14, padding: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: "#475569", letterSpacing: 2, textTransform: "uppercase" }}>Ocorrências Ativas</div>
            <button onClick={() => onNavigate("ocorrencias")} style={{ background: "none", border: "none", color: "#475569", fontSize: 11, cursor: "pointer" }}>Ver todas ›</button>
          </div>
          {mockEvents.map(ev => (
            <div key={ev.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: "1px solid #0f2040" }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14,
                background: `${severityColor[ev.severity]}15`,
                border: `1px solid ${severityColor[ev.severity]}30`,
                color: severityColor[ev.severity],
                fontWeight: 900, fontFamily: "monospace",
              }}>S{ev.severity}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#cbd5e1", marginBottom: 3 }}>{ev.title}</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Tag color={statusColor[ev.status]}>{ev.status}</Tag>
                  <span style={{ fontSize: 11, color: "#475569" }}>{ev.date}</span>
                </div>
              </div>
              <div style={{ fontSize: 11, color: severityColor[ev.severity], fontWeight: 700 }}>{severityLabel[ev.severity]}</div>
            </div>
          ))}
        </div>

        <div style={{ background: "#0a1628", border: "1px solid #0f2040", borderRadius: 14, padding: 22 }}>
          <div style={{ fontSize: 11, color: "#475569", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>Atendimento por Categoria</div>
          {Object.keys(categoryColors).map(cat => {
            const items = mockDemands.filter(d => d.category === cat);
            if (!items.length) return null;
            const needed = items.reduce((a, b) => a + b.needed, 0);
            const supplied = items.reduce((a, b) => a + b.supplied, 0);
            const p = pct(supplied, needed);
            return (
              <div key={cat} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 12, color: "#94a3b8" }}>{cat}</span>
                  <span style={{ fontSize: 12, color: categoryColors[cat], fontWeight: 700 }}>{p}%</span>
                </div>
                <div style={{ height: 5, borderRadius: 3, background: "#1e293b" }}>
                  <div style={{ height: 5, borderRadius: 3, width: `${p}%`, background: categoryColors[cat], transition: "width 0.8s" }} />
                </div>
              </div>
            );
          })}
          <div style={{ marginTop: 16, padding: 12, background: "#0f1f35", borderRadius: 10, border: "1px solid #ef444430" }}>
            <div style={{ fontSize: 10, color: "#ef4444", fontWeight: 700 }}>⚠ ALERTA CRÍTICO</div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>Leite em pó — Jd. Nações: 13% atendido</div>
          </div>
        </div>
      </div>

      <div style={{ background: "#0a1628", border: "1px solid #0f2040", borderRadius: 14, padding: 22, marginTop: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: "#475569", letterSpacing: 2, textTransform: "uppercase" }}>Voluntários — Match de Especialidades</div>
          <button onClick={() => onNavigate("portal")} style={{ background: "none", border: "none", color: "#475569", fontSize: 11, cursor: "pointer" }}>Ver portal ›</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10 }}>
          {[
            { spec: "Médicos", precisam: 6, tem: 2, cor: "#ef4444" },
            { spec: "Enfermeiros", precisam: 4, tem: 2, cor: "#f97316" },
            { spec: "Engenheiros", precisam: 3, tem: 1, cor: "#eab308" },
            { spec: "Psicólogos", precisam: 4, tem: 0, cor: "#8b5cf6" },
            { spec: "Motoristas", precisam: 5, tem: 1, cor: "#0ea5e9" },
            { spec: "Logística", precisam: 6, tem: 3, cor: "#10b981" },
          ].map(s => (
            <div key={s.spec} style={{
              background: "#050e1a", borderRadius: 10, padding: "12px 10px",
              border: `1px solid ${s.cor}20`, textAlign: "center",
            }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: s.cor, fontFamily: "monospace" }}>{s.tem}/{s.precisam}</div>
              <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 4 }}>{s.spec}</div>
              <div style={{ height: 3, borderRadius: 2, background: "#1e293b", marginTop: 6 }}>
                <div style={{ height: 3, borderRadius: 2, width: `${pct(s.tem, s.precisam)}%`, background: s.cor }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
