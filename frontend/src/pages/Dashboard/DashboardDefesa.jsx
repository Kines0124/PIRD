import { useNavigate } from "react-router-dom";
import KpiCard from "../../components/KpiCard";
import Tag from "../../components/Tag";
import { mockEvents } from "../../data/events";
import { mockDemands } from "../../data/demands";
import { mockVolunteers } from "../../data/volunteers";
import { categoryColors, severityColor, severityLabel, statusColor } from "../../constants/theme";
import { pct } from "../../utils/geo";

const CARD = {
  background: "var(--bg-surface)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-lg)",
  padding: 22,
};

export default function DashboardDefesa() {
  const navigate = useNavigate();
  const ea = mockEvents.length;
  const du = mockDemands.filter(d => d.priority >= 4).length;
  const va = mockVolunteers.filter(v => v.available).length;
  const totalNeeded   = mockDemands.reduce((a, b) => a + b.needed, 0);
  const totalSupplied = mockDemands.reduce((a, b) => a + b.supplied, 0);
  const atendGeral    = pct(totalSupplied, totalNeeded);

  return (
    <div className="dot-bg" style={{ padding: "28px 32px" }}>
      {/* ── Header ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{
          fontFamily: "var(--font-mono)", fontSize: 10,
          color: "var(--red)", letterSpacing: "0.22em",
          textTransform: "uppercase", marginBottom: 5,
        }}>
          Visão Geral
        </div>
        <h1 style={{
          fontFamily: "var(--font-display)",
          fontSize: 30, fontWeight: 800,
          color: "var(--text-primary)", margin: 0,
          letterSpacing: "0.02em",
        }}>
          Dashboard de Comando
        </h1>
      </div>

      {/* ── KPIs ── */}
      <div style={{ display: "flex", gap: 14, marginBottom: 24 }}>
        <KpiCard label="Eventos Ativos"     valor={ea}              sub="E.A"                          color="var(--danger)"  icon="🚨" />
        <KpiCard label="Demandas Urgentes"  valor={du}              sub="D.U"                          color="#f97316"        icon="⚠️" />
        <KpiCard label="Voluntários Ativos" valor={va}              sub="V.A"                          color="var(--success)" icon="🙋" />
        <KpiCard label="Atendimento Geral"  valor={`${atendGeral}%`} sub={`${totalSupplied.toLocaleString()} itens`} color="var(--blue-info)" icon="📦" />
      </div>

      {/* ── Main grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20, marginBottom: 20 }}>

        {/* Ocorrências */}
        <div style={CARD}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{
              fontFamily: "var(--font-mono)", fontSize: 10,
              color: "var(--text-muted)", letterSpacing: "0.18em", textTransform: "uppercase",
            }}>
              Ocorrências Ativas
            </span>
            <button
              onClick={() => navigate("/app/ocorrencias")}
              style={{
                background: "none", border: "none",
                color: "var(--text-muted)", fontSize: 11,
                cursor: "pointer", fontFamily: "var(--font-mono)",
                transition: "color 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.color = "var(--text-primary)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "var(--text-muted)"; }}
            >
              Ver todas ›
            </button>
          </div>

          {mockEvents.map(ev => (
            <div key={ev.id} style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "12px 0", borderBottom: "1px solid var(--border)",
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: `${severityColor[ev.severity]}14`,
                border: `1px solid ${severityColor[ev.severity]}28`,
                color: severityColor[ev.severity],
                fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 12,
              }}>
                S{ev.severity}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 13, fontWeight: 600,
                  color: "var(--text-primary)", marginBottom: 4,
                }}>
                  {ev.title}
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <Tag color={statusColor[ev.status]}>{ev.status}</Tag>
                  <span style={{
                    fontSize: 10, color: "var(--text-muted)",
                    fontFamily: "var(--font-mono)",
                  }}>
                    {ev.date}
                  </span>
                </div>
              </div>
              <div style={{
                fontSize: 11, color: severityColor[ev.severity],
                fontWeight: 700, fontFamily: "var(--font-mono)",
                letterSpacing: "0.04em",
              }}>
                {severityLabel[ev.severity]}
              </div>
            </div>
          ))}
        </div>

        {/* Atendimento por categoria */}
        <div style={CARD}>
          <div style={{
            fontFamily: "var(--font-mono)", fontSize: 10,
            color: "var(--text-muted)", letterSpacing: "0.18em",
            textTransform: "uppercase", marginBottom: 16,
          }}>
            Atendimento por Categoria
          </div>

          {Object.keys(categoryColors).map(cat => {
            const items    = mockDemands.filter(d => d.category === cat);
            if (!items.length) return null;
            const needed   = items.reduce((a, b) => a + b.needed, 0);
            const supplied = items.reduce((a, b) => a + b.supplied, 0);
            const p        = pct(supplied, needed);
            return (
              <div key={cat} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{cat}</span>
                  <span style={{
                    fontSize: 12, color: categoryColors[cat],
                    fontWeight: 700, fontFamily: "var(--font-mono)",
                  }}>
                    {p}%
                  </span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: "var(--bg-elevated)" }}>
                  <div style={{
                    height: 4, borderRadius: 2,
                    width: `${p}%`,
                    background: categoryColors[cat],
                    transition: "width 0.8s",
                  }} />
                </div>
              </div>
            );
          })}

          <div style={{
            marginTop: 16, padding: "10px 14px",
            background: "rgba(222,57,63,0.08)",
            border: "1px solid rgba(222,57,63,0.25)",
            borderRadius: "var(--radius)",
          }}>
            <div style={{
              fontFamily: "var(--font-mono)", fontSize: 10,
              color: "var(--red)", fontWeight: 600,
              letterSpacing: "0.08em",
            }}>
              ⚠ ALERTA CRÍTICO
            </div>
            <div style={{
              fontSize: 12, color: "var(--text-secondary)", marginTop: 4,
            }}>
              Leite em pó — Jd. Nações: 13% atendido
            </div>
          </div>
        </div>
      </div>

      {/* ── Voluntários ── */}
      <div style={CARD}>
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: 16,
        }}>
          <span style={{
            fontFamily: "var(--font-mono)", fontSize: 10,
            color: "var(--text-muted)", letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}>
            Voluntários — Match de Especialidades
          </span>
          <button
            onClick={() => navigate("/app/portal")}
            style={{
              background: "none", border: "none",
              color: "var(--text-muted)", fontSize: 11,
              cursor: "pointer", fontFamily: "var(--font-mono)",
              transition: "color 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.color = "var(--text-primary)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "var(--text-muted)"; }}
          >
            Ver portal ›
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10 }}>
          {[
            { spec: "Médicos",      precisam: 6, tem: 2, cor: "var(--danger)" },
            { spec: "Enfermeiros",  precisam: 4, tem: 2, cor: "#f97316" },
            { spec: "Engenheiros",  precisam: 3, tem: 1, cor: "var(--warning)" },
            { spec: "Psicólogos",   precisam: 4, tem: 0, cor: "#8b5cf6" },
            { spec: "Motoristas",   precisam: 5, tem: 1, cor: "var(--blue-info)" },
            { spec: "Logística",    precisam: 6, tem: 3, cor: "var(--success)" },
          ].map(s => (
            <div key={s.spec} style={{
              background: "var(--bg-elevated)",
              borderRadius: 10, padding: "12px 10px",
              border: "1px solid var(--border)",
              textAlign: "center",
            }}>
              <div style={{
                fontFamily: "var(--font-display)",
                fontSize: 22, fontWeight: 800,
                color: s.cor,
                lineHeight: 1,
              }}>
                {s.tem}/{s.precisam}
              </div>
              <div style={{
                fontSize: 10, color: "var(--text-muted)",
                marginTop: 5, fontFamily: "var(--font-body)",
              }}>
                {s.spec}
              </div>
              <div style={{ height: 3, borderRadius: 2, background: "var(--bg-base)", marginTop: 8 }}>
                <div style={{
                  height: 3, borderRadius: 2,
                  width: `${pct(s.tem, s.precisam)}%`,
                  background: s.cor,
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
