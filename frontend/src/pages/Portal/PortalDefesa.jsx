import Tag from "../../components/Tag";
import { mockVolunteers } from "../../data/volunteers";
import { pct } from "../../utils/geo";

const CARD = {
  background: "var(--bg-surface)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-lg)",
  padding: 22,
};

export default function PortalDefesa() {
  return (
    <div className="dot-bg" style={{ padding: "28px 32px" }}>
      {/* ── Header ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{
          fontFamily: "var(--font-mono)", fontSize: 10,
          color: "var(--red)", letterSpacing: "0.22em",
          textTransform: "uppercase", marginBottom: 5,
        }}>
          Módulo
        </div>
        <h1 style={{
          fontFamily: "var(--font-display)",
          fontSize: 30, fontWeight: 800,
          color: "var(--text-primary)", margin: 0,
          letterSpacing: "0.02em",
        }}>
          Portal Doador + Voluntário
        </h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

        {/* ── Voluntários cadastrados ── */}
        <div style={CARD}>
          <div style={{
            fontFamily: "var(--font-mono)", fontSize: 10,
            color: "var(--text-muted)", letterSpacing: "0.18em",
            textTransform: "uppercase", marginBottom: 16,
          }}>
            Voluntários Cadastrados
          </div>

          {mockVolunteers.map(v => (
            <div key={v.id} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "10px 0", borderBottom: "1px solid var(--border)",
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                background: v.available ? "var(--success)" : "var(--text-muted)",
                boxShadow: v.available ? "0 0 5px var(--success)" : "none",
              }} />
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 13, fontWeight: 600,
                  color: "var(--text-primary)", marginBottom: 2,
                }}>
                  {v.name}
                </div>
                <div style={{
                  fontSize: 11, color: "var(--text-muted)",
                  fontFamily: "var(--font-mono)",
                }}>
                  {v.specialty} · {v.ref}
                </div>
              </div>
              <Tag color={v.available ? "#22c55e" : "#456282"}>
                {v.available ? "Disponível" : "Inativo"}
              </Tag>
            </div>
          ))}
        </div>

        {/* ── Match Especialidades × Demandas ── */}
        <div style={CARD}>
          <div style={{
            fontFamily: "var(--font-mono)", fontSize: 10,
            color: "var(--text-muted)", letterSpacing: "0.18em",
            textTransform: "uppercase", marginBottom: 16,
          }}>
            Match Especialidades × Demandas
          </div>

          {[
            { spec: "Médicos/Enfermeiros", precisam: 6, tem: 2, cor: "var(--danger)"  },
            { spec: "Engenheiros",         precisam: 3, tem: 1, cor: "#f97316"        },
            { spec: "Psicólogos",          precisam: 4, tem: 0, cor: "#8b5cf6"        },
            { spec: "Motoristas",          precisam: 5, tem: 1, cor: "var(--blue-info)" },
            { spec: "Cozinheiros",         precisam: 8, tem: 0, cor: "var(--warning)" },
            { spec: "Logística",           precisam: 6, tem: 3, cor: "var(--success)" },
          ].map(s => (
            <div key={s.spec} style={{ marginBottom: 14 }}>
              <div style={{
                display: "flex", justifyContent: "space-between",
                fontSize: 12, marginBottom: 5,
              }}>
                <span style={{ color: "var(--text-secondary)" }}>{s.spec}</span>
                <span style={{
                  color: s.cor, fontWeight: 700,
                  fontFamily: "var(--font-mono)",
                }}>
                  {s.tem}/{s.precisam}
                </span>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: "var(--bg-elevated)" }}>
                <div style={{
                  height: 4, borderRadius: 2,
                  width: `${pct(s.tem, s.precisam)}%`,
                  background: s.cor, transition: "width 0.8s",
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
