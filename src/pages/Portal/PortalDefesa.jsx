import Tag from "../../components/Tag";
import { mockVolunteers } from "../../data/volunteers";
import { pct } from "../../utils/geo";

export default function PortalDefesa() {
  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, color: "#ff3b3b", letterSpacing: 4, fontFamily: "monospace", marginBottom: 4 }}>MÓDULO</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#e2e8f0", fontFamily: "'Courier New', monospace", margin: 0 }}>Portal Doador + Voluntário</h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Voluntários cadastrados */}
        <div style={{ background: "#0a1628", border: "1px solid #0f2040", borderRadius: 14, padding: 22 }}>
          <div style={{ fontSize: 11, color: "#475569", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>Voluntários Cadastrados</div>
          {mockVolunteers.map(v => (
            <div key={v.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #0f2040" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: v.available ? "#10b981" : "#475569", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>{v.name}</div>
                <div style={{ fontSize: 11, color: "#475569" }}>{v.specialty} · {v.ref}</div>
              </div>
              <Tag color={v.available ? "#10b981" : "#475569"}>{v.available ? "Disponível" : "Inativo"}</Tag>
            </div>
          ))}
        </div>

        {/* Match Especialidades x Demandas */}
        <div style={{ background: "#0a1628", border: "1px solid #0f2040", borderRadius: 14, padding: 22 }}>
          <div style={{ fontSize: 11, color: "#475569", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>Match Especialidades × Demandas</div>
          {[
            { spec: "Médicos/Enfermeiros", precisam: 6, tem: 2, cor: "#ef4444" },
            { spec: "Engenheiros", precisam: 3, tem: 1, cor: "#f97316" },
            { spec: "Psicólogos", precisam: 4, tem: 0, cor: "#8b5cf6" },
            { spec: "Motoristas", precisam: 5, tem: 1, cor: "#0ea5e9" },
            { spec: "Cozinheiros", precisam: 8, tem: 0, cor: "#eab308" },
            { spec: "Logística", precisam: 6, tem: 3, cor: "#10b981" },
          ].map(s => (
            <div key={s.spec} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: "#94a3b8" }}>{s.spec}</span>
                <span style={{ color: s.cor, fontWeight: 700 }}>{s.tem}/{s.precisam}</span>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: "#1e293b" }}>
                <div style={{ height: 4, borderRadius: 2, width: `${pct(s.tem, s.precisam)}%`, background: s.cor }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
