import { useNavigate } from "react-router-dom";
import KpiCard from "../../components/KpiCard";
import Tag from "../../components/Tag";
import { mockEvents } from "../../data/events";
import { mockDemands } from "../../data/demands";
import { mockPoints } from "../../data/points";

const CARD = {
  background: "var(--bg-surface)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-lg)",
  padding: 22,
};

export default function DashboardUsuario() {
  const navigate = useNavigate();
  const ea = mockEvents.length;
  const du = mockDemands.filter(d => d.priority >= 4).length;

  return (
    <div className="dot-bg" style={{ padding: "28px 32px" }}>
      {/* ── Header ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{
          fontFamily: "var(--font-mono)", fontSize: 10,
          color: "var(--blue-info)", letterSpacing: "0.22em",
          textTransform: "uppercase", marginBottom: 5,
        }}>
          Taubaté · SP
        </div>
        <h1 style={{
          fontFamily: "var(--font-display)",
          fontSize: 30, fontWeight: 800,
          color: "var(--text-primary)", margin: 0,
          letterSpacing: "0.02em",
        }}>
          Como posso ajudar?
        </h1>
      </div>

      {/* ── KPIs ── */}
      <div style={{ display: "flex", gap: 14, marginBottom: 20 }}>
        <KpiCard label="Eventos Ativos"    valor={ea} sub="E.A" color="var(--danger)"  icon="🚨" />
        <KpiCard label="Demandas Urgentes" valor={du} sub="D.U" color="#f97316"        icon="⚠️" />
      </div>

      {/* ── Alerta ── */}
      <div style={{
        background: "rgba(222,57,63,0.07)",
        border: "1px solid rgba(222,57,63,0.24)",
        borderRadius: "var(--radius-lg)",
        padding: "14px 20px",
        marginBottom: 20,
        display: "flex", alignItems: "flex-start", gap: 14,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 9, flexShrink: 0,
          background: "rgba(222,57,63,0.12)",
          border: "1px solid rgba(222,57,63,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18,
        }}>
          ⚠️
        </div>
        <div>
          <div style={{
            fontFamily: "var(--font-mono)", fontSize: 11,
            fontWeight: 600, color: "var(--red)",
            letterSpacing: "0.06em", marginBottom: 4,
          }}>
            ZONA DE RISCO — NÃO SE APROXIME
          </div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>
            Estoril e Campos Elíseos — aguarde orientação da{" "}
            <strong style={{ color: "var(--red)" }}>Defesa Civil: 199</strong>
          </div>
        </div>
      </div>

      {/* ── Main grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 20 }}>

        {/* O que mais precisa */}
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
              O que mais precisa agora
            </span>
            <button
              onClick={() => navigate("/app/portal")}
              style={{
                background: "none", border: "none",
                color: "var(--blue-info)", fontSize: 11,
                cursor: "pointer", fontFamily: "var(--font-mono)",
                transition: "opacity 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = "0.7"; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
            >
              Quero ajudar ›
            </button>
          </div>

          {mockDemands.filter(d => d.priority >= 4).map(d => (
            <div key={d.id} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "10px 0", borderBottom: "1px solid var(--border)",
            }}>
              <div style={{
                width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
                background: d.priority >= 5 ? "var(--danger)" : "#f97316",
                boxShadow: `0 0 5px ${d.priority >= 5 ? "var(--danger)" : "#f97316"}`,
              }} />
              <span style={{
                fontSize: 13, color: "var(--text-primary)", flex: 1,
              }}>
                {d.item}
              </span>
              <Tag color={d.priority >= 5 ? "#de393f" : "#f97316"}>
                {d.priority >= 5 ? "URGENTE" : "ALTO"}
              </Tag>
            </div>
          ))}
        </div>

        {/* Pontos de Coleta */}
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
              Pontos de Coleta
            </span>
            <button
              onClick={() => navigate("/app/pontos")}
              style={{
                background: "none", border: "none",
                color: "var(--blue-info)", fontSize: 11,
                cursor: "pointer", fontFamily: "var(--font-mono)",
                transition: "opacity 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = "0.7"; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
            >
              Ver todos ›
            </button>
          </div>

          {mockPoints.slice(0, 4).map(p => (
            <div key={p.id} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "10px 0", borderBottom: "1px solid var(--border)",
            }}>
              <div style={{
                width: 8, height: 8, flexShrink: 0,
                borderRadius: p.type === "Fixo" ? "50%" : 2,
                background: p.type === "Fixo" ? "var(--blue-info)" : "#8b5cf6",
              }} />
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 13, color: "var(--text-primary)",
                  fontWeight: 600, marginBottom: 2,
                }}>
                  {p.name}
                </div>
                <div style={{
                  fontSize: 11, color: "var(--text-muted)",
                  fontFamily: "var(--font-mono)",
                }}>
                  {p.contact}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
