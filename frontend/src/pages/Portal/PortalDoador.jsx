import { useState } from "react";
import Tag from "../../components/Tag";
import { mockEvents } from "../../data/events";
import { mockDemands } from "../../data/demands";
import { mockPoints } from "../../data/points";
import { statusColor } from "../../constants/theme";
import { pct } from "../../utils/geo";

const CARD = {
  background: "var(--bg-surface)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-lg)",
  padding: 22,
};

const INP = {
  background: "var(--bg-elevated)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius)",
  padding: "10px 14px",
  color: "var(--text-primary)",
  fontSize: 13,
  outline: "none",
  width: "100%",
  fontFamily: "var(--font-body)",
  boxSizing: "border-box",
};

const DOACOES = ["💧 Água", "🍱 Comida", "👕 Roupas", "🔧 Mão de Obra"];

export default function PortalDoador() {
  const [tipo,  setTipo]  = useState(null);
  const [match, setMatch] = useState(null);

  function fazerMatch(t) {
    setTipo(t);
    const catMap = { "💧 Água": "Alimento", "🍱 Comida": "Alimento", "👕 Roupas": "Higiene", "🔧 Mão de Obra": "RH" };
    const cat    = catMap[t];
    let melhor = null, maxPrio = 0;
    mockDemands.forEach(d => {
      if (d.category === cat && d.priority > maxPrio && pct(d.supplied, d.needed) < 80) {
        maxPrio = d.priority;
        melhor  = mockEvents.find(e => e.id === d.event);
      }
    });
    setMatch(melhor || mockEvents[0]);
  }

  return (
    <div className="dot-bg" style={{ padding: "28px 32px" }}>
      {/* ── Header ── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{
          fontFamily: "var(--font-mono)", fontSize: 10,
          color: "var(--blue-info)", letterSpacing: "0.22em",
          textTransform: "uppercase", marginBottom: 5,
        }}>
          Portal Público
        </div>
        <h1 style={{
          fontFamily: "var(--font-display)",
          fontSize: 30, fontWeight: 800,
          color: "var(--text-primary)", margin: 0,
          letterSpacing: "0.02em",
        }}>
          Quero Ajudar
        </h1>
      </div>

      {/* ── Alerta de zona de risco ── */}
      <div className="alert-strip-critical hazard-stripe" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{ fontSize: 20, flexShrink: 0 }}>⚠️</div>
          <div>
            <div style={{
              fontFamily: "var(--font-mono)", fontSize: 11,
              fontWeight: 600, color: "var(--red)",
              letterSpacing: "0.08em", marginBottom: 4,
            }}>
              ZONA DE RISCO — NÃO SE APROXIME
            </div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>
              Estoril e Campos Elíseos — aguarde orientação da{" "}
              <strong style={{ color: "var(--red)" }}>Defesa Civil: 199</strong>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

        {/* ── Doe Itens ── */}
        <div style={CARD}>
          <div style={{
            fontFamily: "var(--font-display)",
            fontSize: 16, fontWeight: 700,
            color: "var(--text-primary)", marginBottom: 16,
            letterSpacing: "0.03em",
          }}>
            Quero Doar Itens
          </div>

          {!match ? (
            <div>
              <div style={{
                fontSize: 12, color: "var(--text-muted)", marginBottom: 14,
              }}>
                Selecione o que você tem para oferecer:
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {DOACOES.map(op => (
                  <button
                    key={op}
                    onClick={() => fazerMatch(op)}
                    style={{
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border)",
                      borderRadius: 12, padding: "16px 10px",
                      cursor: "pointer", textAlign: "center",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = "rgba(222,57,63,0.4)";
                      e.currentTarget.style.background = "var(--bg-hover)";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = "var(--border)";
                      e.currentTarget.style.background = "var(--bg-elevated)";
                    }}
                  >
                    <div style={{ fontSize: 26, marginBottom: 6 }}>{op.split(" ")[0]}</div>
                    <div style={{
                      fontSize: 12, fontWeight: 700,
                      color: "var(--text-primary)",
                    }}>
                      {op.split(" ").slice(1).join(" ")}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <button
                onClick={() => { setMatch(null); setTipo(null); }}
                style={{
                  background: "none", border: "none",
                  color: "var(--text-muted)", cursor: "pointer",
                  fontSize: 12, marginBottom: 14, padding: 0,
                  fontFamily: "var(--font-mono)",
                }}
              >
                ← Voltar
              </button>

              <div style={{
                background: "var(--bg-elevated)",
                border: "1px solid rgba(61,155,233,0.3)",
                borderRadius: 12, padding: 16, marginBottom: 14, textAlign: "center",
              }}>
                <div style={{
                  fontFamily: "var(--font-mono)", fontSize: 10,
                  color: "var(--blue-info)", letterSpacing: "0.18em",
                  marginBottom: 6,
                }}>
                  ✦ MELHOR DESTINO
                </div>
                <div style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 17, fontWeight: 700,
                  color: "var(--text-primary)", marginBottom: 6,
                }}>
                  {match.title}
                </div>
                <Tag color={statusColor[match.status]}>{match.status}</Tag>
              </div>

              <div style={{
                fontFamily: "var(--font-mono)", fontSize: 10,
                color: "var(--text-muted)", letterSpacing: "0.18em",
                textTransform: "uppercase", marginBottom: 8,
              }}>
                Pontos de Coleta
              </div>

              {mockPoints.filter(p => p.events.includes(match.id)).map(p => (
                <div key={p.id} style={{
                  padding: "8px 0", borderBottom: "1px solid var(--border)",
                }}>
                  <div style={{
                    fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2,
                  }}>
                    {p.name}
                  </div>
                  <div style={{
                    fontSize: 11, color: "var(--text-muted)",
                    fontFamily: "var(--font-mono)",
                  }}>
                    📍 {p.address} · 📞 {p.contact}
                  </div>
                </div>
              ))}

              <button style={{
                width: "100%", marginTop: 14,
                padding: "12px", borderRadius: "var(--radius)",
                border: "none",
                background: "var(--red)",
                color: "#fff", fontWeight: 700, fontSize: 13,
                cursor: "pointer",
                fontFamily: "var(--font-body)",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--red-hover)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "var(--red)"; }}
              >
                📍 VER ROTA NO MAPA
              </button>
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* ── O que mais precisa ── */}
          <div style={CARD}>
            <div style={{
              fontFamily: "var(--font-display)",
              fontSize: 16, fontWeight: 700,
              color: "var(--text-primary)", marginBottom: 14,
              letterSpacing: "0.03em",
            }}>
              O que mais precisa agora
            </div>
            {mockDemands.filter(d => d.priority >= 4).map(d => (
              <div key={d.id} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "8px 0", borderBottom: "1px solid var(--border)",
              }}>
                <div style={{
                  width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
                  background: d.priority >= 5 ? "var(--danger)" : "#f97316",
                  boxShadow: `0 0 5px ${d.priority >= 5 ? "var(--danger)" : "#f97316"}`,
                }} />
                <span style={{
                  fontSize: 12, color: "var(--text-primary)", flex: 1,
                }}>
                  {d.item}
                </span>
                <Tag color={d.priority >= 5 ? "#de393f" : "#f97316"}>
                  {d.priority >= 5 ? "URGENTE" : "ALTO"}
                </Tag>
              </div>
            ))}
          </div>

          {/* ── Cadastro voluntário ── */}
          <div style={CARD}>
            <div style={{
              fontFamily: "var(--font-display)",
              fontSize: 16, fontWeight: 700,
              color: "var(--text-primary)", marginBottom: 14,
              letterSpacing: "0.03em",
            }}>
              Quero Ser Voluntário
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input
                placeholder="Seu nome completo"
                style={INP}
                onFocus={e => { e.target.style.borderColor = "var(--red)"; e.target.style.boxShadow = "0 0 0 3px var(--red-dim)"; }}
                onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }}
              />
              <select
                style={{ ...INP, cursor: "pointer", appearance: "none" }}
                onFocus={e => { e.target.style.borderColor = "var(--red)"; }}
                onBlur={e => { e.target.style.borderColor = "var(--border)"; }}
              >
                <option>Selecione sua especialidade</option>
                {["Médico/Enfermeiro", "Engenheiro", "Psicólogo", "Motorista", "Logística"].map(e => (
                  <option key={e}>{e}</option>
                ))}
              </select>
              <input
                placeholder="Contato (WhatsApp)"
                style={INP}
                onFocus={e => { e.target.style.borderColor = "var(--red)"; e.target.style.boxShadow = "0 0 0 3px var(--red-dim)"; }}
                onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }}
              />
              <button style={{
                background: "var(--red)",
                border: "none",
                borderRadius: "var(--radius)",
                padding: "12px",
                color: "#fff", fontWeight: 700, fontSize: 13,
                cursor: "pointer",
                fontFamily: "var(--font-body)",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--red-hover)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "var(--red)"; }}
              >
                Me Cadastrar como Voluntário
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
